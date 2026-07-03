"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import BtnFx from "@/components/shared/BtnFx";
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
  /** Live ranks beyond the Top-6 cell, present only after "Browse deeper". */
  deeper: AskRecommendation[] | null;
  deeperRequested: boolean;
  /** URL that re-renders this profile with the deeper ranks attached. */
  deeperHref: string;
  questions: readonly AskQuestion[];
  answers: AskAnswers;
  onBack: () => void;
  onReset: () => void;
};

/* The verdict reveals in stages (Brief 164 Phase 3): the Top-3 render server-
   side (no JS needed for the first look), "Load more" reveals the rest of the
   Top-6 cell client-side, and only then does "Browse deeper" go live. */
const STAGE_INITIAL = 3;
const STAGE_STEP = 3;

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

/* Rank I — the dossier: mono kicker, the title in the display voice, the
   synopsis lead, the why-line, one Sternwarte exit. */
function PrimeRecommendation({ recommendation }: { recommendation: AskRecommendation }) {
  const meta = formatMeta(recommendation);
  const copy = excerpt(recommendation.synopsis);
  const reasons = bestReasons(recommendation);

  return (
    <article className="ask-prime">
      <p className="ask-prime__kicker">Rank I · top match</p>
      <h3 className="ask-prime__title">{recommendation.title}</h3>
      {meta && <p className="ask-prime__by">{meta}</p>}
      {copy && <p className="ask-prime__note">{copy}</p>}
      {reasons.length > 0 && (
        <p className="ask-prime__why" aria-label={`Why ${recommendation.title} matched`}>
          {reasons.map((reason, i) => (
            <span key={reason.tag}>
              {i > 0 && <span className="ask-prime__why-sep"> · </span>}
              {reasonText(reason)}
            </span>
          ))}
        </p>
      )}
      <p className="ask-prime__act">
        <Link href={`/buch/${recommendation.slug}`} className="lx-btn lx-btn--primary">
          Open the record
          <span className="lx-btn__mark" aria-hidden>
            →
          </span>
          <BtnFx />
        </Link>
      </p>
    </article>
  );
}

/* Ranks II+ — quiet register rows; the record popup carries the depth. */
function RunnerRecommendation({
  recommendation,
  index,
}: {
  recommendation: AskRecommendation;
  index: number;
}) {
  const meta = formatMeta(recommendation);

  return (
    <Link href={`/buch/${recommendation.slug}`} className="ask-runner">
      <span className="ask-runner__rank">Rank {roman(index + 1)}</span>
      <span className="ask-runner__main">
        <span className="ask-runner__title">{recommendation.title}</span>
        {meta && <span className="ask-runner__meta">{meta}</span>}
      </span>
      <span className="ask-runner__mark" aria-hidden>
        ›
      </span>
    </Link>
  );
}

function RecommendationRow({
  recommendation,
  index,
  staged,
}: {
  recommendation: AskRecommendation;
  index: number;
  staged: boolean;
}) {
  // Items past the initial Top-3 only ever appear after a reveal action, so they
  // fade in on arrival; `.c-fade-in` is itself gated behind
  // prefers-reduced-motion (40-primitives.css), so this is motion-safe.
  const className = [
    index === 0 ? "ask-verdict-list__prime" : null,
    staged ? "c-fade-in" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li className={className || undefined}>
      {index === 0 ? (
        <PrimeRecommendation recommendation={recommendation} />
      ) : (
        <RunnerRecommendation recommendation={recommendation} index={index} />
      )}
    </li>
  );
}

export default function ResultCard({
  result,
  deeper,
  deeperRequested,
  deeperHref,
  questions,
  answers,
  onBack,
  onReset,
}: ResultCardProps) {
  const cell = result.recommendations;
  const { graded, exact, further } = partitionByLengthIntent(cell, answers);
  const noExactLength = graded && exact.length === 0;
  // One ordered list so the staging composes; the length divider is an
  // interstitial row, not a second <ol>. When not graded, `exact` already holds
  // every pick.
  const ordered = graded ? [...exact, ...further] : [...exact];
  const dividerIndex =
    graded && exact.length > 0 && further.length > 0 ? exact.length : -1;

  const lengthQuestion = questions.find((question) => question.id === "length");
  const lengthLabel = lengthQuestion ? answerLabel(lengthQuestion, answers) : null;

  // When the reader lands straight on a deeper URL, skip the staging and show
  // the whole cell — otherwise the deeper ranks would graft on above hidden
  // Top-6 rows.
  const [revealed, setRevealed] = useState(() =>
    deeperRequested ? ordered.length : Math.min(STAGE_INITIAL, ordered.length),
  );

  const visibleCount = Math.min(revealed, ordered.length);
  const canRevealMore = revealed < ordered.length;
  const deeperItems = deeperRequested && deeper ? deeper : [];
  const showBrowseDeeper = !canRevealMore && !deeperRequested && cell.length > 0;
  const totalShown = visibleCount + deeperItems.length;

  return (
    <section className="ask-results c-fade-in" aria-labelledby="ask-results-title">
      <h2 id="ask-results-title" className="lx-sect ask-results__title">
        The Archive Recommends
      </h2>
      <p className="ask-results__count">
        <b>{totalShown} hits</b> · ranked
      </p>

      {cell.length === 0 ? (
        <div className="ask-results__empty">
          <h3>No books matched strongly enough.</h3>
          <p>Try stepping back and choosing a broader faction, tone, or commitment level.</p>
        </div>
      ) : (
        <>
          {noExactLength && (
            <p className="ask-results__note" role="note">
              <span className="ask-results__note-key" aria-hidden>
                {"NO EXACT MATCH"}
              </span>
              <span>
                None of your top picks are{" "}
                {lengthLabel ? <em>{lengthLabel.toLowerCase()}</em> : "that commitment"}. These are
                the closest, ranked on the rest of your answers.
              </span>
            </p>
          )}

          <ol className="ask-verdict-list" aria-label="Recommendations">
            {ordered.slice(0, visibleCount).map((recommendation, index) => (
              <Fragment key={recommendation.id}>
                {index === dividerIndex && (
                  <li className="ask-verdict-list__divider" aria-hidden>
                    <p className="ask-results__divider">
                      <span className="ask-results__divider-label">Further recommendations</span>
                      <span className="ask-results__divider-note">
                        Strong picks that aren&rsquo;t{" "}
                        {lengthLabel ? <em>{lengthLabel.toLowerCase()}</em> : "that length"}.
                      </span>
                    </p>
                  </li>
                )}
                <RecommendationRow
                  recommendation={recommendation}
                  index={index}
                  staged={index >= STAGE_INITIAL}
                />
              </Fragment>
            ))}

            {deeperItems.length > 0 && (
              <li className="ask-verdict-list__divider" aria-hidden>
                <p className="ask-results__divider">
                  <span className="ask-results__divider-label">Deeper in the archive</span>
                  <span className="ask-results__divider-note">
                    Ranked below the top six on the same answers.
                  </span>
                </p>
              </li>
            )}
            {deeperItems.map((recommendation, i) => (
              <RecommendationRow
                key={recommendation.id}
                recommendation={recommendation}
                index={ordered.length + i}
                staged
              />
            ))}
          </ol>

          <div className="ask-verdict__more">
            {canRevealMore && (
              <button
                type="button"
                className="lx-btn ask-verdict__more-btn"
                onClick={() =>
                  setRevealed((n) => Math.min(ordered.length, n + STAGE_STEP))
                }
              >
                Load more
                <span className="lx-btn__mark" aria-hidden>
                  +{Math.min(STAGE_STEP, ordered.length - revealed)}
                </span>
                <BtnFx />
              </button>
            )}
            {showBrowseDeeper && (
              <Link href={deeperHref} scroll={false} className="ask-verdict__deeper">
                Browse deeper →
              </Link>
            )}
            {deeperRequested && (
              <p className="ask-verdict__deeper-note" role="note">
                {deeperItems.length > 0
                  ? `Showing ${deeperItems.length} more beyond the top six.`
                  : "No further matches beyond the top six."}
              </p>
            )}
          </div>
        </>
      )}

      <p className="ask-responsa" aria-label="Selected answers">
        Your answers —{" "}
        <b>{questions.map((question) => answerLabel(question, answers)).join(" · ")}</b>
      </p>

      <div className="ask-footer">
        <button type="button" className="ask-footlink" onClick={onBack}>
          Back to answers
        </button>
        <button type="button" className="ask-footlink" onClick={onReset}>
          Reset
        </button>
        <Link href="/archive" className="ask-footlink">
          The complete archive →
        </Link>
      </div>
    </section>
  );
}
