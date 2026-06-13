/**
 * Book-detail data layer (Brief 120 polish). SERVER-ONLY (imports `@/db`).
 *
 * Extracted verbatim from the old inline loader in `buch/[slug]/page.tsx` so the
 * canonical page AND the `@modal/(.)buch` intercept share one DB fan-out and one
 * source of truth — zero fork, exactly like `src/lib/entity/loader.ts`.
 *
 * Wrapped in React `cache()` (per-request memo: `generateMetadata` + the default
 * export dedupe to a single fan-out) with try/catch → null so one flaky row
 * degrades to a 404 instead of failing `next build`.
 */
import "server-only";
import { cache } from "react";
import { asc, eq } from "drizzle-orm";
import { isVisibleFacetCategory } from "@/lib/facet-visibility";
import { cachedRead } from "@/lib/db-cache";
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

async function loadBookBySlug(slug: string) {
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

/**
 * Load one book's full detail payload by slug, or null if missing/unloadable.
 * `cache()`-memoised per request; shared by the canonical page + the modal.
 *
 * The per-slug `cachedRead` layer (Report 144 § P.4) serves repeat visits from
 * Next's persistent Data Cache instead of re-running the 8-query fan-out on
 * every request — under load the uncached route degraded from 0.21 s to a 90 s
 * timeout. One book's payload is a few KB, far under the 2 MB cache cap. A
 * missing slug caches as `null` (a stable 404 is a legitimate result); a DB
 * error is never cached and degrades to `null` for that one request. The
 * `books` tag is invalidated by `POST /api/revalidate` after ingestion.
 */
export const loadBook = cache(async (slug: string) => {
  try {
    return await cachedRead(() => loadBookBySlug(slug), ["book", slug], {
      tags: ["books"],
    })();
  } catch {
    return null;
  }
});

export type BookDetail = NonNullable<Awaited<ReturnType<typeof loadBook>>>;
