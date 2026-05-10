/**
 * Pipeline V2 — pilot orchestrator (Brief 054, refactored 055).
 *
 * Hardcoded slug-set ("v2-tryout-1" = 5 books). Adds two pilot-specific
 * concerns on top of the shared `run-engine`:
 *
 *   - `PILOT_HINTS` for fuzzy-matching pilot slugs against discovery slugs
 *     when the canonical pilot slug differs (e.g. Wikipedia lists "Xenos"
 *     under Eisenhorn; pilot wants "eisenhorn-xenos").
 *   - `synthesizeMissingBook` fallback when a pilot slug appears in neither
 *     discovery source (e.g. eisenhorn-xenos pre-Brief-055 fix).
 *
 * Stage 0 (Discovery), Stage 1–4 (per-book), and the diff writer all live in
 * `run-engine.ts`. This file = pilot policy only. The 055 batch orchestrator
 * lives in `run-batch.ts` and shares the same engine.
 */
import {
  WIKIPEDIA_DISCOVERY_PAGES,
  TLBRANSON_PAGES,
  discoverV2Roster,
  processBookV2,
  writeV2DiffFile,
  type RunErrorEntry,
} from "./run-engine";
import { isLlmEnabled, getLlmModel } from "../llm/enrich";
import { isHardcoverEnabled } from "../hardcover/fetch";
import { PROMPT_VERSION_HASH_V2 } from "./llm/prompt";
import {
  emptyValidationSummary,
  mergeValidationSummaries,
  summarizeValidations,
} from "./validators";
import type {
  BookV2Record,
  DiscoveredBook,
  V2DiffFile,
  V2RunLlmCostSummary,
} from "./types";
import type { SourceName } from "../types";

export const PILOT_V2_TRYOUT_1 = [
  "eisenhorn-xenos",
  "false-gods",
  "garro",
  "tales-of-heresy",
  "chem-dog",
] as const;

/**
 * Fuzzy-match hints for the pilot slugs. Used when direct slug match against
 * the discovery roster misses — typical case: Wikipedia lists a book under a
 * shorter or differently-prefixed title (e.g. master list shows "Xenos" by
 * Dan Abnett under the Eisenhorn section, slug "xenos"; the pilot wants
 * "eisenhorn-xenos"). We resolve via title-fragment + author/series hint.
 *
 * `desiredTitle` is what we rewrite the matched book's title to (so the
 * downstream Lexicanum/OL queries fire on the more-specific name).
 */
const PILOT_HINTS: Record<
  string,
  { titleFragment: string; authorFragment?: string; seriesFragment?: string; desiredTitle?: string }
> = {
  "eisenhorn-xenos": {
    titleFragment: "xenos",
    authorFragment: "abnett",
    seriesFragment: "eisenhorn",
    desiredTitle: "Eisenhorn: Xenos",
  },
  "false-gods": { titleFragment: "false gods" },
  "garro": { titleFragment: "garro" },
  "tales-of-heresy": { titleFragment: "tales of heresy" },
  "chem-dog": { titleFragment: "chem dog", authorFragment: "callum" },
};

export async function runV2Pilot(pilotName: string): Promise<string> {
  const startedAt = new Date().toISOString();
  const errors: RunErrorEntry[] = [];

  // ── Stage 0 — Discovery ─────────────────────────────────────────────
  const discovery = await discoverV2Roster();
  errors.push(...discovery.errors);

  // Filter to the 5 pilot slugs. First try direct slug-match. For any pilot
  // slug that misses, fall back to fuzzy match using PILOT_HINTS.
  const found: DiscoveredBook[] = [];
  for (const pilotSlug of PILOT_V2_TRYOUT_1) {
    const direct = discovery.merged.find((b) => b.slug === pilotSlug);
    if (direct) {
      found.push(direct);
      continue;
    }
    const hints = PILOT_HINTS[pilotSlug];
    if (!hints) continue;
    const fuzzy = fuzzyMatch(discovery.merged, hints);
    if (fuzzy) {
      // Rewrite slug + (optional) title to the canonical pilot form.
      const rewritten: DiscoveredBook = {
        ...fuzzy,
        slug: pilotSlug,
        title: hints.desiredTitle ?? fuzzy.title,
      };
      found.push(rewritten);
      console.log(
        `  fuzzy-matched ${pilotSlug} ← roster slug "${fuzzy.slug}" (title: "${fuzzy.title}")`,
      );
      continue;
    }
    // Synthesize minimal record so Stage 1 can still attempt source-claim
    // fetches against the canonical title.
    const synth = synthesizeMissingBook(pilotSlug, hints.desiredTitle);
    if (synth) {
      found.push(synth);
      errors.push({
        source: "discovery",
        slug: pilotSlug,
        message: `not found in any discovery source — synthesized minimal record from slug`,
      });
    }
  }

  // ── Stage 1–4 per book ──────────────────────────────────────────────
  // Push run-level "LLM disabled" error once, not per book.
  if (!isLlmEnabled()) {
    errors.push({
      source: "llm",
      message: "ANTHROPIC_API_KEY missing — LLM enrichment skipped",
    });
  }

  const records: BookV2Record[] = [];
  let runCost: V2RunLlmCostSummary = {
    totalTokensIn: 0,
    totalTokensOut: 0,
    totalWebSearches: 0,
    estUsdCost: 0,
  };
  let validationSummary = emptyValidationSummary();
  const llmModel = getLlmModel();

  // Sort to preserve a stable processing order matching PILOT_V2_TRYOUT_1.
  found.sort(
    (a, b) =>
      PILOT_V2_TRYOUT_1.indexOf(a.slug as (typeof PILOT_V2_TRYOUT_1)[number]) -
      PILOT_V2_TRYOUT_1.indexOf(b.slug as (typeof PILOT_V2_TRYOUT_1)[number]),
  );

  for (let i = 0; i < found.length; i++) {
    const book = found[i];
    console.log(`[${i + 1}/${found.length}] ${book.title} (${book.slug})`);

    const result = await processBookV2(book);
    records.push(result.record);
    errors.push(...result.errors);
    validationSummary = mergeValidationSummaries(
      validationSummary,
      summarizeValidations(result.validations),
    );
    if (result.llmCost) {
      runCost = {
        totalTokensIn: runCost.totalTokensIn + result.llmCost.tokensIn,
        totalTokensOut: runCost.totalTokensOut + result.llmCost.tokensOut,
        totalWebSearches: runCost.totalWebSearches + result.llmCost.webSearches,
        estUsdCost: runCost.estUsdCost + result.llmCost.estUsdCost,
      };
    }
  }

  const ranAt = new Date().toISOString();
  const activeSources: SourceName[] = ["lexicanum", "open_library"];
  if (isHardcoverEnabled()) activeSources.push("hardcover");
  if (isLlmEnabled()) activeSources.push("llm");

  const diff: V2DiffFile = {
    ranAt,
    pipeline: "v2",
    pilot: pilotName,
    discoverySource: ["wikipedia", "tlbranson"],
    discoveryPages: [...discovery.wikipediaPagesUsed, ...discovery.tlbransonPagesUsed],
    activeSources,
    discovered: discovery.merged.length,
    added: records,
    updated: [],
    skipped_manual: [],
    skipped_unchanged: [],
    field_conflicts: [],
    errors: errors.map((e) => ({ source: e.source, slug: e.slug, message: e.message })),
    validationSummary,
    llmModel,
    llmPromptVersion: PROMPT_VERSION_HASH_V2,
    llmCostSummary: runCost,
  };

  const path = await writeV2DiffFile(diff, "v2-pilot", startedAt);

  console.log(`\nwrote diff: ${path}`);
  console.log(
    `summary: ${records.length} records, ${errors.length} errors, validations:`,
    validationSummary,
  );
  console.log(
    `cost: $${runCost.estUsdCost.toFixed(3)} ` +
      `(${runCost.totalTokensIn}+${runCost.totalTokensOut} tokens, ${runCost.totalWebSearches} web_search)`,
  );
  return path;
}

// =============================================================================
// Pilot-only helpers
// =============================================================================

/**
 * For pilot slugs missing from both discovery sources, build a minimal
 * DiscoveredBook from the slug. `desiredTitle` overrides the slug-based
 * title-cap when supplied (e.g. "Eisenhorn: Xenos" instead of
 * "Eisenhorn Xenos").
 */
function synthesizeMissingBook(
  slug: string,
  desiredTitle?: string,
): DiscoveredBook | null {
  const title = desiredTitle ?? slugToTitle(slug);
  if (!title) return null;
  return {
    slug,
    title,
    sourcePages: [],
    discoverySources: [],
  };
}

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

/**
 * Fuzzy-match a roster of `DiscoveredBook` against a pilot hint. Returns the
 * single best match or null. Strict policy: title fragment must appear in
 * the candidate's lowercased title; if `authorFragment` is given, candidate's
 * authorHint must contain it; if `seriesFragment` is given, candidate's
 * seriesHint must contain it. Multiple matches → returns the FIRST one (by
 * roster order — Wikipedia sub-pages come after the master list).
 */
function fuzzyMatch(
  roster: DiscoveredBook[],
  hints: {
    titleFragment: string;
    authorFragment?: string;
    seriesFragment?: string;
  },
): DiscoveredBook | null {
  const t = hints.titleFragment.toLowerCase();
  const a = hints.authorFragment?.toLowerCase();
  const s = hints.seriesFragment?.toLowerCase();
  for (const book of roster) {
    if (!book.title.toLowerCase().includes(t)) continue;
    if (a && !book.authorHint?.toLowerCase().includes(a)) continue;
    if (s && !book.seriesHint?.toLowerCase().includes(s)) continue;
    return book;
  }
  return null;
}

// Re-exports kept for module-API stability (run-engine constants are used by
// run-batch + the CLI dispatcher; older callers may import from here).
export { WIKIPEDIA_DISCOVERY_PAGES, TLBRANSON_PAGES };
