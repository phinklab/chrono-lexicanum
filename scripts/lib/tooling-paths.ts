/**
 * tooling-paths.ts — single source of truth for the relocated tooling-file
 * paths (Brief 117).
 *
 * The Resolver-Loop log + runbook are read/written across the shell↔TS boundary:
 *   - shell driver `run-resolver-loop.sh` owns the authoritative `LOG_PATH`
 *     constant and forwards it to the TS helpers via `--log-path` while the
 *     loop runs;
 *   - the TS helpers (`resolver-loop-detect.ts` reads the log, picks the next
 *     wave, and writes the `runbook` field into the per-wave config;
 *     `resolver-loop-log-update.ts` writes the wave blocks) fall back to these
 *     constants when invoked standalone (e.g. `npm run resolver:next-wave`).
 *
 * Keeping the TS-side defaults here means a future relocation is a one-line
 * edit per language (this file for TS, the shell `LOG_PATH` for bash) instead
 * of the scattered string literals that Brief 117 removed.
 *
 * Repo-relative POSIX paths; callers join with `process.cwd()` as needed.
 */

/** Append-only progress marker for the headless Resolver-Loop (Brief 094). */
export const RESOLVER_LOOP_LOG_PATH = "scripts/logs/resolver-loop-log.md";

/** The single operative spec a Resolver-Pass phase reads (Brief 090/094). */
export const RESOLVER_PASS_RUNBOOK_PATH = "scripts/runbooks/resolver-pass-runbook.md";
