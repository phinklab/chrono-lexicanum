/**
 * Standalone unit test for scripts/book-file.ts — the PURE per-book SSOT loader/
 * validator (Brief 170 Teil A). No test framework: node:assert/strict + one line
 * per case, same pattern as scripts/test-roster-extension.ts. Run via
 * `npm run test:book-file`.
 *
 * DB-free by construction: book-file.ts imports `@/db/schema` (table defs only,
 * no client) + `@/lib/slug`, and only TYPE-imports book-apply-shared (erased at
 * runtime). So this test needs NO `--env-file`/DATABASE_URL.
 *
 * Covers: the `book-v1` validator (happy + every field), the dup-guard
 * (slug/externalBookId intra-folder AND vs the Legacy roster), additive id
 * allocation over Legacy + folder, the collection-edge projection + unresolvable
 * member guard, the RosterBook/OverrideBook/SeriesAnchor projections, the
 * FS-level loader (sorted, fail-soft, missing-dir = empty), and a drift guard
 * asserting VALID_BOOK_FORMATS == the live `bookFormat` DB enum.
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";

import { bookFormat } from "@/db/schema";

import {
  BOOK_FILE_SCHEMA,
  VALID_BOOK_FORMATS,
  collectionEdgesOf,
  effectiveMaxSuffix,
  findCorpusCollisions,
  findUnresolvableCollectMembers,
  loadBookFiles,
  nextEffectiveId,
  projectToOverrideBook,
  projectToRosterBook,
  seriesAnchorOf,
  validateBookFile,
  type BookFileV1,
  type LoadedBookFile,
} from "./book-file";

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

/** A valid `book-v1` object; `over` overrides individual top-level keys. */
function validBook(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    $schema: BOOK_FILE_SCHEMA,
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
      facetIds: ["book", "en"],
      factions: [{ name: "Astra Militarum", role: "primary" }],
      locations: [],
      characters: [],
      flags: [],
    },
    collections: { collects: [] },
    ...over,
  };
}

/** Parse a (presumed-valid) object into a typed BookFileV1, asserting clean. */
function parsed(over: Record<string, unknown> = {}): BookFileV1 {
  const { book, issues } = validateBookFile(validBook(over), "x.json");
  assert.deepEqual(issues, [], `expected clean parse, got: ${issues.join("; ")}`);
  assert.ok(book);
  return book;
}

function loaded(book: Record<string, unknown>, filename = "x.json"): LoadedBookFile {
  return { filename, book: book as unknown as BookFileV1 };
}

console.log("book-file");

// --- validator: happy path --------------------------------------------------

check("a valid book-v1 file parses clean", () => {
  const { book, issues } = validateBookFile(validBook(), "x.json");
  assert.deepEqual(issues, []);
  assert.ok(book);
  assert.equal(book.externalBookId, "W40K-0600");
  assert.equal(book.slug, "example-new-release");
  assert.equal(book.format, "novel");
});

check("HH id + null releaseYear + 'various' editorialNote accepted", () => {
  const { book, issues } = validateBookFile(
    validBook({
      externalBookId: "HH-0298",
      slug: "an-anthology",
      authors: [],
      editors: ["Editor Name"],
      authorship: { editorialNote: "various" },
      releaseYear: null,
      format: "anthology",
    }),
    "x.json",
  );
  assert.deepEqual(issues, []);
  assert.ok(book);
  assert.equal(book.releaseYear, null);
  assert.equal(book.authorship.editorialNote, "various");
});

// --- validator: each field rejects --------------------------------------------

check("wrong $schema → issue", () => {
  const { book, issues } = validateBookFile(validBook({ $schema: "book-v2" }), "x.json");
  assert.equal(book, null);
  assert.ok(issues.some((m) => /\$schema/.test(m)));
});

check("externalBookId not matching ^(W40K|HH)-\\d{4}$ → issue", () => {
  for (const bad of ["W40K-600", "AOS-0001", "w40k-0600", "W40K-06000"]) {
    const { book } = validateBookFile(validBook({ externalBookId: bad }), "x.json");
    assert.equal(book, null, `expected ${bad} to be rejected`);
  }
});

check("unclean slug (slugify(slug) !== slug) → issue", () => {
  const { book, issues } = validateBookFile(validBook({ slug: "Not A Clean Slug" }), "x.json");
  assert.equal(book, null);
  assert.ok(issues.some((m) => /slug must be clean/.test(m)));
});

check("empty title → issue", () => {
  const { book } = validateBookFile(validBook({ title: "" }), "x.json");
  assert.equal(book, null);
});

check("format outside the book_format enum → issue", () => {
  const { book, issues } = validateBookFile(validBook({ format: "graphic_novel" }), "x.json");
  assert.equal(book, null);
  assert.ok(issues.some((m) => /format must be one of/.test(m)));
});

check("authors not a string[] → issue", () => {
  const { book } = validateBookFile(validBook({ authors: [1, 2] }), "x.json");
  assert.equal(book, null);
});

check("curation.synopsis empty → issue", () => {
  const { book } = validateBookFile(
    validBook({ curation: { synopsis: "", facetIds: [], factions: [], locations: [], characters: [], flags: [] } }),
    "x.json",
  );
  assert.equal(book, null);
});

check("curation.factions entry missing role → issue", () => {
  const { book } = validateBookFile(
    validBook({
      curation: { synopsis: "s", facetIds: [], factions: [{ name: "x" }], locations: [], characters: [], flags: [] },
    }),
    "x.json",
  );
  assert.equal(book, null);
});

check("collects member referencing the collection itself → issue", () => {
  const { book, issues } = validateBookFile(
    validBook({ collections: { collects: [{ externalBookId: "W40K-0600" }] } }),
    "x.json",
  );
  assert.equal(book, null);
  assert.ok(issues.some((m) => /references the collection itself/.test(m)));
});

check("collects member with a malformed id → issue", () => {
  const { book } = validateBookFile(
    validBook({ collections: { collects: [{ externalBookId: "nope" }] } }),
    "x.json",
  );
  assert.equal(book, null);
});

check("issues are prefixed with the externalBookId for locatability", () => {
  const { issues } = validateBookFile(validBook({ title: "" }), "x.json");
  assert.ok(issues.every((m) => m.startsWith("W40K-0600: ")));
});

// --- dup-guard (effective corpus = Legacy roster + folder) ------------------

check("folder book colliding with a Legacy roster externalBookId → hard issue", () => {
  const issues = findCorpusCollisions([loaded(validBook())], [
    { externalBookId: "W40K-0600", slug: "something-else" },
  ]);
  assert.ok(issues.some((m) => /collides with a Legacy roster book of the same externalBookId/.test(m)));
});

check("folder book colliding with a Legacy roster slug → hard issue", () => {
  const issues = findCorpusCollisions([loaded(validBook())], [
    { externalBookId: "W40K-0001", slug: "example-new-release" },
  ]);
  assert.ok(issues.some((m) => /collides with a Legacy roster book of the same slug/.test(m)));
});

check("two folder files sharing an externalBookId → intra-folder issue", () => {
  const issues = findCorpusCollisions(
    [loaded(validBook(), "a.json"), loaded(validBook({ slug: "other-slug" }), "b.json")],
    [],
  );
  assert.ok(issues.some((m) => /externalBookId W40K-0600 duplicated/.test(m)));
});

check("two folder files sharing a slug → intra-folder issue", () => {
  const issues = findCorpusCollisions(
    [loaded(validBook(), "a.json"), loaded(validBook({ externalBookId: "W40K-0601" }), "b.json")],
    [],
  );
  assert.ok(issues.some((m) => /slug example-new-release duplicated/.test(m)));
});

check("a clean additive folder vs roster → no collisions", () => {
  const issues = findCorpusCollisions([loaded(validBook())], [
    { externalBookId: "W40K-0599", slug: "a-prior-book" },
  ]);
  assert.deepEqual(issues, []);
});

// --- additive id allocation -------------------------------------------------

check("nextEffectiveId seeds from the Legacy max when the folder is empty", () => {
  assert.equal(nextEffectiveId("W40K", [{ externalBookId: "W40K-0599", slug: "x" }], []), "W40K-0600");
});

check("nextEffectiveId advances past a folder book (additive, not folder-only)", () => {
  const folder = [loaded(validBook())]; // W40K-0600
  assert.equal(nextEffectiveId("W40K", [{ externalBookId: "W40K-0599", slug: "x" }], folder), "W40K-0601");
});

check("HH and W40K prefixes are allocated independently", () => {
  const roster = [
    { externalBookId: "W40K-0599", slug: "a" },
    { externalBookId: "HH-0297", slug: "b" },
  ];
  assert.equal(nextEffectiveId("HH", roster, []), "HH-0298");
  assert.equal(nextEffectiveId("W40K", roster, []), "W40K-0600");
});

check("empty corpus → first id per prefix", () => {
  assert.equal(nextEffectiveId("W40K", [], []), "W40K-0001");
  assert.equal(nextEffectiveId("HH", [], []), "HH-0001");
});

check("effectiveMaxSuffix takes the max across roster AND folder", () => {
  const max = effectiveMaxSuffix(
    [{ externalBookId: "W40K-0598", slug: "a" }],
    [loaded(validBook({ externalBookId: "W40K-0600" }))],
  );
  assert.equal(max.get("W40K"), 600);
  assert.equal(max.get("HH"), 0);
});

// --- collection edges + member resolvability --------------------------------

check("collectionEdgesOf projects collects[] with the file as owner + index default", () => {
  const collection = parsed({
    externalBookId: "W40K-0700",
    slug: "an-omnibus",
    collections: {
      collects: [
        { externalBookId: "W40K-0601" },
        { externalBookId: "W40K-0602", displayOrder: 5, confidence: 0.9, basis: "explicit" },
      ],
    },
  });
  const edges = collectionEdgesOf([collection]);
  assert.equal(edges.length, 2);
  assert.equal(edges[0].collectionExternalId, "W40K-0700");
  assert.equal(edges[0].contentExternalId, "W40K-0601");
  assert.equal(edges[0].displayOrder, 0); // defaulted to array index
  assert.equal(edges[1].displayOrder, 5); // explicit wins
  assert.equal(edges[1].confidence, 0.9);
  assert.equal(edges[1].basis, "explicit");
});

check("a plain (non-collection) book yields no edges", () => {
  assert.deepEqual(collectionEdgesOf([parsed()]), []);
});

check("findUnresolvableCollectMembers flags a member absent from the effective corpus", () => {
  const collection = loaded(
    validBook({ externalBookId: "W40K-0700", slug: "omni", collections: { collects: [{ externalBookId: "W40K-9999" }] } }),
  );
  const known = new Set(["W40K-0700", "W40K-0601"]);
  const issues = findUnresolvableCollectMembers([collection], known);
  assert.equal(issues.length, 1);
  assert.ok(/collects unknown member W40K-9999/.test(issues[0]));
});

check("findUnresolvableCollectMembers passes when every member resolves", () => {
  const collection = loaded(
    validBook({ externalBookId: "W40K-0700", slug: "omni", collections: { collects: [{ externalBookId: "W40K-0601" }] } }),
  );
  assert.deepEqual(findUnresolvableCollectMembers([collection], new Set(["W40K-0601"])), []);
});

// --- projections ------------------------------------------------------------

check("projectToRosterBook carries hard fields verbatim + synthetic sourceRow 0", () => {
  const rb = projectToRosterBook(parsed({ notes: "free note", authors: ["A", "B"], editors: ["E"] }));
  assert.equal(rb.externalBookId, "W40K-0600");
  assert.equal(rb.slug, "example-new-release");
  assert.equal(rb.title, "Example New Release");
  assert.deepEqual(rb.authors, ["A", "B"]);
  assert.deepEqual(rb.editors, ["E"]);
  assert.equal(rb.notes, "free note");
  assert.equal(rb.sourceRow, 0);
});

check("projectToOverrideBook hands the raw curation through verbatim", () => {
  const ob = projectToOverrideBook(parsed());
  assert.equal(ob.externalBookId, "W40K-0600");
  assert.equal(ob.overrides.synopsis, "A synopsis.");
  assert.deepEqual(ob.overrides.facetIds, ["book", "en"]);
  assert.deepEqual(ob.overrides.factions, [{ name: "Astra Militarum", role: "primary" }]);
});

check("seriesAnchorOf is null without a series, {id,index} with one", () => {
  assert.equal(seriesAnchorOf(parsed({ series: null, seriesIndex: null })), null);
  assert.deepEqual(seriesAnchorOf(parsed({ series: "eisenhorn", seriesIndex: 1 })), {
    id: "eisenhorn",
    index: 1,
  });
});

// --- FS-level loader (sorted, fail-soft, missing dir) -----------------------

check("loadBookFiles reads + validates a folder, sorted by filename", () => {
  const dir = mkdtempSync(join(tmpdir(), "book-v1-load-"));
  try {
    writeFileSync(join(dir, "b.json"), JSON.stringify(validBook({ externalBookId: "W40K-0602", slug: "book-b" })));
    writeFileSync(join(dir, "a.json"), JSON.stringify(validBook({ externalBookId: "W40K-0601", slug: "book-a" })));
    const { books, issues } = loadBookFiles(dir);
    assert.deepEqual(issues, []);
    assert.deepEqual(books.map((b) => b.filename), ["a.json", "b.json"]);
    assert.deepEqual(books.map((b) => b.book.slug), ["book-a", "book-b"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

check("loadBookFiles is fail-soft: an invalid file becomes an issue, valid ones still load", () => {
  const dir = mkdtempSync(join(tmpdir(), "book-v1-soft-"));
  try {
    writeFileSync(join(dir, "good.json"), JSON.stringify(validBook()));
    writeFileSync(join(dir, "bad.json"), JSON.stringify(validBook({ externalBookId: "BAD", slug: "bad" })));
    const { books, issues } = loadBookFiles(dir);
    assert.equal(books.length, 1);
    assert.equal(books[0].book.slug, "example-new-release");
    assert.ok(issues.length >= 1);
    assert.ok(issues.some((i) => i.filename === "bad.json"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

check("a missing books/ folder loads as empty (additive: missing = no-op)", () => {
  const { books, issues } = loadBookFiles(join(tmpdir(), "definitely-not-a-real-dir-170"));
  assert.deepEqual(books, []);
  assert.deepEqual(issues, []);
});

// --- drift guard ------------------------------------------------------------

check("VALID_BOOK_FORMATS matches the live bookFormat DB enum (no drift)", () => {
  assert.deepEqual([...VALID_BOOK_FORMATS].sort(), [...bookFormat.enumValues].sort());
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail > 0 ? 1 : 0;
