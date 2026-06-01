/**
 * Related works, grouped by `work.kind`. Books link to /buch/[slug]; any other
 * kind renders as an inert muted chip (no dead /film/[slug] yet).
 */
import Link from "next/link";
import type { WorkGroup } from "@/lib/entity/types";

export default function RelatedWorks({ groups }: { groups: WorkGroup[] }) {
  if (groups.length === 0) return null;

  return (
    <section className="entity-view__section">
      <h2 className="entity-view__section-label">{"// RELATED WORKS"}</h2>
      <span className="c-hairline" aria-hidden />

      {groups.map((g) => (
        <div className="entity-view__subsection" key={g.kind}>
          <h3 className="entity-view__subsection-label">{`// ${g.label}`}</h3>
          <ul className="entity-view__chip-row">
            {g.works.map((w) => (
              <li key={w.slug} className="entity-view__chip-li">
                {w.kind === "book" ? (
                  <Link
                    className="entity-view__chip entity-view__chip--link"
                    href={`/buch/${w.slug}`}
                  >
                    {w.title}
                    {w.role ? (
                      <span className="entity-view__chip-role"> · {w.role}</span>
                    ) : null}
                  </Link>
                ) : (
                  <span className="entity-view__chip entity-view__chip--mute">
                    {w.title}
                    {w.role ? (
                      <span className="entity-view__chip-role"> · {w.role}</span>
                    ) : null}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
