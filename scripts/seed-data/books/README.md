# `scripts/seed-data/books/` — per-book SSOT files (Brief 170 Teil A)

One `*.json` file here is the additive, git-versioned home for **one new book**.
It replaces the old batch-file / slot / `loop:next` dance for fresh releases.

- **Legacy stays authoritative** for the existing corpus (`book-roster.json` +
  `manual-overrides-ssot-*.json`). This folder is **strictly additive** — never
  re-home an existing roster book here.
- **The folder ships empty.** With no `*.json` files, `apply:book --all` (the
  `db:sync` step-3 tail) and `apply:book --verify` (the `db:drift` per-book
  check) are clean no-ops. Nothing is written to the live DB until the first book
  is scaffolded **and applied with explicit maintainer go**.
- This `README.md` is **not** a `*.json` file, so the loader ignores it
  (`listBookFiles` filters to `.json`).

## File shape (`$schema: "book-v1"`)

```jsonc
{
  "$schema": "book-v1",
  "externalBookId": "W40K-0600",        // /^(W40K|HH)-\d{4}$/, unique across the effective corpus
  "slug": "eisenhorn-xenos",            // clean: slugify(slug) === slug
  "title": "Xenos",
  "authors": ["Dan Abnett"],            // string[]; lossless
  "editors": [],                        // string[]; lossless
  "authorship": { "editorialNote": "various" | null },
  "releaseYear": 2001,                  // positive integer or null
  "format": "novel",                    // one of the 9 book_format enum values
  "seriesHint": "Eisenhorn",            // free-text hint or null
  "series": "eisenhorn",                // canonical series.id or null (replaces the legacy hard-coded map)
  "seriesIndex": 1,                     // integer or null
  "notes": null,                        // free maintainer notes or null (lossless)
  "source": { "kind": "manual", "url": null, "confidence": null },
  "curation": {
    "synopsis": "…",                    // non-empty
    "facetIds": [],                     // string[] — validated against the facet catalog
    "factions": [{ "name": "Inquisition", "role": "primary" }],
    "locations": [],
    "characters": [],
    "flags": [],                        // override flags, verbatim
    "rating": { /* optional */ }
  },
  "collections": {
    "collects": [                       // ONLY an anthology/omnibus file owns member edges
      { "externalBookId": "W40K-0601", "displayOrder": 0, "confidence": null, "basis": null }
    ],
    "containedIn": []                   // generated back-reference; IGNORED by the applier
  }
}
```

The lossless fields (`authors[]`, `editors[]`, `authorship.editorialNote`,
`notes`, and the whole `curation` block) round-trip **verbatim** through apply —
no normalization, no abbreviation (Brief 170 §Design).

## Lifecycle

Scaffold → validate → apply → verify. The full operator flow (including the
**DB-write gate**) lives in [`scripts/runbooks/add-book-runbook.md`](../../runbooks/add-book-runbook.md).

```bash
# dry, DB-free — schema, dup-guard, id allocation, curation validation
npm run test:book-file

# apply ONE file (writes the live DB — needs explicit maintainer go)
npm run apply:book -- --slug <slug>

# apply EVERY file in this folder (the db:sync tail; empty folder = no-op)
npm run apply:book -- --all

# read-only presence check (the db:drift per-book check)
npm run apply:book -- --verify
```

> **Never** add a per-book file to `book-roster.extension.json`, run
> `import:ssot-roster`, create a batch / slot, or call `loop:next` for a book
> that lives here. The per-book path and the Legacy batch path are disjoint.
