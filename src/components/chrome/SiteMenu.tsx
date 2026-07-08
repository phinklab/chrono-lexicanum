"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * SiteMenu — global burger button + full-screen navigation overlay, mounted in
 * the root layout. This is the ONLY global navigation.
 *
 * The overlay stays MOUNTED and toggles `.is-open` so the CSS opacity /
 * stagger transitions run both ways; while closed it is `aria-hidden` + `inert`
 * (out of the tab order, no trap needed). While open: body scroll-lock and a
 * Tab wrap across burger + menu links (DetailModal pattern) keep keyboard focus
 * from reaching the locked page behind; Escape closes and returns focus to the
 * burger. Link clicks close immediately (covers the same-route click, where the
 * pathname effect would never fire).
 */

const ENTRIES = [
  { num: "I", label: "Home", href: "/" },
  { num: "II", label: "Archive", href: "/archive" },
  { num: "III", label: "Compendium", href: "/compendium" },
  { num: "IV", label: "Ask", href: "/ask" },
  { num: "V", label: "Chronicle", href: "/timeline" },
  { num: "VI", label: "Cartographer", href: "/map" },
] as const;

export default function SiteMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const burgerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);

  // Close when navigation actually happens (soft-nav from a menu link or any
  // other route change while the menu is open).
  const prevPath = useRef(pathname);
  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      setOpen(false);
    }
  }, [pathname]);

  // Escape close + Tab wrap while open. Focusables = burger (stays on top of
  // the overlay, morphed to ×) followed by the menu links.
  useEffect(() => {
    if (!open) return;

    function getFocusable(): HTMLElement[] {
      const links = menuRef.current
        ? Array.from(menuRef.current.querySelectorAll<HTMLElement>("[href]"))
        : [];
      return burgerRef.current ? [burgerRef.current, ...links] : links;
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        burgerRef.current?.focus();
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
  }, [open]);

  // Lock body scroll while open (DetailModal pattern) so the page behind the
  // overlay doesn't drift under wheel/touch.
  useEffect(() => {
    if (!open) return;
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, [open]);

  // The login gate stands outside the archive — no burger/overlay there. Placed
  // after the hooks above so the early return doesn't break the rules of hooks.
  if (pathname === "/login") return null;

  return (
    <>
      <button
        ref={burgerRef}
        type="button"
        className={`site-burger${open ? " is-open" : ""}`}
        aria-expanded={open}
        aria-controls="site-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="site-burger__icon" aria-hidden>
          <span className="site-burger__line" />
          <span className="site-burger__line" />
        </span>
        <span className="site-burger__label" aria-hidden>
          {open ? "CLOSE" : "MENU"}
        </span>
      </button>

      <nav
        id="site-menu"
        ref={menuRef}
        className={`site-menu${open ? " is-open" : ""}`}
        aria-label="Site navigation"
        aria-hidden={!open}
        inert={!open}
      >
        <div className="site-menu__inner">
          <div className="site-menu__head">CHRONICA · NAVIGATIO</div>
          <ul className="site-menu__list">
            {ENTRIES.map((e) => (
              <li key={e.href} className="site-menu__item">
                <Link href={e.href} onClick={() => setOpen(false)}>
                  <span className="site-menu__num">{e.num}</span>
                  <span className="site-menu__name">{e.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="site-menu__foot">TERRA STANDARD · M42.347</div>
          {/* Legal links: the burger is the only chrome on the immersive
              surfaces (map/timeline/entities), so on touch/narrow viewports
              this row is what keeps Impressum + Datenschutz + Artwork
              reachable from every page. */}
          <div className="site-menu__legal">
            <Link href="/imprint" onClick={() => setOpen(false)}>
              Impressum
            </Link>
            <span aria-hidden>·</span>
            <Link href="/privacy" onClick={() => setOpen(false)}>
              Datenschutz
            </Link>
            <span aria-hidden>·</span>
            <Link href="/artwork" onClick={() => setOpen(false)}>
              Artwork
            </Link>
          </div>
        </div>
        <div className="site-menu__grain" aria-hidden />
      </nav>
    </>
  );
}
