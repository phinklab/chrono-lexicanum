/**
 * contract.ts — Brief 154 (B11 book-reviewer). The machine-readable Finding
 * Contract the driver validates every finder/verifier batch against, plus the
 * two pure transforms the brief pins as their own concerns:
 *
 *   - Role-Fix (Brief 154 § "Rollen-Vokabular gepinnt"): `toOverlayRole` maps a
 *     finder's free-text role onto the overlay's tight per-axis vocabulary
 *     (`AXIS_ROLES`). Because an overlay `add` is "ensure edge WITH role", a
 *     wrong *existing* role is its own finding type (`roleFix`), emitted as an
 *     `add` that upserts the corrected role — see sidecar.ts. The mapping is
 *     EXPLICIT here (not buried in the sidecar) and unit-tested
 *     (`background`-faction → `supporting`, `supporting`-character → `appears`).
 *
 *   - Unresolved sentinel (Brief 154 § "Unaufgelöste Addition"): a proposed
 *     addition whose surface form the alias index cannot crystallize gets a
 *     GUARANTEED-non-canonical id `__unresolved__:<axis>:<slug>` so it can sit
 *     in `reviewQueue` (never reference-checked) yet can NEVER slip into `final`
 *     (the final validator rejects an unknown id — promotion fails loud).
 *
 * PURE: zod + the resolver's role normalizers + the overlay's `AXIS_ROLES`.
 * No DB, no filesystem.
 */
import { z } from "zod";
import {
  normalizeCharacterRole,
  normalizeFactionRole,
  normalizeLocationRole,
} from "@/lib/resolver/roles";
import { AXIS_ROLES, type EntityAxis } from "../curation-overlay";

// =============================================================================
// Finder output — what a finder subsession writes for one batch.
// =============================================================================

/** An addition: emitted as a SURFACE FORM (the driver resolves it). */
const AddFinding = z
  .object({
    name: z.string().min(1),
    role: z.string().min(1),
    confidence: z.number().min(0).max(1),
    rationale: z.string().min(1),
  })
  .strict();

/** A suppression: references a canonical id already on the book (from the projection). */
const RemoveFinding = z
  .object({
    id: z.string().min(1),
    rationale: z.string().min(1),
  })
  .strict();

/** A role correction: the edge exists but with the wrong role (its own finding type). */
const RoleFixFinding = z
  .object({
    id: z.string().min(1),
    currentRole: z.string().min(1),
    proposedRole: z.string().min(1),
    confidence: z.number().min(0).max(1),
    rationale: z.string().min(1),
  })
  .strict();

/** A facet correction: references a facet-value id (facets carry no role). */
const FacetFinding = z
  .object({
    id: z.string().min(1),
    confidence: z.number().min(0).max(1),
    rationale: z.string().min(1),
  })
  .strict();

const AxisFindings = z
  .object({
    add: z.array(AddFinding).optional(),
    remove: z.array(RemoveFinding).optional(),
    roleFix: z.array(RoleFixFinding).optional(),
  })
  .strict();

const FacetFindings = z
  .object({
    add: z.array(FacetFinding).optional(),
    remove: z.array(FacetFinding).optional(),
  })
  .strict();

/** One book's findings. Every dimension optional; empty = "the book is correct". */
export const BookFindingsSchema = z
  .object({
    factions: AxisFindings.optional(),
    locations: AxisFindings.optional(),
    characters: AxisFindings.optional(),
    facets: FacetFindings.optional(),
  })
  .strict();

/** A finder batch: an object keyed by externalBookId. */
export const FinderBatchSchema = z.record(z.string(), BookFindingsSchema);

export type BookFindings = z.infer<typeof BookFindingsSchema>;
export type FinderBatch = z.infer<typeof FinderBatchSchema>;

// =============================================================================
// Verifier output — one verdict per enumerated finding (keyed by index).
// =============================================================================

export const VerdictSchema = z
  .object({
    verdict: z.enum(["confirm", "refute"]),
    reason: z.string().min(1),
  })
  .strict();

/** A verifier batch: `{ "0": {verdict,reason}, "1": {...}, ... }`. */
export const VerifierBatchSchema = z.record(z.string(), VerdictSchema);

export type Verdict = z.infer<typeof VerdictSchema>;
export type VerifierBatch = z.infer<typeof VerifierBatchSchema>;

// =============================================================================
// Flattened findings — the deterministic enumeration the verifier addresses
// and the merge consumes.
// =============================================================================

export type FindingDimension = "factions" | "locations" | "characters" | "facets";
export type FindingOp = "add" | "remove" | "roleFix";

export interface FlatFinding {
  /** Stable semantic key (book#dimension#op#idOrName) — dedupe + audit. */
  key: string;
  externalBookId: string;
  dimension: FindingDimension;
  op: FindingOp;
  /** add: the surface form to resolve. */
  name?: string;
  /** remove / roleFix / facet: the canonical (or facet) id already on the book. */
  id?: string;
  /** add: the finder's proposed role (free text → overlay vocab at merge). */
  role?: string;
  /** roleFix: the role the projection currently shows. */
  currentRole?: string;
  /** roleFix: the corrected role the finder proposes. */
  proposedRole?: string;
  /** add / roleFix / facet: the finder's certainty (removes carry none). */
  confidence?: number;
  rationale: string;
}

const ENTITY_DIMENSIONS = ["factions", "locations", "characters"] as const;

/**
 * Flatten one batch's findings into a deterministically-ordered list. Order is
 * (book asc, dimension fixed, op fixed, id/name asc) so the verifier input,
 * the verdict indices and resume are all stable across runs.
 */
export function flattenFindings(
  batch: FinderBatch,
  bookOrder: readonly string[],
): FlatFinding[] {
  const out: FlatFinding[] = [];
  const push = (f: Omit<FlatFinding, "key">): void => {
    out.push({ ...f, key: `${f.externalBookId}#${f.dimension}#${f.op}#${f.id ?? f.name ?? ""}` });
  };
  // bookOrder fixes the outer sort; any book in the batch not listed is appended
  // in lexical order so nothing is silently dropped.
  const ordered = [
    ...bookOrder.filter((id) => id in batch),
    ...Object.keys(batch).filter((id) => !bookOrder.includes(id)).sort(),
  ];
  for (const externalBookId of ordered) {
    const book = batch[externalBookId];
    for (const dimension of ENTITY_DIMENSIONS) {
      const axis = book[dimension];
      if (!axis) continue;
      for (const a of [...(axis.add ?? [])].sort((x, y) => x.name.localeCompare(y.name))) {
        push({ externalBookId, dimension, op: "add", name: a.name, role: a.role, confidence: a.confidence, rationale: a.rationale });
      }
      for (const r of [...(axis.remove ?? [])].sort((x, y) => x.id.localeCompare(y.id))) {
        push({ externalBookId, dimension, op: "remove", id: r.id, rationale: r.rationale });
      }
      for (const rf of [...(axis.roleFix ?? [])].sort((x, y) => x.id.localeCompare(y.id))) {
        push({
          externalBookId,
          dimension,
          op: "roleFix",
          id: rf.id,
          currentRole: rf.currentRole,
          proposedRole: rf.proposedRole,
          confidence: rf.confidence,
          rationale: rf.rationale,
        });
      }
    }
    if (book.facets) {
      for (const a of [...(book.facets.add ?? [])].sort((x, y) => x.id.localeCompare(y.id))) {
        push({ externalBookId, dimension: "facets", op: "add", id: a.id, confidence: a.confidence, rationale: a.rationale });
      }
      for (const r of [...(book.facets.remove ?? [])].sort((x, y) => x.id.localeCompare(y.id))) {
        push({ externalBookId, dimension: "facets", op: "remove", id: r.id, confidence: r.confidence, rationale: r.rationale });
      }
    }
  }
  return out;
}

// =============================================================================
// Role-Fix — map a finder role onto the overlay's per-axis vocabulary.
// =============================================================================

/**
 * Map a free-text role onto the overlay-`add` vocabulary (`AXIS_ROLES[axis]`).
 * Reuses the resolver's role normalizers (single source of truth), then closes
 * the one gap the overlay vocabulary is tighter on: factions allow no
 * `background`, so a normalized `background` collapses to `supporting`.
 *
 * Throws on a role the normalizers don't recognize (garbage from the model) so
 * the driver drops/flags it rather than emitting an invalid edge.
 */
export function toOverlayRole(
  axis: EntityAxis,
  raw: string,
): { role: string; changed: boolean } {
  let role: string;
  if (axis === "factions") {
    const n = normalizeFactionRole(raw).role; // primary|supporting|antagonist|background
    role = n === "background" ? "supporting" : n; // overlay AXIS_ROLES.factions has no 'background'
  } else if (axis === "locations") {
    role = normalizeLocationRole(raw).role; // primary|secondary|mentioned == AXIS_ROLES.locations
  } else {
    role = normalizeCharacterRole(raw).role; // pov|appears|mentioned == AXIS_ROLES.characters
  }
  if (!AXIS_ROLES[axis].has(role)) {
    // Unreachable unless a normalizer drifts from AXIS_ROLES — guard loudly.
    throw new Error(
      `toOverlayRole(${axis}, "${raw}") produced "${role}" which is not in ${[...AXIS_ROLES[axis]].join("|")}.`,
    );
  }
  return { role, changed: role !== raw.trim() };
}

// =============================================================================
// Unresolved sentinel — guaranteed non-canonical, axis-namespaced.
// =============================================================================

/** Map a finding dimension to the resolver's singular axis name. */
export function singularAxis(dimension: "factions" | "locations" | "characters"): string {
  return dimension.slice(0, -1); // factions→faction, locations→location, characters→character
}

/** `__unresolved__:<axis>:<slug>` — never a real reference id (promotion to `final` fails loud). */
export function sentinelId(axis: string, rawName: string): string {
  const slug = rawName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `__unresolved__:${axis}:${slug || "x"}`;
}

/** True for any id minted by `sentinelId` — used to count/flag unresolved proposals. */
export function isSentinelId(id: string): boolean {
  return id.startsWith("__unresolved__:");
}
