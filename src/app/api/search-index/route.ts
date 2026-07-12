/**
 * GET /api/search-index — the lazily-fetched typeahead index (Launch S6).
 *
 * The unified suggestions (~3,400 entries, books + podcasts + compendium
 * entities) used to ride in the initial HTML/RSC flight of Home, /archive and
 * /archive/podcasts (~470 KB per route). Now every `BrowseSearch` console
 * fetches this route once, on the visitor's first focus/keystroke, and shares
 * the result across consoles for the rest of the SPA session.
 *
 * Static + ISR: the handler reads no request data, so it is prerendered at
 * build (from the committed snapshot — the S1b loader façades handle the
 * source switch) and revalidated hourly at runtime, matching Home and the
 * podcast index. The inner loaders read through tagged `cachedRead` layers,
 * so `POST /api/revalidate` refreshes this route with the rest of the
 * catalogue after an apply run.
 *
 * Error contract (S2): the loaders THROW on DB failure. Next then serves the
 * last good static/ISR response — for a search nicety, stale suggestions beat
 * an error; the free-text fallback (`Enter` → server-side `q` filter) never
 * depends on this route.
 */
import { NextResponse } from "next/server";
import { loadSearchSuggestions } from "@/lib/search-index";

export const revalidate = 3600;

export async function GET(): Promise<NextResponse> {
  const suggestions = await loadSearchSuggestions();
  return NextResponse.json(suggestions, {
    headers: {
      // Browsers may keep it for five minutes (one SPA session's worth of
      // console focuses); the CDN honours the ISR window above.
      "Cache-Control": "public, max-age=300",
    },
  });
}
