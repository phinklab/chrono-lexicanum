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
 * The "One faction, one book" carousel. One faction per
 * slide, the curated book shown immediately. Navigation is pure client state —
 * prev/next, the jump rail, and arrow keys all swap the slide WITHOUT a route
 * change, so the page never reloads or jumps back to the top. The URL segment
 * only seeds the initial slide (so a deep-link / the static page lands on the
 * right faction, and SSR still renders one). Sub-faction factions surface their
 * chapters as chips inside the slide that swap the book in place.
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
    <div
      className="ofob"
      role="group"
      aria-roledescription="carousel"
      aria-label="One faction, one book"
      onKeyDown={onKeyDown}
    >
      {/* Jump rail — every faction, the active one marked. Doubles as the
          position indicator; no navigation, so picking a faction never jumps
          the page to the top. */}
      <p className="ofob__step">
        <span className="ofob__step-n">I</span>Choose your faction
      </p>
      <div className="ofob__rail-wrap">
        <ul className="ofob__rail" aria-label="Choose a faction">
          {nodes.map((node, i) => {
            const active = i === factionIndex;
            return (
              <li key={node.slug} className="ofob__rail-item">
                <button
                  type="button"
                  className="ofob__rail-btn"
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

      <div className="ofob__stage">
        {/* Faction stepper — arrows + index on one line, directly under the
            rail. They cycle the FACTION; parked at the stage edges they read
            as if they cycled the book below. Outside the keyed slide so the
            chrome doesn't re-animate on every swap. */}
        <div className="ofob__nav">
          <button
            type="button"
            className="ofob__arrow"
            onClick={() => goToFaction(factionIndex - 1)}
            aria-label="Previous faction"
          >
            <span aria-hidden>‹</span>
          </button>
          <p className="ofob__index" aria-hidden>
            {String(factionIndex + 1).padStart(2, "0")}
            <span className="ofob__index-sep">/</span>
            {String(nodes.length).padStart(2, "0")}
          </p>
          <button
            type="button"
            className="ofob__arrow"
            onClick={() => goToFaction(factionIndex + 1)}
            aria-label="Next faction"
          >
            <span aria-hidden>›</span>
          </button>
        </div>

        {/* Keyed on the faction so the reveal animation re-fires per slide. */}
        <div className="ofob__slide" key={faction.slug}>
          {/* The faction is named by the highlighted rail entry above — a
              second display-size repetition of it pushed the actual verdict
              (the book) down the hierarchy. Kept for screen readers. */}
          <h2 className="ask-sr-only">{faction.label}</h2>

          {showChapters && (
            <>
              <p className="ofob__step">
                <span className="ofob__step-n">II</span>Narrow to a chapter
                <span className="ofob__step-note"> · optional</span>
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
                      onClick={() => setFacetIndex(i)}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <p className="ofob__step">
            <span className="ofob__step-n">III</span>Your entry point
          </p>
          {facet.picks.length > 0 ? (
            <FactionPickPanel
              key={`${faction.slug}:${facet.key}`}
              contextLabel={showChapters ? `${faction.label} · ${facet.label}` : faction.label}
              picks={facet.picks}
            />
          ) : (
            <p className="ofob__empty">No entry point on file yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
