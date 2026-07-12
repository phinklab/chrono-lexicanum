"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

/**
 * Auto-opens an entity overlay over the compendium directory. The universal
 * search's faction/primarch pick lands on `/compendium/<category>?focus=<id>`;
 * the directory page resolves that id to the row's detail `href` and renders this
 * island. On mount it triggers a navigation to that href (e.g. `/faction/<id>`,
 * `/character/<id>`), which the root `@modal` intercept turns into the in-context
 * popup — exactly as clicking a directory row would.
 *
 * It drives a hidden, real Next `<Link>` and clicks it programmatically rather
 * than calling `router.push` directly: clicking a `<Link>` is the *same* code
 * path a directory row takes (which is known to open the overlay), so the
 * intercept fires reliably — a bare `router.push` from a mount effect that runs
 * the instant the host page settles can race the navigation and skip the
 * intercept, landing on the full page instead of the popup. A `<Link>` push (not
 * replace) means the modal's Back lands on THIS directory, not the page the
 * visitor searched from. Fires once per mount (ref guard) so closing the popup
 * doesn't immediately reopen it.
 */
export default function CompendiumFocusOpener({ href }: { href: string }) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    // Defer to the next frame so the host navigation (search → this directory)
    // has fully committed before we click into the intercepted route.
    const id = requestAnimationFrame(() => linkRef.current?.click());
    return () => cancelAnimationFrame(id);
  }, [href]);

  return (
    <Link
      ref={linkRef}
      href={href}
      aria-hidden
      tabIndex={-1}
      style={{ display: "none" }}
    >
      Open
    </Link>
  );
}
