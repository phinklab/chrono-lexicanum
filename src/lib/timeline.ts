/**
 * Timeline utilities — shared between the server page and the two client
 * components (Overview / EraDetail). Ported from the prototype's
 * `archive/prototype-v1/components/util.jsx` with two changes:
 *
 *   1. `projectY` is a pure factory (`makeProjectY(eras)`) instead of the
 *      prototype's lazy `window.ERAS` build. The Timeline page builds the
 *      projector once per render with the eras prop and passes the bound
 *      function to the client components.
 *   2. `formatM` is ported as-is from the prototype's `data/books.js`. There
 *      is a known 1000-year disagreement between this formula and the
 *      TopChrome toggle's M30/M31/M42 labels — see `formatM`'s docstring and
 *      the brief 008 hazard note. Reconciling that is a separate cleanup
 *      brief; in the meantime the era kicker shows what the prototype showed.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Reference table row ported from `eras.json` / Drizzle `eras` table. */
export interface Era {
  id: string;
  name: string;
  /** Custom in-universe year: (M-1)*1000 + year_within_M. */
  start: number;
  /** Custom in-universe year (inclusive end). */
  end: number;
  tone: string | null;
  sortOrder: number;
}

/** Series row used for track packing in EraDetail and the legend. */
export interface SeriesRef {
  id: string;
  name: string;
}

/** Book shape consumed by Overview + EraDetail (post server-side adaptation). */
export interface TimelineBook {
  id: string;
  slug: string;
  title: string;
  author: string;
  startY: number;
  endY: number;
  /** Faction ids attached via book_factions. May be empty. */
  factions: string[];
  /** Series membership, if any. `order` is the 1-based seriesIndex. */
  series: { id: string; order: number | null } | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants — full timeline span (a touch before/after the canonical eras)
// ─────────────────────────────────────────────────────────────────────────────

export const TIMELINE_MIN = 30700;
export const TIMELINE_MAX = 42200;
export const TIMELINE_SPAN = TIMELINE_MAX - TIMELINE_MIN;

// ─────────────────────────────────────────────────────────────────────────────
// projectY — segmented ribbon projection
//
// Each era gets a slice of ribbon proportional to (real-span)^0.22 — a
// dampened power curve. The Heresy (16 years, dense with novels) and the
// Long War (5000 years, mostly empty) end up legible side-by-side; without
// dampening, Heresy is crushed to a sliver and Long War dominates.
//
// `lead` and `tail` reserve a small fraction at each end of the ribbon for
// pre-Crusade and post-Indomitus space, so the first and last era labels
// don't sit flush against the ribbon caps.
// ─────────────────────────────────────────────────────────────────────────────

interface Segment { y0: number; y1: number; x0: number; x1: number }

function buildSegments(eras: readonly Era[]): Segment[] {
  if (eras.length === 0) return [];
  const sorted = [...eras].sort((a, b) => a.start - b.start);
  const lead = 0.03;
  const tail = 0.03;
  const dampen = 0.22;
  const weights = sorted.map((e) => Math.pow(Math.max(1, e.end - e.start), dampen));
  const totalW = weights.reduce((s, w) => s + w, 0);
  const usable = 1 - lead - tail;
  const segs: Segment[] = [];
  segs.push({ y0: TIMELINE_MIN, y1: sorted[0].start, x0: 0, x1: lead });
  let acc = lead;
  sorted.forEach((e, i) => {
    const w = (weights[i] / totalW) * usable;
    segs.push({ y0: e.start, y1: e.end, x0: acc, x1: acc + w });
    acc += w;
  });
  segs.push({ y0: sorted[sorted.length - 1].end, y1: TIMELINE_MAX, x0: 1 - tail, x1: 1 });
  return segs;
}

/**
 * Returns a projector `(y) => x in 0..1`. Build once per render with the
 * eras you've fetched; pass the resulting function as a prop to the client
 * components rather than re-building per render.
 */
export function makeProjectY(eras: readonly Era[]): (y: number) => number {
  const segments = buildSegments(eras);
  if (segments.length === 0) {
    return (y) => Math.max(0, Math.min(1, (y - TIMELINE_MIN) / TIMELINE_SPAN));
  }
  return (y) => {
    if (y <= segments[0].y0) return 0;
    if (y >= segments[segments.length - 1].y1) return 1;
    for (let i = 0; i < segments.length; i++) {
      const s = segments[i];
      if (y >= s.y0 && y <= s.y1) {
        const span = s.y1 - s.y0;
        const t = span === 0 ? 0.5 : (y - s.y0) / span;
        return s.x0 + t * (s.x1 - s.x0);
      }
      // Gap between segments — interpolate to the next segment's start
      const next = segments[i + 1];
      if (next && y > s.y1 && y < next.y0) {
        const gap = next.y0 - s.y1;
        const t = gap === 0 ? 0.5 : (y - s.y1) / gap;
        return s.x1 + t * (next.x0 - s.x1);
      }
    }
    return Math.max(0, Math.min(1, (y - TIMELINE_MIN) / TIMELINE_SPAN));
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// formatM — prototype's M-scale display formatter
//
// HAZARD: per brief 008, this disagrees with TopChrome's M30/M31/M42 toggle
// labels by exactly 1000 years. e.g. eras.json has horus_heresy at
// start=30998, but `formatM(30998)` returns "M31.998" (Math.floor(30998/1000)+1
// = 31). Either the encoded years are off by 1000 or formatM is wrong or the
// toggle labels need re-namespacing — to be reconciled in a later brief.
// Until then, ship as-is so the era kicker reads what the prototype showed.
// ─────────────────────────────────────────────────────────────────────────────

export function formatM(absYear: number): string {
  const m = Math.floor(absYear / 1000) + 1;
  const frac = absYear - (m - 1) * 1000;
  return `M${m}.${String(Math.floor(frac)).padStart(3, "0")}`;
}

export function formatRange(a: number, b: number): string {
  const fa = formatM(a);
  const fb = formatM(b);
  return fa === fb ? fa : `${fa}–${fb}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter matching — kept in shape for the upcoming 2a.2 FilterRail brief.
// Returns null when no filter is active, true on match, false on miss.
// ─────────────────────────────────────────────────────────────────────────────

export interface BookFilters {
  factions: ReadonlySet<string>;
  series: ReadonlySet<string>;
  authors: ReadonlySet<string>;
  characters: ReadonlySet<string>;
}

export function emptyFilters(): BookFilters {
  return { factions: new Set(), series: new Set(), authors: new Set(), characters: new Set() };
}

export function bookMatchesFilters(book: TimelineBook, f: BookFilters): boolean | null {
  const hasAny = f.factions.size + f.series.size + f.authors.size + f.characters.size > 0;
  if (!hasAny) return null;
  if (f.factions.size && !book.factions.some((id) => f.factions.has(id))) return false;
  if (f.series.size && (!book.series || !f.series.has(book.series.id))) return false;
  if (f.authors.size && !f.authors.has(book.author)) return false;
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tiny string-hash for stable per-book vertical jitter on the ribbon.
// Identical to the prototype's `hash` so book-pin positions are reproducible.
// ─────────────────────────────────────────────────────────────────────────────

export function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) & 0xffffff;
  }
  return h;
}
