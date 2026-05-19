/**
 * Smoke probe for Brief 084 acceptance § 7.
 *
 * Five slugs split across the two Brief-084 paths:
 *   - Skip-Pfad (3 slugs): book carries the umbrella surface form AND at
 *     least one peer location that resolves. Expectation: `Imperium` is in
 *     `locationsSkippedRedundant`, NOT in `locationsUnresolved`.
 *   - Erhaltungs-Pfad (2 slugs): book carries the umbrella as the only
 *     location tag. Expectation: `Imperium` stays in `locationsUnresolved`,
 *     no `locationsSkippedRedundant` bucket is written.
 *
 * Plus a global sanity assertion: no slug has an umbrella string in any
 * `work_locations.raw_name` row — `resolveLocation('Imperium').id === null`
 * keeps the Junction-Tabelle clean by definition, this just verifies the
 * Apply-Layer did not regress.
 */
import { sql } from "drizzle-orm";
import { db } from "@/db/client";

const SKIP_PATH_SLUGS = [
  "13th-legion",
  "kill-team",
  "annihilation-squad",
] as const;
const PRESERVATION_PATH_SLUGS = ["soul-drinker", "hellforged"] as const;
const UMBRELLA_NAMES = [
  "Imperium",
  "Imperium of Man",
  "Imperium of Mankind",
  "the Imperium",
  "Chaos",
  "Chaos Space",
  "the Chaos Space",
  "Realm of Chaos",
  "the Warp",
  "Warp Space",
  "Xenos",
  "Aliens",
  "Alien Space",
] as const;
const UMBRELLA_SET = new Set(
  UMBRELLA_NAMES.map((s) => s.trim().toLowerCase()),
);

const SURFACE_FORMS_BLOCK_RE =
  /---surfaceForms---\s*([\s\S]*?)\s*---\/surfaceForms---/;

interface SurfaceFormsPayload {
  locationsUnresolved?: Array<{ name: string; role: string }>;
  locationsSkippedRedundant?: string[];
}

type NotesRow = { notes: string | null };
type RawNameRow = { raw_name: string };

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

async function loadSurfaceForms(slug: string): Promise<SurfaceFormsPayload | null> {
  const result = await db.execute<NotesRow>(
    sql.raw(`
      select bd.notes
      from works w
      join book_details bd on bd.work_id = w.id
      where w.slug = '${slug}'
    `),
  );
  const rows = result as unknown as NotesRow[];
  if (rows.length === 0) return null;
  return parseSurfaceForms(rows[0]?.notes ?? null);
}

async function loadRawNames(slug: string): Promise<string[]> {
  const result = await db.execute<RawNameRow>(
    sql.raw(`
      select wl.raw_name
      from works w
      join work_locations wl on wl.work_id = w.id
      where w.slug = '${slug}'
    `),
  );
  const rows = result as unknown as RawNameRow[];
  return rows.map((r) => r.raw_name);
}

function hasUmbrella(names: string[]): string[] {
  return names.filter((n) => UMBRELLA_SET.has(n.trim().toLowerCase()));
}

async function main(): Promise<void> {
  let failures = 0;

  console.log("[smoke-locations-084] Skip-Pfad (umbrella + peer location)");
  for (const slug of SKIP_PATH_SLUGS) {
    const sf = await loadSurfaceForms(slug);
    if (!sf) {
      console.log(`  /buch/${slug} — FAIL: surfaceForms block missing in notes`);
      failures += 1;
      continue;
    }
    const unresolvedNames = (sf.locationsUnresolved ?? []).map((e) => e.name);
    const skippedNames = sf.locationsSkippedRedundant ?? [];
    const unresolvedUmbrellas = hasUmbrella(unresolvedNames);
    const skippedUmbrellas = hasUmbrella(skippedNames);

    const expectInSkipBucket = skippedUmbrellas.length > 0;
    const expectNotInUnresolved = unresolvedUmbrellas.length === 0;

    if (expectInSkipBucket && expectNotInUnresolved) {
      console.log(
        `  /buch/${slug} — ok (skipped: [${skippedUmbrellas.join(", ")}])`,
      );
    } else {
      failures += 1;
      console.log(
        `  /buch/${slug} — FAIL: unresolvedUmbrellas=${JSON.stringify(unresolvedUmbrellas)} skippedUmbrellas=${JSON.stringify(skippedUmbrellas)}`,
      );
    }
  }

  console.log("");
  console.log("[smoke-locations-084] Erhaltungs-Pfad (umbrella as sole tag)");
  for (const slug of PRESERVATION_PATH_SLUGS) {
    const sf = await loadSurfaceForms(slug);
    if (!sf) {
      console.log(`  /buch/${slug} — FAIL: surfaceForms block missing in notes`);
      failures += 1;
      continue;
    }
    const unresolvedNames = (sf.locationsUnresolved ?? []).map((e) => e.name);
    const skippedNames = sf.locationsSkippedRedundant ?? [];
    const unresolvedUmbrellas = hasUmbrella(unresolvedNames);
    const skippedUmbrellas = hasUmbrella(skippedNames);

    const expectInUnresolved = unresolvedUmbrellas.length > 0;
    const expectNoSkipBucket = skippedUmbrellas.length === 0;

    if (expectInUnresolved && expectNoSkipBucket) {
      console.log(
        `  /buch/${slug} — ok (kept in unresolved: [${unresolvedUmbrellas.join(", ")}])`,
      );
    } else {
      failures += 1;
      console.log(
        `  /buch/${slug} — FAIL: unresolvedUmbrellas=${JSON.stringify(unresolvedUmbrellas)} skippedUmbrellas=${JSON.stringify(skippedUmbrellas)}`,
      );
    }
  }

  console.log("");
  console.log("[smoke-locations-084] Junction sanity — no umbrella raw_name");
  const allSlugs = [...SKIP_PATH_SLUGS, ...PRESERVATION_PATH_SLUGS];
  for (const slug of allSlugs) {
    const rawNames = await loadRawNames(slug);
    const umbrellaInJunction = hasUmbrella(rawNames);
    if (umbrellaInJunction.length === 0) {
      console.log(
        `  /buch/${slug} — ok (${rawNames.length} junction rows, no umbrella raw_name)`,
      );
    } else {
      failures += 1;
      console.log(
        `  /buch/${slug} — FAIL: umbrella raw_name in junction: ${JSON.stringify(umbrellaInJunction)}`,
      );
    }
  }

  console.log("");
  console.log(
    `Summary: ${failures} smoke failures across ${allSlugs.length} slugs (3 skip + 2 preservation, plus junction sanity over all 5)`,
  );

  if (failures > 0) process.exit(1);
  process.exit(0);
}

main().catch((err) => {
  console.error("[smoke-locations-084] failed:", err);
  process.exit(1);
});
