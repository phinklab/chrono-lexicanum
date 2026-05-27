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
  /**
   * Cumulative range Phase 4 re-applies (idempotent). Singleton form, kept for
   * backward-compatibility with Pass-1 / per-wave resolver-pass configs.
   * Mutually exclusive with `applyRanges` — setting both is a hard error.
   */
  applyRange?: ApplyRange;
  /**
   * Multi-domain form (Brief 102 § Multi-Range-Schema). A pass that spans more
   * than one domain (e.g. the Full-Corpus Consolidation-Pass 2 across W40K +
   * HH) carries the list directly. Consumers should always read the normalized
   * `applyRanges` field returned by `loadConfig` — never the raw shape on disk.
   */
  applyRanges?: ApplyRange[];
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
  // The per-wave resolver-pass.config.json carries aggregator.batches (Phase 0
  // input). The Consolidation-Pass configs (no per-wave override scan) leave it
  // empty — accept that, but still require the field itself to be present so a
  // typo'd config doesn't slip through.
  if (!cfg.aggregator || !Array.isArray(cfg.aggregator.batches)) {
    throw new Error(`${path}: config missing aggregator.batches`);
  }
  // Normalize applyRange/applyRanges to a single canonical applyRanges field.
  // Backward-compat (Pass 1, every per-wave resolver-pass config): only the
  // singleton applyRange is set → wrap as [applyRange]. Forward-compat
  // (Pass 2+): applyRanges is set directly. Both → mehrdeutig, hard-error.
  const ranges = normalizeApplyRanges(cfg.aggregator, path);
  cfg.aggregator.applyRanges = ranges;
  return cfg;
}

function normalizeApplyRanges(
  aggregator: AggregatorConfig,
  path: string,
): ApplyRange[] {
  const singleton = aggregator.applyRange;
  const list = aggregator.applyRanges;
  if (singleton && list && list.length > 0) {
    throw new Error(
      `${path}: aggregator carries BOTH applyRange and applyRanges — pick one`,
    );
  }
  if (list && list.length > 0) {
    for (const r of list) assertValidRange(r, path);
    return list;
  }
  if (singleton) {
    assertValidRange(singleton, path);
    return [singleton];
  }
  // Resolver-loop / per-wave configs without an apply-range are valid for the
  // pure Phase-0 aggregator; expose an empty list and let the consumer decide.
  return [];
}

function assertValidRange(r: ApplyRange, path: string): void {
  if (r.domain !== "w40k" && r.domain !== "hh") {
    throw new Error(`${path}: applyRange.domain must be "w40k" or "hh" (got ${JSON.stringify(r.domain)})`);
  }
  if (!Number.isInteger(r.from) || !Number.isInteger(r.to) || r.from < 1 || r.to < r.from) {
    throw new Error(`${path}: applyRange has invalid from/to: ${JSON.stringify(r)}`);
  }
}

/** Expand applyRanges → flat list of batch ids (e.g. "ssot-w40k-001", "ssot-hh-007"). */
export function applyBatchIds(ranges: ApplyRange[]): string[] {
  const out: string[] = [];
  for (const r of ranges) {
    for (let n = r.from; n <= r.to; n += 1) {
      out.push(`ssot-${r.domain}-${String(n).padStart(3, "0")}`);
    }
  }
  return out;
}

/** Override-file basename for a batch id (e.g. ssot-w40k-021 → manual-overrides-ssot-w40k-021.json). */
export function overrideFileForBatch(batchId: string): string {
  return `manual-overrides-${batchId}.json`;
}
