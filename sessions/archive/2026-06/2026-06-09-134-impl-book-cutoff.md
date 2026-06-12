---
session: 2026-06-09-134
role: implementer
date: 2026-06-09
status: complete         # book ignore-list ("book cutoff") + the YouTube CI secret
slug: book-cutoff
parent: 2026-06-09-133    # extends the weekly content refresh (Brief 133 / Board 122-B10)
links:
  - 2026-06-09-133        # weekly-refresh detection (PR1) + cron/rolling-PR (PR2)
commits: []              # filled by the PR; this report rides inside the code branch
---

# Weekly refresh follow-up — the book "cutoff" (ignore-list) + the YouTube CI secret

> No arch brief — a maintainer-requested follow-up after the **first live cron run**
> (`weekly-refresh` workflow_dispatch, 2026-06-09, opened rolling PR #152 with 61 new
> books + 15 review). Two asks fell out of reviewing that PR.

## Summary

1. **`YOUTUBE_API_KEY` is now a GitHub repo secret.** The first run reported luetin09
   skipped — the key was only in the maintainer's local `.env.local` (which CI never
   sees). Set the repo secret from that value; the cron now diffs the YouTube show too
   (episodes 2 → 3).
2. **Book ignore-list ("book cutoff") — the book analog of the podcast curation cursor.**
   The weekly book diff had no way to *dismiss* a candidate, so the same duplicates /
   unwanted editions resurfaced every week (the 15 title-collisions were permanent
   noise, and ~30 of the 61 "new" were editions/omnibuses/already-in books). New
   `ingest/refresh/book-ignore.json` + a `refresh:ignore-book` CLI suppress them; the
   maintainer dismissed **46** books, collapsing the proposal to the **30** genuinely
   wanted new books (0 review).

Detection-only and reversible: this PR ships the mechanism + the populated ignore-list.
**No DB write, no roster change** — promoting the surviving 30 (roster-extension →
`import:ssot-roster` → resolver) is the deliberate next step, after this merges
(maintainer chose "feature PR first, then promote").

## What I did

- **`scripts/refresh/book-ignore.ts` (new)** — load / parse / serialize / add, mirroring
  `curation-state.ts`. State is `{ books: { <title-slug>: { title, reason } } }`,
  committed deterministically (slugs sorted, trailing newline). `parseBookIgnore`
  **self-validates** that every key equals `slugify(title)` — the diff matches on
  `slugify(candidate.title)`, so a drifted key would silently never fire; failing loud
  at load makes a hand-edited file safe.
- **`scripts/refresh/book-source.ts`** — `detectMissingBooks` takes a trailing,
  defaulted `ignoreSlugs: ReadonlySet<string>`. A candidate whose `titleSlug` is in the
  set is dropped **after dedup, before classification** — it reaches neither `newBooks`
  nor `reviewBooks` — and is counted in a new `skippedIgnoredRows`. Trailing param so
  the ~10 existing positional call sites / tests are untouched.
- **`scripts/refresh/types.ts`** — `BookDiffResult.skippedIgnoredRows`.
- **`scripts/refresh/emit.ts`** — report surfaces `Plus N dismissed via the maintainer
  ignore-list` (count + file pointer; never silent, matching the pipeline's ethos).
- **`scripts/refresh-check.ts`** — loads the ignore-list, passes the slug-set to the
  diff, logs `N ignore-listed` in the `[books]` health line.
- **`scripts/refresh-ignore-book.ts` (new)** + npm `refresh:ignore-book` — parity with
  `refresh:mark-reviewed`. Dismiss by `--title` (no proposal needed), by `--id`
  (resolves a proposed new-book id against the latest `proposal.json`), or `--all-review`
  (every current collision at once). `--reason` stamps an audit note. No DB, no network.
- **`scripts/test-refresh.ts`** — +6 cases: diff drops would-be-new AND would-be-review
  + counts them; empty set is a no-op; module round-trip / sorted / self-validation guard.
- **`ingest/refresh/book-ignore.json` (new)** — the 46 dismissals, populated via the CLI.

## Decisions I made

- **Key on title-slug, not the proposed `W40K-####` id.** The live re-run proved why:
  once the 31 dismissed-new books drop out, the allocator re-packs and every surviving
  id shifts (Carnage Unending `W40K-0573 → W40K-0572`). An id-keyed ignore-list would
  now point at the wrong books; `slugify(title)` is stable and is the exact key the
  collision detector already uses. Caveat: a future genuinely-different book with an
  identical title would be auto-suppressed — rare in 40k, and the weekly report still
  shows the dismissed count.
- **Drop before classification, count separately.** `skippedIgnoredRows` is its own
  bucket (not folded into `consideredRows`), so the report arithmetic stays legible:
  76 candidates = 30 new + 0 review + 46 dismissed.
- **Populated via the CLI's `--title` path, not hand-authored JSON.** The same
  `slugify` the diff uses computes every key, so they match real candidates by
  construction (the self-validation guard would catch a drift anyway).
- **The 46/30 split** (maintainer calls, two `AskUserQuestion`s):
  - Dismiss **46** = the 15 title-collisions + 30 explicitly-listed new books + **The
    Imperial Infantryman's Handbook** (a sourcebook, dismissed alongside the artbook per
    the "keep omnibuses, drop Handbook" answer).
  - Promote **30** = the rest, incl. the 8 omnibus/collection titles the maintainer
    chose to keep (Dark Coil Ascension/Damnation, Legends of the Waaagh!/of the Wolf,
    Saints of the Imperium, Ciaphas Cain: The Anthology, The Shattered and the Soulless,
    Soldiers of the Imperium).
  - Reasons bucketed in the file: `title-slug collision` (15), `already in the roster …`
    (15), `format/edition not archived …` (16).

## Verification

- **`npm run test:refresh`** — 50 passed, 0 failed (was 46; +the ignore cases).
- **`npm run typecheck`** (tsc strict) + **`npm run lint`** (eslint) — both clean.
- **Live `npm run refresh:check`** (real tracker + feeds + the local YouTube key) with
  the populated ignore-list: `[books] ok — 30 new, 0 review | 73 considered, 46
  ignore-listed, …`; report renders the dismissed line; **all 46 slugs matched real
  candidates** (review → 0). `REFRESH_RESULT=findings books=30 episodes=3` (luetin09 now
  returns its new video). The throwaway `ingest/refresh/2026-W24/` artifact was removed —
  the cron owns the week dirs; only `book-ignore.json` is committed.

## Deferred to the next step (after this merges)

- **Promote the 30.** Roster-extension rows for the surviving new books →
  `scripts/seed-data/book-roster.extension.json` → `npm run import:ssot-roster` → curate
  → resolver ingest. The maintainer wants these in the DB; sequenced as its own pass so
  the cutoff mechanism lands as a clean, reviewable PR first.
- Once the rolling PR #152 regenerates post-merge it will show the 30/0/46 picture
  (and 3 episodes) instead of 61/15.

## Rollup facts for Cowork (Batches strand — I can't touch `brain/**`)

- **New surface:** `ingest/refresh/book-ignore.json` (committed feature state, the book
  analog of `curation-state.json`) + npm `refresh:ignore-book`. The weekly book diff now
  drops ignore-listed title-slugs before bucketing; `BookDiffResult.skippedIgnoredRows`
  + a report line surface the count.
- **Curation model unchanged:** the ignore-list is a *notifier* tweak — it only affects
  what the weekly detection surfaces. No DB write; promotion stays maintainer-driven.
- **Ops:** `YOUTUBE_API_KEY` is now a repo secret (CI parity with local). First live cron
  run succeeded after the "Allow Actions to create PRs" setting was enabled (the earlier
  403 was that setting, not a bug); rolling PR identity remains `automation/weekly-refresh`.
- **Open follow-up (small):** the ignore-list grows unbounded and is keyed on title-slug
  (rare same-title over-suppression). A `refresh:ignore-book --list` / prune affordance,
  or aliasing the "already in roster" dupes so the firewall recognises them as `exact`
  instead, are both possible tightenings — neither blocking.

## References

- Weekly refresh: `sessions/2026-06-09-133-{arch,impl-weekly-content-refresh,impl-weekly-cron}.md`.
- Runbook: `scripts/runbooks/weekly-refresh-runbook.md`.
- First live run: `weekly-refresh` run 27235178229 → rolling PR #152.
