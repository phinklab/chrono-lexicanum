import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getIsAdmin } from "@/lib/atlas/auth";
import {
  type DiffListEntry,
  type DiffSummary,
  listDiffFiles,
} from "@/lib/ingestion/diff-reader";
// Route-scoped stylesheet (S7a): the admin ingest console loads only here.
import "@/app/styles/30-ingest.css";

export const metadata: Metadata = {
  title: "Ingestion runs",
  description:
    "Read-only inspector for the committed diff files of the bulk-backfill pipeline.",
  robots: { index: false, follow: false },
};

/**
 * Ingestion dashboard (read-only diff inspector).
 *
 * Server Component, default SSG. Reads committed diff files from
 * `ingest/.last-run/*.diff.json` and renders chronological summary cards
 * (newest first). Drill-down at `/ingest/[runId]`. The data source is the
 * filesystem — updates become visible after `git push` + Vercel re-build.
 */
export default async function IngestPage() {
  // Admin-only: internal ingest logs + raw LLM payloads.
  // The proxy already 401s the route in prod; this in-page gate is the
  // defense-in-depth layer (and makes the page request-rendered, which a
  // per-request gate needs anyway).
  if (!(await getIsAdmin())) notFound();

  const entries = await listDiffFiles();
  const okCount = entries.filter((e) => e.kind === "ok").length;
  const errCount = entries.length - okCount;

  return (
    <main className="ingest-shell">
      <header className="ingest-header">
        <p className="ingest-eyebrow">
          <span aria-hidden>{"Ingestion console"}</span>
          <span className="ingest-eyebrow-dot" aria-hidden />
          <span aria-hidden>
            {entries.length === 0
              ? "Roster empty"
              : `${entries.length} runs${errCount > 0 ? ` (${errCount} broken)` : ""}`}
          </span>
        </p>
        <h1 className="ingest-title">Ingestion runs</h1>
        <p className="ingest-sub">
          Diff inspector for the bulk-backfill pipeline. Each run produces a
          committed JSON under <code>ingest/.last-run/</code>; this page renders
          the aggregated counters per run; drill-down shows each book with
          source origins, LLM enrichment and plausibility findings.
        </p>
      </header>

      {entries.length === 0 ? (
        <EmptyState />
      ) : (
        <ol className="ingest-runs" aria-label="Ingestion runs, newest first">
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
    <section className="ingest-empty" aria-label="No ingestion runs yet">
      <p className="ingest-empty-headline">No ingestion runs yet.</p>
      <p className="ingest-empty-body">
        Run locally with <code>npm run ingest:backfill -- --dry-run --limit N</code>;
        the first committed diff in <code>ingest/.last-run/</code> appears here
        after push and Vercel re-deploy.
      </p>
    </section>
  );
}

function ErrorCard({ entry }: { entry: Extract<DiffListEntry, { kind: "error" }> }) {
  return (
    <article className="ingest-card ingest-card-error" aria-label={`Broken diff ${entry.error.filename}`}>
      <header className="ingest-card-head">
        <span className="ingest-card-kicker ingest-card-kicker-error">Diff broken</span>
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
            <span className="ingest-card-no-llm">no LLM step</span>
          )}
        </div>
      </header>

      <dl className="ingest-counts">
        <Counter label="discovered" value={summary.discovered} muted />
        <Counter label="added" value={c.added} accent="lum" />
        <Counter label="updated" value={c.updated} accent={c.updated > 0 ? "amber" : undefined} />
        <Counter label="skipped (manual)" value={c.skipped_manual} muted />
        <Counter label="skipped (unchg.)" value={c.skipped_unchanged} muted />
        <Counter label="conflicts" value={c.field_conflicts} accent={c.field_conflicts > 0 ? "amber" : undefined} />
        <Counter label="errors" value={c.errors} accent={c.errors > 0 ? "chaos" : undefined} />
        <Counter label="LLM-flags" value={c.llm_flags} accent={c.llm_flags > 0 ? "gold" : undefined} />
      </dl>

      <footer className="ingest-card-foot">
        <div className="ingest-card-sources" aria-label="Active sources">
          {summary.activeSources.map((s) => (
            <span key={s} className="ingest-source-pill">{s}</span>
          ))}
        </div>
        <span className="ingest-card-arrow" aria-hidden>→</span>
        <span className="ingest-card-cta" aria-hidden>
          {total > 0 ? `${total} entries in drill-down` : "empty run"}
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
  // dd.mm.yyyy HH:MM UTC; German site
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${yyyy} ${hh}:${mi} UTC`;
}
