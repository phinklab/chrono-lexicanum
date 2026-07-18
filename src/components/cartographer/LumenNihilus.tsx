/**
 * LumenNihilus — the two chart instruments:
 * Lumen Astronomican (Terra's light, devoured by the warp — a soft mask
 * cuts the disc at the storm band, beyond lies blackness) and the Imperium
 * Nihilus shade. Shadow edges run as RAYS from Terra through both band ends
 * and close on a far circle r=2600 — no overlay edge ever pans into view.
 *
 * The band spines (RIFT_D / nihilusPath / ruinstormShadow) are derived in
 * chart-geometry.ts from the hand-drawn zones, so the shadows follow
 * wherever the zone editor moves them.
 *
 * Chart editions: on "now" the Cicatrix cuts the light and everything east
 * of the rift lies dark; on "hh" the Ruinstorm wall does the same for the
 * galactic east (the Imperium Secundus premise); on "pre" the Lumen stands
 * whole. The devoured-light labels and the Nihilus shade group remain
 * instruments of the present chart only (the Nihilus toggle is disabled
 * off-"now").
 *
 * Both groups mount hidden; `svg.lumen` / `svg.nihilus` display them (CSS).
 */

import { memo } from "react";

import type { MapState } from "@/lib/map/zones";

import { GOLD, RIFT_D, TX, TY, nihilusPath, ruinstormShadow } from "./chart-geometry";

/* Light radius in grid units. Terra→Macragge is ≈608.7 gu (the lore pegs the
   Astronomican's reach at ~70,000 ly, roughly Macragge's distance); 618 puts
   the fade terminus just past Macragge without the rim ring striking the pin. */
const LR = 618;
const REGION = { x: -2400, y: -2350, width: 5600, height: 5500 };

/* Rim label rides just inside the light's edge (bearing ≈34.6° SE of Terra,
   same as the original hand placement) — tracks LR automatically. */
const LBL_R = LR - 25;
const LBL_X = TX + 0.823 * LBL_R;
const LBL_Y = TY + 0.568 * LBL_R;

export const LumenNihilus = memo(function LumenNihilus({ era }: { era: MapState }) {
  const rift = era === "now";
  const nihilusD = nihilusPath();
  // The band that intercepts the light on this edition (null = whole disc).
  const cut =
    era === "now"
      ? { spineD: RIFT_D, shadowD: nihilusD }
      : era === "hh"
        ? ruinstormShadow()
        : null;
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
          <stop offset="0%" stopColor={GOLD} stopOpacity={0.26} />
          <stop offset="45%" stopColor={GOLD} stopOpacity={0.13} />
          <stop offset="80%" stopColor={GOLD} stopOpacity={0.05} />
          <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
        </radialGradient>
        {/* Blur region tied to user space — the Nihilus face is huge (far
            circle), percentage regions would blur the wrong extent. */}
        <filter id="cg-lmBlur" filterUnits="userSpaceOnUse" {...REGION}>
          <feGaussianBlur stdDeviation={7} />
        </filter>
        <mask id="cg-lmMask" maskUnits="userSpaceOnUse" {...REGION}>
          <rect {...REGION} fill="#fff" />
          {cut && (
            <>
              <path d={cut.shadowD} fill="#000" filter="url(#cg-lmBlur)" />
              <path d={cut.spineD} fill="none" stroke="#000" strokeWidth={30} strokeLinecap="round" filter="url(#cg-lmBlur)" />
            </>
          )}
        </mask>
      </defs>

      <g id="cg-lumenG">
        <rect className="lm-veil" {...REGION} fill="url(#cg-lmVeil)" />
        {/* Beyond the band the warp eats the light — blackness */}
        {cut && <path className="lm-dark" d={cut.shadowD} fill="#010002" fillOpacity={0.5} />}
        <g className="lm-grow" mask="url(#cg-lmMask)">
          <circle cx={TX} cy={TY} r={LR} fill="url(#cg-lmLight)" />
          <circle className="lm-rim" cx={TX} cy={TY} r={LR} fill="none" stroke={GOLD} strokeOpacity={0.32} strokeDasharray="1 6" vectorEffect="non-scaling-stroke" />
        </g>
        <text className="cg-lm-lbl" x={LBL_X} y={LBL_Y} fontSize={7} textAnchor="middle" fillOpacity={0.5}>
          FINIS LUCIS ASTRONOMICI
        </text>
        <text className="cg-lm-lbl" x={LBL_X} y={LBL_Y + 10} fontSize={5.5} textAnchor="middle" fillOpacity={0.35}>
          BEYOND: THE BLIND VOID
        </text>
        {rift && (
          <>
            <text className="cg-lm-lbl dev" x={690} y={322} fontSize={7} textAnchor="middle" fillOpacity={0.5}>
              LUX DEVORATA
            </text>
            <text className="cg-lm-lbl dev" x={690} y={332} fontSize={5.5} textAnchor="middle" fillOpacity={0.35}>
              THE WARP DEVOURS THE LIGHT
            </text>
          </>
        )}
      </g>

      {rift && (
        <g id="cg-nihilusG">
          <defs>
            {/* Terra-centred falloff: plateau over the charted dark half,
                gone shortly past the segmentum silhouette (Obscurus edge
                r≈391–430, Ultima out to r≈668) — the shade must not run to
                the far circle. */}
            <radialGradient id="cg-nhG" gradientUnits="userSpaceOnUse" cx={TX} cy={TY} r={820}>
              <stop offset="0%" stopColor="#281442" stopOpacity={0.34} />
              <stop offset="62%" stopColor="#281442" stopOpacity={0.34} />
              <stop offset="80%" stopColor="#281442" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#281442" stopOpacity={0} />
            </radialGradient>
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
      )}
    </g>
  );
});
