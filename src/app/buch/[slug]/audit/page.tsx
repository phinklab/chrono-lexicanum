import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getIsAdmin } from "@/lib/atlas/auth";
import { db } from "@/db/client";
import {
  bookDetails as bookDetailsTable,
  characters as charactersTable,
  externalLinks as externalLinksTable,
  facetCategories as facetCategoriesTable,
  facetValues as facetValuesTable,
  factions as factionsTable,
  locations as locationsTable,
  persons as personsTable,
  services as servicesTable,
  workCharacters as workCharactersTable,
  workCollections as workCollectionsTable,
  workFacets as workFacetsTable,
  workFactions as workFactionsTable,
  workLocations as workLocationsTable,
  workPersons as workPersonsTable,
  works as worksTable,
} from "@/db/schema";
import { classifyDrift, type DriftClass } from "@/lib/aliases";

export const metadata: Metadata = {
  title: "Buch-Audit — Chrono Lexicanum",
  robots: { index: false, follow: false },
};

type Params = { slug: string };
type PrimitiveValue = string | number | Date | null | undefined;

const FIELD_EMPTY = "—";
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

async function loadAuditWork(slug: string) {
  const [work] = await db
    .select({
      id: worksTable.id,
      kind: worksTable.kind,
      canonicity: worksTable.canonicity,
      slug: worksTable.slug,
      title: worksTable.title,
      coverUrl: worksTable.coverUrl,
      synopsis: worksTable.synopsis,
      startY: worksTable.startY,
      endY: worksTable.endY,
      releaseYear: worksTable.releaseYear,
      externalBookId: worksTable.externalBookId,
      sourceKind: worksTable.sourceKind,
      confidence: worksTable.confidence,
      createdAt: worksTable.createdAt,
      updatedAt: worksTable.updatedAt,
    })
    .from(worksTable)
    .where(eq(worksTable.slug, slug))
    .limit(1);

  if (!work) return null;

  const [
    details,
    persons,
    factions,
    locations,
    characters,
    facets,
    containedIn,
    contains,
    externalLinks,
  ] = await Promise.all([
    db
      .select({
        workId: bookDetailsTable.workId,
        isbn13: bookDetailsTable.isbn13,
        isbn10: bookDetailsTable.isbn10,
        seriesId: bookDetailsTable.seriesId,
        seriesIndex: bookDetailsTable.seriesIndex,
        pageCount: bookDetailsTable.pageCount,
        format: bookDetailsTable.format,
        availability: bookDetailsTable.availability,
        rating: bookDetailsTable.rating,
        ratingSource: bookDetailsTable.ratingSource,
        ratingCount: bookDetailsTable.ratingCount,
        primaryEraId: bookDetailsTable.primaryEraId,
        notes: bookDetailsTable.notes,
      })
      .from(bookDetailsTable)
      .where(eq(bookDetailsTable.workId, work.id))
      .limit(1),
    db
      .select({
        role: workPersonsTable.role,
        displayOrder: workPersonsTable.displayOrder,
        note: workPersonsTable.note,
        name: personsTable.name,
      })
      .from(workPersonsTable)
      .innerJoin(personsTable, eq(personsTable.id, workPersonsTable.personId))
      .where(eq(workPersonsTable.workId, work.id))
      .orderBy(asc(workPersonsTable.displayOrder), asc(personsTable.name)),
    db
      .select({
        id: factionsTable.id,
        name: factionsTable.name,
        role: workFactionsTable.role,
        rawName: workFactionsTable.rawName,
      })
      .from(workFactionsTable)
      .innerJoin(factionsTable, eq(factionsTable.id, workFactionsTable.factionId))
      .where(eq(workFactionsTable.workId, work.id))
      .orderBy(asc(workFactionsTable.role), asc(factionsTable.name)),
    db
      .select({
        id: locationsTable.id,
        name: locationsTable.name,
        role: workLocationsTable.role,
        rawName: workLocationsTable.rawName,
        atY: workLocationsTable.atY,
      })
      .from(workLocationsTable)
      .innerJoin(locationsTable, eq(locationsTable.id, workLocationsTable.locationId))
      .where(eq(workLocationsTable.workId, work.id))
      .orderBy(asc(workLocationsTable.role), asc(locationsTable.name)),
    db
      .select({
        id: charactersTable.id,
        name: charactersTable.name,
        role: workCharactersTable.role,
        rawName: workCharactersTable.rawName,
      })
      .from(workCharactersTable)
      .innerJoin(charactersTable, eq(charactersTable.id, workCharactersTable.characterId))
      .where(eq(workCharactersTable.workId, work.id))
      .orderBy(asc(workCharactersTable.role), asc(charactersTable.name)),
    db
      .select({
        categoryId: facetCategoriesTable.id,
        categoryName: facetCategoriesTable.name,
        valueId: facetValuesTable.id,
        valueName: facetValuesTable.name,
      })
      .from(workFacetsTable)
      .innerJoin(facetValuesTable, eq(facetValuesTable.id, workFacetsTable.facetValueId))
      .innerJoin(
        facetCategoriesTable,
        eq(facetCategoriesTable.id, facetValuesTable.categoryId),
      )
      .where(eq(workFacetsTable.workId, work.id))
      .orderBy(asc(facetCategoriesTable.displayOrder), asc(facetValuesTable.displayOrder)),
    db
      .select({
        collectionSlug: worksTable.slug,
        collectionTitle: worksTable.title,
        displayOrder: workCollectionsTable.displayOrder,
        confidence: workCollectionsTable.confidence,
        basis: workCollectionsTable.basis,
      })
      .from(workCollectionsTable)
      .innerJoin(worksTable, eq(worksTable.id, workCollectionsTable.collectionWorkId))
      .where(eq(workCollectionsTable.contentWorkId, work.id))
      .orderBy(asc(workCollectionsTable.displayOrder), asc(worksTable.title)),
    db
      .select({
        contentSlug: worksTable.slug,
        contentTitle: worksTable.title,
        displayOrder: workCollectionsTable.displayOrder,
        confidence: workCollectionsTable.confidence,
        basis: workCollectionsTable.basis,
      })
      .from(workCollectionsTable)
      .innerJoin(worksTable, eq(worksTable.id, workCollectionsTable.contentWorkId))
      .where(eq(workCollectionsTable.collectionWorkId, work.id))
      .orderBy(asc(workCollectionsTable.displayOrder), asc(worksTable.title)),
    db
      .select({
        serviceName: servicesTable.name,
        kind: externalLinksTable.kind,
        url: externalLinksTable.url,
      })
      .from(externalLinksTable)
      .innerJoin(servicesTable, eq(servicesTable.id, externalLinksTable.serviceId))
      .where(eq(externalLinksTable.workId, work.id))
      .orderBy(asc(externalLinksTable.displayOrder), asc(servicesTable.name)),
  ]);

  return {
    work,
    details: details[0] ?? null,
    persons,
    factions,
    locations,
    characters,
    facets,
    containedIn,
    contains,
    externalLinks,
  };
}

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function formatValue(value: PrimitiveValue): string {
  if (value === null || value === undefined || value === "") return FIELD_EMPTY;
  if (value instanceof Date) return dateFormatter.format(value);
  return String(value);
}

function isEmptyValue(value: PrimitiveValue): boolean {
  return value === null || value === undefined || value === "";
}

function formatConfidence(value: string | null): string {
  if (value === null) return FIELD_EMPTY;
  return Number(value).toFixed(2);
}

function formatTimestamp(value: Date | string): string {
  return dateFormatter.format(asDate(value));
}

function DriftMarker({ cls }: { cls: DriftClass }) {
  if (cls === "drift") return <span className="entity-drift">drift</span>;
  if (cls === "known-alias") {
    return (
      <span className="entity-alias" title="Registered edition-rename alias — expected, not drift">
        known alias
      </span>
    );
  }
  return null;
}

function driftRowClass(cls: DriftClass): string {
  if (cls === "drift") return "has-drift";
  if (cls === "known-alias") return "has-alias";
  return "";
}

function FieldGrid({
  fields,
}: {
  fields: ReadonlyArray<{ label: string; value: PrimitiveValue; wide?: boolean }>;
}) {
  return (
    <dl className="audit-field-grid">
      {fields.map((field) => (
        <div key={field.label} className={field.wide ? "audit-field is-wide" : "audit-field"}>
          <dt>{field.label}</dt>
          <dd className={isEmptyValue(field.value) ? "is-empty" : ""}>
            {formatValue(field.value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function AuditSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="audit-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function EmptyRow({ label }: { label?: string }) {
  return <p className="audit-empty">{label ?? FIELD_EMPTY}</p>;
}

export default async function BookAuditPage({ params }: { params: Promise<Params> }) {
  // Admin-only: provenance internals (source_kind, confidence, raw names,
  // drift markers). Read-only — the page has no server action and no write
  // path — but it is internal tooling, not public surface. The proxy 401s it
  // in prod; this gate is the defense-in-depth layer.
  if (!(await getIsAdmin())) notFound();

  const { slug } = await params;
  const audit = await loadAuditWork(slug);
  if (!audit) notFound();

  const { work, details } = audit;
  const workFields = [
    { label: "id", value: work.id },
    { label: "slug", value: work.slug },
    { label: "title", value: work.title },
    { label: "synopsis", value: work.synopsis, wide: true },
    { label: "coverUrl", value: work.coverUrl, wide: true },
    { label: "releaseYear", value: work.releaseYear },
    { label: "startY", value: work.startY },
    { label: "endY", value: work.endY },
    { label: "kind", value: work.kind },
    { label: "canonicity", value: work.canonicity },
    { label: "sourceKind", value: work.sourceKind },
    { label: "confidence", value: work.confidence },
    { label: "externalBookId", value: work.externalBookId },
    { label: "createdAt", value: asDate(work.createdAt) },
    { label: "updatedAt", value: asDate(work.updatedAt) },
  ];
  const detailFields = [
    { label: "isbn13", value: details?.isbn13 },
    { label: "isbn10", value: details?.isbn10 },
    { label: "seriesId", value: details?.seriesId },
    { label: "seriesIndex", value: details?.seriesIndex },
    { label: "pageCount", value: details?.pageCount },
    { label: "format", value: details?.format },
    { label: "availability", value: details?.availability },
    { label: "rating", value: details?.rating },
    { label: "ratingSource", value: details?.ratingSource },
    { label: "ratingCount", value: details?.ratingCount },
    { label: "primaryEraId", value: details?.primaryEraId },
    { label: "notes", value: details?.notes, wide: true },
  ];

  return (
    <main className="audit-shell">
      <header className="audit-header">
        <div>
          <p className="audit-kicker">{"Cogitator-Audit · provenance"}</p>
          <h1>{work.title}</h1>
          <div className="audit-header-strip" aria-label="Audit provenance">
            <span>{work.externalBookId ?? FIELD_EMPTY}</span>
            <span>{work.sourceKind}</span>
            <span>conf {formatConfidence(work.confidence)}</span>
            <time dateTime={asDate(work.updatedAt).toISOString()}>
              {formatTimestamp(work.updatedAt)}
            </time>
          </div>
        </div>
        <Link href={`/buch/${work.slug}`} className="audit-back-link">
          Public view
        </Link>
      </header>

      <AuditSection title="Work fields">
        <FieldGrid fields={workFields} />
      </AuditSection>

      <AuditSection title="Book details">
        <FieldGrid fields={detailFields} />
      </AuditSection>

      <AuditSection title="Persons">
        {audit.persons.length === 0 ? (
          <EmptyRow />
        ) : (
          <div className="audit-table-wrap">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>role</th>
                  <th>displayOrder</th>
                  <th>note</th>
                </tr>
              </thead>
              <tbody>
                {audit.persons.map((person) => (
                  <tr key={`${person.name}-${person.role}-${person.displayOrder}`}>
                    <td>{person.name}</td>
                    <td>{person.role}</td>
                    <td>{person.displayOrder}</td>
                    <td className={person.note ? "" : "is-empty"}>
                      {formatValue(person.note)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AuditSection>

      <AuditSection title="Factions">
        {audit.factions.length === 0 ? (
          <EmptyRow />
        ) : (
          <ul className="audit-entity-list">
            {audit.factions.map((faction) => {
              const cls = classifyDrift("faction", faction.rawName, faction.id, faction.name);
              return (
                <li key={faction.id} className={driftRowClass(cls)}>
                  <span className="entity-name">{faction.name}</span>
                  <span className="entity-id">{faction.id}</span>
                  <span className="entity-role">{faction.role ?? FIELD_EMPTY}</span>
                  <span className={faction.rawName ? "entity-raw" : "entity-raw is-empty"}>
                    raw: {formatValue(faction.rawName)}
                  </span>
                  <DriftMarker cls={cls} />
                </li>
              );
            })}
          </ul>
        )}
      </AuditSection>

      <AuditSection title="Locations">
        {audit.locations.length === 0 ? (
          <EmptyRow />
        ) : (
          <ul className="audit-entity-list">
            {audit.locations.map((location) => {
              const cls = classifyDrift("location", location.rawName, location.id, location.name);
              return (
                <li key={location.id} className={driftRowClass(cls)}>
                  <span className="entity-name">{location.name}</span>
                  <span className="entity-id">{location.id}</span>
                  <span className="entity-role">{location.role ?? FIELD_EMPTY}</span>
                  <span className="entity-role">at_y {formatValue(location.atY)}</span>
                  <span className={location.rawName ? "entity-raw" : "entity-raw is-empty"}>
                    raw: {formatValue(location.rawName)}
                  </span>
                  <DriftMarker cls={cls} />
                </li>
              );
            })}
          </ul>
        )}
      </AuditSection>

      <AuditSection title="Characters">
        {audit.characters.length === 0 ? (
          <EmptyRow />
        ) : (
          <ul className="audit-entity-list">
            {audit.characters.map((character) => {
              const cls = classifyDrift("character", character.rawName, character.id, character.name);
              return (
                <li key={character.id} className={driftRowClass(cls)}>
                  <span className="entity-name">{character.name}</span>
                  <span className="entity-id">{character.id}</span>
                  <span className="entity-role">{character.role ?? FIELD_EMPTY}</span>
                  <span className={character.rawName ? "entity-raw" : "entity-raw is-empty"}>
                    raw: {formatValue(character.rawName)}
                  </span>
                  <DriftMarker cls={cls} />
                </li>
              );
            })}
          </ul>
        )}
      </AuditSection>

      <AuditSection title="Facets / Tags">
        {audit.facets.length === 0 ? (
          <EmptyRow />
        ) : (
          <ul className="audit-facet-list">
            {audit.facets.map((facet) => (
              <li key={facet.valueId}>
                <span>{facet.categoryName}</span>
                <strong>{facet.valueName}</strong>
              </li>
            ))}
          </ul>
        )}
      </AuditSection>

      <AuditSection title="Collections">
        <div className="audit-collection-grid">
          <div>
            <h3>Contained in</h3>
            {audit.containedIn.length === 0 ? (
              <EmptyRow label="Contained in: none" />
            ) : (
              <ul className="audit-linked-list">
                {audit.containedIn.map((row) => (
                  <li key={row.collectionSlug}>
                    <Link href={`/buch/${row.collectionSlug}`}>{row.collectionTitle}</Link>
                    <span>order {row.displayOrder}</span>
                    <span>conf {formatConfidence(row.confidence)}</span>
                    <p>{formatValue(row.basis)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3>Contains</h3>
            {audit.contains.length === 0 ? (
              <EmptyRow label="Contains: none" />
            ) : (
              <ul className="audit-linked-list">
                {audit.contains.map((row) => (
                  <li key={row.contentSlug}>
                    <Link href={`/buch/${row.contentSlug}`}>{row.contentTitle}</Link>
                    <span>order {row.displayOrder}</span>
                    <span>conf {formatConfidence(row.confidence)}</span>
                    <p>{formatValue(row.basis)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </AuditSection>

      <AuditSection title="External links">
        {audit.externalLinks.length === 0 ? (
          <EmptyRow />
        ) : (
          <ul className="audit-linked-list">
            {audit.externalLinks.map((link) => (
              <li key={`${link.serviceName}-${link.kind}-${link.url}`}>
                <a href={link.url} rel="noreferrer" target="_blank">
                  {link.serviceName}
                </a>
                <span>{link.kind}</span>
                <p>{link.url}</p>
              </li>
            ))}
          </ul>
        )}
      </AuditSection>
    </main>
  );
}
