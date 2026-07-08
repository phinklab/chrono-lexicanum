/**
 * MainAuspex — the rotating HUD disc of the hero mastheads. Concentric rings
 * in a tight band (0.58–0.96 r), tick ring, counter-rotating dot ring,
 * cardinal axes with bearing labels, bearing arcs, spinning cogitator core,
 * five twinkling contacts. No sweep arm — a deliberate design constraint.
 *
 * Pure SVG + CSS keyframes. Server component — no state, no hooks.
 * Reduced-motion is stilled globally (10-base.css).
 */

type MainAuspexProps = {
  size?: number;
  accent?: string;
  spinDur?: number;
  spinRevDur?: number;
  coreDur?: number;
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
  size = 520,
  accent = "var(--cl-gold)",
  spinDur = 240,
  spinRevDur = 320,
  coreDur,
}: MainAuspexProps) {
  const r = size / 2;
  const ticks = Array.from({ length: 72 });
  const dots = Array.from({ length: 16 });
  const blips: Array<[number, number, number]> = [
    [0.34, -0.13, 0],
    [0.21, 0.24, 2.4],
    [-0.4, 0.16, 4.2],
    [0.46, -0.23, 6.1],
    [-0.27, -0.35, 7.7],
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`-${r} -${r} ${size} ${size}`}
      style={{ display: "block", overflow: "visible" }}
      aria-hidden
    >
      {/* Tick ring (spins forward) */}
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
          const r2 = r * (long ? 0.985 : 0.945);
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

      {/* Static rings — tight band */}
      {[0.58, 0.7, 0.81, 0.9].map((f, i) => (
        <circle
          key={i}
          r={r * f}
          fill="none"
          stroke={accent}
          strokeOpacity="0.32"
          strokeWidth="0.5"
          strokeDasharray={i === 2 ? "2 6" : "none"}
        />
      ))}

      {/* Dot ring (spins backward) */}
      <g
        style={{
          transformOrigin: "center",
          animation: `chronoSpinRev ${spinRevDur}s linear infinite`,
        }}
      >
        <circle r={r * 0.74} fill="none" stroke={accent} strokeOpacity="0.32" strokeWidth="0.4" />
        {dots.map((_, i) => {
          const a = (i / 16) * Math.PI * 2;
          return (
            <circle
              key={i}
              cx={Math.cos(a) * r * 0.74}
              cy={Math.sin(a) * r * 0.74}
              r="1.8"
              fill={accent}
              opacity="0.75"
            />
          );
        })}
      </g>

      {/* Cardinal axes + bearing labels */}
      {[0, 90, 180, 270].map((a) => {
        const rad = ((a - 90) * Math.PI) / 180;
        return (
          <line
            key={a}
            x1={Math.cos(rad) * r * 0.45}
            y1={Math.sin(rad) * r * 0.45}
            x2={Math.cos(rad) * r * 0.9}
            y2={Math.sin(rad) * r * 0.9}
            stroke={accent}
            strokeOpacity="0.32"
            strokeWidth="0.6"
          />
        );
      })}
      {(["000", "090", "180", "270"] as const).map((t, i) => {
        const a = [0, 90, 180, 270][i];
        const rad = ((a - 90) * Math.PI) / 180;
        return (
          <text
            key={t}
            x={Math.cos(rad) * r * 1.02}
            y={Math.sin(rad) * r * 1.02}
            fill={accent}
            fontFamily="var(--font-mono)"
            fontSize="10.5"
            textAnchor="middle"
            dominantBaseline="middle"
            opacity="0.8"
          >
            ·{t}
          </text>
        );
      })}

      {/* Bearing arcs on the 0.90 ring */}
      <path d={describeArc(r * 0.9, -55, -25)} fill="none" stroke={accent} strokeWidth="1.5" />
      <path
        d={describeArc(r * 0.9, 155, 195)}
        fill="none"
        stroke={accent}
        strokeWidth="1.2"
        opacity="0.5"
      />

      {/* Cogitator core (spins backward, faster) */}
      <g
        style={{
          transformOrigin: "center",
          animation: `chronoSpinRev ${coreDur ?? spinRevDur * 0.55}s linear infinite`,
        }}
      >
        <circle r={r * 0.175} fill="none" stroke={accent} strokeWidth="0.5" opacity="0.4" />
        <circle
          r={r * 0.115}
          fill="none"
          stroke={accent}
          strokeOpacity="0.3"
          strokeWidth="0.5"
          strokeDasharray="2 5"
        />
        {[45, 135, 225, 315].map((a) => {
          const rad = (a * Math.PI) / 180;
          return (
            <line
              key={a}
              x1={Math.cos(rad) * r * 0.085}
              y1={Math.sin(rad) * r * 0.085}
              x2={Math.cos(rad) * r * 0.175}
              y2={Math.sin(rad) * r * 0.175}
              stroke={accent}
              strokeOpacity="0.6"
              strokeWidth="0.8"
            />
          );
        })}
        <circle r="3" fill={accent} opacity="0.7" />
      </g>

      {/* Contacts in the open midfield, twinkling on a slow stagger */}
      {blips.map(([fx, fy, d], i) => (
        <g
          key={i}
          style={{
            animation: "blipTw 9s ease-in-out infinite",
            animationDelay: `${d}s`,
          }}
        >
          <circle cx={fx * r} cy={fy * r} r="2.6" fill={accent} />
          <circle
            cx={fx * r}
            cy={fy * r}
            r="8"
            fill="none"
            stroke={accent}
            strokeOpacity="0.45"
            strokeWidth="0.6"
          />
        </g>
      ))}
    </svg>
  );
}
