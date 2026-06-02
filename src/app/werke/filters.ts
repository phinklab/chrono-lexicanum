/**
 * Public book-browse filter contract (Brief 120). PURE — no `@/db`, no JSX —
 * so the server page and the client `WerkeFilters` island share one source of
 * truth for param names, sort keys, and the filter/sort semantics. Every
 * control is URL-mirrored: a filtered view is a shareable link.
 */
import { FORMAT_LABELS } from "@/lib/book-labels";
import type { BrowseBook } from "./loader";

export type SortKey = "title" | "release" | "chrono";

export const SORT_OPTIONS: ReadonlyArray<{ id: SortKey; label: string }> = [
  { id: "title", label: "Title A–Z" },
  { id: "release", label: "Newest" },
  { id: "chrono", label: "Timeline" },
];

/** Format-filter display order (mirrors the `book_format` enum intent). */
export const FORMAT_ORDER: readonly string[] = [
  "novel",
  "novella",
  "short_story",
  "anthology",
  "collection",
  "omnibus",
  "audio_drama",
  "artbook",
  "scriptbook",
];

export interface WorksParams {
  q: string;
  faction: string | null;
  format: string | null;
  facet: string | null;
  sort: SortKey;
}

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function parseSort(raw: string | undefined): SortKey {
  return raw === "release" || raw === "chrono" ? raw : "title";
}

export function parseWorksParams(sp: {
  q?: string | string[];
  faction?: string | string[];
  format?: string | string[];
  facet?: string | string[];
  sort?: string | string[];
}): WorksParams {
  const trim = (v: string | string[] | undefined): string | null => {
    const s = first(v)?.trim();
    return s ? s : null;
  };
  return {
    q: first(sp.q)?.trim() ?? "",
    faction: trim(sp.faction),
    format: trim(sp.format),
    facet: trim(sp.facet),
    sort: parseSort(first(sp.sort)),
  };
}

export function isFiltered(p: WorksParams): boolean {
  return Boolean(p.q || p.faction || p.format || p.facet);
}

function matches(book: BrowseBook, p: WorksParams): boolean {
  if (p.format && book.format !== p.format) return false;
  if (p.faction && !book.factions.some((f) => f.id === p.faction)) return false;
  if (p.facet && !book.facets.some((f) => f.id === p.facet)) return false;
  if (p.q) {
    const needle = p.q.toLowerCase();
    // Free-text search reaches across every field a visitor can also filter by
    // (title, author, faction, facet, format, series, era) so typing "white"
    // surfaces White Scars books even when the term lives on a faction tag,
    // not in the title. The dropdown suggests these as discrete picks; this is
    // the fallback for a typed-and-submitted query.
    const haystack = [
      book.title,
      ...book.authors,
      ...book.factions.map((f) => f.name),
      ...book.facets.map((f) => f.name),
      book.format ? FORMAT_LABELS[book.format] ?? book.format : null,
      book.seriesName,
      book.eraName,
    ];
    if (!haystack.some((h) => h != null && h.toLowerCase().includes(needle))) {
      return false;
    }
  }
  return true;
}

function compare(a: BrowseBook, b: BrowseBook, sort: SortKey): number {
  if (sort === "release") {
    if (a.releaseYear == null && b.releaseYear != null) return 1;
    if (a.releaseYear != null && b.releaseYear == null) return -1;
    if (a.releaseYear != null && b.releaseYear != null && a.releaseYear !== b.releaseYear) {
      return b.releaseYear - a.releaseYear;
    }
    return a.title.localeCompare(b.title, "en");
  }
  if (sort === "chrono") {
    if (a.startY == null && b.startY != null) return 1;
    if (a.startY != null && b.startY == null) return -1;
    if (a.startY != null && b.startY != null && a.startY !== b.startY) {
      return a.startY - b.startY;
    }
    return a.title.localeCompare(b.title, "en");
  }
  return a.title.localeCompare(b.title, "en");
}

export function applyWorksFilters(
  books: readonly BrowseBook[],
  p: WorksParams,
): BrowseBook[] {
  return books.filter((b) => matches(b, p)).sort((a, b) => compare(a, b, p.sort));
}

/* ── Universal search suggestions (typeahead) ───────────────────────────────
 * The search box is a single entry point to everything the page can filter
 * by. As the visitor types, `rankSuggestions` ranks a pre-built index of
 * books, authors, factions, facets and formats so picking "White Scars" from
 * the dropdown applies the faction filter, while picking a book opens it. The
 * index is built server-side (page.tsx) from the same data the list renders,
 * so it never goes stale; ranking is pure + client-cheap (a few thousand
 * short strings, re-run per keystroke). */

export type SuggestKind = "book" | "author" | "faction" | "facet" | "format";

export interface Suggestion {
  kind: SuggestKind;
  /** Visible primary text (book title, faction name, …). */
  label: string;
  /** What the pick commits: book→slug, author→name, faction/facet→id, format→key. */
  value: string;
  /** Secondary line: book→author/series, facet→category. */
  hint?: string | null;
}

export interface RankedSuggestion extends Suggestion {
  score: number;
}

/** Group display order + per-group result caps for the dropdown. */
const GROUP_ORDER: Record<SuggestKind, number> = {
  book: 0,
  faction: 1,
  facet: 2,
  format: 3,
  author: 4,
};
const GROUP_CAP: Record<SuggestKind, number> = {
  book: 6,
  faction: 5,
  facet: 5,
  format: 4,
  author: 4,
};

/** Lower is better. -1 = no match. */
function matchScore(text: string, needle: string): number {
  if (text === needle) return 0;
  if (text.startsWith(needle)) return 1;
  if (text.includes(` ${needle}`)) return 2; // word-start, mid-string
  if (text.includes(needle)) return 3;
  return -1;
}

export const SUGGEST_MIN_LEN = 2;

/**
 * Rank `index` against `query`, returning a flat list ordered by group then
 * relevance, capped per group. A hint-only match ranks below any label match.
 * Below `SUGGEST_MIN_LEN` chars it returns nothing (avoids one-letter noise).
 */
export function rankSuggestions(
  index: readonly Suggestion[],
  query: string,
): RankedSuggestion[] {
  const needle = query.trim().toLowerCase();
  if (needle.length < SUGGEST_MIN_LEN) return [];

  const scored: RankedSuggestion[] = [];
  for (const s of index) {
    const labelScore = matchScore(s.label.toLowerCase(), needle);
    let score = labelScore;
    if (score < 0 && s.hint) {
      const hintScore = matchScore(s.hint.toLowerCase(), needle);
      if (hintScore >= 0) score = hintScore + 4; // ranks under every label hit
    }
    if (score < 0) continue;
    scored.push({ ...s, score });
  }

  scored.sort(
    (a, b) =>
      GROUP_ORDER[a.kind] - GROUP_ORDER[b.kind] ||
      a.score - b.score ||
      a.label.localeCompare(b.label, "en"),
  );

  const counts: Partial<Record<SuggestKind, number>> = {};
  const out: RankedSuggestion[] = [];
  for (const s of scored) {
    const n = (counts[s.kind] ?? 0) + 1;
    counts[s.kind] = n;
    if (n <= GROUP_CAP[s.kind]) out.push(s);
  }
  return out;
}

export const SUGGEST_GROUP_LABEL: Record<SuggestKind, string> = {
  book: "Books",
  faction: "Factions",
  facet: "Facets",
  format: "Formats",
  author: "Authors",
};
