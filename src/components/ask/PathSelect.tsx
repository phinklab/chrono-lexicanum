"use client";

import { useState, type CSSProperties } from "react";
import { PATHS, type PathDef } from "@/lib/askPaths";

type PathSelectProps = {
  onChoose: (path: PathDef) => void;
};

export default function PathSelect({ onChoose }: PathSelectProps) {
  return (
    <ol
      aria-label="Paths"
      className="c-fade-in"
      style={{
        listStyle: "none",
        margin: 0,
        padding: 0,
        width: "min(840px, 94vw)",
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 20,
      }}
    >
      {PATHS.map((p, i) => (
        <li key={p.id}>
          <PathCard path={p} index={i} onChoose={onChoose} active />
        </li>
      ))}
    </ol>
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

  const accentBorder = hover
    ? `color-mix(in oklch, ${path.accent} 55%, transparent)`
    : "var(--line-1)";
  const styleCard = {
    "--row-accent": path.accent,
    position: "relative",
    padding: "20px 20px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minHeight: 150,
    cursor: active ? "pointer" : "default",
    pointerEvents: active ? "auto" : "none",
    animation: active ? `chronoFade 0.5s ${index * 90}ms both` : undefined,
    borderColor: accentBorder,
    boxShadow: hover
      ? `0 14px 44px rgba(0,0,0,0.6), 0 0 20px -6px color-mix(in oklch, ${path.accent} 34%, transparent), inset 0 1px 0 rgba(255,255,255,0.05)`
      : undefined,
    transform: hover ? "translateY(-2px)" : "translateY(0)",
    transition: "border-color 0.3s, transform 0.3s, box-shadow 0.3s",
  } as CSSProperties;

  return (
    <div
      className="ask-card"
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
          fontSize: 24,
          letterSpacing: "0.16em",
          color: path.accent,
          opacity: 0.42,
        }}
      >
        {path.sigil}
      </span>

      <span className="card-eyebrow">{path.latin}</span>
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
        }}
      >
        {path.desc}
      </p>

      <div
        style={{
          marginTop: "auto",
          paddingTop: 10,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "baseline",
          fontFamily: "var(--font-plex-mono)",
          fontSize: 9.5,
          letterSpacing: "0.24em",
          textTransform: "uppercase",
        }}
      >
        <span style={{ color: path.accent }}>Enter →</span>
      </div>
    </div>
  );
}
