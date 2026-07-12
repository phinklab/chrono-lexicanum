/**
 * Route-metadata helpers (Launch S5).
 *
 * Next merges `Metadata` SHALLOWLY per key: a route that declares its own
 * `openGraph` replaces the root layout's whole object — silently dropping
 * `siteName`, `type` and the default share image. Every route therefore
 * builds its OG block through `routeOg()` instead of an object literal, so
 * the site-wide constants survive route-specific titles/descriptions.
 *
 * Deliberately DB-free and import-light — metadata code runs on every
 * prerender path.
 */
import type { Metadata } from "next";

export const SITE_NAME = "Chrono Lexicanum";

/** The committed 1200×630 share card, served from /public. */
export const DEFAULT_OG_IMAGE = "/img/og-default.jpg";

type OpenGraph = NonNullable<Metadata["openGraph"]>;

/**
 * Route-specific Open Graph block that keeps the site-wide constants.
 * `images` accepts absolute URLs (external covers) or site-relative paths
 * (resolved against `metadataBase`); omit it to keep the default share card.
 */
export function routeOg(opts: {
  title: string;
  description: string;
  /** OG object type — books use "book", everything else stays "website". */
  type?: "website" | "book";
  images?: OpenGraph["images"];
}): OpenGraph {
  return {
    title: opts.title,
    description: opts.description,
    type: opts.type ?? "website",
    siteName: SITE_NAME,
    images: opts.images ?? [DEFAULT_OG_IMAGE],
  };
}
