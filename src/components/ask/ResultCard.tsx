"use client";

import Link from "next/link";
import { FORMAT_LABELS } from "@/lib/book-labels";
import type {
  AskAnswers,
  AskQuestion,
  AskRecommendation,
  AskRecommendationReason,
  AskRecommendationResult,
} from "@/lib/ask/types";

type ResultCardProps = {
  result: AskRecommendationResult;
  questions: readonly AskQuestion[];
  answers: AskAnswers;
  onBack: () => void;
  onReset: () => void;
};

function answerLabel(question: AskQuestion, answers: AskAnswers): string {
  const value = answers[question.id];
  return question.options.find((option) => option.id === value)?.label ?? "Unset";
}

function formatMeta(recommendation: AskRecommendation): string {
  const parts = [
    recommendation.authors.length > 0 ? recommendation.authors.join(", ") : null,
    recommendation.releaseYear != null ? String(recommendation.releaseYear) : null,
    recommendation.format ? FORMAT_LABELS[recommendation.format] ?? recommendation.format : null,
    recommendation.primaryEraId?.replaceAll("_", " ") ?? null,
  ].filter((part): part is string => Boolean(part));

  return parts.join(" / ");
}

function excerpt(text: string | null | undefined): string | null {
  if (!text) return null;
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= 220) return compact;
  return `${compact.slice(0, 217).trim()}...`;
}

function bestReasons(recommendation: AskRecommendation): AskRecommendationReason[] {
  return recommendation.reasons
    .filter((reason) => reason.matched)
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);
}

function reasonText(reason: AskRecommendationReason): string {
  if (!reason.detail) return reason.label;
  return `${reason.label}: ${reason.detail}`;
}

function RecommendationRow({
  recommendation,
  index,
}: {
  recommendation: AskRecommendation;
  index: number;
}) {
  const meta = formatMeta(recommendation);
  const copy = excerpt(recommendation.synopsis);
  const reasons = bestReasons(recommendation);

  return (
    <article className="ask-result">
      <Link href={`/buch/${recommendation.slug}`} className="ask-result__main">
        <span className="ask-result__rank" aria-hidden>
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="ask-result__content">
          <span className="ask-result__title">{recommendation.title}</span>
          {meta && <span className="ask-result__meta">{meta}</span>}
        </span>
        <span className="ask-result__action" aria-hidden>
          Detail
        </span>
      </Link>
      {copy && <p className="ask-result__synopsis">{copy}</p>}
      {reasons.length > 0 && (
        <ul className="ask-reasons" aria-label={`Why ${recommendation.title} matched`}>
          {reasons.map((reason) => (
            <li key={reason.tag}>{reasonText(reason)}</li>
          ))}
        </ul>
      )}
    </article>
  );
}

export default function ResultCard({
  result,
  questions,
  answers,
  onBack,
  onReset,
}: ResultCardProps) {
  const recommendations = result.recommendations;

  return (
    <section className="ask-results ask-card c-corners c-fade-in" aria-labelledby="ask-results-title">
      <div className="ask-results__head">
        <div>
          <p className="card-eyebrow">{"// RESPONSVM / TOP FIVE"}</p>
          <h2 id="ask-results-title">The archive recommends</h2>
        </div>
        <span className="ask-results__count">
          {String(recommendations.length).padStart(2, "0")} hits
        </span>
      </div>

      {recommendations.length === 0 ? (
        <div className="ask-results__empty">
          <h3>No books matched strongly enough.</h3>
          <p>Try stepping back and choosing a broader faction, era, or commitment level.</p>
        </div>
      ) : (
        <ol className="ask-results__list">
          {recommendations.map((recommendation, index) => (
            <li key={recommendation.id}>
              <RecommendationRow recommendation={recommendation} index={index} />
            </li>
          ))}
        </ol>
      )}

      <div className="ask-responsa" aria-label="Selected answers">
        {questions.map((question) => (
          <span key={question.id}>
            <span className="k">{question.id}</span>{" "}
            <span className="v">{answerLabel(question, answers)}</span>
          </span>
        ))}
      </div>

      <div className="ask-footer">
        <button type="button" className="ask-footlink" onClick={onBack}>
          Back to answers
        </button>
        <button type="button" className="ask-footlink" onClick={onReset}>
          Reset
        </button>
        <span className="ask-footer__spacer" aria-hidden />
        <Link href="/werke" className="ask-cta">
          Browse all works
        </Link>
      </div>
    </section>
  );
}
