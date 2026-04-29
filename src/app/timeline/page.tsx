import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { db } from "@/db/client";
import { eras as erasTable, series as seriesTable } from "@/db/schema";
import {
  type Era,
  type SeriesRef,
  type TimelineBook,
} from "@/lib/timeline";
import Overview from "@/components/timeline/Overview";
import EraDetail from "@/components/timeline/EraDetail";

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
  searchParams: Promise<{ era?: string }>;
}

export default async function TimelinePage({ searchParams }: TimelinePageProps) {
  const sp = await searchParams;
  const eraRaw = sp.era;

  // Legacy redirect: pre-008 toggle wrote ?era=M30|M31|M42.
  if (eraRaw && (LEGACY_TO_ERA as Record<string, string>)[eraRaw]) {
    redirect(`/timeline?era=${(LEGACY_TO_ERA as Record<string, string>)[eraRaw]}`);
  }

  const data = await loadTimeline();
  const era = eraRaw ? data.eras.find((e) => e.id === eraRaw) ?? null : null;

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
    const [erasRows, seriesRows, bookRows] = await Promise.all([
      db.select().from(erasTable).orderBy(asc(erasTable.sortOrder)),
      db.select().from(seriesTable),
      db.query.books.findMany({
        orderBy: (b, { asc: a }) => [a(b.startY)],
        with: {
          factions: { columns: { factionId: true } },
          series: { columns: { id: true, name: true } },
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

    const books: TimelineBook[] = bookRows.map((b) => ({
      id: b.id,
      slug: b.slug,
      title: b.title,
      author: b.author,
      startY: Number(b.startY ?? 0),
      endY: Number(b.endY ?? 0),
      factions: b.factions.map((f) => f.factionId),
      series: b.seriesId ? { id: b.seriesId, order: b.seriesIndex } : null,
    }));

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[/timeline] loaded ${eras.length} eras, ${books.length} books, ${Object.keys(seriesById).length} series.`,
      );
    }
    return { eras, books, seriesById };
  } catch (err) {
    console.error("[/timeline] DB fetch failed; rendering empty timeline.", err);
    return { eras: [], books: [], seriesById: {} };
  }
}
