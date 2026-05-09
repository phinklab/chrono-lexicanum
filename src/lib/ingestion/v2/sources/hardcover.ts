/**
 * Pipeline V2 — Hardcover source-claim adapter (Brief 054).
 *
 * V2 changes from V1's `hardcover/parse.ts`:
 *
 *   - Author-mismatch on a generic-title hit is treated as SILENT SKIP. No
 *     `errors[]` entry, no `notes` row, no claim emitted. The 044 batch had
 *     14/47 errors as Hardcover-author-mismatches that were essentially "we
 *     searched a generic title, Hardcover returned a non-WH40k book by an
 *     unrelated author, V1 logged that as an error". Those signals are
 *     dashboard-noise. V2 reserves `errors[]` for true crawler failures
 *     (HTTP 5xx, GraphQL errors, missing token, etc.).
 *   - The audit slot (tags, averageRating, contributorNames) is preserved
 *     and lives on `claim.raw.audit` so downstream consumers (and the V2
 *     LLM-prompt's contributors-hint) can still read it.
 *
 * Hardcover does NOT contribute to FIELD_PRIORITY in V1 either (`fields` is
 * empty), so the V2 claim's `fields` slot is also intentionally empty —
 * everything Hardcover-specific rides on the `audit` payload.
 */
import {
  hardcoverQuery,
  isHardcoverEnabled,
} from "../../hardcover/fetch";
import type { SourceClaim } from "../types";

const SEARCH_QUERY = /* GraphQL */ `
  query ChronoLexicanumV2SearchBook($title: String!) {
    books(where: { title: { _eq: $title } }, limit: 5) {
      id
      title
      slug
      cached_tags
      rating
      contributions {
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
  cached_tags?: unknown;
  rating?: number | null;
  contributions?: Array<{ author?: { name?: string } | null } | null>;
}

interface SearchData {
  books: HardcoverBookHit[];
}

export interface HardcoverDiscoveryV2Result {
  result: { claim: SourceClaim } | null;
  /** True crawler error (HTTP/GraphQL/auth). Routed to V2 diff `errors[]`. */
  reason?: string;
  /** True ⇒ author mismatch was the reason for the empty result; the V2
   *  source-claim orchestrator silently skips emitting a claim. */
  authorMismatch?: boolean;
}

export async function discoverHardcoverClaimV2(
  title: string,
  expectedAuthor?: string,
): Promise<HardcoverDiscoveryV2Result> {
  if (!isHardcoverEnabled()) {
    return { result: null, reason: "HARDCOVER_API_TOKEN missing" };
  }

  let response;
  try {
    response = await hardcoverQuery<SearchData>(SEARCH_QUERY, { title });
  } catch (e) {
    return { result: null, reason: e instanceof Error ? e.message : String(e) };
  }

  if (response.errors && response.errors.length > 0) {
    return {
      result: null,
      reason: `GraphQL errors: ${response.errors.map((er) => er.message).join("; ")}`,
    };
  }

  const hits = response.data?.books ?? [];
  if (hits.length === 0) {
    return { result: null }; // silent miss
  }

  const expected = expectedAuthor?.trim().toLowerCase();
  const matched = expected
    ? hits.find((h) => authorMatches(h, expected))
    : hits[0];

  if (!matched) {
    return { result: null, authorMismatch: true };
  }

  const tags = extractTags(matched.cached_tags);
  const contributorNames = (matched.contributions ?? [])
    .map((c) => c?.author?.name)
    .filter((n): n is string => typeof n === "string" && n.length > 0);

  const sourceUrl = matched.slug
    ? `https://hardcover.app/books/${matched.slug}`
    : `https://hardcover.app/books/${matched.id}`;

  const claim: SourceClaim = {
    source: "hardcover",
    sourceUrl,
    fetchedAt: new Date().toISOString(),
    fields: {},
    notes: [],
    raw: {
      audit: {
        tags: tags.length > 0 ? tags : undefined,
        averageRating: typeof matched.rating === "number" ? matched.rating : undefined,
        contributorNames: contributorNames.length > 0 ? contributorNames : undefined,
      },
    },
  };
  return { result: { claim } };
}

function authorMatches(hit: HardcoverBookHit, expected: string): boolean {
  for (const c of hit.contributions ?? []) {
    const name = c?.author?.name;
    if (name && name.toLowerCase().includes(expected)) return true;
  }
  return false;
}

function extractTags(raw: unknown): string[] {
  if (raw === null || raw === undefined) return [];
  if (Array.isArray(raw) && raw.every((x) => typeof x === "string")) {
    return raw as string[];
  }
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
