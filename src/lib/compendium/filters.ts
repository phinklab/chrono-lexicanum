/**
 * Compendium directory filter contract — Brief 129. PURE (no `@/db`, no JSX) so
 * the server page (which does the actual filtering, SEO-friendly) and the client
 * controls island (which mirrors state to the URL) agree on the param grammar.
 * Every control is URL-mirrored: a filtered directory is a shareable link, the
 * same discipline as /werke and /fraktionen.
 */
import type { CompendiumItem } from "./categories";

export type CompendiumSortKey = "covered" | "az";

export const SORT_OPTIONS: ReadonlyArray<{
  id: CompendiumSortKey;
  label: string;
}> = [
  { id: "covered", label: "Most covered" },
  { id: "az", label: "A–Z" },
];

export interface CompendiumParams {
  q: string;
  /** Active facet value (e.g. an alignment), validated against the category. */
  facet: string | null;
  sort: CompendiumSortKey;
}

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function parseSort(raw: string | undefined): CompendiumSortKey {
  return raw === "az" ? "az" : "covered";
}

/**
 * Parse the query string for one directory. `facetIds` is the category's
 * allowed facet values — an unknown facet is dropped (never trusted from the
 * URL), so a stale link can't filter to a value the category doesn't define.
 */
export function parseCompendiumParams(
  sp: { q?: string | string[]; sort?: string | string[] } & Record<
    string,
    string | string[] | undefined
  >,
  facetParam: string | undefined,
  facetIds: readonly string[],
): CompendiumParams {
  const rawFacet = facetParam ? first(sp[facetParam]) : undefined;
  const facet = rawFacet && facetIds.includes(rawFacet) ? rawFacet : null;
  return {
    q: first(sp.q)?.trim() ?? "",
    facet,
    sort: parseSort(first(sp.sort)),
  };
}

export function isFiltered(p: CompendiumParams): boolean {
  return Boolean(p.q || p.facet);
}

function matches(item: CompendiumItem, p: CompendiumParams): boolean {
  if (p.facet && item.facet !== p.facet) return false;
  if (p.q && !item.name.toLowerCase().includes(p.q.toLowerCase())) return false;
  return true;
}

function compare(
  a: CompendiumItem,
  b: CompendiumItem,
  sort: CompendiumSortKey,
): number {
  if (sort === "az") return a.name.localeCompare(b.name, "en");
  // "covered": the doorways with the most behind them lead; name breaks ties so
  // the order is stable across requests.
  return b.weight - a.weight || a.name.localeCompare(b.name, "en");
}

export function applyCompendiumFilters(
  items: readonly CompendiumItem[],
  p: CompendiumParams,
): CompendiumItem[] {
  return items
    .filter((item) => matches(item, p))
    .sort((a, b) => compare(a, b, p.sort));
}
