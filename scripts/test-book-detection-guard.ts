/**
 * Unit test for the Brief 170 Teil A refresh corpus-awareness guard. Run via
 * `npm run test:book-detection-guard`.
 *
 * The acceptance datapoint (Brief 170): a book promoted via the per-book path
 * (e.g. `W40K-0600` under scripts/seed-data/books/) must NOT be re-proposed as
 * "new" by the weekly refresh, AND the next allocated W40K id must not collide
 * with it. Both consumers — the identity index (`buildRosterIndex`) and the id
 * allocator (`makeIdAllocator`) — read only `roster.books`, so refresh-check
 * feeds them an EFFECTIVE roster (Legacy + the per-book folder projection). This
 * test drives that projection end to end.
 *
 * DB-free: effective-corpus → book-file (no DB client); identity/proposal are
 * detection modules that never import the DB. No `--env-file` needed.
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";

import { slugify } from "@/lib/slug";

import { loadEffectiveCorpusBooks } from "./refresh/effective-corpus";
import { bookIdentityKey, buildRosterIndex, classifyCandidate } from "./refresh/identity";
import { makeIdAllocator } from "./refresh/proposal";

import type { CandidateBook, SeriesPrefix } from "./refresh/types";
import type { RosterBook, RosterFile } from "./seed-data/types";

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

/** A minimal RosterFile whose W40K high-water mark is 0599 (HH 0297). */
function legacyRoster(): RosterFile {
  return {
    schemaVersion: "1.0",
    sourceFile: "Warhammer_Books_SSOT.xlsx",
    books: [
      {
        externalBookId: "W40K-0599",
        slug: "some-prior-book",
        title: "Some Prior Book",
        authors: ["Prior Author"],
        editors: [],
        editorialNote: null,
        releaseYear: 2025,
        format: "novel",
        seriesHint: null,
        sourceUrl: null,
        notes: null,
        sourceRow: 600,
      },
      {
        externalBookId: "HH-0297",
        slug: "some-prior-heresy",
        title: "Some Prior Heresy",
        authors: ["Heresy Author"],
        editors: [],
        editorialNote: null,
        releaseYear: 2025,
        format: "novel",
        seriesHint: "Horus Heresy",
        sourceUrl: null,
        notes: null,
        sourceRow: 601,
      },
    ],
    collections: [],
  };
}

/** Build a refresh CandidateBook from a roster book (as the tracker would re-list it). */
function candidateFor(book: RosterBook): CandidateBook {
  const prefix: SeriesPrefix = book.externalBookId.startsWith("HH") ? "HH" : "W40K";
  return {
    title: book.title,
    authorsRaw: book.authors.join(", "),
    authors: book.authors,
    editorialNote: book.editorialNote,
    releaseYear: book.releaseYear,
    format: book.format,
    seriesHint: book.seriesHint,
    seriesPrefix: prefix,
    titleSlug: slugify(book.title),
    identityKey: bookIdentityKey(book.title, book.authors, book.editorialNote, book.releaseYear),
  };
}

/** Write one valid book-v1 file into a fresh temp dir; return the dir. */
function bookFolder(files: Array<Record<string, unknown>>): string {
  const dir = mkdtempSync(join(tmpdir(), "book-detect-"));
  files.forEach((f, i) => writeFileSync(join(dir, `book-${i}.json`), JSON.stringify(f)));
  return dir;
}

function bookV1(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    $schema: "book-v1",
    externalBookId: "W40K-0600",
    slug: "example-new-release",
    title: "Example New Release",
    authors: ["Author Name"],
    editors: [],
    authorship: { editorialNote: null },
    releaseYear: 2026,
    format: "novel",
    seriesHint: null,
    series: null,
    seriesIndex: null,
    notes: null,
    source: { kind: "manual", url: null, confidence: null },
    curation: {
      synopsis: "A synopsis.",
      facetIds: ["book"],
      factions: [],
      locations: [],
      characters: [],
      flags: [],
    },
    collections: { collects: [] },
    ...over,
  };
}

console.log("book-detection-guard");

// --- additive no-op until the folder is populated ---------------------------

check("loadEffectiveCorpusBooks on a missing folder → [] (detection unchanged)", () => {
  assert.deepEqual(loadEffectiveCorpusBooks(join(tmpdir(), "no-such-books-dir-170")), []);
});

check("loadEffectiveCorpusBooks on an empty folder → []", () => {
  const dir = mkdtempSync(join(tmpdir(), "book-detect-empty-"));
  try {
    assert.deepEqual(loadEffectiveCorpusBooks(dir), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// --- negative control: roster-only is BLIND to a per-book promotion ----------

check("control — without the folder merge, a W40K-0600 promotion re-proposes as 'new'", () => {
  const roster = legacyRoster();
  const folderBook = projectFolder(bookV1()); // W40K-0600 "Example New Release"
  const candidate = candidateFor(folderBook);
  // roster-only index + allocator (the pre-Teil-A behaviour)
  assert.equal(classifyCandidate(candidate, buildRosterIndex(roster)).kind, "new");
  assert.equal(makeIdAllocator(roster).next("W40K"), "W40K-0600");
});

// --- the guard: effective corpus = Legacy + per-book folder -----------------

check("a per-book W40K-0600 is classified 'exact' (never re-proposed) once merged", () => {
  const dir = bookFolder([bookV1()]); // W40K-0600
  try {
    const roster = legacyRoster();
    const folderBooks = loadEffectiveCorpusBooks(dir);
    assert.equal(folderBooks.length, 1);
    const effective: RosterFile = { ...roster, books: [...roster.books, ...folderBooks] };
    const candidate = candidateFor(folderBooks[0]);
    assert.equal(classifyCandidate(candidate, buildRosterIndex(effective)).kind, "exact");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

check("the next W40K id does not collide with the per-book promotion", () => {
  const dir = bookFolder([bookV1()]); // W40K-0600
  try {
    const roster = legacyRoster();
    const effective: RosterFile = { ...roster, books: [...roster.books, ...loadEffectiveCorpusBooks(dir)] };
    assert.equal(makeIdAllocator(effective).next("W40K"), "W40K-0601");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

check("HH allocation is corpus-aware too (independent prefix)", () => {
  const dir = bookFolder([bookV1({ externalBookId: "HH-0298", slug: "a-new-heresy", title: "A New Heresy", seriesHint: "Horus Heresy" })]);
  try {
    const roster = legacyRoster();
    const effective: RosterFile = { ...roster, books: [...roster.books, ...loadEffectiveCorpusBooks(dir)] };
    assert.equal(makeIdAllocator(effective).next("HH"), "HH-0299");
    // and W40K is untouched by an HH promotion
    assert.equal(makeIdAllocator(effective).next("W40K"), "W40K-0600");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

check("multiple per-book files all merge into the effective corpus", () => {
  const dir = bookFolder([
    bookV1({ externalBookId: "W40K-0600", slug: "release-a", title: "Release A" }),
    bookV1({ externalBookId: "W40K-0601", slug: "release-b", title: "Release B" }),
  ]);
  try {
    const roster = legacyRoster();
    const effective: RosterFile = { ...roster, books: [...roster.books, ...loadEffectiveCorpusBooks(dir)] };
    assert.equal(makeIdAllocator(effective).next("W40K"), "W40K-0602");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail > 0 ? 1 : 0;

// --- helper that needs the project fn (declared last to keep the cases tidy) -

/** Project a raw book-v1 object to a RosterBook via the real loader path. */
function projectFolder(raw: Record<string, unknown>): RosterBook {
  const dir = mkdtempSync(join(tmpdir(), "book-detect-proj-"));
  try {
    writeFileSync(join(dir, "x.json"), JSON.stringify(raw));
    const [book] = loadEffectiveCorpusBooks(dir);
    assert.ok(book, "expected the raw book-v1 to project");
    return book;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
