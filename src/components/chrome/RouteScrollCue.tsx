"use client";

/**
 * RouteScrollCue — the shared scroll affordance under a masthead: a hairline
 * that fades out downward with a drop of light running down it (CSS), the
 * section name underneath. Click scrolls to `target`, honouring
 * prefers-reduced-motion.
 */
export default function RouteScrollCue({
  label,
  target,
  className,
}: {
  label: string;
  target: string;
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
      {label}
    </button>
  );
}
