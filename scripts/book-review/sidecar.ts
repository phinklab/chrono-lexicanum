/**
 * sidecar.ts — Brief 154 (B11). Turn confirmed findings into committed PROPOSAL
 * files, never truth:
 *
 *   - `book-review-queue.json` — an overlay-shaped sidecar (`final` empty,
 *     proposals in `reviewQueue`) the reviewer OWNS. It never touches the
 *     maintainer's `curation-overlay.json`; a later hand/Codex step promotes
 *     entries. Faction/junction findings only.
 *   - `facet-review-queue.json` — a separate, apply-path-FREE notes file. Facets
 *     cannot enter the overlay (Brief 149/150), so they are pure maintainer
 *     notes; this file is wired into no apply/rebuild path.
 *
 * Guardrails the brief pins:
 *   - LOUD merge conflict (Brief 154): a confirmed `add` and a confirmed
 *     `remove` on the same axis+id+book (or two adds with different roles) is a
 *     ledger conflict → BOTH sides are withheld from the queue (never silently
 *     resolved) and reported for manual reconcile, non-blocking (one bad book
 *     must not abort the whole run).
 *   - Real-overlay cross-validation (Brief 154): a sidecar book may not collide
 *     with the real `final` (W40K-0010) — those findings route to a
 *     conflicts-with-final report instead — and must merge cleanly into the
 *     existing `reviewQueue` (W40K-0001) via `mergeIntoOverlay` (deterministic,
 *     union per axis, loud on conflict). The test asserts the merged overlay
 *     passes the real `validateOverlay`.
 *   - Unresolved additions get the `__unresolved__:<axis>:<slug>` sentinel.
 */
import { readFile } from "node:fs/promises";
import { resolve as resolvePath } from "node:path";
import {
  resolveCharacter,
  resolveFaction,
  resolveLocation,
} from "@/lib/resolver";
import { bookFormat } from "@/db/schema";
import {
  ENTITY_AXES,
  type AxisOps,
  type CurationOverlay,
  type EdgeAdd,
  type EdgeRemove,
  type EntityAxis,
  type OverlayBook,
  type RefSets,
} from "../curation-overlay";
import {
  isSentinelId,
  sentinelId,
  singularAxis,
  toOverlayRole,
  type FlatFinding,
} from "./contract";

const SEED_DIR = resolvePath(process.cwd(), "scripts", "seed-data");
export const REVIEWER_SOURCE_KIND = "reviewer-b11";
const DEFAULT_CONFIDENCE = 0.5;

// =============================================================================
// Facet queue (notes only — no apply path).
// =============================================================================

export interface FacetQueueItem {
  id: string;
  label: string;
  category: string;
  visible: boolean;
  /** false when the id is not in the facet catalog (a maintainer note). */
  known: boolean;
  confidence?: number;
  checkedAt: string;
  note: string;
}
export interface FacetQueueEntry {
  externalBookId: string;
  facets: { add?: FacetQueueItem[]; remove?: FacetQueueItem[] };
}
export interface FacetQueueFile {
  $note: string;
  brief: string;
  books: FacetQueueEntry[];
}

export interface FacetInfo {
  facetCategoryById: Map<string, string>;
  facetLabelById: Map<string, string>;
}

// =============================================================================
// Conflict + result types.
// =============================================================================

export interface LedgerConflict {
  externalBookId: string;
  axis: EntityAxis;
  id: string;
  detail: string;
}
export class LedgerConflictError extends Error {
  constructor(public readonly conflicts: LedgerConflict[]) {
    super(
      `book-review merge aborted: ${conflicts.length} ledger conflict(s) ` +
        `(confirmed add + remove, or add with two roles, on the same axis+id+book):\n` +
        conflicts.map((c) => `  ${c.externalBookId} ${c.axis}:${c.id} — ${c.detail}`).join("\n"),
    );
    this.name = "LedgerConflictError";
  }
}

export interface FinalCollision {
  externalBookId: string;
  dimension: string;
  op: string;
  id?: string;
  name?: string;
  note: string;
}

export interface SidecarResult {
  sidecar: CurationOverlay;
  facetQueue: FacetQueueFile;
  /** f/l/c findings for books already decided in real `final` — manual reconcile. */
  conflictsWithFinal: FinalCollision[];
  /**
   * Confirmed add+remove (or add-with-two-roles) on the same axis+id+book.
   * LOUD but non-blocking: BOTH sides are withheld from the queue (never silently
   * half-applied) and reported here for manual reconcile — one contradictory book
   * must not block the rest of the run.
   */
  ledgerConflicts: LedgerConflict[];
  /** count of additions that resolved to an `__unresolved__:` sentinel. */
  unresolvedCount: number;
}

// =============================================================================
// Resolution — surface form → canonical id, or namespaced sentinel.
// =============================================================================

function resolveAdd(
  dimension: "factions" | "locations" | "characters",
  name: string,
): { id: string; unresolved: boolean } {
  const r =
    dimension === "factions"
      ? resolveFaction(name)
      : dimension === "locations"
        ? resolveLocation(name)
        : resolveCharacter(name);
  if (r.id) return { id: r.id, unresolved: false };
  return { id: sentinelId(singularAxis(dimension), name), unresolved: true };
}

// =============================================================================
// Build the sidecar + facet queue from confirmed findings.
// =============================================================================

/** Per-book, per-axis ledger that turns confirmed findings into edge ops + flags conflicts. */
interface AxisLedger {
  add: Map<string, EdgeAdd>;
  remove: Map<string, EdgeRemove>;
  /** ids that hit a conflict — both sides purged, further ops on the id withheld. */
  conflicted: Set<string>;
}

export function buildSidecar(
  confirmed: readonly FlatFinding[],
  realOverlay: CurationOverlay,
  facetInfo: FacetInfo,
  checkedAt: string,
): SidecarResult {
  const finalIds = new Set(realOverlay.final.books.map((b) => b.externalBookId));
  const conflicts: LedgerConflict[] = [];
  const conflictsWithFinal: FinalCollision[] = [];
  let unresolvedCount = 0;

  // book → axis → ledger
  const ledgers = new Map<string, Record<EntityAxis, AxisLedger>>();
  const facetByBook = new Map<string, FacetQueueEntry>();

  const ensureLedger = (book: string): Record<EntityAxis, AxisLedger> => {
    let l = ledgers.get(book);
    if (!l) {
      l = {
        factions: { add: new Map(), remove: new Map(), conflicted: new Set() },
        locations: { add: new Map(), remove: new Map(), conflicted: new Set() },
        characters: { add: new Map(), remove: new Map(), conflicted: new Set() },
      };
      ledgers.set(book, l);
    }
    return l;
  };

  const pushAdd = (book: string, axis: EntityAxis, edge: EdgeAdd): void => {
    const led = ensureLedger(book)[axis];
    if (led.conflicted.has(edge.id)) return; // already withheld
    if (led.remove.has(edge.id)) {
      conflicts.push({ externalBookId: book, axis, id: edge.id, detail: "confirmed add + confirmed remove" });
      led.remove.delete(edge.id); // withhold BOTH sides, never half-apply
      led.conflicted.add(edge.id);
      return;
    }
    const existing = led.add.get(edge.id);
    if (existing && existing.role !== edge.role) {
      conflicts.push({ externalBookId: book, axis, id: edge.id, detail: `add with two roles (${existing.role} vs ${edge.role})` });
      led.add.delete(edge.id); // withhold the contradictory add entirely
      led.conflicted.add(edge.id);
      return;
    }
    led.add.set(edge.id, edge); // same-role duplicate collapses (idempotent)
  };

  const pushRemove = (book: string, axis: EntityAxis, edge: EdgeRemove): void => {
    const led = ensureLedger(book)[axis];
    if (led.conflicted.has(edge.id)) return; // already withheld
    if (led.add.has(edge.id)) {
      conflicts.push({ externalBookId: book, axis, id: edge.id, detail: "confirmed remove + confirmed add" });
      led.add.delete(edge.id); // withhold BOTH sides, never half-apply
      led.conflicted.add(edge.id);
      return;
    }
    led.remove.set(edge.id, edge); // duplicate remove collapses
  };

  for (const f of confirmed) {
    if (f.dimension === "facets") {
      const id = f.id ?? "";
      const category = facetInfo.facetCategoryById.get(id) ?? "unknown";
      const item: FacetQueueItem = {
        id,
        label: facetInfo.facetLabelById.get(id) ?? id,
        category,
        visible: category !== "content_warning",
        known: facetInfo.facetCategoryById.has(id),
        confidence: f.confidence,
        checkedAt,
        note: f.rationale,
      };
      let entry = facetByBook.get(f.externalBookId);
      if (!entry) {
        entry = { externalBookId: f.externalBookId, facets: {} };
        facetByBook.set(f.externalBookId, entry);
      }
      const bucket = f.op === "remove" ? "remove" : "add";
      (entry.facets[bucket] ??= []).push(item);
      continue;
    }

    // f/l/c: a book already in real `final` cannot also be a reviewQueue book.
    if (finalIds.has(f.externalBookId)) {
      conflictsWithFinal.push({
        externalBookId: f.externalBookId,
        dimension: f.dimension,
        op: f.op,
        id: f.id,
        name: f.name,
        note: f.rationale,
      });
      continue;
    }

    const axis = f.dimension as EntityAxis;
    if (f.op === "remove") {
      pushRemove(f.externalBookId, axis, {
        id: f.id!,
        sourceKind: REVIEWER_SOURCE_KIND,
        checkedAt,
        note: f.rationale,
      });
    } else if (f.op === "roleFix") {
      // A wrong existing role is an `add` that upserts the corrected role.
      const { role } = toOverlayRole(axis, f.proposedRole!);
      pushAdd(f.externalBookId, axis, {
        id: f.id!,
        role,
        rawName: null,
        sourceKind: REVIEWER_SOURCE_KIND,
        confidence: f.confidence ?? DEFAULT_CONFIDENCE,
        checkedAt,
        note: `role-fix ${f.currentRole}→${role}: ${f.rationale}`,
      });
    } else {
      // add (surface form → canonical id or sentinel)
      const { id, unresolved } = resolveAdd(f.dimension, f.name!);
      if (unresolved) unresolvedCount += 1;
      const { role } = toOverlayRole(axis, f.role!);
      pushAdd(f.externalBookId, axis, {
        id,
        role,
        rawName: f.name!,
        sourceKind: REVIEWER_SOURCE_KIND,
        confidence: f.confidence ?? DEFAULT_CONFIDENCE,
        checkedAt,
        note: unresolved ? `UNRESOLVED surface form — needs a canonical id before promotion. ${f.rationale}` : f.rationale,
      });
    }
  }

  // Ledger conflicts are NOT thrown: both sides were already withheld above, so
  // the queue is contradiction-free; the conflicts ride out in the result for the
  // merge to report (manual reconcile). One bad book never blocks the run.

  // Assemble reviewQueue books (deterministic order + sorted edges).
  const reviewBooks: OverlayBook[] = [];
  for (const externalBookId of [...ledgers.keys()].sort()) {
    const led = ledgers.get(externalBookId)!;
    const book: OverlayBook = { externalBookId };
    for (const axis of ENTITY_AXES) {
      const ops: AxisOps = {};
      const adds = [...led[axis].add.values()].sort((a, b) => a.id.localeCompare(b.id));
      const removes = [...led[axis].remove.values()].sort((a, b) => a.id.localeCompare(b.id));
      if (adds.length) ops.add = adds;
      if (removes.length) ops.remove = removes;
      if (adds.length || removes.length) book[axis] = ops;
    }
    reviewBooks.push(book);
  }

  const sidecar: CurationOverlay = {
    $schemaNote:
      "Brief 154 — B11 book-reviewer PROPOSALS. `final` is intentionally empty " +
      "(the reviewer applies nothing); every entry sits in `reviewQueue` awaiting " +
      "hand/Codex promotion into curation-overlay.json. Never applied.",
    brief: "154",
    final: { books: [] },
    reviewQueue: { books: reviewBooks },
  };

  const facetQueue: FacetQueueFile = {
    $note:
      "Brief 154 — B11 facet PROPOSALS. NOTES ONLY: no apply script reads this " +
      "file; it is wired into no curation-overlay apply, db:rebuild, or DB write. " +
      "Facets never re-enter the visitor UI via this path (Brief 149/150).",
    brief: "154",
    books: [...facetByBook.keys()].sort().map((id) => facetByBook.get(id)!),
  };

  return { sidecar, facetQueue, conflictsWithFinal, ledgerConflicts: conflicts, unresolvedCount };
}

// =============================================================================
// Deterministic merge into the real overlay — the promotion/cross-validation path.
// =============================================================================

function mergeAxisOps(a: AxisOps | undefined, b: AxisOps | undefined, where: string): AxisOps {
  const addById = new Map<string, EdgeAdd>();
  for (const e of [...(a?.add ?? []), ...(b?.add ?? [])]) addById.set(e.id, e);
  const removeById = new Map<string, EdgeRemove>();
  for (const e of [...(a?.remove ?? []), ...(b?.remove ?? [])]) removeById.set(e.id, e);
  for (const id of addById.keys()) {
    if (removeById.has(id)) {
      throw new Error(`mergeIntoOverlay: ${where} id "${id}" appears in both add and remove — ambiguous, halt.`);
    }
  }
  const out: AxisOps = {};
  if (addById.size) out.add = [...addById.values()].sort((x, y) => x.id.localeCompare(y.id));
  if (removeById.size) out.remove = [...removeById.values()].sort((x, y) => x.id.localeCompare(y.id));
  return out;
}

/**
 * Fold the sidecar's `reviewQueue` proposals into a copy of the real overlay —
 * the deterministic shape a maintainer promotion would take, and the subject of
 * the cross-validation test. Unions a same-id reviewQueue entry per axis; throws
 * loud if a sidecar book collides with real `final`.
 */
export function mergeIntoOverlay(real: CurationOverlay, sidecar: CurationOverlay): CurationOverlay {
  const finalIds = new Set(real.final.books.map((b) => b.externalBookId));
  const queue = new Map<string, OverlayBook>();
  for (const b of real.reviewQueue?.books ?? []) queue.set(b.externalBookId, b);

  for (const proposal of sidecar.reviewQueue?.books ?? []) {
    if (finalIds.has(proposal.externalBookId)) {
      throw new Error(
        `mergeIntoOverlay: sidecar book "${proposal.externalBookId}" is also in real final — ` +
          `the sidecar builder must route final-book findings to conflictsWithFinal.`,
      );
    }
    const existing = queue.get(proposal.externalBookId);
    if (!existing) {
      queue.set(proposal.externalBookId, proposal);
      continue;
    }
    const merged: OverlayBook = { externalBookId: proposal.externalBookId, title: existing.title };
    for (const axis of ENTITY_AXES) {
      const ops = mergeAxisOps(existing[axis], proposal[axis], `${proposal.externalBookId} ${axis}`);
      if (ops.add || ops.remove) merged[axis] = ops;
    }
    if (existing.fields) merged.fields = existing.fields;
    queue.set(proposal.externalBookId, merged);
  }

  return {
    $schemaNote: real.$schemaNote,
    brief: real.brief,
    final: real.final,
    reviewQueue: { books: [...queue.keys()].sort().map((id) => queue.get(id)!) },
  };
}

// =============================================================================
// DB-free RefSets — for validateOverlay in the merge gate + the cross-val test.
// =============================================================================

async function readJsonArray<T>(name: string): Promise<T[]> {
  return JSON.parse(await readFile(resolvePath(SEED_DIR, name), "utf8")) as T[];
}

/** Build reference id sets from committed seed files — no DB. */
export async function loadRefSets(): Promise<RefSets> {
  const [factions, locations, characters, eras] = await Promise.all([
    readJsonArray<{ id: string }>("factions.json"),
    readJsonArray<{ id: string }>("locations.json"),
    readJsonArray<{ id: string }>("characters.json"),
    readJsonArray<{ id: string }>("eras.json"),
  ]);
  return {
    factionIds: new Set(factions.map((f) => f.id)),
    locationIds: new Set(locations.map((l) => l.id)),
    characterIds: new Set(characters.map((c) => c.id)),
    eraIds: new Set(eras.map((e) => e.id)),
    bookFormats: new Set<string>(bookFormat.enumValues),
  };
}

/** Count sidecar reviewQueue additions that carry a sentinel id. */
export function countSentinels(sidecar: CurationOverlay): number {
  let n = 0;
  for (const b of sidecar.reviewQueue?.books ?? []) {
    for (const axis of ENTITY_AXES) {
      for (const a of b[axis]?.add ?? []) if (isSentinelId(a.id)) n += 1;
    }
  }
  return n;
}
