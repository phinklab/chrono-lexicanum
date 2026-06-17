/**
 * book-review.ts — Brief 154 (B11). The TS helper behind the bash driver
 * (mirrors `podcast-cc-tag.ts`). Subcommands, all DB-free except `parity`:
 *
 *   prepare                 project the 40 pilot books, chunk them, write the
 *                           finder inputs + a manifest.
 *   enumerate   --chunk N   validate a finder output against the contract, then
 *                           flatten it to the enumerated findings the verifier
 *                           addresses (its input). Idempotent.
 *   check-finder --chunk N  exit 0 iff the finder output validates (resume gate).
 *   check-verifier --chunk N exit 0 iff the verifier output covers every finding
 *                           (resume gate).
 *   merge                   keep confirmed findings, build the reviewQueue
 *                           sidecar + facet queue, cross-validate against the
 *                           REAL overlay, write outputs + the findings table.
 *   parity                  projection vs DB (loaded lazily — DB only here).
 *
 * Zero metered API: the model work happens in `claude -p` subsessions the bash
 * driver spawns; this helper only prepares inputs and validates/merges outputs.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  discoverAllBatches,
  loadBatchBooks,
  loadProjectionContext,
  projectBook,
  type ProjectedBook,
} from "./book-review/projection";
import {
  PILOT_BATCHES,
  PILOT_BOOK_IDS,
  REVIEW_CHUNK_SIZE,
  chunkBookIds,
} from "./book-review/selection";
import {
  FinderBatchSchema,
  VerifierBatchSchema,
  flattenFindings,
  type FlatFinding,
} from "./book-review/contract";
import {
  buildSidecar,
  countSentinels,
  loadRefSets,
  mergeIntoOverlay,
} from "./book-review/sidecar";
import { validateOverlay, type CurationOverlay } from "./curation-overlay";

const CWD = process.cwd();
const WORK_DIR = resolve(CWD, "ingest", "book-review", ".work");
const SEED_DIR = resolve(CWD, "scripts", "seed-data");
const LOG_PATH = resolve(CWD, "scripts", "logs", "book-review-log.md");
const SIDECAR_PATH = resolve(SEED_DIR, "book-review-queue.json");
const FACET_QUEUE_PATH = resolve(SEED_DIR, "facet-review-queue.json");

const pad = (n: number): string => String(n).padStart(2, "0");
const booksInputPath = (n: number): string => resolve(WORK_DIR, `chunk-${pad(n)}.books.json`);
const finderOutputPath = (n: number): string => resolve(WORK_DIR, `chunk-${pad(n)}.finder.json`);
const findingsPath = (n: number): string => resolve(WORK_DIR, `chunk-${pad(n)}.findings.json`);
const verifierOutputPath = (n: number): string => resolve(WORK_DIR, `chunk-${pad(n)}.verifier.json`);
const MANIFEST_PATH = resolve(WORK_DIR, "manifest.json");

interface Manifest {
  scope?: "pilot" | "full";
  generatedFor: string;
  chunkSize: number;
  chunks: Array<{ index: number; bookIds: string[] }>;
}
interface FindingsFile {
  chunk: number;
  findings: FlatFinding[];
}

function fail(msg: string): never {
  console.error(`[book-review] ${msg}`);
  process.exit(1);
}
function ok(msg: string): void {
  console.log(`[book-review] ${msg}`);
}
async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}
async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
function chunkArg(): number {
  const raw = arg("chunk");
  if (raw === undefined) fail("missing --chunk N");
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) fail(`bad --chunk "${raw}"`);
  return n;
}

// ---- prepare ----------------------------------------------------------------

/** Remove stale per-chunk state so a scope switch never resumes a wrong manifest. */
async function wipeWorkChunks(): Promise<void> {
  if (!existsSync(WORK_DIR)) return;
  for (const f of await readdir(WORK_DIR)) {
    if (f === "manifest.json" || /^chunk-\d+\.(books|finder|findings|verifier)\.json$/.test(f) || /^chunk-\d+\.log$/.test(f)) {
      await rm(resolve(WORK_DIR, f), { force: true });
    }
  }
}

async function cmdPrepare(): Promise<void> {
  const pilot = process.argv.includes("--pilot");
  const force = process.argv.includes("--force");
  const scope: "pilot" | "full" = pilot ? "pilot" : "full";
  await mkdir(WORK_DIR, { recursive: true });

  // Idempotent + resume-safe: if a manifest for the SAME scope + chunk size is
  // already present with all its book inputs, keep it (and any finder/verifier
  // outputs) so a re-run RESUMES instead of wiping progress. A scope/size change
  // (or --force) rebuilds from scratch.
  if (!force && existsSync(MANIFEST_PATH)) {
    try {
      const prev = await readJson<Manifest>(MANIFEST_PATH);
      const inputsPresent = prev.chunks.every((c) => existsSync(booksInputPath(c.index)));
      if ((prev.scope ?? "full") === scope && prev.chunkSize === REVIEW_CHUNK_SIZE && inputsPresent) {
        ok(`manifest current (${prev.chunks.length} chunk(s), scope=${scope}) — resuming, no rebuild`);
        return;
      }
    } catch {
      /* unreadable manifest → fall through and rebuild */
    }
  }
  await wipeWorkChunks();

  const ctx = await loadProjectionContext();
  const batches = pilot ? [...PILOT_BATCHES] : await discoverAllBatches();
  const batchBooks = await loadBatchBooks(batches);

  // Pilot = the fixed calibration ids; full sweep = every book the batches carry,
  // in deterministic (sorted-batch, file-order) sequence.
  let bookIds: string[];
  if (pilot) {
    const missing = PILOT_BOOK_IDS.filter((id) => !batchBooks.has(id));
    if (missing.length) fail(`pilot books absent from SSOT batches: ${missing.join(", ")}`);
    bookIds = [...PILOT_BOOK_IDS];
  } else {
    bookIds = [...batchBooks.keys()];
  }

  const projected: ProjectedBook[] = bookIds.map((id) => projectBook(batchBooks.get(id)!, ctx));
  const chunks = chunkBookIds(bookIds);
  const manifest: Manifest = {
    scope: pilot ? "pilot" : "full",
    generatedFor: pilot ? "W40K-0001..W40K-0040" : `${bookIds.length} books across ${batches.length} batches`,
    chunkSize: REVIEW_CHUNK_SIZE,
    chunks: chunks.map((ids, index) => ({ index, bookIds: ids })),
  };
  const byId = new Map(projected.map((p) => [p.externalBookId, p]));
  for (const { index, bookIds: ids } of manifest.chunks) {
    await writeJson(
      booksInputPath(index),
      { chunk: index, books: ids.map((id) => byId.get(id)!) },
    );
  }
  await writeJson(MANIFEST_PATH, manifest);
  ok(`prepared ${projected.length} books → ${chunks.length} chunk(s) of ≤${REVIEW_CHUNK_SIZE} [${manifest.scope}] in ${WORK_DIR}`);
}

// ---- finder validation + enumeration ----------------------------------------

async function loadChunkBookIds(n: number): Promise<string[]> {
  const manifest = await readJson<Manifest>(MANIFEST_PATH);
  const entry = manifest.chunks.find((c) => c.index === n);
  if (!entry) fail(`chunk ${n} not in manifest — run prepare first`);
  return entry!.bookIds;
}

async function validateFinder(n: number): Promise<FlatFinding[]> {
  if (!existsSync(finderOutputPath(n))) fail(`chunk ${n}: finder output missing`);
  const bookIds = await loadChunkBookIds(n);
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(finderOutputPath(n), "utf8"));
  } catch (e) {
    fail(`chunk ${n}: finder output is not JSON: ${e instanceof Error ? e.message : e}`);
  }
  const parsed = FinderBatchSchema.safeParse(raw);
  if (!parsed.success) fail(`chunk ${n}: finder output fails the contract: ${parsed.error.issues[0]?.message ?? "invalid"}`);
  const got = new Set(Object.keys(parsed.data));
  for (const id of bookIds) if (!got.has(id)) fail(`chunk ${n}: finder output missing book "${id}"`);
  for (const id of got) if (!bookIds.includes(id)) fail(`chunk ${n}: finder output has stray book "${id}"`);
  return flattenFindings(parsed.data, bookIds);
}

async function cmdCheckFinder(n: number): Promise<void> {
  await validateFinder(n);
  ok(`chunk ${n}: finder output valid`);
}

async function cmdEnumerate(n: number): Promise<void> {
  const findings = await validateFinder(n);
  await writeJson(findingsPath(n), { chunk: n, findings } satisfies FindingsFile);
  ok(`chunk ${n}: ${findings.length} finding(s) enumerated for verification`);
}

// ---- verifier validation ----------------------------------------------------

async function cmdCheckVerifier(n: number): Promise<void> {
  if (!existsSync(findingsPath(n))) fail(`chunk ${n}: findings file missing — run enumerate first`);
  if (!existsSync(verifierOutputPath(n))) fail(`chunk ${n}: verifier output missing`);
  const { findings } = await readJson<FindingsFile>(findingsPath(n));
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(verifierOutputPath(n), "utf8"));
  } catch (e) {
    fail(`chunk ${n}: verifier output is not JSON: ${e instanceof Error ? e.message : e}`);
  }
  const parsed = VerifierBatchSchema.safeParse(raw);
  if (!parsed.success) fail(`chunk ${n}: verifier output fails the contract: ${parsed.error.issues[0]?.message ?? "invalid"}`);
  for (let i = 0; i < findings.length; i++) {
    if (!(String(i) in parsed.data)) fail(`chunk ${n}: verifier output missing verdict for finding ${i}`);
  }
  for (const key of Object.keys(parsed.data)) {
    const i = Number(key);
    if (!Number.isInteger(i) || i < 0 || i >= findings.length) fail(`chunk ${n}: verifier verdict has stray index "${key}"`);
  }
  ok(`chunk ${n}: verifier output valid (${findings.length} verdict(s))`);
}

// ---- merge ------------------------------------------------------------------

type DimKey = "factions" | "locations" | "characters" | "facets";
interface DimStat {
  raw: number;
  confirmed: number;
  refuted: number;
}

async function cmdMerge(): Promise<void> {
  const manifest = await readJson<Manifest>(MANIFEST_PATH);
  const refs = await loadRefSets();
  const ctx = await loadProjectionContext();
  const realOverlay = validateOverlay(
    await readJson<unknown>(resolve(SEED_DIR, "curation-overlay.json")),
    refs,
  );

  const confirmed: FlatFinding[] = [];
  const stats: Record<DimKey, DimStat> = {
    factions: { raw: 0, confirmed: 0, refuted: 0 },
    locations: { raw: 0, confirmed: 0, refuted: 0 },
    characters: { raw: 0, confirmed: 0, refuted: 0 },
    facets: { raw: 0, confirmed: 0, refuted: 0 },
  };
  const refutedLog: Array<{ finding: FlatFinding; reason: string }> = [];

  for (const { index } of manifest.chunks) {
    const { findings } = await readJson<FindingsFile>(findingsPath(index));
    const verifier = VerifierBatchSchema.parse(await readJson<unknown>(verifierOutputPath(index)));
    findings.forEach((f, i) => {
      const verdict = verifier[String(i)];
      if (!verdict) fail(`chunk ${index}: no verdict for finding ${i} — run check-verifier`);
      const dim = f.dimension as DimKey;
      stats[dim].raw += 1;
      if (verdict.verdict === "confirm") {
        stats[dim].confirmed += 1;
        confirmed.push(f);
      } else {
        stats[dim].refuted += 1;
        refutedLog.push({ finding: f, reason: verdict.reason });
      }
    });
  }

  const checkedAt = (process.env.BOOK_REVIEW_DATE ?? new Date().toISOString().slice(0, 10)).slice(0, 10);
  const result = buildSidecar(confirmed, realOverlay, ctx, checkedAt);

  // In-loop gate: the sidecar itself is 149-valid (final empty + reviewQueue structural).
  validateOverlay(result.sidecar, refs);
  // Strong cross-validation: the sidecar folds into the REAL overlay with no
  // collision (no book in final+queue, no unmergeable dup) and still validates.
  validateOverlay(mergeIntoOverlay(realOverlay, result.sidecar), refs);

  await writeJson(SIDECAR_PATH, result.sidecar);
  await writeJson(FACET_QUEUE_PATH, result.facetQueue);
  await writeLog(stats, result, refutedLog, checkedAt, manifest);

  ok(
    `merged: ${confirmed.length} confirmed → ` +
      `${result.sidecar.reviewQueue?.books.length ?? 0} reviewQueue book(s), ` +
      `${result.facetQueue.books.length} facet-note book(s), ` +
      `${countSentinels(result.sidecar)} sentinel(s), ` +
      `${result.conflictsWithFinal.length} final-conflict(s), ` +
      `${result.ledgerConflicts.length} ledger-conflict(s)`,
  );
  if (result.ledgerConflicts.length > 0) {
    ok(`  ledger conflicts withheld for manual reconcile: ${result.ledgerConflicts.map((c) => `${c.externalBookId} ${c.axis}:${c.id}`).join(", ")}`);
  }
}

async function writeLog(
  stats: Record<DimKey, DimStat>,
  result: Awaited<ReturnType<typeof buildSidecar>>,
  refutedLog: Array<{ finding: FlatFinding; reason: string }>,
  checkedAt: string,
  manifest: Manifest,
): Promise<void> {
  const dims: DimKey[] = ["factions", "locations", "characters", "facets"];
  const rows = dims
    .map((d) => `| ${d} | ${stats[d].raw} | ${stats[d].confirmed} | ${stats[d].refuted} |`)
    .join("\n");
  const total = dims.reduce(
    (a, d) => ({ raw: a.raw + stats[d].raw, confirmed: a.confirmed + stats[d].confirmed, refuted: a.refuted + stats[d].refuted }),
    { raw: 0, confirmed: 0, refuted: 0 },
  );
  const refuted = refutedLog
    .map((r) => `- \`${r.finding.key}\` — ${r.reason}`)
    .join("\n");
  const finalConflicts = result.conflictsWithFinal
    .map((c) => `- ${c.externalBookId} ${c.dimension}:${c.op} ${c.id ?? c.name ?? ""} — ${c.note}`)
    .join("\n");
  const ledgerConflicts = result.ledgerConflicts
    .map((c) => `- \`${c.externalBookId}\` ${c.axis}:\`${c.id}\` — ${c.detail} (BOTH sides withheld from the queue)`)
    .join("\n");

  const isPilot = (manifest.scope ?? "full") === "pilot";
  const heading = isPilot
    ? "# Book-reviewer pilot — findings (W40K-0001…W40K-0040)"
    : `# Book-reviewer full run — findings (${manifest.generatedFor})`;
  const caption = isPilot
    ? `> Calibration bias: this slice (Eisenhorn/Ravenor) is Cowork-Opus ground truth
> and unusually clean — the false-positive rate below is a LOWER bound, not to
> be naively extrapolated to all 889 books.`
    : `> Full catalog sweep (${manifest.chunks.length} chunks of ≤${manifest.chunkSize}). Every
> finding is a PROPOSAL — nothing here is applied. The pilot slice's low
> false-positive rate does NOT hold here; the messier bulk needs human triage.`;

  const body = `${heading}

_Generated ${checkedAt} · model = Opus (finder + verifier) · chunk size ${REVIEW_CHUNK_SIZE}._

${caption}

## Findings (raw / confirmed / refuted, pattern 144)

| dimension | raw | confirmed | refuted |
|---|---|---|---|
${rows}
| **total** | **${total.raw}** | **${total.confirmed}** | **${total.refuted}** |

- Confirmed faction/junction proposals → \`scripts/seed-data/book-review-queue.json\` (reviewQueue, never applied).
- Confirmed facet proposals → \`scripts/seed-data/facet-review-queue.json\` (notes only, no apply path).
- Unresolved-sentinel additions: ${countSentinelsLine(result)}.
- Findings on books already in curation-overlay \`final\` (routed out of the queue): ${result.conflictsWithFinal.length}.

## Refuted (sorted out, not queued)

${refuted || "_none_"}

## Ledger conflicts (confirmed add + remove on one axis+id — withheld, manual reconcile)

${ledgerConflicts || "_none_"}

## Findings on already-final books (manual reconcile)

${finalConflicts || "_none_"}
`;
  await mkdir(resolve(CWD, "scripts", "logs"), { recursive: true });
  await writeFile(LOG_PATH, body, "utf8");
}

function countSentinelsLine(result: Awaited<ReturnType<typeof buildSidecar>>): string {
  return `${countSentinels(result.sidecar)} (unresolved surface forms carried as \`__unresolved__:<axis>:<slug>\`)`;
}

// ---- parity (DB — lazy import) ----------------------------------------------

async function cmdParity(): Promise<void> {
  const { runParity } = await import("./book-review/parity");
  const ctx = await loadProjectionContext();
  const batchBooks = await loadBatchBooks(PILOT_BATCHES);
  const report = await runParity(PILOT_BOOK_IDS, ctx, batchBooks);

  console.log(`\n[book-review parity] checked ${report.booksChecked} book(s) against the DB`);
  console.log(`  final-tail book (W40K-0010) checked: ${report.finalTailBookChecked}`);
  console.log(`  facet counts — projection: ${report.facetCounts.projection.visible} visible / ${report.facetCounts.projection.cw} cw; db: ${report.facetCounts.db.visible} visible / ${report.facetCounts.db.cw} cw`);
  if (report.booksMissingInDb.length) {
    console.log(`  books not in DB (${report.booksMissingInDb.length}): ${report.booksMissingInDb.join(", ")}`);
  }
  if (report.mismatches.length === 0) {
    ok("parity GREEN — projection deckungsgleich with work_* edges + raw facets");
  } else {
    console.error(`\n[book-review parity] ${report.mismatches.length} mismatch(es):`);
    for (const m of report.mismatches) {
      console.error(`  ${m.externalBookId} ${m.axis}${m.isFinalTailBook ? " [final-tail]" : ""}: ${m.detail}`);
    }
    process.exit(1);
  }
}

// ---- dispatch ---------------------------------------------------------------

async function main(): Promise<void> {
  const cmd = process.argv[2];
  switch (cmd) {
    case "prepare":
      return cmdPrepare();
    case "check-finder":
      return cmdCheckFinder(chunkArg());
    case "enumerate":
      return cmdEnumerate(chunkArg());
    case "check-verifier":
      return cmdCheckVerifier(chunkArg());
    case "merge":
      return cmdMerge();
    case "parity":
      return cmdParity();
    default:
      fail(`unknown subcommand "${cmd ?? ""}" (prepare|enumerate|check-finder|check-verifier|merge|parity)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
