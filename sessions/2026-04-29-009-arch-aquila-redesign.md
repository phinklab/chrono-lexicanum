---
session: 2026-04-29-009
role: architect
date: 2026-04-29
status: implemented
slug: aquila-redesign
parent: null
links:
  - 2026-04-29-006
  - 2026-04-29-007
commits: []
---

# Aquila redesign — make the silhouette read as a canonical W40k two-headed eagle

## Goal

Replace `src/components/Aquila.tsx` with a silhouette that reads, at a glance, as the canonical Imperial Aquila — two-headed eagle with spread wings — not as the abstract sunburst-fan it currently looks like. Single component, single commit, ~200 lines max of TSX.

## Design freedom — read before everything else

You have the **frontend-design skill** installed for this brief. Use it. The Aquila redesign is, fundamentally, a design task. Composition, proportions, feathering technique (procedural rays vs. layered banks vs. solid-mass wings vs. some hybrid), aspect ratio, head profile geometry, talon styling, central body mass, whether the wings flare up or sweep down — all **yours to make**. This brief is intentionally underspecified at the visual level: I describe *what the eagle must read as*, not which `<path d="...">` strings to author.

What this means concretely:
- I'll tell you "two distinct head profiles, beaks pointing outward-up." I will *not* prescribe head radius, eye position, or beak length.
- I'll tell you "wings should read as layered feather banks, not a single fan of rays." I will *not* tell you how many feathers per bank, what the mid-wing flare ratio should be, or whether to use Bezier curves vs. straight-edge polygons.
- I'll tell you "central body has vertical mass — chest, abdomen, talons clutching something." I will *not* prescribe what the talons clutch (canon variants exist: nothing, sword, scroll, twin-arrow). Pick what serves the silhouette.

The architectural constraints below (inline SVG, `currentColor`, prop API, server-renderable, no new deps) are **non-negotiable** — they describe how the component integrates with the Hub's existing halo treatment and with the rest of the codebase. Everything aesthetic is your call. The quality bar is: a Warhammer fan glancing at the Hub for two seconds says "that's an Aquila" without prompting.

## Context

The current Aquila (`src/components/Aquila.tsx`, 113 lines) is a procedural fan of 11 tapered rays per wing, originally ported from the prototype's `Aquila.jsx`. On the Hub at `/`, it sits inside the cogitator-eyebrow header with the cyan halo treatment shipped in session 007 (`var(--color-lum)` glow + radial-gradient pseudo + double drop-shadow). The halo lands well; the silhouette underneath does not. The wings read as horizontal sunburst rays rather than as the layered, spread feathers of the canonical Aquila. The two heads are distinguishable but the overall composition is closer to a sun emblem than to the eagle.

Reference points: any Black Library novel cover (Horus Rising, Eisenhorn: Xenos, Siege of Terra). The canonical silhouette has:

- Two distinct head profiles, beaks pointed outward-up.
- A clear central body with vertical mass (chest, abdomen, talons clutching something — often a sword, a scroll, or simply pointing down).
- Wings that read as **layered feather banks**, not as a single fan of rays. Top of wing flares outward and slightly up; bottom of wing tapers downward.
- A horizontal yoke connecting the two heads at the shoulders.

## Constraints

- **Stay inline SVG**, not a raster, not an image asset. The Hub's halo treatment depends on inline SVG so the cyan `var(--color-lum)` color paints through `currentColor`.
- **Keep `fill="currentColor"`** on the root `<svg>` so the halo styling continues to work without per-path color edits.
- **Keep the existing prop API** (`AquilaProps extends Omit<SVGProps<SVGSVGElement>, "viewBox" | "fill">`, optional `size?: number` defaulting to 180). The Hub renders the Aquila inside its eyebrow block; don't break the call site.
- **Pure server-renderable.** No `'use client'`. No state, no effects.
- **`aria-hidden="true"`** stays; this is decoration.
- **viewBox can change** if a different aspect ratio reads better — currently `0 0 280 140` (2:1 wide). If you redesign as 1:1 or 3:2, fix the auto-height computation in the component (currently `height={size * 0.5}`) so callers don't need to know the new ratio.
- **No new dependencies.** Hand-authored SVG paths only. Helper math (e.g. parametric feather positioning) is fine if it reads cleaner than 50 hand-coded `<path d="...">` elements; pure decoration on the function side, not a new package.

## Out of scope

- The halo / glow CSS. Those live in `src/app/globals.css` (`/* ===== Hub ===== */` block, the `.aquila-glow` class and the `::before` pseudo-element with the radial gradient). Don't touch unless the new silhouette demonstrably needs the blur values dialed (see Open Question 2 — explain in the report if you do).
- The cogitator eyebrow markup that wraps the Aquila on `/`. The Aquila's internal redesign should not require call-site changes anywhere.
- Any other Imperial heraldry — no FactionGlyph rework, no Inquisition seal. Just the Aquila on `/`.
- Adding the Aquila to other routes. It's the Hub's element today; leave it that way.

## Acceptance

The session is done when:

- [ ] On the Hub at `/`, the Aquila reads, at first glance from across a desk, as a two-headed eagle (not a sunburst). Quality bar: a Warhammer fan glancing at the screen for two seconds says "that's an Aquila" without prompting.
- [ ] The cyan halo treatment from session 007 still lands — same `currentColor`-driven rendering, same `drop-shadow` filters fire, same radial-gradient pseudo-element behind it. No visible regression in the halo's overall envelope.
- [ ] The Hub's call site renders at the same approximate footprint (within ±10% in either dimension). If the redesign needs a different aspect ratio, the call site still works without per-call edits.
- [ ] Component file stays in `src/components/Aquila.tsx`, server-renderable, no `'use client'`, no new deps.
- [ ] `npm run typecheck` passes; `npm run lint` baseline preserved (still only the existing `no-page-custom-font` warning).
- [ ] `npm run build` green; visual regression check on the Vercel preview.

## Open questions for your report

1. **Design choices.** What overall composition did you land on — feather banks vs. tapered rays vs. solid-mass wings? How many distinct path elements? What proportions did you use (head-size to body-size to wing-span)?
2. **Halo interaction.** Did the new silhouette compose cleanly with the existing drop-shadow + radial-gradient halo, or did the halo treatment need a tweak in `globals.css`? If the halo block needed any change, describe and justify.
3. **Procedural vs. hand-paths.** The existing Aquila uses procedural ray generation (`makeWing` with `Math.cos`). Did you keep a procedural approach for the wings, go fully hand-coded, or mix the two? Trade-off you're optimising for.
4. **References looked at.** A short list (cover names, search terms) so the next time someone redesigns this we have the same starting point.

## Notes

- **The existing body / talons / heads block** in `src/components/Aquila.tsx` reads acceptably — it's principally the wings that fail. If you keep the body/talons/heads geometry and only rebuild the wings, that's a defensible scope. Say so in the report and we'll have a clean baseline to revisit if it still doesn't read.
- **Frontend-design skill** is fair to invoke if you want a second opinion on proportion. Aquila silhouette work is firmly inside its remit.
- **Calibrate by eye.** The halo's `drop-shadow` blur values were tuned against the current ray-fan silhouette. A denser, more solid silhouette may push more luminance through; you may need to dial back blur or opacity. Adjust in `globals.css` only if the bare halo regression is real on the Vercel preview, and document in the report.
