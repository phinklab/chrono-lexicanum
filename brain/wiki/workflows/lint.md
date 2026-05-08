---
title: Lint workflow
type: workflow
created: 2026-05-09
updated: 2026-05-09
sources:
  - ../../../sessions/2026-05-08-049-arch-karpathy-brain-atlas-reset.md
  - https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
related:
  - ../decisions/karpathy-reset-2026-05-08.md
  - ../../CLAUDE.md
  - ./session-end.md
confidence: high
---

# Lint workflow

> **What** is checked, when, and what the output looks like. The lint **script** does not yet exist — that's a follow-up brief. Until then, the checks are run by eye when something feels off.

Lint is one of Karpathy's three operations (Ingest / Query / **Lint**). Its job is to flag drift between the wiki and reality, without fixing anything itself. Fixes happen via a subsequent Ingest pass.

## When to run

- **Periodically.** Once a week, or before a major decision that depends on wiki accuracy.
- **Before opening a substantive architect brief** that builds on existing wiki claims (you don't want to architect on stale facts).
- **After a long quiet period.** If Brain hasn't been touched in 2+ weeks, a lint catches forgotten drift.
- **On-demand**, when something feels off ("I remember reading X in the wiki but the code seems to disagree").

## Output format

Lint reports land in `brain/outputs/lint/YYYY-MM-DD.md`. Each report has sections per check category, with concrete line-references. Empty sections are omitted.

```markdown
# Lint report 2026-05-15

## Stale claims

- `wiki/pipeline-state.md` line 42 says "FIELD_PRIORITY for factionNames is `['lexicanum','llm']`" — but src/lib/ingestion/field-priority.ts line 18 now reads `['llm']` (changed in 2026-05-12 batch). Synthesize the change, update the wiki page.

## Broken internal links

- `wiki/decisions/why-haiku-not-sonnet.md` links to `../../../sessions/2026-05-04-040-arch-phase3c-haiku-switch.md` — file moved to `sessions/archive/2026-05/` after Phase-3-close. Update the relative path.

## Orphan pages

(none)

## Missing/incomplete frontmatter

- `wiki/decisions/legion-faction-dimension.md` has no `decision-date` field but `type: decision`.

## Stale low-confidence pages

- `wiki/glossary.md` was created 2026-05-09 with `confidence: low` for terms `pipeline-Engine` and `Aux-Source`. >30 days old. Either re-ingest with higher confidence, or downgrade those terms to `confidence: low` is just permanent uncertainty.

## Raw historical without banner

(none)

## Decision pages without decision-date

(none)
```

## Check list

The script (and your eye, until the script lands) checks:

### 1. Stale claims

The hardest check: a wiki page asserts something that no longer matches the code/repo state.

Heuristics:

- For each wiki page, look for **named code entities** mentioned in the body (function names, file paths, enum values, flag names, npm scripts). For each, grep the repo. If the entity doesn't exist (renamed/removed/never merged), flag.
- For each **phase claim** in the wiki ("Phase 2 in flight", "Phase 3 dry-run"), cross-check against `roadmap.md` and `project-state.md`. If two pages disagree, flag both.
- For each **count or metric** ("26 manual books", "$0.114/book", "Junction-Coverage 6/6"), check against the most recent diff JSON or seed data. Counts decay fast.
- For each **`sources:` frontmatter entry**, ensure the file exists. If it's been moved (e.g. `sessions/X.md` → `sessions/archive/2026-05/X.md`), update.

### 2. Broken internal links

For each wiki page, parse all relative links (`./`, `../`). For each, check the target file exists. Common breakages:

- Sessions moved to archive after a phase wraps
- Decision page renamed
- Atlas reference (links into `chrono-atlas/`) — these are external-vault links and not lintable; skip.

### 3. Orphan pages

A page with `type: overview | decision | workflow | concept` should have **at least one inbound link** from `wiki/index.md`. Pages with `type: source-summary | reference` are exempt (they may be referenced only from frontmatter `sources:`).

`wiki/index.md` is exempt from the orphan check (it's the catalog itself).

### 4. Missing/incomplete frontmatter

Every `wiki/**/*.md` file (except `log.md`, exempt by Brain-schema):

- Must have YAML triple-dash block at top.
- Must have: `title` (string), `type` (one of `overview | decision | workflow | concept | source-summary | reference`), `created` (YYYY-MM-DD), `updated` (YYYY-MM-DD), `sources` (array, may be empty), `related` (array, may be empty), `confidence` (one of `high | medium | low`).
- Decision pages additionally must have `decision-date`.

If `updated < created` or any date is malformed, flag.

### 5. Stale low-confidence pages

Pages with `confidence: low` and `updated` older than 30 days. The intent of `low` is "we synthesized this in a hurry; should be re-ingested". 30+ days old means it stayed `low` instead of becoming `high` — either nobody re-ingested (lint reminds), or the topic is genuinely permanent uncertainty (downgrade the page-type or add a "permanently uncertain" note).

### 6. Raw historical without banner

Files under `brain/raw/historical/**/*.md` must carry:

- `snapshot-of: <relative path>`
- `snapshot-date: YYYY-MM-DD`
- `snapshot-reason: …`
- `canonical-now: <pointer to current wiki page or current top-level file>`

If any field missing, flag.

### 7. Decision pages without decision-date

Already covered in (4) but worth a separate sanity check, because Decision pages without dates are the highest drift-risk (you can't lint stale-claims in them without knowing when they were valid).

### 8. (Optional) `index.md` updated-date freshness

`wiki/index.md` lists every wiki page with its `updated` date pulled from frontmatter. If a wiki page's frontmatter `updated` is newer than the date `index.md` shows for it, flag — the catalog is stale, regenerate.

## What lint does NOT do

- **Lint does not edit the wiki.** Findings are reports; fixes are separate Ingest passes.
- **Lint does not run code.** It reads the wiki + does file-existence + grep-match checks. No DB connection, no LLM calls.
- **Lint does not check raw/sessions content drift.** Sessions are immutable. If a session's claim later proved wrong, the *correction* lives in a wiki page or a decision page, not as an edit to the session.
- **Lint does not check the Atlas.** Atlas is mechanical mirror of Postgres; if it's wrong, the regen-script is buggy, not the Atlas content.

## Roadmap for the lint script

When the lint script ships (post-049, brief TBD):

- Implementation language: TypeScript (`scripts/brain-lint.ts`), runnable via `npm run brain:lint`.
- Reuse `gray-matter` (or hand-rolled YAML parser — no new dependency if avoidable) for frontmatter parsing.
- File-walking via `fs.promises.readdir` recursively.
- Output: write to `brain/outputs/lint/YYYY-MM-DD.md`; exit code 0 if clean, 1 if findings (so CI can flag stale Brain on PRs).
- Optional: GitHub Action that runs lint weekly and opens an issue if findings exist.

Until then, the discipline is: when something feels off, eyeball the check list above and write a hand-curated `brain/outputs/lint/YYYY-MM-DD.md` if there are findings. The act of writing the report is the value; automation is convenience.
