import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ask the Archive" };

/**
 * Ask flow. Will host the ported AskMode component (5-question funnel).
 *
 * Phase 2 work (see ROADMAP.md):
 *   - port AskMode.jsx → src/components/ask/Funnel.tsx
 *   - move scoring weights from archive.js into a typed `recommend()` function
 *   - persist user's selections in URL params so a result page is shareable
 */
export default function AskPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-frost-400">Phase 2</p>
      <h1 className="mt-3 font-cinzel text-4xl text-aquila">Ask the Archive</h1>
      <p className="mt-6 font-cormorant text-xl italic text-frost-50/80">
        Five questions and the Archive will surface the right entry point for you.
      </p>
    </main>
  );
}
