/**
 * consolidation-db-snapshot.ts — Capture a versioned, self-contained DB-side
 * snapshot of every row the merge-map touches, BEFORE the first Prod-DB
 * mutation (the Re-Apply).
 *
 * Pairs with `consolidation-pass-*-reference-premerge-snapshot.json` (JSON side,
 * captured before the first JSON edit). Together they form the selbsttragend
 * rollback ground over BOTH JSON and DB.
 *
 * The DB transaction in consolidation-db-sync.ts only protects against
 * mechanical half-state; it does NOT protect against a semantically wrong but
 * cleanly committed adjudication. THIS snapshot is what makes such an
 * adjudication recoverable without git archaeology.
 *
 * Output: a single JSON file at the `dbSnapshot` path declared in the config.
 *
 * Usage:
 *   tsx --env-file=.env.local scripts/consolidation-db-snapshot.ts
 *   tsx --env-file=.env.local scripts/consolidation-db-snapshot.ts --config <path>
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { eq, inArray } from "drizzle-orm";

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

interface MergeEntry {
  axis: "factions" | "locations" | "characters";
  mergee: string;
  keeper: string;
}

interface MergeMap {
  pass: number;
  scope: string;
  merges: MergeEntry[];
}

interface Config {
  pass: string;
  mergeMap: string;
  dbSnapshot: string;
}

const argv = process.argv.slice(2);
const configFlagIdx = argv.indexOf("--config");
const configPath =
  configFlagIdx >= 0 && configFlagIdx + 1 < argv.length
    ? argv[configFlagIdx + 1]
    : DEFAULT_CONFIG_PATH;

async function main() {
  const cfgRaw = await readFile(resolve(process.cwd(), configPath), "utf8");
  const cfg = JSON.parse(cfgRaw) as Config;
  const mergeMapRaw = await readFile(resolve(process.cwd(), cfg.mergeMap), "utf8");
  const mergeMap = JSON.parse(mergeMapRaw) as MergeMap;

  const factionIds = ids(mergeMap, "factions");
  const locationIds = ids(mergeMap, "locations");
  const characterIds = ids(mergeMap, "characters");

  // Fetch ALL involved rows (keepers + mergees) so the snapshot captures both
  // pre-merge sides — a rollback needs both, and a partial snapshot is worse
  // than no snapshot at all.
  const factionRows = factionIds.length
    ? await db.select().from(factions).where(inArray(factions.id, factionIds))
    : [];
  const locationRows = locationIds.length
    ? await db.select().from(locations).where(inArray(locations.id, locationIds))
    : [];
  const characterRows = characterIds.length
    ? await db.select().from(characters).where(inArray(characters.id, characterIds))
    : [];

  // Junction references to ANY of the touched IDs.
  const workFactionRefs = factionIds.length
    ? await db.select().from(workFactions).where(inArray(workFactions.factionId, factionIds))
    : [];
  const workLocationRefs = locationIds.length
    ? await db
        .select()
        .from(workLocations)
        .where(inArray(workLocations.locationId, locationIds))
    : [];
  const workCharacterRefs = characterIds.length
    ? await db
        .select()
        .from(workCharacters)
        .where(inArray(workCharacters.characterId, characterIds))
    : [];

  // Logical FK touches: factions.parent_id and characters.primary_faction_id
  // pointing at any of the touched FACTION IDs (these are non-DB-enforced FKs;
  // we capture them so a rollback knows which rows had which logical ref).
  const parentIdTouches = factionIds.length
    ? await db
        .select({ id: factions.id, parentId: factions.parentId })
        .from(factions)
        .where(inArray(factions.parentId, factionIds))
    : [];
  const primaryFactionIdTouches = factionIds.length
    ? await db
        .select({ id: characters.id, primaryFactionId: characters.primaryFactionId })
        .from(characters)
        .where(inArray(characters.primaryFactionId, factionIds))
    : [];

  const snapshot = {
    $schema: "consolidation-pass-db-snapshot-v1",
    pass: mergeMap.pass,
    scope: mergeMap.scope,
    generatedAt: new Date().toISOString(),
    purpose:
      "Self-contained DB-side snapshot of every row touched by the merge plan, captured BEFORE the first Prod-DB mutation (Re-Apply). Pairs with the reference-premerge-snapshot (JSON side) for full JSON+DB rollback.",
    merges: mergeMap.merges,
    rows: {
      factions: factionRows,
      locations: locationRows,
      characters: characterRows,
    },
    logicalFkTouches: {
      factionsParentIdPointingAtTouchedFactions: parentIdTouches,
      charactersPrimaryFactionIdPointingAtTouchedFactions: primaryFactionIdTouches,
    },
    junctionRefs: {
      workFactions: workFactionRefs,
      workLocations: workLocationRefs,
      workCharacters: workCharacterRefs,
    },
    rollbackProcedure: [
      "1. Use the rows.* arrays above to restore touched DB rows (re-insert deleted mergees with their captured values; revert field-retention column updates on keepers to the values captured here).",
      "2. Use logicalFkTouches to re-assert factions.parent_id and characters.primary_faction_id values that were remapped by stage (ii) of the DB-sync transaction.",
      "3. The junctionRefs arrays document the pre-Re-Apply junction state for touched IDs — they are informational; re-running scripts/run-phase4-apply.sh <config> reconciles junctions deterministically from the reference layer.",
      "4. Pair with sessions/resolver-dossiers/consolidation-pass-1-reference-premerge-snapshot.json to also restore the JSON side.",
    ],
  };

  const outPath = resolve(process.cwd(), cfg.dbSnapshot);
  await writeFile(outPath, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
  process.stdout.write(
    `[consolidation-db-snapshot] wrote ${cfg.dbSnapshot} (factions=${factionRows.length}, locations=${locationRows.length}, characters=${characterRows.length}, junction-refs={f:${workFactionRefs.length}, l:${workLocationRefs.length}, c:${workCharacterRefs.length}}, logical-fk-touches={parent:${parentIdTouches.length}, primary:${primaryFactionIdTouches.length}})\n`,
  );
}

function ids(mergeMap: MergeMap, axis: "factions" | "locations" | "characters"): string[] {
  const collected = new Set<string>();
  for (const m of mergeMap.merges) {
    if (m.axis === axis) {
      collected.add(m.mergee);
      collected.add(m.keeper);
    }
  }
  return Array.from(collected);
}

main().catch((err) => {
  process.stderr.write(`[consolidation-db-snapshot] error: ${err?.stack ?? err}\n`);
  process.exit(1);
});
