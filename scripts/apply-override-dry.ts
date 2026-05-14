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
import { join } from "node:path";
import process from "node:process";

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
] as const;
const SMOKE_SLUGS = [
  "the-anarch",
  "calgars-fury",
  "the-emperors-gift",
  "storm-of-iron",
  "celestine",
  "spear-of-the-emperor",
] as const;

const EXPECTED_RANGES = {
  factions: { min: 500, max: 651 },
  locations: { min: 180, max: 239 },
  characters: { min: 430, max: 540 },
} as const;

interface OverrideEntity {
  name: string;
  role: string;
}

interface OverrideBook {
  externalBookId: string;
  slug: string;
  overrides: {
    facetIds: string[];
    factions: OverrideEntity[];
    locations: OverrideEntity[];
    characters: OverrideEntity[];
  };
}

interface OverrideFile {
  batch: string;
  books: OverrideBook[];
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
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(join(SEED_DIR, file), "utf8")) as T;
}

function loadReferences(): ReferenceData {
  const roster = readJson<RosterFile>("book-roster.json");
  const catalog = readJson<FacetCatalog>("facet-catalog.json");
  const factions = readJson<FactionRow[]>("factions.json");
  const sectors = readJson<SectorRow[]>("sectors.json");
  const locations = readJson<LocationRow[]>("locations.json");
  const characters = readJson<CharacterRow[]>("characters.json");

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
  };
}

function loadOverrides(): OverrideBook[] {
  return BATCHES.flatMap((batch) => {
    const file = readJson<OverrideFile>(
      `manual-overrides-ssot-w40k-${batch}.json`,
    );
    assert.equal(file.batch, `ssot-w40k-${batch}`);
    return file.books;
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
  return {
    externalBookId: book.externalBookId,
    slug: book.slug,
    factions: simulateAxis("faction", book.overrides.factions, refs),
    locations: simulateAxis("location", book.overrides.locations, refs),
    characters: simulateAxis("character", book.overrides.characters, refs),
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

function batchLabel(): string {
  return `ssot-w40k-${BATCHES[0]}..${BATCHES[BATCHES.length - 1]}`;
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

function buildBatchByExternalId(overrideBooks: OverrideBook[]): Map<string, string> {
  const batchByExternalId = new Map<string, string>();
  for (const batch of BATCHES) {
    const file = readJson<OverrideFile>(
      `manual-overrides-ssot-w40k-${batch}.json`,
    );
    for (const book of file.books) {
      batchByExternalId.set(book.externalBookId, batch);
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
  const refs = loadReferences();
  const roster = readJson<RosterFile>("book-roster.json");
  const overrideBooks = loadOverrides();
  const simulations = overrideBooks.map((book) => simulateBook(book, refs));
  const batchByExternalId = buildBatchByExternalId(overrideBooks);
  const collectionAnalysis = analyzeCollections(roster, batchByExternalId);

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

  console.log(`[apply-override-dry] batches=${batchLabel()}`);
  console.log(`[apply-override-dry] books=${overrideBooks.length}`);
  console.log("[apply-override-dry] resolved junction counts:");
  console.log(`  work_factions:   ${totals.work_factions}`);
  console.log(`  work_locations:  ${totals.work_locations}`);
  console.log(`  work_characters: ${totals.work_characters}`);
  console.log("");

  console.log("[apply-override-dry] smoke detail-page counts:");
  for (const slug of SMOKE_SLUGS) {
    const row = simulations.find((book) => book.slug === slug);
    assert.ok(row, `Missing smoke slug ${slug}`);
    console.log(
      `  /buch/${slug}: factions=${row.factions.rows.length}, ` +
        `locations=${row.locations.rows.length}, characters=${row.characters.rows.length}`,
    );
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
  console.log(`  forward refs in ${batchLabel()}: ${collectionAnalysis.forwardRefs.length}`);
  console.log("");

  console.log("[apply-override-dry] validation:");
  console.log(`  missing roster externalBookIds: ${missingRoster.length}`);
  console.log(`  missing facet ids:             ${missingFacets.length}`);
  console.log(`  invalid normalized roles:      ${invalidRoles.length}`);
  console.log(`  missing resolved FK targets:   ${missingTargets.length}`);
  console.log(`  dangling JSON FK/alias refs:   ${referenceFkFindings.length}`);
  console.log(`  forward collection refs:       ${collectionAnalysis.forwardRefs.length}`);

  assert.deepEqual(missingRoster, [], `missing roster ids: ${missingRoster.join(", ")}`);
  assert.deepEqual(missingFacets, [], `missing facet ids: ${missingFacets.join(", ")}`);
  assert.deepEqual(invalidRoles, [], `invalid roles: ${invalidRoles.join("; ")}`);
  assert.deepEqual(missingTargets, [], `missing resolved targets: ${missingTargets.join("; ")}`);
  assert.deepEqual(
    referenceFkFindings,
    [],
    `dangling JSON FK/alias refs: ${referenceFkFindings.join("; ")}`,
  );
  assert.deepEqual(
    collectionAnalysis.forwardRefs,
    [],
    `forward collection refs: ${collectionAnalysis.forwardRefs
      .map((c) => `${c.collectionExternalId}->${c.contentExternalId}`)
      .join("; ")}`,
  );
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

  console.log("[apply-override-dry] ok");
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
