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
 * The search box is a single entry point to everything the archive holds. As
 * the visitor types, `rankSuggestions` ranks a pre-built index of books,
 * authors, factions, facets and formats — plus podcasts (episodes + shows),
 * merged in by the host page from `buildPodcastSuggestions` — so picking
 * "White Scars" applies the faction filter, picking a book opens it, and
 * picking a podcast routes to its show. The index is built server-side
 * (page.tsx) from the same data the lists render, so it never goes stale;
 * ranking is pure + client-cheap (a few thousand short strings, re-run per
 * keystroke). Book-only callers pass just `buildSearchIndex(books)`. */

export type SuggestKind =
  | "book"
  | "podcast"
  | "author"
  | "faction"
  | "primarch"
  | "facet"
  | "format";

export interface Suggestion {
  kind: SuggestKind;
  /** Visible primary text (book title, faction name, …). */
  label: string;
  /** What the pick commits: book→slug, author→name, faction/facet→id, format→key,
   *  podcast→a unique id (`episodeId` or `show:<slug>`; the nav target is `href`). */
  value: string;
  /** Secondary line: book→author/series, facet→category, podcast→show title. */
  hint?: string | null;
  /** Navigation target for kinds that route directly (podcast → show page /
   *  `#ep-<id>` deep link). Books/factions/… derive their target from `value`. */
  href?: string | null;
}

export interface RankedSuggestion extends Suggestion {
  score: number;
}

/** Group display order + per-group result caps for the dropdown. Podcasts sit
 *  right after books — the second media pillar — ahead of the book-facet groups. */
const GROUP_ORDER: Record<SuggestKind, number> = {
  book: 0,
  podcast: 1,
  faction: 2,
  primarch: 3,
  facet: 4,
  format: 5,
  author: 6,
};
const GROUP_CAP: Record<SuggestKind, number> = {
  book: 6,
  podcast: 6,
  faction: 5,
  primarch: 5,
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
  podcast: "Podcasts",
  faction: "Factions",
  primarch: "Primarchs",
  facet: "Facets",
  format: "Formats",
  author: "Authors",
};

/**
 * Where an entity pick from the universal search lands, shared by every console
 * (Home, /podcasts, /werke) so the behaviour can't drift: the matching Compendium
 * directory with that entity's overlay auto-opened. The directory page reads
 * `focus`, resolves it to the row's detail href, and `CompendiumFocusOpener`
 * soft-navs there (e.g. /fraktion/<id>, /charakter/<id>) — which the root @modal
 * intercept turns into the in-context popup (books AND podcasts inside). Closing
 * the popup leaves the visitor in the browsable directory, not on the page they
 * searched from.
 */
function compendiumFocusHref(category: string, id: string): string {
  return `/compendium/${category}?focus=${encodeURIComponent(id)}`;
}

/** Faction pick → the Compendium faction directory with the faction popped open.
 *  In the /werke search this leaves the archive for the faction hub; the /werke
 *  "Faction" dropdown stays the in-place list filter. */
export function factionFocusHref(id: string): string {
  return compendiumFocusHref("fraktionen", id);
}

/** Primarch pick → the Compendium primarch directory with the primarch popped
 *  open. `id` is the canonical character id (the merged "Alpharius Omegon" uses
 *  `alpharius`), so picking the merged entry opens its union detail view. */
export function primarchFocusHref(id: string): string {
  return compendiumFocusHref("primarchen", id);
}

/**
 * Build the typeahead index from the loaded browse books — one book entry each,
 * plus the distinct factions, facets, formats (present-only, in canon order) and
 * authors. Shared so `/werke` (filter-in-place) and Home (navigate-into-archive)
 * feed their consoles from the *same* index rather than two drifting copies.
 * `rankSuggestions` re-groups by kind, so insertion order here is immaterial.
 */
export function buildSearchIndex(books: readonly BrowseBook[]): Suggestion[] {
  const index: Suggestion[] = [];
  const factionMap = new Map<string, string>();
  const authorSeen = new Map<string, string>();
  const facetSeen = new Set<string>();

  for (const b of books) {
    index.push({
      kind: "book",
      label: b.title,
      value: b.slug,
      hint: b.authors[0] ?? b.seriesName ?? null,
    });
    for (const f of b.factions) factionMap.set(f.id, f.name);
    for (const a of b.authors) {
      const key = a.toLowerCase();
      if (!authorSeen.has(key)) authorSeen.set(key, a);
    }
    for (const f of b.facets) {
      if (facetSeen.has(f.id)) continue;
      facetSeen.add(f.id);
      index.push({
        kind: "facet",
        label: f.name,
        value: f.id,
        hint: f.categoryName,
      });
    }
  }

  const presentFormats = new Set(books.map((b) => b.format).filter(Boolean));
  for (const f of FORMAT_ORDER) {
    if (!presentFormats.has(f)) continue;
    index.push({ kind: "format", label: FORMAT_LABELS[f] ?? f, value: f });
  }
  for (const [value, label] of factionMap) {
    index.push({ kind: "faction", label, value });
  }
  for (const name of authorSeen.values()) {
    index.push({ kind: "author", label: name, value: name });
  }

  return index;
}
