---
title: Cowork session workflow
type: workflow
created: 2026-05-09
updated: 2026-05-23
sources:
  - ../../../docs/agents/COWORK.md
  - ../../../docs/agents/SESSIONS.md
  - ../../../sessions/2026-05-23-095-arch-rollup-ownership.md
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

## How a Cowork session usually goes

1. Greet Philipp; read his message; glance at the most recent session files in `sessions/` and the new wiki anchors (`brain/wiki/project-state.md`, `brain/wiki/open-questions.md`) to ground.
2. **Read the open-questions queue** — items in [`../open-questions.md`](../open-questions.md) MUST be addressed in the next brief (folded in or explicitly deferred). Pre-049 this discipline lived in `sessions/README.md` "Carry-over"; post-049 it lives in the wiki page.
3. Use `TaskCreate` to outline what this session will produce.
4. Use `AskUserQuestion` for any decision Cowork can't make alone. Recommend an option but always offer alternatives.
5. **Update wiki pages** if the planning changes the system (architecture, roadmap, pipeline-state). Pre-049: `ARCHITECTURE.md` / `ROADMAP.md` top-level. Post-049: `brain/wiki/architecture.md` / `brain/wiki/roadmap.md`.
6. Write the brief into `sessions/YYYY-MM-DD-NNN-arch-{slug}.md` using the template. Fold any open-questions items in (and prune them from `open-questions.md`).
7. Tell Philipp in chat: "When you're ready, open a terminal in the project folder and run `claude`. The brief is at `sessions/...md`. Claude Code will read it and pick up from there."
8. Mark tasks completed.

If Philipp wants Cowork to push code or run builds: gently redirect. "That's a Claude Code job. I've written the brief — you can hand it to him now."

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
