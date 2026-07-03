/**
 * SternwarteRings — the observatory ring HUD: two hairline rings, each
 * carrying a planet dot, around a static inner ring. One geometry, two duties:
 * blooming out of the origin dot on .lx-btn hover (BtnFx) and turning as an
 * endless wait-state loop (CogitatorLoading, .lx-cog). Rotation/scale/opacity
 * live in the consumer's CSS on the `fr1`/`fr2` groups and the passed class.
 */
export default function SternwarteRings({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.8"
      aria-hidden
    >
      <g className="fr1">
        <circle cx="60" cy="60" r="56" pathLength={360} strokeDasharray="0.5 5.5" strokeOpacity="0.8" />
        <circle cx="60" cy="4" r="1.5" fill="currentColor" stroke="none" opacity="0.9" />
      </g>
      <g className="fr2">
        <circle cx="60" cy="60" r="41" strokeDasharray="2 7" strokeOpacity="0.5" />
        <circle cx="101" cy="60" r="1.1" fill="currentColor" stroke="none" opacity="0.8" />
      </g>
      <circle cx="60" cy="60" r="27" strokeOpacity="0.35" />
    </svg>
  );
}
