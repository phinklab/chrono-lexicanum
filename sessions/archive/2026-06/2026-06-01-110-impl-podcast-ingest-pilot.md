---
session: 2026-06-01-110
role: implementer
date: 2026-06-01
status: implemented
slug: podcast-ingest-pilot
parent: 2026-05-31-110-arch-podcast-ingest-pilot
links:
  - 2026-05-31-110-arch-podcast-ingest-pilot
  - 2026-05-31-109
  - 2026-06-01-104-impl-alias-aware-drift
  - 2026-05-29-105-impl-data-buy-listen-links
commits: []
---

# Podcast track — Step 1 (pilot ingest + episode tagging) — impl report

> **Worktree:** `chrono-lexicanum-batches`, Strang: Batch/Ingestion, Branch: `codex/ingest-batches-podcast-pilot` (von `origin/main`).

## Summary

Shipped Step 1: fetch the pilot show's RSS feed, extract each episode's subject entities via the LLM, resolve them against the existing canonical set by **reusing `resolveSurfaceForm` from `src/lib/aliases`** (no forked alias logic), and emit a committed artifact + quality report. **No schema, no DB, no new reference rows** — the diff is the new podcast library + script + test, one parser dependency, the artifact/report, and this report.

**Headline (full pilot, run with Sonnet per Philipp):** **148 episodes, 136 (91.9 %) carry ≥1 resolved tag**; **510 tags** (365 subject / 145 mentioned; 265 faction / 151 character / 94 location); **126 distinct unresolved surface-forms**. The spot-check is clean — `Asdrubael Vect`, `Sanguinius`, `Cypher`, `Sigismund` resolve by canonical name; `"The Fallen" → fallen_angels`, `"Drukhari"/"Craftworld Aeldari" → eldar`, `"Luna Wolves" → sons_of_horus`, `"Isstvan V" → istvaan_v` resolve via registered aliases. A second run with a warm cache reproduces the artifact **byte-for-byte** (verified by sha256).

Title+description tagging is good enough for this lore-heavy show; transcripts are not needed for the pilot (OQ 1). My Step-2 lean: **dedicated `podcast` + `podcast_episode` kinds** modelled on the existing `channel`/`video` CTI shape, with the episode `<guid>` in its own key column (OQ 3).

## What I did

New library under `src/lib/ingestion/podcast/` (testable units) + a thin `scripts/` entrypoint, mirroring `src/lib/ingestion/llm/` + `scripts/ingest-backfill.ts`:

- **`types.ts`** — `PodcastEpisode`, `EpisodeExtraction` (per-axis `primary`/`mentioned` + `episodeKind`), `EpisodeTag` (`type, canonicalId, rawName, role, confidence, matchedVia`), `UnresolvedForm`, `EpisodeArtifact`, `ShowArtifact`.
- **`feed.ts`** — `fetchFeed` (native `fetch`, the repo's shared User-Agent + 30 s `AbortSignal`, mirroring `wikipedia/fetch.ts`); `parseFeed` via **`fast-xml-parser`** (keeps namespaced tags `itunes:*`/`content:encoded`/`podcast:guid` verbatim; values left as raw strings and coerced explicitly); `htmlToText` (cheerio — zero new dep, mirrors `llm/context.ts`); `parseDurationToSeconds`; `decodeEntities`. All pure helpers are unit-tested.
- **`extract.ts`** — `extractEpisodeEntities`: a podcast-specific forced tool call (`publish_episode_entities`, `temperature: 0`, retry-once-on-schema-violation) reusing the book pipeline's LLM primitives (`getLlmModel`, the `@anthropic-ai/sdk` call+retry shape). `getPodcastLlmModel()` = `PODCAST_LLM_MODEL` else `getLlmModel()`. Hand-rolled, no-`any` tool-output validator mirroring `llm/parse.ts`.
- **`cache.ts`** — one file per show under `ingest/.llm-cache/` (gitignored), a `{ cacheKey → entry }` map keyed by sha256(model :: promptVersion :: guid :: normalized text). Mirrors `llm/cache.ts`.
- **`resolve.ts`** — `resolveEpisodeTags`: the only resolution path, calling **`resolveSurfaceForm`**. The LLM bucket supplies `role` + (on a miss) `axisGuess`; the authoritative `type` comes from the alias resolution itself. Confidence `1.0` canonical-name / `0.9` alias-key. Dedup by `(type, canonicalId)`, subject beats mentioned. Unresolved forms recorded verbatim, never auto-created.
- **`artifact.ts`** — `buildShowArtifact` (sorts episodes by `(pubDate, guid)`, tags + unresolved deterministically), `serializeArtifact` (`JSON.stringify(…, 2) + "\n"`, no wall-clock timestamps), `buildReport` (coverage %, counts by type/role, episodeKind breakdown, the full unresolved list by frequency, a 10-episode evenly-spaced spot-check).
- **`scripts/ingest-podcast.ts`** — CLI (`--limit`, `--feed`, `--slug`, `--apple-id`); pilot config constant; fetch → parse → per-episode extract (cached, persisted progressively) → resolve → assemble → write `ingest/podcasts/the-40k-lorecast.json` + `.report.md`; clear error if `isLlmEnabled()` is false. Prints a token/cost summary to stdout (kept OUT of the committed report — it's cache-dependent).
- **`scripts/test-podcast-ingest.ts`** — DB/network/LLM-free unit tests (mirrors `test-aliases.ts`): feed parsing incl. namespaced fields, entity decoding, `htmlToText`, duration parsing, alias-resolution of an extraction (registered forms + a junk form → unresolved + dedup), and artifact byte-stability + sort order. **10 passed, 0 failed.**

Modified: `package.json` (+`fast-xml-parser@^5.8.0`, +`ingest:podcast`, +`test:podcast-ingest`), `package-lock.json`, `.env.example` (documents `PODCAST_LLM_MODEL`). Generated + committed: `ingest/podcasts/the-40k-lorecast.json` + `.report.md`. Flipped this brief `status: open → implemented`.

## Decisions I made

- **Reused the LLM PRIMITIVES, not `enrichBookWithLLM`.** That function is book-shaped (`MergedBook` input, book tool schema, cache keyed on book fields). I built a podcast-specific extraction (primary/mentioned split, `episodeKind`) on top of the same `getLlmModel` / SDK-call-with-retry / `ingest/.llm-cache/` patterns. The *resolution* half is a true reuse — `resolveSurfaceForm` verbatim.
- **Model = Sonnet via an env knob, not a pinned string** (version policy). `getPodcastLlmModel()` reads `PODCAST_LLM_MODEL` and falls back to the book pipeline's `getLlmModel()`. The pilot ran with `PODCAST_LLM_MODEL=claude-sonnet-4-6` (Philipp's call: full pilot, Sonnet not Haiku). Independent from the book model so the two pipelines can diverge.
- **`fast-xml-parser@^5.8.0`** (current stable) over `rss-parser` — the latter drags in the heavier `xml2js`. HTML→text uses the already-present `cheerio` (no second new dep). Researched current stable per the version policy.
- **`decodeEntities` pass** — `fast-xml-parser` decodes named XML entities (`&amp;`) but leaves numeric references intact, and RedCircle encodes the `pubDate` timezone as `&#43;0000` (→ unparseable date → every `pubDate` was `null` on first run) plus apostrophes as `&#39;`. A single decode pass over the values not routed through cheerio fixes dates, titles, and `&amp;` in enclosure URLs. Caught it in the 5-episode smoke before the full run.
- **Determinism without committing the cache.** The artifact is sorted + timestamp-free; the LLM runs at `temperature: 0` and is cached. The cache lives in the gitignored `ingest/.llm-cache/`, so the committed deliverable is the artifact, and a warm-cache re-run is byte-identical (verified). A cold re-run re-queries the model (near-identical, not guaranteed identical) — stated honestly in the report.
- **Captured `episodeKind` rather than just zero-tagging bonus/recap episodes** (OQ 5) — `lore | news_recap | interview | other`. Gives a later UI a flag to hide non-lore episodes instead of guessing from an empty tag list.
- **Impl report carries the system facts** (Rollup-Ownership): I'm in a strand worktree, so I touched no `brain/**`; the catalog/state/log backfill is Cowork's post-merge pass.

## Verification

- `npm run test:podcast-ingest` → **10 passed, 0 failed.**
- `npm run typecheck` (`tsc --noEmit`) → **green (exit 0).**
- `npm run lint` (`eslint .`) → **green (exit 0).**
- **Full pilot run** (`PODCAST_LLM_MODEL=claude-sonnet-4-6 npm run ingest:podcast`, live Anthropic API): 148 episodes, 136 tagged (91.9 %), 510 tags, 126 distinct unresolved, **est. $1.30**, tokens 335 937 in / 19 529 out.
- **Determinism:** sha256 of `the-40k-lorecast.json` before vs after a warm-cache re-run → **identical**; re-run reported **148/148 cache hits, $0.0000**.
- `git status` file set: only `src/lib/ingestion/podcast/**`, the two `scripts/*.ts`, `package.json`/`package-lock.json`, `.env.example`, `ingest/podcasts/**`, and the session docs. `ingest/.llm-cache/podcast-the-40k-lorecast.json` confirmed gitignored; `ingest/podcasts/the-40k-lorecast.json` confirmed NOT ignored (committed).

### Acceptance checklist (brief)
- [x] Committed artifact: every episode with metadata (`guid`, title, date, duration, audio URL, link) + resolved tags (`type`, `canonicalId`, `rawName`, `role`, `confidence`) + unresolved forms.
- [x] Quality report: total, % with ≥1 tag, counts by type, unresolved list, 10-episode spot-check.
- [x] Resolution reuses the alias library (report's "Method" section; no forked logic).
- [x] Second run reproduces the artifact (determinism — byte-identical, stated in the report).
- [x] No schema/DB change; diff = script(s) + artifact + report + parser dep.
- [x] `npm run typecheck`, `npm run lint` green.
- [ ] PR opened (not merged); this brief flipped to `implemented` in the PR. ← on PR creation.

## Open questions — answers for the next architect session

1. **Tagging quality.** 91.9 % resolved coverage; the spot-check is clean and the aliases are doing real work (`Drukhari`/`Craftworld Aeldari` → `eldar`, `The Fallen` → `fallen_angels`, `Luna Wolves` → `sons_of_horus`, `Isstvan V` → `istvaan_v`). **Title + description suffices for this show** — its episode titles are explicitly topic-named ("Episode 138 - The Night Lords pt3 …"). Transcripts are *not* needed for the pilot. Caveat: shows with cryptic/jokey titles and thin notes will resolve worse; judge per-show at Step 3 before assuming title+desc scales.

2. **Unresolved surface-forms (126 distinct).** Three buckets:
   - **Real missing entities worth curating:** `Leagues of Votann`, `Be'lakor`, `Eldrad`, `Magnus`, `Skarbrand`, `Imotekh the Stormlord`, `Kaldor Draigo`, `Vulkan He'Stan`, `The Silent King`/`Szarek`, `Old Ones`, `Necrontyr`, `The Nightbringer`, `Cegorach`, `Aun'va`, `Vespid`, `Jokaero`, …
   - **Alias gaps the module should learn** (the canonical entity *exists*, only the surface form is unregistered): `Guilliman` → `roboute_guilliman` (the full name resolves; the short form doesn't), `Vect` → `asdrubael_vect`, `Magnus` → `magnus_the_red`, `Demetrian Titus`/`Titus`, `The Webway`/`the immaterium`/`Immaterium` → existing warp/webway locations.
   - **Noise / common nouns, not entities:** `Commissar`, `Exarch`, `Astropaths`, `Navigators`, `Hive Cities`, `Forge World`, `Knight World`, `Kabals`. These should stay unresolved (the LLM over-extracted generics); a future prompt tweak could suppress them.
   So: a mix — the first two buckets are a concrete, prioritisable worklist; the third argues for slightly tighter extraction guidance, not new entities. Adding the alias-gap forms to `*-aliases.json` (Batches strand) is the cheapest immediate win.

3. **Step-2 modeling (my input).** I read the schema. **Lean: add dedicated `podcast` + `podcast_episode` work kinds**, *modelled on* the existing `channel`/`video` CTI (which is the right shape — a container work + a unit work with a self-link) but **not by overloading `video`**: a podcast episode is audio (enclosure MP3 + `durationSec`, no video URL/YouTube channel), and overloading `video` muddies every "all videos" query. So: `podcast_details` (≈ `channel_details`: `feedUrl`, `podcastGuid`, `appleId`, `imageUrl`) and `podcast_episode_details` (≈ `video_details`, incl. a `podcastWorkId` self-link mirroring `video_details.channelWorkId`, plus `audioUrl`, `durationSec`, `pubDate`, `season`, `episode`, `episodeKind`). **Stable episode ID:** the feed `<guid>` is ~36 chars and arbitrary-length by RSS spec, and `works.externalBookId` is `varchar(16)` + book-named — so episodes need **their own key**: `podcast_episode_details.episodeGuid text UNIQUE` (the idempotent apply keys on it). Add a `source_kind` value like `podcast_rss`. Tags map 1:1 onto the existing `work_characters`/`work_factions`/`work_locations` junctions with `role='subject'|'mentioned'` (Brief 109 §7) — the artifact already carries `rawName` + `confidence` for the audit trail.

4. **Role vocabulary.** `subject` + `mentioned` was sufficient across all 148 episodes — I never wanted a third value. Hosts/guests are people-not-entities and are captured by `episodeKind`, not a role. Recommend keeping the two.

5. **Bonus/news/recap episodes.** Captured as `episodeKind` rather than left as bare zero-tag gaps: **139 `lore`, 9 `other`** (bonus/retro-recall episodes), **0 `news_recap`, 0 `interview`** (this show doesn't do those formats). Persist `episodeKind` in Step 2 so the UI can hide/segregate non-lore episodes. The 12 untagged episodes = the 9 `other` + 3 concept-only lore episodes (e.g. "Imperial Psychers, Black Ships, and the Astronomican", "Hive worlds") whose subjects aren't canonical entities — a genuine, expected gap, not a bug.

## For next session

- **Step 2 (Batches):** schema (`podcast`/`podcast_episode` kinds + detail tables per OQ 3), a `podcast_rss` `source_kind`, and an idempotent dry-run→apply keyed on `episodeGuid`. The artifact shape is already apply-ready.
- **Quick alias wins (Batches):** add the OQ-2 "alias gap" forms (`Guilliman`, `Vect`, `Magnus`, `Titus`/`Demetrian Titus`, webway/immaterium variants) to `scripts/seed-data/*-aliases.json`; re-running the ingest (warm cache for unchanged episodes) would lift coverage with near-zero LLM cost.
- **Extraction-prompt tweak:** discourage common-noun over-extraction (`Commissar`, `Navigators`, `Hive Cities`, `Forge World`) to shrink the noise bucket.
- **Step 3 (Batches):** Lorehammer, Adeptus Ridiculous, Laying Down The Lore — resolve each `feedUrl` via Apple lookup and sanity-check title format before bulk; budget ~$1.3 per ~150-episode show with Sonnet (Haiku would be cheaper if quality holds on a smaller pilot).
- **Cost note:** full pilot was ~$1.30 on Sonnet 4.6 (335 937 in / 19 529 out). A Haiku A/B on a 10-episode slice would quantify the quality/cost trade for Step 3 scaling.

## References

- `src/lib/aliases/index.ts` (`resolveSurfaceForm`, Brief 104) — the resolution rail reused here.
- `src/lib/ingestion/llm/{enrich,cache,prompt,parse,context}.ts` — primitives + patterns mirrored.
- `src/db/schema.ts` — works CTI (`work_kind`, `channel_details`/`video_details`, `externalBookId`) for the OQ-3 recommendation.
- [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) v5.8.0 — RSS/iTunes parsing.
