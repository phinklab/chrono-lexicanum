import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { routeOg } from "@/lib/seo";
import SiteBackground from "@/components/chrome/SiteBackground";
import ScrollScrim from "@/components/chrome/ScrollScrim";
import RouteScrollCue from "@/components/chrome/RouteScrollCue";
import AuspexPair from "@/components/chrono/AuspexPair";
import FloatingCoord from "@/components/chrono/FloatingCoord";
import GhostReadout from "@/components/chrono/GhostReadout";
import ArchiveFooter from "@/components/chrome/ArchiveFooter";
import AskToolTabs from "@/components/ask/AskToolTabs";
import FactionCarousel from "@/components/ask/FactionCarousel";
import {
  FACTION_STARTERS,
  FACTION_STARTER_NODES,
  findFaction,
  findSubfaction,
  type FactionStarterNode,
} from "@/lib/ask/faction-starters";
// Route-scoped stylesheet (S7a): the faction tool's picker/carousel styles.
import "@/app/styles/54-ask-faction.css";

const ASK_FACTION_DESCRIPTION =
  "Pick a Warhammer 40,000 faction and the archive names a single, curated novel to start with.";

interface AskFactionPageProps {
  params: Promise<{ segments?: string[] }>;
}

// Every drilldown node is its own static document (and sitemap entry — the
// curated "where to start with X" long tail, URL matrix A.3), so the
// canonical carries the segments.
export async function generateMetadata({
  params,
}: AskFactionPageProps): Promise<Metadata> {
  const { segments } = await params;
  const path = ["/ask/faction", ...(segments ?? [])].join("/");
  return {
    title: "One Faction, One Book",
    description: ASK_FACTION_DESCRIPTION,
    alternates: { canonical: path },
    openGraph: routeOg({
      title: "One Faction, One Book",
      description: ASK_FACTION_DESCRIPTION,
    }),
  };
}

/** Same vox voice as /ask, tilted to the faction tool. */
const FACTION_VOX_LINES = [
  "Vna factio · vnvs liber",
  "One army · one doorway",
  "Cvrated · not a reading list",
  "Cognitio link stable",
];

/**
 * Pre-render every reachable drilldown node so the tool ships fully static
 * (the data is committed JSON — no runtime DB). Includes the bare picker
 * (`/ask/faction`), each faction, and each subfaction. The carousel takes over
 * client-side from whichever slide the URL seeds.
 */
export function generateStaticParams(): Array<{ segments: string[] }> {
  const params: Array<{ segments: string[] }> = [{ segments: [] }];
  for (const node of FACTION_STARTER_NODES) {
    params.push({ segments: [node.slug] });
    for (const child of node.children ?? []) {
      params.push({ segments: [node.slug, child.slug] });
    }
  }
  return params;
}

export default async function AskFactionPage({ params }: AskFactionPageProps) {
  const { segments } = await params;
  const seg = segments ?? [];
  if (seg.length > 2) notFound();

  let faction: FactionStarterNode | null = null;
  let subfaction: FactionStarterNode | null = null;

  if (seg[0]) {
    faction = findFaction(FACTION_STARTERS, seg[0]);
    if (!faction) notFound();
  }
  if (seg[1]) {
    subfaction = faction ? findSubfaction(faction, seg[1]) : null;
    if (!subfaction) notFound();
  }

  // Same shell as /ask: photo hero you scroll past, ScrollScrim darkening the
  // fixed art, then the tool — so switching tabs never jumps to another layout.
  return (
    <main id="main" tabIndex={-1} className="ask route-snap">
      <SiteBackground variant="main" position="right bottom" />
      <ScrollScrim
        className="site-scrim"
        varName="--scrim-o"
        heroSelector=".ask-console__mast"
        maxOpacity={0.94}
      />
      <GhostReadout lines={FACTION_VOX_LINES} />
      <FloatingCoord x="9%" y="30%" label="Vna factio · vnvs liber" delay={7} />

      <section className="ask-console" aria-labelledby="ask-faction-title">
        <header className="ask-console__mast route-act">
          <AuspexPair />
          <p className="ask-console__eyebrow">Where to Begin</p>
          <h1 id="ask-faction-title" className="ask-console__title">
            Find Your Next Book
          </h1>
          <p className="ask-console__sub">
            One faction, one book: choose an army and the archive answers with
            a single curated doorway, not a reading list.
          </p>
          <RouteScrollCue
            className="route-cue--flow"
            label="Choose a faction"
            target=".ask-console__grid"
          />
        </header>

        <div className="ask-console__grid ask-faction__grid route-body-snap">
          <AskToolTabs active="faction" />
          <FactionCarousel
            nodes={FACTION_STARTER_NODES}
            initialFactionSlug={faction?.slug ?? null}
            initialSubSlug={subfaction?.slug ?? null}
          />
        </div>
      </section>

      <div className="ask-foot">
        <ArchiveFooter mid="One faction · one book" />
      </div>
    </main>
  );
}
