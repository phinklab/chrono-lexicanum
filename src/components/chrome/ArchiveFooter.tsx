import Link from "next/link";

/* Archive foot — the closing colophon: the triad over its hairline (middle
   motto per page), then the legal row: short-form Games Workshop IP
   disclaimer plus the Imprint/Privacy/Artwork links (§ 5 DDG / Art. 13
   GDPR — all three pages sit outside the preview gate). The former
   Imprimatur seal (plumb line + seal word + subline) was retired S255. */

export default function ArchiveFooter({ mid }: { mid: string }) {
  return (
    <footer className="lx-foot" lang="en">
      <p className="lx-foot__triad">
        <span>From darkness, knowledge</span>
        <span className="lx-foot__mid">{mid}</span>
        <span>Fan-made · Non-commercial</span>
      </p>
      <div className="lx-foot__legal">
        <p className="lx-foot__ip">
          Unofficial fan project, not endorsed by Games Workshop. Warhammer
          40,000 and all associated marks are property of Games Workshop
          Limited.
        </p>
        <nav className="lx-foot__law" aria-label="Legal">
          <Link href="/imprint">Imprint</Link>
          <span className="lx-foot__law-sep" aria-hidden>
            ·
          </span>
          <Link href="/privacy">Privacy</Link>
          <span className="lx-foot__law-sep" aria-hidden>
            ·
          </span>
          <Link href="/artwork">Artwork</Link>
        </nav>
      </div>
    </footer>
  );
}
