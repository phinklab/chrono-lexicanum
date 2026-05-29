/**
 * Standalone validator for scripts/seed-data/audiobook-narrators.json (Brief 105).
 *
 * No test framework: node:assert/strict + one console line per case, same
 * pattern as scripts/test-apply-override-collections.ts. Run via
 * `npm run test:audiobook-narrators`. DB-free → CI/local safe.
 *
 * Asserts the committed sidecar is structurally valid AND exercises the
 * validation rules with synthetic bad inputs. The rules mirror the apply-time
 * guard in scripts/apply-audiobook-narrators.ts (kept independent on purpose:
 * the apply script runs main() on import, so its validator can't be imported —
 * this re-asserts the same invariants as a cheap cross-check).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import process from "node:process";

import { slugifyPerson } from "@/lib/seed/persons";

const AUDIO_ROLES = new Set(["narrator", "co_narrator", "full_cast"]);
const EXTERNAL_ID_RE = /^(?:W40K|HH)-\d{4}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface Credit {
  name: string;
  role: string;
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
}
interface Sidecar {
  books: BookEntry[];
  audit?: AuditEntry[];
}

/** Throws on the first structural problem; returns the parsed sidecar. */
function validateSidecar(raw: Sidecar): Sidecar {
  assert.ok(Array.isArray(raw.books), "books[] must be an array");
  assert.ok(raw.audit === undefined || Array.isArray(raw.audit), "audit must be an array when present");

  const seenBookId = new Set<string>();
  for (const [bi, book] of raw.books.entries()) {
    const at = `books[${bi}] (${book?.externalBookId ?? "?"})`;
    assert.ok(
      typeof book.externalBookId === "string" && EXTERNAL_ID_RE.test(book.externalBookId),
      `${at}: externalBookId must match ${EXTERNAL_ID_RE}`,
    );
    assert.ok(!seenBookId.has(book.externalBookId), `${at}: duplicate externalBookId`);
    seenBookId.add(book.externalBookId);

    assert.ok(
      Array.isArray(book.credits) && book.credits.length > 0,
      `${at}: credits[] must be a non-empty array`,
    );

    const seenPersonRole = new Set<string>();
    for (const [ci, c] of book.credits.entries()) {
      const cat = `${at} credits[${ci}]`;
      assert.ok(typeof c.name === "string" && c.name.trim() !== "", `${cat}: name required`);
      assert.ok(AUDIO_ROLES.has(c.role), `${cat}: role "${c.role}" must be narrator|co_narrator|full_cast`);
      assert.ok(typeof c.sourceUrl === "string" && c.sourceUrl.trim() !== "", `${cat}: sourceUrl required`);
      assert.ok(typeof c.checkedAt === "string" && ISO_DATE_RE.test(c.checkedAt), `${cat}: checkedAt must be YYYY-MM-DD`);
      assert.ok(
        typeof c.confidence === "number" && c.confidence >= 0 && c.confidence <= 1,
        `${cat}: confidence must be a number in [0,1]`,
      );
      const slug = slugifyPerson(c.name);
      assert.ok(slug !== "", `${cat}: name "${c.name}" slugifies to empty`);
      const key = `${slug}::${c.role}`;
      assert.ok(!seenPersonRole.has(key), `${cat}: duplicate (person, role) ${c.name}/${c.role}`);
      seenPersonRole.add(key);
    }
  }

  for (const [ai, a] of (raw.audit ?? []).entries()) {
    const at = `audit[${ai}] (${a?.externalBookId ?? "?"})`;
    assert.ok(
      typeof a.externalBookId === "string" && EXTERNAL_ID_RE.test(a.externalBookId),
      `${at}: externalBookId must match ${EXTERNAL_ID_RE}`,
    );
    assert.ok(
      a.status === "no_audiobook" || a.status === "audiobook_no_named_credits",
      `${at}: status must be no_audiobook|audiobook_no_named_credits`,
    );
  }
  return raw;
}

let pass = 0;
let fail = 0;
function check(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`ok - ${name}`);
    pass += 1;
  } catch (e) {
    console.error(`not ok - ${name}`);
    console.error(`  ${e instanceof Error ? e.message : String(e)}`);
    fail += 1;
  }
}

/** Deep-clone the committed sidecar so negative cases can mutate freely. */
function clone(s: Sidecar): Sidecar {
  return JSON.parse(JSON.stringify(s)) as Sidecar;
}

console.log("audiobook-narrators.json — structural validation");

const sidecar = JSON.parse(
  readFileSync(new URL("seed-data/audiobook-narrators.json", import.meta.url), "utf8"),
) as Sidecar;

check("committed sidecar is structurally valid", () => {
  validateSidecar(sidecar);
});

check("committed sidecar has the expected shape (books + audit non-empty)", () => {
  assert.ok(sidecar.books.length > 0, "expected at least one book");
  assert.ok(Array.isArray(sidecar.audit), "expected an audit[] array");
});

check("every credit role is one of the three audio roles", () => {
  for (const b of sidecar.books) {
    for (const c of b.credits) assert.ok(AUDIO_ROLES.has(c.role));
  }
});

check("rejects an unknown role", () => {
  const bad = clone(sidecar);
  bad.books[0]!.credits[0]!.role = "author";
  assert.throws(() => validateSidecar(bad), /must be narrator/);
});

check("rejects a duplicate externalBookId", () => {
  const bad = clone(sidecar);
  bad.books.push(clone(sidecar).books[0]!);
  assert.throws(() => validateSidecar(bad), /duplicate externalBookId/);
});

check("rejects a malformed externalBookId", () => {
  const bad = clone(sidecar);
  bad.books[0]!.externalBookId = "HH-1"; // not 4 digits
  assert.throws(() => validateSidecar(bad), /externalBookId must match/);
});

check("rejects a missing sourceUrl", () => {
  const bad = clone(sidecar);
  // @ts-expect-error — intentionally drop a required field
  delete bad.books[0]!.credits[0]!.sourceUrl;
  assert.throws(() => validateSidecar(bad), /sourceUrl required/);
});

check("rejects a confidence outside [0,1]", () => {
  const bad = clone(sidecar);
  bad.books[0]!.credits[0]!.confidence = 1.5;
  assert.throws(() => validateSidecar(bad), /confidence must be/);
});

check("rejects a non-ISO checkedAt", () => {
  const bad = clone(sidecar);
  bad.books[0]!.credits[0]!.checkedAt = "May 29 2026";
  assert.throws(() => validateSidecar(bad), /checkedAt must be/);
});

check("rejects an empty credits[] array", () => {
  const bad = clone(sidecar);
  bad.books[0]!.credits = [];
  assert.throws(() => validateSidecar(bad), /non-empty array/);
});

check("rejects a duplicate (person, role) within one book", () => {
  const bad = clone(sidecar);
  const c = bad.books[0]!.credits[0]!;
  bad.books[0]!.credits.push({ ...c });
  assert.throws(() => validateSidecar(bad), /duplicate \(person, role\)/);
});

check("rejects an unknown audit status", () => {
  const bad = clone(sidecar);
  assert.ok(bad.audit && bad.audit.length > 0, "fixture needs an audit entry");
  bad.audit[0]!.status = "maybe";
  assert.throws(() => validateSidecar(bad), /status must be/);
});

console.log("");
console.log(`# pass ${pass}`);
console.log(`# fail ${fail}`);
if (fail > 0) process.exit(1);
