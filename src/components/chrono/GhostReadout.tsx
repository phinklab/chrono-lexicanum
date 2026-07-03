"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * GhostReadout — the vox scribe, fixed top-right (styled in 46-site-nav.css).
 * Up to three mono lines with a brightness ramp; each line writes itself
 * character by character (every glyph fades in), the caret is a 1px gold
 * stroke, finished lines rest, the oldest rises and fades out. Lines are
 * treated as stable; callers remount via key to change them. Hidden entirely
 * under prefers-reduced-motion.
 */

type VoxLine = { id: number; text: string; typed: number; out: boolean };

const RAMP = [0.16, 0.3, 0.55];
const MAX_LINES = 3;

export default function GhostReadout({ lines }: { lines: string[] }) {
  const reduced = useReducedMotion();
  const [items, setItems] = useState<VoxLine[]>([]);

  useEffect(() => {
    if (reduced || !lines.length) return;
    let disposed = false;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const later = (fn: () => void, ms: number) => {
      const t = setTimeout(() => {
        timers.delete(t);
        if (!disposed) fn();
      }, ms);
      timers.add(t);
    };

    let idx = 0;
    let nextId = 1;
    const addLine = () => {
      const text = lines[idx % lines.length];
      idx += 1;
      const id = nextId;
      nextId += 1;
      setItems((prev) => {
        const next = [...prev, { id, text, typed: 0, out: false }];
        const stable = next.filter((l) => !l.out);
        if (stable.length <= MAX_LINES) return next;
        const oldest = stable[0];
        later(() => setItems((p) => p.filter((l) => l.id !== oldest.id)), 1200);
        return next.map((l) => (l.id === oldest.id ? { ...l, out: true } : l));
      });
      const typeNext = (n: number) => {
        if (n > text.length) {
          later(addLine, 3600);
          return;
        }
        setItems((prev) => prev.map((l) => (l.id === id ? { ...l, typed: n } : l)));
        later(() => typeNext(n + 1), 34 + (n % 3) * 14);
      };
      later(() => typeNext(1), 400);
    };

    later(addLine, 1600);
    return () => {
      disposed = true;
      timers.forEach(clearTimeout);
      setItems([]);
    };
  }, [lines, reduced]);

  if (reduced) return null;

  const stable = items.filter((l) => !l.out);
  const newestId = stable.length ? stable[stable.length - 1].id : null;

  return (
    <div className="site-vox" aria-hidden>
      {items.map((l) => {
        const si = stable.findIndex((s) => s.id === l.id);
        const opacity = si === -1 ? 0 : RAMP[RAMP.length - stable.length + si];
        return (
          <div
            key={l.id}
            className={`site-vox__line${l.out ? " is-out" : ""}`}
            style={{ opacity }}
          >
            {Array.from(l.text.slice(0, l.typed)).map((ch, i) => (
              <span key={i} className="site-vox__ch">
                {ch}
              </span>
            ))}
            {l.id === newestId && <span className="site-vox__caret" />}
          </div>
        );
      })}
    </div>
  );
}
