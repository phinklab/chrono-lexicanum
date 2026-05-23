/**
 * ScanLine — a horizontal or vertical scan band that sweeps across the
 * parent. Used as an ambient HUD detail.
 *
 * Pure CSS animation. Server component.
 */

type ScanLineProps = {
  orient?: "v" | "h";
  period?: number;
  color?: string;
  opacity?: number;
};

export default function ScanLine({
  orient = "v",
  period = 8,
  color = "var(--cl-cyan)",
  opacity = 0.6,
}: ScanLineProps) {
  const isV = orient === "v";
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
      aria-hidden
    >
      <div
        style={{
          position: "absolute",
          left: isV ? 0 : "-50%",
          top: isV ? "-50%" : 0,
          width: isV ? "100%" : "50%",
          height: isV ? 60 : "100%",
          background: isV
            ? `linear-gradient(180deg, transparent, ${color} 50%, transparent)`
            : `linear-gradient(90deg, transparent, ${color} 50%, transparent)`,
          opacity,
          animation: `${isV ? "chronoScanV" : "chronoScanH"} ${period}s ${period * 0.5}s ease-in-out infinite`,
        }}
      />
    </div>
  );
}
