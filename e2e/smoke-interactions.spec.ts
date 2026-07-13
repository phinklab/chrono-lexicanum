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
 * Curator regressions below additionally pin its landing/tool hierarchy,
 * visible faction register, unsnapped route and dot-centred progress rail.
 */
import { expect, test, type Page } from "@playwright/test";
import { VIEWPORTS, calmMotion } from "./helpers";

type ProgressGeometry = {
  lineStartDelta: number;
  lineEndDelta: number;
  fillEndDelta: number;
};

async function readProgressGeometry(page: Page): Promise<ProgressGeometry> {
  return page.locator(".ask-timeline").evaluate((timeline) => {
    const rect = (selector: string) => {
      const node = timeline.querySelector<HTMLElement>(selector);
      if (!node) throw new Error(`missing progress node: ${selector}`);
      return node.getBoundingClientRect();
    };
    const center = (box: DOMRect) => box.left + box.width / 2;
    const line = rect(".ask-timeline__line");
    const fill = rect(".ask-timeline__fill");
    const marks = [
      ...timeline.querySelectorAll<HTMLElement>(".ask-tl-stop__mark"),
    ];
    const current = timeline.querySelector<HTMLElement>(
      ".ask-tl-stop.on .ask-tl-stop__mark",
    );

    if (marks.length < 2 || !current) {
      throw new Error("incomplete progress stops");
    }

    return {
      lineStartDelta: Math.abs(
        line.left - center(marks[0]!.getBoundingClientRect()),
      ),
      lineEndDelta: Math.abs(
        line.right - center(marks.at(-1)!.getBoundingClientRect()),
      ),
      fillEndDelta: Math.abs(
        fill.right - center(current.getBoundingClientRect()),
      ),
    };
  });
}

async function expectProgressOnDotCentres(page: Page) {
  await expect
    .poll(async () => (await readProgressGeometry(page)).fillEndDelta)
    .toBeLessThanOrEqual(1);

  const geometry = await readProgressGeometry(page);
  expect(geometry.lineStartDelta).toBeLessThanOrEqual(1);
  expect(geometry.lineEndDelta).toBeLessThanOrEqual(1);
}

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
  // The overlay's links are rendered and visible before we walk into them.
  await expect(menu.locator("a").first()).toBeVisible();

  // Tab moves focus into the menu links (burger is first in the wrap order).
  // Anchor the starting point explicitly: whether a CLICK leaves focus on the
  // button is UA-dependent (one local run flaked on it) — this test pins the
  // tab order into the overlay, not click-focus behaviour.
  await burger.focus();
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

  // While the overture veil stands, the chart chrome is inert (S10a) — the
  // overture's ENTER button is the keyboard door. Activate it first, exactly
  // like a keyboard user would.
  await page.getByRole("button", { name: /enter the chart/i }).click();

  const seek = page.locator('.cg-cartouche input[aria-label="Seek a world"]');
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

test("legal documents: English default + URL-based German toggle", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await calmMotion(page);

  await page.goto("/imprint");
  await expect(page.locator("main#main.legal")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("heading", { level: 1, name: "Imprint" }),
  ).toBeVisible();
  const imprintLanguages = page.getByRole("navigation", {
    name: "Document language",
  });
  await imprintLanguages
    .getByRole("link", { name: "Diese Seite auf Deutsch lesen" })
    .click();
  await page.waitForURL("**/imprint?lang=de");
  await expect(page.locator("main#main.legal")).toHaveAttribute("lang", "de");
  await expect(
    page.getByRole("heading", { level: 1, name: "Impressum" }),
  ).toBeVisible();

  await page.goto("/privacy");
  await expect(page.locator("main#main.legal")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("heading", { level: 1, name: "Privacy Policy" }),
  ).toBeVisible();
  const privacyLanguages = page.getByRole("navigation", {
    name: "Document language",
  });
  await privacyLanguages
    .getByRole("link", { name: "Diese Seite auf Deutsch lesen" })
    .click();
  await page.waitForURL("**/privacy?lang=de");
  await expect(page.locator("main#main.legal")).toHaveAttribute("lang", "de");
  await expect(
    page.getByRole("heading", { level: 1, name: "Datenschutzerklärung" }),
  ).toBeVisible();
  await expect(page.locator(".lx-foot")).toHaveAttribute("lang", "en");
  await expect(page.locator('.legal__doc a[href="/imprint?lang=de"]')).toHaveText(
    "Impressum",
  );
});

for (const viewport of VIEWPORTS) {
  test(`curator: landing, compact switch + dot-centred progress (${viewport.name}px)`, async ({
    page,
  }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await calmMotion(page);
    await page.goto("/ask");

    await expect(page.locator("h1#ask-title")).toHaveText("The Curator");
    const landing = page.getByRole("navigation", {
      name: "Choose a Curator path",
    });
    await expect(landing).toBeVisible();
    await expect(landing.getByRole("link")).toHaveCount(2);
    await expect(
      landing.getByRole("link").filter({ hasText: "Four Questions" }),
    ).toBeVisible();
    await expect(
      landing.getByRole("link").filter({ hasText: "By Faction" }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Curator paths" }),
    ).toHaveCount(0);

    await landing
      .getByRole("link")
      .filter({ hasText: "Four Questions" })
      .click();
    await page.waitForURL(
      (url) =>
        url.pathname === "/ask" && url.searchParams.get("mode") === "profile",
    );

    await expect(landing).toHaveCount(0);
    await expect(page.locator("h1#ask-title")).toHaveText("Four Questions");
    const compact = page.getByRole("navigation", { name: "Curator paths" });
    await expect(compact).toBeVisible();
    await expect(
      compact.getByRole("link", { name: "Four Questions", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      compact.getByRole("link", { name: "By Faction", exact: true }),
    ).toBeVisible();

    const stops = page.locator(".ask-tl-stop");
    await expect(stops).toHaveCount(4);
    for (let index = 0; index < 4; index += 1) {
      await expect(stops.nth(index).getByRole("button")).toHaveAttribute(
        "aria-current",
        "step",
      );
      await expectProgressOnDotCentres(page);

      if (index < 3) {
        await page.locator(".ask-question .ask-opt").first().click();
      }
    }
  });

  test(`curator: faction register is visible, unsnapped + keeps one pick (${viewport.name}px)`, async ({
    page,
  }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await calmMotion(page);
    await page.goto("/ask/faction");

    await expect(
      page.getByRole("heading", { level: 1, name: "By Faction" }),
    ).toBeVisible();
    const roster = page.locator("#ofob-faction-roster");
    await expect(page.locator(".ofob__all-label")).toHaveText("All factions");
    await expect(roster).toBeVisible();
    const rosterOptions = roster.getByRole("button");
    await expect(rosterOptions).toHaveCount(18);

    const pickTitle = page.locator(".ofob__answer .ask-pick__title");
    await expect(pickTitle).toBeVisible();
    await expect(pickTitle).not.toBeEmpty();

    await expect(page.locator("main#main.ask")).not.toHaveClass(/route-snap/);
    expect(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).scrollSnapType,
      ),
    ).toBe("none");

    await rosterOptions.nth(1).click();
    await expect(roster).toBeVisible();
    await expect(rosterOptions.nth(1)).toHaveAttribute("aria-current", "true");
    await expect(rosterOptions.nth(1)).toBeFocused();
  });
}
