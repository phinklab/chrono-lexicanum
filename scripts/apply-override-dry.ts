/**
 * Dry simulation for the resolver apply sweep (ssot-w40k-001..010).
 *
 * This intentionally does not import the DB client and performs no mutations.
 * It mirrors the resolver-facing parts of scripts/apply-override.ts:
 * surface-form resolution, per-work junction de-dupe, role normalization,
 * unresolved surface-form capture, and FK-target validation against the
 * checked-in seed JSONs.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";

import {
  resolveCharacter,
  resolveFaction,
  resolveLocation,
} from "../src/lib/resolver";
import {
  CHARACTER_ROLE_PRIORITY,
  FACTION_ROLE_PRIORITY,
  normalizeEntityRole,
} from "../src/lib/resolver/roles";
import type {
  CharacterJunctionRole,
  FactionJunctionRole,
  ResolverAxis,
  RoleNormalization,
} from "../src/lib/resolver/roles";
import {
  type Alignment,
  normalizeAlignment,
} from "../src/lib/seed/alignment";
import { decideFactionSkips } from "./apply-override-skip";
import { decideLocationSkips } from "./apply-override-location-skip";
import {
  lintSynopsis,
  loadBannedPatterns,
  type BannedPattern,
  type SynopsisLintResult,
} from "./apply-override-synopsis-lint";
import {
  formatRatingWrite,
  normalizeRatingOverride,
  type OverrideRating,
  type RatingWrite,
} from "./apply-override-rating";

const SEED_DIR = join(process.cwd(), "scripts", "seed-data");
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
  "021",
  "022",
  "023",
  "024",
  "025",
  "026",
  "027",
  "028",
  "029",
  "030",
  "031",
  "032",
  "033",
  "034",
  "035",
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

const EXPECTED_RANGES = {
  factions: { min: 500, max: 1500 },
  locations: { min: 180, max: 600 },
  characters: { min: 430, max: 1200 },
} as const;

interface OverrideEntity {
  name: string;
  role: string;
}

interface OverrideBook {
  externalBookId: string;
  slug: string;
  overrides: {
    synopsis: string;
    facetIds: string[];
    factions: OverrideEntity[];
    locations: OverrideEntity[];
    characters: OverrideEntity[];
    rating?: OverrideRating;
  };
}

interface OverrideFile {
  batch: string;
  books: OverrideBook[];
}

interface LoadedOverrideBatch {
  batch: string;
  books: OverrideBook[];
  sourcePath: string;
}

interface CliArgs {
  file: string | null;
}

interface RosterFile {
  books: Array<{ externalBookId: string }>;
  collections: RosterCollection[];
}

interface RosterCollection {
  contentExternalId: string;
  collectionExternalId: string;
}

interface FacetCatalog {
  categories: Array<{ values: Array<{ id: string }> }>;
}

interface FactionRow {
  id: string;
  name: string;
  parent?: string | null;
  alignment?: string | null;
  tone?: string | null;
}

interface FactionPolicyFile {
  redundantWhenSubPresent?: string[];
}

interface LocationPolicyFile {
  redundantSurfaceForms?: string[];
}

interface SectorRow {
  id: string;
}

interface LocationRow {
  id: string;
  name: string;
  sector?: string | null;
}

interface CharacterRow {
  id: string;
  name: string;
  primaryFactionId?: string | null;
}

interface ReferenceData {
  rosterIds: Set<string>;
  facetIds: Set<string>;
  factionIds: Set<string>;
  sectorIds: Set<string>;
  locationIds: Set<string>;
  characterIds: Set<string>;
  factionAliases: Record<string, string>;
  locationAliases: Record<string, string>;
  characterAliases: Record<string, string>;
  factions: FactionRow[];
  locations: LocationRow[];
  characters: CharacterRow[];
  alignmentById: Map<string, Alignment>;
  redundantIds: Set<string>;
  redundantLocationSurfaceForms: ReadonlySet<string>;
}

interface ResolvedEntity {
  id: string;
  role: string;
  rawName: string;
}

interface AxisSimulation {
  rows: ResolvedEntity[];
  unresolved: OverrideEntity[];
  invalidRoles: Array<{ name: string; role: string }>;
  roleNormalizations: Array<{ from: string; to: string }>;
  missingTargets: Array<{ name: string; id: string }>;
}

interface BookSimulation {
  externalBookId: string;
  slug: string;
  factions: AxisSimulation;
  locations: AxisSimulation;
  characters: AxisSimulation;
  factionsSkippedRedundant: string[];
  locationsSkippedRedundant: string[];
}

interface RatingSimulation {
  externalBookId: string;
  slug: string;
  write: RatingWrite | null;
  error: string | null;
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(join(SEED_DIR, file), "utf8")) as T;
}

function readJsonPath<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function parseCliArgs(): CliArgs {
  const { values } = parseArgs({
    options: {
      file: { type: "string" },
    },
    strict: true,
    allowPositionals: false,
  });
  return { file: values.file ?? null };
}

function loadReferences(): ReferenceData {
  const roster = readJson<RosterFile>("book-roster.json");
  const catalog = readJson<FacetCatalog>("facet-catalog.json");
  const factions = readJson<FactionRow[]>("factions.json");
  const sectors = readJson<SectorRow[]>("sectors.json");
  const locations = readJson<LocationRow[]>("locations.json");
  const characters = readJson<CharacterRow[]>("characters.json");
  const policy = readJson<FactionPolicyFile>("faction-policy.json");
  const locationPolicy = readJson<LocationPolicyFile>("location-policy.json");

  const alignmentById = new Map<string, Alignment>();
  for (const row of factions) {
    alignmentById.set(row.id, normalizeAlignment(row));
  }

  const redundantLocationSurfaceForms = new Set<string>(
    (locationPolicy.redundantSurfaceForms ?? []).map((s) =>
      s.trim().toLowerCase(),
    ),
  );

  return {
    rosterIds: new Set(roster.books.map((book) => book.externalBookId)),
    facetIds: new Set(
      catalog.categories.flatMap((category) =>
        category.values.map((value) => value.id),
      ),
    ),
    factionIds: new Set(factions.map((row) => row.id)),
    sectorIds: new Set(sectors.map((row) => row.id)),
    locationIds: new Set(locations.map((row) => row.id)),
    characterIds: new Set(characters.map((row) => row.id)),
    factionAliases: readJson<Record<string, string>>("faction-aliases.json"),
    locationAliases: readJson<Record<string, string>>("location-aliases.json"),
    characterAliases: readJson<Record<string, string>>("character-aliases.json"),
    factions,
    locations,
    characters,
    alignmentById,
    redundantIds: new Set(policy.redundantWhenSubPresent ?? []),
    redundantLocationSurfaceForms,
  };
}

function loadOverrideBatches(cli: CliArgs): LoadedOverrideBatch[] {
  if (cli.file !== null) {
    const sourcePath = resolve(process.cwd(), cli.file);
    const file = readJsonPath<OverrideFile>(sourcePath);
    assert.ok(file.batch, `${sourcePath}: batch is required`);
    assert.ok(Array.isArray(file.books), `${sourcePath}: books must be an array`);
    return [{ batch: file.batch, books: file.books, sourcePath }];
  }

  return BATCHES.map((batch) => {
    const file = readJson<OverrideFile>(
      `manual-overrides-ssot-w40k-${batch}.json`,
    );
    assert.equal(file.batch, `ssot-w40k-${batch}`);
    return {
      batch: file.batch,
      books: file.books,
      sourcePath: join(SEED_DIR, `manual-overrides-ssot-w40k-${batch}.json`),
    };
  });
}

function resolveAxis(axis: ResolverAxis, name: string): string | null {
  if (axis === "faction") return resolveFaction(name).id;
  if (axis === "location") return resolveLocation(name).id;
  return resolveCharacter(name).id;
}

function targetIdsFor(axis: ResolverAxis, refs: ReferenceData): Set<string> {
  if (axis === "faction") return refs.factionIds;
  if (axis === "location") return refs.locationIds;
  return refs.characterIds;
}

function rolePriority(axis: ResolverAxis, role: string): number {
  if (axis === "faction") {
    return FACTION_ROLE_PRIORITY[role as FactionJunctionRole] ?? 0;
  }
  if (axis === "character") {
    return CHARACTER_ROLE_PRIORITY[role as CharacterJunctionRole] ?? 0;
  }
  return 0;
}

function simulateAxis(
  axis: ResolverAxis,
  input: OverrideEntity[],
  refs: ReferenceData,
): AxisSimulation {
  const byId = new Map<string, ResolvedEntity>();
  const unresolved: OverrideEntity[] = [];
  const invalidRoles: Array<{ name: string; role: string }> = [];
  const roleNormalizations: Array<{ from: string; to: string }> = [];
  const missingTargets: Array<{ name: string; id: string }> = [];
  const targetIds = targetIdsFor(axis, refs);

  for (const entity of input) {
    let normalized: RoleNormalization;
    try {
      normalized = normalizeEntityRole(axis, entity.role);
    } catch {
      invalidRoles.push({ name: entity.name, role: entity.role });
      continue;
    }
    if (normalized.changed) {
      roleNormalizations.push({ from: entity.role, to: normalized.role });
    }

    const id = resolveAxis(axis, entity.name);
    if (id === null) {
      unresolved.push(entity);
      continue;
    }
    if (!targetIds.has(id)) {
      missingTargets.push({ name: entity.name, id });
      continue;
    }

    if (axis === "location") {
      if (!byId.has(id)) {
        byId.set(id, { id, role: normalized.role, rawName: entity.name });
      }
      continue;
    }

    const current = byId.get(id);
    const incomingPriority = rolePriority(axis, normalized.role);
    const currentPriority = current ? rolePriority(axis, current.role) : -1;
    if (incomingPriority > currentPriority) {
      byId.set(id, { id, role: normalized.role, rawName: entity.name });
    }
  }

  return {
    rows: [...byId.values()],
    unresolved,
    invalidRoles,
    roleNormalizations,
    missingTargets,
  };
}

function simulateBook(book: OverrideBook, refs: ReferenceData): BookSimulation {
  const factions = simulateAxis("faction", book.overrides.factions, refs);
  // Apply Brief 077 skip-decision: drop redundant grand-alignment junctions
  // when an alignment-peer sub-faction is resolved in the same block.
  const skipDecision = decideFactionSkips({
    resolved: factions.rows,
    original: book.overrides.factions,
    alignmentById: refs.alignmentById,
    redundantIds: refs.redundantIds,
    resolveFaction: (name) => resolveFaction(name),
  });
  const factionsPostSkip: AxisSimulation = {
    ...factions,
    rows: skipDecision.keep,
  };

  // Brief 084: location umbrella-surface-forms route into a separate
  // audit-bucket and out of `locationsUnresolved` when at least one other
  // location resolves in the same block. work_locations rows themselves are
  // unaffected (umbrellas resolve to null anyway).
  const locations = simulateAxis("location", book.overrides.locations, refs);
  const locationSkipDecision = decideLocationSkips({
    surfaceForms: book.overrides.locations,
    redundantSurfaceForms: refs.redundantLocationSurfaceForms,
    resolvedLocationIds: locations.rows.map((r) => r.id),
  });
  const locationSkipSet = new Set(
    locationSkipDecision.skippedSurfaceForms.map((s) =>
      s.trim().toLowerCase(),
    ),
  );
  const locationsPostSkip: AxisSimulation = {
    ...locations,
    unresolved: locations.unresolved.filter(
      (entity) => !locationSkipSet.has(entity.name.trim().toLowerCase()),
    ),
  };

  return {
    externalBookId: book.externalBookId,
    slug: book.slug,
    factions: factionsPostSkip,
    locations: locationsPostSkip,
    characters: simulateAxis("character", book.overrides.characters, refs),
    factionsSkippedRedundant: skipDecision.skippedSurfaceForms,
    locationsSkippedRedundant: locationSkipDecision.skippedSurfaceForms,
  };
}

function countBy<T>(items: T[], keyOf: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = keyOf(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function formatCounts(counts: Map<string, number>): string {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => `${name} x${count}`)
    .join(", ");
}

function batchLabel(batches: LoadedOverrideBatch[]): string {
  if (
    batches.length === BATCHES.length &&
    batches[0]?.batch === `ssot-w40k-${BATCHES[0]}` &&
    batches[batches.length - 1]?.batch === `ssot-w40k-${BATCHES[BATCHES.length - 1]}`
  ) {
    return `ssot-w40k-${BATCHES[0]}..${BATCHES[BATCHES.length - 1]}`;
  }
  return batches.map((batch) => batch.batch).join(", ");
}

function collectUnresolved(
  simulations: BookSimulation[],
  axis: "factions" | "locations" | "characters",
): Map<string, number> {
  return countBy(
    simulations.flatMap((book) => book[axis].unresolved),
    (entity) => entity.name,
  );
}

function collectRoleNormalizations(
  simulations: BookSimulation[],
): Map<string, number> {
  return countBy(
    simulations.flatMap((book) => [
      ...book.factions.roleNormalizations.map((role) => `faction ${role.from}->${role.to}`),
      ...book.locations.roleNormalizations.map((role) => `location ${role.from}->${role.to}`),
      ...book.characters.roleNormalizations.map((role) => `character ${role.from}->${role.to}`),
    ]),
    (item) => item,
  );
}

function collectInvalidRoles(simulations: BookSimulation[]): string[] {
  return simulations.flatMap((book) => [
    ...book.factions.invalidRoles.map(
      (role) => `${book.externalBookId} faction ${role.name} role=${role.role}`,
    ),
    ...book.locations.invalidRoles.map(
      (role) => `${book.externalBookId} location ${role.name} role=${role.role}`,
    ),
    ...book.characters.invalidRoles.map(
      (role) => `${book.externalBookId} character ${role.name} role=${role.role}`,
    ),
  ]);
}

function collectMissingTargets(simulations: BookSimulation[]): string[] {
  return simulations.flatMap((book) => [
    ...book.factions.missingTargets.map(
      (target) => `${book.externalBookId} faction ${target.name} -> ${target.id}`,
    ),
    ...book.locations.missingTargets.map(
      (target) => `${book.externalBookId} location ${target.name} -> ${target.id}`,
    ),
    ...book.characters.missingTargets.map(
      (target) => `${book.externalBookId} character ${target.name} -> ${target.id}`,
    ),
  ]);
}

function simulateRatings(overrideBooks: OverrideBook[]): RatingSimulation[] {
  return overrideBooks.map((book) => {
    try {
      return {
        externalBookId: book.externalBookId,
        slug: book.slug,
        write: normalizeRatingOverride(book.overrides.rating, book.externalBookId),
        error: null,
      };
    } catch (err) {
      return {
        externalBookId: book.externalBookId,
        slug: book.slug,
        write: null,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });
}

function countRatingState(
  ratings: RatingSimulation[],
  state: RatingWrite["state"],
): number {
  return ratings.filter((rating) => rating.write?.state === state).length;
}

function collectReferenceFkFindings(refs: ReferenceData): string[] {
  const findings: string[] = [];
  for (const faction of refs.factions) {
    if (faction.parent && !refs.factionIds.has(faction.parent)) {
      findings.push(`factions.${faction.id}.parent -> ${faction.parent}`);
    }
  }
  for (const location of refs.locations) {
    if (location.sector && !refs.sectorIds.has(location.sector)) {
      findings.push(`locations.${location.id}.sector -> ${location.sector}`);
    }
  }
  for (const character of refs.characters) {
    if (
      character.primaryFactionId &&
      !refs.factionIds.has(character.primaryFactionId)
    ) {
      findings.push(
        `characters.${character.id}.primaryFactionId -> ${character.primaryFactionId}`,
      );
    }
  }
  for (const [alias, target] of Object.entries(refs.factionAliases)) {
    if (!refs.factionIds.has(target)) {
      findings.push(`faction-aliases.${alias} -> ${target}`);
    }
  }
  for (const [alias, target] of Object.entries(refs.locationAliases)) {
    if (!refs.locationIds.has(target)) {
      findings.push(`location-aliases.${alias} -> ${target}`);
    }
  }
  for (const [alias, target] of Object.entries(refs.characterAliases)) {
    if (!refs.characterIds.has(target)) {
      findings.push(`character-aliases.${alias} -> ${target}`);
    }
  }
  return findings;
}

/**
 * Public-Synopsis-Forward-Guard report (Brief 080, P1 — report-only).
 *
 * The dry-runner runs the same `lintSynopsis` helper as the real apply but
 * **does not fail** on hits. The real apply (scripts/apply-override.ts) is
 * the gate; the dry is the diagnostic. Hits on the still-polluted batches
 * 009..019 are out-of-scope for Brief 080 — they belong to the follow-up
 * loop 081 — and a hard-fail in the dry would block this brief's acceptance
 * impossibly. The per-batch and per-label aggregates below are the
 * Pre-Mess-Telemetrie that Brief 081 reads to know what it's facing.
 *
 * Future extension point (out-of-scope for Brief 080): a `--strict-synopsis`
 * CLI flag that flips the dry to hard-fail-on-hits, for CI / pre-commit
 * integration after 081 finishes the per-batch backfill.
 */
interface BatchSynopsisLintReport {
  batch: string;
  bookCount: number;
  booksWithHits: number;
  totalHits: number;
  hitsByLabel: Map<string, number>;
}

function collectSynopsisLintByBatch(
  patterns: readonly BannedPattern[],
  batches: LoadedOverrideBatch[],
): BatchSynopsisLintReport[] {
  const reports: BatchSynopsisLintReport[] = [];
  for (const file of batches) {
    const hitsByLabel = new Map<string, number>();
    let booksWithHits = 0;
    let totalHits = 0;
    for (const book of file.books) {
      const result: SynopsisLintResult = lintSynopsis(
        book.externalBookId,
        book.slug,
        book.overrides.synopsis,
        patterns,
      );
      if (result.hits.length === 0) continue;
      booksWithHits += 1;
      totalHits += result.hits.length;
      for (const hit of result.hits) {
        hitsByLabel.set(hit.patternLabel, (hitsByLabel.get(hit.patternLabel) ?? 0) + 1);
      }
    }
    reports.push({
      batch: file.batch,
      bookCount: file.books.length,
      booksWithHits,
      totalHits,
      hitsByLabel,
    });
  }
  return reports;
}

function buildBatchByExternalId(
  batches: LoadedOverrideBatch[],
  overrideBooks: OverrideBook[],
): Map<string, string> {
  const batchByExternalId = new Map<string, string>();
  for (const file of batches) {
    for (const book of file.books) {
      batchByExternalId.set(book.externalBookId, file.batch);
    }
  }
  assert.equal(
    batchByExternalId.size,
    overrideBooks.length,
    "override books should map 1:1 to batches",
  );
  return batchByExternalId;
}

function analyzeCollections(
  roster: RosterFile,
  batchByExternalId: Map<string, string>,
): {
  oldSameBatchResolvable: number;
  newResolvable: number;
  crossBatchResolvable: RosterCollection[];
  forwardRefs: RosterCollection[];
} {
  const appliedIds = new Set(batchByExternalId.keys());
  const relevant = roster.collections.filter(
    (collection) =>
      appliedIds.has(collection.collectionExternalId) ||
      appliedIds.has(collection.contentExternalId),
  );
  const oldSameBatchResolvable = relevant.filter((collection) => {
    const collectionBatch = batchByExternalId.get(collection.collectionExternalId);
    const contentBatch = batchByExternalId.get(collection.contentExternalId);
    return collectionBatch !== undefined && collectionBatch === contentBatch;
  }).length;
  const newResolvable = relevant.filter(
    (collection) =>
      appliedIds.has(collection.collectionExternalId) &&
      appliedIds.has(collection.contentExternalId),
  ).length;
  const crossBatchResolvable = relevant.filter((collection) => {
    const collectionBatch = batchByExternalId.get(collection.collectionExternalId);
    const contentBatch = batchByExternalId.get(collection.contentExternalId);
    return (
      collectionBatch !== undefined &&
      contentBatch !== undefined &&
      collectionBatch !== contentBatch
    );
  });
  const forwardRefs = crossBatchResolvable.filter((collection) => {
    const collectionBatch = batchByExternalId.get(collection.collectionExternalId);
    const contentBatch = batchByExternalId.get(collection.contentExternalId);
    return collectionBatch !== undefined && contentBatch !== undefined
      ? collectionBatch < contentBatch
      : false;
  });
  return {
    oldSameBatchResolvable,
    newResolvable,
    crossBatchResolvable,
    forwardRefs,
  };
}

function assertInRange(label: string, value: number, min: number, max: number): void {
  assert.ok(
    value >= min && value <= max,
    `${label}=${value} outside expected dry-run range ${min}..${max}`,
  );
}

function main(): void {
  const cli = parseCliArgs();
  const fixtureMode = cli.file !== null;
  const refs = loadReferences();
  const roster = readJson<RosterFile>("book-roster.json");
  const overrideBatches = loadOverrideBatches(cli);
  const label = batchLabel(overrideBatches);
  const overrideBooks = overrideBatches.flatMap((batch) => batch.books);
  const simulations = overrideBooks.map((book) => simulateBook(book, refs));
  const batchByExternalId = buildBatchByExternalId(overrideBatches, overrideBooks);
  const collectionAnalysis = analyzeCollections(roster, batchByExternalId);
  const ratingSimulations = simulateRatings(overrideBooks);
  const invalidRatings = ratingSimulations
    .filter((rating) => rating.error !== null)
    .map((rating) => rating.error!);

  const missingRoster = overrideBooks
    .filter((book) => !refs.rosterIds.has(book.externalBookId))
    .map((book) => book.externalBookId);
  const missingFacets = overrideBooks.flatMap((book) =>
    book.overrides.facetIds
      .filter((facetId) => !refs.facetIds.has(facetId))
      .map((facetId) => `${book.externalBookId} -> ${facetId}`),
  );
  const invalidRoles = collectInvalidRoles(simulations);
  const missingTargets = collectMissingTargets(simulations);
  const referenceFkFindings = collectReferenceFkFindings(refs);

  const totals = {
    work_factions: simulations.reduce((sum, book) => sum + book.factions.rows.length, 0),
    work_locations: simulations.reduce((sum, book) => sum + book.locations.rows.length, 0),
    work_characters: simulations.reduce((sum, book) => sum + book.characters.rows.length, 0),
  };
  const skippedRedundantTotal = simulations.reduce(
    (sum, book) => sum + book.factionsSkippedRedundant.length,
    0,
  );
  const booksWithSkips = simulations.filter(
    (book) => book.factionsSkippedRedundant.length > 0,
  ).length;
  const skippedSurfaceCounts = countBy(
    simulations.flatMap((book) => book.factionsSkippedRedundant),
    (name) => name,
  );

  console.log(`[apply-override-dry] batches=${label}`);
  console.log(`[apply-override-dry] books=${overrideBooks.length}`);
  console.log("[apply-override-dry] resolved junction counts (post-skip):");
  console.log(`  work_factions:   ${totals.work_factions}`);
  console.log(`  work_locations:  ${totals.work_locations}`);
  console.log(`  work_characters: ${totals.work_characters}`);
  console.log("[apply-override-dry] grand-alignment-junction-skip (Brief 077):");
  console.log(
    `  skipped surface forms: ${skippedRedundantTotal} across ${booksWithSkips} books`,
  );
  console.log(`  by name: ${formatCounts(skippedSurfaceCounts) || "none"}`);
  console.log("");

  const skippedLocationsTotal = simulations.reduce(
    (sum, book) => sum + book.locationsSkippedRedundant.length,
    0,
  );
  const booksWithLocationSkips = simulations.filter(
    (book) => book.locationsSkippedRedundant.length > 0,
  ).length;
  const skippedLocationSurfaceCounts = countBy(
    simulations.flatMap((book) => book.locationsSkippedRedundant),
    (name) => name,
  );
  console.log("[apply-override-dry] location-umbrella-junction-skip (Brief 084):");
  console.log(
    `  skipped surface forms: ${skippedLocationsTotal} across ${booksWithLocationSkips} books`,
  );
  console.log(
    `  by name: ${formatCounts(skippedLocationSurfaceCounts) || "none"}`,
  );
  console.log("");

  if (fixtureMode) {
    console.log("[apply-override-dry] fixture detail-page counts:");
    for (const row of simulations) {
      console.log(
        `  /buch/${row.slug}: factions=${row.factions.rows.length}, ` +
          `locations=${row.locations.rows.length}, characters=${row.characters.rows.length}`,
      );
    }
  } else {
    console.log("[apply-override-dry] smoke detail-page counts:");
    for (const slug of SMOKE_SLUGS) {
      const row = simulations.find((book) => book.slug === slug);
      assert.ok(row, `Missing smoke slug ${slug}`);
      console.log(
        `  /buch/${slug}: factions=${row.factions.rows.length}, ` +
          `locations=${row.locations.rows.length}, characters=${row.characters.rows.length}`,
      );
    }
  }
  console.log("");

  console.log("[apply-override-dry] unresolved surface forms:");
  console.log(`  factions:   ${formatCounts(collectUnresolved(simulations, "factions")) || "none"}`);
  console.log(`  locations:  ${formatCounts(collectUnresolved(simulations, "locations")) || "none"}`);
  console.log(`  characters: ${formatCounts(collectUnresolved(simulations, "characters")) || "none"}`);
  console.log("");

  const roleNormalizations = collectRoleNormalizations(simulations);
  console.log("[apply-override-dry] role normalizations:");
  console.log(`  ${formatCounts(roleNormalizations) || "none"}`);
  console.log("");

  console.log("[apply-override-dry] work_collections resolution:");
  console.log(
    `  old same-batch resolvable: ${collectionAnalysis.oldSameBatchResolvable}`,
  );
  console.log(`  new cross-batch-capable resolvable: ${collectionAnalysis.newResolvable}`);
  console.log(
    `  cross-batch examples: ${
      collectionAnalysis.crossBatchResolvable
        .slice(0, 6)
        .map((c) => `${c.collectionExternalId}->${c.contentExternalId}`)
        .join(", ") || "none"
    }`,
  );
  console.log(
    `  forward refs in ${label}: ${collectionAnalysis.forwardRefs.length}` +
      (collectionAnalysis.forwardRefs.length > 0
        ? ` (resolved by the cumulative sweep: ${collectionAnalysis.forwardRefs
            .map((c) => `${c.collectionExternalId}->${c.contentExternalId}`)
            .join(", ")})`
        : ""),
  );
  console.log("");

  console.log("[apply-override-dry] Goodreads rating override simulation:");
  console.log(`  rated:   ${countRatingState(ratingSimulations, "rated")}`);
  console.log(`  unrated: ${countRatingState(ratingSimulations, "unrated")}`);
  console.log(`  absent:  ${countRatingState(ratingSimulations, "absent")}`);
  for (const rating of ratingSimulations) {
    if (rating.write === null || rating.write.state === "absent") continue;
    console.log(
      `  ${rating.externalBookId} /buch/${rating.slug}: ${formatRatingWrite(rating.write)}`,
    );
  }
  console.log("");

  const bannedPatterns = loadBannedPatterns(SEED_DIR);
  const synopsisLintReports = collectSynopsisLintByBatch(
    bannedPatterns,
    overrideBatches,
  );
  const synopsisTotal = synopsisLintReports.reduce(
    (sum, r) => sum + r.totalHits,
    0,
  );
  const synopsisBooksWithHits = synopsisLintReports.reduce(
    (sum, r) => sum + r.booksWithHits,
    0,
  );
  const synopsisLabelTotals = new Map<string, number>();
  for (const r of synopsisLintReports) {
    for (const [label, n] of r.hitsByLabel) {
      synopsisLabelTotals.set(label, (synopsisLabelTotals.get(label) ?? 0) + n);
    }
  }
  console.log(
    "[apply-override-dry] synopsis-lint (Brief 080, report-only — does NOT fail dry):",
  );
  console.log(
    `  patterns:          ${bannedPatterns.length} banned-pattern entries loaded`,
  );
  console.log(
    `  hits across batch: ${synopsisTotal} hit(s) in ${synopsisBooksWithHits} book(s)`,
  );
  for (const r of synopsisLintReports) {
    const tag = r.totalHits === 0 ? "clean" : `${r.totalHits} hits / ${r.booksWithHits}/${r.bookCount} books`;
    console.log(`  ${r.batch}: ${tag}`);
  }
  console.log(
    `  by label: ${formatCounts(synopsisLabelTotals) || "none"}`,
  );
  console.log("");

  console.log("[apply-override-dry] validation:");
  console.log(`  missing roster externalBookIds: ${missingRoster.length}`);
  console.log(`  missing facet ids:             ${missingFacets.length}`);
  console.log(`  invalid normalized roles:      ${invalidRoles.length}`);
  console.log(`  invalid rating overrides:      ${invalidRatings.length}`);
  console.log(`  missing resolved FK targets:   ${missingTargets.length}`);
  console.log(`  dangling JSON FK/alias refs:   ${referenceFkFindings.length}`);
  console.log(`  forward collection refs:       ${collectionAnalysis.forwardRefs.length}`);

  assert.deepEqual(missingRoster, [], `missing roster ids: ${missingRoster.join(", ")}`);
  assert.deepEqual(missingFacets, [], `missing facet ids: ${missingFacets.join(", ")}`);
  assert.deepEqual(invalidRoles, [], `invalid roles: ${invalidRoles.join("; ")}`);
  assert.deepEqual(invalidRatings, [], `invalid ratings: ${invalidRatings.join("; ")}`);
  assert.deepEqual(missingTargets, [], `missing resolved targets: ${missingTargets.join("; ")}`);
  assert.deepEqual(
    referenceFkFindings,
    [],
    `dangling JSON FK/alias refs: ${referenceFkFindings.join("; ")}`,
  );
  if (!fixtureMode) {
    // Forward collection refs (collection book in an earlier batch than its
    // content) are NOT a failure for the cumulative 001..NNN re-apply this dry
    // simulates — and this dry only ever runs the full range (non-fixture mode).
    // apply-override.ts:applyCollections resolves the already-applied endpoint via
    // works.external_book_id and re-evaluates every collection whose content-side
    // is in the batch being applied, so an ascending sweep creates the edge when
    // the content's (later) batch lands. Verified end-to-end in Resolver-Pass 6:
    // all 10 anthology→novella forward refs (Sanctus Reach W40K-0296, Damocles
    // W40K-0294, Shield of Baal W40K-0304) were present in work_collections
    // post-apply. The count + pairs are printed above for visibility; the prior
    // `forwardRefs === []` hard-assert was correct only while the corpus happened
    // to carry no forward refs and is dropped here as over-strict.
    assert.ok(
      collectionAnalysis.crossBatchResolvable.length > 0,
      "expected at least one cross-batch collection example",
    );
    assertInRange(
      "work_factions",
      totals.work_factions,
      EXPECTED_RANGES.factions.min,
      EXPECTED_RANGES.factions.max,
    );
    assertInRange(
      "work_locations",
      totals.work_locations,
      EXPECTED_RANGES.locations.min,
      EXPECTED_RANGES.locations.max,
    );
    assertInRange(
      "work_characters",
      totals.work_characters,
      EXPECTED_RANGES.characters.min,
      EXPECTED_RANGES.characters.max,
    );
  }

  console.log("[apply-override-dry] ok");
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
