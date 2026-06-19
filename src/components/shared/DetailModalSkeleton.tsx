/**
 * Presentational fallback for the `@modal` slot (Report — perceived latency).
 * Mirrors the real DetailModal chrome (same `detail-modal-*` classes) so the
 * overlay's shape is on screen the instant a soft-nav intercept begins to
 * stream, instead of the panel opening into a void after a dead beat.
 *
 * Deliberately INERT — no focus trap, no inert-siblings, no scroll-lock, no
 * router. It renders nothing the live `DetailModal` also runs, so when the real
 * panel streams in and mounts, its open effects fire exactly once (no
 * double-toggle of inert/scroll/focus). A compact cogitator — the shared
 * `.lx-cog` anatomy, reduced-motion stilled by the global cascade in
 * 10-base.css — sits where the entity body will land.
 */
export default function DetailModalSkeleton() {
  return (
    <div className="detail-modal-root" data-detail-modal>
      <div className="detail-modal-backdrop" aria-hidden="true" />
      <div
        className="detail-modal-panel detail-modal-panel--skeleton"
        role="status"
      >
        <span className="cogitator-loading__sr">Loading…</span>
        <div className="detail-modal__bar" aria-hidden>
          <span className="detail-modal__back">
            <span className="detail-modal__back-arrow">←</span>
            Back
          </span>
        </div>
        <div className="detail-modal__scroll" aria-hidden>
          <div className="lx-cog">
            <div className="lx-cog__core">
              <span className="lx-cog__ring" />
              <span className="lx-cog__seed" />
            </div>
            <p className="lx-cog__eyebrow">{"COGNITIO LINK · ESTABLISHING"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
