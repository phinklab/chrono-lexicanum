/**
 * Hardcover.app GraphQL HTTP transport.
 *
 * Hardcover liefert User-Tags + Average-Rating für Bücher — Soft-Facts die
 * in 3c LLM auf unsere `tone`/`theme`-Facets abgebildet werden. In 3b
 * landen Tags + Rating als Audit-Slot in der Diff-JSON, NICHT in
 * FIELD_PRIORITY und NICHT in DB-Spalten.
 *
 * Auth: Bearer-Token via `Authorization`-Header. Token kommt aus
 * `process.env.HARDCOVER_API_TOKEN` und ist optional — wenn nicht gesetzt,
 * deaktiviert sich der Crawler still (`isHardcoverEnabled()` returnt false).
 *
 * **Schema-Hinweis (CC, 2026-05-03):** Die Schema-Form konnte ohne Token
 * nicht via Introspection verifiziert werden (api.hardcover.app gibt
 * "Unable to verify token" auf POST ohne Auth zurück, docs.hardcover.app
 * ist Cloudflare-blockiert für unauthenticated curl). Die unten gebaute
 * Query ist eine **Best-Guess Hasura-style Query** auf Basis des
 * `/v1/graphql`-Endpoints — typisches Hasura-Schema-Muster. Wenn sich beim
 * ersten Lauf mit echtem Token herausstellt dass Field-Names abweichen,
 * korrigiert sich die Query in `parse.ts` lokal — der Fetch-Pfad bleibt
 * unverändert. Siehe Report 037 § "For next session".
 *
 * Retries + Timeout-Strategie wie Open Library (3× Backoff, 30s Timeout).
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
 * `true` wenn `HARDCOVER_API_TOKEN` im env gesetzt ist (non-empty) UND der
 * Circuit-Breaker noch nicht ausgelöst hat. Wird einmal beim ersten Aufruf
 * einen WARN-Log emittieren wenn der Token fehlt.
 *
 * Phase 3b: Circuit-Breaker schützt vor floodierten 401/403-Errors. Wenn der
 * erste Hardcover-Call die Auth ablehnt, schlägt der Breaker zu und alle
 * folgenden Aufrufe in diesem Prozess returnen sofort `false` — verhindert
 * 800 identische Token-Rejection-Errors im Diff.
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
