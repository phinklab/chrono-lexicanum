/* Imprimatur foot (Report 141, accepted idea C1-1) — the closing seal of the
   new design language: Terminus line, fleur seal, mono triad. The middle motto
   is per page; the outer slots stay honest (no pseudo-telemetry stamps). */

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
    </footer>
  );
}
