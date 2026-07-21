import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { routeOg } from "@/lib/seo";
import CompendiumNav from "@/components/compendium/CompendiumNav";
import FactionCarousel from "@/components/ask/FactionCarousel";
import {
  FACTION_STARTERS,
  FACTION_STARTER_NODES,
  findFaction,
  findSubfaction,
  type FactionStarterNode,
} from "@/lib/ask/faction-starters";
// Route-scoped stylesheets (S7a): shared tool-body container + the faction
// tool's picker/carousel styles.
import "@/app/styles/53-ask.css";
import "@/app/styles/54-ask-faction.css";

/**
 * One Faction, One Book — the faction path, living inside the Compendium since
 * Session 256 (the standalone Curator surface at /ask/faction is gone; a 308
 * carries old links and drilldown deep-links here). The compendium layout owns
 * art, masthead and foot; this page is a directory-sibling: category nav,
 * intro, then the carousel.
 */

const OFOB_DESCRIPTION =
  "Choose a Warhammer 40,000 faction and the archive names one carefully selected book to begin with.";

interface OfobPageProps {
  params: Promise<{ segments?: string[] }>;
}

// Every drilldown node is its own static document (and sitemap entry — the
// curated "where to start with X" long tail, URL matrix A.3), so the
// canonical carries the segments.
export async function generateMetadata({
  params,
}: OfobPageProps): Promise<Metadata> {
  const { segments } = await params;
  const path = ["/compendium/one-faction-one-book", ...(segments ?? [])].join("/");
  return {
    title: "One Faction, One Book — Compendium",
    description: OFOB_DESCRIPTION,
    alternates: { canonical: path },
    openGraph: routeOg({
      title: "One Faction, One Book",
      description: OFOB_DESCRIPTION,
    }),
  };
}

/**
 * Pre-render every reachable drilldown node so the tool ships fully static
 * (the data is committed JSON — no runtime DB). Includes the bare picker,
 * each faction, and each subfaction. The carousel takes over client-side from
 * whichever slide the URL seeds.
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

export default async function OneFactionOneBookPage({ params }: OfobPageProps) {
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
    <section className="cmp-directory cmp-tool" aria-labelledby="ofob-title">
      <CompendiumNav />
      <header className="cmp-cat-intro">
        <h2 id="ofob-title" className="cmp-cat-intro__heading">
          One Faction, One Book
        </h2>
        <p className="cmp-cat-intro__blurb">
          Choose an army. The Curator answers with one deliberate doorway, not
          another reading list.
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
  );
}
