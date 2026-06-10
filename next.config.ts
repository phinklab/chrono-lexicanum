import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strict mode catches common bugs early; keep on in dev.
  reactStrictMode: true,

  // /compendium (ISR, revalidate=300) still prerenders at build and shares the
  // max-5 pooler pool with ~1100 entity detail pages rendering concurrently —
  // its cold aggregate fill can exceed the 60s default and abort the deploy.
  staticPageGenerationTimeout: 180,

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
    // Reserved for future toggles (PPR, dynamicIO etc.)
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
