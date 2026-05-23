# AGENTS.md - Agent entrypoint for chrono-lexicanum

This file exists so Codex and other agent runners get the same operational
rules that Claude Code reads from `CLAUDE.md`.

## Session start

1. Read `CLAUDE.md`.
2. Read `brain/CLAUDE.md`.
3. Read `brain/wiki/index.md`.
4. Read `brain/wiki/project-state.md`.
5. Read `brain/wiki/open-questions.md`.
6. Read the highest open Architect-Brief in `sessions/`.
7. Read all files referenced by the brief before implementing.

Treat existing references to "Claude Code", "CC", or "Implementer" as a
reference to the current Codex/agent implementer role, unless the text is
explicitly about a Claude/Anthropic model or a historical project decision.

**SSOT-Loop iterations are the exception.** A loop iteration
(`scripts/run-ssot-loop.sh`) is a mechanical task, not a normal session: follow
`sessions/ssot-loop-runbook.md` and skip the session-start reading routine above
(Brief 061 itself is not read).

**Resolver waves are likewise the exception.** A wave — driven headless via
`scripts/run-resolver-loop.sh` or standalone via `scripts/run-resolver-pass.sh
<config>` — is a mechanical task, not a normal session: follow
`sessions/resolver-pass-runbook.md` plus the per-wave config and skip step 6
of the session-start reading routine (do **not** read the highest open
Architect-Brief). **No brief is read** to run a wave or a phase, headless or
standalone — per-pass architect briefs no longer exist (Brief 094 removed
them) and Brief 076 stays as Rationale-only. The runbook appendix lists the
provenance for anyone curious.

## Parallel worktree git protocol

Durable local worktrees:

- `C:\Users\Phil\chrono-lexicanum` = coordination / main worktree.
- `C:\Users\Phil\chrono-lexicanum-product` = Product/UI strand: HUD, Map, design polish, app shell, music player, login/settings UI, frontend features.
- `C:\Users\Phil\chrono-lexicanum-batches` = Batch/Ingestion strand: SSOT batches, overrides, resolver, DB-apply, ingestion scripts.

`main` is read-only for local work. Never commit on `main`.

**Rollup-Ownership (coordination-worktree-only).** The two strand worktrees (`chrono-lexicanum-product`, `chrono-lexicanum-batches`) **never write** the following files — only the coordination worktree (`chrono-lexicanum`) does:

- `sessions/README.md`
- everything under `brain/` (`brain/**`) — wiki pages, `brain/CLAUDE.md`, `decisions/`, `workflows/`, `index.md`, `log.md`, `glossary.md`, `outputs/`.

The rule holds in normal sessions, in mechanical runbooks, and as a "short wiki note on the side" — there is no exception. A strand that would previously have updated `project-state.md` / `log.md` / `index.md` / `README.md` records the same facts in its **impl report** (a fresh per-session file, single-writer, conflict-free). Cowork backfills the coordination-only set in a post-merge pass from the coordination worktree; that is the **only** path through which these files change.

What strands **do** keep writing (unchanged): their own code/data paths (Product: `src/app/**`, `src/components/**`, `public/lab/**`, `docs/ui-backlog.md`; Batches: `scripts/**`, `src/lib/{seed,resolver,ingestion}/**`, override JSONs under `scripts/seed-data/`, `sessions/ssot-loop-log.md`, `sessions/resolver-dossiers/`), plus their own new per-session impl report. All per-session files are single-writer and never collide.

The rule is bound to the **worktree path**, not to the agent — the path is pinned at session-start (below). The question "may I write `brain/`?" reduces to "am I in the coordination worktree?". An agent implementing a meta/session brief in the coordination worktree edits `brain/` freely; an agent in a strand worktree never does.

At the start of any implementation session:

1. Run `git branch --show-current` and `git status --short --branch`.
2. Infer the strand from the current worktree path. The agent always derives the strand itself — never ask the maintainer which worktree this is.
3. If the current branch is `main`, detached, a bootstrap branch, or a previously merged task branch, create a fresh task branch from `origin/main` before editing:
   - Product/UI: `codex/product-<short-slug>`
   - Batch/Ingestion: `codex/ingest-batches-<short-slug>`
   - Meta/session-only: `codex/session-<NNN>-<short-slug>`
4. Do not branch from an inflight feature branch unless Philipp explicitly says this session continues that exact branch.
5. **Before editing any files, announce the detected worktree, strand, and task-branch in one sentence** (e.g. *"Worktree: `chrono-lexicanum-batches`, Strang: Batch/Ingestion, Branch: `codex/ingest-batches-foo`."*). A wrong-folder mistake becomes visible immediately.
6. **If the task does not match the detected strand** — UI work in the Batches worktree, batch/resolver work in the Product worktree, a Brain/Rollup edit asked for from a strand worktree, or vice versa — **halt and ask back** instead of starting in the wrong place. This is a self-check, not a maintainer question; the agent reads the path and decides.

When Philipp says `fertig`, `PR erstellen`, or equivalent:

1. Verify the current worktree status.
2. Stage only files changed for the current task in this worktree.
3. Commit on the current task branch.
4. Push with upstream: `git push -u origin <current-branch>`.
5. Create a PR.
6. Do not merge the PR. Philipp merges manually.

When Philipp says `PR ist gemerged, bitte aufraeumen` or equivalent:

1. Verify the PR is actually merged.
2. Verify the worktree is clean.
3. Run `git fetch --prune origin`.
4. Move the worktree back to its agent-neutral bootstrap branch (`worktree/product-bootstrap` or `worktree/batches-bootstrap`) and fast-forward it to `origin/main` when possible.
5. Delete the old local task branch only after verifying the PR was merged or the branch is otherwise preserved.
6. Do not delete worktrees.
7. Do not use `git reset --hard` unless Philipp explicitly authorizes it for that cleanup.

## Implementation discipline

- Implement the Architect-Brief, not more and not less.
- Use existing project patterns: Next.js App Router, TypeScript strict,
  Drizzle/Supabase, ingestion code under `src/lib/ingestion/`, session logs
  under `sessions/`.
- Do not silently expand scope. If a brief is wrong or risky, stop and return
  `needs-decision`.
- Never revert existing user/maintainer changes in the worktree.
- For code changes, run relevant verification, at minimum `npm run lint`,
  `npm run typecheck`, and `npm run brain:lint -- --no-write` when applicable.
- At the end, write an Implementer-Report from
  `sessions/_templates/implementer-report.md`.
- Mark the Architect-Brief `status: implemented` when implementation is complete.
