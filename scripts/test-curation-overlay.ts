/**
 * test-curation-overlay.ts — Brief 149. Validator + precedence + idempotency.
 *
 * No test framework: node:assert/strict + one console line per case, same
 * pattern as scripts/test-audiobook-narrators.ts. Run via
 * `npm run test:curation-overlay`. DB-FREE → CI/local safe, and the
 * **precedence/idempotency proof runs here, not against prod** (Brief 149
 * DB-freeze: the guarantee is proved by Unit-Integration, never a prod mutation).
 *
 * Three parts:
 *   1. The committed sidecar is structurally valid against the real reference
 *      seed JSONs.
 *   2. The validator rejects malformed/ambiguous overlays (synthetic bad input).
 *   3. PRECEDENCE + IDEMPOTENCY over an in-memory junction store, using the SAME
 *      `computeBookOps` the apply path uses, plus a faithful simulation of the
 *      auto path's delete-then-insert-keyed-on-workId (apply-override.ts
 *      :1010-1049). This proves: a hand fix is wiped by a re-apply WITHOUT the
 *      tail, and RESTORED by re-running the tail — for both additions and
 *      suppressions and a field fix — and that a second tail apply is a no-op.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import process from "node:process";

import type { BannedPattern } from "./apply-override-synopsis-lint";
import {
  computeBookOps,
  diffBookOps,
  isRunOk,
  validateOverlay,
  type CurrentBookState,
  type EntityAxis,
  type OverlayBook,
  type RefSets,
} from "./curation-overlay";

// =============================================================================
// Reference sets from the committed seed JSONs (real ids).
// =============================================================================

function idSet(file: string): Set<string> {
  const rows = JSON.parse(
    readFileSync(new URL(`seed-data/${file}`, import.meta.url), "utf8"),
  ) as Array<{ id: string }>;
  return new Set(rows.map((r) => r.id));
}

const refs: RefSets = {
  factionIds: idSet("factions.json"),
  locationIds: idSet("locations.json"),
  characterIds: idSet("characters.json"),
  eraIds: idSet("eras.json"),
  bookFormats: new Set([
    "novel",
    "novella",
    "short_story",
    "anthology",
    "audio_drama",
    "omnibus",
    "collection",
    "artbook",
    "scriptbook",
  ]),
};

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

// =============================================================================
// 1. Committed sidecar is valid.
// =============================================================================

console.log("curation-overlay.json — structural validation");

const committed = JSON.parse(
  readFileSync(new URL("seed-data/curation-overlay.json", import.meta.url), "utf8"),
) as unknown;

check("committed sidecar is structurally + semantically valid", () => {
  const overlay = validateOverlay(committed, refs);
  assert.ok(overlay.final.books.length > 0, "expected at least one final book");
});

check("committed sidecar separates final (applied) from reviewQueue (carried)", () => {
  const overlay = validateOverlay(committed, refs);
  const finalIds = new Set(overlay.final.books.map((b) => b.externalBookId));
  const queueIds = new Set((overlay.reviewQueue?.books ?? []).map((b) => b.externalBookId));
  assert.ok(overlay.reviewQueue !== undefined, "expected a reviewQueue section");
  // reviewQueue book ids are NOT in final → never applied.
  for (const id of queueIds) {
    assert.ok(!finalIds.has(id), `reviewQueue book ${id} must not also be in final`);
  }
});

check("reviewQueue is NOT reference-checked (proposal may name an unknown id)", () => {
  // The committed reviewQueue intentionally references `titus_endor`, which is
  // not a known character id — a proposal awaiting promotion. final reference
  // checks would reject it; reviewQueue must not.
  const overlay = validateOverlay(committed, refs);
  const proposed = overlay.reviewQueue?.books[0]?.characters?.add?.[0]?.id;
  assert.equal(proposed, "titus_endor");
  assert.ok(!refs.characterIds.has("titus_endor"), "fixture assumes titus_endor is unknown");
});

// =============================================================================
// 2. Validator rejects malformed input.
// =============================================================================

console.log("");
console.log("validator — malformed/ambiguous overlays throw before any mutation");

/** A minimal valid `final`-only overlay we can mutate per negative case. */
function baseOverlay(): Record<string, unknown> {
  return {
    final: {
      books: [
        {
          externalBookId: "W40K-0010",
          factions: {
            add: [
              {
                id: "ordo_malleus",
                role: "supporting",
                sourceKind: "manual",
                confidence: 0.9,
                checkedAt: "2026-06-14",
              },
            ],
            remove: [
              {
                id: "chaos",
                sourceKind: "manual",
                checkedAt: "2026-06-14",
                note: "trim",
              },
            ],
          },
          fields: {
            format: {
              value: "collection",
              sourceKind: "manual",
              confidence: 1,
              checkedAt: "2026-06-14",
            },
          },
        },
      ],
    },
  };
}

function clone(o: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(o)) as Record<string, unknown>;
}
// Typed reach into the first final book for negative-case mutation.
function firstBook(o: Record<string, unknown>): Record<string, unknown> {
  return (o.final as { books: Record<string, unknown>[] }).books[0]!;
}

check("base overlay is valid (sanity)", () => {
  validateOverlay(baseOverlay(), refs);
});

check("rejects a missing final section", () => {
  assert.throws(() => validateOverlay({ reviewQueue: { books: [] } }, refs), /final is required/);
});

check("rejects a malformed externalBookId", () => {
  const o = clone(baseOverlay());
  firstBook(o).externalBookId = "W40K-1";
  assert.throws(() => validateOverlay(o, refs), /externalBookId must match/);
});

check("rejects a duplicate book in final", () => {
  const o = clone(baseOverlay());
  (o.final as { books: unknown[] }).books.push(firstBook(clone(baseOverlay())));
  assert.throws(() => validateOverlay(o, refs), /duplicate externalBookId/);
});

check("rejects an unknown book key (stray facets key)", () => {
  const o = clone(baseOverlay());
  firstBook(o).facets = { add: [] };
  assert.throws(() => validateOverlay(o, refs), /unknown key "facets"/);
});

check("rejects an unknown axis key", () => {
  const o = clone(baseOverlay());
  (firstBook(o).factions as Record<string, unknown>).replace = [];
  assert.throws(() => validateOverlay(o, refs), /not a known key/);
});

check("rejects an unknown faction role", () => {
  const o = clone(baseOverlay());
  ((firstBook(o).factions as { add: Record<string, unknown>[] }).add[0]!).role = "background";
  assert.throws(() => validateOverlay(o, refs), /must be one of/);
});

check("rejects an add id that is not a known reference id (final)", () => {
  const o = clone(baseOverlay());
  ((firstBook(o).factions as { add: Record<string, unknown>[] }).add[0]!).id = "not_a_faction";
  assert.throws(() => validateOverlay(o, refs), /not a known faction reference id/);
});

check("rejects the same id in both add and remove", () => {
  const o = clone(baseOverlay());
  ((firstBook(o).factions as { add: Record<string, unknown>[] }).add[0]!).id = "chaos";
  assert.throws(() => validateOverlay(o, refs), /appears in both add and remove/);
});

check("rejects a suppression with no reason (note)", () => {
  const o = clone(baseOverlay());
  delete (firstBook(o).factions as { remove: Record<string, unknown>[] }).remove[0]!.note;
  assert.throws(() => validateOverlay(o, refs), /note \(reason\) is required/);
});

check("rejects an add confidence outside [0,1]", () => {
  const o = clone(baseOverlay());
  ((firstBook(o).factions as { add: Record<string, unknown>[] }).add[0]!).confidence = 2;
  assert.throws(() => validateOverlay(o, refs), /confidence must be a number in \[0,1\]/);
});

check("rejects a non-ISO checkedAt", () => {
  const o = clone(baseOverlay());
  ((firstBook(o).factions as { add: Record<string, unknown>[] }).add[0]!).checkedAt = "yesterday";
  assert.throws(() => validateOverlay(o, refs), /checkedAt must be an ISO date/);
});

check("rejects an invalid book_format value", () => {
  const o = clone(baseOverlay());
  ((firstBook(o).fields as { format: Record<string, unknown> }).format).value = "graphic_novel";
  assert.throws(() => validateOverlay(o, refs), /not a valid book_format/);
});

check("rejects an unknown primaryEraId", () => {
  const o = clone(baseOverlay());
  (firstBook(o).fields as Record<string, unknown>).primaryEraId = {
    value: "age_of_vibes",
    sourceKind: "manual",
    confidence: 1,
    checkedAt: "2026-06-14",
  };
  assert.throws(() => validateOverlay(o, refs), /not a known era id/);
});

check("rejects an unwritable field", () => {
  const o = clone(baseOverlay());
  (firstBook(o).fields as Record<string, unknown>).releaseYear = {
    value: "1999",
    sourceKind: "manual",
    confidence: 1,
    checkedAt: "2026-06-14",
  };
  assert.throws(() => validateOverlay(o, refs), /not a writable field/);
});

check("rejects a synopsis carrying a banned public-forward pattern", () => {
  const banned: BannedPattern[] = [
    { kind: "substring", value: "Recommended for", label: "rec-for" },
  ];
  const o = clone(baseOverlay());
  (firstBook(o).fields as Record<string, unknown>).synopsis = {
    value: "Recommended for fans of grimdark.",
    sourceKind: "manual",
    confidence: 1,
    checkedAt: "2026-06-14",
  };
  assert.throws(
    () => validateOverlay(o, refs, { bannedSynopsisPatterns: banned }),
    /banned public-forward pattern/,
  );
});

check("rejects an empty book entry", () => {
  const o = clone(baseOverlay());
  const b = firstBook(o);
  delete b.factions;
  delete b.fields;
  assert.throws(() => validateOverlay(o, refs), /empty entry/);
});

check("rejects a book that appears in both final and reviewQueue", () => {
  // Promotion MOVES an entry from reviewQueue to final; a book in both is
  // ambiguous (decided or proposed?) and must halt before any mutation.
  const o = clone(baseOverlay());
  o.reviewQueue = { books: [firstBook(clone(baseOverlay()))] };
  assert.throws(() => validateOverlay(o, refs), /also in final/);
});

// =============================================================================
// 2b. isRunOk — the shared apply/dry-run/verify success gate (pure, DB-free).
// =============================================================================

console.log("");
console.log("isRunOk — unresolved final book fails every mode; verify also gated on diffs");

check("isRunOk: apply/dry-run OK when verify not asked and all books resolved", () => {
  assert.equal(isRunOk(false, true, 0), true);
});

check("isRunOk: an unresolved final book fails apply/dry-run AND verify", () => {
  assert.equal(isRunOk(false, true, 1), false); // apply / dry-run
  assert.equal(isRunOk(true, true, 1), false); // verify
});

check("isRunOk: verify fails when a diff is not satisfied (even if all resolved)", () => {
  assert.equal(isRunOk(true, false, 0), false);
});

// =============================================================================
// 3. PRECEDENCE + IDEMPOTENCY — in-memory junction store.
// =============================================================================

console.log("");
console.log("precedence + idempotency — in-memory store (no DB, no prod)");

interface MutableState {
  edges: Record<EntityAxis, Map<string, string>>; // id -> role
  fields: { synopsis: string | null; format: string | null; primaryEraId: string | null };
}

function emptyState(): MutableState {
  return {
    edges: { factions: new Map(), locations: new Map(), characters: new Map() },
    fields: { synopsis: null, format: null, primaryEraId: null },
  };
}

/**
 * Faithful simulation of the AUTO path (apply-override.ts:1010-1049): per book it
 * deletes ALL junction rows for the workId then re-inserts straight from the
 * batch file. Fields are stamped from the SSOT roster (format) / the constant
 * M41 era (primaryEraId — the OQ-16b overstamp). This is exactly what a resolver
 * wave / consolidation pass / `db:rebuild` does.
 */
function simulateAutoApply(state: MutableState): void {
  state.edges.factions = new Map([
    ["inquisition", "primary"],
    ["ordo_xenos", "primary"],
    ["chaos", "antagonist"],
  ]);
  state.edges.locations = new Map([["scarus", "primary"]]);
  state.edges.characters = new Map([["gregor_eisenhorn", "pov"]]);
  state.fields = { synopsis: "auto synopsis", format: "novel", primaryEraId: "time_ending" };
}

/** The overlay tail — same row math as applyBookOps (remove, then upsert, then field-write). */
function applyTail(state: MutableState, book: OverlayBook): void {
  const ops = computeBookOps(book);
  for (const r of ops.edgeRemoves) state.edges[r.axis].delete(r.id);
  for (const a of ops.edgeAdds) state.edges[a.axis].set(a.id, a.role);
  for (const f of ops.fieldWrites) state.fields[f.field] = f.value;
}

/** Snapshot for current-state diffing (mirrors loadCurrentState). */
function snapshot(state: MutableState): CurrentBookState {
  return {
    edges: {
      factions: new Map(state.edges.factions),
      locations: new Map(state.edges.locations),
      characters: new Map(state.edges.characters),
    },
    fields: { ...state.fields },
  };
}

// A hand fix exercising all three: add ordo_malleus, suppress chaos, fix format.
const handBook: OverlayBook = {
  externalBookId: "W40K-0010",
  factions: {
    add: [
      {
        id: "ordo_malleus",
        role: "supporting",
        sourceKind: "manual",
        confidence: 0.9,
        checkedAt: "2026-06-14",
      },
    ],
    remove: [{ id: "chaos", sourceKind: "manual", checkedAt: "2026-06-14", note: "trim" }],
  },
  fields: {
    format: { value: "collection", sourceKind: "manual", confidence: 1, checkedAt: "2026-06-14" },
  },
};

// Validate the hand fix the same way the apply would (final, ref-checked).
check("hand-fix book validates (add + remove + field)", () => {
  validateOverlay({ final: { books: [handBook] } }, refs);
});

const ops = computeBookOps(handBook);

check("computeBookOps yields 1 add, 1 remove, 1 field-write", () => {
  assert.equal(ops.edgeAdds.length, 1);
  assert.equal(ops.edgeRemoves.length, 1);
  assert.equal(ops.fieldWrites.length, 1);
});

const state = emptyState();
simulateAutoApply(state);

check("after auto-apply: chaos present, ordo_malleus absent, format=novel", () => {
  assert.equal(state.edges.factions.get("chaos"), "antagonist");
  assert.equal(state.edges.factions.has("ordo_malleus"), false);
  assert.equal(state.fields.format, "novel");
});

check("diff before tail: 3 changes, not satisfied", () => {
  const diff = diffBookOps(ops, snapshot(state));
  assert.equal(diff.changes, 3, "add + remove + field are all pending");
  assert.equal(diff.satisfied, false);
});

applyTail(state, handBook);

check("after tail: ordo_malleus added, chaos suppressed, format=collection", () => {
  assert.equal(state.edges.factions.get("ordo_malleus"), "supporting");
  assert.equal(state.edges.factions.has("chaos"), false);
  assert.equal(state.fields.format, "collection");
});

check("diff after tail: 0 changes, satisfied (the --verify post-condition)", () => {
  const diff = diffBookOps(ops, snapshot(state));
  assert.equal(diff.changes, 0);
  assert.equal(diff.satisfied, true);
});

check("idempotency: a second tail apply changes nothing", () => {
  const before = JSON.stringify({
    f: [...state.edges.factions],
    fields: state.fields,
  });
  applyTail(state, handBook);
  const after = JSON.stringify({
    f: [...state.edges.factions],
    fields: state.fields,
  });
  assert.equal(after, before, "second apply is a no-op");
  const diff = diffBookOps(ops, snapshot(state));
  assert.equal(diff.changes, 0);
});

check("WITHOUT the tail a resolver wave WIPES the hand fix (this is why a tail is needed)", () => {
  simulateAutoApply(state); // a fresh wave / db:rebuild re-applies the batch
  assert.equal(state.edges.factions.get("chaos"), "antagonist", "suppressed edge came back");
  assert.equal(state.edges.factions.has("ordo_malleus"), false, "added edge wiped");
  assert.equal(state.fields.format, "novel", "field overstamped");
  const diff = diffBookOps(ops, snapshot(state));
  assert.equal(diff.satisfied, false, "verify would now FAIL — drift detected");
});

check("THE GUARANTEE: re-running the tail RESTORES the hand fix (precedence)", () => {
  applyTail(state, handBook);
  assert.equal(state.edges.factions.get("ordo_malleus"), "supporting");
  assert.equal(state.edges.factions.has("chaos"), false);
  assert.equal(state.fields.format, "collection");
  const diff = diffBookOps(ops, snapshot(state));
  assert.equal(diff.satisfied, true, "verify green after reset + re-applied tail");
});

console.log("");
console.log(
  "precedence proof: hand fix wiped by a wave, restored by the tail; second apply a no-op.",
);
console.log("");
console.log(`# pass ${pass}`);
console.log(`# fail ${fail}`);
if (fail > 0) process.exit(1);
