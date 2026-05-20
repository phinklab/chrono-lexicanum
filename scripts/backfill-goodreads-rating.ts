/**
 * backfill-goodreads-rating.ts — Brief 086 Phase 4 (Cowork-Nachtrag 2026-05-20).
 *
 * Deliberately minimal companion to the 6-stage Hardcover cascade. For every
 * W40K-SSOT book still `book_details.rating IS NULL` after Phase 3, CC runs ONE
 * web search `<title> <author> goodreads rating`, reads the average rating +
 * ratings-count from the snippet, and this script writes them with
 * `rating_source='goodreads'`. No cascade, no DI-helper layer, no retry policy,
 * no override JSON — one search per book, parse, write.
 *
 * Two modes (one file = one small apply script per Brief § Out of scope Phase 4):
 *
 *   --list=<path>    READ-ONLY. Dump the post-Phase-3 `rating IS NULL` target
 *                    list (externalBookId, workId, title, author) to <path>.
 *                    This is the input CC works through with WebSearch.
 *
 *   --apply=<path>   WRITE. Read a resolved-ratings JSON and write rating /
 *                    ratingCount / ratingSource='goodreads' to book_details —
 *                    ONLY for rows still `rating IS NULL` (idempotent, never
 *                    overwrites a Hardcover row). Skips ('skipped[]') are audit
 *                    only and never touch the DB.
 *
 * Scope identical to the Hardcover backfill:
 *   works.source_kind='ssot' AND works.external_book_id LIKE 'W40K-%' AND works.kind='book'
 *
 * `rating_source` is varchar(32), not a constrained enum (src/db/schema.ts) —
 * 'goodreads' fits, no migration needed.
 *
 * CLI:
 *   npm run backfill:goodreads-rating -- --list=outputs/goodreads-null-rating-086-phase4.json
 *   npm run backfill:goodreads-rating -- --apply=scripts/seed-data/goodreads-ratings-086-phase4.json
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { parseArgs } from "node:util";

import { and, asc, eq, inArray, isNull, like } from "drizzle-orm";

import { db } from "@/db/client";
import { bookDetails, persons, workPersons, works } from "@/db/schema";

interface NullRatingTarget {
  externalBookId: string | null;
  workId: string;
  title: string;
  author: string | null;
}

/** Resolved Goodreads rating for one book, produced by CC's WebSearch pass. */
interface ResolvedRating {
  externalBookId: string;
  rating: number; // 0–5 Goodreads average, same scale as Hardcover.
  ratingCount: number | null;
  evidenceUrl?: string;
  note?: string;
}

interface SkippedRating {
  externalBookId: string;
  reason: string;
}

interface ApplyFile {
  generatedAt?: string;
  phase3NullRatingCount?: number;
  resolved: ResolvedRating[];
  skipped: SkippedRating[];
}

async function loadNullRatingTargets(): Promise<NullRatingTarget[]> {
  const rows = await db
    .select({
      externalBookId: works.externalBookId,
      workId: works.id,
      title: works.title,
    })
    .from(works)
    .leftJoin(bookDetails, eq(bookDetails.workId, works.id))
    .where(
      and(
        eq(works.sourceKind, "ssot"),
        like(works.externalBookId, "W40K-%"),
        eq(works.kind, "book"),
        isNull(bookDetails.rating),
      ),
    )
    .orderBy(asc(works.externalBookId));

  const authorMap = await loadPrimaryAuthorMap(rows.map((r) => r.workId));
  return rows.map((r) => ({
    externalBookId: r.externalBookId,
    workId: r.workId,
    title: r.title,
    author: authorMap.get(r.workId) ?? null,
  }));
}

/** Primary (lowest display_order) author per work — mirrors the Hardcover backfill. */
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

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function runList(path: string): Promise<void> {
  const targets = await loadNullRatingTargets();
  writeJson(path, {
    generatedAt: new Date().toISOString(),
    phase3NullRatingCount: targets.length,
    targets,
  });
  console.log(`Wrote ${targets.length} rating-IS-NULL targets → ${path}`);
  const missingAuthor = targets.filter((t) => t.author === null).length;
  if (missingAuthor > 0) {
    console.log(`  (${missingAuthor} have no author row — Goodreads search uses title only.)`);
  }
}

async function runApply(path: string): Promise<void> {
  const file = JSON.parse(readFileSync(path, "utf8")) as ApplyFile;
  if (!Array.isArray(file.resolved) || !Array.isArray(file.skipped)) {
    throw new Error(`Apply file ${path} must have resolved[] and skipped[] arrays.`);
  }

  // Map externalBookId → workId across the W40K-SSOT scope so the apply input
  // can stay human-readable (externalBookId only).
  const scopeRows = await db
    .select({ externalBookId: works.externalBookId, workId: works.id })
    .from(works)
    .where(
      and(
        eq(works.sourceKind, "ssot"),
        like(works.externalBookId, "W40K-%"),
        eq(works.kind, "book"),
      ),
    );
  const workIdByExternal = new Map<string, string>();
  for (const r of scopeRows) {
    if (r.externalBookId !== null) workIdByExternal.set(r.externalBookId, r.workId);
  }

  let written = 0;
  let alreadySet = 0;
  const unknown: string[] = [];

  for (const entry of file.resolved) {
    const workId = workIdByExternal.get(entry.externalBookId);
    if (workId === undefined) {
      unknown.push(entry.externalBookId);
      continue;
    }
    if (!Number.isFinite(entry.rating) || entry.rating < 0 || entry.rating > 5) {
      throw new Error(`${entry.externalBookId}: rating ${entry.rating} out of 0–5 range.`);
    }
    const ratingStr = entry.rating.toFixed(2);

    // Guarded write: only `rating IS NULL` rows. Never overwrites a Hardcover
    // (or any prior) rating; re-runs are idempotent (already-set rows match 0).
    const result = await db
      .update(bookDetails)
      .set({
        rating: ratingStr,
        ratingSource: "goodreads",
        ratingCount: entry.ratingCount ?? null,
      })
      .where(and(eq(bookDetails.workId, workId), isNull(bookDetails.rating)))
      .returning({ workId: bookDetails.workId });

    if (result.length > 0) {
      written += 1;
      console.log(
        `  ✓ ${entry.externalBookId} rating=${ratingStr} count=${entry.ratingCount ?? "—"} (goodreads)`,
      );
    } else {
      alreadySet += 1;
      console.log(`  · ${entry.externalBookId} already had a rating — left untouched (idempotent).`);
    }
  }

  console.log("\n=== Phase 4 apply summary ===");
  console.log(`Resolved entries in file: ${file.resolved.length}`);
  console.log(`Skipped (audit only):     ${file.skipped.length}`);
  console.log(`Newly written (goodreads):${written}`);
  console.log(`Already had rating:       ${alreadySet}`);
  if (unknown.length > 0) {
    console.log(`Unknown externalBookId:   ${unknown.length} → ${unknown.join(", ")}`);
  }
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      list: { type: "string" },
      apply: { type: "string" },
    },
  });

  if (values.list && values.apply) {
    throw new Error("Pass exactly one of --list / --apply, not both.");
  }
  if (values.list) {
    await runList(values.list);
  } else if (values.apply) {
    await runApply(values.apply);
  } else {
    console.log(
      "Usage:\n  --list=<path>   dump rating-IS-NULL targets (read-only)\n  --apply=<path>  write goodreads ratings (rating IS NULL rows only)",
    );
    process.exitCode = 1;
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
