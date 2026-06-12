/**
 * Brief 133 — proposal serialization + maintainer-facing Markdown report.
 *
 * `serializeProposal` is deterministic and TIMESTAMP-FREE: a stable backlog
 * produces byte-identical `proposal.json` on every re-run within a week, so the
 * rolling PR (PR2) doesn't thrash. The human run-time lives in the Markdown report
 * + PR body (`buildReportMarkdown`), never in the JSON.
 *
 * Pure module — no IO, no network, no `Date.now()`. The orchestrator passes the
 * run `Date` and the generated-at string in.
 */
import type { BookDiffResult, PodcastDiffResult, ProposedRosterRow, RefreshProposal } from "./types";

/** ISO-8601 week label (`YYYY-Www`) for a date — the per-run output bucket. */
export function isoWeekOf(date: Date): string {
  // ISO weeks belong to the year of their Thursday; shift to this week's Thursday.
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7; // Sunday 0 → 7
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/** The per-week output directory: `<repoRoot>/ingest/refresh/<isoWeek>`. */
export function refreshOutDir(repoRoot: string, isoWeek: string): string {
  return `${repoRoot}/ingest/refresh/${isoWeek}`;
}

/** Deterministic, timestamp-free `proposal.json` text (trailing newline). */
export function serializeProposal(proposal: RefreshProposal): string {
  return `${JSON.stringify(proposal, null, 2)}\n`;
}

/**
 * The PR/no-op decision: a run has findings iff there is ≥1 FRESH proposed new
 * book or ≥1 new episode. Books already marked seen (`book-seen.json` → the
 * `pendingBooks` backlog) deliberately do NOT trigger — a standing backlog would
 * otherwise reopen the rolling PR every week with nothing actually new.
 * Title-collisions (review books) deliberately do NOT trigger either — a reprint
 * collides permanently, so gating on it would create a PR that never clears.
 * Both surface in the report only when a run already has other findings.
 */
export function proposalHasFindings(books: BookDiffResult, podcasts: PodcastDiffResult): boolean {
  if (books.newBooks.length > 0) return true;
  return podcasts.shows.some((s) => s.newEpisodes.length > 0);
}

// --- Markdown report ---------------------------------------------------------

function authorDisplay(row: ProposedRosterRow): string {
  if (row.editorialNote === "various") return "_various_";
  return row.authors.length > 0 ? row.authors.join(", ") : "—";
}

function mdEscape(s: string): string {
  return s.replace(/\|/g, "\\|");
}

/**
 * Render one proposed-rows table. `defaulted` must be intersected per section
 * (fresh vs pending) so the ⚠ footnote only renders under a table that actually
 * contains a flagged row.
 */
function bookTable(rows: ProposedRosterRow[], defaulted: ReadonlySet<string>): string[] {
  const lines: string[] = [
    "| Proposed ID | Title | Author(s) | Year | Format | Series hint | Conf. |",
    "|---|---|---|---|---|---|---|",
  ];
  for (const row of rows) {
    const fmt = defaulted.has(row.externalBookId) ? `${row.format} ⚠` : row.format;
    lines.push(
      `| \`${row.externalBookId}\` | ${mdEscape(row.title)} | ${mdEscape(authorDisplay(row))} | ` +
        `${row.releaseYear ?? "—"} | ${fmt} | ${mdEscape(row.seriesHint ?? "—")} | ${row.confidence} |`,
    );
  }
  return lines;
}

const FORMAT_FOOTNOTE =
  "> ⚠ Format inferred from the tracker `Type` column; flagged rows had an unmappable type and " +
  "defaulted to `novel` — verify before promotion.";

function sectionDefaulted(rows: ProposedRosterRow[], all: ReadonlySet<string>): Set<string> {
  return new Set(rows.map((r) => r.externalBookId).filter((id) => all.has(id)));
}

function booksSection(books: BookDiffResult): string[] {
  const lines: string[] = [];
  if (books.status === "unreachable") {
    lines.push(`> ⚠ **Book source unreachable** — ${books.note ?? "no detail"}.`);
    lines.push(`> (No book findings this run; the podcast diff below is unaffected.)`);
    return lines;
  }

  const allDefaulted: ReadonlySet<string> = new Set(books.formatDefaultedIds);
  lines.push(
    `Considered ${books.consideredRows} in-scope, de-duplicated row(s) — skipped ` +
      `${books.skippedOlderRows} below the year floor, ${books.skippedOutOfScopeRows} out-of-scope ` +
      `(other settings / weekly separators), ${books.skippedDuplicateRows} duplicate listing(s).`,
  );
  if (books.skippedIgnoredRows > 0) {
    lines.push("");
    lines.push(
      `Plus ${books.skippedIgnoredRows} dismissed via the maintainer ignore-list ` +
        "(`ingest/refresh/book-ignore.json`) — duplicates / unwanted editions, never re-proposed.",
    );
  }
  lines.push("");

  lines.push(`### New since last review (${books.newBooks.length})`);
  lines.push("");
  if (books.newBooks.length === 0) {
    lines.push("None.");
  } else {
    const defaulted = sectionDefaulted(books.newBooks, allDefaulted);
    lines.push(...bookTable(books.newBooks, defaulted));
    if (defaulted.size > 0) {
      lines.push("");
      lines.push(FORMAT_FOOTNOTE);
    }
  }

  lines.push("");
  lines.push(`### Pending backlog (${books.pendingBooks.length})`);
  lines.push("");
  if (books.pendingBooks.length === 0) {
    lines.push("None.");
  } else {
    lines.push(
      "_Seen in an earlier report (`ingest/refresh/book-seen.json`), promote/ignore decision still " +
        "open. These rows never (re)open the rolling PR. After reviewing this report, mark the new " +
        "rows as seen with `npm run refresh:mark-reviewed -- --books`._",
    );
    lines.push("");
    lines.push("<details>");
    lines.push(`<summary>Show all ${books.pendingBooks.length} pending book(s)</summary>`);
    lines.push("");
    const defaulted = sectionDefaulted(books.pendingBooks, allDefaulted);
    lines.push(...bookTable(books.pendingBooks, defaulted));
    if (defaulted.size > 0) {
      lines.push("");
      lines.push(FORMAT_FOOTNOTE);
    }
    lines.push("");
    lines.push("</details>");
  }

  lines.push("");
  lines.push(`### Books needing review (${books.reviewBooks.length})`);
  lines.push("");
  if (books.reviewBooks.length === 0) {
    lines.push("None.");
  } else {
    lines.push("Title-slug collisions with an existing book — a new edition/omnibus or a duplicate? Human call.");
    lines.push("");
    lines.push("| Upstream title | Year | Author(s) | Collides with |");
    lines.push("|---|---|---|---|");
    for (const r of books.reviewBooks) {
      lines.push(
        `| ${mdEscape(r.title)} | ${r.releaseYear ?? "—"} | ${mdEscape(r.authorsRaw || "—")} | ` +
          `\`${r.collidesWithId}\` ${mdEscape(r.collidesWithTitle)} |`,
      );
    }
  }
  if (books.pendingReviewBooks.length > 0) {
    lines.push("");
    lines.push(
      `_Plus ${books.pendingReviewBooks.length} previously-seen collision(s) — still listed in ` +
        "`proposal.json` (`pendingReviewBooks`), not repeated here._",
    );
  }
  return lines;
}

function podcastsSection(podcasts: PodcastDiffResult, baselineDate: string): string[] {
  const lines: string[] = [];
  if (podcasts.shows.length === 0) {
    lines.push("No registered shows.");
    return lines;
  }
  lines.push(
    `_Each show is diffed from its own curation cursor — the date it was last reviewed up to ` +
      `(baseline **${baselineDate}** when never reviewed). Episodes before the cursor, and titles ` +
      `matching a show's exclude patterns (e.g. "(Video)" twins), are ignored — only counted. ` +
      `Advance a cursor after curating with \`npm run refresh:mark-reviewed -- --show <slug>\`._`,
  );
  lines.push("");
  const icon = (s: string): string => (s === "ok" ? "✅" : s === "skipped" ? "⏭️" : "⚠");
  for (const show of podcasts.shows) {
    const newCount = show.newEpisodes.length;
    lines.push(
      `### ${icon(show.status)} ${mdEscape(show.title)} (\`${show.slug}\`, ${show.source})`,
    );
    lines.push("");
    if (show.status === "ok") {
      const ignoredNotes: string[] = [];
      if (show.skippedBeforeFloor > 0) ignoredNotes.push(`${show.skippedBeforeFloor} before cursor`);
      if (show.skippedExcludedByTitle > 0) {
        ignoredNotes.push(`${show.skippedExcludedByTitle} title-excluded`);
      }
      const ignored = ignoredNotes.length > 0 ? ` (${ignoredNotes.join(", ")} ignored)` : "";
      lines.push(
        `Committed ${show.committedCount}, fetched ${show.freshCount}, **${newCount} new since ${show.floorIso}**${ignored}.`,
      );
      if (newCount > 0) {
        lines.push("");
        for (const ep of show.newEpisodes) {
          const date = ep.pubDate ? ep.pubDate.slice(0, 10) : "—";
          const link = ep.link ? ` — ${ep.link}` : "";
          lines.push(`- _${date}_ ${mdEscape(ep.title)}${link}`);
        }
      }
    } else {
      lines.push(`${show.status === "skipped" ? "Skipped" : "Failed"} — ${show.note ?? "no detail"}.`);
    }
    lines.push("");
  }
  return lines;
}

/**
 * Render the full maintainer report. The generated-at string is the ONLY
 * run-varying datum and lives here (never in `proposal.json`).
 */
export function buildReportMarkdown(
  proposal: RefreshProposal,
  opts: { generatedAtIso: string; episodeSinceDate: string },
): string {
  const { books, podcasts } = proposal;
  const newBookCount = books.newBooks.length;
  const pendingCount = books.pendingBooks.length;
  const reviewCount = books.reviewBooks.length;
  const newEpisodeCount = podcasts.shows.reduce((n, s) => n + s.newEpisodes.length, 0);
  const okShows = podcasts.shows.filter((s) => s.status === "ok").length;
  const failedShows = podcasts.shows.filter((s) => s.status === "failed").length;
  const skippedShows = podcasts.shows.filter((s) => s.status === "skipped").length;
  const bookHealth = books.status === "ok" ? "ok" : "⚠ unreachable";

  const lines: string[] = [
    `# Weekly content refresh — ${proposal.isoWeek}`,
    "",
    `_Generated ${opts.generatedAtIso} by \`refresh:check\`. Detection only — nothing has been written to the DB._`,
    "",
    "## Summary",
    "",
    `- **Books:** ${newBookCount} new, ${pendingCount} pending, ${reviewCount} to review (source: ${bookHealth})`,
    `- **Podcasts:** ${newEpisodeCount} new episode(s) — ${okShows} ok, ${failedShows} failed, ${skippedShows} skipped`,
    "",
    "## Books",
    "",
    ...booksSection(books),
    "",
    "## Podcasts",
    "",
    ...podcastsSection(podcasts, opts.episodeSinceDate),
    "## Promote (maintainer, after review)",
    "",
    "- **Books:** copy the chosen rows from `proposal.json` into " +
      "`scripts/seed-data/book-roster.extension.json`, then `npm run import:ssot-roster` to merge, " +
      "and curate/apply as usual. See `scripts/runbooks/weekly-refresh-runbook.md`.",
    "- **Podcasts:** `npm run ingest:podcast -- --show <slug>` then `npm run apply:podcast`.",
    "",
  ];
  return `${lines.join("\n")}`;
}
