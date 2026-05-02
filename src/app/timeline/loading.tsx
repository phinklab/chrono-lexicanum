/**
 * Timeline route loading state — Next App Router renders this synchronously
 * while page.tsx's server-side loadTimeline() / loadBookDetail() resolve.
 *
 * The chrome (shell + eyebrow) matches the rendered page so the transition
 * from / → /timeline (and ?era=... → ?era=... + ?book=...) feels like the
 * page is filling in, not a blank flash. The skeleton bars pulse as the
 * "we're working on it" signal.
 *
 * Note: route-segment loading.tsx fires for cross-route navigation (e.g.
 * Hub → /timeline) but does NOT fire for searchParams-only changes within
 * the same /timeline route (BookDot click → ?book=... is the same segment).
 * For that path the existing dmRise animation on the panel itself is the
 * "something happened" signal; finer-grained skeleton-on-panel-only would
 * need a Suspense boundary around the DetailPanel render.
 */
export default function TimelineLoading() {
  return (
    <main className="timeline-shell" aria-busy="true">
      <p className="timeline-eyebrow">
        <span aria-hidden>{"// Chronicle-Console"}</span>
        <span className="timeline-eyebrow-dot" aria-hidden />
        <span aria-hidden>Loading…</span>
      </p>

      <div className="timeline-skeleton" aria-hidden="true">
        <div className="timeline-skel-bar short" />
        <div className="timeline-skel-bar tall" />
        <div className="timeline-skel-bar medium" />
      </div>
    </main>
  );
}
