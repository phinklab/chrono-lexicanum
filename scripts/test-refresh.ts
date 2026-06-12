/**
 * Brief 133 / Board 122-B10 — weekly content-refresh unit tests.
 *
 * DB-free, network-free, deterministic. Every upstream IO (the tracker CSV fetch,
 * the podcast feeds) is dependency-injected with a fixture, so the whole detection
 * path runs offline. Mirrors the repo's `tsx scripts/test-*.ts` convention
 * (node:assert + a pass/fail counter, non-zero exit on failure).
 *
 *   npm run test:refresh
 */
import assert from "node:assert/strict";

import { isTitleExcluded, parseRegistry, type PodcastShowConfig } from "@/lib/ingestion/podcast/registry";
import { slugify } from "@/lib/slug";

import {
  detectMissingBooks,
  extractSheetUrl,
  isInScopeSetting,
  mapFormat,
  parseCsv,
  parseTrackerCsv,
  toCsvExportUrl,
  type TrackOfWordsConfig,
} from "./refresh/book-source";
import {
  addIgnoredTitles,
  emptyBookIgnore,
  ignoredSlugSet,
  isBookIgnored,
  parseBookIgnore,
  serializeBookIgnore,
} from "./refresh/book-ignore";
import {
  emptyBookSeen,
  markSeenTitles,
  parseBookSeen,
  seenSlugSet,
  serializeBookSeen,
} from "./refresh/book-seen";
import { loadRefreshSources, parseRefreshSources } from "./refresh/config";
import {
  emptyCurationState,
  floorIsoForShow,
  markReviewed,
  parseCurationState,
  serializeCurationState,
} from "./refresh/curation-state";
import { buildReportMarkdown, isoWeekOf, proposalHasFindings, serializeProposal } from "./refresh/emit";
import { authorKey, bookIdentityKey, buildRosterIndex, classifyCandidate } from "./refresh/identity";
import { diffPodcasts, type PodcastDiffDeps } from "./refresh/podcast-diff";
import { makeIdAllocator } from "./refresh/proposal";

import type { PodcastEpisode } from "@/lib/ingestion/podcast/types";
import type { CandidateBook, RefreshProposal } from "./refresh/types";
import type { BookFormat, RosterBook, RosterFile } from "./seed-data/types";

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn();
    passed += 1;
  } catch (err) {
    failed += 1;
    console.error(`✗ ${name}\n  ${err instanceof Error ? (err.stack ?? err.message) : String(err)}`);
  }
}

// --- fixtures ----------------------------------------------------------------

function rb(p: Partial<RosterBook> & { externalBookId: string; title: string }): RosterBook {
  return {
    externalBookId: p.externalBookId,
    slug: p.slug ?? slugify(p.title),
    title: p.title,
    authors: p.authors ?? [],
    editors: p.editors ?? [],
    editorialNote: p.editorialNote ?? null,
    releaseYear: p.releaseYear ?? null,
    format: p.format ?? "novel",
    seriesHint: p.seriesHint ?? null,
    sourceUrl: p.sourceUrl ?? null,
    notes: p.notes ?? null,
    sourceRow: p.sourceRow ?? 0,
  };
}

/** A tiny stand-in roster: max ids W40K-0565 / HH-0294 → next 0566 / 0295. */
const ROSTER: RosterFile = {
  schemaVersion: "1.0",
  sourceFile: "Warhammer_Books_SSOT.xlsx",
  books: [
    rb({ externalBookId: "W40K-0565", title: "Known 2025 Book", authors: ["Guy Haley"], releaseYear: 2025 }),
    rb({ externalBookId: "W40K-0100", title: "An Old Reprint", authors: ["Dan Abnett"], releaseYear: 2024 }),
    rb({ externalBookId: "HH-0294", title: "Horus Rising", authors: ["Dan Abnett"], releaseYear: 2006 }),
    rb({ externalBookId: "W40K-0050", title: "Xenos", authors: ["Dan Abnett"], releaseYear: 2001 }),
    rb({
      externalBookId: "W40K-0060",
      title: "Sabbat Worlds",
      authors: [],
      editorialNote: "various",
      releaseYear: 2010,
      format: "anthology",
    }),
    rb({ externalBookId: "W40K-0070", title: "Dual Author Book", authors: ["Dan Abnett", "Guy Haley"], releaseYear: 2020 }),
  ],
  collections: [],
};

const INDEX = buildRosterIndex(ROSTER);

const CFG: TrackOfWordsConfig = {
  articleUrl: "https://www.trackofwords.com/article",
  sheetCsvUrl: "https://pinned.example/csv?gid=374689393&single=true&output=csv",
  gid: 374689393,
  sinceYear: 2025,
};

/** Baseline podcast floor resolver — fixture "current" episodes (pubDate 2026-01-01) are on/after it. */
const FLOOR = { floorIsoFor: () => "2026-01-01" };

/** Realistic tracker CSV slice — verbose Title header + the real Carnage row. */
const TRACKER_CSV = [
  "Year,Month,Day,Title *Paperback reprints in italics,Author,Setting/series,Type,Format,Notes",
  "2026,April,4th,Carnage Unending,*Various*,40k - TBC,Anthology,Paperback/ebook,",
  "2026,March,1st,The Vorbis Deception,Some Author,Horus Heresy - Siege of Terra,Novel,Hardback,",
  "2025,February,2nd,Known 2025 Book,Guy Haley,40k,Novel,Paperback,",
  "2024,January,1st,An Old Reprint,Dan Abnett,40k,Novel,Paperback,",
  "2025,May,3rd,Sabbat Worlds,*Various*,40k,Anthology,Paperback,",
  "2026,June,5th,Xenos,John Doe,40k,Novel,Paperback,",
  "",
].join("\n");

function mkCandidate(p: {
  title: string;
  authors?: string[];
  editorialNote?: "various" | null;
  year?: number | null;
  setting?: string;
  format?: BookFormat | null;
}): CandidateBook {
  const authors = p.authors ?? [];
  const editorialNote = p.editorialNote ?? null;
  const year = p.year ?? null;
  const setting = p.setting ?? "40k";
  return {
    title: p.title,
    authorsRaw: authors.join(", "),
    authors,
    editorialNote,
    releaseYear: year,
    format: p.format ?? null,
    seriesHint: setting,
    seriesPrefix: /horus\s*heresy/i.test(setting) ? "HH" : "W40K",
    titleSlug: slugify(p.title),
    identityKey: bookIdentityKey(p.title, authors, editorialNote, year),
  };
}

function show(
  p: Partial<PodcastShowConfig> & { slug: string; source: "rss" | "youtube"; title: string; feedUrl: string },
): PodcastShowConfig {
  return {
    slug: p.slug,
    source: p.source,
    title: p.title,
    feedUrl: p.feedUrl,
    appleId: p.appleId ?? null,
    podcastGuid: p.podcastGuid ?? null,
    links: p.links ?? [],
    youtubeChannelUrl: p.youtubeChannelUrl ?? null,
    youtubeChannelId: p.youtubeChannelId ?? null,
    excludePlaylists: p.excludePlaylists ?? [],
    includeVideoIds: p.includeVideoIds ?? [],
    excludeTitlePatterns: p.excludeTitlePatterns ?? [],
  };
}

function ep(guid: string, title: string): PodcastEpisode {
  return {
    guid,
    title,
    descriptionText: "",
    pubDate: "2026-01-01T00:00:00.000Z",
    durationSec: null,
    audioUrl: null,
    link: `https://example/${guid}`,
    season: null,
    episode: null,
  };
}

function epAt(guid: string, title: string, pubDate: string | null): PodcastEpisode {
  return { ...ep(guid, title), pubDate };
}

/** Build a fetch fake from a url→response map; missing keys throw. */
function fakeFetcher(map: Record<string, string | Error>): { fetchText(url: string): Promise<string> } {
  return {
    fetchText(url: string): Promise<string> {
      const v = map[url];
      if (v === undefined) return Promise.reject(new Error(`unexpected url ${url}`));
      if (v instanceof Error) return Promise.reject(v);
      return Promise.resolve(v);
    },
  };
}

async function main(): Promise<void> {
  // --- identity firewall: key construction ---------------------------------

  await test("authorKey: order-independent + various sentinel", () => {
    assert.equal(authorKey(["Dan Abnett", "Guy Haley"], null), authorKey(["Guy Haley", "Dan Abnett"], null));
    assert.equal(authorKey([], "various"), "various");
    assert.equal(authorKey(["Dan Abnett"], "various"), "various"); // various wins over names
    assert.notEqual(authorKey(["Dan Abnett"], null), authorKey(["Guy Haley"], null));
  });

  await test("bookIdentityKey: title|author|year", () => {
    assert.equal(bookIdentityKey("Carnage Unending", [], "various", 2026), "carnage-unending|various|2026");
    assert.equal(bookIdentityKey("Xenos", ["Dan Abnett"], null, null), "xenos|dan_abnett|?");
  });

  // --- identity firewall: classification -----------------------------------

  await test("classify: Carnage Unending (not in roster) → new", () => {
    const v = classifyCandidate(mkCandidate({ title: "Carnage Unending", editorialNote: "various", year: 2026 }), INDEX);
    assert.equal(v.kind, "new");
  });

  await test("classify: a genuinely new title → new", () => {
    const v = classifyCandidate(mkCandidate({ title: "Brand New Title", authors: ["New Author"], year: 2026 }), INDEX);
    assert.equal(v.kind, "new");
  });

  await test("classify: existing book, same year → exact (strict key)", () => {
    const v = classifyCandidate(mkCandidate({ title: "Horus Rising", authors: ["Dan Abnett"], year: 2006 }), INDEX);
    assert.equal(v.kind, "exact");
  });

  await test("classify: existing book, drifted year → exact (year-relaxed key)", () => {
    const v = classifyCandidate(mkCandidate({ title: "Horus Rising", authors: ["Dan Abnett"], year: 2099 }), INDEX);
    assert.equal(v.kind, "exact");
  });

  await test("classify: various anthology, same title, drifted year + different contributors → exact", () => {
    const v = classifyCandidate(mkCandidate({ title: "Sabbat Worlds", editorialNote: "various", year: 2025 }), INDEX);
    assert.equal(v.kind, "exact");
  });

  await test("classify: multi-author book, reversed author order → exact", () => {
    const v = classifyCandidate(
      mkCandidate({ title: "Dual Author Book", authors: ["Guy Haley", "Dan Abnett"], year: 2020 }),
      INDEX,
    );
    assert.equal(v.kind, "exact");
  });

  await test("classify: same title-slug, different author → title-collision (human review)", () => {
    const v = classifyCandidate(mkCandidate({ title: "Xenos", authors: ["John Doe"], year: 2026 }), INDEX);
    assert.equal(v.kind, "title-collision");
    if (v.kind === "title-collision") assert.equal(v.rosterId, "W40K-0050");
  });

  await test("classify: ZERO false-positives across all roster titles re-listed", () => {
    for (const book of ROSTER.books) {
      const v = classifyCandidate(
        mkCandidate({
          title: book.title,
          authors: book.authors,
          editorialNote: book.editorialNote,
          year: book.releaseYear,
        }),
        INDEX,
      );
      assert.notEqual(v.kind, "new", `roster book "${book.title}" wrongly classified new`);
    }
  });

  // --- CSV parsing ----------------------------------------------------------

  await test("parseCsv: quoted comma, escaped quote, embedded newline, no trailing empty row", () => {
    assert.deepEqual(parseCsv('a,"b,c",d\n1,2,3\n'), [
      ["a", "b,c", "d"],
      ["1", "2", "3"],
    ]);
    assert.deepEqual(parseCsv('"he said ""hi"""\n'), [['he said "hi"']]);
    assert.deepEqual(parseCsv('"line1\nline2",x\n'), [["line1\nline2", "x"]]);
    assert.equal(parseCsv("a,b\n1,2\n").length, 2); // trailing \n ⇒ no spurious row
  });

  await test("parseTrackerCsv: Carnage Unending parsed (various / 2026 / anthology / W40K)", () => {
    const parsed = parseTrackerCsv(TRACKER_CSV);
    assert.ok(parsed.headerOk);
    const carnage = parsed.candidates.find((c) => c.title === "Carnage Unending");
    assert.ok(carnage, "Carnage Unending missing from parse");
    assert.equal(carnage.editorialNote, "various");
    assert.equal(carnage.releaseYear, 2026);
    assert.equal(carnage.format, "anthology");
    assert.equal(carnage.seriesPrefix, "W40K");
    assert.deepEqual(carnage.authors, []);
  });

  await test("parseTrackerCsv: Horus Heresy setting → HH prefix", () => {
    const parsed = parseTrackerCsv(TRACKER_CSV);
    const vorbis = parsed.candidates.find((c) => c.title === "The Vorbis Deception");
    assert.ok(vorbis);
    assert.equal(vorbis.seriesPrefix, "HH");
  });

  await test("parseTrackerCsv: missing required columns → headerOk false", () => {
    const parsed = parseTrackerCsv("Foo,Bar\n1,2\n");
    assert.equal(parsed.headerOk, false);
    assert.deepEqual(parsed.missing.sort(), ["Author", "Title", "Year"]);
  });

  await test("mapFormat: Type → book_format enum (normalized)", () => {
    assert.equal(mapFormat("Anthology"), "anthology");
    assert.equal(mapFormat("Audio Drama"), "audio_drama");
    assert.equal(mapFormat("Audiobook"), "audio_drama");
    assert.equal(mapFormat("Novella"), "novella");
    assert.equal(mapFormat("Short Story"), "short_story");
    assert.equal(mapFormat("Omnibus"), "omnibus");
    assert.equal(mapFormat("Novel"), "novel");
    assert.equal(mapFormat("Graphic Novel"), null);
    assert.equal(mapFormat(""), null);
  });

  // --- sheet-URL discovery (re-discovery fallback path) ---------------------

  const FAKE_HTML =
    '<html><body><iframe src="https://docs.google.com/spreadsheets/d/e/2PACX-FAKE/pubhtml?widget=true&amp;headers=false"></iframe></body></html>';

  await test("extractSheetUrl: pulls the iframe sheet URL (entities decoded)", () => {
    assert.equal(
      extractSheetUrl(FAKE_HTML),
      "https://docs.google.com/spreadsheets/d/e/2PACX-FAKE/pubhtml?widget=true&headers=false",
    );
    assert.equal(extractSheetUrl("<html>no sheet</html>"), null);
  });

  await test("toCsvExportUrl: published + shared forms", () => {
    assert.equal(
      toCsvExportUrl("https://docs.google.com/spreadsheets/d/e/2PACX-FAKE/pubhtml?widget=true", 374689393),
      "https://docs.google.com/spreadsheets/d/e/2PACX-FAKE/pub?gid=374689393&single=true&output=csv",
    );
    assert.equal(
      toCsvExportUrl("https://docs.google.com/spreadsheets/d/ABC123/edit#gid=5", 7),
      "https://docs.google.com/spreadsheets/d/ABC123/export?format=csv&gid=7",
    );
    assert.equal(toCsvExportUrl("https://example.com/not-a-sheet", 1), null);
  });

  // --- book diff (fail-soft, DI'd fetch) ------------------------------------

  await test("detectMissingBooks: Carnage→W40K-0566, Vorbis→HH-0295, firewall filters the rest", async () => {
    const res = await detectMissingBooks(
      CFG,
      INDEX,
      makeIdAllocator(ROSTER),
      fakeFetcher({ [CFG.sheetCsvUrl]: TRACKER_CSV }),
    );
    assert.equal(res.status, "ok");
    assert.equal(res.newBooks.length, 2);

    const carnage = res.newBooks[0];
    assert.equal(carnage.externalBookId, "W40K-0566");
    assert.equal(carnage.title, "Carnage Unending");
    assert.equal(carnage.editorialNote, "various");
    assert.equal(carnage.releaseYear, 2026);
    assert.equal(carnage.format, "anthology");
    assert.equal(carnage.source_kind, "track_of_words");
    assert.equal(carnage.confidence, 0.6);
    assert.deepEqual(carnage.authors, []);

    const vorbis = res.newBooks[1];
    assert.equal(vorbis.externalBookId, "HH-0295");
    assert.equal(vorbis.format, "novel");

    assert.equal(res.consideredRows, 5); // 6 dated rows − 1 below the 2025 floor
    assert.equal(res.skippedOlderRows, 1);
    assert.equal(res.skippedOutOfScopeRows, 0); // all fixture rows are 40k / Horus Heresy
    assert.equal(res.skippedDuplicateRows, 0);
    assert.equal(res.reviewBooks.length, 1);
    assert.equal(res.reviewBooks[0].title, "Xenos");
    assert.equal(res.reviewBooks[0].collidesWithId, "W40K-0050");

    // No existing roster title leaked into the proposed-new set.
    const newTitles = new Set(res.newBooks.map((b) => b.title));
    for (const existing of ["Known 2025 Book", "Sabbat Worlds", "An Old Reprint"]) {
      assert.ok(!newTitles.has(existing), `${existing} wrongly proposed as new`);
    }
  });

  await test("detectMissingBooks: unmappable Type defaults to novel + is flagged", async () => {
    const csv =
      "Year,Month,Day,Title,Author,Setting/series,Type,Format,Notes\n" +
      "2026,Jan,1st,Mystery Format Book,New Author,40k,Graphic Novel,Paperback,\n";
    const res = await detectMissingBooks(CFG, INDEX, makeIdAllocator(ROSTER), fakeFetcher({ [CFG.sheetCsvUrl]: csv }));
    assert.equal(res.newBooks.length, 1);
    assert.equal(res.newBooks[0].format, "novel");
    assert.deepEqual(res.formatDefaultedIds, [res.newBooks[0].externalBookId]);
  });

  await test("detectMissingBooks: re-discovers the sheet from article HTML when the pinned URL dies", async () => {
    const rediscovered = "https://docs.google.com/spreadsheets/d/e/2PACX-FAKE/pub?gid=374689393&single=true&output=csv";
    const res = await detectMissingBooks(
      CFG,
      INDEX,
      makeIdAllocator(ROSTER),
      fakeFetcher({
        [CFG.sheetCsvUrl]: new Error("pinned 404"),
        [CFG.articleUrl]: FAKE_HTML,
        [rediscovered]: TRACKER_CSV,
      }),
    );
    assert.equal(res.status, "ok");
    assert.ok(res.newBooks.some((b) => b.title === "Carnage Unending"));
    assert.equal(res.csvUrl, rediscovered);
  });

  await test("detectMissingBooks: total source failure → unreachable, no throw, empty findings", async () => {
    const res = await detectMissingBooks(
      CFG,
      INDEX,
      makeIdAllocator(ROSTER),
      fakeFetcher({ [CFG.sheetCsvUrl]: new Error("network down"), [CFG.articleUrl]: new Error("network down") }),
    );
    assert.equal(res.status, "unreachable");
    assert.equal(res.newBooks.length, 0);
    assert.match(res.note ?? "", /unreachable/);
  });

  await test("detectMissingBooks: schema drift (missing column) → unreachable", async () => {
    const res = await detectMissingBooks(
      CFG,
      INDEX,
      makeIdAllocator(ROSTER),
      fakeFetcher({ [CFG.sheetCsvUrl]: "Foo,Bar\n1,2\n" }),
    );
    assert.equal(res.status, "unreachable");
    assert.match(res.note ?? "", /schema changed/);
  });

  await test("isInScopeSetting: 40k + Horus Heresy in; AoS / Old World / separators out", () => {
    assert.equal(isInScopeSetting("40k - TBC"), true);
    assert.equal(isInScopeSetting("40k"), true);
    assert.equal(isInScopeSetting("Horus Heresy - Siege of Terra"), true);
    assert.equal(isInScopeSetting("The Horus Heresy"), true);
    assert.equal(isInScopeSetting("Age of Sigmar - Gotrek"), false);
    assert.equal(isInScopeSetting("Warhammer - The Old World"), false);
    assert.equal(isInScopeSetting("Warhammer Chronicles"), false);
    assert.equal(isInScopeSetting(null), false); // setting-less separator row
  });

  await test("detectMissingBooks: out-of-scope settings + setting-less separators skipped", async () => {
    const csv =
      "Year,Month,Day,Title,Author,Setting/series,Type,Format,Notes\n" +
      "2026,Jan,1st,A 40k Book,New Author,40k - Space Marines,Novel,HB,\n" +
      "2026,Jan,1st,An AoS Book,Some Author,Age of Sigmar - Stormcast,Novel,HB,\n" +
      "2026,Jan,1st,An Old World Book,Some Author,Warhammer - The Old World,Novel,HB,\n" +
      "2026,Jan,1st,No new Black Library pre-orders this weekend,,,,,\n";
    const res = await detectMissingBooks(CFG, INDEX, makeIdAllocator(ROSTER), fakeFetcher({ [CFG.sheetCsvUrl]: csv }));
    assert.equal(res.newBooks.length, 1);
    assert.equal(res.newBooks[0].title, "A 40k Book");
    assert.equal(res.skippedOutOfScopeRows, 3); // AoS + Old World + the setting-less separator
  });

  await test("detectMissingBooks: same book on multiple rows → one proposal (intra-tracker dedup)", async () => {
    const csv =
      "Year,Month,Day,Title,Author,Setting/series,Type,Format,Notes\n" +
      "2025,Jan,1st,Repeated Book,One Author,40k,Novel,Hardback,\n" +
      "2026,Jun,1st,Repeated Book,One Author,40k,Novel,Paperback,\n" + // same title+author, later year/format
      "2026,Jun,1st,Repeated Book,One Author,40k,eBook,eBook,\n";
    const res = await detectMissingBooks(CFG, INDEX, makeIdAllocator(ROSTER), fakeFetcher({ [CFG.sheetCsvUrl]: csv }));
    assert.equal(res.newBooks.length, 1);
    assert.equal(res.newBooks[0].title, "Repeated Book");
    assert.equal(res.skippedDuplicateRows, 2);
  });

  await test("detectMissingBooks: ignore-list drops would-be-new AND would-be-review, counts them", async () => {
    // carnage-unending would be new; xenos (John Doe) would be a title-collision review.
    const ignore = new Set([slugify("Carnage Unending"), slugify("Xenos")]);
    const res = await detectMissingBooks(
      CFG,
      INDEX,
      makeIdAllocator(ROSTER),
      fakeFetcher({ [CFG.sheetCsvUrl]: TRACKER_CSV }),
      { ignoreSlugs: ignore },
    );
    assert.equal(res.status, "ok");
    // Only The Vorbis Deception (HH) survives as new; Carnage is dismissed.
    assert.deepEqual(
      res.newBooks.map((b) => b.title),
      ["The Vorbis Deception"],
    );
    assert.equal(res.reviewBooks.length, 0); // the Xenos collision is dismissed too
    assert.equal(res.skippedIgnoredRows, 2);
    assert.equal(res.consideredRows, 3); // 5 in-scope − 2 ignored
  });

  await test("detectMissingBooks: empty ignore-list is a no-op (unchanged buckets)", async () => {
    const withEmpty = await detectMissingBooks(
      CFG,
      INDEX,
      makeIdAllocator(ROSTER),
      fakeFetcher({ [CFG.sheetCsvUrl]: TRACKER_CSV }),
      { ignoreSlugs: new Set<string>() },
    );
    assert.equal(withEmpty.newBooks.length, 2);
    assert.equal(withEmpty.reviewBooks.length, 1);
    assert.equal(withEmpty.skippedIgnoredRows, 0);
  });

  await test("detectMissingBooks: seen-set partitions into pending buckets, ids stay stable", async () => {
    // carnage-unending would be new; xenos (John Doe) would be a title-collision review.
    const seen = new Set([slugify("Carnage Unending"), slugify("Xenos")]);
    const res = await detectMissingBooks(
      CFG,
      INDEX,
      makeIdAllocator(ROSTER),
      fakeFetcher({ [CFG.sheetCsvUrl]: TRACKER_CSV }),
      { seenSlugs: seen },
    );
    assert.equal(res.status, "ok");
    assert.deepEqual(
      res.newBooks.map((b) => b.title),
      ["The Vorbis Deception"],
    );
    assert.deepEqual(
      res.pendingBooks.map((b) => b.title),
      ["Carnage Unending"],
    );
    // Allocation happens BEFORE the partition: Carnage keeps the id it gets in
    // an unseen run (proposal byte-stability across mark-reviewed).
    assert.equal(res.pendingBooks[0].externalBookId, "W40K-0566");
    assert.equal(res.newBooks[0].externalBookId, "HH-0295");
    assert.equal(res.reviewBooks.length, 0);
    assert.deepEqual(
      res.pendingReviewBooks.map((r) => r.title),
      ["Xenos"],
    );
    assert.equal(res.consideredRows, 5); // seen rows are still considered, not skipped
  });

  // --- id allocator ---------------------------------------------------------

  await test("makeIdAllocator: seeds from roster maxima, increments per prefix", () => {
    const alloc = makeIdAllocator(ROSTER);
    assert.equal(alloc.next("W40K"), "W40K-0566");
    assert.equal(alloc.next("W40K"), "W40K-0567");
    assert.equal(alloc.next("HH"), "HH-0295");
  });

  // --- podcast diff ---------------------------------------------------------

  const RSS_SHOW = show({ slug: "show-a", source: "rss", title: "Show A", feedUrl: "https://a/feed" });
  const YT_SHOW = show({ slug: "show-b", source: "youtube", title: "Show B", feedUrl: "https://yt", youtubeChannelId: "UC1" });

  await test("diffPodcasts: rss ok → exactly the new guids", async () => {
    const deps: PodcastDiffDeps = {
      fetchRss: () => Promise.resolve([ep("g1", "E1"), ep("g2", "E2"), ep("g3", "E3"), ep("g4", "E4")]),
      fetchYoutube: () => Promise.resolve([]),
      loadCommittedGuids: (slug) => (slug === "show-a" ? new Set(["g1", "g2"]) : null),
      youtubeEnabled: true,
    };
    const r = await diffPodcasts([RSS_SHOW], deps, FLOOR);
    assert.equal(r.shows[0].status, "ok");
    assert.equal(r.shows[0].committedCount, 2);
    assert.equal(r.shows[0].freshCount, 4);
    assert.deepEqual(
      r.shows[0].newEpisodes.map((e) => e.guid),
      ["g3", "g4"],
    );
  });

  await test("diffPodcasts: missing artifact → failed (never 'all new')", async () => {
    const deps: PodcastDiffDeps = {
      fetchRss: () => Promise.resolve([ep("g1", "E1")]),
      fetchYoutube: () => Promise.resolve([]),
      loadCommittedGuids: () => null,
      youtubeEnabled: true,
    };
    const r = await diffPodcasts([RSS_SHOW], deps, FLOOR);
    assert.equal(r.shows[0].status, "failed");
    assert.equal(r.shows[0].newEpisodes.length, 0);
    assert.match(r.shows[0].note ?? "", /ingest:podcast/);
  });

  await test("diffPodcasts: youtube without key → skipped", async () => {
    const deps: PodcastDiffDeps = {
      fetchRss: () => Promise.resolve([]),
      fetchYoutube: () => Promise.resolve([ep("v1", "V1")]),
      loadCommittedGuids: (slug) => (slug === "show-b" ? new Set(["v0"]) : null),
      youtubeEnabled: false,
    };
    const r = await diffPodcasts([YT_SHOW], deps, FLOOR);
    assert.equal(r.shows[0].status, "skipped");
    assert.equal(r.shows[0].committedCount, 1);
    assert.equal(r.shows[0].newEpisodes.length, 0);
  });

  await test("diffPodcasts: feed fetch throws → failed (fail-soft, committed count kept)", async () => {
    const deps: PodcastDiffDeps = {
      fetchRss: () => Promise.reject(new Error("boom")),
      fetchYoutube: () => Promise.resolve([]),
      loadCommittedGuids: () => new Set(["g1", "g2"]),
      youtubeEnabled: true,
    };
    const r = await diffPodcasts([RSS_SHOW], deps, FLOOR);
    assert.equal(r.shows[0].status, "failed");
    assert.equal(r.shows[0].committedCount, 2);
    assert.match(r.shows[0].note ?? "", /boom/);
  });

  await test("diffPodcasts: youtube with key → diffs uploads", async () => {
    const deps: PodcastDiffDeps = {
      fetchRss: () => Promise.resolve([]),
      fetchYoutube: () => Promise.resolve([ep("v1", "V1"), ep("v2", "V2")]),
      loadCommittedGuids: (slug) => (slug === "show-b" ? new Set(["v1"]) : null),
      youtubeEnabled: true,
    };
    const r = await diffPodcasts([YT_SHOW], deps, FLOOR);
    assert.equal(r.shows[0].status, "ok");
    assert.deepEqual(
      r.shows[0].newEpisodes.map((e) => e.guid),
      ["v2"],
    );
  });

  await test("diffPodcasts: episodes before the date floor are not considered, only counted", async () => {
    const deps: PodcastDiffDeps = {
      fetchRss: () => Promise.resolve([ep("recent", "Recent"), epAt("ancient", "Ancient", "2019-05-01T00:00:00.000Z")]),
      fetchYoutube: () => Promise.resolve([]),
      loadCommittedGuids: () => new Set<string>(),
      youtubeEnabled: true,
    };
    const r = await diffPodcasts([RSS_SHOW], deps, FLOOR);
    assert.equal(r.shows[0].status, "ok");
    assert.deepEqual(
      r.shows[0].newEpisodes.map((e) => e.guid),
      ["recent"], // the 2019 episode is below the floor — never listed
    );
    assert.equal(r.shows[0].skippedBeforeFloor, 1);
  });

  await test("isTitleExcluded: case-insensitive substring; empty patterns never match", () => {
    assert.equal(isTitleExcluded("(Video) 236 - Aircraft", ["(Video)"]), true);
    assert.equal(isTitleExcluded("(video) lower twin", ["(Video)"]), true); // case-insensitive
    assert.equal(isTitleExcluded("236 - Aircraft", ["(Video)"]), false);
    assert.equal(isTitleExcluded("anything", []), false);
  });

  await test("parseRegistry: excludeTitlePatterns valid on an RSS show (defaults to [])", () => {
    const [withPat] = parseRegistry([
      { slug: "r", title: "R", feedUrl: "https://r", excludeTitlePatterns: ["(Video)"] },
    ]);
    assert.deepEqual(withPat.excludeTitlePatterns, ["(Video)"]);
    const [without] = parseRegistry([{ slug: "r2", title: "R2", feedUrl: "https://r2" }]);
    assert.deepEqual(without.excludeTitlePatterns, []);
    assert.throws(
      () => parseRegistry([{ slug: "r3", title: "R3", feedUrl: "https://r3", excludeTitlePatterns: "x" }]),
      /must be an array/,
    );
  });

  await test("diffPodcasts: title-excluded episodes are dropped and counted", async () => {
    const SHOW = show({
      slug: "show-a",
      source: "rss",
      title: "Show A",
      feedUrl: "https://a/feed",
      excludeTitlePatterns: ["(Video)"],
    });
    const deps: PodcastDiffDeps = {
      fetchRss: () =>
        Promise.resolve([
          ep("g1", "236 - Aircraft"),
          ep("g2", "(Video) 236 - Aircraft"),
          ep("g3", "237 - Tanks"),
        ]),
      fetchYoutube: () => Promise.resolve([]),
      loadCommittedGuids: () => new Set<string>(),
      youtubeEnabled: true,
    };
    const r = await diffPodcasts([SHOW], deps, FLOOR);
    assert.equal(r.shows[0].status, "ok");
    assert.deepEqual(
      r.shows[0].newEpisodes.map((e) => e.guid),
      ["g1", "g3"], // the "(Video)" twin is dropped
    );
    assert.equal(r.shows[0].skippedExcludedByTitle, 1);
  });

  await test("diffPodcasts: a show's curation cursor advances its floor", async () => {
    const deps: PodcastDiffDeps = {
      fetchRss: () =>
        Promise.resolve([
          epAt("old", "Old", "2026-02-01T00:00:00.000Z"),
          epAt("fresh", "Fresh", "2026-06-05T00:00:00.000Z"),
        ]),
      fetchYoutube: () => Promise.resolve([]),
      loadCommittedGuids: () => new Set<string>(),
      youtubeEnabled: true,
    };
    // Cursor at 2026-06-01 → only the June episode counts; the Feb one is pre-cursor.
    const floor = { floorIsoFor: (slug: string) => (slug === "show-a" ? "2026-06-01" : "2026-01-01") };
    const r = await diffPodcasts([RSS_SHOW], deps, floor);
    assert.deepEqual(
      r.shows[0].newEpisodes.map((e) => e.guid),
      ["fresh"],
    );
    assert.equal(r.shows[0].skippedBeforeFloor, 1);
    assert.equal(r.shows[0].floorIso, "2026-06-01");
  });

  // --- curation cursor ------------------------------------------------------

  await test("curation-state: empty + floorIsoForShow falls back to the baseline", () => {
    assert.equal(floorIsoForShow(emptyCurationState(), "any", "2026-01-01"), "2026-01-01");
    const st = parseCurationState({ shows: { lorehammer: "2026-06-09" } });
    assert.equal(floorIsoForShow(st, "lorehammer", "2026-01-01"), "2026-06-09");
    assert.equal(floorIsoForShow(st, "other", "2026-01-01"), "2026-01-01");
  });

  await test("curation-state: markReviewed stamps slugs; serialize is sorted, stable, round-trips", () => {
    const st = markReviewed(emptyCurationState(), ["b-show", "a-show"], "2026-06-09");
    assert.equal(st.shows["a-show"], "2026-06-09");
    assert.equal(st.shows["b-show"], "2026-06-09");
    const json = serializeCurationState(st);
    assert.ok(json.endsWith("\n"));
    assert.equal(serializeCurationState(st), json); // stable across calls
    assert.ok(json.indexOf('"a-show"') < json.indexOf('"b-show"')); // slugs sorted
    assert.deepEqual(parseCurationState(JSON.parse(json)).shows, st.shows);
  });

  await test("curation-state: a non-date cursor value throws", () => {
    assert.throws(() => parseCurationState({ shows: { x: "not-a-date" } }), /ISO date/);
  });

  // --- book ignore-list ("book cutoff") -------------------------------------

  await test("book-ignore: addIgnoredTitles derives the slug; ignoredSlugSet / isBookIgnored", () => {
    const st = addIgnoredTitles(emptyBookIgnore(), [
      { title: "The Art of Warhammer 40,000", reason: "artbook" },
      { title: "Red Tithe", reason: "already in roster" },
    ]);
    assert.ok(isBookIgnored(st, slugify("Red Tithe")));
    assert.equal(st.books[slugify("Red Tithe")].reason, "already in roster");
    assert.deepEqual(
      [...ignoredSlugSet(st)].sort(),
      [slugify("Red Tithe"), slugify("The Art of Warhammer 40,000")].sort(),
    );
  });

  await test("book-ignore: serialize is slug-sorted, trailing newline, round-trips", () => {
    const st = addIgnoredTitles(emptyBookIgnore(), [
      { title: "Zzz Last", reason: "x" },
      { title: "Aaa First", reason: "y" },
    ]);
    const json = serializeBookIgnore(st);
    assert.ok(json.endsWith("\n"));
    assert.equal(serializeBookIgnore(st), json); // stable across calls
    assert.ok(json.indexOf("aaa-first") < json.indexOf("zzz-last")); // slugs sorted
    assert.deepEqual(parseBookIgnore(JSON.parse(json)).books, st.books);
  });

  await test("book-ignore: a key that is not slugify(title) throws (load-bearing guard)", () => {
    assert.throws(
      () => parseBookIgnore({ books: { "wrong-key": { title: "Red Tithe", reason: "x" } } }),
      /key must equal slugify/,
    );
    assert.throws(() => parseBookIgnore({ books: { x: { title: "X" } } }), /reason/);
    assert.throws(() => parseBookIgnore({ books: { x: "nope" } }), /must be an object/);
    assert.deepEqual(parseBookIgnore({}).books, {}); // missing `books` ⇒ empty
  });

  // --- book seen-set (backlog cursor) ----------------------------------------

  await test("book-seen: markSeenTitles derives the slug; FIRST seen wins on re-mark", () => {
    const st = markSeenTitles(emptyBookSeen(), [
      { title: "Carnage Unending", firstSeen: "2026-W24" },
      { title: "Leontus", firstSeen: "2026-W24" },
    ]);
    assert.deepEqual(
      [...seenSlugSet(st)].sort(),
      [slugify("Carnage Unending"), slugify("Leontus")].sort(),
    );
    // Re-marking from a later proposal keeps the original firstSeen week.
    const again = markSeenTitles(st, [{ title: "Carnage Unending", firstSeen: "2026-W30" }]);
    assert.equal(again.books[slugify("Carnage Unending")].firstSeen, "2026-W24");
  });

  await test("book-seen: serialize is slug-sorted, trailing newline, round-trips", () => {
    const st = markSeenTitles(emptyBookSeen(), [
      { title: "Zzz Last", firstSeen: "2026-W24" },
      { title: "Aaa First", firstSeen: "2026-W23" },
    ]);
    const json = serializeBookSeen(st);
    assert.ok(json.endsWith("\n"));
    assert.equal(serializeBookSeen(st), json); // stable across calls
    assert.ok(json.indexOf("aaa-first") < json.indexOf("zzz-last")); // slugs sorted
    assert.deepEqual(parseBookSeen(JSON.parse(json)).books, st.books);
  });

  await test("book-seen: drifted key / bad firstSeen throw (load-bearing guards)", () => {
    assert.throws(
      () => parseBookSeen({ books: { "wrong-key": { title: "Leontus", firstSeen: "2026-W24" } } }),
      /key must equal slugify/,
    );
    assert.throws(
      () => parseBookSeen({ books: { leontus: { title: "Leontus", firstSeen: "2026-06-09" } } }),
      /ISO week/,
    );
    assert.throws(() => parseBookSeen({ books: { leontus: { title: "Leontus" } } }), /firstSeen/);
    assert.deepEqual(parseBookSeen({}).books, {}); // missing `books` ⇒ empty
  });

  // --- emit / serialize / no-op rule ---------------------------------------

  await test("isoWeekOf: ISO-week label incl. cross-year boundary", () => {
    assert.equal(isoWeekOf(new Date(Date.UTC(2026, 0, 1))), "2026-W01"); // Thu 1 Jan 2026
    assert.equal(isoWeekOf(new Date(Date.UTC(2025, 11, 29))), "2026-W01"); // Mon belongs to 2026-W01
    assert.match(isoWeekOf(new Date(Date.UTC(2026, 5, 9))), /^\d{4}-W\d{2}$/);
  });

  await test("proposalHasFindings: new book or new episode triggers; review-only does not", async () => {
    const books = await detectMissingBooks(CFG, INDEX, makeIdAllocator(ROSTER), fakeFetcher({ [CFG.sheetCsvUrl]: TRACKER_CSV }));
    const empty = { shows: [] };
    assert.equal(proposalHasFindings(books, empty), true); // has new books

    const reviewOnlyCsv =
      "Year,Month,Day,Title,Author,Setting/series,Type,Format,Notes\n" +
      "2026,June,5th,Xenos,John Doe,40k,Novel,Paperback,\n"; // only a title-collision
    const reviewOnly = await detectMissingBooks(
      CFG,
      INDEX,
      makeIdAllocator(ROSTER),
      fakeFetcher({ [CFG.sheetCsvUrl]: reviewOnlyCsv }),
    );
    assert.equal(reviewOnly.newBooks.length, 0);
    assert.equal(reviewOnly.reviewBooks.length, 1);
    assert.equal(proposalHasFindings(reviewOnly, empty), false); // collisions alone ⇒ no-op

    // A fully-seen backlog (everything pending, nothing fresh) is a no-op week too.
    const allSeen = new Set([slugify("Carnage Unending"), slugify("The Vorbis Deception")]);
    const pendingOnly = await detectMissingBooks(
      CFG,
      INDEX,
      makeIdAllocator(ROSTER),
      fakeFetcher({ [CFG.sheetCsvUrl]: TRACKER_CSV }),
      { seenSlugs: allSeen },
    );
    assert.equal(pendingOnly.newBooks.length, 0);
    assert.equal(pendingOnly.pendingBooks.length, 2);
    assert.equal(proposalHasFindings(pendingOnly, empty), false); // backlog alone ⇒ no-op
  });

  await test("serializeProposal: deterministic + timestamp-free", async () => {
    const books = await detectMissingBooks(CFG, INDEX, makeIdAllocator(ROSTER), fakeFetcher({ [CFG.sheetCsvUrl]: TRACKER_CSV }));
    const proposal: RefreshProposal = {
      $generatedBy: "test",
      isoWeek: "2026-W24",
      books,
      podcasts: { shows: [] },
      hasFindings: true,
    };
    const json = serializeProposal(proposal);
    assert.ok(json.endsWith("\n"));
    assert.equal(serializeProposal(proposal), json); // stable across calls
    assert.doesNotMatch(json, /generatedAt/i); // no run timestamp in the JSON
    const round = JSON.parse(json) as RefreshProposal;
    assert.equal(round.isoWeek, "2026-W24");
    assert.equal(round.books.newBooks.length, 2);
  });

  await test("buildReportMarkdown: surfaces the acceptance datapoint + sections", async () => {
    const books = await detectMissingBooks(CFG, INDEX, makeIdAllocator(ROSTER), fakeFetcher({ [CFG.sheetCsvUrl]: TRACKER_CSV }));
    const deps: PodcastDiffDeps = {
      fetchRss: () => Promise.resolve([ep("g1", "E1"), ep("g2", "E2")]),
      fetchYoutube: () => Promise.resolve([]),
      loadCommittedGuids: () => new Set(["g1"]),
      youtubeEnabled: true,
    };
    const podcasts = await diffPodcasts([RSS_SHOW], deps, FLOOR);
    const proposal: RefreshProposal = {
      $generatedBy: "test",
      isoWeek: "2026-W24",
      books,
      podcasts,
      hasFindings: true,
    };
    const md = buildReportMarkdown(proposal, {
      generatedAtIso: "2026-06-09T00:00:00.000Z",
      episodeSinceDate: "2026-01-01",
    });
    assert.match(md, /Carnage Unending/);
    assert.match(md, /W40K-0566/);
    assert.match(md, /## Books/);
    assert.match(md, /## Podcasts/);
    assert.match(md, /2026-01-01/); // the podcast date floor is stated
    assert.match(md, /Xenos/); // the review-book table
    assert.match(md, /New since last review \(2\)/);
    assert.match(md, /Pending backlog \(0\)/);
    assert.match(md, /2 new, 0 pending, 1 to review/); // summary carries all three counts
    // Bootstrap guarantee: the --books step is stated even with an EMPTY pending
    // section (the first findings PR is exactly the moment the cursor must surface).
    assert.match(md, /refresh:mark-reviewed -- --books/);
  });

  await test("buildReportMarkdown: pending backlog renders collapsed, keeps the ⚠ flag per section", async () => {
    // One fresh book with an unmappable Type (⚠) + one seen book with a clean type:
    // the footnote must render under the NEW table only.
    const csv =
      "Year,Month,Day,Title,Author,Setting/series,Type,Format,Notes\n" +
      "2026,Jan,1st,Mystery Format Book,New Author,40k,Graphic Novel,Paperback,\n" +
      "2026,Jan,1st,Seen Clean Book,New Author,40k,Novel,Hardback,\n";
    const books = await detectMissingBooks(
      CFG,
      INDEX,
      makeIdAllocator(ROSTER),
      fakeFetcher({ [CFG.sheetCsvUrl]: csv }),
      { seenSlugs: new Set([slugify("Seen Clean Book")]) },
    );
    const proposal: RefreshProposal = {
      $generatedBy: "test",
      isoWeek: "2026-W24",
      books,
      podcasts: { shows: [] },
      hasFindings: true,
    };
    const md = buildReportMarkdown(proposal, {
      generatedAtIso: "2026-06-09T00:00:00.000Z",
      episodeSinceDate: "2026-01-01",
    });
    assert.match(md, /New since last review \(1\)/);
    assert.match(md, /Pending backlog \(1\)/);
    assert.match(md, /<details>/);
    assert.match(md, /Show all 1 pending book\(s\)/);
    assert.match(md, /Seen Clean Book/);
    assert.match(md, /refresh:mark-reviewed -- --books/); // the next-step command is stated
    // The ⚠ footnote renders exactly once (the new table; the pending row is clean).
    const footnotes = md.match(/Format inferred from the tracker/g) ?? [];
    assert.equal(footnotes.length, 1);
    assert.match(md, /Mystery Format Book.*novel ⚠/);
    assert.doesNotMatch(md, /Seen Clean Book.*novel ⚠/);
  });

  // --- committed config -----------------------------------------------------

  await test("config: committed refresh-sources.json valid + pinned to gid 374689393", () => {
    const cfg = loadRefreshSources();
    assert.equal(cfg.trackOfWords.gid, 374689393);
    assert.ok(cfg.trackOfWords.sheetCsvUrl.includes("gid=374689393"));
    assert.equal(typeof cfg.trackOfWords.sinceYear, "number");
    assert.ok(!Number.isNaN(Date.parse(cfg.podcasts.episodeSinceDate))); // parseable date floor
  });

  await test("config: malformed config throws; default date floor applied", () => {
    assert.throws(() => parseRefreshSources({}), /trackOfWords/);
    assert.throws(() => parseRefreshSources({ trackOfWords: { articleUrl: "x" } }), /sheetCsvUrl/);
    // Podcasts omitted → default floor; a bad date string → throw.
    const ok = parseRefreshSources({
      trackOfWords: { articleUrl: "a", sheetCsvUrl: "b", gid: 1, sinceYear: 2025 },
    });
    assert.equal(ok.podcasts.episodeSinceDate, "2026-01-01");
    assert.throws(
      () =>
        parseRefreshSources({
          trackOfWords: { articleUrl: "a", sheetCsvUrl: "b", gid: 1, sinceYear: 2025 },
          podcasts: { episodeSinceDate: "not-a-date" },
        }),
      /episodeSinceDate/,
    );
  });

  console.log(`\nrefresh: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

void main();
