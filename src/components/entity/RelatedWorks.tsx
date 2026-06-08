/**
 * Related works, grouped by `work.kind` and rendered as borderless tiles
 * (Brief 113 Phase A; widened in 129; de-bordered in 131; always-expanded in
 * 132). The loader resolves each work's link target (`href`) and parent-show
 * context (`showTitle`), so the view is dumb: a work with an `href` is a
 * `<Link>`, one without (a kind with no public surface) is an inert muted tile.
 *
 * Each kind-group is a static heading (label + count) over a tile grid; every
 * group renders fully expanded. A collapsed-by-default long Books list used to
 * bury the Podcasts/Characters groups below it, and a short popup never
 * benefited from a click to reveal a handful of items — so the disclosure was
 * dropped. Pure presentational (no client state); it imports nothing from
 * `@/db` (types are `import type`, erased from the bundle).
 */
import Link from "next/link";
import type { WorkGroup, WorkRef } from "@/lib/entity/types";

function workMeta(w: WorkRef): string {
  return [
    w.releaseYear != null ? String(w.releaseYear) : null,
    w.showTitle ?? null,
    w.role,
  ]
    .filter(Boolean)
    .join(" · ");
}

export default function RelatedWorks({ groups }: { groups: WorkGroup[] }) {
  if (groups.length === 0) return null;

  return (
    <section className="entity-view__section">
      <h2 className="entity-view__section-label">{"// RELATED WORKS"}</h2>

      {groups.map((g) => (
        <div className="entity-view__work-group" key={g.kind}>
          <h3 className="entity-view__group-head">
            <span className="entity-view__group-label">{g.label}</span>
            <span className="entity-view__group-count">{g.works.length}</span>
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
                  {w.href ? (
                    <Link
                      className="entity-view__card entity-view__card--link"
                      href={w.href}
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
