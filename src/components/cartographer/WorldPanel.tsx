"use client";

/**
 * WorldPanel — the click popup at the pin, in the live-site surface language
 * (frameless near-opaque glass, drop shadow + bone light edge, NO border
 * stroke). Shows primary + secondary/tertiary classification and the work
 * list with role + rollup provenance (`via`). SSOT coordinates are curation
 * internals and deliberately NOT rendered.
 * Dust worlds (n=0) open the same panel: blurb (or filler) + a quiet
 * "no records" line instead of the works toggle.
 *
 * Links: books soft-navigate to /book/{slug} — the @modal Kapelle intercept
 * opens over the chart; episodes go to the show's archive hall; the footer
 * opens /world/{locationId} when the world is linked.
 *
 * Layout: under the header sits the curated one-sentence blurb
 * (location-blurbs.json — the same text the big entity view opens with;
 * "empty. add later" when none is curated yet), then a collapsed
 * "Literature & podcasts" row that expands to the first five records;
 * "All N records →" opens the big view (/world/{loc} — the @modal intercept
 * renders it over the chart).
 *
 * Data: the panel shell (name, class, count) renders synchronously from the
 * payload skeleton; blurb + work list arrive per world via
 * `source.detail()` (S10a — one small fetch per first open, cached).
 *
 * A11y: non-modal dialog. Opening never steals focus (the S8 smoke pins
 * "seek keeps focus while the panel opens" — deliberate: seek world after
 * world without re-tabbing); the root announces the selection in its status
 * region and restores focus to the invoker when the panel closes while
 * focus was inside it. `inert` parks the hidden panel out of the tab order.
 *
 * Positioning is imperative (bus frame subscription) — panning never
 * re-renders React. The last world stays rendered through the fade-out.
 */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { isNarrow } from "@/lib/useMediaQuery";
import type { FeaturedWorld, MapPayload, WorldDetail } from "@/lib/map/payload";
import type { MapWorldKind, MapWorldWork } from "@/lib/map/map-worlds-schema";
import type { PinSource } from "@/lib/map/pin-source";
import type { ChartBus } from "./chart-bus";

const KIND_LABEL: Record<MapWorldKind, string> = {
  imperial: "Imperial world",
  "imperial-military": "Fortress world",
  "chaos-warp": "Domain of the Ruinous Powers",
  dead: "Dead world",
  xenos: "Xenos world",
  necron: "Necron tomb world",
  aeldari: "Aeldari domain",
  station: "Station",
  gate: "Warp gate",
  fleet: "Fleet",
  unclassified: "Unclassified",
  region: "Region of the chart",
};

const ROLE_RANK: Record<string, number> = { primary: 0, subject: 1, secondary: 2, mentioned: 3 };

function workHref(w: MapWorldWork): string {
  return w.type === "book" ? `/book/${w.slug}` : `/archive/podcasts/${w.show}`;
}

function viaLabel(via: string): string {
  return via.replace(/_/g, " ");
}

interface WorldPanelProps {
  world: FeaturedWorld | null;
  payload: MapPayload;
  source: PinSource;
  bus: ChartBus;
  /** The mobile sheet is up (modal) — park the panel out of the AT tree. */
  suppressed?: boolean;
  onClose: () => void;
}

export default function WorldPanel({
  world,
  payload,
  source,
  bus,
  suppressed = false,
  onClose,
}: WorldPanelProps) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<FeaturedWorld | null>(null);
  // Last non-null world keeps the content alive through the close fade-out
  // ("storing information from previous renders" pattern).
  const [shown, setShown] = useState<FeaturedWorld | null>(null);
  if (world && world !== shown) setShown(world);
  // Disclosure state is keyed by world id — a new selection starts collapsed
  // without any effect.
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [fullFor, setFullFor] = useState<string | null>(null);
  const expanded = shown !== null && openFor === shown.id;
  const full = shown !== null && fullFor === shown.id;

  /* Lazy detail (works + blurb): fetched per world on open — keyed per
     world id so a stale response never shows on the wrong world. */
  const [detail, setDetail] = useState<{ id: string; d: WorldDetail | null } | null>(null);
  useEffect(() => {
    if (!shown) return;
    let live = true;
    const id = shown.id;
    source.detail(id).then((d) => {
      if (live) setDetail({ id, d });
    });
    return () => {
      live = false;
    };
  }, [shown, source]);
  const shownDetail = shown && detail?.id === shown.id ? detail.d : null;
  const detailPending = shown !== null && detail?.id !== shown.id;

  const place = useCallback(() => {
    const el = elRef.current;
    const w = worldRef.current;
    const driver = bus.driver;
    if (!el || !w || !driver) return;
    if (isNarrow()) {
      // ≤900px the panel is a bottom-docked card — CSS owns the position;
      // clear any pin-anchored inline placement from a wider viewport.
      el.style.left = "";
      el.style.top = "";
      return;
    }
    const p = driver.worldToScreen(w.gx, w.gy);
    const pw = el.offsetWidth || 362;
    const ph = el.offsetHeight || 220;
    let px = p.x + 26;
    const py = Math.max(14, Math.min(window.innerHeight - ph - 14, p.y - 24));
    if (px + pw > window.innerWidth - 14) px = p.x - 26 - pw;
    el.style.left = `${px}px`;
    el.style.top = `${py}px`;
  }, [bus]);

  // Re-place when selection or content committed (size may have changed —
  // including the async detail arriving).
  useEffect(() => {
    worldRef.current = world;
    place();
  }, [world, shown, expanded, full, detail, place]);

  useEffect(() => bus.onFrame(place), [bus, place]);

  // During an eased flight the panel ducks out (imperative class — no React
  // render per flight): without this it teleports to the new pin and races
  // pinned across the chart, which reads as flicker on planet→planet clicks.
  useEffect(
    () =>
      bus.onFlightChange((active) => {
        elRef.current?.classList.toggle("inflight", active);
      }),
    [bus],
  );

  const cls =
    shown &&
    (shown.kind !== "region" && shown.c >= 0 && payload.cls[shown.c] !== "Unclassified"
      ? payload.cls[shown.c]
      : KIND_LABEL[shown.kind]);
  const works = shownDetail
    ? [...shownDetail.works].sort(
        (a, b) => (ROLE_RANK[a.role] ?? 9) - (ROLE_RANK[b.role] ?? 9) || a.title.localeCompare(b.title),
      )
    : [];

  return (
    <div
      ref={elRef}
      className={`cg-pop${world ? " open" : ""}`}
      role="dialog"
      aria-label={shown?.name}
      aria-hidden={!world || suppressed}
      inert={!world || suppressed}
    >
      {shown && (
        <>
          <button className="pp-close" onClick={onClose} aria-label="Close">
            ×
          </button>
          <p className="pp-tele">
            {shown.kind === "region"
              ? "Regional contact"
              : shown.n > 0
                ? "Contact confirmed"
                : "Contact logged"}
          </p>
          <h3 className="pp-name">{shown.name}</h3>
          <p className="pp-cls">
            {cls}
            {shown.seg ? ` · Segmentum ${shown.seg}` : ""}
          </p>
          {(shown.c2 || shown.c3) && (
            <p className="pp-cls2">
              {shown.c2 && (
                <>
                  <b>{shown.c2}</b> — secondary
                </>
              )}
              {shown.c2 && shown.c3 && " · "}
              {shown.c3 && (
                <>
                  <b>{shown.c3}</b> — tertiary
                </>
              )}
            </p>
          )}
          <div className="pp-rule" />
          {(() => {
            const text = shownDetail?.blurb ?? null;
            return (
              <p className={`pp-blurb${text ? "" : " missing"}`}>
                {text ?? (detailPending ? "…" : "empty. add later")}
              </p>
            );
          })()}
          {shown.n === 0 && shown.kind !== "region" && (
            <p className="pp-norec">No recorded literature yet</p>
          )}
          {shown.n > 0 && (
            <button
              className={`pp-works-toggle${expanded ? " open" : ""}`}
              aria-expanded={expanded}
              onClick={() => {
                setOpenFor(expanded ? null : shown.id);
                if (expanded) setFullFor(null);
              }}
            >
              <span className="car">▸</span>
              <span className="lab">Literature &amp; podcasts</span>
              <span className="n">{shown.n}</span>
            </button>
          )}
          {expanded && (
            <>
              <ul>
                {(full ? works : works.slice(0, 5)).map((w) => (
                  <li key={`${w.type}-${w.slug}`}>
                    <Link href={workHref(w)}>
                      <span className="t">
                        {w.title}{" "}
                        <i>
                          — {w.role}
                          {w.via ? ` · via ${viaLabel(w.via)}` : ""}
                        </i>
                      </span>
                      <span className="k">{w.type === "book" ? "LIBER →" : "VOX →"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {shown.loc ? (
                <Link className="pp-more" href={`/world/${shown.loc}`}>
                  All {shown.n} records →
                </Link>
              ) : (
                !full &&
                works.length > 5 && (
                  <button className="pp-more" onClick={() => setFullFor(shown.id)}>
                    All {shown.n} records →
                  </button>
                )
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
