import type { NextConfig } from "next";

// Simple static Content-Security-Policy (Board 121-P11, Entscheid 2026-06-12).
// Deliberately the *baseline* form, not the nonce-per-request form the
// next.config comment below flagged as the bigger step: a nonce forces every
// page into dynamic rendering, which we do not want for the ISR/SSG catalogue.
// The cost of going nonce-free is `'unsafe-inline'` (+ `'unsafe-eval'`) on
// script-src — so this policy does NOT defend against inline-script XSS. What
// it *does* buy, statically and for free: no external script/object origin can
// be injected, clickjacking is closed (`frame-ancestors 'self'`, matching the
// existing X-Frame-Options), and `base-uri`/`form-action` hijacking is blocked.
// Nonce-based script-src hardening stays a future, separate step (see report).
//
// `img-src`/`media-src` allow `https:` because /archive + /archive/podcasts
// render DB-sourced cover/art URLs as plain <img> from open-ended external
// hosts (Open Library, podcast CDNs, …). `http:` is intentionally omitted —
// on the https production origin those would already be mixed-content-blocked.
const isDev = process.env.NODE_ENV !== "production";
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  // Dev needs the HMR/React-Refresh websocket; prod talks only to its own origin.
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "frame-src 'self'",
  "media-src 'self' https:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

const nextConfig: NextConfig = {
  // Strict mode catches common bugs early; keep on in dev.
  reactStrictMode: true,

  // Pin the workspace root to THIS app dir. Without it Turbopack infers the
  // root from lockfiles and, inside a git worktree, picks the PARENT repo
  // (C:\...\chrono-lexicanum) — modules can then resolve from the parent's
  // node_modules (duplicate React = dead hydration). `process.cwd()` is the
  // dir `next dev`/`next build` runs in, i.e. this checkout; `__dirname`
  // resolves wrongly in the compiled config. Dev-only concern, but harmless
  // and correct for every checkout.
  turbopack: { root: process.cwd() },

  // Phone testing against the LAN URL (http://<LAN-IP>:3000): Next blocks
  // cross-origin requests to /_next dev resources by default; allow the dev
  // machine's LAN address. Dev-only setting, ignored in production builds.
  allowedDevOrigins: ["192.168.1.104"],

  // We do not yet ship images from external CDNs. Add remote patterns here
  // when cover-image work picks an actual source. (External cover/art URLs on
  // /archive render as plain <img>, not next/image — see the CSP note above.)
  images: {
    remotePatterns: [],
  },

  experimental: {
    // Prerender reads the committed snapshot, never Postgres (Launch S1b
    // Loader-Weiche) — the build needs no DB and CI proves it with an
    // unreachable DATABASE_URL. Two workers are defense in depth: if a
    // DB-touching page ever slips back into the prerender set, 2 workers ×
    // `max:5` pooler pool stays below the ~15 free-tier pooler slots instead
    // of the 15-worker stampede that produced 300s timeouts + retries. The
    // snapshot-fed static generation is I/O-light, so wall-clock impact is
    // negligible. The old DB-era crutches (`staticPageGenerationTimeout: 300`,
    // `staticGenerationMaxConcurrency: 3`) were removed after re-measurement
    // (Session S1b report): static gen completes in seconds against the
    // snapshot, well inside Next's 60s default.
    cpus: 2,
  },

  // Baseline security headers (Report 144 § S.2). HSTS is deliberately NOT
  // set here — Vercel adds it on production domains, doubling it just risks
  // drift. The CSP is the simple static baseline defined above (Board 121-P11):
  // nonce-based script hardening stays a future, separate step.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
        ],
      },
    ];
  },

  // /werke + /podcasts merged under /archive (session 139). Query strings are
  // auto-forwarded; `#ep-` fragments never reach the server and are re-applied
  // by the browser after the 308 — episode deep-links keep scrolling+highlighting
  // on hard loads. Internal links all point at /archive/*; these serve bookmarks
  // and external references.
  async redirects() {
    return [
      // /buecher was the maintainer-era catalogue; /archive is the canonical
      // public media archive (Board 121-P11). 308 keeps old bookmarks alive.
      { source: "/buecher", destination: "/archive", permanent: true },
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
