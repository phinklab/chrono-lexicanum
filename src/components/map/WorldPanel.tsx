"use client";

// 380px codex side-panel that slides in from the right when a world is
// selected. Lore + book entries + recorded events + auspex telemetry.

import { useMemo, type CSSProperties } from "react";

import { FACTION_COLORS, SEGMENTUM_WORLDS } from "@/lib/galaxy/data";
import type { Theme, World } from "@/lib/galaxy/types";

import { useGalaxy, useGalaxyActions } from "./context";

interface WorldPanelProps {
  theme: Theme;
}

function findWorldById(id: string | null): World | null {
  if (!id) return null;
  for (const list of Object.values(SEGMENTUM_WORLDS)) {
    const w = list.find((w) => w.id === id);
    if (w) return w;
  }
  return null;
}

// The one drawn line of the gold language (64-detail-modal.css): a gradient
// hairline that fades out at both ends — replaces every solid/dashed border.
const HAIRLINE =
  "linear-gradient(90deg, transparent, rgba(201,166,90,0.16) 14%, rgba(201,166,90,0.16) 86%, transparent)";

function Hairline({ style }: { style?: CSSProperties }) {
  return <div style={{ height: 1, background: HAIRLINE, ...style }} />;
}

function SectionHeader({ theme, label, sub }: { theme: Theme; label: string; sub?: string }) {
  const t = theme;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 10,
        marginBottom: 10,
        paddingBottom: 6,
        position: "relative",
      }}
    >
      <Hairline style={{ position: "absolute", left: 0, right: 0, bottom: 0 }} />
      <span
        style={{
          fontFamily: t.fontDisplay,
          fontSize: 11,
          letterSpacing: t.letterTitle,
          color: t.accent,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      {sub && (
        <span
          style={{
            fontFamily: t.fontMono,
            fontSize: 9,
            letterSpacing: "0.16em",
            color: t.primary,
            opacity: 0.5,
            textTransform: "uppercase",
            marginLeft: "auto",
          }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

export default function WorldPanel({ theme }: WorldPanelProps) {
  const t = theme;
  const state = useGalaxy();
  const { chooseWorld } = useGalaxyActions();
  const world = useMemo(() => findWorldById(state.selectedWorldId), [state.selectedWorldId]);
  const open = !!world;
  // Deterministic per-world vox frequency — same world → same numbers across
  // mounts; no Math.random in render so React 19's purity rules stay happy.
  const voxStable = useMemo(() => {
    if (!world) return { mhz: 0, khz: 0 };
    let h = 0;
    for (let i = 0; i < world.id.length; i++) h = (h * 31 + world.id.charCodeAt(i)) | 0;
    const u = (h >>> 0);
    return { mhz: 60 + (u % 40), khz: (u >>> 8) % 100 };
  }, [world]);
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: 380,
        transform: open ? "translateX(0)" : "translateX(110%)",
        transition: "transform 0.45s cubic-bezier(.2,.7,.2,1)",
        // Gold language: no drawn frame — the card edge is the drop shadow
        // plus a faint bone light-catch on the leading edge.
        background: "linear-gradient(180deg, rgba(6,9,16,0.97) 0%, rgba(2,4,10,0.98) 100%)",
        backdropFilter: "blur(10px)",
        boxShadow: `-30px 0 80px -20px rgba(0,0,0,0.85), inset 1px 0 0 rgba(232,220,192,0.06)`,
        pointerEvents: open ? "auto" : "none",
        zIndex: 49,
        color: t.primary,
        fontFamily: t.fontBody,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {world && (
        <>
          <div style={{ padding: "20px 22px 14px", position: "relative" }}>
            <Hairline style={{ position: "absolute", left: 0, right: 0, bottom: 0 }} />
            <div
              style={{
                fontFamily: t.fontMono,
                fontSize: 10,
                letterSpacing: "0.28em",
                color: t.primary,
                opacity: 0.6,
                marginBottom: 6,
              }}
            >
              ◆ STELLAR RECORD · {world.id.toUpperCase()}
            </div>
            <div
              style={{
                fontFamily: t.fontDisplay,
                fontSize: 32,
                letterSpacing: t.letterTitle,
                color: t.accent,
                // Faint bloom + dark drop, matching the site's title shadows.
                textShadow: `0 0 26px ${t.primarySoft}, 0 2px 10px rgba(0, 0, 0, 0.9)`,
                lineHeight: 1,
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              {world.name}
            </div>
            <div
              style={{
                fontFamily: t.fontMono,
                fontSize: 10,
                letterSpacing: "0.16em",
                color: world.faction === "neutral" ? t.primary : FACTION_COLORS[world.faction],
                textTransform: "uppercase",
                opacity: 0.95,
              }}
            >
              {world.type}
            </div>
            <button
              onClick={() => chooseWorld(null)}
              aria-label="Close"
              onMouseEnter={(e) => {
                e.currentTarget.style.color = t.accent;
                e.currentTarget.style.background = "rgba(201, 166, 90, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(232, 220, 192, 0.55)";
                e.currentTarget.style.background = "transparent";
              }}
              style={{
                position: "absolute",
                // The global burger (fixed top:16 right:18, 48×44, z 81) floats
                // over the panel's top-right corner — the × must clear it or
                // its clicks get intercepted.
                top: 62,
                right: 14,
                background: "transparent",
                border: "none",
                color: "rgba(232, 220, 192, 0.55)",
                width: 28,
                height: 28,
                borderRadius: 0,
                cursor: "pointer",
                fontFamily: t.fontMono,
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "color 0.18s, background 0.18s",
              }}
            >
              ×
            </button>
          </div>

          <div style={{ overflowY: "auto", padding: "18px 22px", flex: 1 }}>
            <p
              style={{
                fontFamily: t.fontBody,
                fontSize: 14,
                lineHeight: 1.55,
                color: t.primary,
                opacity: 0.9,
                margin: 0,
                marginBottom: 22,
                fontStyle: t.id === "astropath" ? "italic" : "normal",
              }}
            >
              {world.blurb}
            </p>

            <SectionHeader
              theme={t}
              label="Codex Bibliotheca"
              sub={`${world.books.length} record${world.books.length !== 1 ? "s" : ""}`}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
              {world.books.map((b, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(201, 166, 90, 0.07)",
                    boxShadow: "inset 0 1px 0 rgba(232, 220, 192, 0.05)",
                    padding: "10px 12px",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      fontFamily: t.fontDisplay,
                      fontSize: 13,
                      letterSpacing: "0.08em",
                      color: t.accent,
                      marginBottom: 3,
                    }}
                  >
                    {b.title}
                  </div>
                  <div
                    style={{
                      fontFamily: t.fontMono,
                      fontSize: 10,
                      letterSpacing: "0.12em",
                      color: t.primary,
                      opacity: 0.7,
                      textTransform: "uppercase",
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span>{b.author}</span>
                    <span style={{ opacity: 0.7 }}>· {b.tag}</span>
                  </div>
                  <div
                    style={{
                      fontFamily: t.fontMono,
                      fontSize: 9,
                      letterSpacing: "0.18em",
                      color: world.faction === "neutral" ? t.primary : FACTION_COLORS[world.faction],
                      opacity: 0.9,
                      textTransform: "uppercase",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      paddingTop: 5,
                      backgroundImage: HAIRLINE,
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "100% 1px",
                      backgroundPosition: "top left",
                    }}
                  >
                    <span style={{ opacity: 0.5 }}>◉ Setting</span>
                    <span>{b.setting || world.name}</span>
                  </div>
                </div>
              ))}
            </div>

            <SectionHeader theme={t} label="Recorded Events" sub="Imperial dating" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
              {world.events.map((e, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "64px 1fr",
                    gap: 12,
                    paddingBottom: 10,
                    backgroundImage: i < world.events.length - 1 ? HAIRLINE : "none",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "100% 1px",
                    backgroundPosition: "bottom left",
                  }}
                >
                  <div
                    style={{
                      fontFamily: t.fontMono,
                      fontSize: 10,
                      color: t.accent,
                      letterSpacing: "0.1em",
                      paddingTop: 1,
                    }}
                  >
                    {e.era}
                  </div>
                  <div
                    style={{
                      fontFamily: t.fontBody,
                      fontSize: 12.5,
                      lineHeight: 1.45,
                      color: t.primary,
                      opacity: 0.85,
                      fontStyle: t.id === "astropath" ? "italic" : "normal",
                    }}
                  >
                    {e.text}
                  </div>
                </div>
              ))}
            </div>

            <SectionHeader theme={t} label="Auspex" />
            <div
              style={{
                fontFamily: t.fontMono,
                fontSize: 10,
                color: t.primary,
                opacity: 0.7,
                letterSpacing: "0.1em",
                lineHeight: 1.8,
              }}
            >
              <div>
                FACTION ···{" "}
                <span
                  style={{
                    color: world.faction === "neutral" ? t.accent : FACTION_COLORS[world.faction],
                  }}
                >
                  {world.faction.toUpperCase()}
                </span>
              </div>
              <div>SEGMENT ··· {(world.segment || "ultima").toUpperCase()}</div>
              <div>STATUS ···· COGITATOR-VERIFIED</div>
              <div>
                VOX ······· {voxStable.mhz}.{voxStable.khz} MHz
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
