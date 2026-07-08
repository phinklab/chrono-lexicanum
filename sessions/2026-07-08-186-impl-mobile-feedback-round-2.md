---
session: 2026-07-08-186
role: implementer
date: 2026-07-08
status: complete
slug: mobile-feedback-round-2
parent: none            # maintainer-direct session (screenshot feedback after 185)
links: []
commits: []
---

# Mobile feedback round 2 — layout fixes + Cartographer refinements

## Summary

Philipp's phone walkthrough after Session 185 (PR #226) produced six annotated
screenshots plus two general wishes. This session fixes all of them: the
detail-popup Close/burger collision, the native Basic-Auth "Anmelden" popup
(root-caused to a Next prefetch of the protected audit route), a five-point
Chronicle-cinematic mobile pass, four Cartographer refinements (mobile LOD,
sector-label opacity, a three-step zone layer, progressive bottom-sheet drag),
the compendium's horizontal overflow, and a higher-contrast music stud.

## What I did

### 1. Detail popup: Close vs. burger (`43-site-menu.css`)
The burger (z-81) kept painting over the modal's own Close (modal root z-70) —
`DetailModal` only marks it inert. New rule: `body:has([data-detail-modal])
.site-burger` fades out (opacity/visibility, 0.2s) while any detail popup is
open. All breakpoints — the burger is non-interactive there anyway.

### 2. Native Basic-Auth popup — root cause + removal
`src/proxy.ts` guards `/buch/[slug]/audit` with Basic Auth (401 +
`WWW-Authenticate`, prod only). `BookDetailView` rendered a footer link to
that route without `prefetch={false}` — Next's viewport prefetch hit the 401
and Chrome raised the native login dialog whenever a book detail was on
screen. Per Philipp's decision the footer link is **removed entirely**
(`BookDetailView.tsx`; dead `.book-detail__footer` / `.book-detail__audit-link`
rules pruned from `51-book-detail.css`). The audit route itself stays,
Basic-Auth-guarded, reachable by URL.

### 3. Chronicle cinematic, mobile (`67-chronicle-cinematic.css`, `46-site-nav.css`, `56-media-player.css`, `CinematicView.tsx`)
Reworked twice in-session: the first pass letterboxed the art
(`background-size: 100% auto`) and kept the era band as a full-width top
strip — Philipp rejected both ("Fullscreen Background, davon lebt die
Seite"; "der Zeitstrahl ist auf mobile VIEL zu präsent"). Final state:
- **Top-left overlap:** `body.on-chron .site-brand` is hidden ≤760px — the
  wordmark landed exactly between entry counter and era band.
- **Background:** stays full-bleed `cover`; only the -3% overscan goes
  (`inset: 0`) and Ken Burns eases to `--kb-s: 1.03` — slightly less crop,
  still fullscreen. Soft 110px top scrim so the entry counter reads over
  bright skies.
- **Era band demoted:** on phones the band is orientation, not navigation —
  it becomes a quiet dot strip (no names, no dates, no arrows; `--eb-step`
  22 so every era fits the window) centered near the bottom edge at
  bottom:58px, opacity 0.8, z above the sheet gradient. Below the dots a
  mobile-only caption `.cine-band-era` (new element in `CinematicView.tsx`,
  `display:none` on desktop) names the active era — per Philipp's round-4
  ask "mindestens die aktive Era soll drunter geschrieben stehen". The
  short-phone (`max-height:700px`) band overrides were removed — they would
  have re-anchored it to the top.
- **Text raised off the rim:** mode-toggle buttons shrink (13px → 10px/11px
  padding); `.cine-lower` bottom padding grew twice — 86px was still "total
  eingeengt unten am bildschirmrand" (round 4), final value
  `calc(76px + 15vh + safe)` lifts the dossier into the free middle of the
  stage (≈200px on a modern phone; the 76px floor always clears dot strip +
  toggle row). Gradient stops strengthened (0.82 / 0.55@55% / 0.22@82%) so
  the text reads that far up. The music stud moves to the free
  **bottom-left** corner (panel opens left-anchored) — bottom-right belongs
  to the toggle alone.
- **Artwork credit:** the no-credit placeholder ("ADD ARTIST CREDIT") gets an
  `art-credit--empty` modifier (`CinematicView.tsx`) and is hidden on mobile —
  curator affordance, desktop-only. Real credits sit top-LEFT, stacked under
  the ENTRY counter (round 4: the first mobile spot — one label-less line
  under the burger — read as "Artwork fehlt"): ARTWORK label kept, left-
  aligned, top:48+safe, one size down, opacity 0.85.

### 4. Cartographer (`55-map.css`, `zones.ts`, `CartographerRoot/ChartStage/Census/CartoucheSheet.tsx`)
- **Mobile LOD:** ≤900px the label staircase steps one band later via CSS
  only — band 0 shows no world names at all, t0 from band 1, t1 from band 2,
  t2 from band 3. JS band thresholds untouched; `.names` override unaffected.
  3×/6× preset tooltips reworded tier-neutral.
- **Sector labels:** `.cg-rgn` fill-opacity 0.6 → 0.45 (hover still 1).
- **Zone layer, three steps + rename:** `zonesOff: boolean` →
  `zones: "on" | "dim" | "off"` (`ZonesMode` in `lib/map/zones.ts`), reducer
  action `cycleZones`. Census button cycles full → dimmed → hidden, label now
  **"Zones & warp storms"**; dim state renders `svg.zones-dim`
  (`#cg-fields` at 0.45, `.cg-zone-lbl` faded out — labels are separate
  `<text>` nodes). Zone-label opacity got a 0.5s transition; census `.cx.dim`
  style added.
- **Bottom sheet, progressive reveal:** `cg-sheet-body` now always in the DOM
  (inert + `display:none` when closed at rest). Dragging up from the dock
  drives the sheet's **height** from the finger (capped at the CSS max-height
  mirror), class `dragging` reveals the body — content genuinely rises from
  the bottom edge instead of the dock bar sliding up alone. Release keeps the
  existing ±threshold snap; drag-down-from-open stays transform-based.

### 5. Compendium horizontal scroll (`66-compendium.css`, `61-browse.css`, `41-site-bg.css`)
- `.cmp-toolbar` and (≤720px) `.browse-sort` wrap instead of widening the
  page — the faction "ALLEGIANCE IMPERIUM · CHAOS · XENOS · NEUTRAL" line was
  the main offender.
- Root guard: `html:has(main.route-snap)` gets `overflow-x: clip` — the html
  element is the scroller on snap routes, so the existing body-level clip
  never stopped viewport panning.

### 6. Music stud contrast (`56-media-player.css`)
Gold hairline border (`color-mix` 45% gold) + near-opaque glass background
(0.88/0.94 → 0.95/0.98). No glow. Applies everywhere the stud appears.

### 7. Chronicle scroll direction on touch (`67-chronicle-cinematic.css`, `CinematicView.tsx`)
Philipp: advancing by swiping UP feels backwards — the story should be
pulled DOWN toward the reader. The cinematic scroller is a pure proxy
(invisible snap divs; all visuals derive from `t = scrollTop/h`), so
mirroring it with `transform: scaleY(-1)` flips ONLY the touch gesture
mapping — scroll values, snap points and the whole t-driven animation are
untouched. Gated on `(max-width: 760px) and (pointer: coarse)`: the mirror
would invert wheels/trackpads too, so fine pointers keep document
direction. The previous-era pull-back handler checks the same media
condition and accepts the upward swipe when flipped (wheel path unchanged).

### 8a. Map mobile: zoomer removed, stud level with the burger (`55-map.css`, `56-media-player.css`)
Round 5: the +/− / 3× / 6× / home stack bottom-right only crowds the drawer
dock on phones — `.cg-zoomer { display: none }` inside the ≤900px block
(pinch + pan cover it; desktop unchanged). The map music stud dropped from
top:64 to top:10+safe — the map brand sits top-CENTER, so the corner is
free right up to the edge.

### 8b. Site-bg credits removed → /artwork download page
Philipp made the page backgrounds himself — crediting himself on-page is
noise. `BACKGROUND_ART_CREDITS` (lib/art-credits.ts) is now empty (the
registry + `<ArtCreditTag>` mechanism stays for future third-party
backgrounds), which drops the bottom-right credit from Hub / Archive /
Compendium / Ask and the login gate. Replacement: new `/artwork` page in
the legal-document register (71-legal.css `.legal__art*` plates) offering
`main-bg.webp` + `login.webp` as downloads, linked as the third point of
every legal row (site menu, SiteLegal, /login footer) and excluded from
the preview-gate matcher in `proxy.ts` like /imprint + /privacy.
Chronicle era/event credits (third-party artists) are untouched.

Note on "keine Credits auf mobile im Chronicle": not a bug — only
`horus_heresy` and `the_waning` have entries in `ERA_ART_CREDITS`, and few
events carry own credits. Desktop fills the gap with the "ADD ARTIST
CREDIT" curator placeholder; mobile initially hid that placeholder, so
credit-less eras showed nothing — which read as "das Element fehlt".
Round 6: mobile now matches desktop — the slot ALWAYS renders top-left
under ENTRY, placeholder included (the `art-credit--empty` modifier and
its hide rule were reverted). Real names appear as soon as eras/events get
credit data.

### 8c. Lumen/Nihilus follow the drawn Cicatrix Maledictum (`chart-geometry.ts`)
The Lumen-Astronomican mask and the Imperium-Nihilus shade still ran along
the pre-178 placeholder bezier (`RIFT_D`), visibly diverging from the
hand-drawn Portolan rift. The documented TODO is now implemented:
`riftSpine()` derives the shadow boundary from the published
"Cicatrix Maledictum" zone in `zones.json` — vertical-slice midline (31
samples, midpoint of the outermost boundary crossings per slice, two
smoothing passes over the bulges), endpoints at the west/east tips.
Verified numerically: spine (233,254)→(932,552), Terra rays at −124°/+14°,
so the far-circle arc keeps its hardcoded large-arc/sweep flags. Falls back
to the old curve if the zone is renamed/unpublished. `LumenNihilus.tsx`
unchanged except comments; labels (LUX DEVORATA etc.) still sit on the
correct sides of the new spine.

### 8d. /artwork downloads: WebP + high-res JPEG via Supabase Storage
Philipp wants both formats downloadable; the JPEGs (1.8 MB / 1.0 MB) must
not bloat repo/Vercel build. Created PUBLIC Storage bucket `artwork`
(service-role REST) and uploaded `library-nave.jpg` +
`lightless-librarium.jpg`; public URLs verified 200, `?download=` serves
Content-Disposition: attachment (needed — the `download` attribute is
ignored cross-origin). Unlike the signed `Audio` URLs these never expire.
/artwork now offers WebP (same-origin, download attr) and
"JPEG · High-res" (Storage) per piece.

### 8. Burger menu: clipped roman numerals (`43-site-menu.css`)
The desktop name clamp (up to 60px / 6.4vh) let a long single word
("CARTOGRAPHER") outgrow the centered flex row on phones, clipping the
numeral off the left edge. ≤720px: name `clamp(24px, 4vh, 32px)`, gap
26px → 14px, numeral/spacer `min-width` 2.4em → 1.8em.

## Verification

- `npx tsc --noEmit` clean, `eslint .` clean.
- Manual visual check by Philipp (per house rule): book popup (burger gone),
  Chronicle cinematic on a phone (top stack, background fit, bottom strip),
  map (quiet initial view, zone cycle, sheet drag), compendium (no horizontal
  pan), music stud.
- The Basic-Auth fix is fully verifiable only on prod after deploy; locally:
  no `/buch/*/audit` request in the network tab from a book detail.

## Decisions / notes for the wiki rollup

- Zone layer census label renamed to "Zones & warp storms" (Philipp's pick).
- Audit footer link removed site-wide; `/buch/[slug]/audit` route + proxy
  Basic Auth unchanged.
- Self-made background art is no longer credited on-page; downloads live on
  the new `/artwork` page (legal row grew to Impressum · Datenschutz ·
  Artwork; proxy matcher exclusion extended).
- Mobile map has no zoom/home buttons anymore (≤900px, pinch/pan only).
- Mobile audio stud placement rule: bottom-right on every page; exceptions
  Chronicle (bottom-left) and Map (top-left, now level with the burger);
  /login hides the player.
- Era band stays horizontal on mobile (vertical variant deliberately
  rejected, see §3); revisit only if the scrim + declutter pass still isn't
  enough.
- Chronicle mobile music stud now bottom-left (was bottom-right above the
  toggle).
