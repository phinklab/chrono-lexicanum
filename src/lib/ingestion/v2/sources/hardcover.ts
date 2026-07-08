/**
 * Pipeline V2 — Hardcover source-claim adapter.
 *
 * Contract:
 *
 *   - An author mismatch on a generic-title hit is a SILENT SKIP. No
 *     `errors[]` entry, no `notes` row, no claim emitted. Searching a
 *     generic title often makes Hardcover return a non-WH40k book by an
 *     unrelated author; logging that as an error is dashboard noise.
 *     `errors[]` is reserved for true crawler failures (HTTP 5xx, GraphQL
 *     errors, missing token, etc.).
 *   - The audit slot (tags, averageRating, contributorNames) lives on
 *     `claim.raw.audit` so downstream consumers (and the LLM-prompt's
 *     contributors hint) can read it.
 *
 * Hardcover does NOT contribute to FIELD_PRIORITY, so the claim's `fields`
 * slot is intentionally empty — everything Hardcover-specific rides on the
 * `audit` payload.
 */
import {
  hardcoverQuery,
  isHardcoverEnabled,
} from "../../hardcover/fetch";
import type { SourceClaim } from "../types";

/** Hardcover field names recognised as Pipeline-V2 ratings-count probes. */
export type HardcoverRatingsCountField = "users_count" | "ratings_count";

function buildSearchQuery(extraField: HardcoverRatingsCountField | null): string {
  const extra = extraField ? `      ${extraField}\n` : "";
  return /* GraphQL */ `
  query ChronoLexicanumV2SearchBook($title: String!) {
    books(where: { title: { _eq: $title } }, limit: 5) {
      id
      title
      slug
      cached_tags
      rating
${extra}      contributions {
        author {
          name
        }
      }
    }
  }
`;
}

const DEFAULT_SEARCH_QUERY = buildSearchQuery(null);

interface HardcoverBookHit {
  id: number | string;
  title: string;
  slug?: string | null;
  cached_tags?: unknown;
  rating?: number | null;
  users_count?: number | null;
  ratings_count?: number | null;
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

export interface HardcoverDiscoveryV2Options {
  /**
   * If set, the search query asks Hardcover for this additional scalar field
   * (e.g. `users_count` or `ratings_count`) and exposes it as
   * `claim.raw.audit.ratingCount`. When the field is not in Hardcover's
   * schema the GraphQL endpoint returns an error and the call falls back to
   * `result: null` with `reason: "GraphQL errors: …"`. Caller decides whether
   * to retry with a different field or accept the miss.
   */
  ratingsCountField?: HardcoverRatingsCountField | null;
}

export async function discoverHardcoverClaimV2(
  title: string,
  expectedAuthor?: string,
  opts: HardcoverDiscoveryV2Options = {},
): Promise<HardcoverDiscoveryV2Result> {
  if (!isHardcoverEnabled()) {
    return { result: null, reason: "HARDCOVER_API_TOKEN missing" };
  }

  const ratingsCountField = opts.ratingsCountField ?? null;
  const query =
    ratingsCountField === null
      ? DEFAULT_SEARCH_QUERY
      : buildSearchQuery(ratingsCountField);

  let response;
  try {
    response = await hardcoverQuery<SearchData>(query, { title });
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

  const ratingCount = ratingsCountField ? matched[ratingsCountField] : null;

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
        ratingCount: typeof ratingCount === "number" ? ratingCount : undefined,
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
