import questionsJson from "../../../scripts/seed-data/ask-questions.json";

import type { AskQuestion } from "./types";

export const ASK_QUESTIONS: readonly AskQuestion[] = questionsJson as AskQuestion[];

export const askQuestions = ASK_QUESTIONS;

export default ASK_QUESTIONS;
