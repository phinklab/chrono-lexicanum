import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadChronicleTimeline } from "@/lib/chronicle/loadTimeline";
import ChronicleStage, {
  type ChronicleViewMode,
} from "@/components/timeline/cinematic/ChronicleStage";

export const metadata: Metadata = { title: "Chronicle — Timeline" };

/**
 * Timeline route — the Cinematic/Index chronicle (Brief 138).
 *
 * DATA SOURCE: the hand-curated events spine from Brief 137 (`eras` +
 * `events` + `event_works` in Postgres), loaded server-side by
 * `loadChronicleTimeline()` and handed to the client island in one payload.
 * The pre-138 roster overlay (`@/lib/chronicle/roster`) is no longer read
 * here; it stays in the repo until a follow-up brief retires it.
 *
 * URL contract: `?era=<era id>` selects the chapter, `?view=index` opens the
 * index view. Legacy values keep working:
 *   - pre-008 `?era=M30|M31|M42` → mapped era id (kept from the old page)
 *   - era ids that vanished with the 8-era map (Brief 137): `age_rebirth` →
 *     `horus_heresy` (the Scouring lives in M31), `long_war` → `the_forging`
 *     (its M32–34 majority); the remaining old ids exist in the new map and
 *     pass through unchanged.
 *   - unknown values render chapter I (no 404), the client then canonicalizes
 *     the URL via history.replaceState.
 *   - `?book=<slug>` (pre-138 detail-panel deep link) → that book's page.
 */

const LEGACY_ERA: Record<string, string> = {
  M30: "great_crusade",
  M31: "horus_heresy",
  M42: "indomitus",
  age_rebirth: "horus_heresy",
  long_war: "the_forging",
};

interface TimelinePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function TimelinePage({ searchParams }: TimelinePageProps) {
  const sp = await searchParams;
  const eraRaw = first(sp.era);
  const viewRaw = first(sp.view);
  const bookRaw = first(sp.book);

  // Legacy `?book=` deep links (pre-138 DetailPanel) → the book's own page.
  if (bookRaw) redirect(`/buch/${encodeURIComponent(bookRaw)}`);

  // Legacy era ids → their new chapter.
  if (eraRaw && LEGACY_ERA[eraRaw]) {
    const view = viewRaw === "index" ? "&view=index" : "";
    redirect(`/timeline?era=${LEGACY_ERA[eraRaw]}${view}`);
  }

  const eras = await loadChronicleTimeline();
  if (!eras || eras.length === 0) {
    return (
      <main className="chron-shell">
        <div className="chron-empty">
          <div className="ce-kicker">CHRONICA · TEMPORIS</div>
          <p className="ce-text">
            The archive is unreachable — the chronicle cannot be opened.
            Try again in a moment.
          </p>
        </div>
      </main>
    );
  }

  const initialEraId =
    eraRaw && eras.some((e) => e.id === eraRaw) ? eraRaw : null;
  const initialView: ChronicleViewMode = viewRaw === "index" ? "index" : "cine";

  return (
    <main className="chron-shell">
      <ChronicleStage
        eras={eras}
        initialEraId={initialEraId}
        initialView={initialView}
      />
    </main>
  );
}
