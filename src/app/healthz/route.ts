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
    const message = (err instanceof Error ? err.message : String(err))
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 200);
    return Response.json(
      { ok: false, db: "down", error: message },
      { status: 503, headers: NO_CACHE },
    );
  }
}
