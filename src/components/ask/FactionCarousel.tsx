"use client";

import { useState, type KeyboardEvent } from "react";
import FactionPickPanel from "./FactionPickPanel";
import type { FactionStarterNode, FactionStarterPick } from "@/lib/ask/faction-starters-schema";

type FactionCarouselProps = {
  /** All top-level faction nodes, in display order. */
  nodes: readonly FactionStarterNode[];
  /** Faction slug from the URL (deep-link / SSR), or null on the bare picker. */
  initialFactionSlug?: string | null;
  /** Subfaction slug from the URL, or null. */
  initialSubSlug?: string | null;
};

/** A selectable book-source within one faction slide. */
type Facet = {
  key: string;
  label: string;
  picks: readonly FactionStarterPick[];
};

/** Facet key for a node's own picks (shown beside its chapters). */
const SELF = "__self";

/**
 * The facets of a faction slide. A pure leaf yields one untabbed facet; a node
 * with chapters yields one chip per chapter, preceded by an "Overall" chip when
 * the faction also carries its own pick (Astra Militarum). A pure group (Space
 * Marines, Chaos) yields just its chapters.
 */
function facetsOf(node: FactionStarterNode): Facet[] {
  const own = node.picks ?? [];
  const children = node.children ?? [];
  if (children.length === 0) {
    return [{ key: SELF, label: node.label, picks: own }];
  }
  const facets: Facet[] = [];
  if (own.length > 0) {
    facets.push({ key: SELF, label: "Overall", picks: own });
  }
  for (const child of children) {
    facets.push({ key: child.slug, label: child.label, picks: child.picks ?? [] });
  }
  return facets;
}

/** Wrap an index into [0, len) in both directions, so the carousel loops. */
function wrapIndex(i: number, len: number): number {
  if (len <= 0) return 0;
  return ((i % len) + len) % len;
}

/**
 * The Curator's faction path: one selected faction, the complete roster as a
 * calm register, and one answer. Navigation stays in client state, so arrows,
 * roster picks and optional chapters never reload or jump the page. URL
 * segments only seed the initial faction/facet for deep links and SSR.
 */
export default function FactionCarousel({
  nodes,
  initialFactionSlug,
  initialSubSlug,
}: FactionCarouselProps) {
  const initialFaction = Math.max(
    0,
    nodes.findIndex((n) => n.slug === initialFactionSlug),
  );
  const initialFacet = (() => {
    if (!initialSubSlug) return 0;
    const idx = facetsOf(nodes[initialFaction]!).findIndex((f) => f.key === initialSubSlug);
    return idx >= 0 ? idx : 0;
  })();

  const [factionIndex, setFactionIndex] = useState(initialFaction);
  const [facetIndex, setFacetIndex] = useState(initialFacet);

  const faction = nodes[factionIndex]!;
  const facets = facetsOf(faction);
  const safeFacet = Math.min(facetIndex, facets.length - 1);
  const facet = facets[safeFacet]!;
  const showChapters = facets.length > 1;

  const goToFaction = (i: number) => {
    setFactionIndex(wrapIndex(i, nodes.length));
    setFacetIndex(0); // land on the faction's first facet (Overall / first chapter)
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToFaction(factionIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goToFaction(factionIndex + 1);
    }
  };

  return (
    <div className="ofob" role="group" aria-label="Curated faction entry point">
      <section className="ofob__chooser" aria-labelledby="ofob-faction-name">
        <p className="ofob__kicker">Choose your faction</p>
        <div className="ofob__faction-line" onKeyDown={onKeyDown}>
          <button
            type="button"
            className="ofob__arrow"
            onClick={() => goToFaction(factionIndex - 1)}
            aria-label="Previous faction"
          >
            <span aria-hidden>‹</span>
          </button>
          <h2 id="ofob-faction-name" className="ofob__faction-name">
            {faction.label}
          </h2>
          <button
            type="button"
            className="ofob__arrow"
            onClick={() => goToFaction(factionIndex + 1)}
            aria-label="Next faction"
          >
            <span aria-hidden>›</span>
          </button>
        </div>
        <p className="ofob__index" aria-label={`Faction ${factionIndex + 1} of ${nodes.length}`}>
          {String(factionIndex + 1).padStart(2, "0")}
          <span className="ofob__index-sep">/</span>
          {String(nodes.length).padStart(2, "0")}
        </p>

        <div className="ofob__all">
          <p id="ofob-all-label" className="ofob__all-label">
            <span>All factions</span>
          </p>
          <ul
            id="ofob-faction-roster"
            className="ofob__roster"
            aria-labelledby="ofob-all-label"
          >
            {nodes.map((node, i) => {
              const active = i === factionIndex;
              return (
                <li key={node.slug} className="ofob__roster-item">
                  <button
                    type="button"
                    className="ofob__roster-btn"
                    data-active={active}
                    aria-current={active ? "true" : undefined}
                    onClick={() => goToFaction(i)}
                  >
                    {node.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {showChapters && (
          <div className="ofob__chapter-group">
            <p className="ofob__chapter-label">
              Choose a chapter <span>· optional</span>
            </p>
            <div className="ofob__chapters" aria-label={`${faction.label} chapters`}>
              {facets.map((f, i) => {
                const active = i === safeFacet;
                return (
                  <button
                    key={f.key}
                    type="button"
                    className="ofob__chapter"
                    data-active={active}
                    aria-pressed={active}
                    aria-label={f.label}
                    onClick={() => setFacetIndex(i)}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <div className="ofob__answer" key={`${faction.slug}:${facet.key}`}>
        {facet.picks.length > 0 ? (
          <FactionPickPanel
            contextLabel={showChapters ? `${faction.label} · ${facet.label}` : faction.label}
            picks={facet.picks}
          />
        ) : (
          <p className="ofob__empty">No entry point on file yet.</p>
        )}
      </div>
    </div>
  );
}
