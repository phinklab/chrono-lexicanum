/**
 * book-corpus-preflight.ts — Brief 171 Teil B. The per-book corpus preflight.
 *
 * Replaces `db-apply-scope.ts`'s non-recursive `manual-overrides-ssot-*` filter
 * and its batch-contiguity claim (both meaningless now that the corpus lives ONLY
 * in `scripts/seed-data/books/*.json`). Run BEFORE any write (the db:sync /
 * db:rebuild step-1 preflight, and the db:drift corpus health check) so a broken
 * per-book corpus HALTS LOUDLY before the live DB is touched.
 *
 * It asserts, DB-free (mode `post-retirement` — folder-only, the frozen Legacy
 * roster is out of scope):
 *   1. every `books/*.json` parses + satisfies the `book-v1` schema;
 *   2. slug + externalBookId are unique within the folder;
 *   3. every `externalBookId` is a valid prefix+4-digit id (W40K-####/HH-####);
 *   4. every `collects[]` member resolves to a book in the folder;
 *   5. the reference/facet seed-prolog inputs are present + parseable, so
 *      `apply:book`'s in-process prolog cannot fail for a missing catalog.
 *
 * It does NOT claim batch contiguity (there are no batches) and it never connects
 * to the DB. A stray, a dup, a bad id, an unresolvable collects member, or a
 * missing seed catalog is a non-zero `[book-preflight] HALT:` exit.
 *
 * CLI:
 *   npx tsx scripts/book-corpus-preflight.ts          # human report + verdict
 *   npx tsx scripts/book-corpus-preflight.ts --json    # machine-readable summary
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

import {
  BOOKS_DIR,
  effectiveMaxSuffix,
  findCorpusCollisions,
  findUnresolvableCollectMembers,
  loadBookFiles,
} from "./book-file";

const SEED_DIR = resolve(process.cwd(), "scripts", "seed-data");

/** Seed catalogs the apply-time reference/facet prolog (`seed-prolog.ts`) reads. */
const PROLOG_CATALOGS = [
  "factions.json",
  "sectors.json",
  "locations.json",
  "characters.json",
  "faction-aliases.json",
  "location-aliases.json",
  "character-aliases.json",
  "facet-catalog.json",
];

class PreflightHalt extends Error {}

interface PreflightSummary {
  files: number;
  withCollects: number;
  maxW40K: number;
  maxHH: number;
}

function run(): PreflightSummary {
  // 1. parse + schema.
  const { books: folder, issues } = loadBookFiles(BOOKS_DIR);
  if (issues.length > 0) {
    throw new PreflightHalt(
      `${issues.length} per-book file validation issue(s):\n` +
        issues.map((i) => `    - ${i.filename}: ${i.message}`).join("\n"),
    );
  }

  // 2. + 3. folder-only uniqueness (post-retirement). validateBookFile already
  //    enforced the id shape (#3); the collision check covers slug/id dups (#2).
  const collisions = findCorpusCollisions(folder, [], "post-retirement");
  if (collisions.length > 0) {
    throw new PreflightHalt(
      `${collisions.length} intra-folder collision(s):\n` +
        collisions.map((c) => `    - ${c}`).join("\n"),
    );
  }

  // 4. collects[] resolvable within the folder.
  const knownIds = new Set(folder.map((f) => f.book.externalBookId));
  const unresolvable = findUnresolvableCollectMembers(folder, knownIds);
  if (unresolvable.length > 0) {
    throw new PreflightHalt(
      `${unresolvable.length} unresolvable collects member(s):\n` +
        unresolvable.map((c) => `    - ${c}`).join("\n"),
    );
  }

  // 5. prolog catalog inputs present + parseable.
  const missing: string[] = [];
  for (const file of PROLOG_CATALOGS) {
    try {
      JSON.parse(readFileSync(resolve(SEED_DIR, file), "utf8"));
    } catch (err) {
      missing.push(`${file} (${(err as Error).message})`);
    }
  }
  if (missing.length > 0) {
    throw new PreflightHalt(
      `${missing.length} reference/facet seed catalog(s) missing or unparseable:\n` +
        missing.map((m) => `    - ${m}`).join("\n"),
    );
  }

  const max = effectiveMaxSuffix([], folder, "post-retirement");
  return {
    files: folder.length,
    withCollects: folder.filter((f) => f.book.collections.collects.length > 0).length,
    maxW40K: max.get("W40K") ?? 0,
    maxHH: max.get("HH") ?? 0,
  };
}

function main(): void {
  const { values } = parseArgs({ options: { json: { type: "boolean", default: false } } });
  const summary = run();
  if (values.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log("[book-preflight] per-book corpus — DB-free preflight (mode=post-retirement)");
    console.log(`  files: ${summary.files} (${summary.withCollects} carry collects[])`);
    console.log(`  max id: W40K-${String(summary.maxW40K).padStart(4, "0")}, HH-${String(summary.maxHH).padStart(4, "0")}`);
    console.log("[book-preflight] OK — corpus is parse-clean, unique, collects-resolvable, prolog inputs present.");
  }
}

try {
  main();
  process.exit(0);
} catch (err) {
  if (err instanceof PreflightHalt) {
    console.error(`[book-preflight] HALT: ${err.message}`);
  } else {
    console.error("[book-preflight] failed:", err instanceof Error ? (err.stack ?? err.message) : err);
  }
  process.exit(1);
}
