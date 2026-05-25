/**
 * /atlas/[entity] — generic per-entity route.
 *
 * Resolves `entity` against the deck registry. Unknown slug → 404.
 * `werke` renders the real list (Slice 2); the other 11 phase-1 decks
 * and the phase-2 `junctions` deck render a "Liste folgt"-Stub. Slices
 * 3–5 fill the stubs deck-by-deck.
 *
 * `werke` mirrors the `?audit=…` and `?sort=` URL contract from
 * `/buecher` exactly. `AuditPills` and `SortPills` are re-used from
 * there; row-click follows the audit-mode convention (`/buch/[slug]`
 * vs `/buch/[slug]/audit`).
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import SiteBackground from "@/components/chrome/SiteBackground";
import LiveTelemetry from "@/components/chrono/LiveTelemetry";
import AuditPills, { type AuditFilter } from "@/app/buecher/AuditPills";
import SortPills from "@/app/buecher/SortPills";
import EntityTable from "@/components/atlas/EntityTable";
import ProvenancePill from "@/components/atlas/ProvenancePill";
import { DECK_IDS, findDeck } from "@/lib/atlas/decks";
import { getIsAdmin } from "@/lib/atlas/auth";
import { getWerkeRows, type WerkeRow } from "@/lib/atlas/queries";
import type { DeckMeta } from "@/lib/atlas/types";

export const dynamic = "force-dynamic";

type SortKey = "updated" | "title";

const AUDIT_FILTERS: ReadonlySet<AuditFilter> = new Set([
  "drift",
  "gap",
  "ssot",
  "collections",
]);

interface Props {
  params: Promise<{ entity: string }>;
  searchParams: Promise<{ sort?: string; audit?: string | string[] }>;
}

export function generateStaticParams(): Array<{ entity: string }> {
  return DECK_IDS.map((id) => ({ entity: id }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { entity } = await props.params;
  const deck = findDeck(entity);
  if (!deck) return { title: "Unbekannt" };
  return { title: deck.label };
}

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

export default async function AtlasEntityPage(props: Props) {
  if (!(await getIsAdmin())) notFound();

  const { entity } = await props.params;
  const deck = findDeck(entity);
  if (!deck) notFound();

  if (deck.id === "werke") {
    return <WerkePage deck={deck} searchParams={props.searchParams} />;
  }
  return <StubPage deck={deck} />;
}

async function WerkePage({
  deck,
  searchParams,
}: {
  deck: DeckMeta;
  searchParams: Props["searchParams"];
}) {
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
          value: rows.length === 0
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
            <span className="atlas-entity__total">/ {rows.length} verfügbar</span>
            <span className="atlas-entity__dot" aria-hidden>
              ·
            </span>
            <LiveTelemetry
              label="LOAD"
              initial={87.3}
              min={84}
              max={92}
              unit="%"
              interval={1600}
              drift={0.04}
            />
            <LiveTelemetry
              label="COGITATIO"
              initial={1.024}
              min={0.9}
              max={1.2}
              unit=""
              interval={1900}
              drift={0.08}
              decimals={3}
            />
          </div>
          <div className="atlas-entity__toolbar-right">
            <SortPills active={sort} overriddenByDrift={driftSortActive} />
            <AuditPills active={auditFilters} />
          </div>
        </div>

        {driftSortActive && sorted.length > 0 && (
          <p className="atlas-entity__caption">
            Sortiert nach Drift-Frequenz · Confidence · zuletzt aktualisiert.
          </p>
        )}

        <EntityTable rows={sorted} totalRows={rows.length} auditMode={isAuditMode} />

        <footer className="atlas-footer atlas-footer--entity">
          <span>WERK-KNOTEN · LECTIO PROFVNDA</span>
          <span className="atlas-footer__mid">
            ZEILE ÖFFNET /BUCH/[SLUG]{isAuditMode ? "/AUDIT" : ""}
          </span>
          <span>STAMP M42.347</span>
        </footer>
      </section>
    </main>
  );
}

function StubPage({ deck }: { deck: DeckMeta }) {
  return (
    <main className="atlas atlas--entity atlas--stub">
      <SiteBackground variant="vista" position="50% 22%" />
      <EntityHeader deck={deck} rowCount={null} totalCount={null} />

      <section className="atlas-entity__body">
        <div className="atlas-stub c-glass c-corners">
          <span className="atlas-stub__eyebrow">
            {deck.phase === 2 ? "// PHASE 2 — JUNCTIONS-DRILLDOWN" : "// SLICE 3–4 — LISTE FOLGT"}
          </span>
          <h2 className="atlas-stub__title">Liste folgt.</h2>
          <p className="atlas-stub__body">
            Diese Per-Entity-Liste ist in Task 2 als Stub angelegt — die echte
            Tabelle baut ein Folge-Slice. Der Daten-Knoten ist live; der
            Rowcount auf der Brücke stimmt mit der Datenbank überein.
          </p>
          {deck.phase === 2 && (
            <p className="atlas-stub__body">
              <strong>Junctions-Drilldown (Slice 5):</strong> sechs Panels über
              work_factions, work_characters, work_locations, work_persons,
              work_facets, work_collections — je Panel rowCount, Drift-Count
              (rawName ≠ canonical.name) und Gap-Count (Werke ohne Junction).
              Ein zwei-seitiger Picker führt vom kanonischen Eintrag links zu
              allen verknüpften Werken rechts.
            </p>
          )}
          <div className="atlas-stub__cta">
            <Link href="/atlas" className="atlas-stub__back">
              ← Zurück zur Brücke
            </Link>
            {deck.publicDetailPattern && (
              <span className="atlas-stub__detail">
                Detail-Route (öffentlich): <code>{deck.publicDetailPattern}</code>
              </span>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function EntityHeader({
  deck,
  rowCount,
  totalCount,
  primaryStat,
  isAuditMode = false,
  driftSortActive = false,
}: {
  deck: DeckMeta;
  rowCount: number | null;
  totalCount: number | null;
  primaryStat?: { label: string; value: string };
  isAuditMode?: boolean;
  driftSortActive?: boolean;
}) {
  return (
    <header className="atlas-entity__hero" aria-label={`Atlas — ${deck.label}`}>
      <div className="atlas-entity__eyebrow">
        <Link href="/atlas" className="atlas-entity__back">
          ← BRÜCKE
        </Link>
        <span className="atlas-entity__divider" aria-hidden>
          /
        </span>
        <span>{deck.label}</span>
      </div>
      <h1 className="atlas-entity__title">{deck.label}</h1>
      <p className="atlas-entity__sub">
        {rowCount === null
          ? deck.blurb
          : isAuditMode
            ? `${rowCount} Audit-Treffer von ${totalCount} Einträgen · ${deck.blurb}`
            : `${rowCount} von ${totalCount} Einträgen · ${deck.blurb}`}
      </p>
      {primaryStat && (
        <div className="atlas-entity__stat-row">
          <ProvenancePill
            label={primaryStat.label}
            value={primaryStat.value}
            accent={deck.accent}
          />
          {driftSortActive && (
            <span className="atlas-entity__audit-mark">DRIFT-SORTIERUNG AKTIV</span>
          )}
        </div>
      )}
    </header>
  );
}
