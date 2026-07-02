# Seed data

Canonical reference data used by `scripts/seed.ts` to initialize a fresh database.

> **📚 Book corpus = per-book SSOT (Brief 171 Teil B).** The live book corpus lives
> ONLY in [`books/`](./books/) — one `books/<slug>.json` (`book-v1`) per book. Add
> books there (`books/README.md` + `scripts/runbooks/add-book-runbook.md`), apply
> with `npm run apply:book -- --all`. The legacy sources — `book-roster.json`, the
> 90 `manual-overrides-ssot-*.json` batches, `book-roster.extension.json`, and
> `source/Warhammer_Books_SSOT.xlsx` — are **frozen provenance** (and the migration
> equivalence golden); nothing reads them as a live source anymore. The batch/Excel/
> loop CLIs (`db:apply-override`, `loop:next`, `import:ssot-roster`, `db:apply-scope`,
> `run-ssot-loop.sh`) are retired and refuse with a pointer to the per-book path.
> A read-only Excel VIEW of the per-book corpus: `npm run books:excel`. Note: the
> separate `books.json` dev-seed below is a different, much smaller hand-curated set
> with its own id space (unchanged by Brief 171).

## What's in the catalog (post Stufe 2b — sessions/2026-05-01-021)

**Reference structure** (canon, hand-curated, source of truth for v1):
29 factions, 7 eras, 5 sectors, 28 locations, 21 series, 21 services,
12 persons, 12 facet categories with 85 facet values, plus the 5-question
Ask-the-Archive questionnaire.

**Books** (`books.json`): **26 hand-curated novels** spanning all seven eras
of the in-universe timeline, biased toward newcomer-friendly entry points
with deliberate Xenos / Niche-faction coverage (Necrons, T'au, Sisters of
Battle, Grey Knights, Mechanicus solo, Orks). The 3-book Sanity-Fixture
(Horus Rising, Eisenhorn: Xenos, Dark Imperium) is preserved verbatim;
23 books were added by Cowork-research in stages 2b, hand-transferred from
Lexicanum / Black Library / ISFDB / Wikipedia primary sources.

Each book entry carries inline annotations: `factions[].id+role`,
`persons[].id+role`, `facets` keyed by category id, and `externalLinks[]`
pointing at services. Mandatory facets per book: `tone`, `pov_side`,
`protagonist_class`, `entry_point`, `content_warning` (all 26 books fully
populated). The other 7 categories (`scope`, `plot_type`, `theme`,
`length_tier`, `format`, `language`, `protagonist_gender`) are best-effort.

The companion document **`docs/data/2b-book-roster.md`** carries the source
URLs, facet-call rationale, and confidence-map for the 26 books. Phase-4
ingestion (real crawler + provenance layer) is for the 200+-scale that follows.

The original prototype is intentionally **not** part of this repository — it
lives in your local archive only.

## Files

| File | Contents | Schema target |
|---|---|---|
| `eras.json` | In-universe time periods | `eras` |
| `factions.json` | Imperial / Chaos / Xenos factions | `factions` |
| `series.json` | Book series (Horus Heresy, Eisenhorn, …) | `series` |
| `sectors.json` | Galactic segmentums | `sectors` |
| `locations.json` | Named worlds and warp anomalies | `locations` |
| `services.json` | 21 storefronts / catalogs / wikis / podcast endpoints (FK target for `external_links`) | `services` |
| `persons.json` | Authors / translators / narrators / directors / cover artists | `persons` |
| `facet-catalog.json` | 12 facet categories + ~85 facet values (NEON-14 trigger warnings + 11 editorial categories) | `facet_categories`, `facet_values` |
| `books.json` | 26 books with inline annotations (factions, persons, facets, external_links) | `works` (kind=book), `book_details`, `work_factions`, `work_persons`, `work_facets`, `external_links` |
| `ask-questions.json` | Recommendation questionnaire | consumed by `src/lib/recommend/` (future) |
| `collection-gaps.json` | Known incomplete collection/omnibus membership where the collection remains a normal book but constituent links are not complete yet | future roster maintenance / `work_collections` completion |
| `podcast-shows.json` | Podcast show registry (`slug`, `feedUrl`, `appleId`, `podcastGuid`, curated show-level `links[]`) for the multi-show ingest | consumed by `scripts/ingest-podcast.ts` (`--show`/`--all`); **not** loaded by `scripts/seed.ts` |
| `faction-blurbs.json` | Short factual blurbs (2–3 sentences) for factions, keyed by `factions.id` — growing toward full coverage | curation layer (no schema); see "Notes on entity-blurbs" below |
| `character-blurbs.json` | Short factual blurbs (2–3 sentences) for characters, keyed by `characters.id` — growing toward full coverage | curation layer (no schema) |
| `location-blurbs.json` | Short factual blurbs (2–3 sentences) for worlds/locations, keyed by `locations.id` — growing toward full coverage | curation layer (no schema) |

## Map-Katalog (Brief 174 + 183) — nicht von `seed.ts` geladen

- **`map-worlds.json`** — generierter Katalog der neuen Galaxiekarte (992 Excel-Welten +
  Kurations-Pins; `kind`-Typ-Gruppen, `locationId`-Links, Werk-Kanten inkl. Rollup-`via`,
  `coverage`-Kopf). NIE von Hand editieren; regenerieren via `npm run import:map-worlds`.
- **`map-worlds.review.md`** — generierter Hand-Gate-Report (Abdeckung, offene Worklist,
  angewandte Kuration, Dubletten).
- **`source/map-worlds-curation.xlsx`** — der **Hand-Pfad** (Philipps Arbeitsformat, ersetzt
  das frühere `map-worlds.overrides.json`). Sheet „Kuration“: eine Zeile pro Medien-Location
  ohne Match; `Aktion` = `link` (Excel-Welt existiert unter anderem Namen; `Ziel` = Welt-ID),
  `rollup` (Werke an Ziel-Welt anhängen, Herkunft `via`), `pin` (neue Welt; `x`/`y`/
  `Segmentum`/`Klassifikation` Pflicht; Klassifikation „Region“ → `kind: region`) oder
  leer/`später` (offen). **`x`/`y` sind SSOT-Pixelkoordinaten** — dieselben Zahlen wie die
  Coordinates-Spalten der Redditor-Excel (copy-paste-kompatibel); der Convert projiziert sie
  mit derselben eingefrorenen Formel aufs Grid wie die Excel-Welten. Sheet „Welten“:
  `locationId-Override` pro Welt-ID (`-`/`null` = bewusst ohne Match, z. B.
  Dubletten-Entkopplung). Neue Worklist-Zeilen ergänzt
  `npm run import:map-worlds -- --sync-curation`.
- **`source/Warhammer_map_SSOT.xlsx`** — eingefrorene Quell-Excel des Redditors
  (Welten + Pixel-Koordinaten); read-only Input des Converts.

## Notes on `books.json` shape

A book entry looks roughly like:

```jsonc
{
  "id": "hh01",
  "title": "Horus Rising",
  "pubYear": 2006,
  "startY": 30998,
  "endY": 30998,
  "synopsis": "...",
  "series": "horus_heresy_main",
  "seriesIndex": 1,
  "factions":      [ { "id": "sons_of_horus", "role": "primary" } ],
  "persons":       [ { "id": "dan_abnett",    "role": "author"  } ],
  "facets": {
    "format":            ["book"],
    "protagonist_class": ["space_marine"],
    "pov_side":          ["imperium"],
    "scope":             ["galactic"],
    "entry_point":       "series_start",
    "length_tier":       "standard",
    "plot_type":         ["war_story"],
    "tone":              ["grimdark"],
    "theme":             ["betrayal"],
    "content_warning":   ["cw_violence", "cw_death"],
    "language":          ["en"]
  },
  "externalLinks": [
    { "kind": "reference", "service": "lexicanum",
      "url": "https://wh40k.lexicanum.com/wiki/Horus_Rising_(Novel)",
      "label": "Lexicanum" }
  ]
}
```

Single-value facets (`entry_point`, `length_tier`) take a string; the rest
take string arrays. Facet ids must exist in `facet-catalog.json` — the seed
script validates before opening a transaction and throws a clear error on
typos. Service ids must exist in `services.json`. Person ids must exist in
`persons.json`.

## Notes on entity-blurbs (Board 122-B3)

`faction-blurbs.json` / `character-blurbs.json` / `location-blurbs.json` are a thin
**curation layer over existing entity ids — no schema, no migration, no `seed.ts`
change** (Spec 129 decision #4: "Kurations-Schicht = committed JSON über vorhandene IDs,
kein Schema"). The `factions` / `characters` / `locations` tables have no blurb column;
the blurb text lives only in these JSONs and is read at request time by the consuming
loader (Product strand). They are **not** loaded by `scripts/seed.ts`.

Each file is `{ "$schema": "entity-blurbs-v1", "entityType": "...", "blurbs": [...] }`.
Each blurb row carries provenance, mirroring `audiobook-narrators.json`:

```jsonc
{
  "id": "thousand_sons",        // MUST exist in the matching entity seed file
  "blurb": "A Space Marine Legion of sorcerer-warriors led by the primarch Magnus the Red; their pursuit of forbidden knowledge drove their fall to the Chaos god Tzeentch.",
  "source_kind": "manual",       // hand-authored composition (DB source_kind enum)
  "confidence": 0.95,            // 0.85–0.95; lower if a fact was hard to confirm
  "sourceUrl": "https://wh40k.lexicanum.com/wiki/Thousand_Sons",  // web verification source
  "checkedAt": "2026-06-09"
}
```

The B3 first pass seeded a **curated subset** (113 entities: door-factions, primarchs +
spotlight characters, the 28 Cartographer-visible worlds), then a 30-entity long-tail
re-pilot brought the total to **143** (56 factions / 49 characters / 38 locations). The
remaining ~838 entities are filled by the **full-coverage sweep**, run via subscription
Sonnet subagents (NOT the metered API) — see
[`scripts/runbooks/entity-blurbs-full-run.md`](../runbooks/entity-blurbs-full-run.md).

- **What's left:** `npm run blurbs:remaining` (`scripts/list-uncovered-blurbs.ts`) diffs
  the entity seed files against the blurb files and prints the remainder as ready-to-feed
  batches. This is the resume oracle — there is no separate progress ledger.
- **Integrity:** `scripts/test-entity-blurbs.ts` (`npm run test:blurbs`) asserts shape,
  that every blurb id resolves to an existing entity (no dangling), no duplicates, and
  that each blurb stays ≤ 460 chars / ≤ 3 sentences — a dangling or over-long blurb fails
  the build. Set `BLURBS_REQUIRE_FULL=1` to additionally require 100 % coverage (the final
  gate after the sweep completes).

## Editing

Two paths, same as before:

1. **Hand-edit JSON** for small fixes (fix a typo, correct a date). Re-run
   `npm run db:seed` against your dev database.
2. **Database-first edits** via Drizzle Studio (`npm run db:studio`). When
   happy, **export back to JSON** so the next `db:seed` reflects the change.

## Incomplete collections

If an omnibus or collection is known but its constituent works are not fully
modeled yet, keep the omnibus as a normal book and record the missing
membership in `collection-gaps.json`. Do not add partial `work_collections`
rows that could make the collection look complete. A later collection-gap
resolve pass should add missing roster works/links and then apply the full
collection membership.

Phase 3 (the ingestion pipeline, TypeScript under `src/lib/ingestion/`) is
live in dry-run; once the apply step (3d) ships, scrapers will write fresh
data to Postgres directly via the multi-source merge engine. Hand-curated
JSON in this folder remains the seed for reference tables and the 26 manual
books — pipeline output uses Postgres as canonical, not these files.
