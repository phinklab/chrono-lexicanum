/**
 * LumenNihilus — the two chart instruments:
 * Lumen Astronomican (Terra's light, devoured by the rift — a soft mask
 * cuts the disc at the storm band, beyond lies blackness) and the Imperium
 * Nihilus shade. Shadow edges run as RAYS from Terra through both rift ends
 * and close on a far circle r=2600 — no overlay edge ever pans into view.
 *
 * The rift boundary itself (RIFT_D / nihilusPath) is derived in
 * chart-geometry.ts from the hand-drawn "Cicatrix Maledictum" zone, so the
 * shadow follows wherever the zone editor moves the rift.
 *
 * Both groups mount hidden; `svg.lumen` / `svg.nihilus` display them (CSS).
 */

import { memo } from "react";

import { GOLD, RIFT_D, TX, TY, nihilusPath } from "./chart-geometry";

const LR = 470;
const REGION = { x: -2400, y: -2350, width: 5600, height: 5500 };

export const LumenNihilus = memo(function LumenNihilus() {
  const nihilusD = nihilusPath();
  return (
    <g pointerEvents="none">
      <defs>
        <radialGradient id="cg-lmVeil" gradientUnits="userSpaceOnUse" cx={TX} cy={TY} r={LR * 1.36}>
          <stop offset="0%" stopColor="#020103" stopOpacity={0} />
          <stop offset="70%" stopColor="#020103" stopOpacity={0} />
          <stop offset="84%" stopColor="#020103" stopOpacity={0.32} />
          <stop offset="100%" stopColor="#020103" stopOpacity={0.52} />
        </radialGradient>
        <radialGradient id="cg-lmLight" gradientUnits="userSpaceOnUse" cx={TX} cy={TY} r={LR}>
          <stop offset="0%" stopColor={GOLD} stopOpacity={0.14} />
          <stop offset="55%" stopColor={GOLD} stopOpacity={0.06} />
          <stop offset="88%" stopColor={GOLD} stopOpacity={0.02} />
          <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
        </radialGradient>
        {/* Blur region tied to user space — the Nihilus face is huge (far
            circle), percentage regions would blur the wrong extent. */}
        <filter id="cg-lmBlur" filterUnits="userSpaceOnUse" {...REGION}>
          <feGaussianBlur stdDeviation={7} />
        </filter>
        <mask id="cg-lmMask" maskUnits="userSpaceOnUse" {...REGION}>
          <rect {...REGION} fill="#fff" />
          <path d={nihilusD} fill="#000" filter="url(#cg-lmBlur)" />
          <path d={RIFT_D} fill="none" stroke="#000" strokeWidth={30} strokeLinecap="round" filter="url(#cg-lmBlur)" />
        </mask>
      </defs>

      <g id="cg-lumenG">
        <rect className="lm-veil" {...REGION} fill="url(#cg-lmVeil)" />
        {/* Beyond the rift the warp eats the light — blackness */}
        <path className="lm-dark" d={nihilusD} fill="#010002" fillOpacity={0.5} />
        <g className="lm-grow" mask="url(#cg-lmMask)">
          <circle cx={TX} cy={TY} r={LR} fill="url(#cg-lmLight)" />
          <circle className="lm-rim" cx={TX} cy={TY} r={LR} fill="none" stroke={GOLD} strokeOpacity={0.32} strokeDasharray="1 6" vectorEffect="non-scaling-stroke" />
        </g>
        <text className="cg-lm-lbl" x={700} y={655} fontSize={7} textAnchor="middle" fillOpacity={0.5}>
          FINIS LUCIS ASTRONOMICI
        </text>
        <text className="cg-lm-lbl" x={700} y={665} fontSize={5.5} textAnchor="middle" fillOpacity={0.35}>
          BEYOND: THE BLIND VOID
        </text>
        <text className="cg-lm-lbl dev" x={690} y={322} fontSize={7} textAnchor="middle" fillOpacity={0.5}>
          LUX DEVORATA
        </text>
        <text className="cg-lm-lbl dev" x={690} y={332} fontSize={5.5} textAnchor="middle" fillOpacity={0.35}>
          THE WARP DEVOURS THE LIGHT
        </text>
      </g>

      <g id="cg-nihilusG">
        <defs>
          <linearGradient id="cg-nhG" gradientUnits="userSpaceOnUse" x1={300} y1={500} x2={900} y2={0}>
            <stop offset="0%" stopColor="#281442" stopOpacity={0.14} />
            <stop offset="45%" stopColor="#281442" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#281442" stopOpacity={0.44} />
          </linearGradient>
        </defs>
        <path className="nh-shade" d={nihilusD} fill="url(#cg-nhG)" />
        <text className="cg-nh-lbl" x={760} y={118} fontSize={13} textAnchor="middle" fillOpacity={0.42}>
          IMPERIUM NIHILUS
        </text>
        <text className="cg-nh-lbl" x={760} y={132} fontSize={6.5} textAnchor="middle" fillOpacity={0.28}>
          THE DARK IMPERIUM · BEYOND THE RIFT
        </text>
        <text className="cg-nh-lbl sanctus" x={286} y={588} fontSize={10} textAnchor="middle" fillOpacity={0.3}>
          IMPERIUM SANCTUS
        </text>
      </g>
    </g>
  );
});
