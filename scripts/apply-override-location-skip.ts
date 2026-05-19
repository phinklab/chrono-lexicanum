/**
 * apply-override-location-skip.ts — pure skip-decision helper for Brief 084.
 *
 * Locations-Axis-Hygiene: an override block carrying e.g.
 * `["Cadia", "Imperium"]` resolves `Cadia` to `cadia` and `Imperium` to `null`
 * (no `imperium` row in `locations.json`). The `Imperium` surface form is a
 * grand-alignment / umbrella tag, not a place — Brief 084 routes it from
 * the `locationsUnresolved` notes-bucket into a new `locationsSkippedRedundant`
 * audit-bucket when at least one other location in the block already resolves
 * to a real `locations.json` row. If the block only carries the umbrella
 * (Galaxy-Wide-Survey case), the surface form is preserved in
 * `locationsUnresolved` — same shape as today.
 *
 * Pure function: no DB, no Drizzle, no Node-FS at call time. All inputs are
 * passed in. The policy file is loaded once by `loadLocationSkipContext` in
 * `apply-override.ts` and the resulting Set is injected here — parallel to
 * the Brief-077 `decideFactionSkips` + `loadSkipContext` split.
 *
 * Skip rule (from Brief 084 § Constraints):
 *   1. The surface form matches an entry in `redundantSurfaceForms`
 *      (case-insensitive, trimmed).
 *   2. At least one other location in the same override block resolves to a
 *      `locations.json` row (i.e. `resolvedLocationIds.length > 0`).
 *
 * If a redundant surface form has no resolved peer, it stays — Erhaltungs-Pfad
 * for worldbuilding / Galaxy-Wide-Survey books that carry only the umbrella.
 *
 * Audit-bucket shape: bare-string array (e.g. `["Imperium", "Imperium of Man"]`)
 * mirrors the brief's example wording and is parallel to `factionsSkippedRedundant`.
 *
 * Surface-form-zentriert (not ID-zentriert like the Brief-077 faction-skip
 * helper): umbrellas like `Imperium` resolve to `null`, so there's no ID to
 * skip — the audit-bucket lives at the surface-form level instead.
 */

export interface LocationSurfaceForm {
  name: string;
  role: string;
}

export interface LocationSkipDecisionInput {
  surfaceForms: ReadonlyArray<LocationSurfaceForm>;
  redundantSurfaceForms: ReadonlySet<string>;
  resolvedLocationIds: ReadonlyArray<string>;
}

export interface LocationSkipDecision {
  keepSurfaceForms: LocationSurfaceForm[];
  skippedSurfaceForms: string[];
}

function normalizeKey(s: string): string {
  return s.trim().toLowerCase();
}

export function decideLocationSkips(
  input: LocationSkipDecisionInput,
): LocationSkipDecision {
  const { surfaceForms, redundantSurfaceForms, resolvedLocationIds } = input;

  if (redundantSurfaceForms.size === 0 || resolvedLocationIds.length === 0) {
    return {
      keepSurfaceForms: [...surfaceForms],
      skippedSurfaceForms: [],
    };
  }

  const keep: LocationSurfaceForm[] = [];
  const skipped: string[] = [];
  for (const sf of surfaceForms) {
    if (redundantSurfaceForms.has(normalizeKey(sf.name))) {
      skipped.push(sf.name);
    } else {
      keep.push(sf);
    }
  }
  return { keepSurfaceForms: keep, skippedSurfaceForms: skipped };
}
