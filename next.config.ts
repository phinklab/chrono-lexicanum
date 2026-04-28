import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strict mode catches common bugs early; keep on in dev.
  reactStrictMode: true,

  // We do not yet ship images from external CDNs; allow Goodreads / Lexicanum
  // domains here when book covers / wiki thumbnails get integrated.
  images: {
    remotePatterns: [
      // { protocol: "https", hostname: "i.gr-assets.com" }, // Goodreads covers
      // { protocol: "https", hostname: "static.wikia.nocookie.net" }, // Lexicanum
    ],
  },

  // The legacy prototype lives under /archive/prototype-v1 and must NOT be
  // type-checked or built. See tsconfig.json `exclude` and .gitignore.
  experimental: {
    // Reserved for future toggles (PPR, dynamicIO etc.)
  },
};

export default nextConfig;
