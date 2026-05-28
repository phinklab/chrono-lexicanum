"use client";

// Row with label + optional inline value pill. `inline` puts label + child on
// one line (used by Toggle); default is label on top, control below.

import type { ReactNode } from "react";

interface RowProps {
  label: string;
  value?: ReactNode;
  inline?: boolean;
  children: ReactNode;
}

export default function Row({ label, value, inline = false, children }: RowProps) {
  return (
    <div className={inline ? "twk-row twk-row-h" : "twk-row"}>
      <div className="twk-lbl">
        <span>{label}</span>
        {value != null && <span className="twk-val">{value}</span>}
      </div>
      {children}
    </div>
  );
}
