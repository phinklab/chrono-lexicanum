/**
 * Standalone unit test for scripts/apply-override-collections.ts (Brief 091).
 *
 * No test framework: node:assert/strict + one console line per case, same
 * pattern as scripts/test-synopsis-lint.ts. Run via `npm run test:collection-refs`.
 *
 * Exercises both branches of the range-aware forward-ref guard:
 *   (i)   legit in-range forward ref (collection in an earlier batch, content
 *         in a later but applied batch) → counted in forwardRefs, NOT unresolvable,
 *   (ii)  out-of-range constituent (collection applied, content a known roster
 *         book that is not applied) → one unresolvable ref, reason "out-of-range",
 *   (iii) unknown constituent (collection applied, content absent from roster)
 *         → one unresolvable ref, reason "unknown-work",
 *   plus same-batch / backward-ref / collection-not-applied / mixed edge cases.
 */
import assert from "node:assert/strict";
import process from "node:process";

import {
  analyzeCollections,
  type RosterCollection,
  type RosterFile,
} from "./apply-override-collections";

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

function roster(bookIds: string[], collections: RosterCollection[]): RosterFile {
  return {
    books: bookIds.map((externalBookId) => ({ externalBookId })),
    collections,
  };
}

function applied(entries: Record<string, string>): Map<string, string> {
  return new Map(Object.entries(entries));
}

console.log("analyzeCollections — range-aware forward-ref guard");

check("legit in-range forward ref: counted in forwardRefs, not unresolvable", () => {
  const r = roster(
    ["W40K-A", "W40K-B"],
    [{ collectionExternalId: "W40K-A", contentExternalId: "W40K-B" }],
  );
  const a = analyzeCollections(
    r,
    applied({ "W40K-A": "ssot-w40k-001", "W40K-B": "ssot-w40k-002" }),
  );
  assert.equal(
    a.forwardRefs.length,
    1,
    "collection in an earlier batch than its content is a legit forward ref",
  );
  assert.equal(a.crossBatchResolvable.length, 1);
  assert.equal(a.newResolvable, 1);
  assert.deepEqual(a.unresolvableConstituentRefs, []);
});

check("out-of-range constituent: one ref, reason out-of-range", () => {
  const r = roster(
    ["W40K-A", "W40K-C"], // W40K-C is a known roster book...
    [{ collectionExternalId: "W40K-A", contentExternalId: "W40K-C" }],
  );
  const a = analyzeCollections(r, applied({ "W40K-A": "ssot-w40k-001" })); // ...but not applied
  assert.equal(a.unresolvableConstituentRefs.length, 1);
  assert.equal(a.unresolvableConstituentRefs[0]?.reason, "out-of-range");
  assert.equal(
    a.unresolvableConstituentRefs[0]?.collection.contentExternalId,
    "W40K-C",
  );
  assert.equal(a.forwardRefs.length, 0, "content not applied → no forward ref");
});

check("unknown constituent: one ref, reason unknown-work", () => {
  const r = roster(
    ["W40K-A"], // W40K-ZZZ is absent from the roster entirely
    [{ collectionExternalId: "W40K-A", contentExternalId: "W40K-ZZZ" }],
  );
  const a = analyzeCollections(r, applied({ "W40K-A": "ssot-w40k-001" }));
  assert.equal(a.unresolvableConstituentRefs.length, 1);
  assert.equal(a.unresolvableConstituentRefs[0]?.reason, "unknown-work");
});

check("same-batch edge: oldSameBatchResolvable, no forward ref, no unresolvable", () => {
  const r = roster(
    ["W40K-A", "W40K-B"],
    [{ collectionExternalId: "W40K-A", contentExternalId: "W40K-B" }],
  );
  const a = analyzeCollections(
    r,
    applied({ "W40K-A": "ssot-w40k-001", "W40K-B": "ssot-w40k-001" }),
  );
  assert.equal(a.oldSameBatchResolvable, 1);
  assert.equal(a.forwardRefs.length, 0);
  assert.deepEqual(a.unresolvableConstituentRefs, []);
});

check("backward ref edge: collection later than content, both applied → not flagged", () => {
  // collection in a LATER batch than its content; the ascending sweep still
  // resolves it (content already applied) — not a forward ref, not unresolvable.
  const r = roster(
    ["W40K-A", "W40K-B"],
    [{ collectionExternalId: "W40K-A", contentExternalId: "W40K-B" }],
  );
  const a = analyzeCollections(
    r,
    applied({ "W40K-B": "ssot-w40k-001", "W40K-A": "ssot-w40k-002" }),
  );
  assert.equal(a.forwardRefs.length, 0);
  assert.equal(a.crossBatchResolvable.length, 1);
  assert.deepEqual(a.unresolvableConstituentRefs, []);
});

check("collection not applied → constituent side not checked", () => {
  // Only the constituent side of an APPLIED collection is a tripwire (the filter
  // requires appliedIds.has(collectionExternalId)). If the anthology itself is
  // not yet in range, its constituent is not flagged.
  const r = roster(
    ["W40K-A", "W40K-B"],
    [{ collectionExternalId: "W40K-A", contentExternalId: "W40K-B" }],
  );
  const a = analyzeCollections(r, applied({ "W40K-B": "ssot-w40k-001" }));
  assert.deepEqual(a.unresolvableConstituentRefs, []);
});

check("mixed: one legit forward ref + one out-of-range + one unknown", () => {
  const r = roster(
    ["ANTH-1", "NOV-1", "ANTH-2", "OOR-1"],
    [
      { collectionExternalId: "ANTH-1", contentExternalId: "NOV-1" }, // legit forward
      { collectionExternalId: "ANTH-2", contentExternalId: "OOR-1" }, // out-of-range
      { collectionExternalId: "ANTH-2", contentExternalId: "GHOST" }, // unknown
    ],
  );
  const a = analyzeCollections(
    r,
    applied({
      "ANTH-1": "ssot-w40k-001",
      "NOV-1": "ssot-w40k-002",
      "ANTH-2": "ssot-w40k-001",
    }),
  );
  assert.equal(a.forwardRefs.length, 1);
  const findings = a.unresolvableConstituentRefs
    .map((u) => `${u.collection.contentExternalId}:${u.reason}`)
    .sort();
  assert.deepEqual(findings, ["GHOST:unknown-work", "OOR-1:out-of-range"]);
});

console.log("");
console.log(`# pass ${pass}`);
console.log(`# fail ${fail}`);
if (fail > 0) process.exit(1);
