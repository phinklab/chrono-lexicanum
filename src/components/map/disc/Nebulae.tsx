"use client";

// Nebulae — organic blooms (stacked offset radial gradients). Warp nebulae
// add a dashed exclusion perimeter + cluster of X interdiction marks. The
// glitch flicker is gated off while a Segmentum is open; otherwise the
// persistent SMIL opacity changes read like viewport flicker on Windows/Chrome.

import { polar, inSegment } from "@/lib/galaxy/coords";
import type { Nebula, Segmentum, SegmentumId, Theme } from "@/lib/galaxy/types";

interface NebulaePuffs {
  dx: number;
  dy: number;
  r: number;
  rx: number;
  ry: number;
  rot: number;
  op: number;
}

interface NebulaeXCluster {
  dx: number;
  dy: number;
  scale: number;
  flickerBegin: number;
  flickerDur: number;
  op: number;
}

interface NebulaeProps {
  theme: Theme;
  nebulae: readonly Nebula[];
  segments: readonly Segmentum[];
  dived: boolean;
  divedSeg: SegmentumId | null;
  animsOn: boolean;
}

export default function Nebulae({ theme, nebulae, segments, dived, divedSeg, animsOn }: NebulaeProps) {
  const t = theme;
  const divedSegObj = divedSeg ? segments.find((s) => s.id === divedSeg) : undefined;
  return (
    <g>
      {nebulae
        .filter((n) => !n.isRift)
        .map((n, i) => {
          if (n.r === undefined || n.a === undefined || n.size === undefined) return null;
          const [cx, cy] = polar(n.r, n.a);
          const isWarp = n.type === "warp";
          const inDivedSeg = divedSegObj ? inSegment(n.r, n.a, divedSegObj) : true;
          const visible = !dived || inDivedSeg;
          let seed = (n.name.charCodeAt(0) + n.name.charCodeAt(1)) % 17;
          const rnd = () => {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
          };
          const sz = n.size;
          const puffCount = 5 + Math.floor(rnd() * 3);
          const puffs: NebulaePuffs[] = Array.from({ length: puffCount }, () => {
            const ang = rnd() * Math.PI * 2;
            const dist = rnd() * sz * 0.55;
            return {
              dx: Math.cos(ang) * dist,
              dy: Math.sin(ang) * dist,
              r: sz * (0.55 + rnd() * 0.6),
              rx: 0.8 + rnd() * 0.5,
              ry: 0.8 + rnd() * 0.5,
              rot: rnd() * 360,
              op: 0.18 + rnd() * 0.22,
            };
          });
          const grad = isWarp ? "url(#mapNebWarp)" : "url(#mapNebForb)";
          const interdictionR = Math.min(sz * 0.7, 1.7);
          let xCluster: NebulaeXCluster[] | null = null;
          if (isWarp) {
            const xCount = 4 + Math.floor(rnd() * 3) + Math.floor(sz / 2.2);
            xCluster = [];
            for (let k = 0; k < xCount; k++) {
              const ang = rnd() * Math.PI * 2;
              const distR = Math.sqrt(0.05 + rnd() * 0.85) * (interdictionR - 0.18);
              xCluster.push({
                dx: Math.cos(ang) * distR,
                dy: Math.sin(ang) * distR,
                scale: 0.26 + rnd() * 0.08,
                flickerBegin: rnd() * 7,
                flickerDur: 5 + rnd() * 4,
                op: 0.72 + rnd() * 0.18,
              });
            }
          }
          return (
            <g key={i} opacity={visible ? 1 : 0} style={{ transition: "opacity .8s" }}>
              <ellipse
                cx={cx}
                cy={cy}
                rx={sz * 2.4}
                ry={sz * 2.0}
                fill={grad}
                opacity="0.18"
                transform={`rotate(${(seed * 17) % 60} ${cx} ${cy})`}
              />
              {puffs.map((p, j) => (
                <ellipse
                  key={j}
                  cx={cx + p.dx}
                  cy={cy + p.dy}
                  rx={p.r * p.rx}
                  ry={p.r * p.ry}
                  fill={grad}
                  opacity={p.op}
                  transform={`rotate(${p.rot} ${cx + p.dx} ${cy + p.dy})`}
                />
              ))}
              <circle cx={cx} cy={cy} r={sz * 0.75} fill={grad} opacity="0.55" />
              {isWarp && xCluster && (
                <g>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={interdictionR}
                    fill="none"
                    stroke={t.danger}
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                    strokeDasharray="2 2.4"
                    opacity="0.55"
                  />
                  {xCluster.map((x, j) => (
                    <g
                      key={j}
                      transform={`translate(${cx + x.dx} ${cy + x.dy}) scale(${x.scale})`}
                      opacity={x.op}
                    >
                      <g stroke={t.danger} strokeWidth="0.14" vectorEffect="non-scaling-stroke">
                        <line x1="-0.45" y1="-0.45" x2="0.45" y2="0.45" />
                        <line x1="-0.45" y1="0.45" x2="0.45" y2="-0.45" />
                        {animsOn && (
                          <animate
                            attributeName="opacity"
                            values="1;1;0.1;1;1;0.45;1;1"
                            keyTimes="0;0.2;0.21;0.22;0.5;0.51;0.52;1"
                            dur={`${x.flickerDur}s`}
                            begin={`${x.flickerBegin}s`}
                            repeatCount="indefinite"
                          />
                        )}
                      </g>
                    </g>
                  ))}
                </g>
              )}
            </g>
          );
        })}
    </g>
  );
}
