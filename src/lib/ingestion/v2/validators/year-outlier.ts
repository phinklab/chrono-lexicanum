/**
 * Validator 1 — `year_outlier`.
 *
 * Series-position cross-check. When the discovered book belongs to a known
 * series anchor (HH, Siege of Terra, Eisenhorn, Ravenor, Cain, Dawn of Fire)
 * AND a `startY` claim from any source is more than ±1000 outside the
 * canonical era for that series, emit a `severity: error` validation with
 * `suggested.action: drop` and the original raw value as evidence.
 *
 * Two evidence sources are inspected:
 *
 *   - `claim.fields.startY` — the trusted infobox-derived value (V2
 *     Lexicanum's Setting/Date cell, or any future source).
 *   - `claim.raw.bodyYearCandidates` (Lexicanum only) — body-text M-scale
 *     hits the V2 Lexicanum parser collected as audit-only. These never
 *     reach the FIELDS path on their own, but the validator surfaces them
 *     here so the diff records what V1's broken body regex would have
 *     produced.
 *
 * The canonical era is encoded as an inclusive numeric range on the M-scale
 * representation: HH = M30 (29000–29999) ∪ M31 (30000–30999), etc. Anchor
 * matching is case-insensitive substring on the `seriesHint` text.
 *
 * If `seriesHint` is absent or doesn't match any anchor, the validator
 * does NOT flag — non-anchored books pass through. (Open Question 2 in the
 * brief: garro is technically an HH-collection but its series identity is
 * subtle; falling out of the raster simply means no flag, which is the
 * right behavior here — Stage 4 falls back to LLM/discovery values.)
 */
import type { DiscoveredBook, SourceClaim, Validation } from "../types";

interface SeriesAnchor {
  /** Substrings that, when present in the seriesHint (case-insensitive),
   *  identify the series. */
  match: string[];
  /** Inclusive M-scale numeric ranges (`(M-1)*1000 + year_within_M`). */
  ranges: Array<[number, number]>;
  label: string;
}

const SERIES_ANCHORS: SeriesAnchor[] = [
  {
    label: "Horus Heresy / Siege of Terra",
    match: ["horus heresy", "siege of terra"],
    ranges: [
      [29000, 29999], // M30
      [30000, 30999], // M31
    ],
  },
  {
    label: "Eisenhorn",
    match: ["eisenhorn"],
    ranges: [[39000, 39999]], // M40
  },
  {
    label: "Ravenor",
    match: ["ravenor"],
    ranges: [[39000, 39999]], // M40
  },
  {
    label: "Ciaphas Cain",
    match: ["ciaphas cain", "cain"],
    ranges: [[39000, 39999]], // M40
  },
  {
    label: "Dawn of Fire",
    match: ["dawn of fire"],
    ranges: [[41000, 41999]], // M42
  },
];

const TOLERANCE_M_UNITS = 1000;

function findAnchor(seriesHint: string | undefined): SeriesAnchor | null {
  if (!seriesHint) return null;
  const lc = seriesHint.toLowerCase();
  for (const anchor of SERIES_ANCHORS) {
    for (const m of anchor.match) {
      if (lc.includes(m)) return anchor;
    }
  }
  return null;
}

function withinAnchor(value: number, anchor: SeriesAnchor): boolean {
  for (const [lo, hi] of anchor.ranges) {
    if (value >= lo - TOLERANCE_M_UNITS && value <= hi + TOLERANCE_M_UNITS) {
      return true;
    }
  }
  return false;
}

export function validateYearOutlier(
  claims: SourceClaim[],
  discovered: DiscoveredBook,
): Validation[] {
  const anchor = findAnchor(discovered.seriesHint);
  if (!anchor) return [];

  const out: Validation[] = [];
  for (const claim of claims) {
    // Field-path startY (trusted source — infobox).
    const v = claim.fields.startY;
    if (typeof v === "number" && !withinAnchor(v, anchor)) {
      out.push({
        field: "startY",
        severity: "error",
        kind: "year_outlier",
        evidence: [{ source: claim.source, value: v }],
        suggested: { action: "drop" },
        reasoning: `${claim.source}'s startY=${v} (infobox) is outside the canonical era for ${anchor.label} (${anchor.ranges.map(([a, b]) => `${a}–${b}`).join(", ")}); raw value rejected — falls back to LLM/discovery`,
      });
    }
    // Body-year candidates (Lexicanum audit-only; never on field path).
    if (claim.source === "lexicanum") {
      const raw = claim.raw as { bodyYearCandidates?: number[] } | undefined;
      const candidates = raw?.bodyYearCandidates ?? [];
      for (const cand of candidates) {
        if (withinAnchor(cand, anchor)) continue;
        out.push({
          field: "startY",
          severity: "error",
          kind: "year_outlier",
          evidence: [{ source: claim.source, value: cand }],
          suggested: { action: "drop" },
          reasoning: `${claim.source}'s body-text contained M-scale token=${cand}, outside the canonical era for ${anchor.label} (${anchor.ranges.map(([a, b]) => `${a}–${b}`).join(", ")}); audit-only — not promoted to a field, recorded as evidence of unreliable body-year extraction.`,
        });
      }
    }
  }
  return out;
}
