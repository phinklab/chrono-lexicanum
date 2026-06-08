"use client";

/**
 * DetailModal — the ONE in-context detail overlay, shared by the book and the
 * four entity intercepts (Brief 131). It is the merge of the old `BookModalPanel`
 * (centered card) and `EntityPanel` (side drawer) into a single shell: a LARGE
 * CENTERED card with a prominent "← Back" as the primary close affordance. The
 * `@modal/(.)*` intercepts are Server Components that call the same `loadBook` /
 * `loadEntity` and render the same db-free `<BookDetailView>` / `<EntityView>`
 * into `children`, so the overlay and the canonical full page show the identical
 * body — zero fork.
 *
 * Interaction model:
 *   • Open: any in-app `<Link>` to a single-segment detail URL (`/buch/[slug]`,
 *     `/fraktion/[id]`, `/charakter/[id]`, `/welt/[id]`, `/person/[id]`)
 *     soft-navigates and the matching `@modal` intercept mounts this shell over
 *     the current context (e.g. the /werke table, the compendium). A hard nav /
 *     refresh / shared link skips the intercept and renders the canonical full
 *     page (SEO + deep links unaffected).
 *   • Close (Back button / × / Escape / backdrop) → `router.back()`, unwinding
 *     the push so it lands on the origin context.
 *   • Flat model: an in-modal click on another ENTITY detail link (a faction chip
 *     inside a book, a character inside a world, …) is rewritten to
 *     `router.replace`, so the body swaps IN THE SAME SHELL without stacking
 *     history — one Back still closes to the origin.
 *   • Books pop OUT: a `/buch/<slug>` link clicked from inside the popup opens
 *     the full book page in a NEW TAB instead of swapping in-shell, so the reader
 *     keeps their place in the current (usually entity) popup. (Opening a book
 *     from /werke or the quiz still opens this popup — the new-tab rule applies
 *     only to a book clicked while already inside a popup.)
 *   • Two-segment links (`/buch/[slug]/audit`), the "Open full page" affordance
 *     (`data-detail-hardnav`), external/new-tab and non-detail links (e.g. a
 *     `/podcasts/…#ep-…` related-work) pass through and navigate away, clearing
 *     the overlay via the catch-all slot.
 *   • A11y to the WAI-ARIA APG "Dialog (Modal)" pattern: focus moves in on open,
 *     Tab is trapped, Escape closes, focus returns to the trigger, the backdrop
 *     is inert to AT, body scroll is locked. `prefers-reduced-motion` is honoured
 *     by the global cascade in 10-base.css.
 */

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { TYPE_TO_ROUTE } from "@/lib/entity/types";

/** Single-segment detail links the panel keeps in-shell (→ in-panel replace-nav).
 *  `/buch/<slug>` plus every entity route; a trailing query/hash is allowed, but
 *  a second path segment (e.g. `/buch/<slug>/audit`) is NOT — it must leave. */
const DETAIL_PREFIXES = ["/buch", ...Object.values(TYPE_TO_ROUTE)];
const DETAIL_HREF = new RegExp(
  `^(?:${DETAIL_PREFIXES.join("|")})/[^/?#]+(?:[?#].*)?$`,
);

export default function DetailModal({
  title,
  canonicalHref,
  children,
}: {
  /** Book / entity name — labels the dialog for assistive tech. */
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
    // Restore focus synchronously while the trigger is still mounted (the
    // underlying page stays mounted under the modal slot), then unwind the push
    // that opened the panel.
    triggerRef.current?.focus({ preventScroll: true });
    router.back();
  }

  // Capture the trigger, move initial focus to the Back button, trap Tab focus,
  // and close on Escape.
  useEffect(() => {
    const root = panelRef.current;
    if (!root) return;

    const active = document.activeElement;
    triggerRef.current = active instanceof HTMLElement ? active : null;

    const closeBtn = root.querySelector<HTMLButtonElement>(
      "[data-detail-modal-close]",
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

  // Flat panel: rewrite an in-panel click on another detail link to replace-nav,
  // so hops don't stack history (capture runs before <Link>'s handler; marking
  // the event defaultPrevented makes Next skip its push). The audit link,
  // "open full page", external links and modified clicks (new tab) pass through.
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
    // The "open full page" affordance opts out → browser does the hard nav.
    if (anchor.dataset.detailHardnav !== undefined) return;
    if (anchor.target && anchor.target !== "_self") return;
    const href = anchor.getAttribute("href");
    if (!href || !DETAIL_HREF.test(href)) return;
    e.preventDefault();
    // A book opened from inside the popup pops out to its full page in a new tab
    // (the reader keeps their place here); entity links swap the body in-shell.
    if (href.startsWith("/buch/")) {
      window.open(href, "_blank", "noopener");
      return;
    }
    router.replace(href);
  }

  const titleId = "detail-modal-title";

  return (
    <div className="detail-modal-root" data-detail-modal>
      <div
        className="detail-modal-backdrop"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className="detail-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClickCapture={onClickCapture}
      >
        <div className="detail-modal__bar">
          <button
            data-detail-modal-close
            type="button"
            className="detail-modal__back"
            onClick={handleClose}
          >
            <span className="detail-modal__back-arrow" aria-hidden>
              ←
            </span>
            Back
          </button>
          <div className="detail-modal__bar-end">
            <a
              className="detail-modal__expand"
              href={canonicalHref}
              data-detail-hardnav
            >
              Open full page ↗
            </a>
            <button
              type="button"
              className="detail-modal__close"
              onClick={handleClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
        {/* Visually-hidden accessible name (the visible <h1> lives inside the
            body view; this keeps the label stable + decoupled). */}
        <span id={titleId} className="detail-modal__a11y-title">
          {title}
        </span>
        <div className="detail-modal__scroll">{children}</div>
      </div>
    </div>
  );
}
