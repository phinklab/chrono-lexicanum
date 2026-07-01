# Weekly DB update — orchestration runbook (Brief 172 Teil C)

The maintainer-driven **weekly maintenance pass**: run a fresh detection, review
what is genuinely new WITH Philipp, promote the accepted books + podcast episodes
through their targeted paths, advance the cursors, and ship one CC-authored PR.
It **orchestrates** the existing primitives — it does not replace them:

- new books → the per-book path ([`add-book-runbook.md`](./add-book-runbook.md)),
- new episodes → the podcast delta path
  ([`add-podcast-episode-runbook.md`](./add-podcast-episode-runbook.md)),
- detection + cursors → the refresh machinery
  ([`weekly-refresh-runbook.md`](./weekly-refresh-runbook.md)).

> **Detection is free; DB writes are gated.** Preflight, `refresh:check`, review,
> and source-file edits are DB-free. The live-write steps — `apply:book --slug`,
> `apply:podcast --show` — run **only on Philipp's explicit go**. CI stays
> detection-only; nothing here is auto-applied from GitHub Actions.

> **This is a strand task (Batch/Ingestion).** It writes
> `scripts/seed-data/books/**`, `ingest/podcasts/**`, `ingest/refresh/**`, and
> `podcast-shows.json` — never `brain/**` or `sessions/README.md`. Not a normal
> session — follow this runbook, skip the session-start read-routine.

> **Weekly ≠ single-item.** `/weekly-db-update` is the *batch* review of a week's
> detection. For one specific new book use `/add-book`; for one specific new
> episode use `/add-podcast-episode`. They share primitives, not invocation.

> **Slash command.** `/weekly-db-update` (`.claude/commands/weekly-db-update.md`).

---

## The 10 steps

### 1 — Preflight (DB-free + read-only DB health)

```bash
npm run test:refresh              # the detection/emit unit suite is green
npm run refresh:audit-artifacts   # read-only: committed artifact ↔ DB guid drift
```

`refresh:audit-artifacts` is read-only (SELECTs only) and skips itself with no
`DATABASE_URL`. **Dangerous drift** (DB ahead of a committed artifact — a show
Postgres knows but the artifact doesn't) means the weekly diff would re-surface
those as "new"; fix the artifact (re-assemble / re-pull the show) before trusting
the detection. Harmless drift (artifact ahead of DB) just means an apply is
pending.

### 2 — Fresh detection

```bash
npm run refresh:check             # writes ingest/refresh/<week>/{report.md,proposal.json} on findings
```

Detection-only. `REFRESH_RESULT=noop` ⇒ nothing new this week (stop — no PR).
`findings` ⇒ new books (`books.newBooks[]`) and/or new episodes
(`podcasts.shows[].newEpisodes[]`) landed in the week's `proposal.json`.

### 3 — Review gate (show it briefly)

Read `ingest/refresh/<week>/report.md` with Philipp. Summarize compactly:
`## Books` (new / pending / review) and `## Podcasts` (per show: N new since the
floor, with titles). Do **not** promote anything yet.

### 4 — Per-item decision: promote / ignore / defer

Philipp calls each item:
- **promote** → step 5 (book) or step 6 (episodes),
- **ignore** (reprint / wrong edition / off-topic) → `refresh:ignore-book` (books)
  in step 7; a show's off-topic episodes are curated by `excludeTitlePatterns`,
- **defer** → leave it; it rides the backlog / re-appears next week, no action.

### 5 — Promote books (per-book path)

For each accepted book, follow [`add-book-runbook.md`](./add-book-runbook.md):
scaffold `scripts/seed-data/books/<slug>.json` from the proposal row (its allocated
`externalBookId` is in `proposal.json`), curate it, then **on Philipp's go**:

```bash
npm run apply:book -- --slug <slug>
```

NO batch / slot / `book-roster.extension.json` / `import:ssot-roster` / `loop:next`
— those are retired. The corpus lives only in `books/*.json`.

### 6 — Promote episodes (podcast delta)

For each accepted show, follow
[`add-podcast-episode-runbook.md`](./add-podcast-episode-runbook.md): acquire the
manifest, `prepare-delta --out <slug> --week <week>` (cross-checks this proposal),
tag the delta (cc-direct, **zero metered API**), `merge-delta`, assemble, then
**on Philipp's go**:

```bash
npm run apply:podcast -- --show <slug>
```

Delta only — new guids tagged and merged additively; a full-show retag is never
the default. `needs-decision` on prompt/source drift or guid ambiguity.

### 7 — Advance the cursors (hygiene)

> **SEQUENCING TRAP:** run the mark steps AFTER this PR is merged AND fetched — the
> proposal lands on `main` only on merge, so marking too early marks against last
> week's proposal.

```bash
npm run refresh:mark-reviewed -- --books           # "I have seen this book list" — run even if you promoted nothing
npm run refresh:mark-reviewed -- --show <slug>      # advance each reviewed show's floor (--all for every show)
npm run refresh:ignore-book -- --title "<title>"    # for each ignored book
```

Idempotent: re-running the weekly on the same accepted items advances nothing new
(marked-seen books drop out; already-tagged episodes are "up to date"; a re-merged
delta is `+0 new`).

### 8 — Inspect the rolling cron PR

The Monday cron (`.github/workflows/weekly-refresh.yml`) opens/updates ONE rolling
PR (`automation/weekly-refresh`) with `ingest/refresh/**` only — detection-only, no
DB secrets. Inspect it (`gh pr view`) and give Philipp a recommendation: merge it
(so the week's proposal + cursors land on `main`), or let it ride if you're
shipping your own PR (step 9) that supersedes it.

### 9 — Ship one CC-authored PR

Stage only this pass's changes (per-book files, `ingest/podcasts/**`,
`ingest/refresh/**`, `podcast-shows.json`), commit on a Batch/Ingestion task
branch, push, open a PR. **CC authors it; Philipp merges.** Never commit `brain/**`
or `sessions/README.md` from this strand.

### 10 — Summary

Report back: what was promoted (books + episodes), what was ignored/deferred, which
cursors advanced, the DB writes actually run (with Philipp's go) vs pending, and the
rolling-PR recommendation.

---

## What NOT to do

- **No auto-apply from CI** — GitHub Actions stays detection-only.
- **No live DB write without Philipp's explicit go.**
- **No retired machinery** — `import:ssot-roster`, `db:apply-override`, `loop:next`,
  `run-ssot-loop.sh`, `db:apply-scope` stay stilled; books go through `apply:book`.
- **No full-show podcast retag** as the default — the delta path only.
- **`db:drift` stays a read-only health check** — the corpus deep-diff is the
  operator's `equiv:diff --db-snapshot` / `--compare` against a disposable DB.
- **No single-item use** — that's `/add-book` or `/add-podcast-episode`.
- **No `brain/**` or `sessions/README.md` edits** from this strand task.
