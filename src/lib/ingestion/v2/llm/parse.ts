/**
 * Pipeline V2 — slim LLM response parser (Brief 054).
 *
 * Reads the Anthropic Message and produces a `SlimLlmPayload`. The shape is
 * a structured `factions/locations/characters` array each (not raw name
 * arrays as in V1). `availability` and `rating` are not parsed — the V2
 * schema doesn't include them.
 *
 * Schema-validation errors return a `parse_error`; the caller (enrich-v2.ts)
 * decides whether to retry-with-hint.
 */
import type Anthropic from "@anthropic-ai/sdk";

import type { BookFormat } from "../../types";
import {
  BOOK_FORMAT_VALUES,
  CHARACTER_ROLES,
  FACTION_ROLES,
  LOCATION_ROLES,
} from "./prompt";
import type { RoleAnnotated, SlimLlmPayload } from "../types";

const FACTION_ROLE_SET = new Set<string>(FACTION_ROLES);
const LOCATION_ROLE_SET = new Set<string>(LOCATION_ROLES);
const CHARACTER_ROLE_SET = new Set<string>(CHARACTER_ROLES);

const FORMAT_CLOSEST_MATCH: Record<string, BookFormat> = {
  book: "novel",
  short: "short_story",
};

export interface ParseErrorV2 {
  kind: "parse_error";
  message: string;
}

export type ParseResultV2 =
  | { kind: "ok"; payload: SlimLlmPayload }
  | ParseErrorV2;

interface PublishEnrichmentInputV2 {
  synopsis?: unknown;
  format?: unknown;
  facetIds?: unknown;
  factions?: unknown;
  locations?: unknown;
  characters?: unknown;
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

export function countWebSearchCallsV2(message: Anthropic.Message): number {
  let n = 0;
  for (const block of message.content) {
    if (isServerToolUseBlock(block) && block.name === "web_search") n += 1;
  }
  return n;
}

function parseRoleAnnotated(raw: unknown, validRoles: ReadonlySet<string>): RoleAnnotated[] {
  if (!Array.isArray(raw)) return [];
  const out: RoleAnnotated[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    if (typeof r.name !== "string" || typeof r.role !== "string") continue;
    const name = r.name.trim();
    const role = r.role.trim();
    if (!name) continue;
    // Role NOT in vocabulary → keep entry but log via outer flags-collector
    // — for simplicity here we drop the entry only when role is missing.
    if (!validRoles.has(role)) {
      // Allow `background` to flow through for factions even though the brief
      // notes it's not in `work_factions.role` defaults — Open Question 3 in
      // the brief instructs to leave it; 3d-apply maps it.
      out.push({ name, role });
      continue;
    }
    out.push({ name, role });
  }
  return out;
}

function coerceFormat(raw: unknown): BookFormat | undefined {
  if (typeof raw !== "string") return undefined;
  if ((BOOK_FORMAT_VALUES as readonly string[]).includes(raw)) return raw as BookFormat;
  const mapped = FORMAT_CLOSEST_MATCH[raw];
  return mapped;
}

function parseFlags(raw: unknown): Array<{ kind: string; field?: string; reasoning?: string }> {
  if (!Array.isArray(raw)) return [];
  const out: Array<{ kind: string; field?: string; reasoning?: string }> = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    if (typeof r.kind !== "string") continue;
    const flag: { kind: string; field?: string; reasoning?: string } = { kind: r.kind };
    if (typeof r.field === "string") flag.field = r.field;
    if (typeof r.reasoning === "string") flag.reasoning = r.reasoning;
    out.push(flag);
  }
  return out;
}

export interface ParseLlmResponseV2Input {
  message: Anthropic.Message;
  validFacetIds: ReadonlySet<string>;
  modelUsed: string;
}

export function parseLlmResponseV2(input: ParseLlmResponseV2Input): ParseResultV2 {
  const { message, validFacetIds, modelUsed } = input;

  const toolUses = message.content.filter(isToolUseBlock);
  const publish = toolUses.find((t) => t.name === "publish_enrichment");
  if (!publish) {
    return {
      kind: "parse_error",
      message: `expected exactly one "publish_enrichment" tool call; got ${toolUses.length} tool_use blocks (names: ${toolUses.map((t) => t.name).join(", ") || "none"})`,
    };
  }
  if (!publish.input || typeof publish.input !== "object") {
    return { kind: "parse_error", message: "publish_enrichment.input is not an object" };
  }
  const input_ = publish.input as PublishEnrichmentInputV2;

  if (typeof input_.synopsis !== "string" || input_.synopsis.length < 10) {
    return { kind: "parse_error", message: "publish_enrichment.synopsis missing or too short" };
  }
  if (!isStringArray(input_.facetIds)) {
    return { kind: "parse_error", message: "publish_enrichment.facetIds must be an array of strings" };
  }

  const flags = parseFlags(input_.flags);
  const facetIds = input_.facetIds;
  const validFacetSubset = facetIds.filter((id) => validFacetIds.has(id));
  for (const bad of facetIds.filter((id) => !validFacetIds.has(id))) {
    flags.push({
      kind: "value_outside_vocabulary",
      field: "facetIds",
      reasoning: `${bad}: ID not present in facet_values vocabulary at runtime`,
    });
  }

  const webSearchCount = countWebSearchCallsV2(message);
  if (webSearchCount < 1) {
    flags.push({
      kind: "insufficient_web_search",
      reasoning: `expected ≥1 web_search call (synopsis-context), observed ${webSearchCount}`,
    });
  }

  const usage = message.usage;
  const payload: SlimLlmPayload = {
    synopsis: input_.synopsis,
    format: coerceFormat(input_.format),
    facetIds: validFacetSubset,
    factions: parseRoleAnnotated(input_.factions, FACTION_ROLE_SET),
    locations: parseRoleAnnotated(input_.locations, LOCATION_ROLE_SET),
    characters: parseRoleAnnotated(input_.characters, CHARACTER_ROLE_SET),
    flags,
    audit: {
      modelUsed,
      tokenUsage: {
        input: usage.input_tokens,
        output: usage.output_tokens,
        webSearchCount,
      },
    },
  };
  return { kind: "ok", payload };
}
