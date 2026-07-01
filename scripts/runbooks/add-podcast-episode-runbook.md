# Add podcast episode(s) — the delta path (Brief 172 Teil C)

Operational doc for bringing **new episodes of an already-registered show** into
the archive through the **podcast delta path** — the additive maintenance flow
that tags ONLY the new guids and merges them into the committed artifact, never
re-tagging (or shrinking) the reviewed back-catalogue. One run = the new episodes
of one show, applied idempotently via the existing `apply:podcast --show`.

> **DB-write gate.** Acquiring the manifest, planning the delta, cc-direct
> tagging, merging, and assembling are all DB-free and safe. The **only** step
> that touches the live database is `npm run apply:podcast -- --show <slug>`. Run
> it **only on Philipp's explicit go.** Default flow: tag → merge → assemble → PR
> → merge → apply.

> **This is a strand task (Batch/Ingestion).** It touches only
> `ingest/podcasts/<slug>.extractions.json` (+ the rebuilt `<slug>.json` artifact
> and `<slug>.report.md`), plus gitignored working files under
> `ingest/podcasts/.cc-tag/`. It never writes `brain/**` or `sessions/README.md`.
> Not a normal session — follow this runbook, skip the session-start read-routine.

> **Slash command.** `/add-podcast-episode <show-slug> [episode-url-or-title]`
> (`.claude/commands/add-podcast-episode.md`) drives this runbook.

---

## TL;DR

```bash
SLUG=lorehammer   # a slug already in scripts/seed-data/podcast-shows.json

# 1. acquire the live manifest (DB-free; full feed incl. the new episodes)
npm run ingest:podcast -- --tagging=cc-direct --stage=acquire --show "$SLUG" --out "$SLUG"

# 2. plan the DELTA — only guids not already in <slug>.extractions.json
#    (--week cross-checks the weekly proposal; "up to date" ⇒ nothing new)
npm run ingest:podcast:tag -- prepare-delta --out "$SLUG" --week 2026-W26

# 3. tag ONLY the delta batches — cc-direct, Sonnet, ZERO metered API calls
bash scripts/run-podcast-tag-loop.sh --out "$SLUG"

# 4. merge the delta INTO the committed extractions (additive; never shrinks)
npm run ingest:podcast:tag -- merge-delta --out "$SLUG"

# 5. rebuild the artifact from the full manifest + merged extractions
npm run ingest:podcast -- --tagging=cc-direct --stage=assemble --out "$SLUG"

# 6. PR → review → merge  (source-first)
# 7. apply — LIVE DB WRITE, only on Philipp's explicit go
npm run apply:podcast -- --show "$SLUG"
```

`apply:podcast --show` matches episodes by `(podcast_work_id, episode_guid)` and
inserts new / refreshes existing episodes **without pruning** — so a delta that
adds episodes to the artifact writes exactly the new ones and re-converges the
rest. That is why the existing verb IS the targeted delta-apply: no narrower verb
is needed.

---

## When to use this (and when not)

- **Use it** when an already-registered show has published new episode(s) since
  its committed artifact — the weekly report (`ingest/refresh/<week>/report.md`)
  lists them under `## Podcasts`, or you have a specific new episode in hand.
- **Don't use it** to register a brand-new show — that is
  [`add-podcast-runbook.md`](./add-podcast-runbook.md) (it registers the show in
  `podcast-shows.json` first, then runs an initial tag).
- **Don't use it** to re-tag the existing corpus. The delta is strictly additive;
  a guid already tagged is skipped, and a guid that would be tagged *differently*
  stops with `needs-decision` (never a silent retag).

---

## The 7 stations

### 1 — Acquire the manifest (DB-free)

```bash
npm run ingest:podcast -- --tagging=cc-direct --stage=acquire --show <slug> --out <slug>
```

Fetches the show's live feed (RSS or the YouTube uploads feed) into the transient
manifest at `ingest/podcasts/.cc-tag/<slug>/manifest.json` — the full current feed
including the new episodes, with each episode's title + description (the tagging
input). Honors `excludeTitlePatterns` (e.g. Lorehammer "(Video)" twins never
enter) and, for YouTube, `excludePlaylists` / `includeVideoIds`. **Anthropic-free
— zero API calls.** Use `--out <slug>` = the registry slug so the merge and apply
target the same committed files.

### 2 — Plan the delta

```bash
npm run ingest:podcast:tag -- prepare-delta --out <slug> [--week <YYYY-Www> | --proposal <path>]
```

Reads the manifest + the committed `ingest/podcasts/<slug>.extractions.json` and
chunks **only the guids not already tagged** (`manifest ∖ extractions`) into
`batch-NNN.input.json` batches of ≤10. Prints `N new episode(s), M already
tagged`; **"up to date — 0 new"** when nothing is new (a clean no-op — stop here).

- `--week` / `--proposal` cross-checks the delta against the weekly detection
  proposal (`refresh:check`): a proposal guid that is no longer in the live feed
  is **source drift** → stops with `needs-decision` (re-run `refresh:check`).
- **Prompt-version drift** (the committed file was tagged under an older
  `EPISODE_PROMPT_VERSION_HASH`) stops with `needs-decision` **before** any
  tagging burns a subsession — mixing prompt versions into one artifact is exactly
  what the delta must not do.

### 3 — Tag the delta (cc-direct, zero metered API)

```bash
bash scripts/run-podcast-tag-loop.sh --out <slug>   # --model sonnet (default), --label claude-sonnet-4-6
```

The unchanged Brief-131 driver runs one fresh `claude -p` subsession per delta
batch on the Max-plan allowance (Read+Write tools only — **no metered
`ANTHROPIC_API_KEY` call**), reading `ingest/podcasts/tagging-conventions.md` +
each batch input, writing `batch-NNN.output.json`. Resumable — a batch that
already validates is skipped. Podcast tagging is **Sonnet, never Haiku**.

> **Single known episode?** You can skip the driver and tag the one batch by hand
> in a `claude -p` subsession (read the batch input, write the batch output keyed
> by guid) — the driver just automates that loop.

### 4 — Merge the delta (additive union)

```bash
npm run ingest:podcast:tag -- merge-delta --out <slug>
```

UNIONs the delta batch outputs INTO the existing
`ingest/podcasts/<slug>.extractions.json` — existing entries preserved verbatim,
new guids added, byte-stable via `serializeExtractions`. Prints `+N new, M
unchanged → T total`. Re-running is idempotent (`+0 new`). Refuses (needs-decision)
on: header drift (prompt/model/slug), a guid already tagged with a **different**
extraction (guid ambiguity), or any would-be inventory shrink. (The full `merge`
verb refuses a delta plan outright — it overwrites and would drop the corpus.)

### 5 — Assemble the artifact (DB-free)

```bash
npm run ingest:podcast -- --tagging=cc-direct --stage=assemble --out <slug>
```

Rebuilds `ingest/podcasts/<slug>.json` (+ `<slug>.report.md`) from the full
manifest + the merged extractions, resolving surface-forms to canonical ids via
the shared alias module. This is the artifact `apply:podcast` reads. Deterministic
— re-running reproduces the same bytes.

### 6 — PR → review → merge

The changed `ingest/podcasts/<slug>.extractions.json` + `<slug>.json` +
`<slug>.report.md` are a normal Batch/Ingestion strand change. Commit on a task
branch, push, open a PR, let Philipp merge. Source-first — the artifact lands on
`main` **before** it is applied.

### 7 — Apply ⟶ **LIVE DB WRITE (explicit go only)**

```bash
npm run apply:podcast -- --show <slug>       # or --dry-run first to print the plan
```

Idempotent, `(podcast_work_id, episode_guid)`-keyed: inserts the new episode
work(s) + detail rows + junction sets + external links, refreshes existing
episodes, **prunes nothing**. Re-running converges to the same state. If the
episode came from the **weekly refresh**, afterwards run
`npm run refresh:mark-reviewed -- --show <slug>` so next week's report advances the
show's cursor (§ [`weekly-refresh-runbook.md`](./weekly-refresh-runbook.md)).

---

## What NOT to do

- **No live DB write without Philipp's explicit go.** Stations 1–6 are safe;
  station 7 is the gate.
- **No full-show retag as the default.** `ingest:podcast --show <slug>` (the api
  path) re-pulls + re-tags the *whole* feed through the metered LLM — it is a
  fallback for a first ingest or a deliberate re-tag, not the maintenance path.
- **No new metered `ANTHROPIC_API_KEY` path.** Tagging is cc-direct (`claude -p`).
- **No inventory-shrinking `--limit N`.** The delta only ever *adds* guids.
- **Don't force past a `needs-decision`.** Prompt/model/source drift and guid
  ambiguity are real questions — resolve them, don't override.
- **No `brain/**` or `sessions/README.md` edits** from this strand task.
