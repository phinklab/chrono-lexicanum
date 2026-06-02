"use client";

/**
 * EntityPanel — the overlay shell for the in-context entity panel (Brief 113,
 * Phase B). It is the ONLY `'use client'` piece of the panel: the intercepting
 * route is a Server Component that calls the same `loadEntity` and renders the
 * same db-free `<EntityView>` into `children`, so there is zero fork — the panel
 * and the full SSG page show the identical body (see the two seam rules in
 * `EntityView.tsx`).
 *
 * Interaction model (all four bindings are architectural, from the brief):
 *
 *   • Open: a normal in-app `<Link>` to an entity URL soft-navigates; the
 *     `@modal` intercept mounts this shell. A hard nav / refresh / shared link
 *     skips the intercept and renders the canonical full page instead.
 *   • Close (Escape / backdrop / button) → `router.back()`. The open was a
 *     push from the underlying context, so back() always lands on that context
 *     — never on an entity visited *inside* the panel.
 *   • Flat model: a click on an entity link INSIDE the panel is rewritten to
 *     `router.replace` (capture-phase delegation below), so in-panel hops never
 *     stack history. One back() still closes to the origin. Non-entity links
 *     (a `/buch/[slug]` book card, external links) pass through untouched — the
 *     resulting soft-nav hits the catch-all slot and clears the panel.
 *   • A11y to the WAI-ARIA APG "Dialog (Modal)" bar, reusing the house pattern
 *     from `DetailPanel`: focus moves into the panel on open, Tab/Shift-Tab are
 *     trapped, Escape closes, focus returns to the trigger on close, the
 *     backdrop catches pointer events, and body scroll is locked. `role=dialog`
 *     + `aria-modal` + a label are set. `prefers-reduced-motion` is honoured by
 *     the global cascade in `10-base.css` (collapses all transitions), so the
 *     slide-in needs no local guard.
 */

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { TYPE_TO_ROUTE } from "@/lib/entity/types";

/** Route prefixes the panel treats as "another entity" → in-panel replace-nav. */
const ENTITY_PREFIXES = Object.values(TYPE_TO_ROUTE);

function isEntityHref(href: string): boolean {
  return ENTITY_PREFIXES.some(
    (p) => href === p || href.startsWith(`${p}/`),
  );
}

export default function EntityPanel({
  title,
  canonicalHref,
  children,
}: {
  /** Entity name — labels the dialog for assistive tech. */
  title: string;
  /** Same URL the panel shows; the header link hard-navigates to the full page. */
  canonicalHref: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  /** The element focused right before the panel opened, restored on close. */
  const triggerRef = useRef<HTMLElement | null>(null);

  function handleClose() {
    // Restore focus synchronously while the trigger is still mounted (the
    // underlying page stays mounted under the modal slot), then unwind the
    // push that opened the panel.
    triggerRef.current?.focus({ preventScroll: true });
    router.back();
  }

  // Capture the trigger + move initial focus into the panel; trap Tab focus and
  // close on Escape. Mirrors DetailPanel's keyboard contract.
  useEffect(() => {
    const root = panelRef.current;
    if (!root) return;

    const active = document.activeElement;
    triggerRef.current = active instanceof HTMLElement ? active : null;

    const closeBtn = root.querySelector<HTMLButtonElement>(
      "[data-entity-panel-close]",
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

  // Flat panel: rewrite an in-panel click on another entity to replace-nav, so
  // hops don't stack history (capture phase runs before <Link>'s own handler;
  // marking the event defaultPrevented makes Next skip its push). Book/external
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
    // The "open full page" affordance opts out → browser does the hard nav.
    if (anchor.dataset.entityHardnav !== undefined) return;
    if (anchor.target && anchor.target !== "_self") return;
    const href = anchor.getAttribute("href");
    if (!href || !isEntityHref(href)) return;
    e.preventDefault();
    router.replace(href);
  }

  const titleId = "entity-panel-title";

  return (
    <div className="entity-panel-root" data-entity-panel>
      <div
        className="entity-panel-backdrop"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className="entity-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClickCapture={onClickCapture}
      >
        <div className="entity-panel__bar">
          <a
            className="entity-panel__expand"
            href={canonicalHref}
            data-entity-hardnav
          >
            Open full page ↗
          </a>
          <button
            data-entity-panel-close
            type="button"
            className="entity-panel__close"
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {/* Visually-hidden accessible name for the dialog (the visible <h1>
            lives inside EntityView; this keeps the label stable + decoupled). */}
        <span id={titleId} className="entity-panel__a11y-title">
          {title}
        </span>
        <div className="entity-panel__scroll">{children}</div>
      </div>
    </div>
  );
}
