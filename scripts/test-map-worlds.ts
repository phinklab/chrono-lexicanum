/**
 * Standalone unit test for scripts/map-worlds-core.ts — the PURE core of the
 * map-catalog convert step (Brief 174 + 183). No test framework:
 * node:assert/strict + one line per case, same pattern as
 * scripts/test-book-file.ts. Run via `npm run test:map-worlds`.
 *
 * DB-free by construction (no `--env-file`): the core imports the shared
 * resolver path (`resolveLocations`) + `deriveEpisodeSlug` — both pure. Book
 * fixtures therefore use REAL locations.json names/ids ("Terra", "Mars", …),
 * which also pins the shared resolver semantics the catalog relies on.
 *
 * Covers: grid projection (corners, rounding, aspect, out-of-bounds guard),
 * deterministic id assignment (duplicate names → ordinal suffix, cross-name
 * slug collisions), the case-insensitive location matcher, book edge
 * derivation (resolver + overlay tail), podcast edge derivation (FK-gate,
 * subject>mentioned dedup, frozen episode slugs), work merge order, the
 * curation-Excel parsers (both sheets, all shape guards), the curation merge
 * path (link / pin / rollup incl. every fail-loud guard, `via`, role-conflict
 * dedup, pin-before-rollup order, Welten overrides), the `kind` mapping incl.
 * unknown-fail, coverage numbers, review data, the markdown renderer, the
 * catalog schema validator, and byte-determinism of a double run.
 */
import assert from "node:assert/strict";
import process from "node:process";

import { deriveEpisodeSlug } from "@/lib/ingestion/podcast/apply-plan";
import type { EpisodeArtifact, ShowArtifact } from "@/lib/ingestion/podcast/types";
import { validateMapWorlds, type MapWorldsFile } from "@/lib/map/map-worlds-schema";

import type { BookFileV1 } from "./book-file";
import type { CurationOverlay } from "./curation-overlay";
import {
  CURATION_HEADERS,
  GRID_GX_MAX,
  GRID_GY_MAX,
  KIND_BY_CLASSIFICATION,
  SOURCE_EXTENT,
  WELTEN_HEADERS,
  WELTEN_HEADERS_LEGACY,
  buildCatalog,
  buildLocationMatcher,
  deriveBookEdges,
  derivePodcastEdges,
  mergeWorkEdges,
  parseCurationSheet,
  parseWeltenSheet,
  projectToGrid,
  renderReview,
  type CatalogInputs,
  type CurationRow,
  type CurationWorldRow,
  type ExcelWorldRow,
  type SheetCell,
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
    x: 1000,
    y: 1000,
    segmentum: "Solar",
    ...overrides,
  };
}

function makeCurationRow(
  overrides: Partial<CurationRow> & { sheetRow: number; locationId: string },
): CurationRow {
  return {
    name: overrides.locationId,
    action: null,
    actionRaw: "",
    target: null,
    x: null,
    y: null,
    segmentum: null,
    classification: null,
    note: null,
    ...overrides,
  };
}

function makeInputs(partial: Partial<CatalogInputs>): CatalogInputs {
  return {
    excelRows: [],
    curation: { rows: [], worldRows: [] },
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
// Curation sheet parsers
// =============================================================================

const KURATION_HEADER_ROW: SheetCell[] = [...CURATION_HEADERS];
const WELTEN_HEADER_ROW: SheetCell[] = [...WELTEN_HEADERS];

check("parseCurationSheet: happy path (link, pin, später, empty rows skipped)", () => {
  const rows = parseCurationSheet([
    KURATION_HEADER_ROW,
    ["tau_empire", "T'au Empire", 13, 0, "Link", "tau", null, null, null, null, "Hauptwelt"],
    [null, null, null, null, null, null, null, null, null, null, null],
    ["istvaan_v", "Istvaan V", 6, 0, "pin", null, "490", "155,5", "Ultima", "Unclassified", null],
    ["webway", "Webway", 15, 0, "später", null, null, null, null, null, null],
  ]);
  assert.equal(rows.length, 3);
  assert.deepEqual(rows[0], {
    sheetRow: 2, locationId: "tau_empire", name: "T'au Empire", action: "link", actionRaw: "Link",
    target: "tau", x: null, y: null, segmentum: null, classification: null, note: "Hauptwelt",
  });
  // text-typed numeric cells parse (German decimal comma tolerated)
  assert.equal(rows[1]?.x, 490);
  assert.equal(rows[1]?.y, 155.5);
  assert.equal(rows[2]?.action, null);
  assert.equal(rows[2]?.actionRaw, "später");
});

check("parseCurationSheet: header mismatch throws", () => {
  assert.throws(() => parseCurationSheet([["locationId", "Name", "Werke"]]), /header mismatch/);
});

check("parseCurationSheet: unknown Aktion throws", () => {
  assert.throws(
    () => parseCurationSheet([KURATION_HEADER_ROW, ["x", "X", 1, 0, "merge", null, null, null, null, null, null]]),
    /unknown Aktion "merge"/,
  );
});

check("parseCurationSheet: duplicate locationId throws", () => {
  assert.throws(
    () =>
      parseCurationSheet([
        KURATION_HEADER_ROW,
        ["x", "X", 1, 0, null, null, null, null, null, null, null],
        ["x", "X again", 1, 0, null, null, null, null, null, null, null],
      ]),
    /duplicate locationId "x"/,
  );
});

check("parseCurationSheet: link without Ziel / pin without required fields / pin with Ziel throw", () => {
  assert.throws(
    () => parseCurationSheet([KURATION_HEADER_ROW, ["a", "A", 1, 0, "link", null, null, null, null, null, null]]),
    /requires Ziel/,
  );
  assert.throws(
    () => parseCurationSheet([KURATION_HEADER_ROW, ["b", "B", 1, 0, "pin", null, 10, null, null, null, null]]),
    /requires x AND y/,
  );
  assert.throws(
    () => parseCurationSheet([KURATION_HEADER_ROW, ["c", "C", 1, 0, "pin", null, 10, 10, null, "Unclassified", null]]),
    /requires Segmentum/,
  );
  assert.throws(
    () => parseCurationSheet([KURATION_HEADER_ROW, ["d", "D", 1, 0, "pin", null, 10, 10, "Ultima", null, null]]),
    /requires Klassifikation/,
  );
  assert.throws(
    () => parseCurationSheet([KURATION_HEADER_ROW, ["e", "E", 1, 0, "pin", "terra", 10, 10, "Ultima", "Unclassified", null]]),
    /must not carry Ziel/,
  );
});

check("parseCurationSheet: non-numeric x throws", () => {
  assert.throws(
    () => parseCurationSheet([KURATION_HEADER_ROW, ["a", "A", 1, 0, null, null, "abc", null, null, null, null]]),
    /"abc" is not a number/,
  );
});

check("parseWeltenSheet: happy path ('-'/'null' → force-unmatch, Name-Override opt-in)", () => {
  const rows = parseWeltenSheet([
    WELTEN_HEADER_ROW,
    ["gramarye-2", "-", null, "Dublette entkoppelt"],
    ["commorragh-3", "NULL", null, null],
    ["sarum", "terra", null, null],
    ["moloch", null, "Arthas Moloch", "WP-B1"],
    ["zeta", "terra", "Zeta Prime", null],
  ]);
  assert.deepEqual(rows.map((r) => [r.worldId, r.locationIdOverride, r.nameOverride]), [
    ["gramarye-2", null, null],
    ["commorragh-3", null, null],
    ["sarum", "terra", null],
    ["moloch", undefined, "Arthas Moloch"],
    ["zeta", "terra", "Zeta Prime"],
  ]);
  assert.equal(rows[0]?.note, "Dublette entkoppelt");
  assert.equal(rows[3]?.note, "WP-B1");
});

check("parseWeltenSheet: legacy three-column layout still parses (nameOverride null)", () => {
  const rows = parseWeltenSheet([
    [...WELTEN_HEADERS_LEGACY],
    ["gramarye-2", "-", "Dublette entkoppelt"],
    ["sarum", "terra", null],
  ]);
  assert.deepEqual(
    rows.map((r) => [r.worldId, r.locationIdOverride, r.nameOverride, r.note]),
    [
      ["gramarye-2", null, null, "Dublette entkoppelt"],
      ["sarum", "terra", null, null],
    ],
  );
  // legacy layout has no Name-Override cell → empty override is still an error
  assert.throws(
    () => parseWeltenSheet([[...WELTEN_HEADERS_LEGACY], ["a", null, "kaputt"]]),
    /neither locationId-Override .* nor Name-Override/,
  );
});

check("parseWeltenSheet: duplicate / empty row / header mismatch throw", () => {
  assert.throws(
    () => parseWeltenSheet([WELTEN_HEADER_ROW, ["a", "-", null, null], ["a", "-", null, null]]),
    /duplicate Welt-ID "a"/,
  );
  assert.throws(
    () => parseWeltenSheet([WELTEN_HEADER_ROW, ["a", null, null, "kaputt"]]),
    /neither locationId-Override .* nor Name-Override/,
  );
  assert.throws(() => parseWeltenSheet([["Welt", "Override", "Notiz"]]), /header mismatch/);
});

// =============================================================================
// buildCatalog — ids, duplicates, matching, works, kind
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

check("buildCatalog: worlds sorted by id; classification raw + classification2; kind per § D", () => {
  const { file } = buildCatalog(
    makeInputs({
      excelRows: [
        makeRow({ sourceRow: 2, name: "Zeta", x: X0 + 10, y: Y0 + 10, segmentum: "Ultima", primary: "Forge World", secondary: "Titan World" }),
        makeRow({ sourceRow: 3, name: "Alpha", x: X0 + 20, y: Y0 + 20, primary: "Hive World" }),
        makeRow({ sourceRow: 4, name: "Gate", x: X0 + 30, y: Y0 + 30, primary: "Webway Gate" }),
      ],
    }),
  );
  assert.deepEqual(file.worlds.map((w) => w.id), ["alpha", "gate", "zeta"]);
  const zeta = file.worlds[2]!;
  assert.equal(zeta.classification, "Forge World");
  assert.equal(zeta.classification2, "Titan World");
  assert.equal(zeta.kind, "imperial-military");
  assert.equal(zeta.segmentum, "Ultima");
  assert.equal(zeta.origin, "excel");
  assert.equal(file.worlds[0]?.kind, "imperial");
  assert.equal(file.worlds[0]?.classification2, null);
  assert.equal(file.worlds[1]?.kind, "gate");
});

check("buildCatalog: kind mapping covers all 12 groups; unknown/empty classification throws", () => {
  assert.equal(KIND_BY_CLASSIFICATION.size, 70);
  assert.equal(KIND_BY_CLASSIFICATION.get("Terra"), "imperial");
  assert.equal(KIND_BY_CLASSIFICATION.get("Necron Warship"), "fleet");
  assert.equal(KIND_BY_CLASSIFICATION.get("Warp Storm"), "chaos-warp");
  assert.equal(KIND_BY_CLASSIFICATION.get("Craftworld"), "aeldari");
  assert.equal(KIND_BY_CLASSIFICATION.get("Necron Tomb World"), "necron");
  assert.equal(KIND_BY_CLASSIFICATION.get("T'au Sept"), "xenos");
  assert.equal(KIND_BY_CLASSIFICATION.get("Devoured World"), "dead");
  assert.equal(KIND_BY_CLASSIFICATION.get("Deathwatch Fortress"), "station");
  assert.throws(
    () => buildCatalog(makeInputs({ excelRows: [makeRow({ sourceRow: 2, name: "X", x: X0 + 1, y: Y0 + 1, primary: "Brand New World" })] })),
    /unknown classification "Brand New World"/,
  );
  assert.throws(
    () => buildCatalog(makeInputs({ excelRows: [makeRow({ sourceRow: 2, name: "X", x: X0 + 1, y: Y0 + 1, primary: null })] })),
    /Primary Classification is empty/,
  );
});

// =============================================================================
// buildCatalog — curation: Welten overrides
// =============================================================================

check("welten override: force-unmatch clears works, force-match attaches; review lists it", () => {
  const { file, review } = buildCatalog(
    makeInputs({
      excelRows: [
        makeRow({ sourceRow: 2, name: "Terra", x: X0 + 10, y: Y0 + 10 }),
        makeRow({ sourceRow: 3, name: "Sarum", x: X0 + 20, y: Y0 + 20 }),
      ],
      curation: {
        rows: [],
        worldRows: [
          { sheetRow: 2, worldId: "terra", locationIdOverride: null, nameOverride: null, note: null },
          { sheetRow: 3, worldId: "sarum", locationIdOverride: "terra", nameOverride: null, note: null },
        ],
      },
      matcher: new Map([["terra", "terra"]]),
      locationNames: new Map([["terra", "Terra"]]),
      worksByLocation: new Map([["terra", [{ type: "book", slug: "b", title: "B", role: "primary" }]]]),
    }),
  );
  const terra = file.worlds.find((w) => w.id === "terra");
  const sarum = file.worlds.find((w) => w.id === "sarum");
  assert.equal(terra?.locationId, null);
  assert.deepEqual(terra?.works, []);
  assert.equal(sarum?.locationId, "terra");
  assert.equal(sarum?.works.length, 1);
  assert.deepEqual(review.applied.worldOverrides, [
    { worldId: "terra", locationId: null, nameOverride: null },
    { worldId: "sarum", locationId: "terra", nameOverride: null },
  ]);
});

check("welten override: unknown world id / unknown locationId throw", () => {
  assert.throws(
    () =>
      buildCatalog(
        makeInputs({
          excelRows: [makeRow({ sourceRow: 2, name: "Zeta", x: X0 + 10, y: Y0 + 10 })],
          curation: { rows: [], worldRows: [{ sheetRow: 2, worldId: "nope", locationIdOverride: null, nameOverride: null, note: null }] },
        }),
      ),
    /no catalog world with this id/,
  );
  assert.throws(
    () =>
      buildCatalog(
        makeInputs({
          excelRows: [makeRow({ sourceRow: 2, name: "Zeta", x: X0 + 10, y: Y0 + 10 })],
          curation: { rows: [], worldRows: [{ sheetRow: 2, worldId: "zeta", locationIdOverride: "ghost", nameOverride: null, note: null }] },
        }),
      ),
    /not a locations\.json id/,
  );
});

check("welten override: name-only rename is display-only (id, matching, link targeting unchanged)", () => {
  // Mirrors WP-B1: Excel world "Moloch" IS location arthas_moloch ("Arthas
  // Moloch" — a name the matcher knows). Rename + link must coexist: the
  // rename may not flip the auto-matcher (else the link guard would fire) and
  // may not touch the world id (the link's Ziel).
  const { file, review } = buildCatalog(
    makeInputs({
      excelRows: [makeRow({ sourceRow: 2, name: "Moloch", x: X0 + 10, y: Y0 + 10 })],
      curation: {
        rows: [
          makeCurationRow({
            sheetRow: 2, locationId: "arthas_moloch", name: "Arthas Moloch",
            action: "link", actionRaw: "link", target: "moloch",
          }),
        ],
        worldRows: [
          { sheetRow: 2, worldId: "moloch", locationIdOverride: undefined, nameOverride: "Arthas Moloch", note: null },
        ],
      },
      matcher: new Map([["arthas moloch", "arthas_moloch"]]),
      locationNames: new Map([["arthas_moloch", "Arthas Moloch"]]),
      worksByLocation: new Map([
        ["arthas_moloch", [{ type: "book", slug: "farsight-empire-of-lies", title: "Farsight: Empire of Lies", role: "primary" }]],
      ]),
    }),
  );
  const moloch = file.worlds.find((w) => w.id === "moloch");
  assert.equal(moloch?.name, "Arthas Moloch");
  assert.equal(moloch?.locationId, "arthas_moloch");
  assert.equal(moloch?.works.length, 1);
  assert.deepEqual(review.applied.worldOverrides, [
    { worldId: "moloch", locationId: undefined, nameOverride: "Arthas Moloch" },
  ]);
  assert.deepEqual(review.applied.links.map((l) => l.worldIds), [["moloch"]]);
  assert.equal(review.unplacedLocations.length, 0);
  assert.equal(review.matchedWorlds[0]?.name, "Arthas Moloch");
  const md = renderReview(review);
  assert.ok(md.includes("| Welt-ID | locationId | Name-Override |"));
  assert.ok(md.includes("| `moloch` | (unverändert) | Arthas Moloch |"));
});

check("welten override: locationId-Override + Name-Override combine on one row", () => {
  const { file, review } = buildCatalog(
    makeInputs({
      excelRows: [makeRow({ sourceRow: 2, name: "Sarum", x: X0 + 10, y: Y0 + 10 })],
      curation: {
        rows: [],
        worldRows: [
          { sheetRow: 2, worldId: "sarum", locationIdOverride: "terra", nameOverride: "Sarum Prime", note: null },
        ],
      },
      locationNames: new Map([["terra", "Terra"]]),
      worksByLocation: new Map([["terra", [{ type: "book", slug: "b", title: "B", role: "primary" }]]]),
    }),
  );
  const sarum = file.worlds.find((w) => w.id === "sarum");
  assert.equal(sarum?.name, "Sarum Prime");
  assert.equal(sarum?.locationId, "terra");
  assert.equal(sarum?.works.length, 1);
  assert.deepEqual(review.applied.worldOverrides, [
    { worldId: "sarum", locationId: "terra", nameOverride: "Sarum Prime" },
  ]);
});

// =============================================================================
// buildCatalog — curation: link
// =============================================================================

check("link: sets the target world's locationId + works; covered → not in worklist", () => {
  const { file, review } = buildCatalog(
    makeInputs({
      excelRows: [makeRow({ sourceRow: 2, name: "T'au", x: X0 + 10, y: Y0 + 10 })],
      curation: {
        rows: [makeCurationRow({ sheetRow: 2, locationId: "tau_empire", name: "T'au Empire", action: "link", actionRaw: "link", target: "tau" })],
        worldRows: [],
      },
      locationNames: new Map([["tau_empire", "T'au Empire"]]),
      worksByLocation: new Map([["tau_empire", [{ type: "book", slug: "b", title: "B", role: "primary" }]]]),
    }),
  );
  const tau = file.worlds.find((w) => w.id === "tau");
  assert.equal(tau?.locationId, "tau_empire");
  assert.equal(tau?.works.length, 1);
  assert.equal(tau?.works[0]?.via, undefined); // own-location works carry no via
  assert.deepEqual(review.applied.links, [
    { locationId: "tau_empire", locationName: "T'au Empire", worldIds: ["tau"], works: 1 },
  ]);
  assert.equal(review.unplacedLocations.length, 0);
  assert.deepEqual(review.coverage, { placedWorkEdges: 1, totalWorkEdges: 1 });
});

check("link: applies to ALL same-name duplicate instances (matcher-consistent)", () => {
  const { file } = buildCatalog(
    makeInputs({
      excelRows: [
        makeRow({ sourceRow: 2, name: "Twin", x: X0 + 10, y: Y0 + 10 }),
        makeRow({ sourceRow: 3, name: "Twin", x: X0 + 20, y: Y0 + 20 }),
      ],
      curation: {
        rows: [makeCurationRow({ sheetRow: 2, locationId: "twin_loc", action: "link", actionRaw: "link", target: "twin" })],
        worldRows: [],
      },
      locationNames: new Map([["twin_loc", "Twin"]]),
      worksByLocation: new Map([["twin_loc", [{ type: "book", slug: "b", title: "B", role: "primary" }]]]),
    }),
  );
  assert.deepEqual(
    file.worlds.map((w) => w.locationId),
    ["twin_loc", "twin_loc"],
  );
});

check("link: unknown Ziel / already-matched target / double-forced target throw", () => {
  const base = {
    locationNames: new Map([
      ["loc_a", "Loc A"],
      ["terra", "Terra"],
    ]),
  };
  assert.throws(
    () =>
      buildCatalog(
        makeInputs({
          ...base,
          excelRows: [makeRow({ sourceRow: 2, name: "Zeta", x: X0 + 10, y: Y0 + 10 })],
          curation: {
            rows: [makeCurationRow({ sheetRow: 2, locationId: "loc_a", action: "link", actionRaw: "link", target: "nope" })],
            worldRows: [],
          },
        }),
      ),
    /Ziel "nope" is not a catalog world id/,
  );
  assert.throws(
    () =>
      buildCatalog(
        makeInputs({
          ...base,
          excelRows: [makeRow({ sourceRow: 2, name: "Terra", x: X0 + 10, y: Y0 + 10 })],
          curation: {
            rows: [makeCurationRow({ sheetRow: 2, locationId: "loc_a", action: "link", actionRaw: "link", target: "terra" })],
            worldRows: [],
          },
          matcher: new Map([["terra", "terra"]]),
        }),
      ),
    /already matches location "terra" by name/,
  );
  assert.throws(
    () =>
      buildCatalog(
        makeInputs({
          ...base,
          excelRows: [makeRow({ sourceRow: 2, name: "Zeta", x: X0 + 10, y: Y0 + 10 })],
          curation: {
            rows: [makeCurationRow({ sheetRow: 2, locationId: "loc_a", action: "link", actionRaw: "link", target: "zeta" })],
            worldRows: [{ sheetRow: 2, worldId: "zeta", locationIdOverride: "terra", nameOverride: null, note: null }],
          },
        }),
      ),
    /already carries a forced locationId/,
  );
});

// =============================================================================
// buildCatalog — curation: pin
// =============================================================================

check("pin: creates an origin-override world with kind, locationId, works, projected coords", () => {
  const { file, review } = buildCatalog(
    makeInputs({
      excelRows: [makeRow({ sourceRow: 2, name: "Zeta", x: X0 + 10, y: Y0 + 10 })],
      curation: {
        rows: [
          makeCurationRow({
            sheetRow: 2, locationId: "ulthwe", name: "Ulthwé", action: "pin", actionRaw: "pin",
            x: 1728.32, y: 1991, segmentum: "Obscurus", classification: "Craftworld",
          }),
        ],
        worldRows: [],
      },
      locationNames: new Map([["ulthwe", "Ulthwe"]]),
      worksByLocation: new Map([["ulthwe", [{ type: "book", slug: "path", title: "Path", role: "primary" }]]]),
    }),
  );
  const pin = file.worlds.find((w) => w.id === "ulthwe");
  assert.equal(pin?.origin, "override");
  assert.equal(pin?.name, "Ulthwé");
  assert.equal(pin?.kind, "aeldari");
  assert.equal(pin?.classification, "Craftworld");
  assert.equal(pin?.classification2, null);
  // x/y are SSOT-pixel-space and go through the SAME projection as Excel rows
  const expected = projectToGrid(1728.32, 1991, "t");
  assert.equal(pin?.gx, expected.gx);
  assert.equal(pin?.gy, expected.gy);
  assert.equal(pin?.locationId, "ulthwe");
  assert.equal(pin?.works.length, 1);
  assert.equal(review.applied.pins[0]?.worldId, "ulthwe");
  assert.equal(review.applied.pins[0]?.kind, "aeldari");
  assert.equal(review.totals.addedWorlds, 1);
});

check("pin: Klassifikation 'Region' → kind region (curation-only value)", () => {
  const { file } = buildCatalog(
    makeInputs({
      curation: {
        rows: [
          makeCurationRow({
            sheetRow: 2, locationId: "sabbat", name: "Sabbat Worlds", action: "pin", actionRaw: "pin",
            x: 1127, y: 4134, segmentum: "Pacificus", classification: "Region",
          }),
        ],
        worldRows: [],
      },
      locationNames: new Map([["sabbat", "Sabbat Worlds"]]),
      worksByLocation: new Map([["sabbat", [{ type: "book", slug: "ghosts", title: "Ghosts", role: "primary" }]]]),
    }),
  );
  const pin = file.worlds.find((w) => w.id === "sabbat-worlds");
  assert.equal(pin?.kind, "region");
  assert.equal(pin?.classification, "Region");
});

check("pin: fail-loud guards (id collision, x/y outside source extent, unknown Segmentum, unknown Klassifikation)", () => {
  const locationNames = new Map([["loc_x", "Loc X"]]);
  const pinRow = (over: Partial<CurationRow>): CurationRow =>
    makeCurationRow({
      sheetRow: 2, locationId: "loc_x", name: "New World", action: "pin", actionRaw: "pin",
      x: 100, y: 600, segmentum: "Ultima", classification: "Unclassified", ...over,
    });
  const withPin = (row: CurationRow): CatalogInputs =>
    makeInputs({
      excelRows: [makeRow({ sourceRow: 2, name: "Zeta", x: X0 + 10, y: Y0 + 10 })],
      curation: { rows: [row], worldRows: [] },
      locationNames,
    });
  assert.throws(() => buildCatalog(withPin(pinRow({ name: "Zeta" }))), /pin id "zeta" already exists/);
  assert.throws(() => buildCatalog(withPin(pinRow({ x: SOURCE_EXTENT.maxX + 1 }))), /outside the calibrated source extent/);
  assert.throws(() => buildCatalog(withPin(pinRow({ y: SOURCE_EXTENT.minY - 1 }))), /outside the calibrated source extent/);
  assert.throws(() => buildCatalog(withPin(pinRow({ segmentum: "Ultmia" }))), /unknown Segmentum "Ultmia"/);
  assert.throws(() => buildCatalog(withPin(pinRow({ classification: "Galaxy" }))), /unknown classification "Galaxy"/);
});

check("curation: unknown locationId / action on already matched location throw", () => {
  assert.throws(
    () =>
      buildCatalog(
        makeInputs({
          curation: { rows: [makeCurationRow({ sheetRow: 2, locationId: "ghost" })], worldRows: [] },
        }),
      ),
    /locationId is not a locations\.json id/,
  );
  assert.throws(
    () =>
      buildCatalog(
        makeInputs({
          excelRows: [makeRow({ sourceRow: 2, name: "Terra", x: X0 + 10, y: Y0 + 10 })],
          curation: {
            rows: [
              makeCurationRow({
                sheetRow: 2, locationId: "terra", action: "pin", actionRaw: "pin",
                x: 100, y: 600, segmentum: "Solar", classification: "Terra",
              }),
            ],
            worldRows: [],
          },
          matcher: new Map([["terra", "terra"]]),
          locationNames: new Map([["terra", "Terra"]]),
        }),
      ),
    /on an already matched location/,
  );
});

// =============================================================================
// buildCatalog — curation: rollup
// =============================================================================

check("rollup: appends works with via; dedup keeps stronger role (existing or rolled)", () => {
  const { file, review } = buildCatalog(
    makeInputs({
      excelRows: [makeRow({ sourceRow: 2, name: "Terra", x: X0 + 10, y: Y0 + 10 })],
      curation: {
        rows: [makeCurationRow({ sheetRow: 2, locationId: "imperial_palace", action: "rollup", actionRaw: "rollup", target: "terra" })],
        worldRows: [],
      },
      matcher: new Map([["terra", "terra"]]),
      locationNames: new Map([
        ["terra", "Terra"],
        ["imperial_palace", "Imperial Palace"],
      ]),
      worksByLocation: new Map([
        ["terra", [
          { type: "book", slug: "shared-weak", title: "SW", role: "mentioned" },
          { type: "book", slug: "shared-strong", title: "SS", role: "primary" },
        ]],
        ["imperial_palace", [
          { type: "book", slug: "palace-only", title: "PO", role: "primary" },
          { type: "book", slug: "shared-weak", title: "SW", role: "primary" }, // stronger → wins + via
          { type: "book", slug: "shared-strong", title: "SS", role: "mentioned" }, // weaker → own kept
        ]],
      ]),
    }),
  );
  const terra = file.worlds.find((w) => w.id === "terra");
  assert.equal(terra?.works.length, 3);
  const bySlug = new Map(terra!.works.map((w) => [w.slug, w]));
  assert.deepEqual(bySlug.get("palace-only"), { type: "book", slug: "palace-only", title: "PO", role: "primary", via: "imperial_palace" });
  assert.deepEqual(bySlug.get("shared-weak"), { type: "book", slug: "shared-weak", title: "SW", role: "primary", via: "imperial_palace" });
  assert.deepEqual(bySlug.get("shared-strong"), { type: "book", slug: "shared-strong", title: "SS", role: "primary" });
  // rolled location counts as placed; not in the worklist
  assert.deepEqual(review.applied.rollups, [
    { locationId: "imperial_palace", locationName: "Imperial Palace", worldIds: ["terra"], works: 3 },
  ]);
  assert.equal(review.unplacedLocations.length, 0);
  assert.deepEqual(review.coverage, { placedWorkEdges: 5, totalWorkEdges: 5 });
});

check("rollup: works stay sorted (books before episodes, slug order) after merge", () => {
  const { file } = buildCatalog(
    makeInputs({
      excelRows: [makeRow({ sourceRow: 2, name: "Terra", x: X0 + 10, y: Y0 + 10 })],
      curation: {
        rows: [makeCurationRow({ sheetRow: 2, locationId: "sol", action: "rollup", actionRaw: "rollup", target: "terra" })],
        worldRows: [],
      },
      matcher: new Map([["terra", "terra"]]),
      locationNames: new Map([
        ["terra", "Terra"],
        ["sol", "Sol"],
      ]),
      worksByLocation: new Map([
        ["terra", [{ type: "book", slug: "m-book", title: "M", role: "primary" }]],
        ["sol", [
          { type: "podcast_episode", slug: "a-ep", show: "s", title: "A", role: "subject" },
          { type: "book", slug: "a-book", title: "A", role: "primary" },
        ]],
      ]),
    }),
  );
  const terra = file.worlds.find((w) => w.id === "terra");
  assert.deepEqual(terra?.works.map((w) => w.slug), ["a-book", "m-book", "a-ep"]);
});

check("rollup: onto a pin world from the same sheet (pins run first)", () => {
  const { file } = buildCatalog(
    makeInputs({
      curation: {
        rows: [
          makeCurationRow({ sheetRow: 2, locationId: "helican", action: "rollup", actionRaw: "rollup", target: "gudrun" }),
          makeCurationRow({
            sheetRow: 3, locationId: "gudrun", name: "Gudrun", action: "pin", actionRaw: "pin",
            x: 1738, y: 1344, segmentum: "Obscurus", classification: "Unclassified",
          }),
        ],
        worldRows: [],
      },
      locationNames: new Map([
        ["helican", "Helican Subsector"],
        ["gudrun", "Gudrun"],
      ]),
      worksByLocation: new Map([
        ["helican", [{ type: "book", slug: "hereticus", title: "Hereticus", role: "primary" }]],
        ["gudrun", [{ type: "book", slug: "xenos", title: "Xenos", role: "primary" }]],
      ]),
    }),
  );
  const gudrun = file.worlds.find((w) => w.id === "gudrun");
  assert.equal(gudrun?.origin, "override");
  assert.deepEqual(gudrun?.works.map((w) => [w.slug, w.via]), [["hereticus", "helican"], ["xenos", undefined]]);
});

check("rollup: applies to ALL same-name duplicate target instances", () => {
  const { file } = buildCatalog(
    makeInputs({
      excelRows: [
        makeRow({ sourceRow: 2, name: "Twin", x: X0 + 10, y: Y0 + 10 }),
        makeRow({ sourceRow: 3, name: "Twin", x: X0 + 20, y: Y0 + 20 }),
      ],
      curation: {
        rows: [makeCurationRow({ sheetRow: 2, locationId: "loc_r", action: "rollup", actionRaw: "rollup", target: "twin-2" })],
        worldRows: [],
      },
      locationNames: new Map([["loc_r", "Loc R"]]),
      worksByLocation: new Map([["loc_r", [{ type: "book", slug: "b", title: "B", role: "primary" }]]]),
    }),
  );
  assert.deepEqual(
    file.worlds.map((w) => w.works.map((x) => x.via)),
    [["loc_r"], ["loc_r"]],
  );
});

check("rollup: unknown Ziel / rollup chain throw", () => {
  assert.throws(
    () =>
      buildCatalog(
        makeInputs({
          curation: {
            rows: [makeCurationRow({ sheetRow: 2, locationId: "loc_a", action: "rollup", actionRaw: "rollup", target: "nope" })],
            worldRows: [],
          },
          locationNames: new Map([["loc_a", "Loc A"]]),
        }),
      ),
    /Ziel "nope" is not a catalog world id/,
  );
  // chain: loc_a → world "mid" (matched to loc_mid), while loc_mid itself rolls elsewhere
  assert.throws(
    () =>
      buildCatalog(
        makeInputs({
          excelRows: [
            makeRow({ sourceRow: 2, name: "Mid", x: X0 + 10, y: Y0 + 10 }),
            makeRow({ sourceRow: 3, name: "End", x: X0 + 20, y: Y0 + 20 }),
          ],
          curation: {
            rows: [
              makeCurationRow({ sheetRow: 2, locationId: "loc_a", action: "rollup", actionRaw: "rollup", target: "mid" }),
              makeCurationRow({ sheetRow: 3, locationId: "loc_mid", action: "rollup", actionRaw: "rollup", target: "end" }),
            ],
            worldRows: [],
          },
          matcher: new Map([
            ["mid", "loc_mid"],
            ["end", "loc_end"],
          ]),
          locationNames: new Map([
            ["loc_a", "Loc A"],
            ["loc_mid", "Loc Mid"],
            ["loc_end", "Loc End"],
          ]),
          worksByLocation: new Map([["loc_a", [{ type: "book", slug: "b", title: "B", role: "primary" }]]]),
        }),
      ),
    /Rollup-Kette/,
  );
});

check("rollup: target without own locationId carries via-only works (schema-valid)", () => {
  const { file } = buildCatalog(
    makeInputs({
      excelRows: [makeRow({ sourceRow: 2, name: "Lonely", x: X0 + 10, y: Y0 + 10 })],
      curation: {
        rows: [makeCurationRow({ sheetRow: 2, locationId: "loc_a", action: "rollup", actionRaw: "rollup", target: "lonely" })],
        worldRows: [],
      },
      locationNames: new Map([["loc_a", "Loc A"]]),
      worksByLocation: new Map([["loc_a", [{ type: "book", slug: "b", title: "B", role: "primary" }]]]),
    }),
  );
  const lonely = file.worlds.find((w) => w.id === "lonely");
  assert.equal(lonely?.locationId, null);
  assert.equal(lonely?.works[0]?.via, "loc_a");
  assert.deepEqual(validateMapWorlds(JSON.parse(JSON.stringify(file))), []);
});

// =============================================================================
// Review data + renderer
// =============================================================================

check("review: worklist = open locations only, sorted by work count desc, sheet-membership marked", () => {
  const { review } = buildCatalog(
    makeInputs({
      excelRows: [makeRow({ sourceRow: 2, name: "Terra", x: X0 + 10, y: Y0 + 10 })],
      curation: {
        rows: [makeCurationRow({ sheetRow: 2, locationId: "verghast" })], // open row → in sheet
        worldRows: [],
      },
      matcher: new Map([["terra", "terra"]]),
      locationNames: new Map([
        ["terra", "Terra"],
        ["verghast", "Verghast"],
        ["vraks", "Vraks"],
      ]),
      worksByLocation: new Map([
        ["terra", [{ type: "book", slug: "b1", title: "B1", role: "primary" }]],
        ["verghast", [{ type: "book", slug: "necropolis", title: "Necropolis", role: "primary" }]],
        ["vraks", [
          { type: "book", slug: "siege-1", title: "S1", role: "primary" },
          { type: "podcast_episode", slug: "ep", show: "s", title: "E", role: "subject" },
        ]],
      ]),
    }),
  );
  assert.deepEqual(review.unplacedLocations, [
    { locationId: "vraks", name: "Vraks", books: 1, episodes: 1, inCurationSheet: false },
    { locationId: "verghast", name: "Verghast", books: 1, episodes: 0, inCurationSheet: true },
  ]);
  assert.deepEqual(review.coverage, { placedWorkEdges: 1, totalWorkEdges: 4 });
});

check("renderReview: all six sections, coverage headline, ✚ marker, applied curation", () => {
  const { review } = buildCatalog(
    makeInputs({
      excelRows: [makeRow({ sourceRow: 2, name: "Terra", x: X0 + 10, y: Y0 + 10 })],
      curation: {
        rows: [
          makeCurationRow({ sheetRow: 2, locationId: "imperial_palace", action: "rollup", actionRaw: "rollup", target: "terra" }),
        ],
        worldRows: [],
      },
      matcher: new Map([["terra", "terra"]]),
      locationNames: new Map([
        ["terra", "Terra"],
        ["imperial_palace", "Imperial Palace"],
        ["verghast", "Verghast"],
      ]),
      worksByLocation: new Map([
        ["terra", [{ type: "book", slug: "b1", title: "B1", role: "primary" }]],
        ["imperial_palace", [{ type: "book", slug: "b2", title: "B2", role: "primary" }]],
        ["verghast", [{ type: "book", slug: "necropolis", title: "Necropolis", role: "primary" }]],
      ]),
    }),
  );
  const md = renderReview(review);
  for (const heading of [
    "## 1. Match-Übersicht",
    "## 2. Nachplatzierungs-Worklist",
    "## 3. Angewandte Kuration",
    "## 4. Excel-Namensdubletten",
    "## 5. ID-Kollisionen",
    "## 6. Medien-Ableitung",
  ]) {
    assert.ok(md.includes(heading), `missing section: ${heading}`);
  }
  assert.ok(md.includes("**Abdeckung: 2 von 3 Werk-Kanten (66.7 %) platziert**"));
  assert.ok(md.includes("| `verghast` ✚ |")); // not in curation sheet yet
  assert.ok(md.includes("### Rollups (1)"));
  assert.ok(md.includes("`imperial_palace`"));
});

// =============================================================================
// Schema validator + determinism
// =============================================================================

check("validateMapWorlds: accepts a built catalog, rejects broken kind/via/works rules", () => {
  const { file } = buildCatalog(
    makeInputs({ excelRows: [makeRow({ sourceRow: 2, name: "Terra", x: X0 + 10, y: Y0 + 10 })] }),
  );
  assert.deepEqual(validateMapWorlds(JSON.parse(JSON.stringify(file))), []);
  const broken = JSON.parse(JSON.stringify(file)) as MapWorldsFile;
  (broken.worlds[0] as unknown as { kind: string }).kind = "meta";
  (broken.worlds[0] as unknown as { gx: string }).gx = "not-a-number";
  broken.worlds[0]!.works = [
    { type: "book", slug: "b", title: "B", role: "primary" }, // no via + locationId null
    { type: "book", slug: "c", title: "C", role: "primary", via: "" },
  ];
  const errors = validateMapWorlds(broken);
  assert.ok(errors.some((e) => e.includes("kind")));
  assert.ok(errors.some((e) => e.includes("gx")));
  assert.ok(errors.some((e) => e.includes("can only carry rolled-up works")));
  assert.ok(errors.some((e) => e.includes("via")));
  const noCoverage = JSON.parse(JSON.stringify(file)) as Record<string, unknown>;
  delete noCoverage.coverage;
  assert.ok(validateMapWorlds(noCoverage).some((e) => e.includes("coverage")));
});

check("determinism: identical inputs → byte-identical catalog + review", () => {
  const inputs = (): CatalogInputs =>
    makeInputs({
      excelRows: [
        makeRow({ sourceRow: 2, name: "Terra", x: X0 + 10, y: Y0 + 10 }),
        makeRow({ sourceRow: 3, name: "Terra", x: X0 + 20, y: Y0 + 20 }),
        makeRow({ sourceRow: 4, name: "Alpha", x: X0 + 30, y: Y0 + 30 }),
      ],
      curation: {
        rows: [
          makeCurationRow({ sheetRow: 2, locationId: "sol", action: "rollup", actionRaw: "rollup", target: "terra" }),
          makeCurationRow({
            sheetRow: 3, locationId: "gudrun", name: "Gudrun", action: "pin", actionRaw: "pin",
            x: 1738, y: 1344, segmentum: "Obscurus", classification: "Unclassified",
          }),
        ],
        worldRows: [] as CurationWorldRow[],
      },
      matcher: new Map([["terra", "terra"]]),
      locationNames: new Map([
        ["terra", "Terra"],
        ["sol", "Sol"],
        ["gudrun", "Gudrun"],
      ]),
      worksByLocation: new Map([
        ["terra", [{ type: "book", slug: "b", title: "B", role: "primary" }]],
        ["sol", [{ type: "book", slug: "s", title: "S", role: "primary" }]],
        ["gudrun", [{ type: "book", slug: "g", title: "G", role: "primary" }]],
      ]),
    });
  const a = buildCatalog(inputs());
  const b = buildCatalog(inputs());
  assert.equal(JSON.stringify(a.file), JSON.stringify(b.file));
  assert.equal(renderReview(a.review), renderReview(b.review));
});

// =============================================================================

console.log(`\n[test-map-worlds] ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
