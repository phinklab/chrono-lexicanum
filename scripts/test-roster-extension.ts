/**
 * Standalone unit test for scripts/roster-extension.ts (the additive book-promotion
 * merge folded into `import:ssot-roster`).
 *
 * No test framework: node:assert/strict + one line per case, same pattern as
 * scripts/test-loop-next-batch.ts. Run via `npm run test:roster-extension`.
 *
 * Drives the PURE parsers only — no FS/DB/network. Covers: a verbatim
 * proposal.json row → RosterBook (synthetic sourceRow, provenance keys dropped),
 * the id/slug collision firewalls (vs Excel AND intra-extension), every field
 * validation, the books-only collections guard, the empty/absent no-op, and a
 * drift guard asserting VALID_BOOK_FORMATS == the live `bookFormat` DB enum.
 */
import assert from "node:assert/strict";
import process from "node:process";

import { bookFormat } from "@/db/schema";

import {
  EXTENSION_SOURCE_ROW,
  VALID_BOOK_FORMATS,
  parseExtensionBook,
  parseExtensionFile,
} from "./roster-extension";

let pass = 0;
let fail = 0;

function check(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`ok - ${name}`);
    pass += 1;
  } catch (e) {
    console.error(`not ok - ${name}`);
    console.error(`  ${e instanceof Error ? e.message : String(e)}`);
    fail += 1;
  }
}

const NO_IDS = new Set<string>();
const NO_SLUGS = new Set<string>();

/** A verbatim refresh `proposal.json` row (incl. provenance keys the merge ignores). */
function proposalRow(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    externalBookId: "W40K-0566",
    slug: "carnage-unending",
    title: "Carnage Unending",
    authors: [],
    editors: [],
    editorialNote: "various",
    releaseYear: 2026,
    format: "anthology",
    seriesHint: "40k - TBC",
    sourceUrl: "https://www.trackofwords.com/keep-track",
    notes: null,
    source_kind: "track_of_words",
    confidence: 0.6,
    ...over,
  };
}

console.log("roster-extension");

// --- happy path -------------------------------------------------------------

check("verbatim proposal row → RosterBook with synthetic sourceRow", () => {
  const { book, issue } = parseExtensionBook(proposalRow(), 0, NO_IDS, NO_SLUGS);
  assert.equal(issue, null);
  assert.ok(book);
  assert.equal(book.externalBookId, "W40K-0566");
  assert.equal(book.slug, "carnage-unending");
  assert.equal(book.title, "Carnage Unending");
  assert.deepEqual(book.authors, []);
  assert.equal(book.editorialNote, "various");
  assert.equal(book.releaseYear, 2026);
  assert.equal(book.format, "anthology");
  assert.equal(book.seriesHint, "40k - TBC");
  assert.equal(book.sourceRow, EXTENSION_SOURCE_ROW);
});

check("provenance keys (source_kind/confidence) are dropped from the RosterBook", () => {
  const { book } = parseExtensionBook(proposalRow(), 0, NO_IDS, NO_SLUGS);
  assert.ok(book);
  assert.equal("source_kind" in book, false);
  assert.equal("confidence" in book, false);
});

check("HH prefix + null releaseYear + solo author are accepted", () => {
  const { book, issue } = parseExtensionBook(
    proposalRow({
      externalBookId: "HH-0295",
      slug: "the-end-and-the-death-iv",
      title: "The End and the Death IV",
      authors: ["Dan Abnett"],
      editorialNote: null,
      releaseYear: null,
      format: "novel",
    }),
    0,
    NO_IDS,
    NO_SLUGS,
  );
  assert.equal(issue, null);
  assert.ok(book);
  assert.equal(book.releaseYear, null);
  assert.deepEqual(book.authors, ["Dan Abnett"]);
});

// --- id / slug firewalls ----------------------------------------------------

check("id collision with an Excel roster id → issue", () => {
  const { book, issue } = parseExtensionBook(
    proposalRow({ externalBookId: "W40K-0565" }),
    0,
    new Set(["W40K-0565"]),
    NO_SLUGS,
  );
  assert.equal(book, null);
  assert.ok(issue);
  assert.match(issue.message, /collides with an existing roster\/extension id/);
});

check("slug collision with an Excel slug → issue", () => {
  const { book, issue } = parseExtensionBook(
    proposalRow({ slug: "prospero-burns" }),
    0,
    NO_IDS,
    new Set(["prospero-burns"]),
  );
  assert.equal(book, null);
  assert.ok(issue);
  assert.match(issue.message, /collides with an existing roster\/extension slug/);
});

check("intra-extension duplicate id → first ok, second is an issue", () => {
  const a = proposalRow({ externalBookId: "W40K-0566", slug: "book-a" });
  const b = proposalRow({ externalBookId: "W40K-0566", slug: "book-b" });
  const { books, issues } = parseExtensionFile({ books: [a, b] }, NO_IDS, NO_SLUGS);
  assert.equal(books.length, 1);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].index, 1);
});

// --- field validation -------------------------------------------------------

check("wrong external-id prefix (AoS) → issue", () => {
  const { issue } = parseExtensionBook(proposalRow({ externalBookId: "AOS-0001" }), 0, NO_IDS, NO_SLUGS);
  assert.ok(issue);
  assert.match(issue.message, /must match W40K-#### or HH-####/);
});

check("non-4-digit external id → issue", () => {
  const { issue } = parseExtensionBook(proposalRow({ externalBookId: "W40K-566" }), 0, NO_IDS, NO_SLUGS);
  assert.ok(issue);
});

check("non-clean slug (spaces) → issue with the expected slugified form", () => {
  const { issue } = parseExtensionBook(proposalRow({ slug: "Carnage Unending" }), 0, NO_IDS, NO_SLUGS);
  assert.ok(issue);
  assert.match(issue.message, /not a clean slug \(expected "carnage-unending"\)/);
});

check("empty title → issue", () => {
  const { issue } = parseExtensionBook(proposalRow({ title: "   " }), 0, NO_IDS, NO_SLUGS);
  assert.ok(issue);
  assert.match(issue.message, /`title` is required/);
});

check("invalid format (not a book_format enum value) → issue", () => {
  const { issue } = parseExtensionBook(proposalRow({ format: "graphic_novel" }), 0, NO_IDS, NO_SLUGS);
  assert.ok(issue);
  assert.match(issue.message, /must be one of/);
});

check("non-integer releaseYear → issue", () => {
  const { issue } = parseExtensionBook(proposalRow({ releaseYear: 2026.5 }), 0, NO_IDS, NO_SLUGS);
  assert.ok(issue);
  assert.match(issue.message, /must be a positive integer or null/);
});

check("invalid editorialNote → issue", () => {
  const { issue } = parseExtensionBook(proposalRow({ editorialNote: "anthology" }), 0, NO_IDS, NO_SLUGS);
  assert.ok(issue);
  assert.match(issue.message, /must be "various" or null/);
});

check("authors with a non-string member → issue", () => {
  const { issue } = parseExtensionBook(proposalRow({ authors: ["OK", 123] }), 0, NO_IDS, NO_SLUGS);
  assert.ok(issue);
  assert.match(issue.message, /`authors`.*array of non-empty strings/);
});

// --- file-level behaviour ---------------------------------------------------

check("empty extension ({books:[]}) → no books, no issues (no-op)", () => {
  const { books, issues } = parseExtensionFile(
    { schemaVersion: "1.0", books: [], collections: [] },
    NO_IDS,
    NO_SLUGS,
  );
  assert.equal(books.length, 0);
  assert.equal(issues.length, 0);
});

check("absent books key → no-op (valid)", () => {
  const { books, issues } = parseExtensionFile({ schemaVersion: "1.0" }, NO_IDS, NO_SLUGS);
  assert.equal(books.length, 0);
  assert.equal(issues.length, 0);
});

check("non-object top-level → file-level issue", () => {
  const { issues } = parseExtensionFile([], NO_IDS, NO_SLUGS);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].index, -1);
});

check("non-empty collections[] → loud-error (books-only contract)", () => {
  const { issues } = parseExtensionFile(
    { books: [], collections: [{ contentExternalId: "x", collectionExternalId: "y" }] },
    NO_IDS,
    NO_SLUGS,
  );
  assert.ok(issues.some((i) => /collections\[\] .* is not supported/.test(i.message)));
});

check("two valid rows both merge, in array order", () => {
  const a = proposalRow({ externalBookId: "W40K-0566", slug: "book-a", title: "Book A" });
  const b = proposalRow({ externalBookId: "W40K-0567", slug: "book-b", title: "Book B" });
  const { books, issues } = parseExtensionFile({ books: [a, b] }, new Set(["W40K-0565"]), NO_SLUGS);
  assert.equal(issues.length, 0);
  assert.deepEqual(
    books.map((x) => x.externalBookId),
    ["W40K-0566", "W40K-0567"],
  );
});

// --- drift guard ------------------------------------------------------------

check("VALID_BOOK_FORMATS matches the live bookFormat DB enum (no drift)", () => {
  assert.deepEqual([...VALID_BOOK_FORMATS].sort(), [...bookFormat.enumValues].sort());
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail > 0 ? 1 : 0;
