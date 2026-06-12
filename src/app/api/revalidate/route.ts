/**
 * On-demand cache invalidation (Report 144 § P.6). The catalogue loaders tag
 * their `cachedRead` entries, but nothing ever invalidated those tags — after
 * an ingestion/apply run the old data lived on until TTL expiry (now a full
 * hour, see `READ_CACHE_TTL`). This route closes the loop: the Batches-strand
 * apply scripts (or a manual curl) POST here after writing to Postgres and the
 * next request re-reads fresh data.
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
 * Best-effort extras per call: the in-process memory caches (`/archive`
 * browse blob, /ask book cache) are cleared too. Those only exist per
 * serverless instance, so other warm instances refresh by TTL — acceptable
 * for a read-mostly catalogue.
 */
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { CATALOGUE_TAGS, resetMemoryCaches } from "@/lib/db-cache";
import { clearAskRecommendationCache } from "@/lib/ask/recommend";

const KNOWN_TAGS: ReadonlySet<string> = new Set(CATALOGUE_TAGS);

export async function POST(req: NextRequest): Promise<NextResponse> {
  const expected = process.env.REVALIDATE_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { error: "Revalidation is disabled (REVALIDATE_TOKEN not configured)." },
      { status: 503 },
    );
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${expected}`) {
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

  // Next 16 requires a cacheLife profile; "max" is the documented hard-purge
  // form for route handlers (`updateTag` is server-action-only).
  for (const tag of tags) revalidateTag(tag, "max");
  resetMemoryCaches();
  clearAskRecommendationCache();

  return NextResponse.json({ revalidated: tags });
}
