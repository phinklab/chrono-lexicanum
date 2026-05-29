import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { db } from "@/db/client";
import { eras as erasTable } from "@/db/schema";
import {
  type BookDetail,
  type Era,
  type ExternalLinkKind,
  type FactionAlignment,
  type SeriesRef,
  type TimelineBook,
  eraIdForYear,
} from "@/lib/timeline";
import {
  CHRONICLE_ERAS,
  ROSTER_BY_SLUG,
  buildChronicleBooks,
  rosterToBookDetail,
} from "@/lib/chronicle/roster";
import ChronicleClient from "@/components/timeline/chronicle/ChronicleClient";
import { DetailPanel } from "@/components/timeline/DetailPanel";
import SiteBackground from "@/components/chrome/SiteBackground";

export const metadata: Metadata = { title: "Chronicle — Timeline" };

/**
 * Timeline route.
 *
 * DATA SOURCE (Product/UI strand, 2026-05-29). The Chronicle's book set + their
 * in-universe dates come from the curated overlay in `@/lib/chronicle/roster`,
 * NOT from the `works` table: the SSOT pipeline has ~859 dateless books in
 * Postgres (`start_y IS NULL`), so a DB-driven ribbon clumped every book into
 * the first era. The roster carries exactly the Lexicanum-dated set (87 titles)
 * with real setting dates. Postgres stays the source of truth for everything
 * else — the DetailPanel joins by slug for the titles already ingested, and
 * falls back to a roster-built sparse detail for the rest. The per-book DB
 * backfill is a Batches-strand follow-up; the FilterRail (faction/length,
 * era-range filtered on `start_y`) is disabled until then.
 *
 * URL contract (set by brief 2026-04-29-008): the canonical `?era=` value is a
 * prototype era id (`great_crusade`, `horus_heresy`, `indomitus`, …). Legacy
 * `?era=M30 | M31 | M42` is server-redirected to its mapped era id so old
 * shared URLs keep working. Unknown values render the Overview (not 404).
 */

const LEGACY_TO_ERA = {
  M30: "great_crusade",
  M31: "horus_heresy",
  M42: "indomitus",
} as const;

interface TimelinePageProps {
  searchParams: Promise<{
    era?: string;
    book?: string;
  }>;
}

export default async function TimelinePage({ searchParams }: TimelinePageProps) {
  const sp = await searchParams;
  const eraRaw = sp.era;
  const bookRaw = sp.book;

  // 1. Legacy redirect: pre-008 toggle wrote ?era=M30|M31|M42. Propagate ?book=
  //    through unchanged — slug validation happens on the next render.
  if (eraRaw && (LEGACY_TO_ERA as Record<string, string>)[eraRaw]) {
    const target =
      `/timeline?era=${(LEGACY_TO_ERA as Record<string, string>)[eraRaw]}` +
      (bookRaw ? `&book=${encodeURIComponent(bookRaw)}` : "");
    redirect(target);
  }

  // loadTimeline runs first so the book-resolve redirects below can derive the
  // era from the book's setting date (startY) via `data.eras` — the same
  // startY-based grouping the ribbon uses.
  const data = await loadTimeline();

  // 2. Direct ?book=<slug> without ?era= — resolve the canonical shareable URL.
  if (bookRaw && !eraRaw) {
    const eraId = await resolveBookEra(bookRaw, data.eras);
    if (eraId) redirect(`/timeline?era=${eraId}&book=${encodeURIComponent(bookRaw)}`);
    redirect("/timeline");
  }

  const era = eraRaw ? data.eras.find((e) => e.id === eraRaw) ?? null : null;

  // 3. ?era=<unknown>&book=<valid> — orphaned panel would have no marker to
  //    focus on close. Resolve to canonical.
  if (bookRaw && eraRaw && !era) {
    const eraId = await resolveBookEra(bookRaw, data.eras);
    if (eraId) redirect(`/timeline?era=${eraId}&book=${encodeURIComponent(bookRaw)}`);
    redirect("/timeline");
  }

  // 4. Heavy detail load for the modal (joined to the DB by slug, with curated
  //    date overlay / roster fallback). Era-mismatch on ?book= is intentionally
  //    NOT auto-corrected — stale shared links should still render the panel.
  const selectedBook =
    bookRaw && era ? await loadBookDetail(bookRaw, data.eras) : null;
  if (bookRaw && era && !selectedBook) redirect(`/timeline?era=${era.id}`);

  return (
    <main className="timeline-shell timeline-shell--chronicle">
      <SiteBackground variant="chronicle" position="50% 32%" />

      <ChronicleClient
        eras={data.eras}
        books={data.books}
        seriesById={data.seriesById}
        activeEraId={era?.id ?? null}
        segBooks={null}
        filter={null}
      />

      <DetailPanel selectedBook={selectedBook} eraId={era?.id ?? null} />
    </main>
  );
}

/**
 * Build the Chronicle's book set from the curated roster overlay. Eras still
 * come from the `eras` table (for canonical tone/name in the segment headers),
 * but fall back to the bundled `CHRONICLE_ERAS` constant if that tiny query
 * fails — so the Chronicle renders even when the pooler is briefly unreachable,
 * since its book data no longer depends on the DB at all.
 */
async function loadTimeline(): Promise<{
  eras: Era[];
  books: TimelineBook[];
  seriesById: Record<string, SeriesRef>;
}> {
  let eras: Era[] = CHRONICLE_ERAS;
  try {
    const erasRows = await db.select().from(erasTable).orderBy(asc(erasTable.sortOrder));
    if (erasRows.length > 0) {
      eras = erasRows.map((e) => ({
        id: e.id,
        name: e.name,
        start: Number(e.startY),
        end: Number(e.endY),
        tone: e.tone,
        sortOrder: e.sortOrder,
      }));
    }
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[/timeline] eras fetch failed (${msg}); using fallback CHRONICLE_ERAS.`);
  }

  const { books, seriesById } = buildChronicleBooks(eras);
  console.log(
    `[/timeline] curated chronicle: ${eras.length} eras, ${books.length} dated books, ${Object.keys(seriesById).length} series.`,
  );
  return { eras, books, seriesById };
}

/**
 * Lightweight slug → era-id resolver for the `?book=`-only / `?era=<unknown>`
 * redirect branches. Prefers the curated roster (every Chronicle book is in
 * it); falls back to the DB startY for off-roster shared links.
 */
async function resolveBookEra(slug: string, eras: readonly Era[]): Promise<string | null> {
  const r = ROSTER_BY_SLUG.get(slug);
  if (r) return eraIdForYear(r.startY, eras);
  try {
    const row = await db.query.works.findFirst({
      where: (w, { eq }) => eq(w.slug, slug),
      columns: { startY: true },
    });
    if (!row) return null;
    return eraIdForYear(Number(row.startY ?? 0), eras);
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[/timeline] resolveBookEra(${slug}) failed (${msg}); treating as unknown.`);
    return null;
  }
}

/**
 * Heavy fetch for the DetailPanel. Loads the rich book record from Postgres by
 * slug, then overlays the curated setting date (DB `start_y` is null for the
 * whole catalogue today, so without this the panel eyebrow + close-URL would
 * resolve to the wrong era). Titles not yet in the DB — 21 of the 87 — get a
 * sparse detail built straight from the roster, so every Chronicle book opens a
 * panel instead of bouncing back to the era view.
 *
 * Returns null only when the slug is in neither the DB nor the roster (a
 * hand-crafted bad link) — the caller drops `?book=` in that case.
 */
async function loadBookDetail(slug: string, eras: readonly Era[]): Promise<BookDetail | null> {
  const roster = ROSTER_BY_SLUG.get(slug);

  let detail: BookDetail | null = null;
  try {
    const row = await db.query.works.findFirst({
      where: (w, { eq }) => eq(w.slug, slug),
      with: {
        bookDetails: {
          with: { series: { columns: { id: true, name: true, totalPlanned: true } } },
        },
        factions: {
          with: {
            faction: {
              columns: { id: true, name: true, alignment: true, tone: true, glyph: true },
            },
          },
          columns: { factionId: true, role: true },
        },
        persons: {
          where: (wp, { eq }) => eq(wp.role, "author"),
          orderBy: (wp, { asc: a }) => [a(wp.displayOrder)],
          with: { person: { columns: { id: true, name: true } } },
          columns: { personId: true, displayOrder: true },
        },
        characters: {
          with: { character: { columns: { id: true, name: true } } },
          columns: { characterId: true, role: true },
        },
        facets: {
          with: {
            facetValue: {
              with: { category: { columns: { id: true, name: true } } },
              columns: { id: true, name: true },
            },
          },
        },
        externalLinks: {
          with: { service: { columns: { id: true, name: true } } },
        },
      },
    });

    if (row && row.bookDetails) {
      // Era is startY-derived (consistent with the ribbon grouping) rather than
      // the un-curated `primary_era_id` anchor. The roster overlay below
      // replaces startY entirely; this is the DB-only baseline.
      const ownEraId = eraIdForYear(Number(row.startY ?? 0), eras);

      type SeriesSibling = NonNullable<NonNullable<BookDetail["series"]>["prev"]>;
      let prev: SeriesSibling | null = null;
      let next: SeriesSibling | null = null;
      const seriesId = row.bookDetails.seriesId;
      const seriesIndex = row.bookDetails.seriesIndex;
      if (seriesId && seriesIndex !== null) {
        const [pRow, nRow] = await Promise.all([
          db.query.bookDetails.findFirst({
            where: (bd, { and, eq, lt, isNotNull }) =>
              and(
                eq(bd.seriesId, seriesId),
                lt(bd.seriesIndex, seriesIndex),
                isNotNull(bd.seriesIndex),
              ),
            orderBy: (bd, { desc }) => [desc(bd.seriesIndex)],
            with: { work: { columns: { slug: true, title: true, startY: true } } },
            columns: { seriesIndex: true },
          }),
          db.query.bookDetails.findFirst({
            where: (bd, { and, eq, gt, isNotNull }) =>
              and(
                eq(bd.seriesId, seriesId),
                gt(bd.seriesIndex, seriesIndex),
                isNotNull(bd.seriesIndex),
              ),
            orderBy: (bd, { asc: a }) => [a(bd.seriesIndex)],
            with: { work: { columns: { slug: true, title: true, startY: true } } },
            columns: { seriesIndex: true },
          }),
        ]);
        if (pRow?.work) {
          prev = {
            slug: pRow.work.slug,
            title: pRow.work.title,
            order: pRow.seriesIndex,
            primaryEraId: eraIdForYear(Number(pRow.work.startY ?? 0), eras),
          };
        }
        if (nRow?.work) {
          next = {
            slug: nRow.work.slug,
            title: nRow.work.title,
            order: nRow.seriesIndex,
            primaryEraId: eraIdForYear(Number(nRow.work.startY ?? 0), eras),
          };
        }
      }

      const facets: BookDetail["facets"] = {};
      for (const f of row.facets) {
        const cat = f.facetValue.category;
        if (!facets[cat.id]) {
          facets[cat.id] = { categoryId: cat.id, categoryName: cat.name, values: [] };
        }
        facets[cat.id].values.push({ id: f.facetValue.id, name: f.facetValue.name });
      }

      detail = {
        id: row.id,
        slug: row.slug,
        title: row.title,
        authors: row.persons.map((wp) => wp.person.name),
        releaseYear: row.releaseYear ?? null,
        startY: Number(row.startY ?? 0),
        endY: Number(row.endY ?? 0),
        primaryEraId: ownEraId,
        synopsis: row.synopsis ?? null,
        coverUrl: row.coverUrl ?? null,
        factions: row.factions.map((wf) => ({
          id: wf.faction.id,
          name: wf.faction.name,
          alignment: wf.faction.alignment as FactionAlignment,
          tone: wf.faction.tone,
          glyph: wf.faction.glyph,
          role: wf.role ?? "supporting",
        })),
        facets,
        series: row.bookDetails.series
          ? {
              id: row.bookDetails.series.id,
              name: row.bookDetails.series.name,
              totalPlanned: row.bookDetails.series.totalPlanned,
              order: row.bookDetails.seriesIndex,
              prev,
              next,
            }
          : null,
        externalLinks: row.externalLinks.map((el) => ({
          kind: el.kind as ExternalLinkKind,
          serviceId: el.serviceId,
          serviceName: el.service.name,
          url: el.url,
          label: el.label ?? null,
        })),
        characters: row.characters.map((wc) => ({
          id: wc.character.id,
          name: wc.character.name,
          role: wc.role ?? "supporting",
        })),
      };
    }
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[/timeline] loadBookDetail(${slug}) DB fetch failed (${msg}); trying roster.`);
  }

  // Overlay the curated date onto the DB-backed detail so the panel agrees with
  // the timeline (DB start_y is null today). Sibling eras get the same overlay.
  if (detail) {
    if (roster) {
      detail.startY = roster.startY;
      detail.endY = roster.endY;
      detail.primaryEraId = eraIdForYear(roster.startY, eras);
      const prevRoster = detail.series?.prev && ROSTER_BY_SLUG.get(detail.series.prev.slug);
      if (detail.series?.prev && prevRoster) {
        detail.series.prev.primaryEraId = eraIdForYear(prevRoster.startY, eras);
      }
      const nextRoster = detail.series?.next && ROSTER_BY_SLUG.get(detail.series.next.slug);
      if (detail.series?.next && nextRoster) {
        detail.series.next.primaryEraId = eraIdForYear(nextRoster.startY, eras);
      }
    }
    return detail;
  }

  // Not in the DB (or the DB was unreachable) — sparse detail from the roster.
  return rosterToBookDetail(slug, eras);
}
