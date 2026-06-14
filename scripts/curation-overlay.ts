/**
 * curation-overlay.ts — Brief 149. Pure core for the hand-override overlay.
 *
 * THE PRECEDENCE PROBLEM (Brief 149 § Context). `scripts/apply-override.ts`
 * rebuilds `work_factions` / `work_locations` / `work_characters` per book with
 * a delete-then-insert keyed on `workId` (apply-override.ts:1010-1049): every
 * resolver wave / consolidation pass / `db:rebuild` wipes the junctions for a
 * book and re-inserts them straight from the batch file. A hand fix that merely
 * hopes to be `source_kind='manual'` does not survive that — an auto-edge it
 * removed comes back, an edge it added is wiped. So the maintainer's decisions
 * cannot live in the auto path; they must be re-asserted by a deterministic
 * TAIL that runs AFTER the auto apply/rebuild.
 *
 * THE MODEL (generalizes `apply-audiobook-narrators.ts`, Brief 105/107). The
 * audio path owns the roles narrator|co_narrator|full_cast and scopes ITS
 * delete to those roles, so it survives every re-apply. The curation overlay
 * is the same idea — a committed sidecar + scoped writes + a tail slot in
 * `db-rebuild.sh` — but it operates on the SAME roles the auto path owns, so it
 * cannot scope by role. It scopes by the exact **edge** instead: a junction row
 * is uniquely `(workId, entityId)` (that is the PK of all three junctions), so
 * the overlay does per-edge upsert (additions) and per-edge delete
 * (suppressions). Both directions, idempotent, re-applied last.
 *
 * This file is PURE: no `@/db`, no filesystem (except the pure `lintSynopsis`
 * helper, which is itself DB-free). It holds the format types, the loud
 * validator, and the two pure functions the apply path, the dry-run, the verify
 * and the precedence test all share:
 *   - `computeBookOps`  — the intended writes for one book (state-independent).
 *   - `diffBookOps`     — classify each op vs the current DB state
 *                         (change | noop). Dry-run reports it; verify passes iff
 *                         every op is already a noop; the test asserts no-op on a
 *                         second apply (idempotency).
 *
 * `final` vs `reviewQueue`: the overlay applies ONLY `final` (maintainer-decided
 * values). `reviewQueue` is carried machine-readably (proposals from the B11
 * book-reviewer / weekly-refresh) and is NEVER applied until promoted to `final`.
 *
 * Content warnings (Brief 149/150): the overlay deliberately has NO facet
 * section — it structurally cannot write `work_facets`, so it can never
 * reintroduce a `content_warning` row into the visitor UI. Facet curation, if
 * ever needed, must route through `isVisibleFacetCategory` and is out of scope.
 */
import { lintSynopsis, type BannedPattern } from "./apply-override-synopsis-lint";

// =============================================================================
// Vocabulary (matches the schema comments on work_*.role)
// =============================================================================

export const ENTITY_AXES = ["factions", "locations", "characters"] as const;
export type EntityAxis = (typeof ENTITY_AXES)[number];

/** Allowed roles per axis — the tight hand-curation vocabulary (schema.ts). */
export const AXIS_ROLES: Record<EntityAxis, ReadonlySet<string>> = {
  factions: new Set(["primary", "supporting", "antagonist"]),
  locations: new Set(["primary", "secondary", "mentioned"]),
  characters: new Set(["pov", "appears", "mentioned"]),
};

/** Hard-field fixes the overlay can write (works / book_details columns). */
export const FIELD_NAMES = ["synopsis", "format", "primaryEraId"] as const;
export type FieldName = (typeof FIELD_NAMES)[number];

export const EXTERNAL_ID_RE = /^(?:W40K|HH)-\d{4}$/;
export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const ALLOWED_BOOK_KEYS = new Set([
  "externalBookId",
  "title",
  "factions",
  "locations",
  "characters",
  "fields",
  "note",
]);

// =============================================================================
// Format types
// =============================================================================

/** Provenance carried in the sidecar only — never written to a junction row. */
export interface EdgeAdd {
  id: string;
  role: string;
  rawName?: string | null;
  sourceKind: string;
  confidence: number;
  checkedAt: string;
  note?: string;
}

export interface EdgeRemove {
  id: string;
  sourceKind: string;
  checkedAt: string;
  note: string; // a suppression must say WHY (confidence on a removal is meaningless)
}

export interface AxisOps {
  add?: EdgeAdd[];
  remove?: EdgeRemove[];
}

export interface FieldFix {
  value: string;
  sourceKind: string;
  confidence: number;
  checkedAt: string;
  note?: string;
}

export type FieldFixes = Partial<Record<FieldName, FieldFix>>;

export interface OverlayBook {
  externalBookId: string;
  title?: string;
  factions?: AxisOps;
  locations?: AxisOps;
  characters?: AxisOps;
  fields?: FieldFixes;
}

export interface OverlaySection {
  books: OverlayBook[];
}

export interface CurationOverlay {
  $schemaNote?: string;
  brief?: string;
  final: OverlaySection;
  reviewQueue?: OverlaySection;
}

/** Reference id sets — passed in so the core stays DB-free + file-free. */
export interface RefSets {
  factionIds: ReadonlySet<string>;
  locationIds: ReadonlySet<string>;
  characterIds: ReadonlySet<string>;
  eraIds: ReadonlySet<string>;
  bookFormats: ReadonlySet<string>;
}

const AXIS_TO_REF: Record<EntityAxis, keyof RefSets> = {
  factions: "factionIds",
  locations: "locationIds",
  characters: "characterIds",
};

// =============================================================================
// Validation — throws loud BEFORE any DB mutation (mirrors apply-override's
// validate* pre-passes). `final` is validated fully (reference existence,
// format enum, era id, synopsis lint) because it is applied; `reviewQueue` is
// validated structurally only — it carries proposals that may reference values
// that do not exist yet, and is never applied.
// =============================================================================

export interface ValidateOptions {
  /** Banned-pattern list for the public-synopsis guard on a synopsis field fix. */
  bannedSynopsisPatterns?: readonly BannedPattern[];
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function validateEdgeAdd(
  e: unknown,
  axis: EntityAxis,
  at: string,
  refs: RefSets,
  checkReferences: boolean,
): asserts e is EdgeAdd {
  if (!isObject(e)) throw new Error(`${at}: add entry must be an object.`);
  if (typeof e.id !== "string" || e.id.trim() === "") {
    throw new Error(`${at}: add.id is required.`);
  }
  if (typeof e.role !== "string" || !AXIS_ROLES[axis].has(e.role)) {
    throw new Error(
      `${at}: add.role "${String(e.role)}" must be one of ${[...AXIS_ROLES[axis]].join("|")}.`,
    );
  }
  if (typeof e.sourceKind !== "string" || e.sourceKind.trim() === "") {
    throw new Error(`${at}: add.sourceKind is required.`);
  }
  if (typeof e.confidence !== "number" || e.confidence < 0 || e.confidence > 1) {
    throw new Error(`${at}: add.confidence must be a number in [0,1].`);
  }
  if (typeof e.checkedAt !== "string" || !ISO_DATE_RE.test(e.checkedAt)) {
    throw new Error(`${at}: add.checkedAt must be an ISO date (YYYY-MM-DD).`);
  }
  if (checkReferences) {
    const refSet = refs[AXIS_TO_REF[axis]];
    if (!refSet.has(e.id)) {
      throw new Error(
        `${at}: add.id "${e.id}" is not a known ${axis.slice(0, -1)} reference id. ` +
          `Halt before mutation.`,
      );
    }
  }
}

function validateEdgeRemove(
  e: unknown,
  at: string,
): asserts e is EdgeRemove {
  if (!isObject(e)) throw new Error(`${at}: remove entry must be an object.`);
  if (typeof e.id !== "string" || e.id.trim() === "") {
    throw new Error(`${at}: remove.id is required.`);
  }
  if (typeof e.sourceKind !== "string" || e.sourceKind.trim() === "") {
    throw new Error(`${at}: remove.sourceKind is required.`);
  }
  if (typeof e.checkedAt !== "string" || !ISO_DATE_RE.test(e.checkedAt)) {
    throw new Error(`${at}: remove.checkedAt must be an ISO date (YYYY-MM-DD).`);
  }
  if (typeof e.note !== "string" || e.note.trim() === "") {
    throw new Error(`${at}: remove.note (reason) is required for a suppression.`);
  }
}

function validateAxis(
  axisOps: unknown,
  axis: EntityAxis,
  at: string,
  refs: RefSets,
  checkReferences: boolean,
): void {
  if (axisOps === undefined) return;
  if (!isObject(axisOps)) throw new Error(`${at}: ${axis} must be an object.`);
  const { add, remove } = axisOps as AxisOps & Record<string, unknown>;
  for (const k of Object.keys(axisOps)) {
    if (k !== "add" && k !== "remove") {
      throw new Error(`${at}: ${axis}.${k} is not a known key (use add/remove).`);
    }
  }

  const addIds = new Set<string>();
  if (add !== undefined) {
    if (!Array.isArray(add)) throw new Error(`${at}: ${axis}.add must be an array.`);
    for (const [i, e] of add.entries()) {
      validateEdgeAdd(e, axis, `${at} ${axis}.add[${i}]`, refs, checkReferences);
      if (addIds.has(e.id)) {
        throw new Error(`${at}: ${axis}.add has duplicate id "${e.id}".`);
      }
      addIds.add(e.id);
    }
  }

  const removeIds = new Set<string>();
  if (remove !== undefined) {
    if (!Array.isArray(remove)) throw new Error(`${at}: ${axis}.remove must be an array.`);
    for (const [i, e] of remove.entries()) {
      validateEdgeRemove(e, `${at} ${axis}.remove[${i}]`);
      if (removeIds.has(e.id)) {
        throw new Error(`${at}: ${axis}.remove has duplicate id "${e.id}".`);
      }
      removeIds.add(e.id);
    }
  }

  // An edge cannot be both added and removed for the same book — the intent is
  // ambiguous and the apply order would decide it silently.
  for (const id of addIds) {
    if (removeIds.has(id)) {
      throw new Error(
        `${at}: ${axis} id "${id}" appears in both add and remove — ambiguous. Halt.`,
      );
    }
  }
}

function validateFields(
  fields: unknown,
  at: string,
  refs: RefSets,
  checkReferences: boolean,
  bannedSynopsisPatterns: readonly BannedPattern[],
  externalBookId: string,
): void {
  if (fields === undefined) return;
  if (!isObject(fields)) throw new Error(`${at}: fields must be an object.`);
  for (const name of Object.keys(fields)) {
    if (!FIELD_NAMES.includes(name as FieldName)) {
      throw new Error(
        `${at}: fields.${name} is not a writable field (allowed: ${FIELD_NAMES.join("|")}).`,
      );
    }
    const fix = (fields as Record<string, unknown>)[name];
    if (!isObject(fix)) throw new Error(`${at}: fields.${name} must be an object.`);
    if (typeof fix.value !== "string" || fix.value.trim() === "") {
      throw new Error(`${at}: fields.${name}.value is required (non-empty string).`);
    }
    if (typeof fix.sourceKind !== "string" || fix.sourceKind.trim() === "") {
      throw new Error(`${at}: fields.${name}.sourceKind is required.`);
    }
    if (typeof fix.confidence !== "number" || fix.confidence < 0 || fix.confidence > 1) {
      throw new Error(`${at}: fields.${name}.confidence must be a number in [0,1].`);
    }
    if (typeof fix.checkedAt !== "string" || !ISO_DATE_RE.test(fix.checkedAt)) {
      throw new Error(`${at}: fields.${name}.checkedAt must be an ISO date.`);
    }
    if (checkReferences) {
      if (name === "format" && !refs.bookFormats.has(fix.value)) {
        throw new Error(
          `${at}: fields.format.value "${fix.value}" is not a valid book_format.`,
        );
      }
      if (name === "primaryEraId" && !refs.eraIds.has(fix.value)) {
        throw new Error(
          `${at}: fields.primaryEraId.value "${fix.value}" is not a known era id.`,
        );
      }
      if (name === "synopsis" && bannedSynopsisPatterns.length > 0) {
        const result = lintSynopsis(externalBookId, "", fix.value, bannedSynopsisPatterns);
        if (result.hits.length > 0) {
          throw new Error(
            `${at}: fields.synopsis carries ${result.hits.length} banned public-forward ` +
              `pattern(s): ${result.hits.map((h) => h.patternLabel).join(", ")}. Halt.`,
          );
        }
      }
    }
  }
}

function validateBook(
  book: unknown,
  index: number,
  refs: RefSets,
  checkReferences: boolean,
  bannedSynopsisPatterns: readonly BannedPattern[],
  seenIds: Set<string>,
  section: string,
): asserts book is OverlayBook {
  const at = `${section}.books[${index}]`;
  if (!isObject(book)) throw new Error(`${at} must be an object.`);
  for (const k of Object.keys(book)) {
    if (!ALLOWED_BOOK_KEYS.has(k)) {
      throw new Error(`${at}: unknown key "${k}" (a stray "facets" key is rejected here).`);
    }
  }
  if (typeof book.externalBookId !== "string" || !EXTERNAL_ID_RE.test(book.externalBookId)) {
    throw new Error(`${at}: externalBookId must match ${EXTERNAL_ID_RE}.`);
  }
  if (seenIds.has(book.externalBookId)) {
    throw new Error(`${at}: duplicate externalBookId "${book.externalBookId}" in ${section}.`);
  }
  seenIds.add(book.externalBookId);

  validateAxis(book.factions, "factions", at, refs, checkReferences);
  validateAxis(book.locations, "locations", at, refs, checkReferences);
  validateAxis(book.characters, "characters", at, refs, checkReferences);
  validateFields(
    book.fields,
    at,
    refs,
    checkReferences,
    bannedSynopsisPatterns,
    book.externalBookId,
  );

  // A book entry with nothing to do is almost certainly a mistake.
  const hasAny =
    book.factions !== undefined ||
    book.locations !== undefined ||
    book.characters !== undefined ||
    book.fields !== undefined;
  if (!hasAny) {
    throw new Error(`${at}: book has no factions/locations/characters/fields — empty entry.`);
  }
}

function validateSection(
  section: unknown,
  name: string,
  refs: RefSets,
  checkReferences: boolean,
  bannedSynopsisPatterns: readonly BannedPattern[],
): OverlaySection {
  if (!isObject(section)) throw new Error(`${name} must be an object.`);
  if (!Array.isArray(section.books)) throw new Error(`${name}.books must be an array.`);
  const seenIds = new Set<string>();
  for (const [i, b] of section.books.entries()) {
    validateBook(b, i, refs, checkReferences, bannedSynopsisPatterns, seenIds, name);
  }
  return { books: section.books as OverlayBook[] };
}

/**
 * Parse + structurally + semantically validate the overlay. Throws on the first
 * problem so a malformed overlay can never half-apply. `final` is validated
 * with reference existence + format/era/synopsis checks (it is applied);
 * `reviewQueue` is validated structurally only (it carries proposals).
 */
export function validateOverlay(
  raw: unknown,
  refs: RefSets,
  opts: ValidateOptions = {},
): CurationOverlay {
  const banned = opts.bannedSynopsisPatterns ?? [];
  if (!isObject(raw)) throw new Error("overlay root must be an object.");
  if (!isObject(raw.final)) throw new Error("overlay.final is required (object with books[]).");
  const final = validateSection(raw.final, "final", refs, true, banned);
  let reviewQueue: OverlaySection | undefined;
  if (raw.reviewQueue !== undefined) {
    reviewQueue = validateSection(raw.reviewQueue, "reviewQueue", refs, false, banned);
    // A book is either decided (final) or proposed (reviewQueue), never both —
    // promotion MOVES the entry. The same id in both makes "is it applied?"
    // ambiguous, so halt before any mutation.
    const finalIds = new Set(final.books.map((b) => b.externalBookId));
    for (const b of reviewQueue.books) {
      if (finalIds.has(b.externalBookId)) {
        throw new Error(
          `reviewQueue book "${b.externalBookId}" is also in final — a book is decided ` +
            `(final) or proposed (reviewQueue), not both. Halt.`,
        );
      }
    }
  }
  return {
    $schemaNote: typeof raw.$schemaNote === "string" ? raw.$schemaNote : undefined,
    brief: typeof raw.brief === "string" ? raw.brief : undefined,
    final,
    reviewQueue,
  };
}

// =============================================================================
// Ops — the intended writes for one book (state-independent, so the apply can
// run them unconditionally and stay idempotent).
// =============================================================================

export interface EdgeAddOp {
  axis: EntityAxis;
  id: string;
  role: string;
  rawName: string | null;
}
export interface EdgeRemoveOp {
  axis: EntityAxis;
  id: string;
}
export interface FieldWriteOp {
  field: FieldName;
  value: string;
}

export interface BookOps {
  externalBookId: string;
  edgeAdds: EdgeAddOp[];
  edgeRemoves: EdgeRemoveOp[];
  fieldWrites: FieldWriteOp[];
}

/** Pure: the intended writes for one `final` book. Validation must precede. */
export function computeBookOps(book: OverlayBook): BookOps {
  const edgeAdds: EdgeAddOp[] = [];
  const edgeRemoves: EdgeRemoveOp[] = [];
  for (const axis of ENTITY_AXES) {
    const ops = book[axis];
    if (!ops) continue;
    for (const a of ops.add ?? []) {
      edgeAdds.push({ axis, id: a.id, role: a.role, rawName: a.rawName ?? null });
    }
    for (const r of ops.remove ?? []) {
      edgeRemoves.push({ axis, id: r.id });
    }
  }
  const fieldWrites: FieldWriteOp[] = [];
  for (const field of FIELD_NAMES) {
    const fix = book.fields?.[field];
    if (fix) fieldWrites.push({ field, value: fix.value });
  }
  return { externalBookId: book.externalBookId, edgeAdds, edgeRemoves, fieldWrites };
}

// =============================================================================
// Diff — classify each op vs the current DB state. Dry-run prints it; verify
// passes iff every op is already a noop; the precedence test asserts the second
// apply is all-noop (idempotency).
// =============================================================================

export interface CurrentBookState {
  /** entityId -> role, per axis. Absent axis treated as empty. */
  edges: Record<EntityAxis, ReadonlyMap<string, string>>;
  fields: { synopsis?: string | null; format?: string | null; primaryEraId?: string | null };
}

export type OpStatus = "change" | "noop";

export interface OpDiff {
  kind: "add" | "remove" | "field";
  status: OpStatus;
  label: string;
}

export interface BookDiff {
  externalBookId: string;
  diffs: OpDiff[];
  changes: number;
  noops: number;
  satisfied: boolean; // true iff every op is a noop (the verify post-condition)
}

export function diffBookOps(ops: BookOps, current: CurrentBookState): BookDiff {
  const diffs: OpDiff[] = [];

  for (const a of ops.edgeAdds) {
    const role = current.edges[a.axis].get(a.id);
    const status: OpStatus = role === a.role ? "noop" : "change";
    diffs.push({
      kind: "add",
      status,
      label: `+${a.axis}:${a.id}=${a.role}${role === undefined ? " (insert)" : role === a.role ? "" : ` (was ${role})`}`,
    });
  }
  for (const r of ops.edgeRemoves) {
    const present = current.edges[r.axis].has(r.id);
    diffs.push({
      kind: "remove",
      status: present ? "change" : "noop",
      label: `-${r.axis}:${r.id}${present ? " (delete)" : " (already absent)"}`,
    });
  }
  for (const f of ops.fieldWrites) {
    const cur = current.fields[f.field] ?? null;
    const status: OpStatus = cur === f.value ? "noop" : "change";
    diffs.push({
      kind: "field",
      status,
      label: `~${f.field}="${f.value}"${cur === f.value ? "" : ` (was ${cur === null ? "∅" : `"${cur}"`})`}`,
    });
  }

  const changes = diffs.filter((d) => d.status === "change").length;
  const noops = diffs.length - changes;
  return {
    externalBookId: ops.externalBookId,
    diffs,
    changes,
    noops,
    satisfied: changes === 0,
  };
}

// =============================================================================
// Run-result gate — the single "is this run OK?" rule, shared by apply, dry-run
// and verify so it lives in one DB-free, tested place.
// =============================================================================

/**
 * A run is OK iff:
 *   (a) when verifying, every op was already satisfied (`verifyOk`), AND
 *   (b) no `final` book went unresolved (`unresolvedCount === 0`).
 *
 * An unresolved final book is a typo'd `externalBookId` — always an error, in
 * EVERY mode (apply, dry-run, verify), so a dry-run surfaces it before the apply
 * ever mutates anything.
 */
export function isRunOk(verify: boolean, verifyOk: boolean, unresolvedCount: number): boolean {
  return (verify ? verifyOk : true) && unresolvedCount === 0;
}
