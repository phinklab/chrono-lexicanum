import type { Metadata } from "next";
import Link from "next/link";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import {
  eras as erasTable,
  workCollections as workCollectionsTable,
  works as worksTable,
} from "@/db/schema";
import {
  AVAILABILITY_LABELS,
  FORMAT_LABELS,
  PERSON_ROLE_LABELS,
} from "@/lib/book-labels";
import AuditPills, { type AuditFilter } from "./AuditPills";
import SortPills from "./SortPills";

export const metadata: Metadata = { title: "Bücher — Chrono Lexicanum" };

type SortKey = "updated" | "title";

interface CataloguePageProps {
  searchParams: Promise<{ sort?: string; audit?: string | string[] }>;
}

interface CataloguePerson {
  name: string;
  role: string;
  displayOrder: number;
}

interface CatalogueFacet {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string | null;
}

interface CatalogueCollection {
  slug: string;
  title: string;
}

interface CatalogueAudit {
  externalBookId: string | null;
  sourceKind: string;
  confidence: string | null;
  factionCount: number;
  locationCount: number;
  characterCount: number;
  containedInCount: number;
  containsCount: number;
  hasDrift: boolean;
  hasJunctionGap: boolean;
  isSsot: boolean;
  isInMultipleCollections: boolean;
}

interface CatalogueBook {
  id: string;
  slug: string;
  title: string;
  synopsis: string | null;
  coverUrl: string | null;
  releaseYear: number | null;
  startY: number | null;
  endY: number | null;
  format: string | null;
  availability: string | null;
  pageCount: number | null;
  eraName: string | null;
  seriesName: string | null;
  seriesIndex: number | null;
  authors: string[];
  otherPersons: CataloguePerson[];
  factions: Array<{ id: string; name: string }>;
  facets: CatalogueFacet[];
  containedIn: CatalogueCollection[];
  isEnriched: boolean;
  updatedAt: Date;
  audit: CatalogueAudit;
}

const AUDIT_FILTERS: ReadonlySet<AuditFilter> = new Set([
  "drift",
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
  const parts = Array.isArray(raw) ? raw.flatMap((v) => v.split(",")) : (raw ?? "").split(",");
  const seen = new Set<AuditFilter>();
  for (const part of parts) {
    const trimmed = part.trim();
    if (isAuditFilter(trimmed)) seen.add(trimmed);
  }
  return [...seen];
}

function formatMBand(startY: number | null, endY: number | null): string | null {
  if (startY == null && endY == null) return null;
  const fmt = (v: number) => `M${v.toFixed(3)}`;
  if (startY != null && endY != null && Math.abs(startY - endY) < 0.001) {
    return fmt(startY);
  }
  if (startY != null && endY != null) return `${fmt(startY)} – ${fmt(endY)}`;
  return fmt((startY ?? endY) as number);
}

function hasResolvedDrift(
  rows: ReadonlyArray<{ rawName: string | null; name: string }>,
): boolean {
  return rows.some((row) => row.rawName !== null && row.rawName !== "" && row.rawName !== row.name);
}

async function loadBooks(): Promise<CatalogueBook[]> {
  try {
    const [rows, erasRows] = await Promise.all([
      db.query.works.findMany({
        where: (w, { eq: eqOp }) => eqOp(w.kind, "book"),
        with: {
          bookDetails: {
            with: { series: { columns: { id: true, name: true } } },
          },
          factions: {
            with: { faction: { columns: { id: true, name: true } } },
          },
          locations: {
            with: { location: { columns: { id: true, name: true } } },
          },
          characters: {
            with: { character: { columns: { id: true, name: true } } },
          },
          facets: {
            with: {
              facetValue: {
                columns: { id: true, name: true, categoryId: true },
                with: { category: { columns: { id: true, name: true } } },
              },
            },
          },
          persons: {
            with: { person: { columns: { name: true } } },
          },
        },
      }),
      db.select({ id: erasTable.id, name: erasTable.name }).from(erasTable),
    ]);

    const erasById = new Map(erasRows.map((e) => [e.id, e.name]));
    const bookIds = rows.map((r) => r.id);
    const [containedInRows, containsRows] =
      bookIds.length === 0
        ? [[], []]
        : await Promise.all([
            db
              .select({
                contentWorkId: workCollectionsTable.contentWorkId,
                collectionSlug: worksTable.slug,
                collectionTitle: worksTable.title,
                displayOrder: workCollectionsTable.displayOrder,
              })
              .from(workCollectionsTable)
              .innerJoin(
                worksTable,
                eq(worksTable.id, workCollectionsTable.collectionWorkId),
              )
              .where(inArray(workCollectionsTable.contentWorkId, bookIds)),
            db
              .select({
                collectionWorkId: workCollectionsTable.collectionWorkId,
                contentSlug: worksTable.slug,
                contentTitle: worksTable.title,
                displayOrder: workCollectionsTable.displayOrder,
              })
              .from(workCollectionsTable)
              .innerJoin(
                worksTable,
                eq(worksTable.id, workCollectionsTable.contentWorkId),
              )
              .where(inArray(workCollectionsTable.collectionWorkId, bookIds)),
          ]);

    const containedInByBook = new Map<string, CatalogueCollection[]>();
    for (const r of containedInRows) {
      const arr = containedInByBook.get(r.contentWorkId) ?? [];
      arr.push({ slug: r.collectionSlug, title: r.collectionTitle });
      containedInByBook.set(r.contentWorkId, arr);
    }

    const containsCountByBook = new Map<string, number>();
    for (const r of containsRows) {
      containsCountByBook.set(
        r.collectionWorkId,
        (containsCountByBook.get(r.collectionWorkId) ?? 0) + 1,
      );
    }

    return rows.map((w): CatalogueBook => {
      const authors: string[] = [];
      const otherPersons: CataloguePerson[] = [];
      for (const wp of w.persons) {
        if (wp.role === "author") {
          authors.push(wp.person.name);
        } else {
          otherPersons.push({
            name: wp.person.name,
            role: wp.role,
            displayOrder: wp.displayOrder,
          });
        }
      }
      otherPersons.sort((a, b) => a.displayOrder - b.displayOrder);

      const factionAuditRows = w.factions.map((wf) => ({
        name: wf.faction.name,
        rawName: wf.rawName,
      }));
      const locationAuditRows = w.locations.map((wl) => ({
        name: wl.location.name,
        rawName: wl.rawName,
      }));
      const characterAuditRows = w.characters.map((wc) => ({
        name: wc.character.name,
        rawName: wc.rawName,
      }));

      const factions = w.factions
        .map((wf) => ({ id: wf.faction.id, name: wf.faction.name }))
        .sort((a, b) => a.name.localeCompare(b.name, "de"));

      const facets: CatalogueFacet[] = w.facets
        .map((wf) => ({
          id: wf.facetValue.id,
          name: wf.facetValue.name,
          categoryId: wf.facetValue.categoryId,
          categoryName: wf.facetValue.category?.name ?? null,
        }))
        .sort((a, b) => {
          const cat = (a.categoryName ?? "").localeCompare(
            b.categoryName ?? "",
            "de",
          );
          return cat !== 0 ? cat : a.name.localeCompare(b.name, "de");
        });

      const primaryEraId = w.bookDetails?.primaryEraId ?? null;
      const containedIn = containedInByBook.get(w.id) ?? [];
      const containsCount = containsCountByBook.get(w.id) ?? 0;
      const factionCount = w.factions.length;
      const locationCount = w.locations.length;
      const characterCount = w.characters.length;
      const hasDrift =
        hasResolvedDrift(factionAuditRows) ||
        hasResolvedDrift(locationAuditRows) ||
        hasResolvedDrift(characterAuditRows);
      const hasJunctionGap = factionCount === 0 || locationCount === 0 || characterCount === 0;

      return {
        id: w.id,
        slug: w.slug,
        title: w.title,
        synopsis: w.synopsis ?? null,
        coverUrl: w.coverUrl,
        releaseYear: w.releaseYear,
        startY: w.startY == null ? null : Number(w.startY),
        endY: w.endY == null ? null : Number(w.endY),
        format: w.bookDetails?.format ?? null,
        availability: w.bookDetails?.availability ?? null,
        pageCount: w.bookDetails?.pageCount ?? null,
        eraName: primaryEraId ? erasById.get(primaryEraId) ?? null : null,
        seriesName: w.bookDetails?.series?.name ?? null,
        seriesIndex: w.bookDetails?.seriesIndex ?? null,
        authors,
        otherPersons,
        factions,
        facets,
        containedIn,
        isEnriched:
          typeof w.synopsis === "string" && w.synopsis.trim().length > 0,
        updatedAt:
          w.updatedAt instanceof Date
            ? w.updatedAt
            : new Date(w.updatedAt as unknown as string),
        audit: {
          externalBookId: w.externalBookId,
          sourceKind: w.sourceKind,
          confidence: w.confidence,
          factionCount,
          locationCount,
          characterCount,
          containedInCount: containedIn.length,
          containsCount,
          hasDrift,
          hasJunctionGap,
          isSsot: w.sourceKind === "ssot",
          isInMultipleCollections: containedIn.length >= 2,
        },
      };
    });
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[/buecher] DB fetch failed (${msg}); rendering empty catalogue.`);
    return [];
  }
}

function sortBooks(books: CatalogueBook[], key: SortKey): CatalogueBook[] {
  const copy = [...books];
  if (key === "title") {
    copy.sort((a, b) => a.title.localeCompare(b.title, "de"));
  } else {
    copy.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  return copy;
}

function matchesAudit(book: CatalogueBook, filters: readonly AuditFilter[]): boolean {
  return filters.every((filter) => {
    if (filter === "drift") return book.audit.hasDrift;
    if (filter === "gap") return book.audit.hasJunctionGap;
    if (filter === "ssot") return book.audit.isSsot;
    return book.audit.isInMultipleCollections;
  });
}

function formatConfidence(value: string | null): string {
  if (value === null) return "—";
  return Number(value).toFixed(2);
}

function formatRelative(date: Date, now: Date): string {
  const diffMs = now.getTime() - date.getTime();
  const sec = Math.max(0, Math.round(diffMs / 1000));
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);

  if (sec < 30) return "gerade eben";
  if (min < 1) return `vor ${sec} Sek.`;
  if (hr < 1) return `vor ${min} Min.`;
  if (day < 1) return `vor ${hr} Std.`;
  if (day < 7) return `vor ${day} Tag${day === 1 ? "" : "en"}`;
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function auditEmptyCopy(filters: readonly AuditFilter[]): string {
  if (filters.length === 1 && filters[0] === "drift") {
    return "Keine Drift-Treffer in diesem Filter.";
  }
  return "Keine Bücher treffen diese Audit-Kombination.";
}

export default async function CataloguePage({ searchParams }: CataloguePageProps) {
  const sp = await searchParams;
  const sort = parseSort(sp.sort);
  const auditFilters = parseAudit(sp.audit);
  const isAuditMode = auditFilters.length > 0;

  const books = await loadBooks();
  const visibleBooks = isAuditMode
    ? books.filter((book) => matchesAudit(book, auditFilters))
    : books;
  const sorted = sortBooks(visibleBooks, sort);
  const enrichedCount = books.filter((b) => b.isEnriched).length;
  const now = new Date();

  return (
    <main className="catalogue-shell">
      <p className="catalogue-kicker">{"// Katalog"}</p>
      <h1 className="catalogue-title">Bücher</h1>
      <p className="catalogue-summary">
        {books.length === 0
          ? "Noch keine Bücher in der Datenbank."
          : isAuditMode
            ? `${sorted.length} Audit-Treffer von ${books.length} Büchern.`
            : `${enrichedCount} von ${books.length} mit Detailinhalt.`}
      </p>

      {books.length > 0 && (
        <div className="catalogue-controls">
          <SortPills active={sort} />
          <AuditPills active={auditFilters} />
        </div>
      )}

      {books.length === 0 ? (
        <div className="catalogue-empty">
          Die Datenbank ist leer. Sobald Bücher aufgenommen sind, erscheinen sie hier.
        </div>
      ) : sorted.length === 0 ? (
        <div className="catalogue-empty">{auditEmptyCopy(auditFilters)}</div>
      ) : (
        <ol className="catalogue-list">
          {sorted.map((b) => (
            <li key={b.id}>
              <BookRow book={b} now={now} auditMode={isAuditMode} />
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}

function BookRow({
  book,
  now,
  auditMode,
}: {
  book: CatalogueBook;
  now: Date;
  auditMode: boolean;
}) {
  const mBand = formatMBand(book.startY, book.endY);
  const formatLabel = book.format
    ? FORMAT_LABELS[book.format] ?? book.format
    : null;
  const availabilityLabel = book.availability
    ? AVAILABILITY_LABELS[book.availability] ?? book.availability
    : null;
  const metaParts = [
    formatLabel,
    book.pageCount != null ? `${book.pageCount} S.` : null,
    availabilityLabel,
    book.eraName,
    mBand,
    book.releaseYear != null ? String(book.releaseYear) : null,
  ].filter((v): v is string => Boolean(v));

  const updatedRel = formatRelative(book.updatedAt, now);
  const updatedAbs = book.updatedAt.toLocaleString("de-DE");
  const detailHref = auditMode ? `/buch/${book.slug}/audit` : `/buch/${book.slug}`;

  return (
    <details
      className={`catalogue-item ${book.isEnriched ? "is-enriched" : "is-stub"}${
        auditMode ? " is-audit" : ""
      }`}
    >
      <summary className="row-summary">
        <span className="row-chevron" aria-hidden>
          ›
        </span>
        <div className="row-main">
          <span className="row-title">{book.title}</span>
          {book.authors.length > 0 && (
            <span className="row-byline">von {book.authors.join(", ")}</span>
          )}
          {auditMode && (
            <span className="row-audit-summary">
              {book.audit.externalBookId ?? "—"} · {book.audit.sourceKind} · conf{" "}
              {formatConfidence(book.audit.confidence)} · f:{book.audit.factionCount} l:
              {book.audit.locationCount} c:{book.audit.characterCount}
            </span>
          )}
        </div>
        <div className="row-meta">
          {book.releaseYear != null && (
            <span className="row-year">{book.releaseYear}</span>
          )}
          <span className={book.isEnriched ? "badge-enriched" : "badge-stub"}>
            {book.isEnriched ? "Detailreich" : "Stub"}
          </span>
          <time
            className="row-updated"
            dateTime={book.updatedAt.toISOString()}
            title={updatedAbs}
          >
            {updatedRel}
          </time>
        </div>
      </summary>

      <div className="row-detail">
        <div className="row-detail-cover">
          {book.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.coverUrl}
              alt=""
              loading="lazy"
              width={140}
              height={210}
            />
          ) : (
            <div className="row-detail-cover-placeholder" aria-hidden>
              ?
            </div>
          )}
        </div>

        <div className="row-detail-body">
          {auditMode && (
            <div className="row-audit-strip">
              <span>ID {book.audit.externalBookId ?? "—"}</span>
              <span>{book.audit.sourceKind}</span>
              <span>conf {formatConfidence(book.audit.confidence)}</span>
              <span>
                junctions f:{book.audit.factionCount} l:{book.audit.locationCount} c:
                {book.audit.characterCount}
              </span>
              <span>
                enthalten in: {book.audit.containedInCount} · enthält:{" "}
                {book.audit.containsCount}
              </span>
            </div>
          )}

          {book.otherPersons.length > 0 && (
            <p className="row-detail-roles">
              {book.otherPersons
                .map((p) => `${PERSON_ROLE_LABELS[p.role] ?? p.role}: ${p.name}`)
                .join(" · ")}
            </p>
          )}

          {metaParts.length > 0 && (
            <p className="row-detail-meta">{metaParts.join(" · ")}</p>
          )}

          {book.synopsis && (
            <p className="row-detail-synopsis">{book.synopsis}</p>
          )}

          {book.factions.length > 0 && (
            <div className="row-tagrow">
              <span className="row-tagrow-label">Fraktionen</span>
              <ul className="row-tags">
                {book.factions.map((f) => (
                  <li key={f.id} className="tag tag-faction">
                    {f.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {book.facets.length > 0 && (
            <div className="row-tagrow">
              <span className="row-tagrow-label">Facetten</span>
              <ul className="row-tags">
                {book.facets.map((f) => (
                  <li
                    key={f.id}
                    className="tag tag-facet"
                    title={f.categoryName ?? f.categoryId}
                  >
                    {f.categoryName ? (
                      <>
                        <span className="tag-key">{f.categoryName}:</span>{" "}
                        {f.name}
                      </>
                    ) : (
                      f.name
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {book.containedIn.length > 0 && (
            <div className="row-tagrow">
              <span className="row-tagrow-label">Enthalten in</span>
              <ul className="row-tags">
                {book.containedIn.map((c) => (
                  <li key={c.slug} className="tag tag-collection">
                    <Link href={`/buch/${c.slug}`}>{c.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <footer className="row-detail-footer">
            {book.seriesName && (
              <span className="row-detail-series">
                {book.seriesName}
                {book.seriesIndex ? ` #${book.seriesIndex}` : ""}
              </span>
            )}
            <Link href={detailHref} className="row-detail-link">
              {auditMode ? "Audit öffnen →" : "Detailseite öffnen →"}
            </Link>
          </footer>
        </div>
      </div>
    </details>
  );
}
