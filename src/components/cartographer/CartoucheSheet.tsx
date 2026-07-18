"use client";

/**
 * CartoucheSheet — the chart drawer, the cartouche's mobile counterpart.
 * Rendered alongside the desktop cartouche and CSS-gated to ≤900px, where the
 * corner legend has no room: a slim dock pinned to the bottom edge (grip,
 * seek pill, state badges) that expands into a bottom sheet carrying the same
 * vocabulary — SeekPanel, Courses, Overlays and the census filter (children).
 *
 * State flows through the same reducer dispatches as the desktop cartouche;
 * "is the sheet open" lives in the root (the phone back-guard needs to close
 * it), this component owns only the drag. Picking a seek hit or a course
 * collapses the sheet so the camera flight stays visible.
 *
 * Drag: a small Pointer-Events follow on the grip with a distance threshold
 * on release — from open the sheet follows via transform; from closed the
 * sheet's HEIGHT follows the finger (class `dragging` reveals the body), so
 * the panel content genuinely rises from the bottom edge instead of the dock
 * bar just sliding up over the chart. Deliberately not a scroll-snap sheet,
 * which would fight the census's inner scrolling and the chart's
 * touch-action:none.
 */

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import type { MapPayload } from "@/lib/map/payload";

import { InstrumentButtons, SectionHead, SeekPanel, VoyageButtons, WorldIndex, instrumentsNote } from "./Cartouche";
import type { InstrumentProps, SectionId } from "./Cartouche";

interface CartoucheSheetProps extends InstrumentProps {
  payload: MapPayload;
  voyageId: string | null;
  /** Journeys-section badge — "touring 3/9" during a tour, "active" after. */
  voyageNote: string | null;
  filtered: boolean;
  /** World popup open — the dock steps aside and returns when it closes. */
  suppressed: boolean;
  /** Overture veil still up — the dock is invisible behind it and must not
   *  be a hidden tab stop. */
  veiled: boolean;
  /** Sheet expanded — owned by the root so the back-guard can dismiss it. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (id: string) => void;
  onVoyage: (id: string) => void;
  /** The census filter block (a second instance of the desktop's Census). */
  children: ReactNode;
}

/** Release thresholds for the grip drag, in px of vertical travel. */
const DRAG_CLOSE = 80;
const DRAG_OPEN = -40;

export default function CartoucheSheet(props: CartoucheSheetProps) {
  const {
    payload,
    voyageId,
    voyageNote,
    lumen,
    nihilus,
    filtered,
    suppressed,
    veiled,
    open,
    onOpenChange,
    onPick,
    onVoyage,
    children,
  } = props;
  // Phones open on the four-section overview; the desktop cartouche keeps
  // its primary census section open by default.
  const [openSecs, setOpenSecs] = useState<ReadonlySet<SectionId>>(new Set());
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const gripRef = useRef<HTMLButtonElement | null>(null);
  const dragRef = useRef<{
    id: number;
    y0: number;
    moved: boolean;
    closedH: number;
    maxH: number;
  } | null>(null);

  const toggleSec = (id: SectionId) =>
    setOpenSecs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Escape closes the sheet before the root's Escape closes the world popup.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onOpenChange]);

  // Modal focus model: when the sheet closes and focus died with the
  // unmounted head (seek input) or sat behind the backdrop, return it to
  // the grip. Never fires on mount (wasOpen guard).
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      return;
    }
    if (!wasOpen.current) return;
    const a = document.activeElement;
    if (a === document.body || (a && sheetRef.current?.contains(a))) {
      gripRef.current?.focus();
    }
  }, [open]);

  const pick = (id: string) => {
    onOpenChange(false);
    onPick(id);
  };
  const pickVoyage = (id: string) => {
    onOpenChange(false);
    onVoyage(id);
  };

  const openWithSeek = () => {
    onOpenChange(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  // Grip drag — follow the finger while down, snap by travel on release.
  const onGripDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    const el = sheetRef.current;
    dragRef.current = {
      id: e.pointerId,
      y0: e.clientY,
      moved: false,
      closedH: el?.offsetHeight ?? 0,
      // mirrors the CSS cap on .cg-sheet.open: min(60dvh, 100dvh - 88px)
      maxH: Math.min(window.innerHeight * 0.6, window.innerHeight - 88),
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onGripMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    const el = sheetRef.current;
    if (!drag || drag.id !== e.pointerId || !el) return;
    const dy = e.clientY - drag.y0;
    if (Math.abs(dy) > 4) drag.moved = true;
    el.style.transition = "none";
    if (open) {
      // From open: the whole sheet follows down.
      el.style.transform = `translateY(${Math.max(0, dy)}px)`;
      return;
    }
    // From the dock: grow the sheet's height so the body content genuinely
    // rises from the bottom edge. `dragging` reveals the (inert) body —
    // classList on purpose, no re-render per move; `open` flips on release.
    el.classList.add("dragging");
    el.style.height = `${Math.min(drag.maxH, drag.closedH + Math.max(0, -dy))}px`;
  };
  const onGripUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    const el = sheetRef.current;
    dragRef.current = null;
    if (!drag || !el) return;
    const dy = e.clientY - drag.y0;
    el.style.transition = "";
    el.style.transform = "";
    el.style.height = "";
    el.classList.remove("dragging");
    if (!drag.moved) {
      onOpenChange(!open);
      return;
    }
    if (open && dy > DRAG_CLOSE) onOpenChange(false);
    else if (!open && dy < DRAG_OPEN) onOpenChange(true);
  };

  return (
    <>
      {open && <div className="cg-sheet-backdrop" onPointerDown={() => onOpenChange(false)} />}
      {/* Deliberately MODAL while open (S10a): the backdrop already blocks
          pointers; aria-modal + the root's inert on chart/zoomer/panel make
          the same statement to AT. Closed, the dock is a plain toolbar. */}
      <div
        ref={sheetRef}
        className={`cg-sheet${open ? " open" : ""}${suppressed && !open ? " hidden" : ""}`}
        role="dialog"
        aria-modal={open || undefined}
        aria-label="Chart instruments"
        // veiled: invisible behind the overture; suppressed && !open: the
        // dock is translated offscreen while the world panel is up — both
        // states must not leave hidden tab stops.
        inert={veiled || (suppressed && !open)}
      >
        <button
          type="button"
          ref={gripRef}
          className="cg-sheet-grip"
          aria-label={open ? "Close chart instruments" : "Open chart instruments"}
          aria-expanded={open}
          onPointerDown={onGripDown}
          onPointerMove={onGripMove}
          onPointerUp={onGripUp}
          onPointerCancel={onGripUp}
        >
          <span className="bar" aria-hidden />
          {/* Closed-dock affordance: the bare bar alone doesn't read as
              "pull me up" — the label disappears once the sheet is open. */}
          <span className="glab" aria-hidden>
            Drag for more
          </span>
        </button>

        <div className="cg-sheet-head">
          {open ? (
            <SeekPanel payload={payload} onPick={pick} inputRef={inputRef} />
          ) : (
            <button type="button" className="cg-sheet-pill" onClick={openWithSeek}>
              <span className="ph">Seek a world…</span>
            </button>
          )}
          {!open && (
            <div className="cg-sheet-badges" aria-hidden>
              {filtered && <span>FILTERED</span>}
              {voyageId && <span>JOURNEY</span>}
              {lumen && <span>LVMEN</span>}
              {nihilus && <span>NIHILVS</span>}
            </div>
          )}
        </div>

        {/* Always in the DOM (CSS hides it while closed & not dragging) so a
            grip drag can reveal it progressively; inert until actually open. */}
        <div className="cg-sheet-body" inert={!open}>
          <SectionHead
            open={openSecs.has("courses")}
            label="Great Journeys"
            note={voyageNote}
            onToggle={() => toggleSec("courses")}
          />
          {openSecs.has("courses") && (
            <div className="c-body">
              <p className="c-hint">charted routes and curated chronologies across the galaxy</p>
              <VoyageButtons voyageId={voyageId} onVoyage={pickVoyage} />
            </div>
          )}

          <SectionHead
            open={openSecs.has("instruments")}
            label="Instruments"
            note={instrumentsNote(props)}
            onToggle={() => toggleSec("instruments")}
          />
          {openSecs.has("instruments") && (
            <div className="c-body">
              <InstrumentButtons {...props} />
            </div>
          )}

          <SectionHead
            open={openSecs.has("census")}
            label="Filter worlds"
            note={filtered ? "filtered" : null}
            onToggle={() => toggleSec("census")}
          />
          {openSecs.has("census") && <div className="c-body">{children}</div>}

          <SectionHead
            open={openSecs.has("index")}
            label="World index"
            note={null}
            onToggle={() => toggleSec("index")}
          />
          {openSecs.has("index") && (
            <div className="c-body">
              <WorldIndex payload={payload} onPick={pick} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
