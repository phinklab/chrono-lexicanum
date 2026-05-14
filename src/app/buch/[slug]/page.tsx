/**
 * Public-lean per-book detail page. /buch/eisenhorn-xenos
 *
 * Brief 073 (2026-05-14): audit/provenance fields moved to
 * /buch/[slug]/audit so this route can stay reader-facing.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
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
  workFacets as workFacetsTable,
  workFactions as workFactionsTable,
  workLocations as workLocationsTable,
  workPersons as workPersonsTable,
  works as worksTable,
} from "@/db/schema";
import { FORMAT_LABELS } from "@/lib/book-labels";

type Params = { slug: string };

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

  const [details, personRows, factionRows, locationRows, characterRows, facetRows] =
    await Promise.all([
      db
        .select({
          format: bookDetailsTable.format,
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
        .select({ name: personsTable.name, role: workPersonsTable.role })
        .from(workPersonsTable)
        .innerJoin(personsTable, eq(personsTable.id, workPersonsTable.personId))
        .where(eq(workPersonsTable.workId, work.id)),
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
    ]);

  return {
    ...work,
    format: details[0]?.format ?? null,
    seriesId: details[0]?.seriesId ?? null,
    seriesName: details[0]?.seriesName ?? null,
    seriesIndex: details[0]?.seriesIndex ?? null,
    primaryEraId: details[0]?.primaryEraId ?? null,
    eraName: details[0]?.eraName ?? null,
    persons: personRows,
    factions: factionRows,
    locations: locationRows,
    characters: characterRows,
    facets: facetRows,
  };
}

function roleSuffix(role: string | null, defaultRole: string): string {
  return role && role !== defaultRole ? ` · ${role}` : "";
}

export default async function BookPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const book = await loadBookBySlug(slug);
  if (!book) notFound();

  const authors = book.persons.filter((p) => p.role === "author").map((p) => p.name);
  const formatLabel = book.format ? FORMAT_LABELS[book.format] ?? book.format : null;
  const metaParts = [
    book.releaseYear != null ? String(book.releaseYear) : null,
    formatLabel,
    book.eraName,
    book.seriesName
      ? `${book.seriesName}${book.seriesIndex ? ` #${book.seriesIndex}` : ""}`
      : null,
  ].filter((v): v is string => Boolean(v));

  return (
    <main className="mx-auto max-w-5xl px-6 py-24">
      <div className="grid gap-10 md:grid-cols-[220px_minmax(0,1fr)]">
        <div className="md:pt-10">
          {book.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.coverUrl}
              alt=""
              width={220}
              height={330}
              className="aspect-[2/3] w-full max-w-[220px] border border-frost-400/25 object-cover"
            />
          ) : (
            <div
              className="grid aspect-[2/3] w-full max-w-[220px] place-items-center border border-dashed border-frost-400/25 font-cinzel text-5xl text-frost-500"
              aria-hidden
            >
              ?
            </div>
          )}
        </div>

        <article>
          <p className="font-mono text-xs uppercase text-frost-400">Buch</p>
          <h1 className="mt-3 font-cinzel text-4xl text-aquila md:text-5xl">
            {book.title}
          </h1>

          {authors.length > 0 && (
            <p className="mt-3 font-cormorant text-xl italic text-frost-200">
              von {authors.join(", ")}
            </p>
          )}

          {metaParts.length > 0 && (
            <p className="mt-4 font-mono text-xs text-frost-400">
              {metaParts.join(" · ")}
            </p>
          )}

          {book.synopsis && (
            <p className="mt-8 max-w-3xl font-reader text-lg leading-relaxed text-frost-50/85">
              {book.synopsis}
            </p>
          )}

          {book.factions.length > 0 && (
            <section className="mt-10">
              <h2 className="font-mono text-xs uppercase text-frost-400">Factions</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {book.factions.map((f) => (
                  <li
                    key={f.id}
                    className="border border-frost-400/40 px-2 py-1 font-mono text-xs text-frost-200"
                  >
                    {f.name}
                    {roleSuffix(f.role, "supporting")}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {book.locations.length > 0 && (
            <section className="mt-7">
              <h2 className="font-mono text-xs uppercase text-frost-400">Locations</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {book.locations.map((l) => (
                  <li
                    key={l.id}
                    className="border border-frost-400/40 px-2 py-1 font-mono text-xs text-frost-200"
                  >
                    {l.name}
                    {roleSuffix(l.role, "secondary")}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {book.characters.length > 0 && (
            <section className="mt-7">
              <h2 className="font-mono text-xs uppercase text-frost-400">Characters</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {book.characters.map((c) => (
                  <li
                    key={c.id}
                    className="border border-frost-400/40 px-2 py-1 font-mono text-xs text-frost-200"
                  >
                    {c.name}
                    {roleSuffix(c.role, "appears")}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {book.facets.length > 0 && (
            <section className="mt-7">
              <h2 className="font-mono text-xs uppercase text-frost-400">Tags</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {book.facets.map((f) => (
                  <li
                    key={`${f.category}-${f.name}`}
                    className="bg-frost-900/40 px-2 py-1 font-mono text-xs text-frost-300"
                  >
                    {f.name}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <footer className="mt-12 border-t border-frost-400/15 pt-5">
            <Link
              href={`/buch/${book.slug}/audit`}
              className="font-mono text-xs text-frost-500 underline decoration-frost-500/40 underline-offset-4 hover:text-frost-300"
            >
              {"// audit"}
            </Link>
          </footer>
        </article>
      </div>
    </main>
  );
}
