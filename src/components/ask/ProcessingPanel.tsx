"use client";

type ProcessingPanelProps = {
  title: string;
  detail: string;
};

/* Cogitator interstitial — the loading anatomy Philipp named as the house
   positive reference (65-loading.css), framed by two Terminus lines. */
export default function ProcessingPanel({ title, detail }: ProcessingPanelProps) {
  return (
    <section className="ask-processing c-fade-in" role="status">
      <div className="lx-rule" aria-hidden />
      <div className="lx-cog">
        <div className="lx-cog__core" aria-hidden>
          <span className="lx-cog__ring" />
          <span className="lx-cog__seed" />
        </div>
        <p className="lx-cog__eyebrow">{"// BALLOT SEALED · COGITATOR WEIGHING"}</p>
        <p className="lx-cog__phrase">
          {title}
          <span className="lx-cog__dots">…</span>
        </p>
        <span className="lx-cog__scan" aria-hidden />
        <p className="ask-processing__detail">{detail}</p>
      </div>
      <div className="lx-rule" aria-hidden />
    </section>
  );
}
