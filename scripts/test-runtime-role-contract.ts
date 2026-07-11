/**
 * test-runtime-role-contract.ts — DB-free drift gate (Launch S3a Punkt 1).
 *
 * Enforces "every new table is granted CONSCIOUSLY": each pgTable exported
 * from src/db/schema.ts must be classified in exactly one of the three lists
 * in scripts/runtime-role.ts (SELECT-allowlist, upsert surface, denied). A
 * migration that adds a table without deciding its runtime visibility turns
 * `npm test` red — the fail-closed counterpart to having NO default
 * privileges towards the runtime role.
 *
 * Runs in the `npm test` sweep (scripts/run-tests.ts). schema.ts imports only
 * drizzle-orm and reads no env, so importing it here stays DB-free.
 */
import assert from "node:assert/strict";
import { getTableName, is } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import * as schema from "../src/db/schema";
import {
  RUNTIME_DENIED_TABLES,
  RUNTIME_SELECT_TABLES,
  RUNTIME_UPSERT_TABLES,
} from "./runtime-role";

let passed = 0;
function test(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
    console.log(`ok    ${name}`);
  } catch (err) {
    console.error(`FAIL  ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

// The schema module's export union carries concrete literal table configs;
// widen to unknown so the PgTable type guard can narrow it.
const schemaTables: string[] = Object.values(schema as Record<string, unknown>)
  .filter((v): v is PgTable => is(v, PgTable))
  .map((t) => getTableName(t))
  .sort();

const contractTables: string[] = [
  ...RUNTIME_SELECT_TABLES,
  ...RUNTIME_UPSERT_TABLES,
  ...RUNTIME_DENIED_TABLES,
].sort();

test("the three contract lists are disjoint", () => {
  assert.equal(
    new Set(contractTables).size,
    contractTables.length,
    `duplicate classification: ${contractTables.filter((t, i) => contractTables.indexOf(t) !== i).join(", ")}`,
  );
});

test("every schema table is classified in scripts/runtime-role.ts", () => {
  const unclassified = schemaTables.filter((t) => !contractTables.includes(t));
  assert.deepEqual(
    unclassified,
    [],
    `new table(s) in src/db/schema.ts without a runtime-role decision: ` +
      `${unclassified.join(", ")} — add each to RUNTIME_SELECT_TABLES (public catalogue), ` +
      `RUNTIME_UPSERT_TABLES (runtime write surface) or RUNTIME_DENIED_TABLES (no access) ` +
      `in scripts/runtime-role.ts, then re-run \`npm run db:roles\` after merge.`,
  );
});

test("every contract entry still exists in src/db/schema.ts", () => {
  const stale = contractTables.filter((t) => !schemaTables.includes(t));
  assert.deepEqual(
    stale,
    [],
    `stale table(s) in scripts/runtime-role.ts (no longer in the schema): ${stale.join(", ")}`,
  );
});

test("submissions stays on the denied list (PII)", () => {
  assert.ok(
    (RUNTIME_DENIED_TABLES as readonly string[]).includes("submissions"),
    "submissions carries PII and must never move out of RUNTIME_DENIED_TABLES casually",
  );
});

if (process.exitCode === 1) {
  console.error("test-runtime-role-contract: FAILED");
} else {
  console.log(`test-runtime-role-contract: all ${passed} cases passed`);
}
