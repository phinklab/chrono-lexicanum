---
session: 2026-07-01-172
role: implementer
date: 2026-07-01
status: complete
slug: podcast-weekly-maintenance
parent: 2026-06-29-172
links: [2026-06-28-170, 2026-06-30-171, 2026-06-09-133, 2026-06-14-151, 2026-06-27-168]
commits: []
---

# 172 - Podcast-Delta und Weekly-Orchestrierung

## Summary

Shipped the additive **podcast delta** path — tag ONLY new guids, `merge-delta`
them into `ingest/podcasts/<slug>.extractions.json` (never a full-show retag,
never a shrink), assemble, then the existing `apply:podcast --show` as the
targeted delta-apply — plus the three maintainer commands `/add-podcast-episode`,
`/add-podcast`, `/weekly-db-update` as runbooks + `.claude/commands/*.md` slash
commands, and reconciled the weekly-refresh promote texts onto the delta path.
**No live DB was written** (all DB-free or `--dry-run`-class); the only new code is
pure/additive — the classic full `prepare`/`merge` and every committed artifact are
untouched, and no metered `ANTHROPIC_API_KEY` path was added.

## What I did

**New (the delta core + docs):**
- `src/lib/ingestion/podcast/delta.ts` — the PURE (no DB/network/SDK) delta
  primitives: `selectDeltaGuids` (manifest ∖ committed extractions), `mergeExtractionsDelta`
  (additive union with the no-shrink + no-retag guards), `assertDeltaHeaderCompatible`,
  `partitionProposalGuids` (proposal↔feed cross-check), and `DeltaGuardError` (the
  needs-decision signal). Imports only local types + the deterministic extraction
  helpers, so the whole contract unit-tests without fixtures.
- `scripts/runbooks/add-podcast-episode-runbook.md` — the `/add-podcast-episode`
  7-station flow (acquire → prepare-delta → tag → merge-delta → assemble → PR →
  apply), DB-write gate emphasized.
- `scripts/runbooks/add-podcast-runbook.md` — the `/add-podcast` 5-station flow
  (register in `podcast-shows.json` → validate → delta pipeline → PR → apply), with
  the YouTube-channel-procurement needs-decision gate.
- `scripts/runbooks/weekly-db-update-runbook.md` — the `/weekly-db-update` 10-step
  orchestration (preflight → detection → review → per-item promote/ignore/defer →
  per-book + delta promotes → cursor hygiene → rolling-PR inspect → CC PR → summary).
- `.claude/commands/{add-podcast-episode,add-podcast,weekly-db-update}.md` — thin,
  repo-checked slash commands that drive each runbook with `$ARGUMENTS`. (`.claude/`
  was previously untracked; only `settings.local.json` + `*.lock` stay gitignored.)

**Edited (wiring / reconciliation):**
- `scripts/podcast-cc-tag.ts` — added the `prepare-delta` + `merge-delta`
  subcommands (delta plan = only new guids; additive union into the committed
  file), a `mode: "full" | "delta"` stamp on `batches.json`, a refusal in the full
  `merge` when the plan is a delta (overwrite-footgun guard), and `--week`/`--proposal`
  cross-check. Refactored the shared `writeBatchPlan` / `collectBatchExtractions`
  out of `prepare` / `merge` (no behaviour change to the classic path). A
  `DeltaGuardError` exits **2** with a `NEEDS-DECISION:` prefix.
- `scripts/refresh/emit.ts` — the report Promote bullet + the copy-paste review
  prompt's Podcasts block now point at the **delta** path (acquire → prepare-delta →
  merge-delta → assemble → `apply:podcast --show`), not the old metered
  `ingest:podcast --show` full retag. Also corrected the DB-gate clause that still
  named the retired `db:apply-override` → `apply:book` / `apply:podcast` / `db:sync`.
- `scripts/runbooks/weekly-refresh-runbook.md` — §Podcasts rewritten from the old
  "show-level, no per-episode cherry-pick" full re-pull to the additive delta flow
  (full re-pull noted as a fallback only).
- `scripts/test-podcast-cc-direct.ts` — +8 delta tests (see Verification) + the new
  `delta.ts` added to the static no-SDK guard list.
- `scripts/test-refresh.ts` — +1 test asserting the podcast promote text points at
  the delta runbook and NOT at a `npm run ingest:podcast -- --show <slug>` full retag.

## Decisions I made

- **Reused `apply:podcast --show <slug>` as the targeted delta-apply — no new
  verb** (brief Open-Q). It matches episodes by `(podcast_work_id, episode_guid)`,
  inserts new / refreshes existing, and **prunes nothing**, so adding episodes to
  the artifact writes exactly the new ones and re-converges the rest. A narrower
  single-episode verb would duplicate that idempotency for no gain; the artifact is
  stably re-assembled and re-applying unchanged episodes is a no-op.
- **Delta as `prepare-delta`/`merge-delta` subcommands of the existing
  `podcast-cc-tag.ts`, over a new standalone script.** Keeps the batch-layout SSOT
  (`ccTagWorkDir`, `batches.json`, the `run-podcast-tag-loop.sh` driver) in one
  place; the driver is **reused unchanged** (it reads `batches.json`, which for a
  delta simply holds fewer batches).
- **The delta is computed authoritatively from `manifest ∖ committed extractions`,
  with the proposal as an optional cross-check** (not the source of truth). The
  weekly proposal only lists on/after-floor episodes; the manifest is the complete
  live feed. So `prepare-delta` tags every genuinely-untagged feed episode, and
  `--week`/`--proposal` adds a guard: a proposal guid that vanished from the feed is
  **source drift → needs-decision**. This honours "read new GUIDs from the proposal"
  at the orchestration level without a fragile exact-set match.
- **A fresh show is the same code path as a delta.** With no committed
  `<slug>.extractions.json`, `prepare-delta` reports every episode new and
  `merge-delta` writes the whole file — so `/add-podcast`'s first ingest and every
  later `/add-podcast-episode` share one pipeline.
- **needs-decision surface** (`DeltaGuardError`, exit 2): prompt-version drift,
  model drift, show-slug mismatch, a guid already tagged with a *different*
  extraction (guid ambiguity), any would-be inventory shrink, and (proposal-driven)
  a guid gone from the feed. YouTube whole-channel procurement without a resolvable
  id / `YOUTUBE_API_KEY` / clean playlist split stops in the `/add-podcast` runbook.
- **Command form = runbooks + npm subcommands + `.claude/commands/*.md`.** The cited
  precedent (`add-book-runbook.md`) is a runbook; I kept that as the operational SSOT
  and layered real slash commands on top (the tooling — Claude Code — allows it), so
  the contract names `/add-podcast-episode` `/add-podcast` `/weekly-db-update` are
  literally invocable AND repo-checkable.
- **Kept manual-add and weekly as separate UX** (brief constraint): three distinct
  runbooks/commands sharing the delta + per-book primitives, never a merged
  invocation. The weekly runbook explicitly points single-item work at `/add-book` /
  `/add-podcast-episode`.
- **No new dependency, no schema change, no `ANTHROPIC_API_KEY` path, no retired
  machinery reactivated.** `db:drift` untouched (stays a read-only health check).

## Verification

DB-free unless noted; **no live DB write performed** (apply is Philipp's explicit-go
only — the folder-empty / dry paths were exercised instead).

- `npm run typecheck` — pass.
- `npm run lint` — pass.
- `npm run brain:lint -- --no-write` — 0 blocking (14 pre-existing warnings; **no
  `brain/**` touched**).
- `npm run test:podcast-cc-direct` — **19 passed** (my 8 new delta tests:
  selectDeltaGuids new/up-to-date, mergeExtractionsDelta fresh/additive-no-shrink/
  idempotent-byte-stable/retag-conflict/prompt+model+show-drift, partitionProposalGuids).
  **8 pre-existing failures remain** (`committed <slug>.extractions.json assembles to
  <slug>.json byte-identically` for luetin09 / the-40k-lorecast) — **confirmed
  present on clean `origin/main`** (11 passed / 8 failed there); they are committed
  artifact↔extractions alias drift, unrelated to this brief. My changes add 8 passing
  tests and **zero** new failures.
- `npm run test:refresh` — **66 passed** (was 65; +1 delta-promote-text guard).
- `npm run test:podcast-apply` — 41 passed. `npm run test:podcast-ingest` — 30 passed
  (regression: the shared cc-tag refactor + delta subcommands didn't disturb the
  classic path).
- **Functional round-trip smoke** (scratch `__delta_smoke__`, then deleted — git
  clean afterwards): `prepare-delta` selected exactly the 2 untagged guids (1 already
  tagged skipped) and stamped `mode:"delta"`; the full `merge` **refused** the delta
  plan; `merge-delta` unioned +2 (existing entry preserved verbatim, total 3);
  **re-running `merge-delta` was idempotent (+0 new, byte-identical, sha1 stable)**;
  a forced prompt-version drift stopped with `NEEDS-DECISION:` and **exit 2**.
- CLI dispatch smoke: no-arg prints the new usage; `prepare-delta`/`merge-delta`
  reach the expected "manifest/batches not found" paths.

## Open issues / blockers

- None blocking. Live apply (`apply:podcast --show`) was intentionally NOT run —
  Philipp's explicit go only.
- **Pre-existing (out of scope):** `test:podcast-cc-direct` carries 8 committed-data
  failures on `origin/main` — the luetin09 + the-40k-lorecast committed
  `.extractions.json` no longer re-assemble byte-identically to their `.json`
  artifacts (alias-index drift since generation). A re-assemble (`--stage=assemble`)
  or a `migrate:extractions --check` pass would reconcile them; flagged for a future
  podcast-hygiene brief, not touched here.

## For next session (answers the brief's Open-Qs)

- **Invocation form:** runbooks (`scripts/runbooks/{add-podcast-episode,add-podcast,
  weekly-db-update}-runbook.md`) + npm subcommands (`ingest:podcast:tag --
  prepare-delta|merge-delta`) + real `.claude/commands/*.md` slash commands.
- **Single-episode delta:** reused `apply:podcast --show` (episodeGuid-keyed,
  no-prune → a safe delta-apply by construction); no narrower verb built.
- **needs-decision edge cases:** prompt/model/slug drift, guid ambiguity (different
  retag), no-shrink, proposal-guid-gone-from-feed (source drift), YouTube whole-channel
  procurement without clean tooling.
- **YouTube channel procurement:** RSS + a resolvable channel-id-with-key works
  through the same pipeline; a whole channel without a resolvable id / `YOUTUBE_API_KEY`
  / clean playlist split stops with needs-decision (runbook) — a dedicated
  YouTube-channel-acquisition brief is the clean follow-up.
- **Weekly-refresh text/runbook changes:** `emit.ts` Promote bullet + review-prompt
  Podcasts block → delta path (+ stale `db:apply-override` corrected);
  `weekly-refresh-runbook.md` §Podcasts → delta flow.
- Optional follow-ups: reconcile the 8 drifted podcast artifacts; consider a
  `podcast-shows.json` scaffold helper for `/add-podcast`; a real YouTube-channel
  acquisition path if whole-channel adds become common.

## References

- Brief 172 (`sessions/2026-06-29-172-arch-podcast-weekly-maintenance.md`).
- 170 + 171 impl reports — the per-book corpus + 9-step `db:sync` baseline this builds on.
- `src/lib/ingestion/podcast/{extraction,manifest,artifact,registry}.ts` — the
  Brief-131 cc-direct primitives the delta extends.
