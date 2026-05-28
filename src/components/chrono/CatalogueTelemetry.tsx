import LiveTelemetry from "./LiveTelemetry";

/**
 * CatalogueTelemetry — the canonical LOAD/COGITATIO readout pair used by
 * archive surfaces (/buecher toolbar, /atlas hero, /atlas/werke toolbar).
 * One source of truth for the drift bands so the three sites stay in sync.
 *
 * Default accent is cyan (atlas surfaces). /buecher passes `accent="gold"`
 * to match the warm catalogue theme.
 */

type CatalogueTelemetryProps = {
  accent?: "cyan" | "gold";
};

export default function CatalogueTelemetry({ accent = "cyan" }: CatalogueTelemetryProps) {
  const color = accent === "gold" ? "var(--cl-gold)" : "var(--cl-cyan)";
  return (
    <>
      <LiveTelemetry
        label="LOAD"
        initial={87.3}
        min={84}
        max={92}
        unit="%"
        interval={1600}
        drift={0.04}
        color={color}
      />
      <LiveTelemetry
        label="COGITATIO"
        initial={1.024}
        min={0.9}
        max={1.2}
        unit=""
        interval={1900}
        drift={0.08}
        decimals={3}
        color={color}
      />
    </>
  );
}
