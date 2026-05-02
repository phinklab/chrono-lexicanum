"use client";

/**
 * DetailPanel — hero modal that opens when `?book=<slug>` is present on
 * `/timeline`. Stub in this commit; full JSX + ESC + focus-trap + series-nav +
 * Reading-Notes + Sources land in the follow-up commit.
 */

import type { BookDetail } from "@/lib/timeline";

interface Props {
  selectedBook: BookDetail | null;
  eraId: string | null;
}

export function DetailPanel({ selectedBook }: Props) {
  if (!selectedBook) return null;
  // Stub renders nothing visible until the next commit wires the UI.
  return null;
}
