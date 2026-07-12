/**
 * test-revalidate-route.ts — Launch S2. DB-free proof of the chosen
 * invalidation semantics and the `POST /api/revalidate` contract.
 *
 * S2 decided: `revalidateTag(tag, { expire: 0 })` — IMMEDIATE expiration.
 * The previous `"max"` profile is stale-while-revalidate per the Next 16
 * docs (its "hard-purge" comment was wrong): the first request after a
 * content release would still have served the OLD catalogue. This suite pins
 * the choice down by intercepting the real `next/cache` module the route
 * calls into and asserting the exact profile argument — a code change back
 * to `"max"` (or to no profile) fails here.
 *
 * Also covered: auth gating (503 without configured token, 401 on bad
 * token), tag validation (unknown tags 400 and invalidate NOTHING), the
 * default all-tags purge, the entity path purge, and that a POST resets the
 * in-process memory caches (`resetMemoryCaches`).
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import process from "node:process";
import "./test-helpers/next-runtime-stub";

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

const TOKEN = "test-revalidate-token";

function post(opts: { token?: string; body?: unknown } = {}): Request {
  return new Request("http://localhost/api/revalidate", {
    method: "POST",
    headers: {
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
      ...(opts.body !== undefined ? { "content-type": "application/json" } : {}),
    },
    ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
  });
}

async function main(): Promise<void> {
  // Intercept the real next/cache module BEFORE the route is loaded. The
  // route's `import { revalidateTag, revalidatePath } from "next/cache"`
  // resolves to this CJS module, so reassigning its exports records every
  // call the handler makes — no framework, no request context needed.
  const req = createRequire(import.meta.url);
  const nextCache = req("next/cache") as {
    revalidateTag: unknown;
    revalidatePath: unknown;
  };
  let tagCalls: Array<{ tag: string; profile: unknown }> = [];
  let pathCalls: Array<{ path: string; type: unknown }> = [];
  nextCache.revalidateTag = (tag: string, profile: unknown) => {
    tagCalls.push({ tag, profile });
  };
  nextCache.revalidatePath = (path: string, type: unknown) => {
    pathCalls.push({ path, type });
  };
  const reset = () => {
    tagCalls = [];
    pathCalls = [];
  };

  const { POST } = await import("../src/app/api/revalidate/route");
  const { CATALOGUE_TAGS } = await import("../src/lib/db-cache");
  const { memoryCachedRead } = await import("../src/lib/memory-cache");
  type PostArg = Parameters<typeof POST>[0];

  await test("without REVALIDATE_TOKEN configured the route is disabled (503)", async () => {
    delete process.env.REVALIDATE_TOKEN;
    const res = await POST(post({ token: TOKEN }) as PostArg);
    assert.equal(res.status, 503);
    assert.equal(tagCalls.length, 0);
  });

  process.env.REVALIDATE_TOKEN = TOKEN;

  await test("a wrong bearer token is rejected (401) and invalidates nothing", async () => {
    reset();
    const res = await POST(post({ token: "wrong" }) as PostArg);
    assert.equal(res.status, 401);
    assert.equal(tagCalls.length, 0);
    assert.equal(pathCalls.length, 0);
  });

  await test("default POST purges every catalogue tag with { expire: 0 } — immediate, not SWR", async () => {
    reset();
    const res = await POST(post({ token: TOKEN }) as PostArg);
    assert.equal(res.status, 200);
    assert.deepEqual(
      tagCalls.map((c) => c.tag),
      [...CATALOGUE_TAGS],
    );
    for (const call of tagCalls) {
      // The exact semantics decision: an object profile with expire 0. The
      // string profile "max" (stale-while-revalidate) must fail this.
      assert.deepEqual(call.profile, { expire: 0 });
    }
  });

  await test("every entity detail route is purged by path (belt-and-braces layer)", async () => {
    reset();
    await POST(post({ token: TOKEN }) as PostArg);
    assert.deepEqual(
      pathCalls,
      [
        { path: "/character/[slug]", type: "page" },
        { path: "/world/[slug]", type: "page" },
        { path: "/faction/[slug]", type: "page" },
        { path: "/person/[slug]", type: "page" },
      ],
    );
  });

  await test("a scoped body only purges the requested tags", async () => {
    reset();
    const res = await POST(post({ token: TOKEN, body: { tags: ["books"] } }) as PostArg);
    assert.equal(res.status, 200);
    assert.deepEqual(tagCalls, [{ tag: "books", profile: { expire: 0 } }]);
    const payload = (await res.json()) as { revalidated: string[] };
    assert.deepEqual(payload.revalidated, ["books"]);
  });

  await test("an unknown tag is a 400 and invalidates nothing", async () => {
    reset();
    const res = await POST(
      post({ token: TOKEN, body: { tags: ["books", "nope"] } }) as PostArg,
    );
    assert.equal(res.status, 400);
    assert.equal(tagCalls.length, 0);
    assert.equal(pathCalls.length, 0);
  });

  await test("non-string tags are a 400", async () => {
    reset();
    const res = await POST(
      post({ token: TOKEN, body: { tags: [42] } }) as PostArg,
    );
    assert.equal(res.status, 400);
    assert.equal(tagCalls.length, 0);
  });

  await test("a POST resets the in-process memory caches (ask books/matrix, archive blob)", async () => {
    let fills = 0;
    const read = memoryCachedRead(async () => {
      fills += 1;
      return fills;
    });
    assert.equal(await read(), 1);
    assert.equal(await read(), 1); // warm
    await POST(post({ token: TOKEN }) as PostArg);
    assert.equal(await read(), 2, "the POST must clear every registered memory cache");
  });

  console.log("");
  if (failed > 0) {
    console.error(`test-revalidate-route: ${failed} failed, ${passed} passed`);
    process.exit(1);
  }
  console.log(`test-revalidate-route: all ${passed} cases passed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
