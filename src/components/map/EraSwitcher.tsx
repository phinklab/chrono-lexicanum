"use client";

// Top-left era pills — port of the prototype's EraSwitcher. Compact header
// bar that expands downward into a dropdown. Coming-soon eras are
// non-clickable affordances.

import { useState } from "react";

import { ERAS } from "@/lib/galaxy/eras";
import { getTheme } from "@/lib/galaxy/themes";

import { useGalaxy, useGalaxyActions } from "./context";

export default function EraSwitcher() {
  const state = useGalaxy();
  const { switchEra } = useGalaxyActions();
  const [open, setOpen] = useState(false);
  const t = getTheme(state.tweaks.theme);
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
        fontFamily: t.fontMono,
        color: t.primary,
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
          background: `${t.bg0}c7`,
          border: `1px solid ${t.stroke}`,
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
            background: `${t.bg0}eb`,
            border: `1px solid ${t.stroke}`,
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
              borderBottom: `1px solid ${t.strokeFaint}`,
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
                  background: isActive ? "rgba(201,166,90,.10)" : "transparent",
                  border: "none",
                  borderLeft: `3px solid ${isActive ? e.accent : "transparent"}`,
                  color: "inherit",
                  cursor: locked ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                  borderTop: "1px solid rgba(201,166,90,.06)",
                  opacity: locked ? 0.42 : 1,
                  position: "relative",
                }}
                onMouseEnter={(ev) => {
                  if (!isActive && !locked) ev.currentTarget.style.background = "rgba(201,166,90,.05)";
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
                        border: "1px solid rgba(201,166,90,.30)",
                        color: "rgba(201,166,90,.65)",
                        fontFamily: t.fontMono,
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
                    fontSize: 13,
                    opacity: 0.7,
                    lineHeight: 1.4,
                    marginTop: 6,
                    marginLeft: 40,
                    fontFamily: t.fontBody,
                    fontStyle: "italic",
                    color: t.accent,
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
              borderTop: `1px solid ${t.strokeFaint}`,
            }}
          >
            Each timeline saves its own map state. Edits, added worlds and warp zones are kept per-era.
          </div>
        </div>
      )}
    </div>
  );
}
