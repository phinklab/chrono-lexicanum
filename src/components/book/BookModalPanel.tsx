"use client";

/**
 * BookModalPanel — the overlay shell for the in-context book detail (Brief 120
 * polish). The ONLY `'use client'` piece: the `@modal/(.)buch` intercept is a
 * Server Component that calls the same `loadBook` and renders the same db-free
 * `<BookDetailView>` into `children`, so the overlay and the canonical
 * `/buch/[slug]` page show the identical body — zero fork.
 *
 * Adapted from `EntityPanel` (the entity arc's shell), with two deliberate
 * differences: a LARGE CENTERED card (not a side drawer), and a PROMINENT
 * "← Back" action as the primary close affordance (focused on open).
 *
 * Interaction model:
 *   • Open: any in-app `<Link href="/buch/[slug]">` soft-navigates and the
 *     intercept mounts this shell over the current context (e.g. the /werke
 *     table). A hard nav / refresh / shared link skips the intercept and renders
 *     the canonical full page (SEO unaffected).
 *   • Close (Back button / × / Escape / backdrop) → `router.back()`, unwinding
 *     the push so it lands on the origin context.
 *   • Flat model: an in-modal click on another book (`/buch/[slug]`, the "Also
 *     contained in" links) is rewritten to `router.replace`, so hops don't stack
 *     history — one Back still closes to the origin. The `/buch/[slug]/audit`
 *     link (two segments) and the "Open full page" affordance pass through and
 *     hard-/soft-navigate away, clearing the overlay via the catch-all slot.
 *   • A11y to the WAI-ARIA APG "Dialog (Modal)" pattern (same as EntityPanel):
 *     focus moves in on open, Tab is trapped, Escape closes, focus returns to
 *     the trigger, the backdrop is inert to AT, body scroll is locked.
 *     `prefers-reduced-motion` is honoured by the global cascade in 10-base.css.
 */

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/** A single-segment /buch/<slug> link (optionally with query/hash) — but NOT
 *  /buch/<slug>/audit, which must leave the overlay. */
const BOOK_HREF = /^\/buch\/[^/?#]+(?:[?#].*)?$/;

export default function BookModalPanel({
  title,
  canonicalHref,
  children,
}: {
  /** Book title — labels the dialog for assistive tech. */
  title: string;
  /** Same URL the panel shows; the "open full page" link hard-navigates here. */
  canonicalHref: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  /** The element focused right before the panel opened, restored on close. */
  const triggerRef = useRef<HTMLElement | null>(null);

  function handleClose() {
    triggerRef.current?.focus({ preventScroll: true });
    router.back();
  }

  // Capture the trigger, move initial focus to the Back button, trap Tab focus,
  // and close on Escape. Mirrors EntityPanel's keyboard contract.
  useEffect(() => {
    const root = panelRef.current;
    if (!root) return;

    const active = document.activeElement;
    triggerRef.current = active instanceof HTMLElement ? active : null;

    const closeBtn = root.querySelector<HTMLButtonElement>(
      "[data-book-modal-close]",
    );
    closeBtn?.focus();

    function getFocusable(): HTMLElement[] {
      if (!root) return [];
      return Array.from(
        root.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = getFocusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lock body scroll so the underlying context doesn't drift behind the panel.
  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  // Flat panel: rewrite an in-panel click on another book to replace-nav, so
  // hops don't stack history (capture runs before <Link>'s handler; marking the
  // event defaultPrevented makes Next skip its push). The audit link, external
  // links and modified clicks (new tab) pass through untouched.
  function onClickCapture(e: React.MouseEvent<HTMLElement>) {
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      return;
    }
    const anchor = (e.target as HTMLElement).closest("a");
    if (!anchor) return;
    if (anchor.dataset.entityHardnav !== undefined) return;
    if (anchor.target && anchor.target !== "_self") return;
    const href = anchor.getAttribute("href");
    if (!href || !BOOK_HREF.test(href)) return;
    e.preventDefault();
    router.replace(href);
  }

  const titleId = "book-modal-title";

  return (
    <div className="book-modal-root" data-book-modal>
      <div
        className="book-modal-backdrop"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className="book-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClickCapture={onClickCapture}
      >
        <div className="book-modal__bar">
          <button
            data-book-modal-close
            type="button"
            className="book-modal__back"
            onClick={handleClose}
          >
            <span className="book-modal__back-arrow" aria-hidden>
              ←
            </span>
            Back
          </button>
          <div className="book-modal__bar-end">
            <a
              className="book-modal__expand"
              href={canonicalHref}
              data-entity-hardnav
            >
              Open full page ↗
            </a>
            <button
              type="button"
              className="book-modal__close"
              onClick={handleClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
        {/* Visually-hidden accessible name (the visible <h1> lives inside
            BookDetailView; this keeps the label stable + decoupled). */}
        <span id={titleId} className="book-modal__a11y-title">
          {title}
        </span>
        <div className="book-modal__scroll">{children}</div>
      </div>
    </div>
  );
}
