"use client";

/**
 * GreatRift — the Cicatrix Maledictum after the ORIGINAL (CicatrixSpine of
 * the old live map, Studie I Runde 5): the ×-raster IS the notation —
 * regular marks in the brick pattern, clipped to the corridor, opacity
 * falling toward the edge; skulls on the spine, three INTERDICTED labels
 * with cut-out raster zones. Three switchable storm veils (data-storm I/II/
 * III) share the raster.
 *
 * ⚠ Shipped STATIC by default (Brief 178 session): the study animated all
 * ~900 cells with individual CSS keyframes — the prime suspect for the
 * "ultra laggy" report — and that variant is deliberately NOT shipped.
 * The "Rift unrest" direction proof re-enables only the CHEAP life:
 * the word-glitch engine (≤3 slots × ~12 letters), ten lightning arcs and
 * the slow vein/band breathing — never the per-cell animations.
 */

import { useEffect, useRef } from "react";
import type { CSSProperties, RefObject } from "react";

import {
  BLOOD,
  GLITCH,
  RIFT_D,
  RIFT_WORDS,
  SKULL_PATH,
  VOID0,
  WARP_B,
  WARP_L,
  WARP_M,
  WARP_V,
  riftGeometry,
  xMarkPath,
  type RiftCell,
} from "./chart-geometry";

const SVG_NS = "http://www.w3.org/2000/svg";

function RiftFlow({ opacity }: { opacity: number }) {
  return (
    <path
      className="cg-riftflow"
      d={RIFT_D}
      fill="none"
      stroke={WARP_L}
      strokeOpacity={opacity}
      strokeDasharray="1.5 9"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
    />
  );
}

/**
 * The word-glitch engine (mounted only under "Rift unrest"): heretic words
 * flame up in runs of adjacent cells — letters glitch through occult signs,
 * the ×-marks yield while a word holds. Direct DOM writes on a 90 ms tick,
 * exactly the study's cadence; touches ≤3 × 13 text nodes per tick.
 */
function RiftWords({ cellsGRef, cells, runs }: {
  cellsGRef: RefObject<SVGGElement | null>;
  cells: RiftCell[];
  runs: number[][];
}) {
  const wordsGRef = useRef<SVGGElement | null>(null);

  useEffect(() => {
    const wordsG = wordsGRef.current;
    const cellsG = cellsGRef.current;
    if (!wordsG || !cellsG) return;
    const cellEls = cellsG.children;

    interface Slot {
      word: string;
      cellIdx: number[];
      begin: number;
      fadeIn: number;
      hold: number;
      fadeOut: number;
      total: number;
      restartAt: number;
      els: SVGTextElement[];
      done: boolean;
    }

    // Deterministic per mount — same word cadence every visit.
    let s = 91234 >>> 0;
    const wrnd = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };

    const slots: (Slot | null)[] = [null, null, null];
    let seeded = false;
    const t0 = performance.now();

    const setCellHidden = (idx: number, hidden: boolean) => {
      const el = cellEls[idx] as SVGElement | undefined;
      if (!el) return;
      if (hidden) el.style.opacity = "0";
      else el.style.removeProperty("opacity");
    };

    const mkSlot = (now: number): Slot | null => {
      for (let tr = 0; tr < 30; tr++) {
        const word = RIFT_WORDS[Math.floor(wrnd() * RIFT_WORDS.length)];
        let run: number[] | null = null;
        for (let rt = 0; rt < 16; rt++) {
          const cand = runs[Math.floor(wrnd() * runs.length)];
          if (cand && cand.length >= word.length) {
            run = cand;
            break;
          }
        }
        if (!run) continue;
        const s0 = Math.floor(wrnd() * (run.length - word.length + 1));
        const cellIdx = run.slice(s0, s0 + word.length);
        const clash = slots.some(
          (o) => o && !o.done && cellIdx.some((ci) => o.cellIdx.includes(ci)),
        );
        if (clash) continue;
        const hold = 1.5 + wrnd() * 0.9;
        const slot: Slot = {
          word,
          cellIdx,
          begin: now,
          fadeIn: 0.55,
          hold,
          fadeOut: 0.6,
          total: 0.55 + hold + 0.6,
          restartAt: now + 0.55 + hold + 0.6 + 3.5 + wrnd() * 6.5,
          els: [],
          done: false,
        };
        for (const ci of cellIdx) {
          setCellHidden(ci, true);
          const cell = cells[ci];
          const te = document.createElementNS(SVG_NS, "text");
          te.setAttribute("x", cell.x.toFixed(1));
          te.setAttribute("y", (cell.y + 0.7).toFixed(1));
          te.setAttribute("fill", BLOOD);
          te.setAttribute("font-size", "1.9");
          te.setAttribute("font-weight", "700");
          te.setAttribute("text-anchor", "middle");
          te.setAttribute("opacity", "0");
          te.style.fontFamily = "var(--font-mono)";
          wordsG.appendChild(te);
          slot.els.push(te);
        }
        return slot;
      }
      return null;
    };

    const killSlot = (sl: Slot) => {
      for (const ci of sl.cellIdx) setCellHidden(ci, false);
      for (const el of sl.els) el.remove();
      sl.els = [];
      sl.done = true;
    };

    const timer = setInterval(() => {
      const now = (performance.now() - t0) / 1000;
      for (let i = 0; i < slots.length; i++) {
        const sl = slots[i];
        if (!sl) {
          slots[i] = mkSlot(seeded ? now : 0.4 + i * 1.8);
          continue;
        }
        const e = now - sl.begin;
        if (!sl.done && e > sl.total) killSlot(sl);
        if (now >= sl.restartAt) {
          slots[i] = mkSlot(now);
          continue;
        }
        if (sl.done || e < 0) continue;
        for (let li = 0; li < sl.word.length; li++) {
          const t = e - 0.045 * li;
          const te = sl.els[li];
          if (t < 0) {
            te.setAttribute("opacity", "0");
            continue;
          }
          const actual = sl.word[li];
          let opc: number;
          let ch: string;
          if (t < sl.fadeIn) {
            opc = (t / sl.fadeIn) * 0.9;
            const ix = Math.floor(t * 30 + li * 13 + i * 7);
            ch = ix % 5 === 4 ? actual : GLITCH[ix % GLITCH.length];
          } else if (t < sl.fadeIn + sl.hold) {
            opc = 0.9;
            const ix = Math.floor((t - sl.fadeIn) * 6 + li * 5 + i * 3);
            ch = (ix + li * 7) % 13 === 0 ? GLITCH[ix % GLITCH.length] : actual;
          } else {
            const k = (t - sl.fadeIn - sl.hold) / sl.fadeOut;
            opc = (1 - k) * 0.9;
            const ix = Math.floor(t * 28 + li * 11 + i * 5);
            ch = ix % 6 === 5 ? actual : GLITCH[ix % GLITCH.length];
          }
          te.setAttribute("opacity", Math.max(0, opc).toFixed(2));
          te.textContent = ch;
        }
      }
      seeded = true;
    }, 90);

    return () => {
      clearInterval(timer);
      for (const sl of slots) if (sl && !sl.done) killSlot(sl);
      wordsG.replaceChildren();
    };
  }, [cellsGRef, cells, runs]);

  return <g ref={wordsGRef} pointerEvents="none" />;
}

export default function GreatRift({ riftLife }: { riftLife: boolean }) {
  const geo = riftGeometry();
  const cellsGRef = useRef<SVGGElement | null>(null);

  return (
    <g className="cg-riftG">
      <defs>
        <radialGradient id="cg-wgV">
          <stop offset="0%" stopColor={WARP_V} stopOpacity={0.32} />
          <stop offset="55%" stopColor={WARP_V} stopOpacity={0.12} />
          <stop offset="100%" stopColor={WARP_V} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="cg-wgM">
          <stop offset="0%" stopColor={WARP_M} stopOpacity={0.3} />
          <stop offset="55%" stopColor={WARP_M} stopOpacity={0.11} />
          <stop offset="100%" stopColor={WARP_M} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="cg-wgB">
          <stop offset="0%" stopColor={WARP_B} stopOpacity={0.28} />
          <stop offset="55%" stopColor={WARP_B} stopOpacity={0.1} />
          <stop offset="100%" stopColor={WARP_B} stopOpacity={0} />
        </radialGradient>
        <filter id="cg-rvBlur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={5} />
        </filter>
      </defs>

      {/* Fassung I — Hochwerk: raster pur, nur der Warpfluss */}
      <g id="cg-rv1" className="cg-rv">
        <RiftFlow opacity={0.3} />
      </g>

      {/* Fassung II — Riss (Default): enges warp-getöntes Band + gezackter
          Hauptriss + Adern in der Warp-Palette */}
      <g id="cg-rv2" className="cg-rv">
        <g className="cg-rvband" filter="url(#cg-rvBlur)">
          <path d={RIFT_D} fill="none" stroke={WARP_V} strokeWidth={30} strokeOpacity={0.09} strokeLinecap="round" />
          <path d={RIFT_D} fill="none" stroke={WARP_M} strokeWidth={13} strokeOpacity={0.11} strokeLinecap="round" />
        </g>
        {geo.jags.map((j, i) => (
          <path
            key={i}
            className={`cg-${j.cls}`}
            d={j.d}
            fill="none"
            stroke={j.color}
            strokeWidth={j.width}
            strokeOpacity={j.op}
            strokeLinejoin="bevel"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <RiftFlow opacity={0.28} />
      </g>

      {/* Fassung III — Glut: die halbierte G-Nebel-Probe */}
      <g id="cg-rv3" className="cg-rv">
        {geo.blobs.map((b, i) => (
          <circle
            key={i}
            className={`cg-wblob wb${b.cls}`}
            cx={b.x.toFixed(1)}
            cy={b.y.toFixed(1)}
            r={b.r.toFixed(1)}
            fill={`url(#cg-wg${["V", "M", "B"][b.cls]})`}
          />
        ))}
        <RiftFlow opacity={0.26} />
      </g>

      {/* Das X-Raster — statisch, keine per-Zellen-Animationen. */}
      <g ref={cellsGRef} className="cg-riftgrid" pointerEvents="none">
        {geo.cells.map((c, i) => (
          <path
            key={i}
            d={xMarkPath(c.x, c.y, c.s)}
            stroke={BLOOD}
            strokeWidth={0.85}
            fill="none"
            opacity={c.op.toFixed(2)}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>

      {/* Totenköpfe auf der Spine */}
      {geo.skulls.map((sk, i) => (
        <g
          key={i}
          className="cg-rfsk"
          transform={`translate(${sk.x.toFixed(1)} ${sk.y.toFixed(1)}) scale(2.6)`}
          style={{ "--dur": `${sk.dur.toFixed(1)}s`, "--del": `${sk.delay.toFixed(1)}s` } as CSSProperties}
        >
          <path d={SKULL_PATH} fill={BLOOD} />
          <circle cx={-0.18} cy={-0.16} r={0.13} fill={VOID0} />
          <circle cx={0.18} cy={-0.16} r={0.13} fill={VOID0} />
          <path d="M -0.05 0.02 L 0.05 0.02 L 0 0.14 Z" fill={VOID0} />
          <rect x={-0.02} y={0.18} width={0.04} height={0.14} fill={VOID0} />
        </g>
      ))}

      {/* Drei INTERDICTED-Label, horizontal wie im Original */}
      {geo.zones.map((z, lb) => (
        <g
          key={lb}
          className="cg-rflbl"
          transform={`translate(${z.x.toFixed(1)} ${z.y.toFixed(1)})`}
          style={{ "--dur": `${7 + lb * 2}s`, "--del": `${(lb * 1.7).toFixed(1)}s` } as CSSProperties}
        >
          <text className="cg-riftlbl" y={0.6} fontSize={4.2} textAnchor="middle" fillOpacity={0.72} letterSpacing="0.19em">
            ✠ INTERDICTED ZONE ✠
          </text>
          <text className="cg-riftlbl" y={5.4} fontSize={2.6} textAnchor="middle" fillOpacity={0.45} letterSpacing="0.42em">
            CICATRIX MALEDICTUM · M42.{(z.idx * 7 + 13) % 1000}
          </text>
        </g>
      ))}

      {/* Blitze — unsichtbar ohne .unrest (CSS hält sie auf opacity 0) */}
      {geo.bolts.map((b, i) => (
        <path
          key={i}
          className={`cg-warc wa${b.cls}`}
          d={b.d}
          stroke={b.color}
          strokeWidth={b.width.toFixed(2)}
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {riftLife && <RiftWords cellsGRef={cellsGRef} cells={geo.cells} runs={geo.runs} />}
    </g>
  );
}
