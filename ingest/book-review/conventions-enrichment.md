# Book-enrichment conventions — Stage 3 web pass (Brief 155, B11)

The committed semantics an **ENRICHER** and a **VERIFIER** subsession read before
turning a confirmed structural sentinel into a catalog proposal. This pass does
**not** decide whether an entity belongs to a book — B11 already did that
(synopsis-based finder + adversarial verifier). Here the entity is **known to
belong**; the job is to **enrich it to a full catalog entry** with the fields a
Map pin / Ask ranking needs that no synopsis carries.

> **You write PROPOSALS, never truth.** Every output is a read-only suggestion
> with cited sources + confidence; a maintainer hand-gate materializes it. A
> field you cannot evidence stays **null** — never guessed.

Scope: **factions + locations only.** Characters are out of scope — never emit one.

## The unit of work

One **sentinel** at a time: an `__unresolved__:faction|location:<slug>` with its
`rawName` (the surface form the book used) and the source book's title + synopsis
(for disambiguation — "Fire Caste" in a T'au novel vs. elsewhere). Use the
source book as the disambiguation anchor, not your headcanon.

## Trust hierarchy + evidence threshold (mandatory)

You **research**, you do not recall. Rank your sources:

1. **Lexicanum** (`lexicanum.com`) — **primary** for existence, canonical
   identity, and the structural fields (Segmentum/sector, parent Legion/Chapter,
   alignment). A single credible Lexicanum hit is sufficient.
2. **Warhammer 40k Fandom / Wikia** (`warhammer40k.fandom.com`) — **secondary**,
   to confirm or fill what Lexicanum lacks.
3. **Wikipedia / Black Library** — **only** for publication facts (author, year,
   series). **Never** the basis for an in-universe field (alignment, sector,
   parent, coordinates).

**Edition-independent.** A credible wiki hit establishes existence + structural
fields regardless of which edition introduced the entity. Do **not** over-narrow
("only 3rd-edition codex confirms it") — one credible hit is enough. Equally, do
**not** invent: no hit → the sentinel stays unresolved.

Every `new`/`alias` proposal carries **at least one `sources[]` entry** (url +
trust rank) and a `confidence` in [0,1].

## Dedup FIRST (mandatory)

Before proposing a **new** entity, check whether it already exists:

- Read `scripts/seed-data/factions.json` / `locations.json` and the alias maps
  `faction-aliases.json` / `location-aliases.json`.
- If the canonical entity your research identifies is **already in the catalog**
  (possibly under a different name, only the surface form was un-aliased) →
  emit **`decision: "alias"`** with `aliasTo` = the existing canonical `id`. Do
  **not** create a duplicate.
- Only when no existing entity matches → **`decision: "new"`**.

(The merge re-runs this check deterministically; an exact name/alias hit there
will override a `new` to an `alias`, but you should catch it first.)

## Field vocabulary per axis (pinned — read the values, do not invent them)

The chunk input hands you the **live controlled vocab** (`vocab.alignments`,
`vocab.tones`, `vocab.sectors`). Use those exact values.

### Faction (`decision: "new"` → `faction` payload)
- `canonicalName` — the canonical display name (e.g. "Excoriators").
- `proposedId` — a lower `snake_case` id suggestion (e.g. `excoriators`).
- `parent` — an **existing faction `id`** from `factions.json` (e.g. a Chapter's
  parent `adeptus_astartes`, a Legion's `heretic_astartes`), or `null` if it is
  genuinely top-level. Never a made-up id.
- `alignment` — exactly one of `vocab.alignments` (`imperium` / `chaos` /
  `xenos`), or `null` if unclear.
- `tone` — one of `vocab.tones`, or `null`. Do not coin a new tone.
- `glyph` — optional short label, or `null`.
- **No coordinates** — factions are not placed on the map.

### Location (`decision: "new"` → `location` payload)
- `canonicalName`, `proposedId` — as above.
- `sector` — an **existing sector `id`** from `vocab.sectors` (the Segmentum /
  named sector the world sits in), or `null` if not evidenced.
- `placeable` — `true` **only** if a canonical galactic position is documented.
- `gx` / `gy` — galactic coordinates, populated **only when `placeable` is true
  and a position is genuinely documented**; otherwise `null`. **Never guess
  coordinates.** A world with a known sector but no documented position is
  `sector`-only (`placeable: false`, coords `null`) — that is the correct,
  honest answer, not a failure.
- `tags` — faction/thematic tags (free strings, e.g. `["imperium","dark_angels"]`).
- `capital` / `destroyed` / `warp` — booleans where evidenced, else `null`.

## The three decisions

- **`new`** — real, canonically identified, not in the catalog → full payload +
  sources.
- **`alias`** — already exists → `aliasTo` an existing id + sources.
- **`unresolved`** — no credible hit → no payload; the sentinel stays
  `__unresolved__`. Better an honest unresolved than a guessed entity.

## Verifier stance (mandatory checks)

You are an independent skeptic checking the enricher's **derived facts** against
its cited sources. Default to **refute** when the evidence is thin.

- **Existence** (every proposal) — is this a real, canonically-identified entity
  matching the source book's context? Refute → the merge keeps it a sentinel.
- **Faction `alignment` + `parent`** (mandatory — these drive Ask) — does the
  cited source support them? Refute a field → the merge blanks just that field.
- **Location `sector`** — sector-level plausibility only.
- **Coordinates are deliberately fuzzy** — do **not** refute a placed location
  over pixel precision; sector plausibility is the bar.

Confirm a fact only when the cited source clearly supports it. "Could be" →
refute, with a reason.
