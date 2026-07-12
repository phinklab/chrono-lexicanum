/**
 * test-loader-error-contract.ts — Launch S2. DB-free proof of the loader
 * error contract (see `src/lib/db-cache.ts` header): detail loaders resolve
 * data | null (absence) and THROW on DB errors; index loaders resolve an
 * array (legitimately empty allowed) and THROW on DB errors. A DB outage must
 * never surface as a 404 or an empty archive.
 *
 * Two halves, no live database anywhere:
 *
 *  - THROW: `DATABASE_URL` points at a loopback port that was just bound and
 *    released again (a genuinely closed port — instant RST, never a live DB),
 *    and the shared postgres.js pool is then `end()`ed, so every query
 *    rejects instantly with CONNECTION_ENDED instead of cycling through the
 *    pool's exponential reconnect backoff (sequential refused connects
 *    degrade from 6 ms to >10 s per call). The loaders are agnostic to the
 *    infra-error flavour; what the contract demands — and the pre-S2 versions
 *    violated by swallowing into `[]`/`null` — is that the rejection
 *    PROPAGATES. That is exactly what each case asserts.
 *  - DATA / NULL: the `cachedRead`-wrapped facades are driven through a
 *    seeded fake Data-Cache entry (see test-helpers/next-runtime-stub.ts), so
 *    the warm path proves a cached `null` renders as absence (→ notFound)
 *    and a cached payload comes back intact — without any Postgres.
 *
 * The absence path of the LIVE query bodies (unknown slug against a real,
 * reachable DB → null) inherently needs a database and stays covered by the
 * manual DB-gated flows; the contract split throw-vs-null is what launch
 * correctness depends on and is fully proven here.
 */
import assert from "node:assert/strict";
import net from "node:net";
import process from "node:process";
import {
  installFakeIncrementalCache,
  installSeededIncrementalCache,
} from "./test-helpers/next-runtime-stub";

delete process.env.NEXT_PHASE; // request-time paths, never the snapshot switch

/** Bind an ephemeral loopback port, release it, hand it out: connecting to it
 *  now fails with an instant RST — the fastest reliable "DB down". */
async function closedLoopbackPort(): Promise<number> {
  const srv = net.createServer();
  await new Promise<void>((resolve) => srv.listen(0, "127.0.0.1", resolve));
  const { port } = srv.address() as net.AddressInfo;
  await new Promise<void>((resolve) => srv.close(() => resolve()));
  return port;
}

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void> | void): Promise<void> {
  try {
    await fn();
    passed += 1;
    console.log(`ok    ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL  ${name}`);
    console.error(err);
  }
}

async function main(): Promise<void> {
  process.env.DATABASE_URL = `postgres://chrono:test@127.0.0.1:${await closedLoopbackPort()}/chrono`;

  // Dynamic imports AFTER the env + hook setup (see helper docstring).
  const { fetchBrowseBooksLive } = await import("../src/app/archive/loader-live");
  const { loadBrowseBooks } = await import("../src/app/archive/loader");
  const podcastsLive = await import("../src/app/archive/podcasts/loader-live");
  const podcasts = await import("../src/app/archive/podcasts/loader");
  const { loadEntityLive, listHotEntityIdsLive } = await import(
    "../src/lib/entity/loader-live"
  );
  const { loadEntity } = await import("../src/lib/entity/loader");
  const { loadBook } = await import("../src/lib/book/loadBook");
  const { loadChronicleTimeline } = await import(
    "../src/lib/chronicle/loadTimeline"
  );
  const { loadFactionGuide } = await import("../src/app/fraktionen/loader");
  const queries = await import("../src/lib/compendium/queries");

  // THROW half — dead DB pool, cold cache: every loader must reject.
  const { db } = await import("../src/db/client");
  // Drizzle wraps the postgres.js client; `$client.end()` kills the pool so
  // every subsequent query rejects instantly (see header).
  await db.$client.end({ timeout: 0 });

  installFakeIncrementalCache();

  const rejections: Array<[string, Promise<unknown>]> = [
    ["index: fetchBrowseBooksLive rejects on DB outage (never an empty hall)", fetchBrowseBooksLive()],
    ["index: loadBrowseBooks (persistent-cache façade) rejects on DB outage", loadBrowseBooks()],
    ["index: loadPodcastIndexLive rejects on DB outage", podcastsLive.loadPodcastIndexLive()],
    ["index: loadPodcastSearchIndexLive rejects on DB outage", podcastsLive.loadPodcastSearchIndexLive()],
    ["detail: loadPodcastShowLive rejects on DB outage (never null → 404)", podcastsLive.loadPodcastShowLive("the-40k-lorecast")],
    ["detail: loadEntityLive(character) rejects on DB outage", loadEntityLive("character", "horus")],
    ["detail: loadEntityLive(faction) rejects on DB outage", loadEntityLive("faction", "thousand_sons")],
    ["detail: loadEntityLive(location) rejects on DB outage", loadEntityLive("location", "terra")],
    ["detail: loadEntityLive(person) rejects on DB outage", loadEntityLive("person", "dan-abnett")],
    ["index: listHotEntityIdsLive rejects on DB outage", listHotEntityIdsLive("character")],
    ["index: loadFactionGuide rejects on DB outage", loadFactionGuide()],
    ["index: getCharaktereRows rejects on DB outage", queries.getCharaktereRows()],
    ["index: getWeltenRows rejects on DB outage", queries.getWeltenRows()],
    ["index: getPersonenRows rejects on DB outage", queries.getPersonenRows()],
    ["detail: loadBook (cachedRead façade) rejects on DB outage — cold fill propagates", loadBook("eisenhorn-xenos")],
    ["detail: loadEntity (cachedRead façade) rejects on DB outage", loadEntity("character", "horus")],
    ["index: loadPodcastIndex (cachedRead façade) rejects on DB outage", podcasts.loadPodcastIndex()],
    ["detail: loadPodcastShow (cachedRead façade) rejects on DB outage", podcasts.loadPodcastShow("the-40k-lorecast")],
    ["index: loadChronicleTimeline rejects on DB outage (error surface, not empty chronicle)", loadChronicleTimeline()],
  ];
  // Attach handlers immediately — a rejection settling before its assert.
  // rejects turn would otherwise be a fatal unhandledRejection.
  for (const [, p] of rejections) p.catch(() => {});
  for (const [name, p] of rejections) {
    await test(name, () => assert.rejects(p));
  }

  // DATA / NULL half — seeded warm cache, DB never touched.

  await test("detail: a cached null renders as absence (loadBook → null → notFound)", async () => {
    installSeededIncrementalCache(null);
    assert.equal(await loadBook("no-such-slug"), null);
    assert.equal(await podcasts.loadPodcastShow("no-such-show"), null);
    assert.equal(await loadEntity("character", "no-such-id"), null);
  });

  await test("detail: a cached payload comes back intact (data state)", async () => {
    const book = { id: "b1", slug: "eisenhorn-xenos", title: "Xenos", persons: [] };
    installSeededIncrementalCache(book);
    assert.deepEqual(await loadBook("eisenhorn-xenos"), book);
  });

  await test("index: a cached empty array is a legitimate result, not an error", async () => {
    installSeededIncrementalCache([]);
    assert.deepEqual(await podcasts.loadPodcastIndex(), []);
    assert.deepEqual(await loadChronicleTimeline(), []);
  });

  await test("index: a cached browse wire entry inflates back to BrowseData (S6)", async () => {
    const { compactBrowse } = await import("../src/app/archive/browse-wire");
    const data = {
      books: [
        {
          id: "b1",
          slug: "xenos",
          title: "Xenos",
          releaseYear: 2001,
          format: "novel",
          eraName: null,
          seriesName: "Eisenhorn",
          authors: ["Dan Abnett"],
          factions: [
            {
              id: "inquisition",
              name: "Inquisition",
              role: "primary",
              alignment: "imperial",
              parentId: null,
            },
          ],
          facets: [
            {
              id: "investigation",
              name: "Investigation",
              categoryId: "themes",
              categoryName: "Themes",
            },
          ],
        },
      ],
      eras: [{ id: "time_ending", name: "The Time of Ending", sortOrder: 7 }],
    };
    installSeededIncrementalCache(compactBrowse(data));
    // React's `cache()` memo would replay the poisoned THROW-half call within
    // one request scope; under tsx each call is its own scope, so this re-runs.
    assert.deepEqual(await loadBrowseBooks(), data);
  });

  console.log("");
  if (failed > 0) {
    console.error(`test-loader-error-contract: ${failed} failed, ${passed} passed`);
    process.exit(1);
  }
  console.log(`test-loader-error-contract: all ${passed} cases passed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
