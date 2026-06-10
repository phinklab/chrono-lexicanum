/**
 * Public book-browse data layer (Brief 120). SERVER-ONLY (imports `@/db`).
 *
 * This is the lean, visitor-facing cousin of `/buecher`'s `loadBooks`: it loads
 * exactly what the public filters (`q`, `faction`, `format`, `facet`, `sort`)
 * and the row rendering need — no drift / alias / junction-gap / SSOT
 * audit machinery (that stays on the maintainer `/buecher` surface). One
 * `findMany` fan-out, wrapped try/catch → empty so an unreachable DB at build
 * time degrades to an empty hall instead of failing `next build` (the
 * `/buecher` + atlas pattern).
 */
import { db } from "@/db/client";
import { eras as erasTable } from "@/db/schema";

export interface BrowseFacet {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string | null;
}

export interface BrowseBook {
  id: string;
  slug: string;
  title: string;
  synopsis: string | null;
  coverUrl: string | null;
  releaseYear: number | null;
  startY: number | null;
  endY: number | null;
  format: string | null;
  pageCount: number | null;
  eraId: string | null;
  eraName: string | null;
  seriesName: string | null;
  seriesIndex: number | null;
  authors: string[];
  factions: Array<{ id: string; name: string }>;
  facets: BrowseFacet[];
}

export interface EraOption {
  id: string;
  name: string;
  sortOrder: number;
}

export interface BrowseData {
  books: BrowseBook[];
  /** All eras (sort-order asc) so the page can show them in canon sequence. */
  eras: EraOption[];
}

export async function loadBrowseBooks(): Promise<BrowseData> {
  try {
    const [rows, erasRows] = await Promise.all([
      db.query.works.findMany({
        where: (w, { eq }) => eq(w.kind, "book"),
        columns: {
          id: true,
          slug: true,
          title: true,
          synopsis: true,
          coverUrl: true,
          releaseYear: true,
          startY: true,
          endY: true,
        },
        with: {
          bookDetails: {
            columns: {
              format: true,
              pageCount: true,
              seriesIndex: true,
              primaryEraId: true,
            },
            with: { series: { columns: { name: true } } },
          },
          factions: {
            columns: {},
            with: { faction: { columns: { id: true, name: true } } },
          },
          facets: {
            columns: {},
            with: {
              facetValue: {
                columns: { id: true, name: true, categoryId: true },
                with: { category: { columns: { name: true } } },
              },
            },
          },
          persons: {
            columns: { role: true },
            with: { person: { columns: { name: true } } },
          },
        },
      }),
      db
        .select({
          id: erasTable.id,
          name: erasTable.name,
          sortOrder: erasTable.sortOrder,
        })
        .from(erasTable),
    ]);

    const erasById = new Map(erasRows.map((e) => [e.id, e.name]));

    const books: BrowseBook[] = rows.map((w) => {
      const authors = w.persons
        .filter((wp) => wp.role === "author")
        .map((wp) => wp.person.name);

      const factions = w.factions
        .map((wf) => ({ id: wf.faction.id, name: wf.faction.name }))
        .sort((a, b) => a.name.localeCompare(b.name, "en"));

      const facets: BrowseFacet[] = w.facets
        .map((wf) => ({
          id: wf.facetValue.id,
          name: wf.facetValue.name,
          categoryId: wf.facetValue.categoryId,
          categoryName: wf.facetValue.category?.name ?? null,
        }))
        .sort((a, b) => {
          const cat = (a.categoryName ?? "").localeCompare(
            b.categoryName ?? "",
            "en",
          );
          return cat !== 0 ? cat : a.name.localeCompare(b.name, "en");
        });

      const eraId = w.bookDetails?.primaryEraId ?? null;

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
        pageCount: w.bookDetails?.pageCount ?? null,
        eraId,
        eraName: eraId ? erasById.get(eraId) ?? null : null,
        seriesName: w.bookDetails?.series?.name ?? null,
        seriesIndex: w.bookDetails?.seriesIndex ?? null,
        authors,
        factions,
        facets,
      };
    });

    const eras: EraOption[] = erasRows
      .map((e) => ({ id: e.id, name: e.name, sortOrder: e.sortOrder }))
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return { books, eras };
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[/archive] DB fetch failed (${msg}); rendering empty hall.`);
    return { books: [], eras: [] };
  }
}

/**
 * Resolve a `?focus=<workId>` deep-link target to its book slug, independent of
 * the browse list above — robust against any future filter/limit on the
 * catalogue query (Brief 138's timeline chips link here). Unknown id, non-book
 * kind, malformed UUID or DB error all degrade to null (graceful no-op).
 */
export async function bookSlugById(id: string): Promise<string | null> {
  try {
    const row = await db.query.works.findFirst({
      where: (w, { and, eq }) => and(eq(w.id, id), eq(w.kind, "book")),
      columns: { slug: true },
    });
    return row?.slug ?? null;
  } catch {
    return null;
  }
}
