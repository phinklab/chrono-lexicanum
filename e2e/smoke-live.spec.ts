/**
 * Live main run (project `live`, reachable DB): the DB-backed core routes
 * — /timeline and /archive read the DB on their first uncached request —
 * render their real content (landmark, overflow, axe, clean log, both
 * viewports), the fourth interaction smoke proves the timeline keydown
 * target guard against the player's volume slider, and a cold-book canary
 * exercises the on-demand-ISR long tail through a real DB read.
 *
 * This is the documented mandatory local pre-merge run:
 *   rm -rf .next && npm run build && npm run test:smoke && npm run test:smoke:live
 * (in THAT order — a live render fills the shared .next data/ISR cache and
 * would mask the no-DB asserts of a later `test:smoke`). It moves into CI
 * once a read-only SMOKE_DATABASE_URL secret (S3a runtime role) exists.
 */
import { expect, test, type Page } from "@playwright/test";
import {
  VIEWPORTS,
  calmMotion,
  coldBookSlug,
  expectCleanLog,
  expectNoHorizontalOverflow,
  expectNoSeriousAxeViolations,
  watchPage,
} from "./helpers";

const ROUTES: {
  name: string;
  path: string;
  landmark: (page: Page) => Promise<void>;
}[] = [
  {
    name: "timeline",
    path: "/timeline",
    landmark: async (page) => {
      await expect(page.locator("main#main.chron-shell")).toBeVisible();
      // Chronicle-specific chrome, not just the shell class.
      await expect(
        page.locator("main.chron-shell [class*='chron']").first(),
      ).toBeAttached();
    },
  },
  {
    name: "archive",
    path: "/archive",
    landmark: async (page) => {
      await expect(page.locator("main#main.catalogue--werke")).toBeVisible();
      await expect(page.locator("h1.catalogue-hero__heading")).toHaveText(
        "The Archive",
      );
    },
  },
];

for (const viewport of VIEWPORTS) {
  for (const route of ROUTES) {
    test(`${route.name} @ ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await calmMotion(page);
      const log = watchPage(page);
      const res = await page.goto(route.path);
      expect(res, "expected a navigation response").not.toBeNull();
      expect(res!.status()).toBe(200);
      await route.landmark(page);
      await expectNoHorizontalOverflow(page);
      await expectNoSeriousAxeViolations(page);
      expectCleanLog(log);
    });
  }
}

test("timeline: stage arrows navigate, volume slider keeps its own (1280px)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await calmMotion(page);
  await page.goto("/timeline");
  await expect(page.locator("main#main.chron-shell")).toBeVisible();
  // The URL mirror (?era=) is written by a post-hydration effect — the
  // keyboard model is only attached once it appears.
  await page.waitForURL(/[?&]era=/);

  // Half 1 (S9): the stage section owns the keydown — the whole timeline
  // drives by keyboard alone. First ArrowDown dismisses the era intro,
  // the next advances an entry.
  const stage = page.locator("section.chron-cine");
  const counter = page.locator(".era-bar .entry-count");
  await stage.focus();
  await expect(stage).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator(".era-intro")).not.toHaveClass(/\bon\b/);
  await page.keyboard.press("ArrowDown");
  await expect(counter).toHaveText(/^ENTRY 2 \//);

  // Half 2 (S8 invariant): open the player's volume popover and focus the
  // slider — its arrows must stay its own.
  await page.locator("button.media-player__vol").click();
  const slider = page.locator("input.media-player__volume");
  await expect(slider).toBeVisible();
  await slider.focus();
  await expect(slider).toBeFocused();

  const before = Number(await slider.inputValue());
  await page.keyboard.press("ArrowUp");
  const after = Number(await slider.inputValue());

  // Pre-S8 the timeline's window keydown preventDefault()ed the arrow and the
  // slider never moved; since S9 the keydown lives on the stage, so the
  // slider (outside it) is structurally unreachable.
  expect(after).toBeGreaterThan(before);
  // …and the slider's keys must not have driven the stage either.
  await expect(counter).toHaveText(/^ENTRY 2 \//);
});

test("book long tail renders through a live DB read", async ({ page }) => {
  await calmMotion(page);
  const log = watchPage(page);
  // Cold index 1 — index 0 belongs to the degraded smoke (this render fills
  // the shared .next ISR cache; see helpers.coldBookSlug).
  const res = await page.goto(`/book/${coldBookSlug(1)}`);
  expect(res, "expected a navigation response").not.toBeNull();
  expect(res!.status()).toBe(200);
  await expect(page.locator("main#main.book-detail")).toBeVisible();
  await expect(page.locator("main.book-detail h1").first()).not.toBeEmpty();
  expectCleanLog(log);
});
