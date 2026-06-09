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
 *   REFRESH_RESULT=findings books=<n> episodes=<m> path=<dir>
 * Exit 0 on any clean run (findings or noop); exit 1 only on an unexpected error
 * — the book + podcast diffs are fail-soft and never throw.
 *
 * Flags:
 *   --week=YYYY-Www   override the output bucket (deterministic re-runs / tests)
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { loadRegistry } from "@/lib/ingestion/podcast/registry";

import { detectMissingBooks } from "./refresh/book-source";
import { loadRefreshSources } from "./refresh/config";
import {
  buildReportMarkdown,
  isoWeekOf,
  proposalHasFindings,
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
      `[books] ok — ${books.newBooks.length} new, ${books.reviewBooks.length} review | ` +
        `${books.consideredRows} considered, ${books.skippedOlderRows} below year floor, ` +
        `${books.skippedOutOfScopeRows} out-of-scope, ${books.skippedDuplicateRows} dupes`,
    );
  }
  for (const s of podcasts.shows) {
    const old = s.skippedBeforeFloor > 0 ? `, ${s.skippedBeforeFloor} before floor` : "";
    console.error(`[podcast ${s.slug}] ${s.status} — ${s.newEpisodes.length} new${old} (${s.note ?? "ok"})`);
  }
}

async function main(): Promise<void> {
  const repoRoot = process.cwd();
  const isoWeek = parseWeekArg(process.argv.slice(2)) ?? isoWeekOf(new Date());

  // --- Books (fail-soft) ---
  const roster = loadRoster();
  const index = buildRosterIndex(roster);
  const allocator = makeIdAllocator(roster);
  const sources = loadRefreshSources();
  const books = await detectMissingBooks(sources.trackOfWords, index, allocator);

  // --- Podcasts (fail-soft) ---
  const registry = loadRegistry();
  const deps = defaultPodcastDiffDeps({
    artifactDir: join(repoRoot, "ingest", "podcasts"),
    youtubeApiKey: process.env.YOUTUBE_API_KEY,
  });
  const podcasts = await diffPodcasts(registry, deps, {
    sinceMs: Date.parse(sources.podcasts.episodeSinceDate),
  });

  const newEpisodeCount = podcasts.shows.reduce((n, s) => n + s.newEpisodes.length, 0);
  const hasFindings = proposalHasFindings(books, podcasts);

  const proposal: RefreshProposal = {
    $generatedBy: GENERATED_BY,
    isoWeek,
    books,
    podcasts,
    hasFindings,
  };

  logHealth(books, podcasts);

  if (!hasFindings) {
    console.log("REFRESH_RESULT=noop");
    return;
  }

  const outDir = refreshOutDir(repoRoot, isoWeek);
  mkdirSync(outDir, { recursive: true });
  const report = buildReportMarkdown(proposal, {
    generatedAtIso: new Date().toISOString(),
    episodeSinceDate: sources.podcasts.episodeSinceDate,
  });
  writeFileSync(join(outDir, "report.md"), report, "utf8");
  writeFileSync(join(outDir, "proposal.json"), serializeProposal(proposal), "utf8");

  console.log(
    `REFRESH_RESULT=findings books=${books.newBooks.length} episodes=${newEpisodeCount} path=${outDir}`,
  );
}

main().catch((err: unknown) => {
  console.error("refresh:check failed:", err instanceof Error ? (err.stack ?? err.message) : err);
  process.exitCode = 1;
});
