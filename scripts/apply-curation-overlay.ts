/**
 * apply-curation-overlay.ts — Brief 149. The hand-override overlay apply path:
 * a deterministic TAIL that re-asserts the maintainer's per-book decisions AFTER
 * the auto apply/rebuild has run. See `scripts/curation-overlay.ts` for the
 * format, the validator, and why this must be a tail (the auto path rebuilds the
 * junctions per-workId delete-then-insert, so a hand fix has to run last).
 *
 * It applies ONLY the `final` section of the committed sidecar
 * (`scripts/seed-data/curation-overlay.json`). `reviewQueue` is carried but
 * never applied (proposals from the B11 book-reviewer / weekly-refresh).
 *
 * Both directions, scoped to the exact edge `(workId, entityId)` (the PK of each
 * junction):
 *   - Addition    → upsert the row (insert, or update its role/rawName).
 *   - Suppression → delete that one row.
 *   - Field fix   → scoped column write on works (synopsis) / book_details
 *                   (format, primaryEraId). Provenance stays in the sidecar; no
 *                   DB column is added (migration-free, narrator model).
 *
 * Idempotent: deletes of an absent row are no-ops; adds upsert; field writes set
 * an exact value. A second apply changes nothing.
 *
 * Programmatic: `applyCurationOverlay({ dryRun })` is exported for the future
 * admin page; the CLI is a thin wrapper.
 *
 * CLI:
 *   npm run apply:curation-overlay -- --dry-run     # validate + diff, no writes
 *   npm run apply:curation-overlay                  # apply
 *   npm run apply:curation-overlay -- --file=<path> # alternate sidecar
 *   npm run apply:curation-overlay -- --verify      # read-only post-condition
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db/client";
import {
  bookDetails,
  bookFormat,
  characters,
  eras,
  factions,
  locations,
  workCharacters,
  workFactions,
  workLocations,
  works,
} from "@/db/schema";
import { loadBannedPatterns, type BannedPattern } from "./apply-override-synopsis-lint";
import {
  computeBookOps,
  diffBookOps,
  isRunOk,
  validateOverlay,
  type BookOps,
  type CurationOverlay,
  type CurrentBookState,
  type RefSets,
} from "./curation-overlay";

const SEED_DIR = resolve(process.cwd(), "scripts", "seed-data");
const DEFAULT_SIDECAR = "scripts/seed-data/curation-overlay.json";

// Mirrors the `book_format` enum in src/db/schema.ts. A constant (not a pg_enum
// round-trip) — same style as AUDIO_ROLES in apply-audiobook-narrators.ts. If
// the enum grows, add the value here.
const BOOK_FORMATS: ReadonlySet<string> = new Set([
  "novel",
  "novella",
  "short_story",
  "anthology",
  "audio_drama",
  "omnibus",
  "collection",
  "artbook",
  "scriptbook",
]);

// =============================================================================
// Reference sets + work resolution
// =============================================================================

async function loadRefSets(): Promise<RefSets> {
  const [factionRows, locationRows, characterRows, eraRows] = await Promise.all([
    db.select({ id: factions.id }).from(factions),
    db.select({ id: locations.id }).from(locations),
    db.select({ id: characters.id }).from(characters),
    db.select({ id: eras.id }).from(eras),
  ]);
  return {
    factionIds: new Set(factionRows.map((r) => r.id)),
    locationIds: new Set(locationRows.map((r) => r.id)),
    characterIds: new Set(characterRows.map((r) => r.id)),
    eraIds: new Set(eraRows.map((r) => r.id)),
    bookFormats: BOOK_FORMATS,
  };
}

async function resolveWorkIds(externalIds: string[]): Promise<Map<string, string>> {
  if (externalIds.length === 0) return new Map();
  const rows = await db
    .select({ externalBookId: works.externalBookId, id: works.id })
    .from(works)
    .where(inArray(works.externalBookId, externalIds));
  const map = new Map<string, string>();
  for (const r of rows) if (r.externalBookId !== null) map.set(r.externalBookId, r.id);
  return map;
}

// =============================================================================
// Current state (for dry-run diff + verify)
// =============================================================================

async function loadCurrentState(workId: string): Promise<CurrentBookState> {
  const [fRows, lRows, cRows, wRows, bRows] = await Promise.all([
    db
      .select({ id: workFactions.factionId, role: workFactions.role })
      .from(workFactions)
      .where(eq(workFactions.workId, workId)),
    db
      .select({ id: workLocations.locationId, role: workLocations.role })
      .from(workLocations)
      .where(eq(workLocations.workId, workId)),
    db
      .select({ id: workCharacters.characterId, role: workCharacters.role })
      .from(workCharacters)
      .where(eq(workCharacters.workId, workId)),
    db.select({ synopsis: works.synopsis }).from(works).where(eq(works.id, workId)),
    db
      .select({ format: bookDetails.format, primaryEraId: bookDetails.primaryEraId })
      .from(bookDetails)
      .where(eq(bookDetails.workId, workId)),
  ]);
  const toMap = (rows: Array<{ id: string; role: string | null }>): Map<string, string> =>
    new Map(rows.map((r) => [r.id, r.role ?? ""]));
  return {
    edges: {
      factions: toMap(fRows),
      locations: toMap(lRows),
      characters: toMap(cRows),
    },
    fields: {
      synopsis: wRows[0]?.synopsis ?? null,
      format: bRows[0]?.format ?? null,
      primaryEraId: bRows[0]?.primaryEraId ?? null,
    },
  };
}

// =============================================================================
// Apply — per-book transaction, scoped per-edge writes
// =============================================================================

async function applyBookOps(workId: string, ops: BookOps): Promise<void> {
  await db.transaction(async (tx) => {
    // Suppressions: delete the exact (workId, entityId) row.
    for (const r of ops.edgeRemoves) {
      if (r.axis === "factions") {
        await tx
          .delete(workFactions)
          .where(and(eq(workFactions.workId, workId), eq(workFactions.factionId, r.id)));
      } else if (r.axis === "locations") {
        await tx
          .delete(workLocations)
          .where(and(eq(workLocations.workId, workId), eq(workLocations.locationId, r.id)));
      } else {
        await tx
          .delete(workCharacters)
          .where(and(eq(workCharacters.workId, workId), eq(workCharacters.characterId, r.id)));
      }
    }

    // Additions: upsert the exact (workId, entityId) row with the hand role.
    for (const a of ops.edgeAdds) {
      if (a.axis === "factions") {
        await tx
          .insert(workFactions)
          .values({ workId, factionId: a.id, role: a.role, rawName: a.rawName })
          .onConflictDoUpdate({
            target: [workFactions.workId, workFactions.factionId],
            set: { role: a.role, rawName: a.rawName },
          });
      } else if (a.axis === "locations") {
        await tx
          .insert(workLocations)
          .values({ workId, locationId: a.id, role: a.role, rawName: a.rawName })
          .onConflictDoUpdate({
            target: [workLocations.workId, workLocations.locationId],
            set: { role: a.role, rawName: a.rawName },
          });
      } else {
        await tx
          .insert(workCharacters)
          .values({ workId, characterId: a.id, role: a.role, rawName: a.rawName })
          .onConflictDoUpdate({
            target: [workCharacters.workId, workCharacters.characterId],
            set: { role: a.role, rawName: a.rawName },
          });
      }
    }

    // Field fixes: scoped column writes. The patch is typed against the table's
    // insert type (a stray field name would now be a type error); `format` is
    // narrowed to the book_format enum — the validator already proved f.value is
    // a valid member, so this one honest cast replaces the old opaque `as never`.
    const bookDetailsPatch: Partial<typeof bookDetails.$inferInsert> = {};
    for (const f of ops.fieldWrites) {
      if (f.field === "synopsis") {
        await tx
          .update(works)
          .set({ synopsis: f.value, updatedAt: new Date() })
          .where(eq(works.id, workId));
      } else if (f.field === "format") {
        bookDetailsPatch.format = f.value as (typeof bookFormat.enumValues)[number];
      } else {
        bookDetailsPatch.primaryEraId = f.value;
      }
    }
    if (Object.keys(bookDetailsPatch).length > 0) {
      await tx
        .update(bookDetails)
        .set(bookDetailsPatch)
        .where(eq(bookDetails.workId, workId));
    }
  });
}

// =============================================================================
// Public entry point (admin page / CLI)
// =============================================================================

export interface OverlayRunOptions {
  file?: string;
  dryRun?: boolean;
  verify?: boolean;
}

export interface OverlayRunResult {
  ok: boolean;
  booksTotal: number;
  booksResolved: number;
  unresolved: string[];
  edgeAdds: number;
  edgeRemoves: number;
  fieldWrites: number;
  changes: number; // ops that were NOT already satisfied (insert/delete/update)
  noops: number; // ops already satisfied (idempotency surface)
}

/**
 * Load + validate + (dry-run | apply | verify) the curation overlay. Returns a
 * structured result so a caller (admin page) does not parse stdout.
 */
export async function applyCurationOverlay(
  opts: OverlayRunOptions = {},
): Promise<OverlayRunResult> {
  const sidecarPath = resolve(opts.file ?? DEFAULT_SIDECAR);
  const raw = JSON.parse(readFileSync(sidecarPath, "utf8")) as unknown;

  const refs = await loadRefSets();
  const banned: readonly BannedPattern[] = loadBannedPatterns(SEED_DIR);
  const overlay: CurationOverlay = validateOverlay(raw, refs, {
    bannedSynopsisPatterns: banned,
  });

  const finalBooks = overlay.final.books;
  const externalIds = finalBooks.map((b) => b.externalBookId);
  const workIdByExternal = await resolveWorkIds(externalIds);
  const unresolved = externalIds.filter((id) => !workIdByExternal.has(id));

  let edgeAdds = 0;
  let edgeRemoves = 0;
  let fieldWrites = 0;
  let changes = 0;
  let noops = 0;

  const mode = opts.verify ? "verify" : opts.dryRun ? "dry-run" : "apply";
  console.log(
    `\n=== curation-overlay ${mode}${mode !== "apply" ? " [READ ONLY]" : ""} ===`,
  );
  console.log(`Sidecar: ${sidecarPath}`);
  console.log(
    `final books: ${finalBooks.length} (${workIdByExternal.size} resolved)` +
      `   reviewQueue (not applied): ${overlay.reviewQueue?.books.length ?? 0}`,
  );

  let verifyOk = true;

  for (const book of finalBooks) {
    const ops = computeBookOps(book);
    edgeAdds += ops.edgeAdds.length;
    edgeRemoves += ops.edgeRemoves.length;
    fieldWrites += ops.fieldWrites.length;

    const workId = workIdByExternal.get(book.externalBookId);
    if (workId === undefined) {
      // apply skips unknown books gracefully (incremental friendliness, narrator
      // model); verify treats an unresolved final book as a failure.
      console.log(`  ${book.externalBookId.padEnd(10)} UNRESOLVED — skipped`);
      if (opts.verify) verifyOk = false;
      continue;
    }

    if (mode === "apply") {
      await applyBookOps(workId, ops);
      console.log(
        `  ${book.externalBookId.padEnd(10)} applied  ` +
          `+${ops.edgeAdds.length} -${ops.edgeRemoves.length} ~${ops.fieldWrites.length}`,
      );
      continue;
    }

    // dry-run / verify: diff against current DB state.
    const current = await loadCurrentState(workId);
    const diff = diffBookOps(ops, current);
    changes += diff.changes;
    noops += diff.noops;
    if (mode === "verify") {
      if (!diff.satisfied) {
        verifyOk = false;
        console.error(`  ${book.externalBookId.padEnd(10)} NOT SATISFIED`);
        for (const d of diff.diffs.filter((x) => x.status === "change")) {
          console.error(`      ${d.label}`);
        }
      } else {
        console.log(`  ${book.externalBookId.padEnd(10)} OK (all ${diff.noops} ops satisfied)`);
      }
    } else {
      console.log(
        `  ${book.externalBookId.padEnd(10)} ${diff.changes} change(s), ${diff.noops} noop(s)`,
      );
      for (const d of diff.diffs) {
        console.log(`      [${d.status}] ${d.label}`);
      }
    }
  }

  console.log(
    `\nTotals: +${edgeAdds} adds  -${edgeRemoves} removes  ~${fieldWrites} field-writes`,
  );
  if (mode !== "apply") {
    console.log(`Diff:   ${changes} change(s), ${noops} already-satisfied (noop)`);
  }
  if (unresolved.length > 0) {
    console.error(`Unresolved final books: ${unresolved.length} → ${unresolved.join(", ")}`);
    console.error(
      `FAILED — ${unresolved.length} final book(s) did not resolve to a works.id ` +
        `(typo'd externalBookId?). A final override for a non-existent book is always ` +
        `an error; this fails apply, dry-run and verify alike so the typo surfaces early.`,
    );
  }

  // A run is OK iff verify (when asked) passed AND no final book went unresolved.
  // An unresolved final book is always an error — in every mode, so a dry-run
  // catches the typo before the apply.
  const ok = isRunOk(opts.verify === true, verifyOk, unresolved.length);
  if (mode === "verify") {
    console.log(
      ok
        ? "VERIFY OK — every final add present, every suppression absent, every field equal."
        : "VERIFY FAILED — see NOT SATISFIED / UNRESOLVED lines above.",
    );
  }

  return {
    ok,
    booksTotal: finalBooks.length,
    booksResolved: workIdByExternal.size,
    unresolved,
    edgeAdds,
    edgeRemoves,
    fieldWrites,
    changes,
    noops,
  };
}

// =============================================================================
// CLI
// =============================================================================

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      "dry-run": { type: "boolean", default: false },
      verify: { type: "boolean", default: false },
      file: { type: "string" },
    },
  });
  const result = await applyCurationOverlay({
    file: values.file,
    dryRun: values["dry-run"] === true,
    verify: values.verify === true,
  });
  process.exit(result.ok ? 0 : 1);
}

// Only run main() when invoked directly (mirrors apply-audiobook-narrators.ts);
// importing this module for the admin page must not kick off a CLI run.
const isMain = (() => {
  const entry = process.argv[1] ?? "";
  return entry.includes("apply-curation-overlay");
})();
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
