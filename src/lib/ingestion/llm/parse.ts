/**
 * Phase 3c — Parser für die Anthropic-Tool-Call-Antwort.
 *
 * Validiert dass die Message genau einen `publish_enrichment`-Tool-Use enthält,
 * extrahiert Felder + Audit, zählt `web_search`-Trajektorie-Calls (nicht
 * `web_search_tool_result` — das sind die Server-Antworten), validiert
 * facetIds gegen das DB-Vokabular und mappt alles in einen `LLMPayload`.
 *
 * Bei Schema-Violation gibt der Parser eine `ParseError` zurück; der Caller
 * (enrich.ts) entscheidet ob ein Retry-mit-Hint sinnvoll ist.
 */
import type Anthropic from "@anthropic-ai/sdk";

import type {
  DiscoveredLink,
  LLMFlag,
  LLMFlagKind,
  LLMPayload,
} from "@/lib/ingestion/types";

const VALID_FLAG_KINDS: ReadonlySet<LLMFlagKind> = new Set([
  "data_conflict",
  "value_outside_vocabulary",
  "series_total_mismatch",
  "author_mismatch",
  "year_glitch",
  "proposed_new_facet",
  "insufficient_web_search",
  "no_storefronts_found",
  "no_rating_found",
]);

const VALID_LINK_KINDS = new Set(["shop", "audio", "reference"]);

export interface ParseError {
  kind: "parse_error";
  message: string;
}

export type ParseResult =
  | { kind: "ok"; payload: LLMPayload }
  | ParseError;

interface PublishEnrichmentInput {
  synopsis?: unknown;
  format?: unknown;
  availability?: unknown;
  facetIds?: unknown;
  discoveredLinks?: unknown;
  rating?: unknown;
  flags?: unknown;
}

function isToolUseBlock(
  block: Anthropic.ContentBlock,
): block is Anthropic.ToolUseBlock {
  return block.type === "tool_use";
}

function isServerToolUseBlock(
  block: Anthropic.ContentBlock,
): block is Anthropic.ServerToolUseBlock {
  return block.type === "server_tool_use";
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

/**
 * Count `web_search` server-tool-use blocks. Does NOT count
 * `web_search_tool_result` (those are server responses, not tool calls — they
 * would double the count if included).
 */
export function countWebSearchCalls(message: Anthropic.Message): number {
  let n = 0;
  for (const block of message.content) {
    if (isServerToolUseBlock(block) && block.name === "web_search") {
      n += 1;
    }
  }
  return n;
}

function parseDiscoveredLinks(raw: unknown): DiscoveredLink[] {
  if (!Array.isArray(raw)) return [];
  const out: DiscoveredLink[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    if (
      typeof r.serviceHint === "string" &&
      typeof r.url === "string" &&
      typeof r.kind === "string" &&
      VALID_LINK_KINDS.has(r.kind)
    ) {
      out.push({
        serviceHint: r.serviceHint,
        kind: r.kind as DiscoveredLink["kind"],
        url: r.url,
      });
    }
  }
  return out;
}

function parseFlags(raw: unknown): LLMFlag[] {
  if (!Array.isArray(raw)) return [];
  const out: LLMFlag[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    if (typeof r.kind !== "string") continue;
    if (!VALID_FLAG_KINDS.has(r.kind as LLMFlagKind)) continue;
    const flag: LLMFlag = { kind: r.kind as LLMFlagKind };
    if (typeof r.field === "string") flag.field = r.field;
    if (r.current !== undefined) flag.current = r.current;
    if (r.suggestion !== undefined) flag.suggestion = r.suggestion;
    if (isStringArray(r.sources)) flag.sources = r.sources;
    if (typeof r.reasoning === "string") flag.reasoning = r.reasoning;
    out.push(flag);
  }
  return out;
}

interface ParsedRating {
  value?: number;
  source?: string;
  count?: number;
}

function parseRating(raw: unknown): ParsedRating {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  const out: ParsedRating = {};
  if (typeof r.value === "number" && Number.isFinite(r.value)) {
    out.value = Math.max(0, Math.min(5, r.value));
  }
  if (typeof r.source === "string") out.source = r.source;
  if (typeof r.count === "number" && Number.isFinite(r.count) && r.count >= 0) {
    out.count = Math.floor(r.count);
  }
  return out;
}

export interface ParseLlmResponseInput {
  message: Anthropic.Message;
  validFacetIds: ReadonlySet<string>;
}

/**
 * Parse a Claude Message into an `LLMPayload`. Returns either `{ kind: "ok",
 * payload }` or `{ kind: "parse_error", message }`. Validation outcomes that
 * are non-fatal (insufficient web_search, value_outside_vocabulary) are
 * recorded as flags inside the returned payload, NOT as a parse error.
 */
export function parseLlmResponse(input: ParseLlmResponseInput): ParseResult {
  const { message, validFacetIds } = input;

  const toolUses = message.content.filter(isToolUseBlock);
  const publish = toolUses.find((t) => t.name === "publish_enrichment");

  if (!publish) {
    return {
      kind: "parse_error",
      message: `expected exactly one "publish_enrichment" tool call; got ${toolUses.length} tool_use blocks (names: ${toolUses.map((t) => t.name).join(", ") || "none"})`,
    };
  }

  if (!publish.input || typeof publish.input !== "object") {
    return {
      kind: "parse_error",
      message: "publish_enrichment.input is not an object",
    };
  }

  const input_ = publish.input as PublishEnrichmentInput;

  // Required-Felder
  if (typeof input_.synopsis !== "string" || input_.synopsis.length < 10) {
    return {
      kind: "parse_error",
      message: "publish_enrichment.synopsis missing or too short",
    };
  }
  if (!isStringArray(input_.facetIds)) {
    return {
      kind: "parse_error",
      message: "publish_enrichment.facetIds must be an array of strings",
    };
  }

  const facetIds = input_.facetIds;
  const discoveredLinks = parseDiscoveredLinks(input_.discoveredLinks);
  const flags = parseFlags(input_.flags);
  const rating = parseRating(input_.rating);

  // Vokabular-Validation: nicht-existierende Facet-IDs flaggen statt rejecten.
  const invalidFacetIds: string[] = [];
  for (const id of facetIds) {
    if (!validFacetIds.has(id)) invalidFacetIds.push(id);
  }
  for (const bad of invalidFacetIds) {
    flags.push({
      kind: "value_outside_vocabulary",
      field: "facetIds",
      current: bad,
      reasoning: "ID not present in facet_values vocabulary at runtime",
    });
  }

  // Web-Search-Trajektorie
  const webSearchCount = countWebSearchCalls(message);
  if (webSearchCount < 2) {
    flags.push({
      kind: "insufficient_web_search",
      reasoning: `expected ≥2 web_search calls, observed ${webSearchCount}`,
    });
  }

  // Coverage-Flags falls vom Modell vergessen — defensiv ergänzen.
  if (discoveredLinks.length === 0 && !flags.some((f) => f.kind === "no_storefronts_found")) {
    flags.push({
      kind: "no_storefronts_found",
      reasoning: "auto-added: discoveredLinks array is empty",
    });
  }
  if (rating.value === undefined && !flags.some((f) => f.kind === "no_rating_found")) {
    flags.push({
      kind: "no_rating_found",
      reasoning: "auto-added: no rating object returned",
    });
  }

  // Build the LLMPayload.
  const fields: LLMPayload["fields"] = {
    synopsis: input_.synopsis,
  };
  if (typeof input_.format === "string") {
    fields.format = input_.format as LLMPayload["fields"]["format"];
  }
  if (typeof input_.availability === "string") {
    fields.availability = input_.availability as LLMPayload["fields"]["availability"];
  }
  // Filter facetIds to only the valid ones for `fields.facetIds` — keeping
  // invalid ones in the payload would land bogus IDs into FIELD_PRIORITY.
  // The `audit.facetIds` slot keeps the FULL list (incl. invalids) for 3d
  // visibility; flags carry the value_outside_vocabulary record.
  const validFacetSubset = facetIds.filter((id) => validFacetIds.has(id));
  if (validFacetSubset.length > 0) fields.facetIds = validFacetSubset;
  if (rating.value !== undefined) fields.rating = rating.value;
  if (rating.source) fields.ratingSource = rating.source;
  if (rating.count !== undefined) fields.ratingCount = rating.count;

  const usage = message.usage;
  const tokenUsage = {
    input: usage.input_tokens,
    output: usage.output_tokens,
    webSearchCount,
  };

  const payload: LLMPayload = {
    source: "llm",
    fields,
    audit: {
      facetIds,
      flags,
      discoveredLinks,
      tokenUsage,
    },
  };

  return { kind: "ok", payload };
}
