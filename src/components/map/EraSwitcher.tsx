"use client";

// Top-left era pills — port of the prototype's EraSwitcher. Compact header
// bar that expands downward into a dropdown. Coming-soon eras are
// non-clickable affordances.

import { useState } from "react";

import { ERAS } from "@/lib/galaxy/eras";

import { useGalaxy, useGalaxyActions } from "./context";

export default function EraSwitcher() {
  const state = useGalaxy();
  const { switchEra } = useGalaxyActions();
  const [open, setOpen] = useState(false);
  const cur = ERAS.find((e) => e.id === state.era) ?? ERAS[ERAS.length - 1];
  if (!cur) return null;
  return (
    <div
      data-no-drag
      style={{
        position: "fixed",
        left: 100,
        top: 84,
        zIndex: 2147483640,
        width: 280,
        fontFamily: '"Rajdhani", system-ui, sans-serif',
        color: "#f0b248",
        userSelect: "none",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          padding: "8px 12px 8px 14px",
          background: "rgba(10,7,3,0.78)",
          border: "1px solid rgba(240,178,72,.35)",
          borderLeft: `3px solid ${cur.accent}`,
          color: "inherit",
          cursor: "pointer",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          fontFamily: "inherit",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          boxShadow: "0 4px 18px rgba(0,0,0,0.45)",
        }}
      >
        <span style={{ fontSize: 9, opacity: 0.55, letterSpacing: "0.32em" }}>TIMELINE</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: cur.accent }}>{cur.code}</span>
        <span style={{ fontSize: 11, fontWeight: 500 }}>{cur.name}</span>
        <span
          style={{
            fontSize: 9,
            opacity: 0.5,
            marginLeft: 4,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform .15s",
          }}
        >
          ▼
        </span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "calc(100% + 6px)",
            background: "rgba(10,7,3,0.92)",
            border: "1px solid rgba(240,178,72,.35)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            boxShadow: "0 8px 28px rgba(0,0,0,0.55)",
            width: 280,
          }}
        >
          <div
            style={{
              padding: "8px 12px 6px",
              fontSize: 9,
              letterSpacing: "0.32em",
              opacity: 0.5,
              textTransform: "uppercase",
              borderBottom: "1px solid rgba(240,178,72,.15)",
            }}
          >
            Select Timeline
          </div>
          {ERAS.map((e) => {
            const isActive = e.id === state.era;
            const locked = !!e.comingSoon;
            return (
              <button
                key={e.id}
                type="button"
                disabled={locked}
                onClick={() => {
                  if (locked) return;
                  switchEra(e.id);
                  setOpen(false);
                }}
                title={locked ? "Coming soon" : ""}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  width: "100%",
                  padding: "10px 12px 10px 14px",
                  background: isActive ? "rgba(240,178,72,.10)" : "transparent",
                  border: "none",
                  borderLeft: `3px solid ${isActive ? e.accent : "transparent"}`,
                  color: "inherit",
                  cursor: locked ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                  borderTop: "1px solid rgba(240,178,72,.06)",
                  opacity: locked ? 0.42 : 1,
                  position: "relative",
                }}
                onMouseEnter={(ev) => {
                  if (!isActive && !locked) ev.currentTarget.style.background = "rgba(240,178,72,.05)";
                }}
                onMouseLeave={(ev) => {
                  if (!isActive && !locked) ev.currentTarget.style.background = "transparent";
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.20em",
                      color: e.accent,
                      minWidth: 32,
                    }}
                  >
                    {e.code}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                    {e.name}
                  </span>
                  {locked && (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 8,
                        letterSpacing: "0.28em",
                        textTransform: "uppercase",
                        padding: "2px 6px",
                        border: "1px solid rgba(240,178,72,.30)",
                        color: "rgba(240,178,72,.65)",
                        fontFamily: '"JetBrains Mono", monospace',
                      }}
                    >
                      Coming soon
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    opacity: 0.55,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    marginTop: 2,
                    marginLeft: 40,
                  }}
                >
                  {e.sub}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    opacity: 0.65,
                    lineHeight: 1.4,
                    marginTop: 6,
                    marginLeft: 40,
                    fontFamily: '"Cormorant Garamond", serif',
                    fontStyle: "italic",
                  }}
                >
                  {e.blurb}
                </div>
              </button>
            );
          })}
          <div
            style={{
              padding: "8px 12px",
              fontSize: 10,
              opacity: 0.5,
              lineHeight: 1.4,
              borderTop: "1px solid rgba(240,178,72,.15)",
            }}
          >
            Each timeline saves its own map state. Edits, added worlds and warp zones are kept per-era.
          </div>
        </div>
      )}
    </div>
  );
}
