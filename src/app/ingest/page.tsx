import type { Metadata } from "next";
import Link from "next/link";

import {
  type DiffListEntry,
  type DiffSummary,
  listDiffFiles,
} from "@/lib/ingestion/diff-reader";

export const metadata: Metadata = {
  title: "Ingestion-Läufe — Chrono Lexicanum",
  description:
    "Read-only Inspektor für die committed Diff-Files der Bulk-Backfill-Pipeline.",
};

/**
 * Phase 3.5 — Ingestion-Dashboard (read-only Diff-Inspector).
 *
 * Server Component, default SSG. Liest committed Diff-Files aus
 * `ingest/.last-run/*.diff.json` und rendert chronologische Summary-Cards
 * (neuester zuerst). Drill-down auf `/ingest/[runId]`. Datenquelle ist
 * Filesystem — Updates werden sichtbar nach `git push` + Vercel-Re-build.
 */
export default async function IngestPage() {
  const entries = await listDiffFiles();
  const okCount = entries.filter((e) => e.kind === "ok").length;
  const errCount = entries.length - okCount;

  return (
    <main className="ingest-shell">
      <header className="ingest-header">
        <p className="ingest-eyebrow">
          <span aria-hidden>{"// Ingestion-Console"}</span>
          <span className="ingest-eyebrow-dot" aria-hidden />
          <span aria-hidden>
            {entries.length === 0
              ? "Roster leer"
              : `${entries.length} Läufe${errCount > 0 ? ` (${errCount} defekt)` : ""}`}
          </span>
        </p>
        <h1 className="ingest-title">Ingestion-Läufe</h1>
        <p className="ingest-sub">
          Diff-Inspektor für die Bulk-Backfill-Pipeline. Jeder Lauf produziert ein
          committed JSON unter <code>ingest/.last-run/</code>; diese Seite rendert
          die zusammengefassten Counter pro Lauf, Drill-down zeigt jedes Buch mit
          Source-Origins, LLM-Anreicherung und Plausibilitäts-Befunden.
        </p>
      </header>

      {entries.length === 0 ? (
        <EmptyState />
      ) : (
        <ol className="ingest-runs" aria-label="Ingestion-Läufe, neuester zuerst">
          {entries.map((entry) => (
            <li key={entry.kind === "ok" ? entry.summary.runId : entry.error.runId}>
              {entry.kind === "ok" ? (
                <RunCard summary={entry.summary} />
              ) : (
                <ErrorCard entry={entry} />
              )}
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}

function EmptyState() {
  return (
    <section className="ingest-empty" aria-label="Keine Ingestion-Läufe vorhanden">
      <p className="ingest-empty-headline">Noch keine Ingestion-Läufe.</p>
      <p className="ingest-empty-body">
        Lokal ausführen mit <code>npm run ingest:backfill -- --dry-run --limit N</code>;
        der erste committed Diff in <code>ingest/.last-run/</code> erscheint nach
        Push und Vercel-Re-Deploy hier.
      </p>
    </section>
  );
}

function ErrorCard({ entry }: { entry: Extract<DiffListEntry, { kind: "error" }> }) {
  return (
    <article className="ingest-card ingest-card-error" aria-label={`Defekter Diff ${entry.error.filename}`}>
      <header className="ingest-card-head">
        <span className="ingest-card-kicker ingest-card-kicker-error">Diff defekt</span>
        <code className="ingest-card-runid">{entry.error.runId}</code>
      </header>
      <p className="ingest-card-error-msg">
        <span className="ingest-mono">{entry.error.filename}</span> — {entry.error.error}
      </p>
    </article>
  );
}

function RunCard({ summary }: { summary: DiffSummary }) {
  const c = summary.counts;
  const total = c.added + c.updated + c.skipped_manual + c.skipped_unchanged;

  return (
    <Link href={`/ingest/${summary.runId}`} className="ingest-card" prefetch={false}>
      <span className="mt-corner tl" aria-hidden />
      <span className="mt-corner tr" aria-hidden />
      <span className="mt-corner bl" aria-hidden />
      <span className="mt-corner br" aria-hidden />

      <header className="ingest-card-head">
        <div className="ingest-card-head-main">
          <span className="ingest-card-kicker">Backfill</span>
          <code className="ingest-card-runid">{summary.runId}</code>
          <time className="ingest-card-time" dateTime={summary.ranAt}>
            {formatTimestamp(summary.ranAt)}
          </time>
        </div>
        <div className="ingest-card-head-right">
          {summary.llmModel ? (
            <span className="ingest-card-model" title={`PromptVersion ${summary.llmPromptVersion ?? "?"}`}>
              <span className="ingest-card-model-name">{summary.llmModel}</span>
              {summary.llmCostSummary ? (
                <span className="ingest-card-cost">${summary.llmCostSummary.estUsdCost.toFixed(2)}</span>
              ) : null}
            </span>
          ) : (
            <span className="ingest-card-no-llm">kein LLM-Step</span>
          )}
        </div>
      </header>

      <dl className="ingest-counts">
        <Counter label="entdeckt" value={summary.discovered} muted />
        <Counter label="added" value={c.added} accent="lum" />
        <Counter label="updated" value={c.updated} accent={c.updated > 0 ? "amber" : undefined} />
        <Counter label="skipped (manual)" value={c.skipped_manual} muted />
        <Counter label="skipped (unchg.)" value={c.skipped_unchanged} muted />
        <Counter label="conflicts" value={c.field_conflicts} accent={c.field_conflicts > 0 ? "amber" : undefined} />
        <Counter label="errors" value={c.errors} accent={c.errors > 0 ? "chaos" : undefined} />
        <Counter label="LLM-flags" value={c.llm_flags} accent={c.llm_flags > 0 ? "gold" : undefined} />
      </dl>

      <footer className="ingest-card-foot">
        <div className="ingest-card-sources" aria-label="Aktive Quellen">
          {summary.activeSources.map((s) => (
            <span key={s} className="ingest-source-pill">{s}</span>
          ))}
        </div>
        <span className="ingest-card-arrow" aria-hidden>→</span>
        <span className="ingest-card-cta" aria-hidden>
          {total > 0 ? `${total} Einträge im Drill-down` : "leerer Lauf"}
        </span>
      </footer>
    </Link>
  );
}

function Counter({
  label,
  value,
  accent,
  muted,
}: {
  label: string;
  value: number;
  accent?: "lum" | "amber" | "chaos" | "gold";
  muted?: boolean;
}) {
  const cls = accent
    ? `ingest-counter ingest-counter-${accent}`
    : muted
      ? "ingest-counter ingest-counter-muted"
      : "ingest-counter";
  return (
    <div className={cls}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function formatTimestamp(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  // dd.mm.yyyy HH:MM UTC; deutsche Site
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${yyyy} ${hh}:${mi} UTC`;
}
