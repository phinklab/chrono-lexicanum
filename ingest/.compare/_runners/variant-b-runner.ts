/**
 * Brief 045 — Variant B Runner.
 *
 * Sonnet 4.6, Pipeline-Prompt 1:1 + re-fetched plotContext, KEIN web_search-
 * Tool. Reiner Modell-Vergleich gegen Pipeline-Haiku-A auf identischer
 * Eingabe. 6 Slugs, sequenziell, mit Per-Slug-Status, Hard-Stop bei kumulativ
 * > 80% Limit-Heuristik.
 *
 * Lauf:  npx tsx --env-file=.env.local ingest/.compare/_runners/variant-b-runner.ts
 */
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import Anthropic from "@anthropic-ai/sdk";

import {
  PROMPT_VERSION_HASH,
  PUBLISH_ENRICHMENT_TOOL,
  SYSTEM_PROMPT,
  buildUserPrompt,
  loadFacetVocabulary,
  type FacetCategory,
} from "@/lib/ingestion/llm/prompt";
import type {
  HardcoverPayload,
  MergedBook,
  SourcePayload,
} from "@/lib/ingestion/types";

import {
  describeDivergence,
  extractVariantAFromDiff,
  type ComparableEnrichment,
} from "./divergence";
import { TARGET_SLUGS, loadSlug, type LoadedSlug } from "./load-slug-data";
import { readFile } from "node:fs/promises";

// =============================================================================
// Constants
// =============================================================================

const MODEL = "claude-sonnet-4-6";
const MAX_OUTPUT_TOKENS = 2048;
const OUTPUT_PATH = "ingest/.compare/045-sonnet-pipeline.json";

/**
 * Heuristik: 1% Sonnet-5h-Limit ≈ 50_000 Tokens (Mix Input+Output). Grobe
 * Schätzung — Pro/Max-Limits werden in Sessions gemessen, hier proxien wir
 * sie als linearen Token-Counter. Saubere Messung des echten Subscription-
 * Verbrauchs ist nur über Claude-Code's `/cost`-Reporting möglich; bei reinen
 * API-Calls landet alles in der API-Billing, nicht in Subscription. Deshalb
 * dokumentieren wir das Feld als Annäherung.
 */
const TOKENS_PER_LIMIT_PERCENT = 50_000;
const HARD_STOP_PERCENT = 80;

// =============================================================================
// Helpers
// =============================================================================

function buildSyntheticHardcoverPayload(
  ld: LoadedSlug,
): HardcoverPayload | null {
  if (!ld.rawHardcoverPayload) return null;
  return {
    source: "hardcover",
    fields: {},
    audit: {
      tags: ld.rawHardcoverPayload.tags,
      averageRating: ld.rawHardcoverPayload.averageRating,
    },
  };
}

interface PublishEnrichmentInput {
  synopsis: string;
  format?: string;
  availability?: string;
  facetIds: string[];
  discoveredLinks?: Array<{ serviceHint: string; kind: string; url: string }>;
  rating?: { value: number; source: string; count?: number };
  flags?: Array<{
    kind: string;
    field?: string;
    current?: unknown;
    suggestion?: unknown;
    sources?: string[];
    reasoning?: string;
  }>;
}

function extractPublishEnrichment(
  message: Anthropic.Message,
): { ok: true; input: PublishEnrichmentInput } | { ok: false; reason: string } {
  const toolUses = message.content.filter(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
  );
  const publish = toolUses.find((t) => t.name === "publish_enrichment");
  if (!publish) {
    const got = toolUses.map((t) => t.name).join(", ") || "<none>";
    return {
      ok: false,
      reason: `expected publish_enrichment tool_use; got [${got}]`,
    };
  }
  if (!publish.input || typeof publish.input !== "object") {
    return { ok: false, reason: "publish_enrichment.input not an object" };
  }
  return { ok: true, input: publish.input as PublishEnrichmentInput };
}

function payloadToComparable(
  input: PublishEnrichmentInput,
): ComparableEnrichment {
  return {
    synopsis: input.synopsis,
    facetIds: input.facetIds ?? [],
    format: input.format ?? null,
    availability: input.availability ?? null,
    rating: input.rating?.value ?? null,
    ratingSource: input.rating?.source ?? null,
    ratingCount: input.rating?.count ?? null,
    plausibilityFlags: (input.flags ?? []).map((f) => ({
      kind: f.kind,
      reasoning: f.reasoning,
    })),
    discoveredLinks: input.discoveredLinks ?? [],
  };
}

interface SlugResult {
  slug: string;
  synopsis: string;
  facetIds: string[];
  format: string | null;
  availability: string | null;
  rating: number | null;
  ratingSource: string | null;
  ratingCount: number | null;
  plausibilityFlags: Array<{ kind: string; reasoning?: string; field?: string }>;
  discoveredLinks: Array<{ serviceHint: string; kind: string; url: string }>;
  costEstimate: {
    subscriptionTier: "sonnet";
    inputTokens: number;
    outputTokens: number;
    webSearchCalls: number;
    estimatedLimitPercent: number;
    cumulativeLimitPercent: number;
  };
  divergence: string;
  /** Diagnostic: empty when run succeeded; populated on parse_error / API errors. */
  runError?: string;
}

interface OutputFile {
  ranAt: string;
  variant: "B";
  variantLabel: string;
  model: string;
  promptVersionHash: string;
  subscriptionTier: "sonnet";
  limitFramework: "approximate-token-to-percent-heuristic";
  limitNote: string;
  slugs: SlugResult[];
  summary: {
    cumulativeLimitPercent: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalWebSearchCalls: number;
    hardStopTriggered: boolean;
    completedSlugs: number;
    targetSlugs: number;
  };
}

function newOutputFile(): OutputFile {
  return {
    ranAt: new Date().toISOString(),
    variant: "B",
    variantLabel:
      "Sonnet 4.6 + Pipeline-Prompt 1:1 + Pipeline-Audit-Inputs + re-fetched plotContext, NO web_search tool",
    model: MODEL,
    promptVersionHash: PROMPT_VERSION_HASH,
    subscriptionTier: "sonnet",
    limitFramework: "approximate-token-to-percent-heuristic",
    limitNote: `Heuristik: 1% ≈ ${TOKENS_PER_LIMIT_PERCENT.toLocaleString()} Sonnet-Tokens (linearer Proxy für 5h-Subscription-Limit; via API gemessen, kein echter Subscription-Counter).`,
    slugs: [],
    summary: {
      cumulativeLimitPercent: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalWebSearchCalls: 0,
      hardStopTriggered: false,
      completedSlugs: 0,
      targetSlugs: TARGET_SLUGS.length,
    },
  };
}

async function persistOutput(out: OutputFile): Promise<void> {
  const abs = resolve(process.cwd(), OUTPUT_PATH);
  await writeFile(abs, JSON.stringify(out, null, 2) + "\n", "utf8");
}

// =============================================================================
// Main
// =============================================================================

async function loadVariantALookup(
  diffPath: string,
): Promise<(slug: string) => ComparableEnrichment> {
  const abs = resolve(process.cwd(), diffPath);
  const raw = await readFile(abs, "utf8");
  const diff = JSON.parse(raw);
  return (slug: string) => extractVariantAFromDiff(diff, slug);
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      "ANTHROPIC_API_KEY missing. Run via: npx tsx --env-file=.env.local …",
    );
    process.exit(1);
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  console.log(
    `[variant-b] starting — model=${MODEL}, ${TARGET_SLUGS.length} slugs, hard-stop at ${HARD_STOP_PERCENT}% cumulative.`,
  );
  console.log(`[variant-b] prompt-version-hash=${PROMPT_VERSION_HASH}`);

  const out = newOutputFile();
  const { categories: vocabulary } = await loadFacetVocabulary();

  // We have two source diffs (5 slugs in d1, 1 in d2). Cache lookups.
  const variantALookups = new Map<
    string,
    (slug: string) => ComparableEnrichment
  >();
  for (const spec of TARGET_SLUGS) {
    if (!variantALookups.has(spec.diffPath)) {
      variantALookups.set(spec.diffPath, await loadVariantALookup(spec.diffPath));
    }
  }

  for (let i = 0; i < TARGET_SLUGS.length; i++) {
    const spec = TARGET_SLUGS[i];
    const slugIdx = i + 1;
    const slugTotal = TARGET_SLUGS.length;
    console.log(
      `\n[variant-b] (${slugIdx}/${slugTotal}) loading ${spec.slug} from ${spec.diffPath}…`,
    );

    let loaded: LoadedSlug;
    try {
      loaded = await loadSlug(spec);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[variant-b]   load failed: ${msg}`);
      continue;
    }

    // Synthesize Hardcover SourcePayload from rawHardcoverPayload (audit-only).
    const rawPayloads: SourcePayload[] = [];
    const synth = buildSyntheticHardcoverPayload(loaded);
    if (synth) rawPayloads.push(synth);

    const userPrompt = buildUserPrompt({
      merged: loaded.merged,
      rawPayloads,
      plotContext: loaded.plotContext,
      vocabulary,
    });

    /**
     * Brief 045 § Risiken: SYSTEM_PROMPT instruiert ≥2 web_search Calls, aber
     * für Variant B ist KEIN web_search-Tool verfügbar. Erste Pilot-Runs
     * haben gezeigt, dass Sonnet in diesem Setup gelegentlich einen
     * Planungs-Satz statt der Synopsis emittiert. Die Brief-spezifische
     * Mitigation: User-Message-Hint, der den Web-Search-Schritt explizit
     * deaktiviert. KEIN Edit am SYSTEM_PROMPT (Pipeline-Code unverändert).
     */
    const COMPARISON_HINT =
      "## Comparison-run override\n\n`web_search` is unavailable for this run (we are reproducing the pipeline-prompt without the web tool to isolate the model lift). Skip the synopsis-context and availability-search steps. Use the structured data + plot context above to compose your synopsis directly (still 100–150 words, paraphrased, license-safe). Use the rating/availability fields already present in the merged data when relevant; if no signal, emit the appropriate `no_storefronts_found` / `no_rating_found` flag. Then call `publish_enrichment` exactly once. Do NOT emit free-form text.";

    let message: Anthropic.Message;
    try {
      message = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [
          { role: "user", content: userPrompt },
          { role: "user", content: COMPARISON_HINT },
        ],
        tools: [PUBLISH_ENRICHMENT_TOOL] as unknown as Anthropic.Tool[],
        tool_choice: { type: "tool", name: "publish_enrichment" },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[variant-b]   API error: ${msg}`);
      continue;
    }

    const inputTokens = message.usage.input_tokens;
    const outputTokens = message.usage.output_tokens;
    const estimatedLimitPercent =
      ((inputTokens + outputTokens) / TOKENS_PER_LIMIT_PERCENT) * 100;
    const cumulativeLimitPercent =
      out.summary.cumulativeLimitPercent + estimatedLimitPercent;

    const variantA = variantALookups.get(spec.diffPath)!(spec.slug);

    const extracted = extractPublishEnrichment(message);
    let result: SlugResult;
    if (!extracted.ok) {
      console.error(`[variant-b]   parse error: ${extracted.reason}`);
      result = {
        slug: spec.slug,
        synopsis: "",
        facetIds: [],
        format: null,
        availability: null,
        rating: null,
        ratingSource: null,
        ratingCount: null,
        plausibilityFlags: [],
        discoveredLinks: [],
        costEstimate: {
          subscriptionTier: "sonnet",
          inputTokens,
          outputTokens,
          webSearchCalls: 0,
          estimatedLimitPercent: round(estimatedLimitPercent, 2),
          cumulativeLimitPercent: round(cumulativeLimitPercent, 2),
        },
        divergence: `Vs. Pipeline-Haiku-A: konnte nicht verglichen werden — Variant-B parse error: ${extracted.reason}.`,
        runError: extracted.reason,
      };
    } else {
      const cmp = payloadToComparable(extracted.input);
      const divergence = describeDivergence(
        "Pipeline-Haiku-A",
        variantA,
        cmp,
      );
      result = {
        slug: spec.slug,
        synopsis: cmp.synopsis,
        facetIds: cmp.facetIds,
        format: cmp.format ?? null,
        availability: cmp.availability ?? null,
        rating: cmp.rating ?? null,
        ratingSource: cmp.ratingSource ?? null,
        ratingCount: cmp.ratingCount ?? null,
        plausibilityFlags: (extracted.input.flags ?? []).map((f) => ({
          kind: f.kind,
          reasoning: f.reasoning,
          field: f.field,
        })),
        discoveredLinks: cmp.discoveredLinks,
        costEstimate: {
          subscriptionTier: "sonnet",
          inputTokens,
          outputTokens,
          webSearchCalls: 0,
          estimatedLimitPercent: round(estimatedLimitPercent, 2),
          cumulativeLimitPercent: round(cumulativeLimitPercent, 2),
        },
        divergence,
      };
    }

    out.slugs.push(result);
    out.summary.cumulativeLimitPercent = round(cumulativeLimitPercent, 2);
    out.summary.totalInputTokens += inputTokens;
    out.summary.totalOutputTokens += outputTokens;
    out.summary.completedSlugs += 1;

    console.log(
      `[variant-b]   Slug ${slugIdx}/${slugTotal} (${spec.slug}, Variant B) fertig — geschätzt ${round(estimatedLimitPercent, 2)}% des Sonnet-5h-Limits, kumulativ ${round(cumulativeLimitPercent, 2)}%.`,
    );

    // Persist incrementally so a crash mid-run keeps progress.
    await persistOutput(out);

    // Hard-stop: estimate next slug ~= last slug's percent for B (deterministic)
    if (i < TARGET_SLUGS.length - 1) {
      const nextEstimate = estimatedLimitPercent;
      if (cumulativeLimitPercent + nextEstimate > HARD_STOP_PERCENT) {
        out.summary.hardStopTriggered = true;
        await persistOutput(out);
        console.log(
          `\n[variant-b] HARD-STOP: cumulative ${round(cumulativeLimitPercent, 2)}% + nextEstimate ${round(nextEstimate, 2)}% > ${HARD_STOP_PERCENT}%. Pausiert.`,
        );
        console.log(
          `[variant-b] Limit-Schwelle erreicht — Cooldown abwarten oder weitermachen?`,
        );
        process.exit(0);
      }
    }
  }

  await persistOutput(out);
  console.log(
    `\n[variant-b] done — ${out.summary.completedSlugs}/${TARGET_SLUGS.length} slugs, cumulative ${out.summary.cumulativeLimitPercent}% (heuristik).`,
  );
  console.log(`[variant-b] output: ${OUTPUT_PATH}`);
}

function round(n: number, decimals: number): number {
  const m = 10 ** decimals;
  return Math.round(n * m) / m;
}

main().catch((e) => {
  console.error("[variant-b] fatal:", e);
  process.exit(1);
});
