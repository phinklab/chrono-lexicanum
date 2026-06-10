---
session: 2026-06-11-140
role: implementer
date: 2026-06-11
status: complete
slug: timeline-cinematic-port
parent: 2026-06-10-138
links: [2026-06-10-137, 2026-06-10-139]
commits: []
---

# Timeline Cinematic/Index port — new /timeline from the design prototype, DB-fed

## Summary

`/timeline` is now the Cinematic + Index chronicle from the design export, fed
entirely from the Brief-137 tables (8 eras, 144 events, 223 hooks — zero inline
event data). The port is a re-implementation as React client islands (per-frame
rail animation via refs/rAF, discrete state in React), the CSS landed as a new
scoped partial, and all 19 artworks shipped as WebP (2.59 MB total).

## What I did

- `src/lib/chronicle/viewConfig.ts` — NEW: per-era render tuning (grouping mode,
  minimap `domain`/`ticks`, `groupLabel`, `baseM`, axis transform) keyed by DB
  era id, values from the prototype's data headers remapped onto the 8 DB ids.
  Era-local minimap y derives from scaleY exactly as briefed: `deep_history`
  `y = scaleY/1000` (verified: age_of_terra 1000→1, 15000→15 — identical to the
  prototype's hand-set values), others `y = scaleY − baseY` (gothic_war
  41139→139 on M41's [100,1000] domain). Plus a `fallbackEraView` so a 9th era
  seeded before this file learns of it still charts.
- `src/lib/chronicle/loadTimeline.ts` — NEW server loader: one Drizzle
  relational query (eras → events → event_works → work/series, authors +
  episode numbers nested) + one batched episode→show lookup. Hooks resolve
  server-side to chips `{kind, title, meta, href}`; `displayLabel` wins over
  derived attribution (book default: "G. McNeill"-style abbreviated first
  author; podcast default: `EP. <n>` else show title). Returns `null` on DB
  failure → the page renders an honest "archive unreachable" panel instead of
  a 500.
- `src/lib/work-links.ts` — NEW: `workHref()` + `resolveEpisodeShows()`
  extracted verbatim from `src/lib/entity/loader.ts` (which now imports them),
  per the brief's reuse requirement for the `#ep-` deep-link pattern.
- `src/components/timeline/cinematic/` — NEW client islands:
  - `ChronicleStage.tsx` — mode/era/entry state, era-wipe transition, URL sync.
  - `CinematicView.tsx` — scroll proxy + eased `t/vt` pipeline, 3D rail
    (per-frame transforms via refs), dossier with typewriter, terminus
    crossfade, era intro + entrance dolly + `.wake` chrome cascade, back-pull
    into the previous era, keyboard nav (Arrows/PageUp/Down/Home/End),
    per-event artist credit with "ADD ARTIST CREDIT" placeholder.
  - `IndexView.tsx` — century/millennium/flat grouping, expandable rows,
    sticky era map with offscale pins + the gold on-screen cursor, next-era
    footer.
  - `EraBand.tsx` — sliding-window scrubber ("ERA I/VIII") with ‹ › arrows +
    pointer drag, CSS-var-driven geometry, recenter on era change.
  - `MediaRows.tsx` — chips as REAL `<a target="_blank" rel="noopener">`
    anchors (middle-click/Ctrl+click work natively), shared by dossier + rows.
  - `shared.tsx` — tier marks/roman numerals, `TypedParagraph` (reflow-guarded
    typewriter), SSR-safe `useMediaQuery` (useSyncExternalStore),
    `siteMenuOpen()` guard so timeline key/wheel handlers stay quiet under the
    global menu.
- `src/app/timeline/page.tsx` — REPLACED: awaits `searchParams`, legacy
  redirects (table below), loads the spine, renders the stage. The old
  roster-overlay page logic is gone from the route.
- `src/app/styles/67-chronicle-cinematic.css` — NEW partial (+ one `@import`
  line in `globals.css`): mechanical port of the export's chronicle.css, every
  selector scoped under `.chron`, ids → classes, burger/#site-menu/tweaks
  blocks NOT ported. Fonts bind to the already-loaded next/font variables
  (Cormorant Garamond + IBM Plex Mono — the exact prototype faces).
- `public/timeline/bg/*.webp` — 19 artworks converted from the export PNGs
  (sharp, q80, longest edge ≤2560px): max single file 248 KB, total 2.59 MB
  (budget ≤300 KB each / ~6 MB total). Filenames match the seeded
  `coverRef`/`artworkRef` paths exactly; conversion ran as a throwaway script,
  nothing committed under `scripts/`.

Legacy `?era=` map (server redirect, 307): `M30`→`great_crusade`,
`M31`→`horus_heresy`, `M42`→`indomitus` (kept from the old page),
`age_rebirth`→`horus_heresy`, `long_war`→`the_forging`; the other old ids
exist in the new 8-era map and pass through. Unknown values render chapter I
(no 404). Legacy `?book=<slug>` (pre-138 detail panel) redirects to
`/buch/<slug>` so old shared links don't dead-end.

## Decisions I made

- **URL state instead of localStorage** (brief's open question): `?era=` +
  `?view=index` are mirrored via `history.replaceState` — shareable, survives
  reload, no history spam. The prototype's localStorage resume (and the entry
  index within an era) was deliberately dropped: a shared/reloaded link opens
  the chapter at its era intro, which is the designed entry experience.
- **One artwork per chapter** (prototype parity): the current export renders
  the *era cover* as the cinematic background; per-event `artworkRef`s are in
  the DB but not yet displayed (the prototype's per-event `bg` fields are a
  leftover of an earlier crossfade iteration). The per-event *art credit*
  fields ARE rendered. All 19 images shipped anyway — the 11 event-level
  artworks are ready the moment a crossfade iteration wants them.
- **Component remount per era** (`key={era.id}`) replaces the prototype's
  `loadEra()` DOM rebuild — era data becomes mount-constant, scroll state
  resets for free, the intro shows exactly when an era loads at entry 0.
- **Timeline top chrome shifted below the TopNav** (`top: calc(var(--top-nav-h)
  + …)` for era-bar, scrubber band, mobile credit/back-pull; arch-inner +
  sticky era-map padding likewise): the prototype assumed no top bar. This is
  timeline-internal positioning only — the shell itself is untouched (see
  Open issues for the design question).
- **Series chips → `/archive?q=<series name>`**: the archive has no dedicated
  series param; its free-text `q` matches `seriesName`/titles and is the
  existing shareable filter. See Open issues for the data gap this exposed.
- **Podcast chip title = "Show — Episode"** (e.g. "Lorehammer — The Gothic
  War"), meta = `displayLabel ?? EP. <n> ?? show`: matches the prototype's
  visual where the show name carried the row.
- **Tier/`event_tier` vocabulary** rendered verbatim (◈ EPOCH / ◆ MAJOR /
  ○ MINOR + "· APPROX."); `confidence`/`sourceKind` not rendered (provenance
  only, per brief).
- **DB era names are Title Case** ("Horus Heresy & The Great Scouring") — the
  prototype fed those slots with uppercase data, so the slots
  (.ei-name/.at-name/.t-era-done/.tb-name/.an-name/.wipe-name/.bp-name) carry
  `text-transform: uppercase` instead of touching the data.
- **Chips got a minimal hover state** (gold title on hover) — the prototype
  rendered inert rows; real links need an affordance. Dossier keeps its
  `pointer-events: none` umbrella; only the anchors re-enable.
- **No new dependencies**; images converted with the already-present `sharp`.

## Verification

- `npx tsc --noEmit` — pass. `npm run lint` — pass (one react-hooks finding
  during development, fixed by moving `useMediaQuery` to
  `useSyncExternalStore`).
- Dev server restarted clean (no stale instances, `.next` removed; one fresh
  `npm run dev` left running for handover). No errors/warnings in the server
  log across all checks below.
- `GET /timeline` → 200; SSR markup contains both views, era intro, scrubber
  band, ERA MAP, deep-history content + war-in-heaven.webp.
- Redirects (curl): `?era=age_rebirth` → 307 `?era=horus_heresy`;
  `?era=long_war&view=index` → 307 `?era=the_forging&view=index` (view
  preserved); `?era=M30` → `?era=great_crusade`; `?era=horus_heresy&book=
  eisenhorn-xenos` → `/buch/eisenhorn-xenos`; `?era=nonsense` → 200 chapter I.
- Chips (SSR, `?era=time_ending`): 26 book chips `href="/archive?focus=<id>"`,
  20 podcast chips `href="/archive/podcasts/<show>#ep-<workId>"` (lorehammer /
  adeptus-ridiculous / luetin09 — Gothic War's Lorehammer chip among them);
  `?era=the_forging`: series chip `href="/archive?q=The%20Beast%20Arises"`.
- Chip targets: `/archive?focus=<battle_of_the_fang's work id>` SSRs the
  `CompendiumFocusOpener` → `/buch/battle-of-the-fang` (impl-139 popup path
  confirmed live).
- Minimap: deep-history renders 2 dashed offscale pins (War in Heaven, Birth
  of the Emperor) at the axis top; "ERA MAP · DASHED = PRE-SCALE" label.
- WebP: 19 files, max 248 KB, total 2.59 MB.
- DB sanity (read-only): 8 era rows with full editorial copy + coverRefs, 144
  events, 223 hooks (95 book / 125 podcast-episode / 3 series), 0 art credits
  (placeholder UI renders, as designed).
- NOT verified (per the no-headless-verify rule): in-browser look & feel,
  scroll/keyboard/touch feel, new-tab focus behavior per browser — Philipp
  eyeballs in the browser.

## Open issues / blockers

- **TopNav collides visually with the cinematic view** — the page works (its
  own chrome sits below the bar; the window never scrolls so the bar never
  collapses), but the cinematic mode now has the TopNav wordmark + links
  floating over the artwork at the top, doubling up with the burger as
  navigation. The prototype was designed with ONLY the burger top-right.
  Whether /timeline hides/restyles the shell is the separate design decision
  the brief reserved — needs a Cowork call.
- **Series-chip data gap**: of the 3 series hooks, only "Gaunt's Ghosts"
  yields archive results via `?q=` (matched on book titles). "The Beast
  Arises" and "Dawn of Fire" have ZERO catalog books (no `book_details`
  rows reference those series ids — checked live), so their chips land on an
  empty filtered archive until the catalog grows. Chip pattern is correct;
  the gap is Batches-strand catalog completeness.
- **MediaPlayer (global, fixed bottom-left, z 40) overlaps the mobile dossier**
  (bottom sheet) and sits inside the cinematic frame on desktop. Same family
  as the TopNav question: global chrome vs. full-bleed surface.

## For next session

- The shell-on-/timeline design decision (hide TopNav? collapse to burger-only
  like the prototype? same question for MediaPlayer on mobile).
- Roster retirement (brief already plans it): `src/lib/chronicle/roster.ts`,
  `src/components/timeline/chronicle/*`, `DetailPanel` timeline usage,
  `20-timeline-shell.css`/`57-chronicle.css` and the `SiteBackground`
  chronicle variant are now dormant on this route — sweep them once the DB
  path is proven in the browser.
- Catalog backfill for The Beast Arises / Dawn of Fire books (or a dedicated
  series filter param in the archive, which would also make the Gaunt's
  Ghosts chip exact instead of title-match-based).
- Artist credits: all 144 events have NULL credit fields → every entry shows
  the "ADD ARTIST CREDIT" placeholder; worth a curation pass.
- Optional polish, parked for `docs/ui-backlog.md` once eyeballed: per-event
  background crossfade (assets already shipped), mobile fine-tuning beyond the
  ported breakpoints.

## References

- Porting source: `design-export/` (Chronicle Timeline.html, chronicle-app.js,
  chronicle.css, chronicle-data*.js) — untracked, per brief.
- Brief 137 impl (data foundation) + impl 139 (`?focus=` opener, `#ep-` hash
  highlighting, global SiteMenu) — both verified live on `main` before start.
