/**
 * backfill-hardcover-rating.ts — write `bookDetails.rating` for the
 * W40K-SSOT applied corpus by re-issuing `discoverHardcoverClaimV2`
 * (Brief 075 Track B, closes OQ6).
 *
 * Scope (Brief Erratum #2, binding):
 *   works.source_kind='ssot' AND works.external_book_id LIKE 'W40K-%' AND works.kind='book'
 *   Default mode adds `book_details.rating IS NULL` so the script is
 *   idempotent. `--force` drops the NULL guard but keeps the SSOT/W40K
 *   filter — never broader.
 *
 * Author-handling (Brief Erratum #3, binding):
 *   Author-Missing books (no work_persons row with role='author') are
 *   bucketed as `no_author` and NOT sent to discoverHardcoverClaimV2.
 *   Calling Hardcover without an `expectedAuthor` falls back to `hits[0]`
 *   (src/lib/ingestion/v2/sources/hardcover.ts:93-96) — a false-positive
 *   risk this script avoids by design.
 *
 * Multi-author books: the lowest `displayOrder` author is used as
 *   `expectedAuthor`. `authorMatches()` does a substring match on the
 *   Hardcover contributor list, so any co-author whose name appears in
 *   the Hardcover record will produce a hit.
 *
 * ratingCount probe (Brief 075 design freedom):
 *   First book is sent with `ratingsCountField: 'users_count'`. If the
 *   GraphQL schema rejects that field, the script falls back to
 *   `'ratings_count'`. If both fail, `bookDetails.ratingCount` stays NULL
 *   and the rest of the run runs without the extra field. The Report
 *   documents which path the probe took.
 *
 * Idempotent default; `--force` is opt-in for refresh runs. No
 * transaction wrap — per-book UPDATE on book_details is a single-row
 * atomic write.
 *
 * CLI:
 *   npm run backfill:hardcover-rating
 *   npm run backfill:hardcover-rating -- --force
 *   npm run backfill:hardcover-rating -- --limit=10
 */
import { parseArgs } from "node:util";

import { and, asc, eq, inArray, isNull, like, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { bookDetails, persons, workPersons, works } from "@/db/schema";
import {
  discoverHardcoverClaimV2,
  type HardcoverRatingsCountField,
} from "@/lib/ingestion/v2/sources/hardcover";
import {
  getCircuitBreakerReason,
  isHardcoverEnabled,
} from "@/lib/ingestion/hardcover/fetch";

const POLITENESS_DELAY_MS = 200;
const RATINGS_COUNT_CANDIDATES: HardcoverRatingsCountField[] = [
  "users_count",
  "ratings_count",
];

type MissBucket =
  | "no_author"
  | "null_result_zero_hits"
  | "null_result_after_filter"
  | "author_mismatch"
  | "graphql_error"
  | "token_missing";

interface ParsedCliArgs {
  force: boolean;
  limit: number | null;
  help: boolean;
}

function parseCliArgs(argv: string[]): ParsedCliArgs {
  const { values } = parseArgs({
    args: argv,
    options: {
      force: { type: "boolean", default: false },
      limit: { type: "string" },
      help: { type: "boolean", short: "h", default: false },
    },
    strict: true,
    allowPositionals: false,
  });
  const rawLimit = values.limit;
  let limit: number | null = null;
  if (rawLimit !== undefined) {
    const n = Number(rawLimit);
    if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
      throw new Error(`--limit must be a positive integer (got ${String(rawLimit)})`);
    }
    limit = n;
  }
  return {
    force: Boolean(values.force),
    limit,
    help: Boolean(values.help),
  };
}

function printHelp(): void {
  console.log(`
backfill-hardcover-rating.ts — populate book_details.rating from Hardcover
for the applied W40K-SSOT corpus.

Usage:
  npm run backfill:hardcover-rating
  npm run backfill:hardcover-rating -- --force
  npm run backfill:hardcover-rating -- --limit=10

Options:
  --force          Re-fetch even when book_details.rating is already set.
                   Stays within the W40K-SSOT scope (sourceKind='ssot' AND
                   externalBookId LIKE 'W40K-%' AND kind='book').
  --limit <N>      Only process the first N matching books (smoke runs).
  -h, --help       Show this help.

Behaviour:
  - Reads HARDCOVER_API_TOKEN from .env.local via tsx --env-file=.env.local.
  - Per-book single-row UPDATE on book_details; no transaction wrap.
  - Author-missing books (no role='author' row) are bucketed as no_author
    and skipped — no Hardcover call (Brief 075 Erratum #3).
  - First hit probes Hardcover for users_count / ratings_count; both fields
    are tried before giving up. If neither exists, ratingCount stays NULL.
  - Final summary prints per-bucket miss counts and the overall hit-rate.
    Hit-rate < 70 % surfaces the OL-fallback Carry-over recommendation.
`);
}

function clampRating(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(9.99, Math.max(0, value));
}

interface WorkTarget {
  workId: string;
  externalBookId: string | null;
  title: string;
}

interface BackfillCounts {
  total: number;
  hits: number;
  ratingCountWrites: number;
  misses: Record<MissBucket, number>;
}

function newCounts(): BackfillCounts {
  return {
    total: 0,
    hits: 0,
    ratingCountWrites: 0,
    misses: {
      no_author: 0,
      null_result_zero_hits: 0,
      null_result_after_filter: 0,
      author_mismatch: 0,
      graphql_error: 0,
      token_missing: 0,
    },
  };
}

async function loadTargets(force: boolean, limit: number | null): Promise<WorkTarget[]> {
  const baseWhere = and(
    eq(works.sourceKind, "ssot"),
    like(works.externalBookId, "W40K-%"),
    eq(works.kind, "book"),
  );
  const whereExpr = force
    ? baseWhere
    : and(baseWhere, isNull(bookDetails.rating));

  const query = db
    .select({
      workId: works.id,
      externalBookId: works.externalBookId,
      title: works.title,
    })
    .from(works)
    .leftJoin(bookDetails, eq(bookDetails.workId, works.id))
    .where(whereExpr)
    .orderBy(asc(works.externalBookId));

  const rows = limit != null ? await query.limit(limit) : await query;
  return rows;
}

async function loadPrimaryAuthorMap(workIds: string[]): Promise<Map<string, string>> {
  if (workIds.length === 0) return new Map();
  const rows = await db
    .select({
      workId: workPersons.workId,
      personName: persons.name,
      displayOrder: workPersons.displayOrder,
    })
    .from(workPersons)
    .innerJoin(persons, eq(persons.id, workPersons.personId))
    .where(
      and(inArray(workPersons.workId, workIds), eq(workPersons.role, "author")),
    );

  const best = new Map<string, { name: string; order: number }>();
  for (const row of rows) {
    const cur = best.get(row.workId);
    if (cur === undefined || row.displayOrder < cur.order) {
      best.set(row.workId, { name: row.personName, order: row.displayOrder });
    }
  }
  const out = new Map<string, string>();
  for (const [workId, { name }] of best) {
    out.set(workId, name);
  }
  return out;
}

function isUnknownFieldError(message: string, field: HardcoverRatingsCountField): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes(field) &&
    (lower.includes("not defined") ||
      lower.includes("not found") ||
      lower.includes("unknown") ||
      lower.includes("unsupported") ||
      lower.includes("does not exist") ||
      lower.includes("cannot query field"))
  );
}

function bucketReason(reason: string | undefined): MissBucket {
  if (!reason) return "null_result_zero_hits";
  const lower = reason.toLowerCase();
  if (lower.includes("hardcover_api_token") || lower.includes("token")) {
    return "token_missing";
  }
  return "graphql_error";
}

function progressLine(
  idx: number,
  total: number,
  target: WorkTarget,
  outcome:
    | { kind: "hit"; rating: number; ratingCount: number | null }
    | { kind: "miss"; bucket: MissBucket }
    | { kind: "skip"; bucket: MissBucket },
): string {
  const head = `[${String(idx).padStart(3)}/${String(total).padStart(3)}] ${
    target.externalBookId ?? "-"
  } "${target.title}"`;
  if (outcome.kind === "hit") {
    const rc =
      outcome.ratingCount == null ? "" : ` (count=${outcome.ratingCount})`;
    return `${head} → rating=${outcome.rating.toFixed(2)}${rc}`;
  }
  if (outcome.kind === "skip") {
    return `${head} → SKIP (${outcome.bucket})`;
  }
  return `${head} → MISS (${outcome.bucket})`;
}

async function main(): Promise<void> {
  const args = parseCliArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  console.log(
    `\n=== backfill-hardcover-rating ${args.force ? "(--force)" : "(idempotent)"}${
      args.limit != null ? ` --limit=${args.limit}` : ""
    } ===`,
  );

  if (!isHardcoverEnabled()) {
    console.error(
      "error: HARDCOVER_API_TOKEN is missing or the circuit-breaker is already tripped. " +
        "Set HARDCOVER_API_TOKEN in .env.local (token from hardcover.app → Settings → API).",
    );
    process.exit(1);
  }

  const targets = await loadTargets(args.force, args.limit);
  if (targets.length === 0) {
    console.log("No matching books. Nothing to do.");
    return;
  }

  const authorMap = await loadPrimaryAuthorMap(targets.map((t) => t.workId));
  const minSeconds = Math.ceil((targets.length * POLITENESS_DELAY_MS) / 1000);
  console.log(
    `${targets.length} target works; estimated minimum runtime ~${minSeconds}s ` +
      `(Hardcover politeness ${POLITENESS_DELAY_MS}ms × N).`,
  );

  const counts = newCounts();
  counts.total = targets.length;
  let ratingsCountIndex = 0;
  let ratingsCountField: HardcoverRatingsCountField | null =
    RATINGS_COUNT_CANDIDATES[0];
  let ratingsCountProbeSettled = false;
  const ratingsCountAttempts: Array<{ field: HardcoverRatingsCountField; reason: string }> = [];

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    const author = authorMap.get(target.workId);

    if (author === undefined) {
      counts.misses.no_author += 1;
      console.log(progressLine(i + 1, targets.length, target, { kind: "skip", bucket: "no_author" }));
      continue;
    }

    let result = await discoverHardcoverClaimV2(target.title, author, {
      ratingsCountField,
    });

    // ratingsCount-field probe: if the chosen field is rejected by the
    // Hardcover schema, try the next candidate. After both candidates fail,
    // we stop sending the field and continue without ratingCount.
    while (
      !ratingsCountProbeSettled &&
      ratingsCountField !== null &&
      result.result === null &&
      result.reason !== undefined &&
      isUnknownFieldError(result.reason, ratingsCountField)
    ) {
      ratingsCountAttempts.push({ field: ratingsCountField, reason: result.reason });
      ratingsCountIndex += 1;
      if (ratingsCountIndex < RATINGS_COUNT_CANDIDATES.length) {
        ratingsCountField = RATINGS_COUNT_CANDIDATES[ratingsCountIndex];
        console.log(
          `  · ratingCount-probe: ${ratingsCountAttempts.at(-1)!.field} rejected — retrying with ${ratingsCountField}`,
        );
      } else {
        ratingsCountField = null;
        ratingsCountProbeSettled = true;
        console.log(
          "  · ratingCount-probe: all candidates rejected — continuing without ratingCount.",
        );
      }
      result = await discoverHardcoverClaimV2(target.title, author, {
        ratingsCountField,
      });
    }
    // First non-error response settles the probe.
    if (!ratingsCountProbeSettled && (result.result !== null || result.reason === undefined || !ratingsCountField || !isUnknownFieldError(result.reason, ratingsCountField))) {
      ratingsCountProbeSettled = true;
    }

    if (result.result === null) {
      let bucket: MissBucket;
      if (result.authorMismatch === true) {
        bucket = "author_mismatch";
      } else if (result.reason === undefined) {
        bucket = "null_result_zero_hits";
      } else {
        bucket = bucketReason(result.reason);
        // graphql_error vs null_result_after_filter: a token/auth error trips
        // the circuit breaker — abort loudly so we don't silently skip the rest.
        const breaker = getCircuitBreakerReason();
        if (breaker !== undefined) {
          console.error(
            `\nerror: Hardcover circuit-breaker tripped — ${breaker}. ` +
              `Stopped after ${i + 1} books; subsequent calls would be silent skips.`,
          );
          counts.misses[bucket] += 1;
          printSummary(counts, args, ratingsCountField, ratingsCountAttempts);
          process.exit(1);
        }
      }
      counts.misses[bucket] += 1;
      console.log(progressLine(i + 1, targets.length, target, { kind: "miss", bucket }));
      continue;
    }

    const audit = (result.result.claim.raw as { audit?: Record<string, unknown> } | undefined)?.audit;
    const rawRating = audit?.["averageRating"];
    if (typeof rawRating !== "number") {
      // Hardcover hit without a rating value: bucket as null_result_zero_hits
      // (the rating slot is what we actually backfill).
      counts.misses.null_result_zero_hits += 1;
      console.log(progressLine(i + 1, targets.length, target, { kind: "miss", bucket: "null_result_zero_hits" }));
      continue;
    }
    const rating = clampRating(rawRating);
    const rawRatingCount = audit?.["ratingCount"];
    const ratingCountValue =
      typeof rawRatingCount === "number" && Number.isFinite(rawRatingCount)
        ? Math.max(0, Math.trunc(rawRatingCount))
        : null;

    const setPayload: {
      rating: string;
      ratingSource: string;
      ratingCount?: number;
    } = {
      rating: rating.toFixed(2),
      ratingSource: "hardcover",
    };
    if (ratingCountValue !== null) setPayload.ratingCount = ratingCountValue;

    await db
      .insert(bookDetails)
      .values({
        workId: target.workId,
        rating: setPayload.rating,
        ratingSource: setPayload.ratingSource,
        ratingCount: setPayload.ratingCount ?? null,
      })
      .onConflictDoUpdate({
        target: bookDetails.workId,
        set: {
          rating: setPayload.rating,
          ratingSource: setPayload.ratingSource,
          ratingCount: setPayload.ratingCount ?? sql`${bookDetails.ratingCount}`,
        },
      });

    counts.hits += 1;
    if (ratingCountValue !== null) counts.ratingCountWrites += 1;
    console.log(
      progressLine(i + 1, targets.length, target, {
        kind: "hit",
        rating,
        ratingCount: ratingCountValue,
      }),
    );
  }

  printSummary(counts, args, ratingsCountField, ratingsCountAttempts);
}

function printSummary(
  counts: BackfillCounts,
  args: ParsedCliArgs,
  finalRatingsCountField: HardcoverRatingsCountField | null,
  ratingsCountAttempts: Array<{ field: HardcoverRatingsCountField; reason: string }>,
): void {
  const totalAttempted = counts.hits + sumMisses(counts.misses);
  const hitRate =
    totalAttempted === 0 ? 0 : (counts.hits / totalAttempted) * 100;

  console.log("\n=== Summary ===");
  console.log(`Mode:                  ${args.force ? "--force" : "idempotent (rating IS NULL)"}`);
  console.log(`Total target books:    ${counts.total}`);
  console.log(`Hits:                  ${counts.hits}  (${hitRate.toFixed(1)}%)`);
  console.log(`Misses:                ${sumMisses(counts.misses)}`);
  for (const [bucket, n] of Object.entries(counts.misses)) {
    console.log(`  ${bucket.padEnd(28)} ${String(n).padStart(4)}`);
  }
  console.log(
    `ratingCount written:   ${counts.ratingCountWrites} / ${counts.hits} hits` +
      (finalRatingsCountField === null
        ? " (probe failed; field unsupported)"
        : ` (using "${finalRatingsCountField}")`),
  );
  if (ratingsCountAttempts.length > 0) {
    console.log("ratingCount-probe attempts:");
    for (const a of ratingsCountAttempts) {
      console.log(`  - ${a.field}: ${a.reason.slice(0, 140)}`);
    }
  }

  if (totalAttempted > 0 && hitRate < 70) {
    console.log(
      "\nnote: hit-rate < 70 % — recommend opening an OQ for Hardcover-OL-Fallback in the impl report.",
    );
  }
}

function sumMisses(misses: BackfillCounts["misses"]): number {
  let s = 0;
  for (const n of Object.values(misses)) s += n;
  return s;
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
