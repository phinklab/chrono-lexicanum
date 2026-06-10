import Link from "next/link";

/**
 * Archive mode toggle — BOOKS | PODCASTS, fixed bottom-right on every /archive
 * surface (port of the design-export "mode-toggle" pill, Chronicle Timeline.html
 * + chronicle.css §shared chrome). Two real links instead of client state: the
 * URL is the mode (shareable, back-button-safe) and the podcast pages keep their
 * ISR shells. The rendering page passes its own mode — no usePathname island.
 */
export default function ArchiveModeToggle({
  active,
}: {
  active: "books" | "podcasts";
}) {
  return (
    <nav className="archive-toggle" aria-label="Archive view">
      <span className="archive-toggle__lab" aria-hidden>
        VIEW
      </span>
      <div className="archive-toggle__pill">
        <Link
          href="/archive"
          className={`archive-toggle__opt${active === "books" ? " is-selected" : ""}`}
          aria-current={active === "books" ? "page" : undefined}
        >
          BOOKS
        </Link>
        <Link
          href="/archive/podcasts"
          className={`archive-toggle__opt${active === "podcasts" ? " is-selected" : ""}`}
          aria-current={active === "podcasts" ? "page" : undefined}
        >
          PODCASTS
        </Link>
      </div>
    </nav>
  );
}
