"use client";

/**
 * Cartouche + Overture (Brief 178, Entscheid 1): "The Cartographer" opens as
 * a large cartouche over the chart and condenses into the corner legend on
 * first interaction. The corner cartouche carries seek, segmentum jumps,
 * courses, instruments and the census filter (passed in as children).
 * Both surfaces speak the live-site glass language — no border strokes.
 */

import { useState } from "react";
import type { ReactNode } from "react";

import type { MapPayload } from "@/lib/map/payload";
import { COURSES } from "@/lib/map/routes";
import { SEGS, type SegmentumMark } from "./chart-geometry";

/** 1054 → "1 054" (the studies' chart-figure style). */
export function fmt(n: number): string {
  return n.toLocaleString("en-US").replace(/,/g, " ");
}

export function Overture({ condensed, payload }: { condensed: boolean; payload: MapPayload }) {
  return (
    <section className={`cg-overture${condensed ? " off" : ""}`} aria-hidden={condensed}>
      <p className="over">Chartae Imperialis · Maledictum</p>
      <h1>
        The <em>Cartographer</em>
      </h1>
      <p className="edition">
        <b>{fmt(payload.contacts)} worlds</b> upon the chart · {fmt(payload.coverage.placed)} of{" "}
        {fmt(payload.coverage.total)} records placed
      </p>
      <p className="hint">
        <span className="dot">●</span>&ensp;drag to survey · scroll to magnify · click a world
      </p>
    </section>
  );
}

interface CartoucheProps {
  payload: MapPayload;
  condensed: boolean;
  courseId: string | null;
  lumen: boolean;
  nihilus: boolean;
  onSeek: (query: string) => void;
  onJump: (seg: SegmentumMark) => void;
  onCourse: (id: string) => void;
  onToggleLumen: () => void;
  onToggleNihilus: () => void;
  /** The census filter block. */
  children: ReactNode;
}

export function Cartouche({
  payload,
  condensed,
  courseId,
  lumen,
  nihilus,
  onSeek,
  onJump,
  onCourse,
  onToggleLumen,
  onToggleNihilus,
  children,
}: CartoucheProps) {
  const [query, setQuery] = useState("");

  return (
    <aside className={`cg-cartouche${condensed ? " on" : ""}`}>
      <div className="c-head">
        <p className="c-title">The Cartographer</p>
        <p className="c-status">
          <span className="live">●</span> AUSPEX
        </p>
      </div>
      <p className="c-census">
        {fmt(payload.contacts)} contacts · {fmt(payload.recorded)} recorded
      </p>
      <div className="seek">
        <input
          type="text"
          placeholder="Seek a world…"
          spellCheck={false}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim()) onSeek(query.trim());
          }}
        />
        <span className="go">RET</span>
      </div>
      <p className="c-cap">Segmenta</p>
      <div className="segrow">
        {SEGS.map((seg) => (
          <button key={seg.name} onClick={() => onJump(seg)}>
            {seg.name.replace("Segmentum ", "").replace(" Segmentum", "")}
          </button>
        ))}
      </div>
      <p className="c-cap">Courses · toggle to trace</p>
      <div className="routes">
        {COURSES.map((course) => (
          <button
            key={course.id}
            className={`rt${courseId === course.id ? " on" : ""}`}
            onClick={() => onCourse(course.id)}
          >
            {course.name}
            <span className="rt-tag">{course.tag}</span>
          </button>
        ))}
      </div>
      <p className="c-cap">Instruments of the chart</p>
      <div className="routes">
        <button className={`rt${lumen ? " on" : ""}`} onClick={onToggleLumen}>
          Lumen Astronomican<span className="rt-tag">PSYKANA</span>
        </button>
        <button className={`rt${nihilus ? " on" : ""}`} onClick={onToggleNihilus}>
          Imperium Nihilus<span className="rt-tag">M42</span>
        </button>
      </div>
      <p className="c-cap">Census · filter the classifications</p>
      {children}
      <p className="c-foot">
        {fmt(payload.coverage.placed)} / {fmt(payload.coverage.total)} records placed
      </p>
    </aside>
  );
}
