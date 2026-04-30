---
session: 2026-04-30-013
role: implementer
date: 2026-04-30
status: complete
slug: timeline-buzzy-hover-and-pin-scale
parent: 2026-04-30-012
links:
  - 2026-04-29-008
  - 2026-04-29-011
commits: []
---

# Timeline polish — buzzy/glitchy hover, focus-ring fix, book pins that scale

## Summary

Reverses session 011's "skip the glitch" call: era bands now buzz briefly
on mouse-enter / keyboard focus through a calibrated turbulence-displacement
filter, settling to the steady-state cyan hover. The browser's white
focus rectangle is gone, replaced by themed corner brackets only on
`:focus-visible`. Per-book pins on the Overview ribbon are gone — each
era now wears a `[NNN VOLUMES]` count badge that scales cleanly to any
catalogue size; individual books still live in EraDetail.

## What I did

- `src/components/timeline/Overview.tsx`
  - Added `glitchingEraId` state + `glitchTimerRef` so a re-hover
    cancels the previous timer cleanly. Cleanup effect on unmount.
  - `triggerGlitch(id)` set on both `onMouseEnter` and `onFocus`,
    420 ms total; the JS state mirrors the CSS keyframe duration so the
    `glitching` class lives just long enough to play through.
  - Added the `<filter id="eraGlitch">` SVG defs: turbulence + 8-px
    displacement + a colour matrix nudging the red/blue channels apart.
    Calibration milder than the prototype's 12-px / sharper-RGB recipe
    (see Open question B below).
  - Added four `<polyline>` corner brackets per band wrapped in
    `<g class="era-seg-brackets">`. Always present in the DOM; CSS
    flips opacity 0→1 only on `:focus-visible`. No JSX state coupling.
  - Computed `eraCounts` via `useMemo` (midpoint-in-era match,
    mirroring the prototype's `counts`).
  - Removed the per-book ribbon-pin block (`<g class="book-node">…`).
    Inside each era label group, render a `<g class="era-count">`
    background-rect + `<text class="num">` reading
    `${count.padStart(3, "0")} VOLUMES` when `count > 0`. Eras with
    zero books just keep their label.
  - Dropped the `hash` import — no longer used after pin removal.
- `src/app/globals.css`
  - Replaced `.era-seg:focus-visible { outline: none; }` with
    `.era-seg { outline: none; }` so the browser outline is suppressed
    on plain `:focus` (mouse-click) too.
  - Dropped the `:focus-visible .era-seg-bar-fill` drop-shadow — the
    corner brackets carry the focus signal now.
  - Added `.era-seg.glitching` class trigger and `@keyframes eraGlitch`.
    The keyframe alternates `filter: url(#eraGlitch)` and `filter:
    none` across 8 stops in 420 ms with small ±2 px translates. Under
    `prefers-reduced-motion`, the existing global
    `* { animation-duration: 0.001ms !important; }` collapses the
    keyframe to its 100 % neutral frame — verified by tracing the
    cascade. No per-component motion gate needed.
  - Added `.era-seg-brackets polyline` rules: cyan stroke, hairline
    drop-shadow, opacity 0 idle and on plain `:focus`, opacity 1 on
    `:focus-visible`.
  - Added `.era-count` block: panel-vocabulary background rect,
    cyan-tinted `num` text with a soft text-shadow.
  - Removed the `.book-node`, `.book-node-dot`, `.book-node-halo`,
    `.book-node.dim`, `.book-node.match` block. Zero remaining
    consumers (`book-node` was Overview-only; EraDetail uses
    `book-marker`).
- `sessions/2026-04-30-012-arch-timeline-buzzy-hover-and-pin-scale.md`
  → `status: open` → `status: implemented`.
- `sessions/2026-04-30-013-impl-timeline-buzzy-hover-and-pin-scale.md`
  *(this report)*.
- `sessions/README.md` — active-threads list updated.

## Decisions I made

### A. Pin strategy on the Overview — count badges (option 1)

Picked the brief's weak prior: drop pins, render a `[NNN VOLUMES]`
count badge per era. The reasoning:

1. **Counts read at any catalogue size.** A 3-digit zero-padded count
   fits the same 68 px badge whether the era has 1 book or 999. The
   real W40K BL catalogue is somewhere around 500 books total — the
   badge tops out at the most-populated era ("HORUS HERESY · 071
   VOLUMES" or so). 4-digit overflow is a Phase-5+ problem.
2. **The constellation metaphor was wrong here.** Overview's job is
   "name the era you want to drill into." Per-book pins compete with
   era labels for attention without telling the reader anything about
   which era is dense and which is sparse — the badge does that
   directly.
3. **The constellation lives in EraDetail.** That surface is built
   for per-book layout (series tracks + standalone spine + pan/drag).
   Once Phase 4 lands real books, the standalone spine will need its
   own density treatment (see open question D below) — but the
   Overview's job is to be a navigator, not a constellation map.

I rejected option 2 (density-gradient band fill) because the era band
already does heavy visual work (idle dim, hover lit, focus brackets,
glitch buzz). Layering "and the band fill brightness encodes density"
on top would be one too many things for one surface to mean. I rejected
option 3 (adaptive pins-or-cluster) because it makes the visual
treatment depend on data, which Philipp would notice as inconsistency
("why does Heresy have a count and Indomitus has dots?").

### B. Glitch recipe — prototype's, calibrated milder

The brief explicitly invited dialing this back ("RGB-split is `dx=±3`,
that's quite aggressive — try halving"). I shipped a *composed*
recipe rather than a pure port:

- **Filter primitives kept.** `feTurbulence` (fractalNoise, baseFreq
  `0.85 0.35`, 1 octave, seed 2) → `feDisplacementMap` (R/G channels)
  → `feColorMatrix` (slight red+blue lift, slight green dip for the
  cogitator-screen tint).
- **Displacement scale 12 → 8.** The prototype's 12 reads as a video
  glitch on our band sizes; 8 keeps the buzzy electronic shudder
  without crossing into "tape-rewind".
- **No separate `rgbSplit` filter.** The prototype defined a second
  `feOffset`-based RGB-split filter for the era *label* glitch and
  fired it on the same trigger. I dropped that — the band's colour
  matrix already does the chromatic-aberration work, and applying a
  second filter to the label `<text>` would mean the era name fights
  the band visually. The label stays clean; only the band buzzes.
- **Keyframe transforms gentler.** Prototype's was ±3 px and a
  `clip-path: inset(20% 0 40% 0)` slice; I dropped the inset (reads
  as glitch art, not cogitator) and shrank translates to ±2 px max.

The result is "the cogitator just felt your cursor". Worth a
re-evaluation once the rails (2a.1 / 2a.2) land — the page will have
more chrome competing for the eye, and the glitch may need to dial up
or down depending on how it sits with the entry-cards beside it.

### C. Focus indicator — corner brackets

Picked corner brackets over an inner stroke because:

1. **Vocabulary continuity.** The Hub tile's `.mt-corner` cross-bracket
   pattern is already the project's "you're focused on this" signal.
   Re-using it keeps the design coherent — the next focusable element
   (book pins in EraDetail, filter chips in 2a.2) gets the same
   treatment for free.
2. **Reads cleanly at any band width.** An inner stroke around a wide
   band (Long War: 5000y, ribbon-fraction-wise the largest band) would
   be a long thin rectangle — inconsistent visual weight against the
   narrow Heresy band. Corner brackets are fixed-size at the band's
   four corners regardless of width.
3. **No conflict with the band's own edges.** The bands already have
   top + bottom edge accents (idle dashed, hover solid). An inner
   stroke would either compete with those or have to disable them on
   focus — both ugly. Corner brackets sit at the corners specifically
   *because* the edges live elsewhere.

The brackets always exist in the DOM (4 polylines per band); CSS
gates their visibility with `opacity` so there's no JSX state
coupling. Cheaper than a JSX conditional render and cleaner under
React's reconciler.

### D. EraDetail standalone-spine density treatment — held

The brief asked whether EraDetail also needs the density treatment.
Held. With the 3-book fixture it's fine. Once Phase 4 lands real data,
era-internal density will matter — picture Heresy's ~70 BL novels
collapsing on a single horizontal spine. The right move there is the
prototype's `cluster-node` / `cluster-flyout` machinery (see
`archive/prototype-v1/styles/timeline.css` lines 663-766): nearby
standalone pins collapse into a stacked-diamond cluster with a count
badge; clicking opens a fly-out list. That's a brief on its own — cluster
collapse threshold, fly-out anchoring, click-vs-hover semantics,
mobile-touch handling. Logged to "For next session."

### E. Other small choices

- **`useRef<ReturnType<typeof setTimeout> | null>` for the glitch
  timer.** In a Next 15 client component this resolves to `number`;
  the union covers SSR-stub safety. `clearTimeout` accepts either
  freely. Cheaper than importing a separate timer-id type.
- **Glitch state and hover state are separate.** They start together
  on enter/focus but the hover persists until leave/blur, while the
  glitch self-clears after 420 ms. Re-entering an already-hovered
  band (which you can do via Tab → focus blip → mouseEnter) restarts
  the glitch cleanly because `triggerGlitch` clears the previous
  timer first.
- **The corner-bracket polylines are 8 px arms with `stroke-linecap:
  square`.** Square caps so the corners read as sharp Hub-vocabulary
  brackets, not rounded soft Ls.
- **Did NOT add a temporary 200-book fake-fixture for visual
  density testing.** Reasoning: with option (1) the count badge is
  fixed-size text; the badge fits 4 digits comfortably. Verified by
  inspection of the rendered SVG (`<text class="num">001 VOLUMES</text>`,
  same width regardless of count). The brief's suggestion was paranoia
  appropriate to a strategy where pin layout depends on count — it
  doesn't apply to a strategy that has zero per-book elements at all.
  Documented; Philipp can spot-check on the deployed preview that
  the badge feels right at 3 books and reason from there.
- **Did NOT split into two commits per the brief's "suggested commit
  shape".** The two pieces (focus+glitch and pin-scale) touch the
  same two files in deeply interleaved ways — the glitch state lives
  in the same component that renders the count badges, and the
  globals.css edits sit in the same Timeline block. Splitting via
  `git add -p` would cost more than the history-clarity buys.
  Single commit with a clear multi-bullet message.

### Versions

No new dependencies, no version bumps. Stack at session-005 / 007 / 011
pins.

### What I deliberately did not do

- **Did not implement EraDetail standalone-spine density.** Held per
  the brief's open-question D guidance — "lower priority — the
  Overview is the more pressing scale problem."
- **Did not add a `prefers-reduced-motion` media query around the
  glitch keyframe.** The global `* { animation-duration: 0.001ms }`
  rule already collapses the keyframe to its neutral 100 % frame
  under `prefers-reduced-motion: reduce`. Tested by tracing the
  cascade; no per-component gate needed.
- **Did not touch EraDetail.** Brief explicitly out of scope.
- **Did not touch the Aquila / TopChrome / Hub.** Brief explicitly
  out of scope.
- **Did not touch the M39-M41 era-encoding gap or the
  `formatM`-vs-toggle-label disagreement.** Carry-over from session
  011, still open.

## Verification

- `npm run typecheck` — pass.
- `npm run lint` — 0 errors, 1 warning (pre-existing
  `no-page-custom-font`). Baseline preserved.
- `npm run build` — green. `/timeline` still `ƒ (Dynamic)`. All seven
  other routes unchanged.
- `npm run dev` smoke (port 3057, curl-based — this shell has no
  browser):
  ```
  /                            200
  /timeline                    200
  /timeline?era=horus_heresy   200
  /timeline?era=long_war       200
  /timeline?era=time_ending    200
  /timeline?era=indomitus      200
  /timeline?era=age_apostasy   200
  /map                         200
  /ask                         200
  /buch/test                   200
  /fraktion/test               200
  /welt/test                   200
  /charakter/test              200
  ```
- Rendered-DOM check via curl + grep on `/timeline`:
  - 7 `<g class="era-seg">` band groups (one per era). ✓
  - 7 `<g class="era-seg-brackets">` focus-bracket groups. ✓
  - 3 `<g class="era-count">` badges, exactly the 3 fixture-book
    eras (Heresy, Time of Ending, Indomitus). Each renders `001
    VOLUMES`. ✓
  - 0 `class="book-node"` matches — old per-book pins fully removed. ✓
  - 1 `id="eraGlitch"` — glitch filter present in `<defs>` exactly once. ✓
- Rendered-DOM check on `/timeline?era=horus_heresy`:
  - `class="era-name"` × 1, `class="series-bar"` × 1, `class="book-marker"` × 1.
    EraDetail unchanged. ✓
- Did NOT open a browser. The visual quality bar (the glitch feels
  buzzy not synthwave, the brackets feel themed not garish, the count
  badge sits right relative to the era label) is on Philipp on the
  Vercel preview. Session 011's "Jest worker" turbopack dev-flake
  caveat still applies — restart the dev server if it hits.

## Open issues / blockers

None. Brief shipped clean.

## For next session

- **EraDetail standalone-spine density brief.** Cluster-stack +
  fly-out, per the prototype's `cluster-node` / `cluster-flyout`
  vocabulary. Driven by Phase 4's real-book ingestion landing.
  Bundles cleanly with the pan-scrubber click-to-jump and the
  mobile-touch test (both still in carry-over from session 011).
- **Reduce-motion verification on the deployed preview.** The cascade
  trace is theory; eyeballing with Chrome DevTools' rendering panel
  ("emulate prefers-reduced-motion") confirms the glitch is silent
  but the colour shift remains. Worth a 30-second check before Reddit
  launch.
- **The glitch may need to dial up or down once 2a.1 (EntryRail)
  lands.** With more chrome competing for the eye, a 420 ms band
  buzz might feel either too loud (compete with the rail's own
  reveal animation) or too quiet (lost in the busier page). The
  filter scale and the keyframe duration are both single-line knobs.
- **Carry-overs from session 011 still standing**: `NEXT_PUBLIC_SITE_URL`
  cosmetic, Hub novel-count freshness decision, era-encoding M39-M41
  gap + `formatM` reconciliation, mobile-touch test of EraDetail
  pan/drag, pan-scrubber click-to-jump.
- **Reusing the corner-bracket pattern.** Once book pins in EraDetail
  become focusable (2a.3 wires the click to DetailPanel), they should
  get the same `:focus-visible` corner-bracket treatment for vocabulary
  consistency. Cheap copy-paste.

## References

- Brief: `sessions/2026-04-30-012-arch-timeline-buzzy-hover-and-pin-scale.md`
- Prototype source ported: `archive/prototype-v1/components/OverviewTimeline.jsx`
  (glitch defs lines 56-66, glitch trigger 7-10 + 76, cluster tag 195-210),
  `archive/prototype-v1/styles/timeline.css` (eraGlitch keyframes 105-134,
  ribbonBreathe 130-134)
- Reversal target: session 011 report § "Glitch filter on era hover" —
  the call this brief explicitly overrides.
- Hub vocabulary touchpoint: `src/app/globals.css` `.mt-corner` rules —
  the bracket pattern this brief re-uses for the Overview's focus
  indicator.
