/**
 * Per-character detail. /charakter/horus
 *
 * Thin frame over the shared entity-view (Brief 109, Step 1). The `[slug]`
 * segment IS the character id. The page owns the frame (main + photo backdrop +
 * decor); the db-free <EntityView> renders the body from `loadEntity`.
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SiteBackground from "@/components/chrome/SiteBackground";
import CornerAuspex from "@/components/chrono/CornerAuspex";
import EntityBackLink from "@/components/entity/EntityBackLink";
import EntityView from "@/components/entity/EntityView";
import { listEntityIds, loadEntity } from "@/lib/entity/loader";

type Params = { slug: string };

// Pre-render every known id at build time; the long tail (and ids added after
// a build) renders on demand. Never pair with `force-dynamic` — that defeats SSG.
export const dynamicParams = true;

export async function generateStaticParams() {
  const ids = await listEntityIds("character");
  return ids.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const view = await loadEntity("character", slug);
  return { title: view ? view.name : "Unknown character" };
}

export default async function CharacterPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const view = await loadEntity("character", slug);
  if (!view) notFound();

  return (
    <main className="entity">
      <SiteBackground variant="vista" position="50% 24%" />
      <div className="entity__decor" aria-hidden>
        <CornerAuspex size={140} label="PERSONA // 1011" />
      </div>
      <div className="entity__inner">
        <EntityBackLink type="character" />
        <EntityView data={view} />
      </div>
    </main>
  );
}
