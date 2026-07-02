import Link from "next/link";

/* Imprimatur foot (Report 141, accepted idea C1-1) — the closing seal of the
   new design language: Terminus line, fleur seal, mono triad. The middle motto
   is per page; the outer slots stay honest (no pseudo-telemetry stamps).
   Brief 179 added the legal row underneath: the short-form Games Workshop IP
   disclaimer plus the Impressum/Datenschutz links (§ 5 DDG / Art. 13 DSGVO —
   both pages sit outside the preview gate). */

export default function ArchiveFooter({ mid }: { mid: string }) {
  return (
    <footer className="lx-foot">
      <div className="lx-foot__seal">
        <span className="lx-foot__aq" aria-hidden>
          ⚜
        </span>
        <span className="lx-foot__l1">Imprimatur</span>
        <span className="lx-foot__l2">
          Archivvm Chronologicvm · Unofficial Fan Archive
        </span>
      </div>
      <div className="lx-foot__triad">
        <span>EX TENEBRIS · COGNITIO</span>
        <span className="lx-foot__mid">{mid}</span>
        <span>FAN-MADE · NON-COMMERCIAL</span>
      </div>
      <div className="lx-foot__legal">
        <p className="lx-foot__ip">
          Unofficial fan project, not endorsed by Games Workshop. Warhammer
          40,000 and all associated marks are property of Games Workshop
          Limited.
        </p>
        <nav className="lx-foot__law" aria-label="Rechtliches">
          <Link href="/imprint">Impressum</Link>
          <span className="lx-foot__law-sep" aria-hidden>
            ·
          </span>
          <Link href="/privacy">Datenschutz</Link>
        </nav>
      </div>
    </footer>
  );
}
