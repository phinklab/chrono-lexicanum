/**
 * The podcast delta primitives (additive path).
 *
 * The cc-direct pipeline tags a WHOLE show: acquire the full
 * manifest, chunk EVERY episode into batches, tag them, and `merge` writes a
 * fresh `<slug>.extractions.json`. That is the right shape for a first ingest,
 * but wrong for maintenance: when a show publishes one new episode, re-tagging
 * the whole back-catalogue is wasteful and — worse — risks silently rewriting
 * (or shrinking) already-reviewed extractions.
 *
 * This module is the additive alternative. It is PURE — no filesystem, no DB, no
 * network, no `@anthropic-ai/sdk` (it imports only the local types + the
 * deterministic extraction helpers), so the whole delta contract unit-tests
 * without fixtures. Two operations:
 *   - `selectDeltaGuids` — set-difference the live manifest against the committed
 *     extractions to find the guids that are genuinely NEW (never tagged). This
 *     is the "tag only new GUIDs" invariant as data.
 *   - `mergeExtractionsDelta` — UNION the freshly-tagged extractions into the
 *     existing committed file, never overwriting a reviewed extraction and never
 *     dropping one (the no-shrink invariant). Any ambiguity — a guid that already
 *     carries a DIFFERENT extraction, a prompt-version/model that drifted from the
 *     committed file, a show-slug mismatch — throws `DeltaGuardError`, the
 *     needs-decision signal the CLIs surface (never a silent retag).
 *
 * `partitionProposalGuids` is the cross-check that ties the delta to the weekly
 * detection proposal (`refresh:check`): the guids the proposal flagged as new for
 * a show must still be in the live feed, or the feed drifted under us.
 */
import {
  canonicalizeExtraction,
  serializeExtractions,
  type ExtractionsFile,
} from "./extraction";
import type { EpisodeExtraction } from "./types";

/**
 * A delta operation that cannot proceed safely without a human call — the
 * needs-decision signal. Raised for prompt-version / model drift, a guid that
 * would be re-tagged with a different extraction (guid ambiguity), a
 * show-slug mismatch, a would-be inventory shrink, or a proposal guid that
 * vanished from the feed (source drift). Distinct from
 * `ExtractionValidationError` (structural garbage → re-run the batch); a
 * `DeltaGuardError` means STOP and ask.
 */
export class DeltaGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeltaGuardError";
  }
}

/** The guids a delta run must tag vs the ones already covered by the committed
 *  file. `newGuids` preserves the manifest's (pubDate, guid) order; both are
 *  deduped. `newGuids` is exactly the "only new GUIDs" set — an empty result
 *  means the show is up to date and nothing needs tagging. */
export interface DeltaSelection {
  newGuids: string[];
  alreadyTagged: string[];
}

/**
 * Split the live manifest's guids against the committed extractions' guids:
 * `newGuids` = manifest ∖ existing (the delta to tag), `alreadyTagged` =
 * manifest ∩ existing (skipped — never re-tagged). Order follows the manifest so
 * batches stay stable; a guid repeated in the manifest is considered once.
 */
export function selectDeltaGuids(
  manifestGuids: readonly string[],
  existingGuids: Iterable<string>,
): DeltaSelection {
  const existing = new Set(existingGuids);
  const seen = new Set<string>();
  const newGuids: string[] = [];
  const alreadyTagged: string[] = [];
  for (const guid of manifestGuids) {
    if (seen.has(guid)) continue;
    seen.add(guid);
    if (existing.has(guid)) alreadyTagged.push(guid);
    else newGuids.push(guid);
  }
  return { newGuids, alreadyTagged };
}

/** The header + freshly-tagged extractions a delta merge folds into the file. */
export interface DeltaMergeInput {
  show: string;
  model: string;
  promptVersion: string;
  /** guid → extraction, the delta batch outputs (only the new episodes). */
  extractions: Record<string, EpisodeExtraction>;
}

/** The outcome of a delta merge — the union file plus a per-guid accounting so
 *  the CLI can report "N added, M unchanged" and prove idempotency. */
export interface DeltaMergeResult {
  file: ExtractionsFile;
  /** Guids not previously in the committed file (the genuine additions). */
  added: string[];
  /** Guids already present with a byte-identical extraction — a re-merge no-op
   *  (this is what makes re-running the delta idempotent). */
  unchanged: string[];
}

/** Stable identity of one extraction (fixed key order via canonicalize), so
 *  "same extraction" is an exact-bytes comparison — any difference (including
 *  surface-form order) is treated as a genuine change, i.e. refused. */
function extractionKey(e: EpisodeExtraction): string {
  return JSON.stringify(canonicalizeExtraction(e));
}

/**
 * Guard the header of an incoming delta against the committed file. Both the
 * prompt version and the model must match: mixing a new prompt's or a new
 * model's extractions into a file tagged under the old one produces a corpus with
 * silently-mixed provenance. A slug mismatch means the delta targets the wrong
 * file. Any of these throws `DeltaGuardError` (needs-decision).
 */
export function assertDeltaHeaderCompatible(
  existing: ExtractionsFile,
  incoming: { show: string; model: string; promptVersion: string },
): void {
  if (existing.show !== incoming.show) {
    throw new DeltaGuardError(
      `show slug mismatch: committed file is "${existing.show}", delta is "${incoming.show}" — ` +
        `wrong --out target?`,
    );
  }
  if (existing.promptVersion !== incoming.promptVersion) {
    throw new DeltaGuardError(
      `prompt-version drift: committed "${existing.promptVersion}" vs delta "${incoming.promptVersion}". ` +
        `The tagging conventions changed since this show was last tagged — do NOT mix prompt versions ` +
        `into one artifact. Re-tag the whole show under the new prompt, or stop and decide (needs-decision).`,
    );
  }
  if (existing.model !== incoming.model) {
    throw new DeltaGuardError(
      `model drift: committed "${existing.model}" vs delta "${incoming.model}". ` +
        `Tag the delta with the same model the show was built with (needs-decision).`,
    );
  }
}

/**
 * Fold a freshly-tagged delta into the committed extractions file. Strictly
 * additive: existing entries are preserved verbatim; a guid already present with
 * an identical extraction is a no-op (`unchanged`); a guid already present with a
 * DIFFERENT extraction throws `DeltaGuardError` (guid ambiguity — never a silent
 * retag). Header drift (prompt/model/slug) throws before any merge. When
 * `existing` is null (a brand-new show's first tag) the delta becomes the whole
 * file. The result is guaranteed a SUPERSET of the committed guids (no shrink).
 */
export function mergeExtractionsDelta(
  existing: ExtractionsFile | null,
  incoming: DeltaMergeInput,
): DeltaMergeResult {
  if (existing !== null) {
    assertDeltaHeaderCompatible(existing, incoming);
  }

  const merged: Record<string, EpisodeExtraction> = {};
  for (const [guid, ext] of Object.entries(existing?.extractions ?? {})) {
    merged[guid] = canonicalizeExtraction(ext);
  }

  const added: string[] = [];
  const unchanged: string[] = [];
  for (const [guid, ext] of Object.entries(incoming.extractions)) {
    const canonical = canonicalizeExtraction(ext);
    const prior = merged[guid];
    if (prior === undefined) {
      merged[guid] = canonical;
      added.push(guid);
    } else if (extractionKey(prior) === extractionKey(canonical)) {
      unchanged.push(guid);
    } else {
      throw new DeltaGuardError(
        `guid "${guid}" is already tagged with a different extraction — refusing to overwrite a ` +
          `reviewed episode (no full-show retagging). Remove it from the delta, or stop and decide ` +
          `(needs-decision).`,
      );
    }
  }

  // No-shrink invariant: the union can only grow the guid set. Assert it anyway
  // so a future refactor can never quietly drop a reviewed extraction.
  if (existing !== null) {
    for (const guid of Object.keys(existing.extractions)) {
      if (!(guid in merged)) {
        throw new DeltaGuardError(
          `delta merge would drop committed guid "${guid}" — inventory shrink is never allowed`,
        );
      }
    }
  }

  const file: ExtractionsFile = {
    show: incoming.show,
    tagging: "cc-direct",
    model: incoming.model,
    promptVersion: incoming.promptVersion,
    extractions: merged,
  };
  return { file, added: added.sort(), unchanged: unchanged.sort() };
}

/** How the guids a detection proposal flagged as new for a show line up against
 *  the live manifest and the committed extractions. */
export interface ProposalPartition {
  /** Proposal-new guids still in the feed AND not yet tagged — the ones to tag. */
  toTag: string[];
  /** Proposal-new guids already in the committed file — stale, safely skipped. */
  alreadyTagged: string[];
  /** Proposal-new guids no longer in the live feed — source drift (needs-decision). */
  missingFromFeed: string[];
}

/**
 * Cross-check the weekly proposal's new-episode guids for one show against the
 * freshly-acquired manifest and the committed extractions. A proposal guid that
 * is no longer in the live feed (`missingFromFeed`) means the feed changed under
 * us since detection ran — the caller stops with needs-decision rather than
 * tagging against a stale plan. `alreadyTagged` (a guid already committed) is a
 * benign no-op the caller can report and skip.
 */
export function partitionProposalGuids(
  proposalGuids: readonly string[],
  manifestGuids: readonly string[],
  existingGuids: Iterable<string>,
): ProposalPartition {
  const manifest = new Set(manifestGuids);
  const existing = new Set(existingGuids);
  const toTag: string[] = [];
  const alreadyTagged: string[] = [];
  const missingFromFeed: string[] = [];
  const seen = new Set<string>();
  for (const guid of proposalGuids) {
    if (seen.has(guid)) continue;
    seen.add(guid);
    if (!manifest.has(guid)) missingFromFeed.push(guid);
    else if (existing.has(guid)) alreadyTagged.push(guid);
    else toTag.push(guid);
  }
  return { toTag, alreadyTagged, missingFromFeed };
}

/** Serialize a merged delta file exactly as `podcast-cc-tag merge` would — the
 *  byte-stable committed contract. Re-exported so callers/tests have one writer. */
export function serializeDeltaFile(file: ExtractionsFile): string {
  return serializeExtractions(file);
}
