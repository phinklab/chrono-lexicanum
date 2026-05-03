import Link from "next/link";

export default function IngestRunNotFound() {
  return (
    <main className="ingest-detail-shell">
      <Link href="/ingest" className="ingest-back-link">
        <span aria-hidden>←</span>
        <span>Alle Läufe</span>
      </Link>
      <header className="ingest-detail-header">
        <span className="ingest-card-kicker ingest-card-kicker-error">404</span>
        <h1 className="ingest-detail-title">Lauf nicht gefunden</h1>
        <p className="ingest-sub">
          Diese Run-ID existiert nicht im committed Diff-Verzeichnis. Möglicherweise wurde der
          Lauf entfernt oder die URL ist falsch geschrieben.
        </p>
      </header>
    </main>
  );
}
