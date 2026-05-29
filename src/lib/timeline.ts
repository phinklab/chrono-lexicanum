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
  /**
   * Author display names, ordered. The Stufe-2a server adapter feeds this
   * from `work_persons` rows where role='author' (see `src/app/timeline/page.tsx`).
   * May be empty when a work has no recorded authors yet — render falls back
   * to "no author" treatment in EraDetail.
   */
  authors: string[];
  startY: number;
  endY: number;
  /**
   * Era-anchor (Stufe 2c.0): the canonical era this book lives in. Editorial
   * placement, not derived from startY/endY anymore. Empty string flags a
   * seed/data mismatch — Overview/EraDetail guard against unknown ids and
   * skip the book rather than miscount it.
   */
  primaryEraId: string;
  /** Faction ids attached via work_factions. May be empty. */
  factions: string[];
  /** Series membership, if any. `order` is the 1-based seriesIndex. */
  series: { id: string; order: number | null } | null;
  /**
   * Publication format → marker shape in the Chronicle ribbon/lanes. Sourced
   * from `book_details.format` via `normalizeFormat`; falls back to `"novel"`
   * when the column is null (true for the whole seed catalogue today).
   */
  fmt: BookFormat;
}

/**
 * Heavy book shape consumed by `<DetailPanel>` (Stufe 2c.1). Loaded only when
 * `?book=<slug>` is present on `/timeline`. Lives next to `TimelineBook` so the
 * client component can `import type { BookDetail }`; the actual loader is
 * server-only and lives in `src/app/timeline/page.tsx`.
 */
export type ExternalLinkKind =
  | "reference"
  | "read"
  | "listen"
  | "watch"
  | "buy_print"
  | "trailer"
  | "official_page";

export type FactionAlignment = "imperium" | "chaos" | "xenos" | "neutral";

export interface BookDetail {
  id: string;
  slug: string;
  title: string;
  authors: string[];
  releaseYear: number | null;
  startY: number;
  endY: number;
  primaryEraId: string;
  synopsis: string | null;
  /** Universal `works.coverUrl` — null today; placeholder card renders instead. */
  coverUrl: string | null;
  factions: Array<{
    id: string;
    name: string;
    alignment: FactionAlignment;
    tone: string | null;
    /** `factions.glyph` text (single character or symbol). Used inline until
     *  the FactionGlyph SVG component lands in 2a.2. */
    glyph: string | null;
    /** `work_factions.role`: 'primary' | 'supporting' | 'antagonist'. */
    role: string;
  }>;
  /** Keyed by `facet_categories.id`. Loader returns ALL 12 categories the work
   *  has values for; the panel curates 5 (entry_point, length_tier, tone, theme,
   *  content_warning). FilterRail (2a.2) will read the rest. */
  facets: Record<string, {
    categoryId: string;
    categoryName: string;
    values: Array<{ id: string; name: string }>;
  }>;
  series: {
    id: string;
    name: string;
    totalPlanned: number | null;
    /** `bookDetails.seriesIndex`, 1-based. */
    order: number | null;
    /** Sibling siblings filter `primaryEraId IS NOT NULL` so the URL push
     *  always has both params. Cross-era nav is the norm, not the exception. */
    prev: { slug: string; title: string; order: number | null; primaryEraId: string } | null;
    next: { slug: string; title: string; order: number | null; primaryEraId: string } | null;
  } | null;
  externalLinks: Array<{
    kind: ExternalLinkKind;
    serviceId: string;
    serviceName: string;
    url: string;
    label: string | null;
  }>;
  /** Forward-compat: `characters` table is 0 rows today; render only when non-empty. */
  characters: Array<{ id: string; name: string; role: string }>;
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
// FilterRail (Stufe 2a.2 / brief 029) — server-side filter shape. The actual
// filter SQL lives in `loadEraBooks` (src/app/timeline/page.tsx); these types
// describe the loader's return value and the FilterRail's prop interface.
// Client-side per-book matching helpers from the pre-2a.2 scaffolding are
// gone — brief constraint 8 forbids client-side filter over pre-loaded books.
// ─────────────────────────────────────────────────────────────────────────────

/** A single selectable option in the FilterRail (faction or length-tier). */
export interface FilterOption {
  id: string;
  name: string;
}

/** Era-scoped loader payload. `availableFactions`/`availableLengthTiers` are
 *  computed unconditional on current selection so the option list stays stable
 *  as the user toggles pills. `totalInEra` is the unfiltered count for the
 *  "X of Y" headline; `matchedCount === books.length`. */
export interface EraBooksData {
  books: TimelineBook[];
  availableFactions: FilterOption[];
  availableLengthTiers: FilterOption[];
  totalInEra: number;
  matchedCount: number;
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

// ─────────────────────────────────────────────────────────────────────────────
// Chronicle ribbon projection + M-scale labels
//
// Ported from `public/lab/timeline-prototype/projection.js` (the prototype
// Philipp approved). These power the new <ChronicleClient> shell. They are
// ADDITIVE — the legacy `makeProjectY` / `formatM` above stay until the old
// Overview / EraDetail components are retired.
//
// ENCODING (read carefully — this is the documented ±1000 hazard, resolved):
// the live seed (`scripts/seed.ts` ← books.json / eras.json) stores years in
// the `M*1000 + year_within_M` convention — Horus Rising = 30998, the Great
// Crusade starts at 30798. `formatMScale` is the matching inverse:
// `floor(n/1000)` for the millennium, NO +1. So 30998 → "998.M30",
// 31014 → "014.M31". This is the year-first label the prototype shows and is
// internally consistent with the era bounds. The legacy `formatM` above adds
// +1 (the hazard); the new shell and `DetailPanel` both use `formatMScale`.
// ─────────────────────────────────────────────────────────────────────────────

/** Publication formats we render a distinct marker shape for. */
export type BookFormat =
  | "novel"
  | "novella"
  | "short_story"
  | "anthology"
  | "collection"
  | "omnibus"
  | "audio_drama"
  | "artbook"
  | "scriptbook";

const KNOWN_FORMATS: ReadonlySet<string> = new Set<BookFormat>([
  "novel",
  "novella",
  "short_story",
  "anthology",
  "collection",
  "omnibus",
  "audio_drama",
  "artbook",
  "scriptbook",
]);

/** Human label per format, for the tooltip / detail chrome. */
export const FORMAT_LABEL: Record<BookFormat, string> = {
  novel: "Novel",
  novella: "Novella",
  short_story: "Short Story",
  anthology: "Anthology",
  collection: "Collection",
  omnibus: "Omnibus",
  audio_drama: "Audio Drama",
  artbook: "Art Book",
  scriptbook: "Script Book",
};

/**
 * Coerce a raw `book_details.format` string into a known `BookFormat`.
 * Tolerates casing / spaces / hyphens ("Audio Drama" → "audio_drama").
 * Returns null for null / empty / unrecognised values — callers fall back to
 * `"novel"` so an un-tagged book still renders a sensible marker.
 */
export function normalizeFormat(raw: string | null | undefined): BookFormat | null {
  if (!raw) return null;
  const k = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return KNOWN_FORMATS.has(k) ? (k as BookFormat) : null;
}

/**
 * M-scale label in the seed convention (`M*1000 + year`), year-first.
 * 30998 → "998.M30", 42012 → "012.M42".
 */
export function formatMScale(n: number): string {
  const mil = Math.floor(n / 1000);
  const yr = Math.round(n - mil * 1000);
  return `${String(yr).padStart(3, "0")}.M${mil}`;
}

/** `formatMScale` range; collapses to a single label when both ends match. */
export function formatScaleRange(a: number, b: number): string {
  const fa = formatMScale(a);
  const fb = formatMScale(b);
  return fa === fb ? fa : `${fa} – ${fb}`;
}

/** Axis-tick label — just the year within the millennium (the M rides on the
 *  era header). 30998 → "998". */
export function formatTickYear(n: number): string {
  const yr = Math.round(n - Math.floor(n / 1000) * 1000);
  return String(yr).padStart(3, "0");
}

/**
 * Author-cleaned Lexicanum chronology string → `{ startY, endY }` in the
 * eras.json convention (`M*1000 + year_within_M`). Ported verbatim from the
 * prototype lab (`public/lab/timeline-prototype/projection.js`) so the live
 * Chronicle parses the curated roster exactly as the approved prototype did.
 *
 * Accepts a single year (`"004.M31"`), a range (`"004-014.M31"` / en-dash
 * `"812–830.M41"`), a decade suffix (`"540s.M32"` → the decade's lead year),
 * or a bare millennium (`"M32"` → mid-millennium). Returns
 * `{ startY: null, endY: null }` for anything it can't parse, so callers can
 * fall back to a sentinel year rather than NaN.
 */
export function parseChrono(raw: string): { startY: number | null; endY: number | null } {
  const s = String(raw ?? "").trim();
  // range: "004-014.M31" (also en-dash)
  let m = s.match(/^(\d{1,3})\s*[-–]\s*(\d{1,3})\.M(\d{1,2})$/i);
  if (m) {
    const mil = parseInt(m[3], 10);
    return { startY: mil * 1000 + parseInt(m[1], 10), endY: mil * 1000 + parseInt(m[2], 10) };
  }
  // single year, with optional decade suffix: "004.M31" / "540s.M32"
  m = s.match(/^(\d{1,3})s?\.M(\d{1,2})$/i);
  if (m) {
    const mil = parseInt(m[2], 10);
    const y = mil * 1000 + parseInt(m[1], 10);
    return { startY: y, endY: y };
  }
  // bare millennium: "M32" → mid-millennium
  m = s.match(/^M(\d{1,2})$/i);
  if (m) {
    const y = parseInt(m[1], 10) * 1000 + 500;
    return { startY: y, endY: y };
  }
  return { startY: null, endY: null };
}

/**
 * A canonical era expanded into a CONTIGUOUS lab segment so every dated book
 * maps to exactly one segment with no holes. The first era reaches down to
 * `TIMELINE_MIN`, the last up to `TIMELINE_MAX`, and each interior era runs to
 * the next era's start − 1. The untouched canonical bounds ride on
 * `canonStart` / `canonEnd` for display.
 */
export interface LabEra {
  id: string;
  name: string;
  tone: string | null;
  /** Display start (contiguous tiling). */
  start: number;
  /** Display end (contiguous tiling). */
  end: number;
  /** Canonical era start from the DB (for the header range label). */
  canonStart: number;
  /** Canonical era end from the DB. */
  canonEnd: number;
}

/** A `LabEra` with its allocated 0..1 slice of the ribbon width. */
export interface RibbonSegment extends LabEra {
  x0: number;
  x1: number;
}

/** Expand raw eras into a contiguous tiling across [TIMELINE_MIN, TIMELINE_MAX]. */
export function buildLabEras(eras: readonly Era[]): LabEra[] {
  const sorted = [...eras].sort((a, b) => a.start - b.start);
  const last = sorted.length - 1;
  return sorted.map((e, i) => ({
    id: e.id,
    name: e.name,
    tone: e.tone,
    start: i === 0 ? TIMELINE_MIN : e.start,
    end: i === last ? TIMELINE_MAX : sorted[i + 1].start - 1,
    canonStart: e.start,
    canonEnd: e.end,
  }));
}

const RIBBON_DAMPEN = 0.22;

/**
 * Allocate ribbon width per era ∝ (span)^0.22 — the dampened power curve, so
 * the 16-year Heresy and the 5000-year Long War read side by side. Attaches
 * `x0`/`x1` in 0..1 across the whole ribbon.
 */
export function buildRibbonSegments(labEras: readonly LabEra[]): RibbonSegment[] {
  const sorted = [...labEras].sort((a, b) => a.start - b.start);
  const weights = sorted.map((e) => Math.pow(Math.max(1, e.end - e.start), RIBBON_DAMPEN));
  const total = weights.reduce((s, w) => s + w, 0) || 1;
  let acc = 0;
  return sorted.map((e, i) => {
    const w = weights[i] / total;
    const seg: RibbonSegment = { ...e, x0: acc, x1: acc + w };
    acc += w;
    return seg;
  });
}

/** Convenience: raw eras → ribbon segments in one call. */
export function buildLabSegments(eras: readonly Era[]): RibbonSegment[] {
  return buildRibbonSegments(buildLabEras(eras));
}

/**
 * Map a setting year to its era id via the contiguous lab tiling (every year
 * resolves to exactly one era — no gaps). Used as the Chronicle's grouping key
 * off the book's real `startY`, since the editorial `primaryEraId` anchor isn't
 * curated in the current catalogue. Mirrors the prototype roster's `eraFor`.
 * Returns "" only when there are no eras at all.
 */
export function eraIdForYear(year: number, eras: readonly Era[]): string {
  const lab = buildLabEras(eras);
  if (lab.length === 0) return "";
  for (const e of lab) {
    if (year >= e.start && year <= e.end) return e.id;
  }
  return year <= lab[0].start ? lab[0].id : lab[lab.length - 1].id;
}

/** The contiguous lab [start, end] range for one era id, or null if unknown. */
export function labRangeForEra(
  eraId: string,
  eras: readonly Era[],
): { start: number; end: number } | null {
  const e = buildLabEras(eras).find((x) => x.id === eraId);
  return e ? { start: e.start, end: e.end } : null;
}

/** A linear sub-axis projector for one segment, with pre-computed nice ticks. */
export type SubProjector = ((y: number) => number) & { ticks: number[] };

/** Linear projector within one segment's display span → 0..1, plus tick years. */
export function makeSubProject(seg: { start: number; end: number }): SubProjector {
  const span = seg.end - seg.start || 1;
  const fn = ((y: number) => Math.max(0, Math.min(1, (y - seg.start) / span))) as SubProjector;
  fn.ticks = niceTicks(seg.start, seg.end);
  return fn;
}

const TICK_STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000];

/** Pick ~4–8 readable tick years across [a, b], endpoints guaranteed. */
export function niceTicks(a: number, b: number): number[] {
  const span = b - a;
  let step = TICK_STEPS[TICK_STEPS.length - 1];
  for (const s of TICK_STEPS) {
    if (span / s <= 8) {
      step = s;
      break;
    }
  }
  const first = Math.ceil(a / step) * step;
  const out: number[] = [];
  for (let y = first; y <= b; y += step) out.push(y);
  if (out.length === 0 || out[0] - a > step * 0.5) out.unshift(a);
  if (b - out[out.length - 1] > step * 0.5) out.push(b);
  return out;
}
