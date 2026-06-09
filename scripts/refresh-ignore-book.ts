/**
 * Brief 133 follow-up — dismiss a book from the weekly refresh (the "book cutoff").
 * The book analog of `refresh:mark-reviewed`: writes `ingest/refresh/book-ignore.json`
 * so a duplicate / unwanted-format / already-bundled book stops being re-proposed
 * every week. No DB, no network.
 *
 * Targets resolve to a title-slug (`slugify(title)`), the key the weekly diff
 * matches on:
 *   --title "<exact title>"   dismiss by title (no proposal needed)
 *   --id W40K-0600            dismiss a proposed NEW book by its id (reads a proposal)
 *   --all-review              dismiss every current title-collision (reads a proposal)
 *
 * --id / --all-review resolve against the latest `ingest/refresh/<week>/proposal.json`
 * (override with --week YYYY-Www or --proposal <path>). --reason stamps an audit note
 * on every entry added in the invocation (default "maintainer-dismissed").
 *
 * Usage:
 *   npm run refresh:ignore-book -- --title "The Art of Warhammer 40,000" --reason "artbook — not archived"
 *   npm run refresh:ignore-book -- --id W40K-0600 --id W40K-0583 --reason "edition/format not archived"
 *   npm run refresh:ignore-book -- --all-review --reason "duplicate of an existing roster book"
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { parseArgs } from "node:util";

import {
  addIgnoredTitles,
  BOOK_IGNORE_PATH,
  loadBookIgnore,
  serializeBookIgnore,
} from "./refresh/book-ignore";

import type { RefreshProposal } from "./refresh/types";

const REFRESH_DIR = join(process.cwd(), "ingest", "refresh");

/** Locate the proposal to resolve --id / --all-review against. */
function findProposalPath(opts: { week?: string; proposal?: string }): string {
  if (opts.proposal) return opts.proposal;
  if (opts.week) return join(REFRESH_DIR, opts.week, "proposal.json");
  let weeks: string[] = [];
  try {
    weeks = readdirSync(REFRESH_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory() && /^\d{4}-W\d{2}$/.test(d.name))
      .map((d) => d.name)
      .sort()
      .reverse();
  } catch {
    weeks = [];
  }
  for (const w of weeks) {
    const p = join(REFRESH_DIR, w, "proposal.json");
    if (existsSync(p)) return p;
  }
  throw new Error(
    "no proposal.json found under ingest/refresh/<week>/ — run `npm run refresh:check` " +
      "first, or pass --proposal <path>",
  );
}

function loadProposal(path: string): RefreshProposal {
  if (!existsSync(path)) throw new Error(`proposal not found: ${path}`);
  return JSON.parse(readFileSync(path, "utf8")) as RefreshProposal;
}

function main(): void {
  const { values } = parseArgs({
    options: {
      title: { type: "string", multiple: true },
      id: { type: "string", multiple: true },
      "all-review": { type: "boolean", default: false },
      reason: { type: "string" },
      week: { type: "string" },
      proposal: { type: "string" },
    },
  });

  const reason = (values.reason ?? "maintainer-dismissed").trim() || "maintainer-dismissed";
  const titles = values.title ?? [];
  const ids = values.id ?? [];
  const wantProposal = ids.length > 0 || values["all-review"];

  const entries: { title: string; reason: string }[] = [];
  for (const t of titles) entries.push({ title: t, reason });

  if (wantProposal) {
    const path = findProposalPath({ week: values.week, proposal: values.proposal });
    const proposal = loadProposal(path);
    const newBooks = proposal.books.newBooks ?? [];
    const byId = new Map(newBooks.map((b) => [b.externalBookId, b]));

    const missing: string[] = [];
    for (const id of ids) {
      const row = byId.get(id);
      if (!row) {
        missing.push(id);
        continue;
      }
      entries.push({ title: row.title, reason });
    }
    if (missing.length > 0) {
      console.error(
        `error: id(s) not in ${path}: ${missing.join(", ")}\n` +
          `  available new-book ids: ${[...byId.keys()].join(", ") || "(none)"}`,
      );
      process.exit(1);
    }

    if (values["all-review"]) {
      for (const r of proposal.books.reviewBooks ?? []) entries.push({ title: r.title, reason });
    }
    console.log(`resolved against ${path}`);
  }

  if (entries.length === 0) {
    console.error("error: pass at least one of --title <title>, --id <id>, or --all-review");
    process.exit(1);
  }

  const before = loadBookIgnore();
  const beforeCount = Object.keys(before.books).length;
  const next = addIgnoredTitles(before, entries);
  const afterCount = Object.keys(next.books).length;

  mkdirSync(dirname(BOOK_IGNORE_PATH), { recursive: true });
  writeFileSync(BOOK_IGNORE_PATH, serializeBookIgnore(next), "utf8");

  console.log(`dismissed ${entries.length} title(s) → ${afterCount - beforeCount} new, ${afterCount} total`);
  for (const e of entries) console.log(`  - ${e.title}`);
  console.log(`wrote ${BOOK_IGNORE_PATH}`);
}

main();
