# Weekly content refresh — 2026-W27

_Generated 2026-06-29T10:48:01.072Z by `refresh:check`. Detection only — nothing has been written to the DB._

## Summary

- **Books:** 0 new, 0 pending, 0 to review (source: ok)
- **Podcasts:** 9 new episode(s) — 4 ok, 0 failed, 0 skipped

## Books

Considered 75 in-scope, de-duplicated row(s) — skipped 572 below the year floor, 331 out-of-scope (other settings / weekly separators), 37 duplicate listing(s).

Plus 46 dismissed via the maintainer ignore-list (`ingest/refresh/book-ignore.json`) — duplicates / unwanted editions, never re-proposed.

### New since last review (0)

None.

### Pending backlog (0)

None.

### Books needing review (0)

None.

## Podcasts

_Each show is diffed from its own curation cursor — the date it was last reviewed up to (baseline **2026-01-01** when never reviewed). Episodes before the cursor, and titles matching a show's exclude patterns (e.g. "(Video)" twins), are ignored — only counted. Advance a cursor after curating with `npm run refresh:mark-reviewed -- --show <slug>`._

### ✅ The 40k Lorecast (`the-40k-lorecast`, rss)

Committed 149, fetched 153, **4 new since 2026-01-01** (125 before cursor ignored).

- _2026-06-22_ Episode 144 - The Word Bearers pt 1 - The creation of the Imperial Heralds and the complete opposite thing happening on Colchis — https://the40klorecast.com/
- _2026-06-15_ Episode 143 - Legion of the Damned, yeah turns out they were a little over the top. — https://the40klorecast.com/
- _2026-06-12_ Bonus Episode - Our Takes on 11th Edition — https://the40klorecast.com/
- _2026-06-08_ Episode 142 - Space Hulks, yeah.... they can be kind of a nightmare — https://the40klorecast.com/

### ✅ Adeptus Ridiculous (`adeptus-ridiculous`, rss)

Committed 363, fetched 366, **3 new since 2026-01-01** (339 before cursor ignored).

- _2026-06-24_ You Have Been Lied To About 40k Orks \| Warhammer 40k Lore
- _2026-06-17_ URIEL VENTRIS: Least Depressed Named Ultramarine \| Warhammer 40k Lore
- _2026-06-10_ CIAPHAS CAIN - HERO OF THE IMPERIUM \| Warhammer 40k Lore

### ✅ Lorehammer - A Warhammer 40k Podcast (`lorehammer`, rss)

Committed 391, fetched 617, **1 new since 2026-06-28** (615 before cursor, 1 title-excluded ignored).

- _2026-06-29_ Edition Eras Pt. 3 - 5th, 6th and 7th  — https://podcasters.spotify.com/pod/show/lorehammerpodcast/episodes/Edition-Eras-Pt--3---5th--6th-and-7th-e3l2dn8

### ✅ Luetin09 (`luetin09`, youtube)

Committed 191, fetched 1854, **1 new since 2026-01-01** (1849 before cursor ignored).

- _2026-06-13_ 40K LEGENDS - TRAZYN THE INFINITE \| Warhammer 40,000 Lore/History — https://www.youtube.com/watch?v=oMiv_wJqtLc

## Promote (maintainer, after review)

- **Books:** copy the chosen rows from `proposal.json` into `scripts/seed-data/book-roster.extension.json`, then `npm run import:ssot-roster` to merge, and curate/apply as usual. See `scripts/runbooks/weekly-refresh-runbook.md`.
- **Podcasts:** `npm run ingest:podcast -- --show <slug>` then `npm run apply:podcast`.
- **Afterwards:** `npm run refresh:mark-reviewed -- --books` (after merging this PR — even if you promote/ignore nothing): marks everything listed here as seen, so next week's PR only shows what is genuinely new.

## Review prompt (copy-paste for Claude Code / Codex)

Hand the agent exactly this — the whole task is derivable from this PR:

```text
Review this weekly content-refresh PR (ingest/refresh/2026-W27/report.md + proposal.json).
It is DETECTION ONLY — nothing has been written to the database yet.

For each candidate, decide promote / ignore / defer:

Books (proposal.json → books.newBooks[] / books.pendingBooks[], roster-extension-shaped):
  • Promote: copy the chosen rows verbatim into
    scripts/seed-data/book-roster.extension.json (books[]), then
    `npm run import:ssot-roster` to merge them into book-roster.json.
  • Ignore (reprint / wrong edition / out of scope): `npm run refresh:ignore-book -- --title "<title>"`.
  • Defer: leave it — it rides the pending backlog and never re-opens this PR on its own.
  • Collisions (books.reviewBooks[]): a human call — new edition/omnibus vs duplicate.

Podcasts (proposal.json → podcasts.shows[].newEpisodes[], report-only — not roster rows):
  • Ingest a show: `PODCAST_LLM_MODEL=claude-sonnet-4-6 npm run ingest:podcast -- --show <slug>`,
    then `npm run apply:podcast -- --show <slug>` (only on explicit DB confirmation — see below).

After reviewing, advance the cursors so next week shows only what is genuinely new.
SEQUENCING TRAP: run these AFTER this PR is merged AND fetched — the proposal lands on
`main` only on merge, so marking too early marks against last week's proposal:
  • `npm run refresh:mark-reviewed -- --books`           (marks this proposal's books seen)
  • `npm run refresh:mark-reviewed -- --show <slug>`     (per show reviewed; --all for every show)
  Run --books even if you promote/ignore nothing — "I have seen this list" is the whole point.

DO NOT write the production database unless Philipp explicitly confirms it in this session.
Without that confirmation, stay at: roster-extension / ignore-list / curation-state file edits
+ this PR. The DB writes (apply:podcast, db:apply-override, db:rebuild) are the maintainer's call.
```
