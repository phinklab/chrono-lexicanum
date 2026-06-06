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
import {
  appleUrlFromId,
  buildEpisodeLinks,
  buildShowLinks,
  enrichLink,
  sortLinks,
} from "../src/lib/ingestion/podcast/links";
import {
  DEFAULT_SHOW_SLUG,
  getShow,
  loadRegistry,
  parseRegistry,
  selectShows,
  type PodcastShowConfig,
} from "../src/lib/ingestion/podcast/registry";
import { resolveEpisodeTags } from "../src/lib/ingestion/podcast/resolve";
import type {
  EpisodeExtraction,
  EpisodeTag,
  PodcastEpisode,
  PodcastLink,
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
    show: { slug: "x", title: "X", feedUrl: "https://f", appleId: null, podcastGuid: null, imageUrl: null, links: [] },
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

// --- registry: parse + validation (Brief 122 B1-S2) --------------------------

function cfg(partial: Partial<PodcastShowConfig> & { slug: string }): PodcastShowConfig {
  return {
    slug: partial.slug,
    title: partial.title ?? partial.slug,
    feedUrl: partial.feedUrl ?? "https://example.com/feed.xml",
    appleId: partial.appleId ?? null,
    podcastGuid: partial.podcastGuid ?? null,
    links: partial.links ?? [],
    youtubeChannelUrl: partial.youtubeChannelUrl ?? null,
    youtubeChannelId: partial.youtubeChannelId ?? null,
  };
}

test("parseRegistry: valid entries → configs with defaults", () => {
  const shows = parseRegistry([
    { slug: "a", title: "A", feedUrl: "https://a/feed" },
    {
      slug: "b",
      title: "B",
      feedUrl: "https://b/feed",
      appleId: "123",
      podcastGuid: "g",
      links: [{ serviceId: "official_website", url: "https://b.com" }],
    },
  ]);
  assert.equal(shows.length, 2);
  assert.equal(shows[0].slug, "a");
  assert.equal(shows[0].appleId, null);
  assert.equal(shows[0].podcastGuid, null);
  assert.deepEqual(shows[0].links, []);
  assert.equal(shows[1].appleId, "123");
  assert.equal(shows[1].links[0].serviceId, "official_website");
});

test("parseRegistry: top-level must be an array", () => {
  assert.throws(() => parseRegistry({}), /must be an array/);
});

test("parseRegistry: missing required field throws", () => {
  assert.throws(() => parseRegistry([{ slug: "a", title: "A" }]), /feedUrl/);
});

test("parseRegistry: duplicate slug throws", () => {
  assert.throws(
    () =>
      parseRegistry([
        { slug: "dup", title: "A", feedUrl: "https://a" },
        { slug: "dup", title: "B", feedUrl: "https://b" },
      ]),
    /duplicate slug/,
  );
});

test("parseRegistry: link with unknown serviceId and no kind throws", () => {
  assert.throws(
    () =>
      parseRegistry([
        { slug: "a", title: "A", feedUrl: "https://a", links: [{ serviceId: "mystery", url: "https://x" }] },
      ]),
    /SERVICE_LINK_SPEC default/,
  );
});

test("parseRegistry: unknown serviceId with explicit kind/sourceKind/confidence passes", () => {
  const shows = parseRegistry([
    {
      slug: "a",
      title: "A",
      feedUrl: "https://a",
      links: [{ serviceId: "patreon", url: "https://p", kind: "reference", sourceKind: "manual", confidence: 1 }],
    },
  ]);
  assert.equal(shows[0].links[0].serviceId, "patreon");
  assert.equal(shows[0].links[0].kind, "reference");
});

test("parseRegistry: bad link kind throws", () => {
  assert.throws(
    () =>
      parseRegistry([
        { slug: "a", title: "A", feedUrl: "https://a", links: [{ serviceId: "youtube", url: "https://x", kind: "stream" }] },
      ]),
    /external_link_kind/,
  );
});

// --- registry: show selection (the pure core of the ingest CLI) --------------

test("getShow: found / unknown throws", () => {
  const reg = [cfg({ slug: "a" }), cfg({ slug: "b" })];
  assert.equal(getShow(reg, "b").slug, "b");
  assert.throws(() => getShow(reg, "zzz"), /no show with slug/);
});

test("selectShows: default → pilot, --show, --all, unknown throws", () => {
  const reg = [cfg({ slug: DEFAULT_SHOW_SLUG }), cfg({ slug: "other" })];
  assert.deepEqual(
    selectShows(reg, {}).map((s) => s.slug),
    [DEFAULT_SHOW_SLUG],
    "no flag → default (pilot)",
  );
  assert.deepEqual(selectShows(reg, { show: "other" }).map((s) => s.slug), ["other"]);
  assert.deepEqual(
    selectShows(reg, { all: true }).map((s) => s.slug),
    [DEFAULT_SHOW_SLUG, "other"],
    "--all → every show in registry order",
  );
  assert.throws(() => selectShows(reg, { show: "ghost" }), /no show with slug/);
});

// --- links: derivation, enrichment, dedup + determinism ----------------------

test("appleUrlFromId: region-neutral id form", () => {
  assert.equal(appleUrlFromId("123"), "https://podcasts.apple.com/podcast/id123");
});

test("enrichLink: fills kind/sourceKind/confidence from SERVICE_LINK_SPEC", () => {
  const rss = enrichLink({ serviceId: "rss", url: "https://f" });
  assert.equal(rss.kind, "listen");
  assert.equal(rss.sourceKind, "podcast_rss");
  assert.equal(rss.confidence, 1);

  const site = enrichLink({ serviceId: "official_website", url: "https://s" });
  assert.equal(site.kind, "official_page");
  assert.equal(site.sourceKind, "manual");
});

test("buildShowLinks: derives RSS + Apple, appends registry links, sorted + deduped", () => {
  const links = buildShowLinks(
    cfg({
      slug: "s",
      feedUrl: "https://feed/x",
      appleId: "999",
      links: [
        { serviceId: "official_website", url: "https://site" },
        { serviceId: "spotify", url: "https://open.spotify.com/show/abc" },
        // exact duplicate of the derived RSS feed link → must dedup away
        { serviceId: "rss", url: "https://feed/x" },
      ],
    }),
  );
  // sorted by (serviceId, kind, url)
  assert.deepEqual(
    links.map((l) => `${l.serviceId}:${l.kind}`),
    ["apple_podcasts:listen", "official_website:official_page", "rss:listen", "spotify:listen"],
  );
  const rss = links.find((l) => l.serviceId === "rss");
  assert.ok(rss);
  assert.equal(rss.url, "https://feed/x");
  assert.equal(rss.sourceKind, "podcast_rss");
  const apple = links.find((l) => l.serviceId === "apple_podcasts");
  assert.ok(apple);
  assert.equal(apple.url, "https://podcasts.apple.com/podcast/id999");
  assert.equal(apple.sourceKind, "manual");
});

test("buildShowLinks: no appleId → no apple link; deterministic", () => {
  const c = cfg({ slug: "s", feedUrl: "https://feed", appleId: null });
  const a = buildShowLinks(c);
  const b = buildShowLinks(c);
  assert.deepEqual(a, b);
  assert.ok(!a.some((l) => l.serviceId === "apple_podcasts"));
  assert.equal(a.length, 1); // just the derived RSS feed
  assert.equal(a[0].serviceId, "rss");
});

test("buildEpisodeLinks: audio enclosure → one rss/listen/podcast_rss link; absent → none", () => {
  const withAudio = buildEpisodeLinks(ep({ guid: "g", audioUrl: "https://a.mp3" }));
  assert.equal(withAudio.length, 1);
  assert.equal(withAudio[0].serviceId, "rss");
  assert.equal(withAudio[0].kind, "listen");
  assert.equal(withAudio[0].sourceKind, "podcast_rss");
  assert.equal(withAudio[0].url, "https://a.mp3");
  assert.deepEqual(buildEpisodeLinks(ep({ guid: "g", audioUrl: null })), []);
});

// --- artifact carries the new link-shape (deterministically) -----------------

test("artifact: show + episode links present and byte-stable", () => {
  const showLinks = buildShowLinks(cfg({ slug: "x", feedUrl: "https://f", appleId: "1" }));
  const build = () =>
    buildShowArtifact({
      show: {
        slug: "x",
        title: "X",
        feedUrl: "https://f",
        appleId: "1",
        podcastGuid: null,
        imageUrl: null,
        links: showLinks,
      },
      model: "claude-sonnet-4-6",
      promptVersion: "deadbeef0000",
      results: [
        {
          episode: ep({ guid: "a", pubDate: "2025-05-20T10:00:00.000Z", audioUrl: "https://a.mp3" }),
          extraction: { episodeKind: "lore", characters: emptyAxis(), factions: emptyAxis(), locations: emptyAxis() },
          tags: [],
          unresolved: [],
        },
      ],
    });
  const art = build();
  assert.ok(art.show.links.length >= 2, "show carries derived rss + apple links");
  assert.equal(art.episodes[0].links.length, 1);
  assert.equal(art.episodes[0].links[0].serviceId, "rss");
  assert.equal(art.episodes[0].links[0].url, "https://a.mp3");
  assert.equal(serializeArtifact(art), serializeArtifact(build()), "byte-stable with links");
});

// --- the committed registry parses and exposes both shows --------------------

test("loadRegistry: committed registry parses; pilot + adeptus present with full link set", () => {
  const reg = loadRegistry();
  const slugs = reg.map((s) => s.slug);
  assert.ok(slugs.includes("the-40k-lorecast"), "pilot present");
  assert.ok(slugs.includes("adeptus-ridiculous"), "adeptus present");

  const pilotLinks = new Set(buildShowLinks(getShow(reg, "the-40k-lorecast")).map((l) => l.serviceId));
  for (const svc of ["rss", "apple_podcasts", "official_website", "spotify", "youtube"]) {
    assert.ok(pilotLinks.has(svc), `pilot show links include ${svc}`);
  }
});

// --- review hardening (B1-S2 adversarial review) -----------------------------

test("parseRegistry: confidence outside [0, 1] throws", () => {
  for (const c of [1.5, -0.1]) {
    assert.throws(
      () =>
        parseRegistry([
          {
            slug: "a",
            title: "A",
            feedUrl: "https://a",
            links: [{ serviceId: "spotify", url: "https://x", confidence: c }],
          },
        ]),
      /\[0, 1\]/,
      `confidence ${c} must be rejected`,
    );
  }
  // boundary values are allowed
  assert.doesNotThrow(() =>
    parseRegistry([
      { slug: "a", title: "A", feedUrl: "https://a", links: [{ serviceId: "spotify", url: "https://x", confidence: 0 }] },
    ]),
  );
});

test("enrichLink: under-specified unknown service throws", () => {
  assert.throws(() => enrichLink({ serviceId: "mystery", url: "https://x" }), /under-specified/);
  // …but an unknown service WITH explicit fields enriches fine
  const ok = enrichLink({ serviceId: "patreon", url: "https://p", kind: "reference", sourceKind: "manual", confidence: 0.8 });
  assert.equal(ok.kind, "reference");
  assert.equal(ok.confidence, 0.8);
});

test("sortLinks: (serviceId, kind, url) order, independent of input permutation", () => {
  const mk = (serviceId: string, kind: PodcastLink["kind"], url: string): PodcastLink => ({
    serviceId,
    kind,
    url,
    sourceKind: "manual",
    confidence: 1,
  });
  const a = mk("youtube", "watch", "u");
  const b = mk("apple_podcasts", "listen", "a");
  const c = mk("rss", "listen", "r2");
  const d = mk("rss", "listen", "r1");
  assert.deepEqual(
    sortLinks([a, b, c, d]).map((l) => `${l.serviceId}/${l.url}`),
    ["apple_podcasts/a", "rss/r1", "rss/r2", "youtube/u"],
  );
  // two different input orders → identical sorted output (comparator is total)
  assert.deepEqual(sortLinks([a, b, c, d]), sortLinks([d, c, b, a]));
  assert.deepEqual(sortLinks([c, a, d, b]), sortLinks([b, d, a, c]));
});

test("buildShowLinks: duplicate (serviceId, kind, url) dedups to the first occurrence", () => {
  // Same spotify URL twice, second with a lower confidence override → first wins.
  const links = buildShowLinks(
    cfg({
      slug: "s",
      feedUrl: "https://feed",
      appleId: null,
      links: [
        { serviceId: "spotify", url: "https://open.spotify.com/show/x" }, // confidence 1 (spec)
        { serviceId: "spotify", url: "https://open.spotify.com/show/x", confidence: 0.5 },
      ],
    }),
  );
  const spotify = links.filter((l) => l.serviceId === "spotify");
  assert.equal(spotify.length, 1, "deduped to a single spotify link");
  assert.equal(spotify[0].confidence, 1, "first occurrence's metadata wins");
});

console.log(`\npodcast-ingest: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
