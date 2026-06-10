# Weekly content refresh — 2026-W24

_Generated 2026-06-10T22:42:59.048Z by `refresh:check`. Detection only — nothing has been written to the DB._

## Summary

- **Books:** 0 new, 0 to review (source: ok)
- **Podcasts:** 3 new episode(s) — 4 ok, 0 failed, 0 skipped

## Books

Considered 73 in-scope, de-duplicated row(s) — skipped 572 below the year floor, 330 out-of-scope (other settings / weekly separators), 31 duplicate listing(s).

Plus 46 dismissed via the maintainer ignore-list (`ingest/refresh/book-ignore.json`) — duplicates / unwanted editions, never re-proposed.

### New books (0)

None.

### Books needing review (0)

None.

## Podcasts

_Each show is diffed from its own curation cursor — the date it was last reviewed up to (baseline **2026-01-01** when never reviewed). Episodes before the cursor, and titles matching a show's exclude patterns (e.g. "(Video)" twins), are ignored — only counted. Advance a cursor after curating with `npm run refresh:mark-reviewed -- --show <slug>`._

### ✅ The 40k Lorecast (`the-40k-lorecast`, rss)

Committed 149, fetched 150, **1 new since 2026-01-01** (125 before cursor ignored).

- _2026-06-08_ Episode 142 - Space Hulks, yeah.... they can be kind of a nightmare — https://the40klorecast.com/

### ✅ Adeptus Ridiculous (`adeptus-ridiculous`, rss)

Committed 363, fetched 364, **1 new since 2026-01-01** (339 before cursor ignored).

- _2026-06-10_ CIAPHAS CAIN - HERO OF THE IMPERIUM \| Warhammer 40k Lore

### ✅ Lorehammer - A Warhammer 40k Podcast (`lorehammer`, rss)

Committed 391, fetched 605, **1 new since 2026-01-01** (524 before cursor, 40 title-excluded ignored).

- _2026-06-08_ 236 - Astartes Armoury: Aircraft — https://podcasters.spotify.com/pod/show/lorehammerpodcast/episodes/236---Astartes-Armoury-Aircraft-e3kfgo4

### ✅ Luetin09 (`luetin09`, youtube)

Committed 191, fetched 1853, **0 new since 2026-01-01** (1849 before cursor ignored).

## Promote (maintainer, after review)

- **Books:** copy the chosen rows from `proposal.json` into `scripts/seed-data/book-roster.extension.json`, then `npm run import:ssot-roster` to merge, and curate/apply as usual. See `scripts/runbooks/weekly-refresh-runbook.md`.
- **Podcasts:** `npm run ingest:podcast -- --show <slug>` then `npm run apply:podcast`.
