"use client";

/**
 * LibrariumNav — the Librarium's chapter navigation (F3 build review round 4).
 *
 * Two garments, one component:
 *   · ≥1180px — the chapter MARGINALIA: a fixed rail on the right edge that
 *     mirrors the site rail on the left (46-site-nav.css) — the site's rooms
 *     to the left of the page, this book's chapters to its right, same hand:
 *     numeral + running title, gold rubric plumb on the current chapter.
 *   · below — a RUNNING HEAD: a slim sticky glass line naming the current
 *     chapter, unfolding into the full table of contents (dotted leaders, the
 *     title-page idiom) on tap. Native <details>, so it works without JS.
 *
 * A scroll-spy (rAF-throttled reading line at ~1/3 viewport) lights the
 * current chapter in both garments.
 *
 * Chapter jumps deliberately touch NO history: native `#anchor` clicks push
 * history entries that carry no App Router state, and `router.back()` onto
 * such an entry strands the detail-overlay slot — the popup stays while only
 * the scroll unwinds (the maintainer's "Return/Close leaves the popup open"
 * bug; these TOC anchors were the app's only same-page hash links). So jumps
 * scroll programmatically and rewrite the hash via `history.replaceState`
 * WITH the current router state — shareable `#chapter` URLs, zero extra
 * history entries. The plain `href` stays as the no-JS/crawler fallback.
 */
import { useEffect, useRef, useState } from "react";

export interface LibrariumChapter {
  num: string;
  /** Short running title — worn by the rail and the running head. */
  label: string;
  /** Full chapter name — worn by the unfolded table of contents. */
  full: string;
  id: string;
}

export default function LibrariumNav({
  chapters,
}: {
  chapters: LibrariumChapter[];
}) {
  const [activeId, setActiveId] = useState(chapters[0]?.id ?? "");
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const line = window.innerHeight * 0.32;
      let current = chapters[0]?.id ?? "";
      for (const c of chapters) {
        const el = document.getElementById(c.id);
        if (el && el.getBoundingClientRect().top <= line) current = c.id;
      }
      setActiveId(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [chapters]);

  function jump(e: React.MouseEvent<HTMLAnchorElement>, id: string): void {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    history.replaceState(history.state, "", `#${id}`);
    if (detailsRef.current) detailsRef.current.open = false;
  }

  const active = chapters.find((c) => c.id === activeId) ?? chapters[0];

  return (
    <nav className="libr-nav" aria-label="Chapters">
      {/* ≥1180px — the marginalia rail. */}
      <ol className="libr-nav__rail">
        {chapters.map((c) => (
          <li key={c.id}>
            <a
              className={`libr-nav__link${c.id === activeId ? " is-current" : ""}`}
              href={`#${c.id}`}
              aria-current={c.id === activeId ? "true" : undefined}
              onClick={(e) => jump(e, c.id)}
            >
              <span className="libr-nav__title">{c.label}</span>
              <span className="libr-nav__num" aria-hidden>
                {c.num}
              </span>
            </a>
          </li>
        ))}
      </ol>

      {/* <1180px — the running head + unfolding contents. */}
      <details ref={detailsRef} className="libr-nav__head">
        <summary className="libr-nav__summary">
          <span className="libr-nav__word">
            Contents
            <span className="libr-nav__caret" aria-hidden />
          </span>
          {active && (
            <span className="libr-nav__current">
              <span className="libr-nav__num" aria-hidden>
                {active.num}
              </span>
              {active.label}
            </span>
          )}
        </summary>
        <ol className="libr-nav__sheet">
          {chapters.map((c) => (
            <li key={c.id}>
              <a
                className={`libr-nav__row${c.id === activeId ? " is-current" : ""}`}
                href={`#${c.id}`}
                aria-current={c.id === activeId ? "true" : undefined}
                onClick={(e) => jump(e, c.id)}
              >
                <span className="libr-nav__row-title">{c.full}</span>
                <span className="libr-nav__leader" aria-hidden />
                <span className="libr-nav__num">{c.num}</span>
              </a>
            </li>
          ))}
        </ol>
      </details>
    </nav>
  );
}
