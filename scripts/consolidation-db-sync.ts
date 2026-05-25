/**
 * consolidation-db-sync.ts — DB-side reconciliation for the Consolidation-Pass.
 *
 * The Consolidation-Pass (Brief 098) deduplicates the reference layer in the
 * JSON sources. `seed-resolver-extensions.ts` does NOT fully close the DB
 * against those JSON edits — it is insert-only/skip-existing for the core
 * columns of `locations` / `characters`, and an entry removed from a JSON
 * doesn't disappear from the DB on its own. This script closes the two gaps:
 *
 *   (i)  Field-Retention sync: write the field-retention columns into the
 *        keeper DB-rows (Locations: sector_id / gx / gy / lexicanum_url;
 *        Characters: primary_faction_id / lexicanum_url / notes). `tags` is
 *        not synced here — `updateLocationTags` in the Re-Apply path merges
 *        tags via union and never deletes; verification treats DB-tags as a
 *        superset of JSON-tags (`DB ⊇ JSON`), not exact equality.
 *
 *   (ii) FK-remap + Reference-Prune: for each Faction-merge, rebind
 *        `characters.primary_faction_id` from the mergee to the keeper;
 *        re-verify that no junction / logical FK still points at any mergee
 *        ID; then delete the mergee rows from `factions` / `locations` /
 *        `characters`. All inside a single transaction with in-transaction
 *        verification before the deletes.
 *
 * `factions.parent_id` and `characters.primary_faction_id` are logical
 * (non-DB-enforced) FKs — the schema does NOT carry `references()` on these
 * columns — so the in-transaction verification is the only thing standing
 * between a dangling remap and a corrupted reference layer.
 *
 * Inputs:
 *   - Merge-Map (JSON, machine-readable; the dossier markdown is NOT read here)
 *   - Drizzle DB client (`@/db/client`)
 *
 * Modes:
 *   --plan   (default) — read-only, emits a dry-run plan to stdout AND to the
 *                        path given by `dryRunPlan` in the config (markdown).
 *                        No DB writes whatsoever.
 *   --apply           — execute the transaction. Refuses to run without a
 *                        prior maintainer "go" in the form of `--confirm-go`.
 *
 * Usage:
 *   tsx --env-file=.env.local scripts/consolidation-db-sync.ts --plan
 *   tsx --env-file=.env.local scripts/consolidation-db-sync.ts --apply --confirm-go
 *
 * Both forms accept --config to override the default config path.
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db/client";
import {
  characters,
  factions,
  locations,
  workCharacters,
  workFactions,
  workLocations,
} from "@/db/schema";

const DEFAULT_CONFIG_PATH = "scripts/consolidation-pass.config.json";

interface MergeMapFieldRetention {
  field: string;
  reason: string;
  newValue: unknown;
}

interface MergeEntry {
  axis: "factions" | "locations" | "characters";
  mergee: string;
  keeper: string;
  loreDepth: "mechanical" | "lore-deep";
  evidence: string;
  fieldRetention: {
    policy: string;
    fromMergee: MergeMapFieldRetention[];
  };
  newAlias: {
    surface: string;
    targetId: string;
    addTo: string;
  };
}

interface MergeMap {
  $schema: string;
  pass: number;
  scope: string;
  summary: {
    candidateClusters: number;
    merges: number;
    noMerges: number;
    flagged: number;
  };
  merges: MergeEntry[];
  noMerges: unknown[];
}

interface ConsolidationConfig {
  pass: string;
  mergeMap: string;
  dryRunPlan: string;
}

interface Plan {
  fieldRetentionUpdates: Array<{
    axis: "locations" | "characters" | "factions";
    keeperId: string;
    columns: Array<{ column: string; newValue: unknown; reason: string }>;
  }>;
  fkRemaps: Array<{
    table: "characters" | "factions";
    column: "primary_faction_id" | "parent_id";
    fromId: string;
    toId: string;
  }>;
  deletes: Array<{
    axis: "factions" | "locations" | "characters";
    id: string;
  }>;
}

const argv = process.argv.slice(2);
const mode = argv.includes("--apply") ? "apply" : "plan";
const confirmGo = argv.includes("--confirm-go");
const configFlagIdx = argv.indexOf("--config");
const configPath =
  configFlagIdx >= 0 && configFlagIdx + 1 < argv.length
    ? argv[configFlagIdx + 1]
    : DEFAULT_CONFIG_PATH;

async function main() {
  const cfgRaw = await readFile(resolve(process.cwd(), configPath), "utf8");
  const cfg = JSON.parse(cfgRaw) as ConsolidationConfig;

  const mergeMapPath = resolve(process.cwd(), cfg.mergeMap);
  const mergeMapRaw = await readFile(mergeMapPath, "utf8");
  const mergeMap = JSON.parse(mergeMapRaw) as MergeMap;

  const plan = computePlan(mergeMap);

  if (mode === "plan") {
    const markdown = renderPlanMarkdown(cfg, mergeMap, plan);
    const planOutPath = resolve(process.cwd(), cfg.dryRunPlan);
    await writeFile(planOutPath, markdown, "utf8");
    process.stdout.write(markdown);
    process.stdout.write(`\n[consolidation-db-sync] plan written: ${cfg.dryRunPlan}\n`);
    return;
  }

  // --apply: refuse without explicit --confirm-go (maintainer gate signal)
  if (!confirmGo) {
    process.stderr.write(
      "[consolidation-db-sync] --apply requires --confirm-go (maintainer-gate signal). Refusing.\n",
    );
    process.exit(2);
  }

  await applyPlan(plan);
  process.stdout.write("[consolidation-db-sync] apply: ok\n");
}

function computePlan(mergeMap: MergeMap): Plan {
  const fieldRetentionUpdates: Plan["fieldRetentionUpdates"] = [];
  const fkRemaps: Plan["fkRemaps"] = [];
  const deletes: Plan["deletes"] = [];

  for (const m of mergeMap.merges) {
    // Field-Retention: every fromMergee entry maps to a column update on the keeper.
    const cols: Array<{ column: string; newValue: unknown; reason: string }> = [];
    for (const fr of m.fieldRetention.fromMergee) {
      const column = jsonFieldToDbColumn(m.axis, fr.field);
      cols.push({ column, newValue: fr.newValue, reason: fr.reason });
    }
    if (cols.length > 0) {
      fieldRetentionUpdates.push({
        axis: m.axis,
        keeperId: m.keeper,
        columns: cols,
      });
    }

    // FK-Remap: factions merges need characters.primary_faction_id remapped
    if (m.axis === "factions") {
      fkRemaps.push({
        table: "characters",
        column: "primary_faction_id",
        fromId: m.mergee,
        toId: m.keeper,
      });
      // factions.parent_id is upserted by seedFactions on the Re-Apply, so
      // no explicit remap is required here — but the verifier below still
      // checks it as a logical-FK consistency guard.
    }

    deletes.push({ axis: m.axis, id: m.mergee });
  }

  return { fieldRetentionUpdates, fkRemaps, deletes };
}

function jsonFieldToDbColumn(
  axis: "factions" | "locations" | "characters",
  jsonField: string,
): string {
  // The JSON field name <-> DB column name mapping is small and explicit;
  // there's no hidden auto-derivation in seed-resolver-extensions.ts either.
  if (axis === "factions") {
    if (jsonField === "name") return "name";
    if (jsonField === "parent") return "parent_id";
    if (jsonField === "alignment") return "alignment";
    if (jsonField === "tone") return "tone";
    if (jsonField === "glyph") return "glyph";
  }
  if (axis === "locations") {
    if (jsonField === "name") return "name";
    if (jsonField === "sector") return "sector_id";
    if (jsonField === "gx") return "gx";
    if (jsonField === "gy") return "gy";
    if (jsonField === "lexicanumUrl") return "lexicanum_url";
    if (jsonField === "tags") {
      throw new Error(
        "[consolidation-db-sync] 'tags' is intentionally not synced here — updateLocationTags handles tag unions on the Re-Apply path.",
      );
    }
  }
  if (axis === "characters") {
    if (jsonField === "name") return "name";
    if (jsonField === "primaryFactionId") return "primary_faction_id";
    if (jsonField === "lexicanumUrl") return "lexicanum_url";
    if (jsonField === "notes") return "notes";
  }
  throw new Error(
    `[consolidation-db-sync] no DB-column mapping for ${axis}.${jsonField}`,
  );
}

function renderPlanMarkdown(
  cfg: ConsolidationConfig,
  mergeMap: MergeMap,
  plan: Plan,
): string {
  const lines: string[] = [];
  lines.push(`# Consolidation-Pass ${mergeMap.pass} — DB Dry-Run Plan`);
  lines.push("");
  lines.push(
    `Generated by \`scripts/consolidation-db-sync.ts --plan\` from \`${cfg.mergeMap}\`. **Read-only** — no DB writes performed by this run.`,
  );
  lines.push("");
  lines.push(`Scope: ${mergeMap.scope}`);
  lines.push("");
  lines.push(
    `Summary: ${mergeMap.summary.merges} merges (${mergeMap.summary.candidateClusters} candidate clusters, ${mergeMap.summary.noMerges} no-merges, ${mergeMap.summary.flagged} flagged).`,
  );
  lines.push("");
  lines.push("## Maintainer-Review-Gate Tier Split");
  lines.push("");
  const mechanical = mergeMap.merges.filter((m) => m.loreDepth === "mechanical");
  const loreDeep = mergeMap.merges.filter((m) => m.loreDepth === "lore-deep");
  lines.push(
    `**Mechanically unambiguous (${mechanical.length}):** quick scan tier — phantom-row dedup, surface-form-vs-canonical, identical primaryFactionId/parent.`,
  );
  for (const m of mechanical) {
    lines.push(`  - \`${m.mergee}\` → \`${m.keeper}\` (${m.axis}) — ${m.evidence}`);
  }
  lines.push("");
  lines.push(
    `**Lore-deep / LLM-adjudicated (${loreDeep.length}):** read-carefully tier — title-vs-name, beiname, identity-with-context-overlap.`,
  );
  if (loreDeep.length === 0) {
    lines.push("  - (none in this pass)");
  } else {
    for (const m of loreDeep) {
      lines.push(`  - \`${m.mergee}\` → \`${m.keeper}\` (${m.axis}) — ${m.evidence}`);
    }
  }
  lines.push("");

  lines.push("## Stage (i) Field-Retention column updates on keepers");
  lines.push("");
  if (plan.fieldRetentionUpdates.length === 0) {
    lines.push("- *(no field-retention updates — every keeper's relevant fields were already non-null or matched the mergee)*");
  } else {
    for (const fr of plan.fieldRetentionUpdates) {
      lines.push(`- **${fr.axis}.${fr.keeperId}**`);
      for (const c of fr.columns) {
        lines.push(
          `  - \`${c.column}\` ← ${JSON.stringify(c.newValue)} *(${c.reason})*`,
        );
      }
    }
  }
  lines.push("");
  lines.push("## Stage (ii) FK-Remap (`characters.primary_faction_id`)");
  lines.push("");
  if (plan.fkRemaps.length === 0) {
    lines.push(
      "- *(no FK-remap — no faction merges in this pass; `characters.primary_faction_id` is unaffected)*",
    );
  } else {
    for (const r of plan.fkRemaps) {
      lines.push(
        `- \`UPDATE ${r.table} SET ${r.column} = '${r.toId}' WHERE ${r.column} = '${r.fromId}'\``,
      );
    }
  }
  lines.push("");
  lines.push("## Stage (iii) In-transaction verification (BEFORE delete)");
  lines.push("");
  lines.push(
    "For each mergee ID below, the apply path runs the following SQL and ABORTS the transaction (rollback) if ANY of these returns a non-zero count:",
  );
  lines.push("");
  for (const d of plan.deletes) {
    const idLit = `'${d.id}'`;
    if (d.axis === "factions") {
      lines.push(`- \`SELECT COUNT(*) FROM work_factions WHERE faction_id = ${idLit}\``);
      lines.push(`- \`SELECT COUNT(*) FROM factions WHERE parent_id = ${idLit}\``);
      lines.push(`- \`SELECT COUNT(*) FROM characters WHERE primary_faction_id = ${idLit}\``);
    } else if (d.axis === "locations") {
      lines.push(`- \`SELECT COUNT(*) FROM work_locations WHERE location_id = ${idLit}\``);
    } else {
      lines.push(`- \`SELECT COUNT(*) FROM work_characters WHERE character_id = ${idLit}\``);
    }
  }
  lines.push("");
  lines.push("## Stage (iv) Deletes");
  lines.push("");
  if (plan.deletes.length === 0) {
    lines.push("- *(no deletes — no merges in this pass)*");
  } else {
    for (const d of plan.deletes) {
      const table = d.axis;
      lines.push(`- \`DELETE FROM ${table} WHERE id = '${d.id}'\``);
    }
  }
  lines.push("");
  lines.push("## Atomicity");
  lines.push("");
  lines.push(
    "All four stages run inside **one DB transaction**. If stage (iii) flags any non-zero count for any mergee, the transaction rolls back — no partial delete, no orphaned field-retention update.",
  );
  lines.push("");
  lines.push("## Post-Verify (after commit, outside this script)");
  lines.push("");
  lines.push("After the apply commits, the runbook calls for:");
  lines.push("- Re-running the same Stage-(iii) counts: all must read 0.");
  lines.push("- `SELECT * FROM <table> WHERE id IN (mergees)` must return 0 rows.");
  lines.push("- Each keeper DB row, projected on the field-retention columns, must equal the keeper JSON row.");
  lines.push("- `DB.locations.tags ⊇ JSON.locations.tags` for every touched location keeper (Re-Apply maintains this via `updateLocationTags`; the script never sets `tags`).");
  lines.push("");
  return lines.join("\n");
}

async function applyPlan(plan: Plan) {
  await db.transaction(async (tx) => {
    // Stage (i): Field-Retention updates on keepers.
    for (const fr of plan.fieldRetentionUpdates) {
      if (fr.axis === "characters") {
        const updates: Record<string, unknown> = {};
        for (const c of fr.columns) {
          updates[dbColumnToDrizzleField("characters", c.column)] = c.newValue;
        }
        await tx.update(characters).set(updates).where(eq(characters.id, fr.keeperId));
      } else if (fr.axis === "locations") {
        const updates: Record<string, unknown> = {};
        for (const c of fr.columns) {
          updates[dbColumnToDrizzleField("locations", c.column)] = c.newValue;
        }
        await tx.update(locations).set(updates).where(eq(locations.id, fr.keeperId));
      } else if (fr.axis === "factions") {
        const updates: Record<string, unknown> = {};
        for (const c of fr.columns) {
          updates[dbColumnToDrizzleField("factions", c.column)] = c.newValue;
        }
        await tx.update(factions).set(updates).where(eq(factions.id, fr.keeperId));
      }
    }

    // Stage (ii): FK-Remap — characters.primary_faction_id (factions merges only).
    for (const r of plan.fkRemaps) {
      if (r.table === "characters" && r.column === "primary_faction_id") {
        await tx
          .update(characters)
          .set({ primaryFactionId: r.toId })
          .where(eq(characters.primaryFactionId, r.fromId));
      }
      // factions.parent_id is upserted by seedFactions; if a future pass adds an
      // explicit remap here, extend this branch.
    }

    // Stage (iii): In-transaction verification.
    for (const d of plan.deletes) {
      if (d.axis === "factions") {
        const j = await tx
          .select({ n: sql<number>`count(*)::int` })
          .from(workFactions)
          .where(eq(workFactions.factionId, d.id));
        if ((j[0]?.n ?? 0) > 0) {
          throw new Error(
            `verification failed: work_factions still references mergee '${d.id}' (${j[0]?.n})`,
          );
        }
        const p = await tx
          .select({ n: sql<number>`count(*)::int` })
          .from(factions)
          .where(eq(factions.parentId, d.id));
        if ((p[0]?.n ?? 0) > 0) {
          throw new Error(
            `verification failed: factions.parent_id still references mergee '${d.id}' (${p[0]?.n})`,
          );
        }
        const c = await tx
          .select({ n: sql<number>`count(*)::int` })
          .from(characters)
          .where(eq(characters.primaryFactionId, d.id));
        if ((c[0]?.n ?? 0) > 0) {
          throw new Error(
            `verification failed: characters.primary_faction_id still references mergee '${d.id}' (${c[0]?.n})`,
          );
        }
      } else if (d.axis === "locations") {
        const j = await tx
          .select({ n: sql<number>`count(*)::int` })
          .from(workLocations)
          .where(eq(workLocations.locationId, d.id));
        if ((j[0]?.n ?? 0) > 0) {
          throw new Error(
            `verification failed: work_locations still references mergee '${d.id}' (${j[0]?.n})`,
          );
        }
      } else if (d.axis === "characters") {
        const j = await tx
          .select({ n: sql<number>`count(*)::int` })
          .from(workCharacters)
          .where(eq(workCharacters.characterId, d.id));
        if ((j[0]?.n ?? 0) > 0) {
          throw new Error(
            `verification failed: work_characters still references mergee '${d.id}' (${j[0]?.n})`,
          );
        }
      }
    }

    // Stage (iv): Deletes.
    const factionDeletes = plan.deletes.filter((d) => d.axis === "factions").map((d) => d.id);
    const locationDeletes = plan.deletes.filter((d) => d.axis === "locations").map((d) => d.id);
    const characterDeletes = plan.deletes.filter((d) => d.axis === "characters").map((d) => d.id);
    if (factionDeletes.length > 0) {
      await tx.delete(factions).where(inArray(factions.id, factionDeletes));
    }
    if (locationDeletes.length > 0) {
      await tx.delete(locations).where(inArray(locations.id, locationDeletes));
    }
    if (characterDeletes.length > 0) {
      await tx.delete(characters).where(inArray(characters.id, characterDeletes));
    }
  });
}

function dbColumnToDrizzleField(
  axis: "factions" | "locations" | "characters",
  column: string,
): string {
  if (axis === "factions") {
    if (column === "name") return "name";
    if (column === "parent_id") return "parentId";
    if (column === "alignment") return "alignment";
    if (column === "tone") return "tone";
    if (column === "glyph") return "glyph";
  }
  if (axis === "locations") {
    if (column === "name") return "name";
    if (column === "sector_id") return "sectorId";
    if (column === "gx") return "gx";
    if (column === "gy") return "gy";
    if (column === "lexicanum_url") return "lexicanumUrl";
  }
  if (axis === "characters") {
    if (column === "name") return "name";
    if (column === "primary_faction_id") return "primaryFactionId";
    if (column === "lexicanum_url") return "lexicanumUrl";
    if (column === "notes") return "notes";
  }
  throw new Error(`[consolidation-db-sync] no drizzle-field mapping for ${axis}.${column}`);
}

main().catch((err) => {
  process.stderr.write(`[consolidation-db-sync] error: ${err?.stack ?? err}\n`);
  process.exit(1);
});
