/**
 * Pipeline V2 — slim LLM prompt + tool schema (Brief 054).
 *
 * Changes vs V1's `llm/prompt.ts`:
 *
 *   1. `availability` and `rating` are removed entirely from the tool schema
 *      and the system prompt. Both are volatile (monthly drift) and belong
 *      to the future Refresh-Layer (Brief 057). Removing them drops the
 *      mandatory web_search count from 2 to 1.
 *   2. `factionNames`/`locationNames`/`characterNames` are replaced by
 *      structured `factions`/`locations`/`characters` arrays of `{name,
 *      role}` objects. Role vocabularies match the DB junction `role`
 *      columns (varchar — no schema change needed in 054):
 *        - factions:   primary | supporting | antagonist | background
 *        - locations:  primary | secondary | mentioned
 *        - characters: pov | supporting | appears | mentioned
 *   3. `WEB_SEARCH_TOOL.max_uses` reduced from 6 to 3.
 *   4. Mandatory web-search count: 1 (synopsis-context). The system prompt
 *      no longer demands an availability search.
 *   5. Shared infrastructure (`loadFacetVocabulary`, `FacetCategory`) is
 *      reused from V1 — vocabulary loading is identical.
 *
 * `PROMPT_VERSION_HASH_V2` is a fresh hash; V1's hash is unaffected so the
 * V1 cache layer continues to address V1 entries cleanly when both pipelines
 * write to `ingest/.llm-cache/<slug>.json`.
 */
import { createHash } from "node:crypto";

import type { BookFormat, MergedBook, SourcePayload } from "../../types";
import {
  loadFacetVocabulary,
  type FacetCategory,
} from "../../llm/prompt";
import type { PlotContext } from "../../llm/context";
import type { SsotBookContext } from "../types";

export { loadFacetVocabulary };
export type { FacetCategory };

export const BOOK_FORMAT_VALUES: BookFormat[] = [
  "novel",
  "novella",
  "short_story",
  "anthology",
  "audio_drama",
  "omnibus",
  "collection",
  "artbook",
  "scriptbook",
];

export const FACTION_ROLES = ["primary", "supporting", "antagonist", "background"] as const;
export const LOCATION_ROLES = ["primary", "secondary", "mentioned"] as const;
export const CHARACTER_ROLES = ["pov", "supporting", "appears", "mentioned"] as const;

const SLIM_FLAG_KINDS = [
  "data_conflict",
  "value_outside_vocabulary",
  "series_total_mismatch",
  "author_mismatch",
  "year_glitch",
  "proposed_new_facet",
  "insufficient_web_search",
];

export const PUBLISH_ENRICHMENT_TOOL_V2 = {
  name: "publish_enrichment",
  description:
    "Publish the V2 enrichment for one book. Call this exactly once after at least one web_search call (synopsis-context).",
  input_schema: {
    type: "object" as const,
    required: ["synopsis", "facetIds", "factions", "locations", "characters", "flags"],
    properties: {
      synopsis: {
        type: "string",
        minLength: 400,
        maxLength: 1200,
        description:
          "Paraphrased in-universe synopsis, 100–150 words. Do not quote any source material directly.",
      },
      facetIds: {
        type: "array",
        items: { type: "string" },
        description:
          "Soft-facet value IDs from the canonical vocabulary. Each must exist in the provided facet_values list. Multi-value categories may contribute multiple IDs; single-value categories at most one.",
      },
      factions: {
        type: "array",
        items: {
          type: "object",
          required: ["name", "role"],
          properties: {
            name: { type: "string" },
            role: { type: "string", enum: FACTION_ROLES as readonly string[] },
          },
        },
        description:
          "Named factions in the book with their narrative role. Use surface forms exactly as written in sources ('Sons of Horus', 'Word Bearers'). Role vocabulary: primary | supporting | antagonist | background.",
      },
      locations: {
        type: "array",
        items: {
          type: "object",
          required: ["name", "role"],
          properties: {
            name: { type: "string" },
            role: { type: "string", enum: LOCATION_ROLES as readonly string[] },
          },
        },
        description:
          "Named locations/worlds/sectors in the book with their role. Use surface forms ('Calth', 'Eye of Terror'). Role vocabulary: primary | secondary | mentioned.",
      },
      characters: {
        type: "array",
        items: {
          type: "object",
          required: ["name", "role"],
          properties: {
            name: { type: "string" },
            role: { type: "string", enum: CHARACTER_ROLES as readonly string[] },
          },
        },
        description:
          "Named individual characters in the book with their role. Use surface forms ('Horus Lupercal', 'Garviel Loken'). Role vocabulary: pov | supporting | appears | mentioned.",
      },
      flags: {
        type: "array",
        items: {
          type: "object",
          required: ["kind"],
          properties: {
            kind: { type: "string", enum: SLIM_FLAG_KINDS },
            field: { type: "string" },
            current: {},
            suggestion: {},
            sources: { type: "array", items: { type: "string" } },
            reasoning: { type: "string" },
          },
        },
        description:
          "Plausibility-flags from cross-check. Empty array OK. V2 has no rating/availability flags.",
      },
    },
  },
};

export const WEB_SEARCH_TOOL_V2 = {
  type: "web_search_20260209" as const,
  name: "web_search" as const,
  max_uses: 3,
  allowed_callers: ["direct"] as const,
};

export const SYSTEM_PROMPT_V2 = `You are an enrichment module for a Warhammer 40,000 novel catalog. For every book you receive, produce these outputs in a single \`publish_enrichment\` tool call:

1. **synopsis** — A 100–150 word paraphrased in-universe synopsis. Write in your own words; do NOT copy or near-copy phrases from any source material (Wikipedia plot section, Lexicanum article, Black Library marketing copy, Goodreads reviews). License-safe paraphrase only.

2. **format** is set by the upstream SSOT (the maintainer-curated Excel) or by the deterministic validator-riege — NEVER by you. Do NOT propose a format value. If your web-search evidence appears to contradict the supplied format (e.g. SSOT says \`anthology\` but Goodreads-blurb describes a single-author novel), emit a \`flags\` entry with \`kind: "data_conflict"\`, \`field: "format"\` and let downstream triage handle it.

   This pipeline does NOT assess availability or rating — those live in a separate refresh layer.

3. **facetIds** — Soft-facet classification using ONLY **bare value IDs** from the vocabulary in the user message. Each is the **value id** of a canonical entry (\`grimdark\`, \`cw_violence\`, \`multi\`); never prefixed with the category id.

   Correct:   \`["grimdark", "cw_violence", "multi"]\`
   Incorrect: \`["tone_grimdark", "content_warning_cw_violence"]\`

   \`multiValue: true\` categories may contribute multiple IDs; single-value at most one. If a value is genuinely missing from the vocabulary, do NOT invent it — emit a \`flags\` entry with \`kind: "proposed_new_facet"\`.

4. **factions / locations / characters** — Structured arrays of \`{name, role}\` objects. Role vocabularies:
   - factions:   \`primary\` (drives the plot) | \`supporting\` (allied / on-screen) | \`antagonist\` (enemy) | \`background\` (mentioned, not actively present)
   - locations:  \`primary\` (the book's main setting) | \`secondary\` (visited but not central) | \`mentioned\` (referenced only)
   - characters: \`pov\` (point-of-view) | \`supporting\` (named on-screen) | \`appears\` (cameo) | \`mentioned\` (referenced only)

   Use surface forms exactly as written in the sources ("Word Bearers", "Calth", "Horus Lupercal"). NEVER slug form — FK resolution is downstream. Empty arrays are OK if a category genuinely has no extractable entries.

5. **flags** — Plausibility cross-check. Emit when something looks wrong:
   - \`year_glitch\` — in-universe year contradicts series position.
   - \`series_total_mismatch\`, \`author_mismatch\`, \`data_conflict\` — generic-field disagreements worth surfacing.
   - \`proposed_new_facet\` — when you needed a facet not in the vocabulary.
   - DO NOT emit \`value_outside_vocabulary\` (validator-only) or \`insufficient_web_search\` (validator-only).

   Each flag should include \`field\`, \`current\`, \`suggestion\`, \`sources\`, and a one-sentence \`reasoning\` whenever applicable.

## Web-Search-Discipline (V2 — STRICT)

You MUST call \`web_search\` EXACTLY ONCE for synopsis-context, then STOP. Additional searches are tightly conditional — see below. The expectation is **1 search for ~80% of books**, 2 only for sparsely-documented titles, 3 only for a real source-contradiction tiebreaker.

- **Search 1 (mandatory)** — \`"<title>" by <author> Warhammer 40k novel synopsis review\`. Targets Goodreads / Black Library / Reddit. Use it to (a) refine the emotional/thematic register of the synopsis AND (b) extract faction/location/character names. After this single search you almost always have enough.

- **Search 2 (CONDITIONAL — only when BOTH conditions hold)**:
  1. The supplied plot-context snippets PLUS Search 1 results yield ZERO factions AND ZERO locations AND ZERO characters that you can put in the structured arrays — i.e. the structured arrays would be entirely empty otherwise, AND
  2. The book is a narrative work (not a non-narrative supplement like a codex, art book, RPG manual, or rules supplement).

  Otherwise: do NOT search again. Return \`publish_enrichment\` with whatever entities you have, even if the lists are sparse. Sparse-but-grounded beats search-padded.

- **Search 3 (CONDITIONAL — only when BOTH conditions hold)**:
  1. Two of the supplied sources directly contradict each other on a structured field (example contradiction: Lexicanum \`authorNames=[A]\` vs Open Library \`authorNames=[B]\` — same field, different values from two sources. Non-example: Lexicanum has \`startY\` and OL has \`releaseYear\` — those are different fields, not a contradiction), AND
  2. Search 1 results did not resolve the contradiction.

  Otherwise: do NOT search a third time. Emit a \`flags\` entry with \`kind: "data_conflict"\` and let the downstream validator handle it.

The hard cap of \`max_uses: 3\` is enforced by the tool definition; the discipline above is the expected behavior at the policy level. NEVER search for availability, rating, or storefronts — those are out of scope for V2.

## Output Format

After your web_search calls, invoke \`publish_enrichment\` exactly once with JSON arguments matching the input_schema. Never return free-form text — always end with the tool call. The tool name is \`publish_enrichment\`.

## What NOT to do

- Do NOT invent facet IDs that are not in the vocabulary. Use \`proposed_new_facet\` instead.
- Do NOT quote Wikipedia/Lexicanum/marketing copy verbatim in the synopsis.
- Do NOT search for availability, ratings, or storefronts — out of scope for V2.
`;

interface BuildUserPromptInput {
  merged: MergedBook;
  rawPayloads: SourcePayload[];
  plotContext: PlotContext;
  vocabulary: FacetCategory[];
  /** V2 addition: validator hits already established for this book. The
   *  prompt surfaces them so the LLM doesn't second-guess validator-decided
   *  fields (e.g. format=anthology). */
  validations?: Array<{ kind: string; field: string; reasoning: string }>;
  /** Brief 058 — when the roster source is the maintainer Excel (SSOT), this
   *  sidecar carries the authoritative fields. The prompt surfaces them in a
   *  dedicated "SSOT-fixed fields" section so the LLM does not propose
   *  overrides for title/authors/year/format/series. */
  ssotFixed?: SsotBookContext;
}

function trimText(s: string, maxChars: number): string {
  if (s.length <= maxChars) return s;
  return s.slice(0, maxChars).trimEnd() + " […]";
}

function vocabularyToText(categories: FacetCategory[]): string {
  const lines: string[] = [];
  for (const cat of categories) {
    const tag = cat.multiValue ? "multi-value" : "single-value";
    const desc = cat.description ? ` — ${cat.description}` : "";
    lines.push(`### ${cat.name} (\`${cat.id}\`, ${tag})${desc}`);
    for (const v of cat.values) {
      const vDesc = v.description ? ` — ${v.description}` : "";
      lines.push(`- \`${v.id}\` (${v.name})${vDesc}`);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}

function payloadsToText(payloads: SourcePayload[]): string {
  const lines: string[] = [];
  for (const p of payloads) {
    const url = p.sourceUrl ? ` (${p.sourceUrl})` : "";
    lines.push(`### Source: ${p.source}${url}`);
    const fields = p.fields;
    const keys = Object.keys(fields).sort();
    for (const k of keys) {
      const v = (fields as Record<string, unknown>)[k];
      if (v === undefined) continue;
      lines.push(`- ${k}: ${JSON.stringify(v)}`);
    }
    const audit = (p as { audit?: { tags?: string[]; contributorNames?: string[] } }).audit;
    if (audit) {
      if (audit.tags && audit.tags.length > 0) {
        lines.push(`- audit.tags: ${JSON.stringify(audit.tags.slice(0, 30))}`);
      }
      if (audit.contributorNames && audit.contributorNames.length > 0) {
        lines.push(`- audit.contributors: ${JSON.stringify(audit.contributorNames)}`);
      }
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}

export function buildUserPromptV2(input: BuildUserPromptInput): string {
  const { merged, rawPayloads, plotContext, vocabulary, validations, ssotFixed } = input;
  // When the SSOT sidecar is present the maintainer Excel is authoritative
  // for title/authors — display those over the multi-source-merged values
  // even if a Lexicanum/OL claim happens to differ.
  const title = ssotFixed?.title ?? merged.fields.title ?? "(unknown title)";
  const author = ssotFixed
    ? ssotFixed.authors.length > 0
      ? ssotFixed.authors.join(", ")
      : ssotFixed.editorialNote === "various"
        ? "(various — anthology)"
        : "(unknown author)"
    : merged.fields.authorNames && merged.fields.authorNames.length > 0
      ? merged.fields.authorNames.join(", ")
      : "(unknown author)";

  const sections: string[] = [];

  sections.push(`# Book to enrich

- Title: ${title}
- Author: ${author}
- Pipeline-slug: ${merged.slug}
- Primary source: ${merged.primarySource} (confidence ${merged.confidence})`);

  if (ssotFixed) {
    const editorsLine =
      ssotFixed.editors.length > 0
        ? `\n- Editors: ${ssotFixed.editors.join(", ")}`
        : "";
    const editorialLine = ssotFixed.editorialNote
      ? `\n- Editorial note: ${ssotFixed.editorialNote}`
      : "";
    const seriesLine = ssotFixed.seriesHint
      ? `\n- Series hint: ${ssotFixed.seriesHint}`
      : "";
    const yearLine =
      ssotFixed.releaseYear !== null
        ? `\n- Release year: ${ssotFixed.releaseYear}`
        : "";
    sections.push(`# SSOT-fixed fields (authoritative — do NOT propose overrides)

The maintainer-curated catalog has already resolved these values; they are
\`source: "ssot"\` in the downstream record and MUST NOT be contradicted by
your output. Your job is to enrich the *soft* fields (synopsis, facets,
factions, locations, characters) against this anchor.

- External book ID: ${ssotFixed.externalBookId}
- Title: ${ssotFixed.title}
- Authors: ${ssotFixed.authors.length > 0 ? ssotFixed.authors.join(", ") : "(none — see editorial note)"}${editorsLine}${editorialLine}${yearLine}
- Format: ${ssotFixed.format}${seriesLine}

If your web-search evidence appears to contradict any of these (e.g. format
mismatch), emit a \`flags\` entry with \`kind: "data_conflict"\` and the
specific field, then proceed with the SSOT values as the working truth.`);
  }

  sections.push(`# Multi-source data

\`\`\`json
${JSON.stringify(merged.fields, null, 2)}
\`\`\``);

  if (validations && validations.length > 0) {
    const lines = validations.map(
      (v) => `- **${v.kind}** (field: ${v.field}): ${v.reasoning}`,
    );
    sections.push(`# Validator findings (already-decided)\n\n${lines.join("\n")}\n\nDO NOT contradict these.`);
  }

  sections.push(`# Per-source raw payloads

${payloadsToText(rawPayloads)}`);

  if (plotContext.wikipediaPlot || plotContext.lexicanumStory) {
    const plotParts: string[] = [];
    if (plotContext.wikipediaPlot) {
      plotParts.push(
        `## From Wikipedia article plot section\n\n${trimText(plotContext.wikipediaPlot, 4_000)}`,
      );
    }
    if (plotContext.lexicanumStory) {
      plotParts.push(
        `## From Lexicanum article story section\n\n${trimText(plotContext.lexicanumStory, 4_000)}`,
      );
    }
    sections.push(`# Plot context\n\n${plotParts.join("\n\n")}`);
  } else {
    sections.push(
      `# Plot context\n\n_(No plot context could be pre-fetched. Use web_search to find background.)_`,
    );
  }

  sections.push(`# Facet vocabulary (use ONLY these IDs)

${vocabularyToText(vocabulary)}`);

  sections.push(`# Reminder

Aim for **exactly one** web_search call (synopsis context), then call \`publish_enrichment\`. A second search is only allowed when the supplied data + Search 1 yields zero structured-array entities; a third only when two sources directly contradict on a structured field. V2 does NOT cover availability or rating.`);

  return sections.join("\n\n");
}

/**
 * sha256[:12] over the V2 system prompt + tool schemas. Distinct from V1's
 * hash — invalidates the LLM cache for the pilot books on first V2 run.
 */
export const PROMPT_VERSION_HASH_V2 = createHash("sha256")
  .update(SYSTEM_PROMPT_V2)
  .update(JSON.stringify(PUBLISH_ENRICHMENT_TOOL_V2))
  .update(JSON.stringify(WEB_SEARCH_TOOL_V2))
  .digest("hex")
  .slice(0, 12);
