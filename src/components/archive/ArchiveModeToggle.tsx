import Link from "next/link";

/**
 * Archive register switch — WORKS | PODCASTS, the fork between the archive's
 * two pillars. Session 142 (maintainer feedback): the fixed bottom-right
 * micro-pill was too quiet — the switch now sits INLINE in the controls row
 * under the search console (the row that carries Faction/Format/Sort on
 * /archive), in the house pill grammar one size up from the sort pills, the
 * active register in gold. Two real links instead of client state: the URL is
 * the mode (shareable, back-button-safe) and the podcast pages keep their ISR
 * shells. The rendering page passes its own mode — no usePathname island.
 */
export default function ArchiveModeToggle({
  active,
}: {
  active: "books" | "podcasts";
}) {
  return (
    <nav className="archive-mode" aria-label="Archive register">
      <span className="archive-mode__lab" aria-hidden>
        REGISTER
      </span>
      <Link
        href="/archive"
        className={`archive-mode__opt${active === "books" ? " is-selected" : ""}`}
        aria-current={active === "books" ? "page" : undefined}
      >
        WORKS
      </Link>
      <Link
        href="/archive/podcasts"
        className={`archive-mode__opt${active === "podcasts" ? " is-selected" : ""}`}
        aria-current={active === "podcasts" ? "page" : undefined}
      >
        PODCASTS
      </Link>
    </nav>
  );
}
