/**
 * apply-audiobook-narrators.ts — Brief 105 Data pass.
 *
 * Applies the committed audiobook-credit sidecar
 * (`scripts/seed-data/audiobook-narrators.json`) to the DB: auto-creates the
 * narrator/cast `persons` rows and writes their `work_persons` rows with roles
 * narrator | co_narrator | full_cast. The sidecar is the source of truth;
 * DB rows are derived (provenance — sourceUrl/checkedAt/confidence — lives only
 * in the sidecar, never in `work_persons`).
 *
 * Durability contract (the point of this pass): the SSOT/resolver apply path
 * `scripts/apply-override.ts` deletes-and-reinserts `work_persons`, but as of
 * Brief 105 it scopes that delete to roles author|editor. This script owns the
 * audio roles and scopes ITS delete to narrator|co_narrator|full_cast. The two
 * paths are symmetric and never clobber each other, so audio credits survive
 * every resolver wave / consolidation re-apply. (Verify: re-apply an override
 * batch, confirm narrator rows remain.)
 *
 * Idempotent: per book it deletes the audio-role rows then re-inserts from the
 * sidecar, so a re-run reproduces identical rows (0 duplicates) and reflects
 * any sidecar edit. Author/editor rows are never touched.
 *
 * Persons are slugified with the SAME helper apply-override uses
 * (`@/lib/seed/persons`), so a person who both writes and narrates collapses to
 * one `persons.id`.
 *
 * CLI:
 *   npm run apply:audiobook-narrators -- --dry-run     # validate + report, no writes
 *   npm run apply:audiobook-narrators                  # apply
 *   npm run apply:audiobook-narrators -- --file=<path> # alternate sidecar
 *   npm run apply:audiobook-narrators -- --verify      # read-only post-condition check
 *
 * --verify (Brief 107): read-only completeness check, no writes. Verifies the
 * DB holds EXACTLY the sidecar-derived set of audio-role `work_persons` rows:
 * every sidecar book resolves to a works.id, every credit is present as its
 * (workId, personId, role) row (that triple is work_persons' PK), and there are
 * no stray audio rows. A bare total-count check would false-positive (a surplus
 * in one role masking a deficit in another), so it is set equality, not a count.
 * Exits nonzero on any missing / stray / unresolved row, or a zero expectation.
 * This is the final step of the `db:rebuild` orchestrator (scripts/db-rebuild.sh)
 * — it confirms a full rebuild restored every audiobook credit. It does NOT touch
 * the apply path: the apply still skips unknown externalBookIds gracefully (the
 * rebuild-completeness check lives in --verify, the worker stays friendly for
 * incremental use / the later sweep).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db/client";
import { persons, workPersons, works } from "@/db/schema";
import { deriveNameSort, slugifyPerson } from "@/lib/seed/persons";

const AUDIO_ROLES = ["narrator", "co_narrator", "full_cast"] as const;
type AudioRole = (typeof AUDIO_ROLES)[number];
const AUDIO_ROLE_SET: ReadonlySet<string> = new Set(AUDIO_ROLES);

const DEFAULT_SIDECAR = "scripts/seed-data/audiobook-narrators.json";
const EXTERNAL_ID_RE = /^(?:W40K|HH)-\d{4}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface Credit {
  name: string;
  role: AudioRole;
  sourceUrl: string;
  checkedAt: string;
  confidence: number;
  note?: string;
}

interface BookEntry {
  externalBookId: string;
  title?: string;
  credits: Credit[];
}

interface AuditEntry {
  externalBookId: string;
  status: string;
  checkedAt?: string;
  sourceUrl?: string;
  note?: string;
}

interface Sidecar {
  books: BookEntry[];
  audit?: AuditEntry[];
}

/**
 * Parse + structurally validate the sidecar. Throws BEFORE any DB mutation on
 * bad input so a malformed sidecar can never half-apply.
 */
function loadAndValidate(path: string): Sidecar {
  const raw = JSON.parse(readFileSync(path, "utf8")) as Sidecar;
  if (!Array.isArray(raw.books)) {
    throw new Error(`${path}: missing books[] array.`);
  }
  if (raw.audit !== undefined && !Array.isArray(raw.audit)) {
    throw new Error(`${path}: audit must be an array when present.`);
  }

  const seenBookId = new Set<string>();
  for (const [bi, book] of raw.books.entries()) {
    const at = `books[${bi}] (${book?.externalBookId ?? "?"})`;
    if (typeof book.externalBookId !== "string" || !EXTERNAL_ID_RE.test(book.externalBookId)) {
      throw new Error(`${at}: externalBookId must match ${EXTERNAL_ID_RE}.`);
    }
    if (seenBookId.has(book.externalBookId)) {
      throw new Error(`${at}: duplicate externalBookId.`);
    }
    seenBookId.add(book.externalBookId);

    if (!Array.isArray(book.credits) || book.credits.length === 0) {
      throw new Error(`${at}: credits[] must be a non-empty array.`);
    }

    // work_persons PK is (workId, personId, role); a duplicate (person-slug,
    // role) within one book would collide on insert — reject it up front.
    const seenPersonRole = new Set<string>();
    for (const [ci, c] of book.credits.entries()) {
      const cat = `${at} credits[${ci}]`;
      if (typeof c.name !== "string" || c.name.trim() === "") {
        throw new Error(`${cat}: name is required.`);
      }
      if (typeof c.role !== "string" || !AUDIO_ROLE_SET.has(c.role)) {
        throw new Error(`${cat}: role "${c.role}" must be one of ${[...AUDIO_ROLE_SET].join("|")}.`);
      }
      if (typeof c.sourceUrl !== "string" || c.sourceUrl.trim() === "") {
        throw new Error(`${cat}: sourceUrl is required.`);
      }
      if (typeof c.checkedAt !== "string" || !ISO_DATE_RE.test(c.checkedAt)) {
        throw new Error(`${cat}: checkedAt must be an ISO date (YYYY-MM-DD).`);
      }
      if (typeof c.confidence !== "number" || c.confidence < 0 || c.confidence > 1) {
        throw new Error(`${cat}: confidence must be a number in [0,1].`);
      }
      const slug = slugifyPerson(c.name);
      if (slug === "") {
        throw new Error(`${cat}: name "${c.name}" slugifies to empty.`);
      }
      const key = `${slug}::${c.role}`;
      if (seenPersonRole.has(key)) {
        throw new Error(`${cat}: duplicate (person, role) "${c.name}"/${c.role} on this book.`);
      }
      seenPersonRole.add(key);
    }
  }
  return raw;
}

/**
 * Read-only completeness check (Brief 107). Verifies the DB holds EXACTLY the
 * sidecar-derived set of audio-role `work_persons` rows — not merely the right
 * total count (a total alone false-positives: a surplus in one role can mask a
 * deficit in another). Identity is the (workId, personId, role) triple, which is
 * work_persons' primary key. Passes iff:
 *   - every sidecar book resolves to a works.id (a full rebuild restores them all),
 *   - every sidecar credit is present as its exact (workId, personId, role) row,
 *   - there are no stray audio rows the sidecar doesn't account for, and
 *   - the expectation is nonzero.
 * Numbers are sidecar-derived (NOT a hardcoded literal), so the later 859-book
 * full sweep growing the sidecar needs no edit here.
 */
async function verifyAudioCredits(
  sidecar: Sidecar,
  sidecarPath: string,
): Promise<boolean> {
  const fmtByRole = (by: Record<string, number>): string =>
    AUDIO_ROLES.map((r) => `${r} ${by[r] ?? 0}`).join(" / ");
  const tupleKey = (workId: string, personId: string, role: string): string =>
    `${workId}::${personId}::${role}`;

  // 1. Resolve externalBookId -> works.id (same UNIQUE lookup the apply uses).
  const externalIds = sidecar.books.map((b) => b.externalBookId);
  const workRows = await db
    .select({ externalBookId: works.externalBookId, workId: works.id })
    .from(works)
    .where(inArray(works.externalBookId, externalIds));
  const workIdByExternal = new Map<string, string>();
  const externalByWorkId = new Map<string, string>();
  for (const r of workRows) {
    if (r.externalBookId !== null) {
      workIdByExternal.set(r.externalBookId, r.workId);
      externalByWorkId.set(r.workId, r.externalBookId);
    }
  }

  // 2. Sidecar-derived expectation: the exact set of (workId, personId, role)
  //    triples. A book that doesn't resolve to a works.id is a completeness
  //    failure — its credits cannot be present at all.
  const expected = new Map<
    string,
    { externalBookId: string; personId: string; role: AudioRole }
  >();
  const expectedByRole: Record<AudioRole, number> = {
    narrator: 0,
    co_narrator: 0,
    full_cast: 0,
  };
  const unresolvedBooks: string[] = [];
  const sidecarTotal = sidecar.books.reduce((n, b) => n + b.credits.length, 0);
  for (const b of sidecar.books) {
    const workId = workIdByExternal.get(b.externalBookId);
    if (workId === undefined) {
      unresolvedBooks.push(b.externalBookId);
      continue;
    }
    for (const c of b.credits) {
      const personId = slugifyPerson(c.name);
      expected.set(tupleKey(workId, personId, c.role), {
        externalBookId: b.externalBookId,
        personId,
        role: c.role,
      });
      expectedByRole[c.role] += 1;
    }
  }

  // 3. Actual audio-role rows in the DB (PK = workId+personId+role).
  const actualRows = await db
    .select({
      workId: workPersons.workId,
      personId: workPersons.personId,
      role: workPersons.role,
    })
    .from(workPersons)
    .where(inArray(workPersons.role, [...AUDIO_ROLES]));
  const actualKeys = new Set<string>();
  const actualByRole: Record<string, number> = {};
  for (const r of actualRows) {
    actualKeys.add(tupleKey(r.workId, r.personId, r.role));
    actualByRole[r.role] = (actualByRole[r.role] ?? 0) + 1;
  }

  // 4. Set comparison: every sidecar credit present, and no stray audio rows.
  const missing = [...expected.entries()]
    .filter(([k]) => !actualKeys.has(k))
    .map(([, v]) => v);
  const extra = actualRows.filter(
    (r) => !expected.has(tupleKey(r.workId, r.personId, r.role)),
  );

  console.log("\n=== audiobook-narrators verify [READ ONLY] ===");
  console.log(`Sidecar:  ${sidecarPath}`);
  console.log(`Expected (sidecar-derived): ${sidecarTotal}  (${fmtByRole(expectedByRole)})`);
  console.log(`Actual   (DB work_persons): ${actualKeys.size}  (${fmtByRole(actualByRole)})`);
  console.log(`Books resolved: ${sidecar.books.length - unresolvedBooks.length}/${sidecar.books.length}`);

  const ok =
    sidecarTotal > 0 &&
    unresolvedBooks.length === 0 &&
    missing.length === 0 &&
    extra.length === 0;

  if (ok) {
    console.log(
      `VERIFY OK — all ${sidecarTotal} sidecar audio credits present as exact (work, person, role) rows; no stray rows.`,
    );
    return true;
  }

  if (sidecarTotal === 0) {
    console.error(
      "VERIFY FAILED — sidecar yields 0 expected credits; a rebuild must restore a nonzero count.",
    );
  }
  if (unresolvedBooks.length > 0) {
    console.error(
      `VERIFY FAILED — ${unresolvedBooks.length} sidecar book(s) did not resolve to a works.id: ${unresolvedBooks.join(", ")}`,
    );
  }
  if (missing.length > 0) {
    console.error(`VERIFY FAILED — ${missing.length} sidecar credit(s) missing from work_persons:`);
    for (const m of missing.slice(0, 20)) {
      console.error(`    ${m.externalBookId}  ${m.personId}  ${m.role}`);
    }
    if (missing.length > 20) console.error(`    … and ${missing.length - 20} more`);
  }
  if (extra.length > 0) {
    console.error(`VERIFY FAILED — ${extra.length} stray audio work_persons row(s) not derived from the sidecar:`);
    for (const r of extra.slice(0, 20)) {
      console.error(`    ${externalByWorkId.get(r.workId) ?? r.workId}  ${r.personId}  ${r.role}`);
    }
    if (extra.length > 20) console.error(`    … and ${extra.length - 20} more`);
  }
  return false;
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      "dry-run": { type: "boolean", default: false },
      verify: { type: "boolean", default: false },
      file: { type: "string" },
    },
  });
  const dryRun = values["dry-run"] === true;
  const verify = values.verify === true;
  const sidecarPath = resolve(values.file ?? DEFAULT_SIDECAR);

  const sidecar = loadAndValidate(sidecarPath);

  // --verify: read-only post-condition check, no writes. Used as the final step
  // of the db:rebuild orchestrator to confirm every audiobook credit was restored.
  if (verify) {
    const ok = await verifyAudioCredits(sidecar, sidecarPath);
    process.exit(ok ? 0 : 1);
  }

  const { books } = sidecar;
  const totalCredits = books.reduce((n, b) => n + b.credits.length, 0);
  console.log(
    `Loaded ${books.length} book(s), ${totalCredits} credit(s) from ${sidecarPath}` +
      (dryRun ? "   [DRY RUN — no writes]" : ""),
  );

  // 1. Resolve externalBookId → works.id. `works.external_book_id` is UNIQUE,
  //    so this is unambiguous and needs no kind/source scoping (covers HH-/W40K-
  //    novels AND audio_drama works alike).
  const externalIds = books.map((b) => b.externalBookId);
  const workRows = await db
    .select({ externalBookId: works.externalBookId, workId: works.id })
    .from(works)
    .where(inArray(works.externalBookId, externalIds));
  const workIdByExternal = new Map<string, string>();
  for (const r of workRows) {
    if (r.externalBookId !== null) workIdByExternal.set(r.externalBookId, r.workId);
  }
  const knownBooks = books.filter((b) => workIdByExternal.has(b.externalBookId));
  const unknown = books
    .filter((b) => !workIdByExternal.has(b.externalBookId))
    .map((b) => b.externalBookId);

  // 2. Ensure persons exist (slug-dedup; first display string wins; insert
  //    missing FK-safe before any work_persons write). Read-only in dry-run.
  const nameBySlug = new Map<string, string>();
  for (const b of knownBooks) {
    for (const c of b.credits) {
      const slug = slugifyPerson(c.name);
      if (!nameBySlug.has(slug)) nameBySlug.set(slug, c.name);
    }
  }
  const wantedSlugs = [...nameBySlug.keys()];
  let personsCreated = 0;
  if (wantedSlugs.length > 0) {
    const existingRows = await db
      .select({ id: persons.id })
      .from(persons)
      .where(inArray(persons.id, wantedSlugs));
    const existing = new Set(existingRows.map((r) => r.id));
    const missing = wantedSlugs.filter((s) => !existing.has(s));
    personsCreated = missing.length;
    if (missing.length > 0 && !dryRun) {
      await db
        .insert(persons)
        .values(
          missing.map((slug) => {
            const name = nameBySlug.get(slug)!;
            return { id: slug, name, nameSort: deriveNameSort(name) };
          }),
        )
        .onConflictDoNothing();
    }
  }

  // 3. Per book: scoped delete-then-insert of audio-role work_persons rows.
  //    Wrapped per book so a failure can't leave a book with deleted-but-not-
  //    reinserted audio rows. displayOrder == credit index.
  let rowsWritten = 0;
  for (const b of knownBooks) {
    const workId = workIdByExternal.get(b.externalBookId)!;
    const rows = b.credits.map((c, i) => ({
      workId,
      personId: slugifyPerson(c.name),
      role: c.role,
      displayOrder: i,
    }));
    if (!dryRun) {
      await db.transaction(async (tx) => {
        await tx
          .delete(workPersons)
          .where(
            and(
              eq(workPersons.workId, workId),
              inArray(workPersons.role, [...AUDIO_ROLES]),
            ),
          );
        if (rows.length > 0) await tx.insert(workPersons).values(rows);
      });
    }
    rowsWritten += rows.length;
  }

  // 4. Summary / coverage.
  const fullCastBooks = knownBooks.filter((b) =>
    b.credits.some((c) => c.role === "full_cast"),
  ).length;
  const multiNarratorBooks = knownBooks.filter((b) =>
    b.credits.some((c) => c.role === "co_narrator"),
  ).length;
  const singleNarratorBooks = knownBooks.length - fullCastBooks - multiNarratorBooks;
  const hh = knownBooks.filter((b) => b.externalBookId.startsWith("HH-")).length;
  const w40k = knownBooks.filter((b) => b.externalBookId.startsWith("W40K-")).length;

  console.log(`\n=== audiobook-narrators apply summary${dryRun ? " [DRY RUN]" : ""} ===`);
  console.log(`Books resolved:            ${knownBooks.length}/${books.length}  (HH ${hh} / W40K ${w40k})`);
  console.log(`Persons ${dryRun ? "to create" : "newly created"}:    ${personsCreated} (of ${wantedSlugs.length} distinct)`);
  console.log(`work_persons rows ${dryRun ? "to write" : "written"}:  ${rowsWritten}`);
  console.log(`  single-narrator: ${singleNarratorBooks}   multi-narrator: ${multiNarratorBooks}   full-cast: ${fullCastBooks}`);
  console.log(`Audit entries (not applied): ${sidecar.audit?.length ?? 0}`);
  if (unknown.length > 0) {
    console.log(`Unknown externalBookId (skipped): ${unknown.length} → ${unknown.join(", ")}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
