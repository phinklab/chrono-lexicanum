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

/** Parse a sentinel id back into its axis + slug (null if not a sentinel). */
export function parseSentinelId(
  id: string,
): { axis: "faction" | "location" | "character"; slug: string } | null {
  const m = /^__unresolved__:(faction|location|character):(.+)$/.exec(id);
  if (!m) return null;
  return { axis: m[1] as "faction" | "location" | "character", slug: m[2]! };
}

// =============================================================================
// Stage 3 (Brief 155) — Web-enrichment proposal contract.
//
// The B11 finder/verifier above decided WHETHER a structural entity belongs to a
// book (synopsis-only). Stage 3 takes each confirmed `__unresolved__:faction|
// location:` sentinel and ENRICHES it to a full catalog entry via web lookup:
// the fields a Map pin / Ask ranking needs that no synopsis carries (faction
// alignment+parent+tone; location sector+gx/gy+tags). Every result is a READ-ONLY
// proposal with cited sources + confidence; materialization is a hand-gate.
//
// Three decisions per sentinel:
//   - new       — a real, canonically-identified entity that is NOT in the
//                 catalog → propose it with its enriched fields.
//   - alias     — the entity already EXISTS (the sentinel was only an
//                 unaliased surface form) → propose a `rawName → existing id`
//                 alias instead of a duplicate entity.
//   - unresolved — no credible wiki hit (or existence refuted) → the sentinel
//                 stays `__unresolved__`; fields blank, never guessed.
// =============================================================================

/** The two structural axes the enrichment pass covers (characters are out of scope). */
export type EnrichAxis = "faction" | "location";

const TRUST_VALUES = ["lexicanum", "fandom", "wikipedia", "black-library", "other"] as const;

/**
 * Normalize a model-written trust label onto the controlled set. The model
 * drifts on cosmetics — "black_library" / "blacklibrary" / "Black Library" for
 * `black-library`, "wikia" for `fandom`, "Lexicanum (wh40k)" for `lexicanum`.
 * Such drift must not drop an otherwise-sound proposal; a genuinely
 * unrecognizable label conservatively collapses to `other` (lowest trust) rather
 * than failing the whole batch.
 */
function normalizeTrust(v: unknown): unknown {
  if (typeof v !== "string") return v;
  const key = v.toLowerCase().replace(/[^a-z]/g, "");
  if (key.includes("lexicanum")) return "lexicanum";
  if (key.includes("blacklibrary")) return "black-library";
  if (key.includes("fandom") || key.includes("wikia")) return "fandom";
  if (key.includes("wikipedia")) return "wikipedia";
  if ((TRUST_VALUES as readonly string[]).includes(v)) return v;
  return "other";
}

/** A cited web source + where it sits in the Brief-155 trust hierarchy. */
export const EnrichSourceSchema = z
  .object({
    url: z.string().url(),
    trust: z.preprocess(normalizeTrust, z.enum(TRUST_VALUES)),
  })
  .strict();

/**
 * Faction enrichment payload. A field is `null` when it cannot be evidenced —
 * NEVER guessed. `parent` is an existing faction id and `tone` a value from the
 * live catalog vocabulary; both are re-validated against the catalogs at merge.
 */
export const FactionEnrichmentSchema = z
  .object({
    canonicalName: z.string().min(1),
    proposedId: z.string().regex(/^[a-z0-9_]+$/, "id must be lower snake_case [a-z0-9_]"),
    parent: z.string().min(1).nullable(),
    alignment: z.enum(["imperium", "chaos", "xenos"]).nullable(),
    tone: z.string().min(1).nullable(),
    glyph: z.string().min(1).nullable(),
  })
  .strict();

/**
 * Location enrichment payload. `gx`/`gy` are populated ONLY when a canonical
 * galactic position is evidenced (`placeable: true`); otherwise null. `sector`
 * is an existing sector id (re-validated at merge). Coordinates are never guessed.
 */
export const LocationEnrichmentSchema = z
  .object({
    canonicalName: z.string().min(1),
    proposedId: z.string().regex(/^[a-z0-9_]+$/, "id must be lower snake_case [a-z0-9_]"),
    sector: z.string().min(1).nullable(),
    gx: z.number().finite().nullable(),
    gy: z.number().finite().nullable(),
    tags: z.array(z.string().min(1)),
    capital: z.boolean().nullable(),
    destroyed: z.boolean().nullable(),
    warp: z.boolean().nullable(),
    placeable: z.boolean(),
  })
  .strict();

/** One enricher decision for one sentinel. Discriminated by `decision`. */
export const EnrichmentProposalSchema = z
  .object({
    sentinelKey: z.string().min(1),
    axis: z.enum(["faction", "location"]),
    rawName: z.string().min(1),
    decision: z.enum(["new", "alias", "unresolved"]),
    faction: FactionEnrichmentSchema.optional(),
    location: LocationEnrichmentSchema.optional(),
    /** decision=alias: an EXISTING canonical id this surface form should map to. */
    aliasTo: z.string().min(1).optional(),
    sources: z.array(EnrichSourceSchema),
    confidence: z.number().min(0).max(1),
    notes: z.string().min(1),
  })
  .strict()
  .superRefine((p, ctx) => {
    if (p.faction && p.axis !== "faction")
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "`faction` payload on a non-faction axis" });
    if (p.location && p.axis !== "location")
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "`location` payload on a non-location axis" });
    if (p.decision === "new") {
      if (p.axis === "faction" && !p.faction)
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "decision=new (faction) needs a `faction` payload" });
      if (p.axis === "location" && !p.location)
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "decision=new (location) needs a `location` payload" });
      if (p.sources.length === 0)
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "decision=new needs at least one cited source" });
    }
    if (p.decision === "alias" && !p.aliasTo)
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "decision=alias needs an `aliasTo` canonical id" });
  });

/** An enricher batch: an object keyed by sentinelKey. */
export const EnricherBatchSchema = z.record(z.string(), EnrichmentProposalSchema);

export type EnrichSource = z.infer<typeof EnrichSourceSchema>;
export type FactionEnrichment = z.infer<typeof FactionEnrichmentSchema>;
export type LocationEnrichment = z.infer<typeof LocationEnrichmentSchema>;
export type EnrichmentProposal = z.infer<typeof EnrichmentProposalSchema>;
export type EnricherBatch = z.infer<typeof EnricherBatchSchema>;

/**
 * Verifier verdict per sentinel. `existence` is mandatory (is this a real,
 * canonically-identified entity?); `alignment`/`parent` are checked for factions
 * (Ask-bearing), `sector` for locations. A field whose verdict is `refute` is
 * blanked in the merged proposal. Coordinates are deliberately NOT verified
 * (fuzzy by design — sector plausibility is enough).
 */
export const EnrichVerdictSchema = z
  .object({
    existence: z.enum(["confirm", "refute"]),
    alignment: z.enum(["confirm", "refute"]).optional(),
    parent: z.enum(["confirm", "refute"]).optional(),
    sector: z.enum(["confirm", "refute"]).optional(),
    reason: z.string().min(1),
  })
  .strict();

/** A verifier batch: an object keyed by sentinelKey. */
export const EnrichVerifierBatchSchema = z.record(z.string(), EnrichVerdictSchema);

export type EnrichVerdict = z.infer<typeof EnrichVerdictSchema>;
export type EnrichVerifierBatch = z.infer<typeof EnrichVerifierBatchSchema>;
