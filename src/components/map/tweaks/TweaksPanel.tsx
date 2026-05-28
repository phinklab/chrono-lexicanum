"use client";

// Float-panel + gear toggle. The gear is permanently mounted in the bottom-
// right corner and toggles the panel open/closed; the panel itself sits
// directly above it. The viewer also has Escape and click-outside as fall-
// back exits. All sections (incl. Add Element + Warp Placement) render
// unconditionally — non-admin viewers see the same controls and can drag
// the map around in demo mode. The "no save unless admin" gate lives in
// `context.tsx` (persistence effects). The reset-timeline button has been
// removed deliberately so a demoed page can never accidentally reset.

import { useEffect, useRef, useState } from "react";

import { useGalaxy, useGalaxyDispatch } from "../context";
import Button from "./controls/Button";
import Radio from "./controls/Radio";
import Section from "./controls/Section";
import Select from "./controls/Select";
import Slider from "./controls/Slider";
import Toggle from "./controls/Toggle";
import { TWEAKS_PANEL_CSS } from "./styles";

import { copyShareLink } from "@/lib/galaxy/share";
import type { FactionFilter, RiftPattern, ThemeId, Tweaks } from "@/lib/galaxy/types";

export default function TweaksPanel() {
  const [open, setOpen] = useState(false);

  // Escape closes the panel from anywhere on the page.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <style>{TWEAKS_PANEL_CSS}</style>
      <button
        type="button"
        className={`twk-gear${open ? " twk-gear--open" : ""}`}
        title={open ? "Close settings" : "Open settings"}
        aria-label={open ? "Close settings" : "Open settings"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden>{open ? "✕" : "⚙"}</span>
      </button>
      {open && <PanelBody onClose={() => setOpen(false)} />}
    </>
  );
}

interface PanelBodyProps {
  onClose: () => void;
}

function PanelBody({ onClose }: PanelBodyProps) {
  const state = useGalaxy();
  const dispatch = useGalaxyDispatch();
  const setTweak = (patch: Partial<Tweaks>) =>
    dispatch({ type: "set_tweak", patch });
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Click outside the panel (anywhere on the map background) closes it.
  // The gear itself is excluded via the `.twk-gear` class check so clicking
  // the gear still goes through the toggle path (which sets open=false).
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      const panel = panelRef.current;
      if (!panel) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (panel.contains(target)) return;
      if (target.closest(".twk-gear")) return;
      onClose();
    };
    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, [onClose]);

  return (
    <div ref={panelRef} data-no-drag className="twk-panel">
      <div className="twk-hd">
        <span className="twk-hd-eyebrow">{"// CARTOGRAPHER"}</span>
        <span className="twk-hd-title">Settings</span>
        <button
          type="button"
          className="twk-x"
          aria-label="Close settings"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
      <div className="twk-body">
        <Section label="Hologram">
          <Radio<ThemeId>
            label="Aesthetic"
            value={state.tweaks.theme}
            onChange={(v) => setTweak({ theme: v })}
            options={[
              { value: "mechanicus", label: "Mechanicus" },
              { value: "astropath", label: "Astropath" },
            ]}
          />
        </Section>

        <Section label="Faction Overlay">
          <Radio<FactionFilter>
            label="Filter"
            value={state.tweaks.factionFilter}
            onChange={(v) => setTweak({ factionFilter: v })}
            options={[
              { value: "all", label: "All" },
              { value: "imperium", label: "Imperium" },
              { value: "chaos", label: "Chaos" },
              { value: "xenos", label: "Xenos" },
            ]}
          />
        </Section>

        <Section label="Cicatrix Pattern">
          <Select<RiftPattern>
            label="Grid"
            value={state.tweaks.riftPattern}
            onChange={(v) => setTweak({ riftPattern: v })}
            options={[
              { value: "strict-square", label: "A · Strict square grid" },
              { value: "strict-square-dense", label: "B · Strict square, denser" },
              { value: "strict-brick", label: "C · Strict brick offset" },
              { value: "triangular", label: "D · Triangular lattice" },
              { value: "mega-dense", label: "E · Tiny + ultra-dense" },
            ]}
          />
        </Section>

        <Section label="Astronomican">
          <Toggle
            label="Show Emperor's reach"
            value={state.tweaks.astronomican}
            onChange={(v) => setTweak({ astronomican: v })}
          />
          <div className="twk-hint">
            Warm halo emanating from Terra. Worlds outside the glow are, in lore,
            beyond the Emperor&apos;s psychic lighthouse — the Dark Imperium.
          </div>
        </Section>

        <Section label="Share & Export">
          <CopyShareButton />
          <Button
            label="⎙ Print / Save as PDF"
            variant="secondary"
            onClick={() => window.print()}
          />
          <div className="twk-hint">
            Share captures era + segmentum + selected world. Print works best in
            landscape, A4 / Letter, background graphics ON.
          </div>
        </Section>

        <Section label="Add Element">
          <Toggle
            label="Show Add panel"
            value={state.tweaks.addMode}
            onChange={(v) => setTweak({ addMode: v })}
          />
          <div className="twk-hint">
            Add planets (Imperial / Chaos / Xenos / Necron / Tyranid) or zones
            (Warp / Necron / Tyranid Swarm). Click the map to place.
          </div>
        </Section>

        <Section label="Warp Placement">
          <Toggle
            label="Edit warp positions"
            value={state.tweaks.editWarps}
            onChange={(v) => setTweak({ editWarps: v })}
          />
          <div className="twk-hint">
            Drag warp clusters &amp; Cicatrix spine points on the map. Cursor
            coords show bottom-right.
          </div>
        </Section>

        <Section label="Segmentum Sizes">
          <div className="twk-hint" style={{ padding: "2px 0 6px" }}>
            Outer reach (how far from Terra each segmentum extends).
          </div>
          <Slider
            label="Obscurus reach (N)"
            value={state.tweaks.outerObscurus}
            min={0.4}
            max={1.6}
            step={0.02}
            onChange={(v) => setTweak({ outerObscurus: v })}
          />
          <Slider
            label="Ultima reach (E)"
            value={state.tweaks.outerUltima}
            min={0.4}
            max={1.6}
            step={0.02}
            onChange={(v) => setTweak({ outerUltima: v })}
          />
          <Slider
            label="Tempestus reach (S)"
            value={state.tweaks.outerTempestus}
            min={0.4}
            max={1.6}
            step={0.02}
            onChange={(v) => setTweak({ outerTempestus: v })}
          />
          <Slider
            label="Pacificus reach (W)"
            value={state.tweaks.outerPacificus}
            min={0.4}
            max={1.6}
            step={0.02}
            onChange={(v) => setTweak({ outerPacificus: v })}
          />
          <div className="twk-hint" style={{ padding: "8px 0 4px" }}>
            Boundaries between neighbouring segmentums (in degrees, 0° = north,
            clockwise).
          </div>
          <Slider
            label="Obscurus ↔ Ultima (NE)"
            value={state.tweaks.boundaryNE}
            min={-10}
            max={60}
            step={1}
            unit="°"
            onChange={(v) => setTweak({ boundaryNE: v })}
          />
          <Slider
            label="Ultima ↔ Tempestus (SE)"
            value={state.tweaks.boundarySE}
            min={120}
            max={190}
            step={1}
            unit="°"
            onChange={(v) => setTweak({ boundarySE: v })}
          />
          <Slider
            label="Tempestus ↔ Pacificus (SW)"
            value={state.tweaks.boundarySW}
            min={195}
            max={250}
            step={1}
            unit="°"
            onChange={(v) => setTweak({ boundarySW: v })}
          />
          <Slider
            label="Pacificus ↔ Obscurus (NW)"
            value={state.tweaks.boundaryNW}
            min={260}
            max={325}
            step={1}
            unit="°"
            onChange={(v) => setTweak({ boundaryNW: v })}
          />
        </Section>

        <Section label="Tip">
          <div className="twk-hint">
            Click <strong>ULTIMA</strong> to dive · scroll to zoom · click any
            world for codex.
          </div>
        </Section>
      </div>
    </div>
  );
}

function CopyShareButton() {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      label={copied ? "✓ Copied — paste anywhere" : "⎘ Copy share link"}
      onClick={async () => {
        const ok = await copyShareLink();
        if (!ok) {
          if (typeof window !== "undefined") {
            window.alert(`Could not copy automatically. URL: ${window.location.href}`);
          }
          return;
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
    />
  );
}
