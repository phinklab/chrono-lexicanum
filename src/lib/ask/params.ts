import {
  ASK_OPTION_IDS_BY_QUESTION,
  ASK_QUESTION_IDS,
  type AskAnswers,
  type AskOptionId,
  type AskQuestionId,
} from "./types";

type SearchParamInput = Record<string, string | string[] | undefined> | URLSearchParams;
type MutableAnswers = Partial<Record<AskQuestionId, AskOptionId>>;

function readSearchParam(input: SearchParamInput, key: string): string | undefined {
  if (input instanceof URLSearchParams) {
    return input.get(key) ?? undefined;
  }

  const value = input[key];
  return Array.isArray(value) ? value[0] : value;
}

export function isAskOptionForQuestion(
  questionId: AskQuestionId,
  value: string | undefined,
): value is AskOptionId {
  if (!value) return false;
  return (ASK_OPTION_IDS_BY_QUESTION[questionId] as readonly string[]).includes(value);
}

export function parseAskAnswers(input: SearchParamInput): AskAnswers {
  const answers: MutableAnswers = {};

  for (const questionId of ASK_QUESTION_IDS) {
    const value = readSearchParam(input, questionId);
    if (isAskOptionForQuestion(questionId, value)) {
      answers[questionId] = value;
    }
  }

  return answers as AskAnswers;
}

export function withAskAnswer(
  answers: AskAnswers,
  questionId: AskQuestionId,
  optionId: AskOptionId,
): AskAnswers {
  return {
    ...answers,
    [questionId]: optionId,
  } as AskAnswers;
}

export function countAskAnswers(answers: AskAnswers): number {
  return ASK_QUESTION_IDS.filter((questionId) => Boolean(answers[questionId])).length;
}

export function isAskAnswersComplete(answers: AskAnswers): boolean {
  return ASK_QUESTION_IDS.every((questionId) => Boolean(answers[questionId]));
}

export function firstUnansweredAskIndex(answers: AskAnswers): number {
  const index = ASK_QUESTION_IDS.findIndex((questionId) => !answers[questionId]);
  return index === -1 ? ASK_QUESTION_IDS.length - 1 : index;
}

export function buildAskSearchParams(answers: AskAnswers): URLSearchParams {
  const params = new URLSearchParams();

  for (const questionId of ASK_QUESTION_IDS) {
    const value = answers[questionId];
    if (value && isAskOptionForQuestion(questionId, value)) {
      params.set(questionId, value);
    }
  }

  return params;
}

/** Canonical route of the questionnaire since it moved into the Compendium
 *  (Session 256; the old /ask redirects here). */
export const FOUR_QUESTIONS_PATH = "/compendium/four-questions";

export function buildAskHref(answers: AskAnswers): string {
  const params = buildAskSearchParams(answers);
  const query = params.toString();
  return query ? `${FOUR_QUESTIONS_PATH}?${query}` : FOUR_QUESTIONS_PATH;
}
