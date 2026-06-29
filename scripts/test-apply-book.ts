/**
 * Unit test for the per-book apply path (Brief 170 Teil A) — the legacy-
 * equivalence-critical surface of scripts/book-apply-shared.ts + the per-book
 * collection-ownership semantics of scripts/apply-book.ts. Run via
 * `npm run test:apply-book`.
 *
 * DB-free by design. book-apply-shared.ts / seed-prolog.ts statically import
 * `@/db/client`, which THROWS at import time if DATABASE_URL is unset. So we set
 * a STUB DATABASE_URL first, then DYNAMICALLY import those modules — postgres.js
 * connects lazily (no socket until a query runs), and these tests never run a
 * query. This is why the npm script carries NO `--env-file`: the pure helpers +
 * validators + projections are exercised without ever touching Postgres. (The
 * dynamic imports live inside an async main() because tsx compiles these scripts
 * as CJS, where top-level await is unavailable.)
 *
 * Covers (item-10 list): idempotency + junction-scope (in-memory simulation of
 * the per-work delete-then-insert writer), primary_era_id constant, notes round-
 * trip (legacy-equivalent composition), the halt-before-mutation validators,
 * collections ownership, persons-slug derivation + the persons.json-once
 * contract, the reference/facet prolog wiring, and a static guard that the
 * db:sync tail + db:drift verify are wired in the right position.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

import {
  collectionEdgesOf,
  projectToOverrideBook,
  projectToRosterBook,
  validateBookFile,
  type BookFileV1,
} from "./book-file";

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

function validBook(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    $schema: "book-v1",
    externalBookId: "W40K-0600",
    slug: "example-new-release",
    title: "Example New Release",
    authors: ["Author Name"],
    editors: [],
    authorship: { editorialNote: null },
    releaseYear: 2026,
    format: "novel",
    seriesHint: null,
    series: null,
    seriesIndex: null,
    notes: null,
    source: { kind: "manual", url: null, confidence: null },
    curation: {
      synopsis: "A perfectly ordinary in-universe synopsis.",
      facetIds: ["book", "en"],
      factions: [{ name: "Astra Militarum", role: "primary" }],
      locations: [],
      characters: [],
      flags: [],
    },
    collections: { collects: [] },
    ...over,
  };
}

function parsed(over: Record<string, unknown> = {}): BookFileV1 {
  const { book, issues } = validateBookFile(validBook(over), "x.json");
  assert.deepEqual(issues, [], `expected clean parse, got: ${issues.join("; ")}`);
  assert.ok(book);
  return book;
}

// --- in-memory models of the real writers (mirrors documented in each block) -

type Edge = { collectionWorkId: string; contentExternalId: string; displayOrder: number };

/**
 * Mirrors scripts/apply-book.ts applyBookCollections: a SELECTED collection file
 * replaces ITS OWN edges (delete where collectionWorkId=self, then insert
 * collects[]). A member apply is gated out by `collects.length === 0` upstream.
 */
function applyBookCollectionsSim(store: Edge[], collection: BookFileV1, collectionWorkId: string): Edge[] {
  const kept = store.filter((e) => e.collectionWorkId !== collectionWorkId);
  const inserted = collectionEdgesOf([collection]).map((e) => ({
    collectionWorkId,
    contentExternalId: e.contentExternalId,
    displayOrder: e.displayOrder,
  }));
  return [...kept, ...inserted];
}

type JunctionStore = Map<string, string[]>; // `${junction}:${workId}` → row keys

/**
 * Mirrors scripts/book-apply-shared.ts applyBook: each junction is `delete where
 * workId=THIS` then insert — so re-applying converges and a second work's rows
 * are never touched.
 */
function applyJunctionsSim(store: JunctionStore, workId: string, rows: Record<string, string[]>): void {
  for (const [junction, keys] of Object.entries(rows)) {
    store.set(`${junction}:${workId}`, [...keys]);
  }
}

async function main(): Promise<void> {
  // Stub DATABASE_URL BEFORE dynamically importing `@/db/client`-coupled modules
  // (which throw at import time if it is unset). postgres.js connects lazily, so
  // no socket opens — these tests never run a query.
  process.env.DATABASE_URL ??= "postgres://stub:stub@127.0.0.1:5432/stub";

  const {
    M41_ERA_ID,
    buildAuthorshipBlock,
    buildSurfaceFormsBlock,
    composeNotes,
    pickFinalFormat,
    validateEntityRoles,
    validateRatingOverrides,
    validateSynopses,
    appendAutoCreatedPersons,
  } = await import("./book-apply-shared");
  const { seedFacets, seedReferenceAndFacetProlog, seedResolverExtensions } = await import("./seed-prolog");
  const { slugifyPerson } = await import("@/lib/seed/persons");

  console.log("apply-book");

  // --- primary_era_id (insert AND update use the same const) ----------------

  check("M41_ERA_ID is the 'time_ending' placeholder (insert + update parity)", () => {
    assert.equal(M41_ERA_ID, "time_ending");
  });

  // --- notes round-trip (legacy-equivalent composition) ---------------------

  check("composeNotes: free roster note + surfaceForms + authorship, in order", () => {
    const notes = composeNotes("A free maintainer note.", "---surfaceForms---\n{}\n---/surfaceForms---", null);
    assert.equal(notes, "A free maintainer note.\n\n---surfaceForms---\n{}\n---/surfaceForms---");
  });

  check("composeNotes: no roster note → only the generated tail (no leading blank)", () => {
    const sf = "---surfaceForms---\n{}\n---/surfaceForms---";
    assert.equal(composeNotes(null, sf, null), sf);
    assert.equal(composeNotes("", sf, null), sf);
  });

  check("composeNotes: authorship block appended after surfaceForms", () => {
    const sf = "---surfaceForms---\n{}\n---/surfaceForms---";
    const auth = buildAuthorshipBlock({ kind: "various", editorialNote: "various" });
    const notes = composeNotes("note", sf, auth);
    assert.equal(notes, `note\n\n${sf}\n\n${auth}`);
    assert.ok(notes.includes('"editorialNote": "various"'));
  });

  check("buildSurfaceFormsBlock carries flags[] VERBATIM (no normalization)", () => {
    const flags = [{ kind: "spoiler_warning", reasoning: "keep me exactly" }, { kind: "data_conflict", field: "year" }];
    const override = projectToOverrideBook(
      parsed({ curation: { synopsis: "s", facetIds: [], factions: [], locations: [], characters: [], flags } }),
    );
    const block = buildSurfaceFormsBlock(override, null);
    const json = block.replace(/^---surfaceForms---\n/, "").replace(/\n---\/surfaceForms---$/, "");
    const payload = JSON.parse(json) as { flags: unknown };
    assert.deepEqual(payload.flags, flags);
  });

  // --- format authority -----------------------------------------------------

  check("pickFinalFormat: roster format wins when there is no data_conflict", () => {
    const { format, formatOverride } = pickFinalFormat(projectToRosterBook(parsed({ format: "novel" })), projectToOverrideBook(parsed()));
    assert.equal(format, "novel");
    assert.equal(formatOverride, null);
  });

  check("pickFinalFormat: a data_conflict format flag's suggestion overrides the roster", () => {
    const override = projectToOverrideBook(
      parsed({
        curation: {
          synopsis: "s",
          facetIds: [],
          factions: [],
          locations: [],
          characters: [],
          flags: [{ kind: "data_conflict", field: "format", current: "novel", suggestion: "anthology", reasoning: "r" }],
        },
      }),
    );
    const { format, formatOverride } = pickFinalFormat(projectToRosterBook(parsed({ format: "novel" })), override);
    assert.equal(format, "anthology");
    assert.ok(formatOverride);
    assert.equal(formatOverride.to, "anthology");
  });

  // --- halt-before-mutation validators --------------------------------------

  check("validateEntityRoles throws on an unsupported role", () => {
    const override = projectToOverrideBook(
      parsed({
        curation: {
          synopsis: "s",
          facetIds: [],
          factions: [{ name: "X", role: "definitely_not_a_role" }],
          locations: [],
          characters: [],
          flags: [],
        },
      }),
    );
    assert.throws(() => validateEntityRoles([override]), /unsupported entity roles/);
  });

  check("validateEntityRoles passes on supported roles", () => {
    assert.doesNotThrow(() => validateEntityRoles([projectToOverrideBook(parsed())]));
  });

  check("validateSynopses passes on a clean synopsis", () => {
    assert.doesNotThrow(() => validateSynopses([projectToOverrideBook(parsed())], "books/ (test)"));
  });

  check("validateRatingOverrides passes when no rating is set", () => {
    assert.doesNotThrow(() => validateRatingOverrides([projectToOverrideBook(parsed())]));
  });

  // --- persons: slug derivation + persons.json-once contract ----------------

  check("author/editor names project verbatim (feed work_persons author/editor)", () => {
    const rb = projectToRosterBook(parsed({ authors: ["Dan Abnett"], editors: ["Lindsey Priestley"] }));
    assert.deepEqual(rb.authors, ["Dan Abnett"]);
    assert.deepEqual(rb.editors, ["Lindsey Priestley"]);
  });

  check("slugifyPerson derives the persons.id used by work_persons", () => {
    assert.equal(slugifyPerson("Dan Abnett"), "dan_abnett");
    assert.equal(slugifyPerson("Aaron Dembski-Bowden"), "aaron_dembski_bowden");
  });

  check("appendAutoCreatedPersons is exported (the persons.json-once writer)", () => {
    assert.equal(typeof appendAutoCreatedPersons, "function");
  });

  // --- reference/facet prolog wiring ----------------------------------------

  check("the shared reference/facet seed prolog is exported and composed", () => {
    assert.equal(typeof seedResolverExtensions, "function");
    assert.equal(typeof seedFacets, "function");
    assert.equal(typeof seedReferenceAndFacetProlog, "function");
  });

  // --- collections ownership (in-memory model of apply-book's writer) -------

  check("a selected collection writes its collects[] edges (owns them)", () => {
    const collection = parsed({
      externalBookId: "W40K-0700",
      slug: "an-omnibus",
      collections: { collects: [{ externalBookId: "W40K-0601" }, { externalBookId: "W40K-0602" }] },
    });
    const after = applyBookCollectionsSim([], collection, "uuid-omnibus");
    assert.equal(after.length, 2);
    assert.ok(after.every((e) => e.collectionWorkId === "uuid-omnibus"));
    assert.deepEqual(after.map((e) => e.contentExternalId).sort(), ["W40K-0601", "W40K-0602"]);
  });

  check("re-applying the same collection is idempotent (delete-then-insert)", () => {
    const collection = parsed({
      externalBookId: "W40K-0700",
      slug: "an-omnibus",
      collections: { collects: [{ externalBookId: "W40K-0601" }] },
    });
    let store: Edge[] = [];
    store = applyBookCollectionsSim(store, collection, "uuid-omnibus");
    const once = JSON.stringify(store);
    store = applyBookCollectionsSim(store, collection, "uuid-omnibus");
    assert.equal(JSON.stringify(store), once);
  });

  check("a selected member file (no collects[]) leaves work_collections untouched", () => {
    const member = parsed(); // collects: []
    assert.equal(member.collections.collects.length, 0);
    const seeded: Edge[] = [{ collectionWorkId: "uuid-omnibus", contentExternalId: "W40K-0600", displayOrder: 0 }];
    const skipped = member.collections.collects.length === 0; // apply-book's guard
    const after = skipped ? seeded : applyBookCollectionsSim(seeded, member, "uuid-member");
    assert.deepEqual(after, seeded);
  });

  check("applying one collection does not disturb another collection's edges (scope)", () => {
    const a = parsed({ externalBookId: "W40K-0700", slug: "omni-a", collections: { collects: [{ externalBookId: "W40K-0601" }] } });
    const b = parsed({ externalBookId: "W40K-0701", slug: "omni-b", collections: { collects: [{ externalBookId: "W40K-0602" }] } });
    let store: Edge[] = [];
    store = applyBookCollectionsSim(store, a, "uuid-a");
    store = applyBookCollectionsSim(store, b, "uuid-b");
    store = applyBookCollectionsSim(store, a, "uuid-a"); // re-apply only A
    assert.equal(store.filter((e) => e.collectionWorkId === "uuid-b").length, 1);
    assert.equal(store.filter((e) => e.collectionWorkId === "uuid-a").length, 1);
  });

  // --- junction idempotency + scope (in-memory model of applyBook's writer) --

  check("re-applying a book's junctions is idempotent", () => {
    const store: JunctionStore = new Map();
    const rows = { facets: ["book", "en"], persons: ["author:dan-abnett"], factions: ["astra_militarum"] };
    applyJunctionsSim(store, "uuid-1", rows);
    const snapshot = JSON.stringify([...store.entries()].sort());
    applyJunctionsSim(store, "uuid-1", rows);
    assert.equal(JSON.stringify([...store.entries()].sort()), snapshot);
  });

  check("applying book A's junctions leaves book B's rows intact (per-work scope)", () => {
    const store: JunctionStore = new Map();
    applyJunctionsSim(store, "uuid-A", { factions: ["space_marines"] });
    applyJunctionsSim(store, "uuid-B", { factions: ["orks"] });
    applyJunctionsSim(store, "uuid-A", { factions: ["chaos"] }); // re-apply A with a different set
    assert.deepEqual(store.get("factions:uuid-B"), ["orks"]);
    assert.deepEqual(store.get("factions:uuid-A"), ["chaos"]);
  });

  // --- static wiring guard: db:sync tail + db:drift verify ------------------

  // Brief 171: apply:book --all is now the PRIMARY corpus step (no legacy
  // run-phase4-apply.sh corpus step), gated by the DB-free book-corpus-preflight
  // and running before the podcast tail.
  check("db-sync.sh runs preflight → apply:book --all (primary) → apply:podcast, no run-phase4 step", () => {
    const sh = readFileSync(join(process.cwd(), "scripts", "db-sync.sh"), "utf8");
    const iPreflight = sh.indexOf("book-corpus-preflight");
    const iBook = sh.indexOf("apply:book -- --all");
    const iPodcast = sh.indexOf("apply:podcast -- --all");
    assert.ok(iPreflight >= 0 && iBook >= 0 && iPodcast >= 0, "preflight + per-book + podcast steps present");
    assert.ok(iPreflight < iBook, "per-book preflight must come before the per-book apply");
    assert.ok(iBook < iPodcast, "per-book corpus must come before the podcast tail");
    // The legacy batch corpus engine must NOT be a live step (comments may mention it).
    assert.ok(!sh.includes("bash scripts/run-phase4-apply.sh"), "run-phase4-apply.sh is no longer invoked as a step");
  });

  check("db-rebuild.sh + db-sync.sh use the per-book preflight, not db-apply-scope", () => {
    const sync = readFileSync(join(process.cwd(), "scripts", "db-sync.sh"), "utf8");
    const rebuild = readFileSync(join(process.cwd(), "scripts", "db-rebuild.sh"), "utf8");
    assert.ok(sync.includes("book-corpus-preflight"), "db:sync wires book-corpus-preflight");
    assert.ok(rebuild.includes("book-corpus-preflight"), "db:rebuild wires book-corpus-preflight");
    assert.ok(!sync.includes("npx tsx scripts/db-apply-scope.ts"), "db:sync no longer calls db-apply-scope");
    assert.ok(!rebuild.includes("npx tsx scripts/db-apply-scope.ts"), "db:rebuild no longer calls db-apply-scope");
  });

  check("db-drift.sh includes the read-only per-book verify", () => {
    const sh = readFileSync(join(process.cwd(), "scripts", "db-drift.sh"), "utf8");
    assert.ok(sh.includes("apply:book -- --verify"), "db:drift wires apply:book --verify");
  });

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exitCode = fail > 0 ? 1 : 0;
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? (err.stack ?? err.message) : err);
  process.exitCode = 1;
});
