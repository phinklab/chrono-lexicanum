export const ASK_QUESTION_IDS = [
  "experience",
  "faction_love",
  "tone",
  "length",
] as const;

export type AskQuestionId = (typeof ASK_QUESTION_IDS)[number];

export const ASK_OPTION_IDS_BY_QUESTION = {
  experience: ["new", "some", "deep"],
  faction_love: ["imperium_of_man", "loyalist_sm", "heretic", "xenos", "any_faction"],
  tone: ["grimdark", "heroic", "investigative", "military", "any_tone"],
  length: ["standalone", "trilogy", "any_length"],
} as const satisfies Record<AskQuestionId, readonly string[]>;

export type AskOptionIdFor<Q extends AskQuestionId> = (typeof ASK_OPTION_IDS_BY_QUESTION)[Q][number];

export type AskOptionId = AskOptionIdFor<AskQuestionId>;

export const ASK_WEIGHT_TAGS = [
  "newcomer",
  "accessible",
  "deep_cut",
  "standalone",
  "short",
  "arc",
  "series",
  "villain_pov",
  "faction_imperium",
  "faction_chaos",
  "faction_space_marines",
  "faction_xenos",
  "tone_grim",
  "tone_heroic",
  "tone_political",
  "tone_military",
] as const;

export type AskWeightTag = (typeof ASK_WEIGHT_TAGS)[number];

export type AskWeightVector = Partial<Record<AskWeightTag, number>>;

export interface AskOption {
  id: AskOptionId;
  label: string;
  sub: string;
  weight: AskWeightVector;
}

export interface AskQuestion {
  id: AskQuestionId;
  prompt: string;
  hint?: string;
  options: AskOption[];
}

export type AskAnswers = Partial<{
  [Q in AskQuestionId]: AskOptionIdFor<Q>;
}>;

export interface AskProfile {
  answers: AskAnswers;
  weights: AskWeightVector;
}

export interface AskRecommendationReason {
  tag: AskWeightTag;
  label: string;
  matched: boolean;
  points: number;
  detail?: string;
}

export interface AskRecommendationCurationEffect {
  ruleId: string;
  action: "pin" | "boost";
  target: "book" | "tag";
  points: number;
  note?: string;
}

/** A partial profile (a subset of answers) — used by curation `when` and by the
 *  lane-scoped anchor signal to bind a book to the slice it anchors. */
export type AskAnswerSubset = Partial<Record<AskQuestionId, string>>;

/** The lane-scoped anchor merit attached to a recommendation when the active
 *  profile matches one of the book's anchor lanes. */
export interface AskRecommendationAnchor {
  points: number;
  lane: AskAnswerSubset;
  sources: string[];
  confidence: string;
  note?: string;
}

export interface AskRecommendation {
  id: string;
  slug: string;
  title: string;
  authors: string[];
  score: number;
  matchedTags: AskWeightTag[];
  reasons: AskRecommendationReason[];
  primaryEraId?: string | null;
  startY?: number | null;
  format?: string | null;
  releaseYear?: number | null;
  rating?: number | null;
  synopsis?: string | null;
  coverUrl?: string | null;
  curation?: AskRecommendationCurationEffect[];
  anchor?: AskRecommendationAnchor;
}

export interface AskRecommendationResult {
  answers: AskAnswers;
  profile: AskProfile;
  recommendations: AskRecommendation[];
}
