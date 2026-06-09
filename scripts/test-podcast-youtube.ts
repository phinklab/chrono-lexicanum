/**
 * Brief 130 — unit tests for the YouTube-source adapter
 * (`src/lib/ingestion/podcast/youtube.ts`) and its source-aware seams in
 * `links.ts` / `registry.ts`.
 *
 * DB-free, NETWORK-free, KEY-free — exercises only the PURE pieces: the
 * ISO-8601 duration parser, the channel/video mappers (against a committed API
 * fixture), the exclude-playlist title resolver, the upload selection, and the
 * source-aware link builders. The network orchestrator (`fetchYoutubeFeed`) is
 * deliberately NOT exercised here (it needs a key + network, like the RSS
 * `fetchFeed`); the fixture proves the mapping that the orchestrator wires.
 *
 *   npm run test:podcast-youtube
 */
import assert from "node:assert/strict";

import {
  buildReport,
  buildShowArtifact,
  serializeArtifact,
  type EpisodeResult,
} from "../src/lib/ingestion/podcast/artifact";
import { buildApplyPlan, type ReferenceSets } from "../src/lib/ingestion/podcast/apply-plan";
import { buildEpisodeLinks, buildShowLinks } from "../src/lib/ingestion/podcast/links";
import {
  getShow,
  loadRegistry,
  parseRegistry,
  type PodcastShowConfig,
} from "../src/lib/ingestion/podcast/registry";
import type { PodcastEpisode } from "../src/lib/ingestion/podcast/types";
import {
  applyIncludeOverrides,
  mapChannelItem,
  mapVideoToEpisode,
  parseHandle,
  parseIso8601Duration,
  resolveExcludedPlaylistIds,
  selectUploadVideoIds,
  uploadsFeedUrl,
  watchUrl,
  type UploadRef,
} from "../src/lib/ingestion/podcast/youtube";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
  } catch (err) {
    failed += 1;
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`✗ ${name}\n  ${msg}`);
  }
}

function ep(partial: Partial<PodcastEpisode> & { guid: string }): PodcastEpisode {
  return {
    guid: partial.guid,
    title: partial.title ?? partial.guid,
    descriptionText: partial.descriptionText ?? "",
    pubDate: partial.pubDate ?? null,
    durationSec: partial.durationSec ?? null,
    audioUrl: partial.audioUrl ?? null,
    link: partial.link ?? null,
    season: partial.season ?? null,
    episode: partial.episode ?? null,
  };
}

function cfg(partial: Partial<PodcastShowConfig> & { slug: string }): PodcastShowConfig {
  return {
    slug: partial.slug,
    source: partial.source ?? "rss",
    title: partial.title ?? partial.slug,
    feedUrl: partial.feedUrl ?? "https://example.com/feed.xml",
    appleId: partial.appleId ?? null,
    podcastGuid: partial.podcastGuid ?? null,
    links: partial.links ?? [],
    youtubeChannelUrl: partial.youtubeChannelUrl ?? null,
    youtubeChannelId: partial.youtubeChannelId ?? null,
    excludePlaylists: partial.excludePlaylists ?? [],
    includeVideoIds: partial.includeVideoIds ?? [],
    excludeTitlePatterns: partial.excludeTitlePatterns ?? [],
  };
}

// --- ISO-8601 duration parser ------------------------------------------------

test("parseIso8601Duration: the Brief 130 cases", () => {
  assert.equal(parseIso8601Duration("PT1H2M3S"), 3723);
  assert.equal(parseIso8601Duration("PT15M"), 900);
  assert.equal(parseIso8601Duration("PT45S"), 45);
  assert.equal(parseIso8601Duration("PT2H"), 7200);
  assert.equal(parseIso8601Duration("P0D"), null);
  assert.equal(parseIso8601Duration(""), null);
  assert.equal(parseIso8601Duration(null), null);
});

test("parseIso8601Duration: edge cases (days, zero, junk, fractional)", () => {
  assert.equal(parseIso8601Duration("P1DT1H"), 90_000); // 86400 + 3600
  assert.equal(parseIso8601Duration("PT0S"), null); // zero → null (unknown)
  assert.equal(parseIso8601Duration("PT"), null); // T with no components
  assert.equal(parseIso8601Duration("  PT10M  "), 600); // trimmed
  assert.equal(parseIso8601Duration("garbage"), null);
  assert.equal(parseIso8601Duration("01:02:03"), null); // RSS form is NOT this parser's job
  assert.equal(parseIso8601Duration("PT1.5S"), null); // fractional unsupported → null, not a crash
});

// --- URL helpers -------------------------------------------------------------

test("uploadsFeedUrl / watchUrl: canonical forms", () => {
  assert.equal(
    uploadsFeedUrl("UCabc"),
    "https://www.youtube.com/feeds/videos.xml?channel_id=UCabc",
  );
  assert.equal(watchUrl("dQw4w9WgXcQ"), "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
});

test("parseHandle: extracts @handle from a channel URL or raw handle", () => {
  assert.equal(parseHandle("https://www.youtube.com/@luetin09"), "luetin09");
  assert.equal(parseHandle("https://www.youtube.com/@luetin09/videos"), "luetin09");
  assert.equal(parseHandle("@luetin09"), "luetin09");
  assert.equal(parseHandle("https://www.youtube.com/channel/UCabc"), null);
  assert.equal(parseHandle(null), null);
});

// --- channel mapping (committed API fixture) ---------------------------------

const CHANNEL_ITEM = {
  kind: "youtube#channel",
  id: "UCxyz_luetin",
  snippet: {
    title: "Luetin09",
    description: "Warhammer 40,000 lore.",
    thumbnails: {
      default: { url: "https://yt3.example/default.jpg", width: 88, height: 88 },
      medium: { url: "https://yt3.example/medium.jpg", width: 240, height: 240 },
      high: { url: "https://yt3.example/high.jpg", width: 800, height: 800 },
    },
  },
  contentDetails: {
    relatedPlaylists: { likes: "", uploads: "UUxyz_luetin" },
  },
};

test("mapChannelItem: ids + show meta from a channels.list item", () => {
  const { channelId, uploadsPlaylistId, show } = mapChannelItem(CHANNEL_ITEM);
  assert.equal(channelId, "UCxyz_luetin");
  assert.equal(uploadsPlaylistId, "UUxyz_luetin");
  assert.equal(show.title, "Luetin09");
  assert.equal(show.podcastGuid, null); // YouTube has no podcast:guid
  assert.equal(show.imageUrl, "https://yt3.example/high.jpg"); // best available
});

test("mapChannelItem: missing uploads playlist throws (fail loud)", () => {
  assert.throws(
    () => mapChannelItem({ id: "UCabc", snippet: { title: "X" }, contentDetails: {} }),
    /relatedPlaylists\.uploads/,
  );
  assert.throws(() => mapChannelItem({ snippet: { title: "X" } }), /no `id`/);
});

// --- video mapping (committed API fixture) -----------------------------------

const VIDEO_ITEM = {
  kind: "youtube#video",
  id: "dQw4w9WgXcQ",
  snippet: {
    publishedAt: "2024-05-01T12:00:00Z",
    title: "The Horus Heresy — Explained",
    description: "A deep dive into\n\n  the Horus Heresy.\tWith timestamps below.",
    thumbnails: { high: { url: "https://i.ytimg.example/hq.jpg" } },
    tags: ["warhammer", "40k"], // ignored by the mapper (LLM tags from text)
  },
  contentDetails: { duration: "PT1H2M3S", definition: "hd" },
  statistics: { viewCount: "123456" }, // dropped (no schema home)
};

test("mapVideoToEpisode: videos.list item → PodcastEpisode", () => {
  const e = mapVideoToEpisode(VIDEO_ITEM);
  assert.ok(e);
  assert.equal(e.guid, "dQw4w9WgXcQ"); // video id = stable guid
  assert.equal(e.title, "The Horus Heresy — Explained");
  // description is already plain text; whitespace (incl. newlines/tabs) collapsed
  assert.equal(e.descriptionText, "A deep dive into the Horus Heresy. With timestamps below.");
  assert.equal(e.pubDate, "2024-05-01T12:00:00.000Z"); // normalized ISO
  assert.equal(e.durationSec, 3723); // PT1H2M3S
  assert.equal(e.audioUrl, null); // no enclosure
  assert.equal(e.link, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  assert.equal(e.season, null);
  assert.equal(e.episode, null);
});

test("mapVideoToEpisode: tolerates missing fields; no id → null", () => {
  const e = mapVideoToEpisode({ id: "abc", snippet: {}, contentDetails: {} });
  assert.ok(e);
  assert.equal(e.title, "");
  assert.equal(e.descriptionText, "");
  assert.equal(e.pubDate, null);
  assert.equal(e.durationSec, null);
  assert.equal(e.link, "https://www.youtube.com/watch?v=abc");
  assert.equal(mapVideoToEpisode({ snippet: { title: "x" } }), null); // no id
  assert.equal(mapVideoToEpisode("not an object"), null);
});

// --- exclude-playlist title resolution ---------------------------------------

const CHANNEL_PLAYLISTS = [
  { id: "PLlore", title: "Warhammer 40k Lore" },
  { id: "PLhobby", title: "40K HOBBY - Showcase / Painting / Tutorials" },
  { id: "PLnews", title: "Discussion / News / Speculation" },
  { id: "PLriven", title: "Riven Luetins playthrough [Completed]" },
];

const LUETIN_EXCLUDED_TITLES = [
  "40K HOBBY - Showcase / Painting / Tutorials",
  "Discussion / News / Speculation",
  "Riven Luetins playthrough [Completed]",
];

test("resolveExcludedPlaylistIds: the three luetin09 denylist titles → ids (deterministic order)", () => {
  // Output order follows the CHANNEL playlist order (PLlore, PLhobby, PLnews,
  // PLriven), NOT the requested-title order — so it is deterministic regardless
  // of how the registry lists the titles. Asserted WITHOUT sorting on purpose.
  const ids = resolveExcludedPlaylistIds(CHANNEL_PLAYLISTS, LUETIN_EXCLUDED_TITLES);
  assert.deepEqual(ids, ["PLhobby", "PLnews", "PLriven"]);
  // permuting the requested titles must not change the output order
  const permuted = resolveExcludedPlaylistIds(CHANNEL_PLAYLISTS, [
    "Riven Luetins playthrough [Completed]",
    "40K HOBBY - Showcase / Painting / Tutorials",
    "Discussion / News / Speculation",
  ]);
  assert.deepEqual(permuted, ["PLhobby", "PLnews", "PLriven"]);
});

test("resolveExcludedPlaylistIds: empty → []; unknown title throws loud", () => {
  assert.deepEqual(resolveExcludedPlaylistIds(CHANNEL_PLAYLISTS, []), []);
  assert.throws(
    () => resolveExcludedPlaylistIds(CHANNEL_PLAYLISTS, ["No Such Playlist"]),
    /not found on channel.*No Such Playlist/,
  );
  // a renamed playlist (title drift) must surface, not silently leak its videos
  assert.throws(
    () => resolveExcludedPlaylistIds(CHANNEL_PLAYLISTS, ["Discussion / News"]),
    /not found on channel/,
  );
});

test("resolveExcludedPlaylistIds: a title matching several playlists excludes all", () => {
  const dupes = [
    { id: "PLa", title: "Dupe" },
    { id: "PLb", title: "Dupe" },
    { id: "PLc", title: "Keep" },
  ];
  assert.deepEqual(resolveExcludedPlaylistIds(dupes, ["Dupe"]).sort(), ["PLa", "PLb"]);
});

// --- per-video include override (curation) -----------------------------------

test("applyIncludeOverrides: force-includes drop denylisted ids; counts real hits", () => {
  const deny = new Set(["a", "b", "c", "d"]);
  const { excludedIds, reincluded } = applyIncludeOverrides(deny, ["b", "d"]);
  assert.deepEqual([...excludedIds].sort(), ["a", "c"]);
  assert.equal(reincluded, 2);
  // input set is not mutated (pure)
  assert.deepEqual([...deny].sort(), ["a", "b", "c", "d"]);
});

test("applyIncludeOverrides: an include id not on the denylist is a no-op (not counted)", () => {
  const deny = new Set(["a", "b"]);
  const { excludedIds, reincluded } = applyIncludeOverrides(deny, ["zzz", "a"]);
  assert.deepEqual([...excludedIds].sort(), ["b"]);
  assert.equal(reincluded, 1, "only the id that was actually excluded counts");
  // empty override → denylist passes through unchanged
  const none = applyIncludeOverrides(deny, []);
  assert.deepEqual([...none.excludedIds].sort(), ["a", "b"]);
  assert.equal(none.reincluded, 0);
});

// --- upload selection (exclude + newest-first + limit) -----------------------

const UPLOADS: UploadRef[] = [
  { videoId: "vJan", videoPublishedAt: "2024-01-01T00:00:00Z" },
  { videoId: "vMar", videoPublishedAt: "2024-03-01T00:00:00Z" },
  { videoId: "vFeb", videoPublishedAt: "2024-02-01T00:00:00Z" },
  { videoId: "vHobby", videoPublishedAt: "2024-04-01T00:00:00Z" }, // excluded
  { videoId: "vNull", videoPublishedAt: null }, // undated → last
];

test("selectUploadVideoIds: excludes denylist, orders newest-first, nulls last", () => {
  const ids = selectUploadVideoIds(UPLOADS, new Set(["vHobby"]));
  assert.deepEqual(ids, ["vMar", "vFeb", "vJan", "vNull"]);
});

test("selectUploadVideoIds: --limit takes the newest N (post-exclusion)", () => {
  assert.deepEqual(selectUploadVideoIds(UPLOADS, new Set(["vHobby"]), 2), ["vMar", "vFeb"]);
  assert.deepEqual(selectUploadVideoIds(UPLOADS, new Set(), 1), ["vHobby"]); // newest overall
});

test("selectUploadVideoIds: no exclusion keeps all; dedups repeated ids", () => {
  const ids = selectUploadVideoIds(UPLOADS, new Set());
  assert.deepEqual(ids, ["vHobby", "vMar", "vFeb", "vJan", "vNull"]);
  const withDupe = selectUploadVideoIds(
    [...UPLOADS, { videoId: "vMar", videoPublishedAt: "2024-03-01T00:00:00Z" }],
    new Set(["vHobby"]),
  );
  assert.equal(withDupe.filter((id) => id === "vMar").length, 1);
});

test("selectUploadVideoIds: total order is deterministic regardless of input order", () => {
  const a = selectUploadVideoIds(UPLOADS, new Set(["vHobby"]));
  const b = selectUploadVideoIds([...UPLOADS].reverse(), new Set(["vHobby"]));
  assert.deepEqual(a, b);
});

test("selectUploadVideoIds + applyIncludeOverrides: a re-included upload survives selection", () => {
  // vHobby is denylisted; force-including it back makes it selectable (newest).
  const { excludedIds } = applyIncludeOverrides(new Set(["vHobby"]), ["vHobby"]);
  assert.deepEqual(selectUploadVideoIds(UPLOADS, excludedIds, 1), ["vHobby"]);
});

// --- source-aware show links -------------------------------------------------

test("buildShowLinks: YouTube show has NO derived rss link, keeps channel link", () => {
  const links = buildShowLinks(
    cfg({
      slug: "luetin09",
      source: "youtube",
      feedUrl: "https://www.youtube.com/@luetin09",
      links: [{ serviceId: "youtube", url: "https://www.youtube.com/@luetin09" }],
    }),
  );
  assert.ok(!links.some((l) => l.serviceId === "rss"), "no rss link for a youtube show");
  const yt = links.find((l) => l.serviceId === "youtube");
  assert.ok(yt, "youtube channel link present");
  assert.equal(yt.kind, "watch");
  assert.equal(yt.sourceKind, "manual"); // show-level channel link is manual (Brief 128)
});

test("buildShowLinks: RSS show STILL derives the rss feed link (parity unchanged)", () => {
  const links = buildShowLinks(cfg({ slug: "rsshow", source: "rss", feedUrl: "https://feed/x" }));
  const rss = links.find((l) => l.serviceId === "rss");
  assert.ok(rss, "rss show keeps its derived feed link");
  assert.equal(rss.url, "https://feed/x");
  assert.equal(rss.sourceKind, "podcast_rss");
});

// --- source-aware episode links ----------------------------------------------

test("buildEpisodeLinks: YouTube episode → one watch/youtube/youtube link", () => {
  const links = buildEpisodeLinks(
    ep({ guid: "v1", link: "https://www.youtube.com/watch?v=v1", audioUrl: null }),
    "youtube",
  );
  assert.equal(links.length, 1);
  assert.equal(links[0].serviceId, "youtube");
  assert.equal(links[0].kind, "watch");
  assert.equal(links[0].sourceKind, "youtube");
  assert.equal(links[0].confidence, 1);
  assert.equal(links[0].url, "https://www.youtube.com/watch?v=v1");
});

test("buildEpisodeLinks: RSS path unchanged; default source is rss", () => {
  const rss = buildEpisodeLinks(ep({ guid: "a", audioUrl: "https://a.mp3" }), "rss");
  assert.equal(rss.length, 1);
  assert.equal(rss[0].serviceId, "rss");
  assert.equal(rss[0].sourceKind, "podcast_rss");
  // no explicit source → defaults to rss (back-compatible)
  assert.deepEqual(buildEpisodeLinks(ep({ guid: "a", audioUrl: "https://a.mp3" })), rss);
  // a YouTube episode with no link yields no links rather than a malformed entry
  assert.deepEqual(buildEpisodeLinks(ep({ guid: "v", link: null }), "youtube"), []);
});

// --- registry: source discriminator + excludePlaylists -----------------------

test("parseRegistry: source defaults to rss; youtube accepted; bad value throws", () => {
  assert.equal(parseRegistry([{ slug: "a", title: "A", feedUrl: "https://a" }])[0].source, "rss");
  const yt = parseRegistry([
    {
      slug: "y",
      source: "youtube",
      title: "Y",
      feedUrl: "https://www.youtube.com/@y",
      youtubeChannelUrl: "https://www.youtube.com/@y",
    },
  ]);
  assert.equal(yt[0].source, "youtube");
  assert.throws(
    () => parseRegistry([{ slug: "a", source: "vimeo", title: "A", feedUrl: "https://a" }]),
    /source "vimeo"/,
  );
});

test("parseRegistry: excludePlaylists parsed for youtube; rejected for rss; shape-checked", () => {
  const yt = parseRegistry([
    {
      slug: "y",
      source: "youtube",
      title: "Y",
      feedUrl: "https://www.youtube.com/@y",
      youtubeChannelUrl: "https://www.youtube.com/@y",
      excludePlaylists: ["A", "B"],
    },
  ]);
  assert.deepEqual(yt[0].excludePlaylists, ["A", "B"]);
  // absent → []
  assert.deepEqual(
    parseRegistry([{ slug: "a", title: "A", feedUrl: "https://a" }])[0].excludePlaylists,
    [],
  );
  // non-empty on an rss source → loud config error
  assert.throws(
    () =>
      parseRegistry([{ slug: "a", title: "A", feedUrl: "https://a", excludePlaylists: ["X"] }]),
    /only valid for source "youtube"/,
  );
  // wrong shapes
  assert.throws(
    () =>
      parseRegistry([
        { slug: "y", source: "youtube", title: "Y", feedUrl: "https://y", excludePlaylists: "X" },
      ]),
    /must be an array/,
  );
  assert.throws(
    () =>
      parseRegistry([
        { slug: "y", source: "youtube", title: "Y", feedUrl: "https://y", excludePlaylists: [""] },
      ]),
    /non-empty string/,
  );
});

test("parseRegistry: includeVideoIds parsed for youtube; rejected for rss; shape-checked", () => {
  const yt = parseRegistry([
    {
      slug: "y",
      source: "youtube",
      title: "Y",
      feedUrl: "https://www.youtube.com/@y",
      youtubeChannelUrl: "https://www.youtube.com/@y",
      includeVideoIds: ["vid1", "vid2"],
    },
  ]);
  assert.deepEqual(yt[0].includeVideoIds, ["vid1", "vid2"]);
  // absent → []
  assert.deepEqual(
    parseRegistry([{ slug: "a", title: "A", feedUrl: "https://a" }])[0].includeVideoIds,
    [],
  );
  // non-empty on an rss source → loud config error
  assert.throws(
    () =>
      parseRegistry([{ slug: "a", title: "A", feedUrl: "https://a", includeVideoIds: ["x"] }]),
    /only valid for source "youtube"/,
  );
  // wrong shapes
  assert.throws(
    () =>
      parseRegistry([
        { slug: "y", source: "youtube", title: "Y", feedUrl: "https://y", includeVideoIds: "X" },
      ]),
    /must be an array/,
  );
  assert.throws(
    () =>
      parseRegistry([
        { slug: "y", source: "youtube", title: "Y", feedUrl: "https://y", includeVideoIds: [""] },
      ]),
    /non-empty string/,
  );
});

// --- the committed registry's luetin09 entry ---------------------------------

test("loadRegistry: luetin09 entry is a valid youtube show with the 3-title denylist", () => {
  const reg = loadRegistry();
  const lue = getShow(reg, "luetin09");
  assert.equal(lue.source, "youtube");
  assert.equal(lue.youtubeChannelUrl, "https://www.youtube.com/@luetin09");
  assert.deepEqual([...lue.excludePlaylists].sort(), [...LUETIN_EXCLUDED_TITLES].sort());
  // the curated lore-rescue allowlist (Brief 130 curation) — non-empty, and the
  // archetype Philipp named ("Belisarius Cawl") is force-included back.
  assert.ok(lue.includeVideoIds.length > 0, "luetin09 carries a curated include-list");
  assert.ok(
    lue.includeVideoIds.includes("WkWh3q3Cry0"),
    "the Belisarius Cawl lore video is rescued past the denylist",
  );
  const services = new Set(buildShowLinks(lue).map((l) => l.serviceId));
  assert.ok(services.has("youtube"), "youtube channel link present");
  assert.ok(!services.has("rss"), "no derived rss link for the youtube show");
  // the RSS shows remain valid + rss-deriving
  assert.equal(getShow(reg, "the-40k-lorecast").source, "rss");
  assert.ok(buildShowLinks(getShow(reg, "the-40k-lorecast")).some((l) => l.serviceId === "rss"));
});

// --- structural parity: youtube artifact ≅ rss artifact ----------------------

function buildArtifactFor(source: "rss" | "youtube") {
  const e =
    source === "youtube"
      ? ep({
          guid: "v1",
          title: "YT ep",
          pubDate: "2024-05-01T12:00:00.000Z",
          durationSec: 3723,
          link: "https://www.youtube.com/watch?v=v1",
          audioUrl: null,
        })
      : ep({
          guid: "g1",
          title: "RSS ep",
          pubDate: "2024-05-01T12:00:00.000Z",
          durationSec: 3723,
          link: "https://example.com/ep",
          audioUrl: "https://example.com/ep.mp3",
        });
  const results: EpisodeResult[] = [
    {
      episode: e,
      extraction: {
        episodeKind: "lore",
        characters: { primary: [], mentioned: [] },
        factions: { primary: [], mentioned: [] },
        locations: { primary: [], mentioned: [] },
      },
      tags: [],
      unresolved: [],
    },
  ];
  return buildShowArtifact({
    show: {
      slug: source,
      title: source,
      feedUrl: source === "youtube" ? uploadsFeedUrl("UCabc") : "https://example.com/feed",
      appleId: null,
      podcastGuid: null,
      imageUrl: null,
      links: [],
    },
    source,
    model: "claude-sonnet-4-6",
    promptVersion: "deadbeef0000",
    results,
  });
}

test("parity: youtube + rss artifacts share top-level + episode key shape", () => {
  const yt = buildArtifactFor("youtube");
  const rss = buildArtifactFor("rss");
  assert.deepEqual(Object.keys(yt).sort(), Object.keys(rss).sort());
  assert.deepEqual(Object.keys(yt.show).sort(), Object.keys(rss.show).sort());
  assert.deepEqual(
    Object.keys(yt.episodes[0]).sort(),
    Object.keys(rss.episodes[0]).sort(),
    "episode object shape is identical — only field VALUES differ",
  );
  // the value-level differences the brief expects:
  assert.equal(yt.episodes[0].audioUrl, null);
  assert.equal(yt.episodes[0].links[0].serviceId, "youtube");
  assert.equal(yt.episodes[0].links[0].sourceKind, "youtube");
  assert.equal(rss.episodes[0].links[0].serviceId, "rss");
  assert.equal(rss.episodes[0].links[0].sourceKind, "podcast_rss");
  // serialization stays byte-stable for the youtube artifact too
  assert.equal(serializeArtifact(yt), serializeArtifact(buildArtifactFor("youtube")));
});

test("buildReport: youtube report names the watch link, not an RSS audio link", () => {
  const md = buildReport(buildArtifactFor("youtube"), "youtube");
  assert.ok(md.includes("YouTube watch link"), "report mentions the youtube watch link");
  assert.ok(!md.includes("RSS audio link"), "report does not claim an RSS audio link");
});

// --- apply-plan accepts the youtube link provenance --------------------------

test("buildApplyPlan: a youtube artifact (round-tripped) validates and projects its watch link", () => {
  const EMPTY_REFS: ReferenceSets = {
    character: new Set<string>(),
    faction: new Set<string>(),
    location: new Set<string>(),
  };
  // Round-trip through JSON to mimic reading the committed artifact from disk —
  // assertShowArtifact (inside buildApplyPlan) must accept sourceKind:"youtube".
  const art: unknown = JSON.parse(serializeArtifact(buildArtifactFor("youtube")));
  const plan = buildApplyPlan(art as Parameters<typeof buildApplyPlan>[0], EMPTY_REFS);
  assert.equal(plan.episodes.length, 1);
  assert.equal(plan.episodes[0].links.length, 1);
  assert.equal(plan.episodes[0].links[0].serviceId, "youtube");
  assert.equal(plan.episodes[0].links[0].sourceKind, "youtube");
  assert.equal(plan.episodes[0].audioUrl, null);
  assert.equal(plan.report.episodeLinkCount, 1);
});

console.log(`\npodcast-youtube: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
