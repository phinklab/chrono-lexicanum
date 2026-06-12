import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strict mode catches common bugs early; keep on in dev.
  reactStrictMode: true,

  // /compendium (ISR, revalidate=300) still prerenders at build and shares the
  // max-5 pooler pool with ~1100 entity detail pages rendering concurrently —
  // its cold aggregate fill can exceed the 60s default and abort the deploy.
  // 180s held, but stayed tight (a transient retry on /person/dan_abnett in a
  // recent build log); 300s buys headroom for data growth (Report 144 § B.3).
  staticPageGenerationTimeout: 300,

  // We do not yet ship images from external CDNs. Add remote patterns here
  // when cover-image work picks an actual source. (Goodreads is no longer a
  // candidate — its API was discontinued December 2020. Phase-3 sources are
  // Wikipedia + Lexicanum + Open Library + Hardcover.)
  images: {
    remotePatterns: [
      // { protocol: "https", hostname: "static.wikia.nocookie.net" }, // Lexicanum thumbnails
      // { protocol: "https", hostname: "covers.openlibrary.org" }, // Open Library covers
    ],
  },

  // The legacy prototype lives under /archive/prototype-v1 and must NOT be
  // type-checked or built. See tsconfig.json `exclude` and .gitignore.
  experimental: {
    // Build-time SSG contention guard (Report 144 § A.3): every entity detail
    // page fires up to 4 parallel queries, and each export worker rendered 8
    // pages concurrently (default) against its per-process `max:5` pooler pool
    // — the plausible cause of the transient /person/dan_abnett retry (§ B.3).
    // 3 pages/worker keeps the per-process burst near the pool size; the build
    // is DB-bound, not CPU-bound, so wall-clock impact is small.
    staticGenerationMaxConcurrency: 3,
  },

  // /werke + /podcasts merged under /archive (session 139). Query strings are
  // auto-forwarded; `#ep-` fragments never reach the server and are re-applied
  // by the browser after the 308 — episode deep-links keep scrolling+highlighting
  // on hard loads. Internal links all point at /archive/*; these serve bookmarks
  // and external references.
  async redirects() {
    return [
      { source: "/werke", destination: "/archive", permanent: true },
      { source: "/podcasts", destination: "/archive/podcasts", permanent: true },
      {
        source: "/podcasts/:slug",
        destination: "/archive/podcasts/:slug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
