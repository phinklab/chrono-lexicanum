"use client";

import { useEffect, useMemo, useState } from "react";
import PathSelect from "./PathSelect";
import QuestionCard from "./QuestionCard";
import ProcessingPanel from "./ProcessingPanel";
import ResultCard from "./ResultCard";
import ProgressDots from "./ProgressDots";
import AuspexSweep from "@/components/chrono/AuspexSweep";
import FloatingCoord from "@/components/chrono/FloatingCoord";
import { PATHS, type PathDef } from "@/lib/askPaths";

type Phase = "path" | "question" | "result";

const PROCESSING_MS = 700;

export default function AskClient() {
  const [phase, setPhase] = useState<Phase>("path");
  const [pathId, setPathId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);

  const path = useMemo<PathDef | null>(
    () => (pathId ? (PATHS.find((p) => p.id === pathId) ?? null) : null),
    [pathId],
  );
  const totalQuestions = path?.questions.length ?? 0;
  const currentQ = path && phase === "question" ? path.questions[step] : null;

  useEffect(() => {
    if (!processing || !path) return;
    const t = setTimeout(() => {
      if (step + 1 >= totalQuestions) {
        setPhase("result");
      } else {
        setStep((s) => s + 1);
      }
      setProcessing(false);
    }, PROCESSING_MS);
    return () => clearTimeout(t);
  }, [processing, path, step, totalQuestions]);

  const choosePath = (p: PathDef) => {
    setPathId(p.id);
    setStep(0);
    setAnswers({});
    setProcessing(false);
    setPhase("question");
  };

  const pick = (v: string) => {
    if (!currentQ || processing) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: v }));
    setProcessing(true);
  };

  const back = () => {
    if (phase !== "question") return;
    if (step === 0) {
      setPhase("path");
      setProcessing(false);
      return;
    }
    setStep((s) => s - 1);
    setProcessing(false);
  };

  const forward = () => {
    if (!currentQ || !path) return;
    if (!answers[currentQ.id]) return;
    if (processing) return;
    setProcessing(true);
  };

  const resetSamePath = () => {
    setStep(0);
    setAnswers({});
    setProcessing(false);
    setPhase("question");
  };

  const changePath = () => {
    setPathId(null);
    setStep(0);
    setAnswers({});
    setProcessing(false);
    setPhase("path");
  };

  const accent = path?.accent ?? "var(--cl-cyan)";
  const landing = phase === "path";

  // HUD + title are persistent across every phase: only their transform /
  // opacity change, so the title glides up (and the auspex HUD fades out) when
  // a path is chosen, and both ease back in on the way home. The phase-specific
  // body (path modules vs. question/result stage) is the only thing that swaps.
  return (
    <>
      <AskHud landing={landing} />
      <AskTitlebar landing={landing} path={path} phase={phase} />

      {landing ? (
        <div className="ask-funnel">
          <div className="ask-hero" aria-hidden />
          <section className="ask-modules">
            <PathSelect onChoose={choosePath} />
          </section>
        </div>
      ) : (
        <div className="ask-runtime">
          <div className="ask-runtime__center">
            {phase === "question" && path && currentQ && !processing && (
              <QuestionCard
                q={currentQ}
                step={step}
                value={answers[currentQ.id]}
                onPick={pick}
                pathAccent={path.accent}
              />
            )}

            {phase === "question" && path && processing && (
              <ProcessingPanel accent={path.accent} />
            )}

            {phase === "result" && path && (
              <ResultCard
                path={path}
                answers={answers}
                onReset={resetSamePath}
                onChangePath={changePath}
              />
            )}

            {phase === "question" && path && (
              <BottomNav
                step={step}
                total={totalQuestions}
                canAdvance={
                  Boolean(currentQ && answers[currentQ.id]) && !processing
                }
                onBack={back}
                onForward={forward}
                accent={accent}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ── persistent HUD layer ──────────────────────────────────────────────────
 * The auspex sweep + ambient floating coordinates. Full-bleed, pointer-none.
 * opacity is driven entirely by `data-landing` (CSS), so it cross-fades when
 * leaving / re-entering the path overview. Kept mounted in every phase so the
 * fade has something to animate in both directions. */
function AskHud({ landing }: { landing: boolean }) {
  return (
    <div className="ask-hud" data-landing={landing} aria-hidden>
      <div className="ask-hud__sweep">
        <AuspexSweep r={180} sweepDuration={16} accent="var(--cl-cyan)" />
      </div>
      <FloatingCoord x="40%" y="118px" label="QVERENT · UNREAD" delay={1.2} lifetime={5} color="var(--cl-cyan)" opacity={0.5} />
      <FloatingCoord x="60%" y="208px" label="ORACVLVM · LISTENING" delay={3.0} lifetime={5} color="var(--cl-cyan)" opacity={0.45} />
      <FloatingCoord x="29%" y="276px" label="VECTOR · UNSET · M42" delay={4.4} lifetime={5} color="var(--cl-cyan)" opacity={0.3} />
    </div>
  );
}

/* ── persistent title ──────────────────────────────────────────────────────
 * One <h1> for the whole funnel. It rests at the compact header position and is
 * pushed down into the hero band (`data-landing`) via a transform, so choosing
 * a path glides it up and "back" glides it down. The third line cross-fades
 * between the overview tagline and the chosen path's name. */
type AskTitlebarProps = {
  landing: boolean;
  path: PathDef | null;
  phase: Phase;
};

function AskTitlebar({ landing, path, phase }: AskTitlebarProps) {
  const showPath = path && (phase === "question" || phase === "result");
  return (
    <header className="ask-titlebar" data-landing={landing}>
      <div className="card-eyebrow ask-titlebar__eyebrow">
        {"// ORACVLVM · COGITATOR-1011"}
      </div>
      <h1 className="ask-titlebar__heading">
        ASK{" "}
        <span className="ask-titlebar__diamond" aria-hidden>
          ◆
        </span>{" "}
        THE ARCHIVE
      </h1>
      <div
        key={showPath ? path!.id : "overview"}
        className="ask-titlebar__line c-fade-in"
      >
        {showPath
          ? `‹ ${path!.latin} · ${path!.label} ›`
          : "There are many ways into the galaxy."}
      </div>
    </header>
  );
}

type BottomNavProps = {
  step: number;
  total: number;
  canAdvance: boolean;
  onBack: () => void;
  onForward: () => void;
  accent: string;
};

function BottomNav({ step, total, canAdvance, onBack, onForward, accent }: BottomNavProps) {
  return (
    <div
      style={{
        width: "min(720px, 96vw)",
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        pointerEvents: "none",
      }}
    >
      <div style={{ justifySelf: "start", pointerEvents: "auto" }}>
        <NavButton onClick={onBack} disabled={false}>
          ← Back
        </NavButton>
      </div>

      <div style={{ pointerEvents: "auto" }}>
        <ProgressDots step={step} total={total} />
      </div>

      <div style={{ justifySelf: "end", pointerEvents: "auto" }}>
        <NavButton
          onClick={onForward}
          disabled={!canAdvance}
          accent={accent}
          emphasized={canAdvance}
        >
          Next →
        </NavButton>
      </div>
    </div>
  );
}

function NavButton({
  children,
  onClick,
  disabled,
  emphasized,
  accent,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  emphasized?: boolean;
  accent?: string;
}) {
  const [hover, setHover] = useState(false);
  const color = disabled
    ? "var(--cl-faint)"
    : emphasized
      ? (accent ?? "var(--cl-cyan)")
      : "var(--cl-dim)";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        fontFamily: "var(--font-plex-mono)",
        fontSize: 11,
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        padding: "10px 6px",
        background: "transparent",
        color,
        border: "none",
        textDecoration: !disabled && hover ? "underline" : "none",
        textUnderlineOffset: 4,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "color 0.2s",
      }}
    >
      {children}
    </button>
  );
}
