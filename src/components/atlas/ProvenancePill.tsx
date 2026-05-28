/**
 * ProvenancePill — the gold/cyan key-value pill that anchors every
 * EntityDeck card with its headline aggregate (SSOT-Anteil, ø Welten/
 * Sektor, …) and is reused on per-entity list pages for provenance
 * (sourceKind · confidence). Cyan accent = lore-canonical surface,
 * gold accent = editorial scaffolding, blood accent = audit-only.
 */
import type { DeckAccent } from "@/lib/atlas/types";

interface ProvenancePillProps {
  label: string;
  value: string;
  accent?: DeckAccent;
  title?: string;
}

export default function ProvenancePill({
  label,
  value,
  accent = "gold",
  title,
}: ProvenancePillProps) {
  return (
    <span className={`atlas-pill atlas-pill--${accent}`} title={title}>
      <span className="atlas-pill__label">{label}</span>
      <span className="atlas-pill__value">{value}</span>
    </span>
  );
}
