/**
 * Live (Postgres) half of the book-browse data layer. SERVER-ONLY, imports
 * `@/db` — reached exclusively via lazy `import()` from `./loader` at request
 * time (Launch S1b Loader-Weiche). At build time the façade reads the
 * committed snapshot instead; a static import of this module from any
 * prerendered route would break the DB-free build (`src/db/client.ts` throws
 * at import without DATABASE_URL).
 */
import "server-only";
import { db } from "@/db/client";
import { eras as erasTable } from "@/db/schema";
import { isVisibleFacetCategory } from "@/lib/facet-visibility";
import type {
  BrowseBook,
  BrowseData,
  BrowseFacet,
  BrowseFaction,
  EraOption,
} from "./loader";

/** Index contract (S2, see `src/lib/db-cache.ts`): DB errors throw — never an
 *  empty hall standing in for an outage. The projection selects only what the
 *  browse surface consumes (Launch S6 dead-field cut — synopsis, cover,
 *  setting dates, page count, era id and series index live on /book/[slug]). */
export async function fetchBrowseBooksLive(): Promise<BrowseData> {
  const [rows, erasRows] = await Promise.all([
    db.query.works.findMany({
      where: (w, { eq }) => eq(w.kind, "book"),
      columns: {
        id: true,
        slug: true,
        title: true,
        releaseYear: true,
      },
      with: {
        bookDetails: {
          columns: {
            format: true,
            primaryEraId: true,
          },
          with: { series: { columns: { name: true } } },
        },
        factions: {
          columns: { role: true },
          with: {
            faction: {
              columns: { id: true, name: true, alignment: true, parentId: true },
            },
          },
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

    const factions: BrowseFaction[] = w.factions
      .map((wf) => ({
        id: wf.faction.id,
        name: wf.faction.name,
        role: wf.role ?? null,
        alignment: wf.faction.alignment ?? null,
        parentId: wf.faction.parentId ?? null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "en"));

    const facets: BrowseFacet[] = w.facets
      .filter((wf) => isVisibleFacetCategory(wf.facetValue.categoryId))
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
      releaseYear: w.releaseYear,
      format: w.bookDetails?.format ?? null,
      eraName: eraId ? erasById.get(eraId) ?? null : null,
      seriesName: w.bookDetails?.series?.name ?? null,
      authors,
      factions,
      facets,
    };
  });

  const eras: EraOption[] = erasRows
    .map((e) => ({ id: e.id, name: e.name, sortOrder: e.sortOrder }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return { books, eras };
}

/** Live body of `bookSlugById` — see the façade in `./loader` for the contract. */
export async function bookSlugByIdLive(id: string): Promise<string | null> {
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
