/**
 * CornerAuspex — a smaller, well-defined HUD disc with corner brackets
 * and a label, for sidebar / inspector slots. Higher contrast than the
 * photo-overlay sweep so the user sees the rotating HUD clearly.
 *
 * Pure SVG + CSS keyframes. Server component.
 */

type CornerAuspexProps = {
  size?: number;
  accent?: string;
  label?: string;
};

export default function CornerAuspex({
  size = 220,
  accent = "var(--cl-cyan)",
  label = "AUSPEX · 1011",
}: CornerAuspexProps) {
  const r = size / 2;
  const uid = `ca-${size}-${label.replace(/\W/g, "")}`;
  const ticks = Array.from({ length: 60 });
  const dotsCount = Array.from({ length: 12 });
  const corners: Array<{ key: string; style: React.CSSProperties }> = [];
  for (const c of ["tl", "tr", "bl", "br"]) {
    const top = c[0] === "t" ? -4 : undefined;
    const bottom = c[0] === "b" ? -4 : undefined;
    const left = c[1] === "l" ? -4 : undefined;
    const right = c[1] === "r" ? -4 : undefined;
    const bw = `${c[0] === "t" ? 1 : 0}px ${c[1] === "r" ? 1 : 0}px ${
      c[0] === "b" ? 1 : 0
    }px ${c[1] === "l" ? 1 : 0}px`;
    corners.push({
      key: c,
      style: {
        position: "absolute",
        width: 10,
        height: 10,
        top,
        bottom,
        left,
        right,
        borderColor: accent,
        borderStyle: "solid",
        borderWidth: bw,
      },
    });
  }

  const blips: Array<[number, number]> = [
    [60, -20],
    [35, 40],
    [-70, 28],
    [-45, -55],
    [80, -40],
    [18, 72],
  ];

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`-${r} -${r} ${size} ${size}`}
        style={{ display: "block" }}
        aria-hidden
      >
        <defs>
          <linearGradient id={`${uid}-sweep`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={accent} stopOpacity="0" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.9" />
          </linearGradient>
          <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.2" />
            <stop offset="65%" stopColor={accent} stopOpacity="0.05" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        <circle r={r - 2} fill={`url(#${uid}-glow)`} />

        <g
          style={{
            transformOrigin: "center",
            animation: "chronoSpin 60s linear infinite",
          }}
        >
          <circle r={r * 0.96} fill="none" stroke={accent} strokeOpacity="0.5" strokeWidth="0.6" />
          {ticks.map((_, i) => {
            const a = ((i * 6 - 90) * Math.PI) / 180;
            const long = i % 5 === 0;
            const r1 = r * 0.9;
            const r2 = r * (long ? 0.97 : 0.93);
            return (
              <line
                key={i}
                x1={Math.cos(a) * r1}
                y1={Math.sin(a) * r1}
                x2={Math.cos(a) * r2}
                y2={Math.sin(a) * r2}
                stroke={accent}
                strokeOpacity={long ? 0.9 : 0.5}
                strokeWidth={long ? 0.9 : 0.4}
              />
            );
          })}
        </g>

        {[0.34, 0.54, 0.74, 0.88].map((f, i) => (
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
            animation: "chronoSpinRev 95s linear infinite",
          }}
        >
          {dotsCount.map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return (
              <circle
                key={i}
                cx={Math.cos(a) * r * 0.62}
                cy={Math.sin(a) * r * 0.62}
                r="1.6"
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
              x1={Math.cos(rad) * r * 0.34}
              y1={Math.sin(rad) * r * 0.34}
              x2={Math.cos(rad) * r * 0.88}
              y2={Math.sin(rad) * r * 0.88}
              stroke={accent}
              strokeOpacity="0.35"
              strokeWidth="0.5"
            />
          );
        })}

        {/* sector wedge highlight */}
        {(() => {
          const r0 = r * 0.88;
          const rad = (a: number) => ((a - 90) * Math.PI) / 180;
          const [x0, y0] = [Math.cos(rad(-55)) * r0, Math.sin(rad(-55)) * r0];
          const [x1, y1] = [Math.cos(rad(-25)) * r0, Math.sin(rad(-25)) * r0];
          return (
            <path
              d={`M ${x0} ${y0} A ${r0} ${r0} 0 0 1 ${x1} ${y1}`}
              fill="none"
              stroke={accent}
              strokeWidth="1.5"
            />
          );
        })()}

        {(["000", "090", "180", "270"] as const).map((t, i) => {
          const a = [0, 90, 180, 270][i];
          const rad = ((a - 90) * Math.PI) / 180;
          const x = Math.cos(rad) * r * 1.04;
          const y = Math.sin(rad) * r * 1.04;
          return (
            <text
              key={t}
              x={x}
              y={y}
              fill={accent}
              fontFamily="var(--font-plex-mono)"
              fontSize="9"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              ·{t}
            </text>
          );
        })}

        {blips.map(([x, y], i) => (
          <g key={i}>
            <circle
              cx={x}
              cy={y}
              r="2"
              fill={accent}
              className={i % 2 ? "c-twinkle" : ""}
            />
            <circle
              cx={x}
              cy={y}
              r="6"
              fill="none"
              stroke={accent}
              strokeOpacity="0.45"
              strokeWidth="0.5"
            />
          </g>
        ))}

        <circle r="22" fill="none" stroke={accent} strokeWidth="0.8" opacity="0.7" />
        <circle r="22" fill={accent} fillOpacity="0.04" />
        <circle r="3" fill={accent} />
        <circle r="9" fill="none" stroke={accent} strokeWidth="0.7" className="c-pulse" />

        <g
          style={{
            transformOrigin: "0 0",
            animation: "chronoSweep 9s linear infinite",
          }}
        >
          <line
            x1="0"
            y1="0"
            x2={r * 0.88}
            y2="0"
            stroke={`url(#${uid}-sweep)`}
            strokeWidth="1.6"
          />
        </g>
      </svg>

      {corners.map((c) => (
        <div key={c.key} style={c.style} />
      ))}

      <div
        style={{
          position: "absolute",
          bottom: -22,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: "var(--font-plex-mono)",
          fontSize: 9,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: accent,
          opacity: 0.75,
        }}
      >
        {label}
      </div>
    </div>
  );
}
