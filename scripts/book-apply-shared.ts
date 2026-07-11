/**
 * book-apply-shared.ts — Brief 170 Teil A. The ONE shared book-apply code path.
 *
 * Extracted VERBATIM from `apply-override.ts` so the legacy batch applier
 * (`db:apply-override`) AND the new targeted per-book applier (`apply:book`,
 * Brief 170) materialize a book into Postgres through a SINGLE, parity-tested
 * path — exactly the "shared crystallizer" pattern Brief 154 established for
 * `resolve-book-edges.ts`. A parallel re-implementation in `apply:book` would
 * silently drift (a different notes block, a missed junction-scope) and the
 * Acceptance bullet "authors/editors/editorialNote/notes und rohe Override-
 * Kuration roundtrippen legacy-equivalent" would only hold by coincidence.
 *
 * NO top-level side effect (no `main()`): safe to import from both appliers and
 * from DB-free unit tests (the pure helpers + validators). The two appliers
 * differ ONLY in how they project their source files into the shared
 * `OverrideBook` / `RosterBook` shapes — the legacy applier from a batch file +
 * `book-roster.json`, the per-book applier from `scripts/seed-data/books/<slug>.json`.
 *
 * Authority-vs-source split (unchanged from Brief 060):
 *   - `works.synopsis`        ← override
 *   - `works.title`           ← roster
 *   - `works.releaseYear`     ← roster
 *   - `works.externalBookId`  ← roster (idempotency anchor)
 *   - `works.sourceKind`      ← const "ssot"
 *   - `works.confidence`      ← const "1.00"
 *   - `bookDetails.format`    ← roster (or override `data_conflict.suggestion`)
 *   - `bookDetails.notes`     ← surfaceForms + optional authorship JSON blocks
 *   - `bookDetails.primaryEraId` ← mechanisch gebucketet aus book-dates.json ×
 *     eras.json (`./era-bucket`, Launch S1a); keine Setting-Date ⇒ NULL
 *   - `bookDetails.seriesId`/`seriesIndex` ← caller-supplied `series` arg
 *   - `work_persons.*`        ← roster.authors[]/roster.editors[] (slugified)
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { and, count, eq, inArray, or } from "drizzle-orm";

import { db } from "@/db/client";
import {
  bookDetails,
  facetValues,
  persons,
  works,
  workCharacters,
  workCollections,
  workFacets,
  workFactions,
  workLocations,
  workPersons,
} from "@/db/schema";
import { deriveNameSort, slugifyPerson } from "@/lib/seed/persons";
import {
  normalizeCharacterRole,
  normalizeFactionRole,
  normalizeLocationRole,
} from "@/lib/resolver/roles";
import { type Alignment, normalizeAlignment } from "@/lib/seed/alignment";

import {
  resolveBookEdges,
  unresolvedCharacters,
  unresolvedFactions,
  unresolvedLocations,
} from "./resolve-book-edges";
import {
  formatLintError,
  lintSynopsis,
  loadBannedPatterns,
  type BannedPattern,
  type SynopsisLintResult,
} from "./apply-override-synopsis-lint";
import {
  formatRatingWrite,
  normalizeRatingOverride,
  ratingBookDetailsPatch,
  type OverrideRating,
} from "./apply-override-rating";
import { primaryEraIdFor, type EraContext } from "./era-bucket";
import type { RosterBook, RosterCollection, RosterFile } from "./seed-data/types";

export type { RosterBook, RosterCollection, RosterFile } from "./seed-data/types";

export const SEED_DIR = resolve(process.cwd(), "scripts", "seed-data");
const ROSTER_PATH = resolve(SEED_DIR, "book-roster.json");
const PERSONS_PATH = resolve(SEED_DIR, "persons.json");
const FACTIONS_PATH = resolve(SEED_DIR, "factions.json");
const FACTION_POLICY_PATH = resolve(SEED_DIR, "faction-policy.json");
const LOCATION_POLICY_PATH = resolve(SEED_DIR, "location-policy.json");
const LOCATIONS_PATH = resolve(SEED_DIR, "locations.json");
const LOCATION_ALIASES_PATH = resolve(SEED_DIR, "location-aliases.json");

// Public-Synopsis-Forward-Guard (Brief 080): banned-pattern list loaded once
// at module init. The real apply throws hard on any hit (gate semantics); the
// dry-runner imports the same helper but collects hits report-only.
export const BANNED_SYNOPSIS_PATTERNS: readonly BannedPattern[] = loadBannedPatterns(SEED_DIR);

// =============================================================================
// Types
// =============================================================================

export interface OverrideFlag {
  kind: string;
  field?: string;
  current?: string;
  suggestion?: string;
  sources?: string[];
  reasoning?: string;
}

export interface OverrideEntity {
  name: string;
  role: string;
}

/** The soft-curation payload — identical between a batch override and a per-book file's `curation`. */
export interface OverrideCuration {
  synopsis: string;
  facetIds: string[];
  factions: OverrideEntity[];
  locations: OverrideEntity[];
  characters: OverrideEntity[];
  flags: OverrideFlag[];
  rating?: OverrideRating;
}

export interface OverrideBook {
  externalBookId: string;
  slug: string;
  overrides: OverrideCuration;
}

/** Caller-supplied series anchor. Legacy: from `SERIES_BY_EXTERNAL_ID`; per-book: from the file. */
export interface SeriesAnchor {
  id: string;
  index: number | null;
}

export type ApplyPath = "insert" | "update";

export interface BookApplyResult {
  externalBookId: string;
  slug: string;
  workId: string;
  path: ApplyPath;
  facetCount: number;
  factionCount: number;
  locationCount: number;
  characterCount: number;
  authorCount: number;
  editorCount: number;
  unresolvedAuthorship: boolean;
  ratingSummary: string;
}

export interface AutoCreatedPerson {
  id: string;
  name: string;
  nameSort: string;
}

// Marker emitted into bookDetails.notes for anthologies where the roster says
// authors=[] + editorialNote="various". Lets the future Resolver-Brief regex-
// extract these books without scanning work_persons absences.
export interface AuthorshipMarker {
  kind: "various";
  editorialNote: "various";
}

export interface PersonsJsonEntry {
  id: string;
  name: string;
  nameSort: string;
  bio?: string;
  birthYear?: number;
  lexicanumUrl?: string;
  wikipediaUrl?: string;
}

// =============================================================================
// Notes composition (pure — the legacy-equivalence-critical surface)
// =============================================================================

export function buildAuthorshipBlock(marker: AuthorshipMarker): string {
  return `---authorship---\n${JSON.stringify(marker, null, 2)}\n---/authorship---`;
}

export function pickFinalFormat(
  roster: RosterBook,
  override: OverrideBook,
): {
  format: string | null;
  formatOverride: { from: string | null; to: string; reason: string } | null;
} {
  const dataConflict = override.overrides.flags.find(
    (f) => f.kind === "data_conflict" && f.field === "format" && f.suggestion,
  );
  if (dataConflict) {
    return {
      format: dataConflict.suggestion ?? null,
      formatOverride: {
        from: dataConflict.current ?? roster.format ?? null,
        to: dataConflict.suggestion!,
        reason: dataConflict.reasoning ?? "data_conflict flag in override file",
      },
    };
  }
  return { format: roster.format ?? null, formatOverride: null };
}

export function buildSurfaceFormsBlock(
  override: OverrideBook,
  formatOverride: { from: string | null; to: string; reason: string } | null,
  skippedSurfaceForms: string[] = [],
  skippedLocationSurfaceForms: string[] = [],
): string {
  const factionsUnresolved = unresolvedFactions(override.overrides.factions);
  // Brief 084: surface forms that the location-skip helper already classified
  // as redundant umbrella tags do not double-up in `locationsUnresolved`.
  // Case-insensitive trim-match keeps `IMPERIUM` / `Imperium of MAN` aligned
  // with the skip set.
  const locationSkipSet = new Set(
    skippedLocationSurfaceForms.map((s) => s.trim().toLowerCase()),
  );
  const locationsUnresolved = unresolvedLocations(
    override.overrides.locations,
  ).filter((l) => !locationSkipSet.has(l.name.trim().toLowerCase()));
  const charactersUnresolved = unresolvedCharacters(
    override.overrides.characters,
  );
  const payload: Record<string, unknown> = {
    factionsUnresolved,
    locationsUnresolved,
    charactersUnresolved,
    flags: override.overrides.flags,
  };
  if (skippedSurfaceForms.length > 0) {
    payload.factionsSkippedRedundant = skippedSurfaceForms;
  }
  if (skippedLocationSurfaceForms.length > 0) {
    payload.locationsSkippedRedundant = skippedLocationSurfaceForms;
  }
  if (formatOverride) payload.formatOverride = formatOverride;
  const json = JSON.stringify(payload, null, 2);
  return `---surfaceForms---\n${json}\n---/surfaceForms---`;
}

export function composeNotes(
  rosterNotes: string | null,
  surfaceFormsBlock: string,
  authorshipBlock: string | null,
): string {
  const head = (rosterNotes ?? "").trim();
  const tail = authorshipBlock
    ? `${surfaceFormsBlock}\n\n${authorshipBlock}`
    : surfaceFormsBlock;
  return head ? `${head}\n\n${tail}` : tail;
}

// =============================================================================
// Skip-context loaders (Brief 077 + Brief 084)
// =============================================================================

interface FactionPolicyFile {
  browseRoots?: string[];
  knownTopLevelExceptions?: string[];
  redundantWhenSubPresent?: string[];
  specialCases?: Record<string, string>;
}

interface SeedFactionRow {
  id: string;
  name: string;
  parent?: string | null;
  alignment?: string | null;
  tone?: string | null;
}

/**
 * Skip-context for Brief 077: the policy-driven set of grand-alignment IDs
 * that get suppressed in `work_factions` when an alignment-peer sub-faction
 * is resolved in the same block, plus the lookup of every faction's
 * normalized alignment used to test the peer condition.
 */
export interface SkipContext {
  redundantIds: Set<string>;
  alignmentById: Map<string, Alignment>;
}

export async function loadSkipContext(): Promise<SkipContext> {
  const [policyRaw, factionsRaw] = await Promise.all([
    readFile(FACTION_POLICY_PATH, "utf8"),
    readFile(FACTIONS_PATH, "utf8"),
  ]);
  const policy = JSON.parse(policyRaw) as FactionPolicyFile;
  const seedFactions = JSON.parse(factionsRaw) as SeedFactionRow[];

  const redundantIds = new Set<string>(policy.redundantWhenSubPresent ?? []);
  const alignmentById = new Map<string, Alignment>();
  for (const f of seedFactions) {
    alignmentById.set(f.id, normalizeAlignment(f));
  }

  for (const id of redundantIds) {
    const alignment = alignmentById.get(id);
    if (alignment === undefined) {
      throw new Error(
        `faction-policy.redundantWhenSubPresent contains '${id}' but factions.json has no row with that id.`,
      );
    }
    if (alignment === "neutral") {
      throw new Error(
        `faction-policy.redundantWhenSubPresent contains '${id}' but its normalized alignment is 'neutral' — the skip rule needs a discriminating alignment.`,
      );
    }
  }

  return { redundantIds, alignmentById };
}

interface LocationPolicyFile {
  redundantSurfaceForms?: unknown;
  specialCases?: Record<string, string>;
}

interface SeedLocationRow {
  id: string;
  name: string;
}

/**
 * Skip-context for Brief 084: the policy-driven set of umbrella surface forms
 * (case-insensitive, trimmed) that get routed from `locationsUnresolved` into
 * the `locationsSkippedRedundant` audit-bucket when at least one other location
 * in the same override block resolves to a real `locations.json` row.
 */
export interface LocationSkipContext {
  redundantSurfaceForms: ReadonlySet<string>;
}

export async function loadLocationSkipContext(): Promise<LocationSkipContext> {
  const [policyRaw, locationsRaw, aliasesRaw] = await Promise.all([
    readFile(LOCATION_POLICY_PATH, "utf8"),
    readFile(LOCATIONS_PATH, "utf8"),
    readFile(LOCATION_ALIASES_PATH, "utf8"),
  ]);

  let policy: LocationPolicyFile;
  try {
    policy = JSON.parse(policyRaw) as LocationPolicyFile;
  } catch (err) {
    throw new Error(
      `location-policy.json is not parsable JSON: ${(err as Error).message}`,
    );
  }

  if (!Array.isArray(policy.redundantSurfaceForms)) {
    throw new Error(
      `location-policy.json: 'redundantSurfaceForms' must be a string array.`,
    );
  }

  const list: string[] = [];
  for (const item of policy.redundantSurfaceForms) {
    if (typeof item !== "string") {
      throw new Error(
        `location-policy.redundantSurfaceForms contains a non-string entry: ${JSON.stringify(item)}`,
      );
    }
    list.push(item);
  }

  const seedLocations = JSON.parse(locationsRaw) as SeedLocationRow[];
  const aliases = JSON.parse(aliasesRaw) as Record<string, string>;
  const canonicalLowercased = new Set<string>([
    ...seedLocations.map((l) => l.name.trim().toLowerCase()),
    ...Object.keys(aliases).map((k) => k.trim().toLowerCase()),
  ]);
  for (const entry of list) {
    const key = entry.trim().toLowerCase();
    if (canonicalLowercased.has(key)) {
      throw new Error(
        `location-policy.redundantSurfaceForms contains '${entry}' but it ` +
          `case-insensitively matches a locations.json name or location-aliases.json key — ` +
          `the skip rule would suppress a real location. Remove the entry or rename the row.`,
      );
    }
  }

  const redundantSurfaceForms = new Set<string>(
    list.map((s) => s.trim().toLowerCase()),
  );
  return { redundantSurfaceForms };
}

// =============================================================================
// Validators (halt-before-mutation gates)
// =============================================================================

export async function validateFacetIds(allFacetIds: Set<string>): Promise<void> {
  if (allFacetIds.size === 0) return;
  const rows = (await db
    .select({ id: facetValues.id })
    .from(facetValues)
    .where(inArray(facetValues.id, [...allFacetIds]))) as Array<{ id: string }>;
  const found = new Set(rows.map((r) => r.id));
  const missing = [...allFacetIds].filter((id) => !found.has(id));
  if (missing.length > 0) {
    throw new Error(
      `Override references unknown facet_value ids: ${missing.join(", ")}. ` +
        `Halt before mutation.`,
    );
  }
}

/**
 * Public-Synopsis-Forward-Guard (Brief 080): hard-throw pre-pass that runs
 * `lintSynopsis` against every book's overrides.synopsis. `label` names the
 * source (a batch name for legacy, a folder marker for per-book) so the error
 * points at the right place.
 */
export function validateSynopses(overrideBooks: OverrideBook[], label: string): void {
  const polluted: SynopsisLintResult[] = [];
  for (const book of overrideBooks) {
    const result = lintSynopsis(
      book.externalBookId,
      book.slug,
      book.overrides.synopsis,
      BANNED_SYNOPSIS_PATTERNS,
    );
    if (result.hits.length > 0) polluted.push(result);
  }
  if (polluted.length === 0) return;

  const totalHits = polluted.reduce((sum, r) => sum + r.hits.length, 0);
  const blocks = polluted.map((r) => formatLintError(r, label));
  throw new Error(
    `Public-Synopsis-Forward-Guard (Brief 080): ${polluted.length} of ` +
      `${overrideBooks.length} book(s) in ${label} carry banned ` +
      `patterns in overrides.synopsis (${totalHits} hit(s) total). ` +
      `Halt before mutation.\n` +
      blocks.join("\n\n"),
  );
}

export function validateRatingOverrides(overrideBooks: OverrideBook[]): void {
  const invalid: string[] = [];
  for (const book of overrideBooks) {
    try {
      normalizeRatingOverride(book.overrides.rating, book.externalBookId);
    } catch (err) {
      invalid.push(err instanceof Error ? err.message : String(err));
    }
  }

  if (invalid.length > 0) {
    throw new Error(
      `Override carries invalid overrides.rating entries: ${invalid.join("; ")}. ` +
        `Halt before mutation.`,
    );
  }
}

export function validateEntityRoles(overrideBooks: OverrideBook[]): void {
  const invalid: string[] = [];
  for (const book of overrideBooks) {
    for (const entity of book.overrides.factions) {
      try {
        normalizeFactionRole(entity.role);
      } catch {
        invalid.push(`${book.externalBookId} faction '${entity.name}' role='${entity.role}'`);
      }
    }
    for (const entity of book.overrides.locations) {
      try {
        normalizeLocationRole(entity.role);
      } catch {
        invalid.push(`${book.externalBookId} location '${entity.name}' role='${entity.role}'`);
      }
    }
    for (const entity of book.overrides.characters) {
      try {
        normalizeCharacterRole(entity.role);
      } catch {
        invalid.push(`${book.externalBookId} character '${entity.name}' role='${entity.role}'`);
      }
    }
  }

  if (invalid.length > 0) {
    throw new Error(
      `Override references unsupported entity roles after normalization: ${invalid.join("; ")}. ` +
        `Halt before mutation.`,
    );
  }
}

// =============================================================================
// Persons pre-pass
// =============================================================================

/**
 * Pre-pass over a set of books: collect every distinct author + editor name
 * string from the rosters, slugify each to a persons.id, look up which ones
 * already exist in DB, and INSERT the missing rows as a single block.
 *
 * Returns the list of newly inserted entries (in DB insertion order) so the
 * caller can append them atomically to scripts/seed-data/persons.json once the
 * per-book apply pass is done. Runs OUTSIDE the per-book transactions so
 * applyBook() can rely on FK-safe persons.id values.
 */
export async function ensurePersonsExist(
  overrideBooks: OverrideBook[],
  rosterByExternalId: Map<string, RosterBook>,
): Promise<{ autoCreated: AutoCreatedPerson[]; distinct: number }> {
  const desiredBySlug = new Map<string, string>();
  for (const ob of overrideBooks) {
    const rb = rosterByExternalId.get(ob.externalBookId);
    if (!rb) continue; // surfaced as a hard error by the caller
    for (const author of rb.authors) {
      const slug = slugifyPerson(author);
      if (slug && !desiredBySlug.has(slug)) desiredBySlug.set(slug, author);
    }
    for (const editor of rb.editors) {
      const slug = slugifyPerson(editor);
      if (slug && !desiredBySlug.has(slug)) desiredBySlug.set(slug, editor);
    }
  }

  const wantedSlugs = [...desiredBySlug.keys()];
  if (wantedSlugs.length === 0) {
    return { autoCreated: [], distinct: 0 };
  }

  const existingRows = (await db
    .select({ id: persons.id })
    .from(persons)
    .where(inArray(persons.id, wantedSlugs))) as Array<{ id: string }>;
  const existing = new Set(existingRows.map((r) => r.id));
  const missing = wantedSlugs.filter((s) => !existing.has(s));

  if (missing.length === 0) {
    return { autoCreated: [], distinct: wantedSlugs.length };
  }

  // nameSort is NOT NULL in the schema, so single-token fallback returns the
  // original token rather than null.
  const rows = missing.map((slug) => {
    const name = desiredBySlug.get(slug)!;
    return { id: slug, name, nameSort: deriveNameSort(name) };
  });
  await db.insert(persons).values(rows).onConflictDoNothing();

  return {
    autoCreated: rows.map((r) => ({ id: r.id, name: r.name, nameSort: r.nameSort })),
    distinct: wantedSlugs.length,
  };
}

/**
 * Atomic persons.json write: one append at the end of the run so the JSON
 * mirror stays in sync with the DB. Shared by both appliers so the "unknown
 * persons → persons.json in the same PR, never DB-only" contract is identical.
 */
export async function appendAutoCreatedPersons(
  autoCreated: AutoCreatedPerson[],
): Promise<number> {
  if (autoCreated.length === 0) return 0;
  const rawPersons = await readFile(PERSONS_PATH, "utf8");
  const existing = JSON.parse(rawPersons) as PersonsJsonEntry[];
  const merged = [
    ...existing,
    ...autoCreated.map((p) => ({ id: p.id, name: p.name, nameSort: p.nameSort })),
  ];
  await writeFile(PERSONS_PATH, JSON.stringify(merged, null, 2) + "\n", "utf8");
  return merged.length;
}

// =============================================================================
// Pure row derivation (DB-free) — the parity-by-construction surface
// =============================================================================

/**
 * The exact column values `applyBook` writes for ONE book, derived purely (no
 * DB, no network) from `(override, roster, series)` + the two skip contexts.
 * Surrogate/volatile columns (`works.id`, `created_at`, `updated_at`) are NOT
 * here — they are assigned by the DB, not by curation.
 *
 * This is the SINGLE place the corpus-owned row shape is decided. `applyBook`
 * calls it and writes the result; the Brief 171 equivalence harness calls it
 * for BOTH the legacy projection AND the per-book projection and deep-equals
 * the two — so `apply(legacy) == apply(per-book)` is parity-by-construction at
 * the row level (the only diff surface is the projection feeding this function),
 * provable WITHOUT a live or scratch DB.
 */
export interface ComputedBookRows {
  works: {
    kind: "book";
    canonicity: "official";
    slug: string;
    title: string;
    synopsis: string;
    releaseYear: number | null;
    externalBookId: string;
    sourceKind: "ssot";
    confidence: "1.00";
  };
  /** book_details column values (workId excluded — it is the DB surrogate). */
  bookDetails: {
    format: string | null;
    notes: string;
    /** Bucketed from book-dates.json × eras.json; NULL without a setting date. */
    primaryEraId: string | null;
    seriesId: string | null;
    seriesIndex: number | null;
    rating?: string | null;
    ratingCount?: number | null;
    ratingSource?: "goodreads";
  };
  persons: Array<{ personId: string; role: "author" | "editor"; displayOrder: number }>;
  /** work_facets.facet_value_id values, in override order. */
  facets: string[];
  factions: Array<{ factionId: string; role: string; rawName: string }>;
  locations: Array<{ locationId: string; role: string; rawName: string }>;
  characters: Array<{ characterId: string; role: string; rawName: string }>;
  // --- derivation metadata (not DB columns) ---------------------------------
  formatOverride: { from: string | null; to: string; reason: string } | null;
  ratingSummary: string;
  unresolvedAuthorship: boolean;
}

export function computeBookRows(
  override: OverrideBook,
  roster: RosterBook,
  series: SeriesAnchor | null,
  skipCtx: SkipContext,
  locationSkipCtx: LocationSkipContext,
  eraCtx: EraContext,
): ComputedBookRows {
  const { format, formatOverride } = pickFinalFormat(roster, override);

  // Brief 154: `resolveBookEdges` is the shared crystallizer — runs
  // resolveFactions → decideFactionSkips (Brief 077), resolveLocations +
  // decideLocationSkips (Brief 084, audit-only), and resolveCharacters.
  const edges = resolveBookEdges(override.overrides, skipCtx, locationSkipCtx);
  const keepFactions = edges.keepFactions;
  const skipDecision = edges.factionSkip;
  const resolvedLocations = edges.resolvedLocations;
  const locationSkipDecision = edges.locationSkip;
  const resolvedCharacters = edges.resolvedCharacters;

  const surfaceFormsBlock = buildSurfaceFormsBlock(
    override,
    formatOverride,
    skipDecision.skippedSurfaceForms,
    locationSkipDecision.skippedSurfaceForms,
  );
  const ratingPatch = ratingBookDetailsPatch(
    override.overrides.rating,
    override.externalBookId,
  );
  const ratingSummary = formatRatingWrite(
    normalizeRatingOverride(override.overrides.rating, override.externalBookId),
  );

  // Authorship resolution from roster (not override).
  let authorshipMarker: AuthorshipMarker | null = null;
  let unresolvedAuthorship = false;
  if (roster.authors.length === 0) {
    if (roster.editorialNote === "various") {
      authorshipMarker = { kind: "various", editorialNote: "various" };
    } else if (roster.editors.length === 0) {
      unresolvedAuthorship = true;
    }
    // else: editors-only book → editor rows carry authorship, no marker.
  }

  const authorshipBlock = authorshipMarker
    ? buildAuthorshipBlock(authorshipMarker)
    : null;
  const notes = composeNotes(roster.notes, surfaceFormsBlock, authorshipBlock);

  const persons: ComputedBookRows["persons"] = [];
  for (const [i, authorName] of roster.authors.entries()) {
    persons.push({ personId: slugifyPerson(authorName), role: "author", displayOrder: i });
  }
  for (const [i, editorName] of roster.editors.entries()) {
    persons.push({ personId: slugifyPerson(editorName), role: "editor", displayOrder: i });
  }

  return {
    works: {
      kind: "book",
      canonicity: "official",
      slug: override.slug,
      title: roster.title,
      synopsis: override.overrides.synopsis,
      releaseYear: roster.releaseYear ?? null,
      externalBookId: override.externalBookId,
      sourceKind: "ssot",
      confidence: "1.00",
    },
    bookDetails: {
      format,
      notes,
      // Era anchor derived per slug (works.slug == file slug, enforced by
      // `apply:book --verify`); the curation overlay re-asserts hand fixes as
      // the last db:sync tail, so a targeted apply may interim-NULL an
      // overlay-fixed book until that tail runs — same window as before.
      primaryEraId: primaryEraIdFor(eraCtx, override.slug),
      seriesId: series?.id ?? null,
      seriesIndex: series?.index ?? null,
      ...ratingPatch,
    },
    persons,
    facets: [...override.overrides.facetIds],
    factions: keepFactions.map((f) => ({ factionId: f.id, role: f.role, rawName: f.rawName })),
    locations: resolvedLocations.map((l) => ({ locationId: l.id, role: l.role, rawName: l.rawName })),
    characters: resolvedCharacters.map((c) => ({ characterId: c.id, role: c.role, rawName: c.rawName })),
    formatOverride,
    ratingSummary,
    unresolvedAuthorship,
  };
}

// =============================================================================
// The per-work writer (one transaction per book)
// =============================================================================

/**
 * Materialize exactly one book into Postgres. UPSERT `works` (idempotent on
 * `external_book_id`), UPSERT `book_details` (primary_era_id bucketed from the
 * setting dates, NULL without one — insert AND update), delete-then-insert
 * junctions scoped to THIS work only. Touches no other work.
 *
 * The corpus-owned column values come from the pure `computeBookRows` above
 * (Brief 171) — this writer only adds the DB plumbing (upsert/delete-insert).
 * `series` is supplied by the caller (legacy: `SERIES_BY_EXTERNAL_ID`; per-book:
 * the file's `series`/`seriesIndex`), so the writer carries no id map of its own.
 */
export async function applyBook(
  override: OverrideBook,
  roster: RosterBook,
  series: SeriesAnchor | null,
  skipCtx: SkipContext,
  locationSkipCtx: LocationSkipContext,
  eraCtx: EraContext,
): Promise<BookApplyResult> {
  return await db.transaction(async (tx) => {
    const rows = computeBookRows(override, roster, series, skipCtx, locationSkipCtx, eraCtx);
    const { format } = rows.bookDetails;
    const notes = rows.bookDetails.notes;
    const ratingSummary = rows.ratingSummary;
    const unresolvedAuthorship = rows.unresolvedAuthorship;
    const keepFactions = rows.factions;
    const resolvedLocations = rows.locations;
    const resolvedCharacters = rows.characters;

    if (unresolvedAuthorship) {
      console.warn(
        `[book-apply] unresolved_authorship: ${roster.externalBookId} ` +
          `(slug=${roster.slug}, row=${roster.sourceRow}, ` +
          `authors=[], editors=[], editorialNote=null)`,
      );
    }

    const existing = (await tx
      .select({ id: works.id })
      .from(works)
      .where(eq(works.externalBookId, override.externalBookId))) as Array<{ id: string }>;
    const path: ApplyPath = existing.length > 0 ? "update" : "insert";

    let workId: string;
    if (path === "update") {
      workId = existing[0].id;
      await tx
        .update(works)
        .set({
          synopsis: rows.works.synopsis,
          // Title and slug stay frozen on update — externalBookId is the only
          // identity anchor; renames require an explicit re-import path.
          updatedAt: new Date(),
        })
        .where(eq(works.id, workId));
    } else {
      const inserted = (await tx
        .insert(works)
        .values({ ...rows.works })
        .returning({ id: works.id })) as Array<{ id: string }>;
      workId = inserted[0].id;
    }

    // book_details upsert via primaryKey conflict (workId is PK).
    const detailValues = { ...rows.bookDetails, format: format as never };
    await tx
      .insert(bookDetails)
      .values({ workId, ...detailValues })
      .onConflictDoUpdate({
        target: bookDetails.workId,
        set: { ...detailValues },
      });

    // Junctions: delete-then-insert. work_collections is handled separately.
    await tx.delete(workFacets).where(eq(workFacets.workId, workId));
    if (rows.facets.length > 0) {
      await tx.insert(workFacets).values(
        rows.facets.map((facetValueId) => ({
          workId,
          facetValueId,
        })),
      );
    }

    const personRows = rows.persons.map((p) => ({ workId, ...p }));
    // Brief 105: scope the delete to author/editor — the roles this apply path
    // OWNS. Audio credits (narrator/co_narrator/full_cast) survive.
    await tx
      .delete(workPersons)
      .where(
        and(
          eq(workPersons.workId, workId),
          inArray(workPersons.role, ["author", "editor"]),
        ),
      );
    if (personRows.length > 0) {
      await tx.insert(workPersons).values(personRows);
    }

    await tx.delete(workFactions).where(eq(workFactions.workId, workId));
    if (keepFactions.length > 0) {
      await tx.insert(workFactions).values(
        keepFactions.map((f) => ({
          workId,
          factionId: f.factionId,
          role: f.role,
          rawName: f.rawName,
        })),
      );
    }

    await tx.delete(workLocations).where(eq(workLocations.workId, workId));
    if (resolvedLocations.length > 0) {
      await tx.insert(workLocations).values(
        resolvedLocations.map((l) => ({
          workId,
          locationId: l.locationId,
          role: l.role,
          rawName: l.rawName,
        })),
      );
    }

    await tx.delete(workCharacters).where(eq(workCharacters.workId, workId));
    if (resolvedCharacters.length > 0) {
      await tx.insert(workCharacters).values(
        resolvedCharacters.map((c) => ({
          workId,
          characterId: c.characterId,
          role: c.role,
          rawName: c.rawName,
        })),
      );
    }

    return {
      externalBookId: override.externalBookId,
      slug: override.slug,
      workId,
      path,
      facetCount: override.overrides.facetIds.length,
      factionCount: keepFactions.length,
      locationCount: resolvedLocations.length,
      characterCount: resolvedCharacters.length,
      authorCount: roster.authors.length,
      editorCount: roster.editors.length,
      unresolvedAuthorship,
      ratingSummary,
    };
  });
}

// =============================================================================
// Collections (legacy batch second-pass; edge-list based)
// =============================================================================

/**
 * Legacy collections writer — operates on the roster's flat `collections[]`
 * edge list. Used by `apply-override.ts` only. The per-book applier owns a
 * collection-scoped writer of its own (`apply-book.ts`) because per-book
 * collection ownership semantics differ (a collection file authorizes only its
 * OWN edges; a member apply never touches `work_collections`).
 */
export async function applyCollections(
  externalIdToUuid: Map<string, string>,
  roster: RosterFile,
  batchName: string,
): Promise<number> {
  const batchExternalIds = new Set(externalIdToUuid.keys());
  const inScope = roster.collections.filter(
    (c) =>
      batchExternalIds.has(c.collectionExternalId) ||
      batchExternalIds.has(c.contentExternalId),
  );

  const batchUuids = [...externalIdToUuid.values()];
  if (batchUuids.length > 0) {
    await db
      .delete(workCollections)
      .where(inArray(workCollections.collectionWorkId, batchUuids));
    await db
      .delete(workCollections)
      .where(inArray(workCollections.contentWorkId, batchUuids));
  }

  if (inScope.length === 0) return 0;

  const resolvedExternalIds = new Map(externalIdToUuid);
  const resolveWorkId = async (externalBookId: string): Promise<string | null> => {
    const cached = resolvedExternalIds.get(externalBookId);
    if (cached !== undefined) return cached;
    const row = (await db
      .select({ id: works.id })
      .from(works)
      .where(eq(works.externalBookId, externalBookId))
      .limit(1)) as Array<{ id: string }>;
    const resolved = row[0]?.id ?? null;
    if (resolved !== null) resolvedExternalIds.set(externalBookId, resolved);
    return resolved;
  };

  const rows: Array<{
    collectionWorkId: string;
    contentWorkId: string;
    displayOrder: number;
    confidence: string | null;
    basis: string | null;
  }> = [];
  for (const c of inScope) {
    const collectionWorkId = await resolveWorkId(c.collectionExternalId);
    const contentWorkId = await resolveWorkId(c.contentExternalId);
    if (collectionWorkId === null || contentWorkId === null) {
      const missing = [
        collectionWorkId === null ? c.collectionExternalId : null,
        contentWorkId === null ? c.contentExternalId : null,
      ].filter((value): value is string => value !== null);
      console.warn(
        `[applyCollections] skipping unresolved external_book_id=${missing.join(",")} in batch=${batchName}`,
      );
      continue;
    }
    rows.push({
      collectionWorkId,
      contentWorkId,
      displayOrder: c.displayOrder,
      confidence: c.confidence !== null ? c.confidence.toFixed(2) : null,
      basis: c.basis,
    });
  }
  if (rows.length === 0) return 0;
  await db.insert(workCollections).values(rows);
  return rows.length;
}

// =============================================================================
// Shared loaders + count helpers
// =============================================================================

export async function loadRoster(): Promise<RosterFile> {
  const raw = await readFile(ROSTER_PATH, "utf8");
  return JSON.parse(raw) as RosterFile;
}

/** DB-side junction counts for a set of works — authoritative report numbers. */
export async function countJunctions(workIds: string[]): Promise<{
  work_facets: number;
  work_persons: number;
  work_factions: number;
  work_locations: number;
  work_characters: number;
  work_collections: number;
}> {
  const countOf = async (
    table:
      | typeof workFacets
      | typeof workPersons
      | typeof workFactions
      | typeof workLocations
      | typeof workCharacters,
  ): Promise<number> => {
    if (workIds.length === 0) return 0;
    const r = await db
      .select({ n: count() })
      .from(table)
      .where(inArray(table.workId, workIds));
    return r[0]?.n ?? 0;
  };
  return {
    work_facets: await countOf(workFacets),
    work_persons: await countOf(workPersons),
    work_factions: await countOf(workFactions),
    work_locations: await countOf(workLocations),
    work_characters: await countOf(workCharacters),
    work_collections:
      workIds.length === 0
        ? 0
        : (
            await db
              .select({ n: count() })
              .from(workCollections)
              .where(
                or(
                  inArray(workCollections.collectionWorkId, workIds),
                  inArray(workCollections.contentWorkId, workIds),
                ),
              )
          )[0]?.n ?? 0,
  };
}
