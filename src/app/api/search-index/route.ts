/**
 * Lazy shared typeahead index for Home and Archive consoles. It prerenders from
 * the snapshot, revalidates hourly and refreshes through catalogue cache tags.
 * Loader failures preserve the last good ISR response; free-text search does
 * not depend on this endpoint.
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
