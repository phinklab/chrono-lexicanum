/**
 * Brief 105 — resolve the visitor's store region SERVER-SIDE so the buy/listen
 * links are correct in the SSR HTML, with no mandatory client JS. Mirrors the
 * `headers()` access pattern in src/lib/atlas/auth.ts.
 *
 * Precedence (highest first):
 *   1. explicit `?store=` override (the region switcher)
 *   2. `x-vercel-ip-country` (Vercel geo header, ISO alpha-2)
 *   3. `Accept-Language` first usable tag → country
 *   4. DEFAULT_REGION (US)
 */
import "server-only";
import { headers } from "next/headers";
import { DEFAULT_REGION, STORE_REGIONS, type StoreRegion } from "./store-links";

const SUPPORTED = new Set<string>(STORE_REGIONS);

function normalize(code: string | null | undefined): StoreRegion | null {
  const up = code?.trim().toUpperCase();
  return up && SUPPORTED.has(up) ? (up as StoreRegion) : null;
}

/**
 * Bare language subtag → region, for our supported set only. English has no
 * generic store, so it defaults to US; `en-GB` is already caught by its region
 * subtag before this table is consulted.
 */
const LANG_TO_REGION: Record<string, StoreRegion> = {
  de: "DE",
  fr: "FR",
  es: "ES",
  it: "IT",
  nl: "NL",
  ja: "JP",
  pt: "BR",
  en: "US",
};

function fromAcceptLanguage(header: string | null): StoreRegion | null {
  if (!header) return null;
  for (const part of header.split(",")) {
    const tag = part.split(";")[0]?.trim().toLowerCase();
    if (!tag) continue;
    const [lang, region] = tag.split("-");
    const byRegion = normalize(region);
    if (byRegion) return byRegion;
    const byLang = LANG_TO_REGION[lang ?? ""];
    if (byLang) return byLang;
  }
  return null;
}

export async function resolveRegion(storeOverride?: string): Promise<StoreRegion> {
  const override = normalize(storeOverride);
  if (override) return override;

  const h = await headers();

  const geo = normalize(h.get("x-vercel-ip-country"));
  if (geo) return geo;

  const lang = fromAcceptLanguage(h.get("accept-language"));
  if (lang) return lang;

  return DEFAULT_REGION;
}
