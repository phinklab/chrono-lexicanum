# Add a podcast show — registry + first ingest (Brief 172 Teil C)

Operational doc for registering a **brand-new podcast show** and bringing its
episodes into the archive. One show = one entry in
`scripts/seed-data/podcast-shows.json` (the registry `parseRegistry` validates),
then a cc-direct tag + the targeted `apply:podcast --show`. After the first
ingest, *new* episodes ride the delta path
([`add-podcast-episode-runbook.md`](./add-podcast-episode-runbook.md)).

> **DB-write gate.** Registering the show, acquiring, tagging, merging, and
> assembling are all DB-free and safe. The **only** step that touches the live
> database is `npm run apply:podcast -- --show <slug>`. Run it **only on Philipp's
> explicit go.**

> **This is a strand task (Batch/Ingestion).** It touches
> `scripts/seed-data/podcast-shows.json` + `ingest/podcasts/<slug>.*` (+ gitignored
> `ingest/podcasts/.cc-tag/`). It never writes `brain/**` or `sessions/README.md`.
> Not a normal session — follow this runbook, skip the session-start read-routine.

> **Slash command.** `/add-podcast <feed-or-channel-url>`
> (`.claude/commands/add-podcast.md`) drives this runbook.

---

## TL;DR

```bash
# 1. add an entry to scripts/seed-data/podcast-shows.json  (see § Registry entry)
# 2. validate the registry parses (DB-free)
npm run test:podcast-cc-direct
# 3. acquire → tag → merge → assemble  (first tag = the whole feed is "new")
npm run ingest:podcast -- --tagging=cc-direct --stage=acquire --show <slug> --out <slug>
npm run ingest:podcast:tag -- prepare-delta --out <slug>   # fresh show ⇒ every episode is new
bash scripts/run-podcast-tag-loop.sh --out <slug>
npm run ingest:podcast:tag -- merge-delta --out <slug>
npm run ingest:podcast -- --tagging=cc-direct --stage=assemble --out <slug>
# 4. PR → review → merge
# 5. apply — LIVE DB WRITE, only on Philipp's explicit go
npm run apply:podcast -- --show <slug>
```

A fresh show has no committed `<slug>.extractions.json`, so `prepare-delta`
degrades cleanly to "every episode is new" and `merge-delta` writes the whole file
— one code path for the first ingest and every later delta.

---

## The 5 stations

### 1 — Register the show (`podcast-shows.json`)

Add one object to the array. `parseRegistry` (`src/lib/ingestion/podcast/registry.ts`)
requires `slug`, `title`, `feedUrl`; everything else defaults. Minimal RSS entry:

```jsonc
{
  "slug": "my-show",
  "source": "rss",                       // omit ⇒ "rss"
  "title": "My Show",
  "feedUrl": "https://example.com/feed.xml",
  "appleId": null,
  "podcastGuid": null,
  "links": [],                           // official_website / spotify / youtube …
  "excludeTitlePatterns": []             // e.g. ["(Video)"] to drop audio+video twins
}
```

- **`slug`** — clean, unique; becomes `/podcast/<slug>` and the artifact basename.
- **`links[]`** — human-curated show-level links the feed can't supply (the RSS +
  Apple links are derived). A `serviceId` outside `SERVICE_LINK_SPEC` must spell
  out `kind` + `sourceKind` + `confidence`.
- **YouTube source** — set `"source": "youtube"` + `youtubeChannelId` (or a
  `youtubeChannelUrl` with an `@handle`); `excludePlaylists` / `includeVideoIds`
  curate off-topic uploads. Acquire needs `YOUTUBE_API_KEY` in `.env.local`.

> **⚠ needs-decision — YouTube channel procurement.** A whole YouTube channel is
> only reliably acquirable when the channel id resolves AND `YOUTUBE_API_KEY` is
> present AND the off-topic playlists are enumerable. If any of those is missing
> (no key, an unresolvable handle, a channel that mixes lore with hobby/news with
> no clean playlist split), **stop with `needs-decision`** rather than improvise a
> scrape — a follow-up brief decides the procurement. RSS shows have no such gate.

### 2 — Validate (DB-free)

```bash
npm run test:podcast-cc-direct   # parseRegistry runs over the committed file
```

Fix any registry parse error here — the cheap gate before anything is fetched.

### 3 — Acquire → tag → merge → assemble

Run the delta pipeline exactly as in
[`add-podcast-episode-runbook.md`](./add-podcast-episode-runbook.md) stations 1–5.
For a first ingest, `prepare-delta` reports every episode as new; the driver tags
them (cc-direct, Sonnet, **zero metered API calls**); `merge-delta` writes the
committed `<slug>.extractions.json`; assemble builds `<slug>.json`.

### 4 — PR → review → merge

Commit `podcast-shows.json` + `ingest/podcasts/<slug>.*` on a task branch, push,
open a PR, let Philipp merge. Source-first.

### 5 — Apply ⟶ **LIVE DB WRITE (explicit go only)**

```bash
npm run apply:podcast -- --show <slug>       # --dry-run to preview
```

Inserts the show container work + `podcast_details` + one `podcast_episode` per
item + junctions + links. Idempotent, `(podcast_work_id, episode_guid)`-keyed.

---

## What NOT to do

- **No live DB write without Philipp's explicit go.**
- **No improvised YouTube-channel scrape** — if procurement isn't clean, stop with
  `needs-decision`.
- **No new metered `ANTHROPIC_API_KEY` path** — tagging is cc-direct.
- **No `brain/**` or `sessions/README.md` edits** from this strand task.
- After the first ingest, **new** episodes go through the delta runbook, never a
  full re-tag.
