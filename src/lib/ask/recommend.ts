/**
 * Ask recommendation engine. SERVER-ONLY: imports the Drizzle DB client and
 * ranks real book works; it is intentionally not wired into the legacy /ask UI
 * yet (Product owns that step).
 */
import { db } from "@/db/client";
import { factions as factionsTable } from "@/db/schema";
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
  faction_inquisition: "Inquisition",
  faction_guard: "Astra Militarum",
  faction_xenos: "Xenos",
  tone_grim: "Grimdark tone",
  tone_heroic: "Heroic tone",
  tone_political: "Political/investigative tone",
  tone_military: "Military tone",
  tone_mythic: "Mythic/cosmic tone",
  era_heresy: "Horus Heresy era",
  era_m41: "M41 era",
  era_indomitus: "Indomitus era",
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
const GUARD_ROOTS = [
  "astra_militarum",
  "commissariat",
  "tempestus_scions",
  "last_chancers",
  "ratlings",
  "ogryns",
];

let cachedAskBooks: Promise<AskBookWork[]> | null = null;

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
      authors,
      factions,
      facets,
      facetsByCategory,
      facetNamesById,
    };
  });
}

async function loadAskBooksForRecommend(cacheBooks: boolean | undefined): Promise<AskBookWork[]> {
  if (!cacheBooks) return loadAskBooks();
  cachedAskBooks ??= loadAskBooks();
  return cachedAskBooks;
}

export function clearAskRecommendationCache(): void {
  cachedAskBooks = null;
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

function pageDetail(book: AskBookWork): string {
  return book.pageCount == null ? "page count unknown" : `${book.pageCount} pages`;
}

function entryDetail(book: AskBookWork): string {
  const entry = firstCategoryFacet(book, "entry_point") ?? "unknown entry point";
  return `${entry.replaceAll("_", " ")}; ${pageDetail(book)}`;
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
  const longRead =
    hasFacet(book, "length_tier", ["doorstopper"]) ||
    (book.pageCount != null && book.pageCount >= 650);

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

function evaluateTone(
  book: AskBookWork,
  groups: ReadonlyArray<{
    category: string;
    ids: readonly string[];
    multiplier?: number;
  }>,
): TagEvaluation {
  let bestMultiplier = 0;
  const names: string[] = [];

  for (const group of groups) {
    const matches = matchingFacetNames(book, group.category, group.ids);
    if (matches.length === 0) continue;
    names.push(...matches);
    bestMultiplier = Math.max(bestMultiplier, group.multiplier ?? 1);
  }

  return bestMultiplier > 0
    ? { multiplier: bestMultiplier, detail: `Facets: ${[...new Set(names)].join(", ")}` }
    : { multiplier: 0 };
}

function evaluateEra(book: AskBookWork, tag: AskWeightTag): TagEvaluation {
  const startY = book.startY;

  if (tag === "era_heresy") {
    const matched =
      book.primaryEraId === "great_crusade" ||
      book.primaryEraId === "horus_heresy" ||
      (startY != null && startY >= 30000 && startY < 32000);
    return matched
      ? { multiplier: 1, detail: `Era: ${book.primaryEraId ?? "M30/M31"}` }
      : { multiplier: 0 };
  }

  if (tag === "era_m41") {
    const matched =
      book.primaryEraId === "time_ending" ||
      (startY != null && startY >= 40000 && startY < 42000);
    return matched
      ? { multiplier: 1, detail: `Era: ${book.primaryEraId ?? "M41"}` }
      : { multiplier: 0 };
  }

  const matched =
    book.primaryEraId === "indomitus" || (startY != null && startY >= 42000);
  return matched
    ? { multiplier: 1, detail: `Era: ${book.primaryEraId ?? "M42"}` }
    : { multiplier: 0 };
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
    case "faction_inquisition":
      return bestFactionMatch(book, (f) => factionInTree(f, ["inquisition"]));
    case "faction_guard":
      return bestFactionMatch(book, (f) => factionInTree(f, GUARD_ROOTS));
    case "faction_xenos":
      return bestFactionMatch(
        book,
        (f) => f.alignment === "xenos" || factionInTree(f, XENOS_ROOTS),
      );
    case "tone_grim":
      return evaluateTone(book, [
        { category: "tone", ids: ["grimdark", "somber", "cosmic_horror"] },
        { category: "theme", ids: ["betrayal", "hubris"], multiplier: 0.65 },
      ]);
    case "tone_heroic":
      return evaluateTone(book, [
        { category: "tone", ids: ["hopepunk", "action_heavy"] },
        { category: "plot_type", ids: ["last_stand"], multiplier: 0.85 },
        {
          category: "theme",
          ids: ["loyalty", "brotherhood", "sacrifice", "faith", "redemption"],
          multiplier: 0.8,
        },
      ]);
    case "tone_political":
      return evaluateTone(book, [
        { category: "plot_type", ids: ["political_thriller", "court_intrigue", "mystery"] },
        { category: "theme", ids: ["doubt", "faith"], multiplier: 0.6 },
      ]);
    case "tone_military":
      return evaluateTone(book, [
        { category: "plot_type", ids: ["war_story", "siege", "last_stand"] },
        { category: "theme", ids: ["war", "sacrifice"], multiplier: 0.75 },
      ]);
    case "tone_mythic":
      return evaluateTone(book, [
        { category: "tone", ids: ["cosmic_horror", "philosophical"] },
        { category: "plot_type", ids: ["journey", "character_study"], multiplier: 0.65 },
        { category: "theme", ids: ["faith", "hubris", "betrayal", "redemption"], multiplier: 0.8 },
      ]);
    case "era_heresy":
    case "era_m41":
    case "era_indomitus":
      return evaluateEra(book, tag);
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
    format: book.format,
    releaseYear: book.releaseYear,
    rating: book.rating,
    synopsis: book.synopsis,
    coverUrl: book.coverUrl,
  };
}

function compareNullableDesc(a: number | null | undefined, b: number | null | undefined): number {
  if (a == null && b != null) return 1;
  if (a != null && b == null) return -1;
  if (a != null && b != null && a !== b) return b - a;
  return 0;
}

function compareRecommendations(a: AskRecommendation, b: AskRecommendation): number {
  if (a.score !== b.score) return b.score - a.score;

  const rating = compareNullableDesc(a.rating, b.rating);
  if (rating !== 0) return rating;

  const release = compareNullableDesc(a.releaseYear, b.releaseYear);
  if (release !== 0) return release;

  const title = a.title.localeCompare(b.title, "en");
  if (title !== 0) return title;

  return a.slug.localeCompare(b.slug, "en");
}

export async function recommend(
  answers: AskAnswers,
  options: AskRecommendOptions = {},
): Promise<AskRecommendationResult> {
  const profile = buildAskProfile(answers);
  const limit = normalizeLimit(options.limit);

  try {
    const books = await loadAskBooksForRecommend(options.cacheBooks);
    const baseRecommendations = books.map((book) => scoreBook(book, profile));
    const curation = options.curation === null ? EMPTY_ASK_CURATION : options.curation;
    const recommendations = applyAskCuration(
      baseRecommendations.sort(compareRecommendations),
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
