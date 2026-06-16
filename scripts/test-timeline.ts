/**
 * test-timeline.ts — Brief 152. DB-free proof of the timeline verify core.
 *
 * No test framework: node:assert/strict + one console line per case, same
 * pattern as scripts/test-curation-overlay.ts. Run via `npm run test:timeline`.
 * DB-FREE → CI/local safe, and under the Brief 149/152 DB-freeze it is the
 * TESTABLE HEART of the session: the verify post-condition is proven here over
 * synthetic expected/actual rows, never against prod.
 *
 * It exercises `diffTimelineState` (scripts/timeline-state.ts) — the pure
 * comparison `apply:timeline -- --verify` runs — across the happy path and every
 * mismatch class the verify must catch:
 *   - eras:        missing / stale / a retired era still present.
 *   - events:      missing / stale.
 *   - event_works: missing, extra, wrong targetType, wrong targetId, wrong role,
 *                  wrong displayLabel, wrong position, and the nonzero gate.
 *   - book-dates:  label / startY / endY / method / confidence / anchor drift,
 *                  and a named slug with no resolved DB row.
 *   - primary_era_id: a book_details row still on a retired era.
 */
import assert from "node:assert/strict";
import process from "node:process";

import {
  diffTimelineState,
  type ActualTimeline,
  type BookDateActual,
  type ExpectedTimeline,
  type HookRow,
  type Mismatch,
  type MismatchCategory,
} from "./timeline-state";

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
// Fixtures — a matched expected/actual pair (the happy path), then per-case
// mutations of a fresh clone.
// =============================================================================

const HOOKS: HookRow[] = [
  { eventId: "razing_of_monarchia", targetType: "work", targetId: "w1", role: "book", displayLabel: "PROLOGUE", position: 0 },
  { eventId: "razing_of_monarchia", targetType: "series", targetId: "gaunts_ghosts", role: "book", displayLabel: null, position: 1 },
  { eventId: "fall_of_cadia", targetType: "work", targetId: "w2", role: "podcast", displayLabel: "EP. 112", position: 0 },
];

function baseExpected(): ExpectedTimeline {
  return {
    eraIds: new Set(["great_crusade", "horus_heresy", "indomitus"]),
    eventIds: new Set(["razing_of_monarchia", "fall_of_cadia"]),
    hooks: HOOKS.map((h) => ({ ...h })),
    bookDates: [
      {
        slug: "the-last-church",
        settingDateLabel: "730.M30",
        startY: 30730,
        endY: 30730,
        settingMethod: "roster",
        settingConfidence: "M",
        settingAnchorEventId: "unification_wars",
      },
    ],
  };
}

function baseActual(): ActualTimeline {
  return {
    eraIds: new Set(["great_crusade", "horus_heresy", "indomitus"]),
    eventIds: new Set(["razing_of_monarchia", "fall_of_cadia"]),
    hooks: HOOKS.map((h) => ({ ...h })),
    bookDateBySlug: new Map<string, BookDateActual>([
      [
        "the-last-church",
        {
          settingDateLabel: "730.M30",
          startY: 30730,
          endY: 30730,
          settingMethod: "roster",
          settingConfidence: "M",
          settingAnchorEventId: "unification_wars",
        },
      ],
    ]),
    retiredPrimaryEraRefs: [],
  };
}

/** Mutate a fresh actual clone for a single negative case. */
function mutateActual(fn: (a: ActualTimeline) => ActualTimeline): Mismatch[] {
  return diffTimelineState(baseExpected(), fn(baseActual()));
}

function countIn(ms: Mismatch[], cat: MismatchCategory): number {
  return ms.filter((m) => m.category === cat).length;
}
function hasMessage(ms: Mismatch[], cat: MismatchCategory, re: RegExp): boolean {
  return ms.some((m) => m.category === cat && re.test(m.message));
}

// =============================================================================
// 1. Happy path.
// =============================================================================

console.log("diffTimelineState — happy path");

check("identical expected/actual → 0 mismatches", () => {
  assert.deepEqual(diffTimelineState(baseExpected(), baseActual()), []);
});

// =============================================================================
// 2. eras.
// =============================================================================

console.log("");
console.log("eras — missing / stale / retired-present");

check("era present in eras.json but missing from DB", () => {
  const ms = mutateActual((a) => {
    a.eraIds = new Set([...a.eraIds].filter((id) => id !== "indomitus"));
    return a;
  });
  assert.equal(countIn(ms, "eras"), 1);
  assert.ok(hasMessage(ms, "eras", /'indomitus'.*missing from DB/));
});

check("era present in DB but not in eras.json (stale)", () => {
  const ms = mutateActual((a) => {
    a.eraIds = new Set([...a.eraIds, "age_of_strife"]);
    return a;
  });
  assert.equal(countIn(ms, "eras"), 1);
  assert.ok(hasMessage(ms, "eras", /'age_of_strife'.*stale/));
});

check("a retired era still present is flagged distinctly", () => {
  const ms = mutateActual((a) => {
    a.eraIds = new Set([...a.eraIds, "long_war"]);
    return a;
  });
  assert.equal(countIn(ms, "eras"), 1);
  assert.ok(hasMessage(ms, "eras", /retired era 'long_war' is still present/));
});

// =============================================================================
// 3. events.
// =============================================================================

console.log("");
console.log("events — missing / stale");

check("event present in events.json but missing from DB", () => {
  const ms = mutateActual((a) => {
    a.eventIds = new Set([...a.eventIds].filter((id) => id !== "fall_of_cadia"));
    return a;
  });
  assert.equal(countIn(ms, "events"), 1);
  assert.ok(hasMessage(ms, "events", /'fall_of_cadia'.*missing from DB/));
});

check("event present in DB but not in events.json (stale)", () => {
  const ms = mutateActual((a) => {
    a.eventIds = new Set([...a.eventIds, "battle_of_terra"]);
    return a;
  });
  assert.equal(countIn(ms, "events"), 1);
  assert.ok(hasMessage(ms, "events", /'battle_of_terra'.*stale/));
});

// =============================================================================
// 4. event_works.
// =============================================================================

console.log("");
console.log("event_works — missing / extra / tuple drift / label / position / nonzero");

check("hook missing from DB", () => {
  const ms = mutateActual((a) => {
    a.hooks = a.hooks.filter((h) => !(h.eventId === "fall_of_cadia"));
    return a;
  });
  assert.equal(countIn(ms, "event_works"), 1);
  assert.ok(hasMessage(ms, "event_works", /hook missing from DB.*fall_of_cadia/));
});

check("stray hook in DB not in event-works.json", () => {
  const ms = mutateActual((a) => {
    a.hooks = [
      ...a.hooks,
      { eventId: "fall_of_cadia", targetType: "work", targetId: "w99", role: "book", displayLabel: null, position: 9 },
    ];
    return a;
  });
  assert.equal(countIn(ms, "event_works"), 1);
  assert.ok(hasMessage(ms, "event_works", /stray hook in DB.*w99/));
});

check("wrong targetType → missing (expected) + stray (actual)", () => {
  const ms = mutateActual((a) => {
    a.hooks = a.hooks.map((h) =>
      h.eventId === "fall_of_cadia" ? { ...h, targetType: "series" as const } : h,
    );
    return a;
  });
  // expected work-hook absent + actual series-hook unexpected
  assert.equal(countIn(ms, "event_works"), 2);
  assert.ok(hasMessage(ms, "event_works", /missing from DB.*work:w2/));
  assert.ok(hasMessage(ms, "event_works", /stray hook.*series:w2/));
});

check("wrong targetId → missing + stray", () => {
  const ms = mutateActual((a) => {
    a.hooks = a.hooks.map((h) =>
      h.eventId === "fall_of_cadia" ? { ...h, targetId: "w_wrong" } : h,
    );
    return a;
  });
  assert.equal(countIn(ms, "event_works"), 2);
  assert.ok(hasMessage(ms, "event_works", /missing from DB.*work:w2/));
  assert.ok(hasMessage(ms, "event_works", /stray hook.*work:w_wrong/));
});

check("wrong role → missing + stray", () => {
  const ms = mutateActual((a) => {
    a.hooks = a.hooks.map((h) =>
      h.eventId === "fall_of_cadia" ? { ...h, role: "book" } : h,
    );
    return a;
  });
  assert.equal(countIn(ms, "event_works"), 2);
  assert.ok(hasMessage(ms, "event_works", /missing from DB.*\(podcast\)/));
  assert.ok(hasMessage(ms, "event_works", /stray hook.*\(book\)/));
});

check("wrong displayLabel → label drift (tuple still matches)", () => {
  const ms = mutateActual((a) => {
    a.hooks = a.hooks.map((h) =>
      h.eventId === "razing_of_monarchia" && h.targetId === "w1"
        ? { ...h, displayLabel: "EPILOGUE" }
        : h,
    );
    return a;
  });
  assert.equal(countIn(ms, "event_works"), 1);
  assert.ok(hasMessage(ms, "event_works", /displayLabel drift/));
});

check("wrong position → position drift (tuple still matches)", () => {
  const ms = mutateActual((a) => {
    a.hooks = a.hooks.map((h) =>
      h.eventId === "razing_of_monarchia" && h.targetId === "w1" ? { ...h, position: 7 } : h,
    );
    return a;
  });
  assert.equal(countIn(ms, "event_works"), 1);
  assert.ok(hasMessage(ms, "event_works", /position drift.*expected 0, DB 7/));
});

check("nonzero gate: an empty expected hook set fails", () => {
  const expected = baseExpected();
  expected.hooks = [];
  const actual = baseActual();
  actual.hooks = [];
  const ms = diffTimelineState(expected, actual);
  assert.ok(hasMessage(ms, "event_works", /expected hook set is empty/));
});

// =============================================================================
// 5. book-dates.
// =============================================================================

console.log("");
console.log("book-dates — per-field drift + a slug with no resolved DB row");

function withBookDate(patch: Partial<BookDateActual>): Mismatch[] {
  return mutateActual((a) => {
    const cur = a.bookDateBySlug.get("the-last-church")!;
    a.bookDateBySlug = new Map([["the-last-church", { ...cur, ...patch }]]);
    return a;
  });
}

check("settingDateLabel drift", () => {
  const ms = withBookDate({ settingDateLabel: "999.M41" });
  assert.equal(countIn(ms, "book_dates"), 1);
  assert.ok(hasMessage(ms, "book_dates", /settingDateLabel expected "730.M30", DB "999.M41"/));
});

check("startY drift", () => {
  const ms = withBookDate({ startY: 41999 });
  assert.equal(countIn(ms, "book_dates"), 1);
  assert.ok(hasMessage(ms, "book_dates", /startY expected 30730, DB 41999/));
});

check("endY drift", () => {
  const ms = withBookDate({ endY: 41999 });
  assert.equal(countIn(ms, "book_dates"), 1);
  assert.ok(hasMessage(ms, "book_dates", /endY expected 30730, DB 41999/));
});

check("settingMethod drift", () => {
  const ms = withBookDate({ settingMethod: "explicit" });
  assert.equal(countIn(ms, "book_dates"), 1);
  assert.ok(hasMessage(ms, "book_dates", /settingMethod expected "roster", DB "explicit"/));
});

check("settingConfidence drift", () => {
  const ms = withBookDate({ settingConfidence: "H" });
  assert.equal(countIn(ms, "book_dates"), 1);
  assert.ok(hasMessage(ms, "book_dates", /settingConfidence expected "M", DB "H"/));
});

check("settingAnchorEventId drift (to null)", () => {
  const ms = withBookDate({ settingAnchorEventId: null });
  assert.equal(countIn(ms, "book_dates"), 1);
  assert.ok(hasMessage(ms, "book_dates", /settingAnchorEventId expected "unification_wars", DB ∅/));
});

check("a named slug with no resolved DB row", () => {
  const ms = mutateActual((a) => {
    a.bookDateBySlug = new Map();
    return a;
  });
  assert.equal(countIn(ms, "book_dates"), 1);
  assert.ok(hasMessage(ms, "book_dates", /slug 'the-last-church' has no resolved DB row/));
});

// =============================================================================
// 6. primary_era_id.
// =============================================================================

console.log("");
console.log("primary_era_id — a book_details row still on a retired era");

check("retired primary era ref is flagged", () => {
  const ms = mutateActual((a) => {
    a.retiredPrimaryEraRefs = [{ workId: "w42", primaryEraId: "long_war" }];
    return a;
  });
  assert.equal(countIn(ms, "primary_era_id"), 1);
  assert.ok(hasMessage(ms, "primary_era_id", /work w42.*retired era 'long_war'/));
});

check("multiple independent mismatches accumulate across categories", () => {
  const ms = mutateActual((a) => {
    a.eraIds = new Set([...a.eraIds, "long_war"]);
    a.hooks = a.hooks.filter((h) => h.eventId !== "fall_of_cadia");
    a.retiredPrimaryEraRefs = [{ workId: "w42", primaryEraId: "long_war" }];
    return a;
  });
  assert.equal(countIn(ms, "eras"), 1);
  assert.equal(countIn(ms, "event_works"), 1);
  assert.equal(countIn(ms, "primary_era_id"), 1);
});

// =============================================================================

console.log("");
console.log(`# pass ${pass}`);
console.log(`# fail ${fail}`);
if (fail > 0) process.exit(1);
