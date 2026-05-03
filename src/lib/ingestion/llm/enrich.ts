/**
 * Phase 3c — LLM-Anreicherungs-Entry.
 *
 * Soft-Fail-Pattern wie Hardcover (`hardcover/fetch.ts`): wenn `ANTHROPIC_API_KEY`
 * fehlt, einmal-WARN und alle Crawler-Aufrufe returnen null. 401/403 trippen
 * den Circuit-Breaker; danach skippen alle weiteren Bücher.
 *
 * Cache-First: wenn ein gecached Payload mit passendem Schlüssel existiert
 * (Schlüssel = sha256(slug + PROMPT_VERSION_HASH + sha256(merged.fields))),
 * wird er zurückgegeben ohne API-Call. Verhindert Re-Run-Cost bei CLI-Crash.
 *
 * Tool-Use-Schema-Violation: einmal Retry mit Hint („please call
 * publish_enrichment with valid arguments"), dann error.
 *
 * Cost-Estimate basiert auf Sonnet 4.6 List-Pricing (Stand 2026-05) — wenn
 * Anthropic die Preise ändert, ist das ein Mini-Brief, kein Code-Refactor.
 */
import Anthropic from "@anthropic-ai/sdk";

import type {
  LLMPayload,
  MergedBook,
  SourcePayload,
} from "@/lib/ingestion/types";

import { buildCacheKey, readCache, writeCache } from "./cache";
import { fetchPlotContext } from "./context";
import { parseLlmResponse } from "./parse";
import {
  PROMPT_VERSION_HASH,
  PUBLISH_ENRICHMENT_TOOL,
  SYSTEM_PROMPT,
  WEB_SEARCH_TOOL,
  buildUserPrompt,
  loadFacetVocabulary,
} from "./prompt";

const DEFAULT_MODEL = "claude-haiku-4-5";
const MAX_OUTPUT_TOKENS = 2_048;
const MAX_HTTP_RETRIES = 3;

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
let circuitBreakerTripped = false;
let circuitBreakerReason: string | undefined;

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
 * `true` wenn `ANTHROPIC_API_KEY` gesetzt ist (non-empty) UND der Circuit-
 * Breaker noch nicht ausgelöst hat. Wird einmal beim ersten Aufruf einen WARN-
 * Log emittieren wenn der Key fehlt.
 */
export function isLlmEnabled(): boolean {
  if (circuitBreakerTripped) return false;
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

function tripCircuitBreaker(reason: string): void {
  if (circuitBreakerTripped) return;
  circuitBreakerTripped = true;
  circuitBreakerReason = reason;
  console.warn(
    `warn: Anthropic ${reason} — disabling LLM enrichment for the rest of this run.`,
  );
}

export function getCircuitBreakerReason(): string | undefined {
  return circuitBreakerReason;
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

let _client: Anthropic | undefined;
function getClient(): Anthropic {
  if (_client) return _client;
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      "enrichBookWithLLM: ANTHROPIC_API_KEY missing — gate calls with isLlmEnabled()",
    );
  }
  _client = new Anthropic({ apiKey });
  return _client;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface CallApiResult {
  kind: "ok";
  message: Anthropic.Message;
}
interface CallApiError {
  kind: "error";
  message: string;
}

interface CallApiInput {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  followupHint?: string;
}

async function callApiWithRetry(
  input: CallApiInput,
): Promise<CallApiResult | CallApiError> {
  const client = getClient();
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: input.userPrompt },
  ];
  if (input.followupHint) {
    messages.push({ role: "user", content: input.followupHint });
  }

  for (let attempt = 0; attempt <= MAX_HTTP_RETRIES; attempt++) {
    try {
      const message = await client.messages.create({
        model: input.model,
        max_tokens: MAX_OUTPUT_TOKENS,
        system: input.systemPrompt,
        messages,
        tools: [
          WEB_SEARCH_TOOL,
          PUBLISH_ENRICHMENT_TOOL,
        ] as unknown as Anthropic.Tool[],
      });
      return { kind: "ok", message };
    } catch (e) {
      const err = e as { status?: number; message?: string };
      const status = err.status;

      if (status === 401 || status === 403) {
        tripCircuitBreaker(`${status} key rejected`);
        return {
          kind: "error",
          message: `Anthropic ${status}: API key rejected. Check ANTHROPIC_API_KEY in .env.local.`,
        };
      }

      const retryable =
        status === undefined ||
        status === 429 ||
        (status >= 500 && status < 600);

      if (!retryable || attempt === MAX_HTTP_RETRIES) {
        return {
          kind: "error",
          message: `Anthropic ${status ?? "?"}: ${err.message ?? String(e)} (attempts ${attempt + 1})`,
        };
      }

      await sleep(1000 * 2 ** attempt);
    }
  }
  return { kind: "error", message: "callApiWithRetry: exhausted retries" };
}

const SCHEMA_RETRY_HINT =
  "Your previous response did not include a valid `publish_enrichment` tool call. Please call `publish_enrichment` exactly once with arguments matching the input_schema. Make sure synopsis is 100–150 words paraphrased, facetIds are array of strings, discoveredLinks is an array (possibly empty), and flags is an array (possibly empty).";

/**
 * Enrich one merged book via Claude Sonnet 4.6 + Web-Search. Returns the
 * resulting `LLMPayload` or null when the API key is missing / circuit-broken.
 * Throws only on infrastructure errors so the caller can route them into
 * `DiffFile.errors`.
 */
export async function enrichBookWithLLM(
  merged: MergedBook,
  rawPayloads: SourcePayload[],
): Promise<LLMPayload | null> {
  if (!isLlmEnabled()) return null;

  const cacheKey = buildCacheKey(merged.slug, PROMPT_VERSION_HASH, merged);
  const cached = await readCache(merged.slug, cacheKey);
  if (cached) {
    cached.payload.audit ??= {};
    cached.payload.audit.modelUsed = cached.model;
    return cached.payload;
  }

  const model = getLlmModel();
  const { categories, validFacetIds } = await loadFacetVocabulary();
  const plotContext = await fetchPlotContext(merged);
  const userPrompt = buildUserPrompt({
    merged,
    rawPayloads,
    plotContext,
    vocabulary: categories,
  });

  // First attempt
  const first = await callApiWithRetry({
    model,
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
  });
  if (first.kind === "error") throw new Error(first.message);

  let parsed = parseLlmResponse({
    message: first.message,
    validFacetIds,
  });

  // Schema-Violation → einmal Retry mit Hint.
  if (parsed.kind === "parse_error") {
    const second = await callApiWithRetry({
      model,
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: `${userPrompt}\n\n---\n\n${SCHEMA_RETRY_HINT}\n\nValidation error from your previous response: ${parsed.message}`,
    });
    if (second.kind === "error") throw new Error(second.message);

    parsed = parseLlmResponse({
      message: second.message,
      validFacetIds,
    });
    if (parsed.kind === "parse_error") {
      throw new Error(
        `LLM tool-call schema violation after retry: ${parsed.message}`,
      );
    }
  }

  parsed.payload.audit ??= {};
  parsed.payload.audit.modelUsed = model;

  await writeCache(merged.slug, cacheKey, model, PROMPT_VERSION_HASH, parsed.payload);
  return parsed.payload;
}
