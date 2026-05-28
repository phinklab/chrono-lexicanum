/**
 * InventoryPageShell — shared chrome for the ten Phase-1 admin inventory
 * pages (`/atlas/fraktionen` … `/atlas/services`). Wraps SiteBackground +
 * EntityHeader + the standard body container so each inventory page
 * only declares its rows + columns + headline stat.
 *
 * `/atlas/werke` does **not** use this shell — it has its own toolbar
 * (SortPills / AuditPills / CatalogueTelemetry / stamped footer) and lives
 * in `WerkePage.tsx`. `/atlas/junctions` is still `StubPage`.
 */
import type { ReactNode } from "react";
import SiteBackground from "@/components/chrome/SiteBackground";
import EntityHeader from "./EntityHeader";
import type { DeckMeta } from "@/lib/atlas/types";

interface InventoryPageShellProps {
  deck: DeckMeta;
  rowCount: number;
  primaryStat?: { label: string; value: string };
  children: ReactNode;
}

export default function InventoryPageShell({
  deck,
  rowCount,
  primaryStat,
  children,
}: InventoryPageShellProps) {
  return (
    <main className="atlas atlas--entity atlas--inv">
      <SiteBackground variant="vista" position="50% 22%" />
      <EntityHeader
        deck={deck}
        rowCount={rowCount}
        totalCount={rowCount}
        primaryStat={primaryStat}
      />
      <section className="atlas-entity__body">{children}</section>
    </main>
  );
}
