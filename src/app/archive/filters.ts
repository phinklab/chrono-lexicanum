/**
 * Public book-browse filter contract. PURE — no `@/db`, no JSX —
 * so the server page and the client `WerkeFilters` island share one source of
 * truth for param names, sort keys, and the filter/sort semantics. Every
 * control is URL-mirrored: a filtered view is a shareable link.
 */
import { FORMAT_LABELS } from "@/lib/book-labels";
import type { BrowseBook } from "./loader";

export type SortKey = "title" | "title_desc" | "release" | "release_asc";

/** The two sort pills. A first click applies `id`; a second click on the
 *  already-active pill flips the direction (`flip`, with its own label) and a
 *  third flips back — `title`/`release` keep their pre-WA-B1 meaning (A–Z /
 *  newest-first), so every existing sort link stays valid. */
export const SORT_OPTIONS: ReadonlyArray<{
  id: SortKey;
  label: string;
  flip: SortKey;
  flipLabel: string;
}> = [
  { id: "title", label: "Title A–Z", flip: "title_desc", flipLabel: "Title Z–A" },
  { id: "release", label: "Newest", flip: "release_asc", flipLabel: "Oldest" },
];

const SORT_KEYS: ReadonlySet<string> = new Set([
  "title",
  "title_desc",
  "release",
  "release_asc",
]);

/** Shared by the server parse and the client island (which re-derives the
 *  active sort from `useSearchParams`) — one validator, no drift. */
export function parseSortKey(raw: string | null | undefined): SortKey {
  return raw != null && SORT_KEYS.has(raw) ? (raw as SortKey) : "title";
}

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
  /** Multi-facet selection (WA-B1), URL-mirrored as repeated `facet` params —
   *  `?facet=grimdark&facet=war_story` — so every combination is a shareable
   *  link and every pre-WA-B1 single-facet link stays valid. Deduped, URL
   *  order. Semantics: OR within one facet category, AND across categories
   *  (standard faceted search); the category of each id is resolved from the
   *  catalogue itself in `applyWorksFilters`. */
  facets: string[];
  sort: SortKey;
  /** 1-based register page (server-side pagination, Launch S6). Anything
   *  unparsable normalises to 1; out-of-range is clamped in `paginateWorks`
   *  once the filtered total is known. */
  page: number;
}

/**
 * Register page size. Filtering/sorting/counts/facets always run over the FULL
 * catalogue — this only caps how many rows one document renders (the DOM/HTML
 * budget; ~900 rows in one flight measured 1.94 MB HTML before S6).
 */
export const WORKS_PAGE_SIZE = 100;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** Validators for the remaining URL params, analogous to `parseSortKey`.
 *  No injection risk either way (pure in-memory filters, no SQL), but
 *  an unvalidated value would echo attacker-shaped text back into the filter
 *  links the page renders. `format` has a closed enum; faction/facet IDs are
 *  lowercase snake_case reference-table slugs (CLAUDE.md data conventions) —
 *  anything outside that shape cannot match a row, so it parses to `null`
 *  (= filter off) instead of riding along as an opaque string. */
const ID_PATTERN = /^[a-z0-9_-]{1,64}$/;

function parseFormat(raw: string | undefined): string | null {
  const s = raw?.trim();
  return s && FORMAT_ORDER.includes(s) ? s : null;
}

function parseId(raw: string | undefined): string | null {
  const s = raw?.trim();
  return s && ID_PATTERN.test(s) ? s : null;
}

/** Every occurrence of a repeated param, validated like `parseId` and deduped
 *  in URL order. An id that fails `ID_PATTERN` is dropped (filter off), one
 *  that merely matches no catalogue row rides along and filters to zero —
 *  same contract the single `facet` param always had. */
function parseIdList(v: string | string[] | undefined): string[] {
  const raw = v == null ? [] : Array.isArray(v) ? v : [v];
  const out: string[] = [];
  for (const entry of raw) {
    const id = parseId(entry);
    if (id && !out.includes(id)) out.push(id);
  }
  return out;
}

function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

export function parseWorksParams(sp: {
  q?: string | string[];
  faction?: string | string[];
  format?: string | string[];
  facet?: string | string[];
  sort?: string | string[];
  page?: string | string[];
}): WorksParams {
  return {
    q: first(sp.q)?.trim() ?? "",
    faction: parseId(first(sp.faction)),
    format: parseFormat(first(sp.format)),
    facets: parseIdList(sp.facet),
    sort: parseSortKey(first(sp.sort)),
    page: parsePage(first(sp.page)),
  };
}

export function isFiltered(p: WorksParams): boolean {
  return Boolean(p.q || p.faction || p.format || p.facets.length > 0);
}

/** The non-facet filters (q / faction / format). Facet matching lives in
 *  `applyWorksFilters` / `facetHitCounts`, which need the selection grouped by
 *  category first. */
function matchesBase(book: BrowseBook, p: WorksParams): boolean {
  if (p.format && book.format !== p.format) return false;
  if (p.faction && !book.factions.some((f) => f.id === p.faction)) return false;
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
  if (sort === "release" || sort === "release_asc") {
    // Unknown years sink to the end in BOTH directions — "oldest first" must
    // not open the register with a wall of undated entries.
    if (a.releaseYear == null && b.releaseYear != null) return 1;
    if (a.releaseYear != null && b.releaseYear == null) return -1;
    if (a.releaseYear != null && b.releaseYear != null && a.releaseYear !== b.releaseYear) {
      return sort === "release"
        ? b.releaseYear - a.releaseYear
        : a.releaseYear - b.releaseYear;
    }
    return a.title.localeCompare(b.title, "en");
  }
  const byTitle = a.title.localeCompare(b.title, "en");
  return sort === "title_desc" ? -byTitle : byTitle;
}

/**
 * The selected facet ids, grouped by the category each id belongs to —
 * resolved from the catalogue itself, so the URL never needs to carry the
 * category and the grouping cannot drift from the data. An id no catalogue
 * row carries gets a pseudo-group of its own: it can never match, so a bogus
 * (but pattern-valid) deep link filters to zero exactly like the single
 * `facet` param always did.
 */
function groupFacetSelection(
  books: readonly BrowseBook[],
  ids: readonly string[],
): Map<string, Set<string>> {
  const groups = new Map<string, Set<string>>();
  if (ids.length === 0) return groups;
  const categoryByFacet = new Map<string, string>();
  for (const b of books) {
    for (const f of b.facets) categoryByFacet.set(f.id, f.categoryId);
  }
  for (const id of ids) {
    const cat = categoryByFacet.get(id) ?? `__unknown:${id}`;
    const set = groups.get(cat);
    if (set) set.add(id);
    else groups.set(cat, new Set([id]));
  }
  return groups;
}

function matchesFacetGroups(
  book: BrowseBook,
  groups: ReadonlyArray<ReadonlySet<string>>,
): boolean {
  return groups.every((set) => book.facets.some((f) => set.has(f.id)));
}

export function applyWorksFilters(
  books: readonly BrowseBook[],
  p: WorksParams,
): BrowseBook[] {
  const groups = [...groupFacetSelection(books, p.facets).values()];
  return books
    .filter((b) => matchesBase(b, p) && matchesFacetGroups(b, groups))
    .sort((a, b) => compare(a, b, p.sort));
}

/**
 * Selection-aware hit count per facet value, always over the FULL catalogue
 * (S6: counts never derive from the paged slice). For a chip in category C the
 * count answers "how many register rows carry this facet under the current
 * q/faction/format filters and every OTHER category's selection" — the
 * standard faceted-search count: within C the semantics are OR, so C's own
 * selection must not throttle C's chips (adding a second tone could otherwise
 * show impossible numbers). Zero means the chip is a dead end from HERE; the
 * rail dims it instead of hiding it.
 *
 * One pass over the catalogue: a book that fails the base filters counts
 * nowhere; one that fails exactly one category's selection counts only toward
 * that category's chips; one that fails none counts toward every visible facet
 * it carries.
 */
export function facetHitCounts(
  books: readonly BrowseBook[],
  p: WorksParams,
): Map<string, number> {
  const groups = groupFacetSelection(books, p.facets);
  const counts = new Map<string, number>();
  for (const b of books) {
    if (!matchesBase(b, p)) continue;
    let failedCategory: string | null = null;
    let failedMore = false;
    for (const [cat, set] of groups) {
      if (!b.facets.some((f) => set.has(f.id))) {
        if (failedCategory !== null) {
          failedMore = true;
          break;
        }
        failedCategory = cat;
      }
    }
    if (failedMore) continue;
    for (const f of b.facets) {
      if (failedCategory !== null && f.categoryId !== failedCategory) continue;
      counts.set(f.id, (counts.get(f.id) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * The v1 panel categories (WA-B1), in display order. Chosen from the 11
 * user-visible categories because they answer the questions a browsing reader
 * (or a Reddit recommendation link) actually asks — what mood, what kind of
 * story, whose side, where to start, how long, what it's about. Deliberately
 * NOT in the panel: `format` (the Format dropdown already filters the richer
 * `book_format` enum), `language` (one value — no filter power),
 * `protagonist_class` (11 values would double the panel's height for a
 * second-order question), `protagonist_gender` and `scope` (v2 candidates).
 * All of them stay reachable through the search console's facet suggestions —
 * the panel is a subset of ONE contract, not a second truth.
 */
export const PANEL_FACET_CATEGORIES: ReadonlyArray<{ id: string; label: string }> = [
  { id: "tone", label: "Tone" },
  { id: "plot_type", label: "Plot Type" },
  { id: "pov_side", label: "POV Side" },
  { id: "entry_point", label: "Entry Point" },
  { id: "length_tier", label: "Length" },
  { id: "theme", label: "Theme" },
];

/** Curated OUT of the filter panel (review round 2, Session 253): micro-niche
 *  tones (12 + 42 of 896 books) whose chips read as noise beside the five big
 *  ones. Still fully valid filter ids — a search pick or a shared link applies
 *  them and shows a removable chip (`inPanel: false`); they are only never
 *  OFFERED as panel chips. */
export const PANEL_EXCLUDED_FACETS: ReadonlySet<string> = new Set([
  "hopepunk",
  "satirical",
]);

export interface FacetPanelOption {
  id: string;
  name: string;
  /** Selection-aware count from `facetHitCounts` — 0 renders dimmed. */
  count: number;
  active: boolean;
}

export interface FacetPanelGroup {
  id: string;
  label: string;
  options: FacetPanelOption[];
}

/**
 * The facet half of the filter panel: one chip group per v1 category, options
 * ordered by full-catalogue frequency (most common first — self-maintaining,
 * and stable while filtering: only the displayed counts change with a
 * selection, never the chip order). Categories the catalogue doesn't carry
 * (or that the loader's visibility gate removed) simply don't appear.
 */
export function buildFacetPanel(
  books: readonly BrowseBook[],
  p: WorksParams,
): FacetPanelGroup[] {
  const catalogueCounts = new Map<string, number>();
  const names = new Map<string, string>();
  const categoryLabels = new Map<string, string>();
  const byCategory = new Map<string, Set<string>>();
  for (const b of books) {
    for (const f of b.facets) {
      catalogueCounts.set(f.id, (catalogueCounts.get(f.id) ?? 0) + 1);
      names.set(f.id, f.name);
      if (f.categoryName) categoryLabels.set(f.categoryId, f.categoryName);
      const set = byCategory.get(f.categoryId);
      if (set) set.add(f.id);
      else byCategory.set(f.categoryId, new Set([f.id]));
    }
  }

  const hitCounts = facetHitCounts(books, p);
  const selected = new Set(p.facets);

  const groups: FacetPanelGroup[] = [];
  for (const cat of PANEL_FACET_CATEGORIES) {
    const ids = byCategory.get(cat.id);
    if (!ids || ids.size === 0) continue;
    const options = [...ids]
      .filter((id) => !PANEL_EXCLUDED_FACETS.has(id))
      .map((id): FacetPanelOption => ({
        id,
        name: names.get(id) ?? id,
        count: hitCounts.get(id) ?? 0,
        active: selected.has(id),
      }))
      .sort(
        (a, b) =>
          (catalogueCounts.get(b.id) ?? 0) - (catalogueCounts.get(a.id) ?? 0) ||
          a.name.localeCompare(b.name, "en"),
      );
    if (options.length === 0) continue;
    groups.push({ id: cat.id, label: categoryLabels.get(cat.id) ?? cat.label, options });
  }
  return groups;
}

export interface ActiveFacetChip {
  id: string;
  name: string;
  category: string | null;
  /** True when a panel chip already shows this selection — the island then
   *  skips the extra removable chip (one visible truth per selection). */
  inPanel: boolean;
}

/** Resolve the selected facet ids to display chips (name + category), in
 *  selection order. An id the catalogue doesn't know keeps its raw id as the
 *  label — visible and removable, exactly like the old single-facet chip. */
export function resolveActiveFacets(
  books: readonly BrowseBook[],
  ids: readonly string[],
): ActiveFacetChip[] {
  if (ids.length === 0) return [];
  const panelCategories = new Set(PANEL_FACET_CATEGORIES.map((c) => c.id));
  const byId = new Map<string, { name: string; categoryId: string; categoryName: string | null }>();
  for (const b of books) {
    for (const f of b.facets) {
      if (!byId.has(f.id)) {
        byId.set(f.id, { name: f.name, categoryId: f.categoryId, categoryName: f.categoryName });
      }
    }
  }
  return ids.map((id) => {
    const hit = byId.get(id);
    return hit
      ? {
          id,
          name: hit.name,
          category: hit.categoryName,
          inPanel:
            panelCategories.has(hit.categoryId) && !PANEL_EXCLUDED_FACETS.has(id),
        }
      : { id, name: id, category: null, inPanel: false };
  });
}

export interface WorksPage {
  /** The rows this page renders (a slice of the FULL filtered+sorted list). */
  items: BrowseBook[];
  /** Requested page clamped into [1, totalPages] — an over-range deep link
   *  (stale bookmark after the catalogue shrank) lands on the last page, an
   *  under-range one on the first; never an artificial empty register. */
  page: number;
  totalPages: number;
  /** 0-based index of `items[0]` in the filtered list — keeps the printed
   *  register numbers (001…) continuous across pages. */
  offset: number;
}

/** Cut one register page out of the filtered+sorted catalogue. Pure slice —
 *  counts, facet options and search always come from the full list. */
export function paginateWorks(
  filtered: readonly BrowseBook[],
  requestedPage: number,
): WorksPage {
  const totalPages = Math.max(1, Math.ceil(filtered.length / WORKS_PAGE_SIZE));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const offset = (page - 1) * WORKS_PAGE_SIZE;
  return {
    items: filtered.slice(offset, offset + WORKS_PAGE_SIZE),
    page,
    totalPages,
    offset,
  };
}

/**
 * Which page numbers the pager renders: first, last, and a window around the
 * current page; `null` marks a gap (an ellipsis). With ≤ 7 pages everything is
 * listed, so the pager never jumps in width for the common catalogue sizes.
 */
export function pagerItems(page: number, totalPages: number): Array<number | null> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const wanted = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  const out: Array<number | null> = [];
  for (let n = 1; n <= totalPages; n++) {
    if (wanted.has(n)) {
      out.push(n);
    } else if (out[out.length - 1] !== null) {
      out.push(null);
    }
  }
  return out;
}

/* Universal search suggestions (typeahead).
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
  | "character"
  | "world"
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
  /** Canonical label when this row is an alias hit (`Alias → Canonical`). */
  aliasOf?: string | null;
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
  character: 4,
  world: 5,
  facet: 6,
  format: 7,
  author: 8,
};
const GROUP_CAP: Record<SuggestKind, number> = {
  book: 6,
  podcast: 6,
  faction: 5,
  primarch: 5,
  character: 5,
  world: 5,
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

function dedupeKey(s: Suggestion): string {
  return `${s.kind}:${s.value}`;
}

function aliasRank(s: Suggestion): number {
  return s.aliasOf ? 1 : 0;
}

function preferRankedSuggestion(
  current: RankedSuggestion,
  candidate: RankedSuggestion,
): RankedSuggestion {
  if (candidate.score !== current.score) {
    return candidate.score < current.score ? candidate : current;
  }
  if (aliasRank(candidate) !== aliasRank(current)) {
    return aliasRank(candidate) < aliasRank(current) ? candidate : current;
  }
  return candidate.label.localeCompare(current.label, "en") < 0 ? candidate : current;
}

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

  const byEntity = new Map<string, RankedSuggestion>();
  for (const s of index) {
    const labelScore = matchScore(s.label.toLowerCase(), needle);
    let score = labelScore;
    if (score < 0 && s.hint) {
      const hintScore = matchScore(s.hint.toLowerCase(), needle);
      if (hintScore >= 0) score = hintScore + 4; // ranks under every label hit
    }
    if (score < 0) continue;
    const ranked = { ...s, score };
    const key = dedupeKey(s);
    const current = byEntity.get(key);
    byEntity.set(key, current ? preferRankedSuggestion(current, ranked) : ranked);
  }

  const scored = [...byEntity.values()];
  scored.sort(
    (a, b) =>
      GROUP_ORDER[a.kind] - GROUP_ORDER[b.kind] ||
      a.score - b.score ||
      aliasRank(a) - aliasRank(b) ||
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
  character: "Characters",
  world: "Worlds",
  facet: "Facets",
  format: "Formats",
  author: "Authors",
};

export type EntitySuggestKind = "faction" | "character" | "world";

export interface EntitySuggestionSource {
  kind: EntitySuggestKind;
  label: string;
  value: string;
  hint?: string | null;
  aliases?: readonly string[];
}

export function buildEntitySuggestions(
  entities: readonly EntitySuggestionSource[],
): Suggestion[] {
  const out: Suggestion[] = [];
  for (const entity of entities) {
    out.push({
      kind: entity.kind,
      label: entity.label,
      value: entity.value,
      hint: entity.hint ?? null,
    });

    const seenAliases = new Set<string>();
    for (const rawAlias of entity.aliases ?? []) {
      const alias = rawAlias.trim();
      const aliasKey = alias.toLowerCase();
      if (!alias || aliasKey === entity.label.toLowerCase() || seenAliases.has(aliasKey)) {
        continue;
      }
      seenAliases.add(aliasKey);
      out.push({
        kind: entity.kind,
        label: `${alias} → ${entity.label}`,
        value: entity.value,
        hint: entity.hint ?? null,
        aliasOf: entity.label,
      });
    }
  }
  return out;
}

/**
 * Where an entity pick from the universal search lands, shared by every console
 * (Home, /podcasts, /werke) so the behaviour can't drift: the matching Compendium
 * directory with that entity's overlay auto-opened. The directory page reads
 * `focus`, resolves it to the row's detail href, and `CompendiumFocusOpener`
 * soft-navs there (e.g. /faction/<id>, /character/<id>) — which the root @modal
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
  return compendiumFocusHref("factions", id);
}

/** Primarch pick → the Compendium primarch directory with the primarch popped
 *  open. `id` is the canonical character id (the merged "Alpharius Omegon" uses
 *  `alpharius`), so picking the merged entry opens its union detail view. */
export function primarchFocusHref(id: string): string {
  return compendiumFocusHref("primarchs", id);
}

export function characterFocusHref(id: string): string {
  return compendiumFocusHref("characters", id);
}

export function worldFocusHref(id: string): string {
  return compendiumFocusHref("worlds", id);
}

/**
 * Build the media/filter part of the typeahead index from the loaded browse books
 * — one book entry each, plus distinct facets, formats (present-only, in canon
 * order) and authors. Compendium entity rows (factions / characters / worlds +
 * aliases) are merged by the host pages from `loadCompendiumSearchSuggestions`,
 * because their hints and visibility rules belong to the Compendium loaders.
 * Shared so `/werke` (filter-in-place) and Home (navigate-into-archive) feed
 * their consoles from the *same* index rather than two drifting copies.
 * `rankSuggestions` re-groups by kind, so insertion order here is immaterial.
 */
export function buildSearchIndex(books: readonly BrowseBook[]): Suggestion[] {
  const index: Suggestion[] = [];
  const authorSeen = new Map<string, string>();
  const facetSeen = new Set<string>();

  for (const b of books) {
    index.push({
      kind: "book",
      label: b.title,
      value: b.slug,
      hint: b.authors[0] ?? b.seriesName ?? null,
    });
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
  for (const name of authorSeen.values()) {
    index.push({ kind: "author", label: name, value: name });
  }

  return index;
}
