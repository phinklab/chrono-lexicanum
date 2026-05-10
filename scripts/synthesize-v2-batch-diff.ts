/**
 * Synthesize a V2 batch diff from LLM-cache only (Brief 055 fallback).
 *
 * The 055 batch was interrupted before the per-book pipeline completed for
 * the full 50-book run. Each interrupted book has its slim-LLM payload in
 * `ingest/.llm-cache/<slug>.v2.json` (cache hits + a few fresh writes), but
 * the per-book Stage-1 source claims and Stage-2 validators were never
 * folded into a `BookV2Record`. This script bridges the gap WITHOUT
 * re-fetching sources (which is the slow path that forced the abort).
 *
 * Output is a real `V2DiffFile` JSON committed under
 * `ingest/.last-run/v2-batch-YYYYMMDD-HHMM.diff.json`. Each `BookV2Record`
 * inside is built from:
 *   - Discovery row (slug, title, authorHint, releaseYear, seriesHint, …)
 *   - Cached LLM payload (synopsis, factions, locations, characters,
 *     facetIds, format, token usage)
 *   - PROMPT_VERSION_HASH_V2 audit
 *
 * Fields that normally come from Lexicanum / OL / Hardcover (ISBN, page
 * count, cover URL, in-universe years from infobox) are left null. The
 * diff's `validations: []` is empty per book — the validator pass requires
 * source claims this script does not have. The diff carries explicit
 * `errors[]` rows naming the synthesis mode so downstream readers (the
 * `/ingest` dashboard, the surface-form analyzer, Brief 056) can see this
 * is a partial artefact, not a full V2-pipeline run.
 *
 * Usage:
 *   tsx --env-file=.env.local scripts/synthesize-v2-batch-diff.ts \
 *     --batch=v2-tryout-2 --limit=20
 *
 * The `--limit` is the slug-sort window from discovery (same logic as
 * `run-batch.ts`); only books inside the window AND with a cache hit are
 * included. Books inside the window but without a cache entry are recorded
 * as `errors[]` rows ("no LLM cache for slug, skipped in synthesis").
 */
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

import { discoverV2Roster } from "../src/lib/ingestion/v2/run-engine";
import { PROMPT_VERSION_HASH_V2 } from "../src/lib/ingestion/v2/llm/prompt";
import { isLlmEnabled, getLlmModel, estimateUsdCost } from "../src/lib/ingestion/llm/enrich";
import { isHardcoverEnabled } from "../src/lib/ingestion/hardcover/fetch";
import { SOURCE_CONFIDENCE } from "../src/lib/ingestion/source-confidence";
import type {
  BookV2Fields,
  BookV2Record,
  DiscoveredBook,
  FieldRecord,
  FieldRecordSource,
  RoleAnnotated,
  SlimLlmPayload,
  V2DiffFile,
  V2RunLlmCostSummary,
} from "../src/lib/ingestion/v2/types";
import type { BookFormat, MergedBook, SourceName } from "../src/lib/ingestion/types";

interface CliOpts {
  batchName: string;
  limit: number;
}

function parseCli(): CliOpts {
  const args = process.argv.slice(2);
  let batchName = "v2-tryout-2";
  let limit = 20;
  for (const a of args) {
    if (a.startsWith("--batch=")) batchName = a.slice("--batch=".length);
    else if (a.startsWith("--limit=")) limit = Number.parseInt(a.slice("--limit=".length), 10);
    else if (a === "--help") {
      console.error(
        "usage: tsx scripts/synthesize-v2-batch-diff.ts --batch=v2-tryout-2 --limit=20",
      );
      process.exit(0);
    }
  }
  if (!Number.isFinite(limit) || limit < 1) {
    console.error(`error: --limit must be a positive integer (got ${limit})`);
    process.exit(1);
  }
  return { batchName, limit };
}

interface CachedEnvelope {
  key: string;
  model: string;
  version: string;
  savedAt: string;
  payload: SlimLlmPayload;
}

async function loadCached(slug: string): Promise<CachedEnvelope | null> {
  const file = path.join("ingest", ".llm-cache", `${slug}.v2.json`);
  if (!existsSync(file)) return null;
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as CachedEnvelope;
    if (parsed.version !== PROMPT_VERSION_HASH_V2) return null; // stale cache
    return parsed;
  } catch {
    return null;
  }
}

function fr<T>(value: T, source: FieldRecordSource): FieldRecord<T> {
  return {
    value,
    source,
    fetchedAt: new Date().toISOString(),
    override: null,
  };
}

function buildSynthRecord(
  book: DiscoveredBook,
  cached: CachedEnvelope,
): BookV2Record {
  const llm = cached.payload;

  const titleField = fr<string>(book.title, "discovery");
  const authorField = fr<string[]>(book.authorHint ? [book.authorHint] : [], "discovery");
  const releaseYearField = fr<number | null>(book.releaseYear ?? null, "discovery");
  const seriesHintField = fr<string | null>(book.seriesHint ?? null, "discovery");
  const seriesIndexField = fr<number | null>(book.seriesIndex ?? null, "discovery");
  const isEntryPointField = fr<boolean | null>(book.isEntryPoint ?? null, "discovery");
  // Source-claim-derived fields are unavailable in cache-only mode.
  const isbn13Field = fr<string | null>(null, "discovery");
  const isbn10Field = fr<string | null>(null, "discovery");
  const pageCountField = fr<number | null>(null, "discovery");
  const coverUrlField = fr<string | null>(null, "discovery");
  const formatField = fr<BookFormat | null>(llm.format ?? null, llm.format ? "llm" : "discovery");
  const startYField = fr<number | null>(llm.startY ?? null, llm.startY != null ? "llm" : "discovery");
  const endYField = fr<number | null>(llm.endY ?? null, llm.endY != null ? "llm" : "discovery");
  const synopsisField = fr<string | null>(llm.synopsis ?? null, llm.synopsis ? "llm" : "discovery");
  const facetIdsField = fr<string[]>(llm.facetIds ?? [], "llm");
  const factionsField = fr<RoleAnnotated[]>(llm.factions ?? [], "llm");
  const locationsField = fr<RoleAnnotated[]>(llm.locations ?? [], "llm");
  const charactersField = fr<RoleAnnotated[]>(llm.characters ?? [], "llm");

  const fields: BookV2Fields = {
    title: titleField,
    authorNames: authorField,
    releaseYear: releaseYearField,
    seriesHint: seriesHintField,
    seriesIndex: seriesIndexField,
    isEntryPoint: isEntryPointField,
    isbn13: isbn13Field,
    isbn10: isbn10Field,
    pageCount: pageCountField,
    coverUrl: coverUrlField,
    format: formatField,
    startY: startYField,
    endY: endYField,
    synopsis: synopsisField,
    facetIds: facetIdsField,
    factions: factionsField,
    locations: locationsField,
    characters: charactersField,
  };

  // Synthesize V1 payload shim for /ingest dashboard rendering.
  const v1Payload: MergedBook = {
    slug: book.slug,
    primarySource: synopsisField.value ? "llm" : "wikipedia",
    confidence: synopsisField.value
      ? SOURCE_CONFIDENCE["llm"] ?? 0.5
      : SOURCE_CONFIDENCE["wikipedia"] ?? 0.5,
    fields: {
      ...(titleField.value ? { title: titleField.value } : {}),
      ...(authorField.value.length > 0 ? { authorNames: authorField.value } : {}),
      ...(releaseYearField.value !== null ? { releaseYear: releaseYearField.value } : {}),
      ...(synopsisField.value !== null ? { synopsis: synopsisField.value } : {}),
      ...(formatField.value !== null ? { format: formatField.value } : {}),
      ...(facetIdsField.value.length > 0 ? { facetIds: facetIdsField.value } : {}),
      ...(factionsField.value.length > 0
        ? { factionNames: factionsField.value.map((x) => x.name) }
        : {}),
      ...(locationsField.value.length > 0
        ? { locationNames: locationsField.value.map((x) => x.name) }
        : {}),
      ...(charactersField.value.length > 0
        ? { characterNames: charactersField.value.map((x) => x.name) }
        : {}),
    },
    fieldOrigins: {
      ...(synopsisField.value ? { synopsis: "llm" as SourceName } : {}),
      ...(factionsField.value.length > 0 ? { factionNames: "llm" as SourceName } : {}),
      ...(locationsField.value.length > 0 ? { locationNames: "llm" as SourceName } : {}),
      ...(charactersField.value.length > 0 ? { characterNames: "llm" as SourceName } : {}),
    },
    externalUrls: [],
  };

  return {
    slug: book.slug,
    fields,
    validations: [], // Cannot run validators without source claims.
    rawClaims: [], // No claims — synthesized from cache.
    rawLlmPayload: llm,
    llmCostSummary: {
      tokensIn: llm.audit.tokenUsage.input,
      tokensOut: llm.audit.tokenUsage.output,
      webSearches: llm.audit.tokenUsage.webSearchCount,
      // Cache lookups don't recompute cost; we recompute from token counts
      // and the configured pricing.
      estUsdCost: estimateUsdCost(
        {
          totalTokensIn: llm.audit.tokenUsage.input,
          totalTokensOut: llm.audit.tokenUsage.output,
          totalWebSearches: llm.audit.tokenUsage.webSearchCount,
        },
        cached.model,
      ),
    },
    sourcePages: book.sourcePages,
    wikipediaTitle: book.title,
    payload: v1Payload,
  };
}

async function main(): Promise<void> {
  const cfg = parseCli();
  const startedAt = new Date().toISOString();

  console.log(
    `[synth-batch ${cfg.batchName}] discovery + cache walk; --limit=${cfg.limit}`,
  );

  const discovery = await discoverV2Roster();
  const sorted = discovery.merged
    .filter((b) => b.slug.length > 0)
    .sort((a, b) => a.slug.localeCompare(b.slug));
  const window = sorted.slice(0, Math.min(cfg.limit, sorted.length));
  console.log(
    `  selected slug-window: ${window.length} books (range "${window[0].slug}" → "${window[window.length - 1].slug}")`,
  );

  const records: BookV2Record[] = [];
  const errors: { source: string; slug?: string; message: string }[] = [];
  let runCost: V2RunLlmCostSummary = {
    totalTokensIn: 0,
    totalTokensOut: 0,
    totalWebSearches: 0,
    estUsdCost: 0,
  };

  errors.push({
    source: "synthesis",
    message:
      "Synthesized from LLM cache: no source claims fetched, no validators run. Use only for surface-form analysis (Brief 056 Resolver dataset).",
  });

  for (const book of window) {
    const cached = await loadCached(book.slug);
    if (!cached) {
      errors.push({
        source: "synthesis",
        slug: book.slug,
        message: "no LLM cache entry for slug — skipped in synthesis",
      });
      continue;
    }
    const record = buildSynthRecord(book, cached);
    records.push(record);
    runCost = {
      totalTokensIn: runCost.totalTokensIn + (record.llmCostSummary?.tokensIn ?? 0),
      totalTokensOut: runCost.totalTokensOut + (record.llmCostSummary?.tokensOut ?? 0),
      totalWebSearches:
        runCost.totalWebSearches + (record.llmCostSummary?.webSearches ?? 0),
      estUsdCost: runCost.estUsdCost + (record.llmCostSummary?.estUsdCost ?? 0),
    };
  }

  const activeSources: SourceName[] = [];
  if (isLlmEnabled()) activeSources.push("llm");
  if (isHardcoverEnabled()) activeSources.push("hardcover");

  const diff: V2DiffFile = {
    ranAt: new Date().toISOString(),
    pipeline: "v2",
    pilot: cfg.batchName,
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
    errors,
    validationSummary: {
      year_outlier: 0,
      edition_isbn_conflict: 0,
      pagecount_outlier: 0,
      author_editor_suspicion: 0,
      lexicanum_missing: 0,
    },
    llmModel: getLlmModel(),
    llmPromptVersion: PROMPT_VERSION_HASH_V2,
    llmCostSummary: runCost,
  };

  const outDir = path.join(process.cwd(), "ingest", ".last-run");
  await mkdir(outDir, { recursive: true });
  const stamp = formatTimestamp(new Date(startedAt));
  const file = path.join(outDir, `v2-batch-${stamp}.diff.json`);
  await writeFile(file, JSON.stringify(diff, null, 2), "utf8");

  console.log(`\nwrote synthesized diff: ${file}`);
  console.log(
    `summary: ${records.length} records, ${errors.length} error(s) (incl. synthesis disclaimer), validations all 0 (cache-only mode)`,
  );
  console.log(
    `cost: $${runCost.estUsdCost.toFixed(3)} ` +
      `(${runCost.totalTokensIn}+${runCost.totalTokensOut} tokens, ${runCost.totalWebSearches} web_search)`,
  );
  if (records.length > 0) {
    console.log(
      `per-book averages: $${(runCost.estUsdCost / records.length).toFixed(4)}/book, ${(runCost.totalWebSearches / records.length).toFixed(2)} web_search/book`,
    );
  }
}

function formatTimestamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "-" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes())
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
