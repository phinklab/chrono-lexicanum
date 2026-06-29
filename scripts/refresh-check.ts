/**
 * Brief 133 / Board 122-B10 — weekly content-refresh detection orchestrator.
 *
 * Pulls the upstream book tracker + podcast feeds, diffs them against the
 * committed inventory, and — ONLY when there are findings — writes one
 * maintainer-reviewable proposal under `ingest/refresh/<isoWeek>/`:
 *   • report.md     — human review
 *   • proposal.json — structured, roster-extension-shaped, deterministic
 *
 * DETECTION ONLY — this script never imports the DB client, never writes
 * Postgres, never touches the Excel SSOT or the 859-book roster. Approval = a
 * maintainer merging the PR; promotion then travels the EXISTING apply paths
 * (see `scripts/runbooks/weekly-refresh-runbook.md`).
 *
 * Output contract (stdout, final line):
 *   REFRESH_RESULT=noop
 *   REFRESH_RESULT=degraded
 *   REFRESH_RESULT=findings books=<fresh> pending=<seen-backlog> episodes=<m> path=<dir>
 * `books=` counts FRESH books only (not yet in `book-seen.json`); the seen
 * backlog rides in `pending=`. `degraded` (Brief 151 Task 4) means no fresh
 * findings BUT ≥1 source is down (book source `unreachable` or a show `failed`) —
 * the workflow then keeps the rolling PR OPEN instead of closing it, so a total
 * outage can't masquerade as a quiet week. A `degraded` run writes no proposal
 * (no empty PR is forced). Token-order constraints (the workflow parses the
 * `findings` line with sed): `path=` must stay the LAST token (its sed captures
 * to end of line), and no token name may END in another token's name (the
 * `.*books=`-style seds are greedy — e.g. a `newbooks=` token would corrupt the
 * `books=` capture); the bare `noop`/`degraded` words carry no tokens to parse.
 * Exit 0 on any clean run (findings, degraded, or noop); exit 1 only on an
 * unexpected error — the book + podcast diffs are fail-soft and never throw.
 *
 * Flags:
 *   --week=YYYY-Www   override the output bucket (deterministic re-runs / tests)
 *   --include-seen    treat the book backlog as unseen (everything lands in
 *                     `books=`/the New table) — regenerates the full pending
 *                     list locally after noop weeks, when no committed proposal
 *                     carries it anymore
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { loadRegistry } from "@/lib/ingestion/podcast/registry";

import { ignoredSlugSet, loadBookIgnore } from "./refresh/book-ignore";
import { loadBookSeen, seenSlugSet } from "./refresh/book-seen";
import { detectMissingBooks } from "./refresh/book-source";
import { loadRefreshSources } from "./refresh/config";
import { loadEffectiveCorpusBooks } from "./refresh/effective-corpus";
import { floorIsoForShow, loadCurationState } from "./refresh/curation-state";
import {
  buildReportMarkdown,
  classifyRefreshRun,
  isoWeekOf,
  refreshOutDir,
  serializeProposal,
} from "./refresh/emit";
import { buildRosterIndex } from "./refresh/identity";
import { defaultPodcastDiffDeps, diffPodcasts } from "./refresh/podcast-diff";
import { makeIdAllocator } from "./refresh/proposal";

import type { BookDiffResult, PodcastDiffResult, RefreshProposal } from "./refresh/types";
import type { RosterFile } from "./seed-data/types";

const GENERATED_BY = "refresh:check (Brief 133 / Board 122-B10)";

function parseWeekArg(argv: string[]): string | null {
  for (const a of argv) {
    const m = /^--week=(\d{4}-W\d{2})$/.exec(a);
    if (m) return m[1];
  }
  return null;
}

function loadRoster(): RosterFile {
  const path = join(process.cwd(), "scripts", "seed-data", "book-roster.json");
  return JSON.parse(readFileSync(path, "utf8")) as RosterFile;
}

/** Per-source health to stderr — stdout stays the machine-readable REFRESH_RESULT. */
function logHealth(books: BookDiffResult, podcasts: PodcastDiffResult): void {
  if (books.status === "unreachable") {
    console.error(`[books] UNREACHABLE — ${books.note ?? ""}`);
  } else {
    console.error(
      `[books] ok — ${books.newBooks.length} new, ${books.pendingBooks.length} pending, ` +
        `${books.reviewBooks.length} review (+${books.pendingReviewBooks.length} seen) | ` +
        `${books.consideredRows} considered, ${books.skippedIgnoredRows} ignore-listed, ` +
        `${books.skippedOlderRows} below year floor, ` +
        `${books.skippedOutOfScopeRows} out-of-scope, ${books.skippedDuplicateRows} dupes`,
    );
  }
  for (const s of podcasts.shows) {
    const old = s.skippedBeforeFloor > 0 ? `, ${s.skippedBeforeFloor} before floor` : "";
    const vid = s.skippedExcludedByTitle > 0 ? `, ${s.skippedExcludedByTitle} title-excluded` : "";
    console.error(
      `[podcast ${s.slug}] ${s.status} — ${s.newEpisodes.length} new since ${s.floorIso}${old}${vid} (${s.note ?? "ok"})`,
    );
  }
}

async function main(): Promise<void> {
  const repoRoot = process.cwd();
  const argv = process.argv.slice(2);
  const isoWeek = parseWeekArg(argv) ?? isoWeekOf(new Date());
  const includeSeen = argv.includes("--include-seen");

  // --- Books (fail-soft) ---
  // Effective corpus = Legacy roster + per-book SSOT folder (Brief 170 Teil A).
  // A book promoted via scripts/seed-data/books/<slug>.json must classify
  // `exact` (never re-proposed) AND seed the id allocator's per-prefix maxima
  // (so the next W40K-/HH- id can't collide). Both consumers read only
  // `roster.books`, so merge the projection in once, here, at the chokepoint.
  const roster = loadRoster();
  const folderBooks = loadEffectiveCorpusBooks();
  const effectiveRoster: RosterFile = {
    ...roster,
    books: [...roster.books, ...folderBooks],
  };
  if (folderBooks.length > 0) {
    console.error(
      `[books] effective-corpus: +${folderBooks.length} per-book file(s) merged (Legacy ${roster.books.length} → ${effectiveRoster.books.length})`,
    );
  }
  const index = buildRosterIndex(effectiveRoster);
  const allocator = makeIdAllocator(effectiveRoster);
  const sources = loadRefreshSources();
  // Maintainer "book cutoff": title-slugs dismissed in `book-ignore.json` are
  // dropped before bucketing, so a duplicate / unwanted edition is not re-proposed.
  const ignore = ignoredSlugSet(loadBookIgnore());
  // Book backlog cursor: seen-but-undecided titles land in the pending buckets
  // instead of `new`, so only a true delta (re)opens the rolling PR.
  const seen = includeSeen ? new Set<string>() : seenSlugSet(loadBookSeen());
  const books = await detectMissingBooks(sources.trackOfWords, index, allocator, undefined, {
    ignoreSlugs: ignore,
    seenSlugs: seen,
  });

  // --- Podcasts (fail-soft) ---
  const registry = loadRegistry();
  const deps = defaultPodcastDiffDeps({
    artifactDir: join(repoRoot, "ingest", "podcasts"),
    youtubeApiKey: process.env.YOUTUBE_API_KEY,
  });
  // Per-show floor = the curation cursor, or the baseline `episodeSinceDate` when
  // a show was never reviewed. The cursor advances only via `refresh:mark-reviewed`.
  const curation = loadCurationState();
  const baselineDate = sources.podcasts.episodeSinceDate;
  const podcasts = await diffPodcasts(registry, deps, {
    floorIsoFor: (slug) => floorIsoForShow(curation, slug, baselineDate),
  });

  const newEpisodeCount = podcasts.shows.reduce((n, s) => n + s.newEpisodes.length, 0);
  const result = classifyRefreshRun(books, podcasts);

  const proposal: RefreshProposal = {
    $generatedBy: GENERATED_BY,
    isoWeek,
    books,
    podcasts,
    hasFindings: result === "findings",
  };

  logHealth(books, podcasts);

  if (result !== "findings") {
    // No fresh findings. `noop` = every source healthy → the workflow closes the
    // rolling PR. `degraded` = ≥1 source down → the workflow keeps the existing
    // rolling PR OPEN (a total outage must not read as a quiet week). We write NO
    // proposal in either case — no empty PR is forced; on a `degraded` week the
    // per-source failure detail is already on stderr (logHealth) and the workflow
    // turns it into a CI warning. Both are a clean exit 0.
    console.log(`REFRESH_RESULT=${result}`);
    return;
  }

  const outDir = refreshOutDir(repoRoot, isoWeek);
  mkdirSync(outDir, { recursive: true });
  const report = buildReportMarkdown(proposal, {
    generatedAtIso: new Date().toISOString(),
    episodeSinceDate: baselineDate,
  });
  writeFileSync(join(outDir, "report.md"), report, "utf8");
  writeFileSync(join(outDir, "proposal.json"), serializeProposal(proposal), "utf8");

  console.log(
    `REFRESH_RESULT=findings books=${books.newBooks.length} pending=${books.pendingBooks.length} ` +
      `episodes=${newEpisodeCount} path=${outDir}`,
  );
}

main().catch((err: unknown) => {
  console.error("refresh:check failed:", err instanceof Error ? (err.stack ?? err.message) : err);
  process.exitCode = 1;
});
