"use client";

import { useEffect, useMemo, useState } from "react";
import PathSelect from "./PathSelect";
import QuestionCard from "./QuestionCard";
import ProcessingPanel from "./ProcessingPanel";
import ResultCard from "./ResultCard";
import ProgressDots from "./ProgressDots";
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

  return (
    <div
      style={{
        position: "relative",
        height: "calc(100vh - 48px)",
        overflow: "hidden",
      }}
    >
      <TitleStrip path={path} phase={phase} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 22,
          padding: "180px 32px 80px",
          zIndex: 3,
        }}
      >
        {phase === "path" && <PathSelect onChoose={choosePath} />}

        {phase === "question" && path && currentQ && !processing && (
          <QuestionCard
            q={currentQ}
            step={step}
            value={answers[currentQ.id]}
            onPick={pick}
            pathAccent={path.accent}
          />
        )}

        {phase === "question" && path && processing && <ProcessingPanel accent={path.accent} />}

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
            canAdvance={Boolean(currentQ && answers[currentQ.id]) && !processing}
            onBack={back}
            onForward={forward}
            accent={accent}
          />
        )}
      </div>
    </div>
  );
}

type TitleStripProps = {
  path: PathDef | null;
  phase: Phase;
};

function TitleStrip({ path, phase }: TitleStripProps) {
  const showPath = path && (phase === "question" || phase === "result");
  return (
    <header
      aria-hidden={false}
      style={{
        position: "absolute",
        top: 70,
        left: 0,
        right: 0,
        zIndex: 4,
        textAlign: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-plex-mono)",
          fontSize: 11,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          color: "var(--cl-cyan)",
          opacity: 0.78,
        }}
      >
        {"// ORACVLVM · COGITATOR-1011"}
      </div>
      <h1
        style={{
          margin: "6px 0 0",
          fontFamily: "var(--font-cinzel)",
          fontWeight: 400,
          fontSize: "clamp(36px, 4.4vw, 56px)",
          letterSpacing: "0.32em",
          color: "var(--cl-bone)",
          textShadow: "0 2px 14px rgba(0,0,0,0.9)",
        }}
      >
        ASK <span aria-hidden>◆</span> THE ARCHIVE
      </h1>
      {showPath && (
        <div
          style={{
            marginTop: 8,
            fontFamily: "var(--font-cormorant)",
            fontStyle: "italic",
            fontSize: 16,
            color: "var(--cl-dim)",
            letterSpacing: "0.08em",
          }}
        >
          ‹ {path!.latin} · {path!.label} ›
        </div>
      )}
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
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: "var(--font-plex-mono)",
        fontSize: 11,
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        padding: "10px 18px",
        background: emphasized ? "rgba(156,230,255,0.10)" : "transparent",
        color: disabled
          ? "var(--cl-faint)"
          : emphasized
            ? (accent ?? "var(--cl-cyan)")
            : "var(--cl-dim)",
        border: `1px solid ${
          disabled
            ? "rgba(232,220,192,0.18)"
            : emphasized
              ? (accent ?? "var(--cl-cyan)")
              : "rgba(232,220,192,0.32)"
        }`,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "color 0.2s, border-color 0.2s, background 0.2s",
      }}
    >
      {children}
    </button>
  );
}
