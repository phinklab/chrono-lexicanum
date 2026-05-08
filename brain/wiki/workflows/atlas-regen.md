---
title: Atlas regeneration workflow
type: workflow
created: 2026-05-09
updated: 2026-05-09
sources:
  - ../../../sessions/2026-05-08-049-arch-karpathy-brain-atlas-reset.md
  - ../../../scripts/atlas-regen.ts
related:
  - ../decisions/karpathy-reset-2026-05-08.md
  - ../onboarding.md
  - ../book-data-overview.md
confidence: high
---

# Atlas regeneration

The Atlas is the external Obsidian vault that holds the **book domain** (~800 W40k novels with synopses, factions, characters, sources, ratings, …). Postgres is canonical; the Atlas is a **mechanical mirror** generated via `npm run atlas:regen`. Brain ([`brain/`](../../CLAUDE.md), where you're reading) does NOT hold per-book detail.

## When to regen

The Atlas is **read-only and allowed to be stale.** Postgres is truth. Run `npm run atlas:regen` when:

- **Before visual inspection.** You want to browse the book graph in Obsidian (e.g. before a Reddit-launch screenshot or to check that a faction's books cluster correctly).
- **Before a phase boundary.** Closing Phase 3, opening Phase 4 — refresh so the snapshot in your reading is current.
- **After a major DB change.** A 3d-Apply landed N hundred new rows; regen so Atlas reflects the new state.
- **Once a month for hygiene** if you're using the Atlas in your weekly reading.

Do **not** regen automatically (e.g. as a cron after every pipeline run). Stale Atlas is fine; coupling it to writes creates race-condition surface for no benefit.

## How to run

```bash
npm run atlas:regen
# Default output: ~/chrono-atlas/ (i.e. C:\Users\<you>\chrono-atlas\ on Windows)
```

CLI flags:

- `--out=<path>` — override the vault location.
- `--help` — print usage.

The script:

1. Ensures the vault folder + `books/` + `factions/` + `INDEX.md` exist (`mkdir -p` semantically; idempotent).
2. Connects to Postgres via the existing `src/db/client.ts` (reads `DATABASE_URL` from `.env.local`).
3. Queries works/factions/eras/etc., emits Markdown files with Obsidian-style Wikilinks (`[[books/<slug>|<title>]]`).
4. Overwrites existing files. Does NOT delete files for entities removed from Postgres (orphans accumulate; a `--prune` flag is a future enhancement).
5. Writes `INDEX.md` with generation timestamp and per-collection counts.

Empty-DB graceful: if Postgres has 0 works, the script writes `INDEX.md` with an "empty DB — regen will populate after first 3d-Apply" banner and creates empty `books/` + `factions/` folders. No crash.

## Configuration

- **`DATABASE_URL`** in `.env.local` — required (the script uses `tsx --env-file=.env.local`).
- **`ATLAS_PATH`** env var (optional) — overrides the default vault path. CLI `--out=<path>` overrides this in turn.

If `DATABASE_URL` is missing, the script exits 1 with a clear message ("DATABASE_URL not set in .env.local; check ONBOARDING.md").

## Vault structure (after regen)

```
~/chrono-atlas/
├── INDEX.md                     ← generation timestamp + counts + pointers
├── books/
│   ├── eisenhorn-xenos.md       ← per-book page with frontmatter + Wikilinks
│   ├── ...
└── factions/
    ├── thousand_sons.md
    ├── ...
```

Per-book Markdown files include synopsis, primary era, primary faction, factions involved, source provenance, plus `[[Wikilinks]]` to related entities. Faction files cross-link to books featuring them.

## Discrepancy with DB — what to do

If you spot an Atlas claim that disagrees with Postgres (e.g. a book's faction is wrong):

1. **Postgres wins.** Don't edit the Atlas Markdown — it'll be overwritten on next regen.
2. Find the bug. Either Postgres data is wrong (fix in `seed-data/*.json` or via override in 3d-Apply), or the regen-script is rendering wrong (fix the script).
3. Re-run `npm run atlas:regen`.

The Atlas being overwritable is the safety: there's no edit-it-back-into-truth path. Truth flows DB → Atlas, never reverse.

## Out-of-scope (today)

- **Per-book extras.** The 049-skeleton renders a single proof-of-render book + faction. Full per-entity rendering is a follow-up brief, sized after we've seen the skeleton in Obsidian and know what's missing.
- **Quality views.** Cross-page queries (e.g. "books with `value_outside_vocabulary` flag", "all M30 novels with no Hardcover-rating") are Dataview-plugin territory in Obsidian — added later if we use the Atlas regularly.
- **Auto-trigger from 3d-Apply.** Brief 049 explicitly defers this — manual is fine for now.
- **Pruning of orphaned files.** If a work is removed from Postgres (rare), the corresponding `books/<slug>.md` lingers in the Atlas. Add a `--prune` flag if this becomes painful.
- **Multi-language renderings.** German/English split is a Phase-7+ concern.

## Why manual is fine

Atlas is not a critical read-path for app or pipeline. It's a *visualization layer* for browsing. Manual regen costs ~10 seconds when you actually want a fresh view. Auto-trigger costs a coupling that's hard to undo and adds race-condition surface during 3d-Apply (Atlas writing while pipeline is writing). Lazy + manual is correct here.

If manual ever feels painful (you regen and forget; visualizations get stale and mislead), open a brief to wire an auto-trigger — but expect that brief to spend more time on race-condition handling than on the actual hook.
