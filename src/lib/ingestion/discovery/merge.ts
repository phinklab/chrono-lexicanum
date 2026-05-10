/**
 * Pipeline V2 — discovery dedup.
 *
 * Merges two parallel `DiscoveredBook[]` streams (Wikipedia + TLBranson) into
 * one canonical roster. Primary key is `slug`; if a book appears in both
 * streams, the merge folds them into one record:
 *   - `sourcePages` set-union
 *   - `discoverySources` set-union
 *   - first `authorHint` / `seriesIndex` wins
 *   - `seriesHint` resolved by `genericityScore` (lower wins, lex-smaller as
 *     tie-break) — folding-order independent
 *   - `releaseYearCandidates` carries every distinct year that any source
 *     supplied; primary `releaseYear` is the lower of the candidates
 *     (Wikipedia tends to be more conservative on the date front)
 *   - `isEntryPoint` is OR-folded across sources
 *
 * Levenshtein-2 fallback on (normalized title, releaseYear) catches "The Solar
 * War" vs "Solar War" / "Inferno!" vs "Inferno" mismatches across sources.
 */
import type { DiscoveredBook } from "../v2/types";

export function mergeDiscoveredBooks(
  wikipedia: DiscoveredBook[],
  tlbranson: DiscoveredBook[],
): DiscoveredBook[] {
  const out = new Map<string, DiscoveredBook>();
  for (const book of wikipedia) foldInto(out, book);
  for (const book of tlbranson) foldInto(out, book);

  // Levenshtein-2 second pass: walk the result and merge entries whose
  // normalized titles are within distance 2 AND share a releaseYear (or one
  // has none).
  const merged = Array.from(out.values());
  return collapseSimilar(merged);
}

/**
 * Master-list-style anchors that surface from Wikipedia's per-book scrape
 * when the parser doesn't reach a more specific H3. They beat genuine series
 * names ("Eisenhorn", "Horus Heresy") on score so the latter always win.
 */
const MASTER_LIST_ANCHORS: ReadonlyArray<string> = [
  "list of warhammer 40,000 novels",
  "list of warhammer 40000 novels",
  "list of black library publications",
];

/**
 * Generic-vs-specific score for a `seriesHint`. Lower score = MORE specific
 * (better candidate to keep on a fold); higher score = MORE generic (loses).
 *
 * Components are additive so the score reflects compounding generic-ness
 * (e.g. "List of WH40k novels" hits master-list-anchor + list-of + novels +
 * length + word-count). Designed to be folding-order independent: the same
 * two strings always produce the same comparison result.
 *
 * Empty/undefined returns a sentinel high score so any defined hint wins.
 */
export function genericityScore(seriesHint: string | undefined | null): number {
  if (seriesHint === undefined || seriesHint === null) return 1_000;
  const s = seriesHint.toLowerCase().trim();
  if (s.length === 0) return 1_000;
  if (MASTER_LIST_ANCHORS.includes(s)) return 100;

  let score = 0;
  if (/^list of\b/.test(s)) score += 50;
  if (/\bnovels?\b/.test(s)) score += 20;
  if (/\bpublications?\b/.test(s)) score += 20;
  if (/\bbooks?\b/.test(s)) score += 20;
  if (/\bseries\b/.test(s)) score += 10;
  if (s.length > 30) score += 10;
  const wordCount = s.split(/\s+/).filter(Boolean).length;
  if (wordCount > 4) score += 10;
  return score;
}

/**
 * Pick the more-specific of two seriesHints. Lower `genericityScore` wins;
 * on a tie, the lexicographically smaller string wins (deterministic, NOT
 * dependent on which side was passed first).
 */
export function pickBetterSeriesHint(
  a: string | undefined,
  b: string | undefined,
): string | undefined {
  if (!a && !b) return undefined;
  if (!a) return b;
  if (!b) return a;
  const sa = genericityScore(a);
  const sb = genericityScore(b);
  if (sa < sb) return a;
  if (sb < sa) return b;
  return a.localeCompare(b) <= 0 ? a : b;
}

function foldInto(
  acc: Map<string, DiscoveredBook>,
  book: DiscoveredBook,
): void {
  const existing = acc.get(book.slug);
  if (!existing) {
    // Seed `releaseYearCandidates` from the first record.
    const seeded: DiscoveredBook = {
      ...book,
      releaseYearCandidates:
        book.releaseYear !== undefined ? [book.releaseYear] : undefined,
    };
    acc.set(book.slug, seeded);
    return;
  }

  for (const p of book.sourcePages) {
    if (!existing.sourcePages.includes(p)) existing.sourcePages.push(p);
  }
  for (const s of book.discoverySources) {
    if (!existing.discoverySources.includes(s)) existing.discoverySources.push(s);
  }
  if (!existing.authorHint && book.authorHint) existing.authorHint = book.authorHint;
  existing.seriesHint = pickBetterSeriesHint(existing.seriesHint, book.seriesHint);
  if (existing.seriesIndex === undefined && book.seriesIndex !== undefined) {
    existing.seriesIndex = book.seriesIndex;
  }
  if (book.isEntryPoint) existing.isEntryPoint = true;

  if (book.releaseYear !== undefined) {
    const prevList = existing.releaseYearCandidates ?? [];
    if (!prevList.includes(book.releaseYear)) {
      prevList.push(book.releaseYear);
      existing.releaseYearCandidates = prevList;
    }
    if (existing.releaseYear === undefined || book.releaseYear < existing.releaseYear) {
      existing.releaseYear = book.releaseYear;
    }
  }
}

function collapseSimilar(books: DiscoveredBook[]): DiscoveredBook[] {
  const result: DiscoveredBook[] = [];
  const consumed = new Set<number>();

  for (let i = 0; i < books.length; i++) {
    if (consumed.has(i)) continue;
    const a = books[i];
    const aTitle = normalize(a.title);
    let merged = a;
    for (let j = i + 1; j < books.length; j++) {
      if (consumed.has(j)) continue;
      const b = books[j];
      const bTitle = normalize(b.title);
      if (aTitle === bTitle) continue; // exact-equal handled by slug already
      if (levenshtein(aTitle, bTitle) > 2) continue;
      const yearOk =
        a.releaseYear === undefined ||
        b.releaseYear === undefined ||
        a.releaseYear === b.releaseYear;
      if (!yearOk) continue;
      // Fold b INTO merged (preserve a's slug — it was the canonical one).
      consumed.add(j);
      const folded: DiscoveredBook = { ...merged };
      for (const p of b.sourcePages) {
        if (!folded.sourcePages.includes(p)) folded.sourcePages.push(p);
      }
      for (const s of b.discoverySources) {
        if (!folded.discoverySources.includes(s)) folded.discoverySources.push(s);
      }
      if (!folded.authorHint && b.authorHint) folded.authorHint = b.authorHint;
      folded.seriesHint = pickBetterSeriesHint(folded.seriesHint, b.seriesHint);
      if (folded.seriesIndex === undefined && b.seriesIndex !== undefined) {
        folded.seriesIndex = b.seriesIndex;
      }
      if (b.isEntryPoint) folded.isEntryPoint = true;
      merged = folded;
    }
    result.push(merged);
  }
  return result;
}

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
}

/** Iterative Levenshtein with O(min(m,n)) memory. Cheap enough for the
 *  ~700-row scale we'll ever see in this pipeline. */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  if (Math.abs(a.length - b.length) > 2) return 3; // early-out for the ≤2 caller

  let prev = new Array(b.length + 1).fill(0).map((_, i) => i);
  let curr = new Array(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost,
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}
