"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { factionDot } from "@/lib/faction-colors";
import type { WerkeRow } from "@/lib/atlas/queries";
import SearchBox from "./SearchBox";

interface EntityTableProps {
  rows: ReadonlyArray<WerkeRow>;
  totalRows: number;
  auditMode: boolean;
}

function formatRelative(date: Date, now: Date): string {
  const diffMs = now.getTime() - date.getTime();
  const sec = Math.max(0, Math.round(diffMs / 1000));
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  if (sec < 30) return "gerade eben";
  if (min < 1) return `vor ${sec} s`;
  if (hr < 1) return `vor ${min} Min.`;
  if (day < 1) return `vor ${hr} Std.`;
  if (day < 7) return `vor ${day} Tag${day === 1 ? "" : "en"}`;
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(date);
}

function formatConfidence(value: string | null): string {
  if (value === null) return "—";
  return Number(value).toFixed(2);
}

export default function EntityTable({ rows, totalRows, auditMode }: EntityTableProps) {
  const [q, setQ] = useState("");
  const [now] = useState(() => new Date());

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (needle.length === 0) return rows;
    return rows.filter((r) => {
      if (r.title.toLowerCase().includes(needle)) return true;
      if (r.slug.toLowerCase().includes(needle)) return true;
      if (r.authors.some((a) => a.toLowerCase().includes(needle))) return true;
      if (r.primaryFaction && r.primaryFaction.toLowerCase().includes(needle)) return true;
      if (r.eraName && r.eraName.toLowerCase().includes(needle)) return true;
      if (r.externalBookId && r.externalBookId.toLowerCase().includes(needle)) return true;
      return false;
    });
  }, [rows, q]);

  const resultLabel = q.trim().length === 0
    ? `${filtered.length} / ${totalRows}`
    : `${filtered.length} matches · ${rows.length} visible · ${totalRows} total`;

  return (
    <div className="atlas-table">
      <SearchBox
        value={q}
        onChange={setQ}
        placeholder="By title, author, slug, faction, era, SSOT-ID…"
        label="SEARCH"
        resultLabel={resultLabel}
      />

      {filtered.length === 0 ? (
        <div className="atlas-table__empty c-glass c-corners">
          No matches in this audit/search combination.
        </div>
      ) : (
        <ol className="atlas-table__list">
          {filtered.map((row, i) => (
            <EntityRow key={row.id} row={row} index={i} now={now} auditMode={auditMode} />
          ))}
        </ol>
      )}
    </div>
  );
}

function EntityRow({
  row,
  index,
  now,
  auditMode,
}: {
  row: WerkeRow;
  index: number;
  now: Date;
  auditMode: boolean;
}) {
  const detailHref = auditMode ? `/buch/${row.slug}/audit` : `/buch/${row.slug}`;
  const dot = factionDot(row.primaryFaction);
  const chips: Array<{ id: string; label: string; tone: "audit" | "ssot" | "mute" }> = [];
  if (row.hasDrift) chips.push({ id: "drift", label: `DRIFT ${row.driftCount}`, tone: "audit" });
  if (row.hasJunctionGap) chips.push({ id: "gap", label: "GAP", tone: "audit" });
  if (row.isSsot) chips.push({ id: "ssot", label: "SSOT", tone: "ssot" });
  if (row.isInMultipleCollections)
    chips.push({ id: "coll", label: `×${row.containedIn.length}`, tone: "audit" });
  if (chips.length === 0) chips.push({ id: "ok", label: "—", tone: "mute" });

  return (
    <li className="atlas-table__row">
      <Link href={detailHref} className="atlas-table__row-link c-glass">
        <span className="atlas-table__idx">{String(index + 1).padStart(3, "0")}</span>
        <span
          className="atlas-table__dot"
          aria-hidden
          style={{ background: dot }}
          title={row.primaryFaction ?? "Unklassifiziert"}
        />
        <div className="atlas-table__title">
          <span className="atlas-table__name">{row.title}</span>
          <span className="atlas-table__meta">
            {row.authors.length > 0 ? row.authors.join(", ") : "—"}
            {row.externalBookId && (
              <>
                <span className="atlas-table__sep" aria-hidden>
                  ·
                </span>
                <span className="atlas-table__id">{row.externalBookId}</span>
              </>
            )}
          </span>
        </div>
        <span className="atlas-table__faction" title={row.primaryFaction ?? undefined}>
          {row.primaryFaction ?? "—"}
        </span>
        <span className="atlas-table__era">{row.eraName ?? "—"}</span>
        <span className="atlas-table__year">{row.releaseYear ?? "—"}</span>
        <span className="atlas-table__junc" aria-label="Junctions">
          <span>f:{row.factionCount}</span>
          <span>l:{row.locationCount}</span>
          <span>c:{row.characterCount}</span>
        </span>
        <span className="atlas-table__chips">
          {chips.map((c) => (
            <span
              key={c.id}
              className={`atlas-table__chip atlas-table__chip--${c.tone}`}
            >
              {c.label}
            </span>
          ))}
        </span>
        <span className="atlas-table__prov" title={`Source · ${row.sourceKind}`}>
          {row.sourceKind} · {formatConfidence(row.confidence)}
        </span>
        <time
          className="atlas-table__time"
          dateTime={row.updatedAt.toISOString()}
          title={row.updatedAt.toLocaleString("de-DE")}
        >
          {formatRelative(row.updatedAt, now)}
        </time>
        <span className="atlas-table__chevron" aria-hidden>
          ›
        </span>
      </Link>
    </li>
  );
}
