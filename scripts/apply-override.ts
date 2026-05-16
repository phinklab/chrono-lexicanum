/**
 * apply-override.ts — first active DB-write path of the Brief-058+ pipeline.
 *
 * Brief 060 (2026-05-11): the 10 books in `ssot-w40k-001` (W40K-0001..W40K-0010)
 * are written into Postgres using a Cowork-curated override file as authority for
 * the soft fields (synopsis, facetIds, factions, locations, characters, flags),
 * and `book-roster.json` (the SSOT-Excel mirror) as authority for the hard fields
 * (title, releaseYear, format, seriesHint).
 *
 * What the script does:
 *   1. Loads `manual-overrides-<batch>.json` and `book-roster.json` from
 *      `scripts/seed-data/`.
 *   2. Pre-pass: collects every distinct roster author + editor across the
 *      batch, slugifies each to a persons.id, INSERTs missing persons rows
 *      in a single block. Newly created entries are tracked for the final
 *      persons.json write.
 *   3. For each book in the batch, opens its own transaction:
 *      - UPSERT works (idempotent on `external_book_id` UNIQUE).
 *      - UPSERT bookDetails.
 *      - DELETE-then-INSERT junctions (work_facets, work_persons, work_factions,
 *        work_locations) — gives us per-row idempotency without per-row diff.
 *      - work_persons rows derived from roster.authors[]/roster.editors[]
 *        with role=author/editor and 0-based displayOrder.
 *      - Anthology edge case (authors=[] + editorialNote="various") emits a
 *        `---authorship---` marker into book_details.notes; resolver-brief
 *        will pick those up later.
 *      - Persist non-canonical surface forms (factions/locations/characters that
 *        do not resolve to reference IDs, plus any `data_conflict` flags) into
 *        `book_details.notes` between `---surfaceForms---` delimiters.
 *   4. After all books: a second pass writes `work_collections` rows. They
 *      need the works.id UUIDs of every book in the batch, so they are deferred
 *      until the per-book pass has produced an externalBookId → UUID map.
 *   5. Final atomic write of scripts/seed-data/persons.json if any persons
 *      were auto-created.
 *
 * Authority-vs-source split:
 *   - `works.synopsis`        ← override
 *   - `works.title`           ← roster
 *   - `works.releaseYear`     ← roster
 *   - `works.externalBookId`  ← roster (idempotency anchor)
 *   - `works.sourceKind`      ← const "ssot"
 *   - `works.confidence`      ← const "1.00"
 *   - `bookDetails.format`    ← roster (or override `data_conflict.suggestion`)
 *   - `bookDetails.notes`     ← surfaceForms + optional authorship JSON blocks
 *   - `bookDetails.primaryEraId` ← const "time_ending" (M41)
 *   - `bookDetails.seriesId`/`seriesIndex` ← seriesHint→reference mapping
 *   - `work_persons.*`        ← roster.authors[]/roster.editors[] (slugified)
 *
 * Anything not in the override file stays NULL. No fallback to LLM diffs.
 *
 * CLI:
 *   npm run db:apply-override -- --batch=ssot-w40k-001
 */
import { readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { resolve } from "node:path";

import { count, eq, inArray, or } from "drizzle-orm";

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
import {
  resolveCharacter,
  resolveFaction,
  resolveLocation,
} from "@/lib/resolver";
import {
  CHARACTER_ROLE_PRIORITY,
  FACTION_ROLE_PRIORITY,
  normalizeCharacterRole,
  normalizeFactionRole,
  normalizeLocationRole,
} from "@/lib/resolver/roles";
import type {
  CharacterJunctionRole,
  FactionJunctionRole,
  LocationJunctionRole,
} from "@/lib/resolver/roles";
import {
  type Alignment,
  normalizeAlignment,
} from "@/lib/seed/alignment";
import {
  decideFactionSkips,
  type ResolvedFaction as SkipResolvedFaction,
  type SkipDecision,
} from "./apply-override-skip";

const SEED_DIR = resolve(process.cwd(), "scripts", "seed-data");
const ROSTER_PATH = resolve(SEED_DIR, "book-roster.json");
const PERSONS_PATH = resolve(SEED_DIR, "persons.json");
const FACTIONS_PATH = resolve(SEED_DIR, "factions.json");
const FACTION_POLICY_PATH = resolve(SEED_DIR, "faction-policy.json");
const OVERRIDE_FILENAME_PREFIX = "manual-overrides-";

const M41_ERA_ID = "time_ending";
const BATCH_NAME_PATTERN = /^ssot-(w40k|hh)-\d{3}$/;

// Eisenhorn/Ravenor are seeded series; Bequin and The Magos have no series row
// and stay NULL until a future brief decides whether to add one.
const SERIES_BY_EXTERNAL_ID: Record<string, { id: string; index: number | null }> = {
  "W40K-0001": { id: "eisenhorn", index: 1 },
  "W40K-0002": { id: "eisenhorn", index: 2 },
  "W40K-0003": { id: "eisenhorn", index: 3 },
  "W40K-0004": { id: "eisenhorn", index: null },
  "W40K-0005": { id: "ravenor", index: 1 },
  "W40K-0006": { id: "ravenor", index: 2 },
  "W40K-0007": { id: "ravenor", index: 3 },
  "W40K-0008": { id: "ravenor", index: null },
};

// =============================================================================
// Types
// =============================================================================

interface OverrideFlag {
  kind: string;
  field?: string;
  current?: string;
  suggestion?: string;
  sources?: string[];
  reasoning?: string;
}

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
    flags: OverrideFlag[];
  };
}

interface OverrideFile {
  $schema: string;
  batch: string;
  createdBy: string;
  createdAt: string;
  model: string;
  rationale: string;
  books: OverrideBook[];
}

interface RosterBook {
  externalBookId: string;
  slug: string;
  title: string;
  authors: string[];
  editors: string[];
  editorialNote: string | null;
  releaseYear: number | null;
  format: string | null;
  seriesHint: string | null;
  sourceUrl: string | null;
  notes: string | null;
  sourceRow: number;
}

interface RosterCollection {
  contentExternalId: string;
  collectionExternalId: string;
  displayOrder: number;
  confidence: number | null;
  basis: string | null;
}

interface RosterFile {
  schemaVersion: string;
  sourceFile: string;
  books: RosterBook[];
  collections: RosterCollection[];
}

type ApplyPath = "insert" | "update";

interface BookApplyResult {
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
}

interface AutoCreatedPerson {
  id: string;
  name: string;
  nameSort: string;
}

// Marker emitted into bookDetails.notes for anthologies where the roster says
// authors=[] + editorialNote="various". Lets the future Resolver-Brief regex-
// extract these books without scanning work_persons absences.
interface AuthorshipMarker {
  kind: "various";
  editorialNote: "various";
}

interface PersonsJsonEntry {
  id: string;
  name: string;
  nameSort: string;
  bio?: string;
  birthYear?: number;
  lexicanumUrl?: string;
  wikipediaUrl?: string;
}

// =============================================================================
// CLI
// =============================================================================

interface ParsedCliArgs {
  batch: string;
  help: boolean;
}

function parseCliArgs(argv: string[]): ParsedCliArgs {
  const { values } = parseArgs({
    args: argv,
    options: {
      batch: { type: "string" },
      help: { type: "boolean", short: "h", default: false },
    },
    strict: true,
    allowPositionals: false,
  });
  return {
    batch: String(values.batch ?? ""),
    help: Boolean(values.help),
  };
}

function printHelp(): void {
  console.log(`
apply-override.ts — write a Cowork-curated override batch into Postgres.

Usage:
  npm run db:apply-override -- --batch=ssot-w40k-001

Options:
  --batch <name>   Override batch name (matches scripts/seed-data/manual-overrides-<name>.json).
                   Must match /^ssot-(w40k|hh)-\\d{3}$/.
  -h, --help       Show this help.

Behaviour:
  - One transaction per book; idempotent on works.external_book_id.
  - Junctions are wiped and re-inserted per book (no diff).
  - Surface forms that do not resolve to reference IDs land in book_details.notes
    between ---surfaceForms--- delimiters for later resolver consumption.
  - work_collections is populated as a second pass after the per-book loop.
`);
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Slugify an author/editor display name into a snake_case persons.id.
 *
 * Rules (in order):
 *  1. NFKD normalize and strip combining diacritics (e.g. "Müller" → "Muller").
 *  2. Lower-case.
 *  3. Replace every non-[a-z0-9] run with a single underscore.
 *  4. Trim leading/trailing underscores.
 *
 * Deterministic + idempotent. Verified to reproduce all 12 existing
 * persons.json IDs from their `name` fields ("Dan Abnett" → "dan_abnett",
 * "Aaron Dembski-Bowden" → "aaron_dembski_bowden", "Graham McNeill" →
 * "graham_mcneill", etc.). Edge cases: "C.S. Goto" → "c_s_goto",
 * "O'Brien" → "o_brien".
 */
function slugifyPerson(displayName: string): string {
  // \p{Mn} = Unicode Nonspacing Mark — the combining diacritics produced by
  // NFKD decomposition ("ü" → "u" + U+0308). Stripping them yields ASCII.
  return displayName
    .normalize("NFKD")
    .replace(/\p{Mn}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Derive a Library-of-Congress style nameSort ("Lastname, Firstname rest").
 *   "Dan Abnett"           → "Abnett, Dan"
 *   "Aaron Dembski-Bowden" → "Dembski-Bowden, Aaron"
 *   "C.S. Goto"            → "Goto, C.S."
 *   "Anonymous"            → "Anonymous"   (single-token fallback)
 *
 * Single-token fallback returns the original string because the DB column
 * `persons.name_sort` is NOT NULL (src/db/schema.ts); brief 062 originally
 * suggested NULL, but the schema disallows it, so we keep the token verbatim.
 */
function deriveNameSort(displayName: string): string {
  const trimmed = displayName.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) return trimmed;
  const last = parts[parts.length - 1];
  const rest = parts.slice(0, -1).join(" ");
  return `${last}, ${rest}`;
}

function buildAuthorshipBlock(marker: AuthorshipMarker): string {
  return `---authorship---\n${JSON.stringify(marker, null, 2)}\n---/authorship---`;
}

function pickFinalFormat(roster: RosterBook, override: OverrideBook): {
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

/**
 * Resolve OverrideEntity surface forms to canonical IDs via the resolver
 * module. For factions, collapse multiple surface forms onto the same
 * canonical id and keep the highest-priority role (FACTION_ROLE_PRIORITY).
 * The retained rawName is the surface form that won the role contest —
 * giving the work_factions.raw_name audit column a deterministic value.
 */
function resolveFactions(
  input: OverrideEntity[],
): Array<{ id: string; role: FactionJunctionRole; rawName: string }> {
  const byId = new Map<string, { role: FactionJunctionRole; rawName: string }>();
  for (const f of input) {
    const r = resolveFaction(f.name);
    if (r.id === null) continue;
    const normalizedRole = normalizeFactionRole(f.role).role;
    if (normalizedRole === null) continue;
    const incomingPriority = FACTION_ROLE_PRIORITY[normalizedRole];
    const current = byId.get(r.id);
    const currentPriority = current
      ? FACTION_ROLE_PRIORITY[current.role]
      : -1;
    if (incomingPriority > currentPriority) {
      byId.set(r.id, { role: normalizedRole, rawName: f.name });
    }
  }
  return [...byId.entries()].map(([id, { role, rawName }]) => ({
    id,
    role,
    rawName,
  }));
}

/**
 * Resolve location surface forms. No role-priority table for locations today
 * — keep-first-wins on canonical-id collisions (a surface-form alias and the
 * canonical name collapsing onto the same id is the realistic case).
 */
function resolveLocations(
  input: OverrideEntity[],
): Array<{ id: string; role: LocationJunctionRole; rawName: string }> {
  const byId = new Map<string, { role: LocationJunctionRole; rawName: string }>();
  for (const l of input) {
    const r = resolveLocation(l.name);
    if (r.id === null) continue;
    const normalizedRole = normalizeLocationRole(l.role).role;
    if (normalizedRole === null) continue;
    if (!byId.has(r.id)) {
      byId.set(r.id, { role: normalizedRole, rawName: l.name });
    }
  }
  return [...byId.entries()].map(([id, { role, rawName }]) => ({
    id,
    role,
    rawName,
  }));
}

/**
 * Resolve character surface forms. Mirrors resolveFactions on the character
 * axis with CHARACTER_ROLE_PRIORITY (pov > appears > mentioned).
 */
function resolveCharacters(
  input: OverrideEntity[],
): Array<{ id: string; role: CharacterJunctionRole; rawName: string }> {
  const byId = new Map<string, { role: CharacterJunctionRole; rawName: string }>();
  for (const c of input) {
    const r = resolveCharacter(c.name);
    if (r.id === null) continue;
    const normalizedRole = normalizeCharacterRole(c.role).role;
    if (normalizedRole === null) continue;
    const incomingPriority = CHARACTER_ROLE_PRIORITY[normalizedRole];
    const current = byId.get(r.id);
    const currentPriority = current
      ? CHARACTER_ROLE_PRIORITY[current.role]
      : -1;
    if (incomingPriority > currentPriority) {
      byId.set(r.id, { role: normalizedRole, rawName: c.name });
    }
  }
  return [...byId.entries()].map(([id, { role, rawName }]) => ({
    id,
    role,
    rawName,
  }));
}

function buildSurfaceFormsBlock(
  override: OverrideBook,
  formatOverride: { from: string | null; to: string; reason: string } | null,
  skippedSurfaceForms: string[] = [],
): string {
  const factionsUnresolved = override.overrides.factions
    .filter((f) => resolveFaction(f.name).id === null)
    .map((f) => ({ name: f.name, role: f.role }));
  const locationsUnresolved = override.overrides.locations
    .filter((l) => resolveLocation(l.name).id === null)
    .map((l) => ({ name: l.name, role: l.role }));
  const charactersUnresolved = override.overrides.characters
    .filter((c) => resolveCharacter(c.name).id === null)
    .map((c) => ({ name: c.name, role: c.role }));
  const payload: Record<string, unknown> = {
    factionsUnresolved,
    locationsUnresolved,
    charactersUnresolved,
    flags: override.overrides.flags,
  };
  if (skippedSurfaceForms.length > 0) {
    payload.factionsSkippedRedundant = skippedSurfaceForms;
  }
  if (formatOverride) payload.formatOverride = formatOverride;
  const json = JSON.stringify(payload, null, 2);
  return `---surfaceForms---\n${json}\n---/surfaceForms---`;
}

function composeNotes(
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
// Apply pipeline
// =============================================================================

async function loadOverride(batch: string): Promise<OverrideFile> {
  const path = resolve(SEED_DIR, `${OVERRIDE_FILENAME_PREFIX}${batch}.json`);
  const raw = await readFile(path, "utf8");
  const parsed = JSON.parse(raw) as OverrideFile;
  if (parsed.batch !== batch) {
    throw new Error(
      `Override file batch mismatch: expected '${batch}', got '${parsed.batch}'`,
    );
  }
  return parsed;
}

async function loadRoster(): Promise<RosterFile> {
  const raw = await readFile(ROSTER_PATH, "utf8");
  return JSON.parse(raw) as RosterFile;
}

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
interface SkipContext {
  redundantIds: Set<string>;
  alignmentById: Map<string, Alignment>;
}

async function loadSkipContext(): Promise<SkipContext> {
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

async function validateFacetIds(allFacetIds: Set<string>): Promise<void> {
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

function validateEntityRoles(overrideBooks: OverrideBook[]): void {
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

/**
 * Pre-pass over the whole batch: collect every distinct author + editor name
 * string from the rosters of all books in the override, slugify each to a
 * persons.id, look up which ones already exist in DB, and INSERT the missing
 * rows as a single block.
 *
 * Returns the list of newly inserted entries (in DB insertion order) so
 * main() can append them atomically to scripts/seed-data/persons.json once
 * the per-book apply pass is done.
 *
 * Runs OUTSIDE the per-book transactions so applyBook() can rely on FK-safe
 * persons.id values when inserting work_persons rows.
 */
async function ensurePersonsExist(
  overrideBooks: OverrideBook[],
  rosterByExternalId: Map<string, RosterBook>,
): Promise<{ autoCreated: AutoCreatedPerson[]; distinct: number }> {
  // 1. Walk override books, resolve roster entry, collect author+editor names.
  // 2. Dedupe by slug — first occurrence's display string drives nameSort.
  const desiredBySlug = new Map<string, string>();
  for (const ob of overrideBooks) {
    const rb = rosterByExternalId.get(ob.externalBookId);
    if (!rb) continue; // surfaced as a hard error later in main()
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

  // 3. SELECT existing → compute missing.
  const existingRows = (await db
    .select({ id: persons.id })
    .from(persons)
    .where(inArray(persons.id, wantedSlugs))) as Array<{ id: string }>;
  const existing = new Set(existingRows.map((r) => r.id));
  const missing = wantedSlugs.filter((s) => !existing.has(s));

  if (missing.length === 0) {
    return { autoCreated: [], distinct: wantedSlugs.length };
  }

  // 4. INSERT missing as one block. nameSort is NOT NULL in the schema, so
  // single-token fallback returns the original token rather than null.
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

async function applyBook(
  override: OverrideBook,
  roster: RosterBook,
  skipCtx: SkipContext,
): Promise<BookApplyResult> {
  return await db.transaction(async (tx) => {
    const { format, formatOverride } = pickFinalFormat(roster, override);

    // Faction resolution moved ahead of buildSurfaceFormsBlock (Brief 077):
    // the skip-decision needs the resolved set to identify grand-alignment
    // junctions that are redundant given an alignment-peer sub-faction, and
    // the skipped surface forms get audited inside the surfaceForms block.
    const resolvedFactions = resolveFactions(override.overrides.factions);
    const skipDecision: SkipDecision = decideFactionSkips({
      resolved: resolvedFactions as SkipResolvedFaction[],
      original: override.overrides.factions,
      alignmentById: skipCtx.alignmentById,
      redundantIds: skipCtx.redundantIds,
      resolveFaction,
    });
    const keepFactions = skipDecision.keep as Array<{
      id: string;
      role: FactionJunctionRole;
      rawName: string;
    }>;

    const surfaceFormsBlock = buildSurfaceFormsBlock(
      override,
      formatOverride,
      skipDecision.skippedSurfaceForms,
    );

    // Authorship resolution from roster (not override). The override carries
    // soft-content authority (synopsis, facets, factions, …) but the persons
    // axis is mechanically taken from the SSOT-Excel roster mirror.
    let authorshipMarker: AuthorshipMarker | null = null;
    let unresolvedAuthorship = false;
    if (roster.authors.length === 0) {
      if (roster.editorialNote === "various") {
        authorshipMarker = { kind: "various", editorialNote: "various" };
      } else if (roster.editors.length === 0) {
        unresolvedAuthorship = true;
        console.warn(
          `[apply-override] unresolved_authorship: ${roster.externalBookId} ` +
            `(slug=${roster.slug}, row=${roster.sourceRow}, ` +
            `authors=[], editors=[], editorialNote=null)`,
        );
      }
      // else: editors-only book (curated anthology with named editors) →
      // fall through; the editor rows below carry authorship by virtue of
      // role="editor", no authorship marker emitted in this branch.
    }

    const authorshipBlock = authorshipMarker
      ? buildAuthorshipBlock(authorshipMarker)
      : null;
    const notes = composeNotes(roster.notes, surfaceFormsBlock, authorshipBlock);

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
          synopsis: override.overrides.synopsis,
          // Title and slug stay frozen on update — externalBookId is the only
          // identity anchor; renames live in the SSOT-Excel and require an
          // explicit re-import path that brief 060 does not implement.
          updatedAt: new Date(),
        })
        .where(eq(works.id, workId));
    } else {
      const inserted = (await tx
        .insert(works)
        .values({
          kind: "book",
          canonicity: "official",
          slug: override.slug,
          title: roster.title,
          synopsis: override.overrides.synopsis,
          releaseYear: roster.releaseYear ?? null,
          externalBookId: override.externalBookId,
          sourceKind: "ssot",
          confidence: "1.00",
        })
        .returning({ id: works.id })) as Array<{ id: string }>;
      workId = inserted[0].id;
    }

    const series = SERIES_BY_EXTERNAL_ID[override.externalBookId] ?? null;

    // book_details upsert via primaryKey conflict (workId is PK).
    await tx
      .insert(bookDetails)
      .values({
        workId,
        format: format as never,
        notes,
        primaryEraId: M41_ERA_ID,
        seriesId: series?.id ?? null,
        seriesIndex: series?.index ?? null,
      })
      .onConflictDoUpdate({
        target: bookDetails.workId,
        set: {
          format: format as never,
          notes,
          primaryEraId: M41_ERA_ID,
          seriesId: series?.id ?? null,
          seriesIndex: series?.index ?? null,
        },
      });

    // Junctions: delete-then-insert. work_collections is handled in a second
    // pass once every book in the batch has a UUID.
    await tx.delete(workFacets).where(eq(workFacets.workId, workId));
    if (override.overrides.facetIds.length > 0) {
      await tx.insert(workFacets).values(
        override.overrides.facetIds.map((facetValueId) => ({
          workId,
          facetValueId,
        })),
      );
    }

    // Compose work_persons rows from roster.authors + roster.editors. The
    // ensurePersonsExist() pre-pass already guaranteed every slug below has a
    // matching persons.id row in the DB.
    const personRows: Array<{
      workId: string;
      personId: string;
      role: "author" | "editor";
      displayOrder: number;
    }> = [];
    for (const [i, authorName] of roster.authors.entries()) {
      personRows.push({
        workId,
        personId: slugifyPerson(authorName),
        role: "author",
        displayOrder: i,
      });
    }
    for (const [i, editorName] of roster.editors.entries()) {
      personRows.push({
        workId,
        personId: slugifyPerson(editorName),
        role: "editor",
        displayOrder: i,
      });
    }
    await tx.delete(workPersons).where(eq(workPersons.workId, workId));
    if (personRows.length > 0) {
      await tx.insert(workPersons).values(personRows);
    }

    await tx.delete(workFactions).where(eq(workFactions.workId, workId));
    if (keepFactions.length > 0) {
      await tx.insert(workFactions).values(
        keepFactions.map((f) => ({
          workId,
          factionId: f.id,
          role: f.role,
          rawName: f.rawName,
        })),
      );
    }

    await tx.delete(workLocations).where(eq(workLocations.workId, workId));
    const resolvedLocations = resolveLocations(override.overrides.locations);
    if (resolvedLocations.length > 0) {
      await tx.insert(workLocations).values(
        resolvedLocations.map((l) => ({
          workId,
          locationId: l.id,
          role: l.role,
          rawName: l.rawName,
        })),
      );
    }

    // Brief 063 (2026-05-12): work_characters now written. Until this brief
    // the table stayed empty because no resolver existed for the character
    // axis; the resolver module + characters.json seed + character-aliases
    // unlock this insert path. Same delete-then-insert pattern as factions.
    await tx.delete(workCharacters).where(eq(workCharacters.workId, workId));
    const resolvedCharacters = resolveCharacters(override.overrides.characters);
    if (resolvedCharacters.length > 0) {
      await tx.insert(workCharacters).values(
        resolvedCharacters.map((c) => ({
          workId,
          characterId: c.id,
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
    };
  });
}

async function applyCollections(
  externalIdToUuid: Map<string, string>,
  roster: RosterFile,
  batchName: string,
): Promise<number> {
  const batchExternalIds = new Set(externalIdToUuid.keys());
  // A collection row is in scope iff at least one endpoint is inside the
  // override batch. The other endpoint may have been applied in an earlier
  // batch, so resolve misses through works.external_book_id below.
  const inScope = roster.collections.filter(
    (c) =>
      batchExternalIds.has(c.collectionExternalId) ||
      batchExternalIds.has(c.contentExternalId),
  );

  const batchUuids = [...externalIdToUuid.values()];
  // Idempotency: clear out any rows whose collection-side OR content-side UUID
  // belongs to this batch, then re-insert.
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
// Main
// =============================================================================

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }
  if (!args.batch) {
    console.error("[apply-override] --batch is required. Use --help for usage.");
    process.exit(2);
  }
  if (!BATCH_NAME_PATTERN.test(args.batch)) {
    console.error(
      `[apply-override] --batch must match ${BATCH_NAME_PATTERN}; got '${args.batch}'`,
    );
    process.exit(2);
  }

  console.log(`[apply-override] batch=${args.batch}`);
  const override = await loadOverride(args.batch);
  const roster = await loadRoster();
  const skipCtx = await loadSkipContext();

  console.log(
    `[apply-override] loaded override: ${override.books.length} books; createdBy=${override.createdBy}`,
  );
  console.log(
    `[apply-override] skip-context: ${skipCtx.redundantIds.size} redundant ids (${[...skipCtx.redundantIds].join(", ")}); ${skipCtx.alignmentById.size} factions in alignment map`,
  );

  const rosterByExternalId = new Map(roster.books.map((b) => [b.externalBookId, b]));
  const allFacetIds = new Set<string>();
  for (const b of override.books) for (const f of b.overrides.facetIds) allFacetIds.add(f);
  await validateFacetIds(allFacetIds);
  console.log(`[apply-override] validated ${allFacetIds.size} distinct facet ids`);
  validateEntityRoles(override.books);
  console.log("[apply-override] validated entity roles after normalization");

  // Pre-pass: ensure every roster author + editor exists as a persons row.
  // Runs OUTSIDE the per-book transactions so FK targets are stable when
  // applyBook() inserts work_persons.
  const { autoCreated, distinct } = await ensurePersonsExist(
    override.books,
    rosterByExternalId,
  );
  console.log(
    `[apply-override] ensurePersonsExist: ${distinct} distinct slugs in batch, ${autoCreated.length} newly created in DB`,
  );
  if (autoCreated.length > 0) {
    for (const p of autoCreated) {
      console.log(`[apply-override]   + person ${p.id} (${p.name})`);
    }
  }

  const results: BookApplyResult[] = [];
  const externalIdToUuid = new Map<string, string>();

  for (const overrideBook of override.books) {
    const rosterBook = rosterByExternalId.get(overrideBook.externalBookId);
    if (!rosterBook) {
      throw new Error(
        `Override book ${overrideBook.externalBookId} has no matching row in book-roster.json`,
      );
    }
    const result = await applyBook(overrideBook, rosterBook, skipCtx);
    externalIdToUuid.set(result.externalBookId, result.workId);
    results.push(result);
    console.log(
      `[apply-override]   ${result.externalBookId.padEnd(9)} ${result.slug.padEnd(22)} path=${result.path} facets=${result.facetCount} factions=${result.factionCount} locations=${result.locationCount} characters=${result.characterCount} authors=${result.authorCount} editors=${result.editorCount}`,
    );
  }

  const collectionsCount = await applyCollections(externalIdToUuid, roster, args.batch);
  console.log(`[apply-override] work_collections written: ${collectionsCount} rows`);

  // Summary counts straight from the DB so the report has authoritative numbers.
  const batchUuidList = [...externalIdToUuid.values()];
  const countOf = async (
    table:
      | typeof workFacets
      | typeof workPersons
      | typeof workFactions
      | typeof workLocations
      | typeof workCharacters,
  ): Promise<number> => {
    if (batchUuidList.length === 0) return 0;
    const r = await db
      .select({ n: count() })
      .from(table)
      .where(inArray(table.workId, batchUuidList));
    return r[0]?.n ?? 0;
  };
  const summary = {
    works: results.length,
    work_facets: await countOf(workFacets),
    work_persons: await countOf(workPersons),
    work_factions: await countOf(workFactions),
    work_locations: await countOf(workLocations),
    work_characters: await countOf(workCharacters),
    work_collections:
      batchUuidList.length === 0
        ? 0
        : (
            await db
              .select({ n: count() })
              .from(workCollections)
              .where(
                or(
                  inArray(workCollections.collectionWorkId, batchUuidList),
                  inArray(workCollections.contentWorkId, batchUuidList),
                ),
              )
          )[0]?.n ?? 0,
  };
  console.log(`[apply-override] DB-side counts:`, summary);

  // Atomic persons.json write: one append at the end of the run so the JSON
  // mirror stays in sync with the DB. If the run aborted mid-way, the DB has
  // more persons rows than the JSON and a maintainer can re-sync manually.
  if (autoCreated.length > 0) {
    const rawPersons = await readFile(PERSONS_PATH, "utf8");
    const existing = JSON.parse(rawPersons) as PersonsJsonEntry[];
    const merged = [
      ...existing,
      ...autoCreated.map((p) => ({ id: p.id, name: p.name, nameSort: p.nameSort })),
    ];
    await writeFile(PERSONS_PATH, JSON.stringify(merged, null, 2) + "\n", "utf8");
    console.log(
      `[apply-override] appended ${autoCreated.length} new entries to persons.json (total now ${merged.length})`,
    );
  }

  // Unresolved-authorship summary (loud, separately from the per-book log).
  const unresolved = results.filter((r) => r.unresolvedAuthorship);
  if (unresolved.length > 0) {
    console.warn(
      `[apply-override] unresolved authorship for ${unresolved.length} book(s):`,
    );
    for (const r of unresolved) {
      console.warn(`[apply-override]   ${r.externalBookId} (${r.slug})`);
    }
  }

  const inserts = results.filter((r) => r.path === "insert").length;
  const updates = results.filter((r) => r.path === "update").length;
  console.log(
    `[apply-override] done. inserts=${inserts} updates=${updates} total=${results.length}`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("[apply-override] failed:", err);
  process.exit(1);
});
