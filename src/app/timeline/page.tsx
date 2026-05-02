import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { db } from "@/db/client";
import { eras as erasTable, series as seriesTable } from "@/db/schema";
import {
  type BookDetail,
  type Era,
  type ExternalLinkKind,
  type FactionAlignment,
  type SeriesRef,
  type TimelineBook,
} from "@/lib/timeline";
import Overview from "@/components/timeline/Overview";
import EraDetail from "@/components/timeline/EraDetail";
import { DetailPanel } from "@/components/timeline/DetailPanel";

export const metadata: Metadata = { title: "Chronicle — Timeline" };

/**
 * Timeline route.
 *
 * URL contract (set by brief 2026-04-29-008): the canonical `?era=` value is
 * a prototype era id (`great_crusade`, `horus_heresy`, `indomitus`, plus the
 * four non-canonical eras reachable via the Overview ribbon). Legacy
 * `?era=M30 | M31 | M42` from the session-007 toggle is server-redirected
 * to its mapped era id so old shared URLs keep working. Unknown values are
 * treated as "no era set" (renders Overview), not 404 — premature.
 *
 * Server fetch happens on every request (no caching this brief). Books +
 * factions + series are reshaped into the `TimelineBook` shape the client
 * components consume. The page passes plain JSON-serialisable data to
 * Overview / EraDetail; both rebuild `projectY` themselves via `useMemo`
 * because the projector is a function and can't cross the RSC boundary.
 */

const LEGACY_TO_ERA = {
  M30: "great_crusade",
  M31: "horus_heresy",
  M42: "indomitus",
} as const;

interface TimelinePageProps {
  searchParams: Promise<{ era?: string; book?: string }>;
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

  // 2. Direct ?book=<slug> without ?era= — resolve via book_details.primaryEraId
  //    server-side to the canonical shareable URL.
  if (bookRaw && !eraRaw) {
    const eraId = await resolveBookEra(bookRaw);
    if (eraId) redirect(`/timeline?era=${eraId}&book=${encodeURIComponent(bookRaw)}`);
    redirect("/timeline");
  }

  const data = await loadTimeline();
  const era = eraRaw ? data.eras.find((e) => e.id === eraRaw) ?? null : null;

  // 3. ?era=<unknown>&book=<valid> — orphaned panel would have no BookDot to
  //    focus on close (Overview has no pins since 013). Resolve to canonical.
  if (bookRaw && eraRaw && !era) {
    const eraId = await resolveBookEra(bookRaw);
    if (eraId) redirect(`/timeline?era=${eraId}&book=${encodeURIComponent(bookRaw)}`);
    redirect("/timeline");
  }

  // 4. ?era=<valid>&book=<valid?> — load detail; if unknown slug, drop ?book=.
  //    Era-mismatch (book.primaryEraId !== era.id) is intentionally NOT
  //    auto-corrected — brief constraint 11 forbids EraDetail remount mid-flow,
  //    and stale shared links should still render the panel above the user's
  //    chosen era.
  let selectedBook: BookDetail | null = null;
  if (bookRaw && era) {
    selectedBook = await loadBookDetail(bookRaw);
    if (!selectedBook) redirect(`/timeline?era=${era.id}`);
  }

  return (
    <main className="timeline-shell">
      <p className="timeline-eyebrow">
        <span aria-hidden>{"// Chronicle-Console"}</span>
        <span className="timeline-eyebrow-dot" aria-hidden />
        <span aria-hidden>{era ? era.name : "Survey-mode"}</span>
      </p>

      {era ? (
        <EraDetail
          // Remount on era change so EraDetail's pan/drag state resets
          // naturally — cheaper than a setState-in-effect inside the child.
          key={era.id}
          era={era}
          eras={data.eras}
          books={data.books}
          seriesById={data.seriesById}
        />
      ) : (
        <Overview eras={data.eras} books={data.books} />
      )}

      <DetailPanel selectedBook={selectedBook} eraId={era?.id ?? null} />
    </main>
  );
}

/**
 * Server-side fetch + adapt. Returns plain JSON-serialisable shapes only.
 * Wrapped in try/catch with empty fallbacks so the page renders even if the
 * pooler is briefly unreachable at build / request time.
 */
async function loadTimeline(): Promise<{
  eras: Era[];
  books: TimelineBook[];
  seriesById: Record<string, SeriesRef>;
}> {
  try {
    const [erasRows, seriesRows, workRows] = await Promise.all([
      db.select().from(erasTable).orderBy(asc(erasTable.sortOrder)),
      db.select().from(seriesTable),
      db.query.works.findMany({
        where: (w, { eq: eqOp }) => eqOp(w.kind, "book"),
        orderBy: (w, { asc: a }) => [a(w.startY)],
        with: {
          bookDetails: {
            with: { series: { columns: { id: true, name: true } } },
          },
          factions: { columns: { factionId: true } },
          persons: {
            where: (wp, { eq: eqOp }) => eqOp(wp.role, "author"),
            with: { person: { columns: { name: true } } },
          },
        },
      }),
    ]);

    const eras: Era[] = erasRows.map((e) => ({
      id: e.id,
      name: e.name,
      start: Number(e.startY),
      end: Number(e.endY),
      tone: e.tone,
      sortOrder: e.sortOrder,
    }));

    const seriesById: Record<string, SeriesRef> = {};
    for (const s of seriesRows) seriesById[s.id] = { id: s.id, name: s.name };

    const books: TimelineBook[] = workRows.map((w) => {
      const seriesId = w.bookDetails?.seriesId ?? null;
      return {
        id: w.id,
        slug: w.slug,
        title: w.title,
        authors: w.persons.map((wp) => wp.person.name),
        startY: Number(w.startY ?? 0),
        endY: Number(w.endY ?? 0),
        primaryEraId: w.bookDetails?.primaryEraId ?? "",
        factions: w.factions.map((f) => f.factionId),
        series: seriesId
          ? { id: seriesId, order: w.bookDetails?.seriesIndex ?? null }
          : null,
      };
    });

    // Log on every request — visible in `next dev` terminal locally and in
    // Vercel function logs on prod. Useful when the empty-state Overview
    // appears: zero eras here means "DB returned nothing"; an absent log
    // line means the request didn't reach this code path.
    console.log(
      `[/timeline] loaded ${eras.length} eras, ${books.length} books, ${Object.keys(seriesById).length} series.`,
    );
    return { eras, books, seriesById };
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[/timeline] DB fetch failed (${msg}); rendering empty timeline.`);
    return { eras: [], books: [], seriesById: {} };
  }
}

/**
 * Lightweight slug → primaryEraId resolver. Used by the `?book=`-only and
 * `?era=<unknown>&book=` redirect branches so we land on the canonical URL
 * before rendering. Returns null when slug is unknown OR the work has no
 * primaryEraId set (the latter shouldn't happen post-2c.0 but defending).
 */
async function resolveBookEra(slug: string): Promise<string | null> {
  try {
    const row = await db.query.works.findFirst({
      where: (w, { eq }) => eq(w.slug, slug),
      columns: { id: true },
      with: { bookDetails: { columns: { primaryEraId: true } } },
    });
    return row?.bookDetails?.primaryEraId ?? null;
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[/timeline] resolveBookEra(${slug}) failed (${msg}); treating as unknown.`);
    return null;
  }
}

/**
 * Heavy fetch for the DetailPanel: one relational query + up to two targeted
 * sibling queries when the book is in a series. N+1 is acceptable at the
 * current catalog size (~26 books, single-digit links per work) — no
 * optimisation requested by brief 025.
 *
 * Returns null when slug is unknown OR the book has no primaryEraId (the
 * caller redirects to drop `?book=` in either case).
 */
async function loadBookDetail(slug: string): Promise<BookDetail | null> {
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

    if (!row || !row.bookDetails || !row.bookDetails.primaryEraId) return null;

    // Sibling lookup: only when book is in a series. Filter both seriesIndex AND
    // primaryEraId NON-NULL so the returned types are honestly non-nullable and
    // we never push a broken ?era=&book= URL on prev/next click.
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
              isNotNull(bd.primaryEraId),
            ),
          orderBy: (bd, { desc }) => [desc(bd.seriesIndex)],
          with: { work: { columns: { slug: true, title: true } } },
          columns: { seriesIndex: true, primaryEraId: true },
        }),
        db.query.bookDetails.findFirst({
          where: (bd, { and, eq, gt, isNotNull }) =>
            and(
              eq(bd.seriesId, seriesId),
              gt(bd.seriesIndex, seriesIndex),
              isNotNull(bd.seriesIndex),
              isNotNull(bd.primaryEraId),
            ),
          orderBy: (bd, { asc: a }) => [a(bd.seriesIndex)],
          with: { work: { columns: { slug: true, title: true } } },
          columns: { seriesIndex: true, primaryEraId: true },
        }),
      ]);
      if (pRow?.work && pRow.primaryEraId) {
        prev = {
          slug: pRow.work.slug,
          title: pRow.work.title,
          order: pRow.seriesIndex,
          primaryEraId: pRow.primaryEraId,
        };
      }
      if (nRow?.work && nRow.primaryEraId) {
        next = {
          slug: nRow.work.slug,
          title: nRow.work.title,
          order: nRow.seriesIndex,
          primaryEraId: nRow.primaryEraId,
        };
      }
    }

    // Reshape facets: keyed by category id (stable; fragile if keyed by name).
    const facets: BookDetail["facets"] = {};
    for (const f of row.facets) {
      const cat = f.facetValue.category;
      if (!facets[cat.id]) {
        facets[cat.id] = { categoryId: cat.id, categoryName: cat.name, values: [] };
      }
      facets[cat.id].values.push({ id: f.facetValue.id, name: f.facetValue.name });
    }

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      authors: row.persons.map((wp) => wp.person.name),
      releaseYear: row.releaseYear ?? null,
      startY: Number(row.startY ?? 0),
      endY: Number(row.endY ?? 0),
      primaryEraId: row.bookDetails.primaryEraId,
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
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[/timeline] loadBookDetail(${slug}) failed (${msg}); dropping ?book=.`);
    return null;
  }
}
