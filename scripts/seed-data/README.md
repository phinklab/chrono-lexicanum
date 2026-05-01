# Seed data

Canonical reference data used by `scripts/seed.ts` to initialize a fresh database.

## What's in the catalog (post Stufe 2a — sessions/2026-05-01-019)

**Reference structure** (canon, hand-curated, source of truth for v1):
25 factions, 7 eras, 5 sectors, 28 locations, 14 series, 18 services,
12 facet categories with 85 facet values, plus the 5-question Ask-the-Archive
questionnaire.

**Books** (`books.json`): the **3-book Sanity-Fixture** — `hh01` Horus Rising
(Dan Abnett, M31.998 / Horus Heresy), `eis01` Eisenhorn: Xenos (Dan Abnett,
M41.200 / Time of Ending), `di01` Dark Imperium (Guy Haley, M42.030 / Indomitus).
Each entry carries inline annotations: `factions[].id+role`, `persons[].id+role`,
`facets` keyed by category id, and `externalLinks[]` pointing at services.

The next data expansion is **Stufe 2b** — 20 hand-curated books with full
annotations. Phase-4 ingestion (real crawler + provenance layer) is for the
200+-scale that follows.

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
| `services.json` | 18 storefronts / catalogs / wikis (FK target for `external_links`) | `services` |
| `persons.json` | Authors / translators / narrators / directors / cover artists | `persons` |
| `facet-catalog.json` | 12 facet categories + ~85 facet values (NEON-14 trigger warnings + 11 editorial categories) | `facet_categories`, `facet_values` |
| `books.json` | 3 books with inline annotations (factions, persons, facets, external_links) | `works` (kind=book), `book_details`, `work_factions`, `work_persons`, `work_facets`, `external_links` |
| `ask-questions.json` | Recommendation questionnaire | consumed by `src/lib/recommend/` (future) |

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

## Editing

Two paths, same as before:

1. **Hand-edit JSON** for small fixes (fix a typo, correct a date). Re-run
   `npm run db:seed` against your dev database.
2. **Database-first edits** via Drizzle Studio (`npm run db:studio`). When
   happy, **export back to JSON** so the next `db:seed` reflects the change.

Once Phase 4 (the ingestion pipeline) is live, scrapers will write fresh JSON
snapshots into `ingest/.cache/` and a merge step will produce updated versions
of these files.
