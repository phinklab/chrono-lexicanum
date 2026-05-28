"use client";

import type { Theme } from "@/lib/galaxy/types";

interface CornerOrnamentProps {
  theme: Theme;
  pos: "tl" | "tr" | "bl" | "br";
}

const FLIP: Record<CornerOrnamentProps["pos"], string> = {
  tl: "",
  tr: "scaleX(-1)",
  bl: "scaleY(-1)",
  br: "scale(-1,-1)",
};

export default function CornerOrnament({ theme, pos }: CornerOrnamentProps) {
  const t = theme;
  const flip = FLIP[pos];
  if (t.cornerStyle === "tech") {
    return (
      <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: flip, opacity: 0.85 }}>
        <path d="M2 22 L2 2 L22 2" fill="none" stroke={t.primary} strokeWidth="1.2" />
        <path d="M8 14 L8 8 L14 8" fill="none" stroke={t.primary} strokeWidth="1" opacity="0.6" />
        <circle cx="4" cy="4" r="1.5" fill={t.primary} />
        <path d="M18 2 L26 2 M30 2 L34 2" stroke={t.primary} strokeWidth="0.7" opacity="0.5" />
      </svg>
    );
  }
  if (t.cornerStyle === "rune") {
    return (
      <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: flip, opacity: 0.9 }}>
        <path d="M4 28 L4 4 L28 4" fill="none" stroke={t.primary} strokeWidth="1" />
        <path d="M4 4 L14 14" stroke={t.primary} strokeWidth="0.8" opacity="0.7" />
        <circle cx="14" cy="14" r="2.5" fill="none" stroke={t.primary} strokeWidth="0.7" />
        <circle cx="14" cy="14" r="0.8" fill={t.primary} />
        <path d="M22 4 L22 8 M18 4 L18 8" stroke={t.primary} strokeWidth="0.6" opacity="0.5" />
      </svg>
    );
  }
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" style={{ transform: flip, opacity: 0.95 }}>
      <path d="M2 2 L34 2 L34 6 L6 6 L6 34 L2 34 Z" fill={t.primary} opacity="0.85" />
      <path d="M10 10 L24 10 M10 10 L10 24" stroke={t.primary} strokeWidth="0.8" opacity="0.6" />
      <path d="M14 6 L14 12 M20 6 L20 10 M26 6 L26 10" stroke={t.primary} strokeWidth="0.7" opacity="0.7" />
      <circle cx="6" cy="6" r="2" fill={t.accent} />
      <path d="M30 2 L34 6 L30 6 Z" fill={t.primary} />
    </svg>
  );
}
