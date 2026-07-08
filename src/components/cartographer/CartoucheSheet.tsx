"use client";

/**
 * CartoucheSheet — the chart drawer, the cartouche's mobile counterpart.
 * Rendered alongside the desktop cartouche and CSS-gated to ≤900px, where the
 * corner legend has no room: a slim dock pinned to the bottom edge (grip,
 * seek pill, state badges) that expands into a bottom sheet carrying the same
 * vocabulary — SeekPanel, Courses, Overlays and the census filter (children).
 *
 * State flows through the same reducer dispatches as the desktop cartouche;
 * this component only owns "is the sheet open" plus its drag. Picking a seek
 * hit or a course collapses the sheet so the camera flight stays visible.
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
import { COURSES } from "@/lib/map/routes";

import { CourseButtons, OverlayButtons, SectionHead, SeekPanel } from "./Cartouche";

type SectionId = "courses" | "instruments" | "census";

interface CartoucheSheetProps {
  payload: MapPayload;
  courseId: string | null;
  lumen: boolean;
  nihilus: boolean;
  filtered: boolean;
  /** World popup open — the dock steps aside and returns when it closes. */
  suppressed: boolean;
  onPick: (id: string) => void;
  onCourse: (id: string) => void;
  onToggleLumen: () => void;
  onToggleNihilus: () => void;
  /** The census filter block (a second instance of the desktop's Census). */
  children: ReactNode;
}

/** Release thresholds for the grip drag, in px of vertical travel. */
const DRAG_CLOSE = 80;
const DRAG_OPEN = -40;

export default function CartoucheSheet({
  payload,
  courseId,
  lumen,
  nihilus,
  filtered,
  suppressed,
  onPick,
  onCourse,
  onToggleLumen,
  onToggleNihilus,
  children,
}: CartoucheSheetProps) {
  const [open, setOpen] = useState(false);
  const [openSecs, setOpenSecs] = useState<ReadonlySet<SectionId>>(new Set(["census"]));
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
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
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]);

  const pick = (id: string) => {
    setOpen(false);
    onPick(id);
  };
  const pickCourse = (id: string) => {
    setOpen(false);
    onCourse(id);
  };

  const openWithSeek = () => {
    setOpen(true);
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
      // mirrors the CSS cap on .cg-sheet.open: min(72dvh, 100dvh - 88px)
      maxH: Math.min(window.innerHeight * 0.72, window.innerHeight - 88),
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
      setOpen((o) => !o);
      return;
    }
    if (open && dy > DRAG_CLOSE) setOpen(false);
    else if (!open && dy < DRAG_OPEN) setOpen(true);
  };

  const activeCourse = COURSES.find((c) => c.id === courseId) ?? null;
  const instrumentsNote = [lumen && "Lumen", nihilus && "Nihilus"].filter(Boolean).join(" · ");

  return (
    <>
      {open && <div className="cg-sheet-backdrop" onPointerDown={() => setOpen(false)} />}
      <div
        ref={sheetRef}
        className={`cg-sheet${open ? " open" : ""}${suppressed && !open ? " hidden" : ""}`}
        role="dialog"
        aria-label="Chart instruments"
      >
        <button
          type="button"
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
            Scroll for more
          </span>
        </button>

        <div className="cg-sheet-head">
          {open ? (
            <SeekPanel payload={payload} onPick={pick} inputRef={inputRef} />
          ) : (
            <button type="button" className="cg-sheet-pill" onClick={openWithSeek}>
              <span className="ph">Seek a world…</span>
              <span className="go">SEEK</span>
            </button>
          )}
          {!open && (
            <div className="cg-sheet-badges" aria-hidden>
              {filtered && <span>FILTERED</span>}
              {activeCourse && <span>COURSE</span>}
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
            label="Character voyages"
            note={activeCourse ? "active" : null}
            onToggle={() => toggleSec("courses")}
          />
          {openSecs.has("courses") && (
            <div className="c-body">
              <p className="c-hint">trace a character&rsquo;s journey across the chart</p>
              <CourseButtons courseId={courseId} onCourse={pickCourse} />
            </div>
          )}

          <SectionHead
            open={openSecs.has("instruments")}
            label="Overlays"
            note={instrumentsNote || null}
            onToggle={() => toggleSec("instruments")}
          />
          {openSecs.has("instruments") && (
            <div className="c-body">
              <OverlayButtons
                lumen={lumen}
                nihilus={nihilus}
                onToggleLumen={onToggleLumen}
                onToggleNihilus={onToggleNihilus}
              />
            </div>
          )}

          <SectionHead
            open={openSecs.has("census")}
            label="Filter worlds"
            note={filtered ? "filtered" : null}
            onToggle={() => toggleSec("census")}
          />
          {openSecs.has("census") && <div className="c-body">{children}</div>}
        </div>
      </div>
    </>
  );
}
