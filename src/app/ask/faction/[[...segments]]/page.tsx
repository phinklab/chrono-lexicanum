import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { routeOg } from "@/lib/seo";
import SiteBackground from "@/components/chrome/SiteBackground";
import ScrollScrim from "@/components/chrome/ScrollScrim";
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
  "Choose a Warhammer 40,000 faction and The Curator names one carefully selected book to begin with.";

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
    title: "By Faction · The Curator",
    description: ASK_FACTION_DESCRIPTION,
    alternates: { canonical: path },
    openGraph: routeOg({
      title: "By Faction · The Curator",
      description: ASK_FACTION_DESCRIPTION,
    }),
  };
}

/** Same vox voice as /ask, tilted to the faction tool. */
const FACTION_VOX_LINES = [
  "Cvrator · by faction",
  "Vna factio · vnvs liber",
  "One army · one doorway",
  "Cvrated · not a reading list",
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

  return (
    <main id="main" tabIndex={-1} className="ask curator">
      <SiteBackground variant="main" position="right bottom" />
      <ScrollScrim
        className="site-scrim"
        varName="--scrim-o"
        heroSelector=".curator-toolhead"
        maxOpacity={0.94}
      />
      <GhostReadout lines={FACTION_VOX_LINES} />

      <section className="ask-console curator-tool" aria-labelledby="ask-faction-title">
        <header className="curator-toolhead">
          <p className="curator-toolhead__brand">The Curator</p>
          <AskToolTabs active="faction" />
          <h1 id="ask-faction-title" className="curator-toolhead__title">
            By Faction
          </h1>
          <p className="curator-toolhead__sub">
            Choose an army. The Curator answers with one deliberate doorway,
            not another reading list.
          </p>
        </header>

        <div className="ask-console__grid ask-faction__grid">
          <FactionCarousel
            nodes={FACTION_STARTER_NODES}
            initialFactionSlug={faction?.slug ?? null}
            initialSubSlug={subfaction?.slug ?? null}
          />
        </div>
      </section>

      <div className="ask-foot">
        <ArchiveFooter mid="The Curator · by faction" />
      </div>
    </main>
  );
}
