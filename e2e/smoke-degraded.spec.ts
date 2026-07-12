/**
 * Degradation smoke (project `degraded`, no-DB server): the S2 error-
 * semantics contract in the real production build, two flavours:
 *
 * 1. DYNAMIC core routes (/timeline, /archive — DB read on the first
 *    uncached request): the themed error surface ("TRANSMISSION
 *    INTERRUPTED", role=alert) must appear. The HTTP status is 200 —
 *    streaming has already begun when the loader throws; the boundary
 *    renders client-side — so the surface, not the status, is the assert.
 *
 * 2. Book LONG TAIL (on-demand ISR outside the hot subset): React error
 *    boundaries do NOT run during on-demand static generation, so the
 *    response is Next's plain 500 (S8 finding, see the session report).
 *    The hard invariants asserted: never a 404, never the 404 surface
 *    ("ARCHIVE FRAGMENT LOST" — an outage must not masquerade as "this
 *    book does not exist"), never an empty page.
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
  test(`dynamic route degrades to the themed error surface: ${path}`, async ({
    page,
  }) => {
    const res = await page.goto(path);
    expect(res, "expected a navigation response").not.toBeNull();
    expect(res!.status()).not.toBe(404);

    const surface = page.locator("main.syspage[role='alert']");
    await expect(surface).toBeVisible();
    await expect(surface.locator("h1")).toHaveText("TRANSMISSION INTERRUPTED");
    await expect(page.getByText("ARCHIVE FRAGMENT LOST")).toHaveCount(0);
    // The recovery affordances of error.tsx are present.
    await expect(
      surface.getByRole("button", { name: /re-consecrate/i }),
    ).toBeVisible();
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
