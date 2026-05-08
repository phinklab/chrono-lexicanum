import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strict mode catches common bugs early; keep on in dev.
  reactStrictMode: true,

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
};

export default nextConfig;
