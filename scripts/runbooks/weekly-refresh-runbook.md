# Weekly content refresh — runbook (Brief 133 / Board 122-B10)

Operational doc for the **detection pass** that checks whether our committed inventory
(books + podcast episodes) is still complete against upstream, and emits ONE
maintainer-reviewable proposal. This is **PR1 = detection + report + proposal**. The
weekly GitHub-Action cron + rolling-PR automation is **PR2** (see § PR2 below).

> **Detection only.** `refresh:check` never imports the DB client, never writes
> Postgres, never touches the Excel SSOT or `book-roster.json`. Approval is a human
> merging the PR; promotion then travels the **existing** apply paths (§ Promote).

---

## TL;DR — run it

```bash
npm run refresh:check                              # local: fetch sources, diff, write a proposal if there are findings
npm run refresh:mark-reviewed -- --show <slug>     # advance a show's curation cursor to today (--all for every show)
npm run test:refresh                               # offline unit tests (no network, no DB)
```

- Findings → writes `ingest/refresh/<YYYY-Www>/report.md` + `proposal.json`, prints
  `REFRESH_RESULT=findings books=<n> episodes=<m> path=<dir>`, exits 0.
- No findings → writes nothing, prints `REFRESH_RESULT=noop`, exits 0.
- Unexpected error → prints a stack, exits 1. The per-source diffs are **fail-soft**
  and never throw, so a `noop`/`findings` exit means the run completed; an exit 1 is a
  genuine bug (missing roster, malformed config, write failure).

Flags: `--week=YYYY-Www` overrides the output bucket (deterministic re-runs / tests).

---

## What it does

1. **Books** — fetches the Track of Words "BL Pre-Order Tracker" CSV (see § Source),
   parses it, and diffs each row against the committed `book-roster.json` via the
   identity firewall (§ Identity). Rows present upstream but absent from the roster →
   **proposed new rows** (roster-extension shape + provenance). Title-collisions →
   **review** (human call, never auto-proposed).
2. **Podcasts** — for each registered show (`podcast-shows.json`), pulls the live feed
   via the existing primitives (`feed.ts` `fetchFeed`/`parseFeed` for RSS,
   `youtube.ts` `fetchYoutubeFeed` for YouTube) and diffs episode `guid`s against the
   committed artifact `ingest/podcasts/<slug>.json`. New guids on/after the show's
   curation cursor and not title-excluded → listed (§ Curation cursor + title exclusion).
   `ingest-podcast.ts` is **not** touched — only its exported building blocks are reused.
3. **Emit** — assembles a `RefreshProposal`, and only if there are findings writes the
   Markdown report + the deterministic `proposal.json`.

### Output layout

```
ingest/refresh/<YYYY-Www>/
  report.md        # human review — summary, new-books table, review table, podcast deltas, promote steps
  proposal.json    # structured, roster-extension-shaped, deterministic (timestamp-free)
```

`proposal.json` is **timestamp-free** (the run time lives in the report + PR body) so a
stable backlog produces byte-identical output week over week — the rolling PR doesn't
thrash. The id allocator re-seeds from the live roster each run, so the same backlog
re-issues the same `W40K-####`/`HH-####` ids, and a promoted book's id is never reused.

---

## Source — Track of Words embedded Google Sheet (verified 2026-06-09)

The brief's primary anchor is the Track of Words BL Pre-Order Tracker. Its article HTML
has **no parseable table** — all data lives in an embedded **published Google Sheet**.
The pinned source (in `scripts/seed-data/refresh-sources.json`) is the **CSV export of
the comprehensive chronological tab** (`gid=374689393`, ~1060 rows):

```
https://docs.google.com/spreadsheets/d/e/2PACX-1vSZFSFiuzKtDuEsxnzWBNsc1JgU2XH0WGt5aDjX11wveRRv3JFspbLcV1xIlERcoumOG2X7RKDUlU83/pub?gid=374689393&single=true&output=csv
```

- **Why this tab:** the sheet's default tab (`gid=0`) is *upcoming-only* and would MISS
  the acceptance datapoint (Carnage Unending). Tab `gid=374689393` is the full list.
- **Why a sheet, not prose:** `docs.google.com` is reliably CI-fetchable (no Cloudflare),
  the CSV is structured (no LLM needed), and it's the most robust anchor the brief asked
  us to look for ("die eingebettete Community-Release-Tabelle als CSV-/Sheet-Export").
- **Columns (header-resolved by name, not position):** `Year, Month, Day, Title …,
  Author, Setting/series, Type, Format, Notes`. Only Year + Title + Author are required;
  a sheet missing one of those is reported **unreachable** (schema drift) rather than
  silently mis-parsed.
- **Fallbacks (in priority order):**
  1. If the pinned CSV URL 404s/moves, the pass re-discovers the sheet from the article
     HTML (`extractSheetUrl` → `toCsvExportUrl`) and retries — the community sheet URL is
     the one thing likely to drift.
  2. The brief's prose fallbacks (At Boundary's Edge, Warhammer Community Sunday Preview)
     are **deliberately NOT in v1**: At Boundary's Edge is prose (needs an LLM), and
     warhammer.com returns **HTTP 405 (Cloudflare)** to a CI fetch (confirmed 2026-06-09).
     The pinned sheet + the re-discovery fallback cover the realistic failure modes;
     adding a prose+LLM fallback is a tracked follow-up if the sheet ever dies for good.
  3. **Wikipedia is not a fallback** (per the brief — it lags releases by days/weeks).

A dead source is **fail-soft**: the books pass returns `status:"unreachable"` with a note
and empty findings; the podcast pass is unaffected (and vice versa).

---

## Identity firewall — no false-positive "new" (`scripts/refresh/identity.ts`)

The diff must flag genuinely-new releases WITHOUT marking any of the existing 859 as new
(reprints, omnibus re-titles, anthology re-credits). Key:

```
identityKey = slugify(title) | authorKey | yearBucket
```

- `slugify` / `slugifyPerson` are the **same** normalizers the roster import used, so a
  re-listed existing book keys to the identical string.
- `authorKey`: a `various` anthology keys on the literal `"various"` sentinel (never on a
  shifting contributor list — `*Various*` → `various`); named authors are person-slugged
  and **sorted**, so "A & B" == "B & A".
- `yearBucket`: the year, or `"?"` when unknown.

`classifyCandidate` runs three tiers:
1. strict key hit → **exact** (we have it),
2. year-relaxed key hit (`…|?`) → **exact** (reprint / sheet-vs-roster year drift),
3. title-slug hit → **title-collision** → `reviewBooks` (omnibus / re-title — human eye),
4. else → **new**.

**Documented limitation:** subtitle / edition drift can slip to `new` — e.g. a roster
"Xenos" vs an upstream "Eisenhorn: Xenos", or a "… 20th Anniversary Edition" reprint of an
existing book. These surface as proposed-new rows and are caught by the **human review
gate** (the PR) before promotion. Tightening this (edition-marker stripping, fuzzy
subtitle match) is a possible follow-up; v1 favors recall (never hide a real new book)
over precision (a few reprints to wave off in review).

---

## Scope gate, dedup, floors — why the counts are sane

The tracker spans **all** Black Library output; our roster is **40k + Horus Heresy only**.
Three filters keep the proposal reviewable (every drop is counted in the report, never
silent):

- **Scope gate** (`isInScopeSetting`) — a row is in scope iff its `Setting/series` starts
  with `40k` or contains `Horus Heresy`. This excludes Age of Sigmar / Warhammer – The Old
  World / Warhammer Chronicles, **and** the setting-less weekly separator rows ("No new
  Black Library pre-orders this weekend"). Conservative by design: an unrecognized setting
  is excluded rather than flooding the proposal. **Revisit trigger:** if a 40k-universe
  imprint ever ships under a setting label that isn't `40k…`/`Horus Heresy…` (e.g. a bare
  "Warhammer Crime"), add it here.
- **Intra-tracker dedup** — a book listed on several rows (hardback + paperback + ebook, or
  announce-date + release-date) collapses to ONE proposal, keyed year-relaxed.
- **Year floor** — `trackOfWords.sinceYear` (currently 2025) keeps the pass
  currency-focused; older rows are skipped and counted.
- **Podcast curation cursor** — each show is diffed from its own floor: the date it was
  last reviewed up to (`ingest/refresh/curation-state.json`, `slug → ISO date`), falling
  back to the baseline `podcasts.episodeSinceDate` (default `2026-01-01`) when never
  reviewed. A *refresh* only ever considers episodes on/after that floor — the pre-floor
  back-catalog (e.g. luetin09's years of non-lore uploads) is never diffed, only counted
  (`skippedBeforeFloor`). The cursor advances ONLY on an explicit
  `npm run refresh:mark-reviewed -- --show <slug>` (never on a plain `refresh:check`), so
  "I looked at this show and skipped the rest" sticks — skipped episodes are not
  re-proposed next week. This is the "since the last curation run" floor Philipp asked for
  (2026-06-09); backfilling a show's full history stays a separate, explicit
  `ingest:podcast` task.
- **Podcast title exclusion** — a show's `excludeTitlePatterns` (case-insensitive
  substrings, in `podcast-shows.json`) drop matching episodes at BOTH detection (the
  report) and ingest (never written to the artifact/DB), counted as
  `skippedExcludedByTitle`. Lorehammer carries `["(Video)"]`: its RSS feed publishes an
  audio + a video twin of most episodes as two GUIDs, and we keep only the audio cut. The
  RSS analogue of the YouTube playlist denylist (honored at ingest for RSS; YouTube shows
  use `excludePlaylists`/`includeVideoIds`).

For reference, the live run (2026-W24) goes from a raw 122 "new" books to **61** after
scope+dedup (330 out-of-scope + 31 dupe rows removed), and podcast deltas from ~1878 to
**3** once the cursor + title filter apply: luetin09 1849 pre-floor → 1; lorehammer 524
pre-floor + **40 "(Video)" twins** → 1 audio episode; the-40k-lorecast 1; adeptus 0.

---

## Config — `scripts/seed-data/refresh-sources.json`

```jsonc
{
  "trackOfWords": {
    "articleUrl": "https://www.trackofwords.com/2020/01/11/keep-track-of-upcoming-black-library-releases/",
    "sheetCsvUrl": "…/pub?gid=374689393&single=true&output=csv",  // pinned, verified
    "gid": 374689393,        // used to rebuild the CSV URL if re-discovery fires
    "sinceYear": 2025        // year floor
  },
  "podcasts": { "episodeSinceDate": "2026-01-01" }   // BASELINE floor; per-show cursors override
}
```

Validated on load (`config.ts`) — an edited/malformed config fails loud at startup.

Two sibling files complete the podcast side:

- **`scripts/seed-data/podcast-shows.json`** — the show registry. Per show,
  `excludeTitlePatterns: string[]` (case-insensitive title substrings) drops unwanted
  episodes at detection AND ingest (Lorehammer: `["(Video)"]`).
- **`ingest/refresh/curation-state.json`** — the per-show curation cursor
  (`{ "shows": { "<slug>": "YYYY-MM-DD" } }`), advanced via `refresh:mark-reviewed`.
  Absent on first run (every show falls back to the baseline). Committed, deterministic
  (slugs sorted).

---

## Promote (maintainer, after reviewing/merging the PR)

The detection pass only **proposes**. Promotion is maintainer-triggered and travels the
existing, quality-gated apply paths.

**Books** (`proposal.json` `books.newBooks[]` are already `book-roster.json`-shaped + carry
`source_kind`/`confidence`):

1. Review `report.md`; drop the false positives (reprints/edition re-issues flagged via
   the review table or the subtitle-drift limitation above).
2. Paste the chosen rows verbatim into `scripts/seed-data/book-roster.extension.json`'s
   `books[]` array (the additive promotion target — extra provenance keys like
   `source_kind`/`confidence` are ignored on merge). Or tell Claude Code in the terminal
   which rows fit and let it paste them.
3. `npm run import:ssot-roster` — reads the Excel **and** the extension and merges the new
   rows into `book-roster.json` (`extension: N merged` in the log). An empty/absent extension
   is a no-op, so this is safe to run anytime.
4. `npm run loop:next` now surfaces the new book(s) as the next curation batch.
5. Standard per-book curation (`claude -p` override → `npm run db:apply-override`) — each new
   book gets the same tagging (factions/locations/characters/synopsis) as the 859 and lands
   in the DB via the existing idempotent apply path.

> **The extension is additive + permanent.** The Excel SSOT (`source/Warhammer_Books_SSOT.xlsx`)
> is the FROZEN original 859; every book promoted from the refresh accretes in
> `book-roster.extension.json` and never needs hand-typing into the binary Excel.
> `import:ssot-roster` always emits `Excel + extension`, so re-runs stay byte-stable (an
> unchanged extension ⇒ byte-identical roster). `parseExtensionFile` firewalls the merge:
> external ids must match `W40K-####`/`HH-####`, ids/slugs may not collide with the roster or
> each other, `format` must be a valid `book_format` enum value — any violation is a loud-error
> that aborts the import. Collection membership for a *new anthology* is not yet expressible in
> the extension (a non-empty `collections[]` is a loud-error) — add those edges via the Excel
> if/when needed. The Excel SSOT itself is never written by the refresh path.

**Podcasts** (`proposal.json` `podcasts.shows[].newEpisodes[]` are report-only, NOT roster
rows). The intended loop is conversational — review the report WITH Claude Code in the
terminal ("lorehammer passt, bei luetin die eine, Video raus"), and Claude runs the steps
for what fits (or you do it by hand):

1. `PODCAST_LLM_MODEL=claude-sonnet-4-6 npm run ingest:podcast -- --show <slug>` (re-pull +
   LLM-tag; honors `excludeTitlePatterns`, so "(Video)" twins never enter the artifact —
   the book-default Haiku under-tags podcasts, so the Sonnet env knob is required),
2. `npm run apply:podcast -- --show <slug>` (idempotent, episodeGuid-keyed DB write),
3. `npm run refresh:mark-reviewed -- --show <slug>` — stamp the cursor to today so next
   week's report only shows what's newer. Run this EVEN IF you ingest nothing (you've
   reviewed the show and chosen to skip its backlog); the skipped episodes won't re-appear.

> **Note — show-level, not per-episode.** `ingest:podcast` re-pulls the *whole* feed and
> tags every (non-excluded) episode; there is no per-episode cherry-pick. Per-episode
> curation happens through `excludeTitlePatterns` (permanent) + the cursor (a "reviewed up
> to here" line), not an accept/reject of individual episodes. Per-episode Apple deep-links
> are not produced by the pipeline (episode links = the RSS audio enclosure; Apple is a
> show-level link) — add one by hand if ever needed.

---

## PR2 — the weekly cron + rolling PR (follow-up)

Deferred to a second PR (agreed two-PR phasing). Sketch:

- `.github/workflows/weekly-refresh.yml`: `on: schedule` (weekly) + `workflow_dispatch`;
  `permissions: contents: write, pull-requests: write`; Node 22 + `npm ci`.
- A CI sibling script `refresh:check:ci` (no `--env-file`; `YOUTUBE_API_KEY` via workflow
  `env`, optional). No Anthropic key needed.
- Findings → `peter-evans/create-pull-request@v7` with a **fixed branch**
  `automation/weekly-refresh` (stable rolling-PR identity), `add-paths: ingest/refresh/**`
  (cannot touch the roster / Excel / brain). A no-op week closes the rolling PR.
- Requires the repo setting "Allow GitHub Actions to create … pull requests" ON.

**Rolling vs dated PR (open question — recommendation):** a single **rolling** PR on the
fixed `automation/weekly-refresh` branch. The timestamp-free `proposal.json` means an
unchanged backlog produces no diff (no thrash); a new release shows as a clean incremental
diff on the existing PR; a no-op week closes it. One PR to watch beats a new PR per week
that has to be triaged and closed.

**On-merge auto-apply (open question):** deliberately **deferred**, not built behind a
flag. The DB write is the project's quality boundary (`why-bulk-backfill.md`); auto-apply
from CI would cross it. Revisit once the detection quality has a track record.
