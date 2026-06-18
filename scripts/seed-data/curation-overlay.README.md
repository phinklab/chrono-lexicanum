# Curation overlay — hand-override format (Brief 149)

The **hand-override overlay** lets the maintainer correct a single book by hand —
remove a wrong faction, add a missing character, fix a hard field — and have that
correction **survive** every future resolver wave, consolidation pass, and
`db:rebuild`.

- **File:** `scripts/seed-data/curation-overlay.json` (committed; the source of
  truth — DB rows are derived).
- **Apply:** `scripts/apply-curation-overlay.ts`
  (`npm run apply:curation-overlay`).
- **Core (types + validator + planner):** `scripts/curation-overlay.ts` (pure,
  DB-free).
- **Test (validator + precedence + idempotency):**
  `scripts/test-curation-overlay.ts`
  (`npm run test:curation-overlay`).

## Why it is a TAIL (the load-bearing idea)

`apply-override.ts` rebuilds `work_factions` / `work_locations` /
`work_characters` per book with a **delete-then-insert keyed on `workId`** —
every re-apply wipes a book's junctions and re-inserts them straight from the
batch file. A hand fix that merely set `source_kind='manual'` would not survive:
a removed auto-edge comes back, an added edge is wiped.

So the overlay is a **deterministic tail that runs AFTER the auto apply/rebuild**
and re-asserts the maintainer's decisions. It generalises the proven
`apply:audiobook-narrators` pattern (committed sidecar + scoped writes + a tail
slot in the apply chain `db-sync.sh`, run by both `db:sync` and `db:rebuild`). The
audio path scopes its delete to the *roles* it owns;
the curation overlay operates on the *same* roles the auto path owns, so it scopes
to the exact **edge** instead — a junction row is uniquely `(workId, entityId)`
(the PK of all three junctions), so:

- **Addition** → upsert that one `(workId, entityId)` row (insert, or update its
  role).
- **Suppression** → delete that one `(workId, entityId)` row.

Both directions, **idempotent** (a second apply changes nothing), re-applied last.

## `final` vs `reviewQueue`

```jsonc
{
  "final":       { "books": [ /* APPLIED — maintainer-decided */ ] },
  "reviewQueue": { "books": [ /* CARRIED, never applied — proposals */ ] }
}
```

- **`final`** — values the overlay **applies**. Fully validated, incl. reference
  existence, the `book_format` enum, era ids, and the public-synopsis banned-
  pattern guard.
- **`reviewQueue`** — proposed values (from the B11 book-reviewer or the weekly
  refresh) that are **carried machine-readably** but **never applied** until a
  maintainer moves them into `final`. Validated **structurally only** — a proposal
  may reference an id that does not exist yet.

One file, one shape for both sections, so a proposal is promoted by moving its
book entry from `reviewQueue` into `final` (or merging it into an existing `final`
entry). It accommodates both B11 findings and weekly-refresh promotions.

## Book entry shape

```jsonc
{
  "externalBookId": "W40K-0010",        // /^(?:W40K|HH)-\d{4}$/
  "title": "The Magos",                  // optional human label, ignored on apply
  "factions":   { "add": [ … ], "remove": [ … ] },
  "locations":  { "add": [ … ], "remove": [ … ] },
  "characters": { "add": [ … ], "remove": [ … ] },
  "fields":     { "synopsis": { … }, "format": { … }, "primaryEraId": { … } }
}
```

### Edge add

```jsonc
{
  "id": "ordo_malleus",     // canonical reference id (factions/locations/characters.id)
  "role": "supporting",     // see role vocab below
  "rawName": null,          // optional; null = clean manual edge (no surface-form drift)
  "sourceKind": "manual",
  "confidence": 0.9,        // [0,1]
  "checkedAt": "2026-06-14",// YYYY-MM-DD
  "note": "why"             // optional
}
```

### Edge remove (suppression)

```jsonc
{
  "id": "chaos",
  "sourceKind": "manual",
  "checkedAt": "2026-06-14",
  "note": "why this edge is wrong"   // REQUIRED — a suppression must justify itself
}
```

### Field fix

```jsonc
"fields": {
  "format": {               // writable fields: synopsis | format | primaryEraId
    "value": "collection",  // format → book_format enum; primaryEraId → eras.id;
                            //          synopsis → free text (banned-pattern linted)
    "sourceKind": "manual",
    "confidence": 1.0,
    "checkedAt": "2026-06-14",
    "note": "why"
  }
}
```

| field          | target column              |
|----------------|----------------------------|
| `synopsis`     | `works.synopsis`           |
| `format`       | `book_details.format`      |
| `primaryEraId` | `book_details.primary_era_id` |

Provenance (`sourceKind`/`confidence`/`checkedAt`/`note`) lives **only in this
file**, never in the DB row — no new column, no migration (narrator model).

### Role vocabulary (matches `schema.ts`)

| axis         | allowed roles                  |
|--------------|--------------------------------|
| `factions`   | `primary` `supporting` `antagonist` |
| `locations`  | `primary` `secondary` `mentioned`   |
| `characters` | `pov` `appears` `mentioned`         |

## Validation — loud before any mutation

`validateOverlay` throws on the first problem **before** a single write (mirrors
the `validate*` pre-passes in `apply-override.ts`). It rejects, among others: a
malformed `externalBookId`, a duplicate book in a section, an unknown book key (a
stray `facets` key is rejected here), an unknown axis key, an unknown role, an
id that is not a known reference id (`final` only), the same id in both `add` and
`remove`, a missing suppression reason, an invalid `book_format` / era id, and a
synopsis carrying a banned public-forward pattern.

## No facets — by design

The overlay has **no facet section** and structurally cannot write `work_facets`.
This guarantees it can never reintroduce a `content_warning` row into the visitor
UI (Brief 149/150 — display is already filtered by `isVisibleFacetCategory`).
Facet curation, if ever needed, is a separate change that must respect that
visibility filter.

## CLI

```
npm run apply:curation-overlay -- --dry-run     # validate + diff vs DB, no writes
npm run apply:curation-overlay                  # apply
npm run apply:curation-overlay -- --verify      # read-only post-condition check
npm run apply:curation-overlay -- --file=<path> # alternate sidecar
```

`--verify` passes iff, for every resolved `final` book, every add edge is present
(with its role), every suppression is absent, and every field equals the overlay
value. It is the post-condition check wired as the `db:rebuild` tail.

Programmatic entry point for the future admin page:
`applyCurationOverlay({ dryRun?, verify?, file? })` → `OverlayRunResult`.

## Place in the apply chain (`db:sync` / `db:rebuild`)

The overlay is the **final tail** of `scripts/db-sync.sh` (apply, then
`--verify`), after the audiobook-credit and timeline tails — it must run after the
auto re-apply so the auto-edges it suppresses exist to be removed and the edges it
adds are re-asserted last (and its `primaryEraId` field-fix wins over the timeline
remap). The non-destructive `db:sync` runs this chain; `db:rebuild` runs the same
chain after a confirm-gated truncate (Brief 157). See
`scripts/runbooks/db-rebuild-runbook.md`.
