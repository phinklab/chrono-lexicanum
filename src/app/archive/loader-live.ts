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

/**
 * Browse rows carry a *teaser*, not the full synopsis — the catalogue renders
 * all ~900 expanded row bodies into one HTML document, and full synopses were
 * the single biggest driver of its measured 16.45 MB payload.
 * The full text lives one click away on `/buch/[slug]`. Cut at a
 * word boundary near the cap so the teaser never ends mid-word.
 */
const SYNOPSIS_TEASER_MAX = 280;

function synopsisTeaser(raw: string | null): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;
  if (s.length <= SYNOPSIS_TEASER_MAX) return s;
  const cut = s.slice(0, SYNOPSIS_TEASER_MAX);
  const lastSpace = cut.lastIndexOf(" ");
  const safe = lastSpace > SYNOPSIS_TEASER_MAX - 80 ? cut.slice(0, lastSpace) : cut;
  return `${safe.trimEnd()}…`;
}

export async function fetchBrowseBooksLive(): Promise<BrowseData> {
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
        synopsis: synopsisTeaser(w.synopsis),
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
