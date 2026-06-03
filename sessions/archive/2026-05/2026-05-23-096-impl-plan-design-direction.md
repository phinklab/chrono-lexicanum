---
session: 2026-05-23-096
role: implementer-plan
date: 2026-05-23
status: planning
slug: design-direction
parent: 2026-05-23-096-arch-design-direction.md
links:
  - ../sessions/2026-05-23-096-arch-design-direction.md
commits: []
---

# Implementation plan — Design direction (Warhammer Optics)

> **What this is.** A planning handoff for brief 096. The previous CC session ran out of context window mid-plan; this document captures everything that was learned about the brief, the design handoff, the existing codebase, and the implementation strategy — enough for a fresh CC session to pick up without re-deriving any of it.
>
> **What this is NOT.** An implementation report. Nothing has been built yet. No code touched, no branch created, no commits made. When implementation lands, replace this file with the proper `sessions/2026-05-23-096-impl-design-direction.md` per the project template.

## Where the design handoff lives

`C:\Users\Phil\Downloads\Warhammer optics\` — Philipp downloaded the Claude Design export manually after the public URL `https://api.anthropic.com/v1/design/h/WspqAGqEGB1bq854GU_a7A?open_file=index.html` exceeded WebFetch's 10 MB cap. The folder contains:

| File | Size | Role |
|---|---|---|
| `index.html` | 6.6 KB | **Homepage spec** (the one the brief points at). Full-bleed `vista.png` background + dual MainAuspex offsets + centred title + FloatingCoord pings + GhostReadout + BottomConsole with 3 doorway cards |
| `bundle-src.html` | 7.5 KB | Same as `index.html` but with `window.__resources.vista` indirection — pick `index.html` as the canonical |
| `chrono.jsx` | 41 KB | **Central component library**. Defines `CHRONO` palette + `TYPE` typography + `CHRONO_BOOKS` sample data + every visual primitive: `AuspexSweep`, `MainAuspex`, `CornerAuspex`, `TopNav`, `BottomConsole`, `GhostReadout`, `GhostTypeOnce`, `GhostRow`, `Typewriter`, `CogitatorReadout`, `LiveTelemetry`, `ScanLine`, `ProcessingDots`, `FloatingCoord`, `LetterField`, `WordField`. All animation keyframes (`chronoSweep`, `chronoSpin`, `chronoSpinRev`, `chronoPulse`, `chronoBlink`, `chronoTwinkle`, `chronoFade`, `chronoCursor`, `chronoScanV/H`, `chronoRiseFade`, `chronoLetter`, `chronoTickerIn`) and global utility CSS (`.c-glass`, `.c-corners`, `.c-hairline`, `.c-vhair`, `.c-shadow-text`, `.c-link-cyan`) inject themselves via a one-time `<style id="chrono-styles">` block. |
| `v2-shared.jsx` | 16.9 KB | Second-wave extras: `Bookshelf`, `MechCantRibbon`, `ServoSkull`, `Candle`, `Embers`, `HazardStripe`, `Pipe`, `GothicArch`, `AuspexRingsV2`, `WaxSeal`. Use as needed for the bespoke pages — not all are required in this brief. |
| `shared.jsx` | 7.2 KB | Earlier-wave sketch: `BOOKS`, `Starfield` (SVG), `CornerBrackets`, small `Aquila` line-drawing, `CogSkull`. Mostly superseded by `chrono.jsx`. |
| `styles.css` | 1.6 KB | Early palette helper with `:root` tokens. **Mostly superseded** by `chrono.jsx`'s inline `CHRONO` constant — that's the canonical. Useful for the `.starfield-base` gradient and the `.grain::after` SVG noise pattern. |
| `ask.html` | 31 KB | **Ask the Archive spec.** 6 paths × 3 questions funnel, `librarium.png` background, `WordField` + `LetterField` ambient text scatter. Full state machine in inline JSX. |
| `books.html` | 16.3 KB | **Catalogue spec.** Hero with vista bg + AuspexSweep + "BÜCHER" title; sidebar with MiniAuspex + ERA filter + AUDIT pills + FACTION list + search; main column with grouped era list of c-glass book rows. |
| `cartographer.html` + `cartographer.jsx` | 22 + 21 KB | **Cartographer spec.** Out of scope per [user answer on cartographer scope] — `/map` stays a stub. Listed here for reference only. |
| `design-canvas.jsx` | 49 KB | A Figma-like wrapper for the design-canvas UI. **Not a readme** — just the host shell. Ignore. |
| `variant-*.jsx` (9 files) | ~20 KB each | Design exploration variants. Superseded by the realised page exports above. Useful for reference if a stub feels wrong, but don't port verbatim. |
| `Chrono Lexicanum.html` | 4.5 MB | An inlined export with assets base64'd. Too big to load; the unpacked `chrono.jsx` + page HTMLs are equivalent and cleaner. |
| `assets/vista.png` | 2.0 MB | **Hub + Books hero background** — cathedral light vista, key visual. |
| `assets/librarium.png` | 2.2 MB | **Ask background** — librarium interior with golden lamps. |
| `assets/cartog-hall.png` | 2.6 MB | Cartographer background (out of scope this session — store anyway for future). |
| `assets/logo_cl_v2.svg` | 12 KB | Wordmark — used in TopNav. |
| `assets/logo_cl.svg` | 21 KB | Earlier logo variant — `_v2` is the chosen one. |
| `archive/`, `screenshots/`, `uploads/` | — | Reference material from Philipp's iteration with Claude Design. No need to load. |
| `.design-canvas.state.json` | tiny | Section titles for the design canvas. Ignore. |

**No `README.md` file.** The brief calls the visual system "the readme" — that's the consolidated set of `index.html` + `chrono.jsx` + `v2-shared.jsx` + the page HTMLs.

## User decisions captured this session

1. **Scope split** — go with `Shell + Hub + Books + Detail + stubs first` (recommended option). Timeline bespoke + the full Ask 6-path funnel are explicitly deferred to a follow-up session on the same `codex/product-*` branch.
2. **Cartographer scope** — `/map` stays a Phase-2 stub with theme only. The handoff's full Cartographer page is filed away for a future dedicated `/map`-build brief.

## Repository state at planning time

- **Worktree**: `C:\Users\Phil\chrono-lexicanum-product` — confirmed `chrono-lexicanum-product` (the Product/UI strand worktree the brief requires).
- **Current branch**: `worktree/product-bootstrap` — clean working tree apart from the brief file `sessions/2026-05-23-096-arch-design-direction.md` (already committed to main in the parent worktree, will be picked up via fresh branch from origin).
- **Next step for the implementer**: `git fetch origin` then `git checkout -b codex/product-2026-05-23-design-direction origin/main`. **No push, no PR** per brief Constraints "Stay local — iterate, don't PR".

## What the existing app looks like today (relevant to this brief)

- **Next.js 16.2.4 + React 19.2.5 + Tailwind v4.2.4** — no `tailwind.config.ts`, tokens live in `globals.css` `@theme {}`. `@tailwindcss/postcss` is the PostCSS adapter.
- **`src/app/layout.tsx`** — server component, `<html data-palette="cold" data-theme="dark">`, Google Fonts `<link>` for 5 families (Cinzel, Cormorant Garamond, Newsreader, Space Grotesk, JetBrains Mono), renders `<Starfield />` + `<TopChrome />` + `{children}`. Metadata block has `robots: { index: false, follow: false }` — must stay.
- **`src/components/chrome/Starfield.tsx`** — canvas-based 4-layer parallax stars, prefers-reduced-motion honoured. To be retired (replaced by `<SiteBackground />` + photo).
- **`src/components/chrome/TopChrome.tsx`** — current top bar: mark-sigil + "Chrono · Lexicanum" wordmark + thin nav with just "Bücher" + Suspense-wrapped `EraToggle`. Needs full replacement.
- **`src/components/Aquila.tsx`** — uses a CSS mask on `/aquila.png` filled with `currentColor`. The new design's TopNav uses `logo_cl_v2.svg` instead, but Aquila stays available; just unused in the new Hub title.
- **`src/app/globals.css`** — 3471 lines:
  - Lines 1-149: `@theme` block + `:root` aliases. Defines `--color-void-*`, `--color-aquila-*`, `--color-frost-*`, `--color-heresy-*`, surfaces, ink, lines, highlights, fonts, base animations. These are referenced by every existing page's per-component CSS.
  - Lines 189-538: Hub doorway grid + mode-tile + multi-segment footer
  - Lines 582-1018: Timeline overview ribbon, era bands, era labels, era detail panel
  - Lines 1018-1764: Timeline filter, pan scrubber, series bar, book markers, tooltip
  - Lines 1764-1967: Detail-page section blocks
  - Lines 1967-2684: Detail view internals
  - Lines 2684-2894: Catalogue layout
  - Lines 2894-3213: Catalogue collapsible rows + expanded body
  - Lines 3213-3471: Trailing utilities + per-route fragments
- **Public-facing routes**:
  - `/` Hub — server component, fetches live book count, uses `.hub-*` classes
  - `/timeline` — server component, complex existing functionality with `?era=`/`?book=`/`?faction=`/`?length=` URL contract, redirects from legacy era ids, uses `Overview`/`EraDetail`/`DetailPanel` client components. **Deferred to Phase G / next session.**
  - `/buecher` — server component, audit/sort URL contract, `<AuditPills>` + `<SortPills>` islands, complex DB-driven catalogue. **Re-skin this session.**
  - `/ask` — **Phase-2 placeholder stub** (literally a heading + paragraph). Becomes a static preview of the funnel design this session; full funnel deferred to Phase H.
  - `/map` — **Phase-2 placeholder stub**. Stays a stub with new shell only.
  - `/buch/[slug]` — real public detail page, uses Tailwind utilities. **Re-skin this session.**
  - `/fraktion/[slug]`, `/welt/[slug]`, `/charakter/[slug]` — all Phase-3 stubs. Shell-only treatment this session.
- **Internal/maintainer-only routes**:
  - `/ingest`, `/ingest/[runId]` — read-only diff inspector
  - `/buch/[slug]/audit` — audit cockpit
  - `/lab/cartographer` — isolated iframe sandbox, **out of scope entirely**, do not touch
- **The EraToggle in TopChrome** — `src/components/chrome/EraToggle.tsx`, a client Suspense island reading `?era=` from URL. The new TopNav shows hard-coded M30/M31/M42 pills in the design; preserve the EraToggle's URL behaviour by wrapping the new pill style around the existing component.

## Design system — consolidated, to be ported

### Palette (canonical: `chrono.jsx` `CHRONO` constant)

Add as new `--cl-*` tokens in `@theme {}` alongside the existing legacy set. Drop legacy `--color-void/aquila/frost/heresy` only when every route has stopped referencing them (likely a future session).

```css
--cl-void:     #02030a;   /* page bg under photos */
--cl-void-2:   #06080f;
--cl-plate:    rgba(8,12,20,0.78);
--cl-plate-2:  rgba(4,8,14,0.86);
--cl-bone:     #e8dcc0;   /* primary ink */
--cl-dim:      rgba(232,220,192,0.62);
--cl-faint:    rgba(232,220,192,0.28);
--cl-ghost:    rgba(232,220,192,0.14);
--cl-cyan:     #9ce6ff;   /* primary accent — cyan HUD halo */
--cl-cyan-dim: rgba(156,230,255,0.45);
--cl-cyan-fnt: rgba(156,230,255,0.18);
--cl-gold:     #c9a65a;   /* secondary accent — Mechanicum, era pills */
--cl-gold-dim: #8a6f2c;
--cl-blood:    #a51c1c;   /* chaos / danger */
```

### Fonts (three families, replaces current five)

```ts
// src/app/layout.tsx
import { Cinzel, Cormorant_Garamond, IBM_Plex_Mono } from "next/font/google";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cinzel",
  display: "swap",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-mono",
  display: "swap",
});
```

Then in `globals.css` `@theme {}`:
```css
--font-cinzel: var(--font-cinzel);
--font-cormorant: var(--font-cormorant);
--font-mono: var(--font-mono);
```

Drop the Google Fonts `<link>` from `<head>` and the existing `--font-grotesk` / `--font-reader` declarations.

### Typography use

From `chrono.jsx`'s `TYPE` constant:
- **`display`** = Cinzel 400 + `letter-spacing: 0.32em` → "CHRONO ◆ LEXICANUM" wordmark, page titles
- **`display2`** = Cinzel 500 + `letter-spacing: 0.14em` → secondary titles, card titles
- **`serif`** = Cormorant Garamond → body copy, italic subtitles
- **`mono`** = IBM Plex Mono 11px + `letter-spacing: 0.22em` + `uppercase` → eyebrows, kickers, tags
- **`monoSm`** = IBM Plex Mono 10px + same → tiny labels, hints

### Voice / copy primitives (verbatim from handoff)

- `// ARCHIVE-CONSOLE · COGITATOR ACTIVUS`
- `// ORACVLVM · COGITATOR-1011`
- `// CATALOGVS · LIBRORVM`
- `// LECTIO PROFVNDA · BUCH`
- `DATASTREAM STABLE`
- `STAMP M42.347`
- `350 NOVELS · 7 ERAS · 5 SEGMENTA`
- Latin section labels: `ORACVLVM`, `BIBLIOTHECA`, `CARTOGRAPHIA`, `PRIMVS GRADVS`, `VIA ASTARTES`, `VIA HAERETICVS`, `VIA XENOS`, `VIA HERESIS`, `VIA INQVISITIO`
- Floating coord strings: `R 1.075 · A −38.6°`, `SECTOR · MALEDICTUM`, `HIT · NOVA TERRA · M42.347`, `ROUTE · SEGMENTVM ULTIMA`
- GhostReadout lines (Hub, cyan): `· AUSPEX HANDSHAKE OK`, `· CHRONO-INDEX MOUNTED`, `· 350 NOVELLAE LOADED`, `· SCAN · SEGMENTUM ULTIMA`, `· SCAN · SEGMENTUM OBSCURUS`, `· COGNITIO LINK STABLE`, `· STAMP M42.347 · SEALED`, `· WARP TIDES · CALM · SHIFT +0.04`, `· VOLT · 4.72 kV NOMINAL`, `· INDEX · 7 ERAS · 5 SEGMENTA`, `· OVERLAY · CICATRIX MALEDICTUM`, `· OVERLAY · HIVE FLEET LEVIATHAN`, `· COGITATOR-1011 · ONLINE`, `· LECTIO PROFVNDA · READY`

The German question copy on Ask stays German. Existing site copy elsewhere stays as-is unless the design explicitly changes it.

### Motion

All keyframes live at the top of `globals.css`. All wrapped in `@media (prefers-reduced-motion: no-preference)` so reduce-motion users see everything statically (elements stay visible, only motion freezes).

Keyframes from `chrono.jsx`:
```css
@keyframes chronoSweep   { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
@keyframes chronoSpin    { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
@keyframes chronoSpinRev { from { transform: rotate(360deg) } to { transform: rotate(0deg) } }
@keyframes chronoPulse   { 0%, 100% { opacity: .55 } 50% { opacity: 1 } }
@keyframes chronoBlink   { 0%, 100% { opacity: .3 } 50% { opacity: 1 } }
@keyframes chronoTwinkle { 0%, 100% { opacity: .4 } 50% { opacity: 1 } }
@keyframes chronoFade    { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
@keyframes chronoCursor  { 0%, 45% { opacity: 1 } 50%, 95% { opacity: 0 } 100% { opacity: 1 } }
@keyframes chronoScanV   { 0% { transform: translateY(-100%); opacity: 0 } 5% { opacity: .7 } 95% { opacity: .7 } 100% { transform: translateY(100vh); opacity: 0 } }
@keyframes chronoScanH   { 0% { transform: translateX(-100%); opacity: 0 } 5% { opacity: .6 } 95% { opacity: .6 } 100% { transform: translateX(100%); opacity: 0 } }
@keyframes chronoRiseFade { 0% { opacity: 0; transform: translateY(6px) } 30% { opacity: 1; transform: translateY(0) } 70% { opacity: 1 } 100% { opacity: 0; transform: translateY(-4px) } }
@keyframes chronoLetter   { 0% { opacity: 0; transform: scale(0.7) } 25% { opacity: 1; transform: scale(1) } 75% { opacity: 1 } 100% { opacity: 0; transform: scale(1.2) } }
```

Reduced-motion fallback:
```css
@media (prefers-reduced-motion: reduce) {
  .c-pulse, .c-blink, .c-twinkle, .c-fade-in,
  [class*="chrono"], [style*="chronoSweep"], [style*="chronoSpin"] { animation: none !important; }
  /* Elements stay visible — only motion stops. */
}
```

JSX-side: implement a `useReducedMotion()` hook in `src/lib/useReducedMotion.ts` that returns `boolean` (matchMedia → setState, SSR-safe with `useEffect`). Components that schedule timers (GhostReadout, Typewriter, LiveTelemetry, ProcessingDots) check this and either skip the timer loop entirely or render the final state directly.

### Composition primitives (CSS, added under `/* === Chrono primitives === */`)

```css
.c-glass {
  background: linear-gradient(180deg, rgba(8,12,20,0.72) 0%, rgba(4,8,14,0.82) 100%);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(156,230,255,0.18);
  box-shadow: 0 12px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04);
  transition: border-color .3s, transform .3s;
}
.c-glass:hover {
  border-color: rgba(156,230,255,0.50);
  transform: translateY(-2px);
}

.c-corners { position: relative; }
.c-corners::before,
.c-corners::after {
  content: "";
  position: absolute;
  width: 14px;
  height: 14px;
  border-color: var(--cl-cyan);
  border-style: solid;
}
.c-corners::before { top: -1px; left: -1px; border-width: 1px 0 0 1px; }
.c-corners::after  { bottom: -1px; right: -1px; border-width: 0 1px 1px 0; }

.c-hairline { background: linear-gradient(90deg, transparent, rgba(156,230,255,0.53), transparent); height: 1px; }
.c-vhair    { background: linear-gradient(180deg, transparent, rgba(156,230,255,0.40), transparent); width: 1px; }

.c-shadow-text    { text-shadow: 0 0 32px rgba(156,230,255,0.18), 0 4px 14px rgba(0,0,0,0.95); }
.c-shadow-text-sm { text-shadow: 0 2px 8px rgba(0,0,0,0.95); }

.c-link-cyan { color: var(--cl-cyan); cursor: pointer; transition: opacity .2s; }
.c-link-cyan:hover { opacity: 0.7; }

@media (prefers-reduced-motion: no-preference) {
  .c-pulse   { animation: chronoPulse 3s ease-in-out infinite; }
  .c-blink   { animation: chronoBlink 2.4s ease-in-out infinite; }
  .c-twinkle { animation: chronoTwinkle 3s ease-in-out infinite; }
  .c-fade-in { animation: chronoFade .5s ease-out both; }
  .c-cursor  { animation: chronoCursor 1s steps(1) infinite; }
}
```

### Background asset plan

Three full-bleed photos under `public/img/`, all converted from the handoff PNGs to WebP at ~85% quality, target ≤350 KB each. Implementation options:

1. **Manual conversion (recommended)**: open each PNG in any image tool (Squoosh, `cwebp`, IrfanView), save as `.webp` at 85% quality. Commit the WebP, ignore the PNG. Quick and obvious.
2. **`sharp` script**: write `scripts/convert-bg-images.ts` that reads the three PNGs and writes WebPs. Run once locally. Reproducible but more code.

Either is fine — Philipp's call. Default to manual unless he prefers the script.

Targets:
- `public/img/vista.webp` ← `assets/vista.png` (2.0 MB → ~250 KB target)
- `public/img/librarium.webp` ← `assets/librarium.png` (2.2 MB → ~250 KB target)
- `public/img/cartog-hall.webp` ← `assets/cartog-hall.png` (out of scope for rendering, but commit the WebP so a future /map session has it ready)
- `public/img/logo_cl_v2.svg` ← `assets/logo_cl_v2.svg` (copy verbatim, no conversion)

These photos are loaded as CSS `background-image` (not `<img>`), so `next/image` optimization doesn't apply — pre-optimization is the only path.

## Phasing — six runnable commits, with optional Phase G/H follow-ons

Branch: fresh `codex/product-2026-05-23-design-direction` from `origin/main`. **No push, no PR** — local commits only. Leave the branch in a runnable state at each commit so Philipp can review via `npm run dev` between/after chunks.

### Phase A — Global shell (one commit, runnable site afterward)

Goal: every existing route stops looking broken when paired with the new direction. Nothing route-specific yet.

Tasks:
- Confirm worktree (`git rev-parse --show-toplevel` ends in `chrono-lexicanum-product`).
- Branch: `git checkout -b codex/product-2026-05-23-design-direction origin/main`.
- Wire `next/font` (Cinzel + Cormorant Garamond + IBM Plex Mono) in `src/app/layout.tsx`. Drop the Google Fonts `<link>`. Expose `--font-cinzel`, `--font-cormorant`, `--font-mono` via the className concat on `<html>`.
- Restructure `src/app/globals.css`:
  - Add new `--cl-*` palette tokens to `@theme {}`. Keep legacy `--color-void/aquila/frost/heresy` tokens (still consumed by routes not yet redesigned).
  - Add `@keyframes` for the `chrono*` set.
  - Add new `/* === Chrono primitives === */` section at the bottom with `.c-glass`, `.c-corners`, `.c-hairline`, `.c-vhair`, `.c-pulse`, `.c-blink`, `.c-twinkle`, `.c-fade-in`, `.c-shadow-text`, `.c-link-cyan`. Wrap motion utilities in `@media (prefers-reduced-motion: no-preference)`.
- New chrome components under `src/components/chrome/`:
  - `TopNav.tsx` — server component with logo (`/img/logo_cl_v2.svg`) + wordmark + 5 nav links (Home / Bücher / Ask / Chronicle / Cartographer) + `DATASTREAM STABLE` cyan-pulse indicator + EraToggle pills (re-skinned to design's pill style, but the existing `<EraToggle>` client island stays — wrap it in the new visual). Active-link detection: use `usePathname()` in a thin client wrapper, or read headers server-side, or pass `pathname` as a prop from layout — pick the simplest under Next 16.
  - `SiteBackground.tsx` — server component painting the per-route bg photo + vignette + grain overlay. Variant chosen via prop from each page (`variant="vista" | "librarium" | "none"`) OR via `body[data-bg="…"]` switch — pick whichever is cleaner; the data-attribute approach is simpler for static CSS background-image rules.
- Replace `<Starfield />` and `<TopChrome />` with `<SiteBackground />` and `<TopNav />` in `src/app/layout.tsx`. Keep the Starfield file around briefly (move to `_legacy/` or just leave unimported) — delete after Phase F if nothing else references it.
- New chrono visual primitives under `src/components/chrono/`:
  - `MainAuspex.tsx` — big rotating HUD disc (concentric rings, tick ring, counter-rotating mid ring, cardinal axes, bearing labels, sector wedges, central node, blips, sweep arm). Pure SVG. Client component for animation. Props: `size`, `accent`, `spinDur`, `spinRevDur`, `sweepDur`, `opacity`.
  - `AuspexSweep.tsx` — small sweep + rings overlay (sits over the photo's painted rings). Pure SVG. Props: `cx`, `cy`, `r`, `accent`, `sweepDuration`, `blips`.
  - `CornerAuspex.tsx` — defined HUD disc with corner brackets, for sidebar / inspector slots.
  - `GhostReadout.tsx` — looping ticker with character-by-character `GhostTypeOnce` rows and `GhostRow` phase transitions (enter / in / exit with translateY/maxHeight/opacity). Port `chrono.jsx` lines 638-709 carefully — the phase transition logic is non-trivial. Props: `lines[]`, `lineMs`, `typeSpeed`, `color`, `opacity`, `align`, `max`.
  - `Typewriter.tsx` — character-by-character text reveal with blinking cursor.
  - `LiveTelemetry.tsx` — drifting numeric readout (interval timer, bounce-on-extremes).
  - `ProcessingDots.tsx` — looping `...` indicator.
  - `FloatingCoord.tsx` — opacity-pulsing coordinate label with `chronoRiseFade` animation.
  - `ScanLine.tsx` — vertical or horizontal scan-line sweep.
  - `LetterField.tsx`, `WordField.tsx` — ambient Latin / binary glyph scatter (used on Ask).
  - `BottomConsole.tsx` — telemetry strip + 3 doorway cards. Can be added in Phase A or deferred to Phase B with Hub.
  - All animation timings respect `prefers-reduced-motion` via `useReducedMotion()` hook.
- New asset files:
  - `public/img/vista.webp` (converted from handoff)
  - `public/img/librarium.webp`
  - `public/img/cartog-hall.webp`
  - `public/img/logo_cl_v2.svg` (copied verbatim)
- Hook: `src/lib/useReducedMotion.ts` — matchMedia → setState, SSR-safe.
- Verify: `npm run lint`, `npm run typecheck`, `npm run build` green. `npm run dev` → every route renders with new TopNav + dark void bg, even legacy per-component CSS still uses old tokens (looks transitional, that's expected).

Commit: `Shell: ports new void/cyan direction (fonts, tokens, chrome, primitives)`

### Phase B — Hub `/` (one commit)

Rebuild to match `index.html`:
- Keep server-component shape, `getBookCount()`, `revalidate = 3600`, graceful 0 fallback.
- New layout (refer to `index.html` lines 47-127):
  - `<SiteBackground variant="vista">`
  - Two `<MainAuspex>` decorations: bottom-right at ~84% / 78% screen position with size `min(78vh, 42vw, 620px)` opacity 0.30 spinDur=240s spinRevDur=320s sweepDur=28s; bottom-left at ~12% / 82% with scale 0.55 opacity 0.12 spinDur=360s spinRevDur=440s sweepDur=36s.
  - Centred title block at ~34% from top:
    - Eyebrow `// ARCHIVE-CONSOLE · COGITATOR ACTIVUS` (Plex Mono cyan)
    - `CHRONO ◆ LEXICANUM` (Cinzel display, `clamp(40px, 4.6vw, 68px)`, bone, with cyan `◆` separator at 0.62em vertical-aligned middle, with text-shadow halo)
    - Italic Cormorant subtitle `The 41st Millennium novel archive — by era, faction, world, and mood.`
    - Gold mono line: `<strong>{novelCount}</strong> NOVELS · 7 ERAS · 5 SEGMENTA` (use the live count from `getBookCount()`)
  - Four `<FloatingCoord>` pings (mirror `index.html` lines 90-97 strings)
  - `<GhostReadout>` on right edge (position `right: 32px, top: 70px, width: 260px`), cyan color, opacity 0.32, lineMs 5200, typeSpeed 85, max 4, lines from `index.html` lines 107-122
  - `<BottomConsole>` at bottom: telemetry strip (`COGITATOR-1011` cyan pulse + `VOLT` LiveTelemetry + `DRIFT` LiveTelemetry gold + `350 NOVELS · 7 ERAS · 5 SEGMENTA` dim + `STAMP M42.347` gold) + 3 doorway cards:
    - `ORACVLVM` / `Ask the Archive` / `Five questions. The cogitator tunes novels to your signal.` → `/ask`
    - `BIBLIOTHECA` / `Bücher` / `Browse the full 350-novel catalogue, sorted, filtered, audited.` → `/buecher`
    - `CARTOGRAPHIA` / `Cartographer` / `Every novel pinned to the world it haunts. Sweep five Segmenta.` → `/map`
  - **Chronicle is NOT a doorway card** — the design demotes it to a TopNav link.
- Delete `.hub-*` / `.mode-tile` CSS from `globals.css`.
- The `<Aquila>` component stays in `src/components/Aquila.tsx` but isn't rendered on Hub — the wordmark and `◆` carry the brand.
- Responsiveness: design assumes 1440×900. At <900px width, auspex anchoring needs to gracefully scale (CSS `@media (max-width: 900px) { transform: scale(0.7); }` or similar). Don't copy the hard-coded pixel math verbatim — make it responsive.
- Verify: live novel count renders; auspex spin smoothly; GhostReadout cycles with enter/in/exit transitions; BottomConsole cards link; reduced-motion freezes everything; mobile width collapses gracefully.

Commit: `Hub: rebuilds / from index.html (vista bg, dual auspex, BottomConsole)`

### Phase C — `/buecher` re-skin (one commit)

Re-skin only. All DB queries, audit/sort logic, URL contract unchanged.

- Edit `src/app/buecher/page.tsx` — server component stays, only markup changes.
- New shape (refer to `books.html`):
  - Hero header (520px tall): `<SiteBackground variant="vista">` family + linear-gradient fade-to-void at bottom + `<AuspexSweep cx={vw/2} cy={170} r={180}>` over the photo's rings + title eyebrow `// CATALOGVS · LIBRORVM` + `BÜCHER` in Cinzel display `clamp(48px, 5vw, 72px)` + Cormorant italic sub `${enrichedCount} von ${books.length} mit Detailinhalt · Stempel M42.347`
  - Two `<FloatingCoord>` pings around the sweep
  - Sidebar (~300px wide):
    - `<CornerAuspex size={240}>` at top
    - ERA filter list (re-use existing `<EraToggle>` URL contract or scope display-only and rely on the TopNav pills — pick the cleaner one)
    - AUDIT pills (re-skinned `<AuditPills>` component — keep its URL behaviour intact)
    - FACTION list with coloured dots — per-faction colours from `FACTION_DOT` in `books.html` line 26-32 (but make it data-driven from `factions.json` if cleaner; otherwise hard-code the design's defaults)
    - Search input (decorative for now — search isn't yet implemented)
  - Main column:
    - Top strip: `${filtered.length} · INDEXED / ${total} verfügbar` + `<LiveTelemetry>` ×2 (`LOAD` + `COGITATIO`)
    - Sort pills (re-skinned `<SortPills>` with `overriddenByDrift` prop from brief 075 intact)
    - Optional `driftSortActive` caption (from brief 075)
    - Grouped list by era with `c-glass` rows
    - Per-row: index number + faction dot + title (Cinzel display2 17px) + Cormorant italic byline + faction name (Plex Mono dim) + year (cyan) + audit tag chips + `DETAILREICH ›` link (Plex Mono cyan with cyan-dim border)
  - The existing `<details>/<summary>` expand-on-click stays (brief: "all existing functionality intact"), but the expanded panel is re-skinned to match design vocabulary (Cormorant for synopsis, Cinzel display2 for section headers, c-glass for the expanded panel).
- Delete legacy `.catalogue-*` and `.row-*` CSS from `globals.css`.
- The faction colour map: extract `FACTION_DOT` from `books.html` line 26-32 and either inline it in the catalogue route or move to `src/lib/faction-colors.ts`. Six factions are coloured; everything else falls back to `var(--cl-dim)`.
- Verify: `/buecher`, `/buecher?audit=drift`, `/buecher?sort=title`, `/buecher?audit=drift,gap`, click a row to expand, confirm URL contract round-trips.

Commit: `Books: re-skins /buecher (vista hero, sidebar, c-glass rows; audit/sort URL contract intact)`

### Phase D — `/buch/[slug]` bespoke (one commit)

The one real public detail page. The other detail types (`/fraktion`, `/welt`, `/charakter`) are stubs and get shell-only in Phase E.

- Edit `src/app/buch/[slug]/page.tsx` — server component, all DB queries unchanged.
- New shape:
  - `<SiteBackground variant="vista">` for cohesion with /buecher (or pick a darker tint via a CSS variant — your call)
  - Two-column layout (`grid-cols-[220px_minmax(0,1fr)]`):
    - Left: cover (220px) inside a `c-glass c-corners` panel with subtle cyan halo box-shadow
    - Right: title block
      - Eyebrow `// LECTIO PROFVNDA · BUCH` (Plex Mono cyan)
      - Book title in Cinzel display 4xl (`clamp(40px, 4vw, 56px)`)
      - Italic Cormorant byline `von {authors.join(", ")}`
      - Meta strip (Plex Mono uppercase): `year · format · era · series #index`
      - "Auch enthalten in:" comma-line (slim format from brief 075, kept intact)
      - Synopsis in Cormorant body italic, `text-lg leading-relaxed`
      - Factions / Locations / Characters / Facets sections — each labelled with Plex Mono `//` kicker + cyan `c-hairline`; chip rows use `border: 1px solid var(--cl-cyan-dim); color: var(--cl-cyan)` per design role-tag style
      - Footer: `// audit` link to `/buch/[slug]/audit` (keep intact)
- Delete legacy detail-page CSS sections from `globals.css` where they refer to `.book-detail-*` or similar — careful here, `/buch/[slug]/audit` has its own audit cockpit CSS that must stay.
- Verify: load 5 representative slugs (`eisenhorn-xenos`, `helsreach`, `the-anarch`, `the-green-tide`, a series book). Check cover, missing-cover placeholder, series prev/next, audit link.

Commit: `Detail: rebuilds /buch/[slug] in new visual language (cover panel, c-glass meta, cyan-chip junctions)`

### Phase E — Stub-route shell coverage (one commit covers all)

For each of `/fraktion/[slug]`, `/welt/[slug]`, `/charakter/[slug]`, `/ask`, `/map`:
- Apply new shell (SiteBackground already from layout)
- Replace `Phase 2`/`Phase 3` placeholder kicker with `// PHASE-N · IN VORBEREITUNG` (Plex Mono cyan)
- Title in Cinzel display + Cormorant italic stub copy
- Optional: small `<CornerAuspex>` decorative anchor

For `/ask` specifically: render the design's 6-path selection grid as **disabled cards** (`pointer-events: none; opacity: 0.5`) showing all 6 paths with their Latin labels. This gives Philipp a visual preview without committing the funnel state machine. Real funnel deferred to Phase H. Static preview reuses the path definitions verbatim from `ask.html` lines 30-249.

Commit: `Stubs: shells /fraktion, /welt, /charakter, /ask, /map with new direction (full funnels deferred)`

### Phase F — Verify internal tools survive (one commit if anything broke; otherwise no commit)

For `/ingest`, `/ingest/[runId]`, `/buch/[slug]/audit`, `/lab/cartographer`:
- Load each route in `npm run dev`. They inherit new TopNav + tokens + fonts automatically.
- Spot-check legibility: audit cockpit's drift/gap/ssot pills, ingest diff viewer's red/green diff colours, lab cartographer's iframe.
- If any text-on-bg contrast drops below WCAG-AA, apply *minimal scoped fix* to the route's own CSS — not a redesign. Note in report.

Commit (only if fixes applied): `Audit cockpit: minimal contrast fix under new tokens` or similar

**This is the planned stopping point.** Phase G and H below are optional and only if substantial headroom remains.

### Phase G [optional] — Timeline bespoke

If headroom after Phase F:
- Re-skin Overview ribbon, EraDetail era band, FilterRail, DetailPanel inside new vocabulary
- Preserve all `?era=`, `?book=`, `?faction=`, `?length=` URL semantics and brief 008 redirect logic
- Preserve EraDetail `key={era.id}` remount behaviour from brief 025
- Re-skin BookDot, tooltip, era ticks, empty/filter-empty states — all in cyan/bone/Plex Mono instead of amber/frost
- Stop and commit even if half-done; carry-over notes in the report

### Phase H [optional, only after G] — Ask 6-path funnel

Replace Phase E "static preview" with real funnel:
- Client component: `src/components/ask/PathSelect.tsx`, `QuestionCard.tsx`, `ResultCard.tsx`, `useAskFlow.ts`
- 6 paths × 3 questions each, scored against a recommendation function (the brief marks this as deferred to a Phase-2 ROADMAP item — for this brief, render with sample data from the design's `CHRONO_BOOKS`-equivalent OR with a real DB query against `works` filtered by the answers; pick the cleaner)
- Path copy verbatim from `ask.html` lines 30-249

### Phase I — Final polish

- `npm run lint`
- `npm run typecheck`
- `npm run build` — confirm production build green
- `npm run dev` → walk every route once more, including hover states, focus states, reduced-motion (DevTools rendering panel)
- Drop legacy `--color-void/aquila/frost` tokens from `@theme {}` ONLY if every route now references `--cl-*` set; otherwise leave for next session

## Critical files

**Modified**:
- `src/app/layout.tsx` — fonts via `next/font`, replace `<Starfield />` + `<TopChrome />` with `<SiteBackground />` + `<TopNav />`, `metadata` block intact
- `src/app/globals.css` — new `@theme` tokens, new keyframes, new primitive utility classes, legacy per-component sections progressively deleted as routes are re-skinned
- `src/app/page.tsx` (Hub) — Phase B
- `src/app/buecher/page.tsx`, `src/app/buecher/AuditPills.tsx`, `src/app/buecher/SortPills.tsx` — Phase C
- `src/app/buch/[slug]/page.tsx` — Phase D
- `src/app/fraktion/[slug]/page.tsx`, `src/app/welt/[slug]/page.tsx`, `src/app/charakter/[slug]/page.tsx`, `src/app/ask/page.tsx`, `src/app/map/page.tsx` — Phase E (stub shell only)
- `src/components/chrome/TopChrome.tsx` → renamed/replaced by new `TopNav.tsx`

**New files** (Phase A unless noted):
- `src/components/chrome/TopNav.tsx`
- `src/components/chrome/SiteBackground.tsx`
- `src/components/chrono/MainAuspex.tsx`
- `src/components/chrono/AuspexSweep.tsx`
- `src/components/chrono/CornerAuspex.tsx`
- `src/components/chrono/GhostReadout.tsx`
- `src/components/chrono/Typewriter.tsx`
- `src/components/chrono/LiveTelemetry.tsx`
- `src/components/chrono/ProcessingDots.tsx`
- `src/components/chrono/FloatingCoord.tsx`
- `src/components/chrono/ScanLine.tsx`
- `src/components/chrono/LetterField.tsx`
- `src/components/chrono/WordField.tsx`
- `src/components/chrono/BottomConsole.tsx` (could be Phase B)
- `src/lib/useReducedMotion.ts`
- `src/lib/faction-colors.ts` (Phase C, if extracted)
- `public/img/vista.webp`, `public/img/librarium.webp`, `public/img/cartog-hall.webp`, `public/img/logo_cl_v2.svg`

**Deprecated / Removed**:
- `src/components/chrome/Starfield.tsx` — stop importing in Phase A; delete after Phase F if nothing else references it
- Legacy per-component CSS blocks under `globals.css` (`.hub-*`, `.mode-tile`, `.starfield-canvas`, `.catalogue-*`, `.row-*`, detail-page sections) — deleted as their owning route gets re-skinned, not bulk-deleted upfront

**Untouched** (brief Constraints — strand discipline + out of scope):
- `src/db/**`, `scripts/**`, `brain/**`, `sessions/README.md` — strand worktree discipline
- `src/app/lab/cartographer/page.tsx` — isolated prototype, out of scope entirely
- `src/components/timeline/Overview.tsx`, `EraDetail.tsx`, `DetailPanel.tsx` — deferred to Phase G
- `src/lib/timeline.ts`, `src/lib/timelineUrl.ts`, `src/lib/book-labels.ts` — pure logic, no aesthetic surface

## Dependency choices (no version-pin specified — implementer researches latest stable)

- **`next/font/google`** — already part of Next 16, no new package. Self-hosts Cinzel / Cormorant Garamond / IBM Plex Mono with `display: swap` and `subsets: ["latin"]`.
- **`sharp`** — already a Next 16 transitive dep. Use offline if going the script route for image conversion; otherwise skip (manual conversion).
- **No motion library.** All animations are CSS keyframes on inline styles or class utilities. No Framer Motion / GSAP.
- **No SVG-as-component library.** Auspex SVGs render as inline JSX in client components; logo is a static SVG asset.
- **No new state library.** Phase H (deferred) uses React's `useState` / `useReducer`.

## Verification

End-to-end:

1. **Build green** — `npm run lint`, `npm run typecheck`, `npm run build` all pass
2. **Local dev** — `npm run dev`, walk:
   - `/` — live novel count renders, auspex spins, GhostReadout cycles, BottomConsole cards link
   - `/buecher` — sort and audit URL contract round-trips; `?audit=drift` enables drift-frequency sort caption; book rows expand
   - `/buch/eisenhorn-xenos` — cover, byline, factions/locations/characters chips
   - `/buch/[slug]/audit` — still renders, contrast acceptable
   - `/fraktion/<slug>`, `/welt/<slug>`, `/charakter/<slug>` — stub shells render with new direction (use seeded slugs from DB; if unknown, fall back to `/fraktion/thousand-sons`, `/welt/cadia`)
   - `/timeline` — unchanged structurally; new TopNav + tokens visible
   - `/map`, `/ask` — stub shells with new direction (Ask shows static path-grid preview)
   - `/ingest` — still works
3. **Reduced motion** — DevTools Rendering → Emulate "prefers-reduced-motion: reduce". Confirm all `chrono*` animations freeze, no JIT layout shifts.
4. **Keyboard** — tab through every route, every link/button has visible focus ring (cyan halo via global `:focus-visible` style — add to globals.css under chrono primitives)
5. **Mobile** — DevTools 375×667. Hub auspex anchoring scales down sensibly. Books hero shrinks to ≤320px. Detail page columns collapse to single column.
6. **Asset weight** — `du -b public/img/*.webp` confirms each ≤350 KB. `npm run build` reports bundle-size delta vs. main.
7. **Run report** — write `sessions/2026-05-23-096-impl-design-direction.md` with frontmatter `status: implemented`, addressing every open question from the brief (palette, type, motion, background extrapolation; globals.css strategy; font loading choice; map/ingest/audit survival; scope-split honest read).

## Stop conditions

- **After Phase F** (shell + Hub + Books + Detail + stubs verified): runnable site with new direction across every route. Timeline + Ask bespoke deferred. This is the planned stopping point. Report frontmatter `status: implemented`; "For next session" notes flag Timeline + Ask follow-up.
- **Hard blocker** (e.g. `next/font` incompatibility, WebP conversion fails, build broken unfixably within ~30 min): commit progress, write `sessions/*-impl-*-blocked.md` with `status: needs-decision`, stop. Do NOT push.

## Open-question answers prepared for the eventual real impl report

- **Visual system specified by handoff**: palette = void/cyan/gold/bone; type = Cinzel + Cormorant + IBM Plex Mono; motion = slow auspex rotation + sweep arm + opacity flicker; background = full-bleed photo + vignette + grain.
- **Extrapolated to silent routes**: Detail pages inherit Books visual family (vista bg, c-glass meta panel, cyan-chip junctions); /timeline (deferred) would extend the same shell with Plex Mono era bearings on the ribbon and Cormorant italic synopsis in DetailPanel; /fraktion/[slug] etc. follow detail-page pattern with faction-glyph instead of cover.
- **globals.css strategy**: layered/incremental — new `--cl-*` tokens + chrono primitives section added; legacy per-component CSS deleted as its owning route is re-skinned. Legacy `--color-void/aquila/frost` set kept until no route references them, then dropped (likely a future session).
- **Font loading**: moved to `next/font/google`; three families × ~10 cuts, self-hosted with `display: swap`.
- **/map survival**: it was a stub, stays a stub with new shell. No scoped fix needed.
- **/ingest, /buch/[slug]/audit survival**: spot-checked during Phase F. Minimal contrast fix if anything dropped below WCAG-AA, noted in report.
- **Scope split**: honest read — Phase F is the natural stopping point. Timeline + full Ask flow warrant a follow-up session on the same branch.

## Hand-off notes for the fresh CC session

1. **Read this file first, then the brief** (`sessions/2026-05-23-096-arch-design-direction.md`). Skim `CLAUDE.md` and `brain/wiki/workflows/cc-session.md` for project conventions; you don't need to re-read the whole brain.
2. **Then read the handoff folder** at `C:\Users\Phil\Downloads\Warhammer optics\`:
   - `index.html` (the homepage spec — read in full)
   - `chrono.jsx` (the component library — read in full; it's long but every piece matters)
   - `v2-shared.jsx` (extras — skim, port what's needed)
   - `books.html` (catalogue spec — read in full)
   - `ask.html` (ask spec — read for the path/question definitions for the static preview in Phase E; full state machine deferred)
   - `styles.css` (small — read for the grain pattern and the gradient base)
3. **Confirm worktree** before any edits: `git rev-parse --show-toplevel` must end in `chrono-lexicanum-product`. If it doesn't, halt and check with Philipp.
4. **Branch from origin/main** as a fresh `codex/product-2026-05-23-design-direction` — don't reuse `worktree/product-bootstrap`.
5. **Don't push, don't open a PR** — the brief is explicit. Local commits only. Philipp reviews via `npm run dev` between/after commits.
6. **Stop at end of Phase F.** Write the real impl report at `sessions/2026-05-23-096-impl-design-direction.md` with frontmatter `status: implemented`. Replace this planning file (delete it) or leave it as historical context — Philipp's call.
