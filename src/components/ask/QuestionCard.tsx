"use client";

import { useState, type CSSProperties } from "react";
import Typewriter from "@/components/chrono/Typewriter";
import type { AccentToken, Question } from "@/lib/askPaths";

type QuestionCardProps = {
  q: Question;
  step: number;
  value: string | undefined;
  onPick: (v: string) => void;
  pathAccent: AccentToken;
};

export default function QuestionCard({ q, step, value, onPick, pathAccent }: QuestionCardProps) {
  const [headDone, setHeadDone] = useState(false);
  const [subDone, setSubDone] = useState(false);

  // Each new question is keyed by q.id from the parent → component re-mounts
  // → useState resets to false → typewriters re-trigger in sequence.

  return (
    <div
      key={q.id}
      className="c-glass c-corners c-fade-in"
      style={{
        width: "min(720px, 96vw)",
        padding: "28px 32px 30px",
        margin: "0 auto",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 18,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-plex-mono)",
            fontSize: 11,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: pathAccent,
          }}
        >
          {String(step + 1).padStart(2, "0")} ·{" "}
          <Typewriter text={q.latin} speed={70} cursor={false} />
        </span>
        <span className="c-hairline" style={{ flex: 1 }} aria-hidden />
        <span
          style={{
            fontFamily: "var(--font-plex-mono)",
            fontSize: 9.5,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "var(--cl-faint)",
          }}
        >
          Q · {q.id.toUpperCase()}
        </span>
      </header>

      <h2
        style={{
          margin: 0,
          fontFamily: "var(--font-cinzel)",
          fontWeight: 400,
          fontSize: 34,
          letterSpacing: "0.06em",
          color: "var(--cl-bone)",
          minHeight: "1.4em",
        }}
      >
        <Typewriter
          text={q.label}
          speed={32}
          startDelay={250}
          onDone={() => setHeadDone(true)}
        />
      </h2>

      <p
        style={{
          margin: "10px 0 22px",
          fontFamily: "var(--font-cormorant)",
          fontStyle: "italic",
          fontSize: 19,
          lineHeight: 1.45,
          color: "var(--cl-dim)",
          minHeight: "1.5em",
        }}
      >
        {headDone && (
          <Typewriter
            text={q.sub}
            speed={18}
            startDelay={120}
            onDone={() => setSubDone(true)}
          />
        )}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 10,
          opacity: subDone ? 1 : 0,
          transition: "opacity 0.4s ease",
        }}
      >
        {q.options.map((opt, i) => {
          const selected = value === opt.v;
          return (
            <OptionTile
              key={opt.v}
              label={opt.label}
              desc={opt.desc}
              selected={selected}
              accent={pathAccent}
              delayMs={subDone ? i * 70 : 0}
              animate={subDone}
              onClick={() => onPick(opt.v)}
            />
          );
        })}
      </div>
    </div>
  );
}

type OptionTileProps = {
  label: string;
  desc: string;
  selected: boolean;
  accent: AccentToken;
  delayMs: number;
  animate: boolean;
  onClick: () => void;
};

function OptionTile({ label, desc, selected, accent, delayMs, animate, onClick }: OptionTileProps) {
  const [hover, setHover] = useState(false);

  const border = selected
    ? accent
    : hover
      ? "rgba(156, 230, 255, 0.45)"
      : "rgba(156, 230, 255, 0.18)";

  const tileStyle: CSSProperties = {
    position: "relative",
    padding: "14px 16px",
    background: selected
      ? "rgba(156, 230, 255, 0.10)"
      : hover
        ? "rgba(8, 12, 20, 0.62)"
        : "rgba(8, 12, 20, 0.42)",
    border: `1px solid ${border}`,
    cursor: "pointer",
    transition: "background 0.25s, border-color 0.25s, transform 0.25s",
    transform: hover ? "translateY(-1px)" : "translateY(0)",
    animation: animate ? `chronoFade 0.45s ${delayMs}ms both` : undefined,
    textAlign: "left",
    color: "inherit",
    width: "100%",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={tileStyle}
      aria-pressed={selected}
    >
      {selected && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 10,
            right: 12,
            fontFamily: "var(--font-plex-mono)",
            fontSize: 9.5,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: accent,
          }}
        >
          ● ELECTVS
        </span>
      )}
      <span
        style={{
          display: "block",
          fontFamily: "var(--font-cinzel)",
          fontWeight: 500,
          fontSize: 16,
          letterSpacing: "0.10em",
          color: "var(--cl-bone)",
          marginBottom: 4,
        }}
      >
        {label}
      </span>
      <span
        style={{
          display: "block",
          fontFamily: "var(--font-cormorant)",
          fontStyle: "italic",
          fontSize: 15,
          lineHeight: 1.4,
          color: "var(--cl-dim)",
        }}
      >
        {desc}
      </span>
    </button>
  );
}
