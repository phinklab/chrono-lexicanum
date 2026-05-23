/**
 * MainAuspex — the big rotating HUD disc. Concentric rings, tick ring,
 * counter-rotating mid ring, cardinal axes, bearing labels, sector
 * wedges, central node, blips, sweep arm.
 *
 * Pure SVG + CSS keyframes. Server component — no state, no hooks.
 * Reduced-motion is handled globally in globals.css.
 */

type MainAuspexProps = {
  size?: number;
  accent?: string;
  spinDur?: number;
  spinRevDur?: number;
  sweepDur?: number;
};

function describeArc(r: number, a0: number, a1: number) {
  const toXY = (a: number) => {
    const rad = ((a - 90) * Math.PI) / 180;
    return [r * Math.cos(rad), r * Math.sin(rad)] as const;
  };
  const [x0, y0] = toXY(a0);
  const [x1, y1] = toXY(a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

export default function MainAuspex({
  size = 480,
  accent = "var(--cl-cyan)",
  spinDur = 80,
  spinRevDur = 110,
  sweepDur = 10,
}: MainAuspexProps) {
  const r = size / 2;
  const uid = `ma-${size}-${spinDur}`;
  const ticks = Array.from({ length: 72 });
  const dotsCount = Array.from({ length: 16 });
  const blips: Array<[number, number]> = [
    [130, -50],
    [80, 90],
    [-150, 60],
    [-100, -130],
    [180, -90],
    [40, 160],
    [-180, 140],
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`-${r} -${r} ${size} ${size}`}
      style={{ display: "block", overflow: "visible" }}
      aria-hidden
    >
      <defs>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.22" />
          <stop offset="55%" stopColor={accent} stopOpacity="0.06" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id={`${uid}-sweep`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={accent} stopOpacity="0" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.85" />
        </linearGradient>
      </defs>

      <circle r={r - 4} fill={`url(#${uid}-glow)`} />

      <g
        style={{
          transformOrigin: "center",
          animation: `chronoSpin ${spinDur}s linear infinite`,
        }}
      >
        <circle r={r * 0.96} fill="none" stroke={accent} strokeOpacity="0.55" strokeWidth="0.5" />
        {ticks.map((_, i) => {
          const a = ((i * 5 - 90) * Math.PI) / 180;
          const long = i % 6 === 0;
          const r1 = r * 0.92;
          const r2 = r * (long ? 0.98 : 0.94);
          return (
            <line
              key={i}
              x1={Math.cos(a) * r1}
              y1={Math.sin(a) * r1}
              x2={Math.cos(a) * r2}
              y2={Math.sin(a) * r2}
              stroke={accent}
              strokeOpacity={long ? 0.95 : 0.55}
              strokeWidth={long ? 1 : 0.5}
            />
          );
        })}
      </g>

      {[0.3, 0.5, 0.72, 0.88].map((f, i) => (
        <circle
          key={i}
          r={r * f}
          fill="none"
          stroke={accent}
          strokeOpacity={i === 0 ? 0.85 : 0.32}
          strokeWidth={i === 0 ? 1.2 : 0.5}
          strokeDasharray={i === 2 ? "2 6" : "none"}
        />
      ))}

      <g
        style={{
          transformOrigin: "center",
          animation: `chronoSpinRev ${spinRevDur}s linear infinite`,
        }}
      >
        <circle r={r * 0.62} fill="none" stroke={accent} strokeOpacity="0.32" strokeWidth="0.4" />
        {dotsCount.map((_, i) => {
          const a = (i / 16) * Math.PI * 2;
          return (
            <circle
              key={i}
              cx={Math.cos(a) * r * 0.62}
              cy={Math.sin(a) * r * 0.62}
              r="1.8"
              fill={accent}
              opacity="0.75"
            />
          );
        })}
      </g>

      {[0, 90, 180, 270].map((a) => {
        const rad = ((a - 90) * Math.PI) / 180;
        return (
          <line
            key={a}
            x1={Math.cos(rad) * r * 0.3}
            y1={Math.sin(rad) * r * 0.3}
            x2={Math.cos(rad) * r * 0.88}
            y2={Math.sin(rad) * r * 0.88}
            stroke={accent}
            strokeOpacity="0.32"
            strokeWidth="0.6"
          />
        );
      })}

      {(["000", "090", "180", "270"] as const).map((t, i) => {
        const a = [0, 90, 180, 270][i];
        const rad = ((a - 90) * Math.PI) / 180;
        const x = Math.cos(rad) * r * 1.02;
        const y = Math.sin(rad) * r * 1.02;
        return (
          <text
            key={t}
            x={x}
            y={y}
            fill={accent}
            fontFamily="var(--font-plex-mono)"
            fontSize="10"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            ·{t}
          </text>
        );
      })}

      <path d={describeArc(r * 0.88, -55, -25)} fill="none" stroke={accent} strokeWidth="1.5" />
      <path
        d={describeArc(r * 0.88, 155, 195)}
        fill="none"
        stroke={accent}
        strokeWidth="1.2"
        opacity="0.5"
      />

      <circle r="46" fill="none" stroke={accent} strokeWidth="1" opacity="0.8" />
      <circle r="46" fill={accent} fillOpacity="0.04" />

      {blips.map(([x, y], i) => (
        <g key={i}>
          <circle
            cx={x}
            cy={y}
            r="2.6"
            fill={accent}
            className={i % 2 ? "c-blink" : "c-twinkle"}
          />
          <circle
            cx={x}
            cy={y}
            r="8"
            fill="none"
            stroke={accent}
            strokeOpacity="0.45"
            strokeWidth="0.6"
          />
        </g>
      ))}

      <g
        style={{
          transformOrigin: "0 0",
          animation: `chronoSweep ${sweepDur}s linear infinite`,
        }}
      >
        <line
          x1="0"
          y1="0"
          x2={r * 0.88}
          y2="0"
          stroke={`url(#${uid}-sweep)`}
          strokeWidth="1.8"
        />
      </g>
    </svg>
  );
}
