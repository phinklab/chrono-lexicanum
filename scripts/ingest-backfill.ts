/**
 * Phase-3a CLI entry: bulk-backfill skeleton (dry-run only).
 *
 * Discovers all WH40k novels via Wikipedia master-list, crawls each
 * book's Lexicanum article, merges per `FIELD_PRIORITY`, and writes a
 * structured diff against the DB. Never writes to the DB.
 *
 * Usage:
 *   npm run ingest:backfill -- --dry-run [--limit N] [--slug <slug>] [--source <name>]
 *
 * Resumable: progress is persisted to ingest/.state/in-progress.json on
 * each book and after Ctrl-C; a subsequent invocation picks up at the
 * next unprocessed index. State is cleared on successful completion.
 */
import { parseArgs } from "node:util";

import { compareBook, loadDbBooks } from "@/lib/ingestion/dry-run";
import {
  discoverLexicanumArticle,
} from "@/lib/ingestion/lexicanum/parse";
import {
  mergeBookFromSources,
  wikipediaEntryToPayload,
} from "@/lib/ingestion/merge";
import {
  clearState,
  ensureStateDir,
  loadState,
  saveState,
} from "@/lib/ingestion/state";
import { writeFinalDiff } from "@/lib/ingestion/diff-writer";
import { fetchWikipediaPage } from "@/lib/ingestion/wikipedia/fetch";
import { parseWikipediaList } from "@/lib/ingestion/wikipedia/parse";
import type {
  DiffFile,
  RunState,
  SourceName,
  SourcePayload,
  WikipediaBookEntry,
} from "@/lib/ingestion/types";
import { slugify } from "@/lib/slug";

const DEFAULT_DISCOVERY_PAGES = ["List_of_Warhammer_40,000_novels"];
const VALID_PER_BOOK_SOURCES: SourceName[] = ["lexicanum"];

interface CliConfig {
  dryRun: boolean;
  limit?: number;
  slug?: string;
  source?: SourceName;
}

function parseCliArgs(): CliConfig {
  const { values } = parseArgs({
    options: {
      "dry-run": { type: "boolean", default: false },
      limit: { type: "string" },
      slug: { type: "string" },
      source: { type: "string" },
    },
    strict: true,
  });

  const dryRun = Boolean(values["dry-run"]);
  const limit = values.limit !== undefined ? Number.parseInt(values.limit, 10) : undefined;
  const slug = values.slug;
  const source = values.source as SourceName | undefined;

  return { dryRun, limit, slug, source };
}

function exitWithError(msg: string, code: number = 1): never {
  console.error(`error: ${msg}`);
  process.exit(code);
}

function emptyDiff(discoveryPages: string[], activeSources: SourceName[]): DiffFile {
  return {
    ranAt: new Date().toISOString(),
    discoverySource: "wikipedia",
    discoveryPages,
    activeSources,
    discovered: 0,
    added: [],
    updated: [],
    skipped_manual: [],
    skipped_unchanged: [],
    field_conflicts: [],
    errors: [],
  };
}

async function main(): Promise<void> {
  const cfg = parseCliArgs();

  if (!cfg.dryRun) {
    exitWithError(
      "--dry-run is required in Phase 3a (apply mode arrives in 3d)",
    );
  }
  if (cfg.source && !VALID_PER_BOOK_SOURCES.includes(cfg.source)) {
    if (cfg.source === ("wikipedia" as SourceName)) {
      exitWithError("--source wikipedia: wikipedia is discovery-only, not a per-book source");
    }
    exitWithError(
      `--source ${cfg.source}: not active in Phase 3a (active: ${VALID_PER_BOOK_SOURCES.join(", ")})`,
    );
  }
  if (cfg.limit !== undefined && (!Number.isFinite(cfg.limit) || cfg.limit < 1)) {
    exitWithError(`--limit must be a positive integer (got ${cfg.limit})`);
  }
  if (cfg.slug && cfg.limit !== undefined) {
    console.warn(
      "warn: --slug supplied; --limit is ignored when targeting a single slug",
    );
  }

  await ensureStateDir();

  const activeSources: SourceName[] = cfg.source
    ? [cfg.source]
    : VALID_PER_BOOK_SOURCES;

  // ── Resume vs fresh ────────────────────────────────────────────────
  let state = await loadState();
  if (state && cfg.slug) {
    console.warn(
      "warn: existing state file found; --slug starts a fresh single-book run",
    );
    state = null;
  }

  if (!state) {
    state = await initState(cfg, activeSources);
  } else {
    console.log(
      `resuming run ${state.runId}: ${state.processedIndex + 1}/${state.discoveredRoster.length} processed so far`,
    );
  }

  // ── Pre-warm DB cache so the per-book hot path stays fast. ──────────
  await loadDbBooks();

  // ── Install Ctrl-C handler that snapshots state then exits. ────────
  let interrupted = false;
  const onSigint = async () => {
    if (interrupted) return;
    interrupted = true;
    console.log(
      `\ninterrupted at index ${state!.processedIndex} of ${state!.discoveredRoster.length}; saving state...`,
    );
    await saveState(state!);
    process.exit(130);
  };
  process.on("SIGINT", onSigint);

  // ── Pick the slice to process. ────────────────────────────────────
  const roster = state.discoveredRoster;
  const startIdx = state.processedIndex + 1;
  const endIdx = computeEndIndex(roster.length, startIdx, cfg);

  if (cfg.slug) {
    const target = roster.findIndex((e) => slugify(e.title) === cfg.slug);
    if (target < 0) {
      exitWithError(
        `--slug ${cfg.slug}: no Wikipedia entry has slugify(title) === '${cfg.slug}'`,
      );
    }
    await processOne(state, roster[target], target);
  } else {
    for (let i = startIdx; i < endIdx; i++) {
      if (interrupted) break;
      await processOne(state, roster[i], i);
    }
  }

  // ── Finalize ──────────────────────────────────────────────────────
  state.partialDiff.ranAt = new Date().toISOString();
  state.partialDiff.discovered = state.discoveredRoster.length;
  const path = await writeFinalDiff(state.partialDiff);
  await clearState();

  console.log(
    `\nwrote diff: ${path}\n` +
      `summary:` +
      `\n  added           = ${state.partialDiff.added.length}` +
      `\n  updated         = ${state.partialDiff.updated.length}` +
      `\n  skipped_manual  = ${state.partialDiff.skipped_manual.length}` +
      `\n  skipped_unchgd  = ${state.partialDiff.skipped_unchanged.length}` +
      `\n  field_conflicts = ${state.partialDiff.field_conflicts.length}` +
      `\n  errors          = ${state.partialDiff.errors.length}`,
  );
}

async function initState(
  cfg: CliConfig,
  activeSources: SourceName[],
): Promise<RunState> {
  console.log(`discovering roster from ${DEFAULT_DISCOVERY_PAGES.join(", ")}...`);

  const allEntries: WikipediaBookEntry[] = [];
  const errors: DiffFile["errors"] = [];

  for (const pageName of DEFAULT_DISCOVERY_PAGES) {
    try {
      const page = await fetchWikipediaPage(pageName);
      const parsed = parseWikipediaList(page);
      console.log(`  ${pageName}: ${parsed.length} entries`);
      allEntries.push(...parsed);
    } catch (e) {
      errors.push({
        source: "discovery",
        message: `Wikipedia page '${pageName}': ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  }

  if (allEntries.length === 0) {
    exitWithError(
      "discovery returned 0 entries — Wikipedia HTML may have changed; aborting",
      2,
    );
  }

  // Dedupe by normalized title.
  const seen = new Set<string>();
  const unique: WikipediaBookEntry[] = [];
  for (const e of allEntries) {
    const key = slugify(e.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(e);
  }
  console.log(`  total unique: ${unique.length}`);

  const partialDiff = emptyDiff(DEFAULT_DISCOVERY_PAGES, activeSources);
  partialDiff.discovered = unique.length;
  partialDiff.errors.push(...errors);

  const startedAt = new Date().toISOString();
  const state: RunState = {
    runId: startedAt,
    startedAt,
    discoveryPages: DEFAULT_DISCOVERY_PAGES,
    discoveredRoster: unique,
    processedIndex: -1,
    partialDiff,
    config: {
      limit: cfg.limit,
      slug: cfg.slug,
      sources: activeSources,
    },
  };
  await saveState(state);
  return state;
}

function computeEndIndex(rosterLen: number, startIdx: number, cfg: CliConfig): number {
  // `startIdx` is intentionally unused here: --limit N is absolute ("process
  // up to N books total"), not incremental — so a resumed run with the same
  // --limit naturally stops at the same point as the original would have.
  void startIdx;
  if (cfg.slug) return rosterLen; // handled separately
  if (cfg.limit !== undefined) {
    return Math.min(rosterLen, cfg.limit);
  }
  return rosterLen;
}

async function processOne(
  state: RunState,
  entry: WikipediaBookEntry,
  index: number,
): Promise<void> {
  const total = state.discoveredRoster.length;
  console.log(`[${index + 1}/${total}] ${entry.title}${entry.author ? ` — ${entry.author}` : ""}`);

  const payloads: SourcePayload[] = [wikipediaEntryToPayload(entry)];

  // Lexicanum is the only active per-book source in 3a.
  if (state.config.sources.includes("lexicanum")) {
    try {
      const { result, reason } = await discoverLexicanumArticle(
        entry.title,
        entry.author,
      );
      if (result) {
        payloads.push(result.payload);
      } else if (reason) {
        state.partialDiff.errors.push({
          wikipediaTitle: entry.title,
          source: "lexicanum",
          message: reason,
        });
      }
    } catch (e) {
      state.partialDiff.errors.push({
        wikipediaTitle: entry.title,
        source: "lexicanum",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const { merged, conflicts } = mergeBookFromSources(payloads);

  for (const c of conflicts) {
    state.partialDiff.field_conflicts.push({
      slug: merged.slug,
      field: c.field,
      sources: c.sources,
    });
  }

  const compared = await compareBook(entry.title, merged);
  switch (compared.kind) {
    case "added":
      state.partialDiff.added.push(compared.entry);
      break;
    case "updated":
      state.partialDiff.updated.push(compared.entry);
      break;
    case "skipped_manual":
      state.partialDiff.skipped_manual.push(compared.entry);
      break;
    case "skipped_unchanged":
      state.partialDiff.skipped_unchanged.push(compared.entry);
      break;
  }

  state.processedIndex = index;
  await saveState(state);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
