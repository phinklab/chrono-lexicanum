"use client";

/**
 * Chronicle cinematic — shared client helpers.
 * Constants + small hooks used by both the Cinematic and Index views.
 */
import { useEffect, useRef } from "react";
import { useMediaQuery } from "@/lib/useMediaQuery";

export { useMediaQuery };

/** Coarse-pointer phone — the breakpoint that flips the stage's reading
 * direction (CinematicView's scrollTop ⇄ t mapping) and gates the phone
 * touch-target bumps in 67-chronicle-cinematic.css. */
export const COARSE_PHONE_MQ = "(max-width: 760px) and (pointer: coarse)";

export const TIER_MARK: Record<string, string> = {
  epoch: "◈",
  major: "◆",
  minor: "○",
};

/** Dot radii — rail segments inset by these so the line never crosses a hollow circle. */
export const DOT_R: Record<string, number> = { minor: 6, major: 8, epoch: 9.5 };

const ROMAN = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX","XXI","XXII","XXIII","XXIV","XXV","XXVI","XXVII","XXVIII","XXIX","XXX"];
export const roman = (n: number): string => ROMAN[n - 1] || String(n);
export const pad3 = (n: number): string => String(n).padStart(3, "0");
export const clamp = (v: number, a: number, b: number): number =>
  Math.max(a, Math.min(b, v));

/** Typewriter chars/second. */
export const TYPE_SPEED = 80;

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/**
 * The global SiteMenu keeps no body class — it toggles `.is-open` on its own
 * `#site-menu` element. Timeline-wide key/wheel handlers check this so they
 * stay quiet while the menu is up.
 */
export function siteMenuOpen(): boolean {
  return (
    document.getElementById("site-menu")?.classList.contains("is-open") ?? false
  );
}

/**
 * Typed paragraph — `<p><span>text…</span><caret></p>` with a reflow guard:
 * the paragraph's final height is measured up-front and reserved as
 * min-height so the layout doesn't shift while characters arrive. Typing
 * bypasses React state (leaf span owned via ref, re-keyed by callers per
 * event/era so reconciliation never races the interval).
 *
 * SR model (S9): the full text is server-rendered — the visible span carries
 * it in the HTML (SEO/no-JS), then the client effect replays the typing over
 * it. The typing layer is aria-hidden so AT never reads the character stream
 * or a half-typed state; a visually-hidden sibling carries the complete text
 * for the virtual cursor. Announcement-on-change is NOT this component's job
 * (one status region in ChronicleStage owns that).
 */
export function TypedParagraph({
  className,
  text,
  delayMs,
  reduced,
}: {
  className: string;
  text: string;
  delayMs: number;
  reduced: boolean;
}) {
  const pRef = useRef<HTMLParagraphElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const p = pRef.current;
    const span = spanRef.current;
    if (!p || !span) return;
    if (reduced || TYPE_SPEED <= 0) {
      span.textContent = text;
      return;
    }
    p.style.minHeight = "";
    span.textContent = text;
    p.style.minHeight = `${p.getBoundingClientRect().height}px`;
    span.textContent = "";
    let i = 0;
    let timer: ReturnType<typeof setInterval> | undefined;
    const perTick = Math.max(1, Math.round(TYPE_SPEED / 30));
    const delay = setTimeout(() => {
      timer = setInterval(() => {
        i += perTick;
        span.textContent = text.slice(0, i);
        if (i >= text.length && timer) clearInterval(timer);
      }, 1000 / 30);
    }, delayMs);
    return () => {
      clearTimeout(delay);
      if (timer) clearInterval(timer);
    };
  }, [text, delayMs, reduced]);

  return (
    <p className={className} ref={pRef}>
      <span aria-hidden="true" ref={spanRef}>
        {text}
      </span>
      <span className="caret" aria-hidden="true" />
      <span className="chron-sr">{text}</span>
    </p>
  );
}
