"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

type TypewriterProps = {
  text: string;
  speed?: number;
  startDelay?: number;
  cursor?: boolean;
  onDone?: () => void;
  style?: CSSProperties;
  className?: string;
};

export default function Typewriter({
  text,
  speed = 24,
  startDelay = 0,
  cursor = true,
  onDone,
  style,
  className,
}: TypewriterProps) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(reduced ? text.length : 0);
  const [started, setStarted] = useState(reduced || startDelay === 0);

  // Callers key this component by text so text/startDelay don't change
  // mid-mount; we never reset state from an effect.
  useEffect(() => {
    if (reduced) {
      onDone?.();
      return;
    }
    if (startDelay === 0) return;
    const t = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(t);
  }, [text, startDelay, reduced, onDone]);

  useEffect(() => {
    if (reduced || !started) return;
    if (n >= text.length) {
      onDone?.();
      return;
    }
    const id = setTimeout(() => setN((v) => v + 1), speed);
    return () => clearTimeout(id);
  }, [n, text, started, speed, reduced, onDone]);

  return (
    <span style={style} className={className}>
      {text.slice(0, n)}
      {cursor && started && n < text.length && (
        <span
          style={{
            display: "inline-block",
            marginLeft: 1,
            color: "var(--cl-cyan)",
          }}
        >
          ▌
        </span>
      )}
    </span>
  );
}
