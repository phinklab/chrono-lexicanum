---
session: 2026-06-09-133
role: implementer
date: 2026-06-09
status: complete         # PR1 (detection) complete; PR2 (cron) deferred per agreed phasing
slug: weekly-content-refresh
parent: 2026-06-09-133
links:
  - 2026-05-31-110
  - 2026-06-02-114
  - 2026-06-07-130
  - 2026-06-03-122
commits: []              # filled by the PR; this report rides inside the PR1 code branch
---

# Weekly content refresh — Bücher + Podcasts (PR1: detection + report + proposal)

## Summary

Shipped the **detection pass** (`npm run refresh:check`): it fetches the Track of Words
BL-Pre-Order tracker (books) + every registered podcast feed, diffs them against committed
`book-roster.json` + `ingest/podcasts/<slug>.json`, and — only when there are findings —
writes ONE proposal (`ingest/refresh/<YYYY-Www>/report.md` + `proposal.json`) with **zero
DB writes**. The first live run flags **_Carnage Unending_ (Abnett, 2026)** as missing
(acceptance ✓). Per the agreed two-PR phasing, this is **PR1**; the weekly GitHub-Action
cron + rolling-PR automation is **PR2** (sketched in the runbook).

> **The one fact for Cowork:** the source spike resolved to a structured anchor — the Track
> of Words article embeds a *published Google Sheet*, and we pin its comprehensive-tab CSV
> export (`gid=374689393`). No LLM, no Cloudflare, no prose parsing. The brief's prose
> fallbacks (At Boundary's Edge / WarCom Sunday Preview) are out of v1 (warhammer.com = 405).

## What I did

New detection lib under `scripts/refresh/` (pure, no DB/Drizzle import — `BookFormat` is
type-only so the path never loads `drizzle-orm`):

- `scripts/refresh/types.ts` — shared shapes (`CandidateBook`, `BookDiffResult`,
  `PodcastShowDiff`, `ProposedRosterRow` = roster shape + `source_kind`/`confidence`,
  `RefreshProposal`).
- `scripts/refresh/identity.ts` — the no-false-positive firewall (`bookIdentityKey`,
  `buildRosterIndex`, `classifyCandidate`), reusing `slugify`/`slugifyPerson`.
- `scripts/refresh/book-source.ts` — Track of Words sheet fetch + CSV parse + diff
  (`detectMissingBooks`, fail-soft, DI'd fetch), `isInScopeSetting`, sheet re-discovery
  (`extractSheetUrl`/`toCsvExportUrl`), hand-rolled `parseCsv`.
- `scripts/refresh/podcast-diff.ts` — `diffPodcasts` reusing the exported `feed.ts` /
  `youtube.ts` primitives directly (NOT `ingest-podcast.ts`); fail-soft per show; recency
  window.
- `scripts/refresh/proposal.ts` — `makeIdAllocator` (per-prefix max+1, deterministic) +
  `toProposedRow`.
- `scripts/refresh/emit.ts` — Markdown report + deterministic `serializeProposal` +
  `isoWeekOf` + `proposalHasFindings`.
- `scripts/refresh/config.ts` + `scripts/seed-data/refresh-sources.json` — config-driven,
  validated source config (pinned CSV URL, year floor, podcast recency window).
- `scripts/refresh-check.ts` — orchestrator (npm `refresh:check`). `REFRESH_RESULT=noop` /
  `=findings …` stdout contract; exit 1 only on unexpected error.
- `scripts/test-refresh.ts` — offline, fixture-driven harness (npm `test:refresh`), 38 tests.
- `scripts/runbooks/weekly-refresh-runbook.md` — operational doc + the promotion path.
- `package.json` — `refresh:check`, `test:refresh`.

## Decisions I made

- **Source = the embedded Google Sheet's CSV export, pinned to `gid=374689393`.** The
  spike (read-only `curl`) found the article carries no table — the data is an embedded
  published sheet. The default tab (`gid=0`) is upcoming-only and MISSES Carnage Unending;
  the comprehensive tab `gid=374689393` (~1060 rows) contains it. `docs.google.com` is
  CI-fetchable; the CSV is structured (no LLM). Re-discovery from the article HTML is the
  fallback for a moved sheet URL. **Prose fallbacks deferred** (At Boundary's Edge needs an
  LLM; warhammer.com returns 405/Cloudflare to CI — confirmed).
- **No new dependency.** Hand-rolled an RFC-4180 CSV parser; reused `cheerio` (already a
  dep) for the fallback iframe extraction. No version pins touched.
- **Lib lives in `scripts/refresh/`, not `src/lib/refresh/`** — it imports roster types as a
  sibling (`../seed-data/types`) and the podcast primitives via `@/`, and is script-only
  (never bundled into the app). Keeps the app build free of it.
- **Identity firewall (3-tier, recall-favoring)** — see the runbook. Reuses the roster
  import's exact normalizers so a re-listed existing book keys identically; anthologies key
  on the `various` sentinel, never a contributor list. Documented limitation: subtitle /
  edition drift ("… 20th Anniversary Edition") can slip to `new`, caught by the review gate.
- **Three live-driven quality filters** (the raw first run was un-reviewable — 122 "books"
  incl. 18 "No new BL pre-orders this weekend" separators + Age-of-Sigmar/Old-World titles +
  multi-format duplicate rows): a **scope gate** (40k + Horus Heresy only — also kills the
  setting-less separators), **intra-tracker dedup** (year-relaxed), and a **podcast date
  floor** (`episodeSinceDate`, default `2026-01-01` — an absolute date, the currency analog
  of the book year-floor). Every drop is **counted in the report**, never silent. Result:
  122→61 books, and podcasts from ~1878 to a handful once pre-floor episodes are ignored
  (luetin09 1663→1). This is in-spirit with "ONE maintainer-reviewable proposal," not scope
  creep. (Per Philipp, 2026-06-09: an absolute date floor, not a relative window, so
  luetin09's old back-catalog is never even considered.)
- **`hasFindings` excludes review-books.** A title-collision (reprint) collides
  *permanently*, so gating the PR on it would create a PR that never clears. New books / new
  episodes trigger; collisions surface in the report only when a run already has findings.
- **`proposal.json` is timestamp-free** (run time lives in the report/PR body) so a stable
  backlog is byte-identical week over week — the rolling PR won't thrash.
- **Two-PR phasing (Philipp, this session).** PR1 = detection + report + proposal + firewall
  + tests + runbook (locally fully testable; satisfies acceptance 1–4, 6, 7, 8). PR2 = the
  weekly cron + rolling-PR automation (acceptance 5).
- **`import:ssot-roster` merge-wiring deferred.** PR1 emits roster-extension-shaped rows +
  documents the promotion path (acceptance 7 only requires documentation). Actually teaching
  the importer to merge a `book-roster.extension.json` touches the byte-stable 859 importer
  and deserves its own focused change — fold into PR2/PR3. The Excel SSOT is never touched.

## Open questions (from the brief — answered)

1. **Track-of-Words CI fetchability.** Resolved: pin the comprehensive-tab CSV export
   (`…/pub?gid=374689393&single=true&output=csv`). CI-fetchable, structured, no LLM. Article
   re-discovery is the moved-URL fallback. Prose fallbacks out of v1 (warhammer.com 405).
2. **Identity key.** `slugify(title) | authorKey | yearBucket`, 3-tier (strict → year-relaxed
   → title-collision-review → new), reusing the roster import's normalizers; `various`
   anthologies key on the sentinel. Reprint/omnibus robustness proven in tests + the live run
   (none of the 859 flagged new).
3. **`externalBookId` allocation.** Per-prefix `max+1`, 4-digit pad, seeded from the live
   roster each run → deterministic (same backlog re-issues the same ids; a promoted book's id
   is never reused). Series prefix inferred from the Setting column (Horus Heresy → HH, else
   W40K). First run: W40K-0566.., HH-0295.
4. **Rolling vs dated PR.** Recommend **rolling** (fixed `automation/weekly-refresh` branch).
   Timestamp-free proposal ⇒ unchanged backlog = no diff; a new release = a clean incremental
   diff; no-op week closes it. One PR to watch beats weekly triage-and-close.
5. **On-merge auto-apply.** **Deferred**, not built behind a flag — the DB write is the
   project's quality boundary (`why-bulk-backfill.md`). Revisit once detection has a record.

## Verification

- `npm run lint` (eslint) — **pass**.
- `npm run typecheck` (tsc --noEmit, strict, no `any`) — **pass**.
- `npm run test:refresh` — **38 passed, 0 failed** (offline, fixtures): firewall incl.
  Carnage→new + zero false-positives across all roster titles + reprint/various/reversed-
  author exact-matches; CSV parse (quoted comma, escaped quote, embedded newline,
  header-by-name, missing-column → unreachable); scope gate + dedup; sheet re-discovery;
  fail-soft (injected unreachable → partial, no throw); podcast diff (new-by-guid,
  missing-artifact → failed not "all new", youtube-no-key → skipped, recency window);
  allocator; no-op rule; deterministic serialize.
- **Live smoke** `npm run refresh:check` (real sources): books `ok — 61 new, 15 review |
  119 considered, 572 below year floor, 330 out-of-scope, 31 dupes`; **Carnage Unending
  present** (`W40K-0573`, various/2026/anthology); podcasts (date floor 2026-01-01)
  the-40k-lorecast 1, adeptus-ridiculous 0, lorehammer 41, luetin09 1 — each with the
  pre-floor back-catalog ignored, only counted (luetin09: **1849 before floor**). Wrote
  `ingest/refresh/2026-W24/{report.md,proposal.json}` (not staged for PR1 — a smoke
  artifact; PR2's cron produces the real weekly outputs).

## Open issues / blockers

None blocking. Notes:

- The live podcast counts confirm the **committed artifacts are behind**, but most of the
  gap is pre-2026 (luetin09 alone has 1849 episodes before the floor). That's a real
  backfill task, not a refresh — the absolute date floor (`episodeSinceDate`) keeps the old
  back-catalog out of the weekly proposal entirely (only counted). A one-off full
  `ingest:podcast` per show would re-baseline them.
- `ingest/refresh/` is intentionally **not** gitignored (PR2's `create-pull-request` must be
  able to commit there).

## For next session (architect)

- **PR2:** `.github/workflows/weekly-refresh.yml` weekly cron + `refresh:check:ci` sibling
  (no `--env-file`) + `peter-evans/create-pull-request@v7` on fixed branch
  `automation/weekly-refresh`. Needs the repo "Allow Actions to create PRs" setting ON.
- **Importer merge-wiring:** teach `import:ssot-roster` to merge `book-roster.extension.json`
  (fold into PR2/PR3) — the only piece between a merged proposal and the standard curation.
- **Optional firewall precision:** edition-marker stripping ("… 20th Anniversary Edition")
  to cut the reprint false-positives that currently land in the new-books table.

## Rollup facts for Cowork (I can't touch `brain/**` from the Batches strand)

- **ADR amendment trigger fired:** `why-bulk-backfill.md` monthly→weekly + source-set
  **+Track of Words** (the brief's Cadence-ADR-Amendment note). Source anchor = the embedded
  Google Sheet CSV (`gid=374689393`), not prose.
- **Board 122-B10** ("Weekly content refresh") — PR1 (detection) done; PR2 (cron) open.
- **New surface:** `npm run refresh:check` (+ `test:refresh`); config
  `scripts/seed-data/refresh-sources.json`; output `ingest/refresh/<YYYY-Www>/`; runbook
  `scripts/runbooks/weekly-refresh-runbook.md`. Detection imports neither the DB client nor
  the old crawlers.

## References

- Track of Words BL Pre-Order Tracker (article + embedded sheet), tab `gid=374689393`.
- Reused: `src/lib/ingestion/podcast/{feed,youtube,registry,types}.ts`, `src/lib/slug.ts`,
  `src/lib/seed/persons.ts`, `scripts/seed-data/types.ts`; HTTP pattern mirrors
  `src/lib/ingestion/hardcover/fetch.ts`.
