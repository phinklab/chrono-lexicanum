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

## Parallel worktree git protocol

Durable local worktrees:

- `C:\Users\Phil\chrono-lexicanum` = coordination / main worktree.
- `C:\Users\Phil\chrono-lexicanum-product` = Product/UI strand: HUD, Map, design polish, app shell, music player, login/settings UI, frontend features.
- `C:\Users\Phil\chrono-lexicanum-batches` = Batch/Ingestion strand: SSOT batches, overrides, resolver, DB-apply, ingestion scripts.

`main` is read-only for local work. Never commit on `main`.

At the start of any implementation session:

1. Run `git branch --show-current` and `git status --short --branch`.
2. Infer the strand from the current worktree path.
3. If the current branch is `main`, detached, a bootstrap branch, or a previously merged task branch, create a fresh task branch from `origin/main` before editing:
   - Product/UI: `codex/product-<short-slug>`
   - Batch/Ingestion: `codex/ingest-batches-<short-slug>`
   - Meta/session-only: `codex/session-<NNN>-<short-slug>`
4. Do not branch from an inflight feature branch unless Philipp explicitly says this session continues that exact branch.

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
