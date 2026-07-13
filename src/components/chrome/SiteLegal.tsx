import Link from "next/link";

/* SiteLegal — tiny fixed Imprint/Privacy/Artwork links pinned under
   the media player in the bottom-left corner: the desktop immersive surfaces
   (map, timeline, entity pages) carry neither ArchiveFooter nor the burger,
   so this row is the site-wide guarantee that the legal pages stay one click
   away. Provisional until a designed slot exists (rail foot / entity
   footer). Hidden via CSS on /login (which has its own legal line) and
   ≤760px, where the burger menu carries the links. */
export default function SiteLegal() {
  return (
    <nav className="site-legal" aria-label="Legal" lang="en">
      <Link href="/imprint">Imprint</Link>
      <span aria-hidden>·</span>
      <Link href="/privacy">Privacy</Link>
      <span aria-hidden>·</span>
      <Link href="/artwork">Artwork</Link>
    </nav>
  );
}
