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
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  eras as erasTable,
  workCollections as workCollectionsTable,
  works as worksTable,
} from "@/db/schema";
import type { BridgeStats } from "./types";
import { tallyAxisDrift } from "@/lib/aliases";
import { coerceDate } from "@/lib/dates";

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

/**
 * Decode a Postgres array value coming back over postgres.js. The client runs
 * with `fetch_types: false` (src/db/client.ts — the transaction pooler
 * misbehaves with type introspection), which disables array decoding: an
 * `array_agg(...)` column arrives as the raw Postgres array literal *string* —
 * `"{author,narrator}"` — never a JS array. (Until this helper existed, the
 * `Array.isArray` guard at the one call site always fell through to `[]`,
 * silently emptying every consumer of `roles` — e.g. the Compendium "Authors"
 * category resolved to zero people.) This parses the literal into a `string[]`,
 * honouring quoted/escaped elements and dropping unquoted SQL NULLs. An
 * already-decoded array passes straight through, so the call site stays correct
 * if `fetch_types` is ever re-enabled. Route any future `array_agg` through here.
 */
const parsePgTextArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((x) => String(x));
  if (typeof value !== "string") return [];
  const body = value.trim();
  if (!body.startsWith("{") || !body.endsWith("}")) return [];
  const inner = body.slice(1, -1);
  if (inner === "") return [];

  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  let elemQuoted = false;
  const flush = () => {
    // An unquoted NULL token is SQL NULL → drop it; quoted "NULL" is the string.
    if (!(cur === "NULL" && !elemQuoted)) out.push(cur);
    cur = "";
    elemQuoted = false;
  };
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (inQuotes) {
      if (ch === "\\") cur += inner[++i] ?? "";
      else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') {
      inQuotes = true;
      elemQuoted = true;
    } else if (ch === ",") {
      flush();
    } else {
      cur += ch;
    }
  }
  flush();
  return out;
};

/**
 * Shape-check a raw `db.execute()` result before treating it as a row set
 * (Report 144 § T.1). The raw-SQL paths here are deliberate (`fetch_types:
 * false` + transaction pooler — see the header), but the old
 * `as unknown as ReadonlyArray<…>` double-casts asserted the shape blind: on
 * schema drift or a driver change they would have broken *silently* into the
 * per-field `toNumber`/`String()` guards. This validates the one structural
 * assumption (array of plain row objects) at runtime and throws loudly into
 * each query's existing try/catch → degraded-empty path. Field-level coercion
 * stays with `toNumber`/`toDate`/`parsePgTextArray` as before.
 */
function validateSqlResult(result: unknown): ReadonlyArray<Record<string, unknown>> {
  if (!Array.isArray(result)) {
    throw new Error("[atlas/queries] SQL result is not a row array");
  }
  const rows: Array<Record<string, unknown>> = [];
  for (const row of result) {
    if (typeof row !== "object" || row === null || Array.isArray(row)) {
      throw new Error("[atlas/queries] SQL result row is not a plain object");
    }
    rows.push(row);
  }
  return rows;
}

export async function getBridgeStats(): Promise<BridgeStats> {
  // Single round-trip — pgbouncer transaction-mode + postgres-js chokes
  // hard on 30 parallel COUNTs from the same request (statement_timeout
  // cancellations at high pool sizes, or seconds-long stalls at low ones).
  // Collapsing every deck aggregate into one statement makes each query
  // cost a single sequential scan on a tiny table and keeps the whole
  // call comfortably under the 1.5 s cold-start budget.
  const rows = validateSqlResult(await db.execute(sql`
    SELECT
      (SELECT count(*)::int                  FROM works        WHERE kind = 'book')                          AS werke_count,
      (SELECT count(*)::int                  FROM works        WHERE kind = 'book' AND source_kind = 'ssot') AS werke_ssot,
      (SELECT max(updated_at)                FROM works        WHERE kind = 'book')                          AS werke_updated,
      (SELECT count(*)::int                  FROM factions)                                                  AS fraktionen_count,
      (SELECT count(*)::int                  FROM factions     WHERE alignment = 'imperium')                 AS imperium_count,
      (SELECT count(*)::int                  FROM characters)                                                AS charaktere_count,
      (SELECT count(*)::int                  FROM work_characters)                                           AS work_char_count,
      (SELECT count(*)::int                  FROM locations)                                                 AS welten_count,
      (SELECT count(*)::int                  FROM locations    WHERE gx IS NOT NULL)                         AS welten_mapped,
      (SELECT count(*)::int                  FROM sectors)                                                   AS sektoren_count,
      (SELECT count(*)::int                  FROM locations    WHERE sector_id IS NOT NULL)                  AS welten_in_sektoren,
      (SELECT count(*)::int                  FROM eras)                                                      AS aeren_count,
      (SELECT min(start_y)                   FROM eras)                                                      AS aeren_lo,
      (SELECT max(end_y)                     FROM eras)                                                      AS aeren_hi,
      (SELECT count(*)::int                  FROM series)                                                    AS serien_count,
      (SELECT count(*)::int                  FROM book_details WHERE series_id IS NOT NULL)                  AS book_details_with_series,
      (SELECT count(*)::int                  FROM persons)                                                   AS personen_count,
      (SELECT count(DISTINCT person_id)::int FROM work_persons WHERE role = 'author')                        AS distinct_autoren,
      (SELECT count(*)::int                  FROM submissions)                                               AS submissions_count,
      (SELECT count(*)::int                  FROM submissions  WHERE status = 'pending')                     AS submissions_pending,
      (SELECT max(created_at)                FROM submissions)                                               AS submissions_updated,
      (SELECT count(*)::int                  FROM facet_categories)                                          AS facet_cats,
      (SELECT count(*)::int                  FROM facet_values)                                              AS facet_values_count,
      (SELECT count(*)::int                  FROM services)                                                  AS services_count,
      (SELECT count(*)::int                  FROM external_links)                                            AS external_links_count,
      (SELECT count(*)::int                  FROM work_factions)                                             AS j_wf,
      (SELECT count(*)::int                  FROM work_characters)                                           AS j_wc,
      (SELECT count(*)::int                  FROM work_locations)                                            AS j_wl,
      (SELECT count(*)::int                  FROM work_persons)                                              AS j_wp,
      (SELECT count(*)::int                  FROM work_facets)                                               AS j_wfac,
      (SELECT count(*)::int                  FROM work_collections)                                          AS j_wcol
  `));

  const r = rows[0] ?? {};
  const num = (k: string): number => toNumber(r[k]);

  const werkeCount = num("werke_count");
  const werkeSsot = num("werke_ssot");
  const fraktionenCount = num("fraktionen_count");
  const imperiumCount = num("imperium_count");
  const charaktereCount = num("charaktere_count");
  const workCharCount = num("work_char_count");
  const weltenCount = num("welten_count");
  const weltenMapped = num("welten_mapped");
  const sektorenCount = num("sektoren_count");
  const weltenInSektoren = num("welten_in_sektoren");
  const aerenCount = num("aeren_count");
  const aerenLoVal = r["aeren_lo"] == null ? null : toNumber(r["aeren_lo"]);
  const aerenHiVal = r["aeren_hi"] == null ? null : toNumber(r["aeren_hi"]);
  const serienCount = num("serien_count");
  const bookDetailsWithSeries = num("book_details_with_series");
  const personenCount = num("personen_count");
  const distinctAutoren = num("distinct_autoren");
  const submissionsCount = num("submissions_count");
  const submissionsPending = num("submissions_pending");
  const facetCatsCount = num("facet_cats");
  const facetValuesCount = num("facet_values_count");
  const servicesCount = num("services_count");
  const externalLinksCount = num("external_links_count");
  const junctionTotal =
    num("j_wf") + num("j_wc") + num("j_wl") + num("j_wp") + num("j_wfac") + num("j_wcol");

  return {
    werke: {
      rowCount: werkeCount,
      lastUpdated: toDate(r["werke_updated"]),
      primaryStat: { label: "SSOT SHARE", value: fmtPct(werkeSsot, werkeCount) },
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
        label: "AVG APPEARANCES",
        value: fmtAvg(workCharCount, charaktereCount),
      },
    },
    welten: {
      rowCount: weltenCount,
      lastUpdated: null,
      primaryStat: { label: "MAPPED", value: fmtN(weltenMapped) },
    },
    sektoren: {
      rowCount: sektorenCount,
      lastUpdated: null,
      primaryStat: {
        label: "AVG WORLDS/SECTOR",
        value: fmtAvg(weltenInSektoren, sektorenCount),
      },
    },
    aeren: {
      rowCount: aerenCount,
      lastUpdated: null,
      primaryStat: { label: "TIMESPAN", value: fmtMRange(aerenLoVal, aerenHiVal) },
    },
    serien: {
      rowCount: serienCount,
      lastUpdated: null,
      primaryStat: {
        label: "AVG VOL/SERIES",
        value: fmtAvg(bookDetailsWithSeries, serienCount),
      },
    },
    personen: {
      rowCount: personenCount,
      lastUpdated: null,
      primaryStat: { label: "AUTHORS", value: fmtN(distinctAutoren) },
    },
    submissions: {
      rowCount: submissionsCount,
      lastUpdated: toDate(r["submissions_updated"]),
      primaryStat: { label: "PENDING", value: fmtN(submissionsPending) },
    },
    facets: {
      rowCount: facetCatsCount,
      lastUpdated: null,
      primaryStat: { label: "VALUES", value: fmtN(facetValuesCount) },
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
  knownAliasCount: number;
  hasJunctionGap: boolean;
  isSsot: boolean;
  isInMultipleCollections: boolean;
  isEnriched: boolean;
  updatedAt: Date;
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

        const factionDrift = tallyAxisDrift(
          "faction",
          w.factions.map((wf) => ({
            rawName: wf.rawName,
            canonicalId: wf.faction.id,
            canonicalName: wf.faction.name,
          })),
        );
        const locationDrift = tallyAxisDrift(
          "location",
          w.locations.map((wl) => ({
            rawName: wl.rawName,
            canonicalId: wl.location.id,
            canonicalName: wl.location.name,
          })),
        );
        const characterDrift = tallyAxisDrift(
          "character",
          w.characters.map((wc) => ({
            rawName: wc.rawName,
            canonicalId: wc.character.id,
            canonicalName: wc.character.name,
          })),
        );

        const factionCount = w.factions.length;
        const characterCount = w.characters.length;
        const locationCount = w.locations.length;
        // driftCount counts only *suspicious* drift (state 3); known edition
        // renames (state 2) are tallied separately so they leave the bucket.
        const driftCount =
          factionDrift.suspectCount +
          locationDrift.suspectCount +
          characterDrift.suspectCount;
        const knownAliasCount =
          factionDrift.knownAliasCount +
          locationDrift.knownAliasCount +
          characterDrift.knownAliasCount;
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
          knownAliasCount,
          hasJunctionGap,
          isSsot: w.sourceKind === "ssot",
          isInMultipleCollections: containedIn.length >= 2,
          isEnriched: typeof w.synopsis === "string" && w.synopsis.trim().length > 0,
          updatedAt: coerceDate(w.updatedAt),
        };
      })
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[/atlas/werke] DB fetch failed (${msg}); rendering empty.`);
    return [];
  }
}

// =============================================================================
// Slice-3 admin inventory rows (Task 4B). One DB round-trip per query;
// counts come from `LEFT JOIN (… GROUP BY …)` subqueries so we never fan
// out per-row COUNTs. Pgbouncer / pool context from `getBridgeStats`
// applies — no parallel aggregate storms across these three.
// =============================================================================

export interface FraktionRow {
  id: string;
  name: string;
  alignment: string;
  parentId: string | null;
  workCount: number;
  characterCount: number;
}

export async function getFraktionenRows(): Promise<FraktionRow[]> {
  try {
    const rows = validateSqlResult(await db.execute(sql`
      SELECT
        f.id,
        f.name,
        f.alignment,
        f.parent_id,
        COALESCE(wf.cnt, 0)::int AS work_count,
        COALESCE(c.cnt, 0)::int  AS character_count
      FROM factions f
      LEFT JOIN (
        SELECT faction_id, count(*)::int AS cnt
        FROM work_factions
        GROUP BY faction_id
      ) wf ON wf.faction_id = f.id
      LEFT JOIN (
        SELECT primary_faction_id, count(*)::int AS cnt
        FROM characters
        WHERE primary_faction_id IS NOT NULL
        GROUP BY primary_faction_id
      ) c ON c.primary_faction_id = f.id
    `));

    return rows
      .map((r): FraktionRow => ({
        id: String(r["id"]),
        name: String(r["name"]),
        alignment: String(r["alignment"]),
        parentId: r["parent_id"] == null ? null : String(r["parent_id"]),
        workCount: toNumber(r["work_count"]),
        characterCount: toNumber(r["character_count"]),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "de"));
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[/atlas/fraktionen] DB fetch failed (${msg}); rendering empty.`);
    return [];
  }
}

export interface WeltenRow {
  id: string;
  name: string;
  sectorId: string | null;
  sectorName: string | null;
  gx: number | null;
  gy: number | null;
  capital: boolean;
  warp: boolean;
  workCount: number;
}

export async function getWeltenRows(): Promise<WeltenRow[]> {
  try {
    const rows = validateSqlResult(await db.execute(sql`
      SELECT
        l.id,
        l.name,
        l.sector_id,
        s.name AS sector_name,
        l.gx,
        l.gy,
        l.capital,
        l.warp,
        COALESCE(wl.cnt, 0)::int AS work_count
      FROM locations l
      LEFT JOIN sectors s ON s.id = l.sector_id
      LEFT JOIN (
        SELECT location_id, count(*)::int AS cnt
        FROM work_locations
        GROUP BY location_id
      ) wl ON wl.location_id = l.id
    `));

    return rows
      .map((r): WeltenRow => ({
        id: String(r["id"]),
        name: String(r["name"]),
        sectorId: r["sector_id"] == null ? null : String(r["sector_id"]),
        sectorName: r["sector_name"] == null ? null : String(r["sector_name"]),
        gx: r["gx"] == null ? null : toNumber(r["gx"]),
        gy: r["gy"] == null ? null : toNumber(r["gy"]),
        capital: r["capital"] === true,
        warp: r["warp"] === true,
        workCount: toNumber(r["work_count"]),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "de"));
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[/atlas/welten] DB fetch failed (${msg}); rendering empty.`);
    return [];
  }
}

export interface CharaktereRow {
  id: string;
  name: string;
  primaryFactionId: string | null;
  primaryFactionName: string | null;
  primaryFactionAlignment: string | null;
  workCount: number;
}

export async function getCharaktereRows(): Promise<CharaktereRow[]> {
  try {
    const rows = validateSqlResult(await db.execute(sql`
      SELECT
        c.id,
        c.name,
        c.primary_faction_id,
        f.name      AS faction_name,
        f.alignment AS faction_alignment,
        COALESCE(wc.cnt, 0)::int AS work_count
      FROM characters c
      LEFT JOIN factions f ON f.id = c.primary_faction_id
      LEFT JOIN (
        SELECT character_id, count(*)::int AS cnt
        FROM work_characters
        GROUP BY character_id
      ) wc ON wc.character_id = c.id
    `));

    return rows
      .map((r): CharaktereRow => ({
        id: String(r["id"]),
        name: String(r["name"]),
        primaryFactionId:
          r["primary_faction_id"] == null ? null : String(r["primary_faction_id"]),
        primaryFactionName:
          r["faction_name"] == null ? null : String(r["faction_name"]),
        primaryFactionAlignment:
          r["faction_alignment"] == null ? null : String(r["faction_alignment"]),
        workCount: toNumber(r["work_count"]),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "de"));
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[/atlas/charaktere] DB fetch failed (${msg}); rendering empty.`);
    return [];
  }
}

// =============================================================================
// Slice-4 reference inventory rows (Task 4C). Pure catalogue decks — no
// public detail surface yet, so the pages render them as non-clickable
// admin inventory. Same single-roundtrip / LEFT JOIN ... GROUP BY shape
// as 4B; counts come from book_details / work_persons sub-aggregates so
// the queries stay flat.
// =============================================================================

export interface SektorenRow {
  id: string;
  name: string;
  hasLabel: boolean;
  locationCount: number;
  mappedCount: number;
  capitalCount: number;
  warpCount: number;
}

export async function getSektorenRows(): Promise<SektorenRow[]> {
  try {
    const rows = validateSqlResult(await db.execute(sql`
      SELECT
        s.id,
        s.name,
        s.label_x,
        s.label_y,
        COALESCE(l.cnt, 0)::int     AS location_count,
        COALESCE(l.mapped, 0)::int  AS mapped_count,
        COALESCE(l.capital, 0)::int AS capital_count,
        COALESCE(l.warp, 0)::int    AS warp_count
      FROM sectors s
      LEFT JOIN (
        SELECT
          sector_id,
          count(*)::int                                AS cnt,
          count(*) FILTER (WHERE gx IS NOT NULL)::int  AS mapped,
          count(*) FILTER (WHERE capital = true)::int  AS capital,
          count(*) FILTER (WHERE warp = true)::int     AS warp
        FROM locations
        WHERE sector_id IS NOT NULL
        GROUP BY sector_id
      ) l ON l.sector_id = s.id
    `));

    return rows
      .map((r): SektorenRow => ({
        id: String(r["id"]),
        name: String(r["name"]),
        hasLabel: r["label_x"] != null && r["label_y"] != null,
        locationCount: toNumber(r["location_count"]),
        mappedCount: toNumber(r["mapped_count"]),
        capitalCount: toNumber(r["capital_count"]),
        warpCount: toNumber(r["warp_count"]),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "de"));
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[/atlas/sektoren] DB fetch failed (${msg}); rendering empty.`);
    return [];
  }
}

export interface AereRow {
  id: string;
  name: string;
  startY: number | null;
  endY: number | null;
  sortOrder: number;
  workCount: number;
}

export async function getAerenRows(): Promise<AereRow[]> {
  try {
    const rows = validateSqlResult(await db.execute(sql`
      SELECT
        e.id,
        e.name,
        e.start_y,
        e.end_y,
        e.sort_order,
        COALESCE(bd.cnt, 0)::int AS work_count
      FROM eras e
      LEFT JOIN (
        SELECT primary_era_id, count(*)::int AS cnt
        FROM book_details
        WHERE primary_era_id IS NOT NULL
        GROUP BY primary_era_id
      ) bd ON bd.primary_era_id = e.id
    `));

    return rows
      .map((r): AereRow => ({
        id: String(r["id"]),
        name: String(r["name"]),
        startY: r["start_y"] == null ? null : toNumber(r["start_y"]),
        endY: r["end_y"] == null ? null : toNumber(r["end_y"]),
        sortOrder: toNumber(r["sort_order"]),
        workCount: toNumber(r["work_count"]),
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[/atlas/aeren] DB fetch failed (${msg}); rendering empty.`);
    return [];
  }
}

export interface SerieRow {
  id: string;
  name: string;
  totalPlanned: number | null;
  volumeCount: number;
}

export async function getSerienRows(): Promise<SerieRow[]> {
  try {
    const rows = validateSqlResult(await db.execute(sql`
      SELECT
        s.id,
        s.name,
        s.total_planned,
        COALESCE(bd.cnt, 0)::int AS volume_count
      FROM series s
      LEFT JOIN (
        SELECT series_id, count(*)::int AS cnt
        FROM book_details
        WHERE series_id IS NOT NULL
        GROUP BY series_id
      ) bd ON bd.series_id = s.id
    `));

    return rows
      .map((r): SerieRow => ({
        id: String(r["id"]),
        name: String(r["name"]),
        totalPlanned: r["total_planned"] == null ? null : toNumber(r["total_planned"]),
        volumeCount: toNumber(r["volume_count"]),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "de"));
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[/atlas/serien] DB fetch failed (${msg}); rendering empty.`);
    return [];
  }
}

export interface PersonenRow {
  id: string;
  name: string;
  nameSort: string;
  workCount: number;
  isAuthor: boolean;
  roles: string[];
}

export async function getPersonenRows(): Promise<PersonenRow[]> {
  try {
    const rows = validateSqlResult(await db.execute(sql`
      SELECT
        p.id,
        p.name,
        p.name_sort,
        COALESCE(wp.cnt, 0)::int       AS work_count,
        COALESCE(wp.is_author, false)  AS is_author,
        wp.roles                       AS roles
      FROM persons p
      LEFT JOIN (
        SELECT
          person_id,
          count(DISTINCT work_id)::int                       AS cnt,
          bool_or(role = 'author')                           AS is_author,
          array_agg(DISTINCT role::text ORDER BY role::text) AS roles
        FROM work_persons
        GROUP BY person_id
      ) wp ON wp.person_id = p.id
    `));

    return rows
      .map((r): PersonenRow => {
        const roles = parsePgTextArray(r["roles"]);
        return {
          id: String(r["id"]),
          name: String(r["name"]),
          nameSort: String(r["name_sort"]),
          workCount: toNumber(r["work_count"]),
          isAuthor: r["is_author"] === true,
          roles,
        };
      })
      .sort((a, b) => a.nameSort.localeCompare(b.nameSort, "de"));
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[/atlas/personen] DB fetch failed (${msg}); rendering empty.`);
    return [];
  }
}

// =============================================================================
// Slice-4 operational inventory rows (Task 4D). Submissions / facets /
// services round out the Phase-1 admin Data-Atlas. Same single-roundtrip
// shape as 4B/4C; payloads come back as already-truncated JSON previews so
// the page never ships raw submission JSON to the client.
// =============================================================================

export type SubmissionStatusValue =
  | "pending"
  | "approved"
  | "rejected"
  | "merged";

const SUBMISSION_STATUSES: ReadonlySet<SubmissionStatusValue> = new Set([
  "pending",
  "approved",
  "rejected",
  "merged",
]);

function coerceSubmissionStatus(v: unknown): SubmissionStatusValue {
  if (typeof v === "string" && SUBMISSION_STATUSES.has(v as SubmissionStatusValue)) {
    return v as SubmissionStatusValue;
  }
  return "pending";
}

export interface SubmissionRow {
  id: string;
  entityType: string;
  status: SubmissionStatusValue;
  payloadPreview: string;
  targetEntityId: string | null;
  submittedBy: string | null;
  reviewedBy: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
}

// Submissions carry a full `payload jsonb` (often multi-KB LLM enrichment
// blobs). Selecting the column raw forces postgres-js to ship + parse the
// whole jsonb per row, which on the pooler can stall the request long
// enough that Next dev never returns a response. We do the truncation
// server-side — `substring(payload::text, 1, 97)` keeps one char beyond
// the 96-char display window, and `length(payload::text) > 96` tells JS
// whether to append the ellipsis. The full payload never crosses the wire.
const PAYLOAD_PREVIEW_LEN = 96;

export async function getSubmissionsRows(): Promise<SubmissionRow[]> {
  try {
    const rows = validateSqlResult(await db.execute(sql`
      SELECT
        id,
        entity_type,
        status::text                                                   AS status,
        substring(payload::text, 1, ${PAYLOAD_PREVIEW_LEN + 1})        AS payload_head,
        length(payload::text)                                          AS payload_len,
        target_entity_id,
        submitted_by,
        reviewed_by,
        created_at,
        reviewed_at
      FROM submissions
      ORDER BY created_at DESC
    `));

    return rows.map((r): SubmissionRow => {
      const head = r["payload_head"] == null ? "" : String(r["payload_head"]);
      const fullLen = toNumber(r["payload_len"]);
      let preview: string;
      if (fullLen === 0) {
        preview = "—";
      } else if (fullLen > PAYLOAD_PREVIEW_LEN) {
        preview = `${head.slice(0, PAYLOAD_PREVIEW_LEN - 1).trimEnd()}…`;
      } else {
        preview = head;
      }
      return {
        id: String(r["id"]),
        entityType: String(r["entity_type"]),
        status: coerceSubmissionStatus(r["status"]),
        payloadPreview: preview,
        targetEntityId:
          r["target_entity_id"] == null ? null : String(r["target_entity_id"]),
        submittedBy: r["submitted_by"] == null ? null : String(r["submitted_by"]),
        reviewedBy: r["reviewed_by"] == null ? null : String(r["reviewed_by"]),
        createdAt: toDate(r["created_at"]) ?? new Date(0),
        reviewedAt: toDate(r["reviewed_at"]),
      };
    });
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[/atlas/submissions] DB fetch failed (${msg}); rendering empty.`);
    return [];
  }
}

export interface FacetRow {
  id: string;
  name: string;
  displayOrder: number;
  multiValue: boolean;
  visibleToUsers: boolean;
  valuesCount: number;
  worksCount: number;
}

export async function getFacetsRows(): Promise<FacetRow[]> {
  try {
    const rows = validateSqlResult(await db.execute(sql`
      SELECT
        fc.id,
        fc.name,
        fc.display_order,
        fc.multi_value,
        fc.visible_to_users,
        COALESCE(fv.cnt, 0)::int AS values_count,
        COALESCE(wf.cnt, 0)::int AS works_count
      FROM facet_categories fc
      LEFT JOIN (
        SELECT category_id, count(*)::int AS cnt
        FROM facet_values
        GROUP BY category_id
      ) fv ON fv.category_id = fc.id
      LEFT JOIN (
        SELECT fv2.category_id, count(DISTINCT wf2.work_id)::int AS cnt
        FROM work_facets wf2
        JOIN facet_values fv2 ON fv2.id = wf2.facet_value_id
        GROUP BY fv2.category_id
      ) wf ON wf.category_id = fc.id
    `));

    return rows
      .map((r): FacetRow => ({
        id: String(r["id"]),
        name: String(r["name"]),
        displayOrder: toNumber(r["display_order"]),
        multiValue: r["multi_value"] === true,
        visibleToUsers: r["visible_to_users"] === true,
        valuesCount: toNumber(r["values_count"]),
        worksCount: toNumber(r["works_count"]),
      }))
      .sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) {
          return a.displayOrder - b.displayOrder;
        }
        return a.name.localeCompare(b.name, "de");
      });
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[/atlas/facets] DB fetch failed (${msg}); rendering empty.`);
    return [];
  }
}

export interface ServiceRow {
  id: string;
  name: string;
  domain: string | null;
  affiliateSupported: boolean;
  displayOrder: number;
  linkCount: number;
  affiliateLinkCount: number;
}

export async function getServicesRows(): Promise<ServiceRow[]> {
  try {
    const rows = validateSqlResult(await db.execute(sql`
      SELECT
        s.id,
        s.name,
        s.domain,
        s.affiliate_supported,
        s.display_order,
        COALESCE(el.cnt, 0)::int           AS link_count,
        COALESCE(el.affiliate_cnt, 0)::int AS affiliate_link_count
      FROM services s
      LEFT JOIN (
        SELECT
          service_id,
          count(*)::int                                AS cnt,
          count(*) FILTER (WHERE affiliate = true)::int AS affiliate_cnt
        FROM external_links
        GROUP BY service_id
      ) el ON el.service_id = s.id
    `));

    return rows
      .map((r): ServiceRow => ({
        id: String(r["id"]),
        name: String(r["name"]),
        domain: r["domain"] == null ? null : String(r["domain"]),
        affiliateSupported: r["affiliate_supported"] === true,
        displayOrder: toNumber(r["display_order"]),
        linkCount: toNumber(r["link_count"]),
        affiliateLinkCount: toNumber(r["affiliate_link_count"]),
      }))
      .sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) {
          return a.displayOrder - b.displayOrder;
        }
        return a.name.localeCompare(b.name, "de");
      });
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[/atlas/services] DB fetch failed (${msg}); rendering empty.`);
    return [];
  }
}

