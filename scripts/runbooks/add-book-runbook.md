# Add one book — per-book SSOT runbook (Brief 170 Teil A)

Operational doc for promoting **one new book** into the archive through the
**per-book SSOT path** — the additive, git-versioned replacement for the old
batch-file / slot / `loop:next` dance. One book = one
`scripts/seed-data/books/<slug>.json` file (`$schema: "book-v1"`), applied
idempotently via `apply:book`.

> **DB-write gate.** Writing the source file, validating it, and opening the PR
> are all DB-free and safe. The **only** step that touches the live database is
> `npm run apply:book -- --slug <slug>` (or `--all`). Run it **only on Philipp's
> explicit go.** Default flow: write the file → PR → merge → apply.

> **This is a strand task (Batch/Ingestion).** It touches only
> `scripts/seed-data/books/**` (+ maybe `scripts/seed-data/persons.json`, auto).
> It never writes `brain/**` or `sessions/README.md`. Not a normal session —
> follow this runbook, skip the session-start read-routine.

---

## TL;DR

```bash
# 1. scaffold scripts/seed-data/books/<slug>.json  ($schema: "book-v1")
# 2. DB-free validation (schema, dup-guard, id allocation, curation)
npm run test:book-file
# 3. PR → review → merge  (source on main first)
# 4. apply — LIVE DB WRITE, only on Philipp's explicit go
npm run apply:book -- --slug <slug>
# 5. read-only confirm
npm run apply:book -- --verify
```

`apply:book` shares the **exact** writer the legacy batch applier uses
(`scripts/book-apply-shared.ts` → `applyBook`), so a per-book book is
materialized legacy-equivalently (works / book_details / junctions / persons),
idempotently on `works.external_book_id`, touching no other work.

---

## When to use this (and when not)

- **Use it** for any genuinely-new release: a fresh novel, novella, audio drama,
  anthology, or omnibus that is **not** already in the Legacy corpus.
- **Don't use it** to re-home an existing roster book. Legacy
  (`book-roster.json` + `manual-overrides-ssot-*.json` + the Excel SSOT) stays
  authoritative for the original 859 + crystallized batches. The per-book folder
  is **strictly additive**; the dup-guard hard-rejects any slug or
  `externalBookId` that already lives in Legacy.
- A book surfaced by the **weekly refresh** lands here too — see
  [`weekly-refresh-runbook.md`](./weekly-refresh-runbook.md) § Promote (the
  proposal row seeds stations 1–4 below).

---

## The 9 stations

### 1 — Identity

- **`externalBookId`** — next free id in the namespace, `^(W40K|HH)-\d{4}$`.
  The refresh allocator and `nextEffectiveId()` compute it from the **effective
  corpus** (Legacy high-water mark + any per-book files already in the folder),
  so the next id can never collide with a promoted book. If you're hand-adding,
  `npm run test:book-file` reports the effective max per prefix; take +1.
- **`slug`** — clean URL slug; `slugify(slug) === slug` (the validator enforces
  it). This becomes `/buch/<slug>`.
- **`series`** — the canonical `series.id` (e.g. `"eisenhorn"`) or `null`. This
  replaces the legacy hard-coded external-id→series map; the file states its own
  anchor. `seriesIndex` is the integer position or `null`.

### 2 — Scaffold the file

Create `scripts/seed-data/books/<slug>.json`. Skeleton (see
`scripts/seed-data/books/README.md` for the field-by-field spec):

```jsonc
{
  "$schema": "book-v1",
  "externalBookId": "W40K-0600",
  "slug": "my-book",
  "title": "My Book",
  "authors": ["Author Name"],
  "editors": [],
  "authorship": { "editorialNote": null },
  "releaseYear": 2026,
  "format": "novel",
  "seriesHint": null,
  "series": null,
  "seriesIndex": null,
  "notes": null,
  "source": { "kind": "manual", "url": null, "confidence": null },
  "curation": {
    "synopsis": "…",
    "facetIds": [],
    "factions": [],
    "locations": [],
    "characters": [],
    "flags": []
  },
  "collections": { "collects": [], "containedIn": [] }
}
```

### 3 — Hard fields (lossless)

`title`, `authors[]`, `editors[]`, `authorship.editorialNote`
(`"various"` for an anthology with no single author, else `null`),
`releaseYear`, `format` (one of the 9 `book_format` enum values), `series` /
`seriesIndex`, `source`, and free `notes`. These round-trip **verbatim** — no
normalization. An anthology with mixed contributors uses
`authorship.editorialNote: "various"` and lists its editors in `editors[]`.

### 4 — Curation (lossless)

`curation.synopsis` (non-empty, and clean of the banned-pattern list the
validator checks), `facetIds` (validated against the live facet catalog by the
prolog-seeded set), and the `factions` / `locations` / `characters` entity
arrays (`{ name, role }`). `flags[]` and an optional `rating` object ride
through verbatim. Tag it the way the 859 were tagged.

### 5 — Collections (anthologies / omnibuses only)

If this book **contains** other books, list them in `collections.collects[]` —
the collection file **owns** those edges:

```jsonc
"collects": [
  { "externalBookId": "W40K-0601", "displayOrder": 0, "confidence": null, "basis": null }
]
```

- A plain (non-collection) book leaves `collects` empty.
- `containedIn` is a generated back-reference and is **ignored** by the applier.
- Every `collects[].externalBookId` must resolve somewhere in the effective
  corpus (Legacy or a per-book file). An unresolvable member halts the apply
  loud. Apply the **member** first (or use `--all`), then the collection.
- Applying `--slug <collection>` replaces *that* collection's edges idempotently;
  applying `--slug <member>` never touches `work_collections`.

### 6 — Validate (DB-free, no gate)

```bash
npm run test:book-file
```

Exercises the real loader/validator against the folder: `book-v1` schema, the
dup-guard (slug + externalBookId, intra-folder **and** vs Legacy), additive id
allocation, and the notes/curation round-trip. **Fix every red here** — this is
the cheap gate before anything touches the DB.

### 7 — PR → review → merge

The source file is a normal Batch/Ingestion strand change. Commit it on a task
branch, push, open a PR, let Philipp merge. The file lands on `main`
**before** it is applied — source-first, DB-second.

### 8 — Apply ⟶ **LIVE DB WRITE (explicit go only)**

```bash
npm run apply:book -- --slug <slug>     # one book
npm run apply:book -- --all             # every books/*.json (also the db:sync tail)
```

What it does, in order:

1. runs the **non-destructive reference/facet seed prolog** first, so a
   brand-new faction/location/facet exists before validation/resolution — no
   full `db:sync` needed;
2. validates facets / roles / synopses / ratings (halts before any mutation);
3. replaces details + junctions + links for the targeted work(s) **only**;
4. writes `book_details.primary_era_id = "time_ending"` on **insert and update**;
5. appends any auto-created authors/editors to `scripts/seed-data/persons.json`
   once at run end (commit that follow-up change).

Idempotent on `works.external_book_id` — re-running converges to the same state.
There is no `--dry` flag: invocation **is** the write (matching
`apply-override`). That is why it runs only on an explicit go.

### 9 — Verify

```bash
npm run apply:book -- --verify          # read-only; the db:drift per-book check
```

Asserts every `books/*.json` is present in `works` (slug match + `book_details`
row). Exit 0 = clean. If this book came from the **weekly refresh**, also run
`npm run refresh:mark-reviewed -- --books` so next week's report stops surfacing
it (§ weekly-refresh-runbook).

---

## Where it plugs into the existing machinery

- **`db:sync`** — `apply:book --all` is **step 3/10**, right after the Legacy
  corpus re-apply and before podcast/timeline/curation. An **empty** `books/`
  folder is a clean no-op, so until the first book is promoted `db:sync` is
  unchanged.
- **`db:drift`** — `apply:book --verify` is the read-only **per-book check**.
  Empty folder = pass.
- **`db:rebuild`** — inherits the per-book tail through the shared chain (it is
  `db:sync` minus the truncate).
- **Weekly refresh detection** — corpus-aware: a promoted per-book file is
  projected into the effective roster, so the book is never re-proposed as "new"
  and its id is never re-handed-out (`scripts/refresh/effective-corpus.ts`).

---

## What NOT to do

- **No live DB write without Philipp's explicit go.** Stations 1–7 + 9-verify
  are safe; station 8 is the gate.
- **No legacy path for a per-book book.** Never add it to
  `book-roster.extension.json`, never run `import:ssot-roster`, never create a
  batch/slot, never `loop:next` a book that lives in `books/`. The per-book and
  Legacy batch paths are disjoint.
- **No duplicate identity.** A slug/externalBookId may exist in exactly one
  world. The dup-guard enforces it; don't try to "move" a Legacy book here.
- **No `brain/**` or `sessions/README.md` edits** from this strand task.
