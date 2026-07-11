/**
 * apply-db-roles.ts — create/converge the least-privilege runtime role
 * `chrono_runtime` (Launch S3a). The reviewable "documented SQL script":
 * `npm run db:roles -- --print-sql` prints every statement without connecting.
 *
 *   npm run db:roles                          # grants only (idempotent, converges)
 *   npm run db:roles -- --print-sql           # review: print SQL, no connection
 *   npm run db:roles -- --create-login        # + LOGIN with a generated password;
 *                                             #   prints RUNTIME_DATABASE_URL once
 *   npm run db:roles -- --login-password <pw> # + LOGIN with a given password
 *                                             #   (CI rehearsal container only)
 *
 * Connects with the PRIVILEGED credential (DATABASE_URL — the role that owns
 * the tables). Runs against prod only after merge + explicit maintainer Go
 * (scripts/runbooks/db-roles-runbook.md).
 *
 * Design decisions (docs/launch-master-plan.md § Session 3a Punkt 1 + 6):
 *  - Explicit allowlist from scripts/runtime-role.ts; NO default privileges
 *    towards the runtime role — future tables stay invisible until consciously
 *    granted here (fail-closed).
 *  - Convergent, not append-only: every run first REVOKEs ALL from the role on
 *    all existing tables, then re-grants the allowlist. Removing a table from
 *    the contract therefore actually revokes it on the next run.
 *  - `REVOKE CREATE ON SCHEMA public FROM PUBLIC` is belt-and-braces (PG15+
 *    already ships without it). It is the one TOLERATED statement: if the
 *    migration role may not touch the schema ACL (Supabase ownership detail),
 *    we verify PUBLIC actually holds no CREATE and only then continue.
 *  - statement_timeout is a ROLE-level GUC — the only variant that works
 *    through the transaction pooler (see scripts/runtime-role.ts).
 *  - The password never appears in logs or SQL echoes; `--create-login`
 *    generates hex (no URL-encoding pitfalls) and prints the assembled
 *    RUNTIME_DATABASE_URL exactly once.
 */
import { randomBytes } from "node:crypto";
import postgres from "postgres";
import { sslOptionForUrl } from "./pg-ssl";
import {
  RUNTIME_DENIED_TABLES,
  RUNTIME_ROLE,
  RUNTIME_SELECT_TABLES,
  RUNTIME_STATEMENT_TIMEOUT,
  RUNTIME_UPSERT_TABLES,
} from "./runtime-role";

interface Stmt {
  sql: string;
  /** printed instead of the SQL when it must not be echoed (passwords) */
  label?: string;
  /** see header — only the PUBLIC-CREATE revoke sets this */
  tolerated?: boolean;
}

function grantStatements(): Stmt[] {
  const stmts: Stmt[] = [];

  // Role exists (NOLOGIN until a credential is consciously created).
  stmts.push({
    sql:
      `DO $$ BEGIN\n` +
      `  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${RUNTIME_ROLE}') THEN\n` +
      `    CREATE ROLE ${RUNTIME_ROLE} NOLOGIN;\n` +
      `  END IF;\n` +
      `END $$`,
  });

  // Belt-and-braces: PUBLIC must not be able to create objects in `public`.
  stmts.push({ sql: `REVOKE CREATE ON SCHEMA public FROM PUBLIC`, tolerated: true });

  stmts.push({ sql: `GRANT USAGE ON SCHEMA public TO ${RUNTIME_ROLE}` });

  // Reset to a known floor so repeated runs CONVERGE (a table removed from the
  // allowlist is really revoked). Also strips any accidental past grant on
  // denied tables (submissions).
  stmts.push({ sql: `REVOKE ALL ON ALL TABLES IN SCHEMA public FROM ${RUNTIME_ROLE}` });

  stmts.push({
    sql: `GRANT SELECT ON ${RUNTIME_SELECT_TABLES.map((t) => `public.${t}`).join(", ")} TO ${RUNTIME_ROLE}`,
  });

  // INSERT … ON CONFLICT DO UPDATE needs INSERT + UPDATE + SELECT (arbiter and
  // SET-expression columns are read). Deliberately NO DELETE.
  stmts.push({
    sql: `GRANT SELECT, INSERT, UPDATE ON ${RUNTIME_UPSERT_TABLES.map((t) => `public.${t}`).join(", ")} TO ${RUNTIME_ROLE}`,
  });

  // RUNTIME_DENIED_TABLES (submissions): deliberately NO grant — the
  // REVOKE-ALL reset above leaves them without any privilege, every run.

  stmts.push({
    sql: `ALTER ROLE ${RUNTIME_ROLE} SET statement_timeout = '${RUNTIME_STATEMENT_TIMEOUT}'`,
  });

  return stmts;
}

/** After a tolerated-failure of the PUBLIC revoke: does PUBLIC hold CREATE? */
const PUBLIC_CREATE_CHECK = `
  SELECT COALESCE(bool_or(a.privilege_type = 'CREATE'), false) AS has_create
  FROM pg_namespace n, LATERAL aclexplode(n.nspacl) a
  WHERE n.nspname = 'public' AND a.grantee = 0
`;

function parseArgs(argv: string[]): {
  printSql: boolean;
  createLogin: boolean;
  loginPassword: string | null;
} {
  let printSql = false;
  let createLogin = false;
  let loginPassword: string | null = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--print-sql") printSql = true;
    else if (a === "--create-login") createLogin = true;
    else if (a === "--login-password") {
      loginPassword = argv[++i] ?? "";
      if (!loginPassword) {
        console.error("[db-roles] --login-password requires a value");
        process.exit(1);
      }
    } else {
      console.error(`[db-roles] unknown argument: ${a}`);
      process.exit(1);
    }
  }
  if (createLogin && loginPassword !== null) {
    console.error("[db-roles] --create-login and --login-password are mutually exclusive");
    process.exit(1);
  }
  return { printSql, createLogin, loginPassword };
}

/**
 * Derive the runtime connection URL from the privileged one: same host, port
 * and database; username becomes `chrono_runtime` — with the Supavisor tenant
 * suffix carried over (`postgres.<ref>` → `chrono_runtime.<ref>`), because the
 * pooler routes on the suffix.
 */
function runtimeUrlFor(privilegedUrl: string, password: string): string {
  const u = new URL(privilegedUrl);
  const dot = u.username.indexOf(".");
  const suffix = dot === -1 ? "" : u.username.slice(dot); // ".<project-ref>"
  u.username = `${RUNTIME_ROLE}${suffix}`;
  u.password = password;
  return u.toString();
}

async function main(): Promise<void> {
  const { printSql, createLogin, loginPassword } = parseArgs(process.argv.slice(2));
  const stmts = grantStatements();

  if (printSql) {
    console.log("-- runtime-role grants (generated from scripts/runtime-role.ts)");
    console.log(`-- denied (no grants, PII): ${RUNTIME_DENIED_TABLES.join(", ")}`);
    for (const s of stmts) console.log(`${s.sql};\n`);
    if (createLogin || loginPassword !== null) {
      console.log(`ALTER ROLE ${RUNTIME_ROLE} WITH LOGIN PASSWORD '<redacted>';`);
    }
    return;
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("[db-roles] DATABASE_URL is not set (privileged credential required)");
    process.exit(1);
  }

  const sql = postgres(url, { ssl: sslOptionForUrl(url), prepare: false, max: 1 });
  let failed = false;

  try {
    for (const s of stmts) {
      const shown = s.label ?? s.sql.replace(/\s+/g, " ").slice(0, 100);
      try {
        await sql.unsafe(s.sql);
        console.log(`[db-roles] ok        ${shown}`);
      } catch (err) {
        if (s.tolerated) {
          const rows = await sql.unsafe<{ has_create: boolean }[]>(PUBLIC_CREATE_CHECK);
          const hasCreate = Boolean(rows[0]?.has_create);
          if (hasCreate) {
            console.error(
              `[db-roles] FAIL      ${shown} — statement failed AND PUBLIC still holds ` +
                `CREATE on schema public. Revoke it manually as the schema owner.`,
            );
            failed = true;
          } else {
            console.warn(
              `[db-roles] tolerated ${shown} — not permitted here, but PUBLIC holds no ` +
                `CREATE on schema public anyway (PG15+ default). Nothing to revoke.`,
            );
          }
        } else {
          console.error(`[db-roles] FAIL      ${shown}`);
          console.error(err);
          failed = true;
          break;
        }
      }
    }

    if (!failed && (createLogin || loginPassword !== null)) {
      const password = loginPassword ?? randomBytes(24).toString("hex");
      // Single quotes escaped defensively; generated passwords are plain hex.
      const escaped = password.replace(/'/g, "''");
      try {
        await sql.unsafe(`ALTER ROLE ${RUNTIME_ROLE} WITH LOGIN PASSWORD '${escaped}'`);
        console.log(`[db-roles] ok        ALTER ROLE ${RUNTIME_ROLE} WITH LOGIN PASSWORD <redacted>`);
        if (createLogin) {
          console.log("");
          console.log("[db-roles] RUNTIME_DATABASE_URL (printed exactly once — store it now:");
          console.log("[db-roles] .env.local + Vercel env; rotation = re-run --create-login):");
          console.log("");
          console.log(runtimeUrlFor(url, password));
          console.log("");
        }
      } catch (err) {
        console.error(`[db-roles] FAIL      ALTER ROLE ${RUNTIME_ROLE} WITH LOGIN PASSWORD <redacted>`);
        console.error(err);
        failed = true;
      }
    }
  } finally {
    await sql.end({ timeout: 5 }).catch(() => {});
  }

  if (failed) {
    console.error("[db-roles] FAILED — role/grants may be partial. The script is idempotent:");
    console.error("[db-roles] fix the cause and re-run `npm run db:roles` to converge.");
    process.exit(1);
  }
  console.log(
    `[db-roles] done — ${RUNTIME_ROLE}: SELECT on ${RUNTIME_SELECT_TABLES.length} catalogue tables, ` +
      `upsert on ${RUNTIME_UPSERT_TABLES.join(", ")}, denied: ${RUNTIME_DENIED_TABLES.join(", ")}, ` +
      `statement_timeout ${RUNTIME_STATEMENT_TIMEOUT}.`,
  );
}

main().catch((err) => {
  console.error("[db-roles] unexpected error:", err);
  process.exit(1);
});
