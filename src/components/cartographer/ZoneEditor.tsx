"use client";

/**
 * ZoneEditor — the hand-curation tool for chart zones (178b).
 *
 * Opened via /map?zones=edit. Philipp shapes every zone himself: drag a
 * vertex, click a mid-handle to add a point, double-click (or Delete) to
 * remove one, create new zones from scratch. The tool NEVER derives geometry
 * from reference images (Philipp-Veto in Report 178, Nachtrag 2).
 *
 * The working copy autosaves to localStorage (survives reloads); "Copy JSON" /
 * "Download" export a drop-in replacement for src/lib/map/zones.json — that
 * commit is how a curated shape becomes part of the chart.
 *
 * Pointer mechanics: vertex/midpoint handles stopPropagation on pointerdown
 * so ChartStage never starts a pan; the drag captures on the persistent
 * editor <g> (not the handle — a mid-insert re-keys the handles mid-gesture).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";

import {
  CURATED_ZONES,
  ZONE_KINDS,
  ZONE_KIND_LABELS,
  parseZones,
  zoneCentroid,
  type ZoneDef,
  type ZoneKind,
} from "@/lib/map/zones";
import type { ChartBus } from "./chart-bus";
import { ZoneShape } from "./ZonesLayer";

const DRAFT_KEY = "cg-zones-draft-v1";

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function cloneZone(z: ZoneDef): ZoneDef {
  return { ...z, points: z.points.map(([x, y]) => [x, y] as [number, number]) };
}

function isZoneKind(v: string): v is ZoneKind {
  return (ZONE_KINDS as readonly string[]).includes(v);
}

interface EditorInit {
  zones: ZoneDef[];
  fromDraft: boolean;
}

/** Client-only (the editor mounts behind the chart's mount gate), so the
 *  localStorage draft can seed the initial state directly. */
function loadInitial(): EditorInit {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const parsed = parseZones(JSON.parse(raw));
      if (parsed) return { zones: parsed, fromDraft: true };
    }
  } catch {
    /* unreadable draft — fall back to the committed file */
  }
  return { zones: CURATED_ZONES.map(cloneZone), fromDraft: false };
}

export default function ZoneEditor({ bus }: { bus: ChartBus }) {
  const [init] = useState(loadInitial);
  const [zones, setZones] = useState<ZoneDef[]>(init.zones);
  const [fromDraft, setFromDraft] = useState(init.fromDraft);
  const [activeId, setActiveId] = useState<string | null>(init.zones[0]?.id ?? null);
  const [selPt, setSelPt] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const gRef = useRef<SVGGElement | null>(null);
  const drag = useRef<{ zi: number; pi: number } | null>(null);

  /* Autosave the working copy — a reload never loses curation work. */
  useEffect(() => {
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ zones }));
    } catch {
      /* storage full/blocked — the export buttons still work */
    }
  }, [zones]);

  const activeIdx = zones.findIndex((z) => z.id === activeId);
  const active = activeIdx >= 0 ? zones[activeIdx] : null;

  const patchZone = (zi: number, patch: Partial<ZoneDef>) => {
    setZones((zs) => zs.map((z, i) => (i === zi ? { ...z, ...patch } : z)));
  };

  const movePoint = (zi: number, pi: number, gx: number, gy: number) => {
    setZones((zs) =>
      zs.map((z, i) => {
        if (i !== zi) return z;
        const points = z.points.map((p, j) =>
          j === pi ? ([round2(gx), round2(gy)] as [number, number]) : p,
        );
        return { ...z, points };
      }),
    );
  };

  const deletePoint = useCallback((zi: number, pi: number) => {
    setZones((zs) =>
      zs.map((z, i) =>
        i === zi && z.points.length > 3
          ? { ...z, points: z.points.filter((_, j) => j !== pi) }
          : z,
      ),
    );
    setSelPt(null);
  }, []);

  /* ── Pointer gestures ─────────────────────────────────────────────────── */

  const beginDrag = (e: ReactPointerEvent<SVGElement>, zi: number, pi: number) => {
    e.stopPropagation();
    e.preventDefault();
    gRef.current?.setPointerCapture(e.pointerId);
    drag.current = { zi, pi };
    setActiveId(zones[zi].id);
    setSelPt(pi);
  };

  const onMidDown = (e: ReactPointerEvent<SVGElement>, zi: number, pi: number, mx: number, my: number) => {
    e.stopPropagation();
    e.preventDefault();
    gRef.current?.setPointerCapture(e.pointerId);
    setZones((zs) =>
      zs.map((z, i) => {
        if (i !== zi) return z;
        const points = [
          ...z.points.slice(0, pi + 1),
          [round2(mx), round2(my)] as [number, number],
          ...z.points.slice(pi + 1),
        ];
        return { ...z, points };
      }),
    );
    drag.current = { zi, pi: pi + 1 };
    setSelPt(pi + 1);
  };

  const onGroupMove = (e: ReactPointerEvent<SVGGElement>) => {
    const d = drag.current;
    const drv = bus.driver;
    if (!d || !drv) return;
    const g = drv.screenToWorld(e.clientX, e.clientY);
    movePoint(d.zi, d.pi, g.gx, g.gy);
  };

  const onGroupUp = () => {
    drag.current = null;
  };

  /* Delete/Backspace removes the selected vertex (not while typing). */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const t = e.target;
      if (
        t instanceof HTMLElement &&
        (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")
      )
        return;
      if (activeIdx >= 0 && selPt !== null) {
        e.preventDefault();
        deletePoint(activeIdx, selPt);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIdx, selPt, deletePoint]);

  /* ── Zone operations (panel) ──────────────────────────────────────────── */

  const pickZone = (z: ZoneDef) => {
    setActiveId(z.id);
    setSelPt(null);
    const drv = bus.driver;
    if (drv) {
      const c = zoneCentroid(z);
      bus.flyTo(c.x, c.y, Math.max(drv.getK(), drv.getK0() * 1.6), 700);
    }
  };

  const addZone = () => {
    const drv = bus.driver;
    const center = drv ? drv.getCenterRel() : { gx: 500, gy: 400, kr: 1 };
    const vh = drv ? drv.getViewport().vh : 800;
    const k = drv ? drv.getK() : 1;
    const r = Math.min(48, Math.max(12, vh / (6 * k)));
    const points = Array.from({ length: 8 }, (_, i) => {
      const a = (Math.PI * 2 * i) / 8;
      return [round2(center.gx + Math.cos(a) * r), round2(center.gy + Math.sin(a) * r)] as [
        number,
        number,
      ];
    });
    let n = zones.length + 1;
    while (zones.some((z) => z.id === `zone-${n}`)) n++;
    const zone: ZoneDef = {
      id: `zone-${n}`,
      name: `New zone ${n}`,
      kind: "storm",
      smooth: true,
      published: false,
      points,
    };
    setZones((zs) => [...zs, zone]);
    setActiveId(zone.id);
    setSelPt(null);
  };

  const removeZone = (zi: number) => {
    const z = zones[zi];
    if (!window.confirm(`Delete zone "${z.name}"?`)) return;
    setZones((zs) => zs.filter((_, i) => i !== zi));
    if (z.id === activeId) {
      const rest = zones.filter((_, i) => i !== zi);
      setActiveId(rest[0]?.id ?? null);
      setSelPt(null);
    }
  };

  const exportJson = () => JSON.stringify({ zones }, null, 2) + "\n";

  const copyJson = () => {
    void navigator.clipboard.writeText(exportJson()).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  };

  const downloadJson = () => {
    const url = URL.createObjectURL(new Blob([exportJson()], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "zones.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetToFile = () => {
    if (!window.confirm("Discard the draft and reload zones.json?")) return;
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    const fresh = CURATED_ZONES.map(cloneZone);
    setZones(fresh);
    setFromDraft(false);
    setActiveId(fresh[0]?.id ?? null);
    setSelPt(null);
  };

  /* ── Render: svg layer + HTML panel (portal) ──────────────────────────── */

  return (
    <g
      ref={gRef}
      className="cg-zed-layer"
      onPointerMove={onGroupMove}
      onPointerUp={onGroupUp}
      onPointerCancel={onGroupUp}
    >
      {zones.map((z, zi) => {
        const isActive = z.id === activeId;
        return (
          <g key={z.id} className={isActive ? "zactive" : "zidle"}>
            <g
              onPointerDown={(e) => {
                e.stopPropagation();
                setActiveId(z.id);
                setSelPt(null);
              }}
              style={{ cursor: "pointer" }}
            >
              <ZoneShape zone={z} />
            </g>
            {isActive && (
              <>
                <path
                  className="zwire"
                  d={
                    z.points
                      .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
                      .join(" ") + " Z"
                  }
                />
                {z.points.map((p, pi) => {
                  const q = z.points[(pi + 1) % z.points.length];
                  const mx = (p[0] + q[0]) / 2;
                  const my = (p[1] + q[1]) / 2;
                  return (
                    <g key={`m${pi}`} transform={`translate(${mx} ${my})`}>
                      <g className="cg-pi">
                        <g className="zmid" onPointerDown={(e) => onMidDown(e, zi, pi, mx, my)}>
                          <circle className="zm" r={4.6} />
                          <path className="zm-plus" d="M -2.2 0 H 2.2 M 0 -2.2 V 2.2" />
                        </g>
                      </g>
                    </g>
                  );
                })}
                {z.points.map((p, pi) => (
                  <g key={`v${pi}`} transform={`translate(${p[0]} ${p[1]})`}>
                    <g className="cg-pi">
                      <circle
                        className={`zh${selPt === pi ? " sel" : ""}`}
                        r={5.5}
                        onPointerDown={(e) => beginDrag(e, zi, pi)}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          deletePoint(zi, pi);
                        }}
                      />
                    </g>
                  </g>
                ))}
              </>
            )}
          </g>
        );
      })}

      {createPortal(
        // React bubbles portal events along the REACT tree — without the stop,
        // a pointerdown in the panel reaches ChartStage's svg handler, whose
        // preventDefault+blur kills focus (name field untypeable, kind select
        // never opening).
        <aside className="cg-zed" onPointerDown={(e) => e.stopPropagation()}>
          <p className="zed-head">
            Zone editor
            {fromDraft && <span className="zed-draft">draft</span>}
          </p>
          <div className="zed-list">
            {zones.map((z, zi) => (
              <div key={z.id} className={`zed-row${z.id === activeId ? " on" : ""}`}>
                <button className="zed-pick" onClick={() => pickZone(z)}>
                  <span className={`pub${z.published ? " on" : ""}`} />
                  <span className="nm">{z.name || z.id}</span>
                  <i>{z.points.length} pts</i>
                </button>
                <button className="zed-x" title="Delete zone" onClick={() => removeZone(zi)}>
                  ×
                </button>
              </div>
            ))}
          </div>
          <button className="zed-add" onClick={addZone}>
            + New zone
          </button>
          {active && (
            <div className="zed-form">
              <label className="zed-f">
                <span>Name</span>
                <input
                  value={active.name}
                  spellCheck={false}
                  onChange={(e) => patchZone(activeIdx, { name: e.target.value })}
                />
              </label>
              <label className="zed-f">
                <span>Kind</span>
                <select
                  value={active.kind}
                  onChange={(e) => {
                    if (isZoneKind(e.target.value)) patchZone(activeIdx, { kind: e.target.value });
                  }}
                >
                  {ZONE_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {ZONE_KIND_LABELS[k]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="zed-c">
                <input
                  type="checkbox"
                  checked={active.smooth}
                  onChange={() => patchZone(activeIdx, { smooth: !active.smooth })}
                />
                smooth outline
              </label>
              <label className="zed-c">
                <input
                  type="checkbox"
                  checked={active.published}
                  onChange={() => patchZone(activeIdx, { published: !active.published })}
                />
                published on the chart
              </label>
            </div>
          )}
          <div className="zed-actions">
            <button onClick={copyJson}>{copied ? "Copied ✓" : "Copy JSON"}</button>
            <button onClick={downloadJson}>Download</button>
            <button onClick={resetToFile}>Reset</button>
          </div>
          <p className="zed-help">
            Drag a point to shape the zone. The <b>⊕ handles</b> on each edge insert a new point
            (press and drag them straight away); double-click (or Delete) removes one. Only{" "}
            <b>published</b> zones render on the chart — the export replaces{" "}
            <code>src/lib/map/zones.json</code>.
          </p>
        </aside>,
        document.body,
      )}
    </g>
  );
}
