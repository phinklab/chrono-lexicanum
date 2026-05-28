---
session: 2026-05-23-097
role: architect
date: 2026-05-23
status: implemented
slug: resolver-loop-finalize-fix
parent: 2026-05-23-094-arch-resolver-loop
links: [2026-05-23-094-arch-resolver-loop, 2026-05-22-093-arch-resolver-pass-7]
commits:
  - eea271662fc36ac21e85936f886644b32827011b
  - 42f4acadb1dbfa457d85d5705085883646b1cbc9
---

# Resolver-Loop finalize fix — readonly `STATE_FILE` crash + Pass 8 log backfill

## Goal

Fix the crash that aborts `scripts/run-resolver-loop.sh` immediately after a pass completes, and backfill the Pass 8 wave block the crash skipped — so the headless resolver loop can finalize a wave end-to-end and the detector stays consistent.

This is a scoped hotfix on top of an otherwise-successful run. The resolver work itself (Pass 8, wave `ssot-w40k-046..051`) succeeded completely; only the loop orchestrator's post-pass wrap-up is broken.

## Context

Brief 094 built the headless resolver loop. Philipp ran it for real for the first time today — `bash scripts/run-resolver-loop.sh` in the Batches worktree, branch `codex/ingest-batches-resolver-w40k-rest` (freshly cut from `origin/main`).

**The pass itself succeeded completely.** Pass 8, wave `ssot-w40k-046..051`, 60 books, all six phases green, DB 450 → 510 W40K books, every trias/lint/typecheck reported clean, no `## Needs decision` stop. The pass driver (`run-resolver-pass.sh`) printed `Done — phases completed: 6 / 6`, `needs-decision hit: no`, and wrote its state file. Six commits landed on the branch:

| Phase | Commit |
|---|---|
| phase-0-preflight | `bcfdf6c` |
| phase-1-factions | `f7e7f85` |
| phase-2-locations | `47556f6` |
| phase-3-characters | `2477966` |
| phase-4a-integration | `4694202` |
| phase-4b-verify-report | `e9a07e6` |

**Then the loop orchestrator crashed.** Verbatim from Philipp's run:

```
scripts/run-resolver-loop.sh: line 397: STATE_FILE: readonly variable
node:fs:439 ... TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be
of type string ... Received undefined
    at file:///C:/Users/Phil/chrono-lexicanum-batches/[eval1]:3:29
```

Root cause: `run-resolver-loop.sh` declares `STATE_FILE` as `readonly` near the top (Constants block), then reuses `STATE_FILE` as a **command-prefix env assignment** — `STATE_FILE="$STATE_FILE" node ...` — at the post-pass state-file reads. Bash rejects assigning to a `readonly` variable, so Node runs with `process.env.STATE_FILE` undefined and dies on `readFileSync(undefined)`. There are **four** such sites in the file: the three post-pass reads (`STATE_OUTCOME`, `NEEDS_DECISION_PHASE`, `NEEDS_DECISION_FILE`) plus the `phase_args` read inside `update_loop_log()`. (Exact line numbers drift between the coordination copy and `origin/main` — grep, don't trust numbers.)

The same file already contains the correct pattern: `resolve_start_phase()` passes the env var under a fresh, non-readonly name — `WAVE_LABEL="$wave" LOG_PATH_ENV="$LOG_PATH" node ...`. And the sibling driver `run-resolver-pass.sh` is clean — it uses `_VAL`-suffixed names for all prefix env-vars and interpolates `$STATE_FILE` literally into the Node source. So the defect is isolated to `run-resolver-loop.sh`; the author knew the pattern and slipped on the `STATE_FILE` reads.

**Why it was never caught:** Brief 094's live smoke was `--dry-run` + detect only; the dry-run path returns before the pass runs, so the post-pass block had never executed until today. The bug is latent since Brief 094 — every real wave hits it.

**Consequences of the crash.** Because the loop died at the first post-pass read, it never (a) wrote the Pass 8 wave block into `sessions/resolver-loop-log.md`, (b) committed that log update, (c) pushed the branch, (d) opened the PR. Nothing is lost — the six commits are intact and the DB is correctly at 510 — but the wave is unfinalized and the loop is unusable until fixed.

The loop log matters functionally, not just cosmetically: `scripts/resolver-loop-detect.ts` parses `sessions/resolver-loop-log.md` to compute `resolverProgressBatch` (highest fully-checked batch) and `nextPassNumber`. A missing or malformed Pass 8 block would make the next loop run mis-detect — e.g. re-pick the already-applied `046..051` wave. The backfill must therefore be in the exact shape the detector expects.

## Constraints

- Work in the **Batches worktree** (`chrono-lexicanum-batches`), strand **Batch/Ingestion**, on the **existing branch `codex/ingest-batches-resolver-w40k-rest`**. Do **not** create a new branch — it already carries the six Pass 8 commits. Do not branch from `main`. Announce worktree/strand/branch per the CLAUDE.md self-check before editing.
- After the fix, `run-resolver-loop.sh` must run its full post-pass path — read the pass-driver state file, update the loop log, commit, finalize — with no `readonly variable` error and no undefined-env / `readFileSync(undefined)` crash.
- Fix **every** occurrence of the antipattern, not just the one site the crash surfaced. Audit the whole script for any command-prefix assignment to a `readonly` variable.
- Match the safe pattern the file already uses (`resolve_start_phase`'s fresh, non-readonly env-var name). The exact mechanism — fresh `_ENV`-suffixed name, `export`, dropping `readonly`, or other — is the implementer's call, as long as it is consistent and the value reliably reaches the Node child.
- The Pass 8 block appended to `sessions/resolver-loop-log.md` must be in the **canonical shape** `resolver-loop-detect.ts` expects (H2 wave heading + six per-phase `[x]` checkboxes carrying commit SHAs). Prefer producing it through the existing `scripts/resolver-loop-log-update.ts` path (faithful format) over hand-writing. Inputs: pass `8`, wave `ssot-w40k-046..051`, book-count `60`, outcome `success`, and the six `phase|sha` pairs from the table above.
- Do **not** edit the historical `Bootstrap` block in `resolver-loop-log.md` — append only.
- The script fix and the loop-log backfill are two distinct logical changes — **two commits**.

## Out of scope

- **Do not re-run the resolver pass or re-apply the DB.** Pass 8 is done; the DB is correctly at 510 W40K books. Re-running would double-apply.
- **Do not run the next wave** (`ssot-w40k-052..057`). That is a later operational step, not this session.
- **Do not modify the six existing Pass 8 commits** (`bcfdf6c`..`e9a07e6`) or any resolver data — factions/locations/characters JSONs, alias JSONs, override files, test files. They are correct.
- **Do not refactor `run-resolver-loop.sh`** beyond the readonly fix + antipattern audit. No restructuring, no behaviour changes to the detect/resume/finalize logic.
- **Do not change `run-resolver-pass.sh`** — it is already clean. A confirming read is fine; if (unexpectedly) the audit finds the identical crash-class bug there, stop and flag it in the report rather than silently fixing.
- **Do not touch `brain/**` or `sessions/README.md`** — Batches strand, Rollup-Ownership (Brief 095). Substantive facts go in the impl report; Cowork backfills the rollup files in the post-merge coordination pass.

## Acceptance

The session is done when:

- [ ] `run-resolver-loop.sh` contains no command-prefix assignment to a `readonly` variable; the post-pass state-file reads pass the path to Node by a mechanism that actually populates the child environment.
- [ ] The fixed post-pass path is exercised against a representative state file and verified — no `readonly variable` error, Node receives the path, and `outcome` / `needsDecision.*` / `phasesRan[]` read back correctly. (Implementer picks the harness — e.g. the still-present Pass 8 `scripts/.last-resolver-pass-state.json`, if intact.)
- [ ] `bash -n scripts/run-resolver-loop.sh` is clean; `shellcheck` run if available, findings reported.
- [ ] `sessions/resolver-loop-log.md` has an appended Pass 8 wave block for `ssot-w40k-046..051`, in canonical shape, six per-phase checkboxes checked with the SHAs above. The `Bootstrap` block is untouched.
- [ ] The detector (`npm run resolver:next-wave`, or its test) run after the backfill confirms the loop now treats `046..051` as done — it offers wave `052..057`, or reports `idle`/awaiting-crystallization, and **not** `046..051` again.
- [ ] `npm run lint` + `tsc --noEmit` still green (sanity — no TypeScript or data changed; the resolver data trias is not required this session since no resolver data is touched).
- [ ] Two commits on `codex/ingest-batches-resolver-w40k-rest` — one for the script fix, one for the loop-log backfill.
- [ ] Session impl report written to `sessions/2026-05-23-097-impl-resolver-loop-finalize-fix.md`.
- [ ] On Philipp's `fertig`: branch pushed, one PR opened — carrying the six Pass 8 commits plus the two new commits.

## Open questions

- The headless loop's finalize path (push + PR, and the `update_loop_log` → commit step) still will not have run end-to-end after this session — only the readonly-read fix is verified in isolation. While in the post-pass / finalize section, does CC spot any other latent issue worth a follow-up? Report observations; do not fix beyond the readonly bug.
- Was the Pass 8 `scripts/.last-resolver-pass-state.json` still intact on disk and usable to drive the backfill, or did CC reconstruct the block from the SHAs in this brief? This tells us how much to trust the automatic vs. the manual path for the next run.

## Notes

- Reference shape already in the file: `resolve_start_phase()` does `WAVE_LABEL="$wave" LOG_PATH_ENV="$LOG_PATH" node ...` — fresh names, no readonly collision. The four broken sites are the three post-pass reads plus `phase_args` in `update_loop_log()`.
- Recommended backfill mechanism — replicate exactly what `update_loop_log()` would have invoked:
  `npx tsx scripts/resolver-loop-log-update.ts --log-path sessions/resolver-loop-log.md --date 2026-05-23 --pass 8 --wave ssot-w40k-046..051 --book-count 60 --outcome success --phase phase-0-preflight|bcfdf6c --phase phase-1-factions|f7e7f85 --phase phase-2-locations|47556f6 --phase phase-3-characters|2477966 --phase phase-4a-integration|4694202 --phase phase-4b-verify-report|e9a07e6`
  (verify arg names against the script; hand-write the block only if the updater cannot be driven directly).
- This PR will carry both the Pass 8 data wave and the two fix commits. That bundling is a consequence of the crash, not a design choice — reviewing them together is acceptable for a hobby project; do not try to split the branch.
- The open-questions queue (OQ 3 Hand-Check-Workflow, OQ 13 Crawl-Simplification) is deliberately **not** addressed here — 097 is a scoped hotfix. The queue stays for the W40K-complete consolidation brief.
