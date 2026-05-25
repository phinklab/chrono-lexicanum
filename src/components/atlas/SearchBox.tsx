"use client";

import { useId } from "react";

interface SearchBoxProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  label?: string;
  resultLabel?: string;
}

export default function SearchBox({
  value,
  onChange,
  placeholder = "Suchen…",
  label = "FILTER",
  resultLabel,
}: SearchBoxProps) {
  const id = useId();
  return (
    <div className="atlas-search">
      <label htmlFor={id} className="atlas-search__label">
        {label}
      </label>
      <input
        id={id}
        type="search"
        className="atlas-search__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
      />
      {resultLabel && (
        <span className="atlas-search__count" aria-live="polite">
          {resultLabel}
        </span>
      )}
    </div>
  );
}
