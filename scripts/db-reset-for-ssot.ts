/**
 * SSOT-Reset: hard-delete the works domain so the Excel-SSOT loader (Brief 058+)
 * starts from a clean slate.
 *
 * `TRUNCATE works CASCADE` wipes `works` + all CTI children (book_details,
 * film_details, channel_details, video_details) + all `work_*` junctions
 * (factions, characters, locations, persons, facets, collections) +
 * `external_links` via the cascade chain. Reference tables (eras, factions,
 * series, persons, characters, locations, sectors, services, facet_categories,
 * facet_values) stay UNTOUCHED — they hold catalog vocabulary, not book rows.
 *
 * Safety: refuses to run without `--confirm` flag OR `DB_RESET_CONFIRM=1`.
 *
 * Usage:
 *   npm run db:reset-for-ssot -- --confirm
 *   DB_RESET_CONFIRM=1 npm run db:reset-for-ssot
 *   npm run db:reset-for-ssot -- --help
 *
 * Brief 057 (2026-05-10) — runs once before the Brief-058+ pipeline
 * populates the database from the curated Excel master-list (859 books).
 */
import { parseArgs } from "node:util";

import { sql } from "drizzle-orm";

import { db } from "@/db/client";

// Tables that must reach 0 rows after the truncate. Includes the new
// `work_collections` junction added in migration 0008 (Brief 057).
const TRUNCATE_TARGETS = [
  "works",
  "book_details",
  "film_details",
  "channel_details",
  "video_details",
  "work_factions",
  "work_characters",
  "work_locations",
  "work_persons",
  "work_facets",
  "work_collections",
  "external_links",
] as const;

// Reference tables — assertions verify these counts are unchanged after the
// truncate. Brief 057 acceptance bullet.
const REFERENCE_TABLES = [
  "eras",
  "factions",
  "series",
  "persons",
  "characters",
  "locations",
  "sectors",
  "services",
  "facet_categories",
  "facet_values",
] as const;

interface ParsedCliArgs {
  confirm: boolean;
  help: boolean;
}

function parseCliArgs(argv: string[]): ParsedCliArgs {
  const { values } = parseArgs({
    args: argv,
    options: {
      confirm: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
    strict: true,
    allowPositionals: false,
  });
  return {
    confirm: Boolean(values.confirm),
    help: Boolean(values.help),
  };
}

function printHelp(): void {
  console.log(`db-reset-for-ssot — Hard-delete the works domain.

Wipes works + book_details + film_details + channel_details + video_details +
work_factions + work_characters + work_locations + work_persons + work_facets +
work_collections + external_links via TRUNCATE works CASCADE. Reference tables
(eras, factions, series, persons, characters, locations, sectors, services,
facet_categories, facet_values) stay untouched.

Usage:
  npm run db:reset-for-ssot -- --confirm
  DB_RESET_CONFIRM=1 npm run db:reset-for-ssot
  npm run db:reset-for-ssot -- --help

This is destructive. Requires explicit confirmation via either:
  --confirm                  CLI flag.
  DB_RESET_CONFIRM=1         Environment variable.

Brief 057 (2026-05-10) — runs once before the Brief-058+ pipeline populates
the database from the curated Excel master-list (859 books).
`);
}

async function countOne(table: string): Promise<number> {
  const rows = await db.execute<{ n: number }>(
    sql`SELECT COUNT(*)::int AS n FROM ${sql.identifier(table)}`,
  );
  return rows[0]?.n ?? 0;
}

async function getCounts(
  tables: readonly string[],
): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const table of tables) {
    out[table] = await countOne(table);
  }
  return out;
}

function fmtCounts(counts: Record<string, number>, label: string): string {
  const lines = Object.entries(counts).map(
    ([t, n]) => `  ${t.padEnd(22)} ${String(n).padStart(7)}`,
  );
  return `${label}\n${lines.join("\n")}`;
}

async function main(): Promise<void> {
  const args = parseCliArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const confirmed = args.confirm || process.env.DB_RESET_CONFIRM === "1";
  if (!confirmed) {
    console.error(
      "[db-reset-for-ssot] refusing to truncate without --confirm or DB_RESET_CONFIRM=1\n",
    );
    printHelp();
    process.exit(1);
  }

  console.log("[db-reset-for-ssot] taking pre-truncate counts…");
  const beforeTargets = await getCounts(TRUNCATE_TARGETS);
  const beforeReference = await getCounts(REFERENCE_TABLES);
  console.log(fmtCounts(beforeTargets, "[before · works domain]"));
  console.log(
    fmtCounts(beforeReference, "[before · reference (must stay unchanged)]"),
  );

  console.log("[db-reset-for-ssot] TRUNCATE works CASCADE …");
  await db.execute(sql`TRUNCATE TABLE works CASCADE`);

  console.log("[db-reset-for-ssot] taking post-truncate counts…");
  const afterTargets = await getCounts(TRUNCATE_TARGETS);
  const afterReference = await getCounts(REFERENCE_TABLES);
  console.log(fmtCounts(afterTargets, "[after · works domain]"));
  console.log(fmtCounts(afterReference, "[after · reference]"));

  const targetFailures = Object.entries(afterTargets).filter(
    ([, n]) => n !== 0,
  );
  const referenceFailures = REFERENCE_TABLES.filter(
    (t) => afterReference[t] !== beforeReference[t],
  );

  if (targetFailures.length > 0) {
    console.error(
      "[db-reset-for-ssot] FAIL: works-domain tables did not all reach 0:",
      targetFailures,
    );
    process.exit(2);
  }
  if (referenceFailures.length > 0) {
    console.error(
      "[db-reset-for-ssot] FAIL: reference tables changed (must be untouched):",
      referenceFailures,
    );
    process.exit(2);
  }

  console.log(
    "[db-reset-for-ssot] done. works domain cleared, reference tables intact.",
  );
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error("[db-reset-for-ssot] unexpected error:", err);
  process.exit(1);
});
