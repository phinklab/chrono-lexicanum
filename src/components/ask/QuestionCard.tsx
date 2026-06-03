"use client";

import type {
  AskOption,
  AskOptionId,
  AskQuestion,
  AskQuestionId,
} from "@/lib/ask/types";

type QuestionCardProps = {
  question: AskQuestion;
  index: number;
  total: number;
  value: string | undefined;
  disabled?: boolean;
  onPick: (questionId: AskQuestionId, optionId: AskOptionId) => void;
};

function optionCode(option: AskOption, index: number): string {
  if (option.icon) return option.icon.toUpperCase();
  return String(index + 1).padStart(2, "0");
}

export default function QuestionCard({
  question,
  index,
  total,
  value,
  disabled = false,
  onPick,
}: QuestionCardProps) {
  const titleId = `ask-question-${question.id}`;

  return (
    <section className="ask-question ask-card c-corners c-fade-in" aria-labelledby={titleId}>
      <div className="ask-question__kicker">
        <span>Question {String(index + 1).padStart(2, "0")}</span>
        <span aria-hidden>/ {String(total).padStart(2, "0")}</span>
      </div>
      <h2 id={titleId}>{question.prompt}</h2>
      {question.hint && <p className="ask-question__hint">{question.hint}</p>}

      <fieldset className="ask-options" disabled={disabled}>
        <legend className="ask-sr-only">{question.prompt}</legend>
        {question.options.map((option, optionIndex) => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              className="ask-option"
              data-selected={selected}
              aria-pressed={selected}
              onClick={() => onPick(question.id, option.id)}
            >
              <span className="ask-option__code" aria-hidden>
                {optionCode(option, optionIndex)}
              </span>
              <span className="ask-option__body">
                <span className="ask-option__label">{option.label}</span>
                <span className="ask-option__sub">{option.sub}</span>
              </span>
            </button>
          );
        })}
      </fieldset>
    </section>
  );
}
