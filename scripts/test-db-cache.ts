/**
 * test-db-cache.ts — Launch S2. DB-free proof of the two cache layers'
 * error/caching semantics (`src/lib/db-cache.ts` + `src/lib/memory-cache.ts`).
 *
 * No test framework: node:assert/strict + one console line per case (the
 * test-search-index.ts pattern). Runs inside the `npm test` aggregate.
 *
 * `cachedRead` is exercised against Next's REAL `unstable_cache` via the
 * `globalThis.__incrementalCache` seam (fake in-memory store, see
 * test-helpers/next-runtime-stub.ts), so the suite proves the behaviour the
 * S2 contract relies on — not a reimplementation of it:
 *   - cold fill: exactly one loader call, result persisted with its tags
 *   - warm hit: served from the store, loader NOT called again
 *   - failing fill: rejects to the caller, loader called EXACTLY ONCE per
 *     request (the pre-S2 catch retried `fn()` → 2× DB load in an incident),
 *     nothing persisted, next request retries
 *   - stale entry: recomputed (the no-request-store path recomputes in the
 *     foreground; inside a real request Next serves stale + refreshes in the
 *     background — that half is Next's documented behaviour, not ours)
 *
 * `memoryCachedRead` (pure TS) is covered directly: cold/warm, TTL expiry,
 * rejection eviction, fill coalescing, reset hook, and the sequence guard
 * that keeps a late rejection from evicting a newer fill.
 */
import assert from "node:assert/strict";
import process from "node:process";
import {
  installFakeIncrementalCache,
} from "./test-helpers/next-runtime-stub";

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

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main(): Promise<void> {
// Dynamic import AFTER the stub module's side effects (see helper docstring).
const { cachedRead, CATALOGUE_TAGS } = await import("../src/lib/db-cache");
const { memoryCachedRead, resetMemoryCaches } = await import(
  "../src/lib/memory-cache"
);

// cachedRead — against real unstable_cache + fake incremental cache

await test("cachedRead: cold fill calls the loader once and persists with tags", async () => {
  const fake = installFakeIncrementalCache();
  let calls = 0;
  const read = cachedRead(
    async () => {
      calls += 1;
      return { rows: ["a", "b"] };
    },
    ["t1-cold"],
    { tags: ["books", "archive"] },
  );
  const value = await read();
  assert.deepEqual(value, { rows: ["a", "b"] });
  assert.equal(calls, 1);
  assert.equal(fake.sets, 1);
  assert.deepEqual(fake.lastSetTags, ["books", "archive"]);
});

await test("cachedRead: warm hit serves from the store without a loader call", async () => {
  installFakeIncrementalCache();
  let calls = 0;
  const loader = async () => {
    calls += 1;
    return { n: calls };
  };
  // Two separate cachedRead wrappers over the same loader + key simulate two
  // requests (the react cache() layer is per-request; the persistent layer is
  // keyed by keyParts + loader source).
  const first = await cachedRead(loader, ["t2-warm"])();
  const second = await cachedRead(loader, ["t2-warm"])();
  assert.deepEqual(first, { n: 1 });
  assert.deepEqual(second, { n: 1 }); // served from store, not recomputed
  assert.equal(calls, 1);
});

await test("cachedRead: failing fill rejects, loader called EXACTLY once, nothing cached", async () => {
  const fake = installFakeIncrementalCache();
  let calls = 0;
  const read = cachedRead(async () => {
    calls += 1;
    throw new Error("db down");
  }, ["t3-fail"]);
  await assert.rejects(read(), /db down/);
  // The pre-S2 fallback re-invoked fn() in a catch → 2 calls per request.
  assert.equal(calls, 1, "a failing source must be hit exactly once per request");
  assert.equal(fake.sets, 0, "a rejected fill must never be persisted");
});

await test("cachedRead: rejection is not cached — the next request retries and can recover", async () => {
  installFakeIncrementalCache();
  let calls = 0;
  const loader = async () => {
    calls += 1;
    if (calls === 1) throw new Error("transient");
    return "recovered";
  };
  await assert.rejects(cachedRead(loader, ["t4-retry"])(), /transient/);
  assert.equal(await cachedRead(loader, ["t4-retry"])(), "recovered");
  assert.equal(calls, 2);
});

await test("cachedRead: null is a cacheable value (stable 404), not an error", async () => {
  const fake = installFakeIncrementalCache();
  let calls = 0;
  const loader = async (): Promise<string | null> => {
    calls += 1;
    return null;
  };
  assert.equal(await cachedRead(loader, ["t5-null"])(), null);
  assert.equal(await cachedRead(loader, ["t5-null"])(), null);
  assert.equal(calls, 1, "cached null must be served without re-querying");
  assert.equal(fake.sets, 1);
});

await test("cachedRead: stale entry is recomputed (no-request-store path)", async () => {
  const fake = installFakeIncrementalCache();
  let calls = 0;
  const loader = async () => {
    calls += 1;
    return { fill: calls };
  };
  const read = cachedRead(loader, ["t6-stale"]);
  assert.deepEqual(await read(), { fill: 1 });
  fake.markAllStale();
  assert.deepEqual(await cachedRead(loader, ["t6-stale"])(), { fill: 2 });
  assert.equal(calls, 2);
});

await test("CATALOGUE_TAGS carries the S2 tags the loaders register", () => {
  for (const tag of ["entities", "podcasts", "timeline"]) {
    assert.ok(
      (CATALOGUE_TAGS as readonly string[]).includes(tag),
      `missing tag: ${tag}`,
    );
  }
});

// memoryCachedRead — pure, no Next involvement

await test("memoryCachedRead: cold fills once, warm serves the same promise", async () => {
  let calls = 0;
  const read = memoryCachedRead(async () => {
    calls += 1;
    return calls;
  });
  assert.equal(await read(), 1);
  assert.equal(await read(), 1);
  assert.equal(calls, 1);
});

await test("memoryCachedRead: concurrent callers coalesce onto one fill", async () => {
  let calls = 0;
  const read = memoryCachedRead(async () => {
    calls += 1;
    await sleep(20);
    return "filled";
  });
  const [a, b, c] = await Promise.all([read(), read(), read()]);
  assert.equal(a, "filled");
  assert.equal(b, "filled");
  assert.equal(c, "filled");
  assert.equal(calls, 1);
});

await test("memoryCachedRead: TTL expiry refills", async () => {
  let calls = 0;
  const read = memoryCachedRead(
    async () => {
      calls += 1;
      return calls;
    },
    { ttlSeconds: 0.03 },
  );
  assert.equal(await read(), 1);
  await sleep(60);
  assert.equal(await read(), 2);
});

await test("memoryCachedRead: a rejected fill is evicted — follow-up requests retry, not poisoned", async () => {
  let calls = 0;
  const read = memoryCachedRead(async () => {
    calls += 1;
    if (calls === 1) throw new Error("transient");
    return "recovered";
  });
  await assert.rejects(read(), /transient/);
  assert.equal(await read(), "recovered");
  assert.equal(await read(), "recovered");
  assert.equal(calls, 2);
});

await test("memoryCachedRead: coalesced callers of a failing fill all see ONE loader call", async () => {
  let calls = 0;
  const read = memoryCachedRead(async () => {
    calls += 1;
    await sleep(20);
    throw new Error("down");
  });
  const results = await Promise.allSettled([read(), read(), read()]);
  assert.ok(results.every((r) => r.status === "rejected"));
  assert.equal(calls, 1, "one failing fill serves the whole concurrent round");
});

await test("memoryCachedRead: a late rejection must not evict a newer good fill (seq guard)", async () => {
  let mode: "slow-fail" | "fast-ok" = "slow-fail";
  let calls = 0;
  const read = memoryCachedRead(async () => {
    calls += 1;
    if (mode === "slow-fail") {
      await sleep(40);
      throw new Error("late failure");
    }
    return "good";
  });
  const failing = read(); // fill A: rejects at t+40ms
  failing.catch(() => {}); // observed later; avoid unhandled-rejection noise
  resetMemoryCaches(); // slot cleared while A is in flight
  mode = "fast-ok";
  assert.equal(await read(), "good"); // fill B replaces the slot
  await sleep(60); // let A reject AFTER B landed
  assert.equal(await read(), "good", "B must survive A's late rejection");
  assert.equal(calls, 2, "no third fill — B stayed cached");
});

await test("memoryCachedRead: resetMemoryCaches forces a refill", async () => {
  let calls = 0;
  const read = memoryCachedRead(async () => {
    calls += 1;
    return calls;
  });
  assert.equal(await read(), 1);
  resetMemoryCaches();
  assert.equal(await read(), 2);
});

console.log("");
if (failed > 0) {
  console.error(`test-db-cache: ${failed} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`test-db-cache: all ${passed} cases passed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
