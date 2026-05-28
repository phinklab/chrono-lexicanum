"use client";

// Second SVG layered exactly over GalacticDisc. Renders one Handle per
// editable point (Cicatrix spine, Necron polylines, Tyranid polylines,
// Landmarks, Nebulae). Pointer-moves over the overlay update the cursor
// readout — leaving clears it so the HUD shows "—".

import { useRef } from "react";

import { screenToSvg, svgToPolar } from "@/lib/galaxy/coords";

import { useGalaxy, useGalaxyDispatch } from "../context";
import Handle from "./Handle";

export default function EditOverlay() {
  const state = useGalaxy();
  const dispatch = useGalaxyDispatch();
  const svgRef = useRef<SVGSVGElement | null>(null);

  if (!state.tweaks.editWarps) return null;

  const sel = state.editSelection;
  const isSel = (kind: typeof sel extends null ? never : NonNullable<typeof sel>["kind"], idx: number, idx2?: number) =>
    !!sel && sel.kind === kind && sel.idx === idx && sel.idx2 === idx2;

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const [sx, sy] = screenToSvg(svg, e.clientX, e.clientY);
    const [r, a] = svgToPolar(sx, sy);
    dispatch({ type: "set_cursor_polar", coords: { r, a } });
  };
  const onPointerLeave = () => dispatch({ type: "set_cursor_polar", coords: null });

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "visible",
        zIndex: 3,
      }}
    >
      {state.data.cicatrix.map(([r, a], i) => (
        <Handle
          key={`pt-${i}`}
          r={r}
          a={a}
          color="#ff3388"
          ring={1.6}
          label={`PT${i + 1}`}
          highlighted={isSel("cicatrix", i)}
          svgRef={svgRef}
          onChange={(nr, na) => dispatch({ type: "patch_cicatrix_pt", idx: i, pt: [nr, na] })}
          onSelect={() => dispatch({ type: "edit_select", selection: { kind: "cicatrix", idx: i } })}
        />
      ))}

      {state.data.necron.map((dyn, di) =>
        dyn.pts.map(([r, a], pi) => (
          <Handle
            key={`nec-${di}-${pi}`}
            r={r}
            a={a}
            color={dyn.color || "#5cd09a"}
            ring={1.4}
            label={`${dyn.id.slice(0, 4).toUpperCase()}·${pi + 1}`}
            highlighted={isSel("necron", di, pi)}
            svgRef={svgRef}
            onChange={(nr, na) =>
              dispatch({ type: "patch_necron_pt", idx: di, ptIdx: pi, pt: [nr, na] })
            }
            onSelect={() => dispatch({ type: "edit_select", selection: { kind: "necron", idx: di, idx2: pi } })}
          />
        )),
      )}

      {state.data.tyranid.map((sw, di) =>
        sw.pts.map(([r, a], pi) => (
          <Handle
            key={`tyr-${di}-${pi}`}
            r={r}
            a={a}
            color={sw.color || "#c97ad8"}
            ring={1.4}
            label={`${(sw.id || "TYR").slice(0, 4).toUpperCase()}·${pi + 1}`}
            highlighted={isSel("tyranid", di, pi)}
            svgRef={svgRef}
            onChange={(nr, na) =>
              dispatch({ type: "patch_tyranid_pt", idx: di, ptIdx: pi, pt: [nr, na] })
            }
            onSelect={() => dispatch({ type: "edit_select", selection: { kind: "tyranid", idx: di, idx2: pi } })}
          />
        )),
      )}

      {state.data.landmarks.map((l, i) => (
        <Handle
          key={`lm-${i}`}
          r={l.r}
          a={l.a}
          color={l.faction === "chaos" ? "#ff5544" : "#ffdd66"}
          ring={1.2}
          label={l.name}
          highlighted={isSel("landmark", i)}
          svgRef={svgRef}
          onChange={(nr, na) => dispatch({ type: "patch_landmark", idx: i, patch: { r: nr, a: na } })}
          onSelect={() => dispatch({ type: "edit_select", selection: { kind: "landmark", idx: i } })}
        />
      ))}

      {state.data.nebulae.map((n, i) => {
        if (n.isRift) return null;
        if (n.r == null || n.a == null) return null;
        return (
          <Handle
            key={`neb-${i}`}
            r={n.r}
            a={n.a}
            color="#ffaa44"
            ring={1.3}
            label={n.name}
            highlighted={isSel("nebula", i)}
            svgRef={svgRef}
            onChange={(nr, na) => dispatch({ type: "patch_nebula", idx: i, patch: { r: nr, a: na } })}
            onSelect={() => dispatch({ type: "edit_select", selection: { kind: "nebula", idx: i } })}
          />
        );
      })}
    </svg>
  );
}
