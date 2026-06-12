/**
 * FloatingCoord — a coordinate / sector label that rises and fades on a
 * loop. Pure CSS animation (`chronoRiseFade`). Server component.
 *
 * The animation already fades to opacity 0, so the wrapping span's
 * static opacity sets the peak; we use it as the target value.
 */

type FloatingCoordProps = {
  x: number | string;
  y: number | string;
  label: string;
  delay?: number;
  lifetime?: number;
  color?: string;
  opacity?: number;
};

export default function FloatingCoord({
  x,
  y,
  label,
  delay = 0,
  lifetime = 5,
  color = "var(--cl-gold)",
  opacity = 0.5,
}: FloatingCoordProps) {
  return (
    <div
      className="chrono-ambient"
      style={{
        position: "absolute",
        left: x,
        top: y,
        fontFamily: "var(--font-plex-mono)",
        textTransform: "uppercase",
        fontSize: 10,
        color,
        opacity: 0,
        letterSpacing: "0.24em",
        textShadow: "0 1px 4px rgba(0,0,0,0.9)",
        animation: `chronoRiseFade ${lifetime}s ${delay}s ease-in-out infinite`,
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}
      aria-hidden
    >
      <span style={{ opacity }}>{label}</span>
    </div>
  );
}
