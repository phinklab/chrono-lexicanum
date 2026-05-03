/**
 * Hardcover.app payload extraction (audit-only).
 *
 * Liefert pro Buch:
 *   - `tags`: raw User-Tags (z.B. "grimdark", "military-sci-fi", "lore-heavy")
 *   - `averageRating`: numeric, ausschließlich für Audit-Visibility
 *   - `sourceUrl`: kanonische Hardcover-Page-URL (für externalLinks-Audit
 *     beim Apply in 3d)
 *
 * Tags landen NICHT als Facet-Junction-Vorschlag im Diff (das ist 3c LLM-Job:
 * Hardcover-Tags → unsere kanonische 40k-aware `tone`/`theme`-Vokabular).
 * Numerisches Rating bleibt aus dem Schema raus (Phase-4-Entscheidung).
 *
 * **Best-Guess GraphQL Schema (CC, 2026-05-03).** Ohne Token konnte das
 * Schema nicht introspeziert werden — die unten gebaute Query basiert auf
 * dem Hasura-typischen `/v1/graphql`-Muster (where-Filter, _ilike-Operator,
 * limit). Wenn sich mit echtem Token herausstellt dass Field-Names anders
 * heißen (z.B. `cached_tags` vs `tags`, `rating` vs `cached_rating`), wird
 * die Query lokal in dieser Datei korrigiert. Siehe `fetch.ts`-Schema-Hinweis.
 */
import type { HardcoverPayload, SourcePayloadFields } from "@/lib/ingestion/types";

import { hardcoverQuery, isHardcoverEnabled } from "./fetch";

// =============================================================================
// GraphQL query (best-guess Hasura schema)
// =============================================================================

const SEARCH_QUERY = /* GraphQL */ `
  query ChronoLexicanumSearchBook($title: String!) {
    books(
      where: { title: { _ilike: $title } }
      limit: 5
      order_by: { users_count: desc_nulls_last }
    ) {
      id
      title
      slug
      cached_tags
      rating
      contributions(where: { contribution: { _eq: "Author" } }) {
        author {
          name
        }
      }
    }
  }
`;

interface HardcoverBookHit {
  id: number | string;
  title: string;
  slug?: string | null;
  cached_tags?: unknown;            // Hasura JSONB — raw, parsed below
  rating?: number | null;
  contributions?: Array<{ author?: { name?: string } | null } | null>;
}

interface SearchData {
  books: HardcoverBookHit[];
}

// =============================================================================
// Discovery
// =============================================================================

export interface DiscoveredHardcoverBook {
  hit: HardcoverBookHit;
  payload: HardcoverPayload;
}

/**
 * Find a Hardcover book for `title` (+ optional `expectedAuthor`).
 *
 * Skipped silently when `HARDCOVER_API_TOKEN` is missing — caller is expected
 * to guard with `isHardcoverEnabled()` first, but we double-check here so
 * direct invocations don't crash on missing token.
 *
 * Returns `{ result, reason? }` mirror `discoverOpenLibraryBook`.
 */
export async function discoverHardcoverBook(
  title: string,
  expectedAuthor?: string,
): Promise<{ result: DiscoveredHardcoverBook | null; reason?: string }> {
  if (!isHardcoverEnabled()) {
    return { result: null, reason: "HARDCOVER_API_TOKEN missing" };
  }

  const escaped = `%${title.replace(/[%_]/g, "\\$&")}%`;

  let response;
  try {
    response = await hardcoverQuery<SearchData>(SEARCH_QUERY, { title: escaped });
  } catch (e) {
    return {
      result: null,
      reason: e instanceof Error ? e.message : String(e),
    };
  }

  if (response.errors && response.errors.length > 0) {
    return {
      result: null,
      reason: `GraphQL errors: ${response.errors.map((er) => er.message).join("; ")}`,
    };
  }

  const hits = response.data?.books ?? [];
  if (hits.length === 0) {
    return { result: null, reason: "no Hardcover hits for title" };
  }

  const expected = expectedAuthor?.trim().toLowerCase();
  const matched = expected
    ? hits.find((h) => authorMatchesExpected(h, expected))
    : hits[0];

  if (!matched) {
    const seen = hits.map(allAuthorNames).join(" / ");
    return {
      result: null,
      reason: `author mismatch: hardcover returned [${seen}], wikipedia says "${expectedAuthor}"`,
    };
  }

  const tags = extractTags(matched.cached_tags);
  const sourceUrl = matched.slug
    ? `https://hardcover.app/books/${matched.slug}`
    : `https://hardcover.app/books/${matched.id}`;

  // Hardcover liefert nichts in FIELD_PRIORITY — `fields` bleibt leer und
  // nicht im Merge-Output. `audit` trägt die Soft-Facts.
  const fields: SourcePayloadFields = {};

  const payload: HardcoverPayload = {
    source: "hardcover",
    sourceUrl,
    fields,
    audit: {
      tags: tags.length > 0 ? tags : undefined,
      averageRating:
        typeof matched.rating === "number" ? matched.rating : undefined,
    },
  };

  return { result: { hit: matched, payload } };
}

// =============================================================================
// Helpers
// =============================================================================

function allAuthorNames(hit: HardcoverBookHit): string {
  const names = (hit.contributions ?? [])
    .map((c) => c?.author?.name)
    .filter((n): n is string => typeof n === "string" && n.length > 0);
  return names.join(", ") || "—";
}

function authorMatchesExpected(
  hit: HardcoverBookHit,
  expected: string,
): boolean {
  for (const c of hit.contributions ?? []) {
    const name = c?.author?.name;
    if (name && name.toLowerCase().includes(expected)) return true;
  }
  return false;
}

/**
 * Hardcover's `cached_tags` ist JSONB — typischerweise ein Array von Objekten
 * `{ tag: "grimdark", tag_type: "Genre", count: 42 }`. Die Form ist nicht
 * stabil dokumentiert; wir versuchen mehrere Varianten und fallen auf leeres
 * Array zurück bei Unklarheit.
 */
function extractTags(raw: unknown): string[] {
  if (raw === null || raw === undefined) return [];

  // Case 1: schon ein Array von Strings.
  if (Array.isArray(raw) && raw.every((x) => typeof x === "string")) {
    return raw as string[];
  }

  // Case 2: Array von Objekten mit `tag`-Key.
  if (Array.isArray(raw)) {
    const out: string[] = [];
    for (const item of raw) {
      if (item && typeof item === "object") {
        const t = (item as Record<string, unknown>).tag;
        if (typeof t === "string" && t.length > 0) out.push(t);
      }
    }
    if (out.length > 0) return out;
  }

  // Case 3: Object mit Tag-Type → Array-Of-Tags map.
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const out: string[] = [];
    for (const value of Object.values(raw as Record<string, unknown>)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === "string") out.push(item);
          else if (item && typeof item === "object") {
            const t = (item as Record<string, unknown>).tag;
            if (typeof t === "string") out.push(t);
          }
        }
      }
    }
    if (out.length > 0) return out;
  }

  return [];
}

export { isHardcoverEnabled };
