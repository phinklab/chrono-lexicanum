/**
 * ServicesPage — `/atlas/services`. Slice-4 operational inventory of the
 * external storefronts referenced by `external_links`. Per row: domain
 * (the FK target for new link inserts), the number of catalogued links
 * pointing at this service, and the affiliate posture (whether the
 * service supports affiliate links + how many active affiliate links
 * we've already attached).
 *
 * Headline stat mirrors `getBridgeStats().services` ("EXT. LINKS"): the
 * total external-link count across all services — sum of per-row
 * `linkCount` matches the single `count(*) FROM external_links` the
 * Brücke runs.
 *
 * No row click — services are a reference table; the URLs live on
 * `external_links`, not on `services.url` (which doesn't exist).
 */
import AtlasInventoryTable, {
  type AtlasInventoryHeader,
  type AtlasInventoryRow,
} from "@/components/atlas/AtlasInventoryTable";
import FeatureSignalPill from "@/components/atlas/FeatureSignalPill";
import InventoryPageShell from "@/components/atlas/InventoryPageShell";
import { formatCount } from "@/lib/atlas/format";
import { getServicesRows, type ServiceRow } from "@/lib/atlas/queries";
import type { DeckMeta } from "@/lib/atlas/types";

const HEADERS: ReadonlyArray<AtlasInventoryHeader> = [
  { id: "order", label: "ORDER", className: "atlas-inv__c--label" },
  { id: "name", label: "SERVICE", className: "atlas-inv__c--title" },
  { id: "domain", label: "DOMAIN", className: "atlas-inv__c--meta" },
  { id: "links", label: "LINKS", className: "atlas-inv__c--num" },
  { id: "affiliate", label: "AFFILIATE", className: "atlas-inv__c--meta" },
  { id: "signal", label: "FEATURE", className: "atlas-inv__c--signal" },
];

function buildRow(row: ServiceRow): AtlasInventoryRow {
  return {
    key: row.id,
    haystack: `${row.name} ${row.id} ${row.domain ?? ""} ${
      row.affiliateSupported ? "affiliate" : ""
    }`,
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
        id: "domain",
        className: "atlas-inv__c--meta",
        node: row.domain ?? "—",
        sortValue: row.domain ?? undefined,
      },
      {
        id: "links",
        className: "atlas-inv__c--num",
        node: formatCount(row.linkCount),
        sortValue: row.linkCount,
      },
      {
        id: "affiliate",
        className: "atlas-inv__c--meta",
        node: row.affiliateSupported
          ? `YES · ${formatCount(row.affiliateLinkCount)}`
          : "—",
        sortValue: row.affiliateSupported ? row.affiliateLinkCount + 1 : 0,
      },
      {
        id: "signal",
        className: "atlas-inv__c--signal",
        node: (
          <FeatureSignalPill
            label="LINKS"
            tone={row.linkCount > 0 ? "live" : "muted"}
          />
        ),
      },
    ],
  };
}

export default async function ServicesPage({ deck }: { deck: DeckMeta }) {
  const rows = await getServicesRows();
  const totalLinks = rows.reduce((acc, r) => acc + r.linkCount, 0);
  const tableRows = rows.map(buildRow);

  return (
    <InventoryPageShell
      deck={deck}
      rowCount={rows.length}
      primaryStat={{ label: "EXT. LINKS", value: formatCount(totalLinks) }}
    >
      <AtlasInventoryTable
        headers={HEADERS}
        rows={tableRows}
        searchPlaceholder="Filter service / domain / ID…"
      />
    </InventoryPageShell>
  );
}
