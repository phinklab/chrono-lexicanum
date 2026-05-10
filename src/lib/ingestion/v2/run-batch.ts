/**
 * Pipeline V2 — batch orchestrator (Brief 055).
 *
 * Voll-Lauf-Decision-Gate: take the first N books from the merged Wikipedia +
 * TLBranson discovery roster, sorted by `slug`, and run them through the
 * shared `run-engine` pipeline. Output: `ingest/.last-run/v2-batch-YYYYMMDD-
 * HHMM.diff.json` — distinct prefix from `v2-pilot-` so the dashboard +
 * later resolver tooling can discriminate via `startsWith("v2-batch-")`.
 *
 * Book-selection strategy: sorted-slug-first-N. Reproducible (same N books
 * on every run as long as Discovery output is stable), no cherry-picking,
 * gives a representative cross-section. Brief 055 §"Buch-Auswahl" approved
 * this approach; CC may stratify in a future brief if validator-trigger
 * coverage looks sparse.
 *
 * Diff-only by design — never writes to DB. The 3d-Apply step (Brief 057)
 * is a separate path.
 */
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  discoverV2Roster,
  processBookV2,
  writeV2DiffFile,
  type RunErrorEntry,
} from "./run-engine";
import { isLlmEnabled, getLlmModel } from "../llm/enrich";
import { isHardcoverEnabled } from "../hardcover/fetch";
import { PROMPT_VERSION_HASH_V2 } from "./llm/prompt";
import {
  emptyValidationSummary,
  mergeValidationSummaries,
  summarizeValidations,
} from "./validators";
import type {
  BookV2Record,
  V2DiffFile,
  V2RunLlmCostSummary,
} from "./types";
import type { SourceName } from "../types";

const STATE_DIR = join(process.cwd(), "ingest", ".state");

function partialDiffPath(batchName: string): string {
  return join(STATE_DIR, `v2-batch-${batchName}.partial.diff.json`);
}

async function writePartialDiff(
  filepath: string,
  diff: V2DiffFile,
): Promise<void> {
  await mkdir(STATE_DIR, { recursive: true });
  const tmp = `${filepath}.tmp`;
  await writeFile(tmp, JSON.stringify(diff, null, 2), "utf8");
  await rename(tmp, filepath);
}

/**
 * Registered batch names. Each entry is a logical run-id that pairs with
 * a per-batch limit derived from the CLI `--limit` flag (default 100).
 * Restricting to a known list mirrors the pilot's `--pilot=v2-tryout-1`
 * gate and keeps the diff-file naming auditable across runs.
 */
const REGISTERED_BATCHES = new Set<string>(["v2-tryout-2"]);

export function isRegisteredBatch(name: string): boolean {
  return REGISTERED_BATCHES.has(name);
}

export function listRegisteredBatches(): string[] {
  return Array.from(REGISTERED_BATCHES);
}

export async function runV2Batch(batchName: string, limit: number): Promise<string> {
  if (!REGISTERED_BATCHES.has(batchName)) {
    throw new Error(
      `unknown batch "${batchName}"; registered: ${Array.from(REGISTERED_BATCHES).join(", ")}`,
    );
  }
  if (!Number.isFinite(limit) || limit < 1) {
    throw new Error(`--limit must be a positive integer (got ${limit})`);
  }

  const startedAt = new Date().toISOString();
  const errors: RunErrorEntry[] = [];

  // GC-on-start: a stale partial-diff for *this* batch slot from a prior
  // mid-run abort would otherwise be confusable with the in-flight write.
  // Stale partials of *other* batch names are left untouched.
  const partialPath = partialDiffPath(batchName);
  await rm(partialPath, { force: true });

  // ── Stage 0 — Discovery ─────────────────────────────────────────────
  const discovery = await discoverV2Roster();
  errors.push(...discovery.errors);

  // First-N by slug-sort (lex, ascending). Filter out any empty-slug rows
  // defensively — slugify can produce "" on degenerate titles.
  const sorted = discovery.merged
    .filter((b) => b.slug.length > 0)
    .sort((a, b) => a.slug.localeCompare(b.slug));
  const selected = sorted.slice(0, Math.min(limit, sorted.length));
  console.log(
    `[v2-batch ${batchName}] selected first ${selected.length}/${sorted.length} books by slug-sort` +
      (selected.length < limit ? ` (capped to roster size)` : ` (limit=${limit})`),
  );
  if (selected.length > 0) {
    console.log(
      `  range: "${selected[0].slug}" → "${selected[selected.length - 1].slug}"`,
    );
  }

  // Push run-level "LLM disabled" error once if applicable.
  if (!isLlmEnabled()) {
    errors.push({
      source: "llm",
      message: "ANTHROPIC_API_KEY missing — LLM enrichment skipped",
    });
  }

  // ── Stage 1–4 per book ──────────────────────────────────────────────
  const records: BookV2Record[] = [];
  let runCost: V2RunLlmCostSummary = {
    totalTokensIn: 0,
    totalTokensOut: 0,
    totalWebSearches: 0,
    estUsdCost: 0,
  };
  let validationSummary = emptyValidationSummary();
  const llmModel = getLlmModel();

  // activeSources is pure (driven only by env-flag helpers that don't change
  // during a run) — hoist it ahead of the loop so the per-book checkpoint
  // and the final diff share one source of truth.
  const activeSources: SourceName[] = ["lexicanum", "open_library"];
  if (isHardcoverEnabled()) activeSources.push("hardcover");
  if (isLlmEnabled()) activeSources.push("llm");

  // Snapshot builder — captures all the running state by reference, returns
  // a fresh V2DiffFile each call. Used by both the per-book checkpoint
  // (mid-run resilience) and the final write (canonical diff).
  const buildDiff = (): V2DiffFile => ({
    ranAt: new Date().toISOString(),
    pipeline: "v2",
    pilot: batchName,
    discoverySource: ["wikipedia", "tlbranson"],
    discoveryPages: [
      ...discovery.wikipediaPagesUsed,
      ...discovery.tlbransonPagesUsed,
    ],
    activeSources,
    discovered: discovery.merged.length,
    added: records,
    updated: [],
    skipped_manual: [],
    skipped_unchanged: [],
    field_conflicts: [],
    errors: errors.map((e) => ({
      source: e.source,
      slug: e.slug,
      message: e.message,
    })),
    validationSummary,
    llmModel,
    llmPromptVersion: PROMPT_VERSION_HASH_V2,
    llmCostSummary: runCost,
  });

  for (let i = 0; i < selected.length; i++) {
    const book = selected[i];
    const tag = `[${i + 1}/${selected.length}]`;
    console.log(`${tag} ${book.title} (${book.slug})`);

    const result = await processBookV2(book);
    records.push(result.record);
    errors.push(...result.errors);
    validationSummary = mergeValidationSummaries(
      validationSummary,
      summarizeValidations(result.validations),
    );
    if (result.llmCost) {
      runCost = {
        totalTokensIn: runCost.totalTokensIn + result.llmCost.tokensIn,
        totalTokensOut: runCost.totalTokensOut + result.llmCost.tokensOut,
        totalWebSearches: runCost.totalWebSearches + result.llmCost.webSearches,
        estUsdCost: runCost.estUsdCost + result.llmCost.estUsdCost,
      };
    }

    // Per-book checkpoint — atomic overwrite. If the run is Ctrl-C'd or
    // killed mid-loop, this file holds the records-so-far state and can be
    // hand-promoted to ingest/.last-run/ by the maintainer.
    await writePartialDiff(partialPath, buildDiff());
  }

  // The V2DiffFile schema's `pilot` field is reused as the batch identifier
  // — the dashboard treats it as opaque metadata. The discriminator that
  // matters for tooling is the filename prefix (`v2-batch-` vs `v2-pilot-`).
  const diff = buildDiff();

  const path = await writeV2DiffFile(diff, "v2-batch", startedAt);

  // Final write succeeded — promote: drop the partial-diff so a future run
  // for the same batch slot starts clean.
  await rm(partialPath, { force: true });

  console.log(`\nwrote diff: ${path}`);
  console.log(
    `summary: ${records.length} records, ${errors.length} errors, validations:`,
    validationSummary,
  );
  console.log(
    `cost: $${runCost.estUsdCost.toFixed(3)} ` +
      `(${runCost.totalTokensIn}+${runCost.totalTokensOut} tokens, ${runCost.totalWebSearches} web_search)`,
  );
  if (records.length > 0) {
    const avgCost = runCost.estUsdCost / records.length;
    const avgWebSearches = runCost.totalWebSearches / records.length;
    console.log(
      `per-book averages: $${avgCost.toFixed(4)}/book, ${avgWebSearches.toFixed(2)} web_search/book`,
    );
  }
  return path;
}
