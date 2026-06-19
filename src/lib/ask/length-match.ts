import type { AskAnswers, AskRecommendation, AskWeightTag } from "./types";

/**
 * Honest length grading for the result list.
 *
 * The hard boundary (`boundaries.ts`) only *guarantees* the length intent for
 * "standalone" — it forces a single volume. For "trilogy" (the "2+ books"
 * choice) the boundary lets everything through and length becomes a soft
 * scoring signal (arc / series weights), so a high-scoring book of the wrong
 * commitment can still top the list. That is the "doesn't really fit" problem.
 *
 * This classifier re-reads each ranked recommendation and decides whether it
 * actually satisfies the reader's stated commitment, using the same matched
 * tags the engine already produced:
 *   - trilogy → the book is a short arc      (matched the `arc` tag)
 *
 * "standalone" is boundary-guaranteed and "any_length" / unanswered opt out,
 * so those are never graded (every pick is treated as exact).
 */

/** Length answers whose match is a *soft* signal we should grade. */
const GRADED_LENGTH_TAG = {
  trilogy: "arc",
} as const satisfies Partial<Record<NonNullable<AskAnswers["length"]>, AskWeightTag>>;

type GradedLength = keyof typeof GRADED_LENGTH_TAG;

function isGradedLength(value: AskAnswers["length"]): value is GradedLength {
  return value === "trilogy";
}

export interface LengthPartition {
  /**
   * True only for "trilogy" (the "2+ books" choice), where the length is a soft
   * signal some results may miss — the only case where we banner or split the
   * list.
   */
  graded: boolean;
  /** Picks that satisfy the length intent (or all picks, when not graded). */
  exact: AskRecommendation[];
  /** Strong picks that do NOT satisfy the length intent (empty when not graded). */
  further: AskRecommendation[];
}

export function partitionByLengthIntent(
  recommendations: readonly AskRecommendation[],
  answers: AskAnswers,
): LengthPartition {
  const length = answers.length;

  if (!isGradedLength(length)) {
    return { graded: false, exact: [...recommendations], further: [] };
  }

  const tag = GRADED_LENGTH_TAG[length];
  const exact: AskRecommendation[] = [];
  const further: AskRecommendation[] = [];
  for (const recommendation of recommendations) {
    (recommendation.matchedTags.includes(tag) ? exact : further).push(recommendation);
  }

  return { graded: true, exact, further };
}
