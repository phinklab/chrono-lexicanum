/**
 * Brief 133 — advance a show's curation cursor ("I've reviewed this show up to
 * <date>"). The weekly podcast diff (`refresh:check`) then only surfaces episodes
 * published after the cursor, so skipped back-catalog is not re-proposed next
 * week. Writes `ingest/refresh/curation-state.json`.
 *
 * No DB, no network — reads the registry (to validate slugs / support --all) and
 * the cursor file. Run it after curating a show (or after deciding to skip its
 * backlog): `npm run refresh:mark-reviewed -- --show <slug>`.
 *
 * Usage:
 *   npm run refresh:mark-reviewed -- --show lorehammer          # one show, up to today
 *   npm run refresh:mark-reviewed -- --show a --show b          # several
 *   npm run refresh:mark-reviewed -- --all                      # every registered show
 *   npm run refresh:mark-reviewed -- --show luetin09 --date 2026-06-01
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { parseArgs } from "node:util";

import { loadRegistry } from "@/lib/ingestion/podcast/registry";

import {
  CURATION_STATE_PATH,
  loadCurationState,
  markReviewed,
  serializeCurationState,
} from "./refresh/curation-state";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function main(): void {
  const { values } = parseArgs({
    options: {
      show: { type: "string", multiple: true },
      all: { type: "boolean", default: false },
      date: { type: "string" },
    },
  });

  const date = values.date ?? todayIso();
  if (Number.isNaN(Date.parse(date))) {
    console.error(`error: --date must be a parseable ISO date (got "${String(values.date)}")`);
    process.exit(1);
  }

  const registry = loadRegistry();
  const known = new Set(registry.map((s) => s.slug));

  let slugs: string[];
  if (values.all) {
    slugs = registry.map((s) => s.slug);
  } else if (values.show && values.show.length > 0) {
    slugs = values.show;
    const bad = slugs.filter((s) => !known.has(s));
    if (bad.length > 0) {
      console.error(`error: unknown show(s): ${bad.join(", ")} — have: ${[...known].join(", ")}`);
      process.exit(1);
    }
  } else {
    console.error("error: pass --show <slug> (repeatable) or --all");
    process.exit(1);
  }

  const next = markReviewed(loadCurationState(), slugs, date);
  mkdirSync(dirname(CURATION_STATE_PATH), { recursive: true });
  writeFileSync(CURATION_STATE_PATH, serializeCurationState(next), "utf8");

  console.log(`marked reviewed up to ${date}: ${slugs.join(", ")}`);
  console.log(`wrote ${CURATION_STATE_PATH}`);
}

main();
