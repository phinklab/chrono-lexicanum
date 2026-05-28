"use client";

/**
 * SubmissionsStatusPills — Task 4D operational-inventory filter shell for
 * `/atlas/submissions`. Owns the client-side status-filter state (ALL +
 * the four `submission_status` enum slots), reports per-status counts on
 * each pill, and forwards the surviving rows to AtlasInventoryTable.
 *
 * The row-build + AtlasInventoryTable wiring live here on purpose: the page
 * component stays a thin server-side fetcher (`getSubmissionsRows` →
 * InventoryPageShell → this), and the filter UI is co-located with the
 * row-shape that actually depends on `SubmissionRow`.
 */
import { useMemo, useState } from "react";
import AtlasInventoryTable, {
  type AtlasInventoryHeader,
  type AtlasInventoryRow,
} from "./AtlasInventoryTable";
import FeatureSignalPill from "./FeatureSignalPill";
import { formatDate, truncate } from "@/lib/atlas/format";
import type {
  SubmissionRow,
  SubmissionStatusValue,
} from "@/lib/atlas/queries";

type StatusFilter = "all" | SubmissionStatusValue;

const STATUS_ORDER: ReadonlyArray<StatusFilter> = [
  "all",
  "pending",
  "approved",
  "rejected",
  "merged",
];

const STATUS_LABEL: Record<StatusFilter, string> = {
  all: "ALL",
  pending: "PENDING",
  approved: "APPROVED",
  rejected: "REJECTED",
  merged: "MERGED",
};

const HEADERS: ReadonlyArray<AtlasInventoryHeader> = [
  { id: "status", label: "STATUS", className: "atlas-inv__c--label" },
  { id: "type", label: "TYPE", className: "atlas-inv__c--meta" },
  { id: "payload", label: "PAYLOAD", className: "atlas-inv__c--title" },
  { id: "submitter", label: "SENDER", className: "atlas-inv__c--meta" },
  { id: "created", label: "CREATED", className: "atlas-inv__c--meta" },
  { id: "signal", label: "FEATURE", className: "atlas-inv__c--signal" },
];

function buildRow(row: SubmissionRow): AtlasInventoryRow {
  return {
    key: row.id,
    haystack: `${row.payloadPreview} ${row.entityType} ${
      row.targetEntityId ?? ""
    } ${row.id} ${row.submittedBy ?? ""} ${row.status}`,
    cells: [
      {
        id: "status",
        className: "atlas-inv__c--label",
        node: row.status.toUpperCase(),
        sortValue: row.status,
      },
      {
        id: "type",
        className: "atlas-inv__c--meta",
        node: row.entityType.toUpperCase(),
        sortValue: row.entityType,
      },
      {
        id: "payload",
        className: "atlas-inv__c--title",
        node: (
          <>
            <span className="atlas-inv__name atlas-inv__name--mono">
              {row.payloadPreview}
            </span>
            <span className="atlas-inv__hint">
              {row.targetEntityId
                ? `→ ${row.targetEntityId}`
                : `id ${row.id.slice(0, 8)}`}
            </span>
          </>
        ),
      },
      {
        id: "submitter",
        className: "atlas-inv__c--meta",
        node: truncate(row.submittedBy, 18),
        sortValue: row.submittedBy ?? undefined,
      },
      {
        id: "created",
        className: "atlas-inv__c--meta",
        node: formatDate(row.createdAt),
        sortValue: row.createdAt.getTime(),
      },
      {
        id: "signal",
        className: "atlas-inv__c--signal",
        node: (
          <FeatureSignalPill
            label="QUEUE"
            tone={row.status === "pending" ? "queue" : "muted"}
          />
        ),
      },
    ],
  };
}

export default function SubmissionsStatusPills({
  rows,
}: {
  rows: ReadonlyArray<SubmissionRow>;
}) {
  const [status, setStatus] = useState<StatusFilter>("all");

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = {
      all: rows.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      merged: 0,
    };
    for (const r of rows) c[r.status]++;
    return c;
  }, [rows]);

  const filtered = useMemo(
    () =>
      status === "all" ? rows : rows.filter((r) => r.status === status),
    [rows, status],
  );

  const tableRows = useMemo(() => filtered.map(buildRow), [filtered]);

  return (
    <>
      <div
        className="atlas-statuspills"
        role="group"
        aria-label="Submissions-Status"
      >
        <span className="atlas-statuspills__label" aria-hidden>
          Status
        </span>
        {STATUS_ORDER.map((s) => {
          const isActive = status === s;
          return (
            <button
              key={s}
              type="button"
              className={`atlas-statuspill${isActive ? " active" : ""}`}
              aria-pressed={isActive}
              onClick={() => setStatus(s)}
            >
              <span>{STATUS_LABEL[s]}</span>
              <span className="atlas-statuspill__count">{counts[s]}</span>
            </button>
          );
        })}
      </div>
      <AtlasInventoryTable
        headers={HEADERS}
        rows={tableRows}
        searchPlaceholder="Filter payload / type / sender…"
        emptyHint={
          rows.length === 0
            ? "No submissions yet."
            : "No matches for this search."
        }
      />
    </>
  );
}
