"use client";

/**
 * Shared intercept shell: modal and canonical routes render the same detail
 * components. Close uses history back; entity-to-entity hops replace in-shell,
 * book hops push one entry, and non-detail links leave the overlay.
 *
 * Implements the APG modal contract: focus entry/trap/restore, Escape/backdrop
 * close, inert background and body scroll lock.
 */

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useRouteNav } from "@/components/chrono/RouteProgress";
import { TYPE_TO_ROUTE } from "@/lib/entity/types";
// Component-scoped stylesheet (S7a): the overlay chrome loads with whichever
// @modal intercept mounts it (also imported by DetailModalSkeleton).
import "@/app/styles/64-detail-modal.css";

/** Single-segment detail links stay in-shell; deeper paths leave the modal. */
const DETAIL_PREFIXES = ["/book", ...Object.values(TYPE_TO_ROUTE)];
const DETAIL_HREF = new RegExp(
  `^(?:${DETAIL_PREFIXES.join("|")})/[^/?#]+(?:[?#].*)?$`,
);

export default function DetailModal({
  title,
  children,
}: {
  /** Book / entity name — labels the dialog for assistive tech. */
  title: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  // In-panel hops navigate through the shared transition so the global beam
  // lights while the next body streams in this same shell; `router.back()`
  // (close) stays a direct call — there is no forward wait to signal.
  const { navigate, replace } = useRouteNav();
  const panelRef = useRef<HTMLDivElement>(null);
  /** The element focused right before the panel opened, restored on close. */
  const triggerRef = useRef<HTMLElement | null>(null);
  /** Body-level siblings we made `inert` on open, released on close. */
  const inertedRef = useRef<HTMLElement[]>([]);

  function releaseInert() {
    for (const el of inertedRef.current) el.inert = false;
    inertedRef.current = [];
  }

  function handleClose() {
    // Release `inert` FIRST — the trigger lives in the inerted page behind the
    // panel, and focusing an element inside an inert subtree is a silent no-op.
    // Then restore focus synchronously while the trigger is still mounted (the
    // underlying page stays mounted under the modal slot), then unwind the push
    // that opened the panel.
    releaseInert();
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

  // Make everything behind the dialog inert: the Tab trap
  // already handles keyboard, but without `inert` the page behind stays click-
  // and AT-reachable despite `aria-modal="true"`. Skip siblings that are
  // already inert (the closed SiteMenu manages its own) so we don't clobber
  // their owners' state on release.
  useEffect(() => {
    const root = panelRef.current;
    if (!root) return;
    const made: HTMLElement[] = [];
    for (const el of Array.from(document.body.children)) {
      if (el instanceof HTMLElement && !el.contains(root) && !el.inert) {
        el.inert = true;
        made.push(el);
      }
    }
    inertedRef.current = made;
    return releaseInert;
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
  // external links and modified clicks (new tab) pass through.
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
    if (anchor.target && anchor.target !== "_self") return;
    const href = anchor.getAttribute("href");
    if (!href || !DETAIL_HREF.test(href)) return;
    e.preventDefault();
    // A book opened from inside the popup pushes one history entry so the book
    // modal mounts in this same shell and Back returns here; entity-to-entity
    // links replace (flat) so one Back still closes straight to the origin.
    if (href.startsWith("/book/")) {
      navigate(href);
      return;
    }
    replace(href);
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
              ‹
            </span>
            Return
          </button>
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
