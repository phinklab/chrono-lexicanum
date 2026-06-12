"use client";

type ProcessingPanelProps = {
  title: string;
  detail: string;
};

/* Cogitator interstitial — the loading anatomy Philipp named as the house
   positive reference (65-loading.css), framed by two Terminus lines. */
export default function ProcessingPanel({ title, detail }: ProcessingPanelProps) {
  return (
    // aria-busy tells AT the region's content is still settling (Report 141
    // § B5); role="status" alone only announces, it doesn't flag in-progress.
    <section className="ask-processing c-fade-in" role="status" aria-busy="true">
      <div className="lx-rule" aria-hidden />
      <div className="lx-cog">
        <div className="lx-cog__core" aria-hidden>
          <span className="lx-cog__ring" />
          <span className="lx-cog__seed" />
        </div>
        <p className="lx-cog__eyebrow">{"BALLOT SEALED · COGITATOR WEIGHING"}</p>
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
