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
npm run refresh:audit-artifacts                    # LOCAL preflight: read-only podcast artifact ↔ DB drift audit
npm run refresh:mark-reviewed -- --show <slug>     # advance a show's curation cursor to today (--all for every show)
npm run refresh:mark-reviewed -- --books           # mark the newest proposal's books as seen (→ pending backlog)
npm run test:refresh                               # offline unit tests (no network, no DB)
```

- Findings → writes `ingest/refresh/<YYYY-Www>/report.md` + `proposal.json`, prints
  `REFRESH_RESULT=findings books=<fresh> pending=<seen-backlog> episodes=<m> path=<dir>`, exits 0.
  **Findings = fresh only:** ≥1 book not yet in `book-seen.json`, or ≥1 new episode. A
  week where only the seen backlog re-detects is a `noop` (the rolling PR closes).
- No findings, every source healthy → writes nothing, prints `REFRESH_RESULT=noop`, exits 0
  (the rolling PR closes).
- No findings BUT ≥1 source down (book source `unreachable` / a show `failed`) →
  `REFRESH_RESULT=degraded`, exits 0, writes nothing — but the workflow **keeps the rolling
  PR open** and emits a CI warning, so a total outage can't masquerade as a quiet week
  (Brief 151 Task 4). `skipped` youtube shows (no API key) are healthy, not degraded.
- Unexpected error → prints a stack, exits 1. The per-source diffs are **fail-soft**
  and never throw, so a `noop`/`degraded`/`findings` exit means the run completed; an exit 1
  is a genuine bug (missing roster, malformed config, write failure).

Flags: `--week=YYYY-Www` overrides the output bucket (deterministic re-runs / tests);
`--include-seen` treats the book backlog as unseen — regenerates the full pending list
locally after noop weeks, when no committed proposal carries it anymore.

---

## What it does

1. **Books** — fetches the Track of Words "BL Pre-Order Tracker" CSV (see § Source),
   parses it, and diffs each row against the committed `book-roster.json` via the
   identity firewall (§ Identity). Rows present upstream but absent from the roster →
   **proposed new rows** (roster-extension shape + provenance). Title-collisions →
   **review** (human call, never auto-proposed). Each bucket is then partitioned by
   the book backlog cursor (§ Book backlog cursor): titles already in
   `book-seen.json` land in `pendingBooks` / `pendingReviewBooks` — full rows in the
   proposal, a collapsed section in the report, and never a PR trigger.
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

## Book backlog cursor — `ingest/refresh/book-seen.json` (`scripts/refresh/book-seen.ts`)

The book analog of the podcast curation cursor, sitting between the permanent
ignore-list and promotion. Without it, every not-yet-promoted/not-ignored book since the
year floor re-appears as "new" **every week** — the 2026-W24 report listed 30 "new"
books when the actual week-over-week delta was a fraction of that.

- **Semantics:** title-slugs the maintainer has *seen in a proposal without deciding
  yet*. Seen books still get detected and keep their proposal rows (`pendingBooks` /
  `pendingReviewBooks`, promotion copy-paste keeps working), but they render as a
  collapsed "Pending backlog" section and **never (re)open the rolling PR** — only
  fresh books and new episodes do.
- **Advancing:** ONLY via the explicit `npm run refresh:mark-reviewed -- --books`
  (never on a plain `refresh:check` — same rule as the podcast cursor). It resolves
  the newest `ingest/refresh/<week>/proposal.json` (`--week` / `--proposal <path>`
  override) and marks everything surfaced there (new + pending + both review buckets);
  `firstSeen` is stamped from the proposal's ISO week, first-seen wins on re-marks.
- **Sequencing trap:** week dirs land on `main` only when the rolling PR is *merged*.
  Mark **after** merging/fetching the PR (or pass `--proposal`), or you mark against an
  older proposal and this week's fresh finds stay unseen.
- **Ids shift, slugs don't:** proposed `W40K-####` ids are re-allocated from the roster
  high-water mark each run, so pending-table ids move after any promotion. Copy rows
  out of `proposal.json`; never bookmark ids. (Seen-keying is on title-slug for exactly
  this reason — see the same note in `book-ignore.ts`.)
- **Backlog regeneration:** after a noop week the rolling PR is closed and no new
  proposal is written — run `npm run refresh:check -- --include-seen` locally to
  re-emit the full backlog when you want to work through it.
- **Lifecycle:** a seen book that gets promoted starts matching the roster (`exact`)
  and drops out of detection by itself; its stale `book-seen.json` entry is harmless.
  A seen book you decide against belongs in `book-ignore.json` (use
  `refresh:ignore-book`, which resolves new **and** pending ids).

---

## Preflight — artifact ↔ DB drift audit (`npm run refresh:audit-artifacts`)

The podcast diff keys "new" on the committed artifact `ingest/podcasts/<slug>.json`, **not**
on the DB. So if an episode is already in Postgres (`apply:podcast`) but the artifact was
never re-pulled, that episode is *behind* the artifact's view and re-surfaces as "new" every
week. **Before trusting the unattended weekly run, pull this audit green once locally.**

```bash
npm run refresh:audit-artifacts        # read-only; uses --env-file=.env.local
```

- **Read-only.** The only DB statements are `SELECT`s — it writes nothing (not Postgres, not
  the artifacts, not the roster). It is purely diagnostic.
- **Local-only, never in CI.** It needs `DATABASE_URL`; without it (the CI environment) it
  prints a notice and **exits 0** — it never reddens CI. The CI path (`refresh:check:ci`)
  stays DB-free; this audit is deliberately *not* wired into the workflow.
- **What it reports**, per show:
  - **DB \ Artefakt** (episodes in the DB, missing from the artifact) = the **dangerous** set
    → would re-detect as "new". Reported loudly; **exit 1** if any show drifts this way, so
    "pull it green" is meaningful. Fix: `npm run ingest:podcast -- --show <slug>` to re-pull
    the artifact, then re-commit it.
  - **Artefakt \ DB** (artifact ahead of the DB) = harmless (detected-but-not-yet-applied),
    informational only.
- A show with **no artifact and no DB rows** (never ingested) is benign, not a failure. A
  missing artifact while the DB *has* episodes is dangerous (every DB episode is flagged).

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
  **Bootstrapped + committed** (Brief 151 Task 3): every registered show starts at the
  baseline `2026-01-01` — the deliberately conservative choice, identical in effect to the
  empty-file fallback but now a real, committed high-water mark. Advancing further would
  suppress genuinely-new episodes that were never actually reviewed, so the maintainer
  advances each show only after a real curation. Committed, deterministic (slugs sorted).
- **`ingest/refresh/book-seen.json`** — the book backlog cursor (§ Book backlog cursor),
  **bootstrapped + committed** with the 2026-W24 backlog so the standing list no longer
  re-leads the report every week. Advanced via `refresh:mark-reviewed -- --books`.

---

## Promote (maintainer, after reviewing/merging the PR)

The detection pass only **proposes**. Promotion is maintainer-triggered and travels the
existing, quality-gated apply paths.

**Books** (`proposal.json` `books.newBooks[]` carry the identity + `source_kind`/`confidence`
the per-book file needs — they seed the scaffold, they are no longer pasted into a roster
extension). Promotion now travels the **per-book SSOT path** (Brief 170 Teil A), not the
batch / slot / `loop:next` / `book-roster.extension.json` dance:

1. Review `report.md`; drop the false positives (reprints/edition re-issues flagged via
   the review table or the subtitle-drift limitation above).
2. For each chosen book, scaffold one `scripts/seed-data/books/<slug>.json`
   (`$schema: "book-v1"`): copy `externalBookId` / `slug` / `title` / `authors` / `editors`
   / `releaseYear` / `format` / `series` from the proposal row, then fill `curation`
   (synopsis + facets + factions/locations/characters) — the same tagging the 859 got. The
   full station-by-station flow lives in
   [`scripts/runbooks/add-book-runbook.md`](./add-book-runbook.md). Or tell Claude Code in
   the terminal which rows fit and let it scaffold them.
3. `npm run test:book-file` — DB-free gate: schema, dup-guard against the effective corpus
   (Legacy roster + `books/`), additive id allocation, curation validation. Fix any red
   before applying.
4. **On Philipp's explicit go** (the DB-write gate — § add-book-runbook): `npm run apply:book -- --slug <slug>`.
   Idempotent; writes works/book_details/junctions/persons; `primary_era_id = "time_ending"`;
   the reference/facet **prolog runs first**, so a brand-new faction/location/facet resolves
   without a full `db:sync`. (`--all` re-applies every per-book file — it is also the
   `db:sync` step-3 tail.)
5. `npm run refresh:mark-reviewed -- --books` — stamp everything you've now looked at as
   seen, so next week's report/PR only shows what is genuinely new. Run this EVEN IF you
   promote/ignore nothing (you've reviewed the list and chosen to defer); the deferred
   books move to the pending backlog instead of re-leading the report (§ Book backlog
   cursor, note the sequencing trap).

> **The per-book file is the additive promotion target now (Brief 170 Teil A).** Each book
> promoted from the refresh is one git-versioned `scripts/seed-data/books/<slug>.json`,
> applied idempotently via `apply:book` — **no** batch / slot / `loop:next`, **no**
> `book-roster.extension.json`, **no** `import:ssot-roster` for refresh promotions. The
> Excel SSOT (`source/Warhammer_Books_SSOT.xlsx`) + `book-roster.json` stay the FROZEN,
> authoritative Legacy corpus (the original 859 + crystallized batches); per-book files
> accrete *alongside* them and the dup-guard rejects any slug/externalBookId that already
> lives in either world. A new anthology expresses its membership in its own file's
> `collections.collects[]` (the collection owns the edges) — no Excel edit needed. The
> Legacy roster + Excel are never written by the refresh or per-book path.

**Podcasts** (`proposal.json` `podcasts.shows[].newEpisodes[]` are report-only, NOT roster
rows). Post-172 the promote path is the **delta** — tag ONLY the new guids and merge them
into the committed artifact, never a full-show retag. The full station-by-station flow lives
in [`add-podcast-episode-runbook.md`](./add-podcast-episode-runbook.md); in short:

1. `npm run ingest:podcast -- --tagging=cc-direct --stage=acquire --show <slug> --out <slug>`
   (fetch the live manifest; honors `excludeTitlePatterns`, so "(Video)" twins never enter),
2. `npm run ingest:podcast:tag -- prepare-delta --out <slug> --week <YYYY-Www>` (chunk ONLY
   the guids not already tagged; cross-checks this week's proposal — "up to date" when nothing
   is new, `needs-decision` on source/prompt drift),
3. tag the delta batches with `scripts/run-podcast-tag-loop.sh --out <slug>` (cc-direct,
   Sonnet, **zero** metered API calls) then `npm run ingest:podcast:tag -- merge-delta --out <slug>`
   (additive union into `<slug>.extractions.json` — never overwrites a reviewed episode, never
   shrinks),
4. `npm run ingest:podcast -- --tagging=cc-direct --stage=assemble --out <slug>` (rebuild the
   artifact), then `npm run apply:podcast -- --show <slug>` (idempotent, episodeGuid-keyed DB
   write — **only on Philipp's explicit go**),
5. `npm run refresh:mark-reviewed -- --show <slug>` — stamp the cursor to today so next
   week's report only shows what's newer. Run this EVEN IF you tag nothing (you've reviewed
   the show and chosen to skip its backlog); the skipped episodes won't re-appear.

> **Note — delta, additive, per-episode.** The delta tags only guids absent from the committed
> extractions and merges them in; a prompt-version/model drift or a guid that would be re-tagged
> differently stops with `needs-decision` (never a silent retag or an inventory shrink). A
> full-show re-pull (`ingest:podcast --show`, the metered api path) stays available as a
> fallback for a first ingest or a deliberate re-tag, but is no longer the default. Per-episode
> Apple deep-links are not produced by the pipeline (episode links = the RSS audio enclosure;
> Apple is a show-level link) — add one by hand if ever needed.

---

## PR2 — the weekly cron + rolling PR (follow-up)

Deferred to a second PR (agreed two-PR phasing). Sketch:

- `.github/workflows/weekly-refresh.yml`: `on: schedule` (weekly) + `workflow_dispatch`;
  `permissions: contents: write, pull-requests: write`; Node 22 + `npm ci`.
- A CI sibling script `refresh:check:ci` (no `--env-file`; `YOUTUBE_API_KEY` via workflow
  `env`, optional). No Anthropic key needed.
- Findings → `peter-evans/create-pull-request@v8` with a **fixed branch**
  `automation/weekly-refresh` (stable rolling-PR identity), `add-paths: ingest/refresh/**`
  (cannot touch the roster / Excel / brain). A genuine `noop` week (every source healthy,
  nothing fresh) closes the rolling PR; a `degraded` week (a source down) keeps it open and
  emits a CI warning instead (Brief 151 Task 4 — § TL;DR).
- Requires the repo setting "Allow GitHub Actions to create … pull requests" ON.

**Rolling vs dated PR (open question — recommendation):** a single **rolling** PR on the
fixed `automation/weekly-refresh` branch. The timestamp-free `proposal.json` means an
unchanged backlog produces no diff (no thrash); a new release shows as a clean incremental
diff on the existing PR; a no-op week closes it. One PR to watch beats a new PR per week
that has to be triaged and closed.

**On-merge auto-apply (open question):** deliberately **deferred**, not built behind a
flag. The DB write is the project's quality boundary (`why-bulk-backfill.md`); auto-apply
from CI would cross it. Revisit once the detection quality has a track record.
