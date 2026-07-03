/**
 * enrichment.ts — Brief 155 (B11 Stage 3). Turns the confirmed structural
 * sentinels into committed, READ-ONLY web-enrichment PROPOSALS — never truth,
 * never an apply path.
 *
 *   - WORKLIST: the distinct `__unresolved__:faction|location:` sentinels from
 *     `book-review-queue.json` (the B11 output), each with the source book(s)
 *     it appears on (title + synopsis) for disambiguation. Characters are out
 *     of scope (Brief 155).
 *   - VOCAB: the controlled values are READ from the live catalogs, not guessed
 *     — faction `alignment`/`tone` from `factions.json`, sectors from
 *     `sectors.json`. The enricher is handed these; the merge re-validates.
 *   - DEDUP (Pflicht): before a `new` entity is emitted, the surface form /
 *     canonical name / proposed id are checked against the catalogs + alias
 *     index; a hit downgrades the proposal to an `alias` of the existing id (no
 *     duplicate canonical entity).
 *   - PROPOSALS: `new-entity-proposals.json` — a read-only file wired into NO
 *     apply/rebuild/seed path. Materialization is the maintainer hand-gates
 *     F (factions) + L (locations) only.
 *
 * PURE merge (no DB): the resolver (alias index), the live catalog vocab, the
 * seed ref-id sets. The model work happens in `claude -p` subsessions the bash
 * driver spawns; this module only prepares inputs and validates/merges outputs.
 */
import { readFile } from "node:fs/promises";
import { resolve as resolvePath } from "node:path";
import { resolveFaction, resolveLocation } from "@/lib/resolver";
import {
  isSentinelId,
  parseSentinelId,
  type EnrichAxis,
  type EnrichmentProposal,
  type EnrichSource,
  type EnrichVerdict,
} from "./contract";
import { loadCorpusBooks, loadProjectionContext, projectBook } from "./projection";

const SEED_DIR = resolvePath(process.cwd(), "scripts", "seed-data");
const QUEUE_PATH = resolvePath(SEED_DIR, "book-review-queue.json");

export const ENRICH_BRIEF = "155";
export const PROPOSALS_PATH = resolvePath(SEED_DIR, "new-entity-proposals.json");

/** Bound the per-sentinel synopsis context (token discipline, Brief 155). */
const MAX_SYNOPSIS = 1400;

// =============================================================================
// Worklist — the distinct structural sentinels + their source-book context.
// =============================================================================

export interface SentinelSource {
  externalBookId: string;
  title: string;
  synopsis: string;
  role: string;
  note: string;
}
export interface SentinelWork {
  sentinelKey: string;
  axis: EnrichAxis;
  rawName: string;
  sources: SentinelSource[];
}

interface RawAddEdge {
  id?: string;
  rawName?: string;
  role?: string;
  note?: string;
}
interface QueueShape {
  reviewQueue?: {
    books?: Array<{ externalBookId: string } & Record<string, { add?: RawAddEdge[] } | unknown>>;
  };
}

/**
 * Extract the distinct faction + location sentinels from the reviewQueue, each
 * with the source book(s) it appears on (title + bounded synopsis). Deterministic
 * order (faction block, then location block; by sentinel key within each).
 */
export async function buildWorklist(): Promise<SentinelWork[]> {
  const queue = JSON.parse(await readFile(QUEUE_PATH, "utf8")) as QueueShape;
  const ctx = await loadProjectionContext();
  // Effective per-book corpus (Brief 176) — replaces the frozen batch sweep.
  const corpusBooks = loadCorpusBooks();

  const byKey = new Map<string, SentinelWork>();
  const seenSource = new Map<string, Set<string>>(); // sentinelKey → book ids already attached

  for (const book of queue.reviewQueue?.books ?? []) {
    for (const dim of ["factions", "locations"] as const) {
      const axisBucket = (book as Record<string, { add?: RawAddEdge[] }>)[dim];
      for (const e of axisBucket?.add ?? []) {
        if (!e.id || !isSentinelId(e.id)) continue;
        const parsed = parseSentinelId(e.id);
        if (!parsed || (parsed.axis !== "faction" && parsed.axis !== "location")) continue;
        const axis: EnrichAxis = parsed.axis;

        let work = byKey.get(e.id);
        if (!work) {
          work = { sentinelKey: e.id, axis, rawName: e.rawName ?? parsed.slug, sources: [] };
          byKey.set(e.id, work);
          seenSource.set(e.id, new Set());
        }
        const seen = seenSource.get(e.id)!;
        if (seen.has(book.externalBookId)) continue;
        seen.add(book.externalBookId);

        const bb = corpusBooks.get(book.externalBookId);
        const proj = bb ? projectBook(bb, ctx) : null;
        work.sources.push({
          externalBookId: book.externalBookId,
          title: proj?.title ?? book.externalBookId,
          synopsis: (proj?.synopsis ?? "").slice(0, MAX_SYNOPSIS),
          role: e.role ?? "",
          note: e.note ?? "",
        });
      }
    }
  }

  return [...byKey.values()].sort((a, b) =>
    a.axis === b.axis ? a.sentinelKey.localeCompare(b.sentinelKey) : a.axis === "faction" ? -1 : 1,
  );
}

// =============================================================================
// Controlled vocabulary — read from the live catalogs (never guessed).
// =============================================================================

export interface EnrichVocab {
  alignments: string[];
  tones: string[];
  sectors: Array<{ id: string; name: string }>;
}

export async function loadVocab(): Promise<EnrichVocab> {
  const factions = JSON.parse(
    await readFile(resolvePath(SEED_DIR, "factions.json"), "utf8"),
  ) as Array<{ alignment?: string | null; tone?: string | null }>;
  const sectors = JSON.parse(
    await readFile(resolvePath(SEED_DIR, "sectors.json"), "utf8"),
  ) as Array<{ id: string; name: string }>;
  const alignments = [...new Set(factions.map((f) => f.alignment).filter((a): a is string => !!a))].sort();
  const tones = [...new Set(factions.map((f) => f.tone).filter((t): t is string => !!t))].sort();
  return { alignments, tones, sectors: sectors.map((s) => ({ id: s.id, name: s.name })) };
}

// =============================================================================
// Dedup — does a name already crystallize to an existing canonical entity?
// =============================================================================

/**
 * Return the existing canonical id any of `names` resolves to (via the alias
 * index / direct name match), or null. Used as the deterministic backstop to
 * the enricher's own dedup: a `new` proposal whose canonical name already exists
 * is forced to an `alias`.
 */
export function findExistingId(axis: EnrichAxis, ...names: Array<string | null | undefined>): string | null {
  for (const n of names) {
    if (!n) continue;
    const r = axis === "faction" ? resolveFaction(n) : resolveLocation(n);
    if (r.id) return r.id;
  }
  return null;
}

// =============================================================================
// Merge — confirmed enrichments → the read-only proposal file + findings table.
// =============================================================================

export interface AxisStat {
  raw: number;
  newConfirmed: number;
  alias: number;
  unresolved: number;
  /** new entities missing an Ask-bearing / placement field after the guards. */
  fieldsUnproven: number;
  /** locations only: new entities with real gx/gy. */
  placed?: number;
  /** locations only: new entities with a sector but no coordinates. */
  sectorOnly?: number;
  /** locations only: new entities with neither a sector nor coordinates. */
  unplaceable?: number;
}

interface BaseEntry {
  sentinelKey: string;
  rawName: string;
  sourceBooks: string[];
  decision: "new" | "alias" | "unresolved";
  aliasTo?: string;
  verified: { existence: boolean; alignment?: boolean; parent?: boolean; sector?: boolean };
  sources: EnrichSource[];
  confidence: number;
  notes: string;
  /** merge-time provenance: which fields the deterministic guards dropped/changed. */
  adjustments: string[];
}
export interface FactionProposalEntry extends BaseEntry {
  canonicalName?: string;
  proposedId?: string;
  parent?: string | null;
  alignment?: string | null;
  tone?: string | null;
  glyph?: string | null;
}
export interface LocationProposalEntry extends BaseEntry {
  canonicalName?: string;
  proposedId?: string;
  sector?: string | null;
  gx?: number | null;
  gy?: number | null;
  tags?: string[];
  capital?: boolean | null;
  destroyed?: boolean | null;
  warp?: boolean | null;
  placeable?: boolean;
}

export interface ProposalFile {
  $note: string;
  brief: string;
  generatedAt: string;
  model: string;
  vocab: EnrichVocab;
  summary: { faction: AxisStat; location: AxisStat };
  factions: FactionProposalEntry[];
  locations: LocationProposalEntry[];
}

export interface MergeItem {
  work: SentinelWork;
  proposal: EnrichmentProposal;
  verdict: EnrichVerdict;
}
export interface MergeRefs {
  factionIds: ReadonlySet<string>;
  locationIds: ReadonlySet<string>;
}
export interface EnrichMergeResult {
  file: ProposalFile;
  stats: { faction: AxisStat; location: AxisStat };
}

const PROPOSAL_NOTE =
  "Brief 155 — B11 Stage 3 web-enrichment PROPOSALS. READ-ONLY. NO APPLY PATH: " +
  "no script, db:rebuild, seed loader, or DB write reads this file. Materialization " +
  "is the maintainer/Codex hand-gates ONLY — Gate F (factions → factions.json + " +
  "faction-aliases.json) and Gate L (locations → locations.json + location-aliases.json). " +
  "Fields are evidenced from cited web sources or left null — never guessed. The " +
  "reviewer writes proposals, never truth.";

function emptyStat(): AxisStat {
  return { raw: 0, newConfirmed: 0, alias: 0, unresolved: 0, fieldsUnproven: 0 };
}

/** Build the proposal file + stats from confirmed (enricher, verifier) pairs. */
export function buildProposals(
  items: readonly MergeItem[],
  vocab: EnrichVocab,
  refs: MergeRefs,
  model: string,
  generatedAt: string,
): EnrichMergeResult {
  const toneSet = new Set(vocab.tones);
  const sectorSet = new Set(vocab.sectors.map((s) => s.id));
  const factions: FactionProposalEntry[] = [];
  const locations: LocationProposalEntry[] = [];
  const stats = { faction: emptyStat(), location: emptyStat() };
  stats.location.placed = 0;
  stats.location.sectorOnly = 0;
  stats.location.unplaceable = 0;

  for (const { work, proposal, verdict } of items) {
    const axis = work.axis;
    const adjustments: string[] = [];
    const base: BaseEntry = {
      sentinelKey: work.sentinelKey,
      rawName: work.rawName,
      sourceBooks: work.sources.map((s) => s.externalBookId),
      decision: "unresolved",
      verified: { existence: verdict.existence === "confirm" },
      sources: proposal.sources,
      confidence: proposal.confidence,
      notes: proposal.notes,
      adjustments,
    };

    // 1. Existence refuted → stays a sentinel (no fields, never guessed).
    if (verdict.existence !== "confirm") {
      base.decision = "unresolved";
      adjustments.push(`existence refuted by verifier: ${verdict.reason}`);
      pushUnresolved(axis, base, factions, locations);
      stats[axis].raw += 1;
      stats[axis].unresolved += 1;
      continue;
    }

    // 2. Enricher said unresolved → stays a sentinel.
    if (proposal.decision === "unresolved") {
      base.decision = "unresolved";
      pushUnresolved(axis, base, factions, locations);
      stats[axis].raw += 1;
      stats[axis].unresolved += 1;
      continue;
    }

    // 3. Deterministic dedup backstop — does the entity already exist?
    const dedupId =
      findExistingId(
        axis,
        proposal.axis === "faction" ? proposal.faction?.canonicalName : proposal.location?.canonicalName,
        work.rawName,
      ) ??
      // a proposedId that collides with an existing canonical id is also a dup
      ((proposal.axis === "faction"
        ? proposal.faction && refs.factionIds.has(proposal.faction.proposedId)
          ? proposal.faction.proposedId
          : null
        : proposal.location && refs.locationIds.has(proposal.location.proposedId)
          ? proposal.location.proposedId
          : null));

    if (proposal.decision === "alias" || dedupId) {
      const aliasTo = proposal.decision === "alias" ? proposal.aliasTo! : dedupId!;
      const aliasIds = axis === "faction" ? refs.factionIds : refs.locationIds;
      if (!aliasIds.has(aliasTo)) {
        // alias points at a non-existent id → cannot trust it, keep as sentinel.
        base.decision = "unresolved";
        adjustments.push(`alias target "${aliasTo}" is not an existing ${axis} id — withheld, stays unresolved`);
        pushUnresolved(axis, base, factions, locations);
        stats[axis].raw += 1;
        stats[axis].unresolved += 1;
        continue;
      }
      if (dedupId && proposal.decision === "new") {
        adjustments.push(`dedup: enricher proposed a NEW entity but "${work.rawName}"/canonical resolves to existing id "${aliasTo}" → alias`);
      }
      base.decision = "alias";
      base.aliasTo = aliasTo;
      if (axis === "faction") factions.push({ ...base });
      else locations.push({ ...base });
      stats[axis].raw += 1;
      stats[axis].alias += 1;
      continue;
    }

    // 4. New entity — apply per-field verification + deterministic guards.
    base.decision = "new";
    if (axis === "faction") {
      const f = proposal.faction!;
      const entry: FactionProposalEntry = {
        ...base,
        canonicalName: f.canonicalName,
        proposedId: f.proposedId,
        parent: f.parent,
        alignment: f.alignment,
        tone: f.tone,
        glyph: f.glyph,
      };
      // alignment (Ask-bearing) — drop on refute.
      if (entry.alignment !== null) {
        entry.verified.alignment = verdict.alignment === "confirm";
        if (verdict.alignment === "refute") {
          adjustments.push(`alignment "${entry.alignment}" refuted → blanked`);
          entry.alignment = null;
        }
      }
      // parent (Ask-bearing) — must be an existing faction id; drop on refute.
      if (entry.parent !== null) {
        entry.verified.parent = verdict.parent === "confirm";
        if (verdict.parent === "refute") {
          adjustments.push(`parent "${entry.parent}" refuted → blanked`);
          entry.parent = null;
        } else if (!refs.factionIds.has(entry.parent!)) {
          adjustments.push(`parent "${entry.parent}" is not an existing faction id → blanked`);
          entry.parent = null;
          entry.verified.parent = false;
        }
      }
      // tone — must be in the live catalog vocabulary.
      if (entry.tone !== null && !toneSet.has(entry.tone!)) {
        adjustments.push(`tone "${entry.tone}" not in catalog vocab → blanked`);
        entry.tone = null;
      }
      factions.push(entry);
      stats.faction.raw += 1;
      stats.faction.newConfirmed += 1;
      if (entry.alignment === null || entry.parent === null) stats.faction.fieldsUnproven += 1;
    } else {
      const l = proposal.location!;
      const entry: LocationProposalEntry = {
        ...base,
        canonicalName: l.canonicalName,
        proposedId: l.proposedId,
        sector: l.sector,
        gx: l.gx,
        gy: l.gy,
        tags: l.tags,
        capital: l.capital,
        destroyed: l.destroyed,
        warp: l.warp,
        placeable: l.placeable,
      };
      // sector — must be an existing sector id; drop on refute.
      if (entry.sector !== null) {
        entry.verified.sector = verdict.sector === "confirm";
        if (verdict.sector === "refute") {
          adjustments.push(`sector "${entry.sector}" refuted → blanked`);
          entry.sector = null;
        } else if (!sectorSet.has(entry.sector!)) {
          adjustments.push(`sector "${entry.sector}" is not an existing sector id → blanked`);
          entry.sector = null;
          entry.verified.sector = false;
        }
      }
      // coordinates — only when placeable AND both are finite; never guessed.
      const hasCoords = entry.placeable === true && typeof entry.gx === "number" && typeof entry.gy === "number";
      if (!hasCoords) {
        if (entry.placeable === true && (entry.gx !== null || entry.gy !== null)) {
          adjustments.push("placeable but coordinates incomplete → coordinates dropped (sector-only)");
        }
        entry.gx = null;
        entry.gy = null;
      }
      locations.push(entry);
      stats.location.raw += 1;
      stats.location.newConfirmed += 1;
      if (hasCoords) stats.location.placed! += 1;
      else if (entry.sector !== null) stats.location.sectorOnly! += 1;
      else stats.location.unplaceable! += 1;
      if (entry.sector === null && !hasCoords) stats.location.fieldsUnproven += 1;
    }
  }

  factions.sort((a, b) => a.sentinelKey.localeCompare(b.sentinelKey));
  locations.sort((a, b) => a.sentinelKey.localeCompare(b.sentinelKey));

  const file: ProposalFile = {
    $note: PROPOSAL_NOTE,
    brief: ENRICH_BRIEF,
    generatedAt,
    model,
    vocab,
    summary: stats,
    factions,
    locations,
  };
  return { file, stats };
}

function pushUnresolved(
  axis: EnrichAxis,
  base: BaseEntry,
  factions: FactionProposalEntry[],
  locations: LocationProposalEntry[],
): void {
  if (axis === "faction") factions.push({ ...base });
  else locations.push({ ...base });
}

// =============================================================================
// Findings table (pattern 144).
// =============================================================================

export function renderEnrichLog(result: EnrichMergeResult, generatedAt: string, model: string): string {
  const f = result.stats.faction;
  const l = result.stats.location;
  const total = f.raw + l.raw;
  const factionRes = f.raw ? Math.round(((f.newConfirmed + f.alias) / f.raw) * 100) : 0;
  const locationRes = l.raw ? Math.round(((l.newConfirmed + l.alias) / l.raw) * 100) : 0;

  return `# Book-enrichment (Stage 3) — findings (Brief 155)

_Generated ${generatedAt} · model = ${model} (enricher + verifier, Web-Search + Thinking) · structural sentinels only (factions + locations); characters out of scope._

> Every row is a READ-ONLY PROPOSAL in \`scripts/seed-data/new-entity-proposals.json\`.
> Nothing here is applied — materialization is the maintainer hand-gates F/L only.

## Resolution (raw / new-confirmed / alias-dedup / unresolved, pattern 144)

| axis | raw | new (confirmed) | alias (dedup) | unresolved | fields-unproven |
|---|---|---|---|---|---|
| factions | ${f.raw} | ${f.newConfirmed} | ${f.alias} | ${f.unresolved} | ${f.fieldsUnproven} |
| locations | ${l.raw} | ${l.newConfirmed} | ${l.alias} | ${l.unresolved} | ${l.fieldsUnproven} |
| **total** | **${total}** | **${f.newConfirmed + l.newConfirmed}** | **${f.alias + l.alias}** | **${f.unresolved + l.unresolved}** | **${f.fieldsUnproven + l.fieldsUnproven}** |

- **Faction resolution quote:** ${factionRes}% (${f.newConfirmed + f.alias}/${f.raw}) reached a new entity or an alias of an existing one.
- **Location resolution quote:** ${locationRes}% (${l.newConfirmed + l.alias}/${l.raw}).
- **Location placement:** ${l.placed ?? 0} placed (real gx/gy) · ${l.sectorOnly ?? 0} sector-only · ${l.unplaceable ?? 0} unplaceable. Real Map-pin gain = the ${l.placed ?? 0} placed.
- **Dedup hits** (sentinels that were aliases of existing entities): factions ${f.alias}, locations ${l.alias}.

## Gates

- **Gate F (factions, early):** ${f.newConfirmed} new factions proposed for hand-promotion into \`factions.json\` (+ \`faction-aliases.json\`). ${f.alias} alias proposals.
- **Gate L (locations, with the Map):** ${l.newConfirmed} new locations proposed; promote staged when Map-curation is due. ${l.alias} alias proposals.

_Per-entity proposals (fields, sources, confidence, merge adjustments) live in the proposal JSON; the unresolved rows kept their \`__unresolved__\` sentinels._
`;
}
