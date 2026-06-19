"use client";

import { type CSSProperties, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import AuspexSweep from "@/components/chrono/AuspexSweep";
import RouteScrollCue from "@/components/chrome/RouteScrollCue";
import ProcessingPanel from "./ProcessingPanel";
import QuestionCard from "./QuestionCard";
import ResultCard from "./ResultCard";
import {
  buildAskHref,
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

/* Short topic word per question — the timeline names each stop the way the
   chronicle era-band names its eras (a fixed label; the gold cursor carries
   progress). Keyed by the fixed question-id tuple, so it stays type-complete. */
const QUESTION_TOPIC: Record<AskQuestionId, string> = {
  experience: "Reader",
  faction_love: "Faction",
  tone: "Tone",
  length: "Length",
  era_pref: "Era",
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
  const draftComplete = isAskAnswersComplete(answers);
  const currentQuestion = questions[activeIndex] ?? questions[0];
  const selectedValue = currentQuestion ? answers[currentQuestion.id] : undefined;
  const showResult = draftComplete && initialIsComplete && !isPending && !editingCompleteProfile;
  const showProcessing = draftComplete && isPending;
  // The timeline carries progress now, so the nav status speaks only the two
  // terminal states (the old "N of 5 answers recorded" count is retired).
  const statusLabel = showResult
    ? "Recommendations tuned"
    : showProcessing
      ? "Loading recommendations"
      : "";
  // Gold fill reaches the live stop; full once the verdict is showing.
  const fillFraction = showResult
    ? 1
    : questions.length > 1
      ? activeIndex / (questions.length - 1)
      : 0;

  const selectedSummary = useMemo(
    () =>
      questions.map((question, index) => ({
        id: question.id,
        label: question.prompt,
        topic: QUESTION_TOPIC[question.id],
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
            {/* Progress timeline — the chronicle era-band recast for the funnel
                (maintainer rework 2026-06-19; the roman stepper is retired). One
                rail with a gold fill that advances with the reader, five marks.
                Each mark is a button that revisits its question and names its
                topic; the dot state carries answered / here / coming. */}
            <nav
              className="ask-timeline"
              aria-label="Ask progress"
              style={
                {
                  "--atl-n": questions.length,
                  "--atl-fill": fillFraction,
                } as CSSProperties
              }
            >
              <span className="ask-timeline__line" aria-hidden />
              <span className="ask-timeline__fill" aria-hidden />
              <ol className="ask-timeline__stops">
                {selectedSummary.map((item, index) => {
                  const sealed = Boolean(item.value);
                  const state = item.isCurrent ? "on" : sealed ? "done" : "";
                  return (
                    <li key={item.id} className={`ask-tl-stop ${state}`}>
                      <button
                        type="button"
                        className="ask-tl-stop__btn"
                        onClick={() => revisitQuestion(index)}
                        aria-current={item.isCurrent ? "step" : undefined}
                        title={item.label}
                      >
                        <span className="ask-tl-stop__mark" aria-hidden />
                        <span className="ask-tl-stop__label">{item.topic}</span>
                        <span className="ask-sr-only">
                          {item.label}
                          {item.value ? `: ${item.value}` : ""}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>

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
