/**
 * Shared bootstrap for the DB-free S2 cache/loader suites: makes Next's
 * server-side modules loadable and testable under plain `tsx`, outside a Next
 * server.
 *
 * Three things a suite gets from importing this module FIRST and
 * dynamic-importing its system-under-test afterwards (static imports would be
 * linked before this module's side effects run):
 *
 *  1. `globalThis.AsyncLocalStorage` — Next's async-storage modules expect the
 *     polyfill its own server bootstrap installs; without it they throw at
 *     first use.
 *  2. A module-resolution hook mapping `server-only` to Next's bundled empty
 *     variant. The package is not installed standalone (Next aliases it in its
 *     build), so under plain node the specifier would not resolve at all.
 *     `module.registerHooks` is sync-hooks API, Node ≥ 22.15 (CI runs 22.x).
 *  3. {@link installFakeIncrementalCache} — a minimal in-memory implementation
 *     of the `globalThis.__incrementalCache` seam that `unstable_cache`
 *     explicitly falls back to outside a request store (see
 *     next/dist/server/web/spec-extension/unstable-cache.js). It lets suites
 *     drive cold / warm / stale / failing fills and count real loader calls.
 */
import { AsyncLocalStorage } from "node:async_hooks";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

(globalThis as { AsyncLocalStorage?: unknown }).AsyncLocalStorage ??=
  AsyncLocalStorage;

const serverOnlyStub = pathToFileURL(
  path.join(process.cwd(), "node_modules/next/dist/compiled/server-only/empty.js"),
).href;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return { url: serverOnlyStub, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

/** One stored Data-Cache entry of the fake incremental cache. */
interface FakeCacheEntry {
  value: {
    kind: "FETCH";
    data: { headers: Record<string, string>; body: string; status: number; url: string };
    revalidate: number;
  };
  isStale: boolean;
}

export interface FakeIncrementalCache {
  /** Raw entry store, keyed by the key `generateSimpleCacheKey` produced. */
  store: Map<string, FakeCacheEntry>;
  /** How often `get` / `set` were called (set-count == successful fills). */
  gets: number;
  sets: number;
  /** Tags passed to the most recent `set` (asserts tag registration). */
  lastSetTags: string[] | undefined;
  /** Mark every stored entry stale (drives the expired-entry path). */
  markAllStale(): void;
  /** Drop all entries (fresh cold state without reinstalling). */
  clear(): void;
}

/**
 * Install a fresh fake `__incrementalCache` and return its control handle.
 * Mirrors exactly the surface `unstable_cache` touches in the no-request-store
 * code path: `isOnDemandRevalidate`, `generateSimpleCacheKey`, `get`, `set`.
 */
export function installFakeIncrementalCache(): FakeIncrementalCache {
  const store = new Map<string, FakeCacheEntry>();
  const handle: FakeIncrementalCache = {
    store,
    gets: 0,
    sets: 0,
    lastSetTags: undefined,
    markAllStale() {
      for (const [k, v] of store) store.set(k, { ...v, isStale: true });
    },
    clear() {
      store.clear();
    },
  };

  (globalThis as { __incrementalCache?: unknown }).__incrementalCache = {
    isOnDemandRevalidate: false,
    async generateSimpleCacheKey(invocationKey: string): Promise<string> {
      return invocationKey;
    },
    async get(key: string): Promise<FakeCacheEntry | null> {
      handle.gets += 1;
      return store.get(key) ?? null;
    },
    async set(
      key: string,
      entry: FakeCacheEntry["value"],
      ctx: { tags?: string[] },
    ): Promise<void> {
      handle.sets += 1;
      handle.lastSetTags = ctx.tags;
      store.set(key, { value: entry, isStale: false });
    },
  };

  return handle;
}

/** Seed the NEXT `get` regardless of key — for warm-path tests against
 *  loaders whose invocation key is an implementation detail. */
export function installSeededIncrementalCache(body: unknown): void {
  const entry: FakeCacheEntry = {
    value: {
      kind: "FETCH",
      data: { headers: {}, body: JSON.stringify(body), status: 200, url: "" },
      revalidate: 3600,
    },
    isStale: false,
  };
  (globalThis as { __incrementalCache?: unknown }).__incrementalCache = {
    isOnDemandRevalidate: false,
    async generateSimpleCacheKey(invocationKey: string): Promise<string> {
      return invocationKey;
    },
    async get(): Promise<FakeCacheEntry> {
      return entry;
    },
    async set(): Promise<void> {},
  };
}
