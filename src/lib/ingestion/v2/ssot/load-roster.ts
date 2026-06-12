/**
 * SSOT roster loader (Brief 058).
 *
 * Reads `scripts/seed-data/book-roster.json` (deterministic output of the 057
 * loader from `Warhammer_Books_SSOT.xlsx`), parses the batch name to identify
 * cluster + slice, and emits a `SsotLoadResult` shaped like the crawl-mode
 * `DiscoveryResult` so `run-batch.ts` can branch on roster source without
 * diverging downstream code.
 *
 * Batch-name grammar: `ssot-<cluster>-<NNN>` where `cluster ∈ {hh, w40k}` and
 * `NNN` is a 1-based 3-digit batch number. Offset within cluster is
 * `(NNN-1) * 10` (fixed step of 10 regardless of `--limit`, so consecutive
 * batch numbers map to non-overlapping slices when run at the default
 * limit). Cluster start within the lex-sorted roster is auto-detected — the
 * "first W40K-NNNN entry" position moves if the maintainer adds/removes HH
 * rows in the Excel.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { RosterBook, RosterFile } from "@/../scripts/seed-data/types";

import type { DiscoveredBook, SsotBookContext, SsotLoadResult } from "../types";

import { rosterBookToDiscovered, rosterBookToSsotContext } from "./adapt";

const ROSTER_PATH = join("scripts", "seed-data", "book-roster.json");

const CLUSTER_PREFIXES = {
  hh: "HH-",
  w40k: "W40K-",
} as const;

type ClusterKey = keyof typeof CLUSTER_PREFIXES;

export interface SsotBatchSpec {
  cluster: ClusterKey;
  batchNumber: number;
  /** Step between consecutive batches within a cluster. Fixed at 10 for the
   *  058+ 10er-batch operational rhythm. */
  stepSize: number;
}

/** Parses `ssot-<cluster>-<NNN>` into a structured spec. Throws on malformed. */
export function parseSsotBatchName(batchName: string): SsotBatchSpec {
  const match = /^ssot-(hh|w40k)-(\d{3})$/.exec(batchName);
  if (!match) {
    throw new Error(
      `invalid SSOT batch name "${batchName}"; expected pattern "ssot-<cluster>-<NNN>" with cluster ∈ {hh, w40k} and NNN a 3-digit number (e.g. "ssot-w40k-001")`,
    );
  }
  const cluster = match[1] as ClusterKey;
  const batchNumber = Number.parseInt(match[2], 10);
  if (!Number.isFinite(batchNumber) || batchNumber < 1) {
    throw new Error(`invalid SSOT batch number in "${batchName}"`);
  }
  return { cluster, batchNumber, stepSize: 10 };
}

export async function loadRoster(): Promise<RosterFile> {
  const path = join(process.cwd(), ROSTER_PATH);
  const raw = await readFile(path, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`roster ${ROSTER_PATH} is not a JSON object — refusing to proceed`);
  }
  const roster = parsed as RosterFile;
  if (roster.schemaVersion !== "1.0") {
    throw new Error(
      `unexpected roster schemaVersion "${roster.schemaVersion}"; loader was built against "1.0"`,
    );
  }
  if (!Array.isArray(roster.books) || roster.books.length === 0) {
    throw new Error(`roster has no books — refusing to proceed`);
  }
  // Element sample: a wrong-shaped file would otherwise type-lie its way into
  // batch slicing (findClusterStart reads externalBookId on every row).
  const first: unknown = roster.books[0];
  if (
    !first ||
    typeof first !== "object" ||
    typeof (first as Record<string, unknown>).externalBookId !== "string" ||
    typeof (first as Record<string, unknown>).title !== "string"
  ) {
    throw new Error(`roster books[0] does not look like a RosterBook — refusing to proceed`);
  }
  return roster;
}

/**
 * Find the 0-based roster index where books with externalBookId beginning
 * with the cluster prefix start. Returns -1 if no such book exists.
 *
 * The roster is lex-sorted by externalBookId, so "HH-" comes before "W40K-"
 * and books in the same cluster are contiguous.
 */
export function findClusterStart(
  books: RosterBook[],
  cluster: ClusterKey,
): number {
  const prefix = CLUSTER_PREFIXES[cluster];
  return books.findIndex((b) => b.externalBookId.startsWith(prefix));
}

export interface SsotBatchSlice {
  books: RosterBook[];
  clusterStart: number;
  offsetInCluster: number;
  globalOffset: number;
  rosterTotal: number;
}

/**
 * Resolve the slice of roster books for a given batch name + limit. Throws
 * if the cluster is empty or the batch number is beyond the cluster's end.
 */
export function resolveSsotBatchSlice(
  roster: RosterFile,
  batchName: string,
  limit: number,
): SsotBatchSlice {
  const spec = parseSsotBatchName(batchName);
  const clusterStart = findClusterStart(roster.books, spec.cluster);
  if (clusterStart < 0) {
    throw new Error(
      `cluster "${spec.cluster}" (prefix "${CLUSTER_PREFIXES[spec.cluster]}") not present in roster — Excel may have been edited`,
    );
  }
  const offsetInCluster = (spec.batchNumber - 1) * spec.stepSize;
  const globalOffset = clusterStart + offsetInCluster;
  if (globalOffset >= roster.books.length) {
    throw new Error(
      `SSOT batch ${batchName} would start at roster index ${globalOffset}, beyond the roster's ${roster.books.length} books`,
    );
  }
  // Bound the slice to the cluster — never let a w40k-NNN batch leak HH books
  // or vice versa. The roster is lex-sorted so cluster boundaries are
  // contiguous; clusterEnd is the index of the first non-cluster book.
  const prefix = CLUSTER_PREFIXES[spec.cluster];
  let clusterEnd = roster.books.length;
  for (let i = clusterStart; i < roster.books.length; i++) {
    if (!roster.books[i].externalBookId.startsWith(prefix)) {
      clusterEnd = i;
      break;
    }
  }
  const sliceEnd = Math.min(globalOffset + limit, clusterEnd);
  const books = roster.books.slice(globalOffset, sliceEnd);
  return {
    books,
    clusterStart,
    offsetInCluster,
    globalOffset,
    rosterTotal: roster.books.length,
  };
}

/**
 * High-level entry point for SSOT-mode Stage 0: load the roster, resolve the
 * batch slice, and produce DiscoveredBook[] + per-slug SsotBookContext map
 * for downstream Stage 1-4 consumption.
 */
export async function loadV2RosterSsot(
  batchName: string,
  limit: number,
): Promise<SsotLoadResult> {
  const roster = await loadRoster();
  const slice = resolveSsotBatchSlice(roster, batchName, limit);
  console.log(
    `[v2-engine] ssot-loader: ${slice.books.length} books for ${batchName}` +
      ` (cluster-start=${slice.clusterStart}, offset-in-cluster=${slice.offsetInCluster}, roster-total=${slice.rosterTotal})`,
  );

  const merged: DiscoveredBook[] = [];
  const ssotContexts = new Map<string, SsotBookContext>();
  for (const rb of slice.books) {
    merged.push(rosterBookToDiscovered(rb));
    ssotContexts.set(rb.slug, rosterBookToSsotContext(rb));
  }

  return {
    merged,
    ssotContexts,
    errors: [],
    ssotSourceFile: ROSTER_PATH,
  };
}
