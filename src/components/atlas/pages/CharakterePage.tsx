/**
 * CharakterePage — `/atlas/charaktere`. Slice-3 admin inventory of every
 * catalogued character: leading allegiance + primary-faction lookup, work-
 * appearance count, row-click into the existing `/charakter/[slug]` stub
 * with the character id as segment.
 *
 * Headline stat mirrors `getBridgeStats().charaktere` (Ø WERK-AUFTRITTE)
 * so the Brücke pill and the per-entity pill agree: total appearances ÷
 * character count, identical math to `fmtAvg(workCharCount, charaktere)`
 * in `getBridgeStats`.
 */
import AtlasInventoryTable, {
  type AtlasInventoryHeader,
  type AtlasInventoryRow,
} from "@/components/atlas/AtlasInventoryTable";
import FeatureSignalPill from "@/components/atlas/FeatureSignalPill";
import InventoryPageShell from "@/components/atlas/InventoryPageShell";
import { formatCount } from "@/lib/atlas/format";
import { getCharaktereRows, type CharaktereRow } from "@/lib/atlas/queries";
import type { DeckMeta } from "@/lib/atlas/types";

const ALIGNMENT_LABEL: Record<string, string> = {
  imperium: "IMPERIUM",
  chaos: "CHAOS",
  xenos: "XENOS",
  neutral: "NEUTRAL",
};

const AVG_FORMAT = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

const HEADERS: ReadonlyArray<AtlasInventoryHeader> = [
  { id: "alignment", label: "ALLEGIANCE", className: "atlas-inv__c--label" },
  { id: "name", label: "CHARACTER", className: "atlas-inv__c--title" },
  { id: "faction", label: "FACTION", className: "atlas-inv__c--meta" },
  { id: "works", label: "WORKS", className: "atlas-inv__c--num" },
  { id: "signal", label: "FEATURE", className: "atlas-inv__c--signal" },
];

function buildRow(row: CharaktereRow): AtlasInventoryRow {
  const alignmentLabel = row.primaryFactionAlignment
    ? ALIGNMENT_LABEL[row.primaryFactionAlignment] ??
      row.primaryFactionAlignment.toUpperCase()
    : "—";
  return {
    key: row.id,
    haystack: `${row.name} ${row.id} ${row.primaryFactionName ?? ""} ${
      row.primaryFactionId ?? ""
    } ${row.primaryFactionAlignment ?? ""}`,
    href: `/charakter/${row.id}`,
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
        id: "faction",
        className: "atlas-inv__c--meta",
        node: row.primaryFactionName ?? "—",
        sortValue: row.primaryFactionName ?? undefined,
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
        node: <FeatureSignalPill label="DETAIL" tone="live" />,
      },
    ],
  };
}

export default async function CharakterePage({ deck }: { deck: DeckMeta }) {
  const rows = await getCharaktereRows();
  const totalAppearances = rows.reduce((acc, r) => acc + r.workCount, 0);
  const avg =
    rows.length === 0 ? "—" : AVG_FORMAT.format(totalAppearances / rows.length);
  const tableRows = rows.map(buildRow);

  return (
    <InventoryPageShell
      deck={deck}
      rowCount={rows.length}
      primaryStat={{ label: "AVG APPEARANCES", value: avg }}
    >
      <AtlasInventoryTable
        headers={HEADERS}
        rows={tableRows}
        hasHrefColumn
        searchPlaceholder="Filter character / faction…"
      />
    </InventoryPageShell>
  );
}
