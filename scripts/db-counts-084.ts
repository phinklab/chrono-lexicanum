/**
 * One-shot DB-counts probe for Brief 084 (Locations-Axis-Hygiene).
 *
 * Parses `book_details.notes` per book, extracts the `---surfaceForms---`
 * JSON block, and reports the Brief 084 § Acceptance counts table:
 *
 *   - Books with `Imperium` (any redundant-umbrella) in `locationsUnresolved`
 *     — pre-apply ≈ 20, post-apply ≈ 6 (Erhaltungs-Pfad).
 *   - Books with redundant-umbrellas in `locationsSkippedRedundant`
 *     — pre-apply 0 (bucket did not exist), post-apply ≈ 14 (Skip-Pfad).
 *   - `work_locations` junction count — invariant at 417 across pre/post.
 *   - Double-occurrence check — no surface form may appear in both
 *     `locationsUnresolved` and `locationsSkippedRedundant` for the same book.
 *
 * The script is invocation-agnostic: it does not know whether it is being
 * run pre- or post-apply. The two columns of the brief's acceptance table
 * come from running it twice and diffing.
 */
import { sql } from "drizzle-orm";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

import { db } from "@/db/client";

const LOCATION_POLICY_PATH = resolve(
  process.cwd(),
  "scripts",
  "seed-data",
  "location-policy.json",
);

interface LocationPolicyFile {
  redundantSurfaceForms?: string[];
}

type NotesRow = { slug: string; notes: string | null };

interface SurfaceFormsPayload {
  locationsUnresolved?: Array<{ name: string; role: string }>;
  locationsSkippedRedundant?: string[];
}

type CountRow = { count: number };

const SURFACE_FORMS_BLOCK_RE =
  /---surfaceForms---\s*([\s\S]*?)\s*---\/surfaceForms---/;

function parseSurfaceForms(notes: string | null): SurfaceFormsPayload | null {
  if (!notes) return null;
  const match = notes.match(SURFACE_FORMS_BLOCK_RE);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as SurfaceFormsPayload;
  } catch {
    return null;
  }
}

async function countJunction(table: string): Promise<number> {
  const result = await db.execute<CountRow>(
    sql.raw(`select count(*)::int as count from ${table}`),
  );
  const rows = result as unknown as CountRow[];
  return rows[0]?.count ?? 0;
}

async function main(): Promise<void> {
  console.log("[db-counts-084] start");

  const policy = JSON.parse(
    readFileSync(LOCATION_POLICY_PATH, "utf8"),
  ) as LocationPolicyFile;
  const redundantSet = new Set(
    (policy.redundantSurfaceForms ?? []).map((s) => s.trim().toLowerCase()),
  );
  console.log(
    `policy: ${redundantSet.size} redundant surface forms loaded from location-policy.json`,
  );

  const workLocations = await countJunction("work_locations");
  console.log(`work_locations${" ".repeat(20)} ${workLocations}`);

  const result = await db.execute<NotesRow>(
    sql.raw(`
      select w.slug, bd.notes
      from works w
      join book_details bd on bd.work_id = w.id
      where bd.notes is not null
    `),
  );
  const rows = result as unknown as NotesRow[];

  let booksWithUnresolvedRedundant = 0;
  let booksWithSkippedRedundant = 0;
  let booksWithDoubleOccurrence = 0;
  const doubleOccurrenceSlugs: string[] = [];
  const skippedByName = new Map<string, number>();
  const unresolvedRedundantByName = new Map<string, number>();

  for (const row of rows) {
    const payload = parseSurfaceForms(row.notes);
    if (!payload) continue;

    const unresolvedRedundantInBook = new Set<string>();
    for (const entry of payload.locationsUnresolved ?? []) {
      const key = entry.name.trim().toLowerCase();
      if (redundantSet.has(key)) {
        unresolvedRedundantInBook.add(key);
        unresolvedRedundantByName.set(
          entry.name,
          (unresolvedRedundantByName.get(entry.name) ?? 0) + 1,
        );
      }
    }
    if (unresolvedRedundantInBook.size > 0) booksWithUnresolvedRedundant += 1;

    const skippedRedundantInBook = new Set<string>();
    for (const name of payload.locationsSkippedRedundant ?? []) {
      const key = name.trim().toLowerCase();
      skippedRedundantInBook.add(key);
      skippedByName.set(name, (skippedByName.get(name) ?? 0) + 1);
    }
    if (skippedRedundantInBook.size > 0) booksWithSkippedRedundant += 1;

    let overlap = false;
    for (const key of unresolvedRedundantInBook) {
      if (skippedRedundantInBook.has(key)) {
        overlap = true;
        break;
      }
    }
    if (overlap) {
      booksWithDoubleOccurrence += 1;
      doubleOccurrenceSlugs.push(row.slug);
    }
  }

  console.log("");
  console.log("Brief 084 § Acceptance — observational counts:");
  console.log(
    `  books with redundant umbrella in locationsUnresolved      ${booksWithUnresolvedRedundant}`,
  );
  console.log(
    `  books with redundant umbrella in locationsSkippedRedundant ${booksWithSkippedRedundant}`,
  );
  console.log(`  work_locations (sanity, invariant)                         ${workLocations}`);
  console.log(
    `  books with double-occurrence (both buckets)               ${booksWithDoubleOccurrence}`,
  );

  if (unresolvedRedundantByName.size > 0) {
    console.log("");
    console.log("by surface form (locationsUnresolved, redundant only):");
    for (const [name, n] of [...unresolvedRedundantByName.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    )) {
      console.log(`  ${name.padEnd(28)} ${n}`);
    }
  }

  if (skippedByName.size > 0) {
    console.log("");
    console.log("by surface form (locationsSkippedRedundant):");
    for (const [name, n] of [...skippedByName.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    )) {
      console.log(`  ${name.padEnd(28)} ${n}`);
    }
  }

  if (doubleOccurrenceSlugs.length > 0) {
    console.log("");
    console.log("FAIL — books with double-occurrence:");
    for (const slug of doubleOccurrenceSlugs) {
      console.log(`  /buch/${slug}`);
    }
  }

  console.log("");
  console.log("[db-counts-084] done");
  process.exit(booksWithDoubleOccurrence === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("[db-counts-084] failed:", err);
  process.exit(1);
});
