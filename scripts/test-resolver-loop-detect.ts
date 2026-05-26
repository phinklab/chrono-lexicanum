/**
 * Standalone unit test for scripts/resolver-loop-detect.ts.
 *
 * No test framework: node:assert/strict + one console line per case, same
 * pattern as scripts/test-loop-next-batch.ts. Run via
 * `npm run test:resolver-loop-detect`.
 *
 * Three external terminal states from Brief 100 are exercised, plus the
 * internal W40K→HH boundary that materializes externally as `open-wave`:
 *
 *   (a) open-wave W40K           — 115 W40K remnant → first wave 046..051 (60 books)
 *   (b) idle                     — no batch above progress in the current domain
 *   (c) all-complete             — both domains resolved (no HH presence, or HH-complete)
 *   (d) w40k-complete-hh-pending — W40K resolved, HH crystallized → returns HH
 *                                   bootstrap wave (ssot-hh-001..002, 20 books) as
 *                                   `open-wave` (internal branch, not a new status)
 *   (e) HH regular wave          — after bootstrap (hhProgressBatch=2), the regular
 *                                   60-book cap kicks back in (ssot-hh-003..008)
 *
 * Plus content checks on `buildWaveConfig` (wave label, applyRange.domain,
 * verify ranges, smokeSlugs reflect the LAST book per batch, generic triggers
 * without per-pass lore or brief references, dossier path tracks pass number,
 * Phase-4a trigger mentions domain-aware Trias-Append) and the
 * `parseResolverLoopLog` parser (bootstrap shape, fully-checked wave block,
 * partially-checked wave block, mixed W40K + HH log, empty log).
 *
 * Drives PURE functions only — no FS/DB. The helper's `main()` is behind
 * a run-as-script guard so importing it triggers no I/O.
 */
import assert from "node:assert/strict";
import process from "node:process";

import {
  buildWaveConfig,
  detectNextWave,
  HH_BOOTSTRAP_WAVE_HARD_CAP,
  HH_BOOTSTRAP_WAVE_TARGET,
  parseResolverLoopLog,
  partitionWaves,
  WAVE_HARD_CAP,
  type CrystallizedBatch,
  type DetectInput,
  type Domain,
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

function cb(
  domain: Domain,
  number: number,
  bookCount: number = 10,
  lastSlug?: string,
): CrystallizedBatch {
  return {
    domain,
    number,
    bookCount,
    lastSlug: lastSlug ?? `slug-${domain}-batch-${String(number).padStart(3, "0")}`,
  };
}

/** W40K roster size from the real data (565 books = 56 full batches + 5-book restbatch). */
const W40K_ROSTER = 565;

/** HH roster size from the real data (294 books = 29 full batches + 4-book restbatch). */
const HH_ROSTER = 294;

/** Crystallized W40K state used in (a)/(c)/(d): batches 001..057, last is 5-book restbatch. */
const ALL_W40K_57: CrystallizedBatch[] = (() => {
  const out: CrystallizedBatch[] = [];
  for (let n = 1; n <= 56; n += 1) out.push(cb("w40k", n, 10));
  out.push(cb("w40k", 57, 5));
  return out;
})();

/** Crystallized HH state covering all 30 batches: 29 full + batch 030 = 4 books. */
const ALL_HH_30: CrystallizedBatch[] = (() => {
  const out: CrystallizedBatch[] = [];
  for (let n = 1; n <= 29; n += 1) out.push(cb("hh", n, 10));
  out.push(cb("hh", 30, 4));
  return out;
})();

/** Partial HH state — first 21 batches crystallized, 030 not yet in main. */
const PARTIAL_HH_21: CrystallizedBatch[] = ALL_HH_30.filter((b) => b.number <= 21);

console.log("partitionWaves");

check("115-book W40K remnant (batches 46..57) → 046..051 (60) + 052..057 (55)", () => {
  const open = ALL_W40K_57.filter((b) => b.number >= 46);
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
  const open = [
    cb("w40k", 46),
    cb("w40k", 47),
    cb("w40k", 48),
    cb("w40k", 49),
    cb("w40k", 50),
    cb("w40k", 51),
  ];
  const parts = partitionWaves(open);
  assert.equal(parts.length, 1);
  assert.equal(parts[0].length, 6);
});

check("empty open set → empty partition list", () => {
  assert.deepEqual(partitionWaves([]), []);
});

check("every W40K partition stays ≤ WAVE_HARD_CAP", () => {
  const open = ALL_W40K_57.filter((b) => b.number >= 46);
  for (const part of partitionWaves(open)) {
    const books = part.reduce((s, b) => s + b.bookCount, 0);
    assert.ok(books <= WAVE_HARD_CAP, `partition has ${books} books, > cap ${WAVE_HARD_CAP}`);
  }
});

check(
  "HH bootstrap (cap=25, target=20): 294 books with 10-each batches → first wave 001..002 (20)",
  () => {
    const open = ALL_HH_30;
    const parts = partitionWaves(open, HH_BOOTSTRAP_WAVE_HARD_CAP, HH_BOOTSTRAP_WAVE_TARGET);
    // First wave must close before batch 003 (which would push currentBooks to 30 > 25).
    assert.equal(parts[0][0].number, 1);
    assert.equal(parts[0][parts[0].length - 1].number, 2);
    assert.equal(
      parts[0].reduce((s, b) => s + b.bookCount, 0),
      20,
    );
    // Every bootstrap partition stays under the bootstrap cap.
    for (const part of parts) {
      const books = part.reduce((s, b) => s + b.bookCount, 0);
      assert.ok(
        books <= HH_BOOTSTRAP_WAVE_HARD_CAP,
        `bootstrap partition has ${books} books, > cap ${HH_BOOTSTRAP_WAVE_HARD_CAP}`,
      );
    }
  },
);

check(
  "HH regular after bootstrap (cap=60, no target): 274 books from batch 003 → 5 waves, first 003..008",
  () => {
    const open = ALL_HH_30.filter((b) => b.number >= 3);
    const parts = partitionWaves(open);
    // ceil(274/60) = 5 waves.
    assert.equal(parts.length, 5);
    // First regular wave is contiguous starting at batch 003.
    assert.equal(parts[0][0].number, 3);
    assert.equal(parts[0][parts[0].length - 1].number, 8);
    assert.equal(
      parts[0].reduce((s, b) => s + b.bookCount, 0),
      60,
    );
    for (const part of parts) {
      const books = part.reduce((s, b) => s + b.bookCount, 0);
      assert.ok(books <= WAVE_HARD_CAP, `partition has ${books} books, > cap ${WAVE_HARD_CAP}`);
    }
  },
);

console.log("");
console.log("detectNextWave");

// (a) open-wave W40K --------------------------------------------------------
check("(a) open-wave W40K: 115-book remnant → first wave 046..051 (pass 8, 60 books)", () => {
  const input: DetectInput = {
    w40kRosterCount: W40K_ROSTER,
    hhRosterCount: HH_ROSTER,
    crystallizedBatches: [...ALL_W40K_57, ...ALL_HH_30],
    w40kProgressBatch: 45,
    hhProgressBatch: 0,
    nextPassNumber: 8,
  };
  const r = detectNextWave(input);
  assert.equal(r.status, "open-wave");
  if (r.status !== "open-wave") return;
  assert.equal(r.wave.pass, 8);
  assert.equal(r.wave.domain, "w40k");
  assert.equal(r.wave.label, "ssot-w40k-046..051");
  assert.equal(r.wave.first, 46);
  assert.equal(r.wave.last, 51);
  assert.equal(r.wave.bookCount, 60);
  assert.equal(r.wave.batches.length, 6);
  assert.equal(r.config.wave, "ssot-w40k-046..051");
  assert.equal(r.config.pass, "8");
  assert.equal(r.config.aggregator.batches[0], "ssot-w40k-046");
  assert.equal(r.config.aggregator.batches[5], "ssot-w40k-051");
  assert.equal(r.config.aggregator.applyRange.domain, "w40k");
  assert.equal(r.config.aggregator.applyRange.from, 1);
  assert.equal(r.config.aggregator.applyRange.to, 51);
  assert.equal(r.config.verify.newRange.from, "W40K-0451");
  assert.equal(r.config.verify.newRange.to, "W40K-0510");
  assert.equal(r.config.verify.oldRange.from, "W40K-0001");
  assert.equal(r.config.verify.oldRange.to, "W40K-0450");
  assert.equal(r.config.verify.ratingRange.from, "W40K-0451");
  assert.equal(r.config.verify.ratingRange.to, "W40K-0510");
  assert.equal(r.config.verify.smokeSlugs.length, 6);
  assert.equal(r.config.verify.smokeSlugs[0], "slug-w40k-batch-046");
  assert.equal(r.config.verify.smokeSlugs[5], "slug-w40k-batch-051");
});

// (b) idle ------------------------------------------------------------------
check("(b) idle W40K: progress=45 + no later W40K batches → status idle", () => {
  const onlyFirst45 = ALL_W40K_57.filter((b) => b.number <= 45);
  const r = detectNextWave({
    w40kRosterCount: W40K_ROSTER,
    hhRosterCount: HH_ROSTER,
    crystallizedBatches: onlyFirst45,
    w40kProgressBatch: 45,
    hhProgressBatch: 0,
    nextPassNumber: 8,
  });
  assert.equal(r.status, "idle");
  if (r.status !== "idle") return;
  assert.match(r.reason, /W40K/);
  assert.match(r.reason, /no later batches/);
});

check(
  "(b') idle W40K: zero progress + zero crystallized → status idle, distinct reason",
  () => {
    const r = detectNextWave({
      w40kRosterCount: W40K_ROSTER,
      hhRosterCount: HH_ROSTER,
      crystallizedBatches: [],
      w40kProgressBatch: 0,
      hhProgressBatch: 0,
      nextPassNumber: 1,
    });
    assert.equal(r.status, "idle");
    if (r.status !== "idle") return;
    assert.match(r.reason, /W40K/);
    assert.match(r.reason, /no crystallized/);
  },
);

// (c) all-complete ---------------------------------------------------------
check("(c) all-complete: both domains resolved → status all-complete", () => {
  const r = detectNextWave({
    w40kRosterCount: W40K_ROSTER,
    hhRosterCount: HH_ROSTER,
    crystallizedBatches: [...ALL_W40K_57, ...ALL_HH_30],
    w40kProgressBatch: 57,
    hhProgressBatch: 30,
    nextPassNumber: 16,
  });
  assert.equal(r.status, "all-complete");
});

check(
  "(c') all-complete with HH-roster=0 (synthetic edge): W40K-only world resolved → all-complete",
  () => {
    const r = detectNextWave({
      w40kRosterCount: W40K_ROSTER,
      hhRosterCount: 0,
      crystallizedBatches: ALL_W40K_57,
      w40kProgressBatch: 57,
      hhProgressBatch: 0,
      nextPassNumber: 10,
    });
    assert.equal(r.status, "all-complete");
  },
);

// (d) W40K complete, HH crystallized → first HH wave (bootstrap) ------------
check(
  "(d) w40k-complete-hh-pending: W40K resolved + 21 HH batches crystallized → HH bootstrap " +
    "ssot-hh-001..002 (20 books) materializes as open-wave (internal branch point)",
  () => {
    const r = detectNextWave({
      w40kRosterCount: W40K_ROSTER,
      hhRosterCount: HH_ROSTER,
      crystallizedBatches: [...ALL_W40K_57, ...PARTIAL_HH_21],
      w40kProgressBatch: 57,
      hhProgressBatch: 0,
      nextPassNumber: 10,
    });
    assert.equal(r.status, "open-wave");
    if (r.status !== "open-wave") return;
    assert.equal(r.wave.domain, "hh");
    assert.equal(r.wave.label, "ssot-hh-001..002");
    assert.equal(r.wave.first, 1);
    assert.equal(r.wave.last, 2);
    assert.equal(r.wave.bookCount, 20);
    assert.equal(r.wave.batches.length, 2);
    assert.equal(r.wave.pass, 10);
    assert.equal(r.config.wave, "ssot-hh-001..002");
    assert.equal(r.config.aggregator.applyRange.domain, "hh");
    assert.equal(r.config.aggregator.applyRange.from, 1);
    assert.equal(r.config.aggregator.applyRange.to, 2);
    assert.equal(r.config.aggregator.batches[0], "ssot-hh-001");
    assert.equal(r.config.aggregator.batches[1], "ssot-hh-002");
    assert.equal(r.config.verify.newRange.from, "HH-0001");
    assert.equal(r.config.verify.newRange.to, "HH-0020");
    // Bootstrap oldRange is degenerate (HH-0001..HH-0000 — empty by lexical compare).
    assert.equal(r.config.verify.oldRange.from, "HH-0001");
    assert.equal(r.config.verify.oldRange.to, "HH-0000");
  },
);

check(
  "(d') w40k-complete + full HH (30/30) crystallized → still produces ssot-hh-001..002 first",
  () => {
    const r = detectNextWave({
      w40kRosterCount: W40K_ROSTER,
      hhRosterCount: HH_ROSTER,
      crystallizedBatches: [...ALL_W40K_57, ...ALL_HH_30],
      w40kProgressBatch: 57,
      hhProgressBatch: 0,
      nextPassNumber: 10,
    });
    assert.equal(r.status, "open-wave");
    if (r.status !== "open-wave") return;
    assert.equal(r.wave.domain, "hh");
    assert.equal(r.wave.label, "ssot-hh-001..002");
    assert.equal(r.wave.bookCount, 20);
  },
);

check(
  "(d'') w40k-complete + zero HH crystallized → idle with HH reason (not all-complete)",
  () => {
    const r = detectNextWave({
      w40kRosterCount: W40K_ROSTER,
      hhRosterCount: HH_ROSTER,
      crystallizedBatches: ALL_W40K_57,
      w40kProgressBatch: 57,
      hhProgressBatch: 0,
      nextPassNumber: 10,
    });
    assert.equal(r.status, "idle");
    if (r.status !== "idle") return;
    assert.match(r.reason, /HH/);
    assert.match(r.reason, /no crystallized/);
  },
);

// (e) HH regular waves after bootstrap --------------------------------------
check(
  "(e) HH regular wave 2: hhProgressBatch=2, 28 HH batches above → ssot-hh-003..008 (60 books, regular cap)",
  () => {
    const r = detectNextWave({
      w40kRosterCount: W40K_ROSTER,
      hhRosterCount: HH_ROSTER,
      crystallizedBatches: [...ALL_W40K_57, ...ALL_HH_30],
      w40kProgressBatch: 57,
      hhProgressBatch: 2,
      nextPassNumber: 11,
    });
    assert.equal(r.status, "open-wave");
    if (r.status !== "open-wave") return;
    assert.equal(r.wave.domain, "hh");
    assert.equal(r.wave.label, "ssot-hh-003..008");
    assert.equal(r.wave.first, 3);
    assert.equal(r.wave.last, 8);
    assert.equal(r.wave.bookCount, 60);
    assert.equal(r.config.aggregator.applyRange.domain, "hh");
    assert.equal(r.config.aggregator.applyRange.from, 1);
    assert.equal(r.config.aggregator.applyRange.to, 8);
    assert.equal(r.config.verify.newRange.from, "HH-0021");
    assert.equal(r.config.verify.newRange.to, "HH-0080");
    assert.equal(r.config.verify.oldRange.from, "HH-0001");
    assert.equal(r.config.verify.oldRange.to, "HH-0020");
  },
);

check(
  "(e') HH idle: W40K complete, hhProgressBatch=29, only batch 030 (4 books) above → ssot-hh-030..030",
  () => {
    const r = detectNextWave({
      w40kRosterCount: W40K_ROSTER,
      hhRosterCount: HH_ROSTER,
      crystallizedBatches: [...ALL_W40K_57, ...ALL_HH_30],
      w40kProgressBatch: 57,
      hhProgressBatch: 29,
      nextPassNumber: 15,
    });
    assert.equal(r.status, "open-wave");
    if (r.status !== "open-wave") return;
    assert.equal(r.wave.domain, "hh");
    assert.equal(r.wave.label, "ssot-hh-030..030");
    assert.equal(r.wave.bookCount, 4);
    assert.equal(r.config.verify.newRange.from, "HH-0291");
    assert.equal(r.config.verify.newRange.to, "HH-0294");
  },
);

console.log("");
console.log("buildWaveConfig — content checks");

function detect115(): { config: ReturnType<typeof buildWaveConfig> } {
  const r = detectNextWave({
    w40kRosterCount: W40K_ROSTER,
    hhRosterCount: HH_ROSTER,
    crystallizedBatches: ALL_W40K_57,
    w40kProgressBatch: 45,
    hhProgressBatch: 0,
    nextPassNumber: 8,
  });
  if (r.status !== "open-wave") throw new Error("expected open-wave");
  return { config: r.config };
}

function detectHhBootstrap(): { config: ReturnType<typeof buildWaveConfig> } {
  const r = detectNextWave({
    w40kRosterCount: W40K_ROSTER,
    hhRosterCount: HH_ROSTER,
    crystallizedBatches: [...ALL_W40K_57, ...ALL_HH_30],
    w40kProgressBatch: 57,
    hhProgressBatch: 0,
    nextPassNumber: 10,
  });
  if (r.status !== "open-wave") throw new Error("expected open-wave (HH bootstrap)");
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

check("HH-wave triggers carry the ssot-hh- label, not a W40K leftover", () => {
  const { config } = detectHhBootstrap();
  for (const phase of config.phases) {
    assert.match(
      phase.trigger,
      /ssot-hh-001\.\.002/,
      `phase ${phase.name} trigger missing HH wave label`,
    );
    assert.doesNotMatch(
      phase.trigger,
      /ssot-w40k-/,
      `phase ${phase.name} trigger still mentions ssot-w40k-`,
    );
  }
});

check("phase-4a trigger mentions domain-aware Trias-Append (Brief 100)", () => {
  const { config: w40kConfig } = detect115();
  const w40kPhase4a = w40kConfig.phases.find((p) => p.name === "phase-4a-integration");
  assert.ok(w40kPhase4a, "phase-4a missing in W40K config");
  if (w40kPhase4a) {
    assert.match(
      w40kPhase4a.trigger,
      /domain-aware/i,
      "W40K phase-4a trigger should reference domain-aware Trias-Append",
    );
    assert.match(
      w40kPhase4a.trigger,
      /domain:\s*"w40k"/,
      "W40K phase-4a trigger should template the W40K domain",
    );
  }

  const { config: hhConfig } = detectHhBootstrap();
  const hhPhase4a = hhConfig.phases.find((p) => p.name === "phase-4a-integration");
  assert.ok(hhPhase4a, "phase-4a missing in HH config");
  if (hhPhase4a) {
    assert.match(
      hhPhase4a.trigger,
      /domain:\s*"hh"/,
      "HH phase-4a trigger should template the HH domain",
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

check("HH wave phase-4a scope lists ssot-hh-* override files", () => {
  const { config } = detectHhBootstrap();
  const phase4a = config.phases.find((p) => p.name === "phase-4a-integration");
  assert.ok(phase4a, "phase-4a-integration missing");
  if (!phase4a) return;
  assert.ok(
    phase4a.scope.includes("scripts/seed-data/manual-overrides-ssot-hh-001.json"),
    "phase-4a scope missing manual-overrides-ssot-hh-001.json",
  );
  assert.ok(
    phase4a.scope.includes("scripts/seed-data/manual-overrides-ssot-hh-002.json"),
    "phase-4a scope missing manual-overrides-ssot-hh-002.json",
  );
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

check("HH bootstrap dossier paths follow global pass-counter (no hh-pass-1 namespace)", () => {
  const { config } = detectHhBootstrap();
  assert.equal(config.dossier, "sessions/resolver-dossiers/resolver-pass-10-dossier.md");
  const byName = Object.fromEntries(config.phases.map((p) => [p.name, p]));
  assert.equal(
    byName["phase-4b-verify-report"].statusFile,
    "sessions/resolver-dossiers/resolver-pass-10-impl-report.md",
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

check("bootstrap block → w40kProgress=45, nextPass=8, hh untouched", () => {
  const log =
    "# Resolver-Loop Log\n\n" +
    "## 2026-05-23 · Bootstrap (Pre-Loop-State)\n\n" +
    "Resolver-Fortschritt bei Implementierungs-Zeitpunkt: 7 Pässe komplett.\n\n" +
    "- [x] Pass 1..7 (Welle ssot-w40k-001..045, 450 Bücher) — vor Brief 094 supervised\n";
  const p = parseResolverLoopLog(log);
  assert.equal(p.w40kProgressBatch, 45);
  assert.equal(p.hhProgressBatch, 0);
  assert.equal(p.nextPassNumber, 8);
});

check("per-wave W40K block with all 6 phases checked → w40kProgress advances, nextPass = pass+1", () => {
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
  assert.equal(p.w40kProgressBatch, 51);
  assert.equal(p.hhProgressBatch, 0);
  assert.equal(p.nextPassNumber, 9);
});

check("per-wave HH block with all 6 phases checked → hhProgress advances, w40k untouched", () => {
  const log =
    "## 2026-05-27 · Resolver-Pass 10 (Welle ssot-hh-001..002, 20 Bücher)\n\n" +
    "- [x] Phase 0 — aaa1111\n" +
    "- [x] Phase 1 — bbb2222\n" +
    "- [x] Phase 2 — ccc3333\n" +
    "- [x] Phase 3 — ddd4444\n" +
    "- [x] Phase 4a — eee5555\n" +
    "- [x] Phase 4b — fff6666\n";
  const p = parseResolverLoopLog(log);
  assert.equal(p.w40kProgressBatch, 0);
  assert.equal(p.hhProgressBatch, 2);
  assert.equal(p.nextPassNumber, 11);
});

check("mixed W40K + HH log → both progress counters set independently", () => {
  const log =
    "## 2026-05-25 · Resolver-Pass 8 (Welle ssot-w40k-046..051, 60 Bücher)\n\n" +
    "- [x] Phase 0 — a\n" +
    "- [x] Phase 1 — b\n" +
    "- [x] Phase 2 — c\n" +
    "- [x] Phase 3 — d\n" +
    "- [x] Phase 4a — e\n" +
    "- [x] Phase 4b — f\n\n" +
    "## 2026-05-27 · Resolver-Pass 10 (Welle ssot-hh-001..002, 20 Bücher)\n\n" +
    "- [x] Phase 0 — g\n" +
    "- [x] Phase 1 — h\n" +
    "- [x] Phase 2 — i\n" +
    "- [x] Phase 3 — j\n" +
    "- [x] Phase 4a — k\n" +
    "- [x] Phase 4b — l\n";
  const p = parseResolverLoopLog(log);
  assert.equal(p.w40kProgressBatch, 51);
  assert.equal(p.hhProgressBatch, 2);
  assert.equal(p.nextPassNumber, 11);
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
  assert.equal(p.w40kProgressBatch, 45);
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
  assert.equal(p.w40kProgressBatch, 57);
  assert.equal(p.nextPassNumber, 10);
});

check("parser + detector resume a partial W40K wave with the same pass number", () => {
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
    hhRosterCount: HH_ROSTER,
    crystallizedBatches: ALL_W40K_57,
    w40kProgressBatch: p.w40kProgressBatch,
    hhProgressBatch: p.hhProgressBatch,
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
  assert.equal(p.w40kProgressBatch, 0);
  assert.equal(p.hhProgressBatch, 0);
  assert.equal(p.nextPassNumber, 1);
});

check("bootstrap followed by completed pass 8 → w40kProgress=51, nextPass=9", () => {
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
  assert.equal(p.w40kProgressBatch, 51);
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
