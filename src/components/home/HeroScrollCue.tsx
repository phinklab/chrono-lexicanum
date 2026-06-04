"use client";

/**
 * HeroScrollCue — a call-to-scroll that PREVIEWS the next act: a small `// NEXT`
 * mono kicker over the next section's name + three cascading cyan chevrons (the
 * shared `hubDescentChev` keyframe). Click smooth-scrolls to `target`, honouring
 * prefers-reduced-motion (jumps instantly). The chevron animation is zeroed by
 * the global reduced-motion kill-switch, so under reduced motion it is three
 * static chevrons — still a clear affordance.
 *
 * Used at the foot of Act 1 (→ "What can I do here?") and Act 2 (→ "More to
 * explore", with className="hub-cue--floor" to pin it to the act floor).
 */
export default function HeroScrollCue({
  label,
  target,
  kicker = "// NEXT",
  className,
}: {
  /** The next section's name — what's one snap down. */
  label: string;
  /** Selector of the act to scroll to. */
  target: string;
  kicker?: string;
  className?: string;
}) {
  function onClick(): void {
    const el = document.querySelector(target);
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = reduce ? "auto" : "smooth";
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ behavior, block: "start" });
    } else {
      window.scrollTo({ top: window.innerHeight, behavior });
    }
  }

  return (
    <button
      type="button"
      className={className ? `hub-cue ${className}` : "hub-cue"}
      onClick={onClick}
      aria-label={`Scroll to ${label}`}
    >
      <span className="hub-cue__kicker">{kicker}</span>
      <span className="hub-cue__label">{label}</span>
      <svg
        className="hub-cue__chev"
        viewBox="0 0 24 30"
        width="22"
        height="28"
        aria-hidden
      >
        <path d="M4 5 L12 11 L20 5" />
        <path d="M4 13 L12 19 L20 13" />
        <path d="M4 21 L12 27 L20 21" />
      </svg>
    </button>
  );
}
