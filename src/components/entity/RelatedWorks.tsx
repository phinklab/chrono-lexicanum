/**
 * Related works, grouped by `work.kind` and rendered as cards (Brief 113,
 * Phase A). Books link to /buch/[slug]; any other kind renders as an inert
 * muted card (no dead /film/[slug] route yet). The layout takes additional
 * kind-groups without change — a new group is just another `WorkGroup` once its
 * `work_kind` enum + label (and, to link, a route) exist.
 */
import Link from "next/link";
import type { WorkGroup, WorkRef } from "@/lib/entity/types";

function workMeta(w: WorkRef): string {
  return [w.releaseYear != null ? String(w.releaseYear) : null, w.role]
    .filter(Boolean)
    .join(" · ");
}

export default function RelatedWorks({ groups }: { groups: WorkGroup[] }) {
  if (groups.length === 0) return null;

  return (
    <section className="entity-view__section">
      <h2 className="entity-view__section-label">{"// RELATED WORKS"}</h2>
      <span className="c-hairline" aria-hidden />

      {groups.map((g) => (
        <div className="entity-view__work-group" key={g.kind}>
          <h3 className="entity-view__subsection-label">
            {`// ${g.label} (${g.works.length})`}
          </h3>
          <ul className="entity-view__cards">
            {g.works.map((w) => {
              const meta = workMeta(w);
              const inner = (
                <>
                  <span className="entity-view__card-title">{w.title}</span>
                  {meta ? (
                    <span className="entity-view__card-meta">{meta}</span>
                  ) : null}
                </>
              );
              return (
                <li key={w.slug} className="entity-view__card-li">
                  {w.kind === "book" ? (
                    <Link
                      className="entity-view__card entity-view__card--link"
                      href={`/buch/${w.slug}`}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div className="entity-view__card entity-view__card--mute">
                      {inner}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
