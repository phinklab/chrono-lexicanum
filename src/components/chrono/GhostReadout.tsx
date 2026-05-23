"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

type GhostReadoutProps = {
  lines: string[];
  lineMs?: number;
  color?: string;
  opacity?: number;
  align?: CSSProperties["textAlign"];
  max?: number;
  typeSpeed?: number;
};

type Item = { id: number; text: string; exiting: boolean };

function GhostTypeOnce({
  text,
  speed = 30,
  showCursorWhenDone = false,
  reduced,
}: {
  text: string;
  speed?: number;
  showCursorWhenDone?: boolean;
  reduced: boolean;
}) {
  const [n, setN] = useState(reduced ? text.length : 0);

  // Parents key this component by item.id so text never changes mid-mount;
  // we only schedule the interval here and never reset state from an effect.
  useEffect(() => {
    if (reduced || !text) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setN(i);
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, reduced]);

  const done = n >= text.length;
  const showCursor = !done || showCursorWhenDone;
  return (
    <span>
      {text.slice(0, n)}
      {showCursor && (
        <span
          style={{
            display: "inline-block",
            marginLeft: 2,
            animation: "chronoCursor 2.2s steps(1) infinite",
          }}
        >
          ▌
        </span>
      )}
    </span>
  );
}

function GhostRow({
  it,
  exiting,
  opacityTarget,
  typeSpeed,
  isNewest,
  reduced,
  lineHeight = 20,
}: {
  it: Item;
  exiting: boolean;
  opacityTarget: number;
  typeSpeed: number;
  isNewest: boolean;
  reduced: boolean;
  lineHeight?: number;
}) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const phase: "enter" | "in" | "exit" = exiting ? "exit" : entered ? "in" : "enter";

  const base: CSSProperties = {
    overflow: "hidden",
    transition:
      "opacity 1.8s ease, transform 1.8s ease, max-height 1.6s ease, margin-top 1.6s ease",
    willChange: "opacity, transform, max-height",
  };
  const style: CSSProperties =
    phase === "enter"
      ? { ...base, opacity: 0, transform: "translateY(8px)", maxHeight: lineHeight }
      : phase === "in"
        ? {
            ...base,
            opacity: opacityTarget,
            transform: "translateY(0)",
            maxHeight: lineHeight,
          }
        : {
            ...base,
            opacity: 0,
            transform: "translateY(-14px)",
            maxHeight: 0,
            marginTop: -4,
          };

  return (
    <div style={style}>
      <GhostTypeOnce
        text={it.text}
        speed={typeSpeed}
        showCursorWhenDone={isNewest && !exiting}
        reduced={reduced}
      />
    </div>
  );
}

export default function GhostReadout({
  lines,
  lineMs = 2400,
  color = "var(--cl-gold)",
  opacity = 0.45,
  align = "right",
  max = 5,
  typeSpeed = 30,
}: GhostReadoutProps) {
  const reduced = useReducedMotion();

  const initialItems = useMemo<Item[]>(() => {
    if (!lines.length) return [];
    if (reduced) {
      const tail = lines.slice(0, Math.min(max, lines.length));
      return tail.map((text, i) => ({ id: i + 1, text, exiting: false }));
    }
    return [{ id: 1, text: lines[0], exiting: false }];
  }, [lines, max, reduced]);

  const [items, setItems] = useState<Item[]>(initialItems);
  const idxRef = useRef(reduced ? 0 : 1);
  const idRef = useRef(initialItems.length);
  const scheduledRef = useRef<Set<number>>(new Set());
  const EXIT_MS = 1700;

  // Lines is treated as stable; if it changes, callers should remount via key.
  useEffect(() => {
    if (reduced || !lines.length) return;
    const tick = () => {
      const text = lines[idxRef.current % lines.length];
      idxRef.current++;
      idRef.current++;
      const newItem: Item = { id: idRef.current, text, exiting: false };
      setItems((prev) => {
        const next = [...prev, newItem];
        const stableCount = next.filter((it) => !it.exiting).length;
        if (stableCount > max) {
          const i = next.findIndex((it) => !it.exiting);
          if (i !== -1) next[i] = { ...next[i], exiting: true };
        }
        return next;
      });
    };
    const id = setInterval(tick, lineMs);
    return () => clearInterval(id);
  }, [lines, lineMs, max, reduced]);

  useEffect(() => {
    items.forEach((it) => {
      if (it.exiting && !scheduledRef.current.has(it.id)) {
        scheduledRef.current.add(it.id);
        setTimeout(() => {
          setItems((prev) => prev.filter((p) => p.id !== it.id));
        }, EXIT_MS);
      }
    });
  }, [items]);

  const stable = items.filter((it) => !it.exiting);
  const newestId = stable.length ? stable[stable.length - 1].id : null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        textAlign: align,
        fontFamily: "var(--font-plex-mono)",
        fontSize: 10.5,
        lineHeight: 1.55,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color,
        pointerEvents: "none",
        textShadow: "0 1px 4px rgba(0,0,0,0.9)",
      }}
    >
      {items.map((it) => {
        const stableIndex = stable.findIndex((s) => s.id === it.id);
        const fromBottom = stableIndex === -1 ? max : stable.length - 1 - stableIndex;
        const ramp = Math.max(0, 1 - fromBottom * (1 / (max - 0.5)));
        const opacityTarget = opacity * ramp;
        return (
          <GhostRow
            key={it.id}
            it={it}
            exiting={it.exiting}
            opacityTarget={opacityTarget}
            typeSpeed={typeSpeed}
            isNewest={it.id === newestId}
            reduced={reduced}
          />
        );
      })}
    </div>
  );
}
