---
description: Register a brand-new podcast show and run its first ingest (Brief 172).
argument-hint: <feed-or-channel-url>
---

Register a **brand-new** podcast show and bring its episodes into the archive by
following `scripts/runbooks/add-podcast-runbook.md` station by station.

Arguments: `$ARGUMENTS`
— the show's RSS feed URL, or a YouTube channel URL/handle for a `source: youtube`
show.

Hard rules (from the brief + runbook):
- Register the show as one entry in `scripts/seed-data/podcast-shows.json`, then run
  the delta pipeline (a fresh show ⇒ every episode is "new", one code path).
- cc-direct tagging only — **no metered `ANTHROPIC_API_KEY` path**.
- **YouTube-channel procurement**: if the channel id can't be resolved, there's no
  `YOUTUBE_API_KEY`, or the off-topic uploads can't be cleanly split by playlist,
  **stop with needs-decision** — do NOT improvise a scrape. RSS shows have no such
  gate.
- The only live DB write is `npm run apply:podcast -- --show <slug>` — run it
  **only on Philipp's explicit go**.
- After this first ingest, *new* episodes go through `/add-podcast-episode`, never a
  full re-tag.
- Batch/Ingestion strand: never write `brain/**` or `sessions/README.md`.
