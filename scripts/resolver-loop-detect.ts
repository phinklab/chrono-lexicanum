/**
 * resolver-loop-detect.ts — pure-core detector for the headless Resolver-Loop
 * (Brief 094 / Brief 100).
 *
 * One loop iteration figures out which wave to drive next (W40K first, then
 * HH), builds a fresh ResolverPassConfig for that wave, or signals one of two
 * terminal states (idle / all-complete). Mirror of scripts/loop-next-batch.ts:
 *
 *   - `detectNextWave(input)` is PURE (no FS/DB) — the unit-test seam.
 *   - `buildWaveConfig(wave)` is PURE — produces the ResolverPassConfig JSON.
 *   - `parseResolverLoopLog(content)` is PURE — extracts per-domain progress +
 *      the global next-pass counter.
 *   - `main()` does the file I/O (roster + seed dir + resolver-loop-log) and
 *     prints the result on stdout. With `--write-config <path>`, also writes
 *     the auto-generated config to that file when status === "open-wave".
 *
 * Wave-sizing:
 *   Regular: WAVE_TARGET = 50, WAVE_HARD_CAP = 60.
 *   HH bootstrap: HH_BOOTSTRAP_WAVE_TARGET = 20, HH_BOOTSTRAP_WAVE_HARD_CAP = 25
 *   — applied to the first HH wave only (hhProgressBatch === 0). Brief 100:
 *   the first HH wave bootstraps the Pre-Heresy reference layer (Foundational
 *   Ten, Mournival, first primarchs — 150-200 new characters in Phase 3); a
 *   50-book wave would push Phase 3 into the dumb-zone. From the second HH
 *   wave onward, regular caps apply.
 *
 *   waveCount = ceil(restBooks / hardCap).
 *
 * Three external terminal states (Brief 100 — pre-100 `w40k-complete` is
 * gone; the W40K→HH boundary materializes externally as a regular `open-wave`
 * carrying the first HH wave, an internal branch point):
 *
 *   - "open-wave":    at least one crystallized batch above the current
 *                     domain's progress. W40K first, then HH after W40K
 *                     completes.
 *   - "idle":         no open batch in the current domain — operator needs to
 *                     run the SSOT-Loop further. `reason` names the domain.
 *   - "all-complete": both domains fully resolved. Final-terminal; driver
 *                     terminates cleanly.
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

/**
 * Bootstrap-wave sizing for the FIRST HH wave only (hhProgressBatch === 0).
 * Brief 100: the first HH wave bootstraps the Pre-Heresy reference layer
 * (Foundational Ten, Mournival, first primarchs — 150-200 new characters in
 * Phase 3, plus 15-25 factions and 20-40 locations). A regular 50-book wave
 * would push Phase 3 into the dumb-zone; a 20-book wave keeps it inside the
 * token budget. From the second HH wave on, the regular WAVE_TARGET / WAVE_HARD_CAP
 * apply — the bootstrap cap fires in exactly one detector invocation.
 */
export const HH_BOOTSTRAP_WAVE_TARGET = 20;
export const HH_BOOTSTRAP_WAVE_HARD_CAP = 25;

/**
 * Domain order is hardcoded: W40K must be resolved before HH waves are produced.
 * Cross-Era aliases (Luna Wolves ↔ Sons of Horus, Kharn ↔ Kharn the Betrayer)
 * anchor to existing W40K canonical rows — HH cannot start until the W40K
 * reference layer is stable.
 */
export const DOMAIN_ORDER = ["w40k", "hh"] as const;
export type Domain = (typeof DOMAIN_ORDER)[number];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CrystallizedBatch {
  /** which domain this batch belongs to. */
  domain: Domain;
  /** batch number (1..N) inside its domain, e.g. 46 for ssot-w40k-046. */
  number: number;
  /** number of books in the batch (10 except domain-tail restbatch). */
  bookCount: number;
  /** slug of the LAST book in the batch — used as the verify smoke slug. */
  lastSlug: string;
}

export interface WaveDescriptor {
  pass: number;
  /** same-domain — a wave never straddles a domain boundary. */
  domain: Domain;
  /**
   * Full domain-bearing label, e.g. "ssot-w40k-046..051" or "ssot-hh-001..002".
   * The wrapper consumes this verbatim — it never reconstructs the label.
   */
  label: string;
  first: number;
  last: number;
  bookCount: number;
  batches: CrystallizedBatch[];
}

export interface DetectInput {
  w40kRosterCount: number;
  hhRosterCount: number;
  /** ascending by (domain, number); the detector sorts defensively per domain. */
  crystallizedBatches: CrystallizedBatch[];
  /** highest fully-resolved W40K batch (all 6 phases committed); 0 if none. */
  w40kProgressBatch: number;
  /** highest fully-resolved HH batch (all 6 phases committed); 0 if none. */
  hhProgressBatch: number;
  /**
   * Highest pass number ever assigned + 1; W40K and HH share one global
   * counter (HH-Pass 10 follows W40K-Pass 9). Pre-094 bootstrap = 7 → 8.
   */
  nextPassNumber: number;
}

export interface ApplyRange {
  domain: Domain;
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
  | { status: "all-complete" };

// ---------------------------------------------------------------------------
// Pure: helpers
// ---------------------------------------------------------------------------

const pad3 = (n: number): string => String(n).padStart(3, "0");
const pad4 = (n: number): string => String(n).padStart(4, "0");
const ID_PREFIX: Record<Domain, string> = { w40k: "W40K-", hh: "HH-" };
const externalId = (domain: Domain, n: number): string =>
  `${ID_PREFIX[domain]}${pad4(n)}`;
const batchIdFor = (domain: Domain, n: number): string =>
  `ssot-${domain}-${pad3(n)}`;
const waveLabelFor = (domain: Domain, first: number, last: number): string =>
  `ssot-${domain}-${pad3(first)}..${pad3(last)}`;

// ---------------------------------------------------------------------------
// Pure: balanced contiguous batch partition
// ---------------------------------------------------------------------------

/**
 * Partition `openBatches` (ascending by `number`) into ceil(total/hardCap)
 * contiguous waves. Greedy left-to-right; each wave stays ≤ hardCap; an
 * intermediate wave closes once `currentBooks` reaches the per-wave target
 * (`explicitTarget` if given, else ceil(total / waveCount)); the final wave
 * gets whatever is left.
 *
 * Brief 100 — HH bootstrap call: `partitionWaves(open, 25, 20)`. With actual
 * 10-book HH batches the cap is the binding limit (batch 003 would push the
 * running total to 30 > 25, so wave 1 closes after batches 001..002 at 20).
 * `explicitTarget=20` matters only if batches were smaller than 10.
 */
export function partitionWaves(
  openBatches: CrystallizedBatch[],
  hardCap: number = WAVE_HARD_CAP,
  explicitTarget?: number,
): CrystallizedBatch[][] {
  if (openBatches.length === 0) return [];
  const total = openBatches.reduce((s, b) => s + b.bookCount, 0);
  const N = Math.max(1, Math.ceil(total / hardCap));
  if (N === 1) return [openBatches.slice()];
  const target = explicitTarget ?? Math.ceil(total / N);

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

interface DomainSliceState {
  domain: Domain;
  rosterCount: number;
  progressBatch: number;
  sortedBatches: CrystallizedBatch[];
}

function progressBooksOf(state: DomainSliceState): number {
  return state.sortedBatches
    .filter((b) => b.number <= state.progressBatch)
    .reduce((s, b) => s + b.bookCount, 0);
}

function isDomainComplete(state: DomainSliceState): boolean {
  if (state.rosterCount === 0) return true;
  if (state.progressBatch === 0) return false;
  return progressBooksOf(state) >= state.rosterCount;
}

function openBatchesOf(state: DomainSliceState): CrystallizedBatch[] {
  return state.sortedBatches.filter((b) => b.number > state.progressBatch);
}

function idleReason(state: DomainSliceState): string {
  const domainName = state.domain.toUpperCase();
  if (state.progressBatch === 0) {
    return `${domainName}: no crystallized batches yet`;
  }
  return `${domainName}: progress at ${batchIdFor(
    state.domain,
    state.progressBatch,
  )}; no later batches crystallized`;
}

function buildOpenWave(
  state: DomainSliceState,
  nextPassNumber: number,
): { wave: WaveDescriptor; config: ResolverPassConfig } {
  const open = openBatchesOf(state);
  const isBootstrap = state.domain === "hh" && state.progressBatch === 0;
  const hardCap = isBootstrap ? HH_BOOTSTRAP_WAVE_HARD_CAP : WAVE_HARD_CAP;
  const target = isBootstrap ? HH_BOOTSTRAP_WAVE_TARGET : undefined;
  const partitions = partitionWaves(open, hardCap, target);
  const firstWaveBatches = partitions[0];
  const first = firstWaveBatches[0].number;
  const last = firstWaveBatches[firstWaveBatches.length - 1].number;
  const wave: WaveDescriptor = {
    pass: nextPassNumber,
    domain: state.domain,
    label: waveLabelFor(state.domain, first, last),
    first,
    last,
    bookCount: firstWaveBatches.reduce((s, b) => s + b.bookCount, 0),
    batches: firstWaveBatches,
  };
  const config = buildWaveConfig(wave);
  return { wave, config };
}

export function detectNextWave(input: DetectInput): DetectResult {
  const sorted = [...input.crystallizedBatches].sort((a, b) => {
    if (a.domain !== b.domain) {
      return DOMAIN_ORDER.indexOf(a.domain) - DOMAIN_ORDER.indexOf(b.domain);
    }
    return a.number - b.number;
  });

  const w40kState: DomainSliceState = {
    domain: "w40k",
    rosterCount: input.w40kRosterCount,
    progressBatch: input.w40kProgressBatch,
    sortedBatches: sorted.filter((b) => b.domain === "w40k"),
  };
  const hhState: DomainSliceState = {
    domain: "hh",
    rosterCount: input.hhRosterCount,
    progressBatch: input.hhProgressBatch,
    sortedBatches: sorted.filter((b) => b.domain === "hh"),
  };

  // Sequential: W40K must finish before any HH wave is produced.
  if (!isDomainComplete(w40kState)) {
    const open = openBatchesOf(w40kState);
    if (open.length === 0) return { status: "idle", reason: idleReason(w40kState) };
    return { status: "open-wave", ...buildOpenWave(w40kState, input.nextPassNumber) };
  }

  // W40K complete → internal branch into HH.
  if (isDomainComplete(hhState)) return { status: "all-complete" };
  const openHh = openBatchesOf(hhState);
  if (openHh.length === 0) return { status: "idle", reason: idleReason(hhState) };
  return { status: "open-wave", ...buildOpenWave(hhState, input.nextPassNumber) };
}

// ---------------------------------------------------------------------------
// Pure: ResolverPassConfig builder
// ---------------------------------------------------------------------------

/**
 * Build the per-wave ResolverPassConfig from a WaveDescriptor. Mechanical
 * substitution — no per-pass narration, no hand-written cluster names, no
 * brief reference (Brief 094 removed `brief`). Wave-specific facts (omnibi,
 * cluster narratives, format conflicts) live in the dossier built by Phase 0.
 *
 * Domain-agnostic since Brief 100: the wave's `domain` and `label` come from
 * the descriptor; `batchIdFor`, `externalId`, and `applyRange.domain` all
 * follow the wave's domain.
 */
export function buildWaveConfig(wave: WaveDescriptor): ResolverPassConfig {
  const { pass, domain, label, first, last, batches } = wave;
  const totalBooks = batches.reduce((s, b) => s + b.bookCount, 0);
  const batchIds = batches.map((b) => batchIdFor(domain, b.number));
  const newFromId = externalId(domain, (first - 1) * 10 + 1);
  const lastBatchLastId = (last - 1) * 10 + batches[batches.length - 1].bookCount;
  const newToId = externalId(domain, lastBatchLastId);
  const oldFromId = externalId(domain, 1);
  const oldToId = externalId(domain, (first - 1) * 10);
  const dossier = `sessions/resolver-dossiers/resolver-pass-${pass}-dossier.md`;
  const phaseReport = (slug: string): string =>
    `sessions/resolver-dossiers/resolver-pass-${pass}-phase-${slug}-report.md`;
  const implReport = `sessions/resolver-dossiers/resolver-pass-${pass}-impl-report.md`;
  const batchesScope = batches.map(
    (b) => `scripts/seed-data/manual-overrides-${batchIdFor(domain, b.number)}.json`,
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
    `Wave: ${label} (${totalBooks} Bücher). Batches: ${batchIds.join(", ")}. ` +
    `Aggregator \`scripts/aggregate-surface-forms.ts --config scripts/resolver-pass.config.json\` laufen lassen, ` +
    `Output (6 der 7 Sektionen) ins Dossier ${dossier} falten, die 7. Sektion ` +
    `(needs-decision-/Cross-Batch-Alias-Kandidaten) als LLM-Synthese ergänzen. ` +
    `Override-Files NICHT in den Kontext lesen. Ein Commit.`;

  const phase1Trigger =
    `Phase 1 (Factions) — siehe resolver-pass-runbook.md §3 Phase 1 + §4 (Promotions-/Alias-Disziplin, inkl. Cross-Era-Identitäten). ` +
    `Wave: ${label}. Batches: ${batchIds.join(", ")}. Dossier: ${dossier}. ` +
    `Promotion-Schwelle freq≥2 strict + lore-ikonische freq=1 (Dossier-Evidenz). ` +
    `Idempotenz pro Row. ≥5 neue Resolver-Test-Cases. Per-Phase-Statusdatei: ${phase1Status}. ` +
    `Statusdatei vollständig schreiben (kein Append, kein Vorbehalt aus früherem Lauf). Ein Commit.`;

  const phase2Trigger =
    `Phase 2 (Locations) — siehe resolver-pass-runbook.md §3 Phase 2 + §4. ` +
    `Wave: ${label}. Batches: ${batchIds.join(", ")}. Dossier: ${dossier}. ` +
    `Sektor/Welt/Sub-Location-Granularität. Vessel-Konvention \`tags:['vessel']\`, \`gx/gy:null\`. ` +
    `Promotion-Schwelle freq≥2 strict + lore-ikonische freq=1 (Dossier-Evidenz). ` +
    `≥4 neue Resolver-Test-Cases. Idempotenz prüfen. Per-Phase-Statusdatei: ${phase2Status}. ` +
    `Statusdatei vollständig schreiben. Ein Commit.`;

  const phase3Trigger =
    `Phase 3 (Characters) — siehe resolver-pass-runbook.md §3 Phase 3 + §4 + §5 (FK-Reihenfolge). ` +
    `Wave: ${label}. Batches: ${batchIds.join(", ")}. Dossier: ${dossier}. ` +
    `primaryFactionId neuer Characters muss auf das Phase-1-Faction-Set zeigen. ` +
    `≥5 neue Resolver-Test-Cases, davon ≥2 Alias-Konsolidierung. Per-Phase-Statusdatei: ${phase3Status}. ` +
    `Statusdatei vollständig schreiben. Ein Commit.`;

  const phase4aTrigger =
    `Phase 4a (Integration/Apply) — siehe resolver-pass-runbook.md §3 Phase 4a + §7 (Digest-Disziplin). ` +
    `Wave: ${label}. Batches: ${batchIds.join(", ")}. Dossier: ${dossier}. ` +
    `Mutations-Hälfte: \`scripts/seed-resolver-extensions.ts\` um neue Reference-Rows erweitern; ` +
    `die domain-aware Trias-Batch-Ranges in apply-override-dry.ts / test-resolver-coverage.ts / test-resolver-data-integrity.ts ` +
    `um die neuen \`{domain: "${domain}", n: "NNN"}\`-Tupel der Welle erweitern (Domain-+-N-Append, nicht reines N-Append); dann digest-only ` +
    `\`scripts/run-phase4-apply.sh scripts/resolver-pass.config.json\` ` +
    `(seedet Resolver-Extensions + Facets non-destruktiv, re-applied die applyRange idempotent, schreibt + committet ` +
    `den kompakten Apply-Digest ingest/.last-run/phase4-digest.md). Rohe Per-Batch-Ausgabe NICHT in den Kontext. ` +
    `Unbekannte facetIds strippen (facet-catalog.json ist bewusst NICHT im Scope; nötiger Facet-Add ist ein ` +
    `\`## Needs decision\`-Stop). Apply-seitige Trias grün ziehen (inkl. \`npm run test:collection-refs\`). ` +
    `Selbst-enthaltene 4a-Statusdatei: ${phase4aStatus} (Counts-Tabelle Pre/Per-Batch/Post, Reference-Row-Deltas, ` +
    `etwaige Strips/Anomalien, ready-for-4b-Marker oder \`## Needs decision\`). Ein Commit.`;

  const phase4bTrigger =
    `Phase 4b (Verify/Report) — siehe resolver-pass-runbook.md §3 Phase 4b + §10. ` +
    `Wave: ${label}. Dossier: ${dossier}. Read-only-Hälfte. ` +
    `Pflichtlektüre: die 4a-Statusdatei ${phase4aStatus} + der committete Apply-Digest ingest/.last-run/phase4-digest.md. ` +
    `\`scripts/verify-pass.ts --config scripts/resolver-pass.config.json\` selbst fahren ` +
    `(Verify-Digest nach stdout, KEINE Verify-Digest-Datei). Dann \`npm run lint\` + \`npm run typecheck\`. ` +
    `KEIN zweiter DB-Apply, KEINE Trias-Re-Run, NICHT die Override-Files / Apply-seitigen Skripte / rohe Apply-Ausgabe lesen. ` +
    `Den finalen Impl-Report ${implReport} aus 4a-Statusdatei + Apply-Digest + verify-pass.ts-stdout polieren — ` +
    `keinen Zustand neu herleiten. Ein Commit.`;

  return {
    $comment:
      `Auto-generated by scripts/resolver-loop-detect.ts (Brief 094 / Brief 100). ` +
      `Welle ${label} (${totalBooks} Bücher). ` +
      `Wave-specific narration (omnibi, cluster framings, format conflicts) lives in the dossier ${dossier} — ` +
      `the trigger templates here stay generic. ` +
      `Operative spec: sessions/resolver-pass-runbook.md (field \`runbook\`, REQUIRED). ` +
      `Per-pass briefs no longer exist; the \`brief\` field was removed with Brief 094.`,
    pass: String(pass),
    wave: label,
    runbook: "sessions/resolver-pass-runbook.md",
    dossier,
    aggregator: {
      $comment:
        `Batch ids this wave operates on. \`batches\` = the new wave (Phase 0 surface-form aggregate). ` +
        `\`applyRange\` = the cumulative same-domain range Phase 4 re-applies (idempotent delete-then-insert).`,
      batches: batchIds,
      applyRange: { domain, from: 1, to: last },
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
 * Extract per-domain progress + the global next-pass counter from a
 * resolver-loop-log markdown body.
 *
 * Two block shapes are recognized:
 *
 *   1. **Per-wave H2** — heading matches
 *      `Resolver-Pass <N> (... ssot-(w40k|hh)-AAA..BBB ...)`.
 *      The wave counts as fully complete iff the body has ≥6 `[x] Phase`
 *      bullets; only then does `BBB` advance the per-domain progress.
 *      A complete wave advances both the per-domain progress and the global
 *      next-pass counter. A partial wave does NOT advance progress and
 *      reserves its own pass number for resume.
 *
 *   2. **Bootstrap/summary** — any block whose body has a `[x]` bullet
 *      matching `Pass(?:\s\d+\s*\.\.\s*)?<N>` AND `ssot-(w40k|hh)-AAA..BBB`.
 *      Used by the pre-094 one-line history marker
 *      (`- [x] Pass 1..7 (Welle ssot-w40k-001..045, …)`).
 *      Both completed-pass and per-domain progress advance from the bullet.
 *
 * Empty / missing log → `{ w40kProgressBatch: 0, hhProgressBatch: 0, nextPassNumber: 1 }`.
 */
export function parseResolverLoopLog(content: string): {
  w40kProgressBatch: number;
  hhProgressBatch: number;
  nextPassNumber: number;
} {
  let maxW40kBatch = 0;
  let maxHhBatch = 0;
  let maxCompletedPass = 0;
  let maxPartialPass = 0;

  const lines = content.split(/\r?\n/);
  let blockHeading = "";
  let blockBody: string[] = [];

  const advanceBatch = (domain: Domain, last: number): void => {
    if (domain === "w40k") {
      if (last > maxW40kBatch) maxW40kBatch = last;
    } else if (last > maxHhBatch) {
      maxHhBatch = last;
    }
  };

  const flush = (): void => {
    if (!blockHeading) return;
    const headingMatch = blockHeading.match(
      /Resolver-Pass\s+(\d+).*?ssot-(w40k|hh)-(\d{3})\.\.(\d{3})/,
    );
    if (headingMatch) {
      const pass = Number(headingMatch[1]);
      const domain = headingMatch[2] as Domain;
      const last = Number(headingMatch[4]);
      const phaseChecked = blockBody.filter((l) => /^\s*-\s*\[x\]\s*Phase/i.test(l)).length;
      if (phaseChecked >= 6) {
        if (pass > maxCompletedPass) maxCompletedPass = pass;
        advanceBatch(domain, last);
      } else if (pass > maxPartialPass) {
        maxPartialPass = pass;
      }
    } else {
      for (const line of blockBody) {
        const m = line.match(
          /^\s*-\s*\[x\]\s.*?Pass\s+(?:\d+\s*\.\.\s*)?(\d+).*?ssot-(w40k|hh)-(\d{3})\.\.(\d{3})/i,
        );
        if (m) {
          const pass = Number(m[1]);
          const domain = m[2] as Domain;
          const last = Number(m[4]);
          if (pass > maxCompletedPass) maxCompletedPass = pass;
          advanceBatch(domain, last);
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

  const nextPassNumber =
    maxPartialPass > maxCompletedPass ? maxPartialPass : maxCompletedPass + 1;
  return {
    w40kProgressBatch: maxW40kBatch,
    hhProgressBatch: maxHhBatch,
    nextPassNumber,
  };
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
  const w40kRosterCount = rosterBooks.filter((b) =>
    b.externalBookId.startsWith("W40K-"),
  ).length;
  const hhRosterCount = rosterBooks.filter((b) =>
    b.externalBookId.startsWith("HH-"),
  ).length;

  const fileRe = /^manual-overrides-ssot-(w40k|hh)-(\d+)\.json$/;
  const crystallizedBatches: CrystallizedBatch[] = [];
  for (const name of fs.readdirSync(p.seedDir)) {
    const m = fileRe.exec(name);
    if (!m) continue;
    const domain = m[1] as Domain;
    const number = Number(m[2]);
    const data = readJson<RawOverrideFile>(path.join(p.seedDir, name));
    if (!Array.isArray(data.books) || data.books.length === 0) {
      throw new Error(`${name}: books missing or empty`);
    }
    const lastBook = data.books[data.books.length - 1];
    const lastSlug = lastBook.slug;
    if (typeof lastSlug !== "string" || !lastSlug) {
      throw new Error(`${name}: last book has no slug`);
    }
    crystallizedBatches.push({ domain, number, bookCount: data.books.length, lastSlug });
  }
  crystallizedBatches.sort((a, b) => {
    if (a.domain !== b.domain) {
      return DOMAIN_ORDER.indexOf(a.domain) - DOMAIN_ORDER.indexOf(b.domain);
    }
    return a.number - b.number;
  });

  let logProgress = { w40kProgressBatch: 0, hhProgressBatch: 0, nextPassNumber: 1 };
  if (fs.existsSync(p.logPath)) {
    logProgress = parseResolverLoopLog(fs.readFileSync(p.logPath, "utf8"));
  }

  return {
    w40kRosterCount,
    hhRosterCount,
    crystallizedBatches,
    w40kProgressBatch: logProgress.w40kProgressBatch,
    hhProgressBatch: logProgress.hhProgressBatch,
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
