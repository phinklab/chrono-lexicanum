/** Entity dossier — scalar attributes (`<dl>`) plus free-text tag chips. */
import Link from "next/link";
import { entityHref, type FactRow } from "@/lib/entity/types";

export default function EntityFacts({
  facts,
  tags,
}: {
  facts: FactRow[];
  tags?: string[];
}) {
  const hasTags = (tags?.length ?? 0) > 0;
  if (facts.length === 0 && !hasTags) return null;

  return (
    <section className="entity-view__section">
      <h2 className="entity-view__section-label">{"DOSSIER"}</h2>

      {facts.length > 0 ? (
        <dl className="entity-view__facts">
          {facts.map((f) => (
            <div className="entity-view__fact" key={f.label}>
              <dt className="entity-view__fact-term">{f.label}</dt>
              <dd className="entity-view__fact-val">
                {typeof f.value === "string" ? (
                  f.value
                ) : (
                  <Link className="entity-view__link" href={entityHref(f.value)}>
                    {f.value.name}
                  </Link>
                )}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {tags && tags.length > 0 ? (
        <ul className="entity-view__chip-row entity-view__tags">
          {tags.map((t) => (
            <li
              key={t}
              className="entity-view__chip-li"
            >
              <span className="entity-view__chip entity-view__chip--mute">{t}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
