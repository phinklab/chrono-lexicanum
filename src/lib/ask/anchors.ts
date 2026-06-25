import anchorsJson from "../../../scripts/seed-data/ask-anchors.json";

import {
  ASK_OPTION_IDS_BY_QUESTION,
  ASK_QUESTION_IDS,
  type AskAnswers,
  type AskAnswerSubset,
  type AskQuestionId,
} from "./types";

/**
 * Lane-scoped anchor signal (Brief 164).
 *
 * A committed seed JSON (precedent: `ask-curation.json`) names canonical
 * "reliable entry point" books and the lane(s) they anchor — a `when`-style
 * answer subset (faction/tone/experience/length). It is joined to the loaded
 * books in-memory by slug (no schema, no migration, no DB read path). The bonus
 * flows as merit into the score *before* the overlay tail, and only when the
 * active profile matches one of the book's lanes. Per book the bonus is capped
 * to a single lane: if the profile matches several lanes of the same book, only
 * the strongest counts (no stacking inside one scoring).
 *
 * Membership in the anchor set ("is this book an anchor for *any* lane") also
 * drives the `experience = deep` hard gate in `boundaries.ts`: deep readers
 * already know the classics, so the whole anchor set is excluded there.
 */

export type AnchorConfidence = "high" | "medium" | "low";

/** Point bonus by confidence. Tuned against the combination audit (Brief 164):
 *  high lifts a canonical entry to the top of its lane; medium nudges; low is a
 *  gentle hint. The lane match already implies the book fits the slice, and the
 *  merit only applies when the base score is positive (see `recommend.ts`). */
export const ANCHOR_POINTS: Record<AnchorConfidence, number> = {
  high: 60,
  medium: 38,
  low: 22,
};

export interface AnchorEntry {
  book: string;
  lanes: AskAnswerSubset[];
  sources: string[];
  confidence: AnchorConfidence;
  note?: string;
}

export interface AnchorMerit {
  points: number;
  lane: AskAnswerSubset;
  sources: string[];
  confidence: AnchorConfidence;
  note?: string;
}

interface AnchorFile {
  version: 1;
  anchors: readonly AnchorEntry[];
}

const QUESTION_IDS = new Set<string>(ASK_QUESTION_IDS);
const CONFIDENCES = new Set<string>(["high", "medium", "low"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value != null && !Array.isArray(value);
}

function readString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Invalid Ask anchors file: ${label} must be a non-empty string.`);
  }
  return value;
}

function parseLane(value: unknown, label: string): AskAnswerSubset {
  if (!isPlainObject(value)) {
    throw new Error(`Invalid Ask anchors file: ${label} must be an object.`);
  }
  const keys = Object.keys(value);
  if (keys.length === 0) {
    throw new Error(`Invalid Ask anchors file: ${label} must constrain at least one axis.`);
  }
  const lane: AskAnswerSubset = {};
  for (const [questionId, optionId] of Object.entries(value)) {
    if (!QUESTION_IDS.has(questionId)) {
      throw new Error(`Invalid Ask anchors file: ${label} has unknown axis "${questionId}".`);
    }
    const option = readString(optionId, `${label}.${questionId}`);
    const allowed = ASK_OPTION_IDS_BY_QUESTION[questionId as AskQuestionId] as readonly string[];
    if (!allowed.includes(option)) {
      throw new Error(
        `Invalid Ask anchors file: ${label}.${questionId} has unknown option "${option}".`,
      );
    }
    if (option === "any_faction" || option === "any_tone" || option === "any_length") {
      throw new Error(
        `Invalid Ask anchors file: ${label}.${questionId} must be a concrete option, not "${option}".`,
      );
    }
    lane[questionId as AskQuestionId] = option;
  }
  return lane;
}

function parseEntry(value: unknown, index: number): AnchorEntry {
  if (!isPlainObject(value)) {
    throw new Error(`Invalid Ask anchors file: anchors[${index}] must be an object.`);
  }
  const book = readString(value.book, `anchors[${index}].book`);
  const confidence = readString(value.confidence, `${book}.confidence`);
  if (!CONFIDENCES.has(confidence)) {
    throw new Error(`Invalid Ask anchors file: ${book}.confidence "${confidence}" must be high|medium|low.`);
  }
  if (!Array.isArray(value.lanes) || value.lanes.length === 0) {
    throw new Error(`Invalid Ask anchors file: ${book}.lanes must be a non-empty array.`);
  }
  const lanes = value.lanes.map((lane, laneIndex) => parseLane(lane, `${book}.lanes[${laneIndex}]`));
  if (!Array.isArray(value.sources) || value.sources.length === 0) {
    throw new Error(`Invalid Ask anchors file: ${book}.sources must be a non-empty array.`);
  }
  const sources = value.sources.map((s, i) => readString(s, `${book}.sources[${i}]`));
  const note = value.note == null ? undefined : readString(value.note, `${book}.note`);

  return { book, lanes, sources, confidence: confidence as AnchorConfidence, ...(note ? { note } : {}) };
}

export function parseAnchorFile(value: unknown): AnchorFile {
  if (!isPlainObject(value)) {
    throw new Error("Invalid Ask anchors file: root must be an object.");
  }
  if (value.version !== 1) {
    throw new Error("Invalid Ask anchors file: version must be 1.");
  }
  if (!Array.isArray(value.anchors)) {
    throw new Error("Invalid Ask anchors file: anchors must be an array.");
  }
  const anchors = value.anchors.map(parseEntry);
  const seen = new Set<string>();
  for (const anchor of anchors) {
    if (seen.has(anchor.book)) {
      throw new Error(`Invalid Ask anchors file: duplicate book "${anchor.book}".`);
    }
    seen.add(anchor.book);
  }
  return { version: 1, anchors };
}

export const ASK_ANCHORS: AnchorFile = parseAnchorFile(anchorsJson as unknown);

export const ANCHORS_BY_SLUG: ReadonlyMap<string, AnchorEntry> = new Map(
  ASK_ANCHORS.anchors.map((anchor) => [anchor.book, anchor]),
);

/** Every slug that is an anchor for at least one lane — drives the deep gate. */
export const ANCHOR_SLUGS: ReadonlySet<string> = new Set(ASK_ANCHORS.anchors.map((a) => a.book));

function laneMatches(lane: AskAnswerSubset, answers: AskAnswers): boolean {
  for (const [questionId, optionId] of Object.entries(lane)) {
    if (answers[questionId as AskQuestionId] !== optionId) return false;
  }
  return true;
}

/**
 * The anchor merit for one book under one (concrete) profile, capped to the
 * single strongest matching lane. Returns null when the book is not an anchor
 * or no lane matches the profile.
 */
export function anchorMeritFor(slug: string, answers: AskAnswers): AnchorMerit | null {
  const entry = ANCHORS_BY_SLUG.get(slug);
  if (!entry) return null;

  const points = ANCHOR_POINTS[entry.confidence];
  let best: AnchorMerit | null = null;
  for (const lane of entry.lanes) {
    if (!laneMatches(lane, answers)) continue;
    if (!best || points > best.points) {
      best = {
        points,
        lane,
        sources: entry.sources,
        confidence: entry.confidence,
        ...(entry.note ? { note: entry.note } : {}),
      };
    }
  }
  return best;
}
