/**
 * Ask recommendation engine. SERVER-ONLY: imports the Drizzle DB client and
 * ranks real book works; it is intentionally not wired into the legacy /ask UI
 * yet (Product owns that step).
 */
import { db } from "@/db/client";
import { factions as factionsTable } from "@/db/schema";
import { memoryCachedRead } from "@/lib/memory-cache";
import { passesHardAskBoundaries } from "./boundaries";
import { ANCHOR_SLUGS, anchorMeritFor } from "./anchors";
import { compareByMerit } from "./compare";
import { applyAskCuration, EMPTY_ASK_CURATION, type AskCurationOverlay } from "./curation";
import { ASK_QUESTIONS } from "./questions";
import {
  ASK_WEIGHT_TAGS,
  type AskAnswers,
  type AskOption,
  type AskProfile,
  type AskRecommendation,
  type AskRecommendationReason,
  type AskRecommendationResult,
  type AskWeightTag,
  type AskWeightVector,
} from "./types";

const DEFAULT_LIMIT = 5;
const TAG_POINT_UNIT = 10;

const TAG_LABELS = {
  newcomer: "New-reader friendly",
  accessible: "Accessible",
  deep_cut: "Deep cut",
  standalone: "Standalone",
  short: "Short read",
  arc: "Short arc",
  series: "Series path",
  villain_pov: "Villain POV",
  faction_imperium: "Imperium",
  faction_chaos: "Chaos",
  faction_space_marines: "Space Marines",
  faction_xenos: "Xenos",
  tone_grim: "Grimdark tone",
  tone_heroic: "Heroic tone",
  tone_political: "Investigative tone",
  tone_military: "Military tone",
} as const satisfies Record<AskWeightTag, string>;

type AskRecommendErrorMode = "empty" | "throw";

export interface AskRecommendOptions {
  limit?: number;
  onError?: AskRecommendErrorMode;
  cacheBooks?: boolean;
  curation?: AskCurationOverlay | null;
}

interface FacetRef {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string | null;
}

interface FactionRef {
  id: string;
  name: string;
  role: string | null;
  alignment: string;
  ancestry: readonly string[];
}

interface AskBookWork {
  id: string;
  slug: string;
  title: string;
  synopsis: string | null;
  coverUrl: string | null;
  releaseYear: number | null;
  startY: number | null;
  endY: number | null;
  format: string | null;
  pageCount: number | null;
  rating: number | null;
  seriesId: string | null;
  seriesName: string | null;
  seriesIndex: number | null;
  seriesTotalPlanned: number | null;
  primaryEraId: string | null;
  isAnchor: boolean;
  authors: string[];
  factions: FactionRef[];
  facets: FacetRef[];
  facetsByCategory: ReadonlyMap<string, ReadonlySet<string>>;
  facetNamesById: ReadonlyMap<string, string>;
}

interface TagEvaluation {
  multiplier: number;
  detail?: string;
}

const EMPTY_SET: ReadonlySet<string> = new Set<string>();

const XENOS_ROOTS = ["eldar", "tau", "necrons", "tyranids", "orks"];

function optionByQuestion(): Map<string, Map<string, AskOption>> {
  const map = new Map<string, Map<string, AskOption>>();
  for (const question of ASK_QUESTIONS) {
    map.set(question.id, new Map(question.options.map((o) => [o.id, o])));
  }
  return map;
}

const OPTIONS_BY_QUESTION = optionByQuestion();

export function buildAskProfile(answers: AskAnswers): AskProfile {
  const weights: AskWeightVector = {};

  for (const [questionId, answerId] of Object.entries(answers)) {
    if (!answerId) continue;
    const option = OPTIONS_BY_QUESTION.get(questionId)?.get(answerId);
    if (!option) continue;

    for (const [tag, value] of Object.entries(option.weight)) {
      const knownTag = tag as AskWeightTag;
      weights[knownTag] = (weights[knownTag] ?? 0) + value;
    }
  }

  return { answers, weights };
}

function toNumber(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeLimit(limit: number | undefined): number {
  if (limit == null) return DEFAULT_LIMIT;
  if (!Number.isFinite(limit)) return DEFAULT_LIMIT;
  return Math.max(1, Math.floor(limit));
}

function buildAncestry(
  id: string,
  parentByFaction: ReadonlyMap<string, string | null>,
): readonly string[] {
  const ancestry: string[] = [];
  const seen = new Set<string>();
  let current: string | null | undefined = id;

  while (current && !seen.has(current)) {
    ancestry.push(current);
    seen.add(current);
    current = parentByFaction.get(current) ?? null;
  }

  return ancestry;
}

async function loadAskBooks(): Promise<AskBookWork[]> {
  const [rows, factionRows] = await Promise.all([
    db.query.works.findMany({
      where: (w, { eq }) => eq(w.kind, "book"),
      columns: {
        id: true,
        slug: true,
        title: true,
        synopsis: true,
        coverUrl: true,
        releaseYear: true,
        startY: true,
        endY: true,
      },
      with: {
        bookDetails: {
          columns: {
            format: true,
            pageCount: true,
            rating: true,
            seriesId: true,
            seriesIndex: true,
            primaryEraId: true,
          },
          with: {
            series: {
              columns: { id: true, name: true, totalPlanned: true },
            },
          },
        },
        persons: {
          columns: { role: true, displayOrder: true },
          with: { person: { columns: { name: true, nameSort: true } } },
        },
        factions: {
          columns: { role: true },
          with: {
            faction: {
              columns: { id: true, name: true, parentId: true, alignment: true },
            },
          },
        },
        facets: {
          columns: {},
          with: {
            facetValue: {
              columns: { id: true, name: true, categoryId: true },
              with: { category: { columns: { id: true, name: true } } },
            },
          },
        },
      },
    }),
    db
      .select({
        id: factionsTable.id,
        parentId: factionsTable.parentId,
      })
      .from(factionsTable),
  ]);

  const parentByFaction = new Map(
    factionRows.map((f) => [f.id, f.parentId ?? null]),
  );

  return rows.map((w): AskBookWork => {
    const authors = w.persons
      .filter((wp) => wp.role === "author")
      .sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) {
          return a.displayOrder - b.displayOrder;
        }
        return a.person.nameSort.localeCompare(b.person.nameSort, "en");
      })
      .map((wp) => wp.person.name);

    const factions = w.factions.map((wf): FactionRef => ({
      id: wf.faction.id,
      name: wf.faction.name,
      role: wf.role,
      alignment: wf.faction.alignment,
      ancestry: buildAncestry(wf.faction.id, parentByFaction),
    }));

    const facets = w.facets.map((wf): FacetRef => ({
      id: wf.facetValue.id,
      name: wf.facetValue.name,
      categoryId: wf.facetValue.categoryId,
      categoryName: wf.facetValue.category?.name ?? null,
    }));

    const facetsByCategory = new Map<string, Set<string>>();
    const facetNamesById = new Map<string, string>();
    for (const facet of facets) {
      facetNamesById.set(facet.id, facet.name);
      const categorySet = facetsByCategory.get(facet.categoryId) ?? new Set<string>();
      categorySet.add(facet.id);
      facetsByCategory.set(facet.categoryId, categorySet);
    }

    return {
      id: w.id,
      slug: w.slug,
      title: w.title,
      synopsis: w.synopsis ?? null,
      coverUrl: w.coverUrl,
      releaseYear: w.releaseYear,
      startY: toNumber(w.startY),
      endY: toNumber(w.endY),
      format: w.bookDetails?.format ?? null,
      pageCount: w.bookDetails?.pageCount ?? null,
      rating: toNumber(w.bookDetails?.rating),
      seriesId: w.bookDetails?.seriesId ?? null,
      seriesName: w.bookDetails?.series?.name ?? null,
      seriesIndex: w.bookDetails?.seriesIndex ?? null,
      seriesTotalPlanned: w.bookDetails?.series?.totalPlanned ?? null,
      primaryEraId: w.bookDetails?.primaryEraId ?? null,
      isAnchor: ANCHOR_SLUGS.has(w.slug),
      authors,
      factions,
      facets,
      facetsByCategory,
      facetNamesById,
    };
  });
}

/**
 * The book list behind `recommend()` when callers opt into caching
 * (`cacheBooks: true` — the /ask hot path). `memoryCachedRead` supplies the
 * three properties the ad-hoc promise slot lacked: a TTL (the list otherwise
 * lived until process death), rejection eviction (a failed fill never poisons
 * follow-up requests), and coalescing of concurrent fills. Cleared by
 * `POST /api/revalidate` via `resetMemoryCaches()` after an apply run.
 */
const cachedAskBooks = memoryCachedRead(loadAskBooks);

async function loadAskBooksForRecommend(cacheBooks: boolean | undefined): Promise<AskBookWork[]> {
  return cacheBooks ? cachedAskBooks() : loadAskBooks();
}

function categoryFacets(book: AskBookWork, categoryId: string): ReadonlySet<string> {
  return book.facetsByCategory.get(categoryId) ?? EMPTY_SET;
}

function firstCategoryFacet(book: AskBookWork, categoryId: string): string | null {
  return categoryFacets(book, categoryId).values().next().value ?? null;
}

function hasFacet(
  book: AskBookWork,
  categoryId: string,
  ids: readonly string[],
): boolean {
  const set = categoryFacets(book, categoryId);
  return ids.some((id) => set.has(id));
}

function matchingFacetNames(
  book: AskBookWork,
  categoryId: string,
  ids: readonly string[],
): string[] {
  const set = categoryFacets(book, categoryId);
  return ids
    .filter((id) => set.has(id))
    .map((id) => book.facetNamesById.get(id) ?? id);
}

function roleMultiplier(role: string | null): number {
  if (role === "primary") return 1;
  if (role === "supporting") return 0.75;
  if (role === "antagonist") return 0.35;
  return 0.5;
}

function bestFactionMatch(
  book: AskBookWork,
  predicate: (faction: FactionRef) => boolean,
): TagEvaluation {
  let best: FactionRef | null = null;
  let bestMultiplier = 0;

  for (const faction of book.factions) {
    if (!predicate(faction)) continue;
    const multiplier = roleMultiplier(faction.role);
    if (multiplier > bestMultiplier) {
      best = faction;
      bestMultiplier = multiplier;
    }
  }

  return best
    ? { multiplier: bestMultiplier, detail: `Faction: ${best.name}` }
    : { multiplier: 0 };
}

function factionInTree(faction: FactionRef, roots: readonly string[]): boolean {
  return roots.some((root) => faction.ancestry.includes(root));
}

function pageDetail(book: AskBookWork): string | null {
  return book.pageCount == null ? null : `${book.pageCount} pages`;
}

// Build the reason caption from only the facts we actually hold — never
// surface "page count unknown" or "unknown entry point" filler. If both are
// missing the caption is empty and the row shows just the reason label.
function entryDetail(book: AskBookWork): string {
  const entry = firstCategoryFacet(book, "entry_point");
  const parts = [
    entry ? entry.replaceAll("_", " ") : null,
    pageDetail(book),
  ].filter((part): part is string => part != null);
  return parts.join("; ");
}

function evaluateNewcomer(book: AskBookWork): TagEvaluation {
  const entry = firstCategoryFacet(book, "entry_point");
  if (entry === "requires_context") return { multiplier: 0 };

  const beginnerEntry = entry === "standalone" || entry === "series_start";
  const seriesStart = book.seriesIndex == null || book.seriesIndex <= 1;
  if (!beginnerEntry && book.seriesId && !seriesStart) return { multiplier: 0 };

  const friendlyLength =
    book.pageCount == null ||
    book.pageCount <= 500 ||
    hasFacet(book, "length_tier", ["novella", "short", "standard"]);

  return {
    multiplier: friendlyLength ? 1 : 0.75,
    detail: entryDetail(book),
  };
}

function evaluateAccessible(book: AskBookWork): TagEvaluation {
  const entry = firstCategoryFacet(book, "entry_point");
  if (entry === "requires_context" || entry === "mid_series" || entry === "series_finale") {
    return { multiplier: 0 };
  }

  const pageOk = book.pageCount == null || book.pageCount <= 550;
  const lengthOk = !hasFacet(book, "length_tier", ["doorstopper"]);
  if (!pageOk || !lengthOk) return { multiplier: 0.6, detail: entryDetail(book) };

  return { multiplier: 1, detail: entryDetail(book) };
}

function evaluateDeepCut(book: AskBookWork): TagEvaluation {
  const entry = firstCategoryFacet(book, "entry_point");
  const lateSeries = book.seriesIndex != null && book.seriesIndex >= 3;
  // An omnibus is the *accessible* way to buy a whole arc in one volume, not an
  // obscure deep cut — so its bulk page count must not earn the long-read deep
  // signal (otherwise popular omnibuses like Fabius Bile: The Omnibus float to
  // the top of the `deep` lane on length alone). Genuine deep cuts are single
  // uncompromising volumes, late-series entries, or books that openly require
  // prior context.
  const isOmnibus = book.format === "omnibus";
  const longRead =
    !isOmnibus &&
    (hasFacet(book, "length_tier", ["doorstopper"]) ||
      (book.pageCount != null && book.pageCount >= 650));

  if (entry === "requires_context" || lateSeries || longRead) {
    return { multiplier: 1, detail: entryDetail(book) };
  }
  if (entry === "mid_series" || entry === "series_finale") {
    return { multiplier: 0.75, detail: entryDetail(book) };
  }
  return { multiplier: 0 };
}

function evaluateStandalone(book: AskBookWork): TagEvaluation {
  const entry = firstCategoryFacet(book, "entry_point");
  if (entry === "standalone") return { multiplier: 1, detail: entryDetail(book) };
  if (!book.seriesId && entry !== "requires_context") {
    return { multiplier: 0.85, detail: "No series attached" };
  }
  return { multiplier: 0 };
}

function evaluateShort(book: AskBookWork): TagEvaluation {
  if (
    hasFacet(book, "length_tier", ["novella", "short"]) ||
    book.format === "novella" ||
    book.format === "short_story" ||
    book.format === "audio_drama"
  ) {
    return { multiplier: 1, detail: entryDetail(book) };
  }
  if (book.pageCount != null && book.pageCount <= 300) {
    return { multiplier: 0.85, detail: entryDetail(book) };
  }
  if (book.pageCount != null && book.pageCount <= 380) {
    return { multiplier: 0.55, detail: entryDetail(book) };
  }
  return { multiplier: 0 };
}

function evaluateArc(book: AskBookWork): TagEvaluation {
  if (!book.seriesId) return { multiplier: 0 };
  const total = book.seriesTotalPlanned;
  if (total != null && total >= 2 && total <= 5) {
    return {
      multiplier: book.seriesIndex == null || book.seriesIndex <= 1 ? 1 : 0.75,
      detail: `Series: ${book.seriesName ?? book.seriesId} (${total} planned)`,
    };
  }
  if (firstCategoryFacet(book, "entry_point") === "series_start") {
    return {
      multiplier: 0.6,
      detail: `Series start: ${book.seriesName ?? book.seriesId}`,
    };
  }
  return { multiplier: 0 };
}

function evaluateSeries(book: AskBookWork): TagEvaluation {
  if (book.seriesId) {
    const total = book.seriesTotalPlanned == null ? "" : ` (${book.seriesTotalPlanned} planned)`;
    return {
      multiplier: 1,
      detail: `Series: ${book.seriesName ?? book.seriesId}${total}`,
    };
  }
  if (
    hasFacet(book, "entry_point", ["series_start", "mid_series", "series_finale"])
  ) {
    return { multiplier: 0.5, detail: entryDetail(book) };
  }
  return { multiplier: 0 };
}

function evaluateVillainPov(book: AskBookWork): TagEvaluation {
  if (hasFacet(book, "pov_side", ["chaos"])) {
    return { multiplier: 1, detail: "POV side: Chaos" };
  }
  if (hasFacet(book, "protagonist_class", ["daemon"])) {
    return { multiplier: 1, detail: "Protagonist class: Daemon" };
  }
  const chaosFaction = bestFactionMatch(
    book,
    (f) => f.alignment === "chaos" || factionInTree(f, ["chaos", "heretic_astartes"]),
  );
  if (chaosFaction.multiplier > 0) {
    return {
      multiplier: Math.min(0.7, chaosFaction.multiplier),
      detail: chaosFaction.detail,
    };
  }
  if (hasFacet(book, "pov_side", ["dual"])) {
    return { multiplier: 0.45, detail: "Dual POV" };
  }
  return { multiplier: 0 };
}

const TONE_TAGS = ["tone_grim", "tone_heroic", "tone_political", "tone_military"] as const;
type ToneTag = (typeof TONE_TAGS)[number];

interface ToneSignal {
  category: string;
  ids: readonly string[];
  weight: number;
}

// Per-tone facet signals. The weight grades how strongly a facet implies the
// tone (a direct tone/plot_type facet is a full signal; a thematic echo is
// partial). Affinities are summed per tone, so a book that hits several signals
// reads as *more* that tone — the resolution the exclusivity step below needs.
const TONE_SIGNALS: Record<ToneTag, readonly ToneSignal[]> = {
  tone_grim: [
    { category: "tone", ids: ["grimdark", "somber", "cosmic_horror"], weight: 1 },
    { category: "theme", ids: ["betrayal", "hubris"], weight: 0.65 },
  ],
  tone_heroic: [
    { category: "tone", ids: ["hopepunk", "action_heavy"], weight: 1 },
    { category: "plot_type", ids: ["last_stand"], weight: 0.85 },
    {
      category: "theme",
      ids: ["loyalty", "brotherhood", "sacrifice", "faith", "redemption"],
      weight: 0.8,
    },
  ],
  tone_political: [
    { category: "plot_type", ids: ["political_thriller", "court_intrigue", "mystery"], weight: 1 },
    { category: "theme", ids: ["doubt", "faith"], weight: 0.6 },
  ],
  tone_military: [
    { category: "plot_type", ids: ["war_story", "siege", "last_stand"], weight: 1 },
    { category: "theme", ids: ["war", "sacrifice"], weight: 0.75 },
  ],
};

interface ToneAffinity {
  score: number;
  names: string[];
}

function rawToneAffinity(book: AskBookWork, tag: ToneTag): ToneAffinity {
  let score = 0;
  const names: string[] = [];
  for (const signal of TONE_SIGNALS[tag]) {
    const matches = matchingFacetNames(book, signal.category, signal.ids);
    if (matches.length === 0) continue;
    score += signal.weight;
    names.push(...matches);
  }
  return { score, names };
}

/**
 * Tone is a *primary* axis: changing only the tone must
 * change the #1 result. A binary "matches the tone? → full points" rule fails
 * that — a book that fits several tones wins all of them on the tiebreak. So a
 * book's contribution to the queried tone is scaled by how *exclusively* that
 * tone is the book's register: a purely-military novel beats a grim-and-military
 * one on the military query, and the grim one wins back the grimdark query.
 * `absol` keeps an absolute floor so a strong single-signal match still scores;
 * `share` (this tone's affinity over the book's total tone affinity) supplies
 * the exclusivity that separates the per-tone champions.
 */
function evaluateExclusiveTone(book: AskBookWork, tag: ToneTag): TagEvaluation {
  const self = rawToneAffinity(book, tag);
  if (self.score <= 0) return { multiplier: 0 };
  let total = 0;
  for (const other of TONE_TAGS) {
    total += other === tag ? self.score : rawToneAffinity(book, other).score;
  }
  const absol = Math.min(1, self.score);
  const share = total > 0 ? self.score / total : 0;
  // Share-dominant: a book that is primarily some *other* tone scores near zero
  // here, so it cannot also win this tone's #1. The small floor keeps a genuine
  // (if non-exclusive) match from collapsing entirely.
  const multiplier = absol * (0.08 + 0.92 * share);
  return { multiplier, detail: `Facets: ${[...new Set(self.names)].join(", ")}` };
}

function evaluateTag(book: AskBookWork, tag: AskWeightTag): TagEvaluation {
  switch (tag) {
    case "newcomer":
      return evaluateNewcomer(book);
    case "accessible":
      return evaluateAccessible(book);
    case "deep_cut":
      return evaluateDeepCut(book);
    case "standalone":
      return evaluateStandalone(book);
    case "short":
      return evaluateShort(book);
    case "arc":
      return evaluateArc(book);
    case "series":
      return evaluateSeries(book);
    case "villain_pov":
      return evaluateVillainPov(book);
    case "faction_imperium":
      return bestFactionMatch(
        book,
        (f) => f.alignment === "imperium" || factionInTree(f, ["imperium"]),
      );
    case "faction_chaos":
      return bestFactionMatch(
        book,
        (f) => f.alignment === "chaos" || factionInTree(f, ["chaos", "heretic_astartes"]),
      );
    case "faction_space_marines":
      return bestFactionMatch(
        book,
        (f) =>
          factionInTree(f, ["adeptus_astartes"]) ||
          (f.alignment !== "chaos" && hasFacet(book, "protagonist_class", ["space_marine"])),
      );
    case "faction_xenos":
      return bestFactionMatch(
        book,
        (f) => f.alignment === "xenos" || factionInTree(f, XENOS_ROOTS),
      );
    case "tone_grim":
    case "tone_heroic":
    case "tone_political":
    case "tone_military":
      return evaluateExclusiveTone(book, tag);
  }
}

function roundPoints(n: number): number {
  return Math.round(n * 100) / 100;
}

function activeTags(weights: AskWeightVector): Array<[AskWeightTag, number]> {
  const tags: Array<[AskWeightTag, number]> = [];
  for (const tag of ASK_WEIGHT_TAGS) {
    const weight = weights[tag] ?? 0;
    if (weight > 0) tags.push([tag, weight]);
  }
  return tags;
}

function scoreBook(book: AskBookWork, profile: AskProfile): AskRecommendation {
  const reasons: AskRecommendationReason[] = [];
  let score = 0;

  for (const [tag, weight] of activeTags(profile.weights)) {
    const evaluation = evaluateTag(book, tag);
    const points = roundPoints(weight * TAG_POINT_UNIT * evaluation.multiplier);
    if (points > 0) score += points;
    reasons.push({
      tag,
      label: TAG_LABELS[tag],
      matched: points > 0,
      points,
      ...(evaluation.detail ? { detail: evaluation.detail } : {}),
    });
  }

  const matchedTags = reasons
    .filter((r) => r.matched)
    .map((r) => r.tag);

  return {
    id: book.id,
    slug: book.slug,
    title: book.title,
    authors: book.authors,
    score: roundPoints(score),
    matchedTags,
    reasons,
    primaryEraId: book.primaryEraId,
    startY: book.startY,
    format: book.format,
    releaseYear: book.releaseYear,
    rating: book.rating,
    synopsis: book.synopsis,
    coverUrl: book.coverUrl,
  };
}

/**
 * Apply the lane-scoped anchor merit to a scored recommendation,
 * before the overlay tail. The bonus only flows when (a) the active profile
 * matches one of the book's anchor lanes and (b) the base score is positive —
 * an anchor must already fit its slice on the real signals, the merit just
 * lifts the canonical entry to the front of its lane. Capped to one lane per
 * book (the strongest match) inside `anchorMeritFor`.
 */
function withAnchorMerit(
  recommendation: AskRecommendation,
  answers: AskAnswers,
): AskRecommendation {
  if (recommendation.score <= 0) return recommendation;
  const merit = anchorMeritFor(recommendation.slug, answers);
  if (!merit) return recommendation;
  return {
    ...recommendation,
    score: roundPoints(recommendation.score + merit.points),
    anchor: merit,
  };
}

export async function recommend(
  answers: AskAnswers,
  options: AskRecommendOptions = {},
): Promise<AskRecommendationResult> {
  const profile = buildAskProfile(answers);
  const limit = normalizeLimit(options.limit);

  try {
    const books = await loadAskBooksForRecommend(options.cacheBooks);
    const baseRecommendations = books
      .filter((book) => passesHardAskBoundaries(book, profile.answers))
      .map((book) => scoreBook(book, profile))
      .map((recommendation) => withAnchorMerit(recommendation, profile.answers));
    const curation = options.curation === null ? EMPTY_ASK_CURATION : options.curation;
    const recommendations = applyAskCuration(
      baseRecommendations.sort(compareByMerit),
      profile.answers,
      curation,
    ).slice(0, limit);

    return { answers, profile, recommendations };
  } catch (err) {
    if (options.onError === "throw") throw err;
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[ask/recommend] DB fetch failed (${msg}); returning no recommendations.`);
    return { answers, profile, recommendations: [] };
  }
}

export default recommend;
