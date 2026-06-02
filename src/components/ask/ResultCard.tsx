"use client";

import Link from "next/link";
import { type CSSProperties, Fragment } from "react";
import { CHRONO_SAMPLE_BOOKS, type PathDef } from "@/lib/askPaths";

type ResultCardProps = {
  path: PathDef;
  answers: Record<string, string>;
  onReset: () => void;
  onChangePath: () => void;
};

export default function ResultCard({ path, answers, onReset, onChangePath }: ResultCardProps) {
  // Chosen answers, in question order: latin key + the picked option's label.
  const responsa = path.questions.map((q) => {
    const v = answers[q.id];
    const opt = q.options.find((o) => o.v === v);
    return { id: q.id, latin: q.latin, label: opt?.label ?? "—" };
  });

  return (
    <div
      className="ask-card c-fade-in"
      style={
        {
          // Per-path accent threads through eyebrow / years / action / footnote.
          "--row-accent": path.accent,
          width: "min(760px, 94vw)",
          padding: "26px 30px 24px",
          margin: "0 auto",
        } as CSSProperties
      }
    >
      <p className="card-eyebrow">
        {`// COGITATOR · RESPONSVM · ${path.latin}`}
        <span className="tail">{` · ${CHRONO_SAMPLE_BOOKS.length} Novellae`}</span>
      </p>

      <h2
        style={{
          margin: "14px 0 6px",
          fontFamily: "var(--font-cinzel)",
          fontWeight: 400,
          fontSize: 26,
          letterSpacing: "0.10em",
          color: "var(--cl-bone)",
        }}
      >
        The Cogitator has tuned your signal.
      </h2>
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-cormorant)",
          fontStyle: "italic",
          fontSize: 18,
          lineHeight: 1.45,
          color: "var(--cl-dim)",
        }}
      >
        {path.label} — five books, chosen from your answers.
      </p>

      <span className="c-hairline" aria-hidden style={{ margin: "18px 0 4px" }} />

      <ol className="book-list">
        {CHRONO_SAMPLE_BOOKS.map((b, i) => (
          <li key={b.slug}>
            <Link
              href={`/buch/${b.slug}`}
              className="book-row"
              aria-label={`${b.title} by ${b.author}, ${b.year}`}
            >
              <span className="book-row__index" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="book-row__title">{b.title}</span>
              <span className="book-row__year">{b.year}</span>
              <span className="book-row__author">{b.author}</span>
              <span className="book-row__action" aria-hidden>
                Detail →
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <p className="ask-responsa" style={{ margin: "18px 0 0" }}>
        {"// RESPONSA "}
        {responsa.map((r, i) => (
          <Fragment key={r.id}>
            <span className="sep" aria-hidden>
              ·
            </span>
            <span className="k">{r.latin}</span> <span className="v">{r.label}</span>
          </Fragment>
        ))}
      </p>

      <span className="c-hairline" aria-hidden style={{ margin: "16px 0 14px" }} />

      <div className="ask-footer">
        <button type="button" className="ask-footlink" onClick={onChangePath}>
          ← Choose another path
        </button>
        <button type="button" className="ask-footlink" onClick={onReset}>
          Start over
        </button>
        <span className="ask-footer__spacer" aria-hidden />
        <Link href="/werke" className="ask-cta">
          All books →
        </Link>
      </div>
    </div>
  );
}
