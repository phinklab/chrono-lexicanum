"use client";

// MapControlRail — the floating right-side control menu (Session 158; moved off
// the left edge so the global SiteNav rail owns the left). Frameless gold
// language, set off from the viewport edge; popovers fly out to the LEFT.
// Holds the five viewer-facing controls: Add Element, Emperor's Light, Faction
// Filter, Segmentum Sizes, Voyages. The bottom-right gear (TweaksPanel) keeps
// the remaining secondary settings. The control primitives reuse the global
// `.twk-*` classes that TweaksPanel always mounts.

import { useEffect, useRef, useState, type ReactNode } from "react";

import { useGalaxy, useGalaxyActions, useGalaxyDispatch } from "./context";
import Radio from "./tweaks/controls/Radio";
import Section from "./tweaks/controls/Section";
import Slider from "./tweaks/controls/Slider";

import type { FactionFilter, Tweaks } from "@/lib/galaxy/types";
import { VOYAGES } from "@/lib/galaxy/voyages";

type PopId = "faction" | "sizes" | "voyages";

export default function MapControlRail() {
  const state = useGalaxy();
  const dispatch = useGalaxyDispatch();
  const { surface } = useGalaxyActions();
  const [pop, setPop] = useState<PopId | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const setTweak = (patch: Partial<Tweaks>) => dispatch({ type: "set_tweak", patch });
  const togglePop = (id: PopId) => setPop((p) => (p === id ? null : id));

  // Escape + click-outside close the open popover.
  useEffect(() => {
    if (!pop) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPop(null);
    };
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setPop(null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [pop]);

  const t = state.tweaks;

  const selectVoyage = (id: string | null) => {
    dispatch({ type: "select_voyage", id });
    // Routes are galaxy-scale — surface so the path is actually visible.
    if (id && state.view !== "galaxy") surface();
  };

  return (
    <div ref={rootRef} data-no-drag className="maprail">
      <RailItem
        label="Add Element"
        active={t.addMode}
        onClick={() => {
          setPop(null);
          setTweak({ addMode: !t.addMode });
        }}
      />
      <RailItem
        label="Emperor's Light"
        active={t.astronomican}
        onClick={() => {
          setPop(null);
          setTweak({ astronomican: !t.astronomican });
        }}
      />

      <RailItem
        label="Faction Filter"
        active={t.factionFilter !== "all" || pop === "faction"}
        expanded={pop === "faction"}
        onClick={() => togglePop("faction")}
      >
        {pop === "faction" && (
          <div className="maprail__pop" role="dialog" aria-label="Faction filter">
            <div className="maprail__pop-head">Faction Overlay</div>
            <Radio<FactionFilter>
              label="Filter"
              value={t.factionFilter}
              onChange={(v) => setTweak({ factionFilter: v })}
              options={[
                { value: "all", label: "All" },
                { value: "imperium", label: "Imperium" },
                { value: "chaos", label: "Chaos" },
                { value: "xenos", label: "Xenos" },
              ]}
            />
          </div>
        )}
      </RailItem>

      <RailItem
        label="Segmentum Sizes"
        active={pop === "sizes"}
        expanded={pop === "sizes"}
        onClick={() => togglePop("sizes")}
      >
        {pop === "sizes" && (
          <div className="maprail__pop" role="dialog" aria-label="Segmentum sizes">
            <Section label="Outer reach">
              <Slider label="Obscurus (N)" value={t.outerObscurus} min={0.4} max={1.6} step={0.02} onChange={(v) => setTweak({ outerObscurus: v })} />
              <Slider label="Ultima (E)" value={t.outerUltima} min={0.4} max={1.6} step={0.02} onChange={(v) => setTweak({ outerUltima: v })} />
              <Slider label="Tempestus (S)" value={t.outerTempestus} min={0.4} max={1.6} step={0.02} onChange={(v) => setTweak({ outerTempestus: v })} />
              <Slider label="Pacificus (W)" value={t.outerPacificus} min={0.4} max={1.6} step={0.02} onChange={(v) => setTweak({ outerPacificus: v })} />
            </Section>
            <Section label="Boundaries (°)">
              <Slider label="Obscurus ↔ Ultima (NE)" value={t.boundaryNE} min={-10} max={60} step={1} unit="°" onChange={(v) => setTweak({ boundaryNE: v })} />
              <Slider label="Ultima ↔ Tempestus (SE)" value={t.boundarySE} min={120} max={190} step={1} unit="°" onChange={(v) => setTweak({ boundarySE: v })} />
              <Slider label="Tempestus ↔ Pacificus (SW)" value={t.boundarySW} min={195} max={250} step={1} unit="°" onChange={(v) => setTweak({ boundarySW: v })} />
              <Slider label="Pacificus ↔ Obscurus (NW)" value={t.boundaryNW} min={260} max={325} step={1} unit="°" onChange={(v) => setTweak({ boundaryNW: v })} />
            </Section>
          </div>
        )}
      </RailItem>

      <RailItem
        label="Voyages"
        active={!!state.selectedVoyageId || pop === "voyages"}
        expanded={pop === "voyages"}
        onClick={() => togglePop("voyages")}
      >
        {pop === "voyages" && (
          <div className="maprail__pop" role="dialog" aria-label="Voyages">
            <div className="maprail__pop-head">Voyages · character routes</div>
            <div className="maprail__voyages">
              {VOYAGES.map((v) => {
                const active = state.selectedVoyageId === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    className={`twk-btn${active ? "" : " secondary"}`}
                    style={{ justifyContent: "space-between" }}
                    onClick={() => selectVoyage(active ? null : v.id)}
                    aria-pressed={active}
                  >
                    <span>{v.name}</span>
                    <span
                      aria-hidden
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        background: active ? v.color : "transparent",
                        boxShadow: active ? `0 0 8px ${v.color}` : "none",
                        border: `1px solid ${v.color}`,
                        flexShrink: 0,
                      }}
                    />
                  </button>
                );
              })}
            </div>
            <div className="twk-hint">
              Dummy routes for now — a dashed line traces each character through
              the galaxy. Curated itineraries land later.
            </div>
          </div>
        )}
      </RailItem>
    </div>
  );
}

interface RailItemProps {
  label: string;
  active?: boolean;
  expanded?: boolean;
  onClick: () => void;
  children?: ReactNode;
}

function RailItem({ label, active, expanded, onClick, children }: RailItemProps) {
  return (
    <div className="maprail__item">
      <button
        type="button"
        className={`maprail__btn${active ? " is-active" : ""}`}
        aria-expanded={expanded}
        onClick={onClick}
      >
        <span className="maprail__label">{label}</span>
        <span className="maprail__dot" aria-hidden />
      </button>
      {children}
    </div>
  );
}
