import { sql } from "drizzle-orm";
import { db } from "@/db/client";

export const dynamic = "force-dynamic";

const NO_CACHE = { "Cache-Control": "no-store, max-age=0" } as const;

// Coalesce + throttle the DB probe (Launch S3b). /healthz is public and
// unauthenticated, so every ping used to cost one pooled DB query — a monitor
// burst (or a hostile loop) ate into the max:5 pool that serves real pages.
// Now concurrent requests share ONE in-flight probe, and its result is reused
// for a short window: at most one `select 1` per window per instance. State is
// per serverless instance by nature — which is the right scope, because each
// instance's own pool is what the probe both measures and protects. Failures
// expire faster than successes so monitors see a recovery within seconds.
const OK_TTL_MS = 30_000;
const FAIL_TTL_MS = 5_000;

type Probe = { ok: boolean; probedAt: string };

let last: Probe | null = null;
let lastAtMs = 0;
let inflight: Promise<Probe> | null = null;

async function probeDb(): Promise<Probe> {
  const probedAt = new Date().toISOString();
  try {
    await db.execute(sql`select 1`);
    return { ok: true, probedAt };
  } catch (err) {
    // Raw driver errors can leak pooler host/port/internals —
    // the public endpoint reports a generic failure, the detail
    // goes to the server log for the operator.
    console.error("[healthz] DB connectivity check failed:", err);
    return { ok: false, probedAt };
  }
}

async function getProbe(): Promise<Probe> {
  const ttl = last?.ok ? OK_TTL_MS : FAIL_TTL_MS;
  if (last && Date.now() - lastAtMs < ttl) return last;
  if (!inflight) {
    inflight = probeDb()
      .then((probe) => {
        last = probe;
        lastAtMs = Date.now();
        return probe;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export async function GET() {
  const probe = await getProbe();
  // `ts` is the PROBE time, not the request time — within the throttle window
  // a response legitimately carries a timestamp up to OK_TTL_MS in the past.
  if (probe.ok) {
    return Response.json(
      { ok: true, db: "up", ts: probe.probedAt },
      { status: 200, headers: NO_CACHE },
    );
  }
  return Response.json(
    { ok: false, db: "down", error: "Database connectivity failed", ts: probe.probedAt },
    { status: 503, headers: NO_CACHE },
  );
}
