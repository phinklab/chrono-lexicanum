/**
 * Public faction-guide filter contract (Brief 120). PURE — no `@/db`, no JSX —
 * shared by the server page and the `FraktionenFilters` client island. Every
 * control is URL-mirrored: a filtered guide view is a shareable link.
 */
import type { Alignment, FactionGuide } from "./loader";

export type FactionSortKey = "covered" | "az";

export const SORT_OPTIONS: ReadonlyArray<{ id: FactionSortKey; label: string }> = [
  { id: "covered", label: "Most covered" },
  { id: "az", label: "A–Z" },
];

export const ALIGNMENT_OPTIONS: ReadonlyArray<{ id: Alignment; label: string }> = [
  { id: "imperium", label: "Imperium" },
  { id: "chaos", label: "Chaos" },
  { id: "xenos", label: "Xenos" },
  { id: "neutral", label: "Neutral" },
];

export interface FactionParams {
  q: string;
  alignment: Alignment | null;
  sort: FactionSortKey;
}

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function parseAlignment(raw: string | undefined): Alignment | null {
  return raw === "imperium" || raw === "chaos" || raw === "xenos" || raw === "neutral"
    ? raw
    : null;
}

function parseSort(raw: string | undefined): FactionSortKey {
  return raw === "az" ? "az" : "covered";
}

export function parseFactionParams(sp: {
  q?: string | string[];
  alignment?: string | string[];
  sort?: string | string[];
}): FactionParams {
  return {
    q: first(sp.q)?.trim() ?? "",
    alignment: parseAlignment(first(sp.alignment)),
    sort: parseSort(first(sp.sort)),
  };
}

export function isFiltered(p: FactionParams): boolean {
  return Boolean(p.q || p.alignment);
}

/** A faction earns a place in the guide only if something sits behind it. */
export function hasContent(f: FactionGuide): boolean {
  return (
    f.bookCount > 0 ||
    f.episodeCount > 0 ||
    f.characterCount > 0 ||
    f.subfactionCount > 0
  );
}

function matches(f: FactionGuide, p: FactionParams): boolean {
  if (p.alignment && f.alignment !== p.alignment) return false;
  if (p.q && !f.name.toLowerCase().includes(p.q.toLowerCase())) return false;
  return true;
}

function compare(a: FactionGuide, b: FactionGuide, sort: FactionSortKey): number {
  if (sort === "az") return a.name.localeCompare(b.name, "en");
  // "covered": the doorways with the most to read/listen come first; characters
  // then sub-factions break ties so umbrella factions still surface.
  return (
    b.bookCount - a.bookCount ||
    b.episodeCount - a.episodeCount ||
    b.characterCount - a.characterCount ||
    b.subfactionCount - a.subfactionCount ||
    a.name.localeCompare(b.name, "en")
  );
}

export function applyFactionFilters(
  factions: readonly FactionGuide[],
  p: FactionParams,
): FactionGuide[] {
  return factions
    .filter((f) => hasContent(f) && matches(f, p))
    .sort((a, b) => compare(a, b, p.sort));
}
