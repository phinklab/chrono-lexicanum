import Link from "next/link";

export default function IngestRunNotFound() {
  return (
    <main className="ingest-detail-shell">
      <Link href="/ingest" className="ingest-back-link">
        <span aria-hidden>←</span>
        <span>All runs</span>
      </Link>
      <header className="ingest-detail-header">
        <span className="ingest-card-kicker ingest-card-kicker-error">404</span>
        <h1 className="ingest-detail-title">Run not found</h1>
        <p className="ingest-sub">
          This run-ID does not exist in the committed diff directory. The run
          may have been removed or the URL may be mistyped.
        </p>
      </header>
    </main>
  );
}
