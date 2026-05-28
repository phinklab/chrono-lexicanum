/**
 * WeltenPage — `/atlas/welten`. Slice-3 admin inventory of every catalogued
 * location: name + id, sector lookup, gx/gy presence, tied-work count, and
 * a feature signal that switches to MAP when coordinates exist (the row is
 * Cartographer-ready) and falls back to DETAIL when only the stub
 * `/welt/[slug]` route is available.
 *
 * Headline stat mirrors `getBridgeStats().welten` (KARTIERT count) so the
 * Brücke pill and the per-entity pill agree.
 */
import AtlasInventoryTable, {
  type AtlasInventoryHeader,
  type AtlasInventoryRow,
} from "@/components/atlas/AtlasInventoryTable";
import FeatureSignalPill from "@/components/atlas/FeatureSignalPill";
import InventoryPageShell from "@/components/atlas/InventoryPageShell";
import { formatCount } from "@/lib/atlas/format";
import { getWeltenRows, type WeltenRow } from "@/lib/atlas/queries";
import type { DeckMeta } from "@/lib/atlas/types";

function isMapped(row: WeltenRow): boolean {
  return row.gx !== null && row.gy !== null;
}

const HEADERS: ReadonlyArray<AtlasInventoryHeader> = [
  { id: "map", label: "MAP", className: "atlas-inv__c--label" },
  { id: "name", label: "WORLD", className: "atlas-inv__c--title" },
  { id: "sector", label: "SECTOR", className: "atlas-inv__c--meta" },
  { id: "coords", label: "COORDS", className: "atlas-inv__c--meta" },
  { id: "works", label: "WORKS", className: "atlas-inv__c--num" },
  { id: "signal", label: "FEATURE", className: "atlas-inv__c--signal" },
];

function buildRow(row: WeltenRow): AtlasInventoryRow {
  const mapped = isMapped(row);
  return {
    key: row.id,
    haystack: `${row.name} ${row.id} ${row.sectorName ?? ""} ${row.sectorId ?? ""}`,
    href: `/welt/${row.id}`,
    cells: [
      {
        id: "map",
        className: "atlas-inv__c--label",
        node: mapped ? "MAPPED" : "—",
        sortValue: mapped ? 1 : 0,
      },
      {
        id: "name",
        className: "atlas-inv__c--title",
        node: (
          <>
            <span className="atlas-inv__name">{row.name}</span>
            <span className="atlas-inv__hint">{row.id}</span>
          </>
        ),
        sortValue: row.name,
      },
      {
        id: "sector",
        className: "atlas-inv__c--meta",
        node: row.sectorName ?? "—",
        sortValue: row.sectorName ?? undefined,
      },
      {
        id: "coords",
        className: "atlas-inv__c--meta",
        node:
          row.gx === null || row.gy === null
            ? "—"
            : `${row.gx} · ${row.gy}`,
        sortValue: row.gx ?? undefined,
      },
      {
        id: "works",
        className: "atlas-inv__c--num",
        node: formatCount(row.workCount),
        sortValue: row.workCount,
      },
      {
        id: "signal",
        className: "atlas-inv__c--signal",
        node: (
          <FeatureSignalPill label={mapped ? "MAP" : "DETAIL"} tone="live" />
        ),
      },
    ],
  };
}

export default async function WeltenPage({ deck }: { deck: DeckMeta }) {
  const rows = await getWeltenRows();
  const mappedCount = rows.filter(isMapped).length;
  const tableRows = rows.map(buildRow);

  return (
    <InventoryPageShell
      deck={deck}
      rowCount={rows.length}
      primaryStat={{ label: "MAPPED", value: formatCount(mappedCount) }}
    >
      <AtlasInventoryTable
        headers={HEADERS}
        rows={tableRows}
        hasHrefColumn
        searchPlaceholder="Filter world / ID / sector…"
      />
    </InventoryPageShell>
  );
}
