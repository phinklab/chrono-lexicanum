/**
 * Live (Postgres) half of the book-detail data layer. SERVER-ONLY, imports
 * `@/db` — reached exclusively via lazy `import()` from `./loadBook` at
 * request time (Launch S4b Loader-Weiche, the entity `loader-live` pattern):
 * the on-demand long tail, ISR revalidation of hot pages, and the modal
 * intercept. At build time the façade serves the hot subset from the
 * committed snapshot.
 *
 * Error contract (S2, see `src/lib/db-cache.ts`): a missing works row returns
 * `null` (→ 404); DB/shape errors THROW into the caller's error boundary — an
 * outage must never read as a 404.
 */
import "server-only";
import { asc, eq, inArray, and } from "drizzle-orm";
import { isVisibleFacetCategory } from "@/lib/facet-visibility";
import { HOT_BOOK_SLUGS } from "./hot-subset";
import { db } from "@/db/client";
import {
  bookDetails as bookDetailsTable,
  characters as charactersTable,
  eras as erasTable,
  facetValues as facetValuesTable,
  factions as factionsTable,
  locations as locationsTable,
  persons as personsTable,
  series as seriesTable,
  workCharacters as workCharactersTable,
  workCollections as workCollectionsTable,
  workFacets as workFacetsTable,
  workFactions as workFactionsTable,
  workLocations as workLocationsTable,
  workPersons as workPersonsTable,
  works as worksTable,
} from "@/db/schema";

/**
 * The curated prerender set intersected with the live works table (kind =
 * 'book') — the book twin of `listHotEntityIdsLive`. A curated slug that has
 * since been renamed/merged away drops to on-demand rendering instead of
 * build-prerendering a 404.
 */
export async function listHotBookSlugsLive(): Promise<string[]> {
  const rows = await db
    .select({ slug: worksTable.slug })
    .from(worksTable)
    .where(
      and(eq(worksTable.kind, "book"), inArray(worksTable.slug, [...HOT_BOOK_SLUGS])),
    );
  const found = new Set(rows.map((r) => r.slug));
  return HOT_BOOK_SLUGS.filter((slug) => found.has(slug));
}

export async function loadBookLive(slug: string) {
  const [work] = await db
    .select({
      id: worksTable.id,
      slug: worksTable.slug,
      title: worksTable.title,
      synopsis: worksTable.synopsis,
      coverUrl: worksTable.coverUrl,
      releaseYear: worksTable.releaseYear,
    })
    .from(worksTable)
    .where(eq(worksTable.slug, slug))
    .limit(1);
  if (!work) return null;

  const [
    details,
    personRows,
    factionRows,
    locationRows,
    characterRows,
    facetRows,
    containedInRows,
  ] = await Promise.all([
    db
      .select({
        format: bookDetailsTable.format,
        isbn13: bookDetailsTable.isbn13,
        isbn10: bookDetailsTable.isbn10,
        seriesId: bookDetailsTable.seriesId,
        seriesName: seriesTable.name,
        seriesIndex: bookDetailsTable.seriesIndex,
        primaryEraId: bookDetailsTable.primaryEraId,
        eraName: erasTable.name,
      })
      .from(bookDetailsTable)
      .leftJoin(seriesTable, eq(seriesTable.id, bookDetailsTable.seriesId))
      .leftJoin(erasTable, eq(erasTable.id, bookDetailsTable.primaryEraId))
      .where(eq(bookDetailsTable.workId, work.id))
      .limit(1),
    db
      .select({
        id: personsTable.id,
        name: personsTable.name,
        role: workPersonsTable.role,
        displayOrder: workPersonsTable.displayOrder,
      })
      .from(workPersonsTable)
      .innerJoin(personsTable, eq(personsTable.id, workPersonsTable.personId))
      .where(eq(workPersonsTable.workId, work.id))
      .orderBy(asc(workPersonsTable.role), asc(workPersonsTable.displayOrder)),
    db
      .select({
        id: factionsTable.id,
        name: factionsTable.name,
        role: workFactionsTable.role,
      })
      .from(workFactionsTable)
      .innerJoin(factionsTable, eq(factionsTable.id, workFactionsTable.factionId))
      .where(eq(workFactionsTable.workId, work.id)),
    db
      .select({
        id: locationsTable.id,
        name: locationsTable.name,
        role: workLocationsTable.role,
      })
      .from(workLocationsTable)
      .innerJoin(locationsTable, eq(locationsTable.id, workLocationsTable.locationId))
      .where(eq(workLocationsTable.workId, work.id)),
    db
      .select({
        id: charactersTable.id,
        name: charactersTable.name,
        role: workCharactersTable.role,
      })
      .from(workCharactersTable)
      .innerJoin(charactersTable, eq(charactersTable.id, workCharactersTable.characterId))
      .where(eq(workCharactersTable.workId, work.id)),
    db
      .select({ name: facetValuesTable.name, category: facetValuesTable.categoryId })
      .from(workFacetsTable)
      .innerJoin(facetValuesTable, eq(facetValuesTable.id, workFacetsTable.facetValueId))
      .where(eq(workFacetsTable.workId, work.id)),
    db
      .select({
        collectionSlug: worksTable.slug,
        collectionTitle: worksTable.title,
      })
      .from(workCollectionsTable)
      .innerJoin(
        worksTable,
        eq(worksTable.id, workCollectionsTable.collectionWorkId),
      )
      .where(eq(workCollectionsTable.contentWorkId, work.id))
      .orderBy(asc(workCollectionsTable.displayOrder), asc(worksTable.title)),
  ]);

  return {
    ...work,
    format: details[0]?.format ?? null,
    isbn13: details[0]?.isbn13 ?? null,
    isbn10: details[0]?.isbn10 ?? null,
    seriesId: details[0]?.seriesId ?? null,
    seriesName: details[0]?.seriesName ?? null,
    seriesIndex: details[0]?.seriesIndex ?? null,
    primaryEraId: details[0]?.primaryEraId ?? null,
    eraName: details[0]?.eraName ?? null,
    persons: personRows,
    factions: factionRows,
    locations: locationRows,
    characters: characterRows,
    facets: facetRows.filter((f) => isVisibleFacetCategory(f.category)),
    containedIn: containedInRows,
  };
}

export type BookDetail = NonNullable<Awaited<ReturnType<typeof loadBookLive>>>;
