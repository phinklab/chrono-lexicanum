/**
 * test-brain-lint-budgets.ts — Brief 176 (B7, spec Brief 112). DB-free unit
 * tests for the always-read budget check:
 *   - under soft → no finding; over soft → warning; over hard → error.
 *   - missing always-read file → error.
 *   - open-questions open-item counter: `**(N)` + `## (N)` headers count,
 *     struck-through (`~~`) items don't; >5 open items → warning.
 *   - the REAL repo state carries no HARD violation (soft warnings allowed —
 *     they are the guardrail's job, not a test failure).
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  ALWAYS_READ_BUDGETS,
  OPEN_QUESTIONS_FILE,
  OPEN_QUESTIONS_MAX_OPEN,
  checkAlwaysReadBudgets,
  countOpenItems,
} from "./brain-lint-budgets";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail = ""): void {
  if (cond) {
    passed += 1;
    console.log(`ok - ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL - ${name}${detail ? `: ${detail}` : ""}`);
  }
}

/** Reader over an in-memory fixture map; unnamed files fall back to "" (clean). */
function fixtureReader(fixtures: Record<string, string | null>): (rel: string) => string | null {
  return (rel) => (rel in fixtures ? fixtures[rel] : "");
}

function findingsFor(fixtures: Record<string, string | null>, file: string) {
  return checkAlwaysReadBudgets(fixtureReader(fixtures)).filter((f) => f.file === file);
}

// ---- size budgets -----------------------------------------------------------

const PS = "brain/wiki/project-state.md"; // soft 25k / hard 45k
const psBudget = ALWAYS_READ_BUDGETS.find((b) => b.file === PS)!;

check("under soft → no finding", findingsFor({ [PS]: "x".repeat(psBudget.softChars) }, PS).length === 0);

const softHit = findingsFor({ [PS]: "x".repeat(psBudget.softChars + 1) }, PS);
check("over soft → exactly one warning", softHit.length === 1 && softHit[0]!.severity === "warning");
check(
  "warning message carries measured chars + budget",
  (softHit[0]?.message.includes(String(psBudget.softChars + 1)) ?? false) &&
    (softHit[0]?.message.includes(String(psBudget.softChars)) ?? false),
);

const hardHit = findingsFor({ [PS]: "x".repeat(psBudget.hardChars + 1) }, PS);
check("over hard → exactly one error", hardHit.length === 1 && hardHit[0]!.severity === "error");

check(
  "missing always-read file → error",
  findingsFor({ [PS]: null }, PS).some((f) => f.severity === "error" && f.message.includes("missing")),
);

// ---- open-questions open-item counter ----------------------------------------

check("countOpenItems: today's bold format", countOpenItems("**(16) Foo**\ntext\n**(17) Bar**") === 2);
check("countOpenItems: Brief-112 heading format", countOpenItems("## (1) Foo\n## (2) Bar") === 2);
check("countOpenItems: struck-through item is closed", countOpenItems("~~**(1) Done**~~\n**(2) Open**") === 1);
check("countOpenItems: prose mentions don't count", countOpenItems("> **OQ (17) Deep-Review** geschlossen\nsee (18) above") === 0);

const sixItems = Array.from({ length: OPEN_QUESTIONS_MAX_OPEN + 1 }, (_, i) => `**(${i + 1}) Item**`).join("\n\n");
const oqOver = findingsFor({ [OPEN_QUESTIONS_FILE]: sixItems }, OPEN_QUESTIONS_FILE);
check(
  `>${OPEN_QUESTIONS_MAX_OPEN} open items → warning`,
  oqOver.some((f) => f.severity === "warning" && f.message.includes("open items")),
);
const fiveItems = Array.from({ length: OPEN_QUESTIONS_MAX_OPEN }, (_, i) => `**(${i + 1}) Item**`).join("\n\n");
check(
  `${OPEN_QUESTIONS_MAX_OPEN} open items → no warning`,
  findingsFor({ [OPEN_QUESTIONS_FILE]: fiveItems }, OPEN_QUESTIONS_FILE).length === 0,
);

// ---- real repo state ----------------------------------------------------------

const repoRoot = process.cwd();
const realFindings = checkAlwaysReadBudgets((rel) => {
  const abs = path.join(repoRoot, rel);
  return existsSync(abs) ? readFileSync(abs, "utf8") : null;
});
const realErrors = realFindings.filter((f) => f.severity === "error");
check(
  "real repo: no HARD budget violation (soft warnings allowed)",
  realErrors.length === 0,
  realErrors.map((f) => `${f.file}: ${f.message}`).join("; "),
);

console.log(`\n# pass ${passed}`);
console.log(`# fail ${failed}`);
if (failed > 0) process.exit(1);
