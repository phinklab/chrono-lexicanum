/**
 * DB-free route smokes (project `static`, no-DB server): the prerendered/
 * snapshot core routes — hub, map, podcasts index, the hot book subset —
 * plus /ask (its questionnaire renders from static config; verified against
 * /healthz 503) must serve their REAL content with NO database. Per route ×
 * (320/1280): one SPECIFIC landmark assert (green tests can never all be
 * /login), no pageerror / console.error / unexpected same-origin 4xx-5xx,
 * no horizontal overflow, no serious/critical axe findings.
 *
 * /timeline and /archive read the DB on their first uncached request —
 * their content smokes live in smoke-live.spec.ts, their degradation proof
 * in smoke-degraded.spec.ts.
 *
 * Runs under emulated reduced motion so entrance choreography (animated
 * letter-spacing, staggered opacity) cannot race the axe and overflow
 * readings.
 */
import { expect, test, type Page } from "@playwright/test";
import {
  VIEWPORTS,
  calmMotion,
  expectCleanLog,
  expectNoHorizontalOverflow,
  expectNoSeriousAxeViolations,
  hotBookSlug,
  watchPage,
} from "./helpers";

const ROUTES: {
  name: string;
  path: () => string;
  landmark: (page: Page) => Promise<void>;
}[] = [
  {
    name: "hub",
    path: () => "/",
    landmark: async (page) => {
      await expect(page.locator("main#main.hub")).toBeVisible();
      await expect(page.locator("h1.hub-hero__heading")).toHaveText(
        "Chrono Lexicanum",
      );
    },
  },
  {
    name: "map",
    path: () => "/map",
    landmark: async (page) => {
      await expect(page.locator("main#main.map-route")).toBeVisible();
      // The chart itself, not just the shell: the SVG stage must mount.
      await expect(page.locator("main.map-route svg").first()).toBeAttached();
    },
  },
  {
    name: "ask",
    path: () => "/ask",
    landmark: async (page) => {
      await expect(page.locator("main#main.ask")).toBeVisible();
      await expect(page.locator("h1#ask-title")).toHaveText(
        "Find Your Next Book",
      );
    },
  },
  {
    name: "podcasts",
    path: () => "/archive/podcasts",
    landmark: async (page) => {
      await expect(page.locator("main#main.catalogue--vox")).toBeVisible();
      await expect(page.locator("h1.catalogue-hero__heading")).toHaveText(
        "The Archive",
      );
      // Show cards prove the snapshot payload rendered, not an empty shell.
      await expect(page.locator(".pod-card").first()).toBeVisible();
    },
  },
  {
    name: "book-detail (hot subset)",
    path: () => `/book/${hotBookSlug()}`,
    landmark: async (page) => {
      await expect(page.locator("main#main.book-detail")).toBeVisible();
      await expect(page.locator("main.book-detail h1").first()).not.toBeEmpty();
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
      const res = await page.goto(route.path());
      expect(res, "expected a navigation response").not.toBeNull();
      expect(res!.status()).toBe(200);
      await route.landmark(page);
      await expectNoHorizontalOverflow(page);
      await expectNoSeriousAxeViolations(page);
      expectCleanLog(log);
    });
  }
}
