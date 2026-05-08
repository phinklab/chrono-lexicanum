---
title: Claude Code session workflow
type: workflow
created: 2026-05-09
updated: 2026-05-09
sources:
  - ../../../docs/agents/CLAUDE_CODE.md
  - ../../../docs/agents/SESSIONS.md
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
2. List recent files in `sessions/` — sort by name. The brief to pick up is the highest-numbered `*-arch-*.md` with `status: open`.
3. Read it end-to-end. Read referenced files (`brain/wiki/architecture.md`, `brain/wiki/roadmap.md`, `brain/wiki/pipeline-state.md`, etc.) the brief points at.
4. **If anything in the brief is ambiguous or wrong, do NOT silently fix it.** Either ask Philipp in the terminal, or — if Philipp isn't around — write a short `*-impl-*.md` with `status: needs-decision` describing what's unclear, commit, stop.

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

Cowork is the primary Brain-editor. CC's main contribution is via the implementer-report (which Cowork then ingests into the wiki post-session). **However:** if a CC implementation embodies a substantive new fact about the system that Cowork would obviously want in the wiki (e.g. a migration shipped, a new module landed, a flag was renamed), CC may update the relevant wiki pages **as part of the same commit** — reduces Cowork's session-end overhead. Pages like `pipeline-state.md` are obvious candidates.

If unsure: leave the wiki update to Cowork's session-end pass. Brain pages with stale facts are catchable by Lint; not-yet-written facts in the next brief are catchable by Cowork's read of the report.
