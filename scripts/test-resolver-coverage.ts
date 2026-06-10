/**
 * Resolver coverage smoke for the cumulative Authority-layer books.
 *
 * Reads manual-overrides-ssot-w40k-001..057 + ssot-hh-001..002 (extended
 * after each HH resolver pass) and computes unique resolved canonical counts per book and
 * axis. This is intentionally observational: sparse books are reported with
 * below-threshold notes, not padded with invented entities and not treated
 * as script failures.
 *
 * Brief 100: two-domain (W40K + HH). BATCHES carries `{ domain, n }`-tuples
 * so each HH resolver pass extends the materially-checked range.
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
import { decideLocationSkips } from "./apply-override-location-skip";

const SEED_DIR = resolve(process.cwd(), "scripts", "seed-data");
/**
 * Domain-aware batch list (Brief 100). After each resolver pass, append
 * `{ domain, n }`-tuples for the newly resolved batches.
 */
const BATCHES = [
  { domain: "w40k", n: "001" },
  { domain: "w40k", n: "002" },
  { domain: "w40k", n: "003" },
  { domain: "w40k", n: "004" },
  { domain: "w40k", n: "005" },
  { domain: "w40k", n: "006" },
  { domain: "w40k", n: "007" },
  { domain: "w40k", n: "008" },
  { domain: "w40k", n: "009" },
  { domain: "w40k", n: "010" },
  { domain: "w40k", n: "011" },
  { domain: "w40k", n: "012" },
  { domain: "w40k", n: "013" },
  { domain: "w40k", n: "014" },
  { domain: "w40k", n: "015" },
  { domain: "w40k", n: "016" },
  { domain: "w40k", n: "017" },
  { domain: "w40k", n: "018" },
  { domain: "w40k", n: "019" },
  { domain: "w40k", n: "020" },
  { domain: "w40k", n: "021" },
  { domain: "w40k", n: "022" },
  { domain: "w40k", n: "023" },
  { domain: "w40k", n: "024" },
  { domain: "w40k", n: "025" },
  { domain: "w40k", n: "026" },
  { domain: "w40k", n: "027" },
  { domain: "w40k", n: "028" },
  { domain: "w40k", n: "029" },
  { domain: "w40k", n: "030" },
  { domain: "w40k", n: "031" },
  { domain: "w40k", n: "032" },
  { domain: "w40k", n: "033" },
  { domain: "w40k", n: "034" },
  { domain: "w40k", n: "035" },
  { domain: "w40k", n: "036" },
  { domain: "w40k", n: "037" },
  { domain: "w40k", n: "038" },
  { domain: "w40k", n: "039" },
  { domain: "w40k", n: "040" },
  { domain: "w40k", n: "041" },
  { domain: "w40k", n: "042" },
  { domain: "w40k", n: "043" },
  { domain: "w40k", n: "044" },
  { domain: "w40k", n: "045" },
  { domain: "w40k", n: "046" },
  { domain: "w40k", n: "047" },
  { domain: "w40k", n: "048" },
  { domain: "w40k", n: "049" },
  { domain: "w40k", n: "050" },
  { domain: "w40k", n: "051" },
  { domain: "w40k", n: "052" },
  { domain: "w40k", n: "053" },
  { domain: "w40k", n: "054" },
  { domain: "w40k", n: "055" },
  { domain: "w40k", n: "056" },
  { domain: "w40k", n: "057" },
  { domain: "w40k", n: "058" },
  { domain: "w40k", n: "059" },
  { domain: "w40k", n: "060" },
  { domain: "hh", n: "001" },
  { domain: "hh", n: "002" },
  { domain: "hh", n: "003" },
  { domain: "hh", n: "004" },
  { domain: "hh", n: "005" },
  { domain: "hh", n: "006" },
  { domain: "hh", n: "007" },
  { domain: "hh", n: "008" },
  { domain: "hh", n: "009" },
  { domain: "hh", n: "010" },
  { domain: "hh", n: "011" },
  { domain: "hh", n: "012" },
  { domain: "hh", n: "013" },
  { domain: "hh", n: "014" },
  { domain: "hh", n: "015" },
  { domain: "hh", n: "016" },
  { domain: "hh", n: "017" },
  { domain: "hh", n: "018" },
  { domain: "hh", n: "019" },
  { domain: "hh", n: "020" },
  { domain: "hh", n: "021" },
  { domain: "hh", n: "022" },
  { domain: "hh", n: "023" },
  { domain: "hh", n: "024" },
  { domain: "hh", n: "025" },
  { domain: "hh", n: "026" },
  { domain: "hh", n: "027" },
  { domain: "hh", n: "028" },
  { domain: "hh", n: "029" },
  { domain: "hh", n: "030" },
] as const satisfies ReadonlyArray<{ domain: "w40k" | "hh"; n: string }>;
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
  "blind",
  "grey-knights",
  "gunheads",
  "baneblade",
  "the-remnant-blade",
  "warrior-brood",
  "warrior-coven",
  "faith-and-fire",
  "dark-apostle",
  "blood-gorgons",
  "legion-of-the-damned",
  "flesh-tearers",
  "scythes-of-the-emperor",
  "stormseer",
  "lords-of-caliban",
  "shield-of-baal-devourer",
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
interface LocationPolicyRow {
  redundantSurfaceForms?: string[];
}

const FACTION_ROWS = readJson<FactionRow[]>("factions.json");
const FACTION_POLICY = readJson<FactionPolicyRow>("faction-policy.json");
const LOCATION_POLICY = readJson<LocationPolicyRow>("location-policy.json");
const ALIGNMENT_BY_ID = new Map<string, Alignment>();
for (const row of FACTION_ROWS) ALIGNMENT_BY_ID.set(row.id, normalizeAlignment(row));
const REDUNDANT_IDS = new Set<string>(FACTION_POLICY.redundantWhenSubPresent ?? []);
const REDUNDANT_LOCATION_SURFACE_FORMS = new Set<string>(
  (LOCATION_POLICY.redundantSurfaceForms ?? []).map((s) =>
    s.trim().toLowerCase(),
  ),
);

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

/**
 * Location coverage after applying the Brief 084 umbrella-surface-form-skip:
 * resolved IDs are unchanged (umbrellas resolve to null anyway), but the
 * unresolved surface forms route the umbrellas into the audit-bucket when a
 * peer location resolves in the same block. Returns coverage + skipped tally
 * + the post-skip unresolved list so the tail report can split the delta.
 */
function locationCoverageWithSkip(
  input: OverrideEntity[],
): AxisCoverage & { skipped: number } {
  const base = uniqueResolved(input, resolveLocation);
  const decision = decideLocationSkips({
    surfaceForms: input,
    redundantSurfaceForms: REDUNDANT_LOCATION_SURFACE_FORMS,
    resolvedLocationIds: Array.from(
      new Set(
        input
          .map((entity) => resolveLocation(entity.name).id)
          .filter((id): id is string => id !== null),
      ),
    ),
  });
  const skipSet = new Set(
    decision.skippedSurfaceForms.map((s) => s.trim().toLowerCase()),
  );
  return {
    resolved: base.resolved,
    input: base.input,
    unresolved: base.unresolved.filter(
      (name) => !skipSet.has(name.trim().toLowerCase()),
    ),
    skipped: decision.skippedSurfaceForms.length,
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

const books = BATCHES.flatMap((b) =>
  readJson<OverrideFile>(`manual-overrides-ssot-${b.domain}-${b.n}.json`).books,
);

function batchRangeLabel(): string {
  const groups = new Map<string, string[]>();
  for (const b of BATCHES) {
    const arr = groups.get(b.domain) ?? [];
    arr.push(b.n);
    groups.set(b.domain, arr);
  }
  const parts: string[] = [];
  for (const [domain, ns] of groups) {
    parts.push(
      ns.length === 1
        ? `manual-overrides-ssot-${domain}-${ns[0]}`
        : `manual-overrides-ssot-${domain}-${ns[0]}..${ns[ns.length - 1]}`,
    );
  }
  return parts.join(" + ");
}

interface FactionCoverageWithSkip extends AxisCoverage {
  skipped: number;
}
interface LocationCoverageWithSkip extends AxisCoverage {
  skipped: number;
}

interface BookCoverageExt extends BookCoverage {
  factions: FactionCoverageWithSkip;
  locations: LocationCoverageWithSkip;
}

const coverage: BookCoverageExt[] = books.map((book) => ({
  externalBookId: book.externalBookId,
  slug: book.slug,
  factions: factionCoverageWithSkip(book.overrides.factions),
  locations: locationCoverageWithSkip(book.overrides.locations),
  characters: characterCoverage(book.overrides.characters),
}));

const bySlug = new Map(coverage.map((row) => [row.slug, row]));

console.log(`resolver coverage: ${batchRangeLabel()}`);
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
    locationsSkipped: acc.locationsSkipped + row.locations.skipped,
    charactersResolved: acc.charactersResolved + row.characters.resolved,
    characterInputs: acc.characterInputs + row.characters.input,
  }),
  {
    factionsResolved: 0,
    factionInputs: 0,
    factionsSkipped: 0,
    locationsResolved: 0,
    locationInputs: 0,
    locationsSkipped: 0,
    charactersResolved: 0,
    characterInputs: 0,
  },
);

console.log(
  `totals: factions=${totals.factionsResolved}/${totals.factionInputs} (post-Brief-077-skip, ${totals.factionsSkipped} grand-alignment surface forms suppressed), ` +
    `locations=${totals.locationsResolved}/${totals.locationInputs} (post-Brief-084-skip, ${totals.locationsSkipped} location umbrella surface forms suppressed), ` +
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
