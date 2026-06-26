import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteBackground from "@/components/chrome/SiteBackground";
import ScrollScrim from "@/components/chrome/ScrollScrim";
import RouteScrollCue from "@/components/chrome/RouteScrollCue";
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

export const metadata: Metadata = {
  title: "One Faction, One Book - Chrono Lexicanum",
  description:
    "Pick a Warhammer 40,000 faction and the archive names a single, curated novel to start with.",
};

interface AskFactionPageProps {
  params: Promise<{ segments?: string[] }>;
}

/** Same readout voice as /ask, tilted to the faction tool. */
const FACTION_READOUT_LINES = [
  "· ARCHIVE · WHERE TO BEGIN",
  "· TWO WAYS IN · ONLINE",
  "· VNA FACTIO · VNVS LIBER",
  "· ONE ARMY · ONE DOORWAY",
  "· CVRATED · NOT A READING LIST",
  "· ARCHIVE QUERY IS SERVER-SIDE",
];

/**
 * Pre-render every reachable drilldown node so the tool ships fully static
 * (the data is committed JSON — no runtime DB). Includes the bare picker
 * (`/ask/fraktion`), each faction, and each subfaction. The carousel takes over
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
    <main className="ask route-snap">
      <SiteBackground variant="main" position="right bottom" />
      <ScrollScrim
        className="ask-scrim"
        varName="--ask-scrim-opacity"
        heroSelector=".ask-console__mast"
        maxOpacity={0.77}
      />

      <div className="ask-readout" aria-hidden>
        <GhostReadout
          color="var(--cl-gold)"
          opacity={0.28}
          lineMs={5200}
          typeSpeed={78}
          max={4}
          lines={FACTION_READOUT_LINES}
        />
      </div>

      <FloatingCoord
        x="42%"
        y="120px"
        label="QUERY · PVBLIC"
        delay={1.2}
        lifetime={5}
        color="var(--cl-gold)"
        opacity={0.5}
      />
      <FloatingCoord
        x="58%"
        y="220px"
        label="VNA FACTIO · VNVS LIBER"
        delay={3}
        lifetime={5}
        color="var(--cl-gold)"
        opacity={0.5}
      />

      <section className="ask-console" aria-labelledby="ask-faction-title">
        <header className="ask-console__mast route-act">
          <p className="ask-console__eyebrow">{"LEXICANVM · WHERE TO BEGIN"}</p>
          <h1 id="ask-faction-title" className="ask-console__title">
            Find Your Next Book
          </h1>
          <div className="ask-console__rule" aria-hidden />
          <AskToolTabs active="faction" />
          <p className="ask-console__sub">
            One faction, one book. Choose an army and the archive answers with a single curated
            doorway — not a reading list. Drill into a chapter for a sharper pick, and reshuffle
            when more than one is on file.
          </p>
          <RouteScrollCue label="Choose a faction" target=".ask-console__grid" />
        </header>

        <div className="ask-console__grid ask-faction__grid route-body-snap">
          <FactionCarousel
            nodes={FACTION_STARTER_NODES}
            initialFactionSlug={faction?.slug ?? null}
            initialSubSlug={subfaction?.slug ?? null}
          />
        </div>
      </section>

      <div className="ask-foot">
        <ArchiveFooter mid="VNA FACTIO · VNVS LIBER" />
      </div>
    </main>
  );
}
