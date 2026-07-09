---
session: 2026-07-09-190
role: implementer
date: 2026-07-09
status: complete
slug: ui-refinements-great-journeys
parent: none (direct maintainer session, no architect brief)
links: []
commits: []
---

# UI-Refinements + Great Journeys (Session 190)

## Summary

Six maintainer asks in one Product-strand session: four targeted UI fixes (archive sort, mobile vox anchoring, Chronicle media disclosure, Lumen reach/brightness), design prototypes for the `/ask/fraktion` hierarchy problem under `public/lab/ofob/`, and the map routes rebuilt into **"Great Journeys"** — a data-driven voyage module with a guided cinematic tour, 7 journeys researched from Lexicanum/Fandom, and one new chart pin (Luna). The old `routes.ts` is retired; "The Path of Heresy" is absorbed into the new Horus journey.

Three feedback rounds landed mid-session: (1) the first prototype round (A/B/C) was rejected as "altbacken"/too boxy — a second round (D/E/F) replaces frames with **ground-tone grouping** and dresses all 18 factions with real data; (2) the journeys were "VIEL zu kurz" — an in-depth research pass (six parallel web agents on Lexicanum + Fandom) expanded them to 10–21 stations each; (3) the maintainer picked **Cameo** (sharp corners), cut "The Master of Mankind" (overlaps the Great Crusade), had Horus start at Ullanor, ordered an em-dash/AI-speak purge of all act texts, replaced the end-of-journey all-acts tableau with a single dismissible final-act card, and commissioned two new journeys (Jaghatai Khan, Farsight) plus an Indomitus expansion. A fourth round (2026-07-10) rebuilt the Cameo prototype as a verbatim clone of the live vocabulary (Sternwarte buttons, token metrics) and added **leg waypoints** for off-chart "on the way" beats. Final roster: **8 journeys, 101 acts** (90 stations + 11 waypoints; was 7/45 at session start).

## What I did

### Punkt 1 — "Timeline" sort retired
- `src/app/archive/filters.ts` — removed `chrono` from `SortKey`, `SORT_OPTIONS`, `parseSort`, and the `compare()` branch. Stale `?sort=chrono` URLs degrade to "Title A–Z".
- `src/app/archive/WerkeFilters.tsx` — replaced the raw param cast with a real parse so client pill state degrades identically to the server.
- Note: `BrowseBook.startY/endY` in `src/app/archive/loader.ts` are now consumer-less (payload-only win, left for ui-backlog).

### Punkt 3 — GhostReadout (vox) page-anchored on phones
- `src/app/styles/46-site-nav.css` — `.site-vox { position: absolute }` inside the existing ≤980px block. Every `<main>` is `position: relative` (10-base.css:68) and starts at y=0, so the load position is identical but the vox scrolls away with the hero instead of riding the viewport. Desktop stays fixed. Comment updated in `src/components/chrono/GhostReadout.tsx`.

### Punkt 4 — Chronicle media disclosure
- `src/components/timeline/cinematic/CinematicView.tsx` (`MediaSegment`) — label is now two always-rendered spans, CSS-toggled at 760px (SSR-safe): desktop `BOOKS & PODCASTS` (inert heading, gold hairline kept), mobile `SHOW/HIDE {n} BOOKS & PODCASTS ▸` (count gold via `.m-n`). "LIBRARIVM —" dropped on both. `.m-count` removed.
- `src/app/styles/67-chronicle-cinematic.css` — desktop hides `.m-txt--tap`; mobile hides the gold `::before` hairline and `.m-txt--wide`, keeps caret rotation.

### Punkt 5 — Lumen Astronomican
- `src/components/cartographer/LumenNihilus.tsx` — `LR` 470 → **618** (Terra→Macragge = 608.7 gu ≈ the lore's ~70k ly; 618 keeps the rim ring off the Macragge pin). Light stops 0.14/0.06/0.02 → **0.26/0.13/0.05** (mid stop pulled 55%→45%, outer 88%→80%). FINIS LUCIS label now derived from LR (same bearing as the old hand placement) so it rides the new rim; LUX DEVORATA (rift-dependent) untouched. Veil multiplier kept at 1.36.

### Punkt 2 — Ask-hierarchy prototypes (`public/lab/ofob/`)
- **Runde 1 (verworfen)**: `a-spine.html` (Codex Spine), `b-console.html` (Cogitator Console), `c-muster.html` (Muster Roll) — hairline-frame grammars. Maintainer verdict: "altbacken", the boxes/borders don't read elegant. Files kept for comparison, index marks them superseded.
- **Runde 2 (aktiv)**: no decorative borders anywhere — grouping carried by **background tone only** (full-bleed bands or soft-radius washes, bone at 1.4–3.6%), CTA as filled tint instead of outlined button:
  - `d-strata.html` **Strata** — editorial, left-aligned; full-bleed tonal bands (choosing on lifted ground, answer on deepest void, register on faintest wash); roster as one masked snap-scroll line; stepper inline with the faction headline.
  - `e-cameo.html` **Cameo** — exactly ONE lifted surface on the page (the answer, radius 22); controls naked on void; the 18er-muster folds behind an "All factions ▾" disclosure; alternatives sink tone-in-tone into a darker inset.
  - `f-titelblatt.html` **Titelblatt** — the verdict typeset as a novel's title page on a full-bleed lighter "paper" band (recommends / title / byline / format / `· · ·` / epigraph / CTA), centered colophon controls — the book-title-page language rolled out.
- Round-2 demo data upgraded: **all 18 factions dressed with real data**, mechanically joined from `faction-starters.json` → per-book SSOT (`scripts/seed-data/books/<slug>.json`) for authors, formats, and first-sentence synopses (fixed a round-1 error: "Our Martyred Lady" is Gav Thorpe, not Danie Ware). Note: Next static serving needs the full filename — `/lab/ofob` alone 404s; hand out `/lab/ofob/index.html`.
- **Maintainer pick: E · Cameo** ("relativ gut"), with the correction that the site draws no rounded geometry — all `border-radius` removed from the cameo surface, the inset, and the CTA. Real-component implementation still pending final sign-off on the sharpened version.

### Punkt 6 — Great Journeys
- **New module `src/lib/map/voyages/`**: `types.ts` (Voyage/VoyageStation/LegOverride — stations reference map-worlds **ids**, optional heading/date/source per station), `resolve.ts` (id lookup over featured+dust; quadratic-Bézier leg generation, bow `clamp(0.16·dist, 6, 55)` away from Terra, `bow`/`d` overrides; exports structural `VoyageChart` so scripts stay free of the server-only blurb layer), `data/*.ts` (7 journeys), `index.ts` (roster).
- **Journeys** (two in-depth research waves — ten parallel web agents total, each fetching the actual Lexicanum articles with Fandom cross-check; source URLs per station in the data files). Final roster, 8 journeys / 90 stations:
  - **The Great Crusade (21 st.)** — all 18 primarch rediscoveries in the canonical BL order (Lexicanum's discovery table = Fandom's list, identical) + launch, Luna, Ullanor Triumph. Every homeworld was already on the chart. Alpharius rides `terra` as "The Final Son" (canonical world unknown; act text carries both traditions); the two Lost Primarchs have no worlds and are omitted.
  - **Horus · Rise and Ruin (9 st.)** — starts at Ullanor where the Great Crusade ends (maintainer call; the Cthonia/Terra beats live in the Crusade's telling): Triumph, Davin, Istvaan III/V (hand legs kept), Molech, Dark Muster, Titandeath, Solar War over Luna, Terra. **Phall verified-dropped** (Perturabo commanded in person). Davin corrected to c. 004.M31.
  - **Jaghatai · The Warhawk (10 st., NEW)** — Chogoris finding + Blooding, Ullanor dais, the Chondax Long Hunt, Prospero's judgement (with the verified correction that the Scars never fought at Alaxxes), Path of Heaven arrival, the Walls, the Lion's Gate beheading of Mortarion (Warhawk), homecoming, and the 084.M31 webway disappearance (Corusil V folded into Chogoris).
  - **Guilliman · Lord of Ultramar (14 st., M30–M42)** — Monarchia, Ullanor, Calth, Nuceria, Imperium Secundus, Pharos, Avenging Son, Resurrection, Terran-Crusade Luna, the Throne, Plague Wars (Espandor/Parmenio/Iax). **Vigilus + Gathalamor verified-dropped** (no documented in-person presence). **Thessala researched: NO canonical location exists anywhere** (a gas giant; "Thessala orbit" is all the sources give; pursuit came from equally unlocated Xolco) — no pin invented; the resurrection act now narrates the wounding and carrying-home so the Terra→Macragge jump reads.
  - **Garro · Knight of Grey (12 st.)** — the Flight plus the whole Knights-Errant arc (Oath of Moment/Calth, Sword of Truth, Legion of One = Istvaan III canonically, Shield of Lies, Vow of Faith) to the two Siege beats (Saturnine Gate, death vs. Mortarion at Marmax). Orbital-plate/Kuiper beats anchor Terra/Luna per research notes.
  - **Eisenhorn · The Ordo Dossiers (10 st.)** — Xenos/Malleus/Hereticus + Magos coda; corrected Durer (Cruor Vult, Miquol is an island ON Durer), off-chart beats (KCX-1288, 56-Izar, Farness Beta, Messina, Ghül, Gershom) folded per station; the chart's `lethe` is a DIFFERENT world than Lethe Eleven — not used.
  - **Farsight · The Bladed Path (6 st., NEW — first xenos journey)** — Vior'la, Mount Kan'ji (Puretide's tutelage was on Dal'yth, NOT the T'au homeworld — that station dropped as unsupported), Damocles Gulf (Arkunasha folded in: no chart world, no location row, nothing canonical to pin), Arthas Moloch (= the chart's `moloch` Dead World in the T'au region, verdict plausible), the Enclaves riding Vior'la as "The Colours Reversed" (ring composition), Mu'gulath Bay 999.M41 (Second Agrellan = `agrellan`). Deliberately intimate: the tight eastern cluster makes the tour zoom deep.
  - **The Indomitus Crusade (8 st., was 4)** — now fleet-scale: Terra muster, Mars/Cawl, Machorta Sound (Fleet Tertius/VanLeskus — corrected from Quintus), Gathalamor, Baal after the Devastation (classic 8th-ed order; the 2021 retcon noted in the header), Fenris/Wolftime, Vigilus/War of Beasts, Macragge close (Pit of Raukos folded — off-chart). Ophelia VII documented but not on the chart. Old hand legs died with the rerouting.
  - **"The Master of Mankind" CUT** (maintainer call: overlapped the Great Crusade almost station for station; file deleted, research preserved in this report's history).
  - `ROMAN` act numbering extended to XXIV in VoyageTour + CourseCards (arabic fallback stays).
- **Text pass (maintainer feedback)**: every act text, blurb, and journey name is now free of em dashes and "not X but Y" contrast constructions; headings switched from "World — Episode" to the site's dot grammar ("World · Episode"), likewise the tour buttons ("BEGIN · 9 STATIONS →", "FIN · SURVEY THE VOYAGE").
- **Free-mode epilogue (maintainer feedback)**: `CourseCards` rewritten — the pin-anchored all-acts tableau (and the mobile act-pager) is gone; after "Fin" or "skip" ONE bottom-docked card shows only the FINAL station's act, dismissible via ✕, while the route stays fully drawn. Earlier acts are read in the tour (Back/Next/arrow keys). Kills the wall-of-text at journey's end and the ~30 s card stagger concern in one move; `instant`/`bus`/`reduce` props dropped.
- **Leg waypoints (maintainer feature ask, 2026-07-10)**: off-chart "on the way" beats now ride the dashed legs as small dotted markers with full act cards. Model: `VoyageWaypoint { via: 0–1, name, heading?, text, date?, source? }` in the stations array; `resolve.ts` resolves stations first, builds legs between them, then evaluates each waypoint's position on its enclosing leg (`pointOnLeg` — single-segment M+Q/C/L evaluator, covers generated and hand legs); every resolved stop carries `legIndex`. `RoutesLayer` gates tour drawing off a first-entry-per-leg map (a leg draws when the tour first enters it — at a waypoint riding it or at its end station), renders waypoints as small dashed dots (r 4/1.2) reusing the `cg-rt-st` bloom + `rt-pending` gating (no new CSS needed); ambient cadence keys off `legIndex` (rings land as their leg finishes, waypoint dots bloom mid-draw). Tour/cards/keyboard treat waypoints as full acts. Constraint: a waypoint needs a real leg — it cannot be first/last or sit between two visits to the SAME world (test-enforced).
- **11 waypoints added in the revisit**: Great Crusade +2 (the two Lost Primarchs, 821/927.M30, as unmarked dots between their brothers), Horus +1 (Xenobia, the anathame theft), Guilliman +1 (**Thessala · The Wounding** — the elegant fix for the Terra→Macragge confusion), Garro +1 (The Empyrean, on the bowed warp-detour leg), Eisenhorn +3 (KCX-1288, 56-Izar, Farness Beta), Indomitus +2 (Ophelia VII, The Pit of Raukos). Affected station texts slimmed so beats aren't told twice. NOT waypointable (no leg to ride, stays prose): Arkunasha (between two Dal'yth visits), Corusil V (between two Chogoris visits), Ghül/Gershom (after Eisenhorn's last station). Total now 8 journeys / 101 acts (90 stations + 11 waypoints).
- **Tour playback**: reducer in `CartographerRoot.tsx` gains `voyage: {id, mode: "tour"|"free", step}` (+ voyageStart/Step/Free/End; replaces `courseId`). New `VoyageTour.tsx`: overture card (Begin — n stations / Skip tour) → per-station camera flight (`flyTo`, zoom adapted to leg length 2.4×–8×) with Back/Next + arrow keys + ✕, → "Fin — survey the voyage" → free mode. `RoutesLayer.tsx` reworked to consume `ResolvedVoyage` + `progress` (step-gated `rt-pending/rt-drawing/rt-drawn`; at most ONE live mask in tour mode — cheaper than ambient; rings dedupe by world id for repeat visits). `CourseCards.tsx` now the free-mode tableau (`instant` prop skips the 7s stagger after a finished tour; "skip tour" keeps the ambient draw-in).
- **Legend**: section renamed **"Great Journeys"** (hint "trace the paths of legend across the chart"); `CourseButtons` → `VoyageButtons` with blurb + station count per row; active badge shows `touring 3/9`. Sheet badge COURSE → JOURNEY. `layers.tsx` highlight now matches by **id** (`hiIds`) instead of name.
- **CSS** (`55-map.css`): tour-gating rules (`.cg-course.tour .rt-pending` etc., reduced-motion-safe — pending is a plain opacity class), `.cg-tour` card (dock grammar bottom-center on desktop, existing `--dock` rules take over ≤900px), `.rt-blurb`/`.rt-meta` legend row lines.
- **Luna pin (batches share)**: `scripts/seed-data/source/map-worlds-curation.xlsx` Kuration row `luna` flipped **rollup→terra ⇒ pin** (SSOT px 2370/3324 ≈ gx 336.8/gy 399.7, Solar, Civilized World). `npm run import:map-worlds` regenerated `map-worlds.json` (1055 worlds, 63 pins) + `map-worlds.review.md`. **Side effect: Luna's 8 works moved off Terra's pin (196→192 edges) onto Luna — Luna is now a featured world.**
- **Test gate**: `scripts/test-voyages.ts` + `npm run test:voyages` — validates every station id against map-worlds.json (fails hard where the runtime only dev-warns), act texts non-empty, legs generate, labels on-grid. 185 checks green.
- `src/lib/map/routes.ts` deleted.

## Decisions I made

- **"Great Journeys"** is the maintainer's chosen rubric name (asked via question; "Itineraria" and "Voyages" were the alternatives).
- **Retired "The Path of Heresy" as a separate course** — the new Horus journey contains its corridor (Davin→Istvaan III→V→Molech) plus the rise and the road to Terra; two near-identical paths in one legend would be redundant. Its best act texts and hand-drawn legs live on in `horus.ts`. Flag for the maintainer in the session summary.
- **Ullanor = `armageddon` pin** with heading overrides ("Ullanor — The Triumph/The Parting/The Crusade's Height") — lore-sound (the planet was moved/stripped and recolonized as Armageddon), avoids a duplicate pin. "63-19" skipped (not on chart, dispensable).
- **Luna dating conflict resolved editorially (revised in the depth pass)**: both Crusade-era journeys now carry Luna on the **798.M30 tradition** (Great Crusade launch; Lexicanum's First-Pacification infobox also carries ~703.M30). In the Emperor journey this puts the Treaty of Mars (739) before Luna. Reunion dates are shared verbatim between the Great Crusade and Emperor journeys so the same event never shows two dates.
- **Eisenhorn**: Eustis Majoris deliberately absent (Ravenor's stage, confirmed by both wikis); Hubris/Damask/Eechan/Durer were already on the chart (origin "override" pins from an earlier pass) — **no Hubris pin needed**, research assumption corrected. Off-chart beats (KCX-1288, 56-Izar, Ghül, Messina) folded into act texts.
- **Legs generated, not hand-drawn** — 5 new journeys ≈ 30+ legs; the quadratic generator with `bow`/`d` overrides keeps art direction possible (Garro's warp detour uses `bow: 48`). The 7 existing hand legs ride along verbatim.
- **Tour always plays** (no first-time-only localStorage) — "Skip tour" on the overture is today's instant experience; deterministic behavior, one extra tap for returning users.
- **Voyage data in TS, not JSON** — `tsc` validates the research output for free; source URLs sit as fields; no runtime parser.
- **Emperor's Light**: 618 gu instead of literal 609 so the dashed rim doesn't strike through the Macragge pin; ~2× brightness with the mid stop pulled inward (phone-OLED visibility) — atmosphere, not bloom.

## Verification

- `npm run typecheck` — pass. `npm run lint` — pass. `npm run test:voyages` — 506 checks, 8 journeys, pass (final state incl. waypoint contract: via-range, first/last-is-station, enclosing-leg-has-length, no silent drops, on-grid positions). `npm run import:map-worlds` — deterministic regen, coverage 1352/1710 (79.1%). `/map` 200 after the playback + waypoint reworks.
- Dev server (worktree, port 3000): `/lab/ofob/index.html` 200; `/map` 200 rendering the overture (server log clean after the final state; earlier COURSES reference errors in the log were mid-edit HMR states).
- Not machine-verified (per maintainer's manual-verify preference): visual pass on the 7 vox surfaces, Chronicle ≤760px, Lumen on a phone, tour choreography desktop+mobile — maintainer eyeballs in the browser.

## Open issues / blockers

- **Cameo sign-off**: maintainer picked E · Cameo; sharpened (no radii) version awaits his eyeball before the real `/ask/fraktion` implementation.
- Generated-leg aesthetics: expect one `bow` eyeball-tuning pass (esp. Great Crusade's galaxy-spanning reunion legs, the tight Helican cluster in Eisenhorn, and Farsight's very short T'au-cluster hops).
- **Ambient (skip-tour) leg choreography at 20 legs** still runs ~30 s for the Great Crusade (1.45 s/leg CSS stagger) — the card wall is gone (single epilogue card), but eyeball whether the slow route draw-in reads as atmosphere or needs a faster stagger for long journeys.
- Repeat-world transitions (Garro's Terra run, Khan's Chogoris returns, Farsight's Dal'yth pair) produce zero-length legs — invisible by design; the tour camera simply re-centers at max zoom. Eyeball whether consecutive same-world acts feel okay in the tour.
- Waypoint eyeball pass: `via` values are placed by eye in path-parameter space — Eisenhorn's Damask→Thracian leg is short (~26 gu) and carries TWO dots (KCX-1288 at .32, 56-Izar at .62); check they read at survey zoom.
- The one-time regen side effect (Luna works off Terra) shows up in `map-worlds.review.md` — review before merge.
- Follow-up candidate (batches): map the location `arthas_moloch` onto the chart world `moloch` via the curation Welten sheet so the Farsight books link to the pin (would flip it dust → featured); skipped this session to keep the diff journey-scoped.

## For next session

- Winner implementation of the ask-hierarchy variant + the archive-row miniature of the same grouping language.
- `docs/ui-backlog.md` candidates: drop dead `startY/endY` from `src/app/archive/loader.ts`; optional era group headers in the Great Journeys legend list; hash param `voyage=<id>` for shareable journeys; auto-advance timer + swipe gestures for the tour.
- Optional second Ullanor beat in Horus (the dark muster, ~013.M31, Slaves to Darkness) if a 9th station is wanted.

## References

- Lexicanum/Fandom source URLs are embedded per station in `src/lib/map/voyages/data/*.ts`.
- Research uncertainties (Luna dating, Guilliman's Triumph attendance, Davin 005 vs 001.M31, Nuceria year band) documented in the data files' headers and this report's Decisions.
