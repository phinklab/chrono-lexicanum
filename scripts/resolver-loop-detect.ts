/**
 * resolver-loop-detect.ts — pure-core detector for the headless Resolver-Loop (Brief 094).
 *
 * One loop iteration figures out which W40K wave to drive next, builds a fresh
 * ResolverPassConfig for that wave, or signals one of two terminal states
 * (idle / w40k-complete). Mirror of scripts/loop-next-batch.ts:
 *
 *   - `detectNextWave(input)` is PURE (no FS/DB) — the unit-test seam.
 *   - `buildWaveConfig(wave)` is PURE — produces the ResolverPassConfig JSON.
 *   - `parseResolverLoopLog(content)` is PURE — extracts progress + next-pass.
 *   - `main()` does the file I/O (roster + seed dir + resolver-loop-log) and
 *     prints the result on stdout. With `--write-config <path>`, also writes
 *     the auto-generated config to that file when status === "open-wave".
 *
 * Wave-sizing (Brief 094):
 *   WAVE_TARGET = 50, WAVE_HARD_CAP = 60.
 *   waveCount = ceil(restBooks / WAVE_HARD_CAP).
 *   For the canonical 115-book remnant (batches 046..057 = 10×11 + 5):
 *     waveCount = 2, first wave 046..051 (60 books), second 052..057 (55).
 *
 * Three terminal states:
 *   - "open-wave":     at least one crystallized batch above resolverProgressBatch.
 *   - "idle":          no open batch — operator needs to run the SSOT-Loop further.
 *   - "w40k-complete": progress covers the full W40K roster (HH ignored — the
 *                      resolver-loop is W40K-only).
 *
 * Run:  npm run resolver:next-wave
 * Test: npm run test:resolver-loop-detect
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const WAVE_TARGET = 50;
export const WAVE_HARD_CAP = 60;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CrystallizedBatch {
  /** batch number (1..N), e.g. 46 for ssot-w40k-046. */
  number: number;
  /** number of books in the batch (10 except domain-tail restbatch). */
  bookCount: number;
  /** slug of the LAST book in the batch — used as the verify smoke slug. */
  lastSlug: string;
}

export interface WaveDescriptor {
  pass: number;
  first: number;
  last: number;
  bookCount: number;
  batches: CrystallizedBatch[];
}

export interface DetectInput {
  w40kRosterCount: number;
  /** must be ascending by `number`; the detector sorts defensively too. */
  crystallizedBatches: CrystallizedBatch[];
  /** highest fully-resolved batch (all 6 phases committed); 0 if none. */
  resolverProgressBatch: number;
  /** highest pass number ever assigned + 1; pre-094 bootstrap = 7 → 8. */
  nextPassNumber: number;
}

export interface ApplyRange {
  domain: "w40k";
  from: number;
  to: number;
}

export interface IdRange {
  from: string;
  to: string;
}

export interface PhaseSpec {
  name: string;
  trigger: string;
  scope: string[];
  statusFile: string | null;
}

export interface ResolverPassConfig {
  $comment: string;
  pass: string;
  wave: string;
  runbook: string;
  dossier: string;
  aggregator: {
    $comment: string;
    batches: string[];
    applyRange: ApplyRange;
  };
  verify: {
    $comment: string;
    newRange: IdRange;
    oldRange: IdRange;
    ratingRange: IdRange;
    smokeSlugs: string[];
  };
  phases: PhaseSpec[];
}

export type DetectResult =
  | { status: "open-wave"; wave: WaveDescriptor; config: ResolverPassConfig }
  | { status: "idle"; reason: string }
  | { status: "w40k-complete" };

// ---------------------------------------------------------------------------
// Pure: helpers
// ---------------------------------------------------------------------------

const pad3 = (n: number): string => String(n).padStart(3, "0");
const pad4 = (n: number): string => String(n).padStart(4, "0");
const w40kId = (n: number): string => `W40K-${pad4(n)}`;
const w40kBatchId = (n: number): string => `ssot-w40k-${pad3(n)}`;

// ---------------------------------------------------------------------------
// Pure: balanced contiguous batch partition
// ---------------------------------------------------------------------------

/**
 * Partition `openBatches` (ascending by `number`) into ceil(total/hardCap)
 * contiguous waves. Greedy left-to-right; each wave stays ≤ hardCap; an
 * intermediate wave closes once `currentBooks` reaches the per-wave target
 * (ceil(total / waveCount)); the final wave gets whatever is left.
 *
 * For 115 books across batches 046..057 (10,10,10,10,10,10,10,10,10,10,10,5):
 *   waveCount = ceil(115/60) = 2, target = 58 → 60 + 55.
 */
export function partitionWaves(
  openBatches: CrystallizedBatch[],
  hardCap: number = WAVE_HARD_CAP,
): CrystallizedBatch[][] {
  if (openBatches.length === 0) return [];
  const total = openBatches.reduce((s, b) => s + b.bookCount, 0);
  const N = Math.max(1, Math.ceil(total / hardCap));
  if (N === 1) return [openBatches.slice()];
  const target = Math.ceil(total / N);

  const result: CrystallizedBatch[][] = [];
  let current: CrystallizedBatch[] = [];
  let currentBooks = 0;

  for (const b of openBatches) {
    const wouldOverflow = current.length > 0 && currentBooks + b.bookCount > hardCap;
    const reachedTarget = currentBooks >= target && result.length < N - 1;
    if (wouldOverflow || reachedTarget) {
      result.push(current);
      current = [];
      currentBooks = 0;
    }
    current.push(b);
    currentBooks += b.bookCount;
  }
  if (current.length > 0) result.push(current);

  return result;
}

// ---------------------------------------------------------------------------
// Pure: detect next wave
// ---------------------------------------------------------------------------

export function detectNextWave(input: DetectInput): DetectResult {
  const { w40kRosterCount, crystallizedBatches, resolverProgressBatch, nextPassNumber } = input;
  const sorted = [...crystallizedBatches].sort((a, b) => a.number - b.number);

  const progressBooks = sorted
    .filter((b) => b.number <= resolverProgressBatch)
    .reduce((s, b) => s + b.bookCount, 0);

  if (resolverProgressBatch > 0 && progressBooks >= w40kRosterCount) {
    return { status: "w40k-complete" };
  }

  const openBatches = sorted.filter((b) => b.number > resolverProgressBatch);
  if (openBatches.length === 0) {
    return {
      status: "idle",
      reason:
        resolverProgressBatch === 0
          ? "no crystallized W40K batches yet"
          : `progress at ${w40kBatchId(resolverProgressBatch)}; no later batches crystallized`,
    };
  }

  const partitions = partitionWaves(openBatches);
  const firstWaveBatches = partitions[0];
  const wave: WaveDescriptor = {
    pass: nextPassNumber,
    first: firstWaveBatches[0].number,
    last: firstWaveBatches[firstWaveBatches.length - 1].number,
    bookCount: firstWaveBatches.reduce((s, b) => s + b.bookCount, 0),
    batches: firstWaveBatches,
  };
  const config = buildWaveConfig(wave);
  return { status: "open-wave", wave, config };
}

// ---------------------------------------------------------------------------
// Pure: ResolverPassConfig builder
// ---------------------------------------------------------------------------

/**
 * Build the per-wave ResolverPassConfig from a WaveDescriptor. Mechanical
 * substitution — no per-pass narration, no hand-written cluster names, no
 * brief reference (Brief 094 removed `brief`). Wave-specific facts (omnibi,
 * cluster narratives, format conflicts) live in the dossier built by Phase 0.
 */
export function buildWaveConfig(wave: WaveDescriptor): ResolverPassConfig {
  const { pass, first, last, batches } = wave;
  const totalBooks = batches.reduce((s, b) => s + b.bookCount, 0);
  const batchIds = batches.map((b) => w40kBatchId(b.number));
  const newFromId = w40kId((first - 1) * 10 + 1);
  const lastBatchLastId = (last - 1) * 10 + batches[batches.length - 1].bookCount;
  const newToId = w40kId(lastBatchLastId);
  const oldFromId = w40kId(1);
  const oldToId = w40kId((first - 1) * 10);
  const waveLabel = `ssot-w40k-${pad3(first)}..${pad3(last)}`;
  const dossier = `sessions/resolver-dossiers/resolver-pass-${pass}-dossier.md`;
  const phaseReport = (slug: string): string =>
    `sessions/resolver-dossiers/resolver-pass-${pass}-phase-${slug}-report.md`;
  const implReport = `sessions/resolver-dossiers/resolver-pass-${pass}-impl-report.md`;
  const batchesScope = batches.map(
    (b) => `scripts/seed-data/manual-overrides-${w40kBatchId(b.number)}.json`,
  );
  const smokeSlugs = batches.map((b) => b.lastSlug);

  const phase1Status = phaseReport("1");
  const phase2Status = phaseReport("2");
  const phase3Status = phaseReport("3");
  const phase4aStatus = phaseReport("4a");

  // Generic trigger templates — operative spec lives in the runbook; the
  // dossier (built by Phase 0) carries the wave-specific facts.
  const phase0Trigger =
    `Phase 0 (Preflight/Dossier) — siehe resolver-pass-runbook.md §3 Phase 0 + §6. ` +
    `Wave: ${waveLabel} (${totalBooks} Bücher). Batches: ${batchIds.join(", ")}. ` +
    `Aggregator \`scripts/aggregate-surface-forms.ts --config scripts/resolver-pass.config.json\` laufen lassen, ` +
    `Output (6 der 7 Sektionen) ins Dossier ${dossier} falten, die 7. Sektion ` +
    `(needs-decision-/Cross-Batch-Alias-Kandidaten) als LLM-Synthese ergänzen. ` +
    `Override-Files NICHT in den Kontext lesen. Ein Commit.`;

  const phase1Trigger =
    `Phase 1 (Factions) — siehe resolver-pass-runbook.md §3 Phase 1 + §4 (Promotions-/Alias-Disziplin). ` +
    `Wave: ${waveLabel}. Batches: ${batchIds.join(", ")}. Dossier: ${dossier}. ` +
    `Promotion-Schwelle freq≥2 strict + lore-ikonische freq=1 (Dossier-Evidenz). ` +
    `Idempotenz pro Row. ≥5 neue Resolver-Test-Cases. Per-Phase-Statusdatei: ${phase1Status}. ` +
    `Statusdatei vollständig schreiben (kein Append, kein Vorbehalt aus früherem Lauf). Ein Commit.`;

  const phase2Trigger =
    `Phase 2 (Locations) — siehe resolver-pass-runbook.md §3 Phase 2 + §4. ` +
    `Wave: ${waveLabel}. Batches: ${batchIds.join(", ")}. Dossier: ${dossier}. ` +
    `Sektor/Welt/Sub-Location-Granularität. Vessel-Konvention \`tags:['vessel']\`, \`gx/gy:null\`. ` +
    `Promotion-Schwelle freq≥2 strict + lore-ikonische freq=1 (Dossier-Evidenz). ` +
    `≥4 neue Resolver-Test-Cases. Idempotenz prüfen. Per-Phase-Statusdatei: ${phase2Status}. ` +
    `Statusdatei vollständig schreiben. Ein Commit.`;

  const phase3Trigger =
    `Phase 3 (Characters) — siehe resolver-pass-runbook.md §3 Phase 3 + §4 + §5 (FK-Reihenfolge). ` +
    `Wave: ${waveLabel}. Batches: ${batchIds.join(", ")}. Dossier: ${dossier}. ` +
    `primaryFactionId neuer Characters muss auf das Phase-1-Faction-Set zeigen. ` +
    `≥5 neue Resolver-Test-Cases, davon ≥2 Alias-Konsolidierung. Per-Phase-Statusdatei: ${phase3Status}. ` +
    `Statusdatei vollständig schreiben. Ein Commit.`;

  const phase4aTrigger =
    `Phase 4a (Integration/Apply) — siehe resolver-pass-runbook.md §3 Phase 4a + §7 (Digest-Disziplin). ` +
    `Wave: ${waveLabel}. Batches: ${batchIds.join(", ")}. Dossier: ${dossier}. ` +
    `Mutations-Hälfte: \`scripts/seed-resolver-extensions.ts\` um neue Reference-Rows erweitern; ` +
    `die Trias-Batch-Ranges (apply-override-dry.ts / test-resolver-coverage.ts / test-resolver-data-integrity.ts) ` +
    `auf die kumulative applyRange ausweiten; dann digest-only ` +
    `\`scripts/run-phase4-apply.sh scripts/resolver-pass.config.json\` ` +
    `(seedet Resolver-Extensions + Facets non-destruktiv, re-applied die applyRange idempotent, schreibt + committet ` +
    `den kompakten Apply-Digest ingest/.last-run/phase4-digest.md). Rohe Per-Batch-Ausgabe NICHT in den Kontext. ` +
    `Unbekannte facetIds strippen (facet-catalog.json ist bewusst NICHT im Scope; nötiger Facet-Add ist ein ` +
    `\`## Needs decision\`-Stop). Apply-seitige Trias grün ziehen (inkl. \`npm run test:collection-refs\`). ` +
    `Selbst-enthaltene 4a-Statusdatei: ${phase4aStatus} (Counts-Tabelle Pre/Per-Batch/Post, Reference-Row-Deltas, ` +
    `etwaige Strips/Anomalien, ready-for-4b-Marker oder \`## Needs decision\`). Ein Commit.`;

  const phase4bTrigger =
    `Phase 4b (Verify/Report) — siehe resolver-pass-runbook.md §3 Phase 4b + §10. ` +
    `Wave: ${waveLabel}. Dossier: ${dossier}. Read-only-Hälfte. ` +
    `Pflichtlektüre: die 4a-Statusdatei ${phase4aStatus} + der committete Apply-Digest ingest/.last-run/phase4-digest.md. ` +
    `\`scripts/verify-pass.ts --config scripts/resolver-pass.config.json\` selbst fahren ` +
    `(Verify-Digest nach stdout, KEINE Verify-Digest-Datei). Dann \`npm run lint\` + \`npm run typecheck\`. ` +
    `KEIN zweiter DB-Apply, KEINE Trias-Re-Run, NICHT die Override-Files / Apply-seitigen Skripte / rohe Apply-Ausgabe lesen. ` +
    `Den finalen Impl-Report ${implReport} aus 4a-Statusdatei + Apply-Digest + verify-pass.ts-stdout polieren — ` +
    `keinen Zustand neu herleiten. Ein Commit.`;

  return {
    $comment:
      `Auto-generated by scripts/resolver-loop-detect.ts (Brief 094). ` +
      `Welle ${waveLabel} (${totalBooks} Bücher). ` +
      `Wave-specific narration (omnibi, cluster framings, format conflicts) lives in the dossier ${dossier} — ` +
      `the trigger templates here stay generic. ` +
      `Operative spec: sessions/resolver-pass-runbook.md (field \`runbook\`, REQUIRED). ` +
      `Per-pass briefs no longer exist; the \`brief\` field was removed with Brief 094.`,
    pass: String(pass),
    wave: waveLabel,
    runbook: "sessions/resolver-pass-runbook.md",
    dossier,
    aggregator: {
      $comment:
        `Batch ids this wave operates on. \`batches\` = the new wave (Phase 0 surface-form aggregate). ` +
        `\`applyRange\` = the cumulative range Phase 4 re-applies (idempotent delete-then-insert).`,
      batches: batchIds,
      applyRange: { domain: "w40k", from: 1, to: last },
    },
    verify: {
      $comment:
        `Parameters for verify-pass.ts digest. \`newRange\`/\`oldRange\` drive the audit-cockpit drift/gap/collection replica; ` +
        `\`smokeSlugs\` are the junction-count smoke checks (one representative — the LAST — book per batch).`,
      newRange: { from: newFromId, to: newToId },
      oldRange: { from: oldFromId, to: oldToId },
      ratingRange: { from: newFromId, to: newToId },
      smokeSlugs,
    },
    phases: [
      {
        name: "phase-0-preflight",
        trigger: phase0Trigger,
        scope: [dossier, "scripts/aggregate-surface-forms.ts"],
        statusFile: null,
      },
      {
        name: "phase-1-factions",
        trigger: phase1Trigger,
        scope: [
          "scripts/seed-data/factions.json",
          "scripts/seed-data/faction-aliases.json",
          "scripts/seed-data/faction-policy.json",
          "scripts/test-resolver.ts",
          phase1Status,
        ],
        statusFile: phase1Status,
      },
      {
        name: "phase-2-locations",
        trigger: phase2Trigger,
        scope: [
          "scripts/seed-data/locations.json",
          "scripts/seed-data/location-aliases.json",
          "scripts/seed-data/sectors.json",
          "scripts/test-resolver.ts",
          phase2Status,
        ],
        statusFile: phase2Status,
      },
      {
        name: "phase-3-characters",
        trigger: phase3Trigger,
        scope: [
          "scripts/seed-data/characters.json",
          "scripts/seed-data/character-aliases.json",
          "scripts/test-resolver.ts",
          phase3Status,
        ],
        statusFile: phase3Status,
      },
      {
        name: "phase-4a-integration",
        trigger: phase4aTrigger,
        scope: [
          "scripts/seed-resolver-extensions.ts",
          "scripts/apply-override-dry.ts",
          "scripts/apply-override-collections.ts",
          "scripts/test-resolver-coverage.ts",
          "scripts/test-resolver-data-integrity.ts",
          "scripts/seed-data/collection-gaps.json",
          "scripts/seed-data/persons.json",
          ...batchesScope,
          "scripts/db-counts.ts",
          "scripts/seed-facets.ts",
          "scripts/run-phase4-apply.sh",
          "ingest/.last-run/phase4-digest.md",
          phase4aStatus,
        ],
        statusFile: phase4aStatus,
      },
      {
        name: "phase-4b-verify-report",
        trigger: phase4bTrigger,
        scope: ["scripts/verify-pass.ts", implReport],
        statusFile: implReport,
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Pure: resolver-loop-log parser
// ---------------------------------------------------------------------------

/**
 * Extract `{ resolverProgressBatch, nextPassNumber }` from a resolver-loop-log
 * markdown body.
 *
 * Two block shapes are recognized:
 *
 *   1. **Per-wave H2** — heading matches
 *      `Resolver-Pass <N> (... ssot-w40k-AAA..BBB ...)`.
 *      The wave counts as fully complete iff the body has ≥6 `[x] Phase`
 *      bullets; only then does `BBB` advance the progress.
 *      The pass number always advances `maxPass`, even on a partial wave —
 *      so a re-run is assigned pass `<N>` still, not `<N>+1`. (Re-using the
 *      same pass on a stuck wave is fine; the resume mechanism overwrites the
 *      phase status file. We only burn a pass number when 4b commits.)
 *
 *      Subtle: a partial wave's heading bumps `maxPass`. To keep the
 *      "re-use same pass" property, callers should write the block at the
 *      START of phase 0 (with all `[ ]` markers), not at the end. The bootstrap
 *      block sidesteps this by using shape #2 below.
 *
 *   2. **Bootstrap/summary** — any block whose body has a `[x]` bullet
 *      matching `Pass(?:\s\d+\s*\.\.\s*)?<N>` AND `ssot-w40k-AAA..BBB`.
 *      Used by the one-line pre-094 history marker
 *      (`- [x] Pass 1..7 (Welle ssot-w40k-001..045, …)`).
 *      Both `maxPass` and `maxBatch` advance from the bullet.
 *
 * Empty / missing log → `{ resolverProgressBatch: 0, nextPassNumber: 1 }`.
 */
export function parseResolverLoopLog(content: string): {
  resolverProgressBatch: number;
  nextPassNumber: number;
} {
  let maxBatch = 0;
  let maxPass = 0;

  const lines = content.split(/\r?\n/);
  let blockHeading = "";
  let blockBody: string[] = [];

  const flush = (): void => {
    if (!blockHeading) return;
    const headingMatch = blockHeading.match(
      /Resolver-Pass\s+(\d+).*?ssot-w40k-(\d{3})\.\.(\d{3})/,
    );
    if (headingMatch) {
      const pass = Number(headingMatch[1]);
      const last = Number(headingMatch[3]);
      if (pass > maxPass) maxPass = pass;
      const phaseChecked = blockBody.filter((l) => /^\s*-\s*\[x\]\s*Phase/i.test(l)).length;
      if (phaseChecked >= 6 && last > maxBatch) maxBatch = last;
    } else {
      for (const line of blockBody) {
        const m = line.match(
          /^\s*-\s*\[x\]\s.*?Pass\s+(?:\d+\s*\.\.\s*)?(\d+).*?ssot-w40k-(\d{3})\.\.(\d{3})/i,
        );
        if (m) {
          const pass = Number(m[1]);
          const last = Number(m[3]);
          if (pass > maxPass) maxPass = pass;
          if (last > maxBatch) maxBatch = last;
        }
      }
    }
  };

  for (const line of lines) {
    if (line.startsWith("## ")) {
      flush();
      blockHeading = line;
      blockBody = [];
    } else if (blockHeading) {
      blockBody.push(line);
    }
  }
  flush();

  return { resolverProgressBatch: maxBatch, nextPassNumber: maxPass + 1 };
}

// ---------------------------------------------------------------------------
// I/O layer (main only)
// ---------------------------------------------------------------------------

interface LoadPaths {
  rosterPath: string;
  seedDir: string;
  logPath: string;
  writeConfig: string | null;
}

interface RawRosterBook {
  externalBookId: string;
}

interface RawRosterFile {
  books?: RawRosterBook[];
}

interface RawOverrideBook {
  slug?: string;
}

interface RawOverrideFile {
  books?: RawOverrideBook[];
}

function parseArgs(argv: string[]): LoadPaths {
  const repo = process.cwd();
  const paths: LoadPaths = {
    rosterPath: path.join(repo, "scripts", "seed-data", "book-roster.json"),
    seedDir: path.join(repo, "scripts", "seed-data"),
    logPath: path.join(repo, "sessions", "resolver-loop-log.md"),
    writeConfig: null,
  };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--roster-path") {
      i += 1;
      paths.rosterPath = argv[i];
    } else if (a === "--seed-dir") {
      i += 1;
      paths.seedDir = argv[i];
    } else if (a === "--log-path") {
      i += 1;
      paths.logPath = argv[i];
    } else if (a === "--write-config") {
      i += 1;
      paths.writeConfig = argv[i];
    } else {
      throw new Error(
        `unknown arg: ${a} (expected --roster-path/--seed-dir/--log-path/--write-config)`,
      );
    }
  }
  return paths;
}

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function loadInputs(p: LoadPaths): DetectInput {
  const roster = readJson<RawRosterFile>(p.rosterPath);
  const rosterBooks: RawRosterBook[] = Array.isArray(roster.books) ? roster.books : [];
  const w40kRosterCount = rosterBooks.filter((b) => b.externalBookId.startsWith("W40K-")).length;

  const fileRe = /^manual-overrides-ssot-w40k-(\d+)\.json$/;
  const crystallizedBatches: CrystallizedBatch[] = [];
  for (const name of fs.readdirSync(p.seedDir)) {
    const m = fileRe.exec(name);
    if (!m) continue;
    const number = Number(m[1]);
    const data = readJson<RawOverrideFile>(path.join(p.seedDir, name));
    if (!Array.isArray(data.books) || data.books.length === 0) {
      throw new Error(`${name}: books missing or empty`);
    }
    const lastBook = data.books[data.books.length - 1];
    const lastSlug = lastBook.slug;
    if (typeof lastSlug !== "string" || !lastSlug) {
      throw new Error(`${name}: last book has no slug`);
    }
    crystallizedBatches.push({ number, bookCount: data.books.length, lastSlug });
  }
  crystallizedBatches.sort((a, b) => a.number - b.number);

  let logProgress = { resolverProgressBatch: 0, nextPassNumber: 1 };
  if (fs.existsSync(p.logPath)) {
    logProgress = parseResolverLoopLog(fs.readFileSync(p.logPath, "utf8"));
  }

  return {
    w40kRosterCount,
    crystallizedBatches,
    resolverProgressBatch: logProgress.resolverProgressBatch,
    nextPassNumber: logProgress.nextPassNumber,
  };
}

function main(): void {
  const opts = parseArgs(process.argv);
  const result = detectNextWave(loadInputs(opts));

  if (opts.writeConfig && result.status === "open-wave") {
    fs.writeFileSync(opts.writeConfig, `${JSON.stringify(result.config, null, 2)}\n`, "utf8");
  }

  console.log(JSON.stringify(result, null, 2));
}

/**
 * True only when this file is the directly-invoked entry, false when
 * imported (the test imports `detectNextWave` etc.). Mirror of the same
 * helper in loop-next-batch.ts — same Windows-realpath fallback.
 */
function isMain(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  const self = fileURLToPath(import.meta.url);
  try {
    return fs.realpathSync(entry) === fs.realpathSync(self);
  } catch {
    try {
      return path.resolve(entry).toLowerCase() === path.resolve(self).toLowerCase();
    } catch {
      return false;
    }
  }
}

if (isMain()) main();
