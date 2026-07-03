"use client";

import { useEffect } from "react";

/**
 * RevealObserver — mounted once in the root layout; reveals every `.reveal`
 * element (adds `.is-seen`) the first time it scrolls into view. Late
 * arrivals — Suspense-streamed page content, client-side navigations, filter
 * re-renders — are caught by a MutationObserver, so no route needs its own
 * wiring and content can never be stranded invisible behind a missed
 * observation (the loading.tsx fallbacks mount BEFORE the real page exists).
 * Under reduced motion the CSS shows everything statically; without
 * IntersectionObserver the `:root.no-reveal` fallback does the same
 * (42-lex-primitives.css).
 */
export default function RevealObserver() {
  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      document.documentElement.classList.add("no-reveal");
      return;
    }

    // threshold 0, NOT a ratio: a ratio requires that share of the TARGET's
    // own height to be on screen — for targets taller than the viewport
    // (e.g. the full archive register) a 0.08 ratio can never be reached and
    // the element would stay invisible forever. The -8% rootMargin alone
    // provides the "reveal once it is properly inside the view" feel.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("is-seen");
            io.unobserve(en.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );

    const tracked = new WeakSet<Element>();
    function scan() {
      document.querySelectorAll(".reveal").forEach((el) => {
        if (tracked.has(el)) return;
        tracked.add(el);
        io.observe(el);
      });
    }
    scan();

    // Rescan only when added nodes actually carry .reveal elements — keeps
    // char-level DOM churn (e.g. the vox scribe typing) from triggering
    // document-wide queries.
    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        for (const n of m.addedNodes) {
          if (n.nodeType !== Node.ELEMENT_NODE) continue;
          const el = n as Element;
          if (el.classList.contains("reveal") || el.querySelector(".reveal")) {
            scan();
            return;
          }
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io.disconnect();
    };
  }, []);
  return null;
}
