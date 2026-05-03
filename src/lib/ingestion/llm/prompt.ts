/**
 * Phase 3c — System+User-Prompt + Tool-Schema-Builder.
 *
 * Lädt das Facet-Vokabular zur Runtime aus der DB und embedded es in den
 * User-Prompt, damit der LLM ausschließlich auf existierende facet_value-IDs
 * klassifiziert. Das Tool-Schema (`publish_enrichment`) ist strict — JSON-
 * Schema-validiert von der Anthropic-API selbst.
 *
 * Prompt-Version-Hash: sha256(systemPrompt + tools-JSON).slice(0,12). Jede
 * Änderung an Prompt oder Schema invalidiert den Cache automatisch.
 */
import { createHash } from "node:crypto";

import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { facetCategories, facetValues } from "@/db/schema";
import type {
  BookAvailability,
  BookFormat,
  MergedBook,
  SourcePayload,
} from "@/lib/ingestion/types";

import type { PlotContext } from "./context";
import { RATING_SOURCE_PRIORITY } from "./rating";

// =============================================================================
// Facet-Vokabular-Loader (cached once per process — analog loadDbBooks)
// =============================================================================

export interface FacetCategory {
  id: string;
  name: string;
  description: string | null;
  multiValue: boolean;
  values: Array<{ id: string; name: string; description: string | null }>;
}

let cachedVocabulary: FacetCategory[] | null = null;
let cachedFacetIds: Set<string> | null = null;

export async function loadFacetVocabulary(): Promise<{
  categories: FacetCategory[];
  validFacetIds: Set<string>;
}> {
  if (cachedVocabulary && cachedFacetIds) {
    return { categories: cachedVocabulary, validFacetIds: cachedFacetIds };
  }

  const cats = await db
    .select({
      id: facetCategories.id,
      name: facetCategories.name,
      description: facetCategories.description,
      multiValue: facetCategories.multiValue,
      displayOrder: facetCategories.displayOrder,
    })
    .from(facetCategories);

  const vals = await db
    .select({
      id: facetValues.id,
      categoryId: facetValues.categoryId,
      name: facetValues.name,
      description: facetValues.description,
      displayOrder: facetValues.displayOrder,
    })
    .from(facetValues);

  cats.sort((a, b) => a.displayOrder - b.displayOrder);

  const valuesByCategory = new Map<
    string,
    Array<{ id: string; name: string; description: string | null; displayOrder: number }>
  >();
  for (const v of vals) {
    const arr = valuesByCategory.get(v.categoryId) ?? [];
    arr.push(v);
    valuesByCategory.set(v.categoryId, arr);
  }
  for (const arr of valuesByCategory.values()) {
    arr.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  const categories: FacetCategory[] = cats.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    multiValue: c.multiValue,
    values: (valuesByCategory.get(c.id) ?? []).map((v) => ({
      id: v.id,
      name: v.name,
      description: v.description,
    })),
  }));

  const validFacetIds = new Set<string>();
  for (const v of vals) validFacetIds.add(v.id);

  cachedVocabulary = categories;
  cachedFacetIds = validFacetIds;
  return { categories, validFacetIds };
}

// =============================================================================
// Tool-Schema for `publish_enrichment`
// =============================================================================

const BOOK_FORMAT_VALUES: BookFormat[] = [
  "novel",
  "novella",
  "short_story",
  "anthology",
  "audio_drama",
  "omnibus",
];

const BOOK_AVAILABILITY_VALUES: BookAvailability[] = [
  "in_print",
  "oop_recent",
  "oop_legacy",
  "unavailable",
];

const LLM_FLAG_KINDS = [
  "data_conflict",
  "value_outside_vocabulary",
  "series_total_mismatch",
  "author_mismatch",
  "year_glitch",
  "proposed_new_facet",
  "insufficient_web_search",
  "no_storefronts_found",
  "no_rating_found",
];

export const PUBLISH_ENRICHMENT_TOOL = {
  name: "publish_enrichment",
  description:
    "Publish the enrichment for one book. Call this exactly once after all required web_search calls (≥2: one for synopsis context, one for availability/storefront URLs).",
  input_schema: {
    type: "object" as const,
    required: ["synopsis", "facetIds", "discoveredLinks", "flags"],
    properties: {
      synopsis: {
        type: "string",
        minLength: 400,
        maxLength: 1200,
        description:
          "Paraphrased in-universe synopsis, 100–150 words. Do not quote any source material directly.",
      },
      format: {
        type: "string",
        enum: BOOK_FORMAT_VALUES,
        description: "Book format classification.",
      },
      availability: {
        type: "string",
        enum: BOOK_AVAILABILITY_VALUES,
        description:
          "Availability classification based on Black Library + Amazon + Audible web_search.",
      },
      facetIds: {
        type: "array",
        items: { type: "string" },
        description:
          "Soft-facet value IDs from the canonical vocabulary. Each must exist in the provided facet_values list. Multi-value categories may contribute multiple IDs; single-value categories at most one.",
      },
      discoveredLinks: {
        type: "array",
        items: {
          type: "object",
          required: ["serviceHint", "kind", "url"],
          properties: {
            serviceHint: {
              type: "string",
              description:
                "Should match a services.json id when applicable: black_library, amazon, audible, kindle, apple_books, warhammer_plus.",
            },
            kind: { type: "string", enum: ["shop", "audio", "reference"] },
            url: { type: "string" },
          },
        },
        description:
          "Storefront and reference URLs extracted from the availability web_search.",
      },
      rating: {
        type: "object",
        description:
          "First-source-with-data from priority list. Normalize value to 0–5 scale before publishing. Omit entirely if no rating found.",
        required: ["value", "source"],
        properties: {
          value: { type: "number", minimum: 0, maximum: 5 },
          source: {
            type: "string",
            enum: RATING_SOURCE_PRIORITY as readonly string[],
          },
          count: {
            type: "integer",
            minimum: 0,
            description:
              "Number of reviews. Optional — omit if not clearly extractable.",
          },
        },
      },
      flags: {
        type: "array",
        items: {
          type: "object",
          required: ["kind"],
          properties: {
            kind: { type: "string", enum: LLM_FLAG_KINDS },
            field: { type: "string" },
            current: {},
            suggestion: {},
            sources: { type: "array", items: { type: "string" } },
            reasoning: { type: "string" },
          },
        },
        description:
          "Plausibility-flags from cross-check + audit-flags (proposed_new_facet, no_storefronts_found, no_rating_found). Empty array OK.",
      },
    },
  },
};

export const WEB_SEARCH_TOOL = {
  type: "web_search_20260209" as const,
  name: "web_search" as const,
  max_uses: 6,
  // Haiku 4.5 lehnt web_search ohne explicit allowed_callers ab (`'claude-
  // haiku-4-5-20251001' does not support programmatic tool calling`); Sonnet
  // 4.6 akzeptiert beides. `["direct"]` heißt: Modell ruft web_search direkt,
  // nicht aus einem code_execution-Sandbox heraus — was wir wollen.
  allowed_callers: ["direct"] as const,
};

// =============================================================================
// System-Prompt
// =============================================================================

export const SYSTEM_PROMPT = `You are an enrichment module for a Warhammer 40,000 novel catalog. For every book you receive, you must produce six outputs in a single \`publish_enrichment\` tool call:

1. **synopsis** — A 100–150 word paraphrased in-universe synopsis. Write in your own words; do NOT copy or near-copy phrases from any source material (Wikipedia plot section, Lexicanum article, Black Library marketing copy, Goodreads reviews). License-safe paraphrase only.

2. **format** + **availability** — From the schema enums. Use Black Library + Amazon + Audible web_search results to determine availability authoritatively.

3. **facetIds** — Soft-facet classification using ONLY IDs from the vocabulary supplied in the user message. Categories marked \`multiValue: true\` may contribute multiple IDs; \`multiValue: false\` categories at most one. If you genuinely need a value not in the vocabulary, do NOT invent it — instead emit a \`flags\` entry with \`kind: "proposed_new_facet"\`.

4. **discoveredLinks** — Storefront/reference URLs extracted from your availability web_search. \`serviceHint\` should match a known service id when applicable (\`black_library\`, \`amazon\`, \`audible\`, \`kindle\`, \`apple_books\`, \`warhammer_plus\`); otherwise pass through whatever short string is most descriptive. If no storefronts can be found (e.g. very old OOP releases), return an empty array AND emit \`flags\` with \`kind: "no_storefronts_found"\`.

5. **rating** — Use this source-priority order: ${RATING_SOURCE_PRIORITY.join(" → ")}. Take the FIRST source from this list that has a numeric reader rating visible (in your web_search results or — for hardcover — in the multi-source data already provided to you). Normalize the value to a 0–5 scale: \`(rawValue / sourceMax) * 5\`. Today all listed sources are 0–5, but the normalization rule applies to future sources. Include \`count\` if clearly extractable. If NO source yields a rating, omit the rating object entirely AND emit \`flags\` with \`kind: "no_rating_found"\`.

6. **flags** — Plausibility cross-check across the multi-source data. Emit a flag when something looks wrong or inconsistent:
   - \`year_glitch\` — in-universe year contradicts series position (e.g., Lexicanum says M40 but the book is HH #2 → should be M30).
   - \`series_total_mismatch\` — \`series.totalPlanned\` from the merged data disagrees with reality.
   - \`author_mismatch\` — Hardcover/Open Library author disagrees with Wikipedia (often signals a multi-author anthology mistakenly attributed to one author).
   - \`data_conflict\` — Generic field-level disagreement worth surfacing.
   - \`value_outside_vocabulary\` — used internally by the validator if you ever return an invalid facet ID; do NOT emit this yourself.
   - \`proposed_new_facet\` — when you needed a facet value not in the vocabulary.
   - \`no_storefronts_found\`, \`no_rating_found\` — coverage flags as described above.
   Each flag should include \`field\`, \`current\`, \`suggestion\`, \`sources\`, and a one-sentence \`reasoning\` whenever applicable.

## Web-Search-Discipline (MANDATORY)

You MUST call \`web_search\` at least TWICE before invoking \`publish_enrichment\`:

- **Synopsis-context search** — e.g. \`"<title>" by <author> Warhammer 40k novel synopsis review\`. Targets Goodreads reviews, Black Library product page, Reddit discussions. Use this to refine the emotional/thematic register of the synopsis.
- **Availability search** — e.g. \`"<title>" blacklibrary.com\` then \`"<title>" amazon\` and/or \`"<title>" audible\`. Used to determine availability AND to extract storefront URLs for \`discoveredLinks\`.

You may make additional web_search calls (up to 6 total) when you spot specific gaps to fill: a \`series.totalPlanned\` you want to verify, an unclear publication year, or a faceted classification that needs a tiebreaker. Do NOT use web_search to look up obvious or already-stated facts — token budget is finite.

## Output Format

After your web_search calls, invoke \`publish_enrichment\` exactly once with the JSON arguments matching the input_schema. Never return free-form text — always end with the tool call. The tool name is \`publish_enrichment\` (not \`publish-enrichment\`, not \`enrich\`, not anything else).

## What NOT to do

- Do NOT invent facet IDs that are not in the vocabulary list. Use \`proposed_new_facet\` flag instead.
- Do NOT quote Wikipedia/Lexicanum/marketing copy verbatim in the synopsis.
- Do NOT skip web_search calls; the validator will flag insufficient_web_search.
- Do NOT include affiliate suffixes or tracking parameters in storefront URLs — use the canonical product URL.
`;

// =============================================================================
// User-Prompt-Builder
// =============================================================================

interface BuildUserPromptInput {
  merged: MergedBook;
  rawPayloads: SourcePayload[];
  plotContext: PlotContext;
  vocabulary: FacetCategory[];
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
    // Audit-Slot (Hardcover): tags + averageRating als hint einbetten
    const audit = (p as { audit?: { tags?: string[]; averageRating?: number } })
      .audit;
    if (audit) {
      if (audit.tags && audit.tags.length > 0) {
        lines.push(`- audit.tags: ${JSON.stringify(audit.tags.slice(0, 30))}`);
      }
      if (typeof audit.averageRating === "number") {
        lines.push(
          `- audit.averageRating (hardcover, 0–5): ${audit.averageRating.toFixed(2)}`,
        );
      }
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}

export function buildUserPrompt(input: BuildUserPromptInput): string {
  const { merged, rawPayloads, plotContext, vocabulary } = input;
  const title = merged.fields.title ?? "(unknown title)";
  const author =
    merged.fields.authorNames && merged.fields.authorNames.length > 0
      ? merged.fields.authorNames.join(", ")
      : "(unknown author)";

  const sections: string[] = [];

  sections.push(`# Book to enrich

- Title: ${title}
- Author: ${author}
- Pipeline-slug: ${merged.slug}
- Primary source: ${merged.primarySource} (confidence ${merged.confidence})

# Multi-source data (already merged via FIELD_PRIORITY)

\`\`\`json
${JSON.stringify(merged.fields, null, 2)}
\`\`\``);

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
      `# Plot context\n\n_(No plot context could be pre-fetched for this book. Use web_search to find background.)_`,
    );
  }

  sections.push(`# Facet vocabulary (use ONLY these IDs)

${vocabularyToText(vocabulary)}`);

  sections.push(`# Reminder

Make at least two web_search calls (synopsis context + availability/storefront), then call \`publish_enrichment\` exactly once.`);

  return sections.join("\n\n");
}

// =============================================================================
// Prompt-Version-Hash (cache invalidator)
// =============================================================================

/**
 * sha256[:12] over the system prompt + tool schemas. Any change to either
 * invalidates the cache for every book on the next run.
 */
export const PROMPT_VERSION_HASH = createHash("sha256")
  .update(SYSTEM_PROMPT)
  .update(JSON.stringify(PUBLISH_ENRICHMENT_TOOL))
  .update(JSON.stringify(WEB_SEARCH_TOOL))
  .digest("hex")
  .slice(0, 12);
