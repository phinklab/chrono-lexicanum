"use client";

/**
 * Era band — sliding window over all eras with the current one marked.
 * Shows as many stops as fit at a readable size (CSS `--eb-pad` / `--eb-step`
 * drive the geometry, so the cinematic and index variants tune themselves per
 * media query); ‹ › arrows and horizontal drag pan the window. Recenters on
 * the active era whenever it changes; a manual pan survives until the next
 * era change.
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ChronicleEraData } from "@/lib/chronicle/loadTimeline";
import { clamp } from "./shared";

interface EraBandProps {
  className: string;
  eras: ChronicleEraData[];
  activeIdx: number;
  onSelect: (i: number) => void;
  ariaLabel: string;
}

export default function EraBand({
  className,
  eras,
  activeIdx,
  onSelect,
  ariaLabel,
}: EraBandProps) {
  const n = eras.length;
  const bandRef = useRef<HTMLElement>(null);
  const [win, setWin] = useState({ start: 0, W: n });
  const [dragging, setDragging] = useState(false);
  // Manual pan position (arrows / drag); null = follow the active era.
  const panRef = useRef<number | null>(null);
  const drag = useRef({ down: false, moved: false, x0: 0, start0: 0 });

  const measure = useCallback(() => {
    const band = bandRef.current;
    if (!band) return null;
    const cs = getComputedStyle(band);
    const pad = parseFloat(cs.getPropertyValue("--eb-pad")) || 64;
    const step = parseFloat(cs.getPropertyValue("--eb-step")) || 104;
    const usable = Math.max(0, band.clientWidth - pad * 2);
    // min 2 stops (not 3): narrow viewports otherwise force era names to overlap
    const W = Math.min(n, Math.max(2, Math.floor(usable / step) + 1));
    return { usable, W };
  }, [n]);

  const recompute = useCallback(() => {
    const m = measure();
    if (!m) return;
    let start = panRef.current ?? activeIdx - Math.floor(m.W / 2);
    start = clamp(start, 0, n - m.W);
    if (panRef.current != null) panRef.current = start;
    setWin((prev) =>
      prev.start === start && prev.W === m.W ? prev : { start, W: m.W },
    );
  }, [measure, activeIdx, n]);

  // Recenter whenever the active era changes.
  useLayoutEffect(() => {
    panRef.current = null;
    recompute();
  }, [activeIdx, recompute]);

  useEffect(() => {
    const band = bandRef.current;
    if (!band) return;
    const ro = new ResizeObserver(() => recompute());
    ro.observe(band);
    return () => ro.disconnect();
  }, [recompute]);

  const { start, W } = win;
  const end = start + W - 1;
  const posOf = (k: number) =>
    `calc(var(--eb-pad) + (100% - var(--eb-pad) * 2) * ${W > 1 ? k / (W - 1) : 0})`;
  const fillW =
    activeIdx < start ? "0" : activeIdx > end ? "100%" : posOf(activeIdx - start);

  const pan = (to: number) => {
    panRef.current = clamp(to, 0, n - W);
    recompute();
  };

  return (
    <nav
      ref={bandRef}
      className={`era-band ${className}${dragging ? " dragging" : ""}`}
      aria-label={ariaLabel}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        if ((e.target as HTMLElement).closest(".eb-arrow")) return;
        drag.current = { down: true, moved: false, x0: e.clientX, start0: start };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d.down) return;
        const dx = e.clientX - d.x0;
        if (!d.moved) {
          if (Math.abs(dx) < 6) return;
          d.moved = true;
          setDragging(true);
          try {
            bandRef.current?.setPointerCapture(e.pointerId);
          } catch {
            /* capture is best-effort */
          }
        }
        const m = measure();
        if (!m || m.W >= n) return;
        const step = m.usable / Math.max(1, m.W - 1);
        const want = clamp(d.start0 + Math.round(-dx / step), 0, n - m.W);
        if (want !== start) pan(want);
      }}
      onPointerUp={() => {
        drag.current.down = false;
        setDragging(false);
        setTimeout(() => {
          drag.current.moved = false;
        }, 0);
      }}
      onPointerCancel={() => {
        drag.current.down = false;
        setDragging(false);
        setTimeout(() => {
          drag.current.moved = false;
        }, 0);
      }}
      onClickCapture={(e) => {
        // a drag should never fire the stop's click
        if (drag.current.moved) {
          e.stopPropagation();
          e.preventDefault();
        }
      }}
    >
      <div className="eb-line" />
      <div className="eb-fill" style={{ width: fillW }} />
      {eras.slice(start, end + 1).map((er, k) => {
        const i = start + k;
        return (
          <button
            key={er.id}
            type="button"
            className={`eb-stop${i === activeIdx ? " on" : i < activeIdx ? " past" : ""}`}
            style={{ left: posOf(k) }}
            title={`${er.m} · ${er.name}`}
            aria-label={`Go to era: ${er.name}`}
            onClick={() => onSelect(i)}
          >
            <span className="eb-mark" />
            <span className="eb-n">{er.short}</span>
            <span className="eb-m">{er.m}</span>
          </button>
        );
      })}
      {W < n &&
        [-1, 1].map((dir) => (
          <button
            key={dir}
            type="button"
            className={`eb-arrow ${dir < 0 ? "left" : "right"}`}
            aria-label={dir < 0 ? "Earlier eras" : "Later eras"}
            disabled={dir < 0 ? start === 0 : end === n - 1}
            onClick={() => pan(start + dir)}
          >
            {dir < 0 ? "‹" : "›"}
          </button>
        ))}
    </nav>
  );
}
