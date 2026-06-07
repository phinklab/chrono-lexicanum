---
session: 2026-06-07-130
role: implementer
date: 2026-06-07
status: complete
slug: youtube-source-adapter
parent: 2026-06-07-130
links:
  - 2026-06-03-122
  - 2026-06-04-128
  - 2026-06-01-110
  - 2026-06-02-114
commits: []
---

# YouTube-as-source adapter — @luetin09 als YouTube-only Podcast-Show

## Summary

A second source-acquisition path (`src/lib/ingestion/podcast/youtube.ts`) feeds
the **YouTube Data API v3** uploads of **@luetin09** into the *exact* existing
`ParsedFeed` contract, so the unchanged downstream (LLM extract → alias resolve →
artifact assembly → apply) tags it like any RSS show. The committed demo
artifact (`ingest/podcasts/luetin09.json`, **10 newest non-excluded uploads**)
is structurally identical to an RSS artifact — only field *values* differ
(`audioUrl:null`, YouTube `watch` links, episode-link `sourceKind:youtube`).
**No DB writes, no schema/migration change.**

**Curation refinement (Philipp 2026-06-07, after the first dry-run).** The raw
three-playlist denylist removed **138** uploads, but the
*Discussion / News / Speculation* playlist (109 videos) mixes off-topic
news/game/hobby with genuine in-universe lore deep-dives. Philipp asked to
rescue the lore-ish ones ("like Belisarius Cawl"). I added a per-video
**`includeVideoIds`** allowlist that overrides the playlist denylist, classified
all 138 excluded videos (3-framing adversarial majority vote — balanced /
skeptic / lore-archivist — see "Decisions"), and curated **41** genuine lore
videos back in. Net effect: **97 of 1951** uploads now excluded, 41 force-included.
The demo's newest-10 is now lore-dominated (7 of 10 are rescued deep-dives:
Belisarius Cawl, Silent Death of STC, Dark Age of AI, Dark Angels/return of the
Lion, the Sleeper Legion, Yarrick 11ED, Rise & Fall of Human Civilizations).

## What I did

- `src/lib/ingestion/podcast/youtube.ts` *(new)* — the adapter. Network fetch
  (paginated Data API v3 GETs: `channels.list` → uploads `playlistItems` →
  `playlists`+`playlistItems` for the denylist → `videos.list` hydration) is
  **cleanly separated** from pure, fixture-tested mappers
  (`parseIso8601Duration`, `mapChannelItem`, `mapVideoToEpisode`,
  `resolveExcludedPlaylistIds`, `selectUploadVideoIds`). Returns the exact
  `ParsedFeed` plus the resolved channel id + canonical uploads-feed URL +
  acquisition stats. **Metadata only — no media download in any path.** Reads no
  `process.env` (the key is passed in), and never echoes the key in errors/logs.
- `src/lib/ingestion/podcast/links.ts` — `buildShowLinks`/`buildEpisodeLinks`
  are now **source-aware** (the one deliberately source-aware seam; source is
  passed **explicitly**, never inferred from a URL/`audioUrl`): a YouTube show
  derives **no** `rss` feed link (keeps only its channel link); a YouTube episode
  carries one `{youtube, watch, sourceKind:youtube, 1.0}` link instead of an
  audio enclosure. RSS behaviour byte-for-byte unchanged (default source `rss`).
- `src/lib/ingestion/podcast/registry.ts` — `source` discriminator
  (`"rss" | "youtube"`, default `rss`, back-compatible) + `excludePlaylists`
  (denylist titles; validated, and rejected on a non-youtube entry) +
  `includeVideoIds` (per-video allowlist that overrides the playlist denylist —
  the curation seam; same youtube-only validation).
- `src/lib/ingestion/podcast/youtube.ts` — pure `applyIncludeOverrides`
  (subtract the curated ids from the playlist denylist, count the real hits) and
  a `reincludedVideoCount` acquisition stat; the orchestrator applies it between
  building the denylist and selecting uploads. Metadata-only, env-free, unchanged
  otherwise.
- `src/lib/ingestion/podcast/types.ts` — `PodcastLinkSourceKind` +
  `PODCAST_LINK_SOURCE_KINDS` gained `"youtube"` (types-only; the DB
  `source_kind` pgEnum already carried it — no migration).
- `src/lib/ingestion/podcast/artifact.ts` — threads `source` into
  `buildEpisodeLinks` and into `buildReport` **without adding a `source` key to
  the committed JSON** (structural parity preserved — the report is generated
  separately from the artifact).
- `src/lib/ingestion/podcast/apply-plan.ts` — `assertLinks` now accepts the
  `youtube` provenance (via the extended const); stale error message made
  dynamic. No write-path change.
- `scripts/ingest-podcast.ts` — `acquireFeed` source-dispatch; `--limit` applied
  in **one** place for both sources; YouTube `feedUrl` recorded as the canonical
  channel-id-bound URL; per-show + run-level `YOUTUBE_API_KEY` handling.
- `scripts/seed-data/podcast-shows.json` — **verified** luetin09 entry
  (`source:"youtube"`, `youtubeChannelId:"UC8RfCCzWsMgNspTI-GTFenQ"`,
  canonical `feedUrl`, the three denylist titles). RSS entries untouched.
- `scripts/test-podcast-youtube.ts` *(new, 25 tests)* + `.env.example` block +
  `package.json` `test:podcast-youtube` script. `test-podcast-{ingest,apply}.ts`
  touched only for the new required registry fields / the now-accepted `youtube`
  sourceKind.
- `ingest/podcasts/luetin09.json` + `.report.md` *(new committed artifact)*.

## Decisions I made

- **`--limit` lives in the adapter (efficiency), not "fetch-all-then-slice".**
  The review panel suggested making the adapter return *all* episodes and slicing
  downstream "for symmetry". I did the opposite for the reason the brief gives:
  hydrating all 1951 uploads to tag 10 is wasteful. The adapter acquires the
  newest non-excluded uploads up to `--limit` and hydrates only those (the demo
  is one `videos.list` call). I instead made `acquireFeed` the **single**
  limiting point for *both* sources (RSS slices after parse), removing the
  redundant second slice and the misleading "10 episodes" log — symmetry without
  the over-fetch.
- **Denylist by exact playlist TITLE, resolved at run time, fail-loud on a
  miss.** The registry carries the three human-readable titles Philipp gave;
  the adapter resolves them to ids against the live channel and throws (listing
  available titles) if one no longer matches — so a rename can never silently
  leak unwanted videos. A denylist (exclude the 3) beats an allowlist (union of
  "good" playlists): a fresh lore upload not yet in any playlist still gets in.
- **Lore-rescue curation by per-video allowlist, decided by an adversarial
  3-framing majority vote.** Rather than narrow the denylist (which would re-admit
  the genuine off-topic news/game/hobby videos too), I kept all three playlists
  denylisted and added an `includeVideoIds` allowlist that re-admits specific
  curated ids. I classified every one of the 138 excluded videos with three
  independent LLM framings — *balanced*, *skeptic* (default-drop, refute weak
  keeps), *lore-archivist* (inclusive but firm on dropping game/hobby/news/meta) —
  and took the majority. Result: **41 keep / 97 drop**, 39 of the 41 keeps
  unanimous (3-0), only 2 split votes (both 2-1 keeps: "5 Biggest Problems in 40K
  Lore", "Rise & Fall of Human Civilizations [2]"). I hand-audited every
  Lore-tagged DROP and confirmed each is correctly off-topic (edition-launch news,
  gameplay, trailer-promo, reading-guide/meta). The kept set is exactly the
  in-universe lore: character/faction deep-dives (Cawl, Valdor, Szeras, Yarrick),
  in-universe speculation ("Will Dorn return?", "What if the Tau ruled?", "Is the
  Emperor a false god?"), and lore-first game-hook deep-dives (Darktide Lore,
  Titus Lore, Arbites Lore). Video ids are permanent, so the allowlist never goes
  stale; a future lore upload newly filed under Discussion/News/Speculation simply
  needs its id added (safe default: excluded, never leaked). The full keep-list is
  tabulated below ("Curated include-list").
- **YouTube `feedUrl` is the canonical channel-id-bound uploads-feed URL**
  (`…/feeds/videos.xml?channel_id=UC…`), resolved live and recorded on the
  artifact; it is an *identity/provenance* string only — never fetched, never
  turned into an `rss` link. (`podcastGuid` is null for YouTube, so this is the
  apply's stable identity.)
- **`video`/`video_details` deliberately NOT used** — luetin09 lands as
  `podcast`/`podcast_episode` per the brief's hard "same place, same format,
  same downstream" requirement.
- **Did NOT touch the real apply** (`apply-podcast.ts` still hardcodes
  `sourceKind:"podcast_rss"` on the show/episode works). Out of scope per the
  brief; see "For next session".

## Verification

- `npm run typecheck` — pass. `npm run lint` — pass.
- `npm run test:podcast-youtube` — **29 pass** (duration parser incl. days/zero/
  fractional/junk; channel+video mappers vs a committed fixture; denylist
  resolver incl. loud-miss + duplicate-title; **`applyIncludeOverrides` +
  selection-survives-override**; selection order/dedup/limit determinism;
  source-aware link builders; registry source/denylist/**includeVideoIds**
  parsing; structural parity youtube≅rss; apply-plan accepts the youtube
  provenance; the committed luetin09 entry rescues the Belisarius Cawl id).
- `npm run test:podcast-ingest` — 30 pass (regression). `npm run test:podcast-apply`
  — 37 pass (regression; youtube sourceKind now asserted accepted).
- **Live demo (curated):** `npm run ingest:podcast -- --show luetin09 --limit=10` →
  resolved `UC8RfCCzWsMgNspTI-GTFenQ`, 1951 uploads, **97 on denylist, 41 curated
  lore force-included**, **9/10 (90%) tagged**, all `lore`, 10/10 `youtube/watch`
  links, `audioUrl:null`. The newest-10 is now 7 rescued deep-dives + 3 regular
  uploads. Re-run = **byte-identical** artifact (warm cache, 10/10 cache hits).
- **Apply dry-run:** `npm run apply:podcast -- --show luetin09 --dry-run` →
  plan: 10 episodes, 24 tag-junctions, `external_links` show 1 (youtube) +
  10 episode watch links, **no rows written**. Confirms the curated artifact is
  valid through `buildApplyPlan` and shows the final DB mapping.
- **Adversarial multi-agent review** of the diff (4 dimensions → verify): 4
  confirmed findings, all fixed (limit-semantics/log, source-neutral naming,
  stale `sourceKind` error messages in registry + apply-plan, a determinism test
  that sorted before asserting).

## Open questions (answered)

- **Total uploads:** `pageInfo.totalResults = 1951`. Full backfill is large —
  do NOT run unlimited LLM tagging casually (1951 × Haiku ≈ a few $; and ~40
  `playlistItems` pages per run regardless of `--limit`, which is fine on quota
  but slow).
- **Channel id + verification:** `UC8RfCCzWsMgNspTI-GTFenQ`, resolved via
  `channels.list?forHandle=luetin09`, cross-checked: title "Luetin09",
  `customUrl @luetin09`, country GB, description = "…Warhammer 40,000…lore".
  Now pinned in the registry (adapter uses the stable `id=` path).
- **Shorts/streams:** none in the newest ~15 uploads (all 56 min–2h25m
  long-form lore). Not filtered in v1 (parity with RSS). Older shorts may exist;
  a duration-floor filter is a cheap later option if wanted.
- **Tag coverage:** 9/10 (90%) — on par with / above the RSS shows.
- **Private/deleted items:** the adapter tolerates them — selected ids absent
  from `videos.list` are counted (`skippedUnavailable`) and skipped, never fatal
  (0 in the demo run).

## Open issues / blockers

- **None blocking.** One thing to confirm (not a bug): the denylist's reach —
  see below.

## For next session

- **Denylist reach — RESOLVED via curation (Philipp 2026-06-07).** The raw
  three-playlist denylist removed 138 uploads, sweeping up genuine lore Luetin had
  filed under *Discussion / News / Speculation* (Cawl, Silent Death of STC, …).
  Rather than confirm-and-leave, Philipp asked to rescue the lore-ish ones; the
  `includeVideoIds` allowlist (41 curated ids, below) does exactly that. Net
  exclusion is now **97 of 1951**, all off-topic (game/hobby/news/meta/the Riven
  Myst playthrough). A handful of *defensibly borderline* keeps are worth a glance
  if he wants to trim: the two "Diorama feature | LORE/HISTORY" entries (half
  hobby, but lore-tagged + lore content), the opinion/rant-flavoured lore pieces
  ("A Major Flaw in 40K", "5 Biggest Problems in 40K Lore", "Canon & Retcon"),
  and "Rise & Fall of Human Civilizations [2]" (the one keep with no 40k token in
  its title — almost certainly Age-of-Strife lore on this channel, but it resolved
  0 tags). Removing any is a one-line registry edit + free warm re-run.
- **Real DB-apply of luetin09 (own brief, the brief's "documented follow-step").**
  `apply-podcast.ts` hardcodes `sourceKind:"podcast_rss"` on the show work
  (~Z.249) and every episode work (~Z.327); for a `source:"youtube"` show both
  must become `"youtube"` (enum value exists) — i.e. carry the `source`
  discriminator from registry/artifact into the apply. `upsertShow` identity
  (`podcastGuid → feedUrl → slug`) already works for luetin09 (feedUrl populated).
  Review the dry-run, then write.
- **Backfill efficiency (optional).** A future "newest-only" mode could poll just
  the first `playlistItems` page instead of paginating all 1951 — out of scope
  here, noted in the brief.

## Curated include-list (41 lore videos rescued past the denylist)

The `includeVideoIds` entries in `scripts/seed-data/podcast-shows.json`, in
chronological order. All are members of *Discussion / News / Speculation* (the
hobby + Riven playlists held no lore). Two were 2-1 split votes (flagged `‡`);
the rest unanimous 3-0.

| videoId | title |
|---|---|
| cvztagq4Qjc | IMPERIUM OF MAN — Warhammer 40,000 Overview |
| OLZSYIit51c | IMPERIAL ROSARIUS - DataSlate [1] — Lore/History |
| BIFPX0sQxNE | THE NOBLE NAVIGATOR - Diorama/Mini feature — LORE/HISTORY |
| uVCz2BnuAhY | THE FORGOTTEN TITAN - Diorama feature — LORE/HISTORY |
| g0XnCkSMdxE | 40K 1ST EDITION - 10 STRANGER THINGS — Lore/History |
| AdyWUNTXEB0 | THE ZOATS RETURN TO 40K - WIDER IMPLICATIONS — Lore/History |
| PwkYMoj0XaU | CANON & RETCON are NOT A THING IN 40K — Lore Discuss |
| d3nSQbxye3Y | 40K - NECRONS - ILLUMINOR SZERAS — Lore/History |
| QAxLjPxpIMU | 40K LUETIN TALKS - VALDOR BIRTH OF THE IMPERIUM — Lore/History |
| YhM_7l8vCOc | 40K LUETIN TALKS - ORKS BRUTAL KUNNIN — Lore/History |
| K70SayjIkbk | 40K - OCTARIUS JUST GOT REAL - Orks v Krieg v Tyranids — Lore/Speculation |
| Zzb5hz36ESs | 40K - WHAT IS SLAANESH? WILL THE AELDARI DESTROY THE GALAXY? — Lore/Discussion |
| VwLoEhgcyzc | DARKTIDE LORE - EXCLUSIVE DEEP DIVE — Lore/History |
| lbHC6bviq7A | 40K - THE EMPEROR OF MANKIND IS A FALSE GOD — Lore/Speculation |
| 2GVc1n-iDy4 | 40K - THE EMPEROR OF MANKIND A FALSE GOD [2] — Lore/Speculation |
| GoIOkIXXM64 | DARKTIDE LORE: REJECTS, HERETICS & INQUISITORS — Lore/History |
| XL82jQ0TTRQ | HOW TIME FUNCTIONS IN 40K - THE EMPEROR, THE OLD ONES, NECRON — Lore/Speculation |
| zW_qh6cV8Rk | SO. YOU DECIDED TO TIME TRAVEL TO 40K? — Lore/Speculation |
| wRpfm6_x83o | CAWL'S NEXUS PLAN COULD CHANGE EVERYTHING — Lore/Speculation |
| 7pc2yVnvQZg | 40K - DORN MUST STAY DEAD - Returning Primarchs — Lore/Speculation |
| LUnB4QAj-bw | A MAJOR FLAW IN 40K — Lore/History/Opinion |
| Fy1TQbDVgJg | 40K - NO ONE NOTICED THIS FOR 10,000 YEARS? — Lore/Discussion |
| NZyXxDH6c8k | THE END OF SLAANESH IN 40K? — Lore/Discussion |
| BzA7s1SRydg | DARK MECHANICUM RISING — Lore/History/Speculation |
| aEqFxpRAjNI | SPACE MARINE 2 - TITUS LORE - DEEP DIVE — Lore/History |
| eAAUCd_ZaWI | HIVE CITY APOCALYPSE - FOREVER WINTER but its 40K? — Lore/Speculation |
| Z9A1tWHuyrc | WHAT IF TAU RULED THE 40K GALAXY? — Lore/Speculation |
| NtVl-GrS2iI | 5 BIGGEST PROBLEMS IN 40K LORE - That GW Can't Fix! — Lore/Discussion ‡ |
| eoV0XJg3x18 | YOU'LL NEVER SEE THEM AGAIN? - Imperial Guard Regiments — Lore/Discussion |
| PAGqDoFV9lo | WHAT IF - ASTARTES NEVER EXISTED? — Lore/Speculation |
| maj9xHyyKXI | ROGAL DORN - DEAD OR ALIVE? - Returning Primarchs — Lore/Speculation |
| wjU7QJE3it0 | THIS DISGRACE - MUST END!! - 40K Legends - YARRICK — Lore/Discussion |
| WQ_OoUMySI0 | 40K ARBITES LORE - DARKTIDE DEEP DIVE — Lore/History |
| 8Zndv3WBLwg | AFTERMATH OF THE HERESY - The Era of Ruin & Scouring Begins — Lore/Discussion |
| tl8Izv0MKPQ | THE SLEEPER LEGION - WHO WON THE HERESY — Lore/History |
| wJo6HBaWklc | 40K - THE DARK AGE OF AI and THE STC LIE — Lore/Speculation |
| SyxozCJS0F0 | 40K - THE DARK ANGELS - and return of THE LION — Lore/History |
| WkWh3q3Cry0 | BELISARIUS CAWL - THE TRUE OMNISSIAH? — Lore/History |
| WqRuXAiM_qI | THE RISE & FALL OF HUMAN CIVILIZATIONS [2] - SURVIVORS OF THE APOCALYPSE ‡ |
| TUMVRrTPGPs | 40K 11ED - VINDICATION FOR YARRICK - AMID LORE ARMAGEDDON — History/Rant/Lore |
| LW6q9AexPlw | 40K - THE SILENT DEATH OF STC - Anything goes now? — Lore/Discussion |

The 97 dropped videos are the entire Riven Myst playthrough (21), all hobby/
painting/army-update/diorama videos (the 17 HOBBY-playlist entries + minis
entries in DNS), video-game gameplay/reviews/betas (Total War, Dawn of War,
Battlefleet Gothic, Chaos Gate, Eternal Crusade, Space Hulk Tactics, Darktide &
Space Marine 2 *gameplay*), GW news/product/edition-launch/trailer-promo, channel
meta (giveaways, channel updates, "where to start" guides, collab chats), and the
homebrew "Luetin Necropolis" fan-fiction.

## References

- YouTube Data API v3: `channels.list` (`forHandle`/`id`, `contentDetails.relatedPlaylists.uploads`),
  `playlistItems.list` (`contentDetails.videoId`/`videoPublishedAt`),
  `playlists.list`, `videos.list` (`snippet`,`contentDetails.duration` ISO-8601).
- Brief `sessions/2026-06-07-130-arch-youtube-source-adapter.md`.
