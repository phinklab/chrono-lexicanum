---
session: 2026-06-10-137
role: architect
date: 2026-06-10
status: implemented
slug: timeline-data-foundation
parent: null            # design session ran Cowork-side in timeline-workshop/ (git-ignored); Brief 134 is retired
links: [2026-06-10-138]
commits: []
---

# Timeline data foundation — events spine, 8-era map, book↔event hooks, book setting dates

> **Strand: Batches** (`chrono-lexicanum-batches`). Schema + seed JSONs + apply path only.
> No UI. The Product counterpart (Cinematic/Index timeline port) is Brief 138 and
> **depends on this brief being applied first.**

## Goal

Anchor the hand-curated Chronicle timeline dataset in Postgres + committed seed
JSONs: a new `events` table (144 curated events across Deep History → M42), a new
`event_works` junction (book/podcast hooks per event), a rewritten 8-era map, and
in-universe setting dates for ~110 books written into the long-empty
`works.startY/endY`.

## Context

- A multi-week Cowork+Philipp curation effort in `timeline-workshop/` (git-ignored,
  exists **only** in the coordination worktree — you cannot and need not read it)
  produced: a 144-event dated spine with provenance, per-event book hooks,
  per-event podcast picks (guid-keyed), and per-book setting dates for 110 books.
- The whole `/timeline` page is being rebuilt (Cinematic view + Index view, one
  commissioned artwork per era chapter). The decided era structure is **8 sections**
  (table below), replacing the 7 buckets in `scripts/seed-data/eras.json`.
- A working HTML/JS design prototype defined the data contract this schema serves
  (era editorial copy, per-event display blurbs, media chips, artwork refs).
  Brief 138 ports it; this brief only persists the data it consumes.
- **Input artifacts:** Cowork delivers four final-form JSON files
  (`eras.json` rewrite, `events.json`, `event-works.json`, `book-dates.json`).
  Philipp copies them into this worktree under `scripts/seed-data/` before the
  session starts. Treat their *content* as authoritative curation output — do not
  re-curate; do validate (see Acceptance).

### The 8-era map (decided 2026-06-10 with Philipp)

| # | id | name | short | mLabel | startY | endY | ~events |
|---|---|---|---|---|---|---|---|
| I | `deep_history` | Deep History | DEEP HISTORY | PRE-M30 | 0 | 29999 | 6 |
| II | `great_crusade` | Great Crusade | GREAT CRUSADE | M30 | 30000 | 31000 | 23 |
| III | `horus_heresy` | Horus Heresy & The Great Scouring | HORUS HERESY | M31 | 31001 | 31999 | 21 |
| IV | `the_forging` | The Forging | THE FORGING | M32–34 | 32000 | 34999 | 20 |
| V | `age_apostasy` | Age of Apostasy | APOSTASY | M35–37 | 35000 | 37999 | 20 |
| VI | `the_waning` | The Waning | THE WANING | M38–40 | 38000 | 40999 | 21 |
| VII | `time_ending` | Time of Ending | TIME OF ENDING | M41 | 41000 | 41999 | 22 |
| VIII | `indomitus` | Era Indomitus | ERA INDOMITUS | M42 | 42000 | 42100 | 12 |

- M-scale: `scaleY = M*1000 + yearWithinMillennium` (code is authority; the prose
  formula in top-level CLAUDE.md is wrong). Ullanor (~000.M31 = 31000) is
  editorially the *close* of the Great Crusade → era II ends at 31000, III starts 31001.
- **Era assignment of an event is editorial, never derived from scaleY.** Events
  carry an explicit `eraId`; e.g. Fall of Cadia (`999.M41` = 41999) sits in
  `indomitus`, the M36 Apostasy beats sit in `age_apostasy`. Do not "fix" rows
  whose scaleY falls outside their era's bounds.
- Deep-history events (War in Heaven, Age of Strife, …) are off-scale: `startY/endY`
  null + `offscale: true`, with a human `dateLabel` ("~60,000,000 YEARS AGO").

## Deliverables

### 1. Schema (`src/db/schema.ts` + generated migration)

**`events` (new):**

| column | type | notes |
|---|---|---|
| `id` | varchar(64) PK | snake_case, e.g. `razing_of_monarchia` (reference-table convention) |
| `title` | text NOT NULL | |
| `dateLabel` | text NOT NULL | verbatim Imperial notation / legend label — never re-derived from scaleY |
| `startY` / `endY` | numeric(10,3) | nullable (deep-history off-scale rows) |
| `offscale` | boolean NOT NULL default false | |
| `eraId` | varchar(64) NOT NULL FK → `eras.id` | editorial assignment (see above) |
| `sortIndex` | integer NOT NULL | display order within the era (export-stamped) |
| `tier` | pgEnum `event_tier` ('epoch','major','minor') NOT NULL | |
| `approx` | boolean NOT NULL default false | |
| `confidence` | varchar(1) | 'H' / 'M' / 'L' |
| `sourceKind` | text | workshop provenance string ('lex', 'fandom', 'tl', 'roster', 'chron', 'lore', combos like 'fandom/lex') |
| `blurb` | text NOT NULL | English display copy rendered by the new timeline |
| `curatorNote` | text | internal provenance note, not rendered |
| `artworkRef` | text | public asset path (file itself ships in Brief 138 — string may dangle until then) |
| `artCreditName` / `artCreditUrl` | text | optional artist attribution |

Index on `eraId`; index on `startY`.

**`event_works` (new):** one junction covers book hooks *and* podcast picks —
podcast episodes are already `works` rows.

| column | type | notes |
|---|---|---|
| `id` | uuid PK defaultRandom | |
| `eventId` | varchar(64) NOT NULL FK → `events.id` ON DELETE CASCADE | |
| `workId` | uuid FK → `works.id` | nullable |
| `seriesId` | varchar(64) FK → `series.id` | nullable — for series-level hooks (Gaunt's Ghosts, The Beast Arises) |
| `role` | text NOT NULL | 'book' \| 'podcast' |
| `displayLabel` | text | curated attribution-line override ("G. McNeill · PROLOGUE 739.M30", "EP. 112", "SERIES · 23 BOOKS") |
| `position` | integer NOT NULL default 0 | chip order within the event |

CHECK: exactly one of `workId` / `seriesId` set. UNIQUE on (`eventId`,`workId`)
and (`eventId`,`seriesId`).

**`eras` (extend, don't recreate):** add nullable columns `short`, `mLabel`, `sub`,
`tagline`, `intro`, `coverRef`. Existing `id/name/startY/endY/tone/sortOrder` stay.
(Grouping mode, minimap domain/ticks are *view tuning* and deliberately stay in
Product-side code config — Brief 138.)

**`works` (extend):** dating provenance for the setting dates that will fill
`startY/endY`: `settingDateLabel` text, `settingMethod` text
('explicit' | 'event-anchored' | 'roster' | 'argued'), `settingConfidence`
varchar(1), `settingAnchorEventId` varchar(64) FK → `events.id` (nullable).

Migration via `npm run db:generate` (no table renames involved, so no drizzle-kit
TTY prompt; if one appears anyway, use the two-step generate workaround).

### 2. Seed JSONs (delivered, you validate + commit)

Shapes for reference — the delivered files are authoritative:

```jsonc
// eras.json (rewritten, 8 entries)
{ "id": "great_crusade", "name": "Great Crusade", "short": "GREAT CRUSADE",
  "mLabel": "M30", "sub": "…", "tagline": "…", "intro": "…",
  "coverRef": "/timeline/bg/era-great-crusade.webp",
  "startY": 30000, "endY": 31000, "tone": "…", "sortOrder": 2 }

// events.json (144 entries)
{ "id": "razing_of_monarchia", "title": "Razing of Monarchia", "dateLabel": "964.M30",
  "startY": 30964, "endY": 30964, "offscale": false, "eraId": "great_crusade",
  "sortIndex": 210, "tier": "major", "approx": false, "confidence": "H",
  "sourceKind": "fandom/lex", "blurb": "…", "curatorNote": "…",
  "artworkRef": "/timeline/bg/bg3.webp", "artCredit": { "name": null, "url": null } }

// event-works.json — entries carry exactly one of workSlug / episodeGuid(+showSlug) / seriesId
{ "eventId": "treaty_of_mars", "workSlug": "mechanicum", "role": "book",
  "displayLabel": "G. McNeill · PROLOGUE 739.M30", "position": 0 }
{ "eventId": "gothic_war", "episodeGuid": "…", "showSlug": "lorehammer",
  "role": "podcast", "displayLabel": "EP. 112", "position": 2 }
{ "eventId": "sabbat_worlds_crusade", "seriesId": "gaunts_ghosts", "role": "book",
  "displayLabel": "SERIES · 23 BOOKS", "position": 0 }

// book-dates.json (~110 entries)
{ "slug": "siege-of-vraks", "startY": 41812, "endY": 41830,
  "settingDateLabel": "812–830.M41", "settingMethod": "explicit",
  "settingConfidence": "H", "settingAnchorEventId": "siege_of_vraks", "note": "…" }
```

### 3. Apply path (`scripts/apply-timeline-data.ts` or equivalent)

Follow the established Batches apply discipline (idempotent, `--dry-run` first,
human-readable diff report):

1. **Upsert eras** (8 rows) + retire the obsolete ids.
2. **Remap `bookDetails.primaryEraId`** before deleting old era rows. Mapping:
   `age_rebirth` → `horus_heresy`; `long_war` → bucket by the book's (newly applied)
   `startY` into `the_forging` / `age_apostasy` / `the_waning`; ids that persist
   (`great_crusade`, `horus_heresy`, `age_apostasy`, `time_ending`, `indomitus`)
   stay. A `long_war` book with **no** setting date cannot be auto-bucketed —
   collect those rows into the report for a manual pass instead of guessing.
3. **Upsert events** (delete-then-insert or upsert by id; `event_works` rebuilt
   wholesale from JSON each apply).
4. **Resolve hooks:** `workSlug` → `works.id`; (`showSlug`,`episodeGuid`) →
   `podcastEpisodeDetails` → `workId`; `seriesId` → `series.id`. **Any unresolved
   reference fails the apply with a listed report — no silent skips.**
5. **Apply book dates** to `works.startY/endY` + the four `setting*` columns,
   keyed by slug. Only touch rows named in `book-dates.json`.

## Constraints

- Strand worktree: **never write `brain/**` or `sessions/README.md`** — substantive
  system facts go in your impl report; Cowork backfills rollups post-merge.
- Postgres stays SSOT; the JSONs are the committed, reviewable source the DB is
  fed from — apply must be re-runnable without drift.
- Don't edit `timeline-workshop/` references into code — that folder doesn't exist
  in this worktree and never will.
- No frontend changes: `src/app/**`, `src/components/**`, `src/lib/chronicle/**`
  (incl. `roster.ts`) stay untouched.
- TypeScript strict, no `any`. Migrations committed alongside the schema change.

## Out of scope

- Everything UI (Brief 138): timeline page, loaders, view config, era artwork files.
- `roster.ts` retirement / Chronicle book-strip rework — later brief, after the new
  page proves the DB path.
- Atlas regen extension for events (follow-up; note it in your report).
- Re-dating or re-curating any event/book — the JSONs are the curation output.

## Acceptance

The session is done when:

- [ ] Migration adds `events`, `event_works`, the six `eras` columns, the four
      `works.setting*` columns; `npm run db:generate` output committed.
- [ ] The four JSONs live in `scripts/seed-data/` and a validation step proves:
      every `eraId` exists; every `workSlug`/`episodeGuid`/`seriesId` resolves
      against the live DB; every `settingAnchorEventId` exists in `events.json`.
- [ ] Dry-run report reviewed, then apply executed against Supabase: 8 era rows,
      144 events, all hook rows, ~110 dated works (report exact counts).
- [ ] `primaryEraId` remap report in the impl report, incl. the manual-pass list
      of undatable `long_war` books (if any).
- [ ] `npx tsc --noEmit` and `npm run lint` green.
- [ ] Impl report written (`sessions/2026-06-10-137-impl-…`), brief status flipped
      to `implemented` inside the code PR.

## Open questions

- Does an `events` mirror belong in the Atlas (`atlas:regen`) as its own page type?
  Opinion welcome in the report; implementation is a follow-up.
- Is `delete-and-reinsert` acceptable for `events`/`event_works` on every apply, or
  do you see a consumer that needs stable row identity beyond the string PK?

## Notes

- Episode identity: `podcastEpisodeDetails` keys episodes on (show, `episodeGuid`)
  with a unique constraint — that's the join the resolver should use.
- The design prototype carried `conf`/`src` per event without rendering them; we
  persist them as provenance, same spirit as `source_kind`/`confidence` everywhere
  else in the schema.
- `artworkRef`/`coverRef` strings point at `/timeline/bg/*.webp` paths that Brief
  138 creates. Dangling until then is expected and harmless (strings, not FKs).
