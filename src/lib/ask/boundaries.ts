import type { AskAnswers } from "./types";

type FactionAnswer = NonNullable<AskAnswers["faction_love"]>;
type LengthAnswer = NonNullable<AskAnswers["length"]>;

export interface AskBoundaryFaction {
  role: string | null;
  alignment: string;
  ancestry: readonly string[];
}

export interface AskBoundaryCandidate {
  format: string | null;
  seriesId: string | null;
  seriesIndex: number | null;
  seriesTotalPlanned: number | null;
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

function factionInTree(
  faction: AskBoundaryFaction,
  roots: readonly string[],
): boolean {
  return roots.some((root) => faction.ancestry.includes(root));
}

function predicateForFactionAnswer(
  answer: FactionAnswer,
): (faction: AskBoundaryFaction) => boolean {
  switch (answer) {
    case "imperium":
      return (f) => f.alignment === "imperium" || factionInTree(f, ["imperium"]);
    case "heretic":
      return (f) =>
        f.alignment === "chaos" || factionInTree(f, ["chaos", "heretic_astartes"]);
    case "loyalist_sm":
      return (f) =>
        f.alignment !== "chaos" && factionInTree(f, ["adeptus_astartes"]);
    case "inquisition":
      return (f) => factionInTree(f, ["inquisition"]);
    case "xenos":
      return (f) => f.alignment === "xenos" || factionInTree(f, XENOS_ROOTS);
  }
}

function passesFactionBoundary(
  candidate: AskBoundaryCandidate,
  answer: FactionAnswer,
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
  if (factionAnswer && !passesFactionBoundary(candidate, factionAnswer)) return false;

  const lengthAnswer = answers.length;
  if (lengthAnswer && !passesLengthBoundary(candidate, lengthAnswer)) return false;

  return true;
}
