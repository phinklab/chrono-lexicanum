"use client";

/**
 * HeroDescent — mittig-unten im Hero-Fold gemounteter Call-to-scroll.
 * Drei animierte Cyan-Chevrons (kaskadierende „Tröpfchen") + Label
 * „What can I do here?" in Cinzel/Plex-Mono-Optik. Click → smooth scroll
 * auf den Tools-Fold (oder window.innerHeight als Fallback). Fade-out via
 * `--hub-scroll-dim` CSS-Variable (vom Geschwister-`HubScrollWatch` gesetzt)
 * — sobald gescrollt wird, blendet sich der Indikator weg. Reduced motion
 * wird zentral im globals.css respektiert.
 */
export default function HeroDescent() {
  const handleClick = () => {
    const target = document.querySelector(".hub-fold--tools");
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = reduced ? "auto" : "smooth";
    if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior, block: "start" });
    } else {
      window.scrollTo({ top: window.innerHeight, behavior });
    }
  };

  return (
    <button
      type="button"
      className="hub-hero-descent"
      onClick={handleClick}
      aria-label="Scroll to the tools — what can I do here?"
    >
      <span className="hub-hero-descent__label">What can I do here?</span>
      <svg
        className="hub-hero-descent__chev"
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
