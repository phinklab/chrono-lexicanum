/**
 * FraktionenPage — `/atlas/fraktionen`. Slice-3 admin inventory: every
 * faction in the catalogue, alignment as the leading label, work + tied-
 * character counts as the relations signal, row-click into the existing
 * `/fraktion/[slug]` stub (the stub renders the segment as `id`).
 *
 * Headline stat mirrors `getBridgeStats().fraktionen` (IMPERIUM count) so
 * the Brücke pill and the per-entity pill agree.
 */
import AtlasInventoryTable, {
  type AtlasInventoryHeader,
  type AtlasInventoryRow,
} from "@/components/atlas/AtlasInventoryTable";
import FeatureSignalPill from "@/components/atlas/FeatureSignalPill";
import InventoryPageShell from "@/components/atlas/InventoryPageShell";
import { formatCount } from "@/lib/atlas/format";
import { getFraktionenRows, type FraktionRow } from "@/lib/atlas/queries";
import type { DeckMeta } from "@/lib/atlas/types";

const ALIGNMENT_LABEL: Record<string, string> = {
  imperium: "IMPERIUM",
  chaos: "CHAOS",
  xenos: "XENOS",
  neutral: "NEUTRAL",
};

const HEADERS: ReadonlyArray<AtlasInventoryHeader> = [
  { id: "alignment", label: "ALLEGIANCE", className: "atlas-inv__c--label" },
  { id: "name", label: "FACTION", className: "atlas-inv__c--title" },
  { id: "works", label: "WORKS", className: "atlas-inv__c--num" },
  { id: "characters", label: "CHARACTERS", className: "atlas-inv__c--num" },
  { id: "signal", label: "FEATURE", className: "atlas-inv__c--signal" },
];

function buildRow(row: FraktionRow): AtlasInventoryRow {
  const alignmentLabel =
    ALIGNMENT_LABEL[row.alignment] ?? row.alignment.toUpperCase();
  return {
    key: row.id,
    haystack: `${row.name} ${row.id} ${row.alignment}`,
    href: `/fraktion/${row.id}`,
    cells: [
      {
        id: "alignment",
        className: "atlas-inv__c--label",
        node: alignmentLabel,
        sortValue: alignmentLabel,
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
        id: "works",
        className: "atlas-inv__c--num",
        node: formatCount(row.workCount),
        sortValue: row.workCount,
      },
      {
        id: "characters",
        className: "atlas-inv__c--num",
        node: formatCount(row.characterCount),
        sortValue: row.characterCount,
      },
      {
        id: "signal",
        className: "atlas-inv__c--signal",
        node: <FeatureSignalPill label="DETAIL" tone="live" />,
      },
    ],
  };
}

export default async function FraktionenPage({ deck }: { deck: DeckMeta }) {
  const rows = await getFraktionenRows();
  const imperiumCount = rows.filter((r) => r.alignment === "imperium").length;
  const tableRows = rows.map(buildRow);

  return (
    <InventoryPageShell
      deck={deck}
      rowCount={rows.length}
      primaryStat={{ label: "IMPERIUM", value: formatCount(imperiumCount) }}
    >
      <AtlasInventoryTable
        headers={HEADERS}
        rows={tableRows}
        hasHrefColumn
        searchPlaceholder="Filter faction / ID / allegiance…"
      />
    </InventoryPageShell>
  );
}
