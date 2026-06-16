/**
 * Hub breadcrumb — "‹ Characters" back to the entity's /compendium directory
 * (repointed from the removed /atlas decks in Board 121-P11).
 *
 * Lives in the page FRAME, not in <EntityView>: it is wayfinding chrome for the
 * full-page hub. Step 2's panel mounts <EntityView> on its own and gives the
 * overlay a close affordance instead, so this never leaks into the panel. The
 * chevron is drawn in CSS (decorative) so the link text stays clean for SRs.
 */
import Link from "next/link";
import { TYPE_TO_COMPENDIUM, type EntityType } from "@/lib/entity/types";

export default function EntityBackLink({ type }: { type: EntityType }) {
  const { href, label } = TYPE_TO_COMPENDIUM[type];
  return (
    <nav className="entity__topbar" aria-label="Breadcrumb">
      <Link className="entity__back" href={href}>
        {label}
      </Link>
    </nav>
  );
}
