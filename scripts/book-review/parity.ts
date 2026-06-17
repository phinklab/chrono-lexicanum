/**
 * parity.ts — Brief 154 (B11). Prove the DB-free projection is deckungsgleich
 * with the `work_*` edges the apply path actually wrote (Brief 154 acceptance:
 * "Read-only-Eingang dokumentiert UND parity-getestet", sample incl. W40K-0010).
 *
 * It queries `work_*` DIRECTLY (not `loadBook`): loadBook is `server-only` (it
 * throws outside a server component) AND it filters content-warning facets via
 * `isVisibleFacetCategory` — but facet parity needs the RAW rows, split
 * visible vs `cw_*` (Brief 154 § "Facet-Findings nach Sichtbarkeit trennen").
 *
 * DB-touching → run locally with `.env.local`; NOT a CI test.
 */
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  facetValues,
  workCharacters,
  workFacets,
  workFactions,
  workLocations,
  works,
} from "@/db/schema";
import {
  projectBook,
  type BatchBook,
  type ProjectionContext,
} from "./projection";

/** The faction/location/character book entry where the overlay `final` tail bites. */
const FINAL_TAIL_BOOK = "W40K-0010";

export interface ParityMismatch {
  externalBookId: string;
  axis: "factions" | "locations" | "characters" | "facets";
  detail: string;
  isFinalTailBook: boolean;
}
export interface FacetSplit {
  visible: number;
  cw: number;
}
export interface ParityReport {
  booksChecked: number;
  booksMissingInDb: string[];
  mismatches: ParityMismatch[];
  facetCounts: { projection: FacetSplit; db: FacetSplit };
  finalTailBookChecked: boolean;
  ok: boolean;
}

function mapFromEdges(rows: Array<{ id: string; role: string | null }>): Map<string, string> {
  return new Map(rows.map((r) => [r.id, r.role ?? ""]));
}

function diffEdgeMaps(proj: Map<string, string>, dbm: Map<string, string>): string | null {
  const parts: string[] = [];
  for (const [id, role] of proj) {
    if (!dbm.has(id)) parts.push(`+${id}=${role} (in projection, not DB)`);
    else if (dbm.get(id) !== role) parts.push(`~${id}: projection=${role} db=${dbm.get(id)}`);
  }
  for (const [id, role] of dbm) {
    if (!proj.has(id)) parts.push(`-${id}=${role} (in DB, not projection)`);
  }
  return parts.length ? parts.join("; ") : null;
}

/**
 * Compare the projected state of each book against the DB for the given ids.
 * `batchBooks` maps externalBookId → its loaded SSOT batch entry.
 */
export async function runParity(
  bookIds: readonly string[],
  ctx: ProjectionContext,
  batchBooks: Map<string, BatchBook>,
): Promise<ParityReport> {
  const mismatches: ParityMismatch[] = [];
  const booksMissingInDb: string[] = [];
  const projFacets: FacetSplit = { visible: 0, cw: 0 };
  const dbFacets: FacetSplit = { visible: 0, cw: 0 };
  let booksChecked = 0;
  let finalTailBookChecked = false;

  for (const externalBookId of bookIds) {
    const batchBook = batchBooks.get(externalBookId);
    if (!batchBook) {
      booksMissingInDb.push(`${externalBookId} (no SSOT batch entry)`);
      continue;
    }
    const projected = projectBook(batchBook, ctx);

    const [work] = await db
      .select({ id: works.id })
      .from(works)
      .where(eq(works.slug, projected.slug))
      .limit(1);
    if (!work) {
      booksMissingInDb.push(`${externalBookId} (slug "${projected.slug}" not in DB)`);
      continue;
    }
    booksChecked += 1;
    if (externalBookId === FINAL_TAIL_BOOK) finalTailBookChecked = true;
    const isFinalTailBook = externalBookId === FINAL_TAIL_BOOK;

    const [facRows, locRows, charRows, facetRows] = await Promise.all([
      db.select({ id: workFactions.factionId, role: workFactions.role }).from(workFactions).where(eq(workFactions.workId, work.id)),
      db.select({ id: workLocations.locationId, role: workLocations.role }).from(workLocations).where(eq(workLocations.workId, work.id)),
      db.select({ id: workCharacters.characterId, role: workCharacters.role }).from(workCharacters).where(eq(workCharacters.workId, work.id)),
      db
        .select({ id: workFacets.facetValueId, category: facetValues.categoryId })
        .from(workFacets)
        .innerJoin(facetValues, eq(facetValues.id, workFacets.facetValueId))
        .where(eq(workFacets.workId, work.id)),
    ]);

    const axes: Array<["factions" | "locations" | "characters", Map<string, string>, Map<string, string>]> = [
      ["factions", mapFromEdges(projected.factions), mapFromEdges(facRows)],
      ["locations", mapFromEdges(projected.locations), mapFromEdges(locRows)],
      ["characters", mapFromEdges(projected.characters), mapFromEdges(charRows)],
    ];
    for (const [axis, projMap, dbMap] of axes) {
      const detail = diffEdgeMaps(projMap, dbMap);
      if (detail) mismatches.push({ externalBookId, axis, detail, isFinalTailBook });
    }

    // Facets: compare RAW id sets + tally visible vs cw on both sides.
    const projFacetIds = new Map(projected.facets.map((f) => [f.id, f.visible]));
    const dbFacetIds = new Map(facetRows.map((f) => [f.id, f.category !== "content_warning"]));
    for (const v of projFacetIds.values()) v ? projFacets.visible++ : projFacets.cw++;
    for (const v of dbFacetIds.values()) v ? dbFacets.visible++ : dbFacets.cw++;
    const facetDetail = diffEdgeMaps(
      new Map([...projFacetIds.keys()].map((id) => [id, ""])),
      new Map([...dbFacetIds.keys()].map((id) => [id, ""])),
    );
    if (facetDetail) mismatches.push({ externalBookId, axis: "facets", detail: facetDetail, isFinalTailBook });
  }

  return {
    booksChecked,
    booksMissingInDb,
    mismatches,
    facetCounts: { projection: projFacets, db: dbFacets },
    finalTailBookChecked,
    ok: mismatches.length === 0 && booksMissingInDb.length === 0,
  };
}
