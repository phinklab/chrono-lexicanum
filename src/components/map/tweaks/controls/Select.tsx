"use client";

// Native <select> wrapped in the panel's frosted-glass field style. Accepts
// the same {value,label} options as Radio so it can be the fallback for many-
// or long-option groups. Always emits the original option value so types are
// preserved across the round-trip through the DOM.

import Row from "./Row";

type RawOption<T> = T | { value: T; label: string };

interface SelectProps<T extends string | number | boolean> {
  label: string;
  value: T;
  options: ReadonlyArray<RawOption<T>>;
  onChange: (next: T) => void;
}

export default function Select<T extends string | number | boolean>({
  label,
  value,
  options,
  onChange,
}: SelectProps<T>) {
  const normalized = options.map((o): { value: T; label: string } =>
    typeof o === "object" && o !== null && "value" in (o as object)
      ? (o as { value: T; label: string })
      : { value: o as T, label: String(o) },
  );
  const resolve = (raw: string): T => {
    const match = normalized.find((o) => String(o.value) === raw);
    return (match ? match.value : (raw as unknown)) as T;
  };
  return (
    <Row label={label}>
      <select
        className="twk-field"
        value={String(value)}
        onChange={(e) => onChange(resolve(e.target.value))}
      >
        {normalized.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    </Row>
  );
}
