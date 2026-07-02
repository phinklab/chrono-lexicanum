/**
 * Standalone unit test for scripts/map-worlds-core.ts — the PURE core of the
 * map-catalog convert step (Brief 174). No test framework: node:assert/strict
 * + one line per case, same pattern as scripts/test-book-file.ts. Run via
 * `npm run test:map-worlds`.
 *
 * DB-free by construction (no `--env-file`): the core imports the shared
 * resolver path (`resolveLocations`) + `deriveEpisodeSlug` — both pure. Book
 * fixtures therefore use REAL locations.json names/ids ("Terra", "Mars", …),
 * which also pins the shared resolver semantics the catalog relies on.
 *
 * Covers: grid projection (corners, rounding, aspect, out-of-bounds guard),
 * deterministic id assignment (duplicate names → ordinal suffix, cross-name
 * slug collisions), the case-insensitive location matcher (names, aliases,
 * ambiguity + unknown-target guards), book edge derivation (resolver + role
 * normalization + overlay add/remove tail + not-in-corpus skip), podcast edge
 * derivation (FK-gate, subject>mentioned dedup, frozen episode slugs), work
 * merge order, the overrides merge path (patch, forced match/unmatch,
 * addWorlds incl. every fail-loud guard), review data, the markdown renderer,
 * the catalog schema validator, and byte-determinism of a double run.
 */
import assert from "node:assert/strict";
import process from "node:process";

import { deriveEpisodeSlug } from "@/lib/ingestion/podcast/apply-plan";
import type { EpisodeArtifact, ShowArtifact } from "@/lib/ingestion/podcast/types";
import { validateMapWorlds, type MapWorldsFile } from "@/lib/map/map-worlds-schema";

import type { BookFileV1 } from "./book-file";
import type { CurationOverlay } from "./curation-overlay";
import {
  GRID_GX_MAX,
  GRID_GY_MAX,
  SOURCE_EXTENT,
  buildCatalog,
  buildLocationMatcher,
  deriveBookEdges,
  derivePodcastEdges,
  mergeWorkEdges,
  projectToGrid,
  renderReview,
  validateOverridesFile,
  type CatalogInputs,
  type ExcelWorldRow,
  type MapWorldsOverridesFile,
} from "./map-worlds-core";

let pass = 0;
let fail = 0;

function check(name: string, fn: () => void): void {
  try {
    fn();
    pass += 1;
  } catch (err) {
    fail += 1;
    console.error(`✗ ${name}`);
    console.error(`  ${err instanceof Error ? err.message : String(err)}`);
  }
}

// =============================================================================
// Fixtures
// =============================================================================

function makeBook(overrides: Partial<BookFileV1> & { externalBookId: string; slug: string }): BookFileV1 {
  return {
    $schema: "book-v1",
    title: overrides.slug,
    authors: ["Test Author"],
    editors: [],
    authorship: { editorialNote: null },
    releaseYear: 2020,
    format: "novel",
    seriesHint: null,
    series: null,
    seriesIndex: null,
    notes: null,
    source: { kind: "manual", url: null, confidence: null },
    curation: {
      synopsis: null,
      facetIds: [],
      factions: [],
      locations: [],
      characters: [],
    } as unknown as BookFileV1["curation"],
    collections: { collects: [] },
    ...overrides,
  };
}

function makeEpisode(overrides: Partial<EpisodeArtifact> & { guid: string }): EpisodeArtifact {
  return {
    title: overrides.guid,
    pubDate: null,
    durationSec: null,
    audioUrl: null,
    link: null,
    episodeKind: "lore",
    tags: [],
    unresolved: [],
    links: [],
    ...overrides,
  };
}

function makeArtifact(slug: string, episodes: EpisodeArtifact[]): ShowArtifact {
  return {
    $generatedBy: "test",
    show: {
      slug,
      title: slug,
      feedUrl: `https://example.test/${slug}.rss`,
      appleId: null,
      podcastGuid: null,
      imageUrl: null,
      episodeCount: episodes.length,
      links: [],
    },
    extraction: { model: "test", promptVersion: "test" },
    episodes,
  };
}

function makeRow(overrides: Partial<ExcelWorldRow> & { sourceRow: number; name: string }): ExcelWorldRow {
  return {
    primary: "Unclassified",
    secondary: null,
    tertiary: null,
    x: 1000,
    y: 1000,
    segmentum: "Solar",
    ...overrides,
  };
}

const EMPTY_OVERRIDES: MapWorldsOverridesFile = {
  $schema: "map-worlds-overrides-v1",
  addWorlds: [],
  worldOverrides: {},
};

function makeInputs(partial: Partial<CatalogInputs>): CatalogInputs {
  return {
    excelRows: [],
    overrides: EMPTY_OVERRIDES,
    matcher: new Map(),
    locationNames: new Map(),
    worksByLocation: new Map(),
    bookNotes: {
      bookCount: 0,
      booksWithLocationEdges: 0,
      bookEdgeCount: 0,
      overlayLocationAdds: 0,
      overlayLocationRemoves: 0,
      overlayBooksNotInCorpus: [],
    },
    podcastNotes: {
      showCount: 0,
      episodeCount: 0,
      episodesWithLocations: 0,
      episodeEdgeCount: 0,
      droppedMissingRef: 0,
    },
    ...partial,
  };
}

// =============================================================================
// Grid projection
// =============================================================================

check("projectToGrid: min corner → (0, 0)", () => {
  const p = projectToGrid(SOURCE_EXTENT.minX, SOURCE_EXTENT.minY, "t");
  assert.deepEqual(p, { gx: 0, gy: 0 });
});

check("projectToGrid: max corner → (1000, GRID_GY_MAX)", () => {
  const p = projectToGrid(SOURCE_EXTENT.maxX, SOURCE_EXTENT.maxY, "t");
  assert.equal(p.gx, GRID_GX_MAX);
  assert.equal(p.gy, GRID_GY_MAX);
});

check("projectToGrid: aspect ratio preserved (gyMax < gxMax, one scale)", () => {
  assert.ok(GRID_GY_MAX < GRID_GX_MAX);
  const spanRatio = (SOURCE_EXTENT.maxY - SOURCE_EXTENT.minY) / (SOURCE_EXTENT.maxX - SOURCE_EXTENT.minX);
  assert.ok(Math.abs(GRID_GY_MAX - GRID_GX_MAX * spanRatio) < 0.01);
});

check("projectToGrid: rounds to 2 decimals", () => {
  const p = projectToGrid(2567, 1643, "t");
  assert.equal(p.gx, Math.round(p.gx * 100) / 100);
  assert.equal(p.gy, Math.round(p.gy * 100) / 100);
});

check("projectToGrid: out-of-extent coordinate throws (recalibration guard)", () => {
  assert.throws(() => projectToGrid(SOURCE_EXTENT.maxX + 1, 1000, "t"), /outside the calibrated source extent/);
  assert.throws(() => projectToGrid(1000, SOURCE_EXTENT.minY - 1, "t"), /outside the calibrated source extent/);
});

// =============================================================================
// Location matcher
// =============================================================================

check("buildLocationMatcher: case-insensitive over names + alias keys", () => {
  const m = buildLocationMatcher(
    [{ id: "terra", name: "Terra" }],
    { "Throneworld": "terra" },
  );
  assert.equal(m.get("terra"), "terra");
  assert.equal(m.get("throneworld"), "terra");
  assert.equal(m.get("TERRA".toLowerCase()), "terra");
});

check("buildLocationMatcher: ambiguous surface form throws", () => {
  assert.throws(
    () =>
      buildLocationMatcher(
        [
          { id: "terra", name: "Terra" },
          { id: "mars", name: "Mars" },
        ],
        { "terra": "mars" },
      ),
    /maps to both/,
  );
});

check("buildLocationMatcher: alias pointing at unknown id throws", () => {
  assert.throws(
    () => buildLocationMatcher([{ id: "terra", name: "Terra" }], { "Red Planet": "mars" }),
    /unknown location id/,
  );
});

// =============================================================================
// Book edge derivation (real resolver data: Terra/Mars are locations.json rows)
// =============================================================================

check("deriveBookEdges: resolver path resolves names, drops unknowns, normalizes roles", () => {
  const book = makeBook({
    externalBookId: "W40K-9901",
    slug: "test-book-one",
    title: "Test Book One",
  });
  (book.curation as unknown as { locations: Array<{ name: string; role: string }> }).locations = [
    { name: "Terra", role: "primary" },
    { name: "Mars", role: "supporting" }, // normalizes → secondary
    { name: "No Such Place Xyz", role: "primary" }, // unresolved → dropped
  ];
  const { byLocation, notes } = deriveBookEdges([book], null);
  const terra = byLocation.get("terra");
  const mars = byLocation.get("mars");
  assert.equal(terra?.length, 1);
  assert.deepEqual(terra?.[0], { type: "book", slug: "test-book-one", title: "Test Book One", role: "primary" });
  assert.equal(mars?.[0]?.role, "secondary");
  assert.equal(byLocation.size, 2);
  assert.equal(notes.bookEdgeCount, 2);
  assert.equal(notes.booksWithLocationEdges, 1);
});

check("deriveBookEdges: overlay tail removes + adds edges; missing corpus book is noted", () => {
  const book = makeBook({ externalBookId: "W40K-9902", slug: "test-book-two", title: "Test Book Two" });
  (book.curation as unknown as { locations: Array<{ name: string; role: string }> }).locations = [
    { name: "Terra", role: "primary" },
  ];
  const overlay = {
    final: {
      books: [
        {
          externalBookId: "W40K-9902",
          locations: {
            add: [{ id: "mars", role: "mentioned" }],
            remove: [{ id: "terra" }],
          },
        },
        {
          externalBookId: "W40K-9999", // not in corpus → skipped + noted
          locations: { add: [{ id: "terra", role: "primary" }] },
        },
      ],
    },
  } as unknown as CurationOverlay;
  const { byLocation, notes } = deriveBookEdges([book], overlay);
  assert.equal(byLocation.has("terra"), false);
  assert.equal(byLocation.get("mars")?.[0]?.role, "mentioned");
  assert.equal(notes.overlayLocationAdds, 1);
  assert.equal(notes.overlayLocationRemoves, 1);
  assert.deepEqual(notes.overlayBooksNotInCorpus, ["W40K-9999"]);
});

// =============================================================================
// Podcast edge derivation
// =============================================================================

check("derivePodcastEdges: FK-gate, subject>mentioned dedup, frozen episode slug", () => {
  const episode = makeEpisode({
    guid: "guid-1",
    title: "Episode One",
    tags: [
      { type: "location", canonicalId: "terra", rawName: "Terra", role: "mentioned", confidence: 1, matchedVia: "canonical-name" },
      { type: "location", canonicalId: "terra", rawName: "Holy Terra", role: "subject", confidence: 1, matchedVia: "alias" },
      { type: "location", canonicalId: "not_a_location", rawName: "Nope", role: "subject", confidence: 1, matchedVia: "alias" },
      { type: "faction", canonicalId: "imperium", rawName: "Imperium", role: "subject", confidence: 1, matchedVia: "canonical-name" },
    ],
  });
  const { byLocation, notes } = derivePodcastEdges(
    [makeArtifact("test-show", [episode, makeEpisode({ guid: "guid-2" })])],
    new Set(["terra"]),
  );
  const terra = byLocation.get("terra");
  assert.equal(terra?.length, 1);
  assert.deepEqual(terra?.[0], {
    type: "podcast_episode",
    slug: deriveEpisodeSlug("test-show", "guid-1"),
    show: "test-show",
    title: "Episode One",
    role: "subject",
  });
  assert.equal(byLocation.size, 1);
  assert.equal(notes.droppedMissingRef, 1);
  assert.equal(notes.episodeCount, 2);
  assert.equal(notes.episodesWithLocations, 1);
});

check("mergeWorkEdges: books before episodes, each slug-sorted", () => {
  const merged = mergeWorkEdges(
    new Map([["terra", [
      { type: "book", slug: "zeta", title: "Z", role: "primary" },
      { type: "book", slug: "alpha", title: "A", role: "mentioned" },
    ]]]),
    new Map([["terra", [{ type: "podcast_episode", slug: "aaa-ep", show: "s", title: "E", role: "subject" }]]]),
  );
  assert.deepEqual(merged.get("terra")?.map((w) => w.slug), ["alpha", "zeta", "aaa-ep"]);
});

// =============================================================================
// Overrides file validation
// =============================================================================

check("validateOverridesFile: happy path", () => {
  const f = validateOverridesFile({ $schema: "map-worlds-overrides-v1", addWorlds: [], worldOverrides: {} });
  assert.equal(f.addWorlds.length, 0);
});

check("validateOverridesFile: wrong $schema / shapes throw", () => {
  assert.throws(() => validateOverridesFile({ $schema: "nope", addWorlds: [], worldOverrides: {} }), /\$schema/);
  assert.throws(() => validateOverridesFile({ $schema: "map-worlds-overrides-v1", addWorlds: {}, worldOverrides: {} }), /addWorlds/);
  assert.throws(() => validateOverridesFile({ $schema: "map-worlds-overrides-v1", addWorlds: [], worldOverrides: [] }), /worldOverrides/);
});

// =============================================================================
// buildCatalog — ids, duplicates, matching, works
// =============================================================================

const X0 = SOURCE_EXTENT.minX;
const Y0 = SOURCE_EXTENT.minY;

check("buildCatalog: duplicate names keep ALL rows with ordinal suffixes (sheet order)", () => {
  const { file, review } = buildCatalog(
    makeInputs({
      excelRows: [
        makeRow({ sourceRow: 2, name: "Commorragh", x: X0 + 100, y: Y0 + 100 }),
        makeRow({ sourceRow: 3, name: "Commorragh", x: X0 + 200, y: Y0 + 200 }),
        makeRow({ sourceRow: 4, name: "Commorragh", x: X0 + 300, y: Y0 + 300 }),
      ],
    }),
  );
  assert.deepEqual(file.worlds.map((w) => w.id), ["commorragh", "commorragh-2", "commorragh-3"]);
  assert.equal(file.worlds.length, 3);
  assert.equal(review.duplicateNameGroups.length, 1);
  assert.equal(review.duplicateNameGroups[0]?.entries.length, 3);
  assert.equal(review.idCollisions.length, 0);
});

check("buildCatalog: different names on the same base slug → id collision in review", () => {
  const { file, review } = buildCatalog(
    makeInputs({
      excelRows: [
        makeRow({ sourceRow: 2, name: "Foo Bar", x: X0 + 10, y: Y0 + 10 }),
        makeRow({ sourceRow: 3, name: "Foo-Bar", x: X0 + 20, y: Y0 + 20 }),
      ],
    }),
  );
  assert.deepEqual(file.worlds.map((w) => w.id), ["foo-bar", "foo-bar-2"]);
  assert.equal(review.idCollisions.length, 1);
  assert.deepEqual(review.idCollisions[0]?.names, ["Foo Bar", "Foo-Bar"]);
});

check("buildCatalog: case-insensitive match attaches locationId + works; unmatched stays empty", () => {
  const { file } = buildCatalog(
    makeInputs({
      excelRows: [
        makeRow({ sourceRow: 2, name: "TERRA", x: X0 + 10, y: Y0 + 10 }),
        makeRow({ sourceRow: 3, name: "Wilderness", x: X0 + 20, y: Y0 + 20 }),
      ],
      matcher: new Map([["terra", "terra"]]),
      locationNames: new Map([["terra", "Terra"]]),
      worksByLocation: new Map([["terra", [{ type: "book", slug: "b", title: "B", role: "primary" }]]]),
    }),
  );
  const terra = file.worlds.find((w) => w.id === "terra");
  const wild = file.worlds.find((w) => w.id === "wilderness");
  assert.equal(terra?.locationId, "terra");
  assert.equal(terra?.works.length, 1);
  assert.equal(wild?.locationId, null);
  assert.deepEqual(wild?.works, []);
});

check("buildCatalog: worlds sorted by id; classification + segmentum verbatim", () => {
  const { file } = buildCatalog(
    makeInputs({
      excelRows: [
        makeRow({ sourceRow: 2, name: "Zeta", x: X0 + 10, y: Y0 + 10, segmentum: "Ultima", primary: "Forge World", secondary: "Titan World" }),
        makeRow({ sourceRow: 3, name: "Alpha", x: X0 + 20, y: Y0 + 20 }),
      ],
    }),
  );
  assert.deepEqual(file.worlds.map((w) => w.id), ["alpha", "zeta"]);
  const zeta = file.worlds[1]!;
  assert.deepEqual(zeta.classification, { primary: "Forge World", secondary: "Titan World", tertiary: null });
  assert.equal(zeta.segmentum, "Ultima");
  assert.equal(zeta.origin, "excel");
});

// =============================================================================
// buildCatalog — overrides merge path
// =============================================================================

check("overrides: worldOverrides patches coordinates + forces unmatch (works cleared)", () => {
  const { file } = buildCatalog(
    makeInputs({
      excelRows: [makeRow({ sourceRow: 2, name: "Terra", x: X0 + 10, y: Y0 + 10 })],
      overrides: {
        $schema: "map-worlds-overrides-v1",
        addWorlds: [],
        worldOverrides: { terra: { gx: 500, gy: 400.5, locationId: null } },
      },
      matcher: new Map([["terra", "terra"]]),
      locationNames: new Map([["terra", "Terra"]]),
      worksByLocation: new Map([["terra", [{ type: "book", slug: "b", title: "B", role: "primary" }]]]),
    }),
  );
  const terra = file.worlds[0]!;
  assert.equal(terra.gx, 500);
  assert.equal(terra.gy, 400.5);
  assert.equal(terra.locationId, null);
  assert.deepEqual(terra.works, []);
});

check("overrides: worldOverrides can force a specific locationId", () => {
  const { file } = buildCatalog(
    makeInputs({
      excelRows: [makeRow({ sourceRow: 2, name: "Sarum", x: X0 + 10, y: Y0 + 10 })],
      overrides: {
        $schema: "map-worlds-overrides-v1",
        addWorlds: [],
        worldOverrides: { sarum: { locationId: "terra" } },
      },
      locationNames: new Map([["terra", "Terra"]]),
      worksByLocation: new Map([["terra", [{ type: "book", slug: "b", title: "B", role: "primary" }]]]),
    }),
  );
  assert.equal(file.worlds[0]?.locationId, "terra");
  assert.equal(file.worlds[0]?.works.length, 1);
});

check("overrides: addWorlds adds a hand-placed world with auto-match + origin marker", () => {
  const { file, review } = buildCatalog(
    makeInputs({
      excelRows: [makeRow({ sourceRow: 2, name: "Zeta", x: X0 + 10, y: Y0 + 10 })],
      overrides: {
        $schema: "map-worlds-overrides-v1",
        addWorlds: [{ name: "Vervunhive", gx: 123.456, gy: 78.9 }],
        worldOverrides: {},
      },
      matcher: new Map([["vervunhive", "verghast"]]),
      locationNames: new Map([["verghast", "Verghast"]]),
      worksByLocation: new Map([["verghast", [{ type: "book", slug: "necropolis", title: "Necropolis", role: "primary" }]]]),
    }),
  );
  const added = file.worlds.find((w) => w.id === "vervunhive");
  assert.equal(added?.origin, "override");
  assert.equal(added?.gx, 123.46); // rounded to 2 decimals
  assert.equal(added?.locationId, "verghast");
  assert.equal(added?.works.length, 1);
  assert.equal(added?.segmentum, null);
  assert.equal(review.totals.addedWorlds, 1);
});

check("overrides: fail-loud guards (unknown key, null gx stub, id collision, bad ranges, bad locationId)", () => {
  const base = {
    excelRows: [makeRow({ sourceRow: 2, name: "Zeta", x: X0 + 10, y: Y0 + 10 })],
    locationNames: new Map([["terra", "Terra"]]),
  };
  const withOverrides = (o: MapWorldsOverridesFile): CatalogInputs => makeInputs({ ...base, overrides: o });
  assert.throws(
    () => buildCatalog(withOverrides({ $schema: "map-worlds-overrides-v1", addWorlds: [], worldOverrides: { nope: { gx: 1 } } })),
    /no Excel world with this id/,
  );
  assert.throws(
    () => buildCatalog(withOverrides({ $schema: "map-worlds-overrides-v1", addWorlds: [{ name: "New World", gx: null, gy: null }], worldOverrides: {} })),
    /gx\/gy are null/,
  );
  assert.throws(
    () => buildCatalog(withOverrides({ $schema: "map-worlds-overrides-v1", addWorlds: [{ name: "Zeta", gx: 1, gy: 1 }], worldOverrides: {} })),
    /already exists/,
  );
  assert.throws(
    () => buildCatalog(withOverrides({ $schema: "map-worlds-overrides-v1", addWorlds: [{ name: "New World", gx: 1200, gy: 1 }], worldOverrides: {} })),
    /gx must be a number/,
  );
  assert.throws(
    () => buildCatalog(withOverrides({ $schema: "map-worlds-overrides-v1", addWorlds: [{ name: "New World", gx: 1, gy: GRID_GY_MAX + 1 }], worldOverrides: {} })),
    /gy must be a number/,
  );
  assert.throws(
    () => buildCatalog(withOverrides({ $schema: "map-worlds-overrides-v1", addWorlds: [{ name: "New World", gx: 1, gy: 1, locationId: "nope" }], worldOverrides: {} })),
    /not a locations\.json id/,
  );
});

// =============================================================================
// Review data + renderer
// =============================================================================

check("review: unplaced media locations = works minus covered locationIds", () => {
  const { review } = buildCatalog(
    makeInputs({
      excelRows: [makeRow({ sourceRow: 2, name: "Terra", x: X0 + 10, y: Y0 + 10 })],
      matcher: new Map([["terra", "terra"]]),
      locationNames: new Map([
        ["terra", "Terra"],
        ["verghast", "Verghast"],
      ]),
      worksByLocation: new Map([
        ["terra", [{ type: "book", slug: "b1", title: "B1", role: "primary" }]],
        ["verghast", [
          { type: "book", slug: "necropolis", title: "Necropolis", role: "primary" },
          { type: "podcast_episode", slug: "ep", show: "s", title: "E", role: "subject" },
        ]],
      ]),
    }),
  );
  assert.equal(review.totals.matched, 1);
  assert.equal(review.totals.matchedWithWorks, 1);
  assert.deepEqual(review.unplacedLocations, [{ locationId: "verghast", name: "Verghast", books: 1, episodes: 1 }]);
});

check("renderReview: all five sections + copy-paste stub with null coordinates", () => {
  const { review } = buildCatalog(
    makeInputs({
      excelRows: [makeRow({ sourceRow: 2, name: "Terra", x: X0 + 10, y: Y0 + 10 })],
      locationNames: new Map([["verghast", "Verghast"]]),
      worksByLocation: new Map([["verghast", [{ type: "book", slug: "necropolis", title: "Necropolis", role: "primary" }]]]),
    }),
  );
  const md = renderReview(review);
  for (const heading of [
    "## 1. Match-Übersicht",
    "## 2. Nachplatzierungs-Worklist",
    "## 3. Excel-Namensdubletten",
    "## 4. ID-Kollisionen",
    "## 5. Medien-Ableitung",
  ]) {
    assert.ok(md.includes(heading), `missing section: ${heading}`);
  }
  assert.ok(md.includes('"name": "Verghast"'));
  assert.ok(md.includes('"gx": null'));
  assert.ok(md.includes('"locationId": "verghast"'));
});

// =============================================================================
// Schema validator + determinism
// =============================================================================

check("validateMapWorlds: accepts a built catalog, rejects a broken one", () => {
  const { file } = buildCatalog(
    makeInputs({ excelRows: [makeRow({ sourceRow: 2, name: "Terra", x: X0 + 10, y: Y0 + 10 })] }),
  );
  assert.deepEqual(validateMapWorlds(JSON.parse(JSON.stringify(file))), []);
  const broken = JSON.parse(JSON.stringify(file)) as MapWorldsFile;
  (broken.worlds[0] as unknown as { gx: string }).gx = "not-a-number";
  broken.worlds[0]!.works = [{ type: "book", slug: "b", title: "B", role: "primary" }];
  const errors = validateMapWorlds(broken);
  assert.ok(errors.some((e) => e.includes("gx")));
  assert.ok(errors.some((e) => e.includes("works must be empty")));
});

check("determinism: identical inputs → byte-identical catalog + review", () => {
  const inputs = (): CatalogInputs =>
    makeInputs({
      excelRows: [
        makeRow({ sourceRow: 2, name: "Terra", x: X0 + 10, y: Y0 + 10 }),
        makeRow({ sourceRow: 3, name: "Terra", x: X0 + 20, y: Y0 + 20 }),
        makeRow({ sourceRow: 4, name: "Alpha", x: X0 + 30, y: Y0 + 30 }),
      ],
      matcher: new Map([["terra", "terra"]]),
      locationNames: new Map([["terra", "Terra"]]),
      worksByLocation: new Map([["terra", [{ type: "book", slug: "b", title: "B", role: "primary" }]]]),
    });
  const a = buildCatalog(inputs());
  const b = buildCatalog(inputs());
  assert.equal(JSON.stringify(a.file), JSON.stringify(b.file));
  assert.equal(renderReview(a.review), renderReview(b.review));
});

// =============================================================================

console.log(`\n[test-map-worlds] ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
