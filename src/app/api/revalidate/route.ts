/**
 * On-demand cache invalidation. The catalogue loaders tag their `cachedRead`
 * entries; without invalidation, data written by an ingestion/apply run would
 * live on until TTL expiry (a full hour, see `READ_CACHE_TTL`). This route
 * closes the loop: the Batches-strand apply scripts (or a manual curl) POST
 * here after writing to Postgres and the next request re-reads fresh data.
 *
 *   curl -X POST https://<host>/api/revalidate \
 *     -H "Authorization: Bearer $REVALIDATE_TOKEN" \
 *     [-H "Content-Type: application/json" -d '{"tags":["books"]}']
 *
 * No body (or no `tags` field) invalidates every catalogue tag. Unknown tags
 * are a 400, not a silent no-op, so a typo in an apply script is visible.
 * Without `REVALIDATE_TOKEN` in the environment the route is disabled (503) —
 * it is never open by accident.
 *
 * Invalidation semantics (S2 decision): `revalidateTag(tag, { expire: 0 })` —
 * IMMEDIATE expiration, not stale-while-revalidate. The string profile
 * `"max"` would be SWR per the Next 16 docs: the first request after the call
 * still serves the OLD data and only triggers a background refresh. Content
 * releases here are rare and correctness-driven (E4: the snapshot PR is the
 * deploy; this POST is the explicit post-deploy step), so the first reader
 * after a release must see the new state — paying one cold fill per tag is
 * the right trade. `{ expire: 0 }` is the documented route-handler pattern
 * for exactly this (`updateTag` is server-action-only).
 *
 * Beyond the catalogue tags, every call also purges the entity detail routes
 * (/charakter, /welt, /fraktion, /person) by path. `loadEntity` reads carry
 * the `entities` tag since S2, which already invalidates the data cache AND
 * the pages that rendered from it — the path purge stays as a belt-and-braces
 * layer for pages rendered before the tag existed and can be dropped once a
 * post-release check confirms tag propagation on the deployed runtime.
 *
 * Best-effort extras per call: `resetMemoryCaches()` clears every in-process
 * memory cache (`/archive` browse blob, /ask book list, /ask matrix). Those
 * only exist per serverless instance, so other warm instances refresh by TTL
 * — acceptable for a read-mostly catalogue.
 */
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { CATALOGUE_TAGS, resetMemoryCaches } from "@/lib/db-cache";
import { timingSafeEqualStr } from "@/lib/timingSafeEqual";

const KNOWN_TAGS: ReadonlySet<string> = new Set(CATALOGUE_TAGS);

/**
 * The on-demand-ISR entity detail routes. Since S2 their `loadEntity` reads
 * carry the cross-cutting `entities` tag (any catalogue change can alter an
 * entity page, so one tag covers all four types); this path purge is the
 * belt-and-braces layer documented in the header. Over-purging on-demand
 * pages is cheap: each just re-renders from the DB on its next visit. The
 * `[slug]` pattern + `'page'` invalidates every slug under the dynamic
 * segment in one call.
 */
const ENTITY_ROUTES = [
  "/charakter/[slug]",
  "/welt/[slug]",
  "/fraktion/[slug]",
  "/person/[slug]",
] as const;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const expected = process.env.REVALIDATE_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { error: "Revalidation is disabled (REVALIDATE_TOKEN not configured)." },
      { status: 503 },
    );
  }
  // Constant-time token check — `!==` would leak a prefix-timing oracle on
  // the bearer token.
  const auth = req.headers.get("authorization");
  if (!auth || !(await timingSafeEqualStr(auth, `Bearer ${expected}`))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let tags: string[] = [...CATALOGUE_TAGS];
  try {
    const body: unknown = await req.json();
    if (
      typeof body === "object" &&
      body !== null &&
      "tags" in body &&
      Array.isArray((body as { tags: unknown }).tags)
    ) {
      const requested = (body as { tags: unknown[] }).tags;
      if (!requested.every((t): t is string => typeof t === "string")) {
        return NextResponse.json(
          { error: "`tags` must be an array of strings." },
          { status: 400 },
        );
      }
      const unknown = requested.filter((t) => !KNOWN_TAGS.has(t));
      if (unknown.length > 0) {
        return NextResponse.json(
          { error: `Unknown tags: ${unknown.join(", ")}.`, known: [...CATALOGUE_TAGS] },
          { status: 400 },
        );
      }
      if (requested.length > 0) tags = requested;
    }
  } catch {
    // No / non-JSON body → default to all catalogue tags.
  }

  // `{ expire: 0 }` = immediate expiration (see header). NOT the string
  // profile "max" — that is stale-while-revalidate and would serve the old
  // catalogue to the first post-release reader.
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  // Belt-and-braces path purge for the entity ISR pages (see ENTITY_ROUTES).
  for (const route of ENTITY_ROUTES) revalidatePath(route, "page");
  resetMemoryCaches();

  return NextResponse.json({ revalidated: tags, paths: [...ENTITY_ROUTES] });
}
