/**
 * Intercept: a soft-nav to /fraktion/[slug] opens the faction hub as an overlay
 * panel (Brief 113, Phase B). SERVER COMPONENT — same `loadEntity` + same
 * db-free `<EntityView>` as the canonical page; only `EntityPanel` is a client
 * component. Zero fork. Hard nav / refresh renders the full SSG page instead
 * (`src/app/fraktion/[slug]/page.tsx`).
 */
import { notFound } from "next/navigation";
import EntityPanel from "@/components/entity/EntityPanel";
import EntityView from "@/components/entity/EntityView";
import { loadEntity } from "@/lib/entity/loader";
import { entityHref } from "@/lib/entity/types";

export default async function FactionModal({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const view = await loadEntity("faction", slug);
  if (!view) notFound();

  return (
    <EntityPanel
      title={view.name}
      canonicalHref={entityHref({ type: "faction", id: slug, name: view.name })}
    >
      <EntityView data={view} />
    </EntityPanel>
  );
}
