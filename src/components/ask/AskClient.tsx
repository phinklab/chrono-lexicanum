"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuspexSweep from "@/components/chrono/AuspexSweep";
import ProcessingPanel from "./ProcessingPanel";
import ProgressDots from "./ProgressDots";
import QuestionCard from "./QuestionCard";
import ResultCard from "./ResultCard";
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
          <AuspexSweep r={180} sweepDuration={18} accent="var(--cl-cyan)" />
        </div>
      </div>

      <section className="ask-console" aria-labelledby="ask-title">
        <header className="ask-console__mast">
          <p className="card-eyebrow">{"// ORACVLVM · ASK THE ARCHIVE"}</p>
          <h1 id="ask-title" className="ask-console__title">
            Oracle
          </h1>
          <p className="ask-console__sub">
            Five questions, then ranked entry points drawn from the living
            archive.
          </p>
        </header>

        <div className="ask-console__grid" ref={gridRef}>
          <aside className="ask-status ask-card" aria-label="Ask progress">
            <div className="ask-status__head">
              <span>{statusLabel}</span>
              <span aria-hidden>{String(answeredCount).padStart(2, "0")}</span>
            </div>
            <ProgressDots
              current={showResult ? questions.length : activeIndex + 1}
              total={questions.length}
              answered={answeredCount}
              pending={isPending}
            />
            <ol className="ask-answer-list">
              {selectedSummary.map((item, index) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="ask-answer-step"
                    data-current={item.isCurrent}
                    data-complete={Boolean(item.value)}
                    onClick={() => revisitQuestion(index)}
                    aria-current={item.isCurrent ? "step" : undefined}
                  >
                    <span className="ask-answer-step__index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="ask-answer-step__text">
                      <span>{item.label}</span>
                      <span>{item.value ?? "Awaiting answer"}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="ask-status__actions">
              <button type="button" className="ask-pill" onClick={reset}>
                Reset
              </button>
              <Link href="/werke" className="ask-pill">
                Complete archive
              </Link>
            </div>
          </aside>

          <div className="ask-stage" aria-live="polite">
            {showProcessing && (
              <ProcessingPanel
                title="Consulting the archive"
                detail="The answers are sealed in the URL; the ranking runs server-side."
              />
            )}

            {showResult && recommendationError && (
              <div className="ask-empty ask-card" role="alert">
                <p className="card-eyebrow">{"// RECOMMENDATION ERROR"}</p>
                <h2>The cogitator lost its link.</h2>
                <p>{recommendationError} Your answers are still preserved in the URL.</p>
                <div className="ask-empty__actions">
                  <button type="button" className="ask-cta" onClick={() => navigateWithAnswers(answers)}>
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
                <p className="card-eyebrow">{"// NO RESULT PAYLOAD"}</p>
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
                total={questions.length}
                value={selectedValue}
                disabled={isPending}
                onPick={chooseOption}
              />
            )}

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
