/**
 * LLM-Utility-Rest der Phase-3c-Anreicherung (Brief 177 Dead-Code-Sweep).
 *
 * Der V1-Anreicherungs-Entry (`enrichBookWithLLM` + Anthropic-Client +
 * Circuit-Breaker + Cache/Context/Prompt/Parse-Module) ist entfernt — die
 * Buch-Anreicherung läuft seit der Per-Buch-SSOT-Migration (Brief 170/171)
 * nicht mehr über diesen Pfad. Übrig bleiben die drei Utilities, die der
 * lebende Podcast-Ingest-Pfad konsumiert (`podcast/extract.ts`,
 * `scripts/ingest-podcast.ts`): Modell-Wahl, Key-Gate, Cost-Estimate.
 *
 * Cost-Estimate basiert auf List-Pricing (Stand 2026-05) — wenn Anthropic
 * die Preise ändert, ist das ein Mini-Brief, kein Code-Refactor.
 */

const DEFAULT_MODEL = "claude-haiku-4-5";

// Anthropic Pricing (Stand 2026-05; Mini-Brief wenn das wechselt). Lookup pro
// Modell — der `llmCostSummary`-Top-Level-Slot summiert pro Run, also gilt
// die single-model-assumption (gemischte Mode würde extra Logik brauchen).
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
 * `true` wenn `ANTHROPIC_API_KEY` gesetzt ist (non-empty). Wird einmal beim
 * ersten Aufruf einen WARN-Log emittieren wenn der Key fehlt.
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
