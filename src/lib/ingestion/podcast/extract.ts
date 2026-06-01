/**
 * Brief 110 Step 1 — episode-entity extraction via the project's LLM path.
 *
 * Reuses the book pipeline's LLM PRIMITIVES (model config via `getLlmModel`,
 * the `@anthropic-ai/sdk` tool-use + retry-on-schema-violation shape, the
 * `ingest/.llm-cache/` caching idea) but NOT `enrichBookWithLLM`, which is
 * book-shaped. The extraction is podcast-specific: from one episode's
 * title + description, identify the WH40k entities it is about, split per axis
 * into `primary` (subject) vs `mentioned`, plus a coarse `episodeKind`.
 *
 * The tool is FORCED (`tool_choice`) at `temperature: 0` for clean, near-
 * deterministic structured output; combined with the cache, a warm re-run is
 * byte-stable. No web_search — the only evidence is the provided text
 * (Brief 110: "No transcripts").
 *
 * Model: `PODCAST_LLM_MODEL` (if set) else the book pipeline's `getLlmModel()`.
 * Env-driven, never pinned in code (version policy) — and independent of the
 * book model so the two pipelines can run different tiers.
 */
import { createHash } from "node:crypto";

import Anthropic from "@anthropic-ai/sdk";

import { getLlmModel } from "@/lib/ingestion/llm/enrich";

import { buildEpisodeCacheKey, type PodcastCacheFile } from "./cache";
import type { AxisExtraction, EpisodeExtraction, EpisodeKind, PodcastEpisode } from "./types";
import { EPISODE_KINDS } from "./types";

const MAX_OUTPUT_TOKENS = 1_024;
const MAX_HTTP_RETRIES = 3;
const MAX_DESC_CHARS = 6_000;

/** Podcast extraction model: env knob first, else the shared book-pipeline model. */
export function getPodcastLlmModel(): string {
  const v = process.env.PODCAST_LLM_MODEL;
  if (v && v.trim() !== "") return v.trim();
  return getLlmModel();
}

// --- prompt + tool schema -----------------------------------------------------

export const EPISODE_SYSTEM_PROMPT = `You are a tagging module for a Warhammer 40,000 podcast archive. You receive ONE podcast episode's title and description. Identify the canonical Warhammer 40,000 entities the episode is ABOUT, then call \`publish_episode_entities\` exactly once.

For each of three axes — characters, factions, locations — return two lists:
- **primary**: entities the episode is substantially about (its subject matter).
- **mentioned**: entities named only in passing.

Axis definitions:
- **characters** — named individuals (e.g. Primarchs, named heroes/villains, named historical figures). NOT factions or titles.
- **factions** — armies, Space Marine Chapters, Legions, xenos races, cults, and organisations (e.g. "Night Lords", "Astra Militarum", "Necrons", "Inquisition").
- **locations** — worlds, sectors, systems, segmenta, warp features, and other notable places (e.g. "Terra", "Eye of Terror", "Cadia", "Segmentum Obscurus").

Rules:
- Use surface forms exactly as a lore reader would write them ("Konrad Curze", "Night Lords", "Astra Militarum"). Do NOT output slugs.
- Only include an entity the text actually supports. An empty list is the correct answer for a news round-up or an interview with no in-universe subject. Do NOT pad lists to look thorough.
- Tag only in-universe Warhammer 40,000 entities. Treat real-world names (hosts, guests, authors, companies like "Games Workshop" or "Black Library") as NOT entities — they belong in neither list.
- If a host name or guest appears, that signals episodeKind, not a character tag.

Also classify **episodeKind**:
- "lore" — focused on an in-universe topic (a character, faction, world, event).
- "news_recap" — product news, release round-ups, community/hobby news.
- "interview" — a conversation with a guest as the main format.
- "other" — anything else (Q&A, off-topic, housekeeping).`;

const AXIS_PROPERTY = {
  type: "object",
  required: ["primary", "mentioned"],
  properties: {
    primary: {
      type: "array",
      items: { type: "string" },
      description: "Entities the episode is substantially ABOUT (its subject). Empty array is fine.",
    },
    mentioned: {
      type: "array",
      items: { type: "string" },
      description: "Entities named only in passing. Empty array is fine.",
    },
  },
};

export const PUBLISH_EPISODE_ENTITIES_TOOL = {
  name: "publish_episode_entities",
  description:
    "Publish the Warhammer 40,000 entities a single podcast episode is about. Call exactly once.",
  input_schema: {
    type: "object" as const,
    required: ["episodeKind", "characters", "factions", "locations"],
    properties: {
      episodeKind: {
        type: "string",
        enum: [...EPISODE_KINDS],
        description: "Coarse classification of the episode's format/subject.",
      },
      characters: { ...AXIS_PROPERTY, description: "Named individuals." },
      factions: { ...AXIS_PROPERTY, description: "Armies, Chapters, Legions, xenos races, organisations." },
      locations: { ...AXIS_PROPERTY, description: "Worlds, sectors, systems, segmenta, notable places." },
    },
  },
};

/** sha256[:12] over system prompt + tool schema — the cache invalidator. */
export const EPISODE_PROMPT_VERSION_HASH = createHash("sha256")
  .update(EPISODE_SYSTEM_PROMPT)
  .update(JSON.stringify(PUBLISH_EPISODE_ENTITIES_TOOL))
  .digest("hex")
  .slice(0, 12);

// --- response parsing (hand-rolled, no `any`) --------------------------------

function isToolUseBlock(
  block: Anthropic.ContentBlock,
): block is Anthropic.ToolUseBlock {
  return block.type === "tool_use";
}

function parseStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const item of v) {
    if (typeof item !== "string") continue;
    const t = item.trim();
    if (t.length > 0) out.push(t);
  }
  return out;
}

function parseAxis(v: unknown): AxisExtraction {
  const rec =
    v !== null && typeof v === "object" && !Array.isArray(v)
      ? (v as Record<string, unknown>)
      : {};
  return { primary: parseStringArray(rec.primary), mentioned: parseStringArray(rec.mentioned) };
}

function parseEpisodeKind(v: unknown): EpisodeKind {
  if (typeof v === "string" && (EPISODE_KINDS as readonly string[]).includes(v)) {
    return v as EpisodeKind;
  }
  return "other";
}

type ParseOutcome =
  | { kind: "ok"; extraction: EpisodeExtraction }
  | { kind: "parse_error"; message: string };

function parseEpisodeMessage(message: Anthropic.Message): ParseOutcome {
  const toolUses = message.content.filter(isToolUseBlock);
  const publish = toolUses.find((t) => t.name === "publish_episode_entities");
  if (!publish) {
    return {
      kind: "parse_error",
      message: `expected a publish_episode_entities tool call; got [${toolUses.map((t) => t.name).join(", ") || "none"}]`,
    };
  }
  if (!publish.input || typeof publish.input !== "object") {
    return { kind: "parse_error", message: "publish_episode_entities.input is not an object" };
  }
  const input = publish.input as Record<string, unknown>;
  return {
    kind: "ok",
    extraction: {
      episodeKind: parseEpisodeKind(input.episodeKind),
      characters: parseAxis(input.characters),
      factions: parseAxis(input.factions),
      locations: parseAxis(input.locations),
    },
  };
}

// --- API call (retry on 429/5xx/network; mirror enrich.ts) -------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type ApiOutcome =
  | { kind: "ok"; message: Anthropic.Message }
  | { kind: "error"; message: string };

async function callApi(
  client: Anthropic,
  model: string,
  userPrompt: string,
): Promise<ApiOutcome> {
  for (let attempt = 0; attempt <= MAX_HTTP_RETRIES; attempt++) {
    try {
      const message = await client.messages.create({
        model,
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: 0,
        system: EPISODE_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
        tools: [PUBLISH_EPISODE_ENTITIES_TOOL] as unknown as Anthropic.Tool[],
        tool_choice: { type: "tool", name: "publish_episode_entities" },
      });
      return { kind: "ok", message };
    } catch (e) {
      const err = e as { status?: number; message?: string };
      const status = err.status;
      if (status === 401 || status === 403) {
        return {
          kind: "error",
          message: `Anthropic ${status}: API key rejected. Check ANTHROPIC_API_KEY in .env.local.`,
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
  return { kind: "error", message: "callApi: exhausted retries" };
}

function buildUserPrompt(ep: PodcastEpisode): string {
  const desc =
    ep.descriptionText.length > MAX_DESC_CHARS
      ? ep.descriptionText.slice(0, MAX_DESC_CHARS).trimEnd() + " […]"
      : ep.descriptionText;
  return `# Podcast episode

## Title
${ep.title || "(untitled)"}

## Description
${desc || "(no description provided)"}

Identify the Warhammer 40,000 entities this episode is about, then call \`publish_episode_entities\` exactly once.`;
}

export interface ExtractDeps {
  client: Anthropic;
  model: string;
  /** Mutated in place on a cache miss; the caller persists it. */
  cache: PodcastCacheFile;
}

export interface ExtractResult {
  extraction: EpisodeExtraction;
  usage: { input: number; output: number };
  fromCache: boolean;
  cacheKey: string;
}

/**
 * Extract one episode's entities. Cache hit → replay verbatim (no API call).
 * Miss → forced tool call (temp 0); one retry-with-hint on a schema violation,
 * then throw. Stores the result into `deps.cache` on a miss.
 */
export async function extractEpisodeEntities(
  ep: PodcastEpisode,
  deps: ExtractDeps,
): Promise<ExtractResult> {
  const { client, model, cache } = deps;
  const cacheKey = buildEpisodeCacheKey(model, EPISODE_PROMPT_VERSION_HASH, ep);
  const cached = cache[cacheKey];
  if (cached && cached.key === cacheKey) {
    return { extraction: cached.extraction, usage: cached.usage, fromCache: true, cacheKey };
  }

  const userPrompt = buildUserPrompt(ep);
  const first = await callApi(client, model, userPrompt);
  if (first.kind === "error") throw new Error(first.message);

  let parsed = parseEpisodeMessage(first.message);
  let message = first.message;
  if (parsed.kind === "parse_error") {
    const retryPrompt = `${userPrompt}

---

Your previous response did not include a valid publish_episode_entities tool call (${parsed.message}). Call publish_episode_entities exactly once with episodeKind plus characters/factions/locations objects, each having string arrays "primary" and "mentioned" (empty arrays are fine).`;
    const second = await callApi(client, model, retryPrompt);
    if (second.kind === "error") throw new Error(second.message);
    parsed = parseEpisodeMessage(second.message);
    message = second.message;
    if (parsed.kind === "parse_error") {
      throw new Error(`episode extraction schema violation after retry: ${parsed.message}`);
    }
  }

  const usage = { input: message.usage.input_tokens, output: message.usage.output_tokens };
  cache[cacheKey] = {
    key: cacheKey,
    model,
    version: EPISODE_PROMPT_VERSION_HASH,
    savedAt: new Date().toISOString(),
    extraction: parsed.extraction,
    usage,
  };
  return { extraction: parsed.extraction, usage, fromCache: false, cacheKey };
}
