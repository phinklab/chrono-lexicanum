/**
 * Public-lean per-book detail page. /buch/eisenhorn-xenos
 *
 * Brief 073 (2026-05-14): audit/provenance fields moved to
 * /buch/[slug]/audit so this route can stay reader-facing.
 * Brief 096 (2026-05-23): rebuilt in the Warhammer-Optics direction —
 * vista photo backdrop, c-glass cover panel, cyan-chip junctions.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
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
import { FORMAT_LABELS } from "@/lib/book-labels";
import SiteBackground from "@/components/chrome/SiteBackground";
import { resolveRegion } from "@/lib/store-region";
import BuyListenActions from "@/components/book/BuyListenActions";
import RegionSwitcher from "@/components/book/RegionSwitcher";
import { type AudioCreditData } from "@/components/book/AudioCredit";

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
    facets: facetRows,
    containedIn: containedInRows,
  };
}

function roleSuffix(role: string | null, defaultRole: string): string {
  return role && role !== defaultRole ? ` · ${role}` : "";
}

const AUDIO_ROLES = new Set(["narrator", "co_narrator", "full_cast"]);
const AUDIO_ROLE_ORDER: Record<string, number> = {
  narrator: 0,
  co_narrator: 1,
  full_cast: 2,
};

/**
 * Brief 105 — collapse the audio-credit rows into a render shape. Cast dramas
 * (any `full_cast` role) render as an ensemble, never as a lone narrator.
 */
function buildAudioCredit(
  persons: { name: string; role: string; displayOrder: number }[],
): AudioCreditData | null {
  const audio = persons
    .filter((p) => AUDIO_ROLES.has(p.role))
    .sort(
      (a, b) =>
        (AUDIO_ROLE_ORDER[a.role] ?? 9) - (AUDIO_ROLE_ORDER[b.role] ?? 9) ||
        a.displayOrder - b.displayOrder,
    );
  if (audio.length === 0) return null;
  const names = audio.map((p) => p.name);
  if (audio.some((p) => p.role === "full_cast")) return { kind: "cast", names };
  if (names.length === 1) return { kind: "single", names };
  if (names.length === 2) return { kind: "duet", names };
  return { kind: "ensemble", names };
}

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ store?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const book = await loadBookBySlug(slug);
  if (!book) notFound();

  const region = await resolveRegion(sp.store);
  const audioCredit = buildAudioCredit(book.persons);
  const isbn = book.isbn13 ?? book.isbn10 ?? null;
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
    <main className="book-detail">
      <SiteBackground variant="vista" position="50% 22%" />

      <div className="book-detail__layout">
        <div className="book-detail__rail">
          <aside className="book-detail__cover-panel c-glass c-corners">
            {book.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={book.coverUrl}
                alt=""
                width={220}
                height={330}
                className="book-detail__cover-img"
              />
            ) : (
              <div className="book-detail__cover-missing" aria-hidden>
                ?
              </div>
            )}
          </aside>

          <BuyListenActions
            title={book.title}
            author={authors[0] ?? null}
            isbn={isbn}
            region={region}
            audio={audioCredit}
          />

          <RegionSwitcher active={region} />
        </div>

        <article className="book-detail__title-block">
          <div className="book-detail__eyebrow">{"// LECTIO PROFVNDA · BOOK"}</div>
          <h1 className="book-detail__title">{book.title}</h1>

          {authors.length > 0 && (
            <p className="book-detail__byline">by {authors.join(", ")}</p>
          )}

          {metaParts.length > 0 && (
            <p className="book-detail__meta">{metaParts.join(" · ")}</p>
          )}

          {book.containedIn.length > 0 && (
            <p className="book-detail__contained">
              Also contained in:{" "}
              {book.containedIn.map((c, i) => (
                <span key={c.collectionSlug}>
                  {i > 0 && ", "}
                  <Link
                    href={`/buch/${c.collectionSlug}`}
                    className="book-detail__contained-link"
                  >
                    {c.collectionTitle}
                  </Link>
                </span>
              ))}
            </p>
          )}

          {book.synopsis && (
            <p className="book-detail__synopsis">{book.synopsis}</p>
          )}

          {book.factions.length > 0 && (
            <section className="book-detail__section">
              <div className="book-detail__section-label">{"// FACTIONS"}</div>
              <span className="c-hairline" aria-hidden />
              <ul className="book-detail__chip-row">
                {book.factions.map((f) => (
                  <li key={f.id} className="book-detail__chip">
                    {f.name}
                    {roleSuffix(f.role, "supporting")}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {book.locations.length > 0 && (
            <section className="book-detail__section">
              <div className="book-detail__section-label">{"// LOCATIONS"}</div>
              <span className="c-hairline" aria-hidden />
              <ul className="book-detail__chip-row">
                {book.locations.map((l) => (
                  <li key={l.id} className="book-detail__chip">
                    {l.name}
                    {roleSuffix(l.role, "secondary")}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {book.characters.length > 0 && (
            <section className="book-detail__section">
              <div className="book-detail__section-label">{"// CHARACTERS"}</div>
              <span className="c-hairline" aria-hidden />
              <ul className="book-detail__chip-row">
                {book.characters.map((c) => (
                  <li key={c.id} className="book-detail__chip">
                    {c.name}
                    {roleSuffix(c.role, "appears")}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {book.facets.length > 0 && (
            <section className="book-detail__section">
              <div className="book-detail__section-label">{"// FACETS"}</div>
              <span className="c-hairline" aria-hidden />
              <ul className="book-detail__chip-row">
                {book.facets.map((f) => (
                  <li
                    key={`${f.category}-${f.name}`}
                    className="book-detail__chip book-detail__chip--mute"
                  >
                    {f.name}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <footer className="book-detail__footer">
            <Link
              href={`/buch/${book.slug}/audit`}
              className="book-detail__audit-link"
            >
              {"// audit"}
            </Link>
          </footer>
        </article>
      </div>
    </main>
  );
}
