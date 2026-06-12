/**
 * Brief 133 — advance the curation cursors ("I've reviewed this up to here").
 *
 * Shows: stamps a show's cursor date; the weekly podcast diff (`refresh:check`)
 * then only surfaces episodes published after it. Writes
 * `ingest/refresh/curation-state.json`.
 *
 * Books (`--books`): marks every book surfaced in a proposal (new + pending +
 * review collisions) as SEEN, so next week's report/PR only shows what is
 * genuinely new since this review. Writes `ingest/refresh/book-seen.json`.
 * Resolves the newest `ingest/refresh/<week>/proposal.json` (override with
 * --week YYYY-Www or --proposal <path>). NOTE: week dirs land on `main` only
 * when the rolling PR is merged — merge/fetch first, or pass --proposal, or you
 * mark against an older proposal and miss this week's finds.
 *
 * No DB, no network — reads the registry (to validate slugs / support --all),
 * the cursor file, the seen file, and the proposal. Run it after curating:
 * `npm run refresh:mark-reviewed -- --show <slug>` / `-- --books`.
 *
 * Usage:
 *   npm run refresh:mark-reviewed -- --show lorehammer          # one show, up to today
 *   npm run refresh:mark-reviewed -- --show a --show b          # several
 *   npm run refresh:mark-reviewed -- --all                      # every registered show
 *   npm run refresh:mark-reviewed -- --show luetin09 --date 2026-06-01
 *   npm run refresh:mark-reviewed -- --books                    # newest proposal's books → seen
 *   npm run refresh:mark-reviewed -- --books --week 2026-W24    # a specific week's proposal
 *   npm run refresh:mark-reviewed -- --all --books              # both sides in one go
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { parseArgs } from "node:util";

import { loadRegistry } from "@/lib/ingestion/podcast/registry";

import {
  BOOK_SEEN_PATH,
  loadBookSeen,
  markSeenTitles,
  serializeBookSeen,
} from "./refresh/book-seen";
import {
  CURATION_STATE_PATH,
  loadCurationState,
  markReviewed,
  serializeCurationState,
} from "./refresh/curation-state";
import { findProposalPath, loadProposal } from "./refresh/proposal-path";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function markShows(showArgs: string[] | undefined, all: boolean, date: string): void {
  const registry = loadRegistry();
  const known = new Set(registry.map((s) => s.slug));

  let slugs: string[];
  if (all) {
    slugs = registry.map((s) => s.slug);
  } else {
    slugs = showArgs ?? [];
    const bad = slugs.filter((s) => !known.has(s));
    if (bad.length > 0) {
      console.error(`error: unknown show(s): ${bad.join(", ")} — have: ${[...known].join(", ")}`);
      process.exit(1);
    }
  }

  const next = markReviewed(loadCurationState(), slugs, date);
  mkdirSync(dirname(CURATION_STATE_PATH), { recursive: true });
  writeFileSync(CURATION_STATE_PATH, serializeCurationState(next), "utf8");

  console.log(`marked reviewed up to ${date}: ${slugs.join(", ")}`);
  console.log(`wrote ${CURATION_STATE_PATH}`);
}

function markBooks(opts: { week?: string; proposal?: string }): void {
  const path = findProposalPath(opts);
  const proposal = loadProposal(path);
  // `?? []` guards: a proposal written before the pending split lacks the
  // pending* fields (loadProposal is a bare cast).
  const b = proposal.books;
  const titles = [
    ...(b.newBooks ?? []),
    ...(b.pendingBooks ?? []),
    ...(b.reviewBooks ?? []),
    ...(b.pendingReviewBooks ?? []),
  ].map((row) => row.title);

  const firstSeen = proposal.isoWeek;
  if (typeof firstSeen !== "string" || !/^\d{4}-W\d{2}$/.test(firstSeen)) {
    console.error(`error: proposal ${path} has no valid isoWeek ("${String(firstSeen)}")`);
    process.exit(1);
  }

  const before = loadBookSeen();
  const beforeCount = Object.keys(before.books).length;
  const next = markSeenTitles(
    before,
    titles.map((title) => ({ title, firstSeen })),
  );
  const afterCount = Object.keys(next.books).length;

  mkdirSync(dirname(BOOK_SEEN_PATH), { recursive: true });
  writeFileSync(BOOK_SEEN_PATH, serializeBookSeen(next), "utf8");

  console.log(
    `marked ${afterCount - beforeCount} book(s) seen (of ${titles.length} in ${path}); ` +
      `${afterCount} total`,
  );
  console.log(`wrote ${BOOK_SEEN_PATH}`);
}

function main(): void {
  const { values } = parseArgs({
    options: {
      show: { type: "string", multiple: true },
      all: { type: "boolean", default: false },
      date: { type: "string" },
      books: { type: "boolean", default: false },
      week: { type: "string" },
      proposal: { type: "string" },
    },
  });

  const wantShows = values.all || (values.show !== undefined && values.show.length > 0);
  if (!wantShows && !values.books) {
    console.error("error: pass --show <slug> (repeatable), --all, or --books");
    process.exit(1);
  }

  if (wantShows) {
    const date = values.date ?? todayIso();
    if (Number.isNaN(Date.parse(date))) {
      console.error(`error: --date must be a parseable ISO date (got "${String(values.date)}")`);
      process.exit(1);
    }
    markShows(values.show, values.all, date);
  }

  if (values.books) {
    markBooks({ week: values.week, proposal: values.proposal });
  }
}

main();
