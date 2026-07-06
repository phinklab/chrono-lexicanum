"use client";

/**
 * Census — the classification filter (Studie H/I): the 70 primary
 * classifications of the SSOT carry the filter mechanics, bundled into the
 * 11 kind groups with counters + toggles; sub-rows fold out, every
 * classification switches individually.
 *
 * Session-Nachtrag 178 (rearrange): the three display toggles sit together
 * at the top under a "Display" caption; the classification groups follow
 * under their own caption, ordered by population (largest first) instead of
 * the old hardcoded thematic order. Group order is computed from the full
 * catalog counts so it never jumps when "Linked records only" flips.
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
  showAll: boolean;
  onToggleCls: (ci: number) => void;
  onSetCls: (cis: number[], hidden: boolean) => void;
  onToggleWorksOnly: () => void;
  onToggleDust: () => void;
  onToggleShowAll: () => void;
}

export default function Census({
  payload,
  hiddenCls,
  worksOnly,
  dustOff,
  showAll,
  onToggleCls,
  onSetCls,
  onToggleWorksOnly,
  onToggleDust,
  onToggleShowAll,
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
      <p className="chead">Display</p>
      <button className={`cx${worksOnly ? " on" : ""}`} onClick={onToggleWorksOnly}>
        <span className="pad" />
        <span className="sym">
          <svg viewBox="-8 -8 16 16" width={18} height={18}>
            <circle r={2.8} fill="none" stroke={GOLD} strokeWidth={1} />
            <circle r={1} fill={GOLD} />
          </svg>
        </span>
        <span className="lab">
          Linked records only
          <i className="hint">hide everything without books or podcasts</i>
        </span>
        <span className="n">{featTotal}</span>
      </button>
      {!worksOnly && (
        <button className={`cx${dustOff ? " off" : ""}`} onClick={onToggleDust}>
          <span className="pad" />
          <span className="sym">
            <svg viewBox="-8 -8 16 16" width={18} height={18}>
              <circle r={1.4} fill={BONE} fillOpacity={0.4} />
            </svg>
          </span>
          <span className="lab">
            Star-dust — unrecorded worlds
            <i className="hint">faint dots: no linked work in the archive yet</i>
          </span>
          <span className="n">{payload.dust.length}</span>
        </button>
      )}
      <button className={`cx${showAll ? " on" : ""}`} onClick={onToggleShowAll}>
        <span className="pad" />
        <span className="sym">
          <svg viewBox="-8 -8 16 16" width={18} height={18}>
            <circle cx={-4} r={1.1} fill={GOLD} />
            <circle r={1.1} fill={GOLD} fillOpacity={0.6} />
            <circle cx={4} r={1.1} fill={GOLD} fillOpacity={0.3} />
          </svg>
        </span>
        <span className="lab">
          Reveal the full census
          <i className="hint">show every recorded world even at wide zoom</i>
        </span>
        <span className="n">{featTotal}</span>
      </button>

      <p className="chead groups">Census — by classification</p>
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
                title="Expand"
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
              <button className="gname" onClick={() => onSetCls(members, !allOff)}>
                {label}
                {kind === "unclassified" && (
                  <i className="hint">no classification in the source census</i>
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
