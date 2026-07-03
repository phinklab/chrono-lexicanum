import Link from "next/link";

/**
 * Archive register doors — Books | Podcasts, the fork between the archive's
 * two pillars as the first and largest element of the nave (Brief 184). Two
 * real links instead of client state: the URL is the mode (shareable,
 * back-button-safe) and the podcast pages keep their ISR shells. The active
 * door carries the Sternwarte dot in its kicker. Pages pass their own mode
 * plus the honest holdings line per door.
 *
 * `scroll={false}` + `prefetch={true}`: switching registers is a view swap,
 * not a journey. The soft nav keeps the reader at the same scroll depth (both
 * pages share the hero/doors anatomy, so the doors stay under the cursor while
 * the register beneath them changes), and the full-route prefetch means the
 * other register is already in the router cache when clicked (production;
 * prefetch is disabled in dev). Cold/slow switches fall back to the
 * jump-proof cogitator screen (archive/loading.tsx).
 */
export default function ArchiveModeToggle({
  active,
  booksLine,
  podcastsLine,
}: {
  active: "books" | "podcasts";
  booksLine?: string;
  podcastsLine?: string;
}) {
  return (
    <nav className="arch-doors reveal" aria-label="Archive register">
      <Link
        href="/archive"
        scroll={false}
        prefetch={true}
        className={`arch-door${active === "books" ? " is-active" : ""}`}
        aria-current={active === "books" ? "page" : undefined}
      >
        <span className="arch-door__kicker">Archive I</span>
        <span className="arch-door__title">Books</span>
        {booksLine && <span className="arch-door__count">{booksLine}</span>}
      </Link>
      <Link
        href="/archive/podcasts"
        scroll={false}
        prefetch={true}
        className={`arch-door${active === "podcasts" ? " is-active" : ""}`}
        aria-current={active === "podcasts" ? "page" : undefined}
      >
        <span className="arch-door__kicker">Archive II</span>
        <span className="arch-door__title">Podcasts</span>
        {podcastsLine && <span className="arch-door__count">{podcastsLine}</span>}
      </Link>
    </nav>
  );
}
