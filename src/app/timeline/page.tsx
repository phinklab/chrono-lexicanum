import type { Metadata } from "next";

export const metadata: Metadata = { title: "Chronicle — Timeline" };

/**
 * Timeline route. Will host the ported OverviewTimeline + EraView components
 * from the prototype. For now: placeholder so the navigation link resolves.
 *
 * Phase 2 work (see ROADMAP.md):
 *   - port OverviewTimeline.jsx → src/components/timeline/Overview.tsx
 *   - port EraView.jsx → src/components/timeline/EraDetail.tsx
 *   - data fetched server-side from `db.query.books.findMany({ orderBy: startY })`
 */
export default function TimelinePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-24">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-frost-400">Phase 2</p>
      <h1 className="mt-3 font-cinzel text-4xl text-aquila">Chronicle</h1>
      <p className="mt-6 font-cormorant text-xl italic text-frost-50/80">
        The interactive timeline lives here. Migration of the prototype&apos;s <code>OverviewTimeline</code>{" "}
        and <code>EraView</code> components is the next milestone.
      </p>
    </main>
  );
}
