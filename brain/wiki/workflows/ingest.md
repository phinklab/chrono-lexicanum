---
title: Ingest workflow
type: workflow
created: 2026-05-09
updated: 2026-05-09
sources:
  - https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
  - https://blog.starmorph.com/blog/karpathy-llm-wiki-knowledge-base-guide
  - ../../../sessions/archive/2026-05/2026-05-08-049-arch-karpathy-brain-atlas-reset.md
related:
  - ./session-end.md
  - ./query.md
  - ./lint.md
  - ../../CLAUDE.md
confidence: high
---

# Ingest workflow

> One of Karpathy's three operations (**Ingest** / Query / Lint). Ingest is how new material flows from `raw/` (sessions, code changes, external reviews) into `wiki/` synthesis pages. The wiki stays small, current, and trustworthy because Ingest is rigorous — not because it's frequent.

## Trigger

Ingest fires when:

- A CC implementer report lands (most common).
- An external code review arrives (codex, gpt-5, …) and is dropped into `brain/raw/reviews/`.
- A code change with project-state implications shipped (a migration, a new module, a flag added/removed/renamed).
- A top-level doc was refreshed (these are rare post-049 — top-level docs are mostly redirects now, but `/CLAUDE.md` may still get edits).
- A long pause and someone asks "is the wiki current?" — that's the cue for a periodic Ingest pass.

## Input

The raw artefact:

- A session report (`sessions/YYYY-MM-DD-NNN-impl-*.md`).
- An external review (`brain/raw/reviews/YYYY-MM-DD-<source>.md`).
- A code diff (look at `git log -p` for the relevant range, or run `git show <commit>` if a single commit).
- A top-level doc edit (`/CLAUDE.md` change, README rewrite).

## Output

- One or more updated `wiki/` pages.
- One updated entry in `wiki/log.md` (append-only).
- Possibly: a new decision page if the change embodied a non-trivial design choice.
- Possibly: new items in `open-questions.md` if the change surfaced follow-up work.
- Possibly: pruned items in `open-questions.md` if the change resolved earlier follow-ups.

## Rules

### 1. Synthesize, don't copy

A wiki page is *the current state*, not the history of how we got there. The history lives in `raw/` and `sessions/`. If you find yourself pasting a session-report paragraph verbatim into a wiki page, stop — write 2–3 sentences synthesizing what's now true and cite the session in `sources:` frontmatter.

### 2. Cite sources

Every wiki page lists its `sources` in frontmatter. Adding a paragraph to the body means adding the source it derives from to the `sources:` array. If a paragraph has multiple sources (synthesizing across a session report and a code file), list both.

### 3. Don't mix domains

Engineering knowledge → Brain. Book-domain → Atlas. If you find yourself adding per-book detail to a wiki page (synopsis, plot, factions), stop — that's an Atlas concern. Re-route via `npm run atlas:regen` not via wiki edits.

### 4. Mark uncertainty

If a synthesis is uncertain (you're inferring intent, the source is ambiguous, a decision was made informally and isn't fully documented), prefer "TODO: verify against X" over speculation. Set the page's frontmatter `confidence: low`. Lint will surface stale-low pages older than 30 days as a re-ingestion reminder.

### 5. Atomic commit

When ingesting alongside a code change (CC's own ingest of their work, or Cowork's session-end pass), commit the wiki edits in the same logical unit. The motto: "code change + wiki update in the same commit." Pre-049 this didn't always happen; post-049 it's the standard.

### 6. Update `wiki/log.md`

After the ingest, append a `## YYYY-MM-DD · Update · <short-title>` section to `log.md` with bullets:

```markdown
## 2026-05-15 · Update · Pipeline post-Anthologie-Re-Test

- Read: sessions/2026-05-15-052-impl-anthologie-retest.md
- Updated wiki: pipeline-state.md (Hebel E confirmed working), open-questions.md (item 10 resolved, removed)
- New decision: (none)
- Other: (none)
```

The log is the operation history of Brain. It lets someone in 6 months trace "when did we touch X and why."

## Operational checklist (Cowork's session-end ingest)

The detailed steps live in [`./session-end.md`](./session-end.md). At a glance:

1. Read the report end-to-end. Note new facts, decisions, surprises, follow-ups.
2. Update [`../project-state.md`](../project-state.md) if state moved.
3. Prune/extend [`../open-questions.md`](../open-questions.md).
4. Write/update decision pages if applicable.
5. Update system pages (architecture / pipeline-state / roadmap) if structural change.
6. Handle external reviews if any.
7. Update [`../index.md`](../index.md) and [`../log.md`](../log.md).

## Operational checklist (CC's same-commit ingest)

When CC implements something with obvious project-state implications:

1. Make the code change.
2. Update the directly-affected wiki page(s) — usually `pipeline-state.md` or `architecture.md`.
3. Don't touch `project-state.md`, `open-questions.md`, `index.md`, `log.md` — those are Cowork's session-end job.
4. Commit code + wiki update together. Mention the wiki edit in the commit message.

The split: CC handles "wiki page directly contradicted by my change"; Cowork handles "wiki shape (project-state, queue, catalog) reflects new reality."

## What Ingest does NOT do

- **Doesn't write decision pages on every CC report.** Most reports don't embody new decisions; they execute existing ones. Decision pages cost write-time + reading-time forever; only add when there's a real "we chose X over Y because Z" that future-Cowork would otherwise have to re-discover.
- **Doesn't update `decisions/` past entries.** Past decisions are immutable history. If a decision is reversed, write a *new* page (`<slug>-reversed-YYYYMMDD.md` or in the same page under a new section); don't edit the original to rewrite history.
- **Doesn't touch `raw/`.** Even if a session report has a typo. Raw is immutable. If the typo is load-bearing (changes meaning), open a Cowork brief explicitly to correct it; don't sneak it into an ingest pass.
- **Doesn't touch `sessions/` archive (`archive/`).** Same immutability.

## Distant: automating Ingest

Karpathy's gist + Starmorph's guide both note that automated Ingest (LLM-driven, given a raw artefact + a wiki tree, produce a diff) is a natural future direction. We're not there yet (manual Ingest by Cowork in the session-end pass is the current discipline). When we have:

- 50+ wiki pages so manual review of "which page does this belong in" gets expensive
- A clean lint pass establishing good wiki hygiene as a baseline
- A clear pattern for which CC reports are ingest-trivial (already-decided things, just executing) vs ingest-substantive (new facts, decisions, surprises)

…then a CC-skill `/wiki-ingest` becomes attractive. Today (post-049): manual is fine.

QMD ([Karpathy-recommended BM25/Vector/LLM-rerank search over Markdown](https://github.com/tobi/qmd)) becomes attractive for Query at the same scale, and Dataview (Obsidian plugin for cross-page queries) for the Atlas. **Distant** — open question 8 in [`../open-questions.md`](../open-questions.md) and brief 049's open question 7+8.
