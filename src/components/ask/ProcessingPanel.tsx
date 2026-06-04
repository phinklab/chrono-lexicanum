"use client";

import ProcessingDots from "@/components/chrono/ProcessingDots";

type ProcessingPanelProps = {
  title: string;
  detail: string;
};

export default function ProcessingPanel({ title, detail }: ProcessingPanelProps) {
  return (
    <section className="ask-processing ask-card c-corners c-fade-in" role="status">
      <p className="card-eyebrow">{"// COGITATOR / RANKING"}</p>
      <h2>{title}</h2>
      <p>{detail}</p>
      <div className="ask-processing__dots">
        <ProcessingDots label="Loading recommendations" color="var(--cl-cyan)" />
      </div>
    </section>
  );
}
