/**
 * Degradation smoke (project `degraded`, no-DB server): the S2 error-
 * semantics contract in the real production build, two flavours:
 *
 * 1. DYNAMIC core routes (/timeline, /archive — DB read on the first
 *    uncached request). The visible mode is a RACE between the DB error and
 *    the shell flush: if the loader throws AFTER streaming begins, the
 *    response is 200 and error.tsx renders the themed surface client-side
 *    ("TRANSMISSION INTERRUPTED", role=alert — the usual local/Windows
 *    outcome); if the connection fails BEFORE the shell flushes (instant
 *    ECONNREFUSED — the usual CI/Linux outcome), the response is a plain
 *    ≥500 without the boundary. Both are accepted; the HARD invariants are
 *    pinned either way: never a 404, never the 404 surface, never an empty
 *    page. (The first CI run failed exactly on this: locally 200+surface,
 *    in CI plain 500.)
 *
 * 2. Book LONG TAIL (on-demand ISR outside the hot subset): React error
 *    boundaries do NOT run during on-demand static generation, so the
 *    response is Next's plain 500 (S8 finding, see the session report).
 *    Same hard invariants: never a 404, never "ARCHIVE FRAGMENT LOST" (an
 *    outage must not masquerade as "this book does not exist"), never empty.
 *
 * Cache caveat: these tests are meaningful against a FRESH build. A live
 * render (dev server or test:smoke:live) fills the shared .next data/ISR
 * cache, which survives `next build` — after that the no-DB server serves
 * real content and these asserts fail. Local recipe: rm -rf .next &&
 * npm run build, then run test:smoke BEFORE test:smoke:live. CI always
 * starts clean.
 */
import { expect, test } from "@playwright/test";
import { coldBookSlug } from "./helpers";

for (const path of ["/timeline", "/archive"]) {
  test(`dynamic route degrades without lying: ${path}`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res, "expected a navigation response").not.toBeNull();
    expect(res!.status()).not.toBe(404);
    await expect(page.getByText("ARCHIVE FRAGMENT LOST")).toHaveCount(0);

    if (res!.status() === 200) {
      // Post-shell failure: the themed client boundary with its recovery
      // affordance.
      const surface = page.locator("main.syspage[role='alert']");
      await expect(surface).toBeVisible();
      await expect(surface.locator("h1")).toHaveText(
        "TRANSMISSION INTERRUPTED",
      );
      await expect(
        surface.getByRole("button", { name: /re-consecrate/i }),
      ).toBeVisible();
    } else {
      // Pre-shell failure: Next's plain error page (same shape as the book
      // long tail below) — a 5xx, never an empty document.
      expect(res!.status()).toBeGreaterThanOrEqual(500);
      await expect(
        page.getByText(/TRANSMISSION INTERRUPTED|Internal Server Error/),
      ).toBeVisible();
    }
  });
}

test("book long tail degrades without lying (no 404, no empty page)", async ({
  page,
}) => {
  // Cold index 0 is RESERVED for this test: the live canary takes index 1,
  // because its successful render fills the shared .next ISR cache and this
  // server would then serve the cached page instead of degrading.
  const res = await page.goto(`/book/${coldBookSlug(0)}`);
  expect(res, "expected a navigation response").not.toBeNull();
  expect(res!.status()).not.toBe(404);
  expect(res!.status()).toBeGreaterThanOrEqual(500);

  await expect(page.getByText("ARCHIVE FRAGMENT LOST")).toHaveCount(0);
  await expect(
    page.getByText(/TRANSMISSION INTERRUPTED|Internal Server Error/),
  ).toBeVisible();
});
