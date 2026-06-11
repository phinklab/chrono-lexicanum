/**
 * Per-world detail. /welt/prospero
 *
 * Thin frame over the shared entity-view (Brief 109, Step 1). The `[slug]`
 * segment IS the location id. The page owns the frame (main + photo backdrop +
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
  const ids = await listEntityIds("location");
  return ids.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const view = await loadEntity("location", slug);
  return { title: view ? view.name : "Unknown world" };
}

export default async function WorldPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const view = await loadEntity("location", slug);
  if (!view) notFound();

  return (
    <main className="entity">
      <SiteBackground variant="vista" position="50% 32%" />
      <div className="entity__decor" aria-hidden>
        <CornerAuspex size={140} label="MVNDVS · 1011" />
      </div>
      <div className="entity__inner">
        <EntityBackLink type="location" />
        <EntityView data={view} />
      </div>
    </main>
  );
}
