/**
 * DB-free test aggregate — `npm test` (Brief 180).
 *
 * Problem this solves: ~30 assertion-based `scripts/test-*.ts` suites existed
 * but CI ran none of them, so a regression in ~46K LOC of pipeline code could
 * merge unnoticed (Session 175 shipped 8 red `test:podcast-cc-direct` cases
 * that were only found later). This runner makes every DB-free suite a single
 * `npm test` command and a PR gate.
 *
 * Design:
 *  - **Auto-discovery, not an allow-list.** Every `scripts/test-*.ts` is
 *    included by default, so a newly added suite is visible to CI the moment it
 *    lands — the invisibility that caused the original problem cannot recur. A
 *    suite is only skipped if it is on `DB_OR_NETWORK_GATED` below, and each
 *    entry documents why + how to run it manually.
 *  - **Subprocess isolation.** Each suite is its own `node --import tsx` child.
 *    The suites signal failure via `process.exit(1)` / `process.exitCode = 1`;
 *    running them in-process would let the first one's exit kill the runner and
 *    would leak module state between suites.
 *  - **DATABASE_URL is stripped from the child env.** The DB-free suites either
 *    never read it or stub it (`process.env.DATABASE_URL ??= "postgres://stub…"`
 *    in test-apply-book / test-migration-equivalence). Removing it guarantees
 *    the stub path is taken and a suite can never accidentally reach a real DB
 *    if a developer happens to have DATABASE_URL exported. A suite that truly
 *    needs a DB then fails loudly with "DATABASE_URL is not set", which forces
 *    the author to either make it DB-free or add it to the deny-list — the
 *    correct forcing function.
 *
 * Not a framework. The node:assert scripts are right for this scope (Brief 180,
 * review-verified); this only aggregates + gates them.
 */
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Suites that need a live Supabase DB or network access and therefore stay
 * manual commands, listed here so the inventory is visible on every run.
 * Key = filename in scripts/, value = why + how to run it.
 */
const DB_OR_NETWORK_GATED: Record<string, string> = {
  "test-ask-recommend.ts":
    "live Supabase DB (recommend lib imports src/db/client) — run: npm run test:ask-recommend",
};

const allSuites = readdirSync(scriptsDir)
  .filter((f) => /^test-.*\.ts$/.test(f))
  .sort();

// Self-guard: a deny-list entry that no longer maps to a file is a stale
// exclusion that would silently hide a suite. Fail rather than run partial.
const stale = Object.keys(DB_OR_NETWORK_GATED).filter((f) => !allSuites.includes(f));
if (stale.length > 0) {
  console.error(
    `run-tests: stale DB_OR_NETWORK_GATED entr${stale.length === 1 ? "y" : "ies"} — ` +
      `no such file in scripts/: ${stale.join(", ")}`,
  );
  process.exit(2);
}

const included = allSuites.filter((f) => !(f in DB_OR_NETWORK_GATED));
const excluded = allSuites.filter((f) => f in DB_OR_NETWORK_GATED);

console.log(`npm test — ${included.length} DB-free suites (auto-discovered from scripts/test-*.ts)`);
if (excluded.length > 0) {
  console.log(`skipped ${excluded.length} DB/network-gated suite(s), run manually:`);
  for (const f of excluded) console.log(`  - ${f}: ${DB_OR_NETWORK_GATED[f]}`);
}
console.log("");

const childEnv = { ...process.env };
delete childEnv.DATABASE_URL;

const started = Date.now();
const failures: string[] = [];

for (const file of included) {
  const res = spawnSync(process.execPath, ["--import", "tsx", path.join(scriptsDir, file)], {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    env: childEnv,
  });
  const ok = res.status === 0 && res.signal === null;
  if (ok) {
    console.log(`ok    ${file}`);
  } else {
    failures.push(file);
    console.log(`FAIL  ${file}  (exit ${res.status ?? `signal ${res.signal}`})`);
    // Surface the failing suite's own output so CI logs are actionable.
    if (res.stdout) process.stdout.write(res.stdout);
    if (res.stderr) process.stderr.write(res.stderr);
  }
}

const elapsed = ((Date.now() - started) / 1000).toFixed(1);
console.log("");
if (failures.length === 0) {
  console.log(`PASS — ${included.length} suites green in ${elapsed}s`);
} else {
  console.log(
    `FAIL — ${failures.length}/${included.length} suite(s) red in ${elapsed}s: ${failures.join(", ")}`,
  );
  process.exit(1);
}
