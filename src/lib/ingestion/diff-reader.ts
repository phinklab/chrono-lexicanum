/**
 * Read-only loader for the committed diff files under
 * `ingest/.last-run/*.diff.json`. Consumed by the `/ingest` dashboard.
 *
 * `DiffFile` from `./types.ts` is the single source of truth — no separate
 * type mirror here. Loaders are tolerant of corrupt files (they return an
 * error slot instead of throwing) and of older diffs without LLM fields
 * (`llmModel` etc. stay optional; the UI then gates on "no LLM step").
 */
import { promises as fs } from "node:fs";
import path from "node:path";

import type { DiffFile, SourceName } from "./types";

const DIFF_DIR = path.join(process.cwd(), "ingest", ".last-run");
const DIFF_SUFFIX = ".diff.json";

/**
 * Header form per diff for the list view. Only the fields the summary card
 * needs — avoids loading + JSON-parse memory of all `added[]` /
 * `llm_flags[]` for the list view.
 */
export interface DiffSummary {
  /** Filename without suffix, e.g. `backfill-20260503-2308`. URL-safe. */
  runId: string;
  /** ISO timestamp from the diff (`ranAt`); falls back to the file mtime. */
  ranAt: string;
  discoverySource: DiffFile["discoverySource"];
  discoveryPages: string[];
  activeSources: SourceName[];
  discovered: number;
  counts: {
    added: number;
    updated: number;
    skipped_manual: number;
    skipped_unchanged: number;
    field_conflicts: number;
    errors: number;
    llm_flags: number;
    discoveryDuplicates: number;
  };
  llmModel?: string;
  llmPromptVersion?: string;
  llmCostSummary?: DiffFile["llmCostSummary"];
}

/** Sentinel for files whose JSON parse or schema validation failed. */
export interface DiffSummaryError {
  runId: string;
  filename: string;
  error: string;
}

export type DiffListEntry =
  | { kind: "ok"; summary: DiffSummary }
  | { kind: "error"; error: DiffSummaryError };

/**
 * Sample check of element [0] of a list (empty ⇒ ok). Tripwire against
 * writer-schema drift — that corrupts all elements uniformly, so one sample
 * suffices. Deliberately NO full validation of every row and no Zod schema:
 * that would be exactly the type mirror of `DiffFile` this module rules out
 * by invariant (see header).
 */
function sampleOk(arr: unknown[], check: (el: Record<string, unknown>) => boolean): boolean {
  if (arr.length === 0) return true;
  const el: unknown = arr[0];
  if (!el || typeof el !== "object") return false;
  return check(el as Record<string, unknown>);
}

function isDiffFileLike(value: unknown): value is DiffFile {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  const { added, updated, field_conflicts } = v;
  if (
    typeof v.ranAt !== "string" ||
    !Array.isArray(added) ||
    !Array.isArray(updated) ||
    !Array.isArray(v.skipped_manual) ||
    !Array.isArray(v.skipped_unchanged) ||
    !Array.isArray(field_conflicts) ||
    !Array.isArray(v.errors)
  ) {
    return false;
  }
  // Checks exactly what the detail view dereferences non-optionally
  // (added[].payload, updated[].diff, field_conflicts[].sources).
  return (
    sampleOk(added, (e) => typeof e.slug === "string" && !!e.payload && typeof e.payload === "object") &&
    sampleOk(updated, (e) => typeof e.slug === "string" && !!e.diff && typeof e.diff === "object") &&
    sampleOk(field_conflicts, (e) => typeof e.slug === "string" && Array.isArray(e.sources))
  );
}

/**
 * Lists all `*.diff.json` files in `ingest/.last-run/`, sorted newest first
 * (by `ranAt` timestamp when parsable, otherwise by filename — the
 * `backfill-YYYYMMDD-HHMM.diff.json` naming convention is sort-stable
 * anyway).
 *
 * Corrupt files appear as `{ kind: "error" }` entries in the position where
 * they are chronologically expected — the list keeps rendering, but the user
 * sees the defect.
 */
export async function listDiffFiles(): Promise<DiffListEntry[]> {
  let filenames: string[];
  try {
    filenames = await fs.readdir(DIFF_DIR);
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[/ingest] readdir failed (${msg}); rendering empty dashboard.`);
    return [];
  }

  const diffs = filenames.filter((f) => f.endsWith(DIFF_SUFFIX));
  // IO-bound → read in parallel; the sort afterwards restores the order, and
  // errors stay per-file slots (Promise.all never rejects here).
  const entries = await Promise.all(
    diffs.map(async (filename): Promise<DiffListEntry> => {
      const runId = filename.slice(0, -DIFF_SUFFIX.length);
      const filepath = path.join(DIFF_DIR, filename);
      try {
        const raw = await fs.readFile(filepath, "utf8");
        const parsed = JSON.parse(raw) as unknown;
        if (!isDiffFileLike(parsed)) {
          return {
            kind: "error",
            error: { runId, filename, error: "structure does not match DiffFile shape" },
          };
        }
        return { kind: "ok", summary: toSummary(runId, parsed) };
      } catch (err) {
        const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
        return { kind: "error", error: { runId, filename, error: msg } };
      }
    }),
  );

  entries.sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
  return entries;
}

function sortKey(e: DiffListEntry): string {
  if (e.kind === "ok") return e.summary.ranAt || e.summary.runId;
  return e.error.runId;
}

function toSummary(runId: string, d: DiffFile): DiffSummary {
  return {
    runId,
    ranAt: d.ranAt,
    discoverySource: d.discoverySource,
    discoveryPages: d.discoveryPages ?? [],
    activeSources: d.activeSources ?? [],
    discovered: d.discovered ?? 0,
    counts: {
      added: d.added.length,
      updated: d.updated.length,
      skipped_manual: d.skipped_manual.length,
      skipped_unchanged: d.skipped_unchanged.length,
      field_conflicts: d.field_conflicts.length,
      errors: d.errors.length,
      llm_flags: d.llm_flags?.length ?? 0,
      discoveryDuplicates: d.discoveryDuplicates?.length ?? 0,
    },
    llmModel: d.llmModel,
    llmPromptVersion: d.llmPromptVersion,
    llmCostSummary: d.llmCostSummary,
  };
}

/**
 * Returns the full `DiffFile` structure for one run. RunId = filename
 * without the `.diff.json` suffix. Returns `null` when the file does not
 * exist; throws on a JSON parse error (unlike `listDiffFiles` — the detail
 * view uses Next's `not-found.tsx` mechanism).
 */
export async function loadDiffById(runId: string): Promise<DiffFile | null> {
  // Defense against pathological runIds (slashes, `..` traversal). RunIds
  // from generateStaticParams are always derived from listDiffFiles, so they
  // are safe in principle — but directly-requested URLs must be blocked.
  if (!/^[a-zA-Z0-9._-]+$/.test(runId)) return null;

  const filepath = path.join(DIFF_DIR, `${runId}${DIFF_SUFFIX}`);
  let raw: string;
  try {
    raw = await fs.readFile(filepath, "utf8");
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "ENOENT") return null;
    throw err;
  }
  const parsed = JSON.parse(raw) as unknown;
  if (!isDiffFileLike(parsed)) {
    throw new Error(`Diff file ${runId} does not match DiffFile shape`);
  }
  return parsed;
}

/**
 * Returns only the runIds — for `generateStaticParams`. Filters out corrupt
 * files so the SSG pipeline does not die on a broken file; the corrupt card
 * is then only visible in the list and has no detail route (click → 404 is
 * acceptable because the list view explains the error).
 */
export async function listValidRunIds(): Promise<string[]> {
  const entries = await listDiffFiles();
  return entries.flatMap((e) => (e.kind === "ok" ? [e.summary.runId] : []));
}
