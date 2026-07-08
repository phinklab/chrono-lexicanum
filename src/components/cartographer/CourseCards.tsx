"use client";

/**
 * CourseCards — one cinematic act card per course station,
 * timed with the leg choreography; stations closer than 26 grid units
 * cluster into ONE card with a pager (Istvaan III/V). Cards live in the
 * live-site glass surface and follow pan/zoom imperatively.
 *
 * ≤900px the pin-anchored cards collapse into ONE bottom-docked card whose
 * pager walks the acts in station order and flies the camera to each act —
 * the course becomes a guided voyage instead of a scattered read.
 *
 * Mount keyed by course id (parent) — switching courses restarts timing.
 */

import { useEffect, useMemo, useRef, useState } from "react";

import type { Course } from "@/lib/map/routes";
import type { FeaturedWorld } from "@/lib/map/payload";
import { useMediaQuery } from "@/lib/useMediaQuery";
import type { ChartBus } from "./chart-bus";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];

interface Act {
  name: string;
  text: string;
  i: number;
  gx: number;
  gy: number;
}

interface Cluster {
  gx: number;
  gy: number;
  acts: Act[];
}

interface CourseCardsProps {
  course: Course;
  featured: FeaturedWorld[];
  bus: ChartBus;
  reduce: boolean;
  /** World popup open — cards step aside and return when it closes. */
  suppressed: boolean;
}

export default function CourseCards({ course, featured, bus, reduce, suppressed }: CourseCardsProps) {
  const clusters = useMemo<Cluster[]>(() => {
    const byName = new Map(featured.map((f) => [f.name, f]));
    const out: Cluster[] = [];
    course.stations.forEach((name, i) => {
      const w = byName.get(name);
      if (!w) return;
      const act: Act = { name, text: course.acts[i] ?? "", i, gx: w.gx, gy: w.gy };
      const hit = out.find((c) => Math.hypot(c.gx - w.gx, c.gy - w.gy) < 26);
      if (hit) hit.acts.push(act);
      else out.push({ gx: w.gx, gy: w.gy, acts: [act] });
    });
    return out;
  }, [course, featured]);

  const narrow = useMediaQuery("(max-width: 900px)");
  const flatActs = useMemo(
    () => clusters.flatMap((cl) => cl.acts).sort((a, b) => a.i - b.i),
    [clusters],
  );
  const [voyageIdx, setVoyageIdx] = useState(0);

  const [visible, setVisible] = useState<ReadonlySet<number>>(new Set());
  const [pages, setPages] = useState<number[]>(() => clusters.map(() => 0));
  const els = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (narrow) return;
    const timers = clusters.map((cl, i) =>
      setTimeout(
        () => setVisible((v) => new Set(v).add(i)),
        reduce ? 0 : cl.acts[0].i * 1450 + 950,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [clusters, reduce, narrow]);

  useEffect(() => {
    if (narrow) return;
    const place = () => {
      const driver = bus.driver;
      if (!driver) return;
      clusters.forEach((cl, i) => {
        const el = els.current[i];
        if (!el) return;
        const p = driver.worldToScreen(cl.gx, cl.gy);
        const cw = el.offsetWidth || 296;
        const ch = el.offsetHeight || 84;
        let px = p.x + 24;
        if (px + cw > window.innerWidth - 12) px = p.x - 24 - cw;
        const py = Math.max(12, Math.min(window.innerHeight - ch - 12, p.y - ch / 2));
        el.style.left = `${px}px`;
        el.style.top = `${py}px`;
      });
    };
    place();
    return bus.onFrame(place);
  }, [bus, clusters, narrow]);

  // Guided voyage — fly to the active act's station whenever it changes.
  useEffect(() => {
    if (!narrow) return;
    const act = flatActs[voyageIdx];
    const driver = bus.driver;
    if (!act || !driver) return;
    bus.flyTo(
      act.gx,
      act.gy,
      Math.max(driver.getK(), driver.getK0() * 2.4),
      reduce ? 0 : 900,
    );
  }, [narrow, voyageIdx, flatActs, bus, reduce]);

  if (narrow) {
    const act = flatActs[voyageIdx];
    if (!act) return null;
    return (
      <div aria-hidden>
        <div className={`cg-ccard cg-ccard--dock show${suppressed ? " hide" : ""}`}>
          <p className="ck">
            ACT {ROMAN[act.i] ?? act.i + 1} · {act.name.toUpperCase()}
          </p>
          <p className="ct">{act.text}</p>
          {flatActs.length > 1 && (
            <button
              className="cpg"
              onClick={() => setVoyageIdx((v) => (v + 1) % flatActs.length)}
            >
              {voyageIdx + 1} / {flatActs.length} · NEXT →
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div aria-hidden>
      {clusters.map((cl, i) => {
        const act = cl.acts[pages[i] % cl.acts.length];
        return (
          <div
            key={i}
            ref={(el) => {
              els.current[i] = el;
            }}
            className={`cg-ccard${visible.has(i) ? " show" : ""}${suppressed ? " hide" : ""}`}
          >
            <p className="ck">
              ACT {ROMAN[act.i] ?? act.i + 1} · {act.name.toUpperCase()}
            </p>
            <p className="ct">{act.text}</p>
            {cl.acts.length > 1 && (
              <button
                className="cpg"
                onClick={() =>
                  setPages((p) => p.map((v, j) => (j === i ? (v + 1) % cl.acts.length : v)))
                }
              >
                {(pages[i] % cl.acts.length) + 1} / {cl.acts.length} · NEXT →
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
