/**
 * Standalone unit test for scripts/resolver-loop-detect.ts.
 *
 * No test framework: node:assert/strict + one console line per case, same
 * pattern as scripts/test-loop-next-batch.ts. Run via
 * `npm run test:resolver-loop-detect`.
 *
 * Three synthetic fixtures cover the three terminal states from Brief 094:
 *   (a) open-wave        — 115 W40K remnant → first wave 046..051 (60 books)
 *   (b) idle             — no batch above progress
 *   (c) w40k-complete    — progress covers full roster (HH ignored)
 *
 * Plus content checks on `buildWaveConfig` (wave label, applyRange, verify
 * ranges, smokeSlugs reflect the LAST book per batch, generic triggers
 * without per-pass lore or brief references, dossier path tracks pass
 * number) and the `parseResolverLoopLog` parser (bootstrap shape,
 * fully-checked wave block, partially-checked wave block, empty log).
 *
 * Drives PURE functions only — no FS/DB. The helper's `main()` is behind
 * a run-as-script guard so importing it triggers no I/O.
 */
import assert from "node:assert/strict";
import process from "node:process";

import {
  buildWaveConfig,
  detectNextWave,
  parseResolverLoopLog,
  partitionWaves,
  WAVE_HARD_CAP,
  type CrystallizedBatch,
  type DetectInput,
} from "./resolver-loop-detect";
import { parseWaveBlockShas, renderWaveBlock } from "./resolver-loop-log-update";

let pass = 0;
let fail = 0;

function check(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`ok - ${name}`);
    pass += 1;
  } catch (e) {
    console.error(`not ok - ${name}`);
    console.error(`  ${e instanceof Error ? e.message : String(e)}`);
    fail += 1;
  }
}

// --- synthetic builders -----------------------------------------------------

function cb(number: number, bookCount: number = 10, lastSlug?: string): CrystallizedBatch {
  return {
    number,
    bookCount,
    lastSlug: lastSlug ?? `slug-batch-${String(number).padStart(3, "0")}`,
  };
}

/** W40K roster size from the real data (565 books = 56 full batches + 5-book restbatch). */
const W40K_ROSTER = 565;

/** Crystallized state for fixture (a)/(c): batches 001..057, last one is a 5-book restbatch. */
const ALL_CRYSTALLIZED_57: CrystallizedBatch[] = (() => {
  const out: CrystallizedBatch[] = [];
  for (let n = 1; n <= 56; n += 1) out.push(cb(n, 10));
  out.push(cb(57, 5));
  return out;
})();

console.log("partitionWaves");

check("115-book remnant (batches 46..57) → 046..051 (60) + 052..057 (55)", () => {
  const open = ALL_CRYSTALLIZED_57.filter((b) => b.number >= 46);
  const parts = partitionWaves(open);
  assert.equal(parts.length, 2);
  assert.equal(parts[0][0].number, 46);
  assert.equal(parts[0][parts[0].length - 1].number, 51);
  assert.equal(
    parts[0].reduce((s, b) => s + b.bookCount, 0),
    60,
  );
  assert.equal(parts[1][0].number, 52);
  assert.equal(parts[1][parts[1].length - 1].number, 57);
  assert.equal(
    parts[1].reduce((s, b) => s + b.bookCount, 0),
    55,
  );
});

check("single-wave case (≤ hardCap open books) → one partition", () => {
  const open = [cb(46), cb(47), cb(48), cb(49), cb(50), cb(51)]; // 60 books
  const parts = partitionWaves(open);
  assert.equal(parts.length, 1);
  assert.equal(parts[0].length, 6);
});

check("empty open set → empty partition list", () => {
  assert.deepEqual(partitionWaves([]), []);
});

check("every partition stays ≤ WAVE_HARD_CAP", () => {
  const open = ALL_CRYSTALLIZED_57.filter((b) => b.number >= 46);
  for (const part of partitionWaves(open)) {
    const books = part.reduce((s, b) => s + b.bookCount, 0);
    assert.ok(books <= WAVE_HARD_CAP, `partition has ${books} books, > cap ${WAVE_HARD_CAP}`);
  }
});

console.log("");
console.log("detectNextWave");

// (a) open-wave -------------------------------------------------------------
check("(a) open-wave: 115-book remnant → first wave 046..051 (pass 8, 60 books)", () => {
  const input: DetectInput = {
    w40kRosterCount: W40K_ROSTER,
    crystallizedBatches: ALL_CRYSTALLIZED_57,
    resolverProgressBatch: 45,
    nextPassNumber: 8,
  };
  const r = detectNextWave(input);
  assert.equal(r.status, "open-wave");
  if (r.status !== "open-wave") return;
  assert.equal(r.wave.pass, 8);
  assert.equal(r.wave.first, 46);
  assert.equal(r.wave.last, 51);
  assert.equal(r.wave.bookCount, 60);
  assert.equal(r.wave.batches.length, 6);
  assert.equal(r.config.wave, "ssot-w40k-046..051");
  assert.equal(r.config.pass, "8");
  assert.equal(r.config.aggregator.batches[0], "ssot-w40k-046");
  assert.equal(r.config.aggregator.batches[5], "ssot-w40k-051");
  assert.equal(r.config.aggregator.applyRange.from, 1);
  assert.equal(r.config.aggregator.applyRange.to, 51);
  assert.equal(r.config.verify.newRange.from, "W40K-0451");
  assert.equal(r.config.verify.newRange.to, "W40K-0510");
  assert.equal(r.config.verify.oldRange.from, "W40K-0001");
  assert.equal(r.config.verify.oldRange.to, "W40K-0450");
  assert.equal(r.config.verify.ratingRange.from, "W40K-0451");
  assert.equal(r.config.verify.ratingRange.to, "W40K-0510");
  assert.equal(r.config.verify.smokeSlugs.length, 6);
  assert.equal(r.config.verify.smokeSlugs[0], "slug-batch-046");
  assert.equal(r.config.verify.smokeSlugs[5], "slug-batch-051");
});

// (b) idle ------------------------------------------------------------------
check("(b) idle: progress=45, no batch above 45 → status idle", () => {
  const onlyFirst45 = ALL_CRYSTALLIZED_57.filter((b) => b.number <= 45);
  const r = detectNextWave({
    w40kRosterCount: W40K_ROSTER,
    crystallizedBatches: onlyFirst45,
    resolverProgressBatch: 45,
    nextPassNumber: 8,
  });
  assert.equal(r.status, "idle");
  if (r.status !== "idle") return;
  assert.match(r.reason, /no later batches/);
});

check("(b') idle: zero progress + zero crystallized → status idle, distinct reason", () => {
  const r = detectNextWave({
    w40kRosterCount: W40K_ROSTER,
    crystallizedBatches: [],
    resolverProgressBatch: 0,
    nextPassNumber: 1,
  });
  assert.equal(r.status, "idle");
  if (r.status !== "idle") return;
  assert.match(r.reason, /no crystallized/);
});

// (c) w40k-complete ---------------------------------------------------------
check("(c) w40k-complete: progress=57 covers full roster (HH-presence irrelevant)", () => {
  // The detector does not look at HH at all; we just confirm a pass-57 state
  // returns w40k-complete with W40K-only input.
  const r = detectNextWave({
    w40kRosterCount: W40K_ROSTER,
    crystallizedBatches: ALL_CRYSTALLIZED_57,
    resolverProgressBatch: 57,
    nextPassNumber: 8,
  });
  assert.equal(r.status, "w40k-complete");
});

console.log("");
console.log("buildWaveConfig — content checks");

function detect115(): { config: ReturnType<typeof buildWaveConfig> } {
  const r = detectNextWave({
    w40kRosterCount: W40K_ROSTER,
    crystallizedBatches: ALL_CRYSTALLIZED_57,
    resolverProgressBatch: 45,
    nextPassNumber: 8,
  });
  if (r.status !== "open-wave") throw new Error("expected open-wave");
  return { config: r.config };
}

check("triggers are generic (no Pass-7 cluster lore, no brief reference, no brief-flip)", () => {
  const { config } = detect115();
  for (const phase of config.phases) {
    assert.doesNotMatch(
      phase.trigger,
      /Aeldari|Path of the Eldar|Macharian|Ahriman|Fabius|Carcharodons|Beast Arises/i,
      `phase ${phase.name} trigger leaks Pass-7-specific lore`,
    );
    assert.doesNotMatch(
      phase.trigger,
      /sessions\/\d{4}-\d{2}-\d{2}-\d{3}-arch/,
      `phase ${phase.name} trigger references a per-pass brief`,
    );
    assert.doesNotMatch(
      phase.trigger,
      /Brief-Status.*implemented/i,
      `phase ${phase.name} trigger tells CC to flip a brief to implemented`,
    );
    assert.match(
      phase.trigger,
      /ssot-w40k-046\.\.051/,
      `phase ${phase.name} trigger missing wave label`,
    );
  }
});

check("phase-4a scope lists per-batch override files for the new wave", () => {
  const { config } = detect115();
  const phase4a = config.phases.find((p) => p.name === "phase-4a-integration");
  assert.ok(phase4a, "phase-4a-integration missing");
  if (!phase4a) return;
  for (let n = 46; n <= 51; n += 1) {
    const expected = `scripts/seed-data/manual-overrides-ssot-w40k-${String(n).padStart(3, "0")}.json`;
    assert.ok(phase4a.scope.includes(expected), `phase-4a scope missing ${expected}`);
  }
});

check("dossier + statusFiles + implReport all track pass number", () => {
  const { config } = detect115();
  assert.equal(config.dossier, "sessions/resolver-dossiers/resolver-pass-8-dossier.md");
  const byName = Object.fromEntries(config.phases.map((p) => [p.name, p]));
  assert.equal(
    byName["phase-1-factions"].statusFile,
    "sessions/resolver-dossiers/resolver-pass-8-phase-1-report.md",
  );
  assert.equal(
    byName["phase-4a-integration"].statusFile,
    "sessions/resolver-dossiers/resolver-pass-8-phase-4a-report.md",
  );
  assert.equal(
    byName["phase-4b-verify-report"].statusFile,
    "sessions/resolver-dossiers/resolver-pass-8-impl-report.md",
  );
});

check("config has no `brief` field (Brief 094 removed per-pass briefs)", () => {
  const { config } = detect115();
  assert.equal(
    (config as unknown as Record<string, unknown>).brief,
    undefined,
    "config should not carry a brief field",
  );
});

check("config has no `clusters` field (Brief 094: weggelassen, not derivable from seriesHint)", () => {
  const { config } = detect115();
  assert.equal(
    (config.aggregator as unknown as Record<string, unknown>).clusters,
    undefined,
    "aggregator should not carry a clusters field",
  );
});

console.log("");
console.log("parseResolverLoopLog — input wiring");

check("bootstrap block → progress=45, nextPass=8", () => {
  const log =
    "# Resolver-Loop Log\n\n" +
    "## 2026-05-23 · Bootstrap (Pre-Loop-State)\n\n" +
    "Resolver-Fortschritt bei Implementierungs-Zeitpunkt: 7 Pässe komplett.\n\n" +
    "- [x] Pass 1..7 (Welle ssot-w40k-001..045, 450 Bücher) — vor Brief 094 supervised\n";
  const p = parseResolverLoopLog(log);
  assert.equal(p.resolverProgressBatch, 45);
  assert.equal(p.nextPassNumber, 8);
});

check("per-wave block with all 6 phases checked → progress advances, nextPass = pass+1", () => {
  const log =
    "# Resolver-Loop Log\n\n" +
    "## 2026-05-25 · Resolver-Pass 8 (Welle ssot-w40k-046..051, 60 Bücher)\n\n" +
    "- [x] Phase 0 — abc1234\n" +
    "- [x] Phase 1 — def5678\n" +
    "- [x] Phase 2 — 1111111\n" +
    "- [x] Phase 3 — 2222222\n" +
    "- [x] Phase 4a — 3333333\n" +
    "- [x] Phase 4b — 4444444\n";
  const p = parseResolverLoopLog(log);
  assert.equal(p.resolverProgressBatch, 51);
  assert.equal(p.nextPassNumber, 9);
});

check("partially-complete wave (4 of 6 phases) reserves same pass for resume", () => {
  const log =
    "# Resolver-Loop Log\n\n" +
    "## 2026-05-23 · Bootstrap (Pre-Loop-State)\n\n" +
    "- [x] Pass 1..7 (Welle ssot-w40k-001..045, 450 Bücher) — supervised\n\n" +
    "## 2026-05-25 · Resolver-Pass 8 (Welle ssot-w40k-046..051, 60 Bücher)\n\n" +
    "- [x] Phase 0 — abc1234\n" +
    "- [x] Phase 1 — def5678\n" +
    "- [x] Phase 2 — 1111111\n" +
    "- [x] Phase 3 — 2222222\n" +
    "- [ ] Phase 4a\n" +
    "- [ ] Phase 4b\n";
  const p = parseResolverLoopLog(log);
  assert.equal(p.resolverProgressBatch, 45);
  assert.equal(p.nextPassNumber, 8);
});

check("partial pass followed by later completed pass does not drag nextPass backwards", () => {
  const log =
    "## 2026-05-25 · Resolver-Pass 8 (Welle ssot-w40k-046..051, 60 Bücher)\n\n" +
    "- [x] Phase 0 — abc1234\n" +
    "- [ ] Phase 1\n\n" +
    "## 2026-05-26 · Resolver-Pass 9 (Welle ssot-w40k-052..057, 55 Bücher)\n\n" +
    "- [x] Phase 0 — a\n" +
    "- [x] Phase 1 — b\n" +
    "- [x] Phase 2 — c\n" +
    "- [x] Phase 3 — d\n" +
    "- [x] Phase 4a — e\n" +
    "- [x] Phase 4b — f\n";
  const p = parseResolverLoopLog(log);
  assert.equal(p.resolverProgressBatch, 57);
  assert.equal(p.nextPassNumber, 10);
});

check("parser + detector resume a partial wave with the same pass number", () => {
  const log =
    "## 2026-05-23 · Bootstrap (Pre-Loop-State)\n\n" +
    "- [x] Pass 1..7 (Welle ssot-w40k-001..045, 450 Bücher) — supervised\n\n" +
    "## 2026-05-25 · Resolver-Pass 8 (Welle ssot-w40k-046..051, 60 Bücher)\n\n" +
    "- [x] Phase 0 — abc1234\n" +
    "- [x] Phase 1 — def5678\n" +
    "- [x] Phase 2 — 1111111\n" +
    "- [x] Phase 3 — 2222222\n" +
    "- [ ] Phase 4a\n" +
    "- [ ] Phase 4b\n";
  const p = parseResolverLoopLog(log);
  const r = detectNextWave({
    w40kRosterCount: W40K_ROSTER,
    crystallizedBatches: ALL_CRYSTALLIZED_57,
    resolverProgressBatch: p.resolverProgressBatch,
    nextPassNumber: p.nextPassNumber,
  });
  assert.equal(r.status, "open-wave");
  if (r.status !== "open-wave") return;
  assert.equal(r.wave.pass, 8);
  assert.equal(r.config.wave, "ssot-w40k-046..051");
  assert.equal(
    r.config.phases.find((phase) => phase.name === "phase-4a-integration")?.statusFile,
    "sessions/resolver-dossiers/resolver-pass-8-phase-4a-report.md",
  );
});

check("empty log → progress=0, nextPass=1", () => {
  const p = parseResolverLoopLog("");
  assert.equal(p.resolverProgressBatch, 0);
  assert.equal(p.nextPassNumber, 1);
});

check("bootstrap followed by completed pass 8 → progress=51, nextPass=9", () => {
  const log =
    "## 2026-05-23 · Bootstrap (Pre-Loop-State)\n\n" +
    "- [x] Pass 1..7 (Welle ssot-w40k-001..045, 450 Bücher) — supervised\n\n" +
    "## 2026-05-25 · Resolver-Pass 8 (Welle ssot-w40k-046..051, 60 Bücher)\n\n" +
    "- [x] Phase 0 — a\n" +
    "- [x] Phase 1 — b\n" +
    "- [x] Phase 2 — c\n" +
    "- [x] Phase 3 — d\n" +
    "- [x] Phase 4a — e\n" +
    "- [x] Phase 4b — f\n";
  const p = parseResolverLoopLog(log);
  assert.equal(p.resolverProgressBatch, 51);
  assert.equal(p.nextPassNumber, 9);
});

console.log("");
console.log("resolver-loop-log-update — needs-decision resume");

check("needs-decision phase renders unchecked and does not count as completed", () => {
  const block = renderWaveBlock({
    date: "2026-05-25",
    pass: 8,
    wave: "ssot-w40k-046..051",
    bookCount: 60,
    outcome: "needs_decision",
    outcomeNote: "phase phase-1-factions",
    phases: [
      { name: "phase-0-preflight", sha: "abcdef123456", annotation: null },
      {
        name: "phase-1-factions",
        sha: null,
        annotation: "needs-decision in sessions/resolver-dossiers/resolver-pass-8-phase-1-report.md",
      },
    ],
  });

  assert.match(block, /- \[x\] Phase 0 \(Preflight\) — commit abcdef1/);
  assert.match(block, /- \[ \] Phase 1 \(Factions\) — needs-decision/);
  const shas = parseWaveBlockShas(block, "ssot-w40k-046..051");
  assert.equal(shas?.has("phase-0-preflight"), true);
  assert.equal(shas?.has("phase-1-factions"), false);
});

check("legacy checked needs-decision phase is ignored for resume SHA preservation", () => {
  const block =
    "## 2026-05-25 · Resolver-Pass 8 (Welle ssot-w40k-046..051, 60 Bücher)\n\n" +
    "- [x] Phase 0 (Preflight) — commit abcdef1\n" +
    "- [x] Phase 1 (Factions) — commit 1234567 (needs-decision in sessions/resolver-dossiers/resolver-pass-8-phase-1-report.md)\n" +
    "- [ ] Phase 2 (Locations)\n";

  const shas = parseWaveBlockShas(block, "ssot-w40k-046..051");
  assert.equal(shas?.get("phase-0-preflight"), "abcdef1");
  assert.equal(shas?.has("phase-1-factions"), false);
});

console.log("");
console.log(`# pass ${pass}`);
console.log(`# fail ${fail}`);
if (fail > 0) process.exit(1);
