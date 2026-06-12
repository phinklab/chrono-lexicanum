import { sql } from "drizzle-orm";
import { db } from "@/db/client";

export const dynamic = "force-dynamic";

const NO_CACHE = { "Cache-Control": "no-store, max-age=0" } as const;

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json(
      { ok: true, db: "up", ts: new Date().toISOString() },
      { status: 200, headers: NO_CACHE },
    );
  } catch (err) {
    // Raw driver errors can leak pooler host/port/internals (Report 144
    // § S.6) — the public endpoint reports a generic failure, the detail
    // goes to the server log for the operator.
    console.error("[healthz] DB connectivity check failed:", err);
    return Response.json(
      { ok: false, db: "down", error: "Database connectivity failed" },
      { status: 503, headers: NO_CACHE },
    );
  }
}
