/**
 * Geo-localizing, affiliate-ready store-URL builder.
 *
 * Pure & total: given the same args `buildStoreUrl` always returns the same URL
 * and never throws. Store URLs are DERIVED at render time (a search/lookup URL),
 * never stored per book — so there is nothing to validate or to go stale, and
 * geo-localization is a TLD swap. Amazon and Audible
 * localize by marketplace TLD; Black Library is a single global store.
 *
 * Affiliate is OFF today: `AFFILIATE_TAGS` is empty and no tag ships. Turning it
 * on later is a config-swap, not a code change — populate a cell of the map, or
 * set the `STORE_AFFILIATE_TAGS` env var — because every call already routes
 * through `resolveAffiliateTag`, so no call site changes.
 *
 * This module imports nothing from `next/*` on purpose: it stays pure so it can
 * be exercised from a throwaway `tsx` smoke or a client island. Region
 * DETECTION (which reads the request) lives in ./store-region.
 */

export type StoreService = "amazon" | "audible" | "black_library";

/** ISO 3166-1 alpha-2 regions we localize to. Anything else collapses to US. */
export type StoreRegion =
  | "US"
  | "GB"
  | "DE"
  | "FR"
  | "ES"
  | "IT"
  | "NL"
  | "CA"
  | "AU"
  | "JP"
  | "IN"
  | "BR";

/** Fallback when the visitor's region is unknown or unsupported. Amazon.com has
 *  the largest English catalog and Black Library fiction is English-first. */
export const DEFAULT_REGION: StoreRegion = "US";

export const STORE_REGIONS: readonly StoreRegion[] = [
  "US",
  "GB",
  "DE",
  "FR",
  "ES",
  "IT",
  "NL",
  "CA",
  "AU",
  "JP",
  "IN",
  "BR",
];

/** Amazon marketplace TLD per region. */
const AMAZON_TLD: Record<StoreRegion, string> = {
  US: "com",
  GB: "co.uk",
  DE: "de",
  FR: "fr",
  ES: "es",
  IT: "it",
  NL: "nl",
  CA: "ca",
  AU: "com.au",
  JP: "co.jp",
  IN: "in",
  BR: "com.br",
};

/** Audible runs in fewer markets than Amazon. Regions without a dedicated
 *  storefront fall back to the .com store rather than a dead TLD (e.g. NL). */
const AUDIBLE_TLD: Record<StoreRegion, string> = {
  US: "com",
  GB: "co.uk",
  DE: "de",
  FR: "fr",
  ES: "es",
  IT: "it",
  NL: "com",
  CA: "ca",
  AU: "com.au",
  JP: "co.jp",
  IN: "in",
  BR: "com.br",
};

/**
 * Black Library is a single global store (no geo TLD). This is its canonical
 * server-rendered search endpoint — it returns HTTP 200 and echoes the query,
 * so it never 404s. The result list is populated client-side, which means it
 * can't be asserted headlessly; if Games Workshop folds the standalone store
 * into warhammer.com, this one constant (+ param) is the only edit needed.
 */
const BLACK_LIBRARY_SEARCH = "https://www.blacklibrary.com/Home/Search-Results.html";
const BLACK_LIBRARY_PARAM = "SearchText";

/**
 * Affiliate tags by service → marketplace TLD → tag. EMPTY today: no tag
 * ships. Populate a cell (or set the env var below) to enable affiliate
 * with ZERO call-site edits — `resolveAffiliateTag` already consults it.
 *
 * Example once enrolled in Amazon Associates / Audible:
 *   amazon: { com: "chronolex-20", "co.uk": "chronolex-21", de: "chronolex-03" }
 */
const AFFILIATE_TAGS: Partial<Record<StoreService, Record<string, string>>> = {};

/**
 * Optional env override, the lowest-friction "config, not code" path:
 *   STORE_AFFILIATE_TAGS="amazon:de=chronolex-03,amazon:com=chronolex-20"
 * Server-only (not NEXT_PUBLIC_), parsed once at module load.
 */
function parseEnvTags(
  raw: string | undefined,
): Partial<Record<StoreService, Record<string, string>>> {
  const out: Partial<Record<StoreService, Record<string, string>>> = {};
  if (!raw) return out;
  for (const pair of raw.split(",")) {
    const [key, value] = pair.split("=");
    if (!key || !value) continue;
    const [service, tld] = key.split(":");
    if (service !== "amazon" && service !== "audible" && service !== "black_library") continue;
    if (!tld || !tld.trim()) continue;
    (out[service] ??= {})[tld.trim()] = value.trim();
  }
  return out;
}

const ENV_TAGS = parseEnvTags(process.env.STORE_AFFILIATE_TAGS);

function resolveAffiliateTag(
  service: StoreService,
  tld: string,
  explicit?: string,
): string | undefined {
  if (explicit && explicit.trim() !== "") return explicit.trim();
  return ENV_TAGS[service]?.[tld] ?? AFFILIATE_TAGS[service]?.[tld];
}

export interface BuildStoreUrlArgs {
  service: StoreService;
  /** Already-resolved region (see ./store-region). */
  region: StoreRegion;
  title: string;
  /** Disambiguates the search; appended to the query when present. */
  author?: string;
  /** isbn13 ?? isbn10; used only by Amazon when present (partial coverage). */
  isbn?: string | null;
  /** Explicit affiliate-tag override; normally omitted (call sites stay tag-free). */
  tag?: string;
}

/**
 * Build the visitor-localized storefront URL for one service. Pure and total:
 * thin inputs (no ISBN, no author) degrade to a title search; an unknown region
 * is the caller's job to normalize, but a missing TLD still falls back to .com.
 */
export function buildStoreUrl(args: BuildStoreUrlArgs): string {
  const { service, region, title, author, isbn, tag } = args;
  const query = [title, author]
    .map((s) => s?.trim())
    .filter((s): s is string => Boolean(s))
    .join(" ");

  switch (service) {
    case "amazon": {
      const tld = AMAZON_TLD[region] ?? AMAZON_TLD[DEFAULT_REGION];
      const params = new URLSearchParams();
      params.set("k", isbn && isbn.trim() !== "" ? isbn.trim() : query);
      params.set("i", "stripbooks");
      const affiliate = resolveAffiliateTag("amazon", tld, tag);
      if (affiliate) params.set("tag", affiliate);
      return `https://www.amazon.${tld}/s?${params.toString()}`;
    }
    case "audible": {
      const tld = AUDIBLE_TLD[region] ?? AUDIBLE_TLD[DEFAULT_REGION];
      const params = new URLSearchParams();
      params.set("keywords", query);
      const affiliate = resolveAffiliateTag("audible", tld, tag);
      if (affiliate) params.set("tag", affiliate);
      return `https://www.audible.${tld}/search?${params.toString()}`;
    }
    case "black_library": {
      const params = new URLSearchParams();
      params.set(BLACK_LIBRARY_PARAM, title.trim());
      return `${BLACK_LIBRARY_SEARCH}?${params.toString()}`;
    }
    default: {
      const _exhaustive: never = service;
      return _exhaustive;
    }
  }
}
