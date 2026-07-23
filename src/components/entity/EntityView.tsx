/**
 * Frame-agnostic entity body shared by full pages and overlays. Keep it DB- and
 * server-only-free; frames provide chrome but no heading, so `EntityHeader`
 * owns the single h1. Empty sections disappear and the container-query rail
 * reflows under the dossier in narrow pages or panels.
 */
import type {
  EntityView as EntityViewData,
  EntityType,
} from "@/lib/entity/types";
import EntityHeader from "./EntityHeader";
import EntityBlurb from "./EntityBlurb";
import EntityFacts from "./EntityFacts";
import RelatedWorks from "./RelatedWorks";
import CrossLinkRail from "./CrossLinkRail";
// Component-scoped stylesheet (S7a): rides with this view into the four
// entity routes AND the @modal entity intercepts.
import "@/app/styles/59-entity.css";

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
      <EntityHeader name={data.name} oneLine={data.oneLine} meta={metaFacts} />
      <div
        className={
          hasRail
            ? "entity-view__body entity-view__body--railed"
            : "entity-view__body"
        }
      >
        <div className="entity-view__main">
          {data.blurb ? <EntityBlurb blurb={data.blurb} /> : null}
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
