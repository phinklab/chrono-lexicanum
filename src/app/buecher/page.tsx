import type { Metadata } from "next";
import Link from "next/link";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import {
  eras as erasTable,
  workCollections as workCollectionsTable,
  works as worksTable,
} from "@/db/schema";
import SortPills from "./SortPills";

export const metadata: Metadata = { title: "Bücher — Chrono Lexicanum" };

type SortKey = "updated" | "title";

interface CataloguePageProps {
  searchParams: Promise<{ sort?: string }>;
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
}

const FORMAT_LABELS: Record<string, string> = {
  novel: "Roman",
  novella: "Novelle",
  short_story: "Kurzgeschichte",
  anthology: "Anthologie",
  audio_drama: "Hörspiel",
  omnibus: "Sammelband",
  collection: "Sammlung",
  artbook: "Artbook",
  scriptbook: "Drehbuch",
};

const AVAILABILITY_LABELS: Record<string, string> = {
  in_print: "In Druck",
  oop_recent: "Kürzlich vergriffen",
  oop_legacy: "Vergriffen",
  unavailable: "Nicht verfügbar",
};

const ROLE_LABELS: Record<string, string> = {
  co_author: "Co-Autor",
  translator: "Übersetzung",
  editor: "Herausgeber",
  narrator: "Erzähler",
  co_narrator: "Co-Erzähler",
  full_cast: "Sprechercast",
  director: "Regie",
  co_director: "Co-Regie",
  cover_artist: "Cover",
  sound_designer: "Sound-Design",
};

function parseSort(raw: string | undefined): SortKey {
  return raw === "title" ? "title" : "updated";
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
    const collectionRows =
      bookIds.length === 0
        ? []
        : await db
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
            .where(inArray(workCollectionsTable.contentWorkId, bookIds));

    const collectionsByBook = new Map<string, CatalogueCollection[]>();
    for (const r of collectionRows) {
      const arr = collectionsByBook.get(r.contentWorkId) ?? [];
      arr.push({ slug: r.collectionSlug, title: r.collectionTitle });
      collectionsByBook.set(r.contentWorkId, arr);
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
        containedIn: collectionsByBook.get(w.id) ?? [],
        isEnriched:
          typeof w.synopsis === "string" && w.synopsis.trim().length > 0,
        updatedAt:
          w.updatedAt instanceof Date
            ? w.updatedAt
            : new Date(w.updatedAt as unknown as string),
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

export default async function CataloguePage({ searchParams }: CataloguePageProps) {
  const sp = await searchParams;
  const sort = parseSort(sp.sort);

  const books = await loadBooks();
  const sorted = sortBooks(books, sort);
  const enrichedCount = books.filter((b) => b.isEnriched).length;
  const now = new Date();

  return (
    <main className="catalogue-shell">
      <p className="catalogue-kicker">{"// Katalog"}</p>
      <h1 className="catalogue-title">Bücher</h1>
      <p className="catalogue-summary">
        {books.length === 0
          ? "Noch keine Bücher in der Datenbank."
          : `${enrichedCount} von ${books.length} mit Detailinhalt.`}
      </p>

      {books.length > 0 && <SortPills active={sort} />}

      {books.length === 0 ? (
        <div className="catalogue-empty">
          Die Datenbank ist leer. Sobald Bücher aufgenommen sind, erscheinen sie hier.
        </div>
      ) : (
        <ol className="catalogue-list">
          {sorted.map((b) => (
            <li key={b.id}>
              <BookRow book={b} now={now} />
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}

function BookRow({ book, now }: { book: CatalogueBook; now: Date }) {
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

  return (
    <details
      className={`catalogue-item ${book.isEnriched ? "is-enriched" : "is-stub"}`}
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
          {book.otherPersons.length > 0 && (
            <p className="row-detail-roles">
              {book.otherPersons
                .map((p) => `${ROLE_LABELS[p.role] ?? p.role}: ${p.name}`)
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
            <Link href={`/buch/${book.slug}`} className="row-detail-link">
              Detailseite öffnen →
            </Link>
          </footer>
        </div>
      </div>
    </details>
  );
}
