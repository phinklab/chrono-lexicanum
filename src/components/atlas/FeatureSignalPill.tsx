/**
 * FeatureSignalPill — small admin-side hint on each inventory row that
 * marks which downstream feature surface the row could power
 * (`DETAIL`, `MAP`, `TIMELINE`, `QUEUE`, `FILTERS`, `LINKS`, `RELATIONS`,
 * `NO DETAIL`, …). Caller picks tone — the pill is purely a label,
 * no data semantics. Server component; no client state.
 */

export type FeatureSignalTone = "live" | "queue" | "muted" | "future";

interface FeatureSignalPillProps {
  label: string;
  tone?: FeatureSignalTone;
  hint?: string;
}

export default function FeatureSignalPill({
  label,
  tone = "muted",
  hint,
}: FeatureSignalPillProps) {
  return (
    <span className={`atlas-signal atlas-signal--${tone}`} title={hint}>
      {label}
    </span>
  );
}
