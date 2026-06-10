---
session: 2026-06-10-138
role: architect
date: 2026-06-10
status: open
slug: timeline-cinematic-port
parent: 2026-06-10-137  # data foundation — MUST be applied (DB live) before this session starts
links: [2026-06-10-137, 2026-06-10-139]
commits: []
---

# Timeline Cinematic/Index port — new /timeline from the design prototype, DB-fed

> **Strand: Product** (`chrono-lexicanum-product`). UI port + loader + assets.
> **Hard dependency:** Brief 137 (events/eras/event_works tables seeded in
> Supabase) must be merged *and applied* first — this page reads those tables.
> **Also required on `main`:** the Archive/SiteMenu PR (impl 139) — it provides
> the chip targets (`/archive?focus=`, `/archive/podcasts/…#ep-…`) and the
> global burger nav this brief assumes.

## Goal

Replace the current `/timeline` page with the new Cinematic + Index timeline from
Philipp's design prototype: 8 era chapters, one artwork per chapter, event cards
with book/podcast media chips, era scrubber ("ERA I/VIII"), minimap — fed from
Postgres instead of the prototype's inline demo data.

## Context

- **Load the `/frontend-design` skill at session start** (before writing any UI
  code). This is a porting/UI session; the skill's design discipline applies to
  every component built here. The prototype defines the target look — the skill
  governs *how* the React/Tailwind implementation gets there cleanly.
- **Expect a real port, not a copy.** The export was built by Claude Design
  outside our stack (vanilla JS + standalone HTML/CSS, no Next.js, no React, no
  Tailwind, no App Router). Assume *nothing* drops in as-is: interaction code is
  re-implemented as React components (spec below), CSS is adapted into the
  partial system, data wiring is replaced by the DB loader. Budget the session
  accordingly.
- **The prototype is the porting source.** Philipp copies the exported folder into
  this worktree root as `design-export/` (git-ignored / untracked — like the
  original HTML prototype: *port forward, don't edit, don't commit*). Key files:
  - `Chronicle Timeline.html` + `chronicle-app.js` — full interaction model:
    cinematic per-event view (bg artwork, date band, blurb, media chips, artist
    credit bottom-right), era intro screens, index/archive view with
    century/millennium/flat grouping, minimap with ticks + offscale pin, era
    scrubber band, keyboard/wheel/touch nav, era terminus → next-era handoff.
  - `chronicle-data.js` / `chronicle-data-2.js` — the **shape** the UI consumes
    (era: id/m/name/short/sub/tagline/intro/cover/grouping/groupLabel/baseM/
    domain/ticks; event: title/dateLabel/y0/y1/offscale/tier/approx/note/bg/
    media[]/art). Its demo *content* is superseded by the DB.
  - `chronicle.css` — visual language; port into the `src/app/styles/` partial
    system (new partial(s), follow the numbering convention).
  - `tweaks-panel.jsx`, `chronicle-tweaks.jsx`, `ios-frame.jsx`,
    `Mobile Preview.html`, `Timeline Wireframes.html`, `screenshots/`,
    `uploads/` — dev/preview shells and reference material, **do not port**.
  - The export's HTML also carries a **burger button + full-screen `#site-menu`**
    (Philipp's navigation design). That nav is **already live on `main`** as
    global app-shell chrome (impl 139: `src/components/chrome/SiteMenu.tsx`,
    mounted in `layout.tsx` next to the still-present `TopNav`; burger z 81,
    menu z 80). **Do not port the prototype's burger/menu markup** — port only
    the timeline-internal nav (era bands, mode toggle, scrubber, minimap). The
    prototype was designed *with* the burger top-right, so the global one
    should slot in visually; if the TopNav top bar collides with the cinematic
    view, flag it in the report — hiding/restyling the shell on `/timeline` is
    a separate design decision, not this session's call.
- **Data source (from Brief 137):** `eras` (8 rows, with `short/mLabel/sub/tagline/
  intro/coverRef`), `events` (144, with `eraId/sortIndex/tier/approx/dateLabel/
  blurb/artworkRef/artCredit*`), `event_works` (resolved hooks with role,
  displayLabel, position). Server-side loader only — `src/db/client.ts` never
  reaches a `"use client"` file.
- **View config stays in code:** grouping mode, minimap `domain`/`ticks`,
  `groupLabel`, `baseM` per era are render tuning — keep them in a frontend config
  keyed by `eraId` (successor of `CHRONICLE_ERAS` in `src/lib/chronicle/roster.ts`;
  the prototype data files carry working values for all 8 eras to start from).
- Era-local minimap coordinates derive from scaleY — no stored y values:
  - `deep_history`: `y = scaleY / 1000` (axis unit = millennia, domain ~[0,31]);
    `offscale` rows pin at the axis top (prototype behavior).
  - everything else: `y = scaleY − eraBaseY` (e.g. M30: −30000; Forging
    millennium-grouping uses `baseM` exactly like the prototype).

## Media chips — required behavior (Philipp, 2026-06-10)

Chips are **not** bespoke elements; they reuse the site's existing deep-link
patterns:

- **Podcast chip** → the parent show's archive with the episode expanded,
  scrolled-to and highlighted: `/archive/podcasts/<showSlug>#ep-<workId>` —
  exactly the existing pattern from entity panels (`workHref()` in
  `src/lib/entity/loader.ts` already emits this route since impl 139; the hash
  effect in `PodcastEpisodeArchive` works on a fresh document load, so it
  survives new-tab opening). Reuse/extract that helper rather than duplicating
  it.
- **Book chip** → the book **popup over the archive catalog**, not the bare
  full page: link to `/archive?focus=<workId>`. This **already works** (impl
  139): `src/app/archive/page.tsx` reads `?focus=`, resolves the id via
  `bookSlugById()` (robust against catalog filters/limits) and renders
  `CompendiumFocusOpener` into the `@modal/(.)buch/[slug]` intercept →
  DetailModal popup. Unknown ids degrade to a no-op. Nothing to build here —
  just emit the link.
- **Series chip** (series-level hooks like Gaunt's Ghosts) → `/archive` filtered
  to that series (existing series filter param), new tab, no popup.
- **Both kinds open in a new tab and should NOT steal focus.** Reality check the
  implementer must respect: browsers do not reliably let a page open a true
  background tab — that's user-gesture territory (middle-click/Ctrl+click, which
  plain `target="_blank"` links support natively). Ship real anchors with
  `target="_blank" rel="noopener"`; if you find a robust non-hacky way to keep
  focus (don't fight popup blockers), use it, otherwise document the actual
  behavior per browser in your report. **No `window.open` chip buttons that break
  middle-click/Ctrl+click.**

## Deliverables

1. **New `/timeline` page** (replaces the current one): Cinematic view + Index
   view per the prototype, server-loaded data, client island(s) for interaction.
   Match the prototype's behavior; where React/Next idiom demands deviation,
   deviate and note it in the report.
2. **Loader** (e.g. `src/lib/chronicle/loadTimeline.ts`): eras + events + hooks in
   one or two queries; hooks resolved to chip data `{ kind, title, attribution,
   href }` server-side (book title/author from `works`+`bookDetails`, episode
   show-slug join for the `#ep-` href, series name from `series`). `displayLabel`
   from `event_works` wins over derived attribution when present.
3. ~~`?focus=` opener~~ — **already shipped** (impl 139) as
   `/archive?focus=<workId>`; this session only emits links to it.
4. **Artwork assets:** optimize the 19 prototype PNGs (`design-export/assets/bg/`,
   ~2 MB each) to WebP (quality ~80, target ≤300 KB each) at
   `public/timeline/bg/<same-basename>.webp`. The DB `coverRef`/`artworkRef`
   strings from Brief 137 already point at exactly these paths — filenames must
   match. Artist-credit UI: render `artCreditName`/`artCreditUrl` when present,
   prototype's "ADD ARTIST CREDIT" placeholder otherwise.
5. **Legacy `?era=` redirects:** old era ids that vanish must not 404 or dead-end —
   map `age_rebirth` → `horus_heresy`, `long_war` → `the_forging` (its M32–34
   majority), others map to themselves; land on the new page's matching chapter.

## Constraints

- Strand worktree: **never write `brain/**` or `sessions/README.md`**; facts go in
  the impl report.
- Server components by default; `"use client"` only where the interaction model
  needs it. No `process.env` in client components.
- CSS lands in the `src/app/styles/` partial system; don't regress the partial
  split (no monolith re-growth, no `globals.css` dumping).
- Don't make `npm run dev` slow; the artwork must not enter the JS bundle (plain
  `<img>`/CSS backgrounds from `public/`, lazy where sensible).
- `roster.ts` stays untouched this session (the 87-entry overlay is retired in a
  later brief once the DB path is proven).
- No headless screenshot/CDP verify harness — `tsc` + `eslint`, restart the dev
  server clean, Philipp eyeballs in the browser.

## Out of scope

- Any schema/seed/apply change (Brief 137 owns those; if data looks wrong, flag
  it in the report — `status: needs-decision` if blocking).
- Porting `tweaks-panel.jsx` / `chronicle-tweaks.jsx` / `ios-frame.jsx` /
  `Mobile Preview.html` / `Timeline Wireframes.html` / `screenshots/` / `uploads/`.
- Porting the prototype's burger + `#site-menu` (already live on `main` since
  impl 139 — see Context).
- Music player, HUD, Map — unrelated Product surfaces.
- Committing `design-export/` or the raw PNGs.

## Acceptance

The session is done when:

- [ ] `/timeline` renders all 8 chapters from the DB (zero inline event data),
      Cinematic + Index views, scrubber, minimap incl. deep-history offscale pin.
- [ ] Podcast chip on an event (e.g. Gothic War) opens
      `/archive/podcasts/<show>#ep-<id>` in a new tab with the episode
      highlighted.
- [ ] Book chip opens `/archive?focus=<id>` in a new tab showing the book popup
      over the archive catalog; middle-click/Ctrl+click still work natively.
- [ ] 19 optimized WebP files under `public/timeline/bg/`, total ≤ ~6 MB.
- [ ] Old `?era=` values redirect into the matching new chapter.
- [ ] `npx tsc --noEmit` + `npm run lint` green; dev server restarted clean for
      handover (stale-`.next` discipline).
- [ ] Impl report written, brief status flipped inside the code PR.

## Open questions

- Cinematic view on small screens: the prototype's `Mobile Preview` suggests a
  simplified mobile mode — how far did you get within budget, what's deferred?
  (Deferred mobile polish goes to `docs/ui-backlog.md`, which Product owns.)
- Does the Index view want URL state (`?view=index&era=…`) for shareability?
  Cheap if it falls out of the routing anyway — your call, report it.

## Notes

- The prototype's interaction code is vanilla JS over `window.CHRONICLE_ERAS`;
  treat it as a spec, not as code to transplant. The CSS is closer to portable.
- Event blurbs and era intro copy are **English** (matches the 40k source
  material) — confirmed direction for this page; don't germanize.
- `confidence`/`sourceKind` exist on every event but are not rendered (provenance
  only) — same as the prototype.
