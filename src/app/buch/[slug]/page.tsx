/**
 * Per-book detail page. /buch/eisenhorn-xenos
 *
 * Brief 060 (2026-05-11): minimal end-to-end render so the SSOT-Apply round
 * trip is observable from the frontend (synopsis, author, factions, facet
 * tags).
 *
 * Brief 063 (2026-05-12): Locations + Characters sections added. Session 067
 * deliberately keeps raw_name out of this query so branch previews still work
 * before migration 0009 has been applied.
 */
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  bookDetails as bookDetailsTable,
  characters as charactersTable,
  facetValues as facetValuesTable,
  factions as factionsTable,
  locations as locationsTable,
  persons as personsTable,
  workCharacters as workCharactersTable,
  workFacets as workFacetsTable,
  workFactions as workFactionsTable,
  workLocations as workLocationsTable,
  workPersons as workPersonsTable,
  works as worksTable,
} from "@/db/schema";

type Params = { slug: string };

async function loadBookBySlug(slug: string) {
  const [work] = await db
    .select({
      id: worksTable.id,
      title: worksTable.title,
      synopsis: worksTable.synopsis,
      releaseYear: worksTable.releaseYear,
      sourceKind: worksTable.sourceKind,
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
          seriesIndex: bookDetailsTable.seriesIndex,
        })
        .from(bookDetailsTable)
        .where(eq(bookDetailsTable.workId, work.id))
        .limit(1),
      db
        .select({ name: personsTable.name, role: workPersonsTable.role })
        .from(workPersonsTable)
        .innerJoin(personsTable, eq(personsTable.id, workPersonsTable.personId))
        .where(eq(workPersonsTable.workId, work.id)),
      db
        .select({
          name: factionsTable.name,
          role: workFactionsTable.role,
        })
        .from(workFactionsTable)
        .innerJoin(factionsTable, eq(factionsTable.id, workFactionsTable.factionId))
        .where(eq(workFactionsTable.workId, work.id)),
      db
        .select({
          name: locationsTable.name,
          role: workLocationsTable.role,
        })
        .from(workLocationsTable)
        .innerJoin(locationsTable, eq(locationsTable.id, workLocationsTable.locationId))
        .where(eq(workLocationsTable.workId, work.id)),
      db
        .select({
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
    series: details[0]?.seriesId ?? null,
    seriesIndex: details[0]?.seriesIndex ?? null,
    persons: personRows,
    factions: factionRows,
    locations: locationRows,
    characters: characterRows,
    facets: facetRows,
  };
}

export default async function BookPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const book = await loadBookBySlug(slug);
  if (!book) notFound();

  const authors = book.persons.filter((p) => p.role === "author").map((p) => p.name);

  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-frost-400">Buch</p>
      <h1 className="mt-3 font-cinzel text-4xl text-aquila">{book.title}</h1>

      {authors.length > 0 && (
        <p className="mt-2 font-mono text-sm text-frost-300">by {authors.join(", ")}</p>
      )}

      {(book.releaseYear || book.format) && (
        <p className="mt-1 font-mono text-xs text-frost-400">
          {[book.releaseYear, book.format].filter(Boolean).join(" · ")}
        </p>
      )}

      {book.synopsis && (
        <p className="mt-6 font-cormorant text-lg leading-relaxed text-frost-50/85">
          {book.synopsis}
        </p>
      )}

      {book.factions.length > 0 && (
        <section className="mt-8">
          <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-frost-400">Factions</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {book.factions.map((f) => (
              <li
                key={f.name}
                className="rounded border border-frost-400/40 px-2 py-1 font-mono text-xs text-frost-200"
              >
                {f.name}
                {f.role && f.role !== "supporting" ? ` · ${f.role}` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}

      {book.locations.length > 0 && (
        <section className="mt-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-frost-400">Locations</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {book.locations.map((l) => (
              <li
                key={l.name}
                className="rounded border border-frost-400/40 px-2 py-1 font-mono text-xs text-frost-200"
              >
                {l.name}
                {l.role && l.role !== "secondary" ? ` · ${l.role}` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}

      {book.characters.length > 0 && (
        <section className="mt-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-frost-400">Characters</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {book.characters.map((c) => (
              <li
                key={c.name}
                className="rounded border border-frost-400/40 px-2 py-1 font-mono text-xs text-frost-200"
              >
                {c.name}
                {c.role && c.role !== "appears" ? ` · ${c.role}` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}

      {book.facets.length > 0 && (
        <section className="mt-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-frost-400">Tags</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {book.facets.map((f) => (
              <li
                key={`${f.category}-${f.name}`}
                className="rounded bg-frost-900/40 px-2 py-1 font-mono text-xs text-frost-300"
              >
                {f.name}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
