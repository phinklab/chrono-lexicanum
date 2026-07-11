/**
 * release-revalidate.ts — the explicit, fail-loud POST-DEPLOY revalidation
 * step of a content release (Launch S3a Punkt 5 / B1; E4: the snapshot PR is
 * the deploy, and this command runs exactly once AFTER that deploy is live).
 *
 *   npm run release:revalidate
 *
 * Deliberately NOT wired into `db:sync` or any apply script: a POST right
 * after the sync would revalidate a deploy that does not exist yet. The
 * content-release runbook (scripts/runbooks/content-release-runbook.md,
 * Stufe 6) is the only caller; on a sync/snapshot/deploy failure no
 * revalidation happens at all.
 *
 * Contract:
 *  - exactly ONE POST to `${REVALIDATE_BASE_URL}/api/revalidate` — no body
 *    (the route then invalidates every catalogue tag + the entity path purge),
 *    no retries, ever. The endpoint is idempotent, so after diagnosing a
 *    failure a human repeats the one POST.
 *  - REVALIDATE_BASE_URL and REVALIDATE_TOKEN come from the script env
 *    (.env.local via the npm script). No default target: an unset base URL is
 *    a hard error, never a silent POST at some assumed production host.
 *  - fail-loud: exit 0 only on HTTP 200; every other outcome exits 1 with a
 *    concrete recovery hint. A timeout is called out as AMBIGUOUS (the POST
 *    may have been processed) — repeating it after clarification is safe.
 *
 * REVALIDATE_TIMEOUT_MS (default 30000) exists for the DB-free test suite
 * (scripts/test-release-revalidate.ts); production use never needs it.
 */

// No imports — the empty export keeps this file module-scoped (top-level
// `main` would otherwise collide with other global-scope scripts under tsc).
export {};

const DEFAULT_TIMEOUT_MS = 30_000;

function recoveryHint(status: number): string {
  switch (status) {
    case 503:
      return "503 — REVALIDATE_TOKEN is not configured on the deployment (Vercel env). Set it, redeploy if newly added, then repeat the one POST.";
    case 401:
      return "401 — token mismatch between .env.local and the deployment. Align REVALIDATE_TOKEN, then repeat the one POST.";
    case 404:
      return "404 — no /api/revalidate at the target. REVALIDATE_BASE_URL probably points at the wrong host or includes a path.";
    default:
      return `${status} — unexpected. Check the deployment logs; the deploy itself stays valid (ISR heals within TTL). Repeat the one POST after the cause is fixed.`;
  }
}

async function main(): Promise<void> {
  const rawBase = process.env.REVALIDATE_BASE_URL;
  const token = process.env.REVALIDATE_TOKEN;

  if (!rawBase) {
    console.error(
      "[release-revalidate] REVALIDATE_BASE_URL is not set. Set it in .env.local " +
        "(scheme + host, no trailing slash — e.g. https://www.chrono-lexicanum.com). " +
        "There is deliberately no default target.",
    );
    process.exit(1);
  }
  if (!token) {
    console.error("[release-revalidate] REVALIDATE_TOKEN is not set (see .env.example).");
    process.exit(1);
  }

  let base: URL;
  try {
    base = new URL(rawBase);
  } catch {
    console.error(`[release-revalidate] REVALIDATE_BASE_URL is not a valid URL: "${rawBase}"`);
    process.exit(1);
  }
  if (base.protocol !== "https:" && base.protocol !== "http:") {
    console.error(`[release-revalidate] REVALIDATE_BASE_URL must be http(s), got "${base.protocol}"`);
    process.exit(1);
  }

  const endpoint = `${base.origin}${base.pathname.replace(/\/+$/, "")}/api/revalidate`;
  const timeoutMs = Number(process.env.REVALIDATE_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

  console.log(`[release-revalidate] POST ${endpoint} (timeout ${timeoutMs}ms, exactly one attempt)`);

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const isTimeout =
      typeof err === "object" && err !== null && "name" in err &&
      ((err as { name: string }).name === "TimeoutError" || (err as { name: string }).name === "AbortError");
    if (isTimeout) {
      console.error(
        `[release-revalidate] TIMEOUT after ${timeoutMs}ms — AMBIGUOUS: the POST may or may ` +
          "not have been processed. The endpoint is idempotent; check the deployment, then " +
          "repeat the one POST. The deploy stays valid either way (ISR heals within TTL).",
      );
    } else {
      console.error(
        "[release-revalidate] network error — the target was not reached (no revalidation " +
          "happened). Check REVALIDATE_BASE_URL / connectivity, then repeat the one POST.",
      );
      console.error(`      ${String(err)}`);
    }
    process.exit(1);
  }

  const bodyText = await res.text().catch(() => "");
  if (res.status !== 200) {
    console.error(`[release-revalidate] FAILED — HTTP ${res.status}. ${recoveryHint(res.status)}`);
    if (bodyText) console.error(`      response: ${bodyText.slice(0, 500)}`);
    process.exit(1);
  }

  try {
    const body = JSON.parse(bodyText) as { revalidated?: string[]; paths?: string[] };
    console.log(
      `[release-revalidate] OK — revalidated tags: ${body.revalidated?.join(", ") ?? "?"}; ` +
        `purged paths: ${body.paths?.join(", ") ?? "?"}`,
    );
  } catch {
    // 200 without the expected JSON shape — still a success by contract, but say so.
    console.log(`[release-revalidate] OK — HTTP 200 (unparsed body: ${bodyText.slice(0, 200)})`);
  }
}

main().catch((err) => {
  console.error("[release-revalidate] unexpected error:", err);
  process.exit(1);
});
