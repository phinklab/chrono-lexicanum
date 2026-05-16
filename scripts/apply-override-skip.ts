/**
 * apply-override-skip.ts - pure skip-decision helper for Brief 077.
 *
 * Grand-Alignment-Junction-Hygiene: an override block carrying e.g.
 * `["Space Wolves", "Imperium"]` resolves to `[space_wolves, imperium]`, but
 * the `imperium` junction is redundant because `space_wolves` already carries
 * `alignment="imperium"` on the row. This helper decides which resolved
 * factions to KEEP for the `work_factions` INSERT and which raw surface forms
 * to AUDIT in the `factionsSkippedRedundant` bucket of the surfaceForms notes
 * block.
 *
 * Pure function: no DB, no Drizzle, no Node-FS. All inputs are passed in,
 * `resolveFaction` is dependency-injected so the function is unit-testable
 * without seed-extension or db-client side-effects.
 *
 * Skip rule (from Brief 077 § Constraints):
 *   1. The resolved faction_id is in `redundantIds` (policy-driven).
 *   2. Another resolved faction in the same block has matching `alignment`.
 *   3. That other faction is not itself the grand-alignment row.
 *
 * If a grand-alignment ID has no peer with matching alignment, it stays
 * (rare grand-alignment-only book — e.g. worldbuilding sourcebook).
 *
 * Audit-bucket shape: bare-string array (e.g. `["Imperium", "Imperium of Man"]`)
 * matches the brief's example wording. Multiple surface-form aliases that all
 * resolve to a skipped ID are all captured by re-running `resolveFaction` over
 * the original block (the `resolveFactions` dedupe loses this; we restore it
 * here for the audit trail).
 */

import type { Alignment } from "@/lib/seed/alignment";

export interface ResolvedFaction {
  id: string;
  role: string;
  rawName: string;
}

export interface OriginalEntity {
  name: string;
  role: string;
}

export interface ResolveFactionResult {
  id: string | null;
}

export interface SkipDecisionInput {
  resolved: ResolvedFaction[];
  original: OriginalEntity[];
  alignmentById: Map<string, Alignment>;
  redundantIds: Set<string>;
  resolveFaction: (name: string) => ResolveFactionResult;
}

export interface SkipDecision {
  keep: ResolvedFaction[];
  skippedSurfaceForms: string[];
}

export function decideFactionSkips(input: SkipDecisionInput): SkipDecision {
  const { resolved, original, alignmentById, redundantIds, resolveFaction } =
    input;

  const skipIds = new Set<string>();
  for (const f of resolved) {
    if (!redundantIds.has(f.id)) continue;
    const myAlign = alignmentById.get(f.id);
    if (!myAlign || myAlign === "neutral") continue;
    const hasPeer = resolved.some(
      (other) =>
        other.id !== f.id && alignmentById.get(other.id) === myAlign,
    );
    if (hasPeer) skipIds.add(f.id);
  }

  const keep = resolved.filter((f) => !skipIds.has(f.id));

  const skippedSurfaceForms: string[] = [];
  for (const o of original) {
    const r = resolveFaction(o.name);
    if (r.id !== null && skipIds.has(r.id)) {
      skippedSurfaceForms.push(o.name);
    }
  }

  return { keep, skippedSurfaceForms };
}
