/**
 * Intercept: a soft-nav to /world/[slug] opens the world hub as an overlay panel.
 * SERVER COMPONENT — same `loadEntity` + same db-free
 * `<EntityView>` as the canonical page; only the shared `DetailModal` is a
 * client component. Zero fork. Hard nav / refresh renders the full SSG page
 * instead (`src/app/world/[slug]/page.tsx`).
 */
import { notFound } from "next/navigation";
import DetailModal from "@/components/shared/DetailModal";
import EntityView from "@/components/entity/EntityView";
import { loadEntity } from "@/lib/entity/loader";

export default async function WorldModal({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const view = await loadEntity("location", slug);
  if (!view) notFound();

  return (
    <DetailModal title={view.name}>
      <EntityView data={view} />
    </DetailModal>
  );
}
