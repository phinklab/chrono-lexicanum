---
session: 2026-06-07-122
role: implementer
date: 2026-06-07
status: complete
slug: lorehammer-onboard
parent: 2026-06-03-122
links:
  - 2026-06-06-122
  - 2026-06-04-128
  - 2026-06-02-114
commits: []
---

# 122-B1 — Onboard "Lorehammer - A Warhammer 40k Podcast" (third show)

## Summary

Lorehammer is onboarded as the third podcast show through the existing
registry-driven pipeline (S1–S3, PRs #130–#132) with **zero TypeScript change** —
one registry entry plus `--show lorehammer` runs of the existing CLIs. The full
feed (**603 episodes, measured**) is ingested into a committed artifact + report,
applied idempotently to the Dev DB (apply #2: `inserted: 0`), with **0 duplicate
`external_links` groups** and entity anchoring verified (`loadEntity` surfaces a
`podcast_episode` WorkGroup). Poorhammer and any further show are out of scope and
untouched.

## Follow-up — dropped in-feed (Video) duplicates (same session)

The Lorehammer feed double-lists most episodes: once normally and once with a
leading `(Video)` marker on an otherwise-identical title (the audio rip of a video
upload), each with its own GUID — so both survived GUID-dedup and landed as
duplicate episode works. Per the maintainer's call, the `(Video)` episodes that
have an audio twin were **deleted** from both the committed artifact and the Dev
DB; the **12 video-only** `(Video)` episodes (no audio counterpart) were **kept**,
with the `(Video)` prefix stripped so they read cleanly.

- **Episodes: 603 → 391** (dropped 212 audio-twin duplicates; relabeled 12 video-only).
- DB after cleanup: **391 episodes, 0 `(Video)` titles**; the FK cascade removed the
  212 dropped episodes' detail / junction / external-link rows.
- Regenerated artifact + report: coverage 282/391 (72.1%); 653 resolved tags
  (128 character / 436 faction / 89 location); episode kinds 305 lore · 12 interview
  · 74 other; show links 3; episode links 391/391; 203 unresolved forms.
- Done as a **one-time data cleanup** (throwaway script, deleted) — *not* a pipeline
  change. The quirk is Lorehammer-specific (the other two shows have 0 `(Video)`
  titles). Caveat: a *cold* re-ingest of Lorehammer would regenerate the full 603;
  if re-ingesting becomes routine, add a feed-level twin-filter at that point.

## What I did

- `scripts/seed-data/podcast-shows.json` — **the only source edit.** Appended the
  `lorehammer` entry (slug, title, `feedUrl`, `appleId: 1266540593`,
  `podcastGuid: null`, one curated link `official_website → https://linktr.ee/Lorehammer40k`,
  `youtubeChannelUrl/Id: null`). 12-line pure addition, LF, no BOM.
- `ingest/podcasts/lorehammer.json` — generated artifact, **603 episodes** (all
  parsed `<item>`s; not hard-pinned). Show identity `podcastGuid=null → feedUrl`.
- `ingest/podcasts/lorehammer.report.md` — generated quality report (coverage,
  tag breakdown, episode kinds, 212-row unresolved-forms table, 10-episode
  spot-check).
- Ran (no code change): smoke ingest `--limit=5`, full cold ingest, dry-run apply
  (the `assertShowArtifact` gate), two live applies (idempotency), and a
  **throwaway** `scripts/_tmp-lorehammer-verify.ts` for the DB checks — **deleted
  before staging** (confirmed absent from `git status`).

## Ingest results (measured)

| metric | value |
|---|---|
| Episodes parsed / in artifact | **603** |
| Episodes with ≥1 resolved tag | 453 (75.1 %) |
| Resolved tags total | 1108 — 235 character, 712 faction, 161 location |
| Episode kinds | 490 lore · 0 news_recap · 14 interview · 99 other |
| Distinct unresolved surface-forms | 212 (459 occurrences, **not** written) |
| Show links | 3 (apple_podcasts, official_website, rss) |
| Episode links | 603/603 carry an RSS audio link |
| Cold-run cost | $4.47 (tokens 1,117,902 in / 74,132 out); warm re-run $0 |
| Extraction model | `claude-sonnet-4-6`, prompt `3f6a5ff87efa` |

Artifact integrity (pre-apply): `episodes.length = 603`, **0 empty GUIDs, 0
duplicate GUIDs**, no `podcasters.spotify.com` leak in `show.links`. GUIDs are a
stable mix of spreaker-URL (`https://api.spreaker.com/episode/…`), podbean, and
UUID forms — none fall back to title/audioUrl.

## Decisions I made

- **No code change.** The registry parser already accepts `podcastGuid: null`,
  derives `rss` from `feedUrl` and `apple_podcasts` from `appleId`, and
  `--show lorehammer` selects only this show without touching the default
  (`the-40k-lorecast`). Confirmed by code reading + the `test:podcast-ingest`
  registry smoke (uses `.includes()`, not a length assertion).
- **Linktree → `official_website`, kept.** `https://linktr.ee/Lorehammer40k` is
  entered as the one curated link. The page itself returns **HTTP 403 to
  WebFetch** (linktr.ee bot-blocks), so it could not be fetched directly;
  provenance is instead **self-attested in the feed** — the channel
  `<description>` declares the linktree as its "Link to all Links". Apple lookup
  (`id=1266540593`) confirmed name = Lorehammer and the feedUrl matches the
  anchor URL.
- **`podcasters.spotify.com/pod/show/lorehammerpodcast` deliberately NOT entered
  as `spotify`.** It is a creator-dashboard URL, not a listener
  `open.spotify.com/show/<id>` link. `feed.ts` never reads the channel `<link>`,
  so the only leak path would be a manual registry entry — which I did not make.
  Verified post-apply: no `podcasters.spotify.com` in `external_links`.
- **Spotify + YouTube omitted.** The feed's show-notes contained several
  *different* `open.spotify.com/show/<id>` URLs (cross-promo, not unambiguously
  Lorehammer's own) and no canonical YouTube channel was verifiable this run.
  Per the "only if unambiguously verified" rule, both are omitted; RSS + Apple
  still auto-derive, so the show is fully linkable.
- **Idempotency gated on apply #1's printed summary.** Both live applies ran in
  the background (≈16–20 min each > the 10-min tool cap); apply #2 was launched
  only after apply #1 printed `Episodes in DB for show: 603`.

## Verification

**Five required gates** (throwaway script deleted first):

- `npm run lint` — **pass** (exit 0)
- `npm run typecheck` — **pass** (`tsc --noEmit`, exit 0, no output)
- `npm run test:podcast-ingest` — **pass** (30 passed, 0 failed)
- `npm run test:podcast-apply` — **pass** (37 passed, 0 failed)
- `npm run brain:lint -- --no-write` — **pass** (0 blocking; 13 pre-existing warnings)

**Run-derived gates:**

- **Dry-run apply** — `assertShowArtifact` passed (no dup/colliding GUID);
  `Identity: podcastGuid=— feedUrl=…`; Episodes 603; junctions 1108; links show 3
  / ep 603; **0 dropped** canonicalIds (all resolved tags map to existing
  reference rows).
- **Two live applies, side by side:**

  | | apply #1 | apply #2 (idempotency) |
  |---|---|---|
  | Show | **inserted** `3d206568-…` | **updated** `3d206568-…` (same uuid) |
  | Episodes inserted | 603 | **0** |
  | Episodes updated | 0 | 603 |
  | Episodes in DB | 603 | 603 |
  | Junctions char/faction/loc | 235 / 712 / 161 | 235 / 712 / 161 |
  | Links show / episodes | 3 / 603 | 3 / 603 |

- **DB checks** (throwaway script): **0 duplicate `external_links` groups** over
  show + episode work ids (`GROUP BY (work_id, service_id, kind, url) HAVING
  count(*)>1` — proven explicitly, the table has no unique constraint);
  `external_links` = show 3, episodes 603.
- **Top-10 anchors** (by distinct episodes):
  - **Factions:** imperium 73 · adeptus_astartes 61 · orks 55 · chaos 42 ·
    eldar 39 · tau 32 · necrons 28 · tyranids 26 · mechanicus 24 ·
    astra_militarum 19.
  - **Characters:** the_emperor 66 · horus 20 · roboute_guilliman 14 ·
    sanguinius 14 · fulgrim 12 · angron 10 · rogal_dorn 10 · nurgle 9 ·
    ferrus_manus 8 · jaghatai_khan 8.
  - **Locations:** terra 35 · tau_empire 13 · ultramar 10 · great_rift 9 ·
    eye_of_terror 8 · commorragh 7 · webway 6 · medusa 6 · chogoris 5 ·
    istvaan_v 4.
- **`loadEntity` smoke:** `loadEntity("faction", "imperium")` returns
  `worksByKind = book(7), podcast_episode(123)` — a `podcast_episode` WorkGroup
  is **present** with 123 works. (123 spans all three shows tagged `imperium`;
  ground-truth cross-check confirms **73** of them are Lorehammer episodes.
  `loadEntity` is not show-scoped, which is correct.)

## Open issues / blockers

None. The work is complete and verified. **Held for the maintainer's "fertig" /
"PR erstellen"** before push/PR (standing worktree workflow).

## For next session

- **Inert `podcast_episode` WorkGroup label (Product follow-up).** The WorkGroup
  surfaces with the raw kind string `podcast_episode` as its `label` (no friendly
  UI label, no episode renderer). Entity anchoring is correct at the data layer;
  presenting podcast episodes on entity pages is a Product-strand task.
- **Unresolved-form curation candidates.** 212 distinct unresolved surface-forms;
  the high-frequency ones (`The Warp` ×25, `Knights of Slaughter` ×10,
  `Leagues of Votann` / `League of Votann`, `Severan Dominate`, `Farsight
  Enclaves`) are either real missing canonical entities or alias-module variants —
  a future curation/alias pass, **not** auto-created here (out of scope).
- **`apply-podcast.ts` IN-list ergonomics.** A throwaway `GROUP BY (work_id =
  $param)` over a 603-id `IN (…)` errored under the pooler; per-side `count(*)`
  queries were the clean path. No production impact (the apply itself never does
  this), noted only for any future verify tooling.

## References

- Brief 122 board (`sessions/2026-06-03-122-arch-batches-board.md`); B1 plan
  reconciliation (`sessions/2026-06-04-128-impl-podcast-b1-plan-reconciliation.md`).
- Prior shows: S1 (#130), S2 (#131, `…-s2-registry-ingest.md`), S3 (#132,
  `…-s3-apply-links.md`).
- Apple lookup: `https://itunes.apple.com/lookup?id=1266540593`.
- Feed: `https://anchor.fm/s/1070b29c8/podcast/rss`.
