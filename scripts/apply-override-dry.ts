/**
 * Dry simulation for the resolver apply sweep (ssot-w40k-001..057 + ssot-hh-001..002).
 *
 * This intentionally does not import the DB client and performs no mutations.
 * It mirrors the resolver-facing parts of scripts/apply-override.ts:
 * surface-form resolution, per-work junction de-dupe, role normalization,
 * unresolved surface-form capture, and FK-target validation against the
 * checked-in seed JSONs.
 *
 * Brief 100: two-domain (W40K + HH). BATCHES carries `{ domain, n }`-tuples
 * so the trias materially exercises HH overrides after each HH resolver pass
 * instead of staying green by absence.
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
import {
  analyzeCollections,
  type RosterFile,
} from "./apply-override-collections";

const SEED_DIR = join(process.cwd(), "scripts", "seed-data");
/**
 * Domain-aware batch list (Brief 100). After each resolver pass, append
 * `{ domain, n }`-tuples for the newly resolved batches — Domain-+-N-Append,
 * not reines N-Append.
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

/**
 * Sanity caps on the resolved junction totals.
 *
 * Brief 100 raises the maxima to fit the HH bootstrap (+30-50 factions,
 * +60-120 locations, +500-800 characters over the 30 HH waves). Lower
 * bounds stay at the W40K-only floor — they keep guarding against an
 * accidental zero/near-zero apply. Future re-tuning happens at the next
 * Konsolidierungs-Pass with large merge movement, not per-wave — but
 * the Brief-100 faction estimate underran the observed HH curve (+131
 * factions over the first 200 HH books vs. the +30-50 budgeted), so
 * Resolver-Pass 13 Phase 4a bumps the faction maximum from 2500 to 3200
 * (current dry post-apply 2512 + ~22% headroom for the remaining HH
 * waves before the next consolidation pass).
 */
const EXPECTED_RANGES = {
  factions: { min: 500, max: 3200 },
  locations: { min: 180, max: 1100 },
  characters: { min: 430, max: 2200 },
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

  return BATCHES.map((b) => {
    const fileName = `manual-overrides-ssot-${b.domain}-${b.n}.json`;
    const file = readJson<OverrideFile>(fileName);
    assert.equal(file.batch, `ssot-${b.domain}-${b.n}`);
    return {
      batch: file.batch,
      books: file.books,
      sourcePath: join(SEED_DIR, fileName),
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
  const first = BATCHES[0];
  const last = BATCHES[BATCHES.length - 1];
  if (
    batches.length === BATCHES.length &&
    batches[0]?.batch === `ssot-${first.domain}-${first.n}` &&
    batches[batches.length - 1]?.batch === `ssot-${last.domain}-${last.n}`
  ) {
    // Group by domain for a readable consolidated label.
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
          ? `ssot-${domain}-${ns[0]}`
          : `ssot-${domain}-${ns[0]}..${ns[ns.length - 1]}`,
      );
    }
    return parts.join(" + ");
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
  const unresolvableByReason = countBy(
    collectionAnalysis.unresolvableConstituentRefs,
    (u) => u.reason,
  );
  console.log(
    `  unresolvable constituent refs: ${collectionAnalysis.unresolvableConstituentRefs.length}`,
  );
  console.log(
    `  by reason: out-of-range=${unresolvableByReason.get("out-of-range") ?? 0}, ` +
      `unknown-work=${unresolvableByReason.get("unknown-work") ?? 0}`,
  );

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
    // content) are legitimate for the cumulative 001..NNN re-apply this dry
    // simulates: apply-override.ts:applyCollections resolves the already-applied
    // endpoint via works.external_book_id and re-evaluates every collection whose
    // content-side is in the batch being applied, so an ascending sweep creates
    // the edge when the content's (later, but in-range) batch lands. Verified
    // end-to-end in Resolver-Pass 6: all 10 anthology→novella forward refs
    // (Sanctus Reach W40K-0296, Damocles W40K-0294, Shield of Baal W40K-0304)
    // were present in work_collections post-apply.
    assert.ok(
      collectionAnalysis.crossBatchResolvable.length > 0,
      "expected at least one cross-batch collection example",
    );
    // Brief 091 range-aware guard, Brief 101 reason-split: in-range forward
    // refs (above) stay accepted. The tripwire is the constituent side, and it
    // splits by reason. `out-of-range` is a consistent deferred state — the
    // constituent is in the roster, just not in the cumulative apply range
    // yet, and applyCollections re-evaluates the edge when the constituent's
    // wave lands (Pass 6's anthology forward refs proved this end-to-end).
    // `unknown-work` is the real error — constituent absent from the roster
    // entirely (typo or unregistered deferred gap) → never resolves. Out-of-
    // range refs are reported in the reason-breakdown above as informational
    // deferred edges; only unknown-work refs abort the dry, and only those
    // are listed in the failure message (the actionable set).
    const unknownWorkRefs = collectionAnalysis.unresolvableConstituentRefs.filter(
      (u) => u.reason === "unknown-work",
    );
    assert.deepEqual(
      unknownWorkRefs.map(
        (u) =>
          `${u.collection.collectionExternalId}->${u.collection.contentExternalId}`,
      ),
      [],
      "forward collection refs with an unknown constituent — typo or unregistered deferred gap",
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
