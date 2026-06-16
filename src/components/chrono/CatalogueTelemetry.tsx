import LiveTelemetry from "./LiveTelemetry";

/**
 * CatalogueTelemetry — the canonical LOAD/COGITATIO readout pair used by the
 * /archive catalogue + podcasts toolbars. One source of truth for the drift
 * bands so the surfaces stay in sync. (The /buecher + /atlas toolbars that also
 * used it were removed in Board 121-P11.)
 *
 * `/archive` passes `accent="gold"` to match the warm catalogue theme; cyan is
 * the neutral default.
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
