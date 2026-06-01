/**
 * Brief 110 Step 1 — episode tag resolution.
 *
 * Maps the LLM's extracted surface-forms to canonical entity ids by REUSING the
 * shared alias module (`src/lib/aliases`, Brief 104). `resolveSurfaceForm` is the
 * single resolver — this file forks no alias logic. Step 1 is that contract's
 * first real consumer.
 *
 * The LLM's per-axis bucket supplies only the `role` (primary→subject,
 * mentioned→mentioned) and, on a miss, the `axisGuess`. The authoritative `type`
 * always comes from the alias resolution itself (data-driven), so a form the LLM
 * mis-bucketed (e.g. "Night Lords" under characters) still resolves to its true
 * axis. Unresolved forms are recorded verbatim — NEVER auto-created as ref rows.
 *
 * Confidence: canonical-name match → 1.0, alias-key match → 0.9 (the alias
 * module reports which via `matchedVia`).
 */
import { normalizeQuery, resolveSurfaceForm, type AliasAxis } from "@/lib/aliases";

import type { EpisodeExtraction, EpisodeRole, EpisodeTag, UnresolvedForm } from "./types";

const FIELD_AXIS: ReadonlyArray<{
  field: "characters" | "factions" | "locations";
  axis: AliasAxis;
}> = [
  { field: "characters", axis: "character" },
  { field: "factions", axis: "faction" },
  { field: "locations", axis: "location" },
];

export interface ResolvedEpisode {
  tags: EpisodeTag[];
  unresolved: UnresolvedForm[];
}

export function resolveEpisodeTags(extraction: EpisodeExtraction): ResolvedEpisode {
  // Dedup tags by (type, canonicalId), keeping `subject` over `mentioned`.
  const tagMap = new Map<string, EpisodeTag>();
  const unresolved: UnresolvedForm[] = [];
  const unresolvedSeen = new Set<string>();

  const consider = (rawForm: string, role: EpisodeRole, axisGuess: AliasAxis): void => {
    const form = rawForm.trim();
    if (form === "") return;
    const resolutions = resolveSurfaceForm(form);
    if (resolutions.length === 0) {
      const key = `${axisGuess}::${role}::${normalizeQuery(form)}`;
      if (!unresolvedSeen.has(key)) {
        unresolvedSeen.add(key);
        unresolved.push({ rawName: form, axisGuess, role });
      }
      return;
    }
    for (const r of resolutions) {
      const tag: EpisodeTag = {
        type: r.axis,
        canonicalId: r.canonicalId,
        rawName: form,
        role,
        confidence: r.matchedVia === "canonical-name" ? 1 : 0.9,
        matchedVia: r.matchedVia,
      };
      const key = `${r.axis}::${r.canonicalId}`;
      const existing = tagMap.get(key);
      if (existing === undefined) {
        tagMap.set(key, tag);
      } else if (existing.role === "mentioned" && role === "subject") {
        tagMap.set(key, tag);
      }
    }
  };

  // Primary before mentioned within each axis so `subject` wins the dedup.
  for (const { field, axis } of FIELD_AXIS) {
    const ax = extraction[field];
    for (const form of ax.primary) consider(form, "subject", axis);
    for (const form of ax.mentioned) consider(form, "mentioned", axis);
  }

  return { tags: [...tagMap.values()], unresolved };
}
