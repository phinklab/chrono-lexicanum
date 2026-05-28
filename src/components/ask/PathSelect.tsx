"use client";

import { useState, type CSSProperties } from "react";
import Typewriter from "@/components/chrono/Typewriter";
import { PATHS, type PathDef } from "@/lib/askPaths";

type PathSelectProps = {
  onChoose: (path: PathDef) => void;
};

export default function PathSelect({ onChoose }: PathSelectProps) {
  const [headDone, setHeadDone] = useState(false);
  const [subDone, setSubDone] = useState(false);

  return (
    <div
      className="c-fade-in"
      style={{
        width: "min(1000px, 96vw)",
        margin: "0 auto",
      }}
    >
      <header style={{ textAlign: "center", marginBottom: 28 }}>
        <div
          style={{
            fontFamily: "var(--font-plex-mono)",
            fontSize: 11,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "var(--cl-cyan)",
            marginBottom: 18,
          }}
        >
          {"// ORACVLVM · DELIBERATIO · INITIVM"}
        </div>
        <h2
          style={{
            margin: 0,
            fontFamily: "var(--font-cinzel)",
            fontWeight: 400,
            fontSize: 30,
            letterSpacing: "0.14em",
            color: "var(--cl-bone)",
            textShadow: "0 2px 8px rgba(0,0,0,0.85)",
          }}
        >
          <Typewriter
            text="There are many ways into the galaxy."
            speed={32}
            startDelay={150}
            onDone={() => setHeadDone(true)}
          />
        </h2>
        <p
          style={{
            margin: "14px 0 0",
            fontFamily: "var(--font-cormorant)",
            fontStyle: "italic",
            fontSize: 19,
            color: "var(--cl-dim)",
            minHeight: "1.4em",
          }}
        >
          {headDone && (
            <Typewriter
              text="Choose your path. The cogitator will guide you from there."
              speed={18}
              startDelay={100}
              cursor
              onDone={() => setSubDone(true)}
            />
          )}
        </p>
        <span className="c-hairline" style={{ display: "block", margin: "20px auto 0", maxWidth: 320 }} aria-hidden />
      </header>

      <ol
        aria-label="Paths"
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 14,
          opacity: subDone ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      >
        {PATHS.map((p, i) => (
          <li key={p.id}>
            <PathCard path={p} index={i} onChoose={onChoose} active={subDone} />
          </li>
        ))}
      </ol>
    </div>
  );
}

type PathCardProps = {
  path: PathDef;
  index: number;
  active: boolean;
  onChoose: (path: PathDef) => void;
};

function PathCard({ path, index, active, onChoose }: PathCardProps) {
  const [hover, setHover] = useState(false);

  const accentBorder = hover ? path.accent : "rgba(156, 230, 255, 0.18)";
  const styleCard: CSSProperties = {
    position: "relative",
    padding: "18px 18px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minHeight: 220,
    cursor: active ? "pointer" : "default",
    pointerEvents: active ? "auto" : "none",
    animation: active ? `chronoFade 0.5s ${index * 90}ms both` : undefined,
    borderColor: accentBorder,
    transform: hover ? "translateY(-2px)" : "translateY(0)",
    transition: "border-color 0.3s, transform 0.3s",
  };

  return (
    <div
      className="c-glass c-corners"
      role="button"
      tabIndex={active ? 0 : -1}
      aria-label={`${path.label} — choose`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => active && onChoose(path)}
      onKeyDown={(e) => {
        if (!active) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onChoose(path);
        }
      }}
      style={styleCard}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 14,
          right: 18,
          fontFamily: "var(--font-cinzel)",
          fontSize: 28,
          letterSpacing: "0.16em",
          color: path.accent,
          opacity: 0.55,
        }}
      >
        {path.sigil}
      </span>

      <span
        style={{
          fontFamily: "var(--font-plex-mono)",
          fontSize: 10.5,
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          color: path.accent,
        }}
      >
        {path.latin}
      </span>
      <span
        style={{
          fontFamily: "var(--font-cinzel)",
          fontWeight: 500,
          fontSize: 22,
          letterSpacing: "0.10em",
          color: "var(--cl-bone)",
        }}
      >
        {path.label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-cormorant)",
          fontStyle: "italic",
          fontSize: 15,
          color: "var(--cl-dim)",
          marginTop: -2,
        }}
      >
        {path.sub}
      </span>

      <span className="c-hairline" style={{ margin: "6px 0 4px" }} aria-hidden />

      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-cormorant)",
          fontSize: 17,
          lineHeight: 1.5,
          color: "rgba(232, 220, 192, 0.84)",
          minHeight: 68,
        }}
      >
        {path.desc}
      </p>

      <div
        style={{
          marginTop: "auto",
          paddingTop: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          fontFamily: "var(--font-plex-mono)",
          fontSize: 9.5,
          letterSpacing: "0.24em",
          textTransform: "uppercase",
        }}
      >
        <span style={{ color: "var(--cl-faint)" }}>3 questions · 12+ options</span>
        <span style={{ color: path.accent }}>Enter →</span>
      </div>
    </div>
  );
}
