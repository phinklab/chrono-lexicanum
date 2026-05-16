/**
 * Resolver coverage smoke for the first 200 Authority-layer books.
 *
 * Reads manual-overrides-ssot-w40k-001..020 and computes unique resolved
 * canonical counts per book and axis. This is intentionally observational:
 * sparse books are reported with below-threshold notes, not padded with
 * invented entities and not treated as script failures.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

import {
  normalizeCharacterRole,
  resolveCharacter,
  resolveFaction,
  resolveLocation,
} from "../src/lib/resolver";
import {
  type Alignment,
  normalizeAlignment,
} from "../src/lib/seed/alignment";
import { decideFactionSkips } from "./apply-override-skip";

const SEED_DIR = resolve(process.cwd(), "scripts", "seed-data");
const BATCHES = [
  "001",
  "002",
  "003",
  "004",
  "005",
  "006",
  "007",
  "008",
  "009",
  "010",
  "011",
  "012",
  "013",
  "014",
  "015",
  "016",
  "017",
  "018",
  "019",
  "020",
] as const;
const SMOKE_SLUGS = [
  "the-anarch",
  "calgars-fury",
  "the-emperors-gift",
  "storm-of-iron",
  "celestine",
  "spear-of-the-emperor",
  "honourbound",
  "the-infinite-and-the-divine",
  "brutal-kunnin",
  "krieg",
  "archmagos",
  "inquisitor-draco",
  "voidscarred",
  "the-green-tide",
  "13th-legion",
  "armageddon-saint",
  "phalanx",
  "crossfire",
  "lasgun-wedding",
  "wanted-dead",
] as const;
const SMOKE_THRESHOLD = 3;

interface OverrideEntity {
  name: string;
  role: string;
}

interface OverrideBook {
  externalBookId: string;
  slug: string;
  overrides: {
    factions: OverrideEntity[];
    locations: OverrideEntity[];
    characters: OverrideEntity[];
  };
}

interface OverrideFile {
  books: OverrideBook[];
}

interface AxisCoverage {
  resolved: number;
  input: number;
  unresolved: string[];
}

interface BookCoverage {
  externalBookId: string;
  slug: string;
  factions: AxisCoverage;
  locations: AxisCoverage;
  characters: AxisCoverage;
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(resolve(SEED_DIR, file), "utf8")) as T;
}

function uniqueResolved(
  input: OverrideEntity[],
  resolveOne: (name: string) => { id: string | null },
): AxisCoverage {
  const ids = new Set<string>();
  const unresolved = new Set<string>();
  for (const entity of input) {
    const resolved = resolveOne(entity.name);
    if (resolved.id === null) {
      unresolved.add(entity.name);
    } else {
      ids.add(resolved.id);
    }
  }
  return {
    resolved: ids.size,
    input: input.length,
    unresolved: [...unresolved].sort(),
  };
}

interface FactionRow {
  id: string;
  parent?: string | null;
  alignment?: string | null;
  tone?: string | null;
}
interface FactionPolicyRow {
  redundantWhenSubPresent?: string[];
}

const FACTION_ROWS = readJson<FactionRow[]>("factions.json");
const FACTION_POLICY = readJson<FactionPolicyRow>("faction-policy.json");
const ALIGNMENT_BY_ID = new Map<string, Alignment>();
for (const row of FACTION_ROWS) ALIGNMENT_BY_ID.set(row.id, normalizeAlignment(row));
const REDUNDANT_IDS = new Set<string>(FACTION_POLICY.redundantWhenSubPresent ?? []);

/**
 * Faction coverage after applying the Brief 077 grand-alignment-junction-skip:
 * a resolved id in REDUNDANT_IDS gets dropped if a peer with matching alignment
 * is present in the same block. Returns the post-skip resolved count plus a
 * tally of skipped surface forms so the report can show the delta separately.
 */
function factionCoverageWithSkip(
  input: OverrideEntity[],
): AxisCoverage & { skipped: number } {
  const ids = new Set<string>();
  const unresolved = new Set<string>();
  for (const entity of input) {
    const resolved = resolveFaction(entity.name);
    if (resolved.id === null) {
      unresolved.add(entity.name);
    } else {
      ids.add(resolved.id);
    }
  }
  const resolvedList = [...ids].map((id) => ({ id, role: "primary", rawName: id }));
  const { keep, skippedSurfaceForms } = decideFactionSkips({
    resolved: resolvedList,
    original: input,
    alignmentById: ALIGNMENT_BY_ID,
    redundantIds: REDUNDANT_IDS,
    resolveFaction,
  });
  return {
    resolved: keep.length,
    input: input.length,
    unresolved: [...unresolved].sort(),
    skipped: skippedSurfaceForms.length,
  };
}

function characterCoverage(input: OverrideEntity[]): AxisCoverage {
  for (const entity of input) {
    const normalized = normalizeCharacterRole(entity.role);
    assert.ok(normalized.role !== null, `invalid character role ${entity.role}`);
  }
  return uniqueResolved(input, resolveCharacter);
}

function formatAxis(axis: AxisCoverage): string {
  return `${axis.resolved}/${axis.input}`;
}

function pad(value: string, width: number): string {
  return value.padEnd(width, " ");
}

const books = BATCHES.flatMap((n) =>
  readJson<OverrideFile>(`manual-overrides-ssot-w40k-${n}.json`).books,
);

interface FactionCoverageWithSkip extends AxisCoverage {
  skipped: number;
}

interface BookCoverageExt extends BookCoverage {
  factions: FactionCoverageWithSkip;
}

const coverage: BookCoverageExt[] = books.map((book) => ({
  externalBookId: book.externalBookId,
  slug: book.slug,
  factions: factionCoverageWithSkip(book.overrides.factions),
  locations: uniqueResolved(book.overrides.locations, resolveLocation),
  characters: characterCoverage(book.overrides.characters),
}));

const bySlug = new Map(coverage.map((row) => [row.slug, row]));

console.log("resolver coverage: manual-overrides-ssot-w40k-001..020");
console.log(`books: ${coverage.length}`);
console.log("");

const header = [
  pad("slug", 22),
  pad("id", 9),
  pad("factions", 9),
  pad("locations", 10),
  pad("characters", 10),
  "notes",
].join("  ");
console.log(header);
console.log("-".repeat(header.length));

for (const slug of SMOKE_SLUGS) {
  const row = bySlug.get(slug);
  assert.ok(row, `Missing smoke slug ${slug}`);

  const lowAxes = [
    ["factions", row.factions] as const,
    ["locations", row.locations] as const,
    ["characters", row.characters] as const,
  ]
    .filter(([, axis]) => axis.resolved < SMOKE_THRESHOLD)
    .map(([axis, data]) => `${axis}<${SMOKE_THRESHOLD} (${data.resolved})`);

  const notes = lowAxes.length > 0 ? lowAxes.join(", ") : "ok";
  console.log(
    [
      pad(row.slug, 22),
      pad(row.externalBookId, 9),
      pad(formatAxis(row.factions), 9),
      pad(formatAxis(row.locations), 10),
      pad(formatAxis(row.characters), 10),
      notes,
    ].join("  "),
  );
}

console.log("");

const totals = coverage.reduce(
  (acc, row) => ({
    factionsResolved: acc.factionsResolved + row.factions.resolved,
    factionInputs: acc.factionInputs + row.factions.input,
    factionsSkipped: acc.factionsSkipped + row.factions.skipped,
    locationsResolved: acc.locationsResolved + row.locations.resolved,
    locationInputs: acc.locationInputs + row.locations.input,
    charactersResolved: acc.charactersResolved + row.characters.resolved,
    characterInputs: acc.characterInputs + row.characters.input,
  }),
  {
    factionsResolved: 0,
    factionInputs: 0,
    factionsSkipped: 0,
    locationsResolved: 0,
    locationInputs: 0,
    charactersResolved: 0,
    characterInputs: 0,
  },
);

console.log(
  `totals: factions=${totals.factionsResolved}/${totals.factionInputs} (post-Brief-077-skip, ${totals.factionsSkipped} grand-alignment surface forms suppressed), ` +
    `locations=${totals.locationsResolved}/${totals.locationInputs}, ` +
    `characters=${totals.charactersResolved}/${totals.characterInputs}`,
);

const below = SMOKE_SLUGS.flatMap((slug) => {
  const row = bySlug.get(slug);
  if (!row) return [`${slug}: missing`];
  return [
    ["factions", row.factions] as const,
    ["locations", row.locations] as const,
    ["characters", row.characters] as const,
  ]
    .filter(([, axis]) => axis.resolved < SMOKE_THRESHOLD)
    .map(([axis, data]) => `${slug}.${axis}=${data.resolved}/${data.input}`);
});

if (below.length > 0) {
  console.log(`below-threshold smoke axes: ${below.join(", ")}`);
  console.log("below-threshold rows are data findings, not automatic failures");
}
