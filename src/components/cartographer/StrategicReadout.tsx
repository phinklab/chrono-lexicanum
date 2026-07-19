import type { ResolvedVoyageArm, ResolvedVoyageArmTarget } from "@/lib/map/voyages";

interface StrategicReadoutProps {
  arm?: ResolvedVoyageArm | null;
  target?: ResolvedVoyageArmTarget | null;
  color?: string;
}

export default function StrategicReadout({
  arm = null,
  target = null,
  color,
}: StrategicReadoutProps) {
  if (!arm && !target) return null;

  const source = arm?.source ?? target?.source;
  return (
    <div aria-live="polite">
      <p className="cg-tour-section" style={{ color: color ?? "var(--cl-gold)" }}>
        {arm?.role ?? "STRATEGIC DESTINATION"}
      </p>
      {/* No "Legion XX" prefix: the chapter heading above the readout
          already carries the numeral (WM-B1 review). */}
      <p className="cg-tour-name">
        {arm
          ? `${arm.name} → ${arm.targetName}`
          : `${target?.name} · Legions ${target?.legionIds.join(" · ")}`}
      </p>
      <p className="ct">{arm?.text ?? target?.text}</p>
      {source && (
        <div className="cg-strategic-actions">
          <a className="cpg" href={source} target="_blank" rel="noreferrer">
            SOURCE ↗
          </a>
        </div>
      )}
    </div>
  );
}
