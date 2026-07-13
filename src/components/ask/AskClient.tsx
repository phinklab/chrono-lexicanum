"use client";

import { type CSSProperties, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import AuspexPair from "@/components/chrono/AuspexPair";
import ProcessingPanel from "./ProcessingPanel";
import QuestionCard from "./QuestionCard";
import ResultCard from "./ResultCard";
import AskToolTabs from "./AskToolTabs";
// Component-scoped stylesheet (S7a): the questionnaire's card/ballot/result
// styles ride with this island into /ask.
import "@/app/styles/58-ask-booklist.css";
import {
  buildAskHref,
  buildAskSearchParams,
  firstUnansweredAskIndex,
  isAskAnswersComplete,
  withAskAnswer,
} from "@/lib/ask/params";
import type {
  AskAnswers,
  AskOptionId,
  AskQuestion,
  AskQuestionId,
  AskRecommendation,
  AskRecommendationResult,
} from "@/lib/ask/types";

type AskClientProps = {
  showLanding: boolean;
  questions: readonly AskQuestion[];
  initialAnswers: AskAnswers;
  initialIsComplete: boolean;
  result: AskRecommendationResult | null;
  deeper: AskRecommendation[] | null;
  deeperRequested: boolean;
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
};

function findOptionLabel(question: AskQuestion, answers: AskAnswers): string | null {
  const value = answers[question.id];
  return question.options.find((option) => option.id === value)?.label ?? null;
}

function initialQuestionIndex(answers: AskAnswers): number {
  return firstUnansweredAskIndex(answers);
}

export default function AskClient({
  showLanding,
  questions,
  initialAnswers,
  initialIsComplete,
  result,
  deeper,
  deeperRequested,
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
  // The timeline carries progress, so the nav status stays silent except
  // while the cogitator is actually working.
  const statusLabel = showProcessing ? "Loading recommendations" : "";
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

  // "Browse deeper" is a real navigation that adds `deeper=1` to the live
  // profile (it stays in the URL, like the answers). Keyed on answers only, so
  // toggling deeper does NOT remount the result card — the reveal staging
  // survives the round-trip; changing an answer does remount it (reset to Top-3).
  const resultKey = buildAskHref(answers);
  const deeperHref = useMemo(() => {
    const params = buildAskSearchParams(answers);
    params.set("deeper", "1");
    return `/ask?${params.toString()}`;
  }, [answers]);

  const navigateWithAnswers = (nextAnswers: AskAnswers) => {
    setOptimisticAnswers(nextAnswers);
    startTransition(() => {
      const href =
        Object.keys(nextAnswers).length === 0
          ? "/ask?mode=profile"
          : buildAskHref(nextAnswers);
      router.push(href, { scroll: false });
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
    // Resetting from the (tall) results view would let the browser clamp the
    // scroll up into the masthead — jarring. Only when results were showing do
    // we re-anchor to the funnel grid so question 01 lands in view; mid-funnel
    // resets keep their place (the navigation already preserves scroll).
    const wasShowingResult = showResult;
    setActiveIndex(0);
    setEditingCompleteProfile(false);
    navigateWithAnswers({});
    if (wasShowingResult) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      gridRef.current?.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "start",
      });
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
      <section
        className={`ask-console${showLanding ? " curator-landing" : " curator-tool"}`}
        aria-labelledby="ask-title"
      >
        {showLanding ? (
          <header className="curator-landing__mast">
            <AuspexPair />
            <p className="ask-console__eyebrow">Find Your Way In</p>
            <h1 id="ask-title" className="ask-console__title">
              The Curator
            </h1>
            <p className="ask-console__sub">
              Choose how the archive should guide you. Each path leads to one
              deliberate place to begin.
            </p>
            <AskToolTabs active={null} variant="landing" />
          </header>
        ) : (
          <>
            <header className="curator-toolhead">
              <p className="curator-toolhead__brand">The Curator</p>
              <AskToolTabs active="questionnaire" />
              <h1 id="ask-title" className="curator-toolhead__title">
                Four Questions
              </h1>
              <p className="curator-toolhead__sub">
                Tell the archive what kind of journey you want. It will weigh
                the shelves and return a ranked reading path.
              </p>
            </header>

            <div className="ask-console__grid" ref={gridRef}>
              <div className="ask-stage">
                {/* Progress timeline — the chronicle era-band recast for the funnel.
                    One rail with a gold fill that advances with the reader, four
                    marks. Each mark is a button that revisits its question and names
                    its topic; the dot state carries answered / here / coming. */}
                <nav
                  className="ask-timeline"
                  aria-label="Curator progress"
                  style={
                    {
                      "--atl-n": questions.length,
                      "--atl-fill": `${fillFraction * 100}%`,
                    } as CSSProperties
                  }
                >
                  <span className="ask-timeline__rail" aria-hidden>
                    <span className="ask-timeline__line" />
                    <span className="ask-timeline__fill" />
                  </span>
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
                      <p>
                        {recommendationError} Your answers are still preserved in the URL.
                      </p>
                      <div className="ask-empty__actions">
                        <button
                          type="button"
                          className="lx-btn"
                          onClick={() => navigateWithAnswers(answers)}
                        >
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
                      key={resultKey}
                      result={result}
                      deeper={deeper}
                      deeperRequested={deeperRequested}
                      deeperHref={deeperHref}
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
          </>
        )}
      </section>
    </>
  );
}
