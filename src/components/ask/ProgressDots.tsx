/**
 * ProgressDots — bar-indicator strip in the Ask bottom-nav. Active step is a
 * wide cyan-glowing bar, inactive steps are faint pills, followed by an
 * "01 / 03" mono counter. Per handoff §7.6.
 */

type ProgressDotsProps = {
  step: number;
  total: number;
};

export default function ProgressDots({ step, total }: ProgressDotsProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === step ? 28 : 10,
            height: 4,
            background: i <= step ? "var(--cl-cyan)" : "var(--cl-faint)",
            boxShadow: i === step ? "0 0 8px var(--cl-cyan)" : "none",
            transition: "all 0.35s",
          }}
        />
      ))}
      <span
        style={{
          fontFamily: "var(--font-plex-mono)",
          fontSize: 10,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "var(--cl-dim)",
          marginLeft: 14,
        }}
      >
        {String(step + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>
    </div>
  );
}
