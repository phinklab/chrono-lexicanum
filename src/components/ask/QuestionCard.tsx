"use client";

import type {
  AskOptionId,
  AskQuestion,
  AskQuestionId,
} from "@/lib/ask/types";

type QuestionCardProps = {
  question: AskQuestion;
  value: string | undefined;
  disabled?: boolean;
  onPick: (questionId: AskQuestionId, optionId: AskOptionId) => void;
};

/* One question as a calm reading column: the prompt in Cormorant over a
   frameless single-column ballot. Selection reads as a gold left-rule + gold
   label, carried on data-selected / aria-pressed; the timeline above the
   stage carries position. */
export default function QuestionCard({
  question,
  value,
  disabled = false,
  onPick,
}: QuestionCardProps) {
  const titleId = `ask-question-${question.id}`;

  return (
    <section className="ask-question c-fade-in" aria-labelledby={titleId}>
      <h2 id={titleId} className="ask-q__prompt">
        {question.prompt}
      </h2>
      {question.hint && <p className="ask-q__hint">{question.hint}</p>}

      <fieldset className="ask-ballot" disabled={disabled}>
        <legend className="ask-sr-only">{question.prompt}</legend>
        {question.options.map((option) => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              className="ask-opt"
              data-selected={selected}
              aria-pressed={selected}
              onClick={() => onPick(question.id, option.id)}
            >
              <span className="ask-opt__body">
                <span className="ask-opt__label">{option.label}</span>
                <span className="ask-opt__sub">{option.sub}</span>
              </span>
            </button>
          );
        })}
      </fieldset>
    </section>
  );
}
