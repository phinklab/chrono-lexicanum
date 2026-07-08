/**
 * Entity header — the single `<h1>` + optional tagline + a compact meta-line
 * of 1–3 already-loaded facts. The meta facts are chosen + de-duped by
 * EntityView; this component only renders them. Linked facts (allegiance /
 * parent faction) render as `<Link>`s, scalar facts as text. The former
 * per-type `LATIN · ROLE` eyebrow is retired (2026-07-08): it told the reader
 * nothing the list or the title didn't.
 */
import Link from "next/link";
import { entityHref, type FactRow } from "@/lib/entity/types";

export default function EntityHeader({
  name,
  oneLine,
  meta,
}: {
  name: string;
  oneLine?: string;
  meta: FactRow[];
}) {
  return (
    <header className="entity-view__head">
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
