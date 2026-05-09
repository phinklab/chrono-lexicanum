/**
 * Validator 3 — `pagecount_outlier`.
 *
 * Triggers off the `notes[]` entries Stage 1's Open-Library adapter wrote
 * when raw `pageCount` was outside the [30, 1500] window:
 *
 *   - `pagecount_below_threshold:<n>` → `severity: error`, `action: drop`.
 *     The Open-Library claim already chose NOT to set pageCount, so the
 *     downstream effect is "field is null" — but we surface the validation
 *     so the diff records what was rejected (`<n>`) and why.
 *
 *   - `pagecount_unusually_high:<n>` → `severity: warn`, `action: flag`. The
 *     value was kept; flag invites manual review (omnibus/anthology
 *     classification typically follows).
 *
 * Anthology/omnibus classification is not done here — it's handled by
 * Validator 4 (`author_editor_suspicion`) and the LLM's `format` field.
 */
import type { DiscoveredBook, SourceClaim, Validation } from "../types";

const BELOW_RE = /^pagecount_below_threshold:(\d+)$/;
const HIGH_RE = /^pagecount_unusually_high:(\d+)$/;

export function validatePagecountOutlier(
  claims: SourceClaim[],
  _discovered: DiscoveredBook,
): Validation[] {
  void _discovered;
  const out: Validation[] = [];
  for (const claim of claims) {
    if (claim.source !== "open_library") continue;
    for (const note of claim.notes) {
      const below = BELOW_RE.exec(note);
      if (below) {
        const value = Number.parseInt(below[1], 10);
        out.push({
          field: "pageCount",
          severity: "error",
          kind: "pagecount_outlier",
          evidence: [{ source: "open_library", value }],
          suggested: { action: "drop" },
          reasoning: `open_library reported pageCount=${value} which is below the 30-page sanity threshold; treated as metadata glitch and dropped.`,
        });
        continue;
      }
      const high = HIGH_RE.exec(note);
      if (high) {
        const value = Number.parseInt(high[1], 10);
        out.push({
          field: "pageCount",
          severity: "warn",
          kind: "pagecount_outlier",
          evidence: [{ source: "open_library", value }],
          suggested: { value, action: "flag" },
          reasoning: `open_library reported pageCount=${value} (>1500); kept but flagged for manual review (omnibus/anthology candidate).`,
        });
      }
    }
  }
  return out;
}
