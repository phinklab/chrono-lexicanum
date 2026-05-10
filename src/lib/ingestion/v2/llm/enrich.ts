/**
 * Pipeline V2 — slim LLM enricher (Brief 054).
 *
 * Adapted from V1's `llm/enrich.ts`. Differences:
 *
 *   - Uses V2 system prompt + V2 tool schema + V2 max_uses=3 web-search.
 *   - Returns a `SlimLlmPayload` (V2 shape) with role-annotated entities.
 *   - Reuses V1's `ingest/.llm-cache/<slug>.json` directory but with the V2
 *     prompt-version-hash so V1 and V2 entries don't collide on key match.
 *     Both pipelines write to the same file path; whichever runs last
 *     overwrites — fine for the pilot's five-book scope.
 *   - Reuses V1's `Anthropic` client construction (`getApiKey`,
 *     `getLlmModel`, circuit breaker, pricing). Imported indirectly via the
 *     V1 `enrich.ts` exports.
 */
import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  estimateUsdCost,
  getLlmModel,
  isLlmEnabled,
} from "../../llm/enrich";
import { fetchPlotContext } from "../../llm/context";
import type { MergedBook, SourcePayload } from "../../types";
import type { SlimLlmPayload, Validation } from "../types";

import {
  PROMPT_VERSION_HASH_V2,
  PUBLISH_ENRICHMENT_TOOL_V2,
  SYSTEM_PROMPT_V2,
  WEB_SEARCH_TOOL_V2,
  buildUserPromptV2,
  loadFacetVocabulary,
} from "./prompt";
import { parseLlmResponseV2 } from "./parse";

const MAX_OUTPUT_TOKENS = 2_048;
const MAX_HTTP_RETRIES = 3;
const CACHE_DIR = join(process.cwd(), "ingest", ".llm-cache");

let _client: Anthropic | undefined;
function getClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("enrichBookWithLlmV2: ANTHROPIC_API_KEY missing");
  }
  _client = new Anthropic({ apiKey });
  return _client;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface CallApiInput {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  followupHint?: string;
}

type CallApiResult =
  | { kind: "ok"; message: Anthropic.Message }
  | { kind: "error"; message: string };

async function callApiWithRetry(input: CallApiInput): Promise<CallApiResult> {
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
          WEB_SEARCH_TOOL_V2,
          PUBLISH_ENRICHMENT_TOOL_V2,
        ] as unknown as Anthropic.Tool[],
      });
      return { kind: "ok", message };
    } catch (e) {
      const err = e as { status?: number; message?: string };
      const status = err.status;
      if (status === 401 || status === 403) {
        return {
          kind: "error",
          message: `Anthropic ${status}: API key rejected.`,
        };
      }
      const retryable =
        status === undefined || status === 429 || (status >= 500 && status < 600);
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

const SCHEMA_RETRY_HINT_V2 =
  "Your previous response did not include a valid `publish_enrichment` tool call (V2 shape). Please call `publish_enrichment` exactly once with arguments matching the V2 input_schema. Make sure synopsis is 100–150 words paraphrased, facetIds is array of strings, factions/locations/characters are arrays of {name, role}, and flags is an array (possibly empty).";

interface CachedEntryV2 {
  key: string;
  model: string;
  version: string;
  savedAt: string;
  payload: SlimLlmPayload;
}

function buildCacheKey(slug: string, merged: MergedBook): string {
  const sortedKeys = Object.keys(merged.fields).sort();
  const canonical: Record<string, unknown> = {};
  for (const k of sortedKeys) canonical[k] = (merged.fields as Record<string, unknown>)[k];
  const inputHash = createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
  return createHash("sha256")
    .update(`${slug}::v2::${PROMPT_VERSION_HASH_V2}::${inputHash}`)
    .digest("hex")
    .slice(0, 32);
}

async function readCacheV2(
  slug: string,
  key: string,
): Promise<{ payload: SlimLlmPayload; model: string } | undefined> {
  try {
    const raw = await readFile(join(CACHE_DIR, `${slug}.v2.json`), "utf8");
    const entry = JSON.parse(raw) as CachedEntryV2;
    if (entry.key !== key) return undefined;
    return { payload: entry.payload, model: entry.model };
  } catch {
    return undefined;
  }
}

async function writeCacheV2(
  slug: string,
  key: string,
  model: string,
  payload: SlimLlmPayload,
): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  const entry: CachedEntryV2 = {
    key,
    model,
    version: PROMPT_VERSION_HASH_V2,
    savedAt: new Date().toISOString(),
    payload,
  };
  await writeFile(join(CACHE_DIR, `${slug}.v2.json`), JSON.stringify(entry, null, 2), "utf8");
}

export interface EnrichV2Result {
  payload: SlimLlmPayload;
  cached: boolean;
  estUsdCost: number;
}

/**
 * Run the V2 LLM enrichment for one book. Returns null when the API key is
 * missing — caller gates with `isLlmEnabled()`.
 */
export async function enrichBookWithLlmV2(
  merged: MergedBook,
  rawPayloads: SourcePayload[],
  validations: Validation[] = [],
): Promise<EnrichV2Result | null> {
  if (!isLlmEnabled()) return null;

  const cacheKey = buildCacheKey(merged.slug, merged);
  const cached = await readCacheV2(merged.slug, cacheKey);
  if (cached) {
    // Recompute cost from the cached payload's token usage and the model
    // recorded *in the cache file* (not the currently-configured model —
    // a Haiku-cached entry must price under Haiku even if config now says
    // Sonnet). The cache file itself is not rewritten — recompute is a
    // read-time operation feeding the diff aggregation only. Brief 056
    // Fix 3; mirrors scripts/synthesize-v2-batch-diff.ts.
    const usage = cached.payload.audit.tokenUsage;
    const estUsdCost = estimateUsdCost(
      {
        totalTokensIn: usage.input,
        totalTokensOut: usage.output,
        totalWebSearches: usage.webSearchCount,
      },
      cached.model,
    );
    return { payload: cached.payload, cached: true, estUsdCost };
  }

  const model = getLlmModel();
  const { categories, validFacetIds } = await loadFacetVocabulary();
  const plotContext = await fetchPlotContext(merged);
  const userPrompt = buildUserPromptV2({
    merged,
    rawPayloads,
    plotContext,
    vocabulary: categories,
    validations: validations.map((v) => ({
      kind: v.kind,
      field: v.field,
      reasoning: v.reasoning,
    })),
  });

  const first = await callApiWithRetry({
    model,
    systemPrompt: SYSTEM_PROMPT_V2,
    userPrompt,
  });
  if (first.kind === "error") throw new Error(first.message);

  let parsed = parseLlmResponseV2({
    message: first.message,
    validFacetIds,
    modelUsed: model,
  });

  if (parsed.kind === "parse_error") {
    const second = await callApiWithRetry({
      model,
      systemPrompt: SYSTEM_PROMPT_V2,
      userPrompt: `${userPrompt}\n\n---\n\n${SCHEMA_RETRY_HINT_V2}\n\nValidation error: ${parsed.message}`,
    });
    if (second.kind === "error") throw new Error(second.message);
    parsed = parseLlmResponseV2({
      message: second.message,
      validFacetIds,
      modelUsed: model,
    });
    if (parsed.kind === "parse_error") {
      throw new Error(`LLM tool-call schema violation after retry: ${parsed.message}`);
    }
  }

  const payload = parsed.payload;
  const usage = payload.audit.tokenUsage;
  const estUsdCost = estimateUsdCost(
    {
      totalTokensIn: usage.input,
      totalTokensOut: usage.output,
      totalWebSearches: usage.webSearchCount,
    },
    model,
  );

  await writeCacheV2(merged.slug, cacheKey, model, payload);
  return { payload, cached: false, estUsdCost };
}
