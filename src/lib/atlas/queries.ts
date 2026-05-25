/**
 * Atlas queries (Task 2 — Atlas-Brücke).
 *
 * `getBridgeStats()` returns row counts + headline aggregates for all 12
 * decks in a single flat `Promise.all`. Strikt parallel — no waterfalls,
 * no relational `findMany`. Budget: cold-start < 1.5 s against the Supabase
 * pooler.
 *
 * `getWerkeRows()` duplicates the `loadBooks` Drizzle shape from
 * `src/app/buecher/page.tsx` (incl. audit-computation: drift, junction-gap,
 * ssot, contained-in). The duplication is intentional per Task 2 brief —
 * a later cleanup could fold `/buecher` into a thin re-render of this data
 * minus the audit columns, not now.
 *
 * Junctions-Drilldown (Slice 5, follow-up task): `/atlas/junctions` will
 * expand into a 6-panel browser over (work_factions, work_characters,
 * work_locations, work_persons, work_facets, work_collections). Per panel:
 * rowCount, drift-count (rawName != canonical.name), gap-count (works
 * without any junction-row in that table). A two-side picker (canonical
 * entity left → linked works right with rawName, confidence, both detail
 * links) drives the audit-trail / find-drift / find-gaps use cases.
 */
import { and, countDistinct, eq, inArray, isNotNull, max, min, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  bookDetails,
  characters,
  eras as erasTable,
  externalLinks,
  facetCategories,
  facetValues,
  factions,
  locations,
  persons,
  sectors,
  series,
  services,
  submissions,
  workCharacters,
  workCollections as workCollectionsTable,
  workFacets,
  workFactions,
  workLocations,
  workPersons,
  works as worksTable,
} from "@/db/schema";
import type { BridgeStats } from "./types";

// =============================================================================
// Bridge — 12 decks, strictly parallel.
// =============================================================================

const fmtN = (n: number): string => new Intl.NumberFormat("de-DE").format(n);

const fmtAvg = (numerator: number, denom: number): string => {
  if (denom === 0) return "—";
  return new Intl.NumberFormat("de-DE", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(numerator / denom);
};

const fmtPct = (numerator: number, denom: number): string => {
  if (denom === 0) return "—";
  return `${Math.round((numerator / denom) * 100)} %`;
};

const toMillennium = (n: number): number => Math.floor(n / 1000);

const fmtMRange = (lo: number | null, hi: number | null): string => {
  if (lo == null || hi == null) return "—";
  const loM = toMillennium(lo);
  const hiM = toMillennium(hi);
  return loM === hiM ? `M${loM}` : `M${loM} – M${hiM}`;
};

const toNumber = (v: unknown): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  return 0;
};

const toDate = (v: unknown): Date | null => {
  if (v instanceof Date) return v;
  if (typeof v === "string" && v.length > 0) return new Date(v);
  return null;
};

const n = (row: ReadonlyArray<{ n: number }>): number => Number(row[0]?.n ?? 0);

export async function getBridgeStats(): Promise<BridgeStats> {
  const t = await Promise.all([
    // 0 — werke rowCount (works.kind=book)
    db.select({ n: sql<number>`count(*)::int` }).from(worksTable).where(eq(worksTable.kind, "book")),
    // 1 — werke ssot count
    db.select({ n: sql<number>`count(*)::int` })
      .from(worksTable)
      .where(and(eq(worksTable.kind, "book"), eq(worksTable.sourceKind, "ssot"))),
    // 2 — werke lastUpdated (MAX(updatedAt) WHERE kind=book)
    db.select({ v: max(worksTable.updatedAt) }).from(worksTable).where(eq(worksTable.kind, "book")),

    // 3 — fraktionen rowCount
    db.select({ n: sql<number>`count(*)::int` }).from(factions),
    // 4 — fraktionen imperium count
    db.select({ n: sql<number>`count(*)::int` }).from(factions).where(eq(factions.alignment, "imperium")),

    // 5 — charaktere rowCount
    db.select({ n: sql<number>`count(*)::int` }).from(characters),
    // 6 — workCharacters total (for Ø Appearances / Char)
    db.select({ n: sql<number>`count(*)::int` }).from(workCharacters),

    // 7 — welten rowCount
    db.select({ n: sql<number>`count(*)::int` }).from(locations),
    // 8 — welten mit Karten-Koordinaten (gx IS NOT NULL)
    db.select({ n: sql<number>`count(*)::int` }).from(locations).where(isNotNull(locations.gx)),

    // 9 — sektoren rowCount
    db.select({ n: sql<number>`count(*)::int` }).from(sectors),
    // 10 — locations mit Sektor-Zuordnung (für Ø Welten/Sektor)
    db.select({ n: sql<number>`count(*)::int` }).from(locations).where(isNotNull(locations.sectorId)),

    // 11 — aeren rowCount
    db.select({ n: sql<number>`count(*)::int` }).from(erasTable),
    // 12 — aeren M-range (min start, max end)
    db.select({ lo: min(erasTable.startY), hi: max(erasTable.endY) }).from(erasTable),

    // 13 — serien rowCount
    db.select({ n: sql<number>`count(*)::int` }).from(series),
    // 14 — bookDetails mit seriesId (für Ø Bände/Serie)
    db.select({ n: sql<number>`count(*)::int` }).from(bookDetails).where(isNotNull(bookDetails.seriesId)),

    // 15 — personen rowCount
    db.select({ n: sql<number>`count(*)::int` }).from(persons),
    // 16 — distincte Autoren (workPersons.role='author')
    db.select({ n: countDistinct(workPersons.personId) })
      .from(workPersons)
      .where(eq(workPersons.role, "author")),

    // 17 — submissions rowCount
    db.select({ n: sql<number>`count(*)::int` }).from(submissions),
    // 18 — submissions pending
    db.select({ n: sql<number>`count(*)::int` })
      .from(submissions)
      .where(eq(submissions.status, "pending")),
    // 19 — submissions lastUpdated (MAX createdAt)
    db.select({ v: max(submissions.createdAt) }).from(submissions),

    // 20 — facets rowCount = facet_categories
    db.select({ n: sql<number>`count(*)::int` }).from(facetCategories),
    // 21 — facet_values
    db.select({ n: sql<number>`count(*)::int` }).from(facetValues),

    // 22 — services rowCount
    db.select({ n: sql<number>`count(*)::int` }).from(services),
    // 23 — externalLinks count
    db.select({ n: sql<number>`count(*)::int` }).from(externalLinks),

    // 24-29 — junction-Tabellen, einzeln (Σ ergibt junctions-rowCount)
    db.select({ n: sql<number>`count(*)::int` }).from(workFactions),
    db.select({ n: sql<number>`count(*)::int` }).from(workCharacters),
    db.select({ n: sql<number>`count(*)::int` }).from(workLocations),
    db.select({ n: sql<number>`count(*)::int` }).from(workPersons),
    db.select({ n: sql<number>`count(*)::int` }).from(workFacets),
    db.select({ n: sql<number>`count(*)::int` }).from(workCollectionsTable),
  ]);

  const werkeCount = n(t[0]);
  const werkeSsot = n(t[1]);
  const werkeUpdated = toDate(t[2][0]?.v);

  const fraktionenCount = n(t[3]);
  const imperiumCount = n(t[4]);

  const charaktereCount = n(t[5]);
  const workCharCount = n(t[6]);

  const weltenCount = n(t[7]);
  const weltenMapped = n(t[8]);

  const sektorenCount = n(t[9]);
  const weltenInSektoren = n(t[10]);

  const aerenCount = n(t[11]);
  const aerenLo = toNumber(t[12][0]?.lo);
  const aerenHi = toNumber(t[12][0]?.hi);
  const aerenLoVal = t[12][0]?.lo == null ? null : aerenLo;
  const aerenHiVal = t[12][0]?.hi == null ? null : aerenHi;

  const serienCount = n(t[13]);
  const bookDetailsWithSeries = n(t[14]);

  const personenCount = n(t[15]);
  const distinctAutoren = n(t[16]);

  const submissionsCount = n(t[17]);
  const submissionsPending = n(t[18]);
  const submissionsUpdated = toDate(t[19][0]?.v);

  const facetCatsCount = n(t[20]);
  const facetValuesCount = n(t[21]);

  const servicesCount = n(t[22]);
  const externalLinksCount = n(t[23]);

  const jWf = n(t[24]);
  const jWc = n(t[25]);
  const jWl = n(t[26]);
  const jWp = n(t[27]);
  const jWfac = n(t[28]);
  const jWcol = n(t[29]);
  const junctionTotal = jWf + jWc + jWl + jWp + jWfac + jWcol;

  return {
    werke: {
      rowCount: werkeCount,
      lastUpdated: werkeUpdated,
      primaryStat: { label: "SSOT-ANTEIL", value: fmtPct(werkeSsot, werkeCount) },
    },
    fraktionen: {
      rowCount: fraktionenCount,
      lastUpdated: null,
      primaryStat: { label: "IMPERIUM", value: fmtN(imperiumCount) },
    },
    charaktere: {
      rowCount: charaktereCount,
      lastUpdated: null,
      primaryStat: {
        label: "Ø WERK-AUFTRITTE",
        value: fmtAvg(workCharCount, charaktereCount),
      },
    },
    welten: {
      rowCount: weltenCount,
      lastUpdated: null,
      primaryStat: { label: "KARTIERT", value: fmtN(weltenMapped) },
    },
    sektoren: {
      rowCount: sektorenCount,
      lastUpdated: null,
      primaryStat: {
        label: "Ø WELTEN/SEKTOR",
        value: fmtAvg(weltenInSektoren, sektorenCount),
      },
    },
    aeren: {
      rowCount: aerenCount,
      lastUpdated: null,
      primaryStat: { label: "ZEITSPANNE", value: fmtMRange(aerenLoVal, aerenHiVal) },
    },
    serien: {
      rowCount: serienCount,
      lastUpdated: null,
      primaryStat: {
        label: "Ø BÄNDE/SERIE",
        value: fmtAvg(bookDetailsWithSeries, serienCount),
      },
    },
    personen: {
      rowCount: personenCount,
      lastUpdated: null,
      primaryStat: { label: "AUTOREN", value: fmtN(distinctAutoren) },
    },
    submissions: {
      rowCount: submissionsCount,
      lastUpdated: submissionsUpdated,
      primaryStat: { label: "PENDING", value: fmtN(submissionsPending) },
    },
    facets: {
      rowCount: facetCatsCount,
      lastUpdated: null,
      primaryStat: { label: "WERTE", value: fmtN(facetValuesCount) },
    },
    services: {
      rowCount: servicesCount,
      lastUpdated: null,
      primaryStat: { label: "EXT. LINKS", value: fmtN(externalLinksCount) },
    },
    junctions: {
      rowCount: junctionTotal,
      lastUpdated: null,
      primaryStat: { label: "PHASE", value: "2" },
    },
  } satisfies BridgeStats;
}

// =============================================================================
// Werke list — duplicates loadBooks() from src/app/buecher/page.tsx.
// =============================================================================

export interface WerkeRow {
  id: string;
  slug: string;
  title: string;
  authors: string[];
  releaseYear: number | null;
  startY: number | null;
  endY: number | null;
  eraName: string | null;
  primaryFaction: string | null;
  factionCount: number;
  characterCount: number;
  locationCount: number;
  format: string | null;
  pageCount: number | null;
  availability: string | null;
  sourceKind: string;
  confidence: string | null;
  externalBookId: string | null;
  containedIn: ReadonlyArray<{ slug: string; title: string }>;
  containsCount: number;
  driftCount: number;
  hasDrift: boolean;
  hasJunctionGap: boolean;
  isSsot: boolean;
  isInMultipleCollections: boolean;
  isEnriched: boolean;
  updatedAt: Date;
}

function countResolvedDrift(
  rows: ReadonlyArray<{ rawName: string | null; name: string }>,
): number {
  let n = 0;
  for (const row of rows) {
    if (row.rawName !== null && row.rawName !== "" && row.rawName !== row.name) n++;
  }
  return n;
}

export async function getWerkeRows(): Promise<WerkeRow[]> {
  try {
    const [rows, erasRows] = await Promise.all([
      db.query.works.findMany({
        where: (w, { eq: eqOp }) => eqOp(w.kind, "book"),
        with: {
          bookDetails: true,
          factions: {
            with: { faction: { columns: { id: true, name: true } } },
          },
          locations: {
            with: { location: { columns: { id: true, name: true } } },
          },
          characters: {
            with: { character: { columns: { id: true, name: true } } },
          },
          persons: {
            with: { person: { columns: { name: true } } },
          },
        },
      }),
      db.select({ id: erasTable.id, name: erasTable.name }).from(erasTable),
    ]);

    const erasById = new Map(erasRows.map((e) => [e.id, e.name]));
    const bookIds = rows.map((r) => r.id);

    const [containedInRows, containsRows] =
      bookIds.length === 0
        ? [[], []]
        : await Promise.all([
            db
              .select({
                contentWorkId: workCollectionsTable.contentWorkId,
                collectionSlug: worksTable.slug,
                collectionTitle: worksTable.title,
              })
              .from(workCollectionsTable)
              .innerJoin(
                worksTable,
                eq(worksTable.id, workCollectionsTable.collectionWorkId),
              )
              .where(inArray(workCollectionsTable.contentWorkId, bookIds)),
            db
              .select({ collectionWorkId: workCollectionsTable.collectionWorkId })
              .from(workCollectionsTable)
              .where(inArray(workCollectionsTable.collectionWorkId, bookIds)),
          ]);

    const containedInByBook = new Map<string, Array<{ slug: string; title: string }>>();
    for (const r of containedInRows) {
      const arr = containedInByBook.get(r.contentWorkId) ?? [];
      arr.push({ slug: r.collectionSlug, title: r.collectionTitle });
      containedInByBook.set(r.contentWorkId, arr);
    }

    const containsCountByBook = new Map<string, number>();
    for (const r of containsRows) {
      containsCountByBook.set(
        r.collectionWorkId,
        (containsCountByBook.get(r.collectionWorkId) ?? 0) + 1,
      );
    }

    return rows
      .map((w): WerkeRow => {
        const authors: string[] = [];
        for (const wp of w.persons) {
          if (wp.role === "author") authors.push(wp.person.name);
        }

        const factions = w.factions
          .map((wf) => ({ id: wf.faction.id, name: wf.faction.name }))
          .sort((a, b) => a.name.localeCompare(b.name, "de"));

        const factionAuditRows = w.factions.map((wf) => ({
          name: wf.faction.name,
          rawName: wf.rawName,
        }));
        const locationAuditRows = w.locations.map((wl) => ({
          name: wl.location.name,
          rawName: wl.rawName,
        }));
        const characterAuditRows = w.characters.map((wc) => ({
          name: wc.character.name,
          rawName: wc.rawName,
        }));

        const factionCount = w.factions.length;
        const characterCount = w.characters.length;
        const locationCount = w.locations.length;
        const driftCount =
          countResolvedDrift(factionAuditRows) +
          countResolvedDrift(locationAuditRows) +
          countResolvedDrift(characterAuditRows);
        const hasJunctionGap =
          factionCount === 0 || locationCount === 0 || characterCount === 0;

        const containedIn = containedInByBook.get(w.id) ?? [];
        const containsCount = containsCountByBook.get(w.id) ?? 0;
        const primaryEraId = w.bookDetails?.primaryEraId ?? null;

        return {
          id: w.id,
          slug: w.slug,
          title: w.title,
          authors,
          releaseYear: w.releaseYear,
          startY: w.startY == null ? null : Number(w.startY),
          endY: w.endY == null ? null : Number(w.endY),
          eraName: primaryEraId ? erasById.get(primaryEraId) ?? null : null,
          primaryFaction: factions[0]?.name ?? null,
          factionCount,
          characterCount,
          locationCount,
          format: w.bookDetails?.format ?? null,
          pageCount: w.bookDetails?.pageCount ?? null,
          availability: w.bookDetails?.availability ?? null,
          sourceKind: w.sourceKind,
          confidence: w.confidence,
          externalBookId: w.externalBookId,
          containedIn,
          containsCount,
          driftCount,
          hasDrift: driftCount > 0,
          hasJunctionGap,
          isSsot: w.sourceKind === "ssot",
          isInMultipleCollections: containedIn.length >= 2,
          isEnriched: typeof w.synopsis === "string" && w.synopsis.trim().length > 0,
          updatedAt:
            w.updatedAt instanceof Date
              ? w.updatedAt
              : new Date(w.updatedAt as unknown as string),
        };
      })
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[/atlas/werke] DB fetch failed (${msg}); rendering empty.`);
    return [];
  }
}

