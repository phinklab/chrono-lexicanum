/**
 * Phase 3.5 — Read-only Loader für die committed Diff-Files unter
 * `ingest/.last-run/*.diff.json`. Konsumiert vom `/ingest`-Dashboard.
 *
 * `DiffFile` aus `./types.ts` ist die single source of truth — kein eigener
 * Type-Mirror. Loader sind tolerant gegen korrupte Files (returnen einen
 * Error-Slot statt zu throwen) und gegen ältere Diffs ohne LLM-Felder
 * (`llmModel` etc. bleiben optional, UI gated dann auf "kein LLM-Step").
 */
import { promises as fs } from "node:fs";
import path from "node:path";

import type { DiffFile, SourceName } from "./types";

const DIFF_DIR = path.join(process.cwd(), "ingest", ".last-run");
const DIFF_SUFFIX = ".diff.json";

/**
 * Header-Form pro Diff für die Liste. Nur die Felder, die für die Summary-
 * Card gebraucht werden — vermeidet das Laden + JSON-Parse-Memory aller
 * `added[]` / `llm_flags[]` für die Listen-View.
 */
export interface DiffSummary {
  /** Filename ohne Suffix, z.B. `backfill-20260503-2308`. URL-fähig. */
  runId: string;
  /** ISO-Timestamp aus dem Diff (`ranAt`); fällt zurück auf File-mtime. */
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

/** Sentinel für Files, deren JSON-Parse oder Schema-Validation gescheitert ist. */
export interface DiffSummaryError {
  runId: string;
  filename: string;
  error: string;
}

export type DiffListEntry =
  | { kind: "ok"; summary: DiffSummary }
  | { kind: "error"; error: DiffSummaryError };

function isDiffFileLike(value: unknown): value is DiffFile {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.ranAt === "string" &&
    Array.isArray(v.added) &&
    Array.isArray(v.updated) &&
    Array.isArray(v.skipped_manual) &&
    Array.isArray(v.skipped_unchanged) &&
    Array.isArray(v.field_conflicts) &&
    Array.isArray(v.errors)
  );
}

/**
 * Listet alle `*.diff.json`-Files in `ingest/.last-run/`, sortiert neuester
 * zuerst (per `ranAt`-Timestamp wenn parsable, sonst Filename — die Filename-
 * Convention `backfill-YYYYMMDD-HHMM.diff.json` ist ohnehin sortier-stabil).
 *
 * Korrupte Files erscheinen als `{ kind: "error" }`-Entries an dem Platz, an
 * dem sie chronologisch erwartet werden — die Liste rendert weiter, der User
 * sieht aber den Defekt.
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
  const entries: DiffListEntry[] = [];
  for (const filename of diffs) {
    const runId = filename.slice(0, -DIFF_SUFFIX.length);
    const filepath = path.join(DIFF_DIR, filename);
    try {
      const raw = await fs.readFile(filepath, "utf8");
      const parsed = JSON.parse(raw) as unknown;
      if (!isDiffFileLike(parsed)) {
        entries.push({
          kind: "error",
          error: { runId, filename, error: "structure does not match DiffFile shape" },
        });
        continue;
      }
      entries.push({ kind: "ok", summary: toSummary(runId, parsed) });
    } catch (err) {
      const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      entries.push({ kind: "error", error: { runId, filename, error: msg } });
    }
  }

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
 * Liefert die vollständige `DiffFile`-Struktur für einen Run. RunId =
 * Filename ohne `.diff.json`-Suffix. Returnt `null` wenn der File nicht
 * existiert; throwt bei JSON-Parse-Fehler (anders als `listDiffFiles` —
 * der Detail-View nutzt Next's `not-found.tsx`-Mechanik).
 */
export async function loadDiffById(runId: string): Promise<DiffFile | null> {
  // Defense gegen pathologische runIds (Slashes, ..-Traversal). RunIds aus
  // generateStaticParams sind immer aus listDiffFiles abgeleitet, also
  // eigentlich safe — aber direkt-aufgerufene URLs sollten geblockt werden.
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
 * Liefert nur die runIds — für `generateStaticParams`. Filtert korrupte Files
 * raus damit die SSG-Pipeline an einem defekten File nicht stirbt; die
 * korrupte Card ist dann nur in der Liste sichtbar, hat aber keine Detail-
 * Route (Klick → 404 ist akzeptabel, weil der Listen-View den Fehler erklärt).
 */
export async function listValidRunIds(): Promise<string[]> {
  const entries = await listDiffFiles();
  return entries.flatMap((e) => (e.kind === "ok" ? [e.summary.runId] : []));
}
