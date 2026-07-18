"use client";

/**
 * Census — the classification filter: the 70 primary classifications of the
 * SSOT carry the filter mechanics, bundled into the 11 kind groups with
 * counters + toggles; sub-rows fold out, every classification switches
 * individually.
 *
 * The display toggles sit together at the top ("Show on the chart"); the
 * classification groups follow under their own caption ("By world type"),
 * ordered by population (largest first). Group order is computed from the
 * full catalog counts so it never jumps when the works-only filter flips.
 */

import { useMemo, useState } from "react";

import type { MapPayload } from "@/lib/map/payload";
import type { MapWorldKind } from "@/lib/map/map-worlds-schema";
import { BONE, GOLD } from "./chart-geometry";
import { Glyph } from "./layers";

const GROUPS: [MapWorldKind, string][] = [
  ["imperial", "Imperial worlds"],
  ["imperial-military", "Fortress & forge"],
  ["station", "Stations & bastions"],
  ["fleet", "Fleets & flotillas"],
  ["chaos-warp", "Ruinous / warp-touched"],
  ["gate", "Warp gates"],
  ["aeldari", "Aeldari domains"],
  ["necron", "Necron dynasties"],
  ["xenos", "Xenos empires"],
  ["dead", "Dead & destroyed"],
  ["unclassified", "Unclassified"],
];

interface CensusProps {
  payload: MapPayload;
  hiddenCls: ReadonlySet<number>;
  worksOnly: boolean;
  dustOff: boolean;
  onToggleCls: (ci: number) => void;
  onSetCls: (cis: number[], hidden: boolean) => void;
  onToggleWorksOnly: () => void;
  onToggleDust: () => void;
}

export default function Census({
  payload,
  hiddenCls,
  worksOnly,
  dustOff,
  onToggleCls,
  onSetCls,
  onToggleWorksOnly,
  onToggleDust,
}: CensusProps) {
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());

  const { clsCount, clsFeat, featTotal } = useMemo(() => {
    const count = payload.cls.map(() => 0);
    const feat = payload.cls.map(() => 0);
    for (const [, , ci] of payload.dust) count[ci]++;
    let ft = 0;
    for (const f of payload.featured) {
      if (f.kind === "region" || f.c < 0) continue;
      count[f.c]++;
      feat[f.c]++;
      ft++;
    }
    return { clsCount: count, clsFeat: feat, featTotal: ft };
  }, [payload]);

  const cnt = (ci: number) => (worksOnly ? clsFeat[ci] : clsCount[ci]);

  // Select/unselect-all toggle: `visibleCis` mirrors exactly the rows the
  // census renders; the toggle flips every classification in one click.
  const visibleCis = payload.cls
    .map((_, ci) => ci)
    .filter((ci) => clsCount[ci] > 0 && (!worksOnly || clsFeat[ci] > 0));
  const allOff = visibleCis.length > 0 && visibleCis.every((ci) => hiddenCls.has(ci));
  const allCis = payload.cls.map((_, ci) => ci);

  // Largest population first — stable against the worksOnly toggle.
  const ordered = useMemo(() => {
    const withTotal = GROUPS.map(([kind, label]) => {
      const kindI = payload.kinds.indexOf(kind);
      let total = 0;
      payload.cls.forEach((_, ci) => {
        if (payload.clsKind[ci] === kindI) total += clsCount[ci];
      });
      return { kind, label, total };
    });
    return withTotal.sort((a, b) => b.total - a.total);
  }, [payload, clsCount]);

  return (
    <div className="cg-census">
      <p className="chead">Show on the chart</p>
      <button className={`cx${worksOnly ? " on" : ""}`} aria-pressed={worksOnly} onClick={onToggleWorksOnly}>
        <span className="pad" />
        <span className="sym">
          <svg viewBox="-8 -8 16 16" width={18} height={18}>
            <circle r={2.8} fill="none" stroke={GOLD} strokeWidth={1} />
            <circle r={1} fill={GOLD} />
          </svg>
        </span>
        <span className="lab">Worlds from books &amp; podcasts only</span>
        <span className="n">{featTotal}</span>
      </button>
      {!worksOnly && (
        <button className={`cx${dustOff ? " off" : ""}`} aria-pressed={!dustOff} onClick={onToggleDust}>
          <span className="pad" />
          <span className="sym">
            <svg viewBox="-8 -8 16 16" width={18} height={18}>
              <circle r={1.4} fill={BONE} fillOpacity={0.4} />
            </svg>
          </span>
          <span className="lab">Star-dust: worlds without records yet</span>
          <span className="n">{payload.dust.length}</span>
        </button>
      )}
      {/* Zone fields + forced names moved to the Instruments section
          (Session 246): they change what the chart DRAWS, not which worlds
          populate it — the census is population + classification only. */}
      <p className="chead groups">
        <span>By world type</span>
        <button
          className="creset"
          onClick={() => onSetCls(allCis, !allOff)}
          title={allOff ? "Show every world type" : "Hide every type, then pick the ones you want"}
        >
          {allOff ? "select all" : "unselect all"}
        </button>
      </p>
      {ordered.map(({ kind, label }) => {
        const kindI = payload.kinds.indexOf(kind);
        const members = payload.cls
          .map((_, ci) => ci)
          .filter((ci) => payload.clsKind[ci] === kindI && clsCount[ci] > 0)
          .sort((a, b) => clsCount[b] - clsCount[a]);
        if (members.length === 0) return null;

        let memN = 0;
        let total = 0;
        let offN = 0;
        let vis = 0;
        const rows = members.map((ci) => {
          const c = cnt(ci);
          const gone = worksOnly && clsFeat[ci] === 0;
          if (!gone) {
            memN++;
            total += c;
            if (hiddenCls.has(ci)) offN++;
            else vis += c;
          }
          return { ci, c, gone };
        });
        if (memN === 0) return null;
        const isOpen = open.has(kind);
        const allOff = offN === memN;

        return (
          <div className={`cgrp${isOpen ? " open" : ""}${allOff ? " off" : offN > 0 ? " part" : ""}`} key={kind}>
            <div className="cgrp-h">
              <button
                className="car"
                title="Unfold: filter single classifications inside this group"
                aria-label={`Unfold ${label}: filter single classifications`}
                aria-expanded={isOpen}
                onClick={() =>
                  setOpen((o) => {
                    const next = new Set(o);
                    if (next.has(kind)) next.delete(kind);
                    else next.add(kind);
                    return next;
                  })
                }
              >
                ▸
              </button>
              <span className="sym">
                <svg viewBox="-8 -8 16 16" width={18} height={18}>
                  <Glyph kind={kind} s={3.4} />
                </svg>
              </span>
              <button className="gname" aria-pressed={!allOff} onClick={() => onSetCls(members, !allOff)}>
                {label}
                {kind === "unclassified" && (
                  <i className="hint">no type recorded in the archive</i>
                )}
              </button>
              <span className="n">{offN ? `${vis} / ${total}` : String(total)}</span>
            </div>
            {isOpen && (
              <div className="csub">
                {rows.map(({ ci, c, gone }) =>
                  gone ? null : (
                    <button
                      key={ci}
                      className={`crow${hiddenCls.has(ci) ? " off" : ""}`}
                      aria-pressed={!hiddenCls.has(ci)}
                      onClick={() => onToggleCls(ci)}
                    >
                      <span>{payload.cls[ci]}</span>
                      <span className="n">{c}</span>
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        );
      })}

    </div>
  );
}
