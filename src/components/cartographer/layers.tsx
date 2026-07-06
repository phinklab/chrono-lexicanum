/**
 * layers.tsx — the data-driven chart layers (Brief 178): kind glyphs,
 * star-dust (900 unrecorded worlds), work pins (141 + labels) and the 13
 * region typo pins. All keyed to the catalog payload; filter changes are
 * rare React renders, camera frames never touch these.
 */

import { memo, useMemo } from "react";

import type { FeaturedWorld, MapPayload, RegionPin } from "@/lib/map/payload";
import type { MapWorldKind } from "@/lib/map/map-worlds-schema";
import { BLOOD, BONE, GOLD, ICE, dustScatter } from "./chart-geometry";

/** Kind icon, small — planets stay planets (Runde 2). */
export function Glyph({ kind, s }: { kind: MapWorldKind; s: number }) {
  switch (kind) {
    case "chaos-warp": {
      // eight-rayed chaos star
      const rays = Array.from({ length: 8 }, (_, i) => {
        const a = (Math.PI * i) / 4;
        const l = i % 2 === 0 ? s : s * 0.55;
        return { x: Math.cos(a) * l, y: Math.sin(a) * l };
      });
      return (
        <g className="glyph">
          {rays.map((r, i) => (
            <line key={i} x1={0} y1={0} x2={r.x} y2={r.y} stroke={BLOOD} strokeWidth={0.9} />
          ))}
          <circle r={s * 0.28} fill={BLOOD} />
        </g>
      );
    }
    case "dead":
      return (
        <g className="glyph">
          <line x1={-s} y1={-s} x2={s} y2={s} stroke={BONE} strokeWidth={1.1} strokeOpacity={0.8} />
          <line x1={-s} y1={s} x2={s} y2={-s} stroke={BONE} strokeWidth={1.1} strokeOpacity={0.8} />
        </g>
      );
    case "imperial-military":
      return (
        <g className="glyph">
          <circle r={s * 0.55} fill={BONE} />
          <circle r={s + 1.2} fill="none" stroke={GOLD} strokeWidth={0.8} />
        </g>
      );
    case "station":
      return (
        <g className="glyph">
          <rect x={-s * 0.85} y={-s * 0.85} width={s * 1.7} height={s * 1.7} fill="none" stroke={GOLD} strokeWidth={0.9} />
          <circle r={0.8} fill={GOLD} fillOpacity={0.8} />
        </g>
      );
    case "fleet":
      return (
        <g className="glyph">
          <path d={`M 0 ${-s * 1.1} L ${s} ${s} L 0 ${s * 0.45} L ${-s} ${s} Z`} fill="none" stroke={GOLD} strokeWidth={0.9} />
        </g>
      );
    case "gate":
      return (
        <g className="glyph">
          <rect x={-s * 0.8} y={-s * 0.8} width={s * 1.6} height={s * 1.6} fill="none" stroke={GOLD} strokeWidth={0.9} transform="rotate(45)" />
          <circle r={0.7} fill={GOLD} fillOpacity={0.8} />
        </g>
      );
    case "necron":
      return (
        <g className="glyph">
          <circle r={s * 0.85} fill="none" stroke={ICE} strokeWidth={0.8} strokeOpacity={0.65} />
          <line x1={0} y1={-s} x2={0} y2={s} stroke={ICE} strokeWidth={0.8} strokeOpacity={0.65} />
        </g>
      );
    case "aeldari":
      return (
        <g className="glyph">
          <ellipse rx={s * 0.55} ry={s * 1.15} fill="none" stroke={ICE} strokeWidth={0.8} strokeOpacity={0.65} transform="rotate(30)" />
          <circle r={0.6} fill={ICE} fillOpacity={0.5} />
        </g>
      );
    case "xenos":
      return (
        <g className="glyph">
          <path d={`M 0 ${s} L ${s} ${-s} L ${-s} ${-s} Z`} fill="none" stroke={ICE} strokeWidth={0.9} strokeOpacity={0.65} />
          <circle r={0.6} fill={ICE} fillOpacity={0.5} />
        </g>
      );
    default:
      return (
        <g className="glyph">
          <circle r={s * 0.85} fill={BONE} fillOpacity={kind === "unclassified" ? 0.62 : 0.92} />
        </g>
      );
  }
}

export function pinSize(n: number): number {
  return 2.2 + Math.min(3.6, Math.log2(1 + n));
}

export function labelTier(n: number): 0 | 1 | 2 {
  return n >= 15 ? 0 : n >= 4 ? 1 : 2;
}

/* ── Star-dust: 900 unrecorded worlds, grouped per classification so the
   census can veil them without touching individual nodes. Every dot is a
   real catalog contact (Session-Nachtrag 178): data-pin makes it clickable,
   the transparent halo gives it a tappable hit area, the t2 label surfaces
   its name at deep zoom / on hover. ─────────────────────────────────────── */

interface DustLayerProps {
  payload: MapPayload;
  hiddenCls: ReadonlySet<number>;
  dustOff: boolean;
  worksOnly: boolean;
}

export const DustLayer = memo(function DustLayer({ payload, hiddenCls, dustOff, worksOnly }: DustLayerProps) {
  // Scatter is deterministic over the catalog order (same LCG stream as the
  // reviewed study), computed once and then grouped.
  const groups = useMemo(() => {
    const looks = dustScatter(payload.dust.length);
    const byCls = new Map<number, { id: string; name: string; x: number; y: number; r: number; op: number }[]>();
    payload.dust.forEach(([gx, gy, ci, id, name], i) => {
      const arr = byCls.get(ci) ?? [];
      arr.push({ id, name, x: gx, y: gy, r: looks[i].r, op: looks[i].op });
      byCls.set(ci, arr);
    });
    return [...byCls.entries()];
  }, [payload]);

  return (
    <g className="cg-dust">
      {groups.map(([ci, arr]) => (
        <g
          key={ci}
          data-dust={ci}
          style={{ display: worksOnly || dustOff || hiddenCls.has(ci) ? "none" : undefined }}
        >
          {arr.map((d) => (
            <g key={d.id} className="cg-w dust" data-pin={d.id} transform={`translate(${d.x} ${d.y})`}>
              <g className="cg-pi">
                <circle className="halo" r={9} />
                <circle className="glyph" r={d.r.toFixed(2)} fill={BONE} fillOpacity={d.op.toFixed(2)} />
              </g>
              <text className="cg-lbl t2 dust">{d.name}</text>
            </g>
          ))}
        </g>
      ))}
    </g>
  );
});

/* ── Work pins: 141 featured worlds with kind glyph + label tier ────────── */

interface PinLayerProps {
  featured: FeaturedWorld[];
  hiddenCls: ReadonlySet<number>;
  vbCut: number;
  /** Station names of the active course (kept bright + labeled). */
  hiNames: ReadonlySet<string> | null;
  selectedId: string | null;
}

export const PinLayer = memo(function PinLayer({ featured, hiddenCls, vbCut, hiNames, selectedId }: PinLayerProps) {
  return (
    <g className="cg-pins">
      {featured.map((f) => {
        if (f.kind === "region") return null;
        const tier = labelTier(f.n);
        const cls =
          "cg-w" +
          (f.n <= vbCut ? " vb1" : "") +
          (hiNames?.has(f.name) ? " rt-hi" : "") +
          (selectedId === f.id ? " sel-on" : "");
        return (
          <g
            key={f.id}
            className={cls}
            data-pin={f.id}
            transform={`translate(${f.gx} ${f.gy})`}
            style={{ display: hiddenCls.has(f.c) ? "none" : undefined }}
          >
            <g className="cg-pi">
              <circle className="halo" r={13} />
              <Glyph kind={f.kind} s={pinSize(f.n)} />
            </g>
            <text className={`cg-lbl t${tier}${tier === 0 ? " big" : ""}`}>{f.name}</text>
          </g>
        );
      })}
    </g>
  );
});

/* ── Region pins: area typography, clickable when they carry works ──────── */

interface RegionLabelsProps {
  regions: RegionPin[];
  featured: FeaturedWorld[];
}

export const RegionLabels = memo(function RegionLabels({ regions, featured }: RegionLabelsProps) {
  return (
    <g className="cg-regions">
      {regions.map((r) => (
        <text
          key={r.name}
          className="cg-rgn"
          x={r.gx}
          y={r.gy}
          data-pin={r.fi >= 0 ? featured[r.fi].id : undefined}
        >
          {r.name.toUpperCase()}
        </text>
      ))}
    </g>
  );
});
