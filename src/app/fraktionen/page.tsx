/**
 * `/fraktionen` is the Factions view of the Compendium. The
 * guide lives under `/compendium/fraktionen`; this route stays alive
 * as a permanent redirect so existing links — and the shareable filtered URLs
 * `/fraktionen?alignment=chaos` etc. — keep working. The query string is
 * forwarded verbatim (the Compendium directory reads the same `q`/`alignment`/
 * `sort` grammar).
 *
 * The sibling data layer (`loader.ts`'s `loadFactionGuide` + `filters.ts`'s
 * `hasContent`) is still live — the Compendium loader imports both, so they
 * are kept.
 */
import { redirect } from "next/navigation";

type Search = Record<string, string | string[] | undefined>;

export default async function FraktionenRedirect({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === "string") qs.set(key, value);
    else if (Array.isArray(value) && typeof value[0] === "string")
      qs.set(key, value[0]);
  }
  const query = qs.toString();
  redirect(query ? `/compendium/fraktionen?${query}` : "/compendium/fraktionen");
}
