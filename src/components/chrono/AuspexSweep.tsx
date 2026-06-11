/**
 * AuspexSweep — a small sweep arm + hairline ring overlay. Designed to
 * sit over a photo's existing painted rings (vista.webp) to "activate"
 * them with a moving arm and a few blips.
 *
 * Pure SVG + CSS keyframes. Server component. The SVG fills its parent
 * via viewBox scaling; positioning is the parent's job.
 */

type AuspexSweepProps = {
  /** Conceptual radius in design units; sets the viewBox coordinate scale. */
  r?: number;
  accent?: string;
  blips?: boolean;
  sweepDuration?: number;
};

export default function AuspexSweep({
  r = 240,
  accent = "var(--cl-cyan)",
  blips = true,
  sweepDuration = 14,
}: AuspexSweepProps) {
  const dim = accent;
  const uid = `as-${r}`;
  const blipsList: Array<[number, number]> = [
    [0.55, -36],
    [0.42, 28],
    [0.72, -120],
    [0.62, 65],
    [0.85, 12],
    [0.5, 140],
  ];

  return (
    <svg
      style={{ display: "block", width: "100%", height: "100%", overflow: "visible" }}
      viewBox={`-${r} -${r} ${r * 2} ${r * 2}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${uid}-sweep`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={accent} stopOpacity="0" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.75" />
        </linearGradient>
      </defs>

      {/* No radial glow fill — filled washes over the photo read as a dim
          disc (maintainer fix 2026-06-11); the instrument is lines only. */}
      <circle r="3" fill={accent} />
      <circle r="10" fill="none" stroke={accent} strokeWidth="0.7" className="c-pulse" />
      <circle r="22" fill="none" stroke={dim} strokeOpacity="0.33" strokeWidth="0.5" />

      {[0.45, 0.65, 0.85].map((f, i) => (
        <circle
          key={i}
          r={r * f}
          fill="none"
          stroke={accent}
          strokeOpacity={i === 0 ? 0.55 : 0.28}
          strokeWidth={i === 0 ? 0.8 : 0.5}
          strokeDasharray={i === 2 ? "2 6" : "none"}
        />
      ))}

      <g
        style={{
          transformOrigin: "0 0",
          animation: `chronoSweep ${sweepDuration}s linear infinite`,
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

      {blips &&
        blipsList.map(([f, ang], i) => {
          const x = f * r * Math.cos((ang * Math.PI) / 180);
          const y = f * r * Math.sin((ang * Math.PI) / 180);
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="2.4"
                fill={accent}
                className={i % 2 ? "c-twinkle" : ""}
              />
              <circle
                cx={x}
                cy={y}
                r="7"
                fill="none"
                stroke={accent}
                strokeOpacity="0.45"
                strokeWidth="0.6"
              />
            </g>
          );
        })}
    </svg>
  );
}
