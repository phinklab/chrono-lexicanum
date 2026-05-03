import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  listValidRunIds,
  loadDiffById,
} from "@/lib/ingestion/diff-reader";
import type {
  AddedEntry,
  DiffFieldChange,
  DiffFile,
  DiffLLMFlag,
  ErrorEntry,
  FieldConflictEntry,
  FieldName,
  MergedBook,
  RawLlmPayload,
  SkippedManualEntry,
  SourceName,
  UpdatedEntry,
} from "@/lib/ingestion/types";

interface DetailParams {
  params: Promise<{ runId: string }>;
}

export async function generateStaticParams() {
  const runIds = await listValidRunIds();
  return runIds.map((runId) => ({ runId }));
}

export async function generateMetadata(
  { params }: DetailParams,
): Promise<Metadata> {
  const { runId } = await params;
  return {
    title: `Lauf ${runId} — Ingestion-Läufe — Chrono Lexicanum`,
  };
}

export default async function IngestRunPage({ params }: DetailParams) {
  const { runId } = await params;
  const diff = await loadDiffById(runId);
  if (!diff) notFound();

  const flagsBySlug = groupFlagsBySlug(diff.llm_flags ?? []);
  const conflictsBySlug = groupConflictsBySlug(diff.field_conflicts);
  const knownSlugs = new Set<string>([
    ...diff.added.map((e) => e.slug),
    ...diff.updated.map((e) => e.slug),
    ...diff.skipped_manual.map((e) => e.slug),
  ]);
  const orphanFlags = (diff.llm_flags ?? []).filter(
    (f) => !knownSlugs.has(f.slug),
  );

  return (
    <main className="ingest-detail-shell">
      <Link href="/ingest" className="ingest-back-link">
        <span aria-hidden>←</span>
        <span>Alle Läufe</span>
      </Link>

      <header className="ingest-detail-header">
        <span className="ingest-card-kicker">Backfill-Lauf</span>
        <h1 className="ingest-detail-title">{runId}</h1>
        <RunMeta diff={diff} />
        {!diff.llmModel ? (
          <p className="ingest-detail-no-llm">
            Dieser Lauf wurde ohne LLM-Anreicherung gefahren — keine Synopse-Paraphrase, keine
            Soft-Facets, keine Plausibility-Flags.
          </p>
        ) : null}
      </header>

      <Section title="Added" count={diff.added.length}>
        {diff.added.length === 0 ? (
          <p className="ingest-empty-section">Keine neuen Bücher in diesem Lauf.</p>
        ) : (
          diff.added.map((entry) => (
            <AddedEntryCard
              key={entry.slug}
              entry={entry}
              flags={flagsBySlug.get(entry.slug) ?? []}
            />
          ))
        )}
      </Section>

      {diff.updated.length > 0 ? (
        <Section title="Updated" count={diff.updated.length}>
          {diff.updated.map((entry) => (
            <UpdatedEntryCard
              key={entry.slug}
              entry={entry}
              flags={flagsBySlug.get(entry.slug) ?? []}
            />
          ))}
        </Section>
      ) : null}

      {diff.skipped_manual.length > 0 ? (
        <Section title="Skipped (manual)" count={diff.skipped_manual.length}>
          {diff.skipped_manual.map((entry) => (
            <SkippedManualCard
              key={entry.slug}
              entry={entry}
              flags={flagsBySlug.get(entry.slug) ?? []}
            />
          ))}
        </Section>
      ) : null}

      {diff.skipped_unchanged.length > 0 ? (
        <Section
          title="Skipped (unchanged)"
          count={diff.skipped_unchanged.length}
        >
          <p className="ingest-empty-section">
            Bücher, die in diesem Lauf bestätigt wurden ohne Änderungen:&nbsp;
            {diff.skipped_unchanged.map((e, i) => (
              <span key={e.slug} className="ingest-mono">
                {e.slug}
                {i < diff.skipped_unchanged.length - 1 ? ", " : ""}
              </span>
            ))}
            .
          </p>
        </Section>
      ) : null}

      {conflictsBySlug.standalone.length > 0 ? (
        <Section
          title="Field-Konflikte"
          count={conflictsBySlug.standalone.length}
        >
          <ul className="ingest-conflicts-list">
            {conflictsBySlug.standalone.map((c, idx) => (
              <li key={`${c.slug}-${c.field}-${idx}`} className="ingest-conflict">
                <span className="ingest-mono">{c.slug}</span>
                <span className="ingest-conflict-field">·&nbsp;{c.field}</span>
                {c.sources.map((s) => (
                  <span key={s.source}>
                    <span className="ingest-conflict-source">{s.source}=</span>
                    <span>{formatValue(s.value)}</span>
                    {"  "}
                  </span>
                ))}
              </li>
            ))}
          </ul>
          <p className="ingest-empty-section" style={{ marginTop: 6 }}>
            Konflikte, die zu einem Buch im Diff gehören, sind im jeweiligen
            Drill-down sichtbar; obige sind orphan-conflicts ohne added/updated/
            skipped_manual-Eintrag.
          </p>
        </Section>
      ) : null}

      {diff.errors.length > 0 ? (
        <Section title="Errors" count={diff.errors.length}>
          <ul className="ingest-errors-list">
            {diff.errors.map((e, i) => (
              <li key={`${e.source}-${e.slug ?? e.wikipediaTitle ?? i}-${i}`} className="ingest-error">
                <ErrorRow err={e} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {orphanFlags.length > 0 ? (
        <Section title="LLM-Flags ohne Buch-Eintrag" count={orphanFlags.length}>
          <ul className="ingest-flag-list">
            {orphanFlags.map((f, i) => (
              <li key={`${f.slug}-${f.kind}-${i}`}>
                <FlagCard flag={f} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </main>
  );
}

// =============================================================================
// Run-Header-Meta
// =============================================================================

function RunMeta({ diff }: { diff: DiffFile }) {
  return (
    <dl className="ingest-detail-meta">
      <MetaBlock label="ranAt" value={formatTimestamp(diff.ranAt)} />
      <MetaBlock label="discovery" value={`${diff.discoverySource} · ${diff.discovered} entdeckt`} />
      <MetaBlock label="discoveryPages" value={diff.discoveryPages.join(", ") || "—"} />
      <MetaBlock label="activeSources" value={diff.activeSources.join(", ")} />
      {diff.llmModel ? (
        <MetaBlock label="llmModel" value={diff.llmModel} variant="model" />
      ) : null}
      {diff.llmPromptVersion ? (
        <MetaBlock label="llmPromptVersion" value={diff.llmPromptVersion} />
      ) : null}
      {diff.llmCostSummary ? (
        <>
          <MetaBlock
            label="estUsdCost"
            value={`$${diff.llmCostSummary.estUsdCost.toFixed(3)}`}
            variant="cost"
          />
          <MetaBlock
            label="tokens in/out"
            value={`${formatNumber(diff.llmCostSummary.totalTokensIn)} / ${formatNumber(diff.llmCostSummary.totalTokensOut)}`}
          />
          <MetaBlock
            label="web-searches"
            value={String(diff.llmCostSummary.totalWebSearches)}
          />
        </>
      ) : null}
      {diff.discoveryDuplicates && diff.discoveryDuplicates.length > 0 ? (
        <MetaBlock
          label="discovery duplicates"
          value={String(diff.discoveryDuplicates.length)}
        />
      ) : null}
    </dl>
  );
}

function MetaBlock({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant?: "model" | "cost";
}) {
  const cls =
    variant === "model"
      ? "ingest-meta-value ingest-meta-value-model"
      : variant === "cost"
        ? "ingest-meta-value ingest-meta-value-cost"
        : "ingest-meta-value";
  return (
    <div className="ingest-meta-block">
      <dt className="ingest-meta-label">{label}</dt>
      <dd className={cls}>{value}</dd>
    </div>
  );
}

// =============================================================================
// Section-Wrapper
// =============================================================================

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="ingest-section" aria-label={title}>
      <h2 className="ingest-section-title">
        {title}
        <span className="ingest-section-title-count">{count}</span>
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
    </section>
  );
}

// =============================================================================
// Per-Buch-Cards (added / updated / skipped_manual)
// =============================================================================

function AddedEntryCard({
  entry,
  flags,
}: {
  entry: AddedEntry;
  flags: DiffLLMFlag[];
}) {
  const synopsisField = entry.payload.fields.synopsis;
  return (
    <details className="ingest-entry">
      <summary className="ingest-entry-summary">
        <div className="ingest-entry-summary-left">
          <span className="ingest-entry-kind ingest-entry-kind-added">added</span>
          <span className="ingest-entry-title">{entry.payload.fields.title ?? entry.wikipediaTitle}</span>
          <span className="ingest-entry-slug">{entry.slug}</span>
        </div>
        <div className="ingest-entry-summary-right">
          <SourceBadge source={entry.payload.primarySource} confidence={entry.payload.confidence} />
          {flags.length > 0 ? (
            <span className="ingest-entry-flag-pill">
              {flags.length} flag{flags.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
      </summary>
      <div className="ingest-entry-body">
        <FieldOriginsTable merged={entry.payload} synopsis={synopsisField} />
        <ExternalLinksSection externalUrls={entry.payload.externalUrls} />
        <HardcoverAuditSection raw={entry.rawHardcoverPayload} />
        <LlmPayloadSection raw={entry.rawLlmPayload} />
        <FlagsSection flags={flags} />
      </div>
    </details>
  );
}

function UpdatedEntryCard({
  entry,
  flags,
}: {
  entry: UpdatedEntry;
  flags: DiffLLMFlag[];
}) {
  return (
    <details className="ingest-entry">
      <summary className="ingest-entry-summary">
        <div className="ingest-entry-summary-left">
          <span className="ingest-entry-kind ingest-entry-kind-updated">updated</span>
          <span className="ingest-entry-title">{entry.dbSlug}</span>
          <span className="ingest-entry-slug">slug: {entry.slug}</span>
        </div>
        <div className="ingest-entry-summary-right">
          <span className="ingest-entry-badge">
            {Object.keys(entry.diff).length} Felder geändert
          </span>
          {flags.length > 0 ? (
            <span className="ingest-entry-flag-pill">
              {flags.length} flag{flags.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
      </summary>
      <div className="ingest-entry-body">
        <DiffTable diff={entry.diff} />
        <LlmPayloadSection raw={entry.rawLlmPayload} />
        <FlagsSection flags={flags} />
      </div>
    </details>
  );
}

function SkippedManualCard({
  entry,
  flags,
}: {
  entry: SkippedManualEntry;
  flags: DiffLLMFlag[];
}) {
  const wouldChange = Object.keys(entry.wouldBeDiff).length;
  return (
    <details className="ingest-entry">
      <summary className="ingest-entry-summary">
        <div className="ingest-entry-summary-left">
          <span className="ingest-entry-kind ingest-entry-kind-skipped">skipped (manual)</span>
          <span className="ingest-entry-title">{entry.dbSlug}</span>
          <span className="ingest-entry-slug">slug: {entry.slug}</span>
        </div>
        <div className="ingest-entry-summary-right">
          {wouldChange > 0 ? (
            <span className="ingest-entry-badge">
              {wouldChange} Felder hätten geändert
            </span>
          ) : (
            <span className="ingest-entry-badge">manual identisch</span>
          )}
          {flags.length > 0 ? (
            <span className="ingest-entry-flag-pill">
              {flags.length} flag{flags.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
      </summary>
      <div className="ingest-entry-body">
        {wouldChange > 0 ? <DiffTable diff={entry.wouldBeDiff} /> : null}
        <LlmPayloadSection raw={entry.rawLlmPayload} />
        <FlagsSection flags={flags} />
      </div>
    </details>
  );
}

// =============================================================================
// Per-Buch-Subsections
// =============================================================================

function FieldOriginsTable({
  merged,
  synopsis,
}: {
  merged: MergedBook;
  synopsis: string | undefined;
}) {
  const entries = (Object.keys(merged.fields) as FieldName[])
    .filter((k) => merged.fields[k] !== undefined)
    .sort((a, b) => fieldOrder(a) - fieldOrder(b));
  return (
    <div>
      <h3 className="ingest-subsection-title">Felder + Origins</h3>
      <table className="ingest-fields-table">
        <thead>
          <tr>
            <th>Feld</th>
            <th>Wert</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((field) => {
            const value = merged.fields[field];
            const origin = merged.fieldOrigins[field];
            const isSynopsis = field === "synopsis";
            return (
              <tr key={field}>
                <th scope="row">{field}</th>
                <td className={isSynopsis ? "ingest-fields-value ingest-fields-value-synopsis" : "ingest-fields-value"}>
                  {field === "facetIds" && Array.isArray(value) ? (
                    <FacetPills ids={value as string[]} />
                  ) : isSynopsis ? (
                    synopsis
                  ) : (
                    formatValue(value)
                  )}
                </td>
                <td className="ingest-fields-source">{origin ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FacetPills({ ids }: { ids: string[] }) {
  if (ids.length === 0) return <span className="ingest-mono">—</span>;
  return (
    <ul className="ingest-pill-list">
      {ids.map((id) => (
        <li key={id} className="ingest-pill">{id}</li>
      ))}
    </ul>
  );
}

function ExternalLinksSection({
  externalUrls,
}: {
  externalUrls: MergedBook["externalUrls"];
}) {
  if (!externalUrls || externalUrls.length === 0) return null;
  return (
    <div>
      <h3 className="ingest-subsection-title">External URLs</h3>
      <ul className="ingest-link-list">
        {externalUrls.map((u, i) => (
          <li key={`${u.source}-${i}`}>
            <span className="ingest-link-tag">{u.source}</span>
            <a href={u.url} target="_blank" rel="noreferrer noopener">{u.url}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HardcoverAuditSection({
  raw,
}: {
  raw?: { tags?: string[]; averageRating?: number };
}) {
  if (!raw || ((!raw.tags || raw.tags.length === 0) && raw.averageRating === undefined)) return null;
  return (
    <div>
      <h3 className="ingest-subsection-title">Hardcover-Audit</h3>
      {raw.averageRating !== undefined ? (
        <ul className="ingest-pill-list" style={{ marginBottom: 8 }}>
          <li className="ingest-pill ingest-pill-rating">
            ★ {raw.averageRating.toFixed(2)}
          </li>
        </ul>
      ) : null}
      {raw.tags && raw.tags.length > 0 ? (
        <ul className="ingest-pill-list">
          {raw.tags.map((tag) => (
            <li key={tag} className="ingest-pill">{tag}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function LlmPayloadSection({ raw }: { raw?: RawLlmPayload }) {
  if (!raw || ((!raw.facetIds || raw.facetIds.length === 0) && (!raw.discoveredLinks || raw.discoveredLinks.length === 0))) return null;
  return (
    <div>
      <h3 className="ingest-subsection-title">
        LLM-Payload {raw.model ? <span className="ingest-mono" style={{ color: "var(--color-lum)", fontWeight: "normal", letterSpacing: "0.02em" }}>· {raw.model}</span> : null}
      </h3>
      {raw.facetIds && raw.facetIds.length > 0 ? (
        <>
          <p className="ingest-mono" style={{ fontSize: 11, color: "var(--color-ink-2)", margin: "0 0 4px" }}>
            facetIds (vor Vokab-Filter, inkl. invalid IDs)
          </p>
          <ul className="ingest-pill-list" style={{ marginBottom: 10 }}>
            {raw.facetIds.map((id) => (
              <li key={id} className="ingest-pill">{id}</li>
            ))}
          </ul>
        </>
      ) : null}
      {raw.discoveredLinks && raw.discoveredLinks.length > 0 ? (
        <>
          <p className="ingest-mono" style={{ fontSize: 11, color: "var(--color-ink-2)", margin: "0 0 4px" }}>
            discoveredLinks (Storefront- und Reference-URLs)
          </p>
          <ul className="ingest-link-list">
            {raw.discoveredLinks.map((link, i) => (
              <li key={`${link.url}-${i}`}>
                <span className="ingest-link-tag">{link.serviceHint} · {link.kind}</span>
                <a href={link.url} target="_blank" rel="noreferrer noopener">{link.url}</a>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

function FlagsSection({ flags }: { flags: DiffLLMFlag[] }) {
  if (flags.length === 0) return null;
  return (
    <div>
      <h3 className="ingest-subsection-title">Plausibility-Flags ({flags.length})</h3>
      <ul className="ingest-flag-list">
        {flags.map((f, i) => (
          <li key={`${f.kind}-${f.field ?? "x"}-${i}`}>
            <FlagCard flag={f} hideSlug />
          </li>
        ))}
      </ul>
    </div>
  );
}

function FlagCard({ flag, hideSlug }: { flag: DiffLLMFlag; hideSlug?: boolean }) {
  return (
    <div className="ingest-flag">
      <div className="ingest-flag-head">
        <span className="ingest-flag-kind">{flag.kind}</span>
        {flag.field ? <span className="ingest-flag-field">field: {flag.field}</span> : null}
        {!hideSlug ? <span className="ingest-flag-slug">{flag.slug}</span> : null}
      </div>
      {flag.current !== undefined || flag.suggestion !== undefined || (flag.sources && flag.sources.length > 0) ? (
        <div className="ingest-flag-meta">
          {flag.current !== undefined ? <span>current: {formatValue(flag.current)}</span> : null}
          {flag.suggestion !== undefined ? <span>suggestion: {formatValue(flag.suggestion)}</span> : null}
          {flag.sources && flag.sources.length > 0 ? <span>sources: {flag.sources.join(", ")}</span> : null}
        </div>
      ) : null}
      {flag.reasoning ? <div className="ingest-flag-reasoning">{flag.reasoning}</div> : null}
    </div>
  );
}

function DiffTable({ diff }: { diff: Record<string, DiffFieldChange> }) {
  const fields = Object.keys(diff).sort();
  return (
    <div>
      <h3 className="ingest-subsection-title">Diff (alt → neu)</h3>
      <table className="ingest-diff-table">
        <thead>
          <tr>
            <th>Feld</th>
            <th>alt</th>
            <th>neu</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((f) => {
            const change = diff[f];
            return (
              <tr key={f}>
                <td className="ingest-mono">{f}</td>
                <td className="ingest-diff-old">{formatValue(change.old)}</td>
                <td className="ingest-diff-new">{formatValue(change.new)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ErrorRow({ err }: { err: ErrorEntry }) {
  return (
    <>
      <span className="ingest-error-source">{err.source}</span>
      {err.slug ? <span className="ingest-error-slug">{err.slug}</span> : null}
      {!err.slug && err.wikipediaTitle ? (
        <span className="ingest-error-slug">{err.wikipediaTitle}</span>
      ) : null}
      <span>{err.message}</span>
    </>
  );
}

function SourceBadge({
  source,
  confidence,
}: {
  source: SourceName;
  confidence: number;
}) {
  return (
    <span className="ingest-entry-badge">
      {source} · conf {confidence.toFixed(2)}
    </span>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function groupFlagsBySlug(
  flags: DiffLLMFlag[],
): Map<string, DiffLLMFlag[]> {
  const m = new Map<string, DiffLLMFlag[]>();
  for (const f of flags) {
    const arr = m.get(f.slug) ?? [];
    arr.push(f);
    m.set(f.slug, arr);
  }
  return m;
}

function groupConflictsBySlug(
  conflicts: FieldConflictEntry[],
): { standalone: FieldConflictEntry[] } {
  // Heute werden Field-Conflicts oft mit dem added-Eintrag gepaart, aber das
  // ist nicht in der DiffFile-Type garantiert. Wir zeigen alle Konflikte in
  // einer eigenen Sektion und überlassen dem Reader das Cross-Referencing
  // via slug.
  return { standalone: conflicts };
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) {
    if (v.length === 0) return "[]";
    return JSON.stringify(v);
  }
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function formatNumber(n: number): string {
  return n.toLocaleString("de-DE");
}

function formatTimestamp(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${yyyy} ${hh}:${mi} UTC`;
}

const FIELD_ORDER: FieldName[] = [
  "title",
  "releaseYear",
  "startY",
  "endY",
  "synopsis",
  "coverUrl",
  "seriesId",
  "seriesIndex",
  "isbn13",
  "isbn10",
  "pageCount",
  "format",
  "availability",
  "facetIds",
  "rating",
  "ratingSource",
  "ratingCount",
  "authorNames",
  "factionNames",
  "locationNames",
  "characterNames",
];
function fieldOrder(f: FieldName): number {
  const i = FIELD_ORDER.indexOf(f);
  return i === -1 ? 99 : i;
}
