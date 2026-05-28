"use client";

// Segmented radio — port of TweakRadio. Falls back to a <select> when labels
// or option count exceed what the segmented track can render legibly. Stays
// type-preserving across that fallback so callers always get the raw option
// value back (string/number/boolean), not stringified copies from the DOM.

import { useEffect, useRef, useState } from "react";

import Row from "./Row";
import Select from "./Select";

type RawOption<T> = T | { value: T; label: string };

interface RadioProps<T extends string | number | boolean> {
  label: string;
  value: T;
  options: ReadonlyArray<RawOption<T>>;
  onChange: (next: T) => void;
}

interface NormalizedOption<T> {
  value: T;
  label: string;
}

function normalize<T>(o: RawOption<T>): NormalizedOption<T> {
  if (typeof o === "object" && o !== null && "value" in (o as object)) {
    return o as NormalizedOption<T>;
  }
  return { value: o as T, label: String(o) };
}

export default function Radio<T extends string | number | boolean>({
  label,
  value,
  options,
  onChange,
}: RadioProps<T>) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  // valueRef pins the current value across the lifetime of a single drag so
  // pointermove callbacks never read a stale closure capture. React 19's
  // rules-of-react lint flags writes during render — sync inside an effect.
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  });

  // Segments wrap mid-word once per-segment width runs out (~248px track,
  // ~6.3px/char system-ui at 11.5px). 2 options ≈ 16 chars each, 3 ≈ 10.
  // Beyond that — or with >3 options — fall back to a dropdown.
  const opts = options.map(normalize);
  const maxLen = opts.reduce((m, o) => Math.max(m, o.label.length), 0);
  const fitsAsSegments =
    (opts.length === 2 && maxLen <= 16) ||
    (opts.length === 3 && maxLen <= 10);

  if (!fitsAsSegments) {
    return <Select label={label} value={value} options={opts} onChange={onChange} />;
  }

  const idx = Math.max(0, opts.findIndex((o) => o.value === value));
  const n = opts.length;

  const segAt = (clientX: number): T => {
    const track = trackRef.current;
    if (!track) return valueRef.current;
    const r = track.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor(((clientX - r.left - 2) / inner) * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = (ev: PointerEvent) => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <Row label={label}>
      <div
        ref={trackRef}
        role="radiogroup"
        onPointerDown={onPointerDown}
        className={dragging ? "twk-seg dragging" : "twk-seg"}
      >
        <div
          className="twk-seg-thumb"
          style={{
            left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
            width: `calc((100% - 4px) / ${n})`,
          }}
        />
        {opts.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={o.value === value}
          >
            {o.label}
          </button>
        ))}
      </div>
    </Row>
  );
}
