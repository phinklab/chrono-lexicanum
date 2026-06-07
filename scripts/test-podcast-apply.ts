/**
 * Unit tests for the podcast apply-plan (`src/lib/ingestion/podcast/apply-plan.ts`)
 * — Brief 114 Step 2. DB-free, network-free, analog to `test:apply-override-dry`:
 * it proves the apply's contract without touching Postgres.
 *
 * Proven here:
 *   • validation — `assertShowArtifact` throws on every malformed shape AND on
 *     the two DB constraints the plan must not violate (duplicate episode guids,
 *     colliding/oversized derived slugs);
 *   • determinism — `buildApplyPlan` is pure; same artifact + refs → deep-equal
 *     plan (this is the "dry-run builds a plan, writes nothing" proof at unit level);
 *   • FK-safety — only tags whose canonicalId is in the reference set become
 *     junction rows; the rest are dropped + reported;
 *   • invariant — unresolved forms never become junctions;
 *   • links (Brief 122 B1-S3) — the artifact's show + episode `links[]` are
 *     projected into the plan (deduped + sorted, legacy/missing provenance
 *     defaulted to manual/1.00), and the in-memory applier replaces each work's
 *     external_links authoritatively, so a double-apply yields NO link duplicates;
 *   • idempotency — applying a plan to an in-memory store that MIRRORS
 *     apply-podcast.ts's semantics (match show by guid→feed→slug, match episode
 *     by (show,guid), freeze the works row, delete-then-insert junctions AND
 *     external_links) TWICE yields a byte-identical store: no duplicate works,
 *     no junction drift, no link drift.
 *
 * The in-memory applier deliberately re-implements the script's write shape (the
 * script uses Drizzle/SQL) — the SHARED, authoritative piece is the plan from
 * `buildApplyPlan`. Live double-apply idempotency against Supabase is verified
 * separately in the impl report (Brief 114 acceptance (h)).
 *
 *   npm run test:podcast-apply
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  assertShowArtifact,
  buildApplyPlan,
  deriveEpisodeSlug,
  DEFAULT_LINK_CONFIDENCE,
  DEFAULT_LINK_SOURCE_KIND,
  MAX_SLUG_LENGTH,
  type ApplyPlan,
  type EpisodePlan,
  type JunctionRow,
  type ReferenceSets,
} from "../src/lib/ingestion/podcast/apply-plan";
import type { AliasAxis } from "../src/lib/aliases";
import type { PodcastLink, ShowArtifact } from "../src/lib/ingestion/podcast/types";

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

// --- fixtures ----------------------------------------------------------------

/** A valid two-episode artifact. canonicalIds are arbitrary test ids; the tests
 *  control which ones the reference set contains. */
function validArtifact(): ShowArtifact {
  return {
    $generatedBy: "test",
    show: {
      slug: "test-show",
      title: "Test Show",
      feedUrl: "https://example.com/feed.xml",
      appleId: "123",
      podcastGuid: "guid-show-1",
      imageUrl: "https://example.com/cover.jpg",
      episodeCount: 2,
      links: [
        { serviceId: "rss", kind: "listen", url: "https://example.com/feed.xml", sourceKind: "podcast_rss", confidence: 1 },
        { serviceId: "apple_podcasts", kind: "listen", url: "https://podcasts.apple.com/podcast/id123", sourceKind: "manual", confidence: 1 },
        { serviceId: "official_website", kind: "official_page", url: "https://example.com/", sourceKind: "manual", confidence: 1 },
      ],
    },
    extraction: { model: "m", promptVersion: "v" },
    episodes: [
      {
        guid: "ep-1",
        title: "Episode One",
        pubDate: "2025-01-01T00:00:00.000Z",
        durationSec: 100,
        audioUrl: "https://example.com/1.mp3",
        link: "https://example.com/1",
        episodeKind: "lore",
        tags: [
          { type: "character", canonicalId: "konrad_curze", rawName: "Konrad Curze", role: "subject", confidence: 1, matchedVia: "canonical-name" },
          { type: "faction", canonicalId: "night_lords", rawName: "Night Lords", role: "mentioned", confidence: 0.9, matchedVia: "alias" },
          { type: "location", canonicalId: "nostramo", rawName: "Nostramo", role: "subject", confidence: 1, matchedVia: "canonical-name" },
        ],
        unresolved: [{ rawName: "Some Common Noun", axisGuess: "character", role: "mentioned" }],
        links: [
          { serviceId: "rss", kind: "listen", url: "https://example.com/1.mp3", sourceKind: "podcast_rss", confidence: 1 },
        ],
      },
      {
        guid: "ep-2",
        title: "Episode Two",
        pubDate: "2025-01-08T00:00:00.000Z",
        durationSec: 200,
        audioUrl: "https://example.com/2.mp3",
        link: "https://example.com/2",
        episodeKind: "news_recap",
        tags: [],
        unresolved: [],
        links: [
          { serviceId: "rss", kind: "listen", url: "https://example.com/2.mp3", sourceKind: "podcast_rss", confidence: 1 },
        ],
      },
    ],
  };
}

/** Reference set covering every canonicalId in the valid fixture. */
function refsForValid(): ReferenceSets {
  return {
    character: new Set(["konrad_curze"]),
    faction: new Set(["night_lords"]),
    location: new Set(["nostramo"]),
  };
}

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

// --- 1. validation -----------------------------------------------------------

test("validate: a well-formed artifact passes", () => {
  assert.doesNotThrow(() => assertShowArtifact(validArtifact()));
});

test("validate: missing show throws", () => {
  const a = clone(validArtifact()) as unknown as Record<string, unknown>;
  delete a.show;
  assert.throws(() => assertShowArtifact(a), /show/);
});

test("validate: empty show.slug throws", () => {
  const a = clone(validArtifact());
  a.show.slug = "";
  assert.throws(() => assertShowArtifact(a), /show\.slug/);
});

test("validate: episodes not an array throws", () => {
  const a = clone(validArtifact()) as unknown as Record<string, unknown>;
  a.episodes = "nope";
  assert.throws(() => assertShowArtifact(a), /episodes/);
});

test("validate: episode without title throws", () => {
  const a = clone(validArtifact()) as unknown as { episodes: Array<Record<string, unknown>> };
  delete a.episodes[0].title;
  assert.throws(() => assertShowArtifact(a), /title/);
});

test("validate: duplicate episode guid throws (per-show UNIQUE)", () => {
  const a = clone(validArtifact());
  a.episodes[1].guid = a.episodes[0].guid;
  assert.throws(() => assertShowArtifact(a), /duplicate episode guid/);
});

test("validate: unknown tag axis throws", () => {
  const a = clone(validArtifact());
  (a.episodes[0].tags[0] as { type: string }).type = "weapon";
  assert.throws(() => assertShowArtifact(a), /axis/);
});

test("validate: bad tag role throws (must be subject|mentioned)", () => {
  const a = clone(validArtifact());
  (a.episodes[0].tags[0] as { role: string }).role = "pov";
  assert.throws(() => assertShowArtifact(a), /subject\|mentioned/);
});

test("validate: empty canonicalId throws", () => {
  const a = clone(validArtifact());
  a.episodes[0].tags[0].canonicalId = "";
  assert.throws(() => assertShowArtifact(a), /canonicalId/);
});

test("validate: unknown episodeKind throws", () => {
  const a = clone(validArtifact());
  (a.episodes[0] as { episodeKind: string }).episodeKind = "rant";
  assert.throws(() => assertShowArtifact(a), /EpisodeKind/);
});

test("validate: oversized derived slug throws", () => {
  const a = clone(validArtifact());
  a.episodes[0].guid = "x".repeat(MAX_SLUG_LENGTH + 10);
  assert.throws(() => assertShowArtifact(a), /longer than/);
});

test("validate: colliding derived slugs throw", () => {
  const a = clone(validArtifact());
  // "Ep 1" and "Ep-1" both slugify (with the show slug) to the same value.
  a.episodes[0].guid = "Ep 1";
  a.episodes[1].guid = "Ep-1";
  assert.throws(() => assertShowArtifact(a), /collision/);
});

// --- 2. deriveEpisodeSlug ----------------------------------------------------

test("slug: deterministic and stable", () => {
  assert.equal(
    deriveEpisodeSlug("the-40k-lorecast", "Buzzsprout-13658961"),
    deriveEpisodeSlug("the-40k-lorecast", "Buzzsprout-13658961"),
  );
  assert.equal(
    deriveEpisodeSlug("the-40k-lorecast", "Buzzsprout-13658961"),
    "the-40k-lorecast-buzzsprout-13658961",
  );
});

test("slug: distinct guids → distinct slugs", () => {
  const a = deriveEpisodeSlug("show", "g1");
  const b = deriveEpisodeSlug("show", "g2");
  assert.notEqual(a, b);
});

// --- 3. determinism ----------------------------------------------------------

test("plan: byte-deterministic across two builds", () => {
  const art = validArtifact();
  const p1 = buildApplyPlan(art, refsForValid());
  const p2 = buildApplyPlan(art, refsForValid());
  assert.deepEqual(p1, p2);
});

test("plan: building a plan mutates neither the artifact nor an empty store (dry-run = no write)", () => {
  const art = validArtifact();
  const before = clone(art);
  const store = emptyStore();
  buildApplyPlan(art, refsForValid()); // build only — the dry-run path
  assert.deepEqual(art, before, "artifact untouched");
  assert.deepEqual(snapshot(store), snapshot(emptyStore()), "no store writes from building a plan");
});

// --- 4. FK-safety + 5. unresolved invariant ----------------------------------

test("plan: tag whose canonicalId is absent from refs is dropped + reported", () => {
  const art = validArtifact();
  // Drop the location ref only.
  const refs: ReferenceSets = {
    character: new Set(["konrad_curze"]),
    faction: new Set(["night_lords"]),
    location: new Set(), // nostramo missing
  };
  const plan = buildApplyPlan(art, refs);
  assert.equal(plan.report.droppedMissingRefCount, 1);
  assert.equal(plan.droppedMissingRef[0].canonicalId, "nostramo");
  assert.equal(plan.droppedMissingRef[0].axis, "location");
  // … and it never reaches a junction.
  assert.equal(plan.episodes[0].junctions.location.length, 0);
  assert.equal(plan.episodes[0].junctions.character.length, 1);
  assert.equal(plan.episodes[0].junctions.faction.length, 1);
});

test("plan: empty reference set drops every tag (no FK violations possible)", () => {
  const art = validArtifact();
  const empty: ReferenceSets = { character: new Set(), faction: new Set(), location: new Set() };
  const plan = buildApplyPlan(art, empty);
  assert.equal(plan.report.resolvedTagCount, 0);
  assert.equal(plan.report.droppedMissingRefCount, 3);
  for (const ep of plan.episodes) {
    assert.equal(ep.junctions.character.length, 0);
    assert.equal(ep.junctions.faction.length, 0);
    assert.equal(ep.junctions.location.length, 0);
  }
});

test("plan: unresolved forms are counted but never become junctions", () => {
  const art = validArtifact();
  const plan = buildApplyPlan(art, refsForValid());
  assert.equal(plan.report.unresolvedFormCount, 1);
  // The only unresolved rawName ("Some Common Noun") must not surface as any
  // junction's rawName.
  const allRawNames = new Set<string>();
  for (const ep of plan.episodes) {
    for (const axis of ["character", "faction", "location"] as const) {
      for (const j of ep.junctions[axis]) allRawNames.add(j.rawName);
    }
  }
  assert.ok(!allRawNames.has("Some Common Noun"));
});

test("plan: junction role is the artifact's subject|mentioned, verbatim", () => {
  const plan = buildApplyPlan(validArtifact(), refsForValid());
  const ep1 = plan.episodes[0];
  assert.equal(ep1.junctions.character[0].role, "subject");
  assert.equal(ep1.junctions.faction[0].role, "mentioned");
});

test("plan: same entity twice on one episode dedups to one row, subject wins", () => {
  const art = validArtifact();
  art.episodes[0].tags = [
    { type: "character", canonicalId: "konrad_curze", rawName: "Curze", role: "mentioned", confidence: 0.9, matchedVia: "alias" },
    { type: "character", canonicalId: "konrad_curze", rawName: "Konrad Curze", role: "subject", confidence: 1, matchedVia: "canonical-name" },
  ];
  const plan = buildApplyPlan(art, refsForValid());
  assert.equal(plan.episodes[0].junctions.character.length, 1);
  assert.equal(plan.episodes[0].junctions.character[0].role, "subject");
});

// --- 5b. links: projection + validation (Brief 122 B1-S3) --------------------

test("plan: show + episode links are projected into the plan + report", () => {
  const plan = buildApplyPlan(validArtifact(), refsForValid());
  assert.equal(plan.show.links.length, 3);
  assert.equal(plan.report.showLinkCount, 3);
  assert.equal(plan.episodes[0].links.length, 1);
  assert.equal(plan.episodes[1].links.length, 1);
  assert.equal(plan.report.episodeLinkCount, 2);
  // Provenance carried verbatim from the artifact — never re-derived.
  const rss = plan.show.links.find((l) => l.serviceId === "rss");
  assert.ok(rss, "rss show link present");
  assert.equal(rss.sourceKind, "podcast_rss");
  assert.equal(rss.confidence, 1);
});

test("plan: links are sorted by (serviceId, kind, url) regardless of input order", () => {
  const a = validArtifact();
  a.show.links = [...a.show.links].reverse(); // feed them out of order
  const plan = buildApplyPlan(a, refsForValid());
  const services = plan.show.links.map((l) => l.serviceId);
  assert.deepEqual(services, [...services].sort(), "deterministic link order");
});

test("plan: duplicate links on one scope dedup to a single row (first wins)", () => {
  const a = validArtifact();
  a.show.links = [
    { serviceId: "rss", kind: "listen", url: "https://x/feed.xml", sourceKind: "podcast_rss", confidence: 1 },
    { serviceId: "rss", kind: "listen", url: "https://x/feed.xml", sourceKind: "podcast_rss", confidence: 1 },
  ];
  const plan = buildApplyPlan(a, refsForValid());
  assert.equal(plan.show.links.length, 1);
  assert.equal(plan.report.showLinkCount, 1);
});

test("plan: a link missing sourceKind/confidence defaults to manual/1.00 (legacy entry)", () => {
  const a = validArtifact() as unknown as { show: { links: Array<Record<string, unknown>> } };
  a.show.links = [{ serviceId: "spotify", kind: "listen", url: "https://open.spotify.com/show/x" }];
  const plan = buildApplyPlan(a as unknown as ShowArtifact, refsForValid());
  assert.equal(plan.show.links.length, 1);
  assert.equal(plan.show.links[0].sourceKind, DEFAULT_LINK_SOURCE_KIND);
  assert.equal(plan.show.links[0].confidence, DEFAULT_LINK_CONFIDENCE);
});

test("plan: an artifact with NO links arrays is tolerated (pre-S2 legacy artifact)", () => {
  const a = validArtifact() as unknown as {
    show: Record<string, unknown>;
    episodes: Array<Record<string, unknown>>;
  };
  delete a.show.links;
  for (const ep of a.episodes) delete ep.links;
  const plan = buildApplyPlan(a as unknown as ShowArtifact, refsForValid());
  assert.equal(plan.show.links.length, 0);
  assert.equal(plan.report.showLinkCount, 0);
  assert.equal(plan.report.episodeLinkCount, 0);
});

test("validate: link with unknown kind throws (external_link_kind guard)", () => {
  const a = clone(validArtifact());
  (a.show.links[0] as { kind: string }).kind = "subscribe";
  assert.throws(() => assertShowArtifact(a), /external_link_kind/);
});

test("validate: link with empty serviceId throws (services FK)", () => {
  const a = clone(validArtifact());
  a.show.links[0].serviceId = "";
  assert.throws(() => assertShowArtifact(a), /serviceId/);
});

test("validate: bad sourceKind throws; youtube (Brief 130) is now accepted", () => {
  const bad = clone(validArtifact());
  (bad.show.links[0] as { sourceKind: string }).sourceKind = "lexicanum";
  assert.throws(() => assertShowArtifact(bad), /must be one of/);
  // youtube is a valid provenance now (PODCAST_LINK_SOURCE_KINDS gained it)
  const ok = clone(validArtifact());
  (ok.show.links[0] as { sourceKind: string }).sourceKind = "youtube";
  assert.doesNotThrow(() => assertShowArtifact(ok));
});

test("validate: link confidence out of [0,1] throws (numeric(3,2) guard)", () => {
  const a = clone(validArtifact());
  a.show.links[0].confidence = 1.5;
  assert.throws(() => assertShowArtifact(a), /\[0, 1\]/);
});

test("validate: an episode link is validated too (not only show links)", () => {
  const a = clone(validArtifact());
  (a.episodes[0].links[0] as { kind: string }).kind = "nonsense";
  assert.throws(() => assertShowArtifact(a), /external_link_kind/);
});

// --- 6. idempotency: an in-memory store mirroring apply-podcast.ts -----------

interface WorkRow {
  id: string;
  kind: string;
  slug: string;
  title: string;
}
interface EpisodeDetailRow {
  workId: string;
  podcastWorkId: string;
  episodeGuid: string;
  audioUrl: string | null;
  durationSec: number | null;
  pubDate: string | null;
  season: number | null;
  episode: number | null;
  episodeKind: string;
}
interface FakeStore {
  works: Map<string, WorkRow>;
  showByGuid: Map<string, string>;
  showByFeed: Map<string, string>;
  showBySlug: Map<string, string>;
  podcastDetails: Map<string, { workId: string; feedUrl: string; podcastGuid: string | null; appleId: string | null; imageUrl: string | null }>;
  episodeByShowGuid: Map<string, string>;
  episodeDetails: Map<string, EpisodeDetailRow>;
  junctions: { character: Map<string, JunctionRow[]>; faction: Map<string, JunctionRow[]>; location: Map<string, JunctionRow[]> };
  /** external_links keyed by work id (show id or episode id) — the work-scoped
   *  delete-then-insert store apply-podcast.ts maintains per podcast work. */
  externalLinks: Map<string, PodcastLink[]>;
}

function emptyStore(): FakeStore {
  return {
    works: new Map(),
    showByGuid: new Map(),
    showByFeed: new Map(),
    showBySlug: new Map(),
    podcastDetails: new Map(),
    episodeByShowGuid: new Map(),
    episodeDetails: new Map(),
    junctions: { character: new Map(), faction: new Map(), location: new Map() },
    externalLinks: new Map(),
  };
}

const cloneRow = (r: JunctionRow): JunctionRow => ({ entityId: r.entityId, role: r.role, rawName: r.rawName });
const cloneLink = (l: PodcastLink): PodcastLink => ({
  serviceId: l.serviceId,
  kind: l.kind,
  url: l.url,
  sourceKind: l.sourceKind,
  confidence: l.confidence,
});

/**
 * Mirrors apply-podcast.ts: show matched by podcastGuid → feedUrl → slug
 * (fake id = slug); episode matched by (showId, episodeGuid); the works row is
 * frozen after insert; the detail row and the three junction sets are refreshed
 * (delete-then-insert) every apply. The fake id IS the slug, which models
 * works.slug being UNIQUE NOT NULL.
 */
function simulateApply(plan: ApplyPlan, store: FakeStore): void {
  let showId: string | undefined =
    (plan.show.podcastGuid !== null ? store.showByGuid.get(plan.show.podcastGuid) : undefined) ??
    store.showByFeed.get(plan.show.feedUrl) ??
    store.showBySlug.get(plan.show.slug);
  if (showId === undefined) {
    showId = plan.show.slug;
    store.works.set(showId, { id: showId, kind: "podcast", slug: plan.show.slug, title: plan.show.title });
    store.showBySlug.set(plan.show.slug, showId);
  }
  store.podcastDetails.set(showId, {
    workId: showId,
    feedUrl: plan.show.feedUrl,
    podcastGuid: plan.show.podcastGuid,
    appleId: plan.show.appleId,
    imageUrl: plan.show.imageUrl,
  });
  if (plan.show.podcastGuid !== null) store.showByGuid.set(plan.show.podcastGuid, showId);
  store.showByFeed.set(plan.show.feedUrl, showId);
  // Authoritative replace of the show work's external_links.
  store.externalLinks.set(showId, plan.show.links.map(cloneLink));

  for (const ep of plan.episodes) {
    const key = `${showId}::${ep.episodeGuid}`;
    let epId = store.episodeByShowGuid.get(key);
    if (epId === undefined) {
      epId = ep.slug;
      store.episodeByShowGuid.set(key, epId);
      // works row created once; slug + title frozen thereafter.
      store.works.set(epId, { id: epId, kind: "podcast_episode", slug: ep.slug, title: ep.title });
    }
    store.episodeDetails.set(epId, {
      workId: epId,
      podcastWorkId: showId,
      episodeGuid: ep.episodeGuid,
      audioUrl: ep.audioUrl,
      durationSec: ep.durationSec,
      pubDate: ep.pubDate,
      season: ep.season,
      episode: ep.episode,
      episodeKind: ep.episodeKind,
    });
    // Authoritative per-episode replace.
    store.junctions.character.set(epId, ep.junctions.character.map(cloneRow));
    store.junctions.faction.set(epId, ep.junctions.faction.map(cloneRow));
    store.junctions.location.set(epId, ep.junctions.location.map(cloneRow));
    store.externalLinks.set(epId, ep.links.map(cloneLink));
  }
}

function sortEntries<V>(m: Map<string, V>): Array<[string, V]> {
  return [...m.entries()].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
}

/** Deterministic snapshot of the DATA tables (the rows a DB would hold). */
function snapshot(store: FakeStore): unknown {
  return {
    works: sortEntries(store.works),
    podcastDetails: sortEntries(store.podcastDetails),
    episodeDetails: sortEntries(store.episodeDetails),
    junctions: {
      character: sortEntries(store.junctions.character),
      faction: sortEntries(store.junctions.faction),
      location: sortEntries(store.junctions.location),
    },
    externalLinks: sortEntries(store.externalLinks),
  };
}

function totalJunctions(store: FakeStore): number {
  let n = 0;
  for (const axis of ["character", "faction", "location"] as const) {
    for (const rows of store.junctions[axis].values()) n += rows.length;
  }
  return n;
}

function totalLinks(store: FakeStore): number {
  let n = 0;
  for (const rows of store.externalLinks.values()) n += rows.length;
  return n;
}

test("apply: applying a plan twice is idempotent (no dup works, no junction drift)", () => {
  const plan = buildApplyPlan(validArtifact(), refsForValid());
  const store = emptyStore();

  simulateApply(plan, store);
  const after1 = snapshot(store);
  const works1 = store.works.size;
  const junctions1 = totalJunctions(store);

  simulateApply(plan, store);
  const after2 = snapshot(store);

  assert.deepEqual(after2, after1, "store is byte-identical after the second apply");
  assert.equal(store.works.size, works1, "no new works rows on re-apply");
  assert.equal(store.works.size, 1 + plan.episodes.length, "exactly 1 show + N episodes");
  assert.equal(totalJunctions(store), junctions1, "junction count unchanged");
  assert.equal(totalJunctions(store), plan.report.resolvedTagCount, "junctions == resolved tags");
});

test("apply: applying a plan twice produces no external_links duplicates (links stable)", () => {
  const plan = buildApplyPlan(validArtifact(), refsForValid());
  const store = emptyStore();

  simulateApply(plan, store);
  const links1 = totalLinks(store);

  simulateApply(plan, store);

  assert.equal(totalLinks(store), links1, "link count unchanged on re-apply (no duplicates)");
  // Every link row == the plan's projected show + episode links, no drift.
  assert.equal(
    totalLinks(store),
    plan.report.showLinkCount + plan.report.episodeLinkCount,
    "link rows == plan link counts",
  );
  // The show work + each episode work hold exactly their plan's link set.
  assert.equal((store.externalLinks.get(plan.show.slug) ?? []).length, plan.show.links.length);
  for (const ep of plan.episodes) {
    assert.equal((store.externalLinks.get(ep.slug) ?? []).length, ep.links.length);
  }
});

test("apply: re-applying an IMPROVED artifact replaces a stale link set (no leftovers)", () => {
  const store = emptyStore();

  // First apply: show has 3 links.
  simulateApply(buildApplyPlan(validArtifact(), refsForValid()), store);
  assert.equal((store.externalLinks.get("test-show") ?? []).length, 3);

  // Improved apply: the show's links shrank to a single one.
  const v2 = validArtifact();
  v2.show.links = [
    { serviceId: "rss", kind: "listen", url: "https://example.com/feed.xml", sourceKind: "podcast_rss", confidence: 1 },
  ];
  simulateApply(buildApplyPlan(v2, refsForValid()), store);

  // The two stale show links are gone — authoritative replace, not append.
  assert.equal((store.externalLinks.get("test-show") ?? []).length, 1, "stale show links removed");
});

test("apply: re-applying an IMPROVED artifact replaces a stale tag set (no leftovers)", () => {
  const store = emptyStore();

  // First apply: ep-1 has one resolved character.
  const v1 = validArtifact();
  v1.episodes[0].tags = [
    { type: "character", canonicalId: "konrad_curze", rawName: "Curze", role: "mentioned", confidence: 0.9, matchedVia: "alias" },
  ];
  v1.episodes[1].tags = [];
  simulateApply(buildApplyPlan(v1, refsForValid()), store);

  // Improved apply: ep-1's tag set changed entirely (different entity + role).
  const v2 = validArtifact();
  v2.episodes[0].tags = [
    { type: "faction", canonicalId: "night_lords", rawName: "Night Lords", role: "subject", confidence: 1, matchedVia: "canonical-name" },
  ];
  v2.episodes[1].tags = [];
  const plan2 = buildApplyPlan(v2, refsForValid());
  simulateApply(plan2, store);

  const ep1Id = deriveEpisodeSlug(v2.show.slug, v2.episodes[0].guid);
  // The stale character tag is gone; only the new faction tag remains.
  assert.equal((store.junctions.character.get(ep1Id) ?? []).length, 0, "stale character tag removed");
  assert.equal((store.junctions.faction.get(ep1Id) ?? []).length, 1, "new faction tag present");
  assert.equal(store.junctions.faction.get(ep1Id)![0].role, "subject");
  assert.equal(totalJunctions(store), plan2.report.resolvedTagCount);
});

test("apply: show matched by podcastGuid even if the slug changes (no duplicate show)", () => {
  const store = emptyStore();
  const v1 = validArtifact();
  simulateApply(buildApplyPlan(v1, refsForValid()), store);
  const showCount1 = [...store.works.values()].filter((w) => w.kind === "podcast").length;
  assert.equal(showCount1, 1);

  // Same podcastGuid, different slug → must update the SAME show, not insert a 2nd.
  const v2 = validArtifact();
  v2.show.slug = "test-show-renamed";
  simulateApply(buildApplyPlan(v2, refsForValid()), store);
  const showCount2 = [...store.works.values()].filter((w) => w.kind === "podcast").length;
  assert.equal(showCount2, 1, "matched on podcastGuid — no duplicate show work");
});

// --- 7. real committed artifact: end-to-end determinism + idempotency --------

test("real artifact: plan is deterministic and double-apply is idempotent", () => {
  const path = resolve(process.cwd(), "ingest/podcasts/the-40k-lorecast.json");
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    // Committed artifact; if it is ever absent, fail loudly rather than skip.
    throw new Error(`committed artifact not found at ${path}`);
  }
  const parsed: unknown = JSON.parse(raw);
  assertShowArtifact(parsed);
  const artifact = parsed;

  // Reference set that covers every canonicalId the artifact resolved — models a
  // DB where all referenced rows exist (so nothing is dropped for FK reasons).
  // Mutable Sets here; assignable to ReferenceSets' ReadonlySet members below.
  const refs = {
    character: new Set<string>(),
    faction: new Set<string>(),
    location: new Set<string>(),
  };
  for (const ep of artifact.episodes) {
    for (const tag of ep.tags) refs[tag.type as AliasAxis].add(tag.canonicalId);
  }

  const p1 = buildApplyPlan(artifact, refs);
  const p2 = buildApplyPlan(artifact, refs);
  assert.deepEqual(p1, p2, "deterministic on real data");
  assert.equal(p1.report.droppedMissingRefCount, 0, "covering refs → nothing dropped");

  // The real artifact carries the S2 link-shape: a multi-service show link set
  // and an RSS audio enclosure per episode.
  assert.ok(p1.report.showLinkCount > 0, "real show carries links");
  assert.ok(p1.report.episodeLinkCount > 0, "real episodes carry links");

  const store = emptyStore();
  simulateApply(p1, store);
  const after1 = snapshot(store);
  const works1 = store.works.size;
  const links1 = totalLinks(store);
  simulateApply(p1, store);
  assert.deepEqual(snapshot(store), after1, "idempotent on real data (incl. external_links)");
  assert.equal(store.works.size, works1, "no new works on re-apply");
  assert.equal(store.works.size, 1 + p1.episodes.length);
  assert.equal(totalJunctions(store), p1.report.resolvedTagCount);
  assert.equal(totalLinks(store), links1, "no link drift on re-apply");
  assert.equal(totalLinks(store), p1.report.showLinkCount + p1.report.episodeLinkCount);

  // Every junction entityId is in the reference set (FK-safe) and the per-episode
  // entity set is unique per axis (PK-safe).
  for (const axis of ["character", "faction", "location"] as const) {
    for (const rows of store.junctions[axis].values()) {
      const ids = rows.map((r) => r.entityId);
      assert.equal(new Set(ids).size, ids.length, `no duplicate ${axis} entity on an episode`);
      for (const id of ids) assert.ok(refs[axis].has(id), `${axis}:${id} is in the reference set`);
    }
  }
});

console.log(`\npodcast-apply: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
