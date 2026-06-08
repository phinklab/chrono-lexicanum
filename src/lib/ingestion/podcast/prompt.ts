/**
 * Brief 131 — shared episode-tagging prompt + tool schema, Anthropic-free.
 *
 * These constants WERE inline in `extract.ts` (Brief 110). They are moved here
 * verbatim — same strings, same `JSON.stringify` shape — so the api path stays
 * byte-identical (the `EPISODE_PROMPT_VERSION_HASH` is unchanged, hence the
 * `ingest/.llm-cache/` keys and the committed artifacts do not move). The point
 * of the split: this module imports NOTHING from `@anthropic-ai/sdk` (only
 * `node:crypto` + the local types), so the CC-Direct tagging path (Variant B —
 * acquire / assemble / migrate) can read the conventions, the prompt version,
 * and the description cap WITHOUT loading the SDK. `extract.ts` (Variant A — the
 * metered API path) imports these back; it remains the sole owner of the SDK.
 *
 * The semantics here are LOAD-BEARING and carefully tuned (axis definitions,
 * surface-form fidelity, in-universe-only, "empty lists are correct",
 * episodeKind classes). The human-readable mirror the CC-Direct subsession reads
 * lives at `ingest/podcasts/tagging-conventions.md`; it is derived from THIS
 * file and carries the same `EPISODE_PROMPT_VERSION_HASH` so drift is visible.
 */
import { createHash } from "node:crypto";

import { EPISODE_KINDS } from "./types";

/** Description hard-cap fed to the tagger — the api path and the CC-Direct batch
 *  input both truncate to this so neither context can blow up on a long
 *  show-notes dump. */
export const MAX_DESC_CHARS = 6_000;

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
