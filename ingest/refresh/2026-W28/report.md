# Weekly content refresh — 2026-W28

_Generated 2026-07-06T10:08:38.226Z by `refresh:check`. Detection only — nothing has been written to the DB._

## Summary

- **Books:** 2 new, 0 pending, 0 to review (source: ok)
- **Podcasts:** 2 new episode(s) — 4 ok, 0 failed, 0 skipped

## Books

Considered 79 in-scope, de-duplicated row(s) — skipped 572 below the year floor, 332 out-of-scope (other settings / weekly separators), 39 duplicate listing(s).

Plus 46 dismissed via the maintainer ignore-list (`ingest/refresh/book-ignore.json`) — duplicates / unwanted editions, never re-proposed.

### New since last review (2)

| Proposed ID | Title | Author(s) | Year | Format | Series hint | Conf. |
|---|---|---|---|---|---|---|
| `W40K-0600` | The Valhallan Regimental Banner | NA | 2026 | novel ⚠ | 40k - Imperial Guard | 0.6 |
| `W40K-0601` | The Sabbat Worlds Crusade | Dan Abnett | 2026 | novel ⚠ | 40k - Gaunt's Ghosts | 0.6 |

> ⚠ Format inferred from the tracker `Type` column; flagged rows had an unmappable type and defaulted to `novel` — verify before promotion.

### Pending backlog (0)

None.

### Books needing review (0)

None.

## Podcasts

_Each show is diffed from its own curation cursor — the date it was last reviewed up to (baseline **2026-01-01** when never reviewed). Episodes before the cursor, and titles matching a show's exclude patterns (e.g. "(Video)" twins), are ignored — only counted. Advance a cursor after curating with `npm run refresh:mark-reviewed -- --show <slug>`._

### ✅ The 40k Lorecast (`the-40k-lorecast`, rss)

Committed 154, fetched 154, **0 new since 2026-07-03** (154 before cursor ignored).

### ✅ Adeptus Ridiculous (`adeptus-ridiculous`, rss)

Committed 367, fetched 367, **0 new since 2026-07-03** (367 before cursor ignored).

### ✅ Lorehammer - A Warhammer 40k Podcast (`lorehammer`, rss)

Committed 391, fetched 619, **2 new since 2026-06-28** (614 before cursor, 2 title-excluded ignored).

- _2026-07-03_ Edition Eras Pt. 4 - 8th and 9th — https://podcasters.spotify.com/pod/show/lorehammerpodcast/episodes/Edition-Eras-Pt--4---8th-and-9th-e3lkhnd
- _2026-06-29_ Edition Eras Pt. 3 - 5th, 6th and 7th  — https://podcasters.spotify.com/pod/show/lorehammerpodcast/episodes/Edition-Eras-Pt--3---5th--6th-and-7th-e3l2dn8

### ✅ Luetin09 (`luetin09`, youtube)

Committed 192, fetched 1854, **0 new since 2026-07-03** (1854 before cursor ignored).

## Promote (maintainer, after review)

- **Books (per-book path, Brief 170):** scaffold `scripts/seed-data/books/<slug>.json` from the chosen `proposal.json` row (allocated externalBookId included), curate, then `npm run apply:book -- --slug <slug>` — no batch/slot/extension/import:ssot-roster/loop:next. See `scripts/runbooks/add-book-runbook.md` (+ `weekly-refresh-runbook.md` §Promote).
- **Podcasts (delta path, Brief 172):** acquire the show manifest, tag ONLY the new episodes, merge-delta into `ingest/podcasts/<slug>.extractions.json`, assemble, then `npm run apply:podcast -- --show <slug>` — never a full-show retag. See `scripts/runbooks/add-podcast-episode-runbook.md` (+ `weekly-db-update-runbook.md`).
- **Afterwards:** `npm run refresh:mark-reviewed -- --books` (after merging this PR — even if you promote/ignore nothing): marks everything listed here as seen, so next week's PR only shows what is genuinely new.

## Review prompt (copy-paste for Claude Code / Codex)

Hand the agent exactly this — the whole task is derivable from this PR:

```text
Review this weekly content-refresh PR (ingest/refresh/2026-W28/report.md + proposal.json).
It is DETECTION ONLY — nothing has been written to the database yet.

For each candidate, decide promote / ignore / defer:

Books (proposal.json → books.newBooks[] / books.pendingBooks[]):
  • Promote (per-book path, Brief 170): scaffold scripts/seed-data/books/<slug>.json from the
    chosen row (its allocated externalBookId is in proposal.json), curate it, then
    `npm run apply:book -- --slug <slug>`. NO batch file / slot / book-roster.extension.json /
    import:ssot-roster / loop:next. See scripts/runbooks/add-book-runbook.md.
  • Ignore (reprint / wrong edition / out of scope): `npm run refresh:ignore-book -- --title "<title>"`.
  • Defer: leave it — it rides the pending backlog and never re-opens this PR on its own.
  • Collisions (books.reviewBooks[]): a human call — new edition/omnibus vs duplicate.

Podcasts (proposal.json → podcasts.shows[].newEpisodes[], report-only — not roster rows):
  • Add new episodes (delta, Brief 172): acquire the show manifest, tag ONLY the new guids
    (`prepare-delta` → run-podcast-tag-loop.sh → `merge-delta`), assemble, then
    `npm run apply:podcast -- --show <slug>` (only on explicit DB confirmation — see below).
    NO full-show retag, no metered `ingest:podcast --show`. See scripts/runbooks/add-podcast-episode-runbook.md.

After reviewing, advance the cursors so next week shows only what is genuinely new.
SEQUENCING TRAP: run these AFTER this PR is merged AND fetched — the proposal lands on
`main` only on merge, so marking too early marks against last week's proposal:
  • `npm run refresh:mark-reviewed -- --books`           (marks this proposal's books seen)
  • `npm run refresh:mark-reviewed -- --show <slug>`     (per show reviewed; --all for every show)
  Run --books even if you promote/ignore nothing — "I have seen this list" is the whole point.

DO NOT write the production database unless Philipp explicitly confirms it in this session.
Without that confirmation, stay at: per-book files / ignore-list / curation-state file edits
+ this PR. The DB writes (apply:book, apply:podcast, db:sync) are the maintainer's call.
```
