import type { ResolvedVoyageArm, ResolvedVoyageArmTarget } from "@/lib/map/voyages";

interface StrategicReadoutProps {
  arm?: ResolvedVoyageArm | null;
  target?: ResolvedVoyageArmTarget | null;
  color?: string;
  routeVisible?: boolean;
  onRouteToggle?: () => void;
}

export default function StrategicReadout({
  arm = null,
  target = null,
  color,
  routeVisible,
  onRouteToggle,
}: StrategicReadoutProps) {
  if (!arm && !target) return null;

  const source = arm?.source ?? target?.source;
  return (
    <div aria-live="polite">
      <p className="cg-tour-section" style={{ color: color ?? "var(--cl-gold)" }}>
        {arm?.role ?? "STRATEGIC DESTINATION"}
      </p>
      <p className="cg-tour-name">
        {arm
          ? `Legion ${arm.legion} · ${arm.name} → ${arm.targetName}`
          : `${target?.name} · Legions ${target?.legionIds.join(" · ")}`}
      </p>
      <p className="ct">{arm?.text ?? target?.text}</p>
      <div className="cg-strategic-actions">
        {source && (
          <a className="cpg" href={source} target="_blank" rel="noreferrer">
            SOURCE ↗
          </a>
        )}
        {arm && onRouteToggle && routeVisible !== undefined && (
          <button
            type="button"
            className="cpg cg-arm-visibility"
            aria-pressed={routeVisible}
            onClick={onRouteToggle}
          >
            {routeVisible ? "HIDE ROUTE" : "SHOW ROUTE"}
          </button>
        )}
      </div>
    </div>
  );
}
