/**
 * Intercept: a soft-nav to /charakter/[slug] from anywhere in the app opens the
 * character hub as an overlay panel instead of the full page.
 * SERVER COMPONENT — it calls the same `loadEntity` and renders the same
 * db-free `<EntityView>` as the canonical page; only the shared `DetailModal`
 * (the overlay shell) is `'use client'`. Zero fork: no second data path, no
 * second view.
 *
 * A hard nav / refresh / shared link bypasses the intercept and renders
 * `src/app/charakter/[slug]/page.tsx` (the canonical SSG page).
 */
import { notFound, redirect } from "next/navigation";
import DetailModal from "@/components/shared/DetailModal";
import EntityView from "@/components/entity/EntityView";
import { loadEntity } from "@/lib/entity/loader";
import { absorbedInto } from "@/lib/compendium/primarchs";

export default async function CharacterModal({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // A twin absorbed into a merged primarch (e.g. Omegon → Alpharius Omegon) has
  // no standalone view; redirect the soft-nav to the canonical merged entry.
  const canonical = absorbedInto(slug);
  if (canonical) redirect(`/charakter/${canonical}`);
  const view = await loadEntity("character", slug);
  if (!view) notFound();

  return (
    <DetailModal title={view.name}>
      <EntityView data={view} />
    </DetailModal>
  );
}
