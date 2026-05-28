/**
 * FacetsPage — `/atlas/facets`. Slice-4 operational inventory of the 12
 * faceted-classification categories (`facet_categories` + `facet_values`
 * + `work_facets`). Per row: number of values inside the category, number
 * of catalogued works tagged with at least one of those values (distinct
 * count), and the two editorial flags (user-visible + multi-value).
 *
 * Headline stat mirrors `getBridgeStats().facets` ("WERTE"): total facet
 * values across all categories — sum of per-row `valuesCount` matches the
 * single `count(*) FROM facet_values` the Brücke runs.
 *
 * No row click — facet categories don't have a public detail surface.
 */
import AtlasInventoryTable, {
  type AtlasInventoryHeader,
  type AtlasInventoryRow,
} from "@/components/atlas/AtlasInventoryTable";
import FeatureSignalPill from "@/components/atlas/FeatureSignalPill";
import InventoryPageShell from "@/components/atlas/InventoryPageShell";
import { formatCount } from "@/lib/atlas/format";
import { getFacetsRows, type FacetRow } from "@/lib/atlas/queries";
import type { DeckMeta } from "@/lib/atlas/types";

const HEADERS: ReadonlyArray<AtlasInventoryHeader> = [
  { id: "order", label: "ORDER", className: "atlas-inv__c--label" },
  { id: "name", label: "CATEGORY", className: "atlas-inv__c--title" },
  { id: "values", label: "VALUES", className: "atlas-inv__c--num" },
  { id: "works", label: "WORKS", className: "atlas-inv__c--num" },
  { id: "flags", label: "VISIBLE", className: "atlas-inv__c--meta" },
  { id: "signal", label: "FEATURE", className: "atlas-inv__c--signal" },
];

function buildRow(row: FacetRow): AtlasInventoryRow {
  const flags = `${row.visibleToUsers ? "USER" : "INTERNAL"} · ${
    row.multiValue ? "MULTI" : "SOLO"
  }`;
  const flagSearch = `${
    row.visibleToUsers ? "user visible" : "internal"
  } ${row.multiValue ? "multi" : "solo"}`;
  return {
    key: row.id,
    haystack: `${row.name} ${row.id} ${flagSearch}`,
    cells: [
      {
        id: "order",
        className: "atlas-inv__c--label",
        node: `#${String(row.displayOrder).padStart(2, "0")}`,
        sortValue: row.displayOrder,
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
        id: "values",
        className: "atlas-inv__c--num",
        node: formatCount(row.valuesCount),
        sortValue: row.valuesCount,
      },
      {
        id: "works",
        className: "atlas-inv__c--num",
        node: formatCount(row.worksCount),
        sortValue: row.worksCount,
      },
      {
        id: "flags",
        className: "atlas-inv__c--meta",
        node: flags,
        sortValue: flags,
      },
      {
        id: "signal",
        className: "atlas-inv__c--signal",
        node: (
          <FeatureSignalPill
            label="FILTERS"
            tone={row.visibleToUsers && row.worksCount > 0 ? "live" : "muted"}
          />
        ),
      },
    ],
  };
}

export default async function FacetsPage({ deck }: { deck: DeckMeta }) {
  const rows = await getFacetsRows();
  const totalValues = rows.reduce((acc, r) => acc + r.valuesCount, 0);
  const tableRows = rows.map(buildRow);

  return (
    <InventoryPageShell
      deck={deck}
      rowCount={rows.length}
      primaryStat={{ label: "VALUES", value: formatCount(totalValues) }}
    >
      <AtlasInventoryTable
        headers={HEADERS}
        rows={tableRows}
        searchPlaceholder="Filter category / ID…"
      />
    </InventoryPageShell>
  );
}
