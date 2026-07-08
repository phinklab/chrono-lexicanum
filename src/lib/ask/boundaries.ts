import { HERESY_SLUGS } from "./heresy-books";
import type { AskAnswers } from "./types";

type FactionAnswer = NonNullable<AskAnswers["faction_love"]>;
type ConcreteFactionAnswer = Exclude<FactionAnswer, "any_faction">;
type LengthAnswer = NonNullable<AskAnswers["length"]>;

export interface AskBoundaryFaction {
  role: string | null;
  alignment: string;
  ancestry: readonly string[];
}

export interface AskBoundaryCandidate {
  /** Stable slug — also the join key for the curated HH supplement. */
  slug: string;
  format: string | null;
  seriesId: string | null;
  seriesIndex: number | null;
  seriesTotalPlanned: number | null;
  /** Era signal for the Horus-Heresy hard gate. */
  primaryEraId: string | null;
  startY: number | null;
  /** Member of the anchor set for any lane — drives the deep hard gate. */
  isAnchor: boolean;
  factions: readonly AskBoundaryFaction[];
  facetsByCategory: ReadonlyMap<string, ReadonlySet<string>>;
}

const XENOS_ROOTS = ["eldar", "tau", "necrons", "tyranids", "orks"];
const SINGLE_VOLUME_FORMATS = new Set(["novel", "novella", "short_story", "audio_drama"]);
const NON_SINGLE_VOLUME_FORMATS = new Set([
  "omnibus",
  "anthology",
  "collection",
  "artbook",
  "scriptbook",
]);

const HERESY_ERAS = new Set(["great_crusade", "horus_heresy"]);

/**
 * Horus-Heresy detection from book data, not from an answer tag.
 *
 * The catalogue's era data is unusable for this: every book carries
 * `primaryEraId = "time_ending"` and ~792/889 have a null `startY`, with no
 * setting/millennium facet. So detection layers three signals:
 *   1. `primaryEraId` in the Heresy/Crusade set (kept for forward-compatibility
 *      if the era field is ever backfilled — today it never fires).
 *   2. `startY` in the M30–M31 band `[30000, 32000)` — catches the ~23 numbered
 *      HH novels that do carry a real start year.
 *   3. membership in the curated `ask-heresy-books.json` supplement — covers the
 *      HH books with a null `startY` (Garro, the Siege of Terra finale, …).
 * Shared by the HH hard gate here and by the combination audit, so both measure
 * the same thing.
 */
export function isHeresyBook(
  primaryEraId: string | null,
  startY: number | null,
  slug: string | null,
): boolean {
  if (primaryEraId != null && HERESY_ERAS.has(primaryEraId)) return true;
  if (startY != null && startY >= 30000 && startY < 32000) return true;
  return slug != null && HERESY_SLUGS.has(slug);
}

function factionInTree(
  faction: AskBoundaryFaction,
  roots: readonly string[],
): boolean {
  return roots.some((root) => faction.ancestry.includes(root));
}

function predicateForFactionAnswer(
  answer: ConcreteFactionAnswer,
): (faction: AskBoundaryFaction) => boolean {
  switch (answer) {
    case "imperium_of_man":
      // The merged Imperium lane — includes the Inquisition sub-tree, which sits
      // under `imperium` in the faction graph.
      return (f) => f.alignment === "imperium" || factionInTree(f, ["imperium"]);
    case "loyalist_sm":
      return (f) =>
        f.alignment !== "chaos" && factionInTree(f, ["adeptus_astartes"]);
    case "heretic":
      return (f) =>
        f.alignment === "chaos" || factionInTree(f, ["chaos", "heretic_astartes"]);
    case "xenos":
      return (f) => f.alignment === "xenos" || factionInTree(f, XENOS_ROOTS);
  }
}

function passesFactionBoundary(
  candidate: AskBoundaryCandidate,
  answer: ConcreteFactionAnswer,
): boolean {
  const predicate = predicateForFactionAnswer(answer);
  const primary = candidate.factions.filter((f) => f.role === "primary");
  if (primary.length > 0) return primary.some(predicate);

  const lead =
    candidate.factions.find((f) => f.role !== "antagonist") ??
    candidate.factions[0] ??
    null;
  return lead ? predicate(lead) : false;
}

function isSingleVolume(candidate: AskBoundaryCandidate): boolean {
  if (candidate.format == null) return true;
  if (NON_SINGLE_VOLUME_FORMATS.has(candidate.format)) return false;
  return SINGLE_VOLUME_FORMATS.has(candidate.format);
}

function passesLengthBoundary(
  candidate: AskBoundaryCandidate,
  answer: LengthAnswer,
): boolean {
  switch (answer) {
    case "standalone":
      return isSingleVolume(candidate);
    case "trilogy":
    case "any_length":
      return true;
  }
}

export function passesHardAskBoundaries(
  candidate: AskBoundaryCandidate,
  answers: AskAnswers,
): boolean {
  const factionAnswer = answers.faction_love;
  // `any_faction` is no faction gate — it aggregates the concrete cells.
  if (
    factionAnswer &&
    factionAnswer !== "any_faction" &&
    !passesFactionBoundary(candidate, factionAnswer)
  ) {
    return false;
  }

  const lengthAnswer = answers.length;
  if (lengthAnswer && !passesLengthBoundary(candidate, lengthAnswer)) return false;

  const experience = answers.experience;
  // HH hard gate: a newcomer never gets Horus-Heresy books (detected from book
  // data + the curated supplement, since the era field carries no signal).
  if (
    experience === "new" &&
    isHeresyBook(candidate.primaryEraId, candidate.startY, candidate.slug)
  ) {
    return false;
  }
  // Deep hard gate: a seasoned reader knows the classics — exclude the anchor set.
  if (experience === "deep" && candidate.isAnchor) return false;

  return true;
}
