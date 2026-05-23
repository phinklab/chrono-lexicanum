/**
 * resolver-loop-log-update.ts — render + upsert wave blocks in
 * sessions/resolver-loop-log.md (Brief 094).
 *
 * Companion to scripts/resolver-loop-detect.ts:
 *   - the detector READS the log to compute progress + next-pass;
 *   - this helper WRITES blocks (one per wave) as the loop advances.
 *
 *   - `renderWaveBlock(block)` is PURE — fixed Markdown template.
 *   - `parseWaveBlockShas(content, wave)` is PURE — pulls per-phase commit
 *      SHAs out of an existing block so a resumed wave can be re-rendered
 *      without losing earlier SHAs.
 *   - `upsertWaveBlock(content, block)` is PURE — appends if absent,
 *      replaces (in place) if already there.
 *   - `main()` does the file I/O + thin CLI.
 *
 * Block shape (mirror of the bootstrap block in sessions/resolver-loop-log.md):
 *
 *   ## YYYY-MM-DD · Resolver-Pass N (Welle ssot-w40k-AAA..BBB, M Bücher)
 *
 *   - [x] Phase 0 (Preflight) — commit abcdef1
 *   - [x] Phase 1 (Factions)  — commit 1234567
 *   - [x] Phase 2 (Locations) — commit ...
 *   - [ ] Phase 3 (Characters) — needs-decision: sessions/resolver-dossiers/...
 *   - [ ] Phase 4a (Apply)
 *   - [ ] Phase 4b (Verify)
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Phase metadata
// ---------------------------------------------------------------------------

export interface PhaseMeta {
  /** config phase name, e.g. "phase-0-preflight". */
  name: string;
  /** rendered label, e.g. "Phase 0 (Preflight)". */
  label: string;
}

export const PHASE_ORDER: PhaseMeta[] = [
  { name: "phase-0-preflight", label: "Phase 0 (Preflight)" },
  { name: "phase-1-factions", label: "Phase 1 (Factions)" },
  { name: "phase-2-locations", label: "Phase 2 (Locations)" },
  { name: "phase-3-characters", label: "Phase 3 (Characters)" },
  { name: "phase-4a-integration", label: "Phase 4a (Apply)" },
  { name: "phase-4b-verify-report", label: "Phase 4b (Verify)" },
];

export function labelForPhaseName(name: string): string {
  const found = PHASE_ORDER.find((p) => p.name === name);
  return found ? found.label : name;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PhaseEntry {
  name: string;
  sha: string | null;
  /** "needs-decision in <file>" or "timeout" or "halt: <reason>" or null. */
  annotation: string | null;
}

export interface WaveBlock {
  date: string;
  pass: number;
  wave: string;
  bookCount: number;
  /** ordered per PHASE_ORDER; entries missing get [ ]. */
  phases: PhaseEntry[];
  /** terminal outcome of the wave for the block footer marker. */
  outcome:
    | "success"
    | "needs_decision"
    | "halt"
    | "timeout"
    | "claude_fail"
    | "in_progress";
  /** halt/timeout/claude_fail reason or needs-decision phase, for the footer. */
  outcomeNote?: string | null;
}

// ---------------------------------------------------------------------------
// Pure: parse phase SHAs out of an existing block
// ---------------------------------------------------------------------------

/**
 * Return the per-phase SHAs from an existing wave block. Used by the loop
 * wrapper to retain SHAs from a prior partial run when re-rendering with the
 * new phases merged in.
 *
 * `wave` must match exactly (e.g. "ssot-w40k-046..051"). Returns `null` if no
 * block for that wave is present.
 */
export function parseWaveBlockShas(
  content: string,
  wave: string,
): Map<string, string> | null {
  const lines = content.split(/\r?\n/);
  let inBlock = false;
  let captured = false;
  const result = new Map<string, string>();
  const headingRe = new RegExp(
    `^##\\s+.*Resolver-Pass\\s+\\d+\\s*\\(.*${wave.replace(/\./g, "\\.")}`,
  );

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (headingRe.test(line)) {
        inBlock = true;
        captured = true;
        continue;
      }
      if (inBlock) break;
    }
    if (!inBlock) continue;
    const m = line.match(
      /^\s*-\s*\[(x| )\]\s*(Phase\s+(?:\d+[a-z]?))\b.*?(?:commit\s+([0-9a-f]{7,}))?/i,
    );
    if (m && m[1] === "x") {
      const phaseLabel = m[2].trim();
      const sha = m[3];
      const found = PHASE_ORDER.find((p) =>
        p.label.toLowerCase().startsWith(phaseLabel.toLowerCase()),
      );
      if (found && sha) {
        result.set(found.name, sha);
      }
    }
  }

  return captured ? result : null;
}

// ---------------------------------------------------------------------------
// Pure: render a block
// ---------------------------------------------------------------------------

export function renderWaveBlock(block: WaveBlock): string {
  const byName = new Map<string, PhaseEntry>();
  for (const p of block.phases) byName.set(p.name, p);

  const headingLine = `## ${block.date} · Resolver-Pass ${block.pass} (Welle ${block.wave}, ${block.bookCount} Bücher)`;
  const bullets: string[] = [];

  for (const phase of PHASE_ORDER) {
    const entry = byName.get(phase.name);
    if (entry && entry.sha) {
      let bullet = `- [x] ${phase.label} — commit ${entry.sha.slice(0, 7)}`;
      if (entry.annotation) bullet += ` (${entry.annotation})`;
      bullets.push(bullet);
    } else if (entry && entry.annotation) {
      bullets.push(`- [ ] ${phase.label} — ${entry.annotation}`);
    } else {
      bullets.push(`- [ ] ${phase.label}`);
    }
  }

  let footer = "";
  if (block.outcome === "success") {
    footer = "";
  } else if (block.outcome === "needs_decision") {
    footer = `\n_Outcome: **needs-decision**${block.outcomeNote ? ` — ${block.outcomeNote}` : ""}._`;
  } else if (block.outcome === "halt") {
    footer = `\n_Outcome: **halt**${block.outcomeNote ? ` — ${block.outcomeNote}` : ""}._`;
  } else if (block.outcome === "timeout") {
    footer = `\n_Outcome: **timeout**${block.outcomeNote ? ` — ${block.outcomeNote}` : ""}._`;
  } else if (block.outcome === "claude_fail") {
    footer = `\n_Outcome: **claude-fail**${block.outcomeNote ? ` — ${block.outcomeNote}` : ""}._`;
  } else {
    footer = `\n_Outcome: **in-progress**._`;
  }

  return `${headingLine}\n\n${bullets.join("\n")}\n${footer}\n`;
}

// ---------------------------------------------------------------------------
// Pure: upsert a block in the existing log content
// ---------------------------------------------------------------------------

/**
 * If the log already contains a block for `block.wave`, replace it in place;
 * otherwise append the new block to the end (with a blank line separator).
 *
 * Block boundary = the next H2 (`## `) heading or end-of-file.
 */
export function upsertWaveBlock(existing: string, block: WaveBlock): string {
  const rendered = renderWaveBlock(block).trimEnd();
  const lines = existing.split(/\r?\n/);
  const headingRe = new RegExp(
    `^##\\s+.*Resolver-Pass\\s+\\d+\\s*\\(.*${block.wave.replace(/\./g, "\\.")}`,
  );

  let startIdx = -1;
  let endIdx = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (headingRe.test(lines[i])) {
      startIdx = i;
      for (let j = i + 1; j < lines.length; j += 1) {
        if (lines[j].startsWith("## ")) {
          endIdx = j;
          break;
        }
      }
      if (endIdx === -1) endIdx = lines.length;
      break;
    }
  }

  if (startIdx === -1) {
    const trimmed = existing.replace(/\s+$/u, "");
    return `${trimmed}\n\n${rendered}\n`;
  }

  const before = lines.slice(0, startIdx).join("\n").replace(/\s+$/u, "");
  const after = lines.slice(endIdx).join("\n").replace(/^\s+/u, "");
  return `${before}\n\n${rendered}\n${after ? `\n${after}` : ""}`;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

interface CliArgs {
  logPath: string;
  date: string;
  pass: number;
  wave: string;
  bookCount: number;
  outcome: WaveBlock["outcome"];
  outcomeNote: string | null;
  phases: PhaseEntry[];
  needsDecisionPhase: string | null;
  needsDecisionFile: string | null;
}

function parseArgs(argv: string[]): CliArgs {
  const repo = process.cwd();
  const args: CliArgs = {
    logPath: path.join(repo, "sessions", "resolver-loop-log.md"),
    date: new Date().toISOString().slice(0, 10),
    pass: 0,
    wave: "",
    bookCount: 0,
    outcome: "in_progress",
    outcomeNote: null,
    phases: [],
    needsDecisionPhase: null,
    needsDecisionFile: null,
  };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--log-path") {
      i += 1;
      args.logPath = argv[i];
    } else if (a === "--date") {
      i += 1;
      args.date = argv[i];
    } else if (a === "--pass") {
      i += 1;
      args.pass = Number(argv[i]);
    } else if (a === "--wave") {
      i += 1;
      args.wave = argv[i];
    } else if (a === "--book-count") {
      i += 1;
      args.bookCount = Number(argv[i]);
    } else if (a === "--outcome") {
      i += 1;
      args.outcome = argv[i] as WaveBlock["outcome"];
    } else if (a === "--outcome-note") {
      i += 1;
      args.outcomeNote = argv[i];
    } else if (a === "--needs-decision-phase") {
      i += 1;
      args.needsDecisionPhase = argv[i];
    } else if (a === "--needs-decision-file") {
      i += 1;
      args.needsDecisionFile = argv[i];
    } else if (a === "--phase") {
      i += 1;
      const raw = argv[i];
      const [name, sha] = raw.split("|");
      if (!name) throw new Error(`--phase expects name|sha (got: ${raw})`);
      args.phases.push({
        name,
        sha: sha ?? null,
        annotation: null,
      });
    } else {
      throw new Error(`unknown arg: ${a}`);
    }
  }
  if (!args.wave) throw new Error("--wave is required");
  if (!args.pass) throw new Error("--pass is required");
  return args;
}

function main(): void {
  const args = parseArgs(process.argv);

  const existing = fs.existsSync(args.logPath)
    ? fs.readFileSync(args.logPath, "utf8")
    : "";

  // Merge in any SHAs already recorded in a prior partial block.
  const prior = parseWaveBlockShas(existing, args.wave);
  const seen = new Set<string>(args.phases.map((p) => p.name));
  if (prior) {
    for (const [name, sha] of prior) {
      if (!seen.has(name)) {
        args.phases.push({ name, sha, annotation: null });
        seen.add(name);
      }
    }
  }

  if (args.needsDecisionPhase) {
    const ann = args.needsDecisionFile
      ? `needs-decision in ${args.needsDecisionFile}`
      : "needs-decision";
    const existingEntry = args.phases.find((p) => p.name === args.needsDecisionPhase);
    if (existingEntry) {
      existingEntry.annotation = ann;
    } else {
      args.phases.push({ name: args.needsDecisionPhase, sha: null, annotation: ann });
    }
  }

  const block: WaveBlock = {
    date: args.date,
    pass: args.pass,
    wave: args.wave,
    bookCount: args.bookCount,
    phases: args.phases,
    outcome: args.outcome,
    outcomeNote: args.outcomeNote,
  };

  const next = upsertWaveBlock(existing, block);
  fs.writeFileSync(args.logPath, next, "utf8");
  process.stdout.write(`updated ${args.logPath} (wave ${args.wave}, outcome ${args.outcome})\n`);
}

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
