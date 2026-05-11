import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db/client";
import SortPills from "./SortPills";

export const metadata: Metadata = { title: "Bücher — Chrono Lexicanum" };

type SortKey = "updated" | "title";

interface CataloguePageProps {
  searchParams: Promise<{ sort?: string }>;
}

interface CatalogueBook {
  id: string;
  slug: string;
  title: string;
  authors: string[];
  releaseYear: number | null;
  seriesName: string | null;
  seriesIndex: number | null;
  isEnriched: boolean;
  updatedAt: Date;
}

function parseSort(raw: string | undefined): SortKey {
  return raw === "title" ? "title" : "updated";
}

async function loadBooks(): Promise<CatalogueBook[]> {
  try {
    const rows = await db.query.works.findMany({
      where: (w, { eq }) => eq(w.kind, "book"),
      with: {
        bookDetails: {
          with: { series: { columns: { id: true, name: true } } },
        },
        persons: {
          where: (wp, { eq }) => eq(wp.role, "author"),
          with: { person: { columns: { name: true } } },
        },
      },
    });

    return rows.map((w) => ({
      id: w.id,
      slug: w.slug,
      title: w.title,
      authors: w.persons.map((wp) => wp.person.name),
      releaseYear: w.releaseYear,
      seriesName: w.bookDetails?.series?.name ?? null,
      seriesIndex: w.bookDetails?.seriesIndex ?? null,
      isEnriched:
        typeof w.synopsis === "string" && w.synopsis.trim().length > 0,
      updatedAt:
        w.updatedAt instanceof Date
          ? w.updatedAt
          : new Date(w.updatedAt as unknown as string),
    }));
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
        <table className="catalogue-table">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Autor</th>
              <th className="catalogue-col-year">Jahr</th>
              <th className="catalogue-col-series">Reihe</th>
              <th>Status</th>
              <th className="catalogue-col-updated">Zuletzt aktualisiert</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((b) => (
              <tr key={b.id} className={b.isEnriched ? "is-enriched" : "is-stub"}>
                <td className="catalogue-cell-title">
                  <Link href={`/buch/${b.slug}`}>{b.title}</Link>
                </td>
                <td>{b.authors.length > 0 ? b.authors.join(", ") : "—"}</td>
                <td className="catalogue-col-year">{b.releaseYear ?? "—"}</td>
                <td className="catalogue-col-series">
                  {b.seriesName
                    ? `${b.seriesName}${b.seriesIndex ? ` #${b.seriesIndex}` : ""}`
                    : "—"}
                </td>
                <td>
                  {b.isEnriched ? (
                    <span className="badge-enriched">Detailreich</span>
                  ) : (
                    <span className="badge-stub">Stub</span>
                  )}
                </td>
                <td className="catalogue-col-updated">
                  <time
                    dateTime={b.updatedAt.toISOString()}
                    title={b.updatedAt.toLocaleString("de-DE")}
                  >
                    {formatRelative(b.updatedAt, now)}
                  </time>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
