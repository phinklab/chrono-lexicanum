/**
 * Presentational fallback for the `@modal` slot (Report — perceived latency).
 *
 * Pared to the loader itself: NO card panel, NO top bar / Terminus divider —
 * just the compact cogitator (the shared `.lx-cog` ring+seed+eyebrow,
 * reduced-motion stilled by the global cascade in 10-base.css) centred over the
 * page, with a quiet "Back" cue beneath it. The page-dimming backdrop is the
 * one piece of overlay chrome kept (the same `.detail-modal-backdrop` the live
 * DetailModal renders), so when the real panel streams in and mounts its scrim
 * is already on screen — no backdrop flash at the hand-off.
 *
 * Deliberately INERT — no focus trap, no inert-siblings, no scroll-lock, no
 * router. It renders nothing the live `DetailModal` also runs, so when the real
 * panel streams in its open effects fire exactly once (no double-toggle of
 * inert/scroll/focus). `role="status"` + the sr-only label carry the a11y; the
 * visible cogitator and Back cue are `aria-hidden`.
 */
import SternwarteRings from "./SternwarteRings";

export default function DetailModalSkeleton() {
  return (
    <div className="detail-modal-root" data-detail-modal>
      <div className="detail-modal-backdrop" aria-hidden="true" />
      <div className="detail-modal-skeleton" role="status">
        <span className="cogitator-loading__sr">Loading…</span>
        <div className="lx-cog" aria-hidden>
          <div className="lx-cog__core">
            <SternwarteRings className="lx-cog__rings" />
            <span className="lx-cog__seed" />
          </div>
          <p className="lx-cog__eyebrow">{"COGNITIO LINK · ESTABLISHING"}</p>
        </div>
        <span className="detail-modal-skeleton__back" aria-hidden>
          <span className="detail-modal__back-arrow">←</span>
          Back
        </span>
      </div>
    </div>
  );
}
