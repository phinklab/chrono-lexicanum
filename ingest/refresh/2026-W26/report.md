# Weekly content refresh — 2026-W26

_Generated 2026-06-22T11:45:10.472Z by `refresh:check`. Detection only — nothing has been written to the DB._

## Summary

- **Books:** 1 new, 0 pending, 0 to review (source: ok)
- **Podcasts:** 11 new episode(s) — 4 ok, 0 failed, 0 skipped

## Books

Considered 74 in-scope, de-duplicated row(s) — skipped 572 below the year floor, 330 out-of-scope (other settings / weekly separators), 35 duplicate listing(s).

Plus 46 dismissed via the maintainer ignore-list (`ingest/refresh/book-ignore.json`) — duplicates / unwanted editions, never re-proposed.

### New since last review (1)

| Proposed ID | Title | Author(s) | Year | Format | Series hint | Conf. |
|---|---|---|---|---|---|---|
| `W40K-0593` | Armageddon: Season of Fire | Jude Reid | 2026 | novel | 40k | 0.6 |

### Pending backlog (0)

None.

### Books needing review (0)

None.

## Podcasts

_Each show is diffed from its own curation cursor — the date it was last reviewed up to (baseline **2026-01-01** when never reviewed). Episodes before the cursor, and titles matching a show's exclude patterns (e.g. "(Video)" twins), are ignored — only counted. Advance a cursor after curating with `npm run refresh:mark-reviewed -- --show <slug>`._

### ✅ The 40k Lorecast (`the-40k-lorecast`, rss)

Committed 149, fetched 152, **3 new since 2026-01-01** (125 before cursor ignored).

- _2026-06-15_ Episode 143 - Legion of the Damned, yeah turns out they were a little over the top. — https://the40klorecast.com/
- _2026-06-12_ Bonus Episode - Our Takes on 11th Edition — https://the40klorecast.com/
- _2026-06-08_ Episode 142 - Space Hulks, yeah.... they can be kind of a nightmare — https://the40klorecast.com/

### ✅ Adeptus Ridiculous (`adeptus-ridiculous`, rss)

Committed 363, fetched 365, **2 new since 2026-01-01** (339 before cursor ignored).

- _2026-06-17_ URIEL VENTRIS: Least Depressed Named Ultramarine \| Warhammer 40k Lore
- _2026-06-10_ CIAPHAS CAIN - HERO OF THE IMPERIUM \| Warhammer 40k Lore

### ✅ Lorehammer - A Warhammer 40k Podcast (`lorehammer`, rss)

Committed 391, fetched 613, **5 new since 2026-01-01** (524 before cursor, 44 title-excluded ignored).

- _2026-06-22_ Edition Eras Pt. 1 - 1st and 2nd — https://podcasters.spotify.com/pod/show/lorehammerpodcast/episodes/Edition-Eras-Pt--1---1st-and-2nd-e3l2a8u
- _2026-06-19_ 239 - Astartes Armoury: Rare and Retired Vehicles Pt. 3 — https://podcasters.spotify.com/pod/show/lorehammerpodcast/episodes/239---Astartes-Armoury-Rare-and-Retired-Vehicles-Pt--3-e3l0o10
- _2026-06-15_ 238 - Astartes Armoury: Rare and Retired Vehicles Pt. 2 — https://podcasters.spotify.com/pod/show/lorehammerpodcast/episodes/238---Astartes-Armoury-Rare-and-Retired-Vehicles-Pt--2-e3kpq5f
- _2026-06-12_ 237 - Astartes Armoury: Rare and Retired Vehicles Pt. 1  — https://podcasters.spotify.com/pod/show/lorehammerpodcast/episodes/237---Astartes-Armoury-Rare-and-Retired-Vehicles-Pt--1-e3kn4dc
- _2026-06-08_ 236 - Astartes Armoury: Aircraft — https://podcasters.spotify.com/pod/show/lorehammerpodcast/episodes/236---Astartes-Armoury-Aircraft-e3kfgo4

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
Review this weekly content-refresh PR (ingest/refresh/2026-W26/report.md + proposal.json).
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
