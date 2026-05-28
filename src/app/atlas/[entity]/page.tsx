/**
 * /atlas/[entity] — generic per-entity route.
 *
 * Resolves `entity` against the deck registry. Unknown slug → 404.
 * `werke` keeps its bespoke audit/drift list; the ten Phase-1 admin
 * inventory decks (Task 4B–4D) each have their own page component; the
 * Phase-2 `junctions` deck falls through to `StubPage`. Auth-gating and
 * `force-dynamic` stay on this file — the page components don't see
 * any auth concern.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AerenPage from "@/components/atlas/pages/AerenPage";
import CharakterePage from "@/components/atlas/pages/CharakterePage";
import FacetsPage from "@/components/atlas/pages/FacetsPage";
import FraktionenPage from "@/components/atlas/pages/FraktionenPage";
import PersonenPage from "@/components/atlas/pages/PersonenPage";
import SektorenPage from "@/components/atlas/pages/SektorenPage";
import SerienPage from "@/components/atlas/pages/SerienPage";
import ServicesPage from "@/components/atlas/pages/ServicesPage";
import StubPage from "@/components/atlas/pages/StubPage";
import SubmissionsPage from "@/components/atlas/pages/SubmissionsPage";
import WeltenPage from "@/components/atlas/pages/WeltenPage";
import WerkePage from "@/components/atlas/pages/WerkePage";
import { DECK_IDS, findDeck } from "@/lib/atlas/decks";
import { getIsAdmin } from "@/lib/atlas/auth";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ entity: string }>;
  searchParams: Promise<{ sort?: string; audit?: string | string[] }>;
}

export function generateStaticParams(): Array<{ entity: string }> {
  return DECK_IDS.map((id) => ({ entity: id }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { entity } = await props.params;
  const deck = findDeck(entity);
  if (!deck) return { title: "Unknown" };
  return { title: deck.label };
}

export default async function AtlasEntityPage(props: Props) {
  if (!(await getIsAdmin())) notFound();

  const { entity } = await props.params;
  const deck = findDeck(entity);
  if (!deck) notFound();

  switch (deck.id) {
    case "werke":
      return <WerkePage deck={deck} searchParams={props.searchParams} />;
    case "fraktionen":
      return <FraktionenPage deck={deck} />;
    case "welten":
      return <WeltenPage deck={deck} />;
    case "charaktere":
      return <CharakterePage deck={deck} />;
    case "sektoren":
      return <SektorenPage deck={deck} />;
    case "aeren":
      return <AerenPage deck={deck} />;
    case "serien":
      return <SerienPage deck={deck} />;
    case "personen":
      return <PersonenPage deck={deck} />;
    case "submissions":
      return <SubmissionsPage deck={deck} />;
    case "facets":
      return <FacetsPage deck={deck} />;
    case "services":
      return <ServicesPage deck={deck} />;
    // Only the Phase-2 `junctions` deck falls through to StubPage now.
    default:
      return <StubPage deck={deck} />;
  }
}
