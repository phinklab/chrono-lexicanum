/**
 * verify-runtime-role.ts — positive + NEGATIVE probes against the live
 * least-privilege runtime role (Launch S3a Punkt 2; Launch-Readiness Punkt 3
 * repeats exactly this command against prod).
 *
 *   RUNTIME_DATABASE_URL=… npm run db:verify-runtime-role
 *
 * Asserts, connected AS `chrono_runtime` (never the privileged credential —
 * the script hard-fails if `current_user` is not the runtime role):
 *  - every allowlisted catalogue table is SELECTable,
 *  - the preview_invite_activations upsert works (probed inside
 *    BEGIN…ROLLBACK — zero residue, safe against prod),
 *  - statement_timeout is the role-level value from scripts/runtime-role.ts,
 *  - submissions is unreadable and unwritable,
 *  - catalogue DML (INSERT/UPDATE/DELETE) is denied,
 *  - DDL (CREATE/ALTER/DROP/TRUNCATE) is denied.
 *
 * Every probe that could mutate state on UNEXPECTED success runs inside an
 * explicit transaction that is always rolled back, so a wrongly-granted
 * privilege is reported as FAIL without leaving a trace. Deliberately NOT
 * named `test-*.ts`: scripts/run-tests.ts auto-sweeps that pattern DB-free,
 * and this suite needs a live database by definition.
 */
import postgres from "postgres";
import { sslOptionForUrl } from "./pg-ssl";
import {
  RUNTIME_ROLE,
  RUNTIME_SELECT_TABLES,
  RUNTIME_STATEMENT_TIMEOUT,
} from "./runtime-role";

let passed = 0;
let failed = 0;

function ok(name: string): void {
  passed++;
  console.log(`ok    ${name}`);
}
function fail(name: string, detail?: unknown): void {
  failed++;
  console.error(`FAIL  ${name}`);
  if (detail !== undefined) console.error(`      ${String(detail)}`);
}

function sqlstateOf(err: unknown): string | undefined {
  return typeof err === "object" && err !== null && "code" in err
    ? String((err as { code: unknown }).code)
    : undefined;
}

async function main(): Promise<void> {
  const url = process.env.RUNTIME_DATABASE_URL;
  if (!url) {
    console.error(
      "[verify-runtime-role] RUNTIME_DATABASE_URL is not set. This script must run " +
        "with the runtime credential (created via `npm run db:roles -- --create-login`).",
    );
    process.exit(1);
  }

  // max:1 so BEGIN/ROLLBACK pairs stay on one connection (also required for
  // manual transactions through the transaction pooler).
  const sql = postgres(url, { ssl: sslOptionForUrl(url), prepare: false, max: 1 });

  /** Run one statement inside BEGIN…ROLLBACK; returns the error (if any). */
  async function probe(stmt: string): Promise<unknown> {
    await sql.unsafe("BEGIN");
    try {
      await sql.unsafe(stmt);
      return null;
    } catch (err) {
      return err;
    } finally {
      await sql.unsafe("ROLLBACK").catch(() => {});
    }
  }

  /** Expect insufficient_privilege (42501) from a statement. */
  async function expectDenied(name: string, stmt: string): Promise<void> {
    const err = await probe(stmt);
    if (err === null) {
      fail(name, "statement unexpectedly SUCCEEDED (rolled back — no state was changed)");
    } else if (sqlstateOf(err) === "42501") {
      ok(name);
    } else {
      fail(name, `expected SQLSTATE 42501, got ${sqlstateOf(err) ?? "?"}: ${String(err)}`);
    }
  }

  try {
    // --- identity guard --------------------------------------------------
    const who = await sql`SELECT current_user`;
    const current = String((who[0] as { current_user: string }).current_user);
    if (current !== RUNTIME_ROLE) {
      console.error(
        `[verify-runtime-role] connected as "${current}", expected "${RUNTIME_ROLE}". ` +
          `You probably pointed RUNTIME_DATABASE_URL at the privileged credential — ` +
          `every negative probe below would pass vacuously wrong. Aborting.`,
      );
      process.exit(1);
    }
    ok(`connected as ${RUNTIME_ROLE}`);

    // --- role-level statement_timeout (S3a Punkt 6) -----------------------
    const st = await sql`SHOW statement_timeout`;
    const timeout = String((st[0] as { statement_timeout: string }).statement_timeout);
    if (timeout === RUNTIME_STATEMENT_TIMEOUT) {
      ok(`statement_timeout is ${RUNTIME_STATEMENT_TIMEOUT} (role-level GUC applies)`);
    } else {
      fail(
        `statement_timeout is ${RUNTIME_STATEMENT_TIMEOUT}`,
        `SHOW returned "${timeout}" — role GUC not applied on this connection path`,
      );
    }

    // --- positive: allowlisted catalogue reads ----------------------------
    for (const table of RUNTIME_SELECT_TABLES) {
      try {
        await sql.unsafe(`SELECT * FROM public.${table} LIMIT 1`);
        ok(`SELECT ${table}`);
      } catch (err) {
        fail(`SELECT ${table}`, err);
      }
    }

    // --- positive: preview_invite_activations upsert (rolled back) --------
    {
      const upsert =
        `INSERT INTO public.preview_invite_activations (jti) VALUES ('verify-runtime-role-probe') ` +
        `ON CONFLICT (jti) DO UPDATE SET last_activated_at = now(), ` +
        `count = preview_invite_activations.count + 1`;
      const err = await probe(upsert);
      if (err === null) ok("UPSERT preview_invite_activations (rolled back)");
      else fail("UPSERT preview_invite_activations (rolled back)", err);
    }

    // --- negative: submissions is a black box ------------------------------
    await expectDenied("DENIED: SELECT submissions", "SELECT * FROM public.submissions LIMIT 1");
    await expectDenied(
      "DENIED: INSERT submissions",
      "INSERT INTO public.submissions (entity_type, payload) VALUES ('probe', '{}'::jsonb)",
    );

    // --- negative: catalogue DML ------------------------------------------
    // INSERT…SELECT LIMIT 0 / WHERE false: privileges are checked at executor
    // init, but even a wrongly-granted privilege would touch zero rows — and
    // the surrounding ROLLBACK catches everything else.
    await expectDenied(
      "DENIED: INSERT works",
      "INSERT INTO public.works SELECT * FROM public.works LIMIT 0",
    );
    await expectDenied("DENIED: UPDATE works", "UPDATE public.works SET id = id WHERE false");
    await expectDenied("DENIED: DELETE works", "DELETE FROM public.works WHERE false");
    await expectDenied(
      "DENIED: DELETE preview_invite_activations",
      "DELETE FROM public.preview_invite_activations WHERE false",
    );

    // --- negative: DDL ------------------------------------------------------
    await expectDenied(
      "DENIED: CREATE TABLE",
      "CREATE TABLE public.__runtime_role_probe (id int)",
    );
    await expectDenied(
      "DENIED: ALTER TABLE submissions",
      "ALTER TABLE public.submissions ADD COLUMN __runtime_role_probe int",
    );
    await expectDenied("DENIED: DROP TABLE submissions", "DROP TABLE public.submissions");
    await expectDenied(
      "DENIED: TRUNCATE preview_invite_activations",
      "TRUNCATE public.preview_invite_activations",
    );
  } finally {
    await sql.end({ timeout: 5 }).catch(() => {});
  }

  console.log("");
  if (failed > 0) {
    console.error(`verify-runtime-role: ${failed} FAILED, ${passed} passed`);
    process.exit(1);
  }
  console.log(`verify-runtime-role: all ${passed} probes passed`);
}

main().catch((err) => {
  console.error("[verify-runtime-role] unexpected error:", err);
  process.exit(1);
});
