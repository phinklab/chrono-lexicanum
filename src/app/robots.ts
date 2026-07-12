/**
 * robots.txt (Launch S5). Baked at build time — the launch lever is
 * `PREVIEW_GATE=off` + a FRESH production deploy (see `siteIndexable`).
 *
 * Pre-launch: one blanket disallow (the gate 307s everything to /login
 * anyway; this keeps crawlers from even knocking). Post-launch: allow all
 * except the admin/auth/machine paths the URL matrix marks "nie in der
 * Sitemap + noindex" (A.3) — those pages additionally carry their own
 * noindex metadata, since a robots disallow alone does not prevent
 * index-by-reference.
 */
import type { MetadataRoute } from "next";
import { siteIndexable, siteOrigin } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  if (!siteIndexable()) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [
      {
        userAgent: "*",
        disallow: [
          "/api/",
          "/ingest",
          "/login",
          "/healthz",
          "/monitoring",
          "/book/*/audit",
        ],
      },
    ],
    sitemap: `${siteOrigin()}/sitemap.xml`,
  };
}
