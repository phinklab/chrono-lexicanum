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
    <div
      className="cg-tour-strategic"
      style={{ borderColor: color ?? "var(--cl-gold)" }}
      aria-live="polite"
    >
      <div className="cg-tour-strategic-head">
        <span>{arm?.role ?? "STRATEGIC DESTINATION"}</span>
        <span>
          {arm
            ? `LEGION ${arm.legion} · ${arm.name} → ${arm.targetName}`
            : `${target?.name} · LEGIONS ${target?.legionIds.join(" · ")}`}
        </span>
      </div>
      <p>{arm?.text ?? target?.text}</p>
      {target?.placement && (
        <p className="cg-tour-strategic-placement">
          {target.placement.precision === "relative"
            ? "INFERRED PLACEMENT"
            : "SCHEMATIC PLACEMENT"}
          {" · "}
          {target.placement.note}
        </p>
      )}
      {source && (
        <a href={source} target="_blank" rel="noreferrer">
          SOURCE ↗
        </a>
      )}
    </div>
  );
}
