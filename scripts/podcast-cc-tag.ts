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
 *   prepare-delta     Brief 172. Like `prepare`, but chunk ONLY the episodes not
 *     [--week|          already in the committed `<out>.extractions.json` — the
 *      --proposal]      delta (new guids). "up to date" when there is nothing new.
 *                     Optional `--week`/`--proposal` cross-checks the delta against
 *                     the weekly detection proposal (source-drift → needs-decision).
 *   check  --batch N  Validate one batch's `batch-NNN.output.json` (written by a
 *                     `claude -p` subsession): present, valid JSON, covers exactly
 *                     that batch's guids, every extraction structurally sound.
 *                     Exit 0 = accept, non-zero = the driver re-runs the batch.
 *   status            Print which batches are tagged vs pending (resumability).
 *   merge  [--model]  Join all batch outputs into the committed
 *                     `ingest/podcasts/<out>.extractions.json` (keyed on guid).
 *                     Refuses a delta plan — use `merge-delta`.
 *   merge-delta       Brief 172. UNION the delta batch outputs INTO the existing
 *     [--model]         `<out>.extractions.json` (additive; never overwrites a
 *                     reviewed extraction, never shrinks). Header drift / guid
 *                     ambiguity stops with needs-decision.
 *
 * All working files live under `ingest/podcasts/.cc-tag/<out>/` (gitignored). The
 * only committed output is `<out>.extractions.json` — the Brief 131 contract.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";

import {
  DeltaGuardError,
  mergeExtractionsDelta,
  partitionProposalGuids,
  selectDeltaGuids,
} from "@/lib/ingestion/podcast/delta";
import {
  parseExtractionsFile,
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

import { findProposalPath, loadProposal } from "./refresh/proposal-path";

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

/** The batch plan — single source of which guids belong to which batch.
 *  `mode` (Brief 172): `"full"` = every manifest episode (the classic `prepare`,
 *  merged by `merge`); `"delta"` = only the new guids (`prepare-delta`, merged by
 *  `merge-delta`). Absent → treated as `"full"` (back-compat with pre-172 plans). */
interface BatchesIndex {
  show: string;
  out: string;
  promptVersion: string;
  batchSize: number;
  count: number;
  mode?: "full" | "delta";
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

/** Read the committed `<out>.extractions.json` if present (the delta baseline),
 *  else null (a brand-new show's first tag). */
async function readExistingExtractions(out: string): Promise<ExtractionsFile | null> {
  const path = join(podcastOutDir(), `${out}.extractions.json`);
  if (!existsSync(path)) return null;
  return parseExtractionsFile(await readFile(path, "utf8"));
}

/** Chunk `episodes` into batch inputs + a `batches.json` index of the given mode.
 *  Shared by `prepare` (full) and `prepare-delta` (only new guids). */
async function writeBatchPlan(
  workDir: string,
  out: string,
  show: string,
  promptVersion: string,
  episodes: PodcastEpisode[],
  mode: "full" | "delta",
): Promise<number> {
  const batches: PodcastEpisode[][] = chunkIntoBatches(episodes);
  await mkdir(workDir, { recursive: true });
  for (let i = 0; i < batches.length; i++) {
    const input: BatchInput = {
      batch: i,
      promptVersion,
      episodes: batches[i].map((e) => ({
        guid: e.guid,
        title: e.title,
        description: capDescription(e.descriptionText),
      })),
    };
    await writeFile(join(workDir, batchInputName(i)), JSON.stringify(input, null, 2) + "\n", "utf8");
  }
  const index: BatchesIndex = {
    show,
    out,
    promptVersion,
    batchSize: CC_TAG_BATCH_SIZE,
    count: batches.length,
    mode,
    batches: batches.map((b, i) => ({ index: i, guids: b.map((e) => e.guid) })),
  };
  await writeFile(join(workDir, "batches.json"), JSON.stringify(index, null, 2) + "\n", "utf8");
  return batches.length;
}

async function cmdPrepare(out: string): Promise<void> {
  const { workDir, manifest } = await readManifestFor(out);
  const count = await writeBatchPlan(
    workDir,
    out,
    manifest.show.slug,
    manifest.promptVersion,
    manifest.episodes,
    "full",
  );
  console.log(
    `prepared ${count} batch(es) of ≤${CC_TAG_BATCH_SIZE} for "${manifest.show.slug}" ` +
      `(${manifest.episodes.length} episodes) under ${workDir}`,
  );
}

// --- prepare-delta (Brief 172: only the new guids) ---------------------------

/** The proposal's new-episode guids for one show, or null if the proposal has no
 *  entry for it. Pure lookup — the CLI decides how to react to drift. */
function proposalNewGuidsForShow(
  proposalPath: string,
  showSlug: string,
): { guids: string[]; isoWeek: string } | null {
  const proposal = loadProposal(proposalPath);
  const show = proposal.podcasts?.shows?.find((s) => s.slug === showSlug);
  if (!show) return null;
  return { guids: (show.newEpisodes ?? []).map((e) => e.guid), isoWeek: proposal.isoWeek };
}

async function cmdPrepareDelta(
  out: string,
  proposalOpts: { week?: string; proposal?: string; useProposal: boolean },
): Promise<void> {
  const { workDir, manifest } = await readManifestFor(out);
  const existing = await readExistingExtractions(out);
  const existingGuids = existing ? Object.keys(existing.extractions) : [];

  // Prompt-version drift is a needs-decision: mixing prompt versions into one
  // artifact is exactly what the delta must not do (mirrors merge-delta's guard,
  // caught here BEFORE any tagging burns a subsession).
  if (existing && existing.promptVersion !== manifest.promptVersion) {
    throw new DeltaGuardError(
      `prompt-version drift: committed "${existing.promptVersion}" vs current "${manifest.promptVersion}". ` +
        `The tagging conventions changed since "${manifest.show.slug}" was last tagged — re-tag the whole ` +
        `show under the new prompt, or stop and decide (needs-decision).`,
    );
  }

  const manifestGuids = manifest.episodes.map((e) => e.guid);
  const { newGuids, alreadyTagged } = selectDeltaGuids(manifestGuids, existingGuids);

  // Optional cross-check against the weekly detection proposal (Brief 172
  // §Podcast-Delta step 1: "neue GUIDs je Show aus dem Proposal lesen").
  if (proposalOpts.useProposal) {
    const proposalPath = findProposalPath({ week: proposalOpts.week, proposal: proposalOpts.proposal });
    const found = proposalNewGuidsForShow(proposalPath, manifest.show.slug);
    if (!found) {
      console.log(
        `note: proposal ${proposalPath} has no entry for "${manifest.show.slug}" — ` +
          `proceeding with the manifest∖extractions delta.`,
      );
    } else {
      const part = partitionProposalGuids(found.guids, manifestGuids, existingGuids);
      if (part.missingFromFeed.length > 0) {
        throw new DeltaGuardError(
          `source drift: ${part.missingFromFeed.length} guid(s) the proposal (${found.isoWeek}) flagged as new ` +
            `for "${manifest.show.slug}" are no longer in the live feed: ${part.missingFromFeed.join(", ")}. ` +
            `The feed changed since detection ran — re-run refresh:check, or stop and decide (needs-decision).`,
        );
      }
      console.log(
        `proposal ${found.isoWeek}: ${part.toTag.length} to tag, ${part.alreadyTagged.length} already tagged ` +
          `(of ${found.guids.length} flagged new for "${manifest.show.slug}").`,
      );
    }
  }

  if (newGuids.length === 0) {
    console.log(
      `"${manifest.show.slug}" is up to date — 0 new episode(s) ` +
        `(${alreadyTagged.length} already tagged). Nothing to prepare.`,
    );
    return;
  }

  const newSet = new Set(newGuids);
  const deltaEpisodes = manifest.episodes.filter((e) => newSet.has(e.guid));
  const count = await writeBatchPlan(
    workDir,
    out,
    manifest.show.slug,
    manifest.promptVersion,
    deltaEpisodes,
    "delta",
  );
  console.log(
    `prepared DELTA: ${count} batch(es) of ≤${CC_TAG_BATCH_SIZE} for "${manifest.show.slug}" ` +
      `(${newGuids.length} new episode(s), ${alreadyTagged.length} already tagged) under ${workDir}\n` +
      `next: tag via scripts/run-podcast-tag-loop.sh --out ${out}, then \`merge-delta --out ${out}\`.`,
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

/** Read + validate every batch output into a single guid → extraction map (the
 *  shared collection step for both `merge` and `merge-delta`). */
async function collectBatchExtractions(
  workDir: string,
  index: BatchesIndex,
): Promise<Record<string, EpisodeExtraction>> {
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
  return extractions;
}

async function cmdMerge(out: string, modelLabel: string): Promise<void> {
  const workDir = ccTagWorkDir(out);
  const index = await readBatchesIndex(workDir, out);

  // A delta plan would drop every non-delta guid if written by the full `merge`
  // (it overwrites, not unions) — refuse and point at merge-delta (needs-decision
  // footgun guard, Brief 172).
  if (index.mode === "delta") {
    fail(
      `batches.json is a DELTA plan (mode=delta) — \`merge\` overwrites and would drop the existing ` +
        `corpus. Use \`merge-delta --out ${out}\` instead.`,
    );
  }

  const extractions = await collectBatchExtractions(workDir, index);
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

// --- merge-delta (Brief 172: additive union into the committed file) ---------

async function cmdMergeDelta(out: string, modelLabel: string): Promise<void> {
  const workDir = ccTagWorkDir(out);
  const index = await readBatchesIndex(workDir, out);
  const existing = await readExistingExtractions(out);

  // Fresh show (no committed file) → the delta IS the whole file; keep the label.
  // Existing show → the committed model wins (a mismatched --model is a drift the
  // merge helper rejects, so surface it clearly here first).
  const model = existing?.model ?? modelLabel;
  const incoming = await collectBatchExtractions(workDir, index);

  const { file, added, unchanged } = mergeExtractionsDelta(existing, {
    show: index.show,
    model,
    promptVersion: index.promptVersion,
    extractions: incoming,
  });

  const outDir = podcastOutDir();
  await mkdir(outDir, { recursive: true });
  const outPath = join(outDir, `${out}.extractions.json`);
  await writeFile(outPath, serializeExtractions(file), "utf8");

  const total = Object.keys(file.extractions).length;
  console.log(
    `merge-delta: +${added.length} new, ${unchanged.length} unchanged → ${total} total extraction(s) ` +
      `in ${outPath}\nmodel=${model} · prompt ${index.promptVersion}\n` +
      `next: npm run ingest:podcast -- --tagging=cc-direct --stage=assemble --out ${out}` +
      ` then npm run apply:podcast -- --show ${index.show} (DB-write gate).`,
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
      week: { type: "string" },
      proposal: { type: "string" },
    },
    strict: true,
  });

  const cmd = positionals[0];
  if (!cmd) {
    fail(
      "usage: podcast-cc-tag <prepare|prepare-delta|check|status|merge|merge-delta> --out <name> " +
        "[--batch N] [--model label] [--week YYYY-Www | --proposal <path>]",
    );
  }
  const out = values.out;
  if (!out || out.trim() === "") fail("--out <name> is required");

  switch (cmd) {
    case "prepare":
      return cmdPrepare(out);
    case "prepare-delta":
      return cmdPrepareDelta(out, {
        week: values.week,
        proposal: values.proposal,
        useProposal: values.week !== undefined || values.proposal !== undefined,
      });
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
    case "merge-delta":
      return cmdMergeDelta(out, values.model?.trim() || DEFAULT_MODEL_LABEL);
    default:
      fail(`unknown command "${cmd}" (use prepare|prepare-delta|check|status|merge|merge-delta)`);
  }
}

main().catch((e) => {
  // A DeltaGuardError is the needs-decision signal — flag it so the operator (and
  // the runbook) can tell "stop and ask" apart from a plain failure.
  if (e instanceof DeltaGuardError) {
    console.error(`NEEDS-DECISION: ${e.message}`);
    process.exit(2);
  }
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
