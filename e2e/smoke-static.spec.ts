/**
 * DB-free route smokes (project `static`, no-DB server): the prerendered/
 * snapshot core routes — hub, map, podcasts index, the hot book subset —
 * plus /ask (its Curator landing renders from static config; verified against
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
  path: (viewport: (typeof VIEWPORTS)[number]) => string;
  landmark: (page: Page, viewport: (typeof VIEWPORTS)[number]) => Promise<void>;
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
    path: (viewport) =>
      viewport.name === "320"
        ? "/map?mapRenderer=canvas#cam=500,404.3,999"
        : "/map?mapRenderer=svg#cam=500,404.3,999",
    landmark: async (page, viewport) => {
      await expect(page.locator("main#main.map-route")).toBeVisible();
      if (viewport.name === "320") {
        const stage = page.locator('[data-map-renderer="canvas"]');
        const canvas = stage.locator("canvas.cg-map-canvas");
        await expect(stage).toBeAttached();
        await expect(canvas).toBeVisible();
        await expect(canvas).toHaveAttribute("data-backing", /\d+x\d+/);
        await expect(page.locator("svg.cg-chart")).toHaveCount(0);
        await expect(page.locator("canvas.cg-route-canvas")).toHaveCount(0);
        await expect(page.locator(".cg-readout .mag")).toHaveText("MAG 13.05×");

        await page.getByRole("button", { name: "Enter the chart" }).click();
        await page.getByRole("button", { name: "Open chart instruments" }).click();
        // WM-B1 sheet: journeys + legend stand directly visible under two
        // static captions; only the census's type groups still fold.
        const caps = page.locator(".cg-sheet.open .c-cap");
        await expect(caps).toHaveCount(2);
        await expect(caps.nth(0)).toHaveText("Great Journeys");
        await expect(caps.nth(1)).toHaveText("Legend");
        await expect(page.locator(".cg-sheet .jr").first()).toBeVisible();
        await expect(page.locator(".cg-sheet .cg-overlays .cx")).toHaveCount(4);
        await expect(
          page.locator(".cg-sheet .cg-census .cgrp-h .car").first(),
        ).toHaveAttribute("aria-expanded", "false");
      } else {
        const stage = page.locator('[data-map-renderer="svg"]');
        await expect(stage.locator("svg.cg-chart--base")).toBeAttached();
        await expect(page.locator("canvas.cg-map-canvas")).toHaveCount(0);
        await expect(page.locator(".cg-readout .mag")).toHaveText("MAG 13.05×");

        await page.getByRole("button", { name: "Enter the chart" }).click();
        const seek = page.getByRole("combobox", { name: "Seek a world" });
        await seek.fill("Terra");
        await page.getByRole("option", { name: /^Terra\b/ }).click();
        await expect(page.locator(".cg-pop.open")).toHaveAttribute("aria-label", "Terra");

        // WM-B1: the journeys section stands open by default, but its era
        // groups fold — the chart opens on M42, so unfold M30 to reach the
        // Great Crusade row (era-group headers are buttons, "M30 · …").
        await page.getByRole("button", { name: /^M30/ }).click();
        const journey = page.getByRole("button", { name: /^The Great Crusade/ });
        await journey.focus();
        await journey.press("Enter");
        await expect(journey).toBeFocused();
        await expect(journey).toHaveAttribute("aria-pressed", "true");
        await expect(page.locator(".cg-pop.open")).toHaveCount(0);
        await expect(page.locator(".cg-pop")).toHaveAttribute("aria-hidden", "true");
        await expect(page.locator(".cg-w.sel-on")).toHaveCount(0);
        await expect(page.locator(".cg-tour")).not.toHaveClass(/hide/);
        await expect(page.getByRole("button", { name: "Begin journey" })).toBeVisible();
        await expect(page.locator(".cg-sr")).toContainText("journey tour open");
        await expect.poll(() => page.evaluate(() => location.hash)).not.toContain("world=");
      }
    },
  },
  {
    name: "ask",
    path: () => "/ask",
    landmark: async (page) => {
      await expect(page.locator("main#main.ask")).toBeVisible();
      await expect(page.locator("h1#ask-title")).toHaveText(
        "The Curator",
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
      const res = await page.goto(route.path(viewport));
      expect(res, "expected a navigation response").not.toBeNull();
      expect(res!.status()).toBe(200);
      await route.landmark(page, viewport);
      await expectNoHorizontalOverflow(page);
      await expectNoSeriousAxeViolations(page);
      expectCleanLog(log);
    });
  }
}
