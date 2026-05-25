---
session: 2026-05-21-088
role: implementer
date: 2026-05-21
status: complete
slug: ssot-loop-lean
parent: 2026-05-21-088
links:
  - 2026-05-11-061-arch-ssot-loop
  - 2026-05-13-071-arch-loop-driver
commits: []
---

# SSOT-Loop — schlanke, selbst-erklärende Iteration

## Summary

A loop iteration now reads exactly three things — `sessions/ssot-loop-runbook.md`, the output of `npm run loop:next`, and `scripts/seed-data/facet-catalog.json` — totalling **~23 KB (~6k tokens)** of read context, down from the old path's ~55k+ tokens (the `CLAUDE.md` brain chain + 372-line Brief 061 + roster/override leakage). The resolver-pause is now self-detecting (`loop-next-batch.ts` checks the log for the `⏸` block), so the `--skip-initial-resolver-pause` flag is gone and a resume after a real pause no longer misfires; output (override schema, discipline rules, log format) is unchanged.

Branch: `codex/ingest-batches-ssot-loop-lean` (Batches worktree). Not pushed — awaiting `fertig`.

## What I did

- `scripts/loop-next-batch.ts` (NEW) — read-only detection helper. Pure `decideNextBatch(input)` (the test seam, no FS/DB) + a guarded `main()` that reads roster/seed-dir/log and prints compact JSON. Emits `loopComplete`, `resolverPause`, `cumulativeBefore`, `batch{domain,number,id}`, `rosterSlice[]` (projected to `externalBookId/slug/title/format/authors/seriesHint/releaseYear`), `note`. `npm run loop:next`.
- `scripts/test-loop-next-batch.ts` (NEW) — 13 hand-rolled cases (same harness as `test-synopsis-lint.ts`), synthetic inputs only. `npm run test:loop-next`.
- `package.json` — added `loop:next` + `test:loop-next` tsx scripts.
- `sessions/ssot-loop-runbook.md` (NEW, 143 lines) — self-contained spec for one iteration; 10 sections + an honest pause-marker note. Names its read-set explicitly. Synthesized from Brief 061 §§Constraints/Acceptance/Notes + the old `base_trigger()` heredoc (no rule invented).
- `scripts/run-ssot-loop.sh` — slim `base_trigger()` (runbook pointer + anti-ritual note; the four discipline paragraphs + the Brief-071-Vertrag paragraph removed); `--skip-initial-resolver-pause` removed in full (flag, var, arg-parse case, `build_trigger()`, help docblock); `count_override_books()` replaced by `resolver_pause_now()` (single source); REQUIRES docblock notes tsx. Driver structure (pre-run/halt-checks, `FINAL_PAUSE_PROBE`, push/PR) preserved.
- `CLAUDE.md` + `AGENTS.md` — one-line carve-out: loop iterations follow the runbook and skip the session-start read-routine (dual-anchored per the Brief 082/083 precedent).
- `sessions/2026-05-11-061-arch-ssot-loop.md` — top banner: operative spec moved to the runbook; 061 retained as design rationale, not directly executed. Otherwise unchanged.
- `sessions/2026-05-21-088-arch-ssot-loop-lean.md` — copied into the Batches worktree (status → `implemented`) so brief + report land together.

## Decisions I made

- **Single detection source — yes (OQ "Eine Detection-Quelle?").** The driver's end-of-run boundary check now calls `loop-next-batch.ts` (`resolver_pause_now()` reads `resolverPause`) instead of recomputing `% 50`; the dead `count_override_books()` is removed. This kills the duplicate boundary math (the brief's anti-drift theme) and the new condition is strictly tighter — it adds `!blockPresent`, so it fires at a genuine fresh boundary but won't redundantly probe when a block already exists. **Cost:** the driver now needs `tsx` + installed `node_modules` for that one end-of-run probe (it was node-only before). Mitigated: documented in `# REQUIRES`, and a helper failure is non-fatal (the probe warns and is skipped, never silently read as "false"). Acceptable because the loop only ever runs where the subsessions already need a working repo.
- **`\u`-escaped pause regex.** `buildPauseHeadingRegex` writes `·`/`⏸`/`ü` as `·`/`⏸`/`ü`, keeping the source pure-ASCII so a Windows editor can't silently re-encode those bytes and break the match. The literal ` Büchern$` after the count blocks prefix bleed (200 vs 2000). Validated both ways: the live `loop:next` matches the genuine UTF-8 log block (→ `resolverPause:false` at 200), and the test feeds real-byte heading strings.
- **Run-as-script guard via realpath compare** (`realpathSync(argv[1]) === realpathSync(fileURLToPath(import.meta.url))`, lowercase-resolve fallback). So importing the helper in the test never triggers `main()` (zero I/O in the test), and a direct `tsx` run does. Never compares `file://` URL strings (percent-encoding mismatch).
- **Return contract:** `batch`/`rosterSlice` always describe the genuine next unit; `resolverPause`/`loopComplete` are orthogonal status flags the runbook/driver gate on. `loopComplete` forces `batch:null`, empty slice. Matches the brief's illustrative JSON.
- **Faithful synthesis (output invariance).** The runbook carries Brief 061 + heredoc rules as-is — including the 400–1200-char synopsis range — and does **not** import the empirical 080/081 length corridor as a new rule. Cumulative is summed from override `books.length`; the slice start derives from `max*10` (Brief 061). Kept these decoupled (a short batch shifts the 50-cadence vs slice window — inherent to 061's design, tested).
- **Dropped a BOM-strip** I'd briefly added to `readJson` — the seed/log files are BOM-free and no other script strips one; removing it keeps the source ASCII-clean and matches the repo's `JSON.parse(raw) as T` convention.
- **Pause-marker trust model (OQ) — named honestly.** The runbook's closing section states plainly: the `⏸` block is its own "announced" marker, so a re-run after a pause **without** an intervening resolver runs past the threshold (advisory pause — the same trust model as the old skip-flag). The driver `--help` says the same.
- **Did not run the loop** (the `021..025` re-trigger is explicitly out of scope; runs as a separate step after merge).

## Verification

All in the Batches worktree (`C:\Users\Phil\chrono-lexicanum-batches`):

- `npm run test:loop-next` — **13/13 pass** (blocked vs un-blocked 50er-multiple, anti-bleed 200↛2000, non-multiple, W40K→HH handoff, W40K + HH restbatches, loopComplete, non-10 counts, empty roster). Pure-function inputs only — no real file mutated.
- `npm run loop:next` (live, real roster + log) — `cumulativeBefore:200`, `resolverPause:false` (the real 200-block is matched → resume no longer misfires), `batch.id:"ssot-w40k-021"`, 10-book slice `W40K-0201..0210`. **End-to-end proof.**
- `npm run typecheck` (`tsc --noEmit`) — pass (exit 0).
- `npm run lint` (`eslint .`) — 0 errors (1 pre-existing warning: `src/app/layout.tsx` custom-font, unrelated).
- `npm run brain:lint -- --no-write` — **0 blocking** (13 pre-existing warnings; none from these changes).
- `bash -n scripts/run-ssot-loop.sh` — syntax OK; `bash scripts/run-ssot-loop.sh --help` renders cleanly (USAGE shows `[N]` only, tsx noted, no `--skip-initial-resolver-pause`). Grep confirms zero residual `SKIP_INITIAL_PAUSE` / `build_trigger` / `count_override_books` / `skip-50` references. Did **not** run the driver itself.
- `git diff --stat` — exactly the 5 edited files (driver 48+/69−, others 2–5 lines) + 4 new files; no line-ending churn.

### Per-iteration context size (OQ)

| | New read-set | Old read-set |
|---|---|---|
| Files | runbook 143 lines / 11 KB · `facet-catalog.json` 210 lines / 9.7 KB · `loop:next` 121 lines / 2.8 KB | brain chain (`brain/CLAUDE.md` + `wiki/index.md` + `project-state.md` ~46k tok alone + `open-questions.md` + `cc-session.md`) + Brief 061 (372 lines) + re-derived detection tending to pull `book-roster.json` (≈420 KB) and `manual-overrides-ssot-*.json` (~33 KB each) |
| ≈ tokens | **~6k** | **~55k floor, 150k+ with roster leakage** |

Roughly an order of magnitude smaller, and — more importantly — bounded: it no longer scales with roster size.

## Open issues / blockers

None. All acceptance bullets met; verification green.

## For next session

- **Loop re-trigger `ssot-w40k-021..025`** — the actual loop run, deliberately separate from this plumbing brief. First run on the new path; worth eyeballing the first iteration's transcript to confirm it really reads only the three files.
- **Brief 089 (worktree/git repair)** — the coordination worktree's CRLF flip / behind-origin state is untouched here (out of scope).
- **Third pause-state reader (minor).** The driver still greps the freshly-written pause block for `CUMULATIVE_AT_PAUSE` (PR-body cosmetic). It reads what the subsession just wrote, so it's not a real second source; could later also come from the helper, but left as-is.

## References

- Brief 088 `sessions/2026-05-21-088-arch-ssot-loop-lean.md`; Brief 061 (design rationale); Brief 071 (driver).
- Pure-DI helper pattern: `scripts/apply-override-skip.ts` (077), `apply-override-synopsis-lint.ts` (080), `apply-override-location-skip.ts` (084); test harness: `scripts/test-synopsis-lint.ts`.
