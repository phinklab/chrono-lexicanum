"use client";

// Full-width call-to-action inside the Tweaks panel body. `variant` picks
// between the default dark fill, a low-emphasis secondary look, and a
// destructive "danger" variant for actions like the era-reset.

import type { ReactNode } from "react";

type Variant = "default" | "secondary" | "danger";

interface ButtonProps {
  label: ReactNode;
  variant?: Variant;
  onClick: () => void;
}

const CLASS_MAP: Record<Variant, string> = {
  default: "twk-btn",
  secondary: "twk-btn secondary",
  danger: "twk-btn danger",
};

export default function Button({ label, variant = "default", onClick }: ButtonProps) {
  return (
    <button type="button" className={CLASS_MAP[variant]} onClick={onClick}>
      {label}
    </button>
  );
}
