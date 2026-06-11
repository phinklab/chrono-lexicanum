"use client";

import { roman } from "@/lib/roman";
import type {
  AskOptionId,
  AskQuestion,
  AskQuestionId,
} from "@/lib/ask/types";

type QuestionCardProps = {
  question: AskQuestion;
  index: number;
  value: string | undefined;
  disabled?: boolean;
  onPick: (questionId: AskQuestionId, optionId: AskOptionId) => void;
};

/* One question as a calm reading column (single-column redesign 2026-06-11):
   a small mono kicker carries the ordinal (the stepper above already shows
   position), the question in Cormorant, answers as a frameless single-column
   ballot ◇ → ◆. Same props and pick handling as before — only presentation. */
export default function QuestionCard({
  question,
  index,
  value,
  disabled = false,
  onPick,
}: QuestionCardProps) {
  const titleId = `ask-question-${question.id}`;
  const numeral = roman(index + 1);

  return (
    <section className="ask-question c-fade-in" aria-labelledby={titleId}>
      <p className="ask-q__kicker">QVAESTIO {numeral}</p>
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
              <span className="ask-opt__glyph" aria-hidden>
                {selected ? "◆" : "◇"}
              </span>
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
