/**
 * Authenticated post-deploy cache invalidation. No body invalidates every
 * catalogue tag; explicit unknown tags fail with 400; a missing token disables
 * the route with 503.
 *
 * `{ expire: 0 }` deliberately makes the first post-release read fresh instead
 * of serving stale-while-revalidate. Legacy entity paths are also purged;
 * `/book/[slug]` relies on its `books` tag. In-process caches reset best-effort
 * on the instance handling this request.
 */
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { CATALOGUE_TAGS, resetMemoryCaches } from "@/lib/db-cache";
import { timingSafeEqualStr } from "@/lib/timingSafeEqual";

const KNOWN_TAGS: ReadonlySet<string> = new Set(CATALOGUE_TAGS);

/** Legacy belt-and-braces purge; each pattern invalidates every slug. */
const ENTITY_ROUTES = [
  "/character/[slug]",
  "/world/[slug]",
  "/faction/[slug]",
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
