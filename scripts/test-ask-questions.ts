/**
 * Standalone validator for scripts/seed-data/ask-questions.json.
 *
 * DB-free smoke for the Ask contract: the Product strand can import the typed
 * questions while this script keeps the flat canonical model honest.
 */
import assert from "node:assert/strict";
import process from "node:process";

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

console.log("");
console.log(`# pass ${pass}`);
console.log(`# fail ${fail}`);
if (fail > 0) process.exit(1);
