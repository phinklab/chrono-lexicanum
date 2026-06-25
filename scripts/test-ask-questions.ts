/**
 * Standalone validator for scripts/seed-data/ask-questions.json.
 *
 * DB-free smoke for the Ask contract: the Product strand can import the typed
 * questions while this script keeps the flat canonical model honest.
 */
import assert from "node:assert/strict";
import process from "node:process";

import {
  passesHardAskBoundaries,
  type AskBoundaryCandidate,
} from "@/lib/ask/boundaries";
import { ASK_QUESTIONS } from "@/lib/ask/questions";
import {
  ASK_OPTION_IDS_BY_QUESTION,
  ASK_QUESTION_IDS,
  ASK_WEIGHT_TAGS,
  type AskQuestion,
} from "@/lib/ask/types";

const EXPECTED_QUESTION_IDS = new Set<string>(ASK_QUESTION_IDS);
const KNOWN_WEIGHT_TAGS = new Set<string>(ASK_WEIGHT_TAGS);

let pass = 0;
let fail = 0;

function check(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`ok - ${name}`);
    pass += 1;
  } catch (e) {
    console.error(`not ok - ${name}`);
    console.error(`  ${e instanceof Error ? e.message : String(e)}`);
    fail += 1;
  }
}

function assertNonEmptyString(value: string, label: string): void {
  assert.ok(value.trim() !== "", `${label} must not be empty`);
}

function facetMap(values: Record<string, string>): ReadonlyMap<string, ReadonlySet<string>> {
  return new Map(
    Object.entries(values).map(([category, id]) => [category, new Set([id])]),
  );
}

function boundaryCandidate(
  overrides: Partial<AskBoundaryCandidate> = {},
): AskBoundaryCandidate {
  return {
    slug: "test-book",
    format: "novel",
    seriesId: null,
    seriesIndex: null,
    seriesTotalPlanned: null,
    primaryEraId: "time_ending",
    startY: null,
    isAnchor: false,
    factions: [
      {
        role: "primary",
        alignment: "imperium",
        ancestry: ["inquisition", "imperium"],
      },
    ],
    facetsByCategory: facetMap({ entry_point: "standalone" }),
    ...overrides,
  };
}

function validateQuestions(questions: readonly AskQuestion[]): void {
  assert.equal(
    questions.length,
    ASK_QUESTION_IDS.length,
    `expected ${ASK_QUESTION_IDS.length} flat Ask questions`,
  );

  const seenQuestionIds = new Set<string>();

  for (const [questionIndex, question] of questions.entries()) {
    const questionAt = `questions[${questionIndex}] (${question.id})`;
    assert.ok(EXPECTED_QUESTION_IDS.has(question.id), `${questionAt}: unexpected question id`);
    assert.ok(!seenQuestionIds.has(question.id), `${questionAt}: duplicate question id`);
    seenQuestionIds.add(question.id);
    assertNonEmptyString(question.prompt, `${questionAt}.prompt`);

    const seenOptionIds = new Set<string>();
    const expectedOptionIds = new Set<string>(ASK_OPTION_IDS_BY_QUESTION[question.id]);
    assert.equal(
      question.options.length,
      expectedOptionIds.size,
      `${questionAt}: expected ${expectedOptionIds.size} options`,
    );

    for (const [optionIndex, option] of question.options.entries()) {
      const optionAt = `${questionAt}.options[${optionIndex}] (${option.id})`;
      assertNonEmptyString(option.id, `${optionAt}.id`);
      assert.ok(expectedOptionIds.has(option.id), `${optionAt}: unexpected option id`);
      assert.ok(!seenOptionIds.has(option.id), `${optionAt}: duplicate option id`);
      seenOptionIds.add(option.id);
      assertNonEmptyString(option.label, `${optionAt}.label`);

      for (const [tag, value] of Object.entries(option.weight)) {
        assert.ok(KNOWN_WEIGHT_TAGS.has(tag), `${optionAt}: unknown weight tag "${tag}"`);
        assert.ok(
          typeof value === "number" && Number.isFinite(value) && value > 0,
          `${optionAt}: weight "${tag}" must be a positive number`,
        );
      }
    }

    for (const id of expectedOptionIds) {
      assert.ok(seenOptionIds.has(id), `${questionAt}: missing option id "${id}"`);
    }
  }

  for (const id of ASK_QUESTION_IDS) {
    assert.ok(seenQuestionIds.has(id), `missing question id "${id}"`);
  }
}

console.log("ask-questions.json - structural validation");

check("committed questions match the flat Ask contract", () => {
  validateQuestions(ASK_QUESTIONS);
});

check("question ids are unique", () => {
  assert.equal(new Set(ASK_QUESTIONS.map((q) => q.id)).size, ASK_QUESTIONS.length);
});

check("option ids are unique per question", () => {
  for (const question of ASK_QUESTIONS) {
    assert.equal(new Set(question.options.map((o) => o.id)).size, question.options.length, question.id);
  }
});

check("option ids match the typed answer contract", () => {
  for (const question of ASK_QUESTIONS) {
    const expectedOptionIds = new Set<string>(ASK_OPTION_IDS_BY_QUESTION[question.id]);
    for (const option of question.options) {
      assert.ok(expectedOptionIds.has(option.id), `${question.id}.${option.id}: unexpected option id`);
    }
  }
});

check("all option labels are non-empty", () => {
  for (const question of ASK_QUESTIONS) {
    for (const option of question.options) assertNonEmptyString(option.label, `${question.id}.${option.id}.label`);
  }
});

check("all weights are known positive numbers", () => {
  for (const question of ASK_QUESTIONS) {
    for (const option of question.options) {
      for (const [tag, value] of Object.entries(option.weight)) {
        assert.ok(KNOWN_WEIGHT_TAGS.has(tag), `${question.id}.${option.id}: unknown weight tag "${tag}"`);
        assert.ok(
          typeof value === "number" && Number.isFinite(value) && value > 0,
          `${question.id}.${option.id}.${tag} must be a positive number`,
        );
      }
    }
  }
});

check("hard boundaries keep selected faction non-negotiable", () => {
  const ultramarines = boundaryCandidate({
    factions: [
      {
        role: "primary",
        alignment: "imperium",
        ancestry: ["ultramarines", "adeptus_astartes", "imperium"],
      },
    ],
  });
  const inquisitionOnly = boundaryCandidate({
    factions: [
      {
        role: "primary",
        alignment: "imperium",
        ancestry: ["inquisition", "imperium"],
      },
    ],
  });
  const traitorMarine = boundaryCandidate({
    factions: [
      {
        role: "primary",
        alignment: "chaos",
        ancestry: ["night_lords", "heretic_astartes", "chaos"],
      },
    ],
  });
  const necronLead = boundaryCandidate({
    factions: [{ role: "primary", alignment: "xenos", ancestry: ["necrons"] }],
  });

  // imperium_of_man — the merged lane (Brief 164): any Imperium-tree primary
  // passes (the Inquisition + Astartes both sit under `imperium`); the alien is
  // rejected.
  assert.equal(passesHardAskBoundaries(inquisitionOnly, { faction_love: "imperium_of_man" }), true);
  assert.equal(passesHardAskBoundaries(ultramarines, { faction_love: "imperium_of_man" }), true);
  assert.equal(passesHardAskBoundaries(necronLead, { faction_love: "imperium_of_man" }), false);

  // loyalist_sm — only loyalist Adeptus Astartes: a generic Imperium book (pure
  // Inquisition) is rejected, a traitor marine is rejected (chaos), a loyal
  // Astartes passes.
  assert.equal(passesHardAskBoundaries(ultramarines, { faction_love: "loyalist_sm" }), true);
  assert.equal(passesHardAskBoundaries(inquisitionOnly, { faction_love: "loyalist_sm" }), false);
  assert.equal(passesHardAskBoundaries(traitorMarine, { faction_love: "loyalist_sm" }), false);

  // heretic — chaos / heretic astartes pass; loyalists are rejected.
  assert.equal(passesHardAskBoundaries(traitorMarine, { faction_love: "heretic" }), true);
  assert.equal(passesHardAskBoundaries(ultramarines, { faction_love: "heretic" }), false);

  // xenos — only the alien.
  assert.equal(passesHardAskBoundaries(necronLead, { faction_love: "xenos" }), true);
  assert.equal(passesHardAskBoundaries(inquisitionOnly, { faction_love: "xenos" }), false);

  // any_faction is no gate — the faction boundary never filters.
  assert.equal(passesHardAskBoundaries(necronLead, { faction_love: "any_faction" }), true);
  assert.equal(passesHardAskBoundaries(traitorMarine, { faction_love: "any_faction" }), true);
});

check("HH hard gate keeps Horus Heresy away from newcomers (era + startY + slug)", () => {
  // Heresy detected by era id, by the M30–M31 startY band, or by the curated
  // slug supplement — the last covers the many HH books with null startY and
  // the uniform "time_ending" era.
  const heresyByEra = boundaryCandidate({ primaryEraId: "horus_heresy" });
  const heresyByYear = boundaryCandidate({ primaryEraId: "time_ending", startY: 31002 });
  const heresyBySlug = boundaryCandidate({
    slug: "garro-sword-of-truth",
    primaryEraId: "time_ending",
    startY: null,
  });
  const m41 = boundaryCandidate({ primaryEraId: "time_ending", startY: 41000 });

  assert.equal(passesHardAskBoundaries(heresyByEra, { experience: "new" }), false);
  assert.equal(passesHardAskBoundaries(heresyByYear, { experience: "new" }), false);
  assert.equal(passesHardAskBoundaries(heresyBySlug, { experience: "new" }), false);
  assert.equal(passesHardAskBoundaries(m41, { experience: "new" }), true);
  // some / deep readers can still get the Heresy.
  assert.equal(passesHardAskBoundaries(heresyByYear, { experience: "some" }), true);
  assert.equal(passesHardAskBoundaries(heresyBySlug, { experience: "deep" }), true);
});

check("deep hard gate excludes the anchor set (seasoned readers know the classics)", () => {
  const anchor = boundaryCandidate({ isAnchor: true });
  const nonAnchor = boundaryCandidate({ isAnchor: false });

  assert.equal(passesHardAskBoundaries(anchor, { experience: "deep" }), false);
  assert.equal(passesHardAskBoundaries(nonAnchor, { experience: "deep" }), true);
  // anchors still surface for new / some (subject to the other gates).
  assert.equal(passesHardAskBoundaries(anchor, { experience: "some" }), true);
  assert.equal(passesHardAskBoundaries(anchor, { experience: "new" }), true);
});

check("hard boundaries keep selected length non-negotiable", () => {
  const firstNovel = boundaryCandidate({
    seriesId: "eisenhorn",
    seriesIndex: 1,
    seriesTotalPlanned: 3,
    facetsByCategory: facetMap({ entry_point: "series_start" }),
  });
  const midSeriesNovel = boundaryCandidate({
    seriesId: "eisenhorn",
    seriesIndex: 2,
    seriesTotalPlanned: 3,
    facetsByCategory: facetMap({ entry_point: "mid_series" }),
  });
  const omnibus = boundaryCandidate({
    format: "omnibus",
    seriesId: "eisenhorn",
    seriesIndex: null,
    seriesTotalPlanned: 3,
  });
  const anthology = boundaryCandidate({ format: "anthology" });
  const unknownLengthSeries = boundaryCandidate({
    seriesId: "horus_heresy",
    seriesIndex: 1,
    seriesTotalPlanned: null,
    facetsByCategory: facetMap({ entry_point: "series_start" }),
  });

  assert.equal(passesHardAskBoundaries(firstNovel, { length: "standalone" }), true);
  assert.equal(passesHardAskBoundaries(midSeriesNovel, { length: "standalone" }), true);
  assert.equal(passesHardAskBoundaries(omnibus, { length: "standalone" }), false);
  assert.equal(passesHardAskBoundaries(anthology, { length: "standalone" }), false);
  assert.equal(passesHardAskBoundaries(omnibus, { length: "trilogy" }), true);
  assert.equal(passesHardAskBoundaries(firstNovel, { length: "any_length" }), true);
  assert.equal(passesHardAskBoundaries(unknownLengthSeries, { length: "any_length" }), true);
});

console.log("");
console.log(`# pass ${pass}`);
console.log(`# fail ${fail}`);
if (fail > 0) process.exit(1);
