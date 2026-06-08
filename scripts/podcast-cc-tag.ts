/**
 * Brief 131 — cc-direct tagging helper (Variant B). Anthropic-free: imports only
 * the SDK-free podcast lib, so running it never makes a metered API call. It is
 * the tsx half of the tagging stage; the LLM half is the `claude -p` subsessions
 * the driver (`scripts/run-podcast-tag-loop.sh`) spawns between `prepare` and
 * `merge`.
 *
 * Commands (all take `--out <name>`, the basename chosen at acquire):
 *   prepare           Read the acquire manifest, chunk its episodes into batches
 *                     of exactly CC_TAG_BATCH_SIZE, and write one
 *                     `batch-NNN.input.json` per batch (guid + title + capped
 *                     description) plus a `batches.json` index. Idempotent.
 *   check  --batch N  Validate one batch's `batch-NNN.output.json` (written by a
 *                     `claude -p` subsession): present, valid JSON, covers exactly
 *                     that batch's guids, every extraction structurally sound.
 *                     Exit 0 = accept, non-zero = the driver re-runs the batch.
 *   status            Print which batches are tagged vs pending (resumability).
 *   merge  [--model]  Join all batch outputs into the committed
 *                     `ingest/podcasts/<out>.extractions.json` (keyed on guid).
 *
 * All working files live under `ingest/podcasts/.cc-tag/<out>/` (gitignored). The
 * only committed output is `<out>.extractions.json` — the Brief 131 contract.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";

import {
  serializeExtractions,
  validateExtractionStrict,
  type ExtractionsFile,
} from "@/lib/ingestion/podcast/extraction";
import {
  batchInputName,
  batchOutputName,
  CC_TAG_BATCH_SIZE,
  ccTagWorkDir,
  chunkIntoBatches,
  parseManifest,
  podcastOutDir,
} from "@/lib/ingestion/podcast/manifest";
import { MAX_DESC_CHARS } from "@/lib/ingestion/podcast/prompt";
import type { EpisodeExtraction, PodcastEpisode } from "@/lib/ingestion/podcast/types";

/** Default model label stamped into the extractions file — the model the driver's
 *  `claude -p --model sonnet` alias resolves to. Overridable via `--merge`. */
const DEFAULT_MODEL_LABEL = "claude-sonnet-4-6";

function fail(msg: string): never {
  console.error(`error: ${msg}`);
  process.exit(1);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** One batch's tagging input — what a `claude -p` subsession reads. */
interface BatchInput {
  batch: number;
  promptVersion: string;
  episodes: Array<{ guid: string; title: string; description: string }>;
}

/** The batch plan — single source of which guids belong to which batch. */
interface BatchesIndex {
  show: string;
  out: string;
  promptVersion: string;
  batchSize: number;
  count: number;
  batches: Array<{ index: number; guids: string[] }>;
}

/** Same description cap the api path applies (`extract.ts` buildUserPrompt). */
function capDescription(text: string): string {
  return text.length > MAX_DESC_CHARS
    ? text.slice(0, MAX_DESC_CHARS).trimEnd() + " […]"
    : text;
}

async function readManifestFor(out: string): Promise<{
  workDir: string;
  manifest: Awaited<ReturnType<typeof parseManifest>>;
}> {
  const workDir = ccTagWorkDir(out);
  const manifestPath = join(workDir, "manifest.json");
  if (!existsSync(manifestPath)) {
    fail(
      `${manifestPath} not found — run acquire first:\n` +
        `  npm run ingest:podcast -- --tagging=cc-direct --stage=acquire --show <slug> --out ${out}`,
    );
  }
  const manifest = parseManifest(await readFile(manifestPath, "utf8"));
  return { workDir, manifest };
}

async function readBatchesIndex(workDir: string, out: string): Promise<BatchesIndex> {
  const path = join(workDir, "batches.json");
  if (!existsSync(path)) {
    fail(`${path} not found — run \`podcast-cc-tag prepare --out ${out}\` first`);
  }
  const raw: unknown = JSON.parse(await readFile(path, "utf8"));
  if (!isObject(raw) || !Array.isArray(raw.batches) || typeof raw.count !== "number") {
    fail(`${path}: malformed batches index`);
  }
  return raw as unknown as BatchesIndex;
}

// --- prepare -----------------------------------------------------------------

async function cmdPrepare(out: string): Promise<void> {
  const { workDir, manifest } = await readManifestFor(out);
  const batches: PodcastEpisode[][] = chunkIntoBatches(manifest.episodes);

  await mkdir(workDir, { recursive: true });
  for (let i = 0; i < batches.length; i++) {
    const input: BatchInput = {
      batch: i,
      promptVersion: manifest.promptVersion,
      episodes: batches[i].map((e) => ({
        guid: e.guid,
        title: e.title,
        description: capDescription(e.descriptionText),
      })),
    };
    await writeFile(join(workDir, batchInputName(i)), JSON.stringify(input, null, 2) + "\n", "utf8");
  }

  const index: BatchesIndex = {
    show: manifest.show.slug,
    out,
    promptVersion: manifest.promptVersion,
    batchSize: CC_TAG_BATCH_SIZE,
    count: batches.length,
    batches: batches.map((b, i) => ({ index: i, guids: b.map((e) => e.guid) })),
  };
  await writeFile(join(workDir, "batches.json"), JSON.stringify(index, null, 2) + "\n", "utf8");

  console.log(
    `prepared ${batches.length} batch(es) of ≤${CC_TAG_BATCH_SIZE} for "${manifest.show.slug}" ` +
      `(${manifest.episodes.length} episodes) under ${workDir}`,
  );
}

// --- check (one batch's subsession output) -----------------------------------

/** Validate a batch output object against its expected guids. Returns the
 *  accepted extractions, or `fail()`s with the first problem. */
function validateBatchOutput(
  parsed: unknown,
  guids: readonly string[],
  where: string,
): Record<string, EpisodeExtraction> {
  if (!isObject(parsed)) fail(`${where}: output must be a JSON object keyed by episodeGuid`);
  const expected = new Set(guids);
  const accepted: Record<string, EpisodeExtraction> = {};
  for (const g of guids) {
    if (!(g in parsed)) fail(`${where}: missing extraction for guid "${g}"`);
    try {
      accepted[g] = validateExtractionStrict(parsed[g], `${where} guid "${g}"`);
    } catch (e) {
      fail(`${where}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  for (const g of Object.keys(parsed)) {
    if (!expected.has(g)) fail(`${where}: unexpected guid "${g}" (not a member of this batch)`);
  }
  return accepted;
}

async function cmdCheck(out: string, batchIndex: number): Promise<void> {
  const workDir = ccTagWorkDir(out);
  const index = await readBatchesIndex(workDir, out);
  const batch = index.batches[batchIndex];
  if (!batch) fail(`no batch ${batchIndex} (count=${index.count})`);

  const outPath = join(workDir, batchOutputName(batchIndex));
  if (!existsSync(outPath)) fail(`batch ${batchIndex}: ${outPath} not written yet`);

  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(outPath, "utf8"));
  } catch (e) {
    fail(`batch ${batchIndex}: invalid JSON in ${outPath}: ${e instanceof Error ? e.message : e}`);
  }
  validateBatchOutput(parsed, batch.guids, `batch ${batchIndex}`);
  console.log(`batch ${batchIndex}: OK (${batch.guids.length} extractions)`);
}

// --- status ------------------------------------------------------------------

async function cmdStatus(out: string): Promise<void> {
  const workDir = ccTagWorkDir(out);
  const index = await readBatchesIndex(workDir, out);
  let done = 0;
  for (const b of index.batches) {
    const present = existsSync(join(workDir, batchOutputName(b.index)));
    if (present) done += 1;
    console.log(`  batch ${String(b.index).padStart(3, "0")}: ${present ? "tagged" : "pending"} (${b.guids.length} eps)`);
  }
  console.log(`${done}/${index.count} batch(es) tagged for "${index.show}" (out=${out})`);
}

// --- merge -------------------------------------------------------------------

async function cmdMerge(out: string, modelLabel: string): Promise<void> {
  const workDir = ccTagWorkDir(out);
  const index = await readBatchesIndex(workDir, out);

  const extractions: Record<string, EpisodeExtraction> = {};
  for (const b of index.batches) {
    const outPath = join(workDir, batchOutputName(b.index));
    if (!existsSync(outPath)) {
      fail(`batch ${b.index} not tagged yet (${outPath} missing) — run the driver to completion`);
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(await readFile(outPath, "utf8"));
    } catch (e) {
      fail(`batch ${b.index}: invalid JSON: ${e instanceof Error ? e.message : e}`);
    }
    const accepted = validateBatchOutput(parsed, b.guids, `batch ${b.index}`);
    for (const [g, ext] of Object.entries(accepted)) extractions[g] = ext;
  }

  const file: ExtractionsFile = {
    show: index.show,
    tagging: "cc-direct",
    model: modelLabel,
    promptVersion: index.promptVersion,
    extractions,
  };
  const outDir = podcastOutDir();
  await mkdir(outDir, { recursive: true });
  const outPath = join(outDir, `${out}.extractions.json`);
  await writeFile(outPath, serializeExtractions(file), "utf8");

  console.log(
    `merged ${Object.keys(extractions).length} extraction(s) from ${index.count} batch(es) ` +
      `→ ${outPath}\nmodel=${modelLabel} · prompt ${index.promptVersion}\n` +
      `next: npm run ingest:podcast -- --tagging=cc-direct --stage=assemble --out ${out}`,
  );
}

// --- CLI ---------------------------------------------------------------------

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      out: { type: "string" },
      batch: { type: "string" },
      model: { type: "string" },
    },
    strict: true,
  });

  const cmd = positionals[0];
  if (!cmd) {
    fail("usage: podcast-cc-tag <prepare|check|status|merge> --out <name> [--batch N] [--model label]");
  }
  const out = values.out;
  if (!out || out.trim() === "") fail("--out <name> is required");

  switch (cmd) {
    case "prepare":
      return cmdPrepare(out);
    case "status":
      return cmdStatus(out);
    case "check": {
      if (values.batch === undefined) fail("check requires --batch <N>");
      const n = Number.parseInt(values.batch, 10);
      if (!Number.isFinite(n) || n < 0) fail(`--batch must be a non-negative integer (got ${values.batch})`);
      return cmdCheck(out, n);
    }
    case "merge":
      return cmdMerge(out, values.model?.trim() || DEFAULT_MODEL_LABEL);
    default:
      fail(`unknown command "${cmd}" (use prepare|check|status|merge)`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
