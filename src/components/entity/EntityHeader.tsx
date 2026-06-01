/** Entity header — eyebrow + the single `<h1>` + optional one-line tagline. */
import type { EntityType } from "@/lib/entity/types";

/** Per-type eyebrow, in the /buch surface's mono `// LATIN · ROLE` grammar. */
const EYEBROW: Record<EntityType, string> = {
  character: "// PERSONA · CHARACTER",
  faction: "// FRACTIO · FACTION",
  location: "// MVNDVS · WORLD",
};

export default function EntityHeader({
  type,
  name,
  oneLine,
}: {
  type: EntityType;
  name: string;
  oneLine?: string;
}) {
  return (
    <header className="entity-view__head">
      <p className="entity-view__eyebrow">{EYEBROW[type]}</p>
      <h1 className="entity-view__title">{name}</h1>
      {oneLine ? <p className="entity-view__oneline">{oneLine}</p> : null}
    </header>
  );
}
