"use client";

import Link from "next/link";
import { type CSSProperties } from "react";
import { CHRONO_SAMPLE_BOOKS, type PathDef } from "@/lib/askPaths";

type ResultCardProps = {
  path: PathDef;
  answers: Record<string, string>;
  onReset: () => void;
  onChangePath: () => void;
};

export default function ResultCard({ path, answers, onReset, onChangePath }: ResultCardProps) {
  const chips = path.questions.map((q) => {
    const v = answers[q.id];
    const opt = q.options.find((o) => o.v === v);
    return { id: q.id, latin: q.latin, label: opt?.label ?? "—" };
  });

  return (
    <div
      className="c-glass c-corners c-fade-in"
      style={{
        width: "min(820px, 96vw)",
        padding: "28px 32px 26px",
        margin: "0 auto",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
            color: path.accent,
          }}
        >
          {"// COGITATOR · RESPONSVM · " + path.latin}
        </span>
        <span
          style={{
            fontFamily: "var(--font-plex-mono)",
            fontSize: 11,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--cl-gold)",
          }}
        >
          {CHRONO_SAMPLE_BOOKS.length} Novellae
        </span>
      </header>

      <h2
        style={{
          margin: "0 0 6px",
          fontFamily: "var(--font-cinzel)",
          fontWeight: 400,
          fontSize: 28,
          letterSpacing: "0.10em",
          color: "var(--cl-bone)",
        }}
      >
        The Cogitator has tuned your signal.
      </h2>
      <p
        style={{
          margin: "0 0 18px",
          fontFamily: "var(--font-cormorant)",
          fontStyle: "italic",
          fontSize: 18,
          lineHeight: 1.45,
          color: "var(--cl-dim)",
        }}
      >
        {path.label} — five books, chosen from your answers.
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 22,
        }}
      >
        {chips.map((c) => (
          <span
            key={c.id}
            style={{
              fontFamily: "var(--font-plex-mono)",
              fontSize: 10.5,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--cl-bone)",
              border: "1px solid rgba(156,230,255,0.18)",
              padding: "5px 10px",
              borderRadius: 999,
              background: "rgba(8,12,20,0.42)",
            }}
          >
            <span style={{ color: path.accent }}>{c.latin}</span>
            <span style={{ opacity: 0.55, margin: "0 6px" }}>·</span>
            {c.label}
          </span>
        ))}
      </div>

      <ol
        style={{
          listStyle: "none",
          margin: "0 0 18px",
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {CHRONO_SAMPLE_BOOKS.map((b, i) => (
          <li
            key={b.slug}
            style={{
              display: "grid",
              gridTemplateColumns: "32px 1fr 92px 120px",
              alignItems: "baseline",
              gap: 12,
              padding: "10px 12px",
              border: "1px solid rgba(156,230,255,0.10)",
              background: "rgba(8,12,20,0.42)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-plex-mono)",
                fontSize: 11,
                letterSpacing: "0.22em",
                color: "var(--cl-faint)",
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span>
              <span
                style={{
                  fontFamily: "var(--font-cinzel)",
                  fontWeight: 500,
                  fontSize: 15,
                  letterSpacing: "0.06em",
                  color: "var(--cl-bone)",
                }}
              >
                {b.title}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontStyle: "italic",
                  fontSize: 13,
                  color: "var(--cl-dim)",
                  marginLeft: 10,
                }}
              >
                {b.author}
              </span>
            </span>
            <span
              style={{
                fontFamily: "var(--font-plex-mono)",
                fontSize: 11,
                letterSpacing: "0.22em",
                color: "var(--cl-cyan)",
              }}
            >
              {b.year}
            </span>
            <Link
              href={`/buch/${b.slug}`}
              style={{
                fontFamily: "var(--font-plex-mono)",
                fontSize: 10,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "var(--cl-bone)",
                textAlign: "right",
                border: "1px solid rgba(156,230,255,0.28)",
                padding: "5px 10px",
                textDecoration: "none",
                transition: "border-color 0.2s, color 0.2s",
              }}
            >
              Detail →
            </Link>
          </li>
        ))}
      </ol>

      <span className="c-hairline" aria-hidden style={{ display: "block", margin: "14px 0" }} />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <FooterButton onClick={onChangePath} variant="faint">
          ← Choose another path
        </FooterButton>
        <FooterButton onClick={onReset} variant="faint">
          Start over
        </FooterButton>
        <Link
          href="/buecher"
          style={{
            fontFamily: "var(--font-plex-mono)",
            fontSize: 11,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "var(--cl-void)",
            background: "var(--cl-cyan)",
            padding: "10px 16px",
            textDecoration: "none",
            border: "1px solid var(--cl-cyan)",
            boxShadow: "0 0 18px rgba(156,230,255,0.35)",
          }}
        >
          All books →
        </Link>
      </div>
    </div>
  );
}

function FooterButton({
  children,
  onClick,
  variant,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant: "faint";
}) {
  const style: CSSProperties = {
    fontFamily: "var(--font-plex-mono)",
    fontSize: 11,
    letterSpacing: "0.24em",
    textTransform: "uppercase",
    color: variant === "faint" ? "var(--cl-dim)" : "var(--cl-bone)",
    background: "transparent",
    padding: "10px 16px",
    border: "1px solid rgba(232,220,192,0.28)",
    cursor: "pointer",
    transition: "color 0.2s, border-color 0.2s",
  };
  return (
    <button type="button" onClick={onClick} style={style}>
      {children}
    </button>
  );
}
