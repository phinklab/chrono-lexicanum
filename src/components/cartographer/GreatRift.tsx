"use client";

/**
 * GreatRift — the Cicatrix Maledictum as portolan notation (178b Runde 6,
 * "back to the roots"): the corridor is ONE closed path filled with the
 * a-portolan red 45°-hatch pattern („Hic svnt daemones") plus a quiet
 * dashed outline; skulls on the spine, three INTERDICTED labels. The three
 * switchable storm veils (Fassungen I–III: flow line, band + jags, blobs)
 * are retired — they stacked always-on animation and per-frame raster cost
 * onto the zone (the "flicker at the Interdicted Zone", Runden 5–6).
 *
 * ⚠ Shipped STATIC by default (Brief 178 session): the study animated all
 * ~900 cells with individual CSS keyframes — the prime suspect for the
 * "ultra laggy" report — and that variant is deliberately NOT shipped.
 * The "Rift unrest" direction proof re-enables only the CHEAP life:
 * the word-glitch engine (≤3 slots × ~12 letters) and ten lightning arcs.
 */

import { memo, useEffect, useRef } from "react";
import type { CSSProperties } from "react";

import {
  BLOOD,
  GLITCH,
  RIFT_WORDS,
  SKULL_PATH,
  VOID0,
  riftGeometry,
  type RiftCell,
} from "./chart-geometry";

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * The word-glitch engine (mounted only under "Rift unrest"): heretic words
 * flame up in runs of adjacent cells — letters glitch through occult signs
 * over a redaction bar that blanks the hatch beneath (the raster is a few
 * merged paths since Runde 5, individual cells can't hide anymore). Direct
 * DOM writes on a 90 ms tick, exactly the study's cadence.
 */
function RiftWords({ cells, runs }: { cells: RiftCell[]; runs: number[][] }) {
  const wordsGRef = useRef<SVGGElement | null>(null);

  useEffect(() => {
    const wordsG = wordsGRef.current;
    if (!wordsG) return;

    interface Slot {
      word: string;
      cellIdx: number[];
      begin: number;
      fadeIn: number;
      hold: number;
      fadeOut: number;
      total: number;
      restartAt: number;
      bg: SVGRectElement;
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
        // Redaction bar under the letters — blanks the hatch for the word.
        const first = cells[cellIdx[0]];
        const last = cells[cellIdx[cellIdx.length - 1]];
        const bg = document.createElementNS(SVG_NS, "rect");
        bg.setAttribute("x", (first.x - 1.7).toFixed(1));
        bg.setAttribute("y", (first.y - 1.6).toFixed(1));
        bg.setAttribute("width", (last.x - first.x + 3.4).toFixed(1));
        bg.setAttribute("height", "3.4");
        bg.setAttribute("fill", VOID0);
        bg.setAttribute("opacity", "0");
        wordsG.appendChild(bg);
        const slot: Slot = {
          word,
          cellIdx,
          begin: now,
          fadeIn: 0.55,
          hold,
          fadeOut: 0.6,
          total: 0.55 + hold + 0.6,
          restartAt: now + 0.55 + hold + 0.6 + 3.5 + wrnd() * 6.5,
          bg,
          els: [],
          done: false,
        };
        for (const ci of cellIdx) {
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
      sl.bg.remove();
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
        // Bar follows the word envelope (in — hold — out).
        const env =
          e < sl.fadeIn
            ? e / sl.fadeIn
            : e < sl.fadeIn + sl.hold
              ? 1
              : Math.max(0, 1 - (e - sl.fadeIn - sl.hold) / sl.fadeOut);
        sl.bg.setAttribute("opacity", (env * 0.85).toFixed(2));
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
  }, [cells, runs]);

  return <g ref={wordsGRef} pointerEvents="none" />;
}

/** memo (178b): a root state change (selection, filter) must not reconcile
 *  this subtree. Only `riftLife` re-renders it. */
export default memo(function GreatRift({ riftLife }: { riftLife: boolean }) {
  const geo = riftGeometry();

  return (
    <g className="cg-riftG" pointerEvents="none">
      <defs>
        {/* Die a-portolan-Schraffur 1:1 (5×5-Kachel, 45°, eine Blutlinie) —
            userSpaceOnUse: die Textur klebt an der Karte wie Tusche. */}
        <pattern
          id="cg-riftHatch"
          width={5}
          height={5}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1={0} y1={0} x2={0} y2={5} stroke={BLOOD} strokeWidth={0.8} strokeOpacity={0.5} />
        </pattern>
      </defs>

      {/* Der Korridor als EIN schraffiertes Feld mit stiller Strichel-Kontur
          („Hic svnt daemones") — statisch, kein per-Frame-Raster mehr. */}
      <path
        className="cg-riftcorr"
        d={geo.corridor}
        fill="url(#cg-riftHatch)"
        stroke={BLOOD}
        strokeOpacity={0.4}
        strokeDasharray="3 3"
        vectorEffect="non-scaling-stroke"
      />

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

      {riftLife && <RiftWords cells={geo.cells} runs={geo.runs} />}
    </g>
  );
});
