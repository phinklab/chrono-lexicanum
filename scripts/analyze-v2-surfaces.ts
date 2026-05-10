/**
 * Surface-form analysis for a V2 diff (Brief 055 acceptance bullet).
 *
 * Reads a `v2-batch-*.diff.json` (or any V2 diff) and emits two artefacts:
 *
 *   1. Markdown summary on stdout — Top-20 surface forms per junction axis
 *      (factions / locations / characters) with frequency counts, plus a
 *      Direct-Match / Alias-Candidate / Unknown breakdown vs the canonical
 *      seed-data IDs (`scripts/seed-data/*.json`).
 *
 *   2. Sibling JSON file `<input-stem>-surfaces.json` — full frequency
 *      counts (every distinct surface form, not just Top-20) so future
 *      Resolver tooling (Brief 056) can consume the dataset directly.
 *
 * Run:  `npm run analyze:v2-surfaces -- --diff=ingest/.last-run/v2-batch-…diff.json`
 *       `tsx scripts/analyze-v2-surfaces.ts --diff=<path>`
 *
 * Heuristics for the breakdown buckets:
 *   - Direct-Match:    slugify(surface) ∈ {seed.id}  OR  slugify(surface) === slugify(seed.name)
 *   - Alias-Candidate: NOT direct, BUT either (a) slugify(surface) appears
 *                      as a *substring* of any seed name/id, or (b) any
 *                      seed name appears as a substring of the surface form
 *                      (case-insensitive). Crude — a real Resolver in 056
 *                      will use Levenshtein + curated alias tables.
 *   - Unknown:         neither matched.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { slugify } from "../src/lib/slug";

interface CliOpts {
  diffPath: string;
  topN: number;
}

interface SurfaceForm {
  name: string;
  count: number;
}

interface ResolutionBucket {
  directMatch: number;
  aliasCandidate: number;
  unknown: number;
  totalDistinct: number;
}

interface AxisSummary {
  axis: "factions" | "locations" | "characters";
  totalOccurrences: number;
  distinctSurfaces: number;
  topN: SurfaceForm[];
  resolution: ResolutionBucket;
  unknownTopN: SurfaceForm[];
}

interface SeedRecord {
  id: string;
  name: string;
}

function parseArgs(): CliOpts {
  const args = process.argv.slice(2);
  let diffPath: string | undefined;
  let topN = 20;
  for (const a of args) {
    if (a.startsWith("--diff=")) diffPath = a.slice("--diff=".length);
    else if (a.startsWith("--top=")) topN = Number.parseInt(a.slice("--top=".length), 10);
    else if (a === "--help" || a === "-h") {
      console.error("usage: tsx scripts/analyze-v2-surfaces.ts --diff=<path> [--top=20]");
      process.exit(0);
    }
  }
  if (!diffPath) {
    console.error("error: --diff=<path> required");
    console.error("       e.g. --diff=ingest/.last-run/v2-batch-20260509-2200.diff.json");
    process.exit(1);
  }
  if (!Number.isFinite(topN) || topN < 1) {
    console.error(`error: --top must be a positive integer (got ${topN})`);
    process.exit(1);
  }
  return { diffPath, topN };
}

async function loadSeedRecords(file: string): Promise<SeedRecord[]> {
  const raw = await readFile(file, "utf8");
  const parsed = JSON.parse(raw) as Array<{ id: string; name: string }>;
  return parsed.map((r) => ({ id: r.id, name: r.name }));
}

function tally(values: Array<{ name: string }>): Map<string, number> {
  const out = new Map<string, number>();
  for (const v of values) {
    const key = v.name.trim();
    if (key.length === 0) continue;
    out.set(key, (out.get(key) ?? 0) + 1);
  }
  return out;
}

function bucketResolution(
  surfaces: Map<string, number>,
  seed: SeedRecord[],
): ResolutionBucket {
  const seedIds = new Set(seed.map((s) => s.id));
  const seedNameSlugs = new Set(seed.map((s) => slugify(s.name)));
  // Build name+id lookup tables for substring containment checks.
  const seedNameLowers = seed.map((s) => s.name.toLowerCase());
  const seedIdLowers = seed.map((s) => s.id.toLowerCase());

  let directMatch = 0;
  let aliasCandidate = 0;
  let unknown = 0;

  for (const [surface] of surfaces) {
    const surfSlug = slugify(surface);
    const surfLower = surface.toLowerCase();
    if (surfSlug.length === 0) {
      unknown += 1;
      continue;
    }
    if (seedIds.has(surfSlug) || seedNameSlugs.has(surfSlug)) {
      directMatch += 1;
      continue;
    }
    let alias = false;
    for (const n of seedNameLowers) {
      if (n.length < 3) continue;
      if (surfLower.includes(n) || n.includes(surfLower)) {
        alias = true;
        break;
      }
    }
    if (!alias) {
      for (const id of seedIdLowers) {
        if (id.length < 3) continue;
        if (surfSlug.includes(id) || id.includes(surfSlug)) {
          alias = true;
          break;
        }
      }
    }
    if (alias) aliasCandidate += 1;
    else unknown += 1;
  }

  return {
    directMatch,
    aliasCandidate,
    unknown,
    totalDistinct: surfaces.size,
  };
}

function unknownTop(
  surfaces: Map<string, number>,
  seed: SeedRecord[],
  topN: number,
): SurfaceForm[] {
  const seedIds = new Set(seed.map((s) => s.id));
  const seedNameSlugs = new Set(seed.map((s) => slugify(s.name)));
  const seedNameLowers = seed.map((s) => s.name.toLowerCase());
  const seedIdLowers = seed.map((s) => s.id.toLowerCase());
  const unknowns: SurfaceForm[] = [];
  for (const [name, count] of surfaces) {
    const surfSlug = slugify(name);
    if (surfSlug.length === 0) continue;
    if (seedIds.has(surfSlug) || seedNameSlugs.has(surfSlug)) continue;
    const surfLower = name.toLowerCase();
    let alias = false;
    for (const n of seedNameLowers) {
      if (n.length < 3) continue;
      if (surfLower.includes(n) || n.includes(surfLower)) {
        alias = true;
        break;
      }
    }
    if (!alias) {
      for (const id of seedIdLowers) {
        if (id.length < 3) continue;
        if (surfSlug.includes(id) || id.includes(surfSlug)) {
          alias = true;
          break;
        }
      }
    }
    if (!alias) unknowns.push({ name, count });
  }
  unknowns.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return unknowns.slice(0, topN);
}

function topByFreq(surfaces: Map<string, number>, topN: number): SurfaceForm[] {
  return Array.from(surfaces.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, topN);
}

function pct(n: number, d: number): string {
  if (d === 0) return "0%";
  return `${((n / d) * 100).toFixed(1)}%`;
}

interface RoleAnnotated { name: string; role?: string }

interface DiffShape {
  added: Array<{
    slug: string;
    fields?: {
      factions?: { value?: RoleAnnotated[] };
      locations?: { value?: RoleAnnotated[] };
      characters?: { value?: RoleAnnotated[] };
    };
  }>;
}

async function main(): Promise<void> {
  const { diffPath, topN } = parseArgs();

  const diffRaw = await readFile(diffPath, "utf8");
  const diff = JSON.parse(diffRaw) as DiffShape;

  const factions: RoleAnnotated[] = [];
  const locations: RoleAnnotated[] = [];
  const characters: RoleAnnotated[] = [];

  for (const rec of diff.added) {
    const f = rec.fields?.factions?.value ?? [];
    const l = rec.fields?.locations?.value ?? [];
    const c = rec.fields?.characters?.value ?? [];
    factions.push(...f);
    locations.push(...l);
    characters.push(...c);
  }

  const seedFactions = await loadSeedRecords("scripts/seed-data/factions.json");
  const seedLocations = await loadSeedRecords("scripts/seed-data/locations.json");
  const seedCharacters = await loadSeedRecords("scripts/seed-data/persons.json");

  const factionTally = tally(factions);
  const locationTally = tally(locations);
  const characterTally = tally(characters);

  const summary: AxisSummary[] = [
    {
      axis: "factions",
      totalOccurrences: factions.length,
      distinctSurfaces: factionTally.size,
      topN: topByFreq(factionTally, topN),
      resolution: bucketResolution(factionTally, seedFactions),
      unknownTopN: unknownTop(factionTally, seedFactions, topN),
    },
    {
      axis: "locations",
      totalOccurrences: locations.length,
      distinctSurfaces: locationTally.size,
      topN: topByFreq(locationTally, topN),
      resolution: bucketResolution(locationTally, seedLocations),
      unknownTopN: unknownTop(locationTally, seedLocations, topN),
    },
    {
      axis: "characters",
      totalOccurrences: characters.length,
      distinctSurfaces: characterTally.size,
      topN: topByFreq(characterTally, topN),
      resolution: bucketResolution(characterTally, seedCharacters),
      unknownTopN: unknownTop(characterTally, seedCharacters, topN),
    },
  ];

  // Console (markdown) report
  console.log(`# Surface-Form analysis — ${path.basename(diffPath)}\n`);
  console.log(`Books processed: **${diff.added.length}**\n`);
  for (const s of summary) {
    console.log(`## ${s.axis}\n`);
    console.log(
      `Occurrences: **${s.totalOccurrences}** across **${s.distinctSurfaces}** distinct surface forms.\n`,
    );
    console.log(
      `Resolution vs seed-data: ` +
        `**Direct-Match ${s.resolution.directMatch}** (${pct(s.resolution.directMatch, s.resolution.totalDistinct)}), ` +
        `**Alias-Candidate ${s.resolution.aliasCandidate}** (${pct(s.resolution.aliasCandidate, s.resolution.totalDistinct)}), ` +
        `**Unknown ${s.resolution.unknown}** (${pct(s.resolution.unknown, s.resolution.totalDistinct)}).\n`,
    );
    console.log(`### Top-${topN} by frequency\n`);
    console.log(`| # | Surface form | Count |`);
    console.log(`|---|---|---|`);
    s.topN.forEach((row, i) => {
      console.log(`| ${i + 1} | ${row.name} | ${row.count} |`);
    });
    console.log(`\n### Top-${topN} unknown (no Direct-Match, no Alias-Candidate)\n`);
    if (s.unknownTopN.length === 0) {
      console.log(`_(none)_\n`);
    } else {
      console.log(`| # | Surface form | Count |`);
      console.log(`|---|---|---|`);
      s.unknownTopN.forEach((row, i) => {
        console.log(`| ${i + 1} | ${row.name} | ${row.count} |`);
      });
      console.log("");
    }
  }

  // Sibling JSON with full counts (for resolver tooling).
  const stem = diffPath.replace(/\.diff\.json$/i, "");
  const surfacesPath = `${stem}-surfaces.json`;
  const fullDump = {
    diff: path.basename(diffPath),
    booksProcessed: diff.added.length,
    factions: Array.from(factionTally.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    locations: Array.from(locationTally.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    characters: Array.from(characterTally.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    resolution: summary.map((s) => ({ axis: s.axis, ...s.resolution })),
  };
  await writeFile(surfacesPath, JSON.stringify(fullDump, null, 2), "utf8");
  console.log(`\nwrote full-frequency dump: ${surfacesPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
