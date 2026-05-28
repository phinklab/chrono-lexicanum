/**
 * SektorenPage — `/atlas/sektoren`. Slice-4 reference inventory of the
 * Cartographer scaffolding. `sectors` has no `segmentum` column, so the
 * page leads with the simpler signals the schema actually carries:
 * whether a sector has a label anchor (`labelX`/`labelY`), how many
 * locations are bound to it, how many of those carry map coordinates,
 * and the editorial capital/warp aggregates per sector. No row click
 * (no public sector route yet).
 *
 * Headline stat mirrors `getBridgeStats().sektoren` ("Ø WELTEN/SEKTOR")
 * so the Brücke pill and the per-entity pill agree: total tied
 * locations ÷ sector count, identical math to
 * `fmtAvg(weltenInSektoren, sektorenCount)` in `getBridgeStats`.
 */
import AtlasInventoryTable, {
  type AtlasInventoryHeader,
  type AtlasInventoryRow,
} from "@/components/atlas/AtlasInventoryTable";
import FeatureSignalPill from "@/components/atlas/FeatureSignalPill";
import InventoryPageShell from "@/components/atlas/InventoryPageShell";
import { formatCount } from "@/lib/atlas/format";
import { getSektorenRows, type SektorenRow } from "@/lib/atlas/queries";
import type { DeckMeta } from "@/lib/atlas/types";

const AVG_FORMAT = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

function isMapReady(row: SektorenRow): boolean {
  return row.hasLabel && row.mappedCount > 0;
}

function anchorLabel(row: SektorenRow): string {
  if (row.capitalCount === 0 && row.warpCount === 0) return "—";
  return `${row.capitalCount}K · ${row.warpCount}W`;
}

const HEADERS: ReadonlyArray<AtlasInventoryHeader> = [
  { id: "label", label: "LABEL", className: "atlas-inv__c--label" },
  { id: "name", label: "SECTOR", className: "atlas-inv__c--title" },
  { id: "locations", label: "WORLDS", className: "atlas-inv__c--num" },
  { id: "mapped", label: "MAPPED", className: "atlas-inv__c--num" },
  { id: "anchors", label: "ANCHORS", className: "atlas-inv__c--meta" },
  { id: "signal", label: "FEATURE", className: "atlas-inv__c--signal" },
];

function buildRow(row: SektorenRow): AtlasInventoryRow {
  return {
    key: row.id,
    haystack: `${row.name} ${row.id}`,
    cells: [
      {
        id: "label",
        className: "atlas-inv__c--label",
        node: row.hasLabel ? "ANCHOR" : "—",
        sortValue: row.hasLabel ? 1 : 0,
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
        id: "locations",
        className: "atlas-inv__c--num",
        node: formatCount(row.locationCount),
        sortValue: row.locationCount,
      },
      {
        id: "mapped",
        className: "atlas-inv__c--num",
        node: formatCount(row.mappedCount),
        sortValue: row.mappedCount,
      },
      {
        id: "anchors",
        className: "atlas-inv__c--meta",
        node: anchorLabel(row),
        sortValue: row.capitalCount + row.warpCount,
      },
      {
        id: "signal",
        className: "atlas-inv__c--signal",
        node: (
          <FeatureSignalPill
            label="MAP CONTEXT"
            tone={isMapReady(row) ? "live" : "muted"}
          />
        ),
      },
    ],
  };
}

export default async function SektorenPage({ deck }: { deck: DeckMeta }) {
  const rows = await getSektorenRows();
  const totalLocations = rows.reduce((acc, r) => acc + r.locationCount, 0);
  const avg =
    rows.length === 0 ? "—" : AVG_FORMAT.format(totalLocations / rows.length);
  const tableRows = rows.map(buildRow);

  return (
    <InventoryPageShell
      deck={deck}
      rowCount={rows.length}
      primaryStat={{ label: "AVG WORLDS/SECTOR", value: avg }}
    >
      <AtlasInventoryTable
        headers={HEADERS}
        rows={tableRows}
        searchPlaceholder="Filter sector / ID…"
      />
    </InventoryPageShell>
  );
}
