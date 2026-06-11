"use client";

import Link from "next/link";
import { FORMAT_LABELS } from "@/lib/book-labels";
import { partitionByLengthIntent } from "@/lib/ask/length-match";
import { roman } from "@/lib/roman";
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

  return parts.join(" · ");
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

/* Rank I — the dossier (Report 141, idea C3-3): large roman ordinal, kicker,
   Cinzel title, prose note, reason chips, one framed exit. */
function PrimeRecommendation({ recommendation }: { recommendation: AskRecommendation }) {
  const meta = formatMeta(recommendation);
  const copy = excerpt(recommendation.synopsis);
  const reasons = bestReasons(recommendation);

  return (
    <article className="ask-prime">
      <div className="ask-prime__rank" aria-hidden>
        <span className="n">I</span>
        <span className="cap">RANK</span>
      </div>
      <div className="ask-prime__body">
        <p className="ask-prime__kicker">
          {meta && <span>{meta}</span>}
          <span className="ask-prime__tier">◆ Top match</span>
        </p>
        <h3 className="ask-prime__title">{recommendation.title}</h3>
        {copy && <p className="lx-prose ask-prime__note">{copy}</p>}
        {reasons.length > 0 && (
          <ul
            className="ask-prime__chips"
            aria-label={`Why ${recommendation.title} matched`}
          >
            {reasons.map((reason) => (
              <li key={reason.tag} className="lx-tag lx-tag--sm">
                {reasonText(reason)}
              </li>
            ))}
          </ul>
        )}
        <Link href={`/buch/${recommendation.slug}`} className="lx-btn">
          Open record
        </Link>
      </div>
    </article>
  );
}

/* Ranks II+ — runner cards in the frameless wash treatment. */
function RunnerRecommendation({
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
    <Link href={`/buch/${recommendation.slug}`} className="lx-card ask-runner">
      <span className="lx-card__folio">RANK {roman(index + 1)}</span>
      {meta && <span className="lx-card__eyebrow">{meta}</span>}
      <h3 className="lx-card__title">{recommendation.title}</h3>
      {copy && <p className="lx-card__snip">{copy}</p>}
      {reasons.length > 0 && (
        <span className="lx-card__meta">
          {reasons.map(reasonText).join(" · ")}
        </span>
      )}
    </Link>
  );
}

function ResultList({
  items,
  offset = 0,
  label,
}: {
  items: readonly AskRecommendation[];
  offset?: number;
  label?: string;
}) {
  return (
    <ol className="ask-verdict-list" aria-label={label}>
      {items.map((recommendation, index) => {
        const overall = offset + index;
        return (
          <li
            key={recommendation.id}
            className={overall === 0 ? "ask-verdict-list__prime" : undefined}
          >
            {overall === 0 ? (
              <PrimeRecommendation recommendation={recommendation} />
            ) : (
              <RunnerRecommendation recommendation={recommendation} index={overall} />
            )}
          </li>
        );
      })}
    </ol>
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
  const { graded, exact, further } = partitionByLengthIntent(recommendations, answers);
  const noExactLength = graded && exact.length === 0;
  const splitLength = graded && exact.length > 0 && further.length > 0;
  const lengthQuestion = questions.find((question) => question.id === "length");
  const lengthLabel = lengthQuestion ? answerLabel(lengthQuestion, answers) : null;

  return (
    <section className="ask-results c-fade-in" aria-labelledby="ask-results-title">
      <div className="ask-results__head">
        <h2 id="ask-results-title" className="ask-results__title">
          Verdictvm · The archive recommends
        </h2>
        <span className="ask-results__count">
          {String(recommendations.length).padStart(2, "0")} hits
        </span>
      </div>

      {recommendations.length === 0 ? (
        <div className="ask-results__empty">
          <h3>No books matched strongly enough.</h3>
          <p>Try stepping back and choosing a broader faction, era, or commitment level.</p>
        </div>
      ) : noExactLength ? (
        <>
          <p className="ask-results__note" role="note">
            <span className="ask-results__note-key" aria-hidden>
              {"// NO EXACT MATCH"}
            </span>
            <span>
              None of your top picks are{" "}
              {lengthLabel ? <em>{lengthLabel.toLowerCase()}</em> : "that commitment"}. These are
              the closest, ranked on the rest of your answers.
            </span>
          </p>
          <ResultList items={further} />
        </>
      ) : splitLength ? (
        <>
          <ResultList items={exact} />
          <p className="ask-results__divider">
            <span className="ask-results__divider-label">Further recommendations</span>
            <span className="ask-results__divider-note">
              Strong picks that aren&rsquo;t{" "}
              {lengthLabel ? <em>{lengthLabel.toLowerCase()}</em> : "that length"}.
            </span>
          </p>
          <ResultList items={further} offset={exact.length} label="Further recommendations" />
        </>
      ) : (
        <ResultList items={exact} />
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
        <Link href="/archive" className="lx-tag">
          Complete archive
        </Link>
      </div>
    </section>
  );
}
