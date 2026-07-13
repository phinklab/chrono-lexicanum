/**
 * GET /api/map/world/{id} — the lazily-fetched per-world Cartographer detail
 * (work list + blurb; Launch S10a).
 *
 * The work lists (~158 KB) and blurbs (~33 KB) used to ride in the /map
 * page's one-shot payload, and the researched dust blurbs shipped as a
 * 236 KB lazy client chunk that one `import()` pulled WHOLE on the first
 * panel open. Now the world panel fetches exactly the clicked world
 * (median ~0.6 KB) through the `PinSource.detail()` seam.
 *
 * Fully static: the catalog is committed JSON bundled at build time — every
 * one of the ~1 055 world responses is prerendered (`generateStaticParams`),
 * unknown ids 404 (`dynamicParams = false`), no DB anywhere near this route.
 */
import { NextResponse } from "next/server";

import { allWorldIds, getWorldDetail } from "@/lib/map/world-detail";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams(): { id: string }[] {
  return allWorldIds().map((id) => ({ id }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const detail = getWorldDetail(id);
  if (!detail) {
    return NextResponse.json({ error: "unknown world" }, { status: 404 });
  }
  return NextResponse.json(detail, {
    headers: {
      // Same browser window as /api/search-index: the catalog changes only
      // with a deploy; five minutes covers one map session's re-opens.
      "Cache-Control": "public, max-age=300",
    },
  });
}
