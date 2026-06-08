"use client";

/**
 * Related works, grouped by `work.kind` and rendered as borderless tiles
 * (Brief 113 Phase A; widened in 129; collapsible + de-bordered in 131). The
 * loader resolves each work's link target (`href`) and parent-show context
 * (`showTitle`), so the view is dumb: a work with an `href` is a `<Link>`, one
 * without (a kind with no public surface) is an inert muted tile.
 *
 * Each kind-group is a disclosure section mirroring the podcast-year accordion
 * (`pod-year`): a header button (chevron + `// LABEL` + count) over a tile grid
 * the reader expands/collapses. Default state is "smart" — a group larger than
 * OPEN_THRESHOLD starts collapsed so a long Books list never buries the
 * Podcasts/Characters below it, while short lists stay open (no click to see a
 * handful of items). This is the one client island in the entity body; it still
 * imports nothing from `@/db` (types are `import type`, erased from the bundle).
 */
import { useState } from "react";
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

/** Groups with more works than this start collapsed; smaller ones start open. */
const OPEN_THRESHOLD = 12;

export default function RelatedWorks({ groups }: { groups: WorkGroup[] }) {
  // Open-set keyed by group kind, seeded so only the big groups start closed.
  // (useState initializer runs once; later groups never change identity.)
  const [openKinds, setOpenKinds] = useState<Set<string>>(
    () =>
      new Set(
        groups
          .filter((g) => g.works.length <= OPEN_THRESHOLD)
          .map((g) => g.kind),
      ),
  );

  if (groups.length === 0) return null;

  function toggle(kind: string) {
    setOpenKinds((cur) => {
      const next = new Set(cur);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }

  return (
    <section className="entity-view__section">
      <h2 className="entity-view__section-label">{"// RELATED WORKS"}</h2>

      {groups.map((g) => {
        const open = openKinds.has(g.kind);
        const panelId = `works-${g.kind}`;
        return (
          <div className="entity-view__work-group" key={g.kind}>
            <h3 className="entity-view__group-head">
              <button
                type="button"
                className="entity-view__group-toggle"
                aria-expanded={open}
                aria-controls={open ? panelId : undefined}
                onClick={() => toggle(g.kind)}
              >
                <span className="entity-view__group-chevron" aria-hidden>
                  ›
                </span>
                <span className="entity-view__group-label">{`// ${g.label}`}</span>
                <span className="entity-view__group-count">{g.works.length}</span>
              </button>
            </h3>
            {open && (
              <ul className="entity-view__cards" id={panelId}>
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
            )}
          </div>
        );
      })}
    </section>
  );
}
