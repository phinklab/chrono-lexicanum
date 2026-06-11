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
  total: number;
  value: string | undefined;
  disabled?: boolean;
  onPick: (questionId: AskQuestionId, optionId: AskOptionId) => void;
};

/* The interrogation protocol (Report 141, idea C2-4, ported live): a roman
   ordinal as ornament, the question in Cormorant, answers as a frameless
   ballot matrix ◇ → ◆. Same props and pick handling as before — only the
   presentation changed. */
export default function QuestionCard({
  question,
  index,
  total,
  value,
  disabled = false,
  onPick,
}: QuestionCardProps) {
  const titleId = `ask-question-${question.id}`;
  const numeral = roman(index + 1);

  return (
    <section className="ask-question c-fade-in" aria-labelledby={titleId}>
      <div className="ask-protocol">
        <p className="lx-stat">
          <b>
            QVAESTIO {numeral} OF {roman(total)}
          </b>
          <span>Profile building</span>
        </p>
      </div>

      <div className="ask-q">
        <div className="ask-q__num" aria-hidden>
          {numeral}
          <small>QVAESTIO</small>
        </div>
        <div className="ask-q__main">
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
        </div>
      </div>
    </section>
  );
}
