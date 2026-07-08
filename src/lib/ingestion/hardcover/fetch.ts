/**
 * Hardcover.app GraphQL HTTP transport.
 *
 * Hardcover supplies user tags + average rating for books — soft facts that
 * the LLM step maps onto our `tone`/`theme` facets. Tags + rating land as an
 * audit slot in the diff JSON, NOT in FIELD_PRIORITY and NOT in DB columns.
 *
 * Auth: Bearer token via the `Authorization` header. The token comes from
 * `process.env.HARDCOVER_API_TOKEN` and is optional — when unset, the
 * crawler silently disables itself (`isHardcoverEnabled()` returns false).
 *
 * Schema note: the schema shape could not be verified via introspection
 * without a token (api.hardcover.app returns "Unable to verify token" on
 * unauthenticated POST; docs.hardcover.app is Cloudflare-blocked for
 * unauthenticated curl). The query built below is a best-guess Hasura-style
 * query against the `/v1/graphql` endpoint. Should field names turn out to
 * differ, the query is corrected locally in `parse.ts` — the fetch path
 * stays unchanged.
 *
 * Retries + timeout strategy match Open Library (3x backoff, 30s timeout).
 */

const ENDPOINT = "https://api.hardcover.app/v1/graphql";
const UA =
  "ChronoLexicanum/0.1 (https://github.com/phinklab/chrono-lexicanum; p.kuenzler@web.de)";

const POLITENESS_DELAY_MS = 200;
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;

let lastFetchAt = 0;
let warnedMissingTokenOnce = false;
let circuitBreakerTripped = false;
let circuitBreakerReason: string | undefined;

function getToken(): string | undefined {
  const v = process.env.HARDCOVER_API_TOKEN;
  if (!v || v.trim() === "") return undefined;
  return v.trim();
}

/**
 * `true` when `HARDCOVER_API_TOKEN` is set in the env (non-empty) AND the
 * circuit breaker has not tripped. Emits a WARN log once, on the first call,
 * when the token is missing.
 *
 * The circuit breaker guards against flooded 401/403 errors: if the first
 * Hardcover call rejects the auth, the breaker trips and all subsequent
 * calls in this process immediately return `false` — prevents hundreds of
 * identical token-rejection errors in the diff.
 */
export function isHardcoverEnabled(): boolean {
  if (circuitBreakerTripped) return false;
  const t = getToken();
  if (t) return true;
  if (!warnedMissingTokenOnce) {
    warnedMissingTokenOnce = true;
    console.warn(
      "warn: HARDCOVER_API_TOKEN missing — Hardcover crawler disabled for this run. " +
        "Set it in .env.local to enable (token from hardcover.app → Settings → API).",
    );
  }
  return false;
}

/**
 * Mark the Hardcover crawler as disabled for the rest of the run. Used by
 * `hardcoverQuery` when the server returns 401/403 — re-trying is futile.
 */
function tripCircuitBreaker(reason: string): void {
  if (circuitBreakerTripped) return;
  circuitBreakerTripped = true;
  circuitBreakerReason = reason;
  console.warn(
    `warn: Hardcover ${reason} — disabling Hardcover crawler for the rest of this run.`,
  );
}

export function getCircuitBreakerReason(): string | undefined {
  return circuitBreakerReason;
}

async function throttle(): Promise<void> {
  const elapsed = Date.now() - lastFetchAt;
  if (elapsed < POLITENESS_DELAY_MS) {
    await sleep(POLITENESS_DELAY_MS - elapsed);
  }
  lastFetchAt = Date.now();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; path?: string[] }>;
}

/**
 * Run a GraphQL query against the Hardcover endpoint with the env-token.
 * Throws when the token is missing — callers should check `isHardcoverEnabled`
 * first to avoid that path.
 */
export async function hardcoverQuery<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<GraphQLResponse<T>> {
  const token = getToken();
  if (!token) {
    throw new Error(
      "hardcoverQuery: HARDCOVER_API_TOKEN missing — gate calls with isHardcoverEnabled()",
    );
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await throttle();

    let res: Response;
    try {
      res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": UA,
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (e) {
      if (attempt === MAX_RETRIES) throw e;
      await sleep(1000 * 2 ** attempt);
      continue;
    }

    if (res.status >= 200 && res.status < 300) {
      return (await res.json()) as GraphQLResponse<T>;
    }

    if (res.status === 401 || res.status === 403) {
      // Bad token — trip circuit breaker so subsequent books don't retry,
      // then surface as one error per call (caller dedupes via breaker check).
      tripCircuitBreaker(`${res.status} token rejected`);
      throw new Error(
        `Hardcover ${res.status}: token rejected. Check HARDCOVER_API_TOKEN in .env.local.`,
      );
    }

    if (res.status >= 400 && res.status < 500 && res.status !== 429) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `Hardcover ${res.status}: ${body.slice(0, 200)} (no retry on 4xx)`,
      );
    }

    if (attempt === MAX_RETRIES) {
      throw new Error(
        `Hardcover ${res.status} after ${MAX_RETRIES} retries`,
      );
    }
    await sleep(1000 * 2 ** attempt);
  }

  throw new Error("hardcoverQuery: exhausted retries unexpectedly");
}
