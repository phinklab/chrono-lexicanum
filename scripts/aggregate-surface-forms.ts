/**
 * aggregate-surface-forms.ts — stable, wave-parametrized Phase-0 helper for
 * axis-sliced Resolver-Passes (Brief 090; generalized from the per-pass
 * aggregate-surface-forms-NNN.ts clones).
 *
 * Reads the override files for the wave's batches (from the per-pass config's
 * `aggregator.batches`) plus the current resolver seed-data + alias tables,
 * aggregates surface forms per axis (factions / locations / characters) with
 * frequency + example books, resolves each surface form against the current
 * resolver state (direct → alias → unresolved, exactly mirroring
 * `src/lib/resolver/index.ts`), and emits a deterministic markdown report on
 * stdout — the input that gets folded into the Phase-0 dossier.
 *
 * Read-only; no DB, no LLM, no network. Idempotent — re-running on the same
 * inputs (committed config + override files) yields byte-identical output, so a
 * future pass needs no new `-NNN` clone: only the config changes.
 *
 * Usage:
 *   npx tsx scripts/aggregate-surface-forms.ts [--config scripts/resolver-pass.config.json]
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { loadConfig, overrideFileForBatch } from "./resolver-pass-config";

const ROOT = process.cwd();
const SEED = join(ROOT, "scripts", "seed-data");

const config = loadConfig(process.argv);
const BATCHES = config.aggregator.batches;
const CLUSTER_BY_BATCH: Record<string, string> = config.aggregator.clusters ?? {};

type Role = "primary" | "supporting" | "antagonist" | "pov" | "framing" | string;
interface Entity {
  name: string;
  role: Role;
}
interface BookOverride {
  externalBookId: string;
  slug: string;
  overrides: {
    factions?: Entity[];
    locations?: Entity[];
    characters?: Entity[];
    flags?: Array<{ kind: string; field?: string; suggestion?: string; note?: string }>;
  };
}
interface OverrideFile {
  $schema: string;
  batch: string;
  books: BookOverride[];
}
interface RosterBook {
  externalBookId: string;
  slug: string;
  title: string;
  authors: string[];
  releaseYear: number | null;
  format: string;
}
interface RosterCollection {
  contentExternalId: string;
  collectionExternalId: string;
  displayOrder?: number;
  confidence?: number;
  basis?: string;
}

interface Faction { id: string; name: string }
interface Location { id: string; name: string }
interface Character { id: string; name: string }

const overrideFiles: OverrideFile[] = BATCHES.map(
  (batchId) =>
    JSON.parse(
      readFileSync(join(SEED, overrideFileForBatch(batchId)), "utf8"),
    ) as OverrideFile,
);

const rosterRaw = JSON.parse(
  readFileSync(join(SEED, "book-roster.json"), "utf8"),
) as { books: RosterBook[]; collections: RosterCollection[] };

const factions = JSON.parse(
  readFileSync(join(SEED, "factions.json"), "utf8"),
) as Faction[];
const locations = JSON.parse(
  readFileSync(join(SEED, "locations.json"), "utf8"),
) as Location[];
const characters = JSON.parse(
  readFileSync(join(SEED, "characters.json"), "utf8"),
) as Character[];
const factionAliases = JSON.parse(
  readFileSync(join(SEED, "faction-aliases.json"), "utf8"),
) as Record<string, string>;
const locationAliases = JSON.parse(
  readFileSync(join(SEED, "location-aliases.json"), "utf8"),
) as Record<string, string>;
const characterAliases = JSON.parse(
  readFileSync(join(SEED, "character-aliases.json"), "utf8"),
) as Record<string, string>;

const rosterByExtId = new Map<string, RosterBook>(
  rosterRaw.books.map((b) => [b.externalBookId, b]),
);
const constituentsByCollection = new Map<string, string[]>();
for (const edge of rosterRaw.collections) {
  if (!constituentsByCollection.has(edge.collectionExternalId)) {
    constituentsByCollection.set(edge.collectionExternalId, []);
  }
  constituentsByCollection.get(edge.collectionExternalId)!.push(
    edge.contentExternalId,
  );
}

const factionByName = new Map<string, string>(
  factions.map((f) => [f.name, f.id]),
);
const locationByName = new Map<string, string>(
  locations.map((l) => [l.name, l.id]),
);
const characterByName = new Map<string, string>(
  characters.map((c) => [c.name, c.id]),
);

type Status = "direct" | "alias" | "unresolved";
function resolve(
  name: string,
  byName: Map<string, string>,
  aliases: Record<string, string>,
): { status: Status; canonicalId: string | null } {
  if (byName.has(name)) {
    return { status: "direct", canonicalId: byName.get(name)! };
  }
  if (name in aliases) {
    return { status: "alias", canonicalId: aliases[name] };
  }
  return { status: "unresolved", canonicalId: null };
}

interface Agg {
  freq: number;
  books: string[];
  status: Status;
  canonicalId: string | null;
  clusters: Set<string>;
}

function newAggMap() {
  return new Map<string, Agg>();
}

const factionAgg = newAggMap();
const locationAgg = newAggMap();
const characterAgg = newAggMap();

interface BookRow {
  externalBookId: string;
  slug: string;
  title: string;
  format: string;
  author: string;
  year: string;
  batch: string;
  cluster: string;
  flags: string[];
}

const bookRows: BookRow[] = [];

for (const file of overrideFiles) {
  const batch = file.batch;
  const cluster = CLUSTER_BY_BATCH[batch] ?? "?";
  for (const book of file.books) {
    const roster = rosterByExtId.get(book.externalBookId);
    const title = roster?.title ?? "?";
    const format = roster?.format ?? "?";
    const author = (roster?.authors ?? []).join(", ") || "?";
    const year =
      roster?.releaseYear !== null && roster?.releaseYear !== undefined
        ? String(roster.releaseYear)
        : "?";
    const flags: string[] = (book.overrides.flags ?? []).map((f) =>
      typeof f === "string"
        ? f
        : `${f.kind}:${f.field ?? ""}${
            f.suggestion ? "->" + f.suggestion : ""
          }`,
    );
    bookRows.push({
      externalBookId: book.externalBookId,
      slug: book.slug,
      title,
      format,
      author,
      year,
      batch,
      cluster,
      flags,
    });

    const bump = (
      agg: Map<string, Agg>,
      name: string,
      byName: Map<string, string>,
      aliases: Record<string, string>,
    ) => {
      if (!agg.has(name)) {
        const r = resolve(name, byName, aliases);
        agg.set(name, {
          freq: 0,
          books: [],
          status: r.status,
          canonicalId: r.canonicalId,
          clusters: new Set<string>(),
        });
      }
      const slot = agg.get(name)!;
      slot.freq += 1;
      slot.books.push(book.externalBookId);
      slot.clusters.add(cluster);
    };

    for (const e of book.overrides.factions ?? []) {
      bump(factionAgg, e.name, factionByName, factionAliases);
    }
    for (const e of book.overrides.locations ?? []) {
      bump(locationAgg, e.name, locationByName, locationAliases);
    }
    for (const e of book.overrides.characters ?? []) {
      bump(characterAgg, e.name, characterByName, characterAliases);
    }
  }
}

function fmtClusterTags(c: Set<string>): string {
  return Array.from(c)
    .sort()
    .map((x) => `\`${x}\``)
    .join(", ");
}

function renderTable(title: string, agg: Map<string, Agg>): string {
  const rows = Array.from(agg.entries())
    .map(([name, slot]) => ({ name, ...slot }))
    .sort((a, b) => {
      if (b.freq !== a.freq) return b.freq - a.freq;
      return a.name.localeCompare(b.name);
    });
  const lines: string[] = [];
  lines.push(`### ${title} (${rows.length} distinct surface forms, ${rows.reduce((s, r) => s + r.freq, 0)} total occurrences)`);
  lines.push("");
  lines.push(
    "| surface form | freq | beispiel-bücher (max 3) | status | canonical id (if resolved) | cluster-tags |",
  );
  lines.push(
    "| --- | --- | --- | --- | --- | --- |",
  );
  for (const r of rows) {
    const samples = r.books.slice(0, 3).join(", ");
    const canonical = r.canonicalId ?? "—";
    lines.push(
      `| ${r.name} | ${r.freq} | ${samples} | ${r.status} | ${canonical} | ${fmtClusterTags(r.clusters)} |`,
    );
  }
  return lines.join("\n");
}

function renderBookTable(): string {
  const lines: string[] = [];
  lines.push(
    "| externalBookId | slug | title | format | author | year | batch | cluster | flags |",
  );
  lines.push(
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  );
  for (const b of bookRows.sort((a, c) => a.externalBookId.localeCompare(c.externalBookId))) {
    lines.push(
      `| ${b.externalBookId} | \`${b.slug}\` | *${b.title}* | ${b.format} | ${b.author} | ${b.year} | \`${b.batch}\` | \`${b.cluster}\` | ${b.flags.length ? b.flags.map((f) => "`" + f + "`").join("; ") : "—"} |`,
    );
  }
  return lines.join("\n");
}

function renderCrossAxisConflicts(): string {
  const factionSet = new Set(factionAgg.keys());
  const locationSet = new Set(locationAgg.keys());
  const characterSet = new Set(characterAgg.keys());
  const lines: string[] = [];
  lines.push("| surface form | axes |");
  lines.push("| --- | --- |");
  const allNames = new Set([...factionSet, ...locationSet, ...characterSet]);
  let any = false;
  for (const name of Array.from(allNames).sort()) {
    const axes: string[] = [];
    if (factionSet.has(name)) axes.push("faction");
    if (locationSet.has(name)) axes.push("location");
    if (characterSet.has(name)) axes.push("character");
    if (axes.length >= 2) {
      lines.push(`| ${name} | ${axes.join(" + ")} |`);
      any = true;
    }
  }
  if (!any) lines.push("| (none) | — |");
  return lines.join("\n");
}

function renderOmnibusScan(): string {
  const omnibusBooks = bookRows.filter(
    (b) => b.format === "omnibus" || b.format === "anthology",
  );
  const lines: string[] = [];
  lines.push(
    "| externalBookId | title | format | roster collection? | known constituents |",
  );
  lines.push("| --- | --- | --- | --- | --- |");
  for (const b of omnibusBooks) {
    const constituents = constituentsByCollection.get(b.externalBookId) ?? [];
    const cs = constituents.length;
    const present = cs > 0 ? `yes (${cs})` : "no";
    const sample = cs > 0
      ? constituents.slice(0, 6).join(", ") + (cs > 6 ? `, … (${cs} total)` : "")
      : "—";
    lines.push(
      `| ${b.externalBookId} | *${b.title}* | ${b.format} | ${present} | ${sample} |`,
    );
  }
  return lines.join("\n");
}

function renderDataConflicts(): string {
  const rows = bookRows.filter((b) => b.flags.length > 0);
  const lines: string[] = [];
  lines.push("| externalBookId | title | flags |");
  lines.push("| --- | --- | --- |");
  if (rows.length === 0) {
    lines.push("| (none) | — | — |");
  } else {
    for (const b of rows) {
      lines.push(
        `| ${b.externalBookId} | *${b.title}* | ${b.flags.map((f) => "`" + f + "`").join("; ")} |`,
      );
    }
  }
  return lines.join("\n");
}

const out: string[] = [];
out.push(`# Aggregator output — Resolver-Pass ${config.pass} (${config.wave}) Phase 0`);
out.push("");
out.push(`Generated by \`scripts/aggregate-surface-forms.ts --config\` from ${overrideFiles.length} override files (${BATCHES.join(", ")}, ${bookRows.length} books) + \`book-roster.json\` + the current \`factions.json\` / \`locations.json\` / \`characters.json\` + their alias tables.`);
out.push("");
out.push("Resolver-Baseline (Reference rows + aliases, pre-pass):");
out.push(`- factions: ${factions.length} rows, ${Object.keys(factionAliases).length} aliases`);
out.push(`- locations: ${locations.length} rows, ${Object.keys(locationAliases).length} aliases`);
out.push(`- characters: ${characters.length} rows, ${Object.keys(characterAliases).length} aliases`);
out.push("");
out.push(`## Book table (${bookRows.length} entries)`);
out.push("");
out.push(renderBookTable());
out.push("");
out.push("## Surface-form aggregate (sorted: freq desc, name asc)");
out.push("");
out.push(renderTable("Factions", factionAgg));
out.push("");
out.push(renderTable("Locations", locationAgg));
out.push("");
out.push(renderTable("Characters", characterAgg));
out.push("");
out.push("## Cross-axis surface-form conflicts");
out.push("");
out.push(renderCrossAxisConflicts());
out.push("");
out.push("## Omnibus / anthology scan");
out.push("");
out.push(renderOmnibusScan());
out.push("");
out.push("## data_conflict flag scan");
out.push("");
out.push(renderDataConflicts());
out.push("");

process.stdout.write(out.join("\n") + "\n");
