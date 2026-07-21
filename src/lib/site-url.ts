/**
 * Canonical-host + indexability contract (Launch S5).
 *
 * `SITE_URL` is SERVER-ONLY by design — the only consumers are server-side
 * (metadataBase, canonicals, sitemap/robots, JSON-LD absolute URLs). The old
 * `NEXT_PUBLIC_SITE_URL` was a footgun: `NEXT_PUBLIC_*` values are frozen into
 * the client bundle at build time, so an env change silently did nothing until
 * the next deploy while LOOKING like runtime config. No browser code ever
 * needed the value, so the variable moved server-side (plan § Session 5
 * Punkt 1).
 *
 * Fail-loud: a production build/runtime WITHOUT `SITE_URL` throws — a deploy
 * whose canonicals, OG URLs and sitemap point at localhost must never exist.
 * CI builds set the syntactically valid dummy `https://example.invalid`
 * (.github/workflows/ci.yml); Vercel gets the real host BEFORE the S5 PR
 * merges (production value: https://www.chrono-lexicanum.com — S0-Entscheid 2,
 * launch-master-plan).
 */
import "server-only";

/**
 * The canonical site origin, no trailing slash (e.g.
 * `https://www.chrono-lexicanum.com`). Dev falls back to localhost so
 * `next dev` needs no env; every production build/boot requires the real
 * value.
 */
export function siteOrigin(): string {
  const raw = process.env.SITE_URL;
  if (raw) {
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      throw new Error(
        `[site-url] SITE_URL is not a valid absolute URL: "${raw}" (expected e.g. https://www.chrono-lexicanum.com)`,
      );
    }
    return url.origin;
  }
  if (process.env.NODE_ENV !== "production") return "http://localhost:3000";
  throw new Error(
    "[site-url] SITE_URL must be set for a production build/runtime: canonicals, " +
      "OG URLs and the sitemap derive from it (production: https://www.chrono-lexicanum.com; " +
      "CI uses https://example.invalid).",
  );
}

/**
 * True when this build/runtime is the PUBLIC production site — the single
 * launch lever `PREVIEW_GATE=off` (src/lib/previewGate.ts) drives both the
 * route gate and indexability. While the gate stands, everything carries
 * `noindex` and robots.txt disallows all crawling.
 *
 * Metadata for static/ISR pages is BAKED AT BUILD TIME: flipping
 * `PREVIEW_GATE=off` in Vercel does not un-bake the noindex of the running
 * deploy — the launch runbook (scripts/runbooks/launch-runbook.md) therefore
 * mandates a fresh production deploy after the flip. Vercel preview
 * deployments keep their own `X-Robots-Tag: noindex` regardless, so a
 * project-wide env slip cannot make previews indexable.
 */
export function siteIndexable(): boolean {
  return process.env.PREVIEW_GATE === "off";
}
