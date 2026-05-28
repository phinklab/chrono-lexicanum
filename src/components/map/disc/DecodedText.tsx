"use client";

// Machine-translation scramble for hovered labels. Letters cycle through a
// random glyph set until they "settle" into the real word. Plays a single
// scramble→reveal pass each time `active` flips true.

import { useEffect, useRef, useState } from "react";

interface DecodedTextProps {
  text: string;
  active: boolean;
  glyphSet?: string;
}

const DEFAULT_GLYPHS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*<>{}[]/\\!?█▓▒░ΩΔΣΞ╪╠╗║";

export default function DecodedText({ text, active, glyphSet }: DecodedTextProps) {
  const [scrambled, setScrambled] = useState<string | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    const chars = glyphSet || DEFAULT_GLYPHS;
    const total = Math.max(text.length * 70 + 250, 600);
    const start = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / total);
      const settledChars = Math.floor(k * k * (text.length + 1));
      let out = "";
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === " " || ch === "'") {
          out += ch;
          continue;
        }
        if (i < settledChars) {
          out += ch;
          continue;
        }
        out += chars[(Math.random() * chars.length) | 0];
      }
      setScrambled(out);
      if (k < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setScrambled(text);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [text, active, glyphSet]);

  // When inactive, render the prop directly — no setState during the
  // active→inactive transition.
  return <>{active && scrambled !== null ? scrambled : text}</>;
}
