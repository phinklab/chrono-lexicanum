"use client";

/**
 * TLPCtx — the hover/open event bus for the Chronicle shell, ported from the
 * prototype's `book-bits.jsx` shared context. `BookNode` / `SeqCard` /
 * cluster-popover rows raise events up to `<ChronicleClient>`, which owns the
 * tooltip state and turns "open" into a `?book=` URL push (→ DetailPanel).
 */

import { createContext, useContext } from "react";
import type { TimelineBook } from "@/lib/timeline";

export interface ChronicleCtx {
  /** Hover a marker → show the floating tooltip at viewport coords (x, y). */
  onHover: (book: TimelineBook, x: number, y: number) => void;
  /** Leave a marker → hide the tooltip. */
  onLeave: () => void;
  /** Activate a marker → open the book (pushes ?book=, opens DetailPanel). */
  onOpen: (book: TimelineBook) => void;
}

const noop = () => {};

export const TLPCtx = createContext<ChronicleCtx>({
  onHover: noop,
  onLeave: noop,
  onOpen: noop,
});

export function useChronicle(): ChronicleCtx {
  return useContext(TLPCtx);
}
