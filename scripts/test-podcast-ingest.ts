/**
 * Unit tests for the podcast ingest library (`src/lib/ingestion/podcast`).
 *
 * DB-free, network-free, LLM-free — exercises only the pure pieces: feed
 * parsing, HTML→text, duration parsing, alias resolution of an extraction, and
 * deterministic artifact serialization. Mirrors the repo's `tsx scripts/test-*.ts`
 * convention (node:assert + pass/fail counter, non-zero exit on failure).
 *
 *   npm run test:podcast-ingest
 */
import assert from "node:assert/strict";

import {
  buildShowArtifact,
  serializeArtifact,
  type EpisodeResult,
} from "../src/lib/ingestion/podcast/artifact";
import {
  decodeEntities,
  htmlToText,
  parseDurationToSeconds,
  parseFeed,
} from "../src/lib/ingestion/podcast/feed";
import { resolveEpisodeTags } from "../src/lib/ingestion/podcast/resolve";
import type {
  EpisodeExtraction,
  EpisodeTag,
  PodcastEpisode,
} from "../src/lib/ingestion/podcast/types";

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

function emptyAxis() {
  return { primary: [], mentioned: [] };
}

function findTag(tags: EpisodeTag[], type: string, id: string): EpisodeTag | undefined {
  return tags.find((t) => t.type === type && t.canonicalId === id);
}

// --- feed parsing: RSS 2.0 + iTunes namespace --------------------------------

const FIXTURE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:podcast="https://podcastindex.org/namespace/1.0">
  <channel>
    <title>Test Lorecast</title>
    <podcast:guid>cc233adb-de43-49be-bb76-9720292ddc98</podcast:guid>
    <itunes:image href="https://example.com/cover.jpg"/>
    <item>
      <title>Episode One &amp; The Night Lords</title>
      <itunes:title>Konrad Curze &amp; The Night Lords&#39; Doom</itunes:title>
      <description><![CDATA[<p>We discuss <b>Konrad Curze</b>.</p><p>Also the Imperial Guard.</p>]]></description>
      <enclosure url="https://example.com/ep1.mp3?a=1&amp;b=2" type="audio/mpeg" length="123"/>
      <guid isPermaLink="false">guid-ep-1</guid>
      <pubDate>Tue, 20 May 2025 10:00:00 GMT</pubDate>
      <itunes:duration>01:02:03</itunes:duration>
      <itunes:season>2</itunes:season>
      <itunes:episode>17</itunes:episode>
      <link>https://example.com/ep1</link>
    </item>
    <item>
      <title>News round-up</title>
      <description>Just news.</description>
      <enclosure url="https://example.com/ep2.mp3" type="audio/mpeg" length="456"/>
      <guid>guid-ep-2</guid>
      <pubDate>Tue, 27 May 2025 10:00:00 &#43;0000</pubDate>
      <itunes:duration>754</itunes:duration>
    </item>
  </channel>
</rss>`;

test("parseFeed: channel metadata (title, podcast:guid, itunes:image)", () => {
  const { show } = parseFeed(FIXTURE_XML);
  assert.equal(show.title, "Test Lorecast");
  assert.equal(show.podcastGuid, "cc233adb-de43-49be-bb76-9720292ddc98");
  assert.equal(show.imageUrl, "https://example.com/cover.jpg");
});

test("parseFeed: episode count + namespaced per-item fields", () => {
  const { episodes } = parseFeed(FIXTURE_XML);
  assert.equal(episodes.length, 2);

  const e1 = episodes[0];
  // itunes:title wins over title; numeric entity &#39; decoded to apostrophe
  assert.equal(e1.title, "Konrad Curze & The Night Lords' Doom");
  assert.equal(e1.guid, "guid-ep-1");
  // &amp; in the enclosure URL decoded to a bare &
  assert.equal(e1.audioUrl, "https://example.com/ep1.mp3?a=1&b=2");
  assert.equal(e1.link, "https://example.com/ep1");
  assert.equal(e1.durationSec, 3723); // 01:02:03
  assert.equal(e1.season, 2);
  assert.equal(e1.episode, 17);
  assert.equal(e1.pubDate, "2025-05-20T10:00:00.000Z"); // RFC-822 → ISO
  // description HTML stripped to text (CDATA + entity decoded), blocks spaced
  assert.ok(e1.descriptionText.includes("Konrad Curze"));
  assert.ok(e1.descriptionText.includes("Imperial Guard"));
  assert.ok(!e1.descriptionText.includes("<"));

  const e2 = episodes[1];
  assert.equal(e2.title, "News round-up"); // falls back to <title>
  assert.equal(e2.durationSec, 754); // raw seconds
  // pubDate timezone encoded as &#43;0000 still parses to ISO
  assert.equal(e2.pubDate, "2025-05-27T10:00:00.000Z");
  assert.equal(e2.season, null);
  assert.equal(e2.episode, null);
});

test("decodeEntities: numeric, hex, named; unknown passes through", () => {
  assert.equal(decodeEntities("a &#43; b"), "a + b");
  assert.equal(decodeEntities("Konrad&#39;s"), "Konrad's");
  assert.equal(decodeEntities("&#x27;"), "'");
  assert.equal(decodeEntities("Tom &amp; Jerry"), "Tom & Jerry");
  assert.equal(decodeEntities("5 &lt; 6 &gt; 4"), "5 < 6 > 4");
  assert.equal(decodeEntities("&notareal; stays"), "&notareal; stays");
});

// --- htmlToText --------------------------------------------------------------

test("htmlToText: strips tags, collapses whitespace, separates blocks", () => {
  assert.equal(htmlToText("<p>Hello</p><p>World</p>"), "Hello World");
  assert.equal(htmlToText("a<br>b"), "a b");
  assert.equal(htmlToText("  <b>x</b>   <i>y</i> "), "x y");
  assert.equal(htmlToText(""), "");
});

// --- parseDurationToSeconds --------------------------------------------------

test("parseDurationToSeconds: HH:MM:SS / MM:SS / raw / junk", () => {
  assert.equal(parseDurationToSeconds("01:02:03"), 3723);
  assert.equal(parseDurationToSeconds("12:34"), 754);
  assert.equal(parseDurationToSeconds("3600"), 3600);
  assert.equal(parseDurationToSeconds("0"), 0);
  assert.equal(parseDurationToSeconds(""), null);
  assert.equal(parseDurationToSeconds("abc"), null);
  assert.equal(parseDurationToSeconds("1:2:3:4"), null);
  assert.equal(parseDurationToSeconds(null), null);
});

// --- resolveEpisodeTags: reuses the alias module -----------------------------

test("resolve: registered alias forms → canonical tags (faction)", () => {
  const extraction: EpisodeExtraction = {
    episodeKind: "lore",
    characters: emptyAxis(),
    factions: { primary: ["Imperial Guard"], mentioned: ["Dark Eldar"] },
    locations: emptyAxis(),
  };
  const { tags, unresolved } = resolveEpisodeTags(extraction);

  const guard = findTag(tags, "faction", "astra_militarum");
  assert.ok(guard, "Imperial Guard → faction astra_militarum");
  assert.equal(guard.role, "subject");
  assert.equal(guard.matchedVia, "alias");
  assert.equal(guard.confidence, 0.9);

  const dEldar = findTag(tags, "faction", "eldar");
  assert.ok(dEldar, "Dark Eldar → faction eldar");
  assert.equal(dEldar.role, "mentioned");

  assert.equal(unresolved.length, 0);
});

test("resolve: unknown surface-form → unresolved (never auto-created)", () => {
  const extraction: EpisodeExtraction = {
    episodeKind: "lore",
    characters: { primary: ["Not A Real Entity XYZ"], mentioned: [] },
    factions: emptyAxis(),
    locations: emptyAxis(),
  };
  const { tags, unresolved } = resolveEpisodeTags(extraction);
  assert.equal(tags.length, 0);
  assert.equal(unresolved.length, 1);
  assert.equal(unresolved[0].rawName, "Not A Real Entity XYZ");
  assert.equal(unresolved[0].axisGuess, "character");
  assert.equal(unresolved[0].role, "subject");
});

test("resolve: dedup keeps subject over mentioned for the same entity", () => {
  const extraction: EpisodeExtraction = {
    episodeKind: "lore",
    characters: emptyAxis(),
    factions: { primary: ["Imperial Guard"], mentioned: ["Imperial Guard"] },
    locations: emptyAxis(),
  };
  const { tags } = resolveEpisodeTags(extraction);
  const guard = tags.filter((t) => t.type === "faction" && t.canonicalId === "astra_militarum");
  assert.equal(guard.length, 1, "deduped to a single tag");
  assert.equal(guard[0].role, "subject", "subject wins");
});

// --- serializeArtifact: deterministic + sorted -------------------------------

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

function buildSampleArtifact() {
  const results: EpisodeResult[] = [
    {
      episode: ep({ guid: "b", title: "Later", pubDate: "2025-05-27T10:00:00.000Z" }),
      extraction: { episodeKind: "news_recap", characters: emptyAxis(), factions: emptyAxis(), locations: emptyAxis() },
      tags: [],
      unresolved: [],
    },
    {
      episode: ep({ guid: "a", title: "Earlier", pubDate: "2025-05-20T10:00:00.000Z" }),
      extraction: { episodeKind: "lore", characters: emptyAxis(), factions: { primary: ["Imperial Guard"], mentioned: [] }, locations: emptyAxis() },
      tags: resolveEpisodeTags({ episodeKind: "lore", characters: emptyAxis(), factions: { primary: ["Imperial Guard"], mentioned: [] }, locations: emptyAxis() }).tags,
      unresolved: [],
    },
  ];
  return buildShowArtifact({
    show: { slug: "x", title: "X", feedUrl: "https://f", appleId: null, podcastGuid: null, imageUrl: null },
    model: "claude-sonnet-4-6",
    promptVersion: "deadbeef0000",
    results,
  });
}

test("serializeArtifact: byte-stable across two serializations", () => {
  const a = buildSampleArtifact();
  const b = buildSampleArtifact();
  assert.equal(serializeArtifact(a), serializeArtifact(b));
  assert.ok(serializeArtifact(a).endsWith("\n"), "trailing newline");
});

test("buildShowArtifact: episodes sorted by (pubDate, guid)", () => {
  const a = buildSampleArtifact();
  assert.equal(a.episodes.length, 2);
  assert.equal(a.episodes[0].pubDate, "2025-05-20T10:00:00.000Z"); // earlier first
  assert.equal(a.episodes[1].pubDate, "2025-05-27T10:00:00.000Z");
  assert.equal(a.episodes[0].episodeKind, "lore");
  assert.equal(a.episodes[0].tags.length, 1);
});

console.log(`\npodcast-ingest: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
