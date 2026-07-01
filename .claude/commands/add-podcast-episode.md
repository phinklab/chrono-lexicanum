---
description: Add new episodes of a registered podcast show via the additive delta path (Brief 172).
argument-hint: <show-slug> [episode-url-or-title]
---

Bring new episode(s) of an **already-registered** podcast show into the archive by
following `scripts/runbooks/add-podcast-episode-runbook.md` (the podcast **delta**
path) station by station.

Arguments: `$ARGUMENTS`
— the first token is the show slug (must exist in
`scripts/seed-data/podcast-shows.json`); anything after is an optional specific
episode url/title to focus the review on.

Hard rules (from the brief + runbook):
- Tag **only new guids**; `merge-delta` them additively into
  `ingest/podcasts/<slug>.extractions.json` — never a full-show retag, never a
  shrinking `--limit N`.
- cc-direct tagging only (`run-podcast-tag-loop.sh` / `claude -p`) — **no metered
  `ANTHROPIC_API_KEY` path**.
- Stop with **needs-decision** on prompt-version / model / source drift or guid
  ambiguity — do not override.
- The only live DB write is `npm run apply:podcast -- --show <slug>` — run it
  **only on Philipp's explicit go**. Default: acquire → prepare-delta → tag →
  merge-delta → assemble → PR → merge → apply.
- Batch/Ingestion strand: never write `brain/**` or `sessions/README.md`.
