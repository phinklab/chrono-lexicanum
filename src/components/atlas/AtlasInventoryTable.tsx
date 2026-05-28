"use client";

/**
 * AtlasInventoryTable — generic admin inventory table for Task 4
 * (Admin Data Atlas MVP). Drives the ten Phase-1 inventory pages
 * (`/atlas/fraktionen` … `/atlas/services`). Kept deliberately small:
 * declarative headers, prerendered cells, client-side fulltext filter,
 * client-side ascending/descending sort per opted-in column.
 * `/atlas/werke` is **not** rendered through here — it keeps the bespoke
 * `EntityTable` with audit/drift/SSOT chips.
 *
 * Serialization contract: the table is a Client Component, so every prop
 * must cross the RSC boundary. That rules out the obvious-feeling
 * `columns[].render(row)` shape (functions can't be serialized) — pages
 * therefore prerender each row's cells server-side into ReactNodes and
 * pass a precomputed `haystack` string per row for the filter.
 *
 * Sortable columns: a cell opts in by setting `sortValue` (number or
 * string). The header becomes a button that cycles default → asc → desc
 * → default. Cells without `sortValue` keep their column inert. Numeric
 * vs string comparison is decided per pair; nulls sort last regardless
 * of direction. Default order is whatever the page handed in (server
 * sort).
 *
 * Row click: set `row.href` to make a row linkable. Decks without a public
 * detail surface (sektoren, aeren, serien, personen, submissions, facets,
 * services) just leave `href` undefined per-row; pass `hasHrefColumn`
 * truthy if *any* row has a link so the chevron column reserves space.
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import SearchBox from "./SearchBox";

export interface AtlasInventoryHeader {
  id: string;
  label: string;
  className?: string;
  align?: "start" | "center" | "end";
}

export interface AtlasInventoryCell {
  id: string;
  className?: string;
  align?: "start" | "center" | "end";
  node: React.ReactNode;
  sortValue?: number | string;
}

export interface AtlasInventoryRow {
  key: string;
  haystack: string;
  cells: ReadonlyArray<AtlasInventoryCell>;
  href?: string;
}

export interface AtlasInventoryTableProps {
  headers: ReadonlyArray<AtlasInventoryHeader>;
  rows: ReadonlyArray<AtlasInventoryRow>;
  hasHrefColumn?: boolean;
  searchLabel?: string;
  searchPlaceholder?: string;
  emptyHint?: string;
}

type SortDir = "asc" | "desc";
type SortState = { key: string; dir: SortDir } | null;

function classFor(
  extras: ReadonlyArray<string | undefined | false>,
  align?: "start" | "center" | "end",
): string {
  const parts: string[] = ["atlas-inv__c"];
  for (const x of extras) if (x) parts.push(x);
  if (align) parts.push(`atlas-inv__c--${align}`);
  return parts.join(" ");
}

function compareSortValues(
  a: number | string | undefined,
  b: number | string | undefined,
): number {
  // Nulls / undefined sort last regardless of direction (caller will flip).
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "de");
}

export default function AtlasInventoryTable({
  headers,
  rows,
  hasHrefColumn = false,
  searchLabel = "SEARCH",
  searchPlaceholder = "Filter list…",
  emptyHint = "No matches for this search.",
}: AtlasInventoryTableProps) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortState>(null);

  const sortableHeaderIds = useMemo(() => {
    const ids = new Set<string>();
    for (const row of rows) {
      for (const cell of row.cells) {
        if (cell.sortValue !== undefined) ids.add(cell.id);
      }
    }
    return ids;
  }, [rows]);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const indexed = rows.map((row, idx) => {
      const cell = row.cells.find((c) => c.id === sort.key);
      return { row, idx, sortValue: cell?.sortValue };
    });
    indexed.sort((a, b) => {
      const cmp = compareSortValues(a.sortValue, b.sortValue);
      if (cmp !== 0) return sort.dir === "asc" ? cmp : -cmp;
      // Stable: fall back to original index so equal keys keep server order.
      return a.idx - b.idx;
    });
    return indexed.map((x) => x.row);
  }, [rows, sort]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (needle.length === 0) return sortedRows;
    return sortedRows.filter((row) =>
      row.haystack.toLowerCase().includes(needle),
    );
  }, [sortedRows, q]);

  const resultLabel =
    q.trim().length === 0
      ? `${filtered.length} / ${rows.length}`
      : `${filtered.length} Treffer · ${rows.length} gesamt`;

  function cycleSort(key: string) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  return (
    <div className="atlas-inv">
      <SearchBox
        value={q}
        onChange={setQ}
        placeholder={searchPlaceholder}
        label={searchLabel}
        resultLabel={resultLabel}
      />

      <div className="atlas-inv__head" role="row">
        <span className="atlas-inv__c atlas-inv__c--idx" aria-hidden>
          #
        </span>
        {headers.map((h) => {
          const isSortable = sortableHeaderIds.has(h.id);
          const isActive = sort?.key === h.id;
          const dir = isActive ? sort?.dir : undefined;
          const cls = classFor(
            [
              h.className,
              "atlas-inv__c--head",
              isSortable && "atlas-inv__c--sortable",
              isActive && "atlas-inv__c--sorted",
            ],
            h.align,
          );
          if (!isSortable) {
            return (
              <span key={h.id} className={cls} role="columnheader">
                {h.label}
              </span>
            );
          }
          const ariaSort: "ascending" | "descending" | "none" =
            dir === "asc" ? "ascending" : dir === "desc" ? "descending" : "none";
          return (
            <button
              key={h.id}
              type="button"
              className={cls}
              role="columnheader"
              aria-sort={ariaSort}
              onClick={() => cycleSort(h.id)}
            >
              <span className="atlas-inv__head-label">{h.label}</span>
              <span className="atlas-inv__head-arrow" aria-hidden>
                {dir === "asc" ? "↑" : dir === "desc" ? "↓" : "↕"}
              </span>
            </button>
          );
        })}
        {hasHrefColumn && (
          <span className="atlas-inv__c atlas-inv__c--chev" aria-hidden />
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="atlas-inv__empty c-glass c-corners">{emptyHint}</div>
      ) : (
        <ol className="atlas-inv__list">
          {filtered.map((row, i) => (
            <InventoryRow
              key={row.key}
              row={row}
              index={i}
              hasHrefColumn={hasHrefColumn}
            />
          ))}
        </ol>
      )}
    </div>
  );
}

function InventoryRow({
  row,
  index,
  hasHrefColumn,
}: {
  row: AtlasInventoryRow;
  index: number;
  hasHrefColumn: boolean;
}) {
  const indexLabel = String(index + 1).padStart(3, "0");
  const cells = (
    <>
      <span className="atlas-inv__c atlas-inv__c--idx" aria-hidden>
        {indexLabel}
      </span>
      {row.cells.map((c) => (
        <span key={c.id} className={classFor([c.className], c.align)} role="cell">
          {c.node}
        </span>
      ))}
      {hasHrefColumn && (
        <span className="atlas-inv__c atlas-inv__c--chev" aria-hidden>
          {row.href ? "›" : ""}
        </span>
      )}
    </>
  );

  return (
    <li className="atlas-inv__row" role="row">
      {row.href ? (
        <Link href={row.href} className="atlas-inv__rowlink c-glass">
          {cells}
        </Link>
      ) : (
        <div className="atlas-inv__rowstatic c-glass">{cells}</div>
      )}
    </li>
  );
}
