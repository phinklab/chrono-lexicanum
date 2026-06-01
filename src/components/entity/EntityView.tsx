/**
 * EntityView — the frame-agnostic body of every entity-hub surface.
 * Brief 109, Step 1 of the entity-graph arc.
 *
 * TWO SEAM RULES (do not break — they are what let later arc steps reuse this):
 *   1. **db-free.** This component and its section modules import nothing from
 *      `@/db` and nothing server-only. The page (`/charakter`, `/fraktion`,
 *      `/welt`) owns `<main>` + `SiteBackground` + decor and feeds in the
 *      already-loaded `EntityView` object; Step 2's panel will mount this same
 *      component inside an overlay with the same payload — zero fork.
 *   2. **owns the single `<h1>`.** The frame contributes no heading, so this is
 *      the page's one `<h1>` (the entity name, in EntityHeader). Section
 *      headings are `<h2>`/`<h3>`; decorative rules are `aria-hidden`; empty
 *      sections render nothing.
 *
 * Layout is a single centered column (header → facts → works → connections) —
 * not /buch's two-column rail, because entities have no cover/buy aside and the
 * single column reuses cleanly in a narrow Step-2 panel.
 */
import type { EntityView as EntityViewData } from "@/lib/entity/types";
import EntityHeader from "./EntityHeader";
import EntityFacts from "./EntityFacts";
import RelatedWorks from "./RelatedWorks";
import CrossLinkRail from "./CrossLinkRail";

export default function EntityView({ data }: { data: EntityViewData }) {
  const isEmpty =
    data.facts.length === 0 &&
    !(data.tags && data.tags.length > 0) &&
    data.worksByKind.length === 0 &&
    data.crossLinks.length === 0;

  return (
    <div className="entity-view">
      <EntityHeader type={data.type} name={data.name} oneLine={data.oneLine} />
      <EntityFacts facts={data.facts} tags={data.tags} />
      <RelatedWorks groups={data.worksByKind} />
      <CrossLinkRail groups={data.crossLinks} />
      {isEmpty ? (
        <p className="entity-view__empty">
          No catalogued appearances or connections yet.
        </p>
      ) : null}
    </div>
  );
}
