"use client";

/**
 * RouteScrollCue - compact shared "NEXT" affordance for one-act route heroes.
 * It mirrors the Home cue, but lives in chrome because Archive / Compendium /
 * Ask use it to snap from the atmospheric masthead into the actual tool.
 */
export default function RouteScrollCue({
  label,
  target,
  kicker = "NEXT",
  className,
}: {
  label: string;
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
      className={className ? `route-cue ${className}` : "route-cue"}
      onClick={onClick}
      aria-label={`Scroll to ${label}`}
    >
      <span className="route-cue__kicker">{kicker}</span>
      <span className="route-cue__label">{label}</span>
      <svg
        className="route-cue__chev"
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
