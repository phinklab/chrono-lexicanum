/**
 * SerienPage — `/atlas/serien`. Slice-4 reference inventory of every
 * book series in the catalogue. Counts come from `book_details.series_id`
 * (one book ⇄ at most one series), so the volume tally is a single
 * sub-aggregate join. `series.total_planned` carries the editorial cap
 * from the seed catalogue (NULL = open-ended / unknown). No row click —
 * series have no public detail surface yet.
 *
 * Headline stat mirrors `getBridgeStats().serien` ("Ø BÄNDE/SERIE"):
 * total tied volumes ÷ series count, identical math to
 * `fmtAvg(bookDetailsWithSeries, serienCount)` in `getBridgeStats`.
 */
import AtlasInventoryTable, {
  type AtlasInventoryHeader,
  type AtlasInventoryRow,
} from "@/components/atlas/AtlasInventoryTable";
import FeatureSignalPill from "@/components/atlas/FeatureSignalPill";
import InventoryPageShell from "@/components/atlas/InventoryPageShell";
import { formatCount } from "@/lib/atlas/format";
import { getSerienRows, type SerieRow } from "@/lib/atlas/queries";
import type { DeckMeta } from "@/lib/atlas/types";

const AVG_FORMAT = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

function progressLabel(row: SerieRow): string {
  if (row.totalPlanned == null) return "—";
  return `${row.volumeCount} / ${row.totalPlanned}`;
}

const HEADERS: ReadonlyArray<AtlasInventoryHeader> = [
  { id: "name", label: "SERIES", className: "atlas-inv__c--title" },
  { id: "volumes", label: "VOLUMES", className: "atlas-inv__c--num" },
  { id: "planned", label: "PLANNED", className: "atlas-inv__c--num" },
  { id: "progress", label: "PROGRESS", className: "atlas-inv__c--meta" },
  { id: "signal", label: "FEATURE", className: "atlas-inv__c--signal" },
];

function buildRow(row: SerieRow): AtlasInventoryRow {
  return {
    key: row.id,
    haystack: `${row.name} ${row.id}`,
    cells: [
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
        id: "volumes",
        className: "atlas-inv__c--num",
        node: formatCount(row.volumeCount),
        sortValue: row.volumeCount,
      },
      {
        id: "planned",
        className: "atlas-inv__c--num",
        node: row.totalPlanned == null ? "—" : formatCount(row.totalPlanned),
        sortValue: row.totalPlanned ?? undefined,
      },
      {
        id: "progress",
        className: "atlas-inv__c--meta",
        node: progressLabel(row),
        sortValue:
          row.totalPlanned == null
            ? undefined
            : row.volumeCount / row.totalPlanned,
      },
      {
        id: "signal",
        className: "atlas-inv__c--signal",
        node: (
          <FeatureSignalPill
            label="SERIES PAGE?"
            tone={row.volumeCount > 0 ? "future" : "muted"}
          />
        ),
      },
    ],
  };
}

export default async function SerienPage({ deck }: { deck: DeckMeta }) {
  const rows = await getSerienRows();
  const totalVolumes = rows.reduce((acc, r) => acc + r.volumeCount, 0);
  const avg =
    rows.length === 0 ? "—" : AVG_FORMAT.format(totalVolumes / rows.length);
  const tableRows = rows.map(buildRow);

  return (
    <InventoryPageShell
      deck={deck}
      rowCount={rows.length}
      primaryStat={{ label: "AVG VOL/SERIES", value: avg }}
    >
      <AtlasInventoryTable
        headers={HEADERS}
        rows={tableRows}
        searchPlaceholder="Filter series / ID…"
      />
    </InventoryPageShell>
  );
}
