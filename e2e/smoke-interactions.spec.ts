/**
 * DB-free interaction smokes (project `static`, no-DB server). Two of the
 * four semantic proofs from the launch plan § S8:
 *
 *  1. Menu focus — burger opens the SiteMenu overlay, the page behind
 *     becomes inert, Escape closes and returns focus to the burger.
 *  2. Map seek + focus restore — the seek input drives world selection by
 *     keyboard alone (type → Enter → world panel), Escape closes the panel
 *     and focus never leaves the seek control.
 *
 * (3: horizontal overflow lives in the per-route smokes; 4: timeline arrows
 * vs. player volume slider needs timeline content → smoke-live.spec.ts.)
 */
import { expect, test } from "@playwright/test";

test("site menu: focus model + inert background (320px)", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");

  const burger = page.locator("button.site-burger");
  const menu = page.locator("nav#site-menu");
  const main = page.locator("main#main");

  // Closed baseline: overlay parked, page live.
  await expect(menu).toHaveAttribute("aria-hidden", "true");
  await expect(main).not.toHaveAttribute("inert");

  await burger.click();
  await expect(burger).toHaveAttribute("aria-expanded", "true");
  await expect(menu).toHaveAttribute("aria-hidden", "false");
  // The page behind the full-screen overlay must be unreachable for AT.
  await expect(main).toHaveAttribute("inert", "");

  // Tab moves focus into the menu links (burger is first in the wrap order).
  await page.keyboard.press("Tab");
  const focusInMenu = await page.evaluate(() =>
    document.getElementById("site-menu")?.contains(document.activeElement),
  );
  expect(focusInMenu).toBe(true);

  // Escape closes, releases inert, returns focus to the burger.
  await page.keyboard.press("Escape");
  await expect(menu).toHaveAttribute("aria-hidden", "true");
  await expect(main).not.toHaveAttribute("inert");
  await expect(burger).toBeFocused();
});

test("map: seek by keyboard + focus restore (1280px)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/map");

  const seek = page.locator('input[aria-label="Seek a world"]');
  const panel = page.locator(".cg-pop");

  await seek.click();
  await seek.fill("Terra");
  // First hit is preselected; Enter picks it.
  await page.keyboard.press("Enter");
  await expect(panel).toHaveClass(/open/);
  await expect(panel.locator(".pp-name")).toContainText(/terra/i);
  // Focus never left the seek control while the panel opened.
  await expect(seek).toBeFocused();

  // Escape (query already cleared by the pick) closes the panel; focus stays.
  await page.keyboard.press("Escape");
  await expect(panel).not.toHaveClass(/open/);
  await expect(seek).toBeFocused();
});
