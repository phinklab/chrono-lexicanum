---
session: 2026-04-29-006
role: architect
date: 2026-04-29
status: implemented
slug: css-hub-polish
parent: 2026-04-28-005
links:
  - 2026-04-28-001
  - 2026-04-28-002
  - 2026-04-28-005
  - 2026-04-29-007
commits:
  - 6c3697b
  - 0cfa751
  - ce01902
  - 23619a4
---

# CSS foundation + Hub polish + global chrome

## Goal

Bring the Hub visually closer to the prototype's design language and lay down the **global chrome** (animated starfield + top-chrome bar with mark-sigil and era-toggle) without touching any tool route. Also: migrate the prototype's foundational design tokens into our `@theme` block, and retire the Tailwind v4 codemod's border-color compat block.

This is the **first Phase 2 brief**. Everything that touches `/timeline`, `/map`, or `/ask` belongs in a later sub-brief.

## Design freedom — read before everything else

You have the **frontend-design skill** installed for this brief. Use it. The aesthetic decisions — exact corner-decoration geometry, kicker typography, hover micro-animations, stagger timings, footer composition, top-chrome layout, sigil shape, glow intensity — are **yours to make**. This brief is intentionally underspecified at the visual level: I describe *what should exist* and *what feeling to land on*, not which Tailwind class to put where.

What this means concretely:
- I'll tell you "Hub tiles have corner decorations that hint at terminal-UI cross-bracketing." I will *not* tell you `14px x 14px, 1.5px stroke, opacity 0.5 -> 1 on hover`. That's design work.
- I'll tell you "Aquila has a luminous halo." I will *not* prescribe `drop-shadow(0 0 18px ...)`. Match the prototype's intent; calibrate by eye.
- I'll tell you "tiles mount with staggered entry." I will *not* prescribe `160/280/400ms`. Pick what reads as cinematic but doesn't make the page feel slow.

Reference points (look at these before designing):
- **Prototype CSS** — `archive/prototype-v1/styles/base.css` (tokens, starfield, top-chrome) and `archive/prototype-v1/styles/modes.css` (Hub + mode-tile). These show the *vocabulary*; don't transcribe blindly, port the *language*.
- **Prototype Hub component** — `archive/prototype-v1/components/Hub.jsx` (mode-tile structure, the three doorway icons as inline SVGs).
- **Prototype Starfield** — `archive/prototype-v1/components/AnimatedStarfield.jsx` (canvas + rAF logic to port directly).
- **Existing `@theme`** — `src/app/globals.css` lines 3-67 (the Phase-1 palette is already there; the new tokens augment, they don't replace).
- **Prototype screenshots** — `archive/prototype-v1/screenshots/` (the actual rendered look).

The aesthetic to land on (in case the prototype's variety obscures it): **grimdark archival cogitator**. Painterly oklch palette, restrained accent glow, terminal-mono kickers, serif headlines (Cinzel + Cormorant + Newsreader), 0% glassmorphism, 0% neon, 0% flat-modern startup-page. If a design choice you're considering would feel at home on a 2026 SaaS landing page, it's probably wrong for this archive.

The architectural constraints below are **non-negotiable** — they describe scope, integration, and what the rest of the codebase expects. Everything between those constraints is your call.

## Context

You shipped Next 16.2.4 + Tailwind 4.2.4 in session `2026-04-28-005`. The CSS pipeline is now CSS-first (`@theme {...}` in `src/app/globals.css`). The Hub at `src/app/page.tsx` is a flowed Tailwind layout with three "Doorway" tiles — functional but visually generic. The prototype's full Hub (`archive/prototype-v1/components/Hub.jsx` + `archive/prototype-v1/styles/modes.css` lines 17-172) was a `position: fixed` full-screen experience with mode-tile corner decorations, staggered tile-mount animations, an animated starfield behind it, a top-chrome with mark-sigil and era-toggle, and a footer with stats.

We are deliberately **not** doing the position-fixed full-screen prototype Hub. Reason: the new architecture is multi-page; a full-screen Hub fights the rest of the site. Instead we keep the flowed layout and bring the prototype's *visual vocabulary* — corner decorations, kicker typography, Aquila glow, hover micro-animations, footer stats line — onto it.

Three carry-over items from `sessions/README.md` are folded in:

1. **Auto-Memory `userEmail` typo** — CC's `wtpnoire@gmail.com` should be corrected to `p.kuenzler@web.de` (GitHub-verified). See "Before you start" below.
2. **Tailwind v4 border-color compat block** in `globals.css` lines 77-85 — codemod-installed safety net. Phase 2's CSS port is the moment to retire it. See Acceptance.
3. (`NEXT_PUBLIC_SITE_URL` on Vercel — Philipp's task in the dashboard, NOT folded into this brief.)

Three scope decisions made with Philipp this session:

- **Hub-Fidelity:** "Polish on flowed layout" — keep the current scrollable structure, apply prototype design polish on top.
- **Theme system:** Defer — only Dark + Cold palette is wired this brief. Tokens for other palettes are *not* in scope.
- **Chrome scope:** **AnimatedStarfield + Top-Chrome (mark-sigil + strapline) + Era-Toggle (M30/M31/M42)** — all three in scope.

## Before you start

- **Fix your auto-memory.** Your `# userEmail` line currently shows `wtpnoire@gmail.com`. The GitHub-verified address is `p.kuenzler@web.de`. Use your own memory mechanism (`/memory edit` or equivalent — do **not** hand-edit `.claude.json`). The repo-local `git config user.email` is already correct (set in session 005); this is purely about your memory file.
- **Pull `main`.** Session 005 + the carry-over commit `bb9ddc7` are upstream.

## Scope

This brief covers four concerns. Each can land as its own commit (or fold two together if it reads more cleanly). Total: roughly 4-6 commits. **Pick the order you prefer**, but the dependency graph is: tokens -> polish + chrome (parallel) -> era-toggle (depends on top-chrome).

### A. Token foundation (in `globals.css`)

Move the prototype's foundational design tokens into our `@theme` block alongside the existing void/aquila/frost/heresy palette. The prototype uses `oklch()` and `color-mix(in oklch, ...)` heavily; preserve those — Tailwind 4 supports them, and they're worth keeping for the painterly look. The minimum import set (Dark + Cold only):

```
/* Surfaces */
--color-bg-0:       /* #06080c */
--color-bg-1:       /* #0a0e15 */
--color-bg-2:       /* #10151f */

/* Ink */
--color-ink-0:      /* #e8e4d8 */
--color-ink-1:      /* #c7c3b6 */
--color-ink-2:      /* #8a8578 */
--color-ink-3:      /* #55524a */

/* Lines */
--color-line-0:     /* rgba(232,228,216,0.08) */
--color-line-1:     /* rgba(232,228,216,0.16) */
--color-line-2:     /* rgba(232,228,216,0.32) */

/* Highlights / accents (oklch source of truth) */
--color-lum:        oklch(0.88 0.10 210)
--color-amber:      oklch(0.82 0.12 75)
--color-gold:       oklch(0.86 0.10 90)
--color-chaos:      oklch(0.68 0.14 25)
```

Plus the prototype's *aliases* (`--panel`, `--panel-hover`, `--hl`, `--hl-faint`, `--hl-glow`, `--warm-faint`) — these are the names the ported CSS in `modes.css`/`base.css` uses. Tailwind 4 doesn't auto-generate utilities for `color-mix()` aliases the way it does for hex tokens, so put the aliases in a `:root` block (not `@theme`) — they're for hand-written CSS, not utility generation.

The existing `--color-void-*`, `--color-aquila-*`, `--color-frost-*`, `--color-heresy-*` palette stays — they're used by the current Hub utilities (`text-aquila`, `bg-void-900`, etc.). Don't delete them. The new tokens **augment**.

The existing `:root { --c-void: ...; --font-display: ...; ... }` block in `globals.css` lines 98-109 was placeholder; replace it with the prototype's full alias set or fold its values in — your call. Don't double-declare.

### B. Retire the v3 border-color compat block

Lines 77-85 of `globals.css`:

```css
@layer base {
  *, ::after, ::before, ::backdrop, ::file-selector-button {
    border-color: var(--color-gray-200, currentcolor);
  }
}
```

After A is done, audit every element that has a `border` Tailwind utility *without* an explicit `border-color`. Three known sites: the three doorway tiles in `page.tsx` (already explicit: `border-frost-900/60`), and any prototype CSS class you port that uses `border: 1px solid var(--line)`. Once every element with a border specifies its own color, delete the block. If you find an element that loses its visible border after deletion, that element gets an explicit `border-color` and the block still goes.

### C. Hub polish (in `src/app/page.tsx` + scoped CSS)

Keep the **flowed layout** (the page scrolls, sits inside the global chrome — not the prototype's `position: fixed` full-screen). Apart from that hard constraint, the Hub's visual direction is yours.

What must exist on the page when you're done (all visual treatment is your call):

- **The Aquila has a luminous presence**, not just a colored SVG. The prototype's drop-shadow + accent-color halo is a starting point, not a recipe.
- **The three doorways feel like terminal panels**, not buttons. Cross-bracketed corners that respond to hover, an accent kicker line, the headline, a body line, and an "Enter" affordance are the prototype's vocabulary; whether each is a `::before`/`::after`, a child `<span>`, or pure utility classes is your call.
- **Each doorway has a kicker** above the title — a short uppercase mono label that names the *kind* of query (the prototype uses `Guided` / `Chronology` / `Cartography`; you may use those, refine them, or pick fresh ones that fit the cogitator voice).
- **The doorways enter with cinematic stagger.** `--animate-tile-rise` already lives in `@theme`; use it or replace it. The point is the page doesn't pop in flat — there's a sense of console boot.
- **A multi-segment footer** where the existing copyright line currently lives. Compose it from at least: a project-identity segment (e.g. `Fan Archive · Non-Commercial`), a live count of novels in the database (read on the server — `select count(*) from books`, currently 0; render the literal number), the static counts (7 eras, 5 Segmenta), and the existing copyright disclaimer ("Unofficial fan project. Warhammer 40,000 © Games Workshop. No affiliation.") — folded into the same line, moved beneath, or split visually. Your composition.
- **The Hub eyebrow** (above the headline) carries the prototype's voice — `// Archive-Console · cogitator online` or your refinement. The current generic "Chrono · Lexicanum" line is too neutral; lean into the in-universe-terminal feel.

Use the frontend-design skill liberally here. The Hub is the door; it should look serious.

### D. Global chrome (in `RootLayout` + new components)

Three new components, all rendered inside `<body>` of `src/app/layout.tsx`. The integration contracts are non-negotiable; the visual rendering is yours.

1. **`<Starfield />`** — port `archive/prototype-v1/components/AnimatedStarfield.jsx` to `src/components/chrome/Starfield.tsx` as a default export. **Contract:** mounts as the first child of `<body>`, positions itself behind all content via fixed positioning, respects `prefers-reduced-motion` (the prototype already has the branch — preserve it), and accepts at minimum a `density` prop (default `1`). The drift speeds, layer counts, brightness blending, and any density/perf tuning are yours. If you spot a way to make it more painterly than the prototype's hand-drawn-on-canvas approach, take it.

2. **`<TopChrome />`** — fixed top of viewport, full-width, sits above the starfield and Hub content. **Contract:** contains a left-side identity element (a sigil + the Chrono · Lexicanum wordmark, the wordmark linking to `/`) and a right-side `<EraToggle />`. Server vs client component split is your call (see Open Question 2); only the EraToggle truly needs `'use client'`. The strapline element from the prototype's `base.css` (the centered subtitle below the chrome) is **not** ported in this brief — it conflicted with the flowed Hub. If you find it works after all, mention in your report.

   The mark-sigil's exact geometry — the diamond, the pulse ring, the glow — is yours. The prototype has one shape; the frontend-design skill might suggest a sharper one. The constraint is *that there is a sigil*, that *it pulses subtly* (no jarring motion that competes with the starfield), and that *it carries the cogitator-terminal voice* of the rest of the page.

3. **`<EraToggle />`** — three-state toggle (`M30 / M31 / M42`). **Contract:**
   - Source of truth: URL search param `?era=M31`. On click, update via `router.replace` so the URL reflects the choice without scroll-jumping.
   - Read via `useSearchParams()`. Default (no param) = `M31`.
   - On a fresh route load with no `?era`, the active button reflects `M31`; on a load *with* `?era=M42`, the toggle reads M42.
   - **No other component reads `era` this brief.** Phase 2a's Timeline picks it up. The toggle's job today is to *record intent* into the URL.

   Visual treatment (pill shape, backdrop blur, active-state glow, mono typeface, etc.) is yours. The prototype's `.chrono-toggle` is one valid answer, not the only one.

   **Pushback noted but Philipp greenlit:** the toggle has no consumer yet. That's deliberate — it's chrome the Timeline page will adopt without further wiring. If shipping it without a consumer feels too speculative when you sit down to design it, defer it to Phase 2a and ship just the mark-sigil/wordmark this brief. Note the reason in your report.

## Constraints

- **No tool-route work.** `/timeline`, `/map`, `/ask`, `/buch/[slug]`, `/fraktion/[slug]`, `/welt/[slug]`, `/charakter/[slug]` stay untouched. If `RootLayout` chrome appears on them as a side effect, that's expected — but no per-route work in this brief.
- **No theme switcher UI.** Even though we're laying down the token foundation that *enables* light/warm/mono later, no toggle, no `data-theme` JS-mutation, no localStorage of preference. The `<html data-theme="dark" data-palette="cold">` attributes already in `layout.tsx` stay as static defaults.
- **No `next/font` migration.** Phase 1's report suggested it; not now. Keep the `<link>`-tag font loading. (The unrelated `@next/next/no-page-custom-font` ESLint warning that's been there since Phase 1 stays — that's the trade.)
- **Database access for the stats line goes through `src/db/client.ts`** in a server component (Hub is a server component; only the chrome bits are client). No client-side DB queries.
- **Server Component default holds.** Only `Starfield`, `TopChrome` (or just its EraToggle child), `EraToggle` get `'use client'`. The Hub itself stays server.
- **Visual regression is OK** — that's the point of this brief — but visual regression on the four stub routes (`/timeline`, `/map`, `/ask`, plus the `[slug]` routes) is not. Eyeball them after the chrome lands; the stubs should still look like recognisable stubs, just sitting underneath the new top-chrome and starfield.
- **`prefers-reduced-motion`** is respected by every animation introduced this session — starfield drift, tile-rise, scan, hover transitions. The existing `globals.css` block at lines 131-139 covers blanket `transition-duration: 0.001ms`; verify it actually fires for the new effects, and add explicit guards in `Starfield.tsx` (the prototype already has one; preserve).

## Out of scope

- Light theme, warm palette, mono palette — token plumbing exists in CSS-vars, but no second palette is wired. **Do not** add `html[data-theme="light"]` overrides.
- Theme/palette switcher UI. Not even a stub.
- The strapline (`.strapline` block from prototype `base.css` 235-292). Skip.
- The leftrail (`.leftrail` from `base.css` 294+) — that's an EraView/Timeline element. Phase 2a.
- Detail-modal CSS (`detail-modal.css`) — book pop-out is Phase 3 territory.
- Timeline-specific CSS (`timeline.css`) — Phase 2a.
- `next/font` migration.
- Migrating Supabase API keys from legacy `anon`/`service_role` to `publishable`/`secret`. Separate small brief later.
- Bumping Drizzle, postgres-js, supabase-js, React, TypeScript, ESLint. Same out-of-scope rule as session 005.
- Moving session-005's earlier "Trigger Vercel deploy" empty commits or rewriting their authors. Cosmetic; leave history.

## Acceptance

The session is done when all of these are true. Most are outcomes, not class-name checks — the frontend-design skill is expected to find many valid concrete shapes.

**Foundation:**

- [ ] `globals.css` `@theme` block contains the prototype's surface / ink / line / accent tokens (additive — existing void / aquila / frost / heresy palette intact). Prototype CSS aliases (`--panel`, `--hl`, `--hl-glow`, etc., or your refined naming) live wherever they need to live to be consumed by hand-written CSS — your call.
- [ ] The Tailwind v4 v3-compat border-color block has been deleted; every element with a `border` utility specifies its own colour. **If the block is kept**, the report explains exactly which element forced the keep and what'd be needed to retire it — don't leave it as silent dead weight.

**Hub:**

- [ ] The Hub at `/` looks materially closer to the prototype's design language than today. The Aquila reads as luminous; the three doorways read as terminal panels (not generic cards); there's a kicker / title / body / enter-affordance hierarchy on each; the page enters with stagger; there's a multi-segment footer with at minimum the static + dynamic counts (novels read from DB on the server) and the copyright line. Quality bar: looks like it belongs to the same project as `archive/prototype-v1/screenshots/check-overview.png`.
- [ ] The Hub layout is still flowed (page scrolls if content overflows). It is **not** the prototype's `position: fixed` full-screen Hub.

**Chrome:**

- [ ] `src/components/chrome/Starfield.tsx` exists, mounts as the first child of `<body>`, sits behind all content, respects `prefers-reduced-motion`. Visually it should feel like a deep-space backdrop, not a screen-saver.
- [ ] `src/components/chrome/TopChrome.tsx` exists, fixed top of viewport, contains a sigil + wordmark on the left (wordmark links to `/`) and `<EraToggle />` on the right.
- [ ] `src/components/chrome/EraToggle.tsx` exists. Three-state (M30 / M31 / M42). Source of truth: URL `?era=...`. Default = M31. URL updates on click; toggle reflects URL on reload.
- [ ] All three components render on every route (Hub + 7 stub routes) without breaking the stubs underneath.

**Hygiene:**

- [ ] `npm run typecheck` — pass.
- [ ] `npm run lint` — same baseline (the pre-existing `no-page-custom-font` warning is still the only one; no new warnings introduced).
- [ ] `npm run dev` — every route 200, console clean. Eyeball at least one of `/timeline`, `/map`, `/ask`, `/buch/[slug]` for chrome-induced layout regressions.
- [ ] `npm run build` — green.
- [ ] Push to `main` — Vercel auto-deploy succeeds. `https://chrono-lexicanum.vercel.app/` shows the polished Hub with starfield and chrome live.
- [ ] Implementer report `sessions/2026-04-29-007-impl-css-hub-polish.md` committed; this brief flipped to `status: implemented`.

## Open questions for your report

1. **Design decisions you made and why.** This is the most-read section in your report for this brief. The architectural choices are mine; the concrete visual choices are yours, and I want to read what you decided and what you considered. At minimum: doorway tile composition, corner-decoration treatment, stagger timing, sigil shape, EraToggle visual style, footer composition. One or two sentences each.
2. **Starfield perf.** What FPS does the starfield hold? If it costs more than ~3% CPU at idle, propose a knob (lower default density, or a "reduce ambient effects" toggle for a later brief).
3. **TopChrome SSR shape.** Did you make the whole TopChrome a client component, or is only EraToggle the client island? Which read cleaner, and what's the implication for tool-route chrome later?
4. **Compat-block fate.** Deleted? Kept? If kept, which class needs an explicit border colour to allow Phase 2a to finally retire it?
5. **Tailwind 4 + `oklch()` / `color-mix()` footguns.** Anything weird in arbitrary-utility shape, opacity-modifier interaction, or @theme token resolution? Phase 2a will write a lot of utilities against these tokens; advance warning is gold.
6. **Era-toggle default + reload behavior.** Did you go URL-only as the brief states, or did you find a reason to add cookie-based persistence? Either is fine; the trade-off is what I want to read.
7. **Anything in the prototype CSS you wanted to bring across but couldn't justify under "no tool route work."** A short list helps me write Phase 2a tighter.

## Notes

- **Suggested commit shape (~4 commits, but split however reads cleanest):**
  1. *Tokens + compat-block cleanup* — `globals.css` only. Smallest, most contained diff.
  2. *Hub polish* — `page.tsx` + Hub-scoped CSS.
  3. *Starfield + RootLayout integration*.
  4. *TopChrome + EraToggle* together (EraToggle renders inside TopChrome).

- **Where scoped CSS lives** is your call: CSS Modules next to each component, a `/* ===== Hub ===== */` block in `globals.css`, or a mix. Tailwind utilities for everything that's a one-off, hand-written CSS for the prototype's painterly effects (radial gradients, oklch color-mix, multi-layer parallax) — Tailwind doesn't have first-class arbitrary-utility for those without arbitrary-value verbosity that hurts readability.

- **EraToggle URL writing — your call:** the toggle could write `?era=...` always (clearer share-links, but the URL never empties), or only when the value differs from the default M31 (cleaner default URL, but two states map to "no param"). Pick what feels right and note in the report.

- **Phase 2a (next brief) will be the Timeline port.** It picks up the `?era=` URL param this brief introduces as a free input. So this brief's era-toggle is a write-only artifact today; Phase 2a wires the read.

- **Once this lands**, two carry-over items get pruned from `sessions/README.md` (auto-memory + compat-block). The `NEXT_PUBLIC_SITE_URL` item stays — still Philipp's Vercel-dashboard task.

- **Reference files (read these — they hold the design vocabulary):**
  - `archive/prototype-v1/components/Hub.jsx`, `AnimatedStarfield.jsx`
  - `archive/prototype-v1/styles/modes.css` lines 17-172 (Hub + mode-tile)
  - `archive/prototype-v1/styles/base.css` lines 1-37 (tokens), 113-161 (starfield CSS), 163-206 (top-chrome)
  - `archive/prototype-v1/screenshots/` (rendered look)
