"use client";

// Section heading + label for a group of related tweak controls. Pure layout
// helper — the body of the panel is `flex column gap:10px`, so children just
// flow under the heading.

import type { ReactNode } from "react";

interface SectionProps {
  label: string;
  children?: ReactNode;
}

export default function Section({ label, children }: SectionProps) {
  return (
    <>
      <div className="twk-sect">{label}</div>
      {children}
    </>
  );
}
