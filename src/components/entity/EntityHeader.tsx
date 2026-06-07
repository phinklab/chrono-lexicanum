/**
 * Entity header — eyebrow + the single `<h1>` + optional tagline + a compact
 * meta-line of 1–3 already-loaded facts (Brief 113, Phase A). The meta facts
 * are chosen + de-duped by EntityView; this component only renders them. Linked
 * facts (allegiance / parent faction) render as `<Link>`s, scalar facts as text.
 */
import Link from "next/link";
import { entityHref, type EntityType, type FactRow } from "@/lib/entity/types";

/** Per-type eyebrow, in the /buch surface's mono `// LATIN · ROLE` grammar. */
const EYEBROW: Record<EntityType, string> = {
  character: "// PERSONA · CHARACTER",
  faction: "// FRACTIO · FACTION",
  location: "// MVNDVS · WORLD",
  person: "// AVCTOR · AUTHOR",
};

export default function EntityHeader({
  type,
  name,
  oneLine,
  meta,
}: {
  type: EntityType;
  name: string;
  oneLine?: string;
  meta: FactRow[];
}) {
  return (
    <header className="entity-view__head">
      <p className="entity-view__eyebrow">{EYEBROW[type]}</p>
      <h1 className="entity-view__title">{name}</h1>
      {oneLine ? <p className="entity-view__oneline">{oneLine}</p> : null}
      {meta.length > 0 ? (
        <p className="entity-view__meta">
          {meta.map((f, i) => (
            <span className="entity-view__meta-item" key={f.label}>
              {i > 0 ? (
                <span className="entity-view__meta-sep" aria-hidden>
                  ·
                </span>
              ) : null}
              {typeof f.value === "string" ? (
                <span className="entity-view__meta-val">{f.value}</span>
              ) : (
                <Link
                  className="entity-view__meta-link"
                  href={entityHref(f.value)}
                >
                  {f.value.name}
                </Link>
              )}
            </span>
          ))}
        </p>
      ) : null}
    </header>
  );
}
