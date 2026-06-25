import curationJson from "../../../scripts/seed-data/ask-curation.json";

import { compareByMerit } from "./compare";
import {
  ASK_OPTION_IDS_BY_QUESTION,
  ASK_QUESTION_IDS,
  ASK_WEIGHT_TAGS,
  type AskAnswers,
  type AskQuestionId,
  type AskRecommendation,
  type AskRecommendationCurationEffect,
  type AskWeightTag,
} from "./types";

const DEFAULT_PIN_POINTS = 80;
const DEFAULT_BOOST_POINTS = 25;

type AskCurationProfile = Partial<Record<AskQuestionId, string>>;

export interface AskCurationBaseRule {
  id: string;
  when: AskCurationProfile;
  note?: string;
  points?: number;
}

export interface AskCurationBanRule extends AskCurationBaseRule {
  action: "ban";
  book: string;
}

export interface AskCurationPinRule extends AskCurationBaseRule {
  action: "pin";
  book: string;
}

export interface AskCurationBoostBookRule extends AskCurationBaseRule {
  action: "boost";
  book: string;
}

export interface AskCurationBoostTagRule extends AskCurationBaseRule {
  action: "boost";
  tag: AskWeightTag;
}

export type AskCurationRule =
  | AskCurationBanRule
  | AskCurationPinRule
  | AskCurationBoostBookRule
  | AskCurationBoostTagRule;

export interface AskCurationOverlay {
  version: 1;
  rules: readonly AskCurationRule[];
}

interface AppliedRecommendation {
  recommendation: AskRecommendation;
  pinOrder: number | null;
}

export const EMPTY_ASK_CURATION: AskCurationOverlay = {
  version: 1,
  rules: [],
};

const QUESTION_IDS = new Set<string>(ASK_QUESTION_IDS);
const WEIGHT_TAGS = new Set<string>(ASK_WEIGHT_TAGS);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value != null && !Array.isArray(value);
}

function readString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Invalid Ask curation overlay: ${label} must be a non-empty string.`);
  }
  return value;
}

function readOptionalString(value: unknown, label: string): string | undefined {
  if (value == null) return undefined;
  return readString(value, label);
}

function readOptionalPoints(value: unknown, label: string): number | undefined {
  if (value == null) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid Ask curation overlay: ${label} must be a positive number.`);
  }
  return value;
}

function isAskQuestionId(value: string): value is AskQuestionId {
  return QUESTION_IDS.has(value);
}

function isAskWeightTag(value: string): value is AskWeightTag {
  return WEIGHT_TAGS.has(value);
}

function isAllowedOption(questionId: AskQuestionId, optionId: string): boolean {
  return (ASK_OPTION_IDS_BY_QUESTION[questionId] as readonly string[]).includes(optionId);
}

function parseWhen(value: unknown, ruleId: string): AskCurationProfile {
  if (!isPlainObject(value)) {
    throw new Error(`Invalid Ask curation overlay: ${ruleId}.when must be an object.`);
  }

  const when: Partial<Record<AskQuestionId, string>> = {};
  for (const [questionId, optionId] of Object.entries(value)) {
    if (!isAskQuestionId(questionId)) {
      throw new Error(
        `Invalid Ask curation overlay: ${ruleId}.when has unknown question "${questionId}".`,
      );
    }
    const option = readString(optionId, `${ruleId}.when.${questionId}`);
    if (!isAllowedOption(questionId, option)) {
      throw new Error(
        `Invalid Ask curation overlay: ${ruleId}.when.${questionId} has unknown option "${option}".`,
      );
    }
    when[questionId] = option;
  }
  return when;
}

function parseRule(value: unknown, index: number): AskCurationRule {
  if (!isPlainObject(value)) {
    throw new Error(`Invalid Ask curation overlay: rules[${index}] must be an object.`);
  }

  const id = readString(value.id, `rules[${index}].id`);
  const action = readString(value.action, `${id}.action`);
  const when = parseWhen(value.when ?? {}, id);
  const note = readOptionalString(value.note, `${id}.note`);
  const points = readOptionalPoints(value.points, `${id}.points`);
  const book = readOptionalString(value.book, `${id}.book`);
  const rawTag = readOptionalString(value.tag, `${id}.tag`);

  if (action === "ban") {
    if (!book) throw new Error(`Invalid Ask curation overlay: ${id}.book is required for ban.`);
    return { id, action, when, book, ...(note ? { note } : {}) };
  }

  if (action === "pin") {
    if (!book) throw new Error(`Invalid Ask curation overlay: ${id}.book is required for pin.`);
    return { id, action, when, book, ...(points ? { points } : {}), ...(note ? { note } : {}) };
  }

  if (action === "boost") {
    if (book && rawTag) {
      throw new Error(`Invalid Ask curation overlay: ${id} boost must target book or tag, not both.`);
    }
    if (book) {
      return {
        id,
        action,
        when,
        book,
        ...(points ? { points } : {}),
        ...(note ? { note } : {}),
      };
    }
    if (!rawTag) {
      throw new Error(`Invalid Ask curation overlay: ${id} boost requires book or tag.`);
    }
    if (!isAskWeightTag(rawTag)) {
      throw new Error(`Invalid Ask curation overlay: ${id}.tag has unknown tag "${rawTag}".`);
    }
    return {
      id,
      action,
      when,
      tag: rawTag,
      ...(points ? { points } : {}),
      ...(note ? { note } : {}),
    };
  }

  throw new Error(`Invalid Ask curation overlay: ${id}.action "${action}" is not supported.`);
}

export function parseAskCurationOverlay(value: unknown): AskCurationOverlay {
  if (!isPlainObject(value)) {
    throw new Error("Invalid Ask curation overlay: root must be an object.");
  }
  if (value.version !== 1) {
    throw new Error("Invalid Ask curation overlay: version must be 1.");
  }
  if (!Array.isArray(value.rules)) {
    throw new Error("Invalid Ask curation overlay: rules must be an array.");
  }
  return {
    version: 1,
    rules: value.rules.map(parseRule),
  };
}

function profileMatches(answers: AskAnswers, when: AskCurationProfile): boolean {
  for (const [questionId, optionId] of Object.entries(when)) {
    if (answers[questionId as AskQuestionId] !== optionId) return false;
  }
  return true;
}

function bookMatches(recommendation: AskRecommendation, book: string): boolean {
  return recommendation.slug === book || recommendation.id === book;
}

function tagMatches(recommendation: AskRecommendation, tag: AskWeightTag): boolean {
  return recommendation.reasons.some((reason) => reason.tag === tag && reason.matched);
}

function boostMatches(recommendation: AskRecommendation, rule: AskCurationBoostBookRule | AskCurationBoostTagRule): boolean {
  return "book" in rule ? bookMatches(recommendation, rule.book) : tagMatches(recommendation, rule.tag);
}

function targetLabel(rule: AskCurationPinRule | AskCurationBoostBookRule | AskCurationBoostTagRule): "book" | "tag" {
  return "tag" in rule ? "tag" : "book";
}

function compareAppliedRecommendations(a: AppliedRecommendation, b: AppliedRecommendation): number {
  if (a.pinOrder != null || b.pinOrder != null) {
    if (a.pinOrder == null) return 1;
    if (b.pinOrder == null) return -1;
    if (a.pinOrder !== b.pinOrder) return a.pinOrder - b.pinOrder;
  }

  // Pins compose on top; everything else uses the shared merit comparator
  // (score → rating → title → slug) so the overlay tail orders identically to
  // the base ranking and the matrix (Brief 164).
  return compareByMerit(a.recommendation, b.recommendation);
}

function roundScore(n: number): number {
  return Math.round(n * 100) / 100;
}

function withCuration(
  recommendation: AskRecommendation,
  scoreDelta: number,
  effects: AskRecommendationCurationEffect[],
): AskRecommendation {
  if (effects.length === 0) return recommendation;
  return {
    ...recommendation,
    score: roundScore(recommendation.score + scoreDelta),
    curation: [...(recommendation.curation ?? []), ...effects],
  };
}

export function applyAskCuration(
  recommendations: readonly AskRecommendation[],
  answers: AskAnswers,
  overlay: AskCurationOverlay = ASK_CURATION,
): AskRecommendation[] {
  const rules = overlay.rules.filter((rule) => profileMatches(answers, rule.when));
  if (rules.length === 0) {
    return recommendations
      .map((recommendation): AppliedRecommendation => ({ recommendation, pinOrder: null }))
      .sort(compareAppliedRecommendations)
      .map((applied) => applied.recommendation);
  }

  const applied: AppliedRecommendation[] = [];
  for (const recommendation of recommendations) {
    const isBanned = rules.some(
      (rule) => rule.action === "ban" && bookMatches(recommendation, rule.book),
    );
    if (isBanned) continue;

    let pinOrder: number | null = null;
    let scoreDelta = 0;
    const effects: AskRecommendationCurationEffect[] = [];

    for (const [ruleIndex, rule] of rules.entries()) {
      if (rule.action === "pin" && bookMatches(recommendation, rule.book)) {
        const points = rule.points ?? DEFAULT_PIN_POINTS;
        pinOrder ??= ruleIndex;
        scoreDelta += points;
        effects.push({
          ruleId: rule.id,
          action: "pin",
          target: "book",
          points,
          ...(rule.note ? { note: rule.note } : {}),
        });
      }

      if (rule.action === "boost" && boostMatches(recommendation, rule)) {
        const points = rule.points ?? DEFAULT_BOOST_POINTS;
        scoreDelta += points;
        effects.push({
          ruleId: rule.id,
          action: "boost",
          target: targetLabel(rule),
          points,
          ...(rule.note ? { note: rule.note } : {}),
        });
      }
    }

    applied.push({
      recommendation: withCuration(recommendation, scoreDelta, effects),
      pinOrder,
    });
  }

  return applied.sort(compareAppliedRecommendations).map((entry) => entry.recommendation);
}

export const ASK_CURATION = parseAskCurationOverlay(curationJson as unknown);

export default ASK_CURATION;
