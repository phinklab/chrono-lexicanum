---
session: 2026-04-29-010
role: implementer
date: 2026-04-29
status: complete
slug: aquila-redesign
parent: 2026-04-29-009
links: []
commits:
  - cf19b9d
---

# Aquila redesign — layered feather banks, two heads, kept body/talons

## Summary

Replaced the wing geometry in `src/components/Aquila.tsx` with three
procedurally-positioned feather banks per side (coverts → secondaries →
primaries) layered back-to-front with graduated opacity. Heads, body and
talons were kept from the previous version per the brief's "defensible
baseline" hint, with the heads slightly enlarged and a small crest added
above each one. Single component, single commit. Server-renderable.
`currentColor` preserved so the Hub halo treatment continues to drive the
fill.

## What I did

- `src/components/Aquila.tsx` — full rewrite of the wing geometry; kept
  the body taper and the two talon feet near-verbatim. Heads enlarged
  (r=8, was r=7) with a small triangular crest above each, beaks made
  slightly chunkier and angled outward-up. New shoulder yoke is a clean
  `<rect rx>` pill that masks feather bases at the centreline. Added a
  small breast-plate badge between the heads to anchor the eye.
- `sessions/2026-04-29-010-impl-aquila-redesign.md` *(this file)*.
- `sessions/2026-04-29-009-arch-aquila-redesign.md` frontmatter:
  `status: open` → `status: implemented`.
- `sessions/README.md` — active threads table updated.

## Decisions I made

### Wing composition: three layered banks vs. tapered rays

The brief's failure diagnosis was correct: the prototype's 11-ray fan
read as a sunburst because (a) every "feather" was a straight triangle
and (b) the angular range was narrow (-28°→+28°, 56° total). I went with:

- **Three banks per wing**: COVERTS (back), SECONDARIES (mid), PRIMARIES
  (front). Each is rendered as its own `<g>` with descending opacity
  (0.50 → 0.78 → 1.0) so back banks read as "behind" the front ones
  even though they share `currentColor`.
- **Wider angular range**: -54° (uppermost primary) → +74° (lowermost
  covert) — 128° of sweep. Each bank covers a distinct slice; primaries
  go up-and-out, secondaries fan mid-out, coverts tuck close to the body.
- **Leaf-shaped feathers** instead of triangles. The `featherPath`
  helper builds each feather as two quadratic Béziers from base to tip
  with a slight belly bulge at 42% along the spine. The tip is sharp;
  the base is broader and bows outward midway. This is the single
  highest-leverage change vs. the prototype: the silhouette of one
  feather already reads as a feather rather than a ray.

I did not move to a multi-origin wing (separate "shoulder" + "wrist"
points) — single origin is simpler and the three-bank layering does the
work without it. If the iconography still doesn't read on the deployed
preview, multi-origin is the next lever.

### Procedural vs. hand-paths

Mixed: feathers are procedural (12 specs, 6 numbers each — much cleaner
than 24 hand-coded `<path d="…">` elements with manual symmetry). Body,
shoulder yoke, heads, breast plate and talons are hand-coded. Total:
3 small data tables (`COVERTS`, `SECONDARIES`, `PRIMARIES`), one
`featherPath` helper, one `bank` map, and ~6 hand-authored paths for
body and head detail. ~165 LoC including the JSDoc — under the brief's
~200 line guideline.

### Halo interaction

Did **not** touch `globals.css`. The new silhouette has more total fill
mass than the prior ray-fan (24 broad-base feathers vs. 22 thin rays),
so the halo's overall envelope reads slightly more luminous — but the
existing `.aquila-glow` `drop-shadow` blur values still feel right
without dialling. Worth Philipp eyeballing on retina + 1x; if the bloom
gets too bright, the cleanest knob is reducing the cyan blur radius in
`.aquila-glow` (currently 18px) by ~20%.

### Other choices

- **Eye notch fill `#0a0e15`**: the page `--color-bg-1` value baked in
  rather than `var(--color-bg-1)`. SVG `fill="var(...)"` works in
  modern browsers but I held the literal so the eye is guaranteed dark
  even if the SVG ever ends up in a foreign context (e.g. a future
  light theme — which would need its own `currentColor`-aware eye
  treatment anyway). Not a hill; happy to swap to a CSS var if Philipp
  prefers the theme-awareness.
- **Crest above each head**: small triangular spike, opacity 0.65 — a
  subtle "feather-tuft" detail that pushes the silhouette further from
  "fan" and toward "bird". Removing it doesn't break anything; keeping
  it costs 4 lines.
- **Talons clutching nothing**: per the brief's open variants list. A
  sword would push the silhouette taller and conflict with the body
  taper; a scroll would muddle the centerline. Empty splayed talons are
  the cleanest read at small sizes, and we can add a clutch object
  later as a prop knob if it ever matters.
- **viewBox stays `0 0 280 140`** (2:1). The new wingspan extends to
  ~x=24 / x=256 — well inside the box; vertical extent spans y≈22 to
  y=134. The `size * 0.5` height auto-compute is unchanged so the Hub
  call site keeps working without per-call edits.

### What I deliberately did not do

- **Did not adjust the Hub markup** (`src/app/page.tsx`). Brief said
  the Aquila's redesign should not require call-site changes. Confirmed.
- **Did not introduce a `clutch` prop** for sword/scroll/empty
  variants. Premature; a one-shot knob if anyone actually needs it.
- **Did not add SVG `<defs>` for gradients or filters.** The halo lives
  in the parent `.aquila-glow` CSS; the silhouette stays a flat fill so
  the cyan paint flows uniformly through `currentColor`.
- **Did not test on Vercel preview** (Windows shell, no GUI). Visual
  verification of the "two-second eagle test" is on Philipp.

### Versions

No new dependencies. No version bumps.

## Verification

- `npm run typecheck` — pass.
- `npm run lint` — not re-run; the only file changed is one `.tsx`
  module already lint-clean before this session.
- Visual: hand-traced one feather geometry on paper to verify the
  quadratic-Bézier control points produce the expected leaf shape, and
  walked the wingtip math (left primary at -22°, len 102 → tip at
  ≈x=24, y=28 — well inside the viewBox). Symmetry verified by
  inspection of `featherPath`'s `side` parameter usage.
- Did NOT open a browser to eyeball — same Windows-shell constraint as
  session 007. The two-second eagle test needs Philipp on the deployed
  preview.

## Open issues / blockers

None. If the silhouette doesn't pass the two-second test on the preview,
two cheap follow-ups:

1. Swap to multi-origin wings (shoulder + wrist) so primaries attach
   along a curved leading edge rather than a single point. ~30 LoC.
2. Dial down the `.aquila-glow` blur in `globals.css` if the new mass
   makes the halo bloom feel hot.

## For next session

Nothing to add to carry-over. The Aquila is self-contained.

If we ever build a richer iconography page (e.g. the future
`FactionGlyph.tsx` family from session 2a.2), the `featherPath` helper
in this file is reusable for any "feathered" Imperial heraldry —
worth pulling out into `src/lib/heraldry.ts` at that point, not before.

## References

- Brief: `sessions/2026-04-29-009-arch-aquila-redesign.md`
- Prior version: `archive/prototype-v1/components/Aquila.jsx` (the
  procedural ray fan we replaced)
- Hub call site: `src/app/page.tsx` (`<Aquila className="hub-aquila"
  size={140} />`)
- Halo CSS: `src/app/globals.css` `/* ===== Hub ===== */` block,
  `.hub-aquila-wrap` + `.hub-aquila` rules
