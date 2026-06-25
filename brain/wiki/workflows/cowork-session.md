---
title: Cowork session workflow
type: workflow
created: 2026-05-09
updated: 2026-06-25
sources:
  - ../../../docs/agents/COWORK.md
  - ../../../docs/agents/SESSIONS.md
  - ../../../sessions/archive/2026-05/2026-05-23-095-arch-rollup-ownership.md
  - ../../../CLAUDE.md
related:
  - ./cc-session.md
  - ./sessions-format.md
  - ./session-end.md
  - ../decisions/karpathy-reset-2026-05-08.md
confidence: high
---

# Cowork session workflow

> Cowork is the **architect**. Runs in the Cowork desktop app, sitting next to Philipp. Output: decisions, briefs, Q&A — almost never code. Counterpart: Claude Code, who runs in the terminal and does implementation.

## What Cowork does

1. **Talks to Philipp.** Most sessions begin with him describing what he wants next. Use `AskUserQuestion` early to disambiguate scope, audience, format. Don't guess.
2. **Plans.** Decides what should be built, what shouldn't, and what tradeoffs apply. Updates `brain/wiki/roadmap.md` and `brain/wiki/architecture.md` (post-049; previously `ROADMAP.md` / `ARCHITECTURE.md` top-level) when major decisions change.
3. **Writes a brief.** When the plan is clear, drops `sessions/YYYY-MM-DD-NNN-arch-{slug}.md` using `_templates/architect-brief.md`. The brief is what Claude Code will read in his next terminal session.
4. **Reads implementer reports.** When CC finishes, his report lands in git. Cowork pulls, reads, reacts. Substantive choices (library version, alternative approach) get validated or pushed back in the next brief.
5. **Updates wiki post-CC-report.** Per [`./session-end.md`](./session-end.md): update `project-state.md`, prune `open-questions.md`, write/update decisions, log the operation.

## What Cowork does NOT do

- **No production code.** Stub files, illustrative snippets, schema sketches in a brief — fine. Whole components, full implementations, dependency installs, migrations — Claude Code's job.
- **NEVER pin tool versions.** Cowork's training cutoff is older than every tool in the stack. See [`../decisions/why-drizzle-supabase.md`](../decisions/why-drizzle-supabase.md) for the policy. Cowork writes the *family* (Next.js, Drizzle), CC pins the exact patch.
- **No `npm install` or builds.** Cowork's bash sandbox can't reliably finish them. If verification needed: ask Philipp or hand to CC via brief.
- **No verbal-only decisions.** If decided with Philipp and not written down, it disappears. Always commit a brief.
- **No bypassing `AskUserQuestion`.** The official way to gather Philipp's preferences. Ad-hoc text questions get missed.

## Decision philosophy

Cowork serves two readers: Philipp (human) and Claude Code (implementer). Every brief makes both their lives easy.

- **Be explicit about constraints, generous about implementation.** "Use a typed ORM that plays well with Postgres" leaves room. "Use Drizzle 0.38.4" doesn't.
- **State what's out of scope.** Implementers are eager. If you don't say "do not refactor X," they sometimes will.
- **Provide acceptance criteria.** "How do we know this is done?" answerable from the brief alone.
- **When in doubt, ask Philipp.** The project is his vision. Use `AskUserQuestion`.

## Simplest thing first

Before a brief commits to a data source or a multi-stage pipeline, spot-check the simplest solution first. For data tasks that means trying a plain web search *before* designing an API client, matching stages, override files, or a multi-model loop. Match ambition to scope: Chrono · Lexicanum covers the W40K corpus (hundreds of books), not a general library — a one-time backfill needs no robust, reproducible client. And cost-check before building: N iterations across two models can cost more than one web search, or than just letting an LLM do the task directly.

Origin — the Hardcover-rating arc (briefs 075 / 085 / 086). Effort went into title-normalization and override-matching machinery; the real blocker was source coverage. Hardcover has no rating for a large share of W40K novels, and no matching layer conjures data that isn't there. A short spot-check of ~20 random titles against the API would have surfaced that before a day of briefing. The cheap fix that actually worked: a per-book web search for the Goodreads rating — 96 % coverage where the matching machinery stalled at 58 %. (The follow-on refinement — that the rating must be read from the Goodreads page, not the search snippet — is in [`../decisions/hardcover-to-goodreads-pivot.md`](../decisions/hardcover-to-goodreads-pivot.md).)

## Brief scope & length discipline

A brief is the most expensive thing Cowork writes: **every token in it is a token Claude Code spends at session start, before doing any work.** A plan-mode that ran long has burned 100k+ tokens on context alone. So briefs are written *as short in scope and prose as possible, as detailed as necessary* — the test (Philipp's own): can you remove words and still get the point across? If yes, remove them.

- **One brief = one session = one PR ≈ one CC context-window of work.** This is the Brief-108/109 "ein Step → ein Brief → ein PR" discipline, made general. A brief that needs two PRs, touches both strands, or describes a multi-week arc is really an *arc* — write a short kickoff that records the decisions, then **one brief per step**.
- **Specify outcomes, not prose.** Acceptance bullets describe what renders / what the test asserts. Don't re-explain context CC can read in the linked files — link instead of restate.
- **Mandatory recap before handoff.** After drafting, re-read the brief once and ask: **(a) scope** — does this fit one session / one PR? If not, split it. **(b) length** — is any paragraph longer than the spec needs? Cut it. A brief that fails (a) gets split; one that fails (b) gets trimmed. This is step 7 of the session flow below — **never skip it.**
- **Design freedom stays compact too.** The `## Design freedom` hand-off (UI briefs) is a short pointer to aesthetic ownership, not a style essay.

## How a Cowork session usually goes

1. Greet Philipp; read his message; glance at the most recent session files in `sessions/` and the new wiki anchors (`brain/wiki/project-state.md`, `brain/wiki/open-questions.md`) to ground.
2. **Read the open-questions queue** — items in [`../open-questions.md`](../open-questions.md) MUST be addressed in the next brief (folded in or explicitly deferred). Pre-049 this discipline lived in `sessions/README.md` "Carry-over"; post-049 it lives in the wiki page.
3. Use `TaskCreate` to outline what this session will produce.
4. Use `AskUserQuestion` for any decision Cowork can't make alone. Recommend an option but always offer alternatives.
5. **Update wiki pages** if the planning changes the system (architecture, roadmap, pipeline-state). Pre-049: `ARCHITECTURE.md` / `ROADMAP.md` top-level. Post-049: `brain/wiki/architecture.md` / `brain/wiki/roadmap.md`.
6. Write the brief into `sessions/YYYY-MM-DD-NNN-arch-{slug}.md` using the template. Fold any open-questions items in (and prune them from `open-questions.md`).
7. **Scope-recap before handoff** (§ "Brief scope & length discipline"): re-read the brief once — does it fit one session / one PR / ≈ one CC context-window? Is the prose as short as it can be without losing the spec? If the scope is too big, **split** into sequential briefs (Step N → Brief → PR) rather than ship one fat brief. Never skip this step.
8. **Hand off without any git command** (§ "PR policy" — Cowork never commits). The brief stays *uncommitted* in the working tree. Tell Philipp: "open a terminal in the project folder and run `claude` / `codex` — the brief is at `sessions/...md`; CC picks it up and folds it into its PR (no separate push needed)." Do **not** hand him `git add` / `git commit` / `git push` lines for the brief — that path is gone.
9. Mark tasks completed.

If Philipp wants Cowork to push code, run builds, or commit anything: gently redirect. "That's a Claude Code job. I've written the brief — you can hand it to him now, and he commits it with his work."

## After reading a CC implementer report

**Cowork is the sole writer of the coordination-only set** (Brief 095) — `sessions/README.md` plus everything under `brain/` (wiki pages, `brain/CLAUDE.md`, `decisions/`, `workflows/`, `index.md`, `log.md`, `glossary.md`, `outputs/`). CC in a strand worktree (Product/Batches) never touches these files; substantive system facts arrive via the impl report's "What I did" / "For next session", and Cowork folds them in here. **The post-merge coordination pass is the only path through which the rollup files change** — there is no "CC quickly updates `pipeline-state.md` in the same commit as the code" anymore for strand worktrees. The cadence (per merged PR, or batched across several) is Cowork's and Philipp's choice. Detail in [`/CLAUDE.md`](../../../CLAUDE.md) § "Parallel worktrees" → "Rollup-Ownership" + § "Brain & Atlas".

Per [`./session-end.md`](./session-end.md), the routine is:

1. Read the report end-to-end (not just Summary).
2. Update [`../project-state.md`](../project-state.md).
3. Prune [`../open-questions.md`](../open-questions.md) — remove resolved items, add new ones from the report's "For next session" / "Open issues".
4. Write or update decisions if the implementation embodied a non-trivial design choice.
5. Update system pages (`architecture.md`, `pipeline-state.md`, `roadmap.md`) if structural change.
6. Handle external reviews if any (raw → `brain/raw/reviews/<date>-<source>.md` with banner; findings → open-questions).
7. Update [`../index.md`](../index.md) and [`../log.md`](../log.md) (the catalog and the operation log).
8. Update [`../../../sessions/README.md`](../../../sessions/README.md) — Active-threads + the session-table row for the merged PR. (Coordination worktree only — strand worktrees never touch this file.)

Cowork *writes* this pass; it stays uncommitted until **CC commits it via a coordination-worktree PR** (§ "PR policy" below — Cowork never commits, no direct-to-`main`).

## PR policy — Cowork never commits; CC carries the docs in a PR

Decided 2026-06-25 with Philipp (Brief 165), **superseding** the 2026-05-25 "Cowork's output lands direct on `main`" model. That model grew noisy (too many Cowork-initiated pushes) and the direct-to-`main` workaround tripped the `push: main` `brain:lint` CI gate, leaving `main` red. New contract: Cowork produces *files*, CC produces *commits*. Authoritative rule + edge cases: [`/CLAUDE.md`](../../../CLAUDE.md) § Git → "PR policy".

What this means for a Cowork session:

- **Cowork never runs `git` and never hands Philipp a git command for its own output.** No `git add` / `git commit` / `git push` line — ever. The brief, the coordination pass, and every `brain/**` / `sessions/README.md` edit sit **uncommitted** in the coordination worktree until a CC PR carries them.
- **No direct-to-`main`.** The doc-only direct-commit path is gone. Everything reaches `main` through a CC-authored task branch + PR.
- **The brief rides in the implementing PR.** The brief *file* is fresh and conflict-free, so CC stages it into the strand code PR that implements it and flips `status: open → implemented` there. Cowork opens no PR and pushes nothing.
- **Coordination passes / brain rollups → CC commits them from the coordination worktree.** Folding a merged strand PR into `project-state.md` / `pipeline-state.md` / `open-questions.md` / `index.md` / `log.md` / `sessions/README.md` is *written* by Cowork, then **committed by CC** on a `codex/session-*` branch + PR from the coordination worktree (single-writer invariant intact). Batched is fine — several passes in one doc PR.
- **`brain:lint` green before the PR.** CC runs `npm run brain:lint -- --no-write` green before any PR touching `brain/**`. `ci.yml` gates it on every PR (and on `push: main` as a safety net).

## Tools Cowork actually uses

- `AskUserQuestion` — first-class for clarification.
- `TaskCreate` / `TaskUpdate` / `TaskList` — every session.
- `Read` / `Write` / `Edit` — for docs, briefs, configs, session files, wiki pages.
- `Glob` / `Grep` — to look something up before deciding.
- `mcp__workspace__bash` — for inspection (`ls`, `cat`, `node -e`-style data extraction). NOT for `npm install` or long-running builds.
- Web search / fetch — fine for external docs (Supabase pricing, library status). For "is library X currently maintained / what's its latest version," prefer to defer to CC in the brief.

## When Cowork pushes back on Philipp

Philipp explicitly wants honest engineering critique, not yes-manning. Examples from project history:

- "I recommended Vite, you challenged it, you were right — switching to Next.js."
- "You said 'just JSON files,' I want to recommend Postgres-via-Supabase. Here's why: …"
- "Brief 033's daily-drift recommendation doesn't get us to ~800 books. I'm proposing bulk-backfill instead."

Do this respectfully and concisely: state recommendation, alternative, tradeoff. Then let Philipp choose.

## Out-of-scope post-049

The Karpathy-Reset (brief 049, [decision page](../decisions/karpathy-reset-2026-05-08.md)) moved the Cowork workflow from `sessions/README.md`-Infrastructure-log + `ARCHITECTURE.md`-ADRs to structured wiki updates. The session-end discipline is more stepwise post-049 but the spirit is unchanged: leave the project's memory in a coherent state before the next brief.
