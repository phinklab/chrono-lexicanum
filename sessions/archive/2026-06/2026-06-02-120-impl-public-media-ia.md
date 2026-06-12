---
session: 2026-06-02-120
role: implementer
date: 2026-06-02
status: complete
slug: public-media-ia
parent: 2026-06-02-120
links:
  - 2026-06-02-119
  - 2026-06-02-114
  - 2026-06-01-113
commits: []
---

# Public media IA - home, works, podcasts, factions

## Summary

The public site now leads with the media archive: a reframed Home (product
naming + honest `/werke` search), three new public surfaces (`/werke` book
browse with URL-mirrored filters, `/podcasts` show + episode list, `/fraktionen`
media-guide index), and a 7-item nav that drops `/atlas` from the public path.
The one fact worth knowing: everything reuses the existing Archive/Chronicle
list vocabulary and the Home/HUD atmosphere — no new design language, no schema
or image work — so the next brief can build context surfaces on top of stable IA.

## What I did

**New public surfaces (Product strand: `src/app/**`, `src/components/**`,
`src/app/styles/**` only):**

- `src/app/werke/loader.ts` — server-only lean book loader (the visitor-facing
  cousin of `/buecher`'s `loadBooks`): one `works.findMany` fan-out for
  `kind='book'` + relations (bookDetails/series, factions, facets+category,
  author persons), plus an eras select. try/catch → empty hall on DB failure.
- `src/app/werke/filters.ts` — PURE filter/sort contract shared by server + client
  (`q`, `era`, `faction`, `format`, `facet`, `sort`; sort = title|release|chrono).
- `src/app/werke/WerkeFilters.tsx` — `"use client"` URL-mirrored controls
  (search, era/faction/format selects, sort pills, facet-clear chip).
- `src/app/werke/page.tsx` — Server Component; reuses the `.catalogue` gold hero
  + `<details>` row list from `/buecher`, minus the audit columns. Facet/faction
  tags are links that fold into the current filter set (`/werke?facet=…`).
- `src/app/podcasts/loader.ts` + `page.tsx` — loads `kind='podcast'` shows and
  groups flat `kind='podcast_episode'` rows by `podcastWorkId` (no `show`
  relation exists — schema note Brief 114). Year-grouped episode list, newest
  first; Apple Podcasts + RSS links; per-episode "Listen" → audio enclosure.
- `src/app/fraktionen/loader.ts` + `filters.ts` + `FraktionenFilters.tsx` +
  `page.tsx` — guide index. Four grouped-aggregate counts per faction (books,
  podcast episodes, key characters via `characters.primaryFactionId`,
  sub-factions via the self parent edge); cards link to `/fraktion/[id]`.
- `src/app/styles/61-browse.css`, `62-podcasts.css`, `63-fraktionen.css` — new
  partials; wired into `src/app/globals.css` after `60-entity-panel.css`.

**Home + nav reframe:**

- `src/components/chrome/TopNav.tsx` — Archive now → `/werke`; added Podcasts +
  Factions; `/atlas` never was in nav.
- `src/app/styles/42-top-nav.css` — responsive rule: below 1000px the nav drops
  to a flex row with a horizontally-scrollable link strip (the 5→7 item growth
  no longer fits the centred grid); wordmark hidden below 640px.
- `src/components/home/HomeSearch.tsx` (new) + `src/app/page.tsx` — honest Home
  search routing to `/werke?q=…`; hero sub + tools-fold copy renamed the product
  (WH40k novel archive + lore-podcast pillar + faction guide).
- `src/app/styles/50-hub.css` — `.hub-search` styles.
- `src/components/home/ToolsAccordion.tsx` — dropped the Atlas row; added Works /
  Podcasts / Factions (media pillars lead, Works open by default).
- `src/components/chrono/BottomConsole.tsx` — "Books" doorway repointed
  `/buecher` → `/werke`.
- `src/components/ask/ResultCard.tsx` — "All books →" CTA repointed → `/werke`.

## Decisions I made

- **`/werke` reuses the `.catalogue` (gold) shell, not a fresh design.** Maximum
  visual continuity with the Archive reference: same hero photo, fade, ScrollScrim,
  AuspexSweep, FloatingCoord, `<details>` rows. The browse filter bar is a new,
  *cyan-default* `.browse-*` vocabulary that re-skins to gold under
  `body:has(main.catalogue)` — so the same controls serve `/fraktionen` (cyan)
  and `/werke` (gold) without divergence.
- **`/buecher` stays as-is (maintainer audit surface), unlinked from public nav,
  no redirect.** (Open question 1.) Reasons: (a) `src/components/atlas/pages/WerkePage.tsx`
  imports `AuditPills`/`SortPills` from `@/app/buecher`, so the module must stay
  put; (b) the drift/alias/gap/SSOT audit affordances are genuinely useful to
  Philipp and have no place in the public browse; (c) a redirect would strand
  those audit tools. `/buecher` is simply no longer advertised. If you want it
  *gone* from the public surface entirely, the clean move later is to extract the
  shared pills into `src/lib` and redirect `/buecher` → `/werke`.
- **Dropped the `availability` filter.** (Open question 3.) The brief lists it
  "soweit Daten es tragen" — the column is 100% null in the DB today, so a
  select would be a dead control. Everything else (`q`, `era`, `faction`,
  `format`, `facet`, `sort`) is backed by real data and shipped. `facet` has no
  visible select (hundreds of values) but is fully URL-driven: facet tags on a
  row link to `/werke?facet=<id>`, and an active facet shows a clearable chip.
- **Podcast detail routes deferred.** (Open question 2.) The 40k Lorecast is a
  single show with 149 episodes; a year-grouped list with direct
  audio-enclosure "Listen" links + Apple/RSS covers the browse need without a
  per-episode route. **Exact next seam:** a `/podcasts/[showSlug]` route (show
  header + full episode list + synopsis) and optionally
  `/podcasts/[showSlug]/[episodeSlug]`; episode works already have slugs, so it
  is purely additive. The episode list currently renders all 149 rows (no
  pagination) — fine at this size; revisit if a second, larger feed lands.
- **`/podcasts` is static + hourly ISR (`revalidate = 3600`), matching the Home.**
  It reads no searchParams, so it prerenders; ISR lets newly-ingested episodes
  appear without a redeploy. `/werke` and `/fraktionen` read searchParams and are
  dynamic (always fresh).
- **Faction guide: "has-content" gate + "most covered" default sort.** (Open
  question 4.) The DB carries ~200 factions, most with zero media; showing all
  would bury the useful doorways. A faction appears only if it has ≥1 book,
  episode, key character, or sub-faction. Default sort ranks by books desc, then
  episodes, then characters, then sub-factions — i.e. "where is there the most to
  read/listen", which is the best guide effect. An A–Z toggle and an
  Imperium/Chaos/Xenos/Neutral allegiance filter (the `faction_alignment` enum)
  are URL-mirrored. Cards show a thin allegiance-coloured accent.
- **Nav grew 5→7; made it scroll, not wrap.** A wrapping nav would break the
  fixed 48px bar height; instead, below 1000px the bar is a flex row whose link
  strip scrolls horizontally (`min-width:0` lets the flex child shrink below its
  content). The scroll-collapse-to-MENU behaviour is unchanged.
- **`blips` is a boolean on `AuspexSweep`** — first build failed because I'd
  passed it a count; corrected to the default (omitted).
- **URL→input sync without an effect.** `eslint` (`react-hooks/set-state-in-effect`)
  rejects `useEffect(() => setQ(qParam), [qParam])`. Both filter islands now use
  React's "adjust state during render when a prop changes" pattern (compare to a
  `prevQParam` state), which is effect-free and lint-clean.

## Verification

- `npm run build` — **pass** (Next 16.2.4, Turbopack). `/werke` ƒ dynamic,
  `/podcasts` ○ static, `/fraktionen` ƒ dynamic; `/atlas` + `/buecher` unchanged.
  1007 static pages generated without error.
- `npm run lint` — **pass** (clean after the set-state-in-effect fix).
- `npm run typecheck` (`tsc --noEmit`) — **pass**.
- `npm run brain:lint -- --no-write` — **pass** (0 blocking; 15 pre-existing
  warnings in `brain/**`, none related to this strand's files).
- **Runtime smoke test** against `next start` (port 3210): `/`, `/werke`,
  `/werke?q=eisenhorn`, `/podcasts`, `/fraktionen`, `/fraktionen?alignment=chaos`,
  `/buecher` all → 200; `/atlas` → 401 (pre-existing `proxy.ts` middleware
  protection on the maintainer cockpit — expected, not regressed). Confirmed
  content rendered: `/werke` heading + filter bar, `/podcasts` episode rows
  (DB returned the Lorecast), `/fraktionen` faction cards, Home search + Podcasts
  nav item. No server-log errors.
- **Narrow-width check (CSS-reasoned, not screenshot):** nav scrolls below
  1000px / wordmark hidden below 640px; `/werke` row grid drops the maintainer
  "updated" column at ≥1101px and inherits the existing responsive catalogue
  rules below; `/podcasts` episode rows switch to a title-over-meta flex layout
  below 720px; `/fraktionen` grid is `auto-fill minmax(248px→200px, 1fr)`. No
  fixed-width text containers that could overlap. Worth a quick human eyeball on
  a real phone before merge (I can't screenshot here).

## Open issues / blockers

None blocking. Two things deliberately left for the named follow-up brief
("Media-aware context surfaces"):

- The faction entity **back-link** (`src/lib/entity/types.ts` `TYPE_TO_ATLAS`)
  still points `/fraktion/[id]` → `/atlas/fraktionen` (maintainer deck, admin-gated
  → 404 for a public visitor), not the new public `/fraktionen`. I left it because
  it lives on the entity detail/panel surface the brief told me not to touch, and
  it's shared with the `@modal` panel. Repointing it (context-aware: public list
  vs atlas deck) belongs to the context-surfaces brief.
- `/podcasts` has no detail route yet (see decision above).

## For next session

- This is exactly the runway for the **Media-aware context surfaces** brief:
  `/fraktion/[id]` and the `@modal` EntityView can now link facets to
  `/werke?facet=…`, books to `/buch/[slug]`, and (once built) podcast groups to
  `/podcasts/[showSlug]`. The data-driven banner you sketched
  ("12 books / 5 podcast episodes / linked to Prospero") maps directly onto the
  counts `loadFactionGuide` already computes — consider lifting that count logic
  into `src/lib/entity` so the guide index and the detail banner share it.
- If `/buecher` should leave the public surface for good: extract
  `AuditPills`/`SortPills` to `src/lib`, then `/buecher` → redirect `/werke`.
- `availability` is dead data — either a Batches backfill makes it real (then add
  the filter back) or it should be dropped from the public filter spec.
- Consider repointing the faction entity back-link as part of the context brief
  (see Open issues).

## References

- Brief 120 (this brief), Brief 119 (Product north-star), Brief 114 (podcast
  schema: `podcast` / `podcast_episode` works, no `show` relation), Brief 113
  (`@modal` entity panel — left untouched).
- `src/app/buecher/page.tsx` — the Archive reference surface `/werke` is built from.
- `src/db/schema.ts` — `works.kind`, `podcastEpisodeDetails.podcastWorkId`,
  `factions.alignment` / `parentId`, `characters.primaryFactionId`.
