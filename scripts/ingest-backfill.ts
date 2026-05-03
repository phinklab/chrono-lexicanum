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
  discoverHardcoverBook,
  isHardcoverEnabled,
} from "@/lib/ingestion/hardcover/parse";
import {
  discoverLexicanumArticle,
} from "@/lib/ingestion/lexicanum/parse";
import {
  enrichBookWithLLM,
  estimateUsdCost,
  getLlmModel,
  isLlmEnabled,
} from "@/lib/ingestion/llm/enrich";
import { PROMPT_VERSION_HASH } from "@/lib/ingestion/llm/prompt";
import {
  mergeBookFromSources,
  wikipediaEntryToPayload,
} from "@/lib/ingestion/merge";
import {
  discoverOpenLibraryBook,
} from "@/lib/ingestion/open_library/parse";
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
  DiscoveryDuplicateEntry,
  LLMPayload,
  RunState,
  SourceName,
  SourcePayload,
  WikipediaBookEntry,
} from "@/lib/ingestion/types";
import { slugify } from "@/lib/slug";

// Phase 3a Hauptliste + Phase 3b Sub-Listen. Wikipedia's WH40k-Subseiten-
// Landschaft ist heterogen: viele beworbene Listen (Beast Arises, Path of
// the Eldar, Night Lords) haben keine eigene Wikipedia-Seite, andere
// (Gaunt's Ghosts) nutzen `<h3>`-pro-Buch statt strukturierter Listen. Hier
// stehen nur Pages die `parseWikipediaList`'s `<ul>`- oder wikitable-Walker
// sinnvolle Buch-Einträge liefern; alles andere wandert in 3c LLM-Web-Search.
const DEFAULT_DISCOVERY_PAGES = [
  "List_of_Warhammer_40,000_novels",
  "Horus_Heresy_(novels)",     // 86 wikitable rows; präziserer seriesIndex als Hauptliste
  "Siege_of_Terra",            // gleicher kanonischer Wikitable wie HH-novels (Redirect-Alias) — bestätigt Dedup-Audit
  "Eisenhorn",                 // 4 omnibus-Einträge, mostly redundant; demonstriert Sub-List-Heterogenität
];
const VALID_PER_BOOK_SOURCES: SourceName[] = [
  "lexicanum",
  "open_library",
  "hardcover",
  "llm",
];

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

  // Token-Filter: Hardcover braucht HARDCOVER_API_TOKEN, LLM braucht
  // ANTHROPIC_API_KEY. Wenn explizit `--source <x>` ohne Key → harter Fehler.
  // Wenn Default-Set ohne Key → still aus aktiver Liste entfernen, einmaliger
  // Error-Eintrag im Diff (siehe initState).
  if (cfg.source === "hardcover" && !isHardcoverEnabled()) {
    exitWithError(
      "--source hardcover: HARDCOVER_API_TOKEN missing in .env.local",
    );
  }
  if (cfg.source === "llm" && !isLlmEnabled()) {
    exitWithError(
      "--source llm: ANTHROPIC_API_KEY missing in .env.local",
    );
  }

  let activeSources: SourceName[] = cfg.source
    ? [cfg.source]
    : VALID_PER_BOOK_SOURCES.slice();
  const hardcoverDisabled =
    activeSources.includes("hardcover") && !isHardcoverEnabled();
  if (hardcoverDisabled) {
    activeSources = activeSources.filter((s) => s !== "hardcover");
  }
  const llmDisabled = activeSources.includes("llm") && !isLlmEnabled();
  if (llmDisabled) {
    activeSources = activeSources.filter((s) => s !== "llm");
  }

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
    if (hardcoverDisabled) {
      // One-shot soft-fail audit entry; per-book entries would flood 800-row diffs.
      state.partialDiff.errors.push({
        source: "hardcover",
        message:
          "HARDCOVER_API_TOKEN missing — Hardcover crawler skipped for this run",
      });
    }
    if (llmDisabled) {
      state.partialDiff.errors.push({
        source: "llm",
        message:
          "ANTHROPIC_API_KEY missing — LLM enrichment skipped for this run",
      });
    }
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

  // Phase 3b: Sub-List-Precedence-Dedup. Wenn ein Slug aus mehreren Pages
  // kommt (typisch: Hauptliste + HH-novels-Sub-List für die 65 HH-Bücher),
  // mergt diese Schleife per Feld — Sub-Listen-Werte gewinnen, wenn sie
  // gesetzt sind, weil sie strukturierter sind (Wikitable mit präzisem
  // seriesIndex). Hauptlisten-Werte füllen die Lücken (Author, Year sind
  // dort öfter notiert). Audit landet in `discoveryDuplicates`.
  const isMainList = (e: WikipediaBookEntry): boolean =>
    e.sourcePage.includes("List_of_Warhammer_40,000_novels");

  const groups = new Map<string, WikipediaBookEntry[]>();
  for (const e of allEntries) {
    const key = slugify(e.title);
    if (!key) continue;
    const arr = groups.get(key);
    if (arr) arr.push(e);
    else groups.set(key, [e]);
  }

  const unique: WikipediaBookEntry[] = [];
  const discoveryDuplicates: DiscoveryDuplicateEntry[] = [];

  for (const [slug, group] of groups) {
    if (group.length === 1) {
      unique.push(group[0]);
      continue;
    }

    // Sub-Listen vor Hauptliste sortieren: Sub-List-Felder sollen Vorrang
    // haben (sie sind precise-annotated), Hauptliste füllt nur Lücken.
    const sortedSubFirst = [...group].sort(
      (a, b) => Number(isMainList(a)) - Number(isMainList(b)),
    );

    const winner: WikipediaBookEntry = { ...sortedSubFirst[0] };
    for (let i = 1; i < sortedSubFirst.length; i++) {
      const e = sortedSubFirst[i];
      if (winner.author === undefined && e.author) winner.author = e.author;
      if (winner.releaseYear === undefined && e.releaseYear)
        winner.releaseYear = e.releaseYear;
      if (winner.seriesIndex === undefined && e.seriesIndex)
        winner.seriesIndex = e.seriesIndex;
      if (winner.seriesId === undefined && e.seriesId)
        winner.seriesId = e.seriesId;
    }

    unique.push(winner);
    discoveryDuplicates.push({
      slug,
      sources: group.map((e) => e.sourcePage),
    });
  }

  console.log(
    `  total unique: ${unique.length} (${discoveryDuplicates.length} cross-page duplicates folded)`,
  );

  const partialDiff = emptyDiff(DEFAULT_DISCOVERY_PAGES, activeSources);
  partialDiff.discovered = unique.length;
  partialDiff.errors.push(...errors);
  if (discoveryDuplicates.length > 0) {
    partialDiff.discoveryDuplicates = discoveryDuplicates;
  }

  // Phase 3c: Top-Level-LLM-Audit-Felder, nur wenn `llm` in activeSources.
  if (activeSources.includes("llm")) {
    partialDiff.llmModel = getLlmModel();
    partialDiff.llmPromptVersion = PROMPT_VERSION_HASH;
    partialDiff.llmCostSummary = {
      totalTokensIn: 0,
      totalTokensOut: 0,
      totalWebSearches: 0,
      estUsdCost: 0,
    };
    partialDiff.llm_flags = [];
  }

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
  let hardcoverAudit: { tags?: string[]; averageRating?: number } | undefined;

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

  if (state.config.sources.includes("open_library")) {
    try {
      const { result, reason } = await discoverOpenLibraryBook(
        entry.title,
        entry.author,
      );
      if (result) {
        payloads.push(result.payload);
      } else if (reason) {
        state.partialDiff.errors.push({
          wikipediaTitle: entry.title,
          source: "open_library",
          message: reason,
        });
      }
    } catch (e) {
      state.partialDiff.errors.push({
        wikipediaTitle: entry.title,
        source: "open_library",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  if (state.config.sources.includes("hardcover") && isHardcoverEnabled()) {
    try {
      const { result, reason } = await discoverHardcoverBook(
        entry.title,
        entry.author,
      );
      if (result) {
        payloads.push(result.payload);
        if (result.payload.audit) hardcoverAudit = result.payload.audit;
      } else if (reason) {
        state.partialDiff.errors.push({
          wikipediaTitle: entry.title,
          source: "hardcover",
          message: reason,
        });
      }
    } catch (e) {
      state.partialDiff.errors.push({
        wikipediaTitle: entry.title,
        source: "hardcover",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  // Phase 3c: Two-Pass-Merge. Erster Pass nur als interne Zwischenstation —
  // füttert den LLM mit dem multi-source-Snapshot. Zweiter Pass (final) fold-ed
  // den LLM-Payload via FIELD_PRIORITY in den Merge zurück. conflicts werden
  // nur einmal gepusht (vom finalen Merge), damit Pass-1-Konflikte nicht
  // doppelt im Diff landen.
  const { merged: firstPassMerged } = mergeBookFromSources(payloads);

  let llmAudit: LLMPayload["audit"] | undefined;
  if (state.config.sources.includes("llm") && isLlmEnabled()) {
    try {
      const llmPayload = await enrichBookWithLLM(firstPassMerged, payloads);
      if (llmPayload) {
        payloads.push(llmPayload);
        if (llmPayload.audit) llmAudit = llmPayload.audit;
      }
    } catch (e) {
      state.partialDiff.errors.push({
        wikipediaTitle: entry.title,
        source: "llm",
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

  // Phase 3c: per-Buch-Audit-Anker für 3d-FK-Resolution. Nur setzen wenn
  // discoveredLinks oder facetIds non-empty sind (sonst Slot weglassen).
  const rawLlmPayload = llmAudit
    ? {
        ...(llmAudit.facetIds && llmAudit.facetIds.length > 0
          ? { facetIds: llmAudit.facetIds }
          : {}),
        ...(llmAudit.discoveredLinks && llmAudit.discoveredLinks.length > 0
          ? { discoveredLinks: llmAudit.discoveredLinks }
          : {}),
      }
    : undefined;
  const hasLlmAnchor =
    rawLlmPayload &&
    (rawLlmPayload.facetIds !== undefined ||
      rawLlmPayload.discoveredLinks !== undefined);

  // Top-Level-Aggregation: flags + tokenUsage in DiffFile.
  if (llmAudit?.flags && llmAudit.flags.length > 0 && state.partialDiff.llm_flags) {
    for (const flag of llmAudit.flags) {
      state.partialDiff.llm_flags.push({ slug: merged.slug, ...flag });
    }
  }
  if (llmAudit?.tokenUsage && state.partialDiff.llmCostSummary) {
    const cost = state.partialDiff.llmCostSummary;
    cost.totalTokensIn += llmAudit.tokenUsage.input;
    cost.totalTokensOut += llmAudit.tokenUsage.output;
    cost.totalWebSearches += llmAudit.tokenUsage.webSearchCount;
    cost.estUsdCost = estimateUsdCost(cost);
  }

  const compared = await compareBook(entry.title, merged);
  switch (compared.kind) {
    case "added":
      if (hardcoverAudit) compared.entry.rawHardcoverPayload = hardcoverAudit;
      if (hasLlmAnchor) compared.entry.rawLlmPayload = rawLlmPayload;
      state.partialDiff.added.push(compared.entry);
      break;
    case "updated":
      if (hasLlmAnchor) compared.entry.rawLlmPayload = rawLlmPayload;
      state.partialDiff.updated.push(compared.entry);
      break;
    case "skipped_manual":
      if (hasLlmAnchor) compared.entry.rawLlmPayload = rawLlmPayload;
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
