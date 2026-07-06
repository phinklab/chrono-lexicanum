"use client";

/**
 * Cartouche + Overture (Brief 178, Entscheid 1): "The Cartographer" opens as
 * a large cartouche over the chart and condenses into the corner legend on
 * first interaction. The corner cartouche carries seek, courses, instruments
 * and the census filter (passed in as children).
 * Both surfaces speak the live-site glass language — no border strokes.
 *
 * Seek (178b): live list while typing — every one of the 1054 contacts is in
 * the payload (featured + dust), ranked prefix > substring and recorded >
 * dust. Click or RET selects and flies; arrows move the cursor.
 *
 * Legend rework (178b, Runde 2): the legend sits TOP-left (bottom-left is the
 * media player's dock) and folds into three sections — Courses, Instruments,
 * Census — behind full-width headers; only the census (the primary filter) is
 * open by default. Collapsed sections carry a gold state badge ("active",
 * "filtered", the lit instruments), so nothing active can hide silently.
 */

import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { MapPayload } from "@/lib/map/payload";
import { COURSES } from "@/lib/map/routes";

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

interface SeekHit {
  id: string;
  name: string;
  n: number;
}

/** Render cap for very short queries — the list stays scrollable, the rest
 *  is a "keep typing" line. */
const SEEK_CAP = 160;

type SectionId = "courses" | "instruments" | "census";

interface CartoucheProps {
  payload: MapPayload;
  condensed: boolean;
  courseId: string | null;
  lumen: boolean;
  nihilus: boolean;
  /** Any census filter off default — the collapsed section shows a badge. */
  filtered: boolean;
  /** Select a world by id (flies there) — seek list click/RET. */
  onPick: (id: string) => void;
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
  filtered,
  onPick,
  onCourse,
  onToggleLumen,
  onToggleNihilus,
  children,
}: CartoucheProps) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [focused, setFocused] = useState(false);
  const [openSecs, setOpenSecs] = useState<ReadonlySet<SectionId>>(new Set(["census"]));

  const toggleSec = (id: SectionId) =>
    setOpenSecs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const index = useMemo<SeekHit[]>(() => {
    const arr: SeekHit[] = payload.featured.map((f) => ({ id: f.id, name: f.name, n: f.n }));
    for (const d of payload.dust) arr.push({ id: d[3], name: d[4], n: 0 });
    return arr;
  }, [payload]);

  const q = query.trim().toLowerCase();
  const hits = useMemo(() => {
    if (!q) return [];
    const scored: { hit: SeekHit; rank: number }[] = [];
    for (const hit of index) {
      const n = hit.name.toLowerCase();
      if (!n.includes(q)) continue;
      scored.push({ hit, rank: (n.startsWith(q) ? 0 : 2) + (hit.n > 0 ? 0 : 1) });
    }
    scored.sort((a, b) => a.rank - b.rank || a.hit.name.localeCompare(b.hit.name));
    return scored.map((s) => s.hit);
  }, [index, q]);

  const open = focused && hits.length > 0;
  const cur = Math.max(0, Math.min(cursor, hits.length - 1));

  const pickHit = (hit: SeekHit) => {
    onPick(hit.id);
    setQuery("");
    setCursor(0);
  };

  const activeCourse = COURSES.find((c) => c.id === courseId) ?? null;
  const instrumentsNote = [lumen && "Lumen", nihilus && "Nihilus"].filter(Boolean).join(" · ");

  const secHead = (id: SectionId, label: string, note: string | null) => (
    <button
      className={`c-sec${openSecs.has(id) ? " open" : ""}`}
      aria-expanded={openSecs.has(id)}
      onClick={() => toggleSec(id)}
    >
      <span className="car">▸</span>
      <span className="lab">{label}</span>
      {note ? <span className="note">{note}</span> : null}
    </button>
  );

  return (
    <aside className={`cg-cartouche${condensed ? " on" : ""}`}>
      <div className="c-head">
        <p className="c-title">The Cartographer</p>
      </div>
      <div className="seek">
        <input
          type="text"
          placeholder="Seek a world…"
          spellCheck={false}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setCursor(0);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && hits.length > 0) {
              e.preventDefault();
              setCursor((cur + 1) % hits.length);
            } else if (e.key === "ArrowUp" && hits.length > 0) {
              e.preventDefault();
              setCursor((cur - 1 + hits.length) % hits.length);
            } else if (e.key === "Enter" && hits.length > 0) {
              e.preventDefault();
              pickHit(hits[cur]);
            } else if (e.key === "Escape" && query) {
              // Clear the query only — the global Escape (close popup) must
              // not fire while the seek is being dismissed.
              e.stopPropagation();
              setQuery("");
              setCursor(0);
            }
          }}
        />
        <span className="go">RET</span>
      </div>
      {open && (
        // preventDefault keeps the input focused so the click lands before
        // the list would close on blur.
        <div className="seeklist" onMouseDown={(e) => e.preventDefault()}>
          {hits.slice(0, SEEK_CAP).map((hit, i) => (
            <button
              key={hit.id}
              className={`skitem${i === cur ? " cur" : ""}`}
              ref={i === cur ? (el) => el?.scrollIntoView({ block: "nearest" }) : undefined}
              onClick={() => pickHit(hit)}
            >
              <span className="nm">{hit.name}</span>
              <span className="tag">{hit.n > 0 ? `${hit.n} rec` : "dust"}</span>
            </button>
          ))}
          {hits.length > SEEK_CAP && (
            <p className="skmore">… {fmt(hits.length - SEEK_CAP)} more — keep typing</p>
          )}
        </div>
      )}
      {secHead("courses", "Character voyages", activeCourse ? "active" : null)}
      {openSecs.has("courses") && (
        <div className="c-body">
          <p className="c-hint">trace a character&rsquo;s journey across the chart</p>
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
        </div>
      )}

      {secHead("instruments", "Overlays", instrumentsNote || null)}
      {openSecs.has("instruments") && (
        <div className="c-body">
          <div className="routes">
            <button className={`rt${lumen ? " on" : ""}`} onClick={onToggleLumen}>
              Lumen Astronomican
            </button>
            <button className={`rt${nihilus ? " on" : ""}`} onClick={onToggleNihilus}>
              Imperium Nihilus
            </button>
          </div>
        </div>
      )}

      {secHead("census", "Census", filtered ? "filtered" : null)}
      {openSecs.has("census") && <div className="c-body">{children}</div>}
    </aside>
  );
}
