/** Cross-links — labelled sets of edges to other routable entities. */
import Link from "next/link";
import { entityHref, type CrossLinkGroup } from "@/lib/entity/types";

export default function CrossLinkRail({ groups }: { groups: CrossLinkGroup[] }) {
  if (groups.length === 0) return null;

  return (
    <section className="entity-view__section">
      <h2 className="entity-view__section-label">{"// CONNECTIONS"}</h2>
      <span className="c-hairline" aria-hidden />

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
    </section>
  );
}
