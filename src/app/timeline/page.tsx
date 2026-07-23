import type { Metadata } from "next";
import { Cormorant_Unicase } from "next/font/google";
import { redirect } from "next/navigation";
import { routeOg } from "@/lib/seo";
import { loadChronicleTimeline } from "@/lib/chronicle/loadTimeline";
import ChronicleStage, {
  type ChronicleViewMode,
} from "@/components/timeline/cinematic/ChronicleStage";
// Route-scoped stylesheet (S7a): the Chronicle's ~51 KB load only here.
import "@/app/styles/67-chronicle-cinematic.css";

const TIMELINE_DESCRIPTION =
  "The in-universe timeline of Warhammer 40,000 novels: every era, every event, every book placed on the Imperial calendar.";

// `?era` and `?view` are views of the one chronicle document — canonical
// stays the bare /timeline (URL matrix A.3).
export const metadata: Metadata = {
  title: "Chronicle · Timeline",
  description: TIMELINE_DESCRIPTION,
  alternates: { canonical: "/timeline" },
  openGraph: routeOg({
    title: "Chronicle · Timeline",
    description: TIMELINE_DESCRIPTION,
  }),
};

/**
 * Chronicle route backed only by the curated eras/events/event_works spine.
 * `?era` selects a chapter; `?view=index|cine` selects presentation; bare URLs
 * default to cinematic on every device. Legacy M30/M31/M42 and retired era ids
 * are mapped, unknown eras fall back to chapter I, and legacy `?book` links
 * redirect to the canonical book page.
 */

// Chronicle-only waypoint face. Its CSS variable must be declared at or below
// `.chron-shell`; resolving the segment-scoped Next variable at :root fails.
const cormorantUnicase = Cormorant_Unicase({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-cormorant-unicase",
  display: "swap",
});

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

  // Legacy `?book=` deep links (old DetailPanel) → the book's own page.
  if (bookRaw) redirect(`/book/${encodeURIComponent(bookRaw)}`);

  // Legacy era ids → their new chapter.
  if (eraRaw && LEGACY_ERA[eraRaw]) {
    const view =
      viewRaw === "index"
        ? "&view=index"
        : viewRaw === "cine"
          ? "&view=cine"
          : "";
    redirect(`/timeline?era=${LEGACY_ERA[eraRaw]}${view}`);
  }

  // A DB outage THROWS out of the loader into the root error boundary (S2
  // contract) — this branch is only the honest empty state of an unseeded
  // events spine.
  const eras = await loadChronicleTimeline();
  if (eras.length === 0) {
    return (
      <main id="main" tabIndex={-1} className={`chron-shell ${cormorantUnicase.variable}`}>
        <div className="chron-empty">
          <div className="ce-kicker">CHRONICA · TEMPORIS</div>
          <p className="ce-text">
            The chronicle holds no entries yet: no eras have reached the
            archive.
          </p>
        </div>
      </main>
    );
  }

  const initialEraId =
    eraRaw && eras.some((e) => e.id === eraRaw) ? eraRaw : null;
  // null = no explicit choice → cinematic default, URL stays bare (only an
  // explicit pick writes `view=`).
  const initialView: ChronicleViewMode | null =
    viewRaw === "index" ? "index" : viewRaw === "cine" ? "cine" : null;

  return (
    <main id="main" tabIndex={-1} className={`chron-shell ${cormorantUnicase.variable}`}>
      <ChronicleStage
        eras={eras}
        initialEraId={initialEraId}
        initialView={initialView}
      />
    </main>
  );
}
