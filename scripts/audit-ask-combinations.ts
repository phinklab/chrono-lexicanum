/**
 * Audit every flat Ask answer combination against the DB-backed recommender.
 *
 * Output:
 *   ingest/ask/audit-ask-combinations.md
 *   ingest/ask/audit-ask-combinations.json
 *
 * These files are reviewer aids for Philipp/Cowork. They are not frontend data
 * sources and should not be imported by the Product strand.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";

import { ANCHOR_SLUGS } from "@/lib/ask/anchors";
import { isHeresyBook } from "@/lib/ask/boundaries";
import { resolveAskCell } from "@/lib/ask/matrix";
import { ASK_QUESTIONS } from "@/lib/ask/questions";
import { buildAskProfile } from "@/lib/ask/recommend";
import {
  ASK_WEIGHT_TAGS,
  type AskAnswers,
  type AskOptionId,
  type AskQuestionId,
  type AskRecommendation,
  type AskRecommendationReason,
  type AskWeightTag,
  type AskWeightVector,
} from "@/lib/ask/types";

const DEFAULT_LIMIT = 10;
const DEFAULT_WEAK_SCORE = 35;
const DEFAULT_OUT_DIR = resolve(process.cwd(), "ingest", "ask");

interface CliOptions {
  limit: number;
  weakScore: number;
  outDir: string;
}

interface AnswerChoice {
  questionId: AskQuestionId;
  optionId: AskOptionId;
  questionPrompt: string;
  optionLabel: string;
}

interface AskCombination {
  index: number;
  key: string;
  answers: AskAnswers;
  choices: AnswerChoice[];
}

interface RecommendationAudit {
  rank: number;
  slug: string;
  title: string;
  authors: string[];
  score: number;
  primaryEraId?: string | null;
  startY?: number | null;
  format?: string | null;
  releaseYear?: number | null;
  rating?: number | null;
  isAnchor: boolean;
  matchedReasonCodes: string[];
  reasons: AskRecommendationReason[];
}

interface CombinationAudit {
  index: number;
  key: string;
  answers: AskAnswers;
  choices: AnswerChoice[];
  answerLabels: Record<string, string>;
  activeTags: Array<{ tag: AskWeightTag; weight: number }>;
  topScore: number;
  recommendations: RecommendationAudit[];
}

interface BookExposure {
  slug: string;
  title: string;
  topNCount: number;
  top1Count: number;
  bestRank: number;
  scoreSum: number;
}

interface TagStats {
  tag: AskWeightTag;
  usedByOptions: number;
  activeCombos: number;
  combosWithTopNMatch: number;
  topNMatchedRecs: number;
  top1MatchedRecs: number;
  pointsSum: number;
}

interface OptionCoverage {
  questionId: AskQuestionId;
  optionId: AskOptionId;
  optionLabel: string;
  combos: number;
  empty: number;
  weak: number;
  topScoreSum: number;
  topNBooks: Set<string>;
  top1Books: Map<string, number>;
}

interface PlausibilityScenario {
  id: string;
  label: string;
  answers: AskAnswers;
  expectedFamilies: string[];
  patterns: RegExp[];
}

interface PlausibilityResult {
  id: string;
  label: string;
  answers: AskAnswers;
  expectedFamilies: string[];
  topTitles: string[];
  matchedTitles: string[];
  status: "visible" | "review";
}

function parseInteger(value: string, label: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer, got "${value}"`);
  }
  return parsed;
}

function parseNumber(value: string, label: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a non-negative number, got "${value}"`);
  }
  return parsed;
}

function parseArgs(argv: readonly string[]): CliOptions {
  const options: CliOptions = {
    limit: DEFAULT_LIMIT,
    weakScore: DEFAULT_WEAK_SCORE,
    outDir: DEFAULT_OUT_DIR,
  };

  for (const arg of argv) {
    if (arg.startsWith("--limit=")) {
      options.limit = parseInteger(arg.slice("--limit=".length), "--limit");
    } else if (arg.startsWith("--weak-score=")) {
      options.weakScore = parseNumber(arg.slice("--weak-score=".length), "--weak-score");
    } else if (arg.startsWith("--out-dir=")) {
      const outDir = arg.slice("--out-dir=".length).trim();
      if (!outDir) throw new Error("--out-dir must not be empty");
      options.outDir = resolve(process.cwd(), outDir);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function setAnswer(answers: AskAnswers, questionId: AskQuestionId, optionId: AskOptionId): void {
  const mutable = answers as Partial<Record<AskQuestionId, AskOptionId>>;
  mutable[questionId] = optionId;
}

function answerValue(answers: AskAnswers, questionId: AskQuestionId): string {
  const record = answers as Partial<Record<AskQuestionId, string>>;
  return record[questionId] ?? "";
}

function combinationKey(answers: AskAnswers): string {
  return ASK_QUESTIONS.map((q) => `${q.id}=${answerValue(answers, q.id)}`).join("|");
}

function enumerateCombinations(): AskCombination[] {
  const combinations: AskCombination[] = [];

  function walk(questionIndex: number, answers: AskAnswers, choices: AnswerChoice[]): void {
    const question = ASK_QUESTIONS[questionIndex];
    if (!question) {
      const index = combinations.length + 1;
      combinations.push({
        index,
        key: combinationKey(answers),
        answers: { ...answers },
        choices: [...choices],
      });
      return;
    }

    for (const option of question.options) {
      const nextAnswers: AskAnswers = { ...answers };
      setAnswer(nextAnswers, question.id, option.id);
      walk(questionIndex + 1, nextAnswers, [
        ...choices,
        {
          questionId: question.id,
          optionId: option.id,
          questionPrompt: question.prompt,
          optionLabel: option.label,
        },
      ]);
    }
  }

  walk(0, {}, []);
  return combinations;
}

function activeTags(weights: AskWeightVector): Array<{ tag: AskWeightTag; weight: number }> {
  const tags: Array<{ tag: AskWeightTag; weight: number }> = [];
  for (const tag of ASK_WEIGHT_TAGS) {
    const weight = weights[tag] ?? 0;
    if (weight > 0) tags.push({ tag, weight });
  }
  return tags;
}

function reasonCode(reason: AskRecommendationReason): string {
  return `${reason.tag}:${formatNumber(reason.points)}`;
}

function toRecommendationAudit(rec: AskRecommendation, index: number): RecommendationAudit {
  const matchedReasonCodes = rec.reasons
    .filter((reason) => reason.matched && reason.points > 0)
    .map(reasonCode);

  return {
    rank: index + 1,
    slug: rec.slug,
    title: rec.title,
    authors: rec.authors,
    score: rec.score,
    primaryEraId: rec.primaryEraId,
    startY: rec.startY,
    format: rec.format,
    releaseYear: rec.releaseYear,
    rating: rec.rating,
    isAnchor: ANCHOR_SLUGS.has(rec.slug),
    matchedReasonCodes,
    reasons: rec.reasons,
  };
}

function createTagStats(): Map<AskWeightTag, TagStats> {
  const usedByOptions = new Map<AskWeightTag, number>();
  for (const question of ASK_QUESTIONS) {
    for (const option of question.options) {
      for (const tag of Object.keys(option.weight) as AskWeightTag[]) {
        usedByOptions.set(tag, (usedByOptions.get(tag) ?? 0) + 1);
      }
    }
  }

  const map = new Map<AskWeightTag, TagStats>();
  for (const tag of ASK_WEIGHT_TAGS) {
    map.set(tag, {
      tag,
      usedByOptions: usedByOptions.get(tag) ?? 0,
      activeCombos: 0,
      combosWithTopNMatch: 0,
      topNMatchedRecs: 0,
      top1MatchedRecs: 0,
      pointsSum: 0,
    });
  }
  return map;
}

function createOptionCoverage(): Map<string, OptionCoverage> {
  const map = new Map<string, OptionCoverage>();
  for (const question of ASK_QUESTIONS) {
    for (const option of question.options) {
      map.set(`${question.id}.${option.id}`, {
        questionId: question.id,
        optionId: option.id,
        optionLabel: option.label,
        combos: 0,
        empty: 0,
        weak: 0,
        topScoreSum: 0,
        topNBooks: new Set<string>(),
        top1Books: new Map<string, number>(),
      });
    }
  }
  return map;
}

function getReason(rec: RecommendationAudit, tag: AskWeightTag): AskRecommendationReason | null {
  return rec.reasons.find((reason) => reason.tag === tag) ?? null;
}

function addBookExposure(map: Map<string, BookExposure>, rec: RecommendationAudit): void {
  const current =
    map.get(rec.slug) ??
    ({
      slug: rec.slug,
      title: rec.title,
      topNCount: 0,
      top1Count: 0,
      bestRank: rec.rank,
      scoreSum: 0,
    } satisfies BookExposure);

  current.topNCount += 1;
  current.top1Count += rec.rank === 1 ? 1 : 0;
  current.bestRank = Math.min(current.bestRank, rec.rank);
  current.scoreSum += rec.score;
  map.set(rec.slug, current);
}

function updateTagStats(tagStats: Map<AskWeightTag, TagStats>, audit: CombinationAudit): void {
  for (const active of audit.activeTags) {
    const stats = tagStats.get(active.tag);
    if (!stats) continue;
    stats.activeCombos += 1;

    let comboHadMatch = false;
    for (const rec of audit.recommendations) {
      const reason = getReason(rec, active.tag);
      if (!reason || reason.points <= 0) continue;
      comboHadMatch = true;
      stats.topNMatchedRecs += 1;
      stats.pointsSum += reason.points;
      if (rec.rank === 1) stats.top1MatchedRecs += 1;
    }

    if (comboHadMatch) stats.combosWithTopNMatch += 1;
  }
}

function updateOptionCoverage(
  optionCoverage: Map<string, OptionCoverage>,
  audit: CombinationAudit,
  weakScore: number,
): void {
  const empty = audit.recommendations.length === 0;
  const weak = empty || audit.topScore < weakScore;

  for (const choice of audit.choices) {
    const stats = optionCoverage.get(`${choice.questionId}.${choice.optionId}`);
    if (!stats) continue;
    stats.combos += 1;
    stats.empty += empty ? 1 : 0;
    stats.weak += weak ? 1 : 0;
    stats.topScoreSum += audit.topScore;

    for (const rec of audit.recommendations) stats.topNBooks.add(rec.slug);

    const top1 = audit.recommendations[0];
    if (top1) stats.top1Books.set(top1.slug, (stats.top1Books.get(top1.slug) ?? 0) + 1);
  }
}

function isHeresy(rec: RecommendationAudit): boolean {
  // Same detector as the HH hard gate (boundaries.ts) — startY band + curated
  // slug supplement — so the audit measures exactly what the gate filters
  // (Brief 164).
  return isHeresyBook(rec.primaryEraId ?? null, rec.startY ?? null, rec.slug);
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function percent(part: number, total: number): string {
  if (total === 0) return "0.0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}

function average(sum: number, count: number): number {
  return count === 0 ? 0 : sum / count;
}

function quantile(sorted: readonly number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.floor((sorted.length - 1) * p);
  return sorted[index] ?? 0;
}

function md(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
}

function answerLabel(choices: readonly AnswerChoice[]): string {
  return choices.map((c) => `${c.questionId}=${c.optionId}`).join("; ");
}

function answerLabelWithNames(choices: readonly AnswerChoice[]): string {
  return choices.map((c) => `${c.questionId}: ${c.optionLabel}`).join("; ");
}

function compactRecommendations(recommendations: readonly RecommendationAudit[]): string {
  if (recommendations.length === 0) return "_empty_";
  return recommendations
    .map((rec) => {
      const codes = rec.matchedReasonCodes.length === 0 ? "no matched codes" : rec.matchedReasonCodes.join(", ");
      return `${rec.rank}. ${md(rec.title)} (${formatNumber(rec.score)}; ${md(codes)})`;
    })
    .join("<br>");
}

function topTitleList(recommendations: readonly RecommendationAudit[], limit: number): string[] {
  return recommendations.slice(0, limit).map((rec) => `${rec.rank}. ${rec.title} (${formatNumber(rec.score)})`);
}

function scenarioAnswers(
  experience: string,
  faction: string,
  tone: string,
  length: string,
): AskAnswers {
  return {
    experience: experience as AskAnswers["experience"],
    faction_love: faction as AskAnswers["faction_love"],
    tone: tone as AskAnswers["tone"],
    length: length as AskAnswers["length"],
  };
}

/**
 * Plausibility anchors, recast for the 4-question contract (Brief 164). Each
 * scenario lands in a lane that carries a curated anchor, so the expected
 * family should surface near the top. The Chaos / early-Heresy scenarios use
 * experience=some, not deep — the deep gate excludes the anchor set, so the
 * canonical entries only appear for new/some readers.
 */
function plausibilityScenarios(): PlausibilityScenario[] {
  return [
    {
      id: "new-imperium-investigative-standalone",
      label: "Newcomer + Imperium + investigative + standalone",
      answers: scenarioAnswers("new", "imperium_of_man", "investigative", "standalone"),
      expectedFamilies: ["Eisenhorn", "Vaults of Terra"],
      patterns: [
        /eisenhorn|xenos|malleus|hereticus/i,
        /vaults?[- ]of[- ]terra|carrion[- ]throne|hollow[- ]mountain/i,
      ],
    },
    {
      id: "new-imperium-military-trilogy",
      label: "Newcomer + Imperium + military + trilogy",
      answers: scenarioAnswers("new", "imperium_of_man", "military", "trilogy"),
      expectedFamilies: ["Gaunt", "Cain", "Cadia"],
      patterns: [
        /gaunt|first[- ]and[- ]only|tanith/i,
        /ciaphas[- ]cain|for[- ]the[- ]emperor|hero[- ]of[- ]the[- ]imperium/i,
        /cadia|cadian|fifteen[- ]hours/i,
      ],
    },
    {
      id: "new-space-marines-heroic",
      label: "Newcomer + Space Marines + heroic",
      answers: scenarioAnswers("new", "loyalist_sm", "heroic", "standalone"),
      expectedFamilies: ["Space Wolf", "Brothers of the Snake"],
      patterns: [/space[- ]wolf|ragnar/i, /brothers[- ]of[- ]the[- ]snake/i],
    },
    {
      id: "chaos-grimdark",
      label: "Chaos + grimdark (some)",
      answers: scenarioAnswers("some", "heretic", "grimdark", "trilogy"),
      expectedFamilies: ["Night Lords", "Soul Hunter"],
      patterns: [/night[- ]lords/i, /soul[- ]hunter/i],
    },
    {
      id: "xenos-grimdark",
      label: "Xenos + grimdark (some)",
      answers: scenarioAnswers("some", "xenos", "grimdark", "standalone"),
      expectedFamilies: ["The Infinite and the Divine", "Severed"],
      patterns: [/infinite.*divine/i, /severed/i],
    },
    {
      id: "early-heresy",
      label: "Heretic + heroic (some) — early Heresy",
      answers: scenarioAnswers("some", "heretic", "heroic", "trilogy"),
      expectedFamilies: ["Horus Rising / Talon of Horus / Black Legion"],
      patterns: [/horus[- ]rising|talons?[- ]of[- ]horus|black[- ]legion/i],
    },
  ];
}

function evaluatePlausibility(
  auditsByKey: ReadonlyMap<string, CombinationAudit>,
): PlausibilityResult[] {
  return plausibilityScenarios().map((scenario): PlausibilityResult => {
    const audit = auditsByKey.get(combinationKey(scenario.answers));
    const top = audit?.recommendations ?? [];
    const matchedTitles = top
      .filter((rec) => scenario.patterns.some((pattern) => pattern.test(`${rec.title} ${rec.slug}`)))
      .map((rec) => `${rec.rank}. ${rec.title}`);

    return {
      id: scenario.id,
      label: scenario.label,
      answers: scenario.answers,
      expectedFamilies: scenario.expectedFamilies,
      topTitles: topTitleList(top, 10),
      matchedTitles,
      status: matchedTitles.length > 0 ? "visible" : "review",
    };
  });
}

interface GateMetrics {
  /** Newcomer slots and how many were Horus-Heresy books — the HH gate must
   *  hold this at 0 (Brief 164). */
  newcomerSlots: number;
  newcomerHeresyHits: number;
  newcomerHeresyShare: string;
  /** Deep slots and how many were anchor books — the deep gate must hold this
   *  at 0. */
  deepSlots: number;
  deepAnchorHits: number;
  deepAnchorShare: string;
  /** Heresy exposure for some/deep readers (no gate; reported for context). */
  someDeepSlots: number;
  someDeepHeresyHits: number;
  someDeepHeresyShare: string;
}

function gateMetrics(audits: readonly CombinationAudit[]): GateMetrics {
  let newcomerSlots = 0;
  let newcomerHeresyHits = 0;
  let deepSlots = 0;
  let deepAnchorHits = 0;
  let someDeepSlots = 0;
  let someDeepHeresyHits = 0;

  for (const audit of audits) {
    const experience = answerValue(audit.answers, "experience");
    const recs = audit.recommendations;

    if (experience === "new") {
      newcomerSlots += recs.length;
      newcomerHeresyHits += recs.filter(isHeresy).length;
    }
    if (experience === "deep") {
      deepSlots += recs.length;
      deepAnchorHits += recs.filter((rec) => rec.isAnchor).length;
    }
    if (experience === "some" || experience === "deep") {
      someDeepSlots += recs.length;
      someDeepHeresyHits += recs.filter(isHeresy).length;
    }
  }

  return {
    newcomerSlots,
    newcomerHeresyHits,
    newcomerHeresyShare: percent(newcomerHeresyHits, newcomerSlots),
    deepSlots,
    deepAnchorHits,
    deepAnchorShare: percent(deepAnchorHits, deepSlots),
    someDeepSlots,
    someDeepHeresyHits,
    someDeepHeresyShare: percent(someDeepHeresyHits, someDeepSlots),
  };
}

const CONCRETE_TONES = ["grimdark", "heroic", "investigative", "military"];
const CONCRETE_FACTIONS = ["imperium_of_man", "loyalist_sm", "heretic", "xenos"];

interface ToneClash {
  title: string;
  tones: string[];
}

interface ToneClashContext {
  experience: string;
  faction: string;
  length: string;
  clashes: ToneClash[];
}

interface ToneDistinctness {
  /** (experience, faction, length) contexts examined over the 4 concrete tones. */
  contexts: number;
  /** Contexts where all four tones produced a distinct #1. */
  distinctContexts: number;
  /** Contexts where one book is the #1 of two or more tones. */
  clashes: ToneClashContext[];
}

/**
 * Tone is the dominant axis (Brief 164 tuning): holding experience/faction/
 * length fixed, each of the four concrete tones should give a distinct #1 — so
 * changing only the tone changes the top result. This measures that across the
 * 4 concrete factions × 3 experiences × 3 lengths (the `any_*` aggregation cells
 * are excluded — they merge tones by design). Informational, not a hard gate:
 * a handful of narrow pools where one book legitimately owns two registers are
 * accepted (see the PR notes), so this is reported, not enforced.
 */
function toneDistinctness(audits: readonly CombinationAudit[]): ToneDistinctness {
  const groups = new Map<string, Map<string, string>>();
  for (const audit of audits) {
    const faction = answerValue(audit.answers, "faction_love");
    const tone = answerValue(audit.answers, "tone");
    if (!CONCRETE_FACTIONS.includes(faction) || !CONCRETE_TONES.includes(tone)) continue;
    const top1 = audit.recommendations[0]?.title;
    if (!top1) continue;
    const experience = answerValue(audit.answers, "experience");
    const length = answerValue(audit.answers, "length");
    const ctxKey = `${experience}|${faction}|${length}`;
    const byTone = groups.get(ctxKey) ?? new Map<string, string>();
    byTone.set(tone, top1);
    groups.set(ctxKey, byTone);
  }

  const clashes: ToneClashContext[] = [];
  let distinctContexts = 0;
  for (const [ctxKey, byTone] of groups) {
    const titleToTones = new Map<string, string[]>();
    for (const [tone, title] of byTone) {
      const arr = titleToTones.get(title) ?? [];
      arr.push(tone);
      titleToTones.set(title, arr);
    }
    const dupes = [...titleToTones.entries()].filter(([, tones]) => tones.length > 1);
    if (dupes.length === 0) {
      distinctContexts += 1;
      continue;
    }
    const [experience, faction, length] = ctxKey.split("|");
    clashes.push({
      experience,
      faction,
      length,
      clashes: dupes.map(([title, tones]) => ({ title, tones })),
    });
  }

  return { contexts: groups.size, distinctContexts, clashes };
}

function renderMarkdown(args: {
  options: CliOptions;
  audits: readonly CombinationAudit[];
  bookExposure: readonly BookExposure[];
  tagStats: readonly TagStats[];
  optionCoverage: readonly OptionCoverage[];
  plausibility: readonly PlausibilityResult[];
  markdownPath: string;
  jsonPath: string;
}): string {
  const { options, audits, bookExposure, tagStats, optionCoverage, plausibility, markdownPath, jsonPath } = args;
  const topScores = audits.map((audit) => audit.topScore).sort((a, b) => a - b);
  const empty = audits.filter((audit) => audit.recommendations.length === 0);
  const weak = audits.filter((audit) => audit.recommendations.length === 0 || audit.topScore < options.weakScore);
  const weakest = [...audits].sort((a, b) => a.topScore - b.topScore || a.index - b.index).slice(0, 30);
  const overdominant = bookExposure.filter(
    (book) => book.topNCount / audits.length >= 0.25 || book.top1Count / audits.length >= 0.1,
  );
  const noEffectTags = tagStats.filter((tag) => tag.activeCombos > 0 && tag.combosWithTopNMatch === 0);
  const unusedTags = tagStats.filter((tag) => tag.usedByOptions === 0);
  const lowEffectTags = tagStats.filter((tag) => {
    if (tag.activeCombos === 0 || tag.combosWithTopNMatch === 0) return false;
    return tag.combosWithTopNMatch / tag.activeCombos < 0.05;
  });
  const gate = gateMetrics(audits);

  const lines: string[] = [];
  lines.push("# Ask Combination Audit");
  lines.push("");
  lines.push(
    "**Review basis only.** This report is generated for Philipp/Cowork curation review; it is not a frontend data source.",
  );
  lines.push("");
  lines.push(`- Command: \`npm run audit:ask-combinations\``);
  lines.push(`- Question source: \`src/lib/ask/questions.ts\``);
  lines.push(`- Recommender: \`src/lib/ask/recommend.ts\``);
  lines.push(`- Combinations: ${audits.length}`);
  lines.push(`- Recommendation limit per combination: Top-${options.limit}`);
  lines.push(`- Weak-score threshold: top score < ${formatNumber(options.weakScore)}`);
  lines.push(`- Markdown: \`${markdownPath}\``);
  lines.push(`- JSON detail: \`${jsonPath}\``);
  lines.push("");
  lines.push("## Curation reference frame");
  lines.push("");
  lines.push(
    "- FanFiAddict beginner guide: https://fanfiaddict.com/so-you-want-to-start-reading-warhammer-40000-heres-where-to-start/",
  );
  lines.push("- WH40K Book Club beginner guide: https://wh40kbookclub.com/beginners-guide-to-warhammer-40000/");
  lines.push(
    "- Lane-scoped anchors (`scripts/seed-data/ask-anchors.json`) seed the canonical entry per slice: Eisenhorn/Vaults of Terra (Imperium-investigative), Gaunt/Cain/Cadia (Imperium-military), Space Wolf/Brothers of the Snake (loyalist SM), Night Lords/Soul Hunter (heretic-grimdark), The Infinite and the Divine (xenos), Horus Rising (heretic + experience=some).",
  );
  lines.push("");
  lines.push("## Score summary");
  lines.push("");
  lines.push(`- Empty combinations: ${empty.length}`);
  lines.push(`- Weak combinations: ${weak.length}`);
  lines.push(`- Top-score min / p10 / median / p90 / max: ${[
    quantile(topScores, 0),
    quantile(topScores, 0.1),
    quantile(topScores, 0.5),
    quantile(topScores, 0.9),
    quantile(topScores, 1),
  ]
    .map(formatNumber)
    .join(" / ")}`);
  lines.push("");
  lines.push("## Gate verification");
  lines.push("");
  lines.push(
    `- **HH gate (newcomer):** ${gate.newcomerHeresyShare} of newcomer Top-${options.limit} slots are Horus-Heresy books (${gate.newcomerHeresyHits}/${gate.newcomerSlots}). Must be 0.`,
  );
  lines.push(
    `- **Deep gate (anchors):** ${gate.deepAnchorShare} of deep Top-${options.limit} slots are anchor books (${gate.deepAnchorHits}/${gate.deepSlots}). Must be 0.`,
  );
  lines.push(
    `- Context — some/deep Heresy exposure: ${gate.someDeepHeresyShare} (${gate.someDeepHeresyHits}/${gate.someDeepSlots} slots); no gate, the Heresy is allowed once you're past newcomer.`,
  );
  if (gate.newcomerHeresyHits > 0 || gate.deepAnchorHits > 0) {
    lines.push("");
    lines.push("> ⚠ A gate invariant is violated above — see the script's non-zero exit.");
  }
  lines.push("");
  lines.push("## Tone distinctness");
  lines.push("");
  const toneDistinct = toneDistinctness(audits);
  lines.push(
    `Tone is the dominant axis (Brief 164): holding experience/faction/length fixed, each of the four concrete tones should yield a distinct #1. **${toneDistinct.distinctContexts}/${toneDistinct.contexts}** contexts give four distinct tone champions. Informational, not a hard gate.`,
  );
  lines.push("");
  if (toneDistinct.clashes.length === 0) {
    lines.push("_Every context gives a distinct #1 per tone._");
  } else {
    lines.push(
      "Accepted structural exceptions — one book legitimately owns two registers in a narrow pool, and forcing a split would promote a worse #1:",
    );
    lines.push("");
    lines.push("| Context (experience / faction / length) | Book | Tones sharing #1 |");
    lines.push("|---|---|---|");
    for (const clash of toneDistinct.clashes) {
      for (const entry of clash.clashes) {
        lines.push(
          `| ${clash.experience} / ${clash.faction} / ${clash.length} | ${md(entry.title)} | ${entry.tones.join(", ")} |`,
        );
      }
    }
  }
  lines.push("");
  lines.push("## Plausibility checks");
  lines.push("");
  lines.push("| Scenario | Expected family | Status | Matches in Top-N | Top 5 |");
  lines.push("|---|---|---|---|---|");
  for (const result of plausibility) {
    lines.push(
      `| ${md(result.label)} | ${md(result.expectedFamilies.join(", "))} | ${result.status} | ${md(result.matchedTitles.join("; ") || "-")} | ${md(result.topTitles.slice(0, 5).join("; "))} |`,
    );
  }
  lines.push("");
  lines.push("## Overdominant books");
  lines.push("");
  if (overdominant.length === 0) {
    lines.push("_No book crossed the dominance thresholds (Top-N share >= 25% or Top-1 share >= 10%)._");
  } else {
    lines.push("| Book | Top-N appearances | Top-1 appearances | Best rank | Avg score when shown |");
    lines.push("|---|---:|---:|---:|---:|");
    for (const book of overdominant.slice(0, 25)) {
      lines.push(
        `| ${md(book.title)} (\`${book.slug}\`) | ${book.topNCount} (${percent(book.topNCount, audits.length)}) | ${book.top1Count} (${percent(book.top1Count, audits.length)}) | ${book.bestRank} | ${formatNumber(average(book.scoreSum, book.topNCount))} |`,
      );
    }
  }
  lines.push("");
  lines.push("## Most frequent books");
  lines.push("");
  lines.push("| Book | Top-N appearances | Top-1 appearances | Best rank | Avg score when shown |");
  lines.push("|---|---:|---:|---:|---:|");
  for (const book of bookExposure.slice(0, 30)) {
    lines.push(
      `| ${md(book.title)} (\`${book.slug}\`) | ${book.topNCount} (${percent(book.topNCount, audits.length)}) | ${book.top1Count} (${percent(book.top1Count, audits.length)}) | ${book.bestRank} | ${formatNumber(average(book.scoreSum, book.topNCount))} |`,
    );
  }
  lines.push("");
  lines.push("## Weak or empty combinations");
  lines.push("");
  lines.push(`Weak threshold: top score < ${formatNumber(options.weakScore)}. The table also lists the 30 weakest combinations by score, even if none are under threshold.`);
  lines.push("");
  lines.push("| # | Answers | Top score | Top recommendation |");
  lines.push("|---:|---|---:|---|");
  for (const audit of weakest) {
    const top = audit.recommendations[0];
    lines.push(
      `| ${audit.index} | ${md(answerLabel(audit.choices))} | ${formatNumber(audit.topScore)} | ${top ? `${md(top.title)} (${top.slug})` : "_empty_"} |`,
    );
  }
  lines.push("");
  lines.push("## Tags without ranking effect");
  lines.push("");
  lines.push(`- Unused by any question option: ${unusedTags.map((tag) => `\`${tag.tag}\``).join(", ") || "none"}`);
  lines.push(`- Active but never matched in Top-${options.limit}: ${noEffectTags.map((tag) => `\`${tag.tag}\``).join(", ") || "none"}`);
  lines.push(`- Active with <5% combo-level Top-${options.limit} match rate: ${lowEffectTags.map((tag) => `\`${tag.tag}\` ${percent(tag.combosWithTopNMatch, tag.activeCombos)}`).join(", ") || "none"}`);
  lines.push("");
  lines.push("| Tag | Used by options | Active combos | Combos with Top-N match | Matched recs | Top-1 matched recs | Points sum |");
  lines.push("|---|---:|---:|---:|---:|---:|---:|");
  for (const tag of tagStats) {
    lines.push(
      `| \`${tag.tag}\` | ${tag.usedByOptions} | ${tag.activeCombos} | ${tag.combosWithTopNMatch} (${percent(tag.combosWithTopNMatch, tag.activeCombos)}) | ${tag.topNMatchedRecs} | ${tag.top1MatchedRecs} | ${formatNumber(tag.pointsSum)} |`,
    );
  }
  lines.push("");
  lines.push("## Coverage by question option");
  lines.push("");
  lines.push("| Question | Option | Combos | Empty | Weak | Avg top score | Distinct Top-N books | Most common Top-1 books |");
  lines.push("|---|---|---:|---:|---:|---:|---:|---|");
  for (const option of optionCoverage) {
    const top1 = [...option.top1Books.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "en"))
      .slice(0, 3)
      .map(([slug, count]) => `${slug} (${count})`)
      .join("; ");
    lines.push(
      `| \`${option.questionId}\` | \`${option.optionId}\` ${md(option.optionLabel)} | ${option.combos} | ${option.empty} | ${option.weak} | ${formatNumber(average(option.topScoreSum, option.combos))} | ${option.topNBooks.size} | ${md(top1 || "-")} |`,
    );
  }
  lines.push("");
  lines.push("## All combinations");
  lines.push("");
  lines.push(`Every flat combination from \`src/lib/ask/questions.ts\`, with Top-${options.limit} recommendations and matched reason codes.`);
  lines.push("");
  lines.push("| # | Answers | Labels | Top recommendations and reason codes |");
  lines.push("|---:|---|---|---|");
  for (const audit of audits) {
    lines.push(
      `| ${audit.index} | ${md(answerLabel(audit.choices))} | ${md(answerLabelWithNames(audit.choices))} | ${compactRecommendations(audit.recommendations)} |`,
    );
  }
  lines.push("");

  return lines.join("\n");
}

function serializeOptionCoverage(option: OptionCoverage): {
  questionId: AskQuestionId;
  optionId: AskOptionId;
  optionLabel: string;
  combos: number;
  empty: number;
  weak: number;
  avgTopScore: number;
  distinctTopNBooks: number;
  top1Books: Array<{ slug: string; count: number }>;
} {
  return {
    questionId: option.questionId,
    optionId: option.optionId,
    optionLabel: option.optionLabel,
    combos: option.combos,
    empty: option.empty,
    weak: option.weak,
    avgTopScore: Number(average(option.topScoreSum, option.combos).toFixed(2)),
    distinctTopNBooks: option.topNBooks.size,
    top1Books: [...option.top1Books.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "en"))
      .map(([slug, count]) => ({ slug, count })),
  };
}

function serializeCombinationAudit(audit: CombinationAudit): {
  index: number;
  key: string;
  answers: AskAnswers;
  answerLabels: Record<string, string>;
  activeTags: Array<{ tag: AskWeightTag; weight: number }>;
  topScore: number;
  recommendations: Array<{
    rank: number;
    slug: string;
    title: string;
    authors: string[];
    score: number;
    primaryEraId?: string | null;
    format?: string | null;
    releaseYear?: number | null;
    rating?: number | null;
    matchedReasonCodes: string[];
  }>;
} {
  return {
    index: audit.index,
    key: audit.key,
    answers: audit.answers,
    answerLabels: audit.answerLabels,
    activeTags: audit.activeTags,
    topScore: audit.topScore,
    recommendations: audit.recommendations.map((rec) => ({
      rank: rec.rank,
      slug: rec.slug,
      title: rec.title,
      authors: rec.authors,
      score: rec.score,
      primaryEraId: rec.primaryEraId,
      format: rec.format,
      releaseYear: rec.releaseYear,
      rating: rec.rating,
      matchedReasonCodes: rec.matchedReasonCodes,
    })),
  };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const markdownPath = resolve(options.outDir, "audit-ask-combinations.md");
  const jsonPath = resolve(options.outDir, "audit-ask-combinations.json");
  const combinations = enumerateCombinations();
  const audits: CombinationAudit[] = [];
  const auditsByKey = new Map<string, CombinationAudit>();
  const bookExposure = new Map<string, BookExposure>();
  const tagStats = createTagStats();
  const optionCoverage = createOptionCoverage();

  console.log(`# audit-ask-combinations`);
  console.log(`combinations: ${combinations.length}`);
  console.log(`limit: ${options.limit}`);
  console.log(`outDir: ${options.outDir}`);

  for (const combo of combinations) {
    // Resolve each visible combination through the SAME path production uses:
    // `resolveAskCell` serves concrete cells from `recommend()` and resolves
    // `any_faction`/`any_tone` by the deterministic merge of the concrete cells
    // they span (Brief 164) — so the audit measures what the matrix actually
    // returns, not a separate live ranking. The book load is cached, so this is
    // one DB read regardless of the 225 combinations.
    const cell = await resolveAskCell(combo.answers, {
      limit: options.limit,
      cacheBooks: true,
    });
    const profile = buildAskProfile(combo.answers);
    const recommendations = cell.map(toRecommendationAudit);
    const audit: CombinationAudit = {
      index: combo.index,
      key: combo.key,
      answers: combo.answers,
      choices: combo.choices,
      answerLabels: Object.fromEntries(combo.choices.map((choice) => [choice.questionId, choice.optionLabel])),
      activeTags: activeTags(profile.weights),
      topScore: recommendations[0]?.score ?? 0,
      recommendations,
    };

    audits.push(audit);
    auditsByKey.set(audit.key, audit);
    for (const rec of recommendations) addBookExposure(bookExposure, rec);
    updateTagStats(tagStats, audit);
    updateOptionCoverage(optionCoverage, audit, options.weakScore);

    if (combo.index % 100 === 0 || combo.index === combinations.length) {
      console.log(`processed ${combo.index}/${combinations.length}`);
    }
  }

  const exposureList = [...bookExposure.values()].sort(
    (a, b) =>
      b.topNCount - a.topNCount ||
      b.top1Count - a.top1Count ||
      a.bestRank - b.bestRank ||
      a.title.localeCompare(b.title, "en"),
  );
  const tagStatsList = [...tagStats.values()];
  const optionCoverageList = [...optionCoverage.values()];
  const plausibility = evaluatePlausibility(auditsByKey);

  mkdirSync(dirname(markdownPath), { recursive: true });
  const markdown = renderMarkdown({
    options,
    audits,
    bookExposure: exposureList,
    tagStats: tagStatsList,
    optionCoverage: optionCoverageList,
    plausibility,
    markdownPath,
    jsonPath,
  });
  writeFileSync(markdownPath, markdown, "utf8");

  const payload = {
    warning: "Review basis only. Not a frontend data source.",
    generatedAt: new Date().toISOString(),
    command: "npm run audit:ask-combinations",
    source: "src/lib/ask/questions.ts",
    recommender: "src/lib/ask/recommend.ts",
    options: {
      limit: options.limit,
      weakScore: options.weakScore,
    },
    summary: {
      combinations: audits.length,
      empty: audits.filter((audit) => audit.recommendations.length === 0).length,
      weak: audits.filter((audit) => audit.recommendations.length === 0 || audit.topScore < options.weakScore).length,
      gate: gateMetrics(audits),
      toneDistinctness: toneDistinctness(audits),
    },
    plausibility,
    bookExposure: exposureList.map((book) => ({
      ...book,
      topNShare: Number((book.topNCount / audits.length).toFixed(4)),
      top1Share: Number((book.top1Count / audits.length).toFixed(4)),
      avgScoreWhenShown: Number(average(book.scoreSum, book.topNCount).toFixed(2)),
    })),
    tagStats: tagStatsList,
    optionCoverage: optionCoverageList.map(serializeOptionCoverage),
    combinations: audits.map(serializeCombinationAudit),
  };
  writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(`markdown written: ${markdownPath}`);
  console.log(`json written: ${jsonPath}`);

  // Hard invariants (Brief 164): every visible combination resolves to ≥1 book,
  // newcomers never see Horus-Heresy books, and deep readers never see anchors.
  // A violation fails the audit so it cannot land silently.
  const gate = gateMetrics(audits);
  const emptyCombos = audits.filter((audit) => audit.recommendations.length === 0);
  const violations: string[] = [];
  if (emptyCombos.length > 0) {
    violations.push(
      `${emptyCombos.length} combination(s) returned no recommendations: ${emptyCombos
        .slice(0, 10)
        .map((audit) => audit.key)
        .join(" | ")}${emptyCombos.length > 10 ? " …" : ""}`,
    );
  }
  if (gate.newcomerHeresyHits > 0) {
    violations.push(
      `HH gate breached: ${gate.newcomerHeresyHits} Horus-Heresy book(s) reached newcomer slots.`,
    );
  }
  if (gate.deepAnchorHits > 0) {
    violations.push(
      `Deep gate breached: ${gate.deepAnchorHits} anchor book(s) reached deep slots.`,
    );
  }

  if (violations.length > 0) {
    console.error("");
    console.error("[audit-ask-combinations] INVARIANT VIOLATIONS:");
    for (const violation of violations) console.error(`  - ${violation}`);
    process.exit(1);
  }

  console.log(
    `gates ok: ${audits.length} combinations, all ≥1 result; newcomer-HH ${gate.newcomerHeresyShare}, deep-anchor ${gate.deepAnchorShare}.`,
  );
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error("[audit-ask-combinations] failed:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
