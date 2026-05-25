/**
 * /atlas Layout — admin surface. Sets `noindex` for the entire subtree so
 * the Brücke and per-entity pages never enter a search index even by
 * accident. Auth is enforced edge-side in `src/proxy.ts` (Task 1) — the
 * layout is intentionally a thin pass-through.
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: { default: "Atlas · Admin", template: "Atlas · %s" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AtlasLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
