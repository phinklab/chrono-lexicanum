"use client";

/**
 * Skip link — first tabbable element on every route (layout.tsx). Visually
 * parked off-screen until keyboard-focused (10-base.css); targets the
 * per-route `<main id="main" tabIndex={-1}>`.
 *
 * A client island instead of a bare `<a href="#main">` because a native hash
 * jump pushes a history entry without App Router state — `router.back()` onto
 * such an entry strands the detail-overlay slot (same failure the Librarium's
 * TOC anchors exposed, see LibrariumNav). The handler moves focus + scroll
 * directly and touches no history; the `href` remains as the no-JS fallback.
 */
export default function SkipLink() {
  function onClick(e: React.MouseEvent<HTMLAnchorElement>): void {
    const el = document.getElementById("main");
    if (!el) return;
    e.preventDefault();
    el.focus({ preventScroll: true });
    el.scrollIntoView({ behavior: "auto", block: "start" });
  }

  return (
    <a className="skip-link" href="#main" onClick={onClick}>
      Skip to content
    </a>
  );
}
