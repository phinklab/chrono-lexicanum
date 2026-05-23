---
session: 2026-05-23-097
role: implementer
date: 2026-05-23
status: complete
slug: resolver-loop-finalize-fix
parent: 2026-05-23-097-arch-resolver-loop-finalize-fix
links: [2026-05-23-094-arch-resolver-loop, 2026-05-22-093-arch-resolver-pass-7]
commits:
  - eea271662fc36ac21e85936f886644b32827011b
  - 42f4acadb1dbfa457d85d5705085883646b1cbc9
---

# Resolver-Loop finalize fix — readonly `STATE_FILE` crash + Pass 8 log backfill

## Summary

Fixed the readonly-`STATE_FILE` crash in `scripts/run-resolver-loop.sh` (four sites, all in the post-pass finalize path) and backfilled the Pass 8 wave block in `sessions/resolver-loop-log.md` from the still-intact `scripts/.last-resolver-pass-state.json`. The headless loop's post-pass path now exits cleanly and the detector advances to `ssot-w40k-052..057` (Pass 9) instead of re-picking 046..051.

Worktree: `chrono-lexicanum-batches`, Strang: Batch/Ingestion, Branch: `codex/ingest-batches-resolver-w40k-rest` (continued — same branch that carries the six Pass 8 commits).

## What I did

- `scripts/run-resolver-loop.sh` — rename the four `STATE_FILE="$STATE_FILE" node …` command-prefix env assignments to `STATE_FILE_ENV="$STATE_FILE" node …` (and the corresponding `process.env.STATE_FILE` → `process.env.STATE_FILE_ENV` inside the Node bodies). Sites:
  - `phase_args` inside `update_loop_log()` (around L250)
  - `STATE_OUTCOME` (around L400)
  - `NEEDS_DECISION_PHASE` (around L405)
  - `NEEDS_DECISION_FILE` (around L410)
  Added a short comment at each block explaining *why* the rename exists, so a future reader doesn't innocently re-introduce the antipattern.
- `sessions/resolver-loop-log.md` — appended the Pass 8 wave block (H2 heading + six checked phase bullets with commit SHAs) via the recommended `scripts/resolver-loop-log-update.ts` invocation. Bootstrap block untouched.

Two commits, as required:
- `eea2716` — `Resolver-Loop: fix readonly STATE_FILE crash in post-pass reads`
- `42f4aca` — `Resolver-Loop: Pass 8 (ssot-w40k-046..051) — 6/6 phases ✓ (backfill)`

## Decisions I made

- **Chose `STATE_FILE_ENV` over dropping `readonly` or exporting `STATE_FILE`.** The brief left the mechanism to the implementer; `_ENV`-suffixed fresh names mirror the file's *own* working pattern (`LOG_PATH_ENV` in `resolve_start_phase`). Exporting would have leaked a process-internal path into every child of every later step; dropping `readonly` would have removed a guardrail Cowork explicitly wanted in place for the constants block. The rename is the smallest, most consistent fix.
- **Added short comments explaining the rename.** Three lines next to the first site (in `update_loop_log`), one-liner cross-references at the other three. Reasoning: this exact antipattern slipped past the original author in spite of the working `LOG_PATH_ENV` example nearby; a one-line warning costs nothing and prevents an obvious regression. Per the project's "no comments unless WHY is non-obvious" rule, the WHY here is the readonly/command-prefix interaction, which is not visible from the surrounding code.
- **Did NOT touch `run-resolver-pass.sh`** — confirmed clean: it uses `_VAL`-suffixed fresh names for *all* prefix env-vars and interpolates `$STATE_FILE` literally into the Node source as a bash string substitution (not via the child env). No latent equivalent of this bug. (Brief said to flag if I found one — I did not.)

## Verification

- **`bash -n scripts/run-resolver-loop.sh`** — clean.
- **`shellcheck`** — not installed on this host (`command -v shellcheck` returns nothing); cannot report findings. Worth installing in a follow-up session for general script hygiene.
- **All four post-pass Node reads exercised in isolation** against the still-intact `scripts/.last-resolver-pass-state.json`. Outputs:
  - `phase_args` → six `--phase name|sha` pairs (correct SHAs, correct order)
  - `STATE_OUTCOME` → `success`
  - `NEEDS_DECISION_PHASE` → `(empty)`
  - `NEEDS_DECISION_FILE` → `(empty)`
  No `readonly variable` error, no `readFileSync(undefined)` crash.
- **`npm run resolver:next-wave`** — reports `status: open-wave` for `ssot-w40k-052..057` (Pass 9, 55 books, batches 052..057 all crystallized). Confirms the detector now treats 046..051 as done. `applyRange.to: 57`, `oldRange.to: W40K-0510` — consistent with the DB at 510 W40K books after Pass 8.
- **`npm run lint`** — 0 errors, 1 pre-existing warning (`@next/next/no-page-custom-font` in `src/app/layout.tsx` — unrelated to this session).
- **`npx tsc --noEmit`** — exit 0, clean.
- Resolver data trias not re-run — no resolver data touched this session (per the brief).

## Open issues / blockers

None. Session complete pending push + PR on Philipp's `fertig`.

## For next session

Answers to the brief's two open questions, plus one observation:

1. **Was the state file intact?** Yes. `scripts/.last-resolver-pass-state.json` was 923 bytes, complete, with exactly the six `phase|sha` pairs the brief listed in the table. Both verification and the (recommended) `resolver-loop-log-update.ts` backfill drove from this real data — no manual reconstruction was needed. Implication: for the next real wave, once the script fix is in place, the fully automatic finalize path (state-file read → log-updater → commit → push → PR) should work end-to-end without manual intervention.
2. **Latent issues in the finalize section?** One small one, not a regression: the per-wave commit message `"Resolver-Loop: Pass $PASS ($WAVE) — 6/6 phases ✓"` is followed by `git push -u origin "$CURRENT_BRANCH"` *only* at the end of the loop (outside the per-wave block). If a wave succeeds but the next wave is interrupted (e.g. `claude_fail` mid-pass), the prior success's commits sit unpushed locally — which is fine on a recoverable interrupt (re-run continues) but unsurprising if the operator expected per-wave push. Not a bug per se; just behaviour worth knowing. The existing design is intentional (push once at end, open one PR carrying all waves) — no fix needed.
3. **Bonus observation, not in scope:** the loop's `update_loop_log` rebuilds `args` newline-piece-by-newline-piece from the `phase_args` Node output. The Node side writes via `process.stdout.write(parts.join('\n'))` *without* a trailing newline; the bash side's here-string `<<<"$phase_args"` always appends a newline, so the loop iterates correctly. Subtle, works, no change recommended — flagging because a future "let's clean up the pipe" refactor could trip on it.

End-to-end finalize verification (the *full* post-pass path, including `update_loop_log` → commit → push → PR) is *still* deferred — only the readonly-read fix was exercised in isolation. The next real wave (Pass 9 / `ssot-w40k-052..057`) will be the first true end-to-end live smoke; if anything else in the finalize section is latently broken, it surfaces there.

## References

- Brief: `sessions/2026-05-23-097-arch-resolver-loop-finalize-fix.md`
- Parent: `sessions/2026-05-23-094-arch-resolver-loop.md`
- Runbook (operative spec, untouched): `sessions/resolver-pass-runbook.md`
- Detector + builder: `scripts/resolver-loop-detect.ts`
- Log updater: `scripts/resolver-loop-log-update.ts`
- State-file sentinel writer: `scripts/run-resolver-pass.sh` (`write_state_file`)
