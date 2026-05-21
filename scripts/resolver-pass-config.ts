/**
 * resolver-pass-config.ts — shared loader for the per-pass resolver config
 * (scripts/resolver-pass.config.json), Brief 090.
 *
 * The config is the single per-pass parameter carrier: it tells the stable,
 * wave-parametrized tools (aggregate-surface-forms.ts / run-phase4-apply.sh /
 * verify-pass.ts) which wave + range to operate on, so a future pass needs no
 * new `-NNN` script clones. Pure FS, no DB, no network.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface ApplyRange {
  domain: "w40k" | "hh";
  from: number;
  to: number;
}

export interface AggregatorConfig {
  /** batch ids whose override files this wave aggregates (Phase 0). */
  batches: string[];
  /** cumulative range Phase 4 re-applies (idempotent). */
  applyRange: ApplyRange;
  /** optional batch-id → cluster-tag labels for the dossier aggregate. */
  clusters?: Record<string, string>;
}

export interface VerifyConfig {
  newRange: { from: string; to: string };
  oldRange: { from: string; to: string };
  ratingRange: { from: string; to: string };
  smokeSlugs: string[];
}

export interface PhaseConfig {
  name: string;
  trigger: string;
  scope: string[];
  statusFile: string | null;
}

export interface ResolverPassConfig {
  pass: string;
  wave: string;
  /** REQUIRED operative spec (Brief 090). */
  runbook: string;
  /** optional rationale-only architect brief. */
  brief?: string;
  dossier: string;
  aggregator: AggregatorConfig;
  verify: VerifyConfig;
  phases: PhaseConfig[];
}

const DEFAULT_CONFIG = join(
  process.cwd(),
  "scripts",
  "resolver-pass.config.json",
);

/** Resolve the config path from `--config <path>`, else the repo default. */
export function configPathFromArgv(argv: string[]): string {
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === "--config") return argv[i + 1];
  }
  return DEFAULT_CONFIG;
}

export function loadConfig(argv: string[] = process.argv): ResolverPassConfig {
  const path = configPathFromArgv(argv);
  const cfg = JSON.parse(readFileSync(path, "utf8")) as ResolverPassConfig;
  if (!cfg.runbook) throw new Error(`${path}: config missing required field "runbook"`);
  if (!cfg.aggregator?.batches?.length) {
    throw new Error(`${path}: config missing aggregator.batches`);
  }
  return cfg;
}

/** Override-file basename for a batch id (e.g. ssot-w40k-021 → manual-overrides-ssot-w40k-021.json). */
export function overrideFileForBatch(batchId: string): string {
  return `manual-overrides-${batchId}.json`;
}
