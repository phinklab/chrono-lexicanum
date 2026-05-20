/**
 * backfill-hardcover-rating.ts — write `bookDetails.rating` for the
 * W40K-SSOT applied corpus by re-issuing `discoverHardcoverClaimV2`
 * (Brief 075 Track B, closes OQ6; Brief 085 hit-rate hardening;
 * Brief 086 Pass 2 — full re-implementation from origin/main).
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
 *
 * Variant-cascade (Brief 086, binding) — up to 6 stages per book, each
 * escalated only on a *benign* miss of the previous stage. Win-condition per
 * stage: `result.result !== null` AND numeric `audit.averageRating`.
 *
 *   1 cleanup            normalizeForHardcover().primary                 (always)
 *   2 colon-suffix-drop  fallbacks[0]   "<X>: <Y>" -> "<X>"              (primary has colon)
 *   3 colon-prefix-drop  fallbacks[1]   "<X>: <Y>" -> "<Y>"              (primary has colon)
 *   4 original           ungecleaned roster title (originalIfDifferent)  (cleanup changed it)
 *   5 author-normalize   primary title + normalizeAuthor() variant(s)    (0-2 calls)
 *   6 override           hardcoverTitle/hardcoverAuthor from override-JSON (--hardcover-title-overrides)
 *
 *   "Benign miss" = null_result_zero_hits | author_mismatch | hit-without-
 *   numeric-rating. Hard errors (graphql_error, token_missing, ratingsCount-
 *   probe error) get NO stage escalation — graphql_error books are deferred to
 *   the Pass-2 retry; token_missing trips the circuit breaker (abort).
 *
 * Pass-2 retry (Brief 086, flag-independent, always on):
 *   graphql_error books from Pass 1 are queued, the run sleeps, then re-runs
 *   them once with the full cascade. Still-erroring books land in the final
 *   graphql_error bucket.
 *
 * CLI flags (Brief 086, both optional, default unset):
 *   --write-misses=<path>             dump the post-Pass-2 benign-miss list.
 *   --hardcover-title-overrides=<path> load the override map; enables Stage 6.
 *
 * ratingCount probe (Brief 075): the first Hardcover call probes
 *   users_count -> ratings_count; once settled, every later call reuses the
 *   field. If both are rejected, ratingCount stays NULL.
 *
 * Diff-lists (Brief 085):
 *   - List A (force-overwrites): rating value changed by >=0.01 vs priorRating.
 *   - List B (Hit->Miss regressions): priorRating !== null but the FINAL run
 *     (post-Pass-2) produced a miss. Expect 0 — the original-roster fallback
 *     (Stage 4) catches cleanup over-reaches.
 *
 * Idempotent default; `--force` is opt-in. No transaction wrap.
 *
 * CLI:
 *   npm run backfill:hardcover-rating
 *   npm run backfill:hardcover-rating -- --force
 *   npm run backfill:hardcover-rating -- --limit=10
 *   npm run backfill:hardcover-rating -- --force --write-misses=outputs/hardcover-misses-086-phase1.json
 *   npm run backfill:hardcover-rating -- --force --hardcover-title-overrides=scripts/seed-data/hardcover-title-overrides.json
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
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
import { normalizeForHardcover, type NormalizedTitleVariants } from "./hardcover-title-normalize";
import { normalizeAuthor } from "./hardcover-author-normalize";

const POLITENESS_DELAY_MS = 200;
const PASS2_SLEEP_MS = 60_000; // Brief 086 Hebel 3; 075-empirie tendency.
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

type BenignMissBucket = "null_result_zero_hits" | "author_mismatch";

type VariantUsed =
  | "cleanup"
  | "colon-suffix-drop"
  | "colon-prefix-drop"
  | "original"
  | "author-normalize-1"
  | "author-normalize-2"
  | "override";

const VARIANT_KEYS: VariantUsed[] = [
  "cleanup",
  "colon-suffix-drop",
  "colon-prefix-drop",
  "original",
  "author-normalize-1",
  "author-normalize-2",
  "override",
];

interface ParsedCliArgs {
  force: boolean;
  limit: number | null;
  help: boolean;
  writeMisses: string | null;
  overridesPath: string | null;
}

function parseCliArgs(argv: string[]): ParsedCliArgs {
  const { values } = parseArgs({
    args: argv,
    options: {
      force: { type: "boolean", default: false },
      limit: { type: "string" },
      help: { type: "boolean", short: "h", default: false },
      "write-misses": { type: "string" },
      "hardcover-title-overrides": { type: "string" },
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
    writeMisses: (values["write-misses"] as string | undefined) ?? null,
    overridesPath: (values["hardcover-title-overrides"] as string | undefined) ?? null,
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
  npm run backfill:hardcover-rating -- --force --write-misses=outputs/hardcover-misses-086-phase1.json
  npm run backfill:hardcover-rating -- --force --hardcover-title-overrides=scripts/seed-data/hardcover-title-overrides.json

Options:
  --force                            Re-fetch even when book_details.rating is set.
  --limit <N>                        Only process the first N matching books.
  --write-misses <path>              Dump the post-Pass-2 benign-miss list to <path>.
  --hardcover-title-overrides <path> Load override map; enable Stage 6 (override).
  -h, --help                         Show this help.

Behaviour:
  - Reads HARDCOVER_API_TOKEN from .env.local via tsx --env-file=.env.local.
  - 6-stage variant-cascade (cleanup, colon-suffix/prefix, original, author-
    normalize, override) — each stage tried only on a benign miss.
  - Pass-2 retry for transient graphql_error (always on, flag-independent).
  - Variant-distribution, Pass-2-recovery, override-consumption, and diff-lists
    A/B in the final summary.
`);
}

function clampRating(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(9.99, Math.max(0, value));
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

interface WorkTarget {
  workId: string;
  externalBookId: string | null;
  title: string;
  priorRating: string | null;
}

interface OverrideEntry {
  externalBookId: string;
  hardcoverTitle: string;
  hardcoverAuthor: string | null;
}

interface MissEntry {
  externalBookId: string | null;
  rosterTitle: string;
  expectedAuthor: string;
  primary: string;
  missBucket: BenignMissBucket;
  triedVariants: VariantUsed[];
}

interface OverrideConsumption {
  loaded: number;
  matchedHit: number;
  matchedMiss: number;
}

interface Pass2Recovery {
  pass1GraphqlError: number;
  recoveredToHit: number;
  recoveredToBenign: number;
  stillError: number;
}

interface BackfillCounts {
  total: number;
  hits: number;
  ratingCountWrites: number;
  misses: Record<MissBucket, number>;
  variantHits: Record<VariantUsed, number>;
}

interface DiffEntryForceOverwrite {
  externalBookId: string | null;
  title: string;
  priorRating: string;
  newRating: string;
  variantUsed: VariantUsed;
}

interface DiffEntryRegression {
  externalBookId: string | null;
  title: string;
  priorRating: string;
  newBucket: MissBucket;
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
    variantHits: {
      cleanup: 0,
      "colon-suffix-drop": 0,
      "colon-prefix-drop": 0,
      original: 0,
      "author-normalize-1": 0,
      "author-normalize-2": 0,
      override: 0,
    },
  };
}

async function loadTargets(force: boolean, limit: number | null): Promise<WorkTarget[]> {
  const baseWhere = and(
    eq(works.sourceKind, "ssot"),
    like(works.externalBookId, "W40K-%"),
    eq(works.kind, "book"),
  );
  const whereExpr = force ? baseWhere : and(baseWhere, isNull(bookDetails.rating));

  const query = db
    .select({
      workId: works.id,
      externalBookId: works.externalBookId,
      title: works.title,
      priorRating: bookDetails.rating,
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
    .where(and(inArray(workPersons.workId, workIds), eq(workPersons.role, "author")));

  const best = new Map<string, { name: string; order: number }>();
  for (const row of rows) {
    const cur = best.get(row.workId);
    if (cur === undefined || row.displayOrder < cur.order) {
      best.set(row.workId, { name: row.personName, order: row.displayOrder });
    }
  }
  const out = new Map<string, string>();
  for (const [workId, { name }] of best) out.set(workId, name);
  return out;
}

/**
 * Load the Phase-2 override map. Path unset -> empty map (Stage 6 disabled).
 * Path set but unreadable -> hard error (no silent fallback). Malformed
 * entries (missing externalBookId / hardcoverTitle) are skipped with a warn.
 */
function loadOverrides(path: string | null): Map<string, OverrideEntry> {
  const map = new Map<string, OverrideEntry>();
  if (path === null) return map;
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch (e) {
    throw new Error(
      `--hardcover-title-overrides: cannot read "${path}": ${e instanceof Error ? e.message : String(e)}`,
    );
  }
  const parsed = JSON.parse(raw) as {
    overrides?: Array<{
      externalBookId?: string;
      hardcoverTitle?: string;
      hardcoverAuthor?: string | null;
    }>;
  };
  for (const o of parsed.overrides ?? []) {
    if (!o.externalBookId || !o.hardcoverTitle) {
      console.warn(
        `  · override-load: skipping malformed entry ${JSON.stringify(o).slice(0, 120)}`,
      );
      continue;
    }
    map.set(o.externalBookId, {
      externalBookId: o.externalBookId,
      hardcoverTitle: o.hardcoverTitle,
      hardcoverAuthor: o.hardcoverAuthor ?? null,
    });
  }
  return map;
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

type DiscoverResult = Awaited<ReturnType<typeof discoverHardcoverClaimV2>>;

type VariantOutcome =
  | { kind: "hit-win"; rating: number; ratingCount: number | null }
  | { kind: "benign-miss"; bucket: BenignMissBucket }
  | { kind: "hard-miss"; bucket: MissBucket };

function evaluateResult(result: DiscoverResult): VariantOutcome {
  if (result.result !== null) {
    const audit = (result.result.claim.raw as { audit?: Record<string, unknown> } | undefined)?.audit;
    const rawRating = audit?.["averageRating"];
    if (typeof rawRating === "number") {
      const rating = clampRating(rawRating);
      const rawRatingCount = audit?.["ratingCount"];
      const ratingCount =
        typeof rawRatingCount === "number" && Number.isFinite(rawRatingCount)
          ? Math.max(0, Math.trunc(rawRatingCount))
          : null;
      return { kind: "hit-win", rating, ratingCount };
    }
    // Hit but no numeric rating → benign miss.
    return { kind: "benign-miss", bucket: "null_result_zero_hits" };
  }
  if (result.authorMismatch === true) {
    return { kind: "benign-miss", bucket: "author_mismatch" };
  }
  if (result.reason === undefined) {
    return { kind: "benign-miss", bucket: "null_result_zero_hits" };
  }
  return { kind: "hard-miss", bucket: bucketReason(result.reason) };
}

interface ProbeState {
  field: HardcoverRatingsCountField | null;
  settled: boolean;
  index: number;
  attempts: Array<{ field: HardcoverRatingsCountField; reason: string }>;
}

/**
 * Single Hardcover call routed through the ratingsCount-field probe. While the
 * probe is unsettled (first call of the run), an unknown-field error retries
 * with the next candidate; the first non-field-error response settles it.
 */
async function discoverWithProbe(
  title: string,
  author: string,
  probe: ProbeState,
): Promise<DiscoverResult> {
  let result = await discoverHardcoverClaimV2(title, author, {
    ratingsCountField: probe.field,
  });
  while (
    !probe.settled &&
    probe.field !== null &&
    result.result === null &&
    result.reason !== undefined &&
    isUnknownFieldError(result.reason, probe.field)
  ) {
    probe.attempts.push({ field: probe.field, reason: result.reason });
    probe.index += 1;
    if (probe.index < RATINGS_COUNT_CANDIDATES.length) {
      probe.field = RATINGS_COUNT_CANDIDATES[probe.index];
      console.log(
        `  · ratingCount-probe: ${probe.attempts.at(-1)!.field} rejected — retrying with ${probe.field}`,
      );
    } else {
      probe.field = null;
      probe.settled = true;
      console.log("  · ratingCount-probe: all candidates rejected — continuing without ratingCount.");
    }
    result = await discoverHardcoverClaimV2(title, author, {
      ratingsCountField: probe.field,
    });
  }
  if (
    !probe.settled &&
    (result.result !== null ||
      result.reason === undefined ||
      !probe.field ||
      !isUnknownFieldError(result.reason, probe.field))
  ) {
    probe.settled = true;
  }
  return result;
}

type CascadeResult =
  | { kind: "hit"; rating: number; ratingCount: number | null; usedVariant: VariantUsed; tried: VariantUsed[] }
  | { kind: "benign"; bucket: BenignMissBucket; tried: VariantUsed[] }
  | { kind: "hard"; bucket: MissBucket; tried: VariantUsed[] };

/**
 * Run the 6-stage cascade for one book. Stops at the first hit-win; a hard
 * miss aborts the cascade (no further escalation). The reported benign bucket
 * is the first benign stage's bucket (Stage 1 in practice), consistent with
 * Brief 085.
 */
async function runCascade(
  target: WorkTarget,
  author: string,
  variants: NormalizedTitleVariants,
  authorVariants: string[],
  overrides: Map<string, OverrideEntry>,
  probe: ProbeState,
): Promise<CascadeResult> {
  const tried: VariantUsed[] = [];
  let firstBenign: BenignMissBucket | null = null;

  const attempt = async (
    title: string,
    callAuthor: string,
    variant: VariantUsed,
  ): Promise<CascadeResult | null> => {
    const r = await discoverWithProbe(title, callAuthor, probe);
    tried.push(variant);
    const oc = evaluateResult(r);
    if (oc.kind === "hit-win") {
      return {
        kind: "hit",
        rating: oc.rating,
        ratingCount: oc.ratingCount,
        usedVariant: variant,
        tried,
      };
    }
    if (oc.kind === "hard-miss") {
      return { kind: "hard", bucket: oc.bucket, tried };
    }
    if (firstBenign === null) firstBenign = oc.bucket;
    return null;
  };

  // Stage 1 — cleanup (always).
  let res = await attempt(variants.primary, author, "cleanup");
  if (res) return res;

  // Stage 2 — colon-suffix-drop.
  if (variants.fallbacks.length > 0) {
    res = await attempt(variants.fallbacks[0], author, "colon-suffix-drop");
    if (res) return res;
  }
  // Stage 3 — colon-prefix-drop.
  if (variants.fallbacks.length > 1) {
    res = await attempt(variants.fallbacks[1], author, "colon-prefix-drop");
    if (res) return res;
  }
  // Stage 4 — original (ungecleaned roster title).
  if (variants.originalIfDifferent !== null) {
    res = await attempt(variants.originalIfDifferent, author, "original");
    if (res) return res;
  }
  // Stage 5 — author-normalize (0-2 calls, same primary title).
  for (let k = 0; k < authorVariants.length && k < 2; k++) {
    const variant: VariantUsed = k === 0 ? "author-normalize-1" : "author-normalize-2";
    res = await attempt(variants.primary, authorVariants[k], variant);
    if (res) return res;
  }
  // Stage 6 — override (only when the flag loaded an entry for this book).
  if (target.externalBookId !== null && overrides.has(target.externalBookId)) {
    const ov = overrides.get(target.externalBookId)!;
    const ovAuthor = ov.hardcoverAuthor ?? author;
    const r = await discoverWithProbe(ov.hardcoverTitle, ovAuthor, probe);
    tried.push("override");
    const oc = evaluateResult(r);
    const detail =
      oc.kind === "hit-win"
        ? `rating=${oc.rating.toFixed(2)}${oc.ratingCount == null ? "" : ` (count=${oc.ratingCount})`}`
        : `no hit (${oc.bucket})`;
    console.log(
      `  · override (Brief 086 Phase 2): "${ov.hardcoverTitle}" by ${ovAuthor} → ${detail}`,
    );
    if (oc.kind === "hit-win") {
      return {
        kind: "hit",
        rating: oc.rating,
        ratingCount: oc.ratingCount,
        usedVariant: "override",
        tried,
      };
    }
    if (oc.kind === "hard-miss") return { kind: "hard", bucket: oc.bucket, tried };
    if (firstBenign === null) firstBenign = oc.bucket;
  }

  return { kind: "benign", bucket: firstBenign ?? "null_result_zero_hits", tried };
}

function progressLine(
  idx: number,
  total: number,
  target: WorkTarget,
  outcome:
    | { kind: "hit"; rating: number; ratingCount: number | null; variantUsed: VariantUsed }
    | { kind: "miss"; bucket: MissBucket; note?: string }
    | { kind: "skip"; bucket: MissBucket },
): string {
  const head = `[${String(idx).padStart(3)}/${String(total).padStart(3)}] ${
    target.externalBookId ?? "-"
  } "${target.title}"`;
  if (outcome.kind === "hit") {
    const rc = outcome.ratingCount == null ? "" : ` (count=${outcome.ratingCount})`;
    return `${head} → rating=${outcome.rating.toFixed(2)}${rc} via=${outcome.variantUsed}`;
  }
  if (outcome.kind === "skip") {
    return `${head} → SKIP (${outcome.bucket})`;
  }
  return `${head} → MISS (${outcome.bucket})${outcome.note ? ` ${outcome.note}` : ""}`;
}

function ratingDiffers(prior: string | null, next: number): boolean {
  if (prior === null) return false;
  const priorNum = Number.parseFloat(prior);
  if (!Number.isFinite(priorNum)) return false;
  return Math.abs(priorNum - next) >= 0.01;
}

async function writeHit(
  workId: string,
  rating: number,
  ratingCount: number | null,
): Promise<void> {
  const ratingStr = rating.toFixed(2);
  await db
    .insert(bookDetails)
    .values({
      workId,
      rating: ratingStr,
      ratingSource: "hardcover",
      ratingCount: ratingCount ?? null,
    })
    .onConflictDoUpdate({
      target: bookDetails.workId,
      set: {
        rating: ratingStr,
        ratingSource: "hardcover",
        ratingCount: ratingCount ?? sql`${bookDetails.ratingCount}`,
      },
    });
}

interface RunState {
  counts: BackfillCounts;
  forceOverwrites: DiffEntryForceOverwrite[];
  regressions: DiffEntryRegression[];
  benignMisses: MissEntry[];
  consumption: OverrideConsumption;
}

/**
 * Apply a finalized cascade result: DB write + counts + diff-lists +
 * miss-list + override-consumption. Returns nothing — all bookkeeping is on
 * `state`. (Pass-2-deferred graphql_error is handled by the caller, never
 * reaches here as a "hard graphql_error" in Pass 1.)
 */
async function commitResult(
  res: CascadeResult,
  target: WorkTarget,
  author: string,
  primary: string,
  args: ParsedCliArgs,
  state: RunState,
  idx: number,
  total: number,
): Promise<void> {
  const usedOverride = res.tried.includes("override");
  if (res.kind === "hit") {
    await writeHit(target.workId, res.rating, res.ratingCount);
    state.counts.hits += 1;
    state.counts.variantHits[res.usedVariant] += 1;
    if (res.ratingCount !== null) state.counts.ratingCountWrites += 1;
    if (usedOverride) state.consumption.matchedHit += 1;
    if (args.force && ratingDiffers(target.priorRating, res.rating)) {
      state.forceOverwrites.push({
        externalBookId: target.externalBookId,
        title: target.title,
        priorRating: target.priorRating!,
        newRating: res.rating.toFixed(2),
        variantUsed: res.usedVariant,
      });
    }
    console.log(
      progressLine(idx, total, target, {
        kind: "hit",
        rating: res.rating,
        ratingCount: res.ratingCount,
        variantUsed: res.usedVariant,
      }),
    );
    return;
  }

  // Benign or final-hard miss.
  state.counts.misses[res.bucket] += 1;
  if (target.priorRating !== null) {
    state.regressions.push({
      externalBookId: target.externalBookId,
      title: target.title,
      priorRating: target.priorRating,
      newBucket: res.bucket,
    });
  }
  if (res.kind === "benign") {
    if (usedOverride) state.consumption.matchedMiss += 1;
    state.benignMisses.push({
      externalBookId: target.externalBookId,
      rosterTitle: target.title,
      expectedAuthor: author,
      primary,
      missBucket: res.bucket,
      triedVariants: res.tried,
    });
  }
  console.log(progressLine(idx, total, target, { kind: "miss", bucket: res.bucket }));
}

async function main(): Promise<void> {
  const args = parseCliArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const modeLabel =
    `${args.force ? "--force" : "idempotent"}` +
    `${args.limit != null ? ` --limit=${args.limit}` : ""}` +
    `${args.writeMisses ? ` --write-misses=${args.writeMisses}` : ""}` +
    `${args.overridesPath ? ` --hardcover-title-overrides=${args.overridesPath}` : ""}`;
  console.log(`\n=== backfill-hardcover-rating (${modeLabel}) ===`);

  if (!isHardcoverEnabled()) {
    console.error(
      "error: HARDCOVER_API_TOKEN is missing or the circuit-breaker is already tripped. " +
        "Set HARDCOVER_API_TOKEN in .env.local (token from hardcover.app → Settings → API).",
    );
    process.exit(1);
  }

  const overrides = loadOverrides(args.overridesPath);
  if (args.overridesPath !== null) {
    console.log(`Override-table loaded: ${overrides.size} entries from ${args.overridesPath}`);
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
      `(Hardcover politeness ${POLITENESS_DELAY_MS}ms × N, before cascade fan-out).`,
  );

  const state: RunState = {
    counts: newCounts(),
    forceOverwrites: [],
    regressions: [],
    benignMisses: [],
    consumption: { loaded: overrides.size, matchedHit: 0, matchedMiss: 0 },
  };
  state.counts.total = targets.length;
  const probe: ProbeState = {
    field: RATINGS_COUNT_CANDIDATES[0],
    settled: false,
    index: 0,
    attempts: [],
  };

  // Books whose Pass-1 outcome is a transient graphql_error are deferred.
  const pass2Queue: Array<{ target: WorkTarget; author: string }> = [];

  const abortOnCircuitBreaker = (i: number): void => {
    const breaker = getCircuitBreakerReason();
    if (breaker !== undefined) {
      console.error(
        `\nerror: Hardcover circuit-breaker tripped — ${breaker}. ` +
          `Stopped after ${i} books; subsequent calls would be silent skips.`,
      );
      printSummary(state, args, probe, { pass1GraphqlError: pass2Queue.length, recoveredToHit: 0, recoveredToBenign: 0, stillError: 0 });
      process.exit(1);
    }
  };

  // ---- Pass 1 -------------------------------------------------------------
  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    const author = authorMap.get(target.workId);

    if (author === undefined) {
      state.counts.misses.no_author += 1;
      if (target.priorRating !== null) {
        state.regressions.push({
          externalBookId: target.externalBookId,
          title: target.title,
          priorRating: target.priorRating,
          newBucket: "no_author",
        });
      }
      console.log(progressLine(i + 1, targets.length, target, { kind: "skip", bucket: "no_author" }));
      continue;
    }

    let variants: NormalizedTitleVariants;
    try {
      variants = normalizeForHardcover(target.title);
    } catch (e) {
      console.error(
        `  · normalize-failure for "${target.title}": ${e instanceof Error ? e.message : String(e)}`,
      );
      state.counts.misses.null_result_zero_hits += 1;
      if (target.priorRating !== null) {
        state.regressions.push({
          externalBookId: target.externalBookId,
          title: target.title,
          priorRating: target.priorRating,
          newBucket: "null_result_zero_hits",
        });
      }
      state.benignMisses.push({
        externalBookId: target.externalBookId,
        rosterTitle: target.title,
        expectedAuthor: author,
        primary: target.title,
        missBucket: "null_result_zero_hits",
        triedVariants: [],
      });
      console.log(
        progressLine(i + 1, targets.length, target, { kind: "miss", bucket: "null_result_zero_hits" }),
      );
      continue;
    }

    const authorVariants = normalizeAuthor(author);
    const res = await runCascade(target, author, variants, authorVariants, overrides, probe);

    if (res.kind === "hard" && res.bucket === "graphql_error") {
      // Defer transient errors to Pass 2 (no count, no regression yet).
      pass2Queue.push({ target, author });
      console.log(
        progressLine(i + 1, targets.length, target, {
          kind: "miss",
          bucket: "graphql_error",
          note: "(queued for Pass 2)",
        }),
      );
      continue;
    }

    await commitResult(res, target, author, variants.primary, args, state, i + 1, targets.length);
    if (res.kind === "hard") abortOnCircuitBreaker(i + 1);
  }

  // ---- Pass 2 (graphql_error retry) --------------------------------------
  const recovery: Pass2Recovery = {
    pass1GraphqlError: pass2Queue.length,
    recoveredToHit: 0,
    recoveredToBenign: 0,
    stillError: 0,
  };
  if (pass2Queue.length > 0) {
    console.log(
      `\nPass 2: ${pass2Queue.length} graphql_error book(s) — sleeping ${PASS2_SLEEP_MS / 1000}s before retry.`,
    );
    await sleep(PASS2_SLEEP_MS);
    for (let j = 0; j < pass2Queue.length; j++) {
      const { target, author } = pass2Queue[j];
      let variants: NormalizedTitleVariants;
      try {
        variants = normalizeForHardcover(target.title);
      } catch {
        // Pass-1 already normalized successfully, so this is unreachable in
        // practice; defensively bucket as benign.
        state.counts.misses.null_result_zero_hits += 1;
        recovery.recoveredToBenign += 1;
        continue;
      }
      const authorVariants = normalizeAuthor(author);
      const res = await runCascade(target, author, variants, authorVariants, overrides, probe);

      const label = `[P2 ${j + 1}/${pass2Queue.length}]`;
      if (res.kind === "hit") {
        await writeHit(target.workId, res.rating, res.ratingCount);
        state.counts.hits += 1;
        state.counts.variantHits[res.usedVariant] += 1;
        if (res.ratingCount !== null) state.counts.ratingCountWrites += 1;
        if (res.tried.includes("override")) state.consumption.matchedHit += 1;
        if (args.force && ratingDiffers(target.priorRating, res.rating)) {
          state.forceOverwrites.push({
            externalBookId: target.externalBookId,
            title: target.title,
            priorRating: target.priorRating!,
            newRating: res.rating.toFixed(2),
            variantUsed: res.usedVariant,
          });
        }
        recovery.recoveredToHit += 1;
        console.log(
          `${label} ` +
            progressLine(j + 1, pass2Queue.length, target, {
              kind: "hit",
              rating: res.rating,
              ratingCount: res.ratingCount,
              variantUsed: res.usedVariant,
            }),
        );
        continue;
      }

      if (res.kind === "benign") {
        state.counts.misses[res.bucket] += 1;
        if (res.tried.includes("override")) state.consumption.matchedMiss += 1;
        if (target.priorRating !== null) {
          state.regressions.push({
            externalBookId: target.externalBookId,
            title: target.title,
            priorRating: target.priorRating,
            newBucket: res.bucket,
          });
        }
        state.benignMisses.push({
          externalBookId: target.externalBookId,
          rosterTitle: target.title,
          expectedAuthor: author,
          primary: variants.primary,
          missBucket: res.bucket,
          triedVariants: res.tried,
        });
        recovery.recoveredToBenign += 1;
        console.log(`${label} ` + progressLine(j + 1, pass2Queue.length, target, { kind: "miss", bucket: res.bucket }));
        continue;
      }

      // Still a hard miss (final).
      state.counts.misses[res.bucket] += 1;
      if (target.priorRating !== null) {
        state.regressions.push({
          externalBookId: target.externalBookId,
          title: target.title,
          priorRating: target.priorRating,
          newBucket: res.bucket,
        });
      }
      if (res.bucket === "graphql_error") recovery.stillError += 1;
      console.log(`${label} ` + progressLine(j + 1, pass2Queue.length, target, { kind: "miss", bucket: res.bucket }));
      if (res.bucket === "token_missing") abortOnCircuitBreaker(j + 1);
    }
  }

  printSummary(state, args, probe, recovery);

  if (args.writeMisses !== null) {
    const payload = {
      generatedAt: new Date().toISOString(),
      totalTargets: state.counts.total,
      benignMissCount: state.benignMisses.length,
      misses: state.benignMisses,
    };
    mkdirSync(dirname(args.writeMisses), { recursive: true });
    writeFileSync(args.writeMisses, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    console.log(
      `\nMiss-list written: ${args.writeMisses} (${state.benignMisses.length} benign misses)`,
    );
  }
}

function printSummary(
  state: RunState,
  args: ParsedCliArgs,
  probe: ProbeState,
  recovery: Pass2Recovery,
): void {
  const { counts, forceOverwrites, regressions, consumption } = state;
  const totalAttempted = counts.hits + sumMisses(counts.misses);
  const hitRate = totalAttempted === 0 ? 0 : (counts.hits / totalAttempted) * 100;

  console.log("\n=== Summary ===");
  console.log(`Mode:                  ${args.force ? "--force" : "idempotent (rating IS NULL)"}`);
  console.log(`Total target books:    ${counts.total}`);
  console.log(`Hits:                  ${counts.hits}  (${hitRate.toFixed(1)}%)`);
  console.log(`Misses:                ${sumMisses(counts.misses)}`);
  for (const [bucket, n] of Object.entries(counts.misses)) {
    console.log(`  ${bucket.padEnd(24)} ${String(n).padStart(4)}`);
  }

  console.log("\nVariant-distribution (hits only):");
  for (const v of VARIANT_KEYS) {
    const n = counts.variantHits[v];
    const pct = counts.hits === 0 ? 0 : (n / counts.hits) * 100;
    console.log(`  ${v.padEnd(24)} ${String(n).padStart(4)}  (${pct.toFixed(1)}%)`);
  }

  console.log("\nPass-2-recovery (graphql_error bucket):");
  console.log(`  Pass-1 graphql_error count:  ${recovery.pass1GraphqlError}`);
  const recPct =
    recovery.pass1GraphqlError === 0
      ? 0
      : (recovery.recoveredToHit / recovery.pass1GraphqlError) * 100;
  console.log(`  Pass-2 recovered to hit:     ${recovery.recoveredToHit}  (${recPct.toFixed(1)}%)`);
  if (recovery.recoveredToBenign > 0) {
    console.log(`  Pass-2 recovered to benign:  ${recovery.recoveredToBenign}`);
  }
  console.log(`  Pass-2 still graphql_error:  ${recovery.stillError}`);

  console.log("\nOverride-table consumption:");
  if (args.overridesPath === null) {
    console.log("  (flag unset — Stage 6 disabled, 0 overrides loaded)");
  } else {
    const matched = consumption.matchedHit + consumption.matchedMiss;
    const unused = consumption.loaded - matched;
    const hitPct = consumption.loaded === 0 ? 0 : (consumption.matchedHit / consumption.loaded) * 100;
    console.log(`  Overrides loaded (overrides[]):    ${consumption.loaded}`);
    console.log(`  Overrides matched + hit:           ${consumption.matchedHit}  (${hitPct.toFixed(1)}% of loaded → hit)`);
    console.log(`  Overrides matched + miss:          ${consumption.matchedMiss}`);
    if (unused !== 0) {
      console.log(`  Overrides loaded but unused:       ${unused}  (book hit an earlier stage / not in target scope)`);
    }
  }

  console.log(
    `\nratingCount written:   ${counts.ratingCountWrites} / ${counts.hits} hits` +
      (probe.field === null
        ? " (probe failed; field unsupported)"
        : ` (using "${probe.field}")`),
  );
  if (probe.attempts.length > 0) {
    console.log("ratingCount-probe attempts:");
    for (const a of probe.attempts) {
      console.log(`  - ${a.field}: ${a.reason.slice(0, 140)}`);
    }
  }

  if (args.force) {
    console.log(`\nDiff-list A (force overwrites, rating changed by ≥0.01): ${forceOverwrites.length}`);
    for (const e of forceOverwrites) {
      console.log(`  ${e.externalBookId ?? "-"} "${e.title}": ${e.priorRating} → ${e.newRating} (via=${e.variantUsed})`);
    }
  }

  console.log(`\nDiff-list B (Hit→Miss regressions, prior rating now missing): ${regressions.length}`);
  for (const e of regressions) {
    console.log(`  ${e.externalBookId ?? "-"} "${e.title}": prior=${e.priorRating} → MISS (${e.newBucket})`);
  }
  if (regressions.length > 0) {
    console.log("  ⚠ Hit→Miss regression(s) detected — investigate whether a cleanup-rule is too aggressive.");
  }

  if (totalAttempted > 0 && hitRate < 70) {
    console.log("\nnote: hit-rate < 70 % — Endstand-Klassifikation + OQ-Behandlung in den Closing-Report (Brief 086 § Zielerreichung).");
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
