/**
 * Timeline URL builder + filter parser.
 *
 * Single source of truth for `/timeline?…` URL construction. Lives here so
 * every nav surface (TopChrome EraToggle, Overview ribbon click, EraDetail
 * prev/next, BookDot click, DetailPanel close, FilterRail toggle) routes
 * through the same helpers and brief 029 constraint 5 ("era-Wechsel droppt
 * Filter") + constraint 10 ("Filter-State und Book-Modal-State sind
 * orthogonal") can't be silently re-violated when Phase 4 adds new nav.
 *
 * Parameter inventory on `/timeline`:
 *   - era    : era id (great_crusade, horus_heresy, …) — see page.tsx redirect rules
 *   - book   : book slug (opens DetailPanel modal)
 *   - faction: comma-separated faction ids (FilterRail axis 1)
 *   - length : comma-separated length-tier facet value ids (FilterRail axis 2)
 *
 * Era-change strips faction+length (filter values are era-specific). Book
 * modal nav preserves faction+length (modal state and filter state coexist).
 */

const FILTER_KEYS = ["faction", "length"] as const;

const TIMELINE_PATH = "/timeline";

function makeQs(params: URLSearchParams): string {
  const qs = params.toString();
  return qs ? `${TIMELINE_PATH}?${qs}` : TIMELINE_PATH;
}

/**
 * Era-change URL: strips faction + length, sets era. Leaves `book` alone —
 * brief is silent on book on era-change, and page.tsx already has tolerance
 * for ?era=<valid>&book=<from-different-era> (lines 80-89; intentional).
 */
export function buildEraUrl(eraId: string, sp: URLSearchParams): string {
  const next = new URLSearchParams(sp.toString());
  for (const k of FILTER_KEYS) next.delete(k);
  next.set("era", eraId);
  return makeQs(next);
}

/**
 * Book modal open / series prev-next: preserves filter keys, sets era + book.
 * Used by BookDot.onClick and DetailPanel's series volume nav.
 */
export function buildBookUrl(eraId: string, slug: string, sp: URLSearchParams): string {
  const next = new URLSearchParams(sp.toString());
  next.set("era", eraId);
  next.set("book", slug);
  return makeQs(next);
}

/**
 * DetailPanel close: preserves filter keys + era, drops book. If the era was
 * unset (defensive — `?book=` without `?era=` redirects server-side, so this
 * branch is rarely live), returns the bare /timeline path.
 */
export function buildCloseUrl(eraId: string | null, sp: URLSearchParams): string {
  const next = new URLSearchParams(sp.toString());
  next.delete("book");
  if (eraId) {
    next.set("era", eraId);
    return makeQs(next);
  }
  next.delete("era");
  return makeQs(next);
}

/**
 * FilterRail toggle: preserves era + book, writes filter values for `axis` as
 * a CSV. Empty `values` array deletes the key entirely (clean URL when no
 * pills selected on that axis).
 */
export function buildFilterUrl(
  axis: (typeof FILTER_KEYS)[number],
  values: readonly string[],
  sp: URLSearchParams,
): string {
  const next = new URLSearchParams(sp.toString());
  if (values.length === 0) {
    next.delete(axis);
  } else {
    next.set(axis, values.join(","));
  }
  return makeQs(next);
}

/**
 * Read filter axes off a searchParams snapshot. Trims, dedupes, drops empty
 * tokens. Does NOT validate against the available option set — that's the
 * caller's job (loader uses parsed ids in SQL `IN (…)`; FilterRail uses them
 * to highlight active pills, which naturally tolerates stale ids).
 */
export function parseFilterParams(sp: URLSearchParams): {
  factionIds: string[];
  lengthIds: string[];
} {
  return {
    factionIds: parseCsv(sp.get("faction")),
    lengthIds: parseCsv(sp.get("length")),
  };
}

function parseCsv(raw: string | null): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tok of raw.split(",")) {
    const t = tok.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}
