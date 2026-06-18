/**
 * db-apply-scope.ts — derive the FULL committed override-roster apply scope from
 * disk, assert it is gap-free, and (optionally) emit the apply config the
 * non-destructive sync + disaster-recovery rebuild chains feed to
 * `run-phase4-apply.sh`. Brief 157.
 *
 * WHY this exists: the apply scope used to be a HAND-PINNED cap in
 * `scripts/db-rebuild.config.json` (`w40k` `to: 57`). Crystallizing batches
 * 58..60 without bumping that one line silently dropped them from every rebuild
 * (Brief 156). "Sync/Rebuild = the whole committed roster" is now the *definition*:
 * the scope is DERIVED from the committed
 * `scripts/seed-data/manual-overrides-ssot-<domain>-NNN.json` files, never
 * hand-pinned, so it can never drift behind the roster again. Auto-derive covers
 * every domain it finds (today `w40k` 1..60 + `hh` 1..30) — a future domain is
 * picked up with no edit here.
 *
 * THE PREFLIGHT GUARD: a committed override batch the derived scope cannot
 * account for makes this script HALT LOUDLY (non-zero exit, clear marker) BEFORE
 * any apply or truncate runs. Two failure modes are caught:
 *   • a stray / misnamed `manual-overrides-ssot-*.json` the scope can't classify, and
 *   • a HOLE in a domain's `1..max` run (e.g. `ssot-w40k-041` missing).
 * A silent drop is exactly the failure this replaces.
 *
 * READ-ONLY w.r.t. the DB and the roster: it only reads the seed-data directory
 * listing and (with `--emit-config`) writes ONE regenerable config file under a
 * gitignored path. No DB connection — safe to run any time.
 *
 * CLI:
 *   npx tsx scripts/db-apply-scope.ts                       # human report + contiguity verdict
 *   npx tsx scripts/db-apply-scope.ts --json                # machine-readable scope
 *   npx tsx scripts/db-apply-scope.ts --emit-config <path>  # write derived apply config + print summary
 *   npx tsx scripts/db-apply-scope.ts --dir <path>          # override seed-data dir (tests/fixtures)
 *
 * Exit: 0 when the roster is a clean, gap-free set (>=1 batch); non-zero with a
 * clear `[db-apply-scope] HALT:` marker on a stray file, a hole, or an empty roster.
 */
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { parseArgs } from "node:util";

/** Default committed-roster location, relative to the invoking cwd (repo root). */
const DEFAULT_SEED_DIR = join("scripts", "seed-data");

/**
 * A committed override batch file. The roster filename is
 * `manual-overrides-<id>.json` where `<id>` is `ssot-<domain>-<NNN>` — so the
 * regex captures the batch id (group 1), the domain (group 2) and the zero-padded
 * number (group 3) in one shot. `<domain>` is `[a-z0-9]+` because `w40k` carries
 * digits; the literal `-` before `\d{3}` keeps the number from being swallowed.
 */
const BATCH_RE = /^manual-overrides-(ssot-([a-z0-9]+)-(\d{3}))\.json$/;

interface DomainScope {
  domain: string;
  /** Always 1 — the committed roster is 1-indexed and contiguous. */
  from: number;
  /** Highest committed batch number for this domain. */
  to: number;
  /** How many batch files this domain actually has (== to, when gap-free). */
  count: number;
}

interface DerivedScope {
  domains: DomainScope[];
  /** Every committed batch id, sorted by (domain, number). */
  batchIds: string[];
}

/** A run-phase4-apply.sh apply range: every batch `ssot-<domain>-from..to`. */
interface ApplyRange {
  domain: string;
  from: number;
  to: number;
}

/** Loud halt: the preflight guard tripped (stray file / hole / empty roster). */
class ScopeHalt extends Error {}

interface ParsedBatch {
  file: string;
  id: string;
  domain: string;
  num: number;
}

/**
 * Enumerate the committed override batch files in `dir`. Any
 * `manual-overrides-ssot-*.json` that does not match the strict id shape is a
 * stray the scope cannot classify → HALT (a committed batch outside the scope).
 */
function listBatchFiles(dir: string): ParsedBatch[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch (err) {
    throw new ScopeHalt(`cannot read seed-data dir: ${dir} (${(err as Error).message})`);
  }
  const candidates = entries
    .filter((f) => f.startsWith("manual-overrides-ssot-") && f.endsWith(".json"))
    .sort();

  const parsed: ParsedBatch[] = [];
  const stray: string[] = [];
  for (const file of candidates) {
    const m = BATCH_RE.exec(file);
    if (m === null) {
      stray.push(file);
      continue;
    }
    parsed.push({ file, id: m[1], domain: m[2], num: Number.parseInt(m[3], 10) });
  }
  if (stray.length > 0) {
    throw new ScopeHalt(
      "stray committed override file(s) the apply scope cannot classify " +
        "(expected manual-overrides-ssot-<domain>-NNN.json):\n" +
        stray.map((s) => `    - ${s}`).join("\n"),
    );
  }
  return parsed;
}

/**
 * Group the batch files per domain, assert each domain is a gap-free `1..max`
 * run, and return the derived scope. A missing number inside `1..max` is a HOLE
 * → HALT (the apply would otherwise try a non-existent batch, or silently skip it).
 */
function deriveScope(files: ParsedBatch[]): DerivedScope {
  const byDomain = new Map<string, number[]>();
  for (const f of files) {
    const nums = byDomain.get(f.domain) ?? [];
    nums.push(f.num);
    byDomain.set(f.domain, nums);
  }
  if (byDomain.size === 0) {
    throw new ScopeHalt(
      "no committed override batches found (scripts/seed-data/manual-overrides-ssot-*.json)",
    );
  }

  const domains: DomainScope[] = [];
  const batchIds: string[] = [];
  const holes: string[] = [];

  for (const [domain, nums] of [...byDomain.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const present = new Set(nums);
    const max = Math.max(...nums);
    for (let n = 1; n <= max; n += 1) {
      const id = `ssot-${domain}-${String(n).padStart(3, "0")}`;
      if (present.has(n)) {
        batchIds.push(id);
      } else {
        holes.push(id);
      }
    }
    domains.push({ domain, from: 1, to: max, count: nums.length });
  }

  if (holes.length > 0) {
    throw new ScopeHalt(
      "committed roster is NOT contiguous — missing batch file(s) inside 1..max:\n" +
        holes
          .map((h) => `    - ${h} (expected scripts/seed-data/manual-overrides-${h}.json)`)
          .join("\n"),
    );
  }
  return { domains, batchIds };
}

/** The run-phase4-apply.sh apply ranges for a derived scope. */
function applyRanges(scope: DerivedScope): ApplyRange[] {
  return scope.domains.map((d) => ({ domain: d.domain, from: d.from, to: d.to }));
}

/** One-line human description, e.g. `hh 1..30 (30) + w40k 1..60 (60)`. */
function scopeSummary(scope: DerivedScope): string {
  return scope.domains.map((d) => `${d.domain} ${d.from}..${d.to} (${d.count})`).join(" + ");
}

/**
 * The derived apply config consumed by `run-phase4-apply.sh`. It only needs
 * `aggregator.applyRanges` (the corpus to re-apply) and `aggregator.batches`
 * (empty — a sync/rebuild introduces no new resolver wave, so no per-batch
 * counts snapshot). GENERATED, gitignored, regenerated every run — never edited.
 */
function buildDerivedConfig(scope: DerivedScope): unknown {
  return {
    $comment:
      "GENERATED by scripts/db-apply-scope.ts (Brief 157) — DO NOT EDIT, DO NOT COMMIT. " +
      "The db:sync / db:rebuild apply scope is auto-derived from the committed " +
      "scripts/seed-data/manual-overrides-ssot-*.json roster; there is no hand-pinned cap to drift " +
      "(that was the Brief 156 failure). Regenerated on every db:sync / db:rebuild run.",
    pass: "db-sync",
    scope: scopeSummary(scope),
    aggregator: {
      batches: [],
      applyRanges: applyRanges(scope),
    },
  };
}

function printHumanReport(scope: DerivedScope): void {
  console.log("[db-apply-scope] committed override roster — auto-derived apply scope");
  for (const d of scope.domains) {
    console.log(`  ${d.domain.padEnd(8)} ${d.from}..${d.to}  (${d.count} batches)`);
  }
  console.log(`  total: ${scope.batchIds.length} committed batches across ${scope.domains.length} domain(s)`);
  console.log("[db-apply-scope] OK — roster is contiguous and fully covered by the apply scope.");
}

function main(): void {
  const { values } = parseArgs({
    options: {
      dir: { type: "string" },
      "emit-config": { type: "string" },
      json: { type: "boolean", default: false },
    },
  });

  const seedDir = values.dir !== undefined ? values.dir : DEFAULT_SEED_DIR;
  const files = listBatchFiles(resolve(process.cwd(), seedDir));
  const scope = deriveScope(files);

  if (values["emit-config"] !== undefined) {
    const out = values["emit-config"];
    const outPath = isAbsolute(out) ? out : resolve(process.cwd(), out);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, `${JSON.stringify(buildDerivedConfig(scope), null, 2)}\n`, "utf8");
    console.log(`[db-apply-scope] derived apply scope: ${scopeSummary(scope)}`);
    console.log(`[db-apply-scope] wrote derived config: ${out}`);
    return;
  }

  if (values.json === true) {
    console.log(
      JSON.stringify(
        { domains: scope.domains, total: scope.batchIds.length, applyRanges: applyRanges(scope) },
        null,
        2,
      ),
    );
    return;
  }

  printHumanReport(scope);
}

try {
  main();
  process.exit(0);
} catch (err) {
  if (err instanceof ScopeHalt) {
    console.error(`[db-apply-scope] HALT: ${err.message}`);
  } else {
    console.error("[db-apply-scope] failed:", err);
  }
  process.exit(1);
}
