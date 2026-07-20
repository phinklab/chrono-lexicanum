/**
 * test-archive-browse.ts — Launch S6. DB-free proof of the archive's
 * server-side pagination contract and the browse cache wire shape.
 *
 *  - Pagination is a pure SLICE: filtering/sorting/counts always run over the
 *    full catalogue; `paginateWorks` only cuts the rendered rows. Out-of-range
 *    deep links clamp (stale bookmarks land on the last page), register
 *    numbering stays continuous across pages.
 *  - The persistent Data-Cache entry stores the normalized `BrowseWire` shape
 *    (`src/app/archive/browse-wire.ts`), which must (a) round-trip losslessly
 *    back to `BrowseData` and (b) stay under Next's 2 MB per-entry limit WITH
 *    safety margin. Both are checked against the committed snapshot artifact —
 *    the real catalogue, no live DB — so catalogue growth that erodes the
 *    margin fails CI before it fails production.
 *
 *   npm test  (auto-discovered)  ·  npx tsx scripts/test-archive-browse.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  applyWorksFilters,
  buildFacetPanel,
  facetHitCounts,
  paginateWorks,
  pagerItems,
  parseWorksParams,
  WORKS_PAGE_SIZE,
} from "../src/app/archive/filters";
import type { BrowseBook, BrowseData, BrowseFacet } from "../src/app/archive/loader";
import { compactBrowse, inflateBrowse } from "../src/app/archive/browse-wire";
import { DATA_ARTIFACTS, SNAPSHOT_DIR } from "./snapshot-shared";

/** The wire entry must clear Next's 2 MB Data-Cache cap with real margin —
 *  at ~0.5 MB today this trips only after the catalogue roughly triples. */
const WIRE_SIZE_BUDGET_BYTES = 1.5 * 1024 * 1024;

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
  } catch (err) {
    failed += 1;
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`x ${name}\n  ${msg}`);
  }
}

function stubBook(n: number): BrowseBook {
  return {
    id: `id-${n}`,
    slug: `book-${n}`,
    title: `Book ${String(n).padStart(4, "0")}`,
    releaseYear: 2000 + (n % 20),
    format: "novel",
    eraName: null,
    seriesName: null,
    authors: [],
    factions: [],
    facets: [],
  };
}

// --- page param parsing ------------------------------------------------------

test("page param: absent, junk, zero and negatives normalise to 1", () => {
  assert.equal(parseWorksParams({}).page, 1);
  assert.equal(parseWorksParams({ page: "abc" }).page, 1);
  assert.equal(parseWorksParams({ page: "0" }).page, 1);
  assert.equal(parseWorksParams({ page: "-3" }).page, 1);
  assert.equal(parseWorksParams({ page: "2.5" }).page, 1);
  assert.equal(parseWorksParams({ page: ["4", "9"] }).page, 4);
});

test("page param: plain integers parse", () => {
  assert.equal(parseWorksParams({ page: "12" }).page, 12);
});

// --- paginateWorks -----------------------------------------------------------

const CATALOGUE = Array.from({ length: WORKS_PAGE_SIZE * 3 + 7 }, (_, i) =>
  stubBook(i + 1),
);

test("pagination is a pure slice with continuous register numbering", () => {
  const p1 = paginateWorks(CATALOGUE, 1);
  const p2 = paginateWorks(CATALOGUE, 2);
  assert.equal(p1.totalPages, 4);
  assert.equal(p1.items.length, WORKS_PAGE_SIZE);
  assert.equal(p1.offset, 0);
  assert.equal(p2.offset, WORKS_PAGE_SIZE);
  // No row lost or duplicated at the seam.
  assert.equal(p1.items[WORKS_PAGE_SIZE - 1].id, `id-${WORKS_PAGE_SIZE}`);
  assert.equal(p2.items[0].id, `id-${WORKS_PAGE_SIZE + 1}`);
});

test("the last page carries the remainder", () => {
  const last = paginateWorks(CATALOGUE, 4);
  assert.equal(last.items.length, 7);
  assert.equal(last.offset, WORKS_PAGE_SIZE * 3);
});

test("out-of-range pages clamp instead of rendering an empty register", () => {
  assert.equal(paginateWorks(CATALOGUE, 99).page, 4);
  assert.equal(paginateWorks(CATALOGUE, 99).items.length, 7);
  assert.equal(paginateWorks(CATALOGUE, -5).page, 1);
});

test("an empty filter result is one empty page, not a crash", () => {
  const empty = paginateWorks([], 3);
  assert.equal(empty.page, 1);
  assert.equal(empty.totalPages, 1);
  assert.deepEqual(empty.items, []);
});

test("a sub-page catalogue never paginates", () => {
  const small = paginateWorks(CATALOGUE.slice(0, 12), 1);
  assert.equal(small.totalPages, 1);
  assert.equal(small.items.length, 12);
});

// --- multi-facet contract (WA-B1) -------------------------------------------

function facet(id: string, categoryId: string): BrowseFacet {
  return { id, name: id, categoryId, categoryName: categoryId };
}

function facetBook(n: number, facets: BrowseFacet[]): BrowseBook {
  return { ...stubBook(n), facets };
}

// tone: grimdark/hopepunk/satirical · plot_type: war_story/mystery
const FACET_BOOKS: BrowseBook[] = [
  facetBook(1, [facet("grimdark", "tone"), facet("war_story", "plot_type")]),
  facetBook(2, [facet("grimdark", "tone"), facet("mystery", "plot_type")]),
  facetBook(3, [facet("hopepunk", "tone"), facet("war_story", "plot_type")]),
  facetBook(4, [facet("satirical", "tone")]),
];

function facetParams(facet: string | string[]) {
  return parseWorksParams({ facet });
}

test("facet param: single, repeated, deduped and pattern-validated", () => {
  assert.deepEqual(parseWorksParams({}).facets, []);
  // Every pre-WA-B1 single-facet link keeps working unchanged.
  assert.deepEqual(facetParams("grimdark").facets, ["grimdark"]);
  assert.deepEqual(
    facetParams(["grimdark", "war_story", "grimdark", "NOT AN ID!"]).facets,
    ["grimdark", "war_story"],
  );
});

test("facet semantics: OR within a category, AND across categories", () => {
  const ids = (p: ReturnType<typeof facetParams>) =>
    applyWorksFilters(FACET_BOOKS, p).map((b) => b.id);
  assert.deepEqual(ids(facetParams("grimdark")), ["id-1", "id-2"]);
  // Two tones widen (OR)…
  assert.deepEqual(ids(facetParams(["grimdark", "hopepunk"])), ["id-1", "id-2", "id-3"]);
  // …a tone plus a plot type narrows (AND).
  assert.deepEqual(ids(facetParams(["grimdark", "war_story"])), ["id-1"]);
  assert.deepEqual(ids(facetParams(["hopepunk", "mystery"])), []);
  // A pattern-valid id no book carries filters to zero, like it always did.
  assert.deepEqual(ids(facetParams("no_such_facet")), []);
});

test("facet hit counts ignore the chip's own category selection", () => {
  const counts = facetHitCounts(FACET_BOOKS, facetParams("grimdark"));
  // Tone chips stay counted over the un-throttled catalogue (OR group)…
  assert.equal(counts.get("grimdark"), 2);
  assert.equal(counts.get("hopepunk"), 1);
  assert.equal(counts.get("satirical"), 1);
  // …plot chips answer "under the tone selection".
  assert.equal(counts.get("war_story"), 1);
  assert.equal(counts.get("mystery"), 1);
});

test("facet hit counts mark cross-category dead ends with 0", () => {
  const counts = facetHitCounts(FACET_BOOKS, facetParams(["grimdark", "war_story"]));
  assert.equal(counts.get("grimdark"), 1);
  assert.equal(counts.get("hopepunk"), 1);
  assert.equal(counts.get("satirical") ?? 0, 0); // dead end → dimmed chip
  assert.equal(counts.get("war_story"), 1);
  assert.equal(counts.get("mystery"), 1);
});

test("facet panel: v1 categories only, curated exclusions, active flagged", () => {
  const panel = buildFacetPanel(
    [...FACET_BOOKS, facetBook(5, [facet("en", "language")])],
    facetParams("grimdark"),
  );
  // `language` is not a panel category — reachable via search, not via chips.
  assert.deepEqual(panel.map((g) => g.id), ["tone", "plot_type"]);
  const tone = panel[0];
  // hopepunk + satirical are curated OUT of the offered chips (review round 2)
  // while remaining valid filter ids.
  assert.deepEqual(tone.options.map((o) => o.id), ["grimdark"]);
  assert.deepEqual(tone.options.map((o) => o.active), [true]);
  assert.deepEqual(
    applyWorksFilters(FACET_BOOKS, facetParams("satirical")).map((b) => b.id),
    ["id-4"],
  );
});

// --- sort directions (WA-B1 review round 2) ---------------------------------

test("sort param: all four keys parse, junk falls back to title", () => {
  assert.equal(parseWorksParams({}).sort, "title");
  assert.equal(parseWorksParams({ sort: "release" }).sort, "release");
  assert.equal(parseWorksParams({ sort: "release_asc" }).sort, "release_asc");
  assert.equal(parseWorksParams({ sort: "title_desc" }).sort, "title_desc");
  assert.equal(parseWorksParams({ sort: "sideways" }).sort, "title");
});

test("second-click sort directions invert, unknown years stay last", () => {
  const years: Array<number | null> = [2010, null, 1999, 2020];
  const books = years.map((y, i) => ({ ...stubBook(i + 1), releaseYear: y }));
  const titles = (sort: string) =>
    applyWorksFilters(books, parseWorksParams({ sort })).map((b) => b.releaseYear);
  assert.deepEqual(titles("release"), [2020, 2010, 1999, null]);
  assert.deepEqual(titles("release_asc"), [1999, 2010, 2020, null]);
  const az = applyWorksFilters(books, parseWorksParams({})).map((b) => b.title);
  const za = applyWorksFilters(books, parseWorksParams({ sort: "title_desc" })).map(
    (b) => b.title,
  );
  assert.deepEqual(za, [...az].reverse());
});

// --- pagerItems --------------------------------------------------------------

test("pager lists every page up to 7, windows with gaps beyond", () => {
  assert.deepEqual(pagerItems(2, 5), [1, 2, 3, 4, 5]);
  assert.deepEqual(pagerItems(1, 12), [1, 2, null, 12]);
  assert.deepEqual(pagerItems(6, 12), [1, null, 5, 6, 7, null, 12]);
  assert.deepEqual(pagerItems(12, 12), [1, null, 11, 12]);
});

// --- browse wire (compact ⇄ inflate) against the committed catalogue ---------

const artifact = JSON.parse(
  readFileSync(
    path.join(process.cwd(), SNAPSHOT_DIR, DATA_ARTIFACTS.browseBooks),
    "utf8",
  ),
  // The committed artifact may still carry pre-S6 dead fields until the next
  // content release regenerates it; compactBrowse picks fields explicitly, so
  // they must simply be ignored.
) as BrowseData;

test("wire round-trip is lossless over the real catalogue", () => {
  const inflated = inflateBrowse(compactBrowse(artifact));
  assert.equal(inflated.books.length, artifact.books.length);
  assert.deepEqual(inflated.eras, artifact.eras);
  const slim = artifact.books.map(
    (b): BrowseBook => ({
      id: b.id,
      slug: b.slug,
      title: b.title,
      releaseYear: b.releaseYear,
      format: b.format,
      eraName: b.eraName,
      seriesName: b.seriesName,
      authors: b.authors,
      factions: b.factions,
      facets: b.facets,
    }),
  );
  assert.deepEqual(inflated.books, slim);
});

test(`wire entry stays under the size budget (${WIRE_SIZE_BUDGET_BYTES / 1024 / 1024} MB of the 2 MB cap)`, () => {
  const bytes = Buffer.byteLength(JSON.stringify(compactBrowse(artifact)), "utf8");
  assert.ok(
    bytes < WIRE_SIZE_BUDGET_BYTES,
    `browse wire entry is ${(bytes / 1048576).toFixed(2)} MB — approaching Next's 2 MB ` +
      `Data-Cache cap; shrink the wire shape (browse-wire.ts) before it hits the limit`,
  );
});

test("inflate is fail-loud on a corrupt wire entry (unknown reference id)", () => {
  const wire = compactBrowse(artifact);
  const broken = {
    ...wire,
    books: [{ ...wire.books[0], facets: ["no-such-facet-id"] }],
  };
  assert.throws(() => inflateBrowse(broken), /unknown facet id/);
});

console.log(`\narchive-browse: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
