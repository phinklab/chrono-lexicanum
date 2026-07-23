"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { NAV_GROUPS } from "./navEntries";

/**
 * SiteMenu — global burger button + full-screen navigation overlay, mounted in
 * the root layout. This is the ONLY global navigation.
 *
 * The overlay stays MOUNTED and toggles `.is-open` so the CSS opacity /
 * stagger transitions run both ways; while closed it is `aria-hidden` + `inert`
 * (out of the tab order, no trap needed). While open: body scroll-lock, a
 * Tab wrap across burger + menu links (DetailModal pattern), and `inert` on
 * every body-level sibling — the wrap covers keyboard, but without `inert` the
 * page behind the full-screen overlay stays click- and AT-reachable. Escape
 * closes and returns focus to the burger. Link clicks close immediately
 * (covers the same-route click, where the pathname effect would never fire).
 */

/**
 * The overlay keeps "Home" deliberately: the top-left wordmark was retired
 * 2026-07-08 with exactly this menu as the designated Home carrier, and the
 * BrandBeacon only fades in after scrolling. The tool set + grouping come
 * from navEntries.ts (shared with the desktop rail, Session 255); here the
 * groups wear their quiet labels and every entry carries its descriptive
 * gloss.
 */
const HOME_ENTRY = { label: "Home", sub: "The front door", href: "/" } as const;

/** Per-item stagger index consumed by 43-site-menu.css (`--sm-i`) — replaces
 *  the old hardcoded nth-child delay ladder, which had already fallen behind
 *  the entry count. */
function indexVar(i: number): CSSProperties {
  return { "--sm-i": i } as CSSProperties;
}

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

  // While open, make the page behind the overlay inert (DetailModal pattern).
  // The burger and the menu itself stay live; siblings that are already inert
  // keep their owners' state (release restores only what this effect set).
  useEffect(() => {
    if (!open) return;
    const burger = burgerRef.current;
    const menu = menuRef.current;
    const made: HTMLElement[] = [];
    for (const el of Array.from(document.body.children)) {
      if (
        el instanceof HTMLElement &&
        !(burger && el.contains(burger)) &&
        !(menu && el.contains(menu)) &&
        !el.inert
      ) {
        el.inert = true;
        made.push(el);
      }
    }
    return () => {
      for (const el of made) el.inert = false;
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
          <ul className="site-menu__list" aria-label="Home">
            <li className="site-menu__item" style={indexVar(0)}>
              <Link href={HOME_ENTRY.href} onClick={() => setOpen(false)}>
                <span className="site-menu__text">
                  <span className="site-menu__name">{HOME_ENTRY.label}</span>
                  <span className="site-menu__desc">{HOME_ENTRY.sub}</span>
                </span>
              </Link>
            </li>
          </ul>
          {(() => {
            let index = 1;
            return NAV_GROUPS.map((group) => (
              <div key={group.name} className="site-menu__band">
                <p className="site-menu__group" aria-hidden>
                  {group.name}
                </p>
                <ul className="site-menu__list" aria-label={group.name}>
                  {group.entries.map((e) => {
                    const i = index++;
                    return (
                      <li
                        key={e.href}
                        className="site-menu__item"
                        style={indexVar(i)}
                      >
                        <Link href={e.href} onClick={() => setOpen(false)}>
                          <span className="site-menu__text">
                            <span className="site-menu__name">{e.label}</span>
                            <span className="site-menu__desc">{e.sub}</span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ));
          })()}
          {/* Legal links: the burger is the only chrome on the immersive
              surfaces (map/timeline/entities), so on touch/narrow viewports
              this row is what keeps Imprint + Privacy + Artwork
              reachable from every page. */}
          <div className="site-menu__legal" lang="en">
            <Link href="/imprint" onClick={() => setOpen(false)}>
              Imprint
            </Link>
            <span aria-hidden>·</span>
            <Link href="/privacy" onClick={() => setOpen(false)}>
              Privacy
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
