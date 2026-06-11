/**
 * Cross-links — the right-hand "CONNECTIONS" rail (Brief 113, Phase A): labelled
 * sets of edges to other routable entities, rendered as chips. EntityView places
 * this as the second body column; it reflows under the main column in a narrow
 * container (small viewport / Step-2 panel). Empty → renders nothing.
 */
import Link from "next/link";
import { entityHref, type CrossLinkGroup } from "@/lib/entity/types";

export default function CrossLinkRail({ groups }: { groups: CrossLinkGroup[] }) {
  if (groups.length === 0) return null;

  return (
    <aside className="entity-view__rail" aria-label="Connections">
      <h2 className="entity-view__section-label">{"CONNECTIONS"}</h2>

      {groups.map((g) => (
        <div className="entity-view__subsection" key={g.label}>
          <h3 className="entity-view__subsection-label">{`// ${g.label}`}</h3>
          <ul className="entity-view__chip-row">
            {g.items.map((ref) => (
              <li key={`${ref.type}:${ref.id}`} className="entity-view__chip-li">
                <Link
                  className="entity-view__chip entity-view__chip--link"
                  href={entityHref(ref)}
                >
                  {ref.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <p className="entity-view__rail-note" aria-hidden>
        → linked
      </p>
    </aside>
  );
}
