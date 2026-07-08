/**
 * Shared LLM utilities for the ingestion paths.
 *
 * Three utilities consumed by the live podcast-ingest path
 * (`podcast/extract.ts`, `scripts/ingest-podcast.ts`): model choice, key
 * gate, cost estimate.
 *
 * The cost estimate is based on list pricing (as of 2026-05) — if Anthropic
 * changes prices, update the table here.
 */

const DEFAULT_MODEL = "claude-haiku-4-5";

// Anthropic list pricing (as of 2026-05). Lookup per model — the
// `llmCostSummary` top-level slot sums per run, so the single-model
// assumption holds (mixed-model runs would need extra logic).
const PRICING: Record<
  string,
  { in: number; out: number; search: number }
> = {
  "claude-sonnet-4-6": { in: 3 / 1_000_000, out: 15 / 1_000_000, search: 0.01 },
  "claude-haiku-4-5": { in: 1 / 1_000_000, out: 5 / 1_000_000, search: 0.01 },
};
const FALLBACK_PRICING = PRICING["claude-sonnet-4-6"];

let warnedMissingKeyOnce = false;

function getApiKey(): string | undefined {
  const v = process.env.ANTHROPIC_API_KEY;
  if (!v || v.trim() === "") return undefined;
  return v.trim();
}

export function getLlmModel(): string {
  const v = process.env.INGEST_LLM_MODEL;
  if (v && v.trim() !== "") return v.trim();
  return DEFAULT_MODEL;
}

/**
 * `true` when `ANTHROPIC_API_KEY` is set (non-empty). Emits a WARN log once,
 * on the first call, when the key is missing.
 */
export function isLlmEnabled(): boolean {
  const k = getApiKey();
  if (k) return true;
  if (!warnedMissingKeyOnce) {
    warnedMissingKeyOnce = true;
    console.warn(
      "warn: ANTHROPIC_API_KEY missing — LLM enrichment disabled for this run. " +
        "Set it in .env.local to enable (sk-ant-... from console.anthropic.com).",
    );
  }
  return false;
}

export function estimateUsdCost(
  usage: {
    totalTokensIn: number;
    totalTokensOut: number;
    totalWebSearches: number;
  },
  model: string,
): number {
  const p = PRICING[model] ?? FALLBACK_PRICING;
  return (
    usage.totalTokensIn * p.in +
    usage.totalTokensOut * p.out +
    usage.totalWebSearches * p.search
  );
}
