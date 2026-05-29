"use client";

/**
 * ChronicleClient — the live Chronicle shell, ported from the prototype's
 * `app.jsx`. The shell now mirrors the /buecher + /ask scroll rhythm: a 60vh
 * hero (eyebrow + heading + italic sub) sits over the chronicle-hall photo with
 * its title at the same y as the other surfaces, then a scrollable
 * `.chronicle-body` — pulled up to overlap the fading hero foot — carries the
 * timeline stage and the zoom-model + book-layout toggles. A scroll-driven void
 * scrim (`.chronicle-scrim`) fades the fixed photo to near-void as the reader
 * scrolls into the stage, exactly like the catalogue's ScrollScrim. This
 * component owns the hover-tooltip state and the TLPCtx event bus. The active
 * era is URL-driven (`?era=`) so it's shareable; the view-mode toggles are
 * client-only state.
 *
 * Data flow: the server page passes the full book set (for the ribbon + every
 * accordion band) plus, when an era is open in the zoom model, that era's
 * server-filtered books and FilterRail option lists. Opening a book pushes
 * `?book=` (the server page renders <DetailPanel> from that param); this
 * component never renders the panel itself.
 *
 * The prototype's "scope" toggle (30th–31st focus) and `/total` denominator
 * are dropped per the port brief.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  buildLabSegments,
  type Era,
  type FilterOption,
  type SeriesRef,
  type TimelineBook,
} from "@/lib/timeline";
import { buildBookUrl, buildEraUrl } from "@/lib/timelineUrl";
import FilterRail from "@/components/timeline/FilterRail";
import { TLPCtx, type ChronicleCtx } from "./context";
import BookTooltip, { type TipData } from "./BookTooltip";
import ZoomInShell from "./ZoomInShell";
import AccordionShell from "./AccordionShell";

type ZoomModel = "zoom" | "accordion";
type LayoutMode = "lanes" | "sequence";

interface FilterData {
  availableFactions: FilterOption[];
  availableLengthTiers: FilterOption[];
  totalInEra: number;
  matchedCount: number;
}

interface ChronicleClientProps {
  eras: Era[];
  /** Full book set (every kind='book' work). Drives ribbon pins + accordion. */
  books: TimelineBook[];
  seriesById: Record<string, SeriesRef>;
  /** Open era id from `?era=`, or null for the overview. */
  activeEraId: string | null;
  /** Server-filtered books for the active era (zoom model), or null. */
  segBooks: TimelineBook[] | null;
  /** FilterRail payload for the active era, or null. */
  filter: FilterData | null;
}

export default function ChronicleClient({
  eras,
  books,
  seriesById,
  activeEraId,
  segBooks,
  filter,
}: ChronicleClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [zoomModel, setZoomModel] = useState<ZoomModel>("zoom");
  const [layout, setLayout] = useState<LayoutMode>("lanes");
  const [tip, setTip] = useState<TipData | null>(null);

  const segments = useMemo(() => buildLabSegments(eras), [eras]);

  const bySegment = useMemo(() => {
    const map: Record<string, TimelineBook[]> = {};
    for (const seg of segments) map[seg.id] = [];
    for (const b of books) {
      (map[b.primaryEraId] ??= []).push(b);
    }
    for (const id of Object.keys(map)) {
      map[id].sort((a, b) => a.startY - b.startY || a.title.localeCompare(b.title));
    }
    return map;
  }, [segments, books]);

  const activeSeg = useMemo(
    () => (activeEraId ? segments.find((s) => s.id === activeEraId) ?? null : null),
    [segments, activeEraId],
  );
  const rawEra = useMemo(
    () => (activeEraId ? eras.find((e) => e.id === activeEraId) ?? null : null),
    [eras, activeEraId],
  );

  // Books for the open segment: prefer the server-filtered set; fall back to
  // the full client grouping for the transition frame / direct loads.
  const segBooksForView = useMemo(
    () => segBooks ?? (activeEraId ? bySegment[activeEraId] ?? [] : []),
    [segBooks, activeEraId, bySegment],
  );

  const ctx = useMemo<ChronicleCtx>(
    () => ({
      onHover: (book, x, y) => setTip({ book, x, y }),
      onLeave: () => setTip(null),
      onOpen: (book) => {
        setTip(null);
        // scroll:false — opening a book pushes ?book= but the reader is already
        // scrolled into the timeline; Next's default scroll-to-top would yank the
        // page up before the (fixed) DetailPanel even mounts. Keep them anchored.
        router.push(
          buildBookUrl(book.primaryEraId, book.slug, new URLSearchParams(searchParams.toString())),
          { scroll: false },
        );
      },
    }),
    [router, searchParams],
  );

  // Scroll-driven void scrim: the fixed chronicle-hall photo stays bright behind
  // the hero, then fades to near-void as the reader scrolls into the timeline
  // stage so the ribbon ticks / faint cyan lanes stay legible. Mirrors the
  // /buecher ScrollScrim — opacity is written to a CSS var in an effect only
  // (never during render), so SSR paints a transparent scrim with no dark flash.
  const scrimRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrimRef.current;
    if (!el) return;

    // Reach full darkness by ~0.6 of the hero height — i.e. once the title has
    // mostly scrolled away and the timeline becomes the focus, the photo is gone.
    let denom = 1;
    function measure() {
      const hero = document.querySelector<HTMLElement>(".chronicle-hero");
      const h = hero?.offsetHeight ?? window.innerHeight * 0.6;
      denom = Math.max(h * 0.6, 1);
    }

    let frame = 0;
    function apply() {
      frame = 0;
      const target = el;
      if (!target) return;
      // Ramp to near-full void (0.985) so the ribbon/lanes read against black once
      // scrolled into the timeline, not over a faint photo bleed.
      const progress = Math.min(window.scrollY / denom, 1);
      target.style.setProperty("--chronicle-scrim-opacity", String(progress * 0.985));
    }
    function onScroll() {
      if (frame) return;
      frame = requestAnimationFrame(apply);
    }
    function onResize() {
      measure();
      apply();
    }

    measure();
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // scroll:false on every same-route push — descending into a segment, returning
  // to the overview, and opening a book are all in-place transitions inside the
  // already-scrolled timeline stage. Next.js scrolls to top on push by default,
  // which jerked the reader back up to the hero on each click; keep their place.
  function pickEra(seg: { id: string }) {
    router.push(buildEraUrl(seg.id, new URLSearchParams(searchParams.toString())), {
      scroll: false,
    });
  }
  function backToOverview() {
    router.push("/timeline", { scroll: false });
  }

  const filterRail =
    rawEra && filter ? (
      <FilterRail
        era={rawEra}
        availableFactions={filter.availableFactions}
        availableLengthTiers={filter.availableLengthTiers}
        totalInEra={filter.totalInEra}
        matchedCount={filter.matchedCount}
      />
    ) : undefined;

  return (
    <TLPCtx.Provider value={ctx}>
      <div className="chronicle-scrim" aria-hidden ref={scrimRef} />

      <div className="tlp-bg" aria-hidden>
        <div className="tlp-stars" />
        <div className="tlp-stars2" />
        <div className="tlp-grain" />
      </div>

      <div className="tlp-root">
        <header className="chronicle-hero">
          <div className="chronicle-hero__title">
            <div className="chronicle-hero__eyebrow">{"// CHRONICA · IMPERIALIS"}</div>
            <h1 className="chronicle-hero__heading">CHRONICLE</h1>
            <p className="chronicle-hero__sub">
              The history of the Imperium, charted · {books.length}{" "}
              {books.length === 1 ? "book" : "books"}
            </p>
          </div>
        </header>

        <div className="chronicle-body">
          <div className="tlp-stage">
            {zoomModel === "accordion" ? (
              <AccordionShell
                segments={segments}
                bySegment={bySegment}
                seriesById={seriesById}
                layout={layout}
              />
            ) : (
              <ZoomInShell
                segments={segments}
                bySegment={bySegment}
                activeSeg={activeSeg}
                segBooks={segBooksForView}
                seriesById={seriesById}
                layout={layout}
                onPick={pickEra}
                onBack={backToOverview}
                filterRail={filterRail}
              />
            )}
          </div>

          <div
            className="chronicle-controls"
            role="group"
            aria-label="Timeline view controls"
          >
            <Seg
              label="View"
              value={zoomModel}
              onChange={setZoomModel}
              options={[
                { v: "zoom", t: "Zoom" },
                { v: "accordion", t: "Accordion" },
              ]}
            />
            <Seg
              label="Layout"
              value={layout}
              onChange={setLayout}
              options={[
                { v: "lanes", t: "By series" },
                { v: "sequence", t: "Reading order" },
              ]}
            />
          </div>
        </div>
      </div>

      <BookTooltip data={tip} />
    </TLPCtx.Provider>
  );
}

interface SegProps<T extends string> {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: ReadonlyArray<{ v: T; t: string }>;
}

function Seg<T extends string>({ label, value, onChange, options }: SegProps<T>) {
  return (
    <div className="tlp-group">
      <div className="tlp-group-label">{label}</div>
      <div className="tlp-seg" role="group" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            className={`tlp-seg-btn${value === o.v ? " is-active" : ""}`}
            aria-pressed={value === o.v}
            onClick={() => onChange(o.v)}
          >
            {o.t}
          </button>
        ))}
      </div>
    </div>
  );
}
