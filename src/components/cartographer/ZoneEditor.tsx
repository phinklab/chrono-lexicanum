"use client";

/**
 * ZoneEditor — the hand-curation tool for chart zones.
 *
 * Opened via /map?zones=edit. Every zone is shaped by hand: drag a vertex,
 * click a mid-handle to add a point, double-click (or Delete) to remove one,
 * create new zones from scratch. The tool NEVER derives geometry from
 * reference images.
 *
 * The working copy autosaves to localStorage (survives reloads); "Copy JSON" /
 * "Download" export a drop-in replacement for src/lib/map/zones.json — that
 * commit is how a curated shape becomes part of the chart.
 *
 * Pointer mechanics: vertex/midpoint handles stopPropagation on pointerdown
 * so ChartStage never starts a pan; the drag captures on the persistent
 * editor <g> (not the handle — a mid-insert re-keys the handles mid-gesture).
 *
 * Z-order: the zone faces render via portal into #cg-fields (below
 * dust/pins, as on the built chart) — planets sit above the zones in the
 * editor too and stay clickable. Only the wireframe and the handles of the
 * active zone render as the topmost layer above everything.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";

import {
  CURATED_ZONES,
  MAP_STATES,
  ZONE_KINDS,
  ZONE_KIND_LABELS,
  parseZones,
  zoneCentroid,
  type MapState,
  type ZoneDef,
  type ZoneKind,
} from "@/lib/map/zones";
import type { ChartBus } from "./chart-bus";
import { ERA_LABELS } from "./EraPlate";
import { ZoneShape } from "./ZonesLayer";

const DRAFT_KEY = "cg-zones-draft-v1";

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function cloneZone(z: ZoneDef): ZoneDef {
  return { ...z, states: [...z.states], points: z.points.map(([x, y]) => [x, y] as [number, number]) };
}

function isZoneKind(v: string): v is ZoneKind {
  return (ZONE_KINDS as readonly string[]).includes(v);
}

interface EditorInit {
  zones: ZoneDef[];
  fromDraft: boolean;
}

/** Drafts saved before the three-editions build (Session 246) carry no
 *  `states` — the strict parser would reject them and silently drop the
 *  curation work. Inject the pre-246 default before parsing. */
function migrateDraft(data: unknown): unknown {
  if (typeof data !== "object" || data === null) return data;
  const zonesRaw = (data as { zones?: unknown }).zones;
  if (!Array.isArray(zonesRaw)) return data;
  return {
    zones: zonesRaw.map((z) =>
      typeof z === "object" && z !== null && !("states" in z)
        ? { ...(z as Record<string, unknown>), states: ["now"] }
        : z,
    ),
  };
}

/** Client-only (the editor mounts behind the chart's mount gate), so the
 *  localStorage draft can seed the initial state directly. */
function loadInitial(): EditorInit {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const parsed = parseZones(migrateDraft(JSON.parse(raw)));
      if (parsed) {
        // A draft saved before newer zones were COMMITTED would silently
        // hide them from the editor — append every committed zone the draft
        // doesn't know. (Flip side: deleting a committed zone only sticks
        // once the export lands in zones.json.)
        const known = new Set(parsed.map((z) => z.id));
        const merged = [...parsed, ...CURATED_ZONES.filter((z) => !known.has(z.id)).map(cloneZone)];
        return { zones: merged, fromDraft: true };
      }
    }
  } catch {
    /* unreadable draft — fall back to the committed file */
  }
  return { zones: CURATED_ZONES.map(cloneZone), fromDraft: false };
}

export default function ZoneEditor({ bus, era }: { bus: ChartBus; era: MapState }) {
  const [init] = useState(loadInitial);
  const [zones, setZones] = useState<ZoneDef[]>(init.zones);
  const [fromDraft, setFromDraft] = useState(init.fromDraft);
  const [activeId, setActiveId] = useState<string | null>(init.zones[0]?.id ?? null);
  const [selPt, setSelPt] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const gRef = useRef<SVGGElement | null>(null);
  const drag = useRef<{ zi: number; pi: number } | null>(null);

  /* The zone FACES render via portal into #cg-fields — the same layer the
     built zones live on, BELOW dust/pins: planets stay visible and clickable
     in the editor too. Only the wireframe + handles of the active zone stay
     in the editor <g> as the topmost layer. The portal target is created in
     the same ChartStage commit as the editor — the ref callback (fires after
     the DOM mutations) picks it up. */
  const [fieldsEl, setFieldsEl] = useState<SVGGElement | null>(null);
  const attachEditorG = useCallback((node: SVGGElement | null) => {
    gRef.current = node;
    if (!node) return;
    const el = document.getElementById("cg-fields");
    setFieldsEl(el instanceof SVGGElement ? el : null);
  }, []);

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

  /* Edition membership. The last remaining state cannot be unticked — the
     parser (rightly) rejects a zone that exists in no edition. Rebuilt in
     MAP_STATES order so exports stay canonical. */
  const toggleZoneState = (zi: number, s: MapState) => {
    setZones((zs) =>
      zs.map((z, i) => {
        if (i !== zi) return z;
        const has = z.states.includes(s);
        if (has && z.states.length === 1) return z;
        const states = MAP_STATES.filter((m) => (m === s ? !has : z.states.includes(m)));
        return { ...z, states };
      }),
    );
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

  /* Pointer gestures */

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

  /* Zone operations (panel) */

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
      states: ["now"],
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

  /* Render: svg layer + HTML panel (portal) */

  return (
    <g
      ref={attachEditorG}
      className="cg-zed-layer"
      onPointerMove={onGroupMove}
      onPointerUp={onGroupUp}
      onPointerCancel={onGroupUp}
    >
      {fieldsEl &&
        createPortal(
          <g className="cg-zed-shapes">
            {zones.map((z) => (
              <g
                key={z.id}
                // zed-era-off: not part of the edition currently in force on
                // the era plate — dimmed so curation per edition stays
                // legible while every shape remains pickable.
                className={`${z.id === activeId ? "zactive" : "zidle"}${z.states.includes(era) ? "" : " zed-era-off"}`}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setActiveId(z.id);
                  setSelPt(null);
                }}
                style={{ cursor: "pointer" }}
              >
                <ZoneShape zone={z} />
              </g>
            ))}
          </g>,
          fieldsEl,
        )}

      {active && (
        <>
          <path
            className="zwire"
            d={
              active.points
                .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
                .join(" ") + " Z"
            }
          />
          {active.points.map((p, pi) => {
            const q = active.points[(pi + 1) % active.points.length];
            const mx = (p[0] + q[0]) / 2;
            const my = (p[1] + q[1]) / 2;
            return (
              <g key={`m${pi}`} transform={`translate(${mx} ${my})`}>
                <g className="cg-pi">
                  <g className="zmid" onPointerDown={(e) => onMidDown(e, activeIdx, pi, mx, my)}>
                    <circle className="zm" r={4.6} />
                    <path className="zm-plus" d="M -2.2 0 H 2.2 M 0 -2.2 V 2.2" />
                  </g>
                </g>
              </g>
            );
          })}
          {active.points.map((p, pi) => (
            <g key={`v${pi}`} transform={`translate(${p[0]} ${p[1]})`}>
              <g className="cg-pi">
                <circle
                  className={`zh${selPt === pi ? " sel" : ""}`}
                  r={5.5}
                  onPointerDown={(e) => beginDrag(e, activeIdx, pi)}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    deletePoint(activeIdx, pi);
                  }}
                />
              </g>
            </g>
          ))}
        </>
      )}

      {createPortal(
        // React bubbles portal events along the REACT tree — without the stop,
        // a pointerdown in the panel reaches ChartStage's svg handler, whose
        // preventDefault+blur kills focus (name field untypeable, kind select
        // never opening).
        <aside className="cg-zed" onPointerDown={(e) => e.stopPropagation()}>
          <p className="zed-head">
            Zone editor
            <span className="zed-head-r">
              {fromDraft && <span className="zed-draft">draft</span>}
              {/* Second exit: the fixed bottom toggle can sit below the fold
                  on short viewports — the panel head is always reachable.
                  Full navigation on purpose (like the toggle): the
                  ?zones=edit snapshot is read once per page load. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a className="zed-exit" href="/map" title="Exit zone editor">
                ✕
              </a>
            </span>
          </p>
          <div className="zed-list">
            {zones.map((z, zi) => (
              <div key={z.id} className={`zed-row${z.id === activeId ? " on" : ""}`}>
                <button className="zed-pick" onClick={() => pickZone(z)}>
                  <span className={`pub${z.published ? " on" : ""}`} />
                  <span className="nm">{z.name || z.id}</span>
                  <i className="zst">
                    {z.states.length === MAP_STATES.length
                      ? "all"
                      : z.states.map((s) => ERA_LABELS[s].m).join("·")}
                  </i>
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
              <div className="zed-f zed-states">
                <span>Eras</span>
                <div className="zed-states-row">
                  {MAP_STATES.map((s) => {
                    const checked = active.states.includes(s);
                    const last = checked && active.states.length === 1;
                    return (
                      <label key={s} className="zed-c" title={ERA_LABELS[s].name}>
                        <input
                          type="checkbox"
                          checked={checked}
                          // The parser rejects a zone with no edition — the
                          // last tick cannot be removed.
                          disabled={last}
                          onChange={() => toggleZoneState(activeIdx, s)}
                        />
                        {ERA_LABELS[s].m}
                      </label>
                    );
                  })}
                </div>
              </div>
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
            <code>src/lib/map/zones.json</code>. The <b>era checkboxes</b> pick which chart
            editions carry the zone; shapes outside the edition on the era plate render dimmed.
          </p>
        </aside>,
        document.body,
      )}
    </g>
  );
}
