/**
 * Intercept: a soft-nav to /charakter/[slug] from anywhere in the app opens the
 * character hub as an overlay panel instead of the full page (Brief 113, Phase
 * B). SERVER COMPONENT — it calls the same `loadEntity` and renders the same
 * db-free `<EntityView>` as the canonical page; only `EntityPanel` (the overlay
 * shell) is `'use client'`. Zero fork: no second data path, no second view.
 *
 * A hard nav / refresh / shared link bypasses the intercept and renders
 * `src/app/charakter/[slug]/page.tsx` (the canonical SSG page).
 */
import { notFound } from "next/navigation";
import EntityPanel from "@/components/entity/EntityPanel";
import EntityView from "@/components/entity/EntityView";
import { loadEntity } from "@/lib/entity/loader";
import { entityHref } from "@/lib/entity/types";

export default async function CharacterModal({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const view = await loadEntity("character", slug);
  if (!view) notFound();

  return (
    <EntityPanel
      title={view.name}
      canonicalHref={entityHref({ type: "character", id: slug, name: view.name })}
    >
      <EntityView data={view} />
    </EntityPanel>
  );
}
