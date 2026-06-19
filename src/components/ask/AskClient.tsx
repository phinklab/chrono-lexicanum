"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import AuspexSweep from "@/components/chrono/AuspexSweep";
import RouteScrollCue from "@/components/chrome/RouteScrollCue";
import ProcessingPanel from "./ProcessingPanel";
import QuestionCard from "./QuestionCard";
import ResultCard from "./ResultCard";
import { roman } from "@/lib/roman";
import {
  buildAskHref,
  countAskAnswers,
  firstUnansweredAskIndex,
  isAskAnswersComplete,
  withAskAnswer,
} from "@/lib/ask/params";
import type {
  AskAnswers,
  AskOptionId,
  AskQuestion,
  AskQuestionId,
  AskRecommendationResult,
} from "@/lib/ask/types";

type AskClientProps = {
  questions: readonly AskQuestion[];
  initialAnswers: AskAnswers;
  initialIsComplete: boolean;
  result: AskRecommendationResult | null;
  recommendationError: string | null;
};

function findOptionLabel(question: AskQuestion, answers: AskAnswers): string | null {
  const value = answers[question.id];
  return question.options.find((option) => option.id === value)?.label ?? null;
}

function initialQuestionIndex(answers: AskAnswers): number {
  return firstUnansweredAskIndex(answers);
}

export default function AskClient({
  questions,
  initialAnswers,
  initialIsComplete,
  result,
  recommendationError,
}: AskClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticAnswers, setOptimisticAnswers] = useState<AskAnswers | null>(null);
  const [activeIndex, setActiveIndex] = useState(() => initialQuestionIndex(initialAnswers));
  const [editingCompleteProfile, setEditingCompleteProfile] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const answers = isPending && optimisticAnswers ? optimisticAnswers : initialAnswers;
  const answeredCount = countAskAnswers(answers);
  const draftComplete = isAskAnswersComplete(answers);
  const currentQuestion = questions[activeIndex] ?? questions[0];
  const selectedValue = currentQuestion ? answers[currentQuestion.id] : undefined;
  const showResult = draftComplete && initialIsComplete && !isPending && !editingCompleteProfile;
  const showProcessing = draftComplete && isPending;
  const statusLabel = showResult
    ? "Recommendations tuned"
    : showProcessing
      ? "Loading recommendations"
      : `${answeredCount} of ${questions.length} answers recorded`;

  const selectedSummary = useMemo(
    () =>
      questions.map((question, index) => ({
        id: question.id,
        label: question.prompt,
        value: findOptionLabel(question, answers),
        isCurrent: index === activeIndex && !showResult,
      })),
    [activeIndex, answers, questions, showResult],
  );

  const navigateWithAnswers = (nextAnswers: AskAnswers) => {
    setOptimisticAnswers(nextAnswers);
    startTransition(() => {
      router.push(buildAskHref(nextAnswers), { scroll: false });
    });
  };

  const chooseOption = (questionId: AskQuestionId, optionId: AskOptionId) => {
    const nextAnswers = withAskAnswer(answers, questionId, optionId);
    const nextComplete = isAskAnswersComplete(nextAnswers);
    const nextIndex = Math.min(activeIndex + 1, questions.length - 1);

    setEditingCompleteProfile(false);
    if (!nextComplete) {
      setActiveIndex(nextIndex);
    }
    navigateWithAnswers(nextAnswers);
  };

  const goBack = () => {
    if (showResult) {
      setActiveIndex(questions.length - 1);
      setEditingCompleteProfile(true);
      return;
    }
    setActiveIndex((index) => Math.max(0, index - 1));
  };

  const reset = () => {
    // Resetting from the (tall) results view used to let the browser clamp the
    // scroll up into the masthead — jarring. Only when results were showing do
    // we re-anchor to the funnel grid so question 01 lands in view; mid-funnel
    // resets keep their place (the navigation already preserves scroll).
    const wasShowingResult = showResult;
    setActiveIndex(0);
    setEditingCompleteProfile(false);
    navigateWithAnswers({});
    if (wasShowingResult) {
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const revisitQuestion = (index: number) => {
    setActiveIndex(index);
    if (draftComplete) {
      setEditingCompleteProfile(true);
    }
  };

  return (
    <>
      <div className="ask-hud" aria-hidden>
        <div className="ask-hud__sweep">
          <AuspexSweep r={180} sweepDuration={18} accent="var(--cl-gold)" />
        </div>
      </div>

      <section className="ask-console" aria-labelledby="ask-title">
        <header className="ask-console__mast route-act">
          <p className="ask-console__eyebrow">
            {"INTERROGATORIVM · QVINQVE QVAESTIONES"}
          </p>
          <h1 id="ask-title" className="ask-console__title">
            Ask the Archive
          </h1>
          <div className="ask-console__rule" aria-hidden />
          <p className="ask-console__sub">
            Five questions; the cogitator weighs the catalogue and returns five
            doorways — real recommendations from the archive, not a horoscope.
          </p>
          <RouteScrollCue label="Begin the questionnaire" target=".ask-console__grid" />
        </header>

        <div className="ask-console__grid route-body-snap" ref={gridRef}>
          <div className="ask-stage">
            {/* Progress band — recast in the chronicle-index era-band vocabulary
                (maintainer polish 2026-06-19; the "Protocollvm" label is retired).
                Five roman marks joined by Terminus hairlines; each mark is still a
                button that revisits its question, and a sealed mark echoes its
                chosen answer underneath. */}
            <div className="ask-stepper" aria-label="Ask progress">
              <div className="ask-stepper__head">
                <span className="ask-stepper__count" aria-hidden>
                  {answeredCount} / {questions.length}
                </span>
              </div>
              <ol className="ask-steps">
                {selectedSummary.map((item, index) => {
                  const sealed = Boolean(item.value);
                  const cls = item.isCurrent ? "cur" : sealed ? "done" : undefined;
                  return (
                    <li key={item.id} className={cls}>
                      <button
                        type="button"
                        className="ask-step"
                        onClick={() => revisitQuestion(index)}
                        aria-current={item.isCurrent ? "step" : undefined}
                        title={item.label}
                      >
                        <span className="ask-step__mark" aria-hidden>
                          <span className="ask-step__glyph">
                            {sealed ? "◆" : "◇"}
                          </span>
                          <span className="ask-step__rn">{roman(index + 1)}</span>
                        </span>
                        <span className="ask-step__a">
                          {item.value ?? (item.isCurrent ? "Open" : "—")}
                        </span>
                        <span className="ask-sr-only">{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="ask-stage__body" aria-live="polite">
            {showProcessing && (
              <ProcessingPanel
                title="Weighing the catalogue"
                detail="The answers are sealed in the URL; the ranking runs server-side."
              />
            )}

            {showResult && recommendationError && (
              <div className="ask-empty ask-card" role="alert">
                <p className="card-eyebrow">{"RECOMMENDATION ERROR"}</p>
                <h2>The cogitator lost its link.</h2>
                <p>{recommendationError} Your answers are still preserved in the URL.</p>
                <div className="ask-empty__actions">
                  <button type="button" className="lx-btn" onClick={() => navigateWithAnswers(answers)}>
                    Try again
                  </button>
                  <button type="button" className="ask-footlink" onClick={reset}>
                    Reset
                  </button>
                </div>
              </div>
            )}

            {showResult && !recommendationError && result && (
              <ResultCard
                result={result}
                questions={questions}
                answers={answers}
                onBack={goBack}
                onReset={reset}
              />
            )}

            {showResult && !recommendationError && !result && (
              <div className="ask-empty ask-card">
                <p className="card-eyebrow">{"NO RESULT PAYLOAD"}</p>
                <h2>No recommendation payload arrived.</h2>
                <p>Try resetting the funnel or widening your answers.</p>
                <div className="ask-empty__actions">
                  <button type="button" className="ask-footlink" onClick={goBack}>
                    Back
                  </button>
                  <button type="button" className="ask-footlink" onClick={reset}>
                    Reset
                  </button>
                </div>
              </div>
            )}

            {!showResult && !showProcessing && currentQuestion && (
              <QuestionCard
                key={currentQuestion.id}
                question={currentQuestion}
                index={activeIndex}
                value={selectedValue}
                disabled={isPending}
                onPick={chooseOption}
              />
            )}
            </div>

            <div className="ask-stage__nav">
              <button
                type="button"
                className="ask-footlink"
                onClick={goBack}
                disabled={!showResult && activeIndex === 0}
              >
                Back
              </button>
              <span className="ask-stage__nav-status">{statusLabel}</span>
              <button type="button" className="ask-footlink" onClick={reset}>
                Reset
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
