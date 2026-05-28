/**
 * AerenPage — `/atlas/aeren`. Slice-4 reference inventory of the editorial
 * era anchors (M30 – M42). Each row exposes the era's M-range, sort order
 * (the canonical timeline order), and the number of catalogued works whose
 * `book_details.primary_era_id` points at it. No row click — eras don't
 * have a public detail surface in this MVP.
 *
 * Headline stat mirrors `getBridgeStats().aeren` ("ZEITSPANNE"): the
 * overall M-range across `min(start_y)` / `max(end_y)`, formatted with
 * the shared `formatMRange` helper so the Brücke pill and the per-entity
 * pill agree.
 */
import AtlasInventoryTable, {
  type AtlasInventoryHeader,
  type AtlasInventoryRow,
} from "@/components/atlas/AtlasInventoryTable";
import FeatureSignalPill from "@/components/atlas/FeatureSignalPill";
import InventoryPageShell from "@/components/atlas/InventoryPageShell";
import { formatCount, formatMRange } from "@/lib/atlas/format";
import { getAerenRows, type AereRow } from "@/lib/atlas/queries";
import type { DeckMeta } from "@/lib/atlas/types";

const HEADERS: ReadonlyArray<AtlasInventoryHeader> = [
  { id: "range", label: "M-RANGE", className: "atlas-inv__c--label" },
  { id: "name", label: "ERA", className: "atlas-inv__c--title" },
  { id: "sort", label: "SORT", className: "atlas-inv__c--num" },
  { id: "works", label: "WORKS", className: "atlas-inv__c--num" },
  { id: "signal", label: "FEATURE", className: "atlas-inv__c--signal" },
];

function buildRow(row: AereRow): AtlasInventoryRow {
  return {
    key: row.id,
    haystack: `${row.name} ${row.id}`,
    cells: [
      {
        id: "range",
        className: "atlas-inv__c--label",
        node: formatMRange(row.startY, row.endY),
        sortValue: row.startY ?? undefined,
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
        id: "sort",
        className: "atlas-inv__c--num",
        node: String(row.sortOrder),
        sortValue: row.sortOrder,
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
          <FeatureSignalPill
            label="TIMELINE"
            tone={row.workCount > 0 ? "live" : "muted"}
          />
        ),
      },
    ],
  };
}

export default async function AerenPage({ deck }: { deck: DeckMeta }) {
  const rows = await getAerenRows();
  const lo = rows.reduce<number | null>((acc, r) => {
    if (r.startY == null) return acc;
    return acc == null ? r.startY : Math.min(acc, r.startY);
  }, null);
  const hi = rows.reduce<number | null>((acc, r) => {
    if (r.endY == null) return acc;
    return acc == null ? r.endY : Math.max(acc, r.endY);
  }, null);
  const tableRows = rows.map(buildRow);

  return (
    <InventoryPageShell
      deck={deck}
      rowCount={rows.length}
      primaryStat={{ label: "TIMESPAN", value: formatMRange(lo, hi) }}
    >
      <AtlasInventoryTable
        headers={HEADERS}
        rows={tableRows}
        searchPlaceholder="Filter era / ID…"
      />
    </InventoryPageShell>
  );
}
