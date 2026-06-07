/**
 * EntityView — the frame-agnostic body of every entity-hub surface.
 * Brief 109 (Step 1) built the seam; Brief 113 Phase A redesigns the layout.
 *
 * TWO SEAM RULES (do not break — they are what let later arc steps reuse this):
 *   1. **db-free.** This component and its section modules import nothing from
 *      `@/db` and nothing server-only. The page (`/charakter`, `/fraktion`,
 *      `/welt`) owns `<main>` + `SiteBackground` + decor + scrim and feeds in
 *      the already-loaded `EntityView` object; Step 2's panel mounts this same
 *      component inside an overlay with the same payload — zero fork.
 *   2. **owns the single `<h1>`.** The frame contributes no heading, so this is
 *      the page's one `<h1>` (the entity name, in EntityHeader). Section
 *      headings are `<h2>`/`<h3>`; decorative rules are `aria-hidden`; empty
 *      sections render nothing.
 *
 * Layout (Phase A): a full-width header (eyebrow → `<h1>` → tagline → 1–3-fact
 * meta-line) over a two-column body — a main column (dossier + works cards) and
 * a right "CONNECTIONS" rail. `.entity-view` is a query container, so the rail
 * reflows under the main column whenever the *container* is narrow — on a small
 * viewport and, for free, inside Step 2's narrow panel (no Phase-B work needed).
 */
import type {
  EntityView as EntityViewData,
  EntityType,
} from "@/lib/entity/types";
import EntityHeader from "./EntityHeader";
import EntityFacts from "./EntityFacts";
import RelatedWorks from "./RelatedWorks";
import CrossLinkRail from "./CrossLinkRail";

/**
 * Facts hoisted into the header meta-line, per type (the loader already
 * supplies them; the view just picks 1–3). The meta-line CONSUMES these — the
 * dossier renders only what's left, so no fact appears twice. Selection is by
 * label; order within the line follows the loader's `facts` order.
 */
const META_FACT_LABELS: Record<EntityType, string[]> = {
  character: ["Allegiance"],
  faction: ["Alignment", "Parent faction"],
  location: ["Sector", "Designation"],
  // Persons lead with their bio tagline (oneLine); facts (e.g. "Born") read
  // clearer with their label, so none are hoisted into the label-less meta line.
  person: [],
};

export default function EntityView({ data }: { data: EntityViewData }) {
  const metaLabels = META_FACT_LABELS[data.type];
  const metaFacts = data.facts.filter((f) => metaLabels.includes(f.label));
  const dossierFacts = data.facts.filter((f) => !metaLabels.includes(f.label));

  // The rail only claims a column when there are connections to show — without
  // it the main column takes the full width instead of stranding empty gutter.
  const hasRail = data.crossLinks.length > 0;

  const isEmpty =
    data.facts.length === 0 &&
    !(data.tags && data.tags.length > 0) &&
    data.worksByKind.length === 0 &&
    data.crossLinks.length === 0;

  return (
    <div className="entity-view">
      <EntityHeader
        type={data.type}
        name={data.name}
        oneLine={data.oneLine}
        meta={metaFacts}
      />
      <div
        className={
          hasRail
            ? "entity-view__body entity-view__body--railed"
            : "entity-view__body"
        }
      >
        <div className="entity-view__main">
          <EntityFacts facts={dossierFacts} tags={data.tags} />
          <RelatedWorks groups={data.worksByKind} />
        </div>
        <CrossLinkRail groups={data.crossLinks} />
      </div>
      {isEmpty ? (
        <p className="entity-view__empty">
          No catalogued appearances or connections yet.
        </p>
      ) : null}
    </div>
  );
}
