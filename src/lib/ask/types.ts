export const ASK_QUESTION_IDS = [
  "experience",
  "faction_love",
  "tone",
  "length",
  "era_pref",
] as const;

export type AskQuestionId = (typeof ASK_QUESTION_IDS)[number];

export const ASK_OPTION_IDS_BY_QUESTION = {
  experience: ["new", "some", "deep"],
  faction_love: ["imperium", "heretic", "loyalist_sm", "inquisition", "guard", "xenos"],
  tone: ["grimdark", "heroic", "political", "military", "mythic"],
  length: ["standalone", "trilogy", "epic"],
  era_pref: ["heresy", "long_war", "indomitus", "any_era"],
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
  "faction_inquisition",
  "faction_guard",
  "faction_xenos",
  "tone_grim",
  "tone_heroic",
  "tone_political",
  "tone_military",
  "tone_mythic",
  "era_heresy",
  "era_m41",
  "era_indomitus",
] as const;

export type AskWeightTag = (typeof ASK_WEIGHT_TAGS)[number];

export type AskWeightVector = Partial<Record<AskWeightTag, number>>;

export interface AskOption {
  id: AskOptionId;
  label: string;
  sub: string;
  weight: AskWeightVector;
  icon?: string;
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

export interface AskRecommendation {
  id: string;
  slug: string;
  title: string;
  authors: string[];
  score: number;
  matchedTags: AskWeightTag[];
  reasons: AskRecommendationReason[];
  primaryEraId?: string | null;
  format?: string | null;
  releaseYear?: number | null;
  rating?: number | null;
  synopsis?: string | null;
  coverUrl?: string | null;
  curation?: AskRecommendationCurationEffect[];
}

export interface AskRecommendationResult {
  answers: AskAnswers;
  profile: AskProfile;
  recommendations: AskRecommendation[];
}
