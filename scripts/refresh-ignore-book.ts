/**
 * Brief 133 follow-up — dismiss a book from the weekly refresh (the "book cutoff").
 * The book analog of `refresh:mark-reviewed`: writes `ingest/refresh/book-ignore.json`
 * so a duplicate / unwanted-format / already-bundled book stops being re-proposed
 * every week. No DB, no network.
 *
 * Targets resolve to a title-slug (`slugify(title)`), the key the weekly diff
 * matches on:
 *   --title "<exact title>"   dismiss by title (no proposal needed)
 *   --id W40K-0600            dismiss a proposed book by its id — new OR pending
 *                             backlog (reads a proposal)
 *   --all-review              dismiss every current title-collision, fresh AND
 *                             previously-seen (reads a proposal)
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
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { parseArgs } from "node:util";

import {
  addIgnoredTitles,
  BOOK_IGNORE_PATH,
  loadBookIgnore,
  serializeBookIgnore,
} from "./refresh/book-ignore";
import { findProposalPath, loadProposal } from "./refresh/proposal-path";

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
    // New AND pending: the standing backlog is the most likely dismiss target.
    // (`?? []` guards: pre-pending-split proposals lack the pending* fields.)
    const proposable = [...(proposal.books.newBooks ?? []), ...(proposal.books.pendingBooks ?? [])];
    const byId = new Map(proposable.map((b) => [b.externalBookId, b]));

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
          `  available new/pending ids: ${[...byId.keys()].join(", ") || "(none)"}`,
      );
      process.exit(1);
    }

    if (values["all-review"]) {
      const collisions = [
        ...(proposal.books.reviewBooks ?? []),
        ...(proposal.books.pendingReviewBooks ?? []),
      ];
      for (const r of collisions) entries.push({ title: r.title, reason });
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
