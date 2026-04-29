---
session: 2026-04-30-012
role: architect
date: 2026-04-30
status: open
slug: timeline-buzzy-hover-and-pin-scale
parent: null
links:
  - 2026-04-29-008
  - 2026-04-29-011
commits: []
---

# Timeline polish — buzzy/glitchy hover, focus-ring fix, book pins that scale

## Goal

Three pain points surfaced on the deployed `/timeline` after the Phase 2a slim
port (sessions 008 / 011 / fix-up commit `326c07e`):

1. **The era-band hover effect feels lifeless.** It's a soft cyan colour
   shift and a static drop-shadow. The prototype's hover was a *buzzy,
   digital, "the cogitator just felt your cursor" effect* — RGB-split,
   displacement glitch, brief translate jitter. That's the dialect we want.
2. **A white rectangle appears around the era band on click.** Browser
   default focus-ring on the `role="button" tabIndex={0}` `<g>` element.
   Looks broken; we need a themed focus indicator instead.
3. **Book pins on the Overview ribbon are placed dumb and won't scale.**
   With three fixture books they look OK-ish (lifted off the ribbon with
   stems and offsets); with 100+ real books they will collapse into mush.
   We need a *Overview pin strategy that scales to thousands* — almost
   certainly this means dropping individual pins from the Overview and
   showing density / count instead, with individual books only in EraDetail.

This brief ships all three. (1) and (2) are quick. (3) is the meaningful
design decision.

## Design freedom

You have the **frontend-design skill** available. (1) is a port from the
prototype with minor calibration; (2) is a one-rule CSS change with a
chosen focus-ring style; (3) is the open one — read the trade-offs, pick.

The aesthetic to maintain is the same grimdark-archival cogitator we set in
sessions 006 / 007 / 008: painterly oklch accents, restrained luminance,
terminal-mono kickers, 0% glassmorphism, 0% neon, 0% flat-modern. The
prototype's glitch is a *strong stylistic choice* but it does fit the
cogitator-screen voice — the failure mode is making it loud enough to feel
"electronic" without crossing into "synthwave music video".

## Context

### What's true today

- `/timeline` (no `?era=`) renders Overview: ribbon + 7 era bands + dot pins
  per book, with a hover effect that is currently a colour-fade from
  `--ink-1` to `--hl` and an SVG `<filter id="bandHoverGlow">` blur rect
  underneath. See `src/components/timeline/Overview.tsx` lines ~120-180.
- Era bands are clickable `<g role="button" tabIndex={0}>` with prefetch on
  mouse enter via `router.prefetch`. Click navigates to
  `/timeline?era={era_id}`.
- Book pins sit slightly above/below the ribbon via stems
  (`Overview.tsx` lines ~280-310). 3-book fixture today; Phase 4 ingestion
  will bring hundreds.
- The prototype's glitch filter exists in source but was *deliberately not
  ported* in session 011 (see that report's open question 7 — "Skipped").
  This brief is the reversal of that decision.
- The prototype's `clusterStyle === 'count'` / `clusterStyle === 'density'`
  era-label tags exist in `archive/prototype-v1/components/OverviewTimeline.jsx`
  lines ~195-210. They were dropped in the slim brief because there were no
  filters; this brief brings them back as the unconditional density story.

### What's in scope

1. **Port the prototype's glitch hover**, calibrated to feel "buzzy
   electronic" without overstaying its welcome. Triggered on mouse-enter +
   on focus. Lives ~350-450ms then resolves to a steady-state hover.
2. **Replace the browser default focus ring** on `.era-seg` with a themed
   indicator — either a cyan inner stroke around the band, or a corner-tick
   pattern (similar to the Hub's `.mt-corner` cross-bracket on tiles).
3. **Replace per-book pins on the Overview with a per-era density signal.**
   The exact treatment is your call — see "Open question A" below for the
   trade-offs. Whatever lands must work cleanly at 0 books, 3 books (today's
   fixture), and 500+ books (Phase 4 projection).
4. **Keep individual book markers in EraDetail.** That surface already
   handles per-book layout via series tracks + standalone-spine packing
   (`EraDetail.tsx`). Maybe revisit the standalone-spine layout for
   density too, but lower priority — the Overview is the more pressing
   scale problem.

### What's out of scope

- The `prefers-reduced-motion` story for the glitch — gate behind a single
  media-query check the way we already do for the Starfield (`globals.css`
  lines 169-175). Don't build a per-component motion config.
- Touching EraDetail pan/drag, prev/next nav, empty-state copy.
- Touching the Aquila, the TopChrome, the Hub. None of those need to change.
- Phase 2a follow-ups (EntryRail / FilterRail / DetailPanel — still 2a.1 /
  2a.2 / 2a.3).
- Era-encoding cleanup brief (the formatM ↔ M30/M31/M42 disagreement and the
  M39-M41 gap) — that's a separate carry-over from session 011's report.

## Constraints

- **Server Component default for `/timeline/page.tsx`.** Don't move data
  fetching into the client.
- **Glitch must not block clicks.** The hover transition runs *during*
  pointer-over; clicks must register on the band normally.
- **`prefers-reduced-motion` honoured.** With the media query active, the
  glitch should reduce to a steady-state hover (just the colour shift), no
  displacement, no RGB-split, no jitter.
- **No new dependencies.** SVG filters + CSS only. No motion libraries,
  no canvas overlays.
- **TypeScript strict, lint baseline preserved** (the only allowed warning
  remains `no-page-custom-font` in `src/app/layout.tsx`).
- **The Overview's "click an era to drill in" interaction stays the same.**
  Don't change the URL contract or the navigation flow.

## Acceptance

The session is done when all of these are true.

**Glitch hover:**

- [ ] Hovering / focusing an era band triggers a brief (≤450ms) buzzy
  effect: SVG displacement, RGB-split or chromatic aberration, brief
  translate jitter — exact recipe your call. Then settles into a
  steady-state hover (colour + glow). Steady state persists while the
  cursor stays over the band.
- [ ] With `prefers-reduced-motion: reduce`, hover applies only the colour
  shift — no displacement / RGB / jitter. Verified by toggling the OS
  setting (or the browser DevTools rendering tab override).

**Focus ring:**

- [ ] Tab-navigating to an era band shows a themed focus indicator (your
  call — cyan inner stroke, corner brackets, or similar) instead of the
  browser default outline.
- [ ] Mouse-clicking an era band does NOT show the browser white outline
  while/after the click. (`outline: none` plus `:focus-visible` styling.)
- [ ] Keyboard accessibility preserved: tabbing through bands still moves
  focus correctly; Enter / Space activates the band.

**Book pins on Overview at scale:**

- [ ] Pins decision documented in the report (see Open question A).
- [ ] With the current 3-book fixture, the Overview reads as "this era has
  some content" without individual book pins competing with the era labels.
- [ ] With a hypothetical 500+ books, the Overview would still read
  cleanly. (Test by injecting a temporary fixture of ~200 randomised books
  in dev to eyeball the density at scale, then revert the fixture before
  shipping.)
- [ ] EraDetail still shows individual books per era — that surface is
  unchanged unless you decide its standalone-spine layout also needs the
  density treatment.

**Hygiene:**

- [ ] `npm run typecheck` pass.
- [ ] `npm run lint` baseline (only `no-page-custom-font`).
- [ ] `npm run build` green.
- [ ] `npm run dev` smoke: every existing route still 200, no console
  errors, no hydration mismatch.
- [ ] Implementer report `sessions/2026-04-30-NNN-impl-timeline-buzzy-hover-and-pin-scale.md`
  committed; this brief flipped to `status: implemented`.
- [ ] Push to `main`; verify the Vercel preview shows the new hover and
  the new pin strategy on `/timeline` (or describe the verification path
  if Vercel is mid-redeploy when you finish).

## Open questions for your report

**A. Book pin strategy on Overview — the meaningful design decision.**

Below are the three approaches I see; pick one and explain why. Don't try
to combine them — pick a clean direction.

1. **Drop pins, show per-era count badges.** Each era label gets a small
   `[042 VOLUMES]` tag below the era-name. The era band itself signals
   "this is an era"; the count signals scale. Books are only seen in
   EraDetail. Cleanest, most minimalist; loses the "constellation" feel.
2. **Density gradient per era.** The era band's fill intensity scales with
   the book-count density (books per year inside that era). A bookless
   era reads dim; the Heresy with its dense Black Library catalog blazes.
   No individual pins. Visually striking; harder to read precise counts.
3. **Adaptive pins with cluster collapse.** Render individual pins when an
   era has ≤ N books (say N=8); collapse to a count badge / cluster icon
   when ≥ N. Best of both worlds, more code. Risk: the era looks
   inconsistent (some bands have pins, others have a tag — visual
   asymmetry).

My weak prior: option (1). Counts read fast, scale to any N, and the
"constellation" is the wrong metaphor for the Overview anyway — the
constellation lives in EraDetail. But you have the design freedom.

**B. Glitch recipe.** What did you ship — pure prototype port? Dialed-down?
Composed differently? If you composed differently, what was the prototype
doing that you wanted to keep / drop? Worth a paragraph because we'll
likely revisit this once the rails (2a.1/2a.2) land and the page has more
chrome competing for the eye.

**C. Focus indicator pattern.** Which themed focus-ring did you ship?
Cyan inner stroke? Corner brackets like the Hub tiles? Something else?
Reasoning helps the next time we add a custom interactive element (book
pins in EraDetail will eventually be focusable too).

**D. Did the standalone-spine in EraDetail need the same density
treatment?** With the 3-book fixture it's fine; once Phase 4 lands real
data, era-internal density will matter too. If you tackled it, document
how. If you held it — fine, mention it as a follow-up.

## Notes

- **Suggested commit shape**:
  1. *Focus-ring fix* + *glitch hover port* — touches `Overview.tsx` SVG
     `<defs>` and the era-band rendering, plus `globals.css` for the
     `.era-seg:focus-visible` rule.
  2. *Pin scale strategy* — touches `Overview.tsx`'s book-rendering block
     and possibly `globals.css` for any new badge / density styling.

- **Reference files to read end-to-end before starting**:
  - `archive/prototype-v1/components/OverviewTimeline.jsx` (glitch filter
    `<defs>` lines 56-66, glitch trigger lines 7-10 and 76)
  - `archive/prototype-v1/styles/timeline.css` lines 105-134 (`eraGlitch`
    keyframes, ribbon breathe)
  - `archive/prototype-v1/components/OverviewTimeline.jsx` lines 195-210
    (`clusterStyle === 'count' / 'density'` — the cluster tag rendering
    that I dropped in the slim brief; now relevant again)
  - `src/components/timeline/Overview.tsx` (current state — what you're
    rewriting around)
  - `src/app/globals.css` `/* ===== Timeline ===== */` block
  - Session 011 report — open question 7 ("Glitch filter on era hover")
    has the explicit reasoning I used to skip it. You're now reversing
    that call; worth noting in your report so future-Cowork doesn't
    re-litigate.

- **Verifying the density story without 500 real books**: write a quick
  dev-only fixture (gated by `process.env.NODE_ENV === 'development'`) that
  procedurally generates ~200 books spread across the eras, with realistic
  series clumping. Use it to eyeball the Overview at projected scale,
  then make sure it doesn't ship to prod. (Or use a separate
  `scripts/seed-data/books.fake.json` that you load only via a one-off
  `npm run db:seed:fake` script — your call.)

- **The glitch needs to feel cogitator, not synthwave**: the prototype's
  RGB-split is `feOffset` red `dx=-3`, blue `dx=+3`. That's quite
  aggressive. Try halving (`dx=±1.5`) and see if it still feels
  electronic. The displacement filter's `scale=12` may also be loud at
  our band sizes — consider `scale=8`.

- **Carry-over from earlier sessions still standing** (don't worry about
  these unless they bite you): `NEXT_PUBLIC_SITE_URL` cosmetic on Vercel,
  Hub novel-count freshness, era-encoding M39-M41 gap + formatM ↔ toggle
  reconciliation, mobile-touch test of EraDetail pan/drag, pan-scrubber
  click-to-jump.
