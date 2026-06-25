---
title: Claude Code session workflow
type: workflow
created: 2026-05-09
updated: 2026-06-25
sources:
  - ../../../docs/agents/CLAUDE_CODE.md
  - ../../../docs/agents/SESSIONS.md
  - ../../../sessions/archive/2026-05/2026-05-23-095-arch-rollup-ownership.md
  - ../../../CLAUDE.md
related:
  - ./cowork-session.md
  - ./sessions-format.md
  - ./session-end.md
confidence: high
---

# Claude Code session workflow

> Claude Code is the **implementer**. Runs in a terminal in Philipp's project directory. Output: working code, applied migrations, green builds, written report. Counterpart: Cowork, who plans and writes briefs.

## How a CC session begins

1. `git pull` (or `git status` if Philipp already pulled).
2. **Self-check the worktree.** Run `git branch --show-current` and `git status --short --branch`. Infer the strand from the worktree path — CC always derives the strand itself, never asks the maintainer which worktree this is. **Announce the detected worktree, strand, and task-branch in one sentence** before touching any files (e.g. *"Worktree: `chrono-lexicanum-batches`, Strang: Batch/Ingestion, Branch: `codex/ingest-batches-foo`."*). If the task Philipp gave doesn't match the detected strand — UI work in the Batches worktree, batch/resolver work in the Product worktree, a Brain/Rollup edit from a strand worktree, or vice versa — **halt and ask back** before starting. Detail in [`/CLAUDE.md`](../../../CLAUDE.md) § "Parallel worktrees" + [`/AGENTS.md`](../../../AGENTS.md) § "Parallel worktree git protocol".
3. List recent files in `sessions/` — sort by name. The brief to pick up is the highest-numbered `*-arch-*.md` with `status: open`. **Cowork's briefs are no longer pushed to `main`** (§ "PR policy") — the open brief is an *uncommitted* file in the coordination worktree (`C:\Users\Phil\chrono-lexicanum\sessions\`). In a strand worktree, read it from that path; you'll copy it into your branch to commit it with your work.
4. Read it end-to-end. Read referenced files (`brain/wiki/architecture.md`, `brain/wiki/roadmap.md`, `brain/wiki/pipeline-state.md`, etc.) the brief points at.
5. **If anything in the brief is ambiguous or wrong, do NOT silently fix it.** Either ask Philipp in the terminal, or — if Philipp isn't around — write a short `*-impl-*.md` with `status: needs-decision` describing what's unclear, commit, stop.

## Read-order on session-start (post-049)

1. Top-level [`/CLAUDE.md`](../../../CLAUDE.md) — auto-loaded; stack, conventions, version policy.
2. [`brain/CLAUDE.md`](../../CLAUDE.md) — Brain schema (Karpathy frame).
3. [`brain/wiki/index.md`](../index.md) — master catalog.
4. [`brain/wiki/project-state.md`](../project-state.md) — where are we now.
5. [`brain/wiki/open-questions.md`](../open-questions.md) — what's queued.
6. The architect brief itself + relevant wiki pages for the task domain.

## Freedom + matching responsibility

The architect's brief specifies **what** and **why**. CC decides **how**.

- **Versions are CC's call — always.** Cowork is forbidden from pinning versions. Cowork's training cutoff is older than current releases. Even if a brief or `package.json` contains specific version numbers, **treat them as suggestions to investigate, not constraints to obey.** Before installing anything: check current stable (`npm view <pkg> version`, `npm view <pkg> dist-tags`, GitHub releases). Pick what's appropriate today, pin that. If a brief's number is wrong, bump it — note in report.
- **Pick implementation patterns.** Server component vs client; route handler vs server action; RSC fetch vs SWR — CC's call, as long as the result satisfies acceptance.
- **Bump existing dependencies.** If fighting an outdated package, bump as part of the same commit. Mention in report.

The matching responsibility:

- **Justify deviations.** Choosing a library the brief didn't anticipate, skipping a step — explain in report's "Decisions I made."
- **Don't expand scope silently.** Finish the brief, notice an obviously-broken thing nearby, don't fix it without writing a follow-up brief idea into the report. Cowork plans the next session, not discovers a surprise diff.
- **Verify own work.** Run `npm run lint`, `tsc --noEmit`, the dev server, the migration, the seed — whatever applies. List what was run in "Verification."

## Concrete version-research workflow

When a brief touches installs/upgrades:

1. **Look up current stable** for each package the brief names. `npm view next version` minimum; for tools with LTS + latest channels (Next has `backport`, Tailwind has `v3-lts`), check `dist-tags`.
2. **Check known breaking changes** between any pinned version and current. Package CHANGELOG / GitHub release notes / migration guide tells you whether it's 5 minutes or half a day.
3. **Pick the right channel for project intent.** Bleeding-edge framework? `latest`. Stability for a year? Backport/LTS. Brief usually implies which.
4. **Pin in `package.json`** with `^` for normal deps, exact for things you've been bitten by (Next, React, build pipeline tools).
5. **Note in report** what you picked, what's `latest`, why those differ if they do.

## What CC does NOT do

- **Don't edit the prototype.** Gitignored anyway; if Philipp has it locally, leave it. Port forward, never backward.
- **Don't add features that aren't in the brief.** Keep diff focused. Adjacent things go into report's "For next session."
- **Don't commit secrets.** `.env*.local` is gitignored — keep it that way.
- **Don't `git push --force` on `main`.** Use feature branches if you need to rewrite history.
- **Don't merge community submissions or run destructive scripts against production.** Anything irreversible against `DATABASE_URL` (truncate, drop, schema reset) is dev-only unless the brief explicitly authorizes.
- **Don't leave a session without writing a report.** Even a 5-line "implemented as briefed, all green, here's the commit hash" is a contract Cowork relies on.

## PR policy — everything reaches `main` through a PR; CC carries Cowork's docs

Decided 2026-06-25 with Philipp (Brief 165), superseding the 2026-05-25 "docs direct to `main`" model. Cowork never commits — it leaves *files in the working tree*, and **CC commits them**. Authoritative rule + edge cases: [`/CLAUDE.md`](../../../CLAUDE.md) § Git → "PR policy".

- **The architect brief reaches CC as an uncommitted working-tree file, not on `main`.** Cowork writes it into the coordination worktree (`C:\Users\Phil\chrono-lexicanum\sessions\…md`) and no longer pushes it. If you're implementing in a **strand** worktree, read it from that coordination-worktree path and **copy it into your strand branch** so it rides in your PR — the brief file is fresh and conflict-free. Flip its `status: open → implemented` in that same PR. (`brain/**` rollups are *not* conflict-free and never ride a strand PR — see below.)
- **CC's code work is a PR — always.** Any diff touching `src/`, `scripts/`, `src/db/`, `package.json`, `.github/**`, configs goes through a task branch + PR, exactly as before. The impl report rides inside that same PR.
- **No direct-to-`main` — ever.** The old doc-only direct-commit path is removed. A doc-only / coordination / `brain/**` rollup deliverable still goes through a task branch + PR, but **from the coordination worktree** (`codex/session-<NNN>-<slug>`) — strand worktrees never write `brain/**` (Rollup-Ownership). Batched is fine. Run `npm run brain:lint -- --no-write` green first.
- **Mixed change → PR.** Docs + code in one logical change → the whole thing through the PR.

## Tools CC has that Cowork doesn't

- **A real shell.** `npm install` finishes; `npm run dev` watches; `git push` works; `psql`/Drizzle Studio access.
- **A working build/test loop.** Use it. If the brief touches code, run the build before declaring done.
- **Direct Postgres access.** Schema-touching brief? Run the migration locally, hit Drizzle Studio, verify the data shape.

## Writing the report

Use `sessions/_templates/implementer-report.md`. Numbering: next sequential `NNN` in `sessions/` (look at the latest brief, add 1). Slug matches the brief's slug:

```
sessions/2026-04-28-002-arch-phase-1-handoff.md
sessions/2026-04-28-003-impl-phase-1-handoff.md   ← report
```

Two sections matter most:

- **Decisions I made** — every place CC departed from the brief, every nontrivial library/version pick, every "I almost did X but did Y because…" call.
- **For next session** — bullets Cowork should consider when planning. Surfacing things noticed that don't belong in this diff.

Commit report in same push as implementation. Update brief's frontmatter `status:` from `open` to `implemented` (single-line edit, same commit).

## Handling a brief that turns out to be wrong

It happens. Brief assumes Drizzle plays nicely with feature X; CC starts implementing; discovers it doesn't.

Two options:

1. **Find a working alternative within the brief's intent.** Implement, document in "Decisions I made," ship.
2. **Stop and ask.** If the alternative would change scope or cost or product behavior, stop. Write `*-impl-*-blocked.md` with `status: needs-decision`, describe the problem and 2–3 paths forward, commit, push. Cowork picks up next session.

Don't burn a day in stuck implementation. Surface early.

## Tone in reports

Same as commits: terse, factual, useful. No marketing voice, no apologies, no "I successfully implemented…". Imagine Philipp skimming on his phone tomorrow morning. What does he need to know to continue?

## Brain updates from CC?

**The rule is worktree-bound (Brief 095).** Cowork is the sole writer of the **coordination-only set** — `sessions/README.md` plus everything under `brain/` (wiki pages, `brain/CLAUDE.md`, `decisions/`, `workflows/`, `index.md`, `log.md`, `glossary.md`, `outputs/`). Two cases for CC:

- **CC in a strand worktree** (`chrono-lexicanum-product` or `chrono-lexicanum-batches`): **never** writes `brain/**`, **never** writes `sessions/README.md` — not in a normal session, not in a mechanical runbook, not as a "short wiki note on the side". Substantive system facts that Cowork would want in the wiki (a migration shipped, a new module landed, a flag was renamed) go into the impl report's **"What I did"** or **"For next session"**. Cowork picks them up in the post-merge coordination pass and folds them into the relevant `brain/wiki/*` page.
- **CC in the coordination worktree** (`chrono-lexicanum`, meta/session briefs like the one that introduced this rule): edits `brain/` freely — that is the place for it. The atomic-commit pairing "code change + Brain update in one commit" survives only here.

The point of the rule is **conflict-freeness for parallel strand PRs.** Briefs and reports are always fresh files and never collide; only the rollup/index files get rewritten in every session and would otherwise tear when two strand branches pushed in parallel. Single-writer discipline on `sessions/README.md` + `brain/**` lets the two strands rebase against `origin/main` without merge conflicts. Detail in [`/CLAUDE.md`](../../../CLAUDE.md) § "Brain & Atlas" + § "Parallel worktrees" → "Rollup-Ownership".
