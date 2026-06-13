// Holographic theme palettes — originally a byte-identical port of
// public/lab/cartographer-prototype/themes.js. The default `mechanicus`
// palette was re-tuned 2026-06-12 to the site's design language (gold /
// bone / void, Cinzel + Cormorant + Plex Mono via the next/font CSS vars —
// literal family names like "Cinzel" would NOT resolve, next/font hashes
// them). `astropath` keeps its prototype values as an alternate flavor.

import type { Theme, ThemeId } from "./types";

export const THEMES: Record<ThemeId, Theme> = {
  mechanicus: {
    id: "mechanicus",
    label: "Mechanicus Battle-Table",
    sub: "Cult Mechanicus · Cogitator-1011 · Datastream Stable",
    bg0: "#02030a",
    bg1: "#06080f",
    vignette:
      "radial-gradient(ellipse at center, rgba(8, 10, 18, 0.45) 0%, rgba(2, 3, 10, 0.95) 75%)",
    primary: "#c9a65a",
    primaryDim: "#8a6f2c",
    primarySoft: "rgba(201, 166, 90, 0.16)",
    accent: "#e8dcc0",
    danger: "#ff6b6b",
    stroke: "rgba(201, 166, 90, 0.38)",
    strokeFaint: "rgba(201, 166, 90, 0.12)",
    grid: "rgba(201, 166, 90, 0.08)",
    fontDisplay: "var(--font-cinzel), serif",
    fontBody: "var(--font-cormorant), Georgia, serif",
    fontMono: "var(--font-plex-mono), ui-monospace, monospace",
    letterTitle: "0.22em",
    scanlineOpacity: 0.1,
    starColor: "#e8dcc0",
    starHot: "#ffffff",
    discFill: "rgba(14, 12, 6, 0.55)",
  },
  astropath: {
    id: "astropath",
    label: "Astropathic Vision",
    sub: "Choir of the Whispering Tower · Soul-Cast Render",
    bg0: "#06030a",
    bg1: "#150728",
    vignette:
      "radial-gradient(ellipse at center, rgba(60,20,90,0.45) 0%, rgba(8,3,16,0.97) 80%)",
    primary: "#a78cf0",
    primaryDim: "#5c4290",
    primarySoft: "rgba(167, 140, 240, 0.20)",
    accent: "#e0d4ff",
    danger: "#ff5a8a",
    stroke: "rgba(167, 140, 240, 0.40)",
    strokeFaint: "rgba(167, 140, 240, 0.14)",
    grid: "rgba(167, 140, 240, 0.07)",
    fontDisplay: '"Cinzel Decorative", serif',
    fontBody: '"Cormorant Garamond", serif',
    fontMono: '"JetBrains Mono", monospace',
    letterTitle: "0.28em",
    scanlineOpacity: 0.1,
    starColor: "#e0d4ff",
    starHot: "#ffffff",
    discFill: "rgba(28, 12, 50, 0.55)",
  },
};

export const DEFAULT_THEME: ThemeId = "mechanicus";

export function getTheme(id: ThemeId | string | undefined | null): Theme {
  if (id && (id === "mechanicus" || id === "astropath")) {
    return THEMES[id];
  }
  return THEMES[DEFAULT_THEME];
}
