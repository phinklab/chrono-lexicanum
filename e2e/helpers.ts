/**
 * Shared plumbing for the mini smoke set. Everything here exists to satisfy
 * the launch-plan § S8 spec: per-route landmark asserts, hard-fail on
 * pageerror / console.error / unexpected same-origin 4xx-5xx, axe without
 * serious/critical findings (exceptions documented below), and the 320/1280
 * viewport pair. No further growth.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const VIEWPORTS = [
  { name: "320", width: 320, height: 720 },
  { name: "1280", width: 1280, height: 800 },
] as const;

function readSlugArray(file: string): string[] {
  const raw = readFileSync(
    join(process.cwd(), "scripts", "snapshot-data", file),
    "utf8",
  );
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error(`${file}: expected an array`);
  return parsed.map((entry) => {
    if (typeof entry === "string") return entry;
    if (
      entry !== null &&
      typeof entry === "object" &&
      "slug" in entry &&
      typeof (entry as { slug: unknown }).slug === "string"
    ) {
      return (entry as { slug: string }).slug;
    }
    throw new Error(`${file}: unexpected entry shape`);
  });
}

/** First curated hot slug — prerendered at build from the committed snapshot
 *  (S4b), so the book-detail smoke stays DB-free and needs no hardcoded slug. */
export function hotBookSlug(): string {
  const slug = readSlugArray("book-hot-slugs.json")[0];
  if (!slug) throw new Error("book-hot-slugs.json is empty");
  return slug;
}

/** LONG-TAIL slugs (in the corpus, NOT in the hot subset): the one route
 *  class that still reads the DB per request (on-demand ISR). The degraded
 *  smoke and the live canary take DIFFERENT indices — a successful live
 *  render fills the shared .next ISR cache, and the no-DB server would then
 *  happily serve that page with a 200. */
export function coldBookSlug(index: 0 | 1): string {
  const hot = new Set(readSlugArray("book-hot-slugs.json"));
  const cold = readSlugArray("book-slugs.json").filter((s) => !hot.has(s));
  const slug = cold[index];
  if (!slug) throw new Error(`fewer than ${index + 1} cold slugs available`);
  return slug;
}

/** Deterministic rendering for route asserts: entrance choreography (animated
 *  letter-spacing, staggered opacity) otherwise races axe/overflow readings —
 *  the 10-base.css reduced-motion clamp snaps everything to its final state,
 *  and the emulation doubles as a smoke over that clamp. */
export async function calmMotion(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
}

/**
 * Documented exceptions to the "no console.error / no same-origin 4xx-5xx"
 * rule. Keep this list SHORT and justified:
 *
 * - `/_vercel/` — @vercel/analytics + @vercel/speed-insights inject
 *   same-origin script/beacon URLs that only exist when Vercel hosts the
 *   deployment; under a local/CI `next start` they 404 by construction.
 *   The launch runbook verifies real analytics ingestion on Vercel itself.
 * - Router PREFETCHES (requests carrying Next-Router-Prefetch / purpose:
 *   prefetch) — production `<Link>`s prefetch in-view targets, and on the
 *   no-DB server the DYNAMIC targets (/timeline, /archive, /compendium,
 *   /person/…) legitimately answer 500. That is the target route's designed
 *   degradation, not a defect of the page under test; the degraded project
 *   pins the real navigation behaviour of those routes.
 * - The UA's console ECHO of any failed resource ("Failed to load
 *   resource: …") — the response watcher is the authority for network
 *   failures (it has status, path and the prefetch header; the console echo
 *   carries no reliable source URL in CI Chromium). Non-network
 *   console.error output is still a hard failure.
 */
const IGNORED_URL = /\/_vercel\//;
const NETWORK_ECHO = /^Failed to load resource:/;

function isPrefetch(headers: Record<string, string>): boolean {
  return (
    headers["next-router-prefetch"] !== undefined ||
    headers["purpose"] === "prefetch" ||
    (headers["sec-purpose"] ?? "").includes("prefetch")
  );
}

export type ProblemLog = { problems: string[] };

/** Attach pageerror / console.error / response watchers. Call BEFORE goto. */
export function watchPage(page: Page): ProblemLog {
  const log: ProblemLog = { problems: [] };
  page.on("pageerror", (err) => {
    log.problems.push(`pageerror: ${err.message}`);
  });
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (NETWORK_ECHO.test(text)) return;
    if (IGNORED_URL.test(text)) return;
    log.problems.push(`console.error: ${text}`);
  });
  page.on("response", (res) => {
    const url = res.url();
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return;
    }
    if (parsed.origin !== new URL(page.url() || url).origin) return;
    if (res.status() < 400) return;
    if (IGNORED_URL.test(parsed.pathname)) return;
    if (isPrefetch(res.request().headers())) return;
    log.problems.push(`${res.status()} ${parsed.pathname}`);
  });
  return log;
}

export function expectCleanLog(log: ProblemLog) {
  expect(log.problems, log.problems.join("\n")).toEqual([]);
}

/** No horizontal overflow: the page body must never scroll sideways. */
export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow, `horizontal overflow of ${overflow}px`).toBeLessThanOrEqual(1);
}

/**
 * Documented axe exceptions (launch plan: "keine serious/critical-Funde ohne
 * eng dokumentierte Ausnahme"). Each entry is excluded from the scan; keep
 * every reason auditable:
 *
 * - `.catalogue-pager__step.is-void` — the pager's disabled prev/next step
 *   ("← Prev" on page 1): an INACTIVE, aria-hidden text span rendered at
 *   opacity 0.45 as the disabled affordance. WCAG 1.4.3 explicitly exempts
 *   text of inactive user-interface components; axe cannot infer inactivity
 *   from a span and flags its contrast (1.81:1) as serious.
 */
const AXE_EXCLUDES: { selector: string; reason: string }[] = [
  {
    selector: ".catalogue-pager__step.is-void",
    reason: "inactive pager step — WCAG 1.4.3 inactive-component exemption",
  },
];

export async function expectNoSeriousAxeViolations(page: Page) {
  let builder = new AxeBuilder({ page });
  for (const { selector } of AXE_EXCLUDES) builder = builder.exclude(selector);
  const results = await builder.analyze();
  const offending = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  const summary = offending.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.slice(0, 5).map((n) => n.target.join(" ")),
  }));
  expect(offending, JSON.stringify(summary, null, 2)).toEqual([]);
}
