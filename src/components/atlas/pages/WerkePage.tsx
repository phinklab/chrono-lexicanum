/**
 * WerkePage — the bespoke `/atlas/werke` list. Extracted from the
 * dispatcher in Task 4A so the dispatcher stays a thin per-deck switch.
 *
 * Behavior is identical to the pre-4A inline component: `?sort=` +
 * `?audit=` URL contract, AuditPills + SortPills toolbar, drift-aware
 * sorting, SSOT share as the headline ProvenancePill. The audit/drift
 * machinery is intentionally **not** moved into `AtlasInventoryTable` —
 * the inventory tables run a simpler, generic contract and would have
 * to absorb werke-specific concepts to host this page.
 */
import SiteBackground from "@/components/chrome/SiteBackground";
import CatalogueTelemetry from "@/components/chrono/CatalogueTelemetry";
import AuditPills, { type AuditFilter } from "@/app/buecher/AuditPills";
import SortPills from "@/app/buecher/SortPills";
import EntityHeader from "@/components/atlas/EntityHeader";
import EntityTable from "@/components/atlas/EntityTable";
import { getWerkeRows, type WerkeRow } from "@/lib/atlas/queries";
import type { DeckMeta } from "@/lib/atlas/types";

type SortKey = "updated" | "title";

const AUDIT_FILTERS: ReadonlySet<AuditFilter> = new Set([
  "drift",
  "alias",
  "gap",
  "ssot",
  "collections",
]);

function parseSort(raw: string | undefined): SortKey {
  return raw === "title" ? "title" : "updated";
}

function isAuditFilter(value: string): value is AuditFilter {
  return AUDIT_FILTERS.has(value as AuditFilter);
}

function parseAudit(raw: string | string[] | undefined): AuditFilter[] {
  const parts = Array.isArray(raw)
    ? raw.flatMap((v) => v.split(","))
    : (raw ?? "").split(",");
  const seen = new Set<AuditFilter>();
  for (const part of parts) {
    const trimmed = part.trim();
    if (isAuditFilter(trimmed)) seen.add(trimmed);
  }
  return [...seen];
}

function matchesAudit(row: WerkeRow, filters: readonly AuditFilter[]): boolean {
  return filters.every((filter) => {
    if (filter === "drift") return row.hasDrift;
    if (filter === "alias") return row.knownAliasCount > 0;
    if (filter === "gap") return row.hasJunctionGap;
    if (filter === "ssot") return row.isSsot;
    return row.isInMultipleCollections;
  });
}

function sortRows(
  rows: ReadonlyArray<WerkeRow>,
  key: SortKey,
  auditFilters: readonly AuditFilter[],
): WerkeRow[] {
  const copy = [...rows];
  if (auditFilters.includes("drift")) {
    copy.sort((a, b) => {
      const dDrift = b.driftCount - a.driftCount;
      if (dDrift !== 0) return dDrift;
      const dConf = Number(b.confidence ?? "0") - Number(a.confidence ?? "0");
      if (dConf !== 0) return dConf;
      const dUpdated = b.updatedAt.getTime() - a.updatedAt.getTime();
      if (dUpdated !== 0) return dUpdated;
      return (a.externalBookId ?? "").localeCompare(b.externalBookId ?? "");
    });
    return copy;
  }
  if (key === "title") {
    copy.sort((a, b) => a.title.localeCompare(b.title, "de"));
  } else {
    copy.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  return copy;
}

interface WerkePageProps {
  deck: DeckMeta;
  searchParams: Promise<{ sort?: string; audit?: string | string[] }>;
}

export default async function WerkePage({ deck, searchParams }: WerkePageProps) {
  const sp = await searchParams;
  const sort = parseSort(sp.sort);
  const auditFilters = parseAudit(sp.audit);
  const isAuditMode = auditFilters.length > 0;

  const rows = await getWerkeRows();
  const visible = isAuditMode
    ? rows.filter((r) => matchesAudit(r, auditFilters))
    : rows;
  const sorted = sortRows(visible, sort, auditFilters);
  const driftSortActive = auditFilters.includes("drift");
  const ssotCount = rows.filter((r) => r.isSsot).length;

  return (
    <main className="atlas atlas--entity">
      <SiteBackground variant="vista" position="50% 22%" />
      <EntityHeader
        deck={deck}
        rowCount={sorted.length}
        totalCount={rows.length}
        primaryStat={{
          label: "SSOT",
          value:
            rows.length === 0
              ? "—"
              : `${Math.round((ssotCount / rows.length) * 100)} %`,
        }}
        isAuditMode={isAuditMode}
        driftSortActive={driftSortActive}
      />

      <section className="atlas-entity__body">
        <div className="atlas-entity__toolbar">
          <div className="atlas-entity__toolbar-left">
            <span className="atlas-entity__count">
              {sorted.length} · INDEXED
            </span>
            <span className="atlas-entity__total">/ {rows.length} available</span>
            <span className="atlas-entity__dot" aria-hidden>
              ·
            </span>
            <CatalogueTelemetry />
          </div>
          <div className="atlas-entity__toolbar-right">
            <SortPills active={sort} overriddenByDrift={driftSortActive} />
            <AuditPills active={auditFilters} />
          </div>
        </div>

        {driftSortActive && sorted.length > 0 && (
          <p className="atlas-entity__caption">
            Sorted by drift frequency · confidence · last updated.
          </p>
        )}

        <EntityTable rows={sorted} totalRows={rows.length} auditMode={isAuditMode} />

        <footer className="atlas-footer atlas-footer--entity">
          <span>WORK NODE · LECTIO PROFVNDA</span>
          <span className="atlas-footer__mid">
            ROW OPENS /BUCH/[SLUG]{isAuditMode ? "/AUDIT" : ""}
          </span>
          <span>STAMP M42.347</span>
        </footer>
      </section>
    </main>
  );
}
