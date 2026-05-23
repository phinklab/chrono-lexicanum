# Brain — Schema (Karpathy-style LLM Wiki)

This folder is the project's **engineering memory**, structured per Andrej Karpathy's LLM Wiki pattern ([gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f), with conventions from [Starmorph's implementation guide](https://blog.starmorph.com/blog/karpathy-llm-wiki-knowledge-base-guide)).

The promise: **the LLM (Cowork or Claude Code) does not answer from raw session logs anymore. It answers from `wiki/` pages it has synthesized against immutable `raw/` sources.** New context arrives → `Ingest` updates `wiki/`. A question arrives → `Query` reads `wiki/` (small, navigable). A periodic check → `Lint` flags stale claims, missing frontmatter, broken links.

## Read-order on session-start

Every Cowork-/CC-Session reads in this order **before turning to the actual task**:

1. [`/CLAUDE.md`](../CLAUDE.md) — top-level repo CLAUDE.md (stack, conventions, version policy). Auto-loaded.
2. **This file** (`brain/CLAUDE.md`) — schema, operations, conventions inside `brain/`.
3. [`wiki/index.md`](./wiki/index.md) — master catalog of brain pages (one-line description per page + `updated` date). Use this *instead* of brute-force loading every `wiki/` file into context.
4. [`wiki/project-state.md`](./wiki/project-state.md) — "Where are we now": current phase, what's running, pointer to open questions.
5. [`wiki/open-questions.md`](./wiki/open-questions.md) — items the next architect brief MUST address.
6. **Whatever else is relevant to today's task** — pull from `index.md` based on the task's domain. For pipeline work: `pipeline-state.md`, relevant `decisions/`. For workflow questions: `workflows/`. For domain terms: `glossary.md`.

If a memory record (this folder) and the current code disagree, **trust the code**. Update the wiki accordingly. Memory has a date stamp; reality is now.

## Layout

```
brain/
├── CLAUDE.md              ← this file (schema)
├── wiki/                  ← LLM-synthesized pages (the EXECUTABLE)
│   ├── index.md           ← master catalog (read first)
│   ├── log.md             ← append-only operation log (no frontmatter)
│   ├── project-state.md   ← "where are we now"
│   ├── open-questions.md  ← next-brief queue
│   ├── architecture.md, roadmap.md, onboarding.md
│   ├── glossary.md, pipeline-state.md, book-data-overview.md
│   ├── decisions/         ← ADRs with revisit-triggers
│   └── workflows/         ← cowork-session, cc-session, ingest, query, lint, atlas-regen, …
├── raw/                   ← IMMUTABLE sources (never edited by LLM)
│   ├── historical/        ← snapshots of pre-reset top-level docs
│   └── reviews/           ← external code reviews (codex, gpt-5, …)
└── outputs/               ← generated artefacts (NOT executable knowledge)
    └── lint/              ← lint reports YYYY-MM-DD.md
```

## Compiler analogy (Karpathy's mental frame)

- `raw/` = **source code** (immutable inputs)
- LLM (Cowork / Claude Code) = **compiler** (reads source, produces artefact)
- `wiki/` = **executable** (the thing you read and use; verified against source)
- `outputs/lint/` = **test reports** (tell you what's broken; not part of the executable)
- Query = **runtime** (run the executable, get an answer)

This is why `outputs/` lives next to `wiki/`, not inside it: a test report is not part of the executable.

## Three operations

Each takes specific inputs and produces specific outputs. Following them rigorously is what keeps the wiki small, current, and trustworthy.

### Ingest — fold new material into the wiki

**Trigger:** a new raw artefact lands (session report, external code review, decision discussion, code change with project-state implications, top-level doc refresh).

**Input:** the raw artefact (in `raw/` or `sessions/` or the current code).

**Output:** updates to one or more `wiki/` pages, plus an entry in `wiki/log.md`.

**Where:** the **coordination worktree only** (`chrono-lexicanum`). `wiki/**` and `wiki/log.md` are part of the coordination-only set (Brief 095, [`./wiki/workflows/cowork-session.md`](./wiki/workflows/cowork-session.md)) — Ingest never runs from a strand worktree (Product/Batches), even when the facts originate there. Strand reports surface those facts in their impl-report's "What I did" / "For next session"; Cowork picks them up in the post-merge coordination pass.

**Rules:**

- Synthesize, don't copy. A wiki page is *the current state*, not the history of how we got there. The history lives in `raw/` and `sessions/`.
- Cite sources. Every wiki page lists its `sources` in frontmatter. Adding a paragraph means adding the source it derives from.
- Don't mix domains. Engineering knowledge stays in Brain; book-domain content lives in the external Atlas (`chrono-atlas/`, never auto-loaded).
- If a synthesis is uncertain, prefer "TODO: verify against X" over speculation. Mark frontmatter `confidence: low`.
- See [`wiki/workflows/ingest.md`](./wiki/workflows/ingest.md) for the operational checklist.

### Query — answer a question against the wiki

**Trigger:** Cowork or CC needs to know *what we decided*, *what's open*, *how does X work*.

**Input:** the question + `wiki/index.md` + relevant `wiki/` pages.

**Output:** an answer grounded in wiki content, with citations to wiki pages.

**Rules:**

- Read `index.md` first. Don't brute-force load every wiki page; use the catalog to pick the relevant one(s).
- If the wiki doesn't have it, say so — don't guess from raw sources.
- If the wiki has it but you suspect it's stale, verify against the code/repo before answering. Update the wiki if stale.
- See [`wiki/workflows/query.md`](./wiki/workflows/query.md).

### Lint — flag drift between wiki and reality

**Trigger:** periodic, or before a major decision that depends on wiki accuracy.

**Input:** the entire `wiki/` tree + the current repo state.

**Output:** a report in `outputs/lint/YYYY-MM-DD.md` listing findings by category.

**Rules:**

- Lint never edits the wiki. It reports. Fixes happen via Ingest.
- Run with `npm run brain:lint` (writes a report under `outputs/lint/<today>.md`) or `npm run brain:lint -- --no-write` (CI mode, summary + exit code only). CI calls the no-write form on every PR. See [`wiki/workflows/lint.md`](./wiki/workflows/lint.md) for the full check list, severity policy, and what's deliberately out of scope.

## ADR shape (decisions/)

A `decisions/<slug>.md` page answers four things, tightly:

- **Context** — what was true, what hurt, why we're picking now.
- **Decision** — the chosen option, named clearly.
- **Why** — the reasons that made the choice obvious. Keep alternatives short; long option-tables belong in the brief that opened the decision, not in the ADR.
- **Revisit triggers** — concrete signals that should reopen the question.

What ADRs are *not* for:

- Running batch numbers, cost tables, per-session metrics → those live in [`wiki/pipeline-state.md`](./wiki/pipeline-state.md).
- Chronological history of who-did-what → that's the session-log files in `sessions/` and the entries in [`wiki/log.md`](./wiki/log.md).
- Implementation reports — those live in `sessions/<id>-impl-<slug>.md`.

If an ADR grows past ~80 lines, suspect drift: pipeline numbers or session protocol probably leaked in. Move them to the right home and re-read the ADR — the decision should still stand on its own.

## Frontmatter convention (verbindlich)

Every file under `wiki/**/*.md` (except `log.md`, which is append-only) carries YAML frontmatter:

```yaml
---
title: "Why Drizzle + Supabase"
type: decision           # overview | decision | workflow | concept | source-summary | reference
created: 2026-04-28      # original date (for decisions: decision-date; else page-creation-date)
updated: 2026-05-09
sources:
  - ../../sessions/archive/2026-04/2026-04-28-001-arch-bootstrap.md
  - ../../src/db/schema.ts
related:
  - ./why-bulk-backfill.md
  - ../architecture.md
confidence: high          # high | medium | low
decision-date: 2026-04-28 # decisions only
---
```

Required fields on every page: `title`, `type`, `created`, `updated`, `sources`, `related`, `confidence`. Decision pages additionally require `decision-date`. Source-summary pages may add `summarizes` (the raw file they synthesize).

`log.md` is exempt — it's the append-only operation log, format is `## YYYY-MM-DD · <op-type> · <short-title>` with bullets below.

Files under `raw/historical/` carry a different banner (immutable snapshot):

```yaml
---
snapshot-of: ARCHITECTURE.md
snapshot-date: 2026-05-08
snapshot-reason: Pre-Karpathy-reset (brief 049). …
canonical-now: brain/wiki/architecture.md
---
```

Files under `raw/reviews/` carry:

```yaml
---
review-date: 2026-05-08
review-source: codex             # codex | gpt-5 | external-author | …
review-target: <path or session-id>
---
```

## What does NOT live here

- **Book domain data** (the ~800 W40k novels with synopses, factions, characters, sources). That lives in **Postgres** (canonical) and in the external **Atlas** (`chrono-atlas/`, generated via `npm run atlas:regen`). Brain only carries *high-level numbers* (e.g. "26 manual books seeded, ~700 discovered") — never per-book detail.
- **App code, pipeline code, schema, migrations.** Live in `src/` and `scripts/` and `src/db/`. Brain references them as raw sources (`sources` frontmatter) but never reproduces them.
- **Session logs in raw form.** Live in `sessions/` (top-level). Brain links to them via relative paths like `../../sessions/<id>.md` and `../../sessions/archive/<YYYY-MM>/<id>.md`. We do *not* maintain a `brain/raw/sessions/` symlink/copy — Variant A from brief 049 (no symlinks, cross-platform clean).
- **Auto-loaded CLAUDE.md content for the harness.** Top-level `/CLAUDE.md` is the harness's auto-load anchor (stack, conventions, version policy). This file (`brain/CLAUDE.md`) is the Karpathy schema. Both are read on session-start but they have different jobs.
- **Cosmetic UI polish notes.** Those live in `docs/ui-backlog.md` (top-level convention from sessions/README.md, kept).

## Brain ↔ Atlas separation (non-negotiable)

This split matters. Without it the token-vorteil of Karpathy's pattern collapses.

- **Brain** is small (≤ a few hundred KB), always auto-loaded, *engineering* knowledge. Updates daily-to-weekly. LLM-synthesized.
- **Atlas** is large (potentially MB-scale once 800 books × N fields are rendered), never auto-loaded, *book-domain* knowledge. Updates per `npm run atlas:regen` (Postgres → markdown). Mechanical mirror, NOT LLM-synthesized.

If you find yourself adding per-book detail to a wiki page, stop. That belongs in the Atlas. Brain answers "how does our pipeline work"; Atlas answers "what's the synopsis of *Eisenhorn: Xenos*".

## When in doubt

- About a fact: read the source. Brain is a synthesis, not a primary record.
- About the schema for a new wiki page type: check this file's frontmatter section, then look at existing pages of the same `type` for shape examples.
- About whether something belongs in Brain or Atlas: ask "does the LLM need this on every session, or only on explicit lookup?" Every-session = Brain. On-demand = Atlas (or `glossary.md` if it's a single-term lookup).
- About operational details: read the relevant `wiki/workflows/*.md`.

## Karpathy reference

- Original gist: <https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f>
- Starmorph implementation guide (where conventions like `wiki/index.md` + `wiki/log.md` + frontmatter schema + `outputs/` separation come from): <https://blog.starmorph.com/blog/karpathy-llm-wiki-knowledge-base-guide>
- Karpathy's mental frame ("the wiki is a compiled artefact") is the most load-bearing idea here. If you find yourself debating "should this go in raw/ or wiki/", reach for the compiler analogy: source vs executable.
