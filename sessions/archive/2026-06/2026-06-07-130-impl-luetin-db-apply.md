---
session: 2026-06-07-130
role: implementer
date: 2026-06-07
status: complete
slug: luetin-db-apply
parent: 2026-06-07-130
links:
  - 2026-06-07-130
  - 2026-06-02-114
  - 2026-06-04-128
  - 2026-06-01-110
commits: []
---

# luetin09 DB-apply validation batch — source-aware podcast apply (Brief 130 follow-step)

## Summary

The podcast apply is now **source-aware**: a `source:"youtube"` show writes its
container + episode `works.source_kind = youtube` (RSS unchanged → `podcast_rss`),
threaded from the registry `source` through the pure plan SSOT. The committed
luetin09 artifact was regenerated with **Sonnet** (20 newest non-excluded
uploads) and **applied to Postgres**: 1 `podcast` show + 20 `podcast_episode`
works, all `source_kind=youtube`, with YouTube `watch` links and resolved
tag-junctions; a double-apply is idempotent. One incident during the live apply
(a concurrent review workflow transiently mutated the working tree) is documented
in full below — it was caught and remediated; the final DB state is correct.

## What I did

### 1. Code — source-aware apply (the brief's Part 1)

- `src/lib/ingestion/podcast/apply-plan.ts` (the pure write-shape SSOT) —
  added `WorkSourceKind = "podcast_rss" | "youtube"` and the single mapping
  `workSourceKindForSource(source)` (rss/default → `podcast_rss`, youtube →
  `youtube`; **no URL heuristic**). `ApplyPlan` now carries `workSourceKind`;
  `buildApplyPlan(artifact, refs, source = DEFAULT_PODCAST_SOURCE)` derives it.
  The default keeps every pre-130 2-arg call site byte-identical. Imports
  `PodcastSource`/`DEFAULT_PODCAST_SOURCE` from `./registry` (no cycle: registry
  imports only `./types` + node builtins).
- `scripts/apply-podcast.ts` — both hardcoded `sourceKind:"podcast_rss"` writes
  (show work in `upsertShow`, episode work in `applyEpisode`) now use
  `plan.workSourceKind`. `ApplyTarget` carries the registry `source` (so `--all`
  is per-show correct); a `--file` apply has no registry entry → falls back to
  the `rss` default (the brief's permitted fallback, not a URL guess). The
  dry-run plan now prints `Work source_kind: …`.
- `scripts/test-podcast-apply.ts` — `WorkRow` in the in-memory mirror gained
  `sourceKind` (frozen on insert, like the real apply); a `youtubeArtifact()`
  fixture + 4 new tests prove: default/explicit `rss` → `podcast_rss`; `youtube`
  → `youtube`; a youtube plan writes show + **every** episode work as `youtube`;
  an rss plan stays `podcast_rss`. (37 → **41 tests**.)

### 2. Artifact — regenerated with Sonnet, 20 episodes (the brief's Part 2)

- `ingest/podcasts/luetin09.json` + `.report.md` — re-ingested via
  `PODCAST_LLM_MODEL=claude-sonnet-4-6 npm run ingest:podcast -- --show luetin09 --limit=20`.
  The committed demo was a 10-ep Haiku artifact; this run is genuine Sonnet
  (cache key includes the model → **0/20 cache hits**, $0.16). Curation
  (`excludePlaylists` / `includeVideoIds`) untouched; metadata-only.
  Verified: `extraction.model: claude-sonnet-4-6`, 20 episodes, **every** episode
  `audioUrl:null` + exactly one `youtube/watch/youtube` link, 18/20 (90%) tagged,
  show link = the `@luetin09` channel, `podcastGuid:null` (apply identity =
  feedUrl→slug).

### 3. DB apply (the brief's Part 3)

- Applied via `npm run apply:podcast -- --show luetin09` after a clean dry-run.
  Final DB state (read-only verified, 13/13 checks): 1 `podcast` show work + 20
  `podcast_episode` works, **all 21 `source_kind=youtube`**; 1 `podcast_details`,
  20 `podcast_episode_details` (no dup guid/work); show `external_links` = 1
  `youtube/watch` channel link; episode `external_links` = 20, all
  `youtube/watch/youtube`, one per episode; junctions 11 characters / 23 factions
  / 7 locations, no duplicate `(work, entity)`; **no** duplicate works/links.
- Idempotency: two consecutive applies → `0 inserted / 20 updated`, identical
  counts both runs. No new works, no link/junction drift.

## Decisions I made

- **Source→source_kind mapping lives in `apply-plan.ts`, not the script.** The
  brief asked apply-plan to stay the write-shape SSOT, so the one mapping
  function + `workSourceKind` field live there; the script and its test both read
  `plan.workSourceKind`, so they cannot drift.
- **`--file` apply keeps the `rss` default** (no registry → no `source`). The
  brief permitted either rss-default or an explicit validated param; rss-default
  is the simplest correct choice and the real run uses `--show` (registry path),
  which carries the true `source:"youtube"`. No URL heuristic anywhere.
- **DB remediation by guarded in-place UPDATE (Philipp's explicit choice).** See
  the incident below. A delete+reinsert was offered and declined; instead a
  transactional, hard-guarded UPDATE corrected exactly the 21 affected works.

## Incident — concurrent review workflow corrupted the first apply (caught + fixed)

Honest record, because it shaped the DB history:

- I launched a multi-agent **review workflow** of the Part-1 diff *concurrently*
  with the live DB apply, using the default (write-capable) workflow subagent and
  the **shared working tree** (no worktree isolation). The dry-run moments earlier
  printed `Work source_kind: youtube`; the **first real apply printed
  `podcast_rss`** and inserted all 21 works with that wrong value. Immediately
  after, `git diff` showed `apply-plan.ts` back to correct, and after I killed the
  workflow the dry-run was consistently `youtube` again. Conclusion: a review/
  verify subagent transiently edited `apply-plan.ts` inside the apply window.
- Because `works` rows are **frozen on insert** (a re-apply only bumps
  `updatedAt`), `source_kind` could not self-heal. Per Philipp's instruction I ran
  a guarded, transactional UPDATE (abort unless exactly 1 show + 20 episode works,
  all currently `podcast_rss`; UPDATE asserts 21 rows or rolls back) flipping the
  21 works to `youtube`, then re-applied twice to confirm idempotency, then
  verified the full DB state. Two throwaway scripts (`scripts/_remediate-luetin-update.ts`,
  `scripts/_verify-luetin.ts`) did the remediation + verification and were
  **deleted** — not committed.
- **Lesson:** review/audit fan-outs must use a **read-only** agent (e.g. the
  `Explore` agentType) and must **never** run against the shared working tree
  during a live mutating step. An autonomous delete of the mis-inserted rows was
  also correctly blocked by the permission classifier.

## Verification

- `npm run typecheck` — pass. `npm run lint` — pass.
- `npm run test:podcast-apply` — **41 pass**. `npm run test:podcast-youtube` — 29
  pass. `npm run test:podcast-ingest` — 30 pass.
- `npm run brain:lint -- --no-write` — **0 blocking** (13 pre-existing warnings,
  none from this change; `brain/**` untouched).
- Ingest: Sonnet, 20 episodes, 0/20 cache hits (genuine cold run), $0.16.
- Apply dry-run → `source youtube`, `Work source_kind: youtube`, 20 episodes, 41
  junctions, 1+20 links, no writes.
- Apply ×2 → idempotent (`0 inserted / 20 updated` both runs).
- Read-only DB verification — 13/13 checks pass (counts + source_kind + links +
  junctions + no-duplicates, as enumerated under "DB apply").

## Open issues / blockers

- **None blocking.** Final DB state is correct and idempotent.

## For next session

- **Full-catalog backfill (own follow-up).** This run is the *validation batch*
  (newest 20). The full luetin09 catalog (~1951 uploads, 97 denylisted) is a
  separate, deliberate run — `--limit` must be chosen consciously; never run the
  luetin09 ingest unlimited casually (cost + ~40 `playlistItems` pages/run).
- **Harness lesson worth a brain note (for Cowork to fold in).** Multi-agent
  reviews during this strand's work must use a read-only agent and not share the
  working tree with a live DB/file mutation. (Recorded here, not in `brain/**`
  per Rollup-Ownership.)
- **131 (podcast tagging via direct path) is unaffected** — API/Sonnet remained
  the proving path for this batch, as the brief specified.

## References

- Brief `sessions/2026-06-07-130-arch-youtube-source-adapter.md` +
  `…-130-impl-youtube-source-adapter.md` ("For next session" → "Real DB-apply").
- `src/lib/ingestion/podcast/{apply-plan,registry,types,extract,cache}.ts`,
  `scripts/{apply-podcast,ingest-podcast}.ts`.
