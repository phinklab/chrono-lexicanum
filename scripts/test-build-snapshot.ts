/**
 * test-build-snapshot.ts — Launch S1a. DB-free coverage for the snapshot
 * exporter's PURE half (`scripts/snapshot-shared.ts`) plus the compile-time
 * CONTRACT that every export shape equals its loader return shape.
 *
 * The contract lives in the type-only block below: the projection functions
 * (imported via `import type` — erased at runtime, so the `@/db/client`-coupled
 * `build-snapshot.ts` is never loaded) must return EXACTLY the same types as
 * the productive server-only loaders (also imported type-only). `Equals<A,B>`
 * demands mutual assignability, so a drift in EITHER direction fails
 * `npm run typecheck` — that is the "Export-Shapes = Loader-Rückgabeformen"
 * acceptance from the launch plan, enforced by the compiler on every PR.
 *
 * Runtime asserts cover: deterministic serialization, the generatedAt
 * carry-forward (the byte-identical-re-run contract), manifest parsing, the
 * fail-closed plausibility floors + era parity, and the package.json wiring
 * (exactly the one `snapshot:regen` entry S1a is allowed to add).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  DATA_ARTIFACTS,
  MANIFEST_FILENAME,
  MIN_COUNTS,
  SNAPSHOT_DIR,
  assertEraParity,
  assertPlausibleCounts,
  entityArtifactPath,
  parseManifest,
  resolveGeneratedAt,
  serializeArtifact,
  sha256Hex,
  type SnapshotCounts,
  type SnapshotManifest,
} from "./snapshot-shared";

// --- compile-time contract: export shapes == loader return shapes -----------
// Everything in this block is type-only and erased at runtime; the server-only
// loader modules and the db-coupled exporter are NEVER imported as values here.
import type {
  projectBrowseData,
  projectCharaktereRows,
  projectEntityView,
  projectFactionGuide,
  projectHotEntityIds,
  projectPersonenRows,
  projectPodcastIndex,
  projectPodcastSearch,
  projectWeltenRows,
} from "./build-snapshot";
import type { loadBrowseBooks } from "@/app/archive/loader";
import type {
  loadPodcastIndex,
  loadPodcastSearchIndex,
} from "@/app/archive/podcasts/loader";
import type { loadFactionGuide } from "@/app/fraktionen/loader";
import type {
  getCharaktereRows,
  getPersonenRows,
  getWeltenRows,
} from "@/lib/compendium/queries";
import type { listHotEntityIds, loadEntity } from "@/lib/entity/loader";
import type { EntityType } from "@/lib/entity/types";

type Equals<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Returned<F extends (...args: never[]) => unknown> = Awaited<ReturnType<F>>;

// One `true` per contract — a mismatch turns the annotated type into `false`
// and the assignment stops compiling.
const browseContract: Equals<
  Returned<typeof projectBrowseData>,
  Returned<typeof loadBrowseBooks>
> = true;
const podcastIndexContract: Equals<
  Returned<typeof projectPodcastIndex>,
  Returned<typeof loadPodcastIndex>
> = true;
const podcastSearchContract: Equals<
  Returned<typeof projectPodcastSearch>,
  Returned<typeof loadPodcastSearchIndex>
> = true;
const factionGuideContract: Equals<
  Returned<typeof projectFactionGuide>,
  Returned<typeof loadFactionGuide>
> = true;
const charaktereContract: Equals<
  Returned<typeof projectCharaktereRows>,
  Returned<typeof getCharaktereRows>
> = true;
const weltenContract: Equals<
  Returned<typeof projectWeltenRows>,
  Returned<typeof getWeltenRows>
> = true;
const personenContract: Equals<
  Returned<typeof projectPersonenRows>,
  Returned<typeof getPersonenRows>
> = true;
const entityViewContract: Equals<
  Returned<typeof projectEntityView>,
  Returned<typeof loadEntity>
> = true;
const hotIdsContract: Equals<
  Returned<typeof projectHotEntityIds>["hotIds"],
  Record<EntityType, Returned<typeof listHotEntityIds>>
> = true;

// --- runtime asserts ---------------------------------------------------------

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

console.log("build-snapshot (pure half + contracts)");

check("all nine shape contracts hold at compile time", () => {
  // The real assertion is `npm run typecheck`; this keeps the consts "used".
  const contracts = [
    browseContract,
    podcastIndexContract,
    podcastSearchContract,
    factionGuideContract,
    charaktereContract,
    weltenContract,
    personenContract,
    entityViewContract,
    hotIdsContract,
  ];
  assert.ok(contracts.every((c) => c === true));
});

check("serializeArtifact: 2-space pretty JSON + trailing newline, deterministic", () => {
  const a = serializeArtifact({ b: 1, a: [2, null] });
  assert.equal(a, `{\n  "b": 1,\n  "a": [\n    2,\n    null\n  ]\n}\n`);
  assert.equal(a, serializeArtifact({ b: 1, a: [2, null] }));
});

check("sha256Hex is stable and input-sensitive", () => {
  assert.equal(sha256Hex("x"), sha256Hex("x"));
  assert.notEqual(sha256Hex("x"), sha256Hex("y"));
  assert.match(sha256Hex(""), /^[0-9a-f]{64}$/);
});

const countsFixture: SnapshotCounts = {
  books: 889,
  eras: 8,
  podcastIndexShows: 4,
  podcastSearchShows: 4,
  podcastSearchEpisodes: 1114,
  factionGuideRows: 227,
  charaktereRows: 500,
  weltenRows: 442,
  personenRows: 136,
  hotIds: { character: 30, faction: 39, location: 13, person: 14 },
  entityViews: 96,
};

function manifestFixture(over: Partial<SnapshotManifest> = {}): SnapshotManifest {
  return {
    generatedAt: "2026-07-11T00:00:00.000Z",
    sourceMigration: { count: 16, lastTag: "0015_keen_tag", lastHash: "abc" },
    counts: countsFixture,
    artifacts: [{ path: "browse-books.json", sha256: "deadbeef" }],
    ...over,
  };
}

check("resolveGeneratedAt carries the old timestamp forward when nothing changed", () => {
  const existing = manifestFixture();
  const ts = resolveGeneratedAt(
    existing,
    {
      sourceMigration: existing.sourceMigration,
      counts: existing.counts,
      artifacts: existing.artifacts,
    },
    () => "2026-07-12T09:00:00.000Z",
  );
  assert.equal(ts, "2026-07-11T00:00:00.000Z");
});

check("resolveGeneratedAt stamps a NEW timestamp when a hash changed", () => {
  const existing = manifestFixture();
  const ts = resolveGeneratedAt(
    existing,
    {
      sourceMigration: existing.sourceMigration,
      counts: existing.counts,
      artifacts: [{ path: "browse-books.json", sha256: "0000beef" }],
    },
    () => "2026-07-12T09:00:00.000Z",
  );
  assert.equal(ts, "2026-07-12T09:00:00.000Z");
});

check("resolveGeneratedAt stamps a NEW timestamp when the migration head moved", () => {
  const existing = manifestFixture();
  const ts = resolveGeneratedAt(
    existing,
    {
      sourceMigration: { count: 17, lastTag: "0016_next", lastHash: "def" },
      counts: existing.counts,
      artifacts: existing.artifacts,
    },
    () => "2026-07-12T09:00:00.000Z",
  );
  assert.equal(ts, "2026-07-12T09:00:00.000Z");
});

check("resolveGeneratedAt with no previous manifest stamps now()", () => {
  const next = manifestFixture();
  const ts = resolveGeneratedAt(
    null,
    { sourceMigration: next.sourceMigration, counts: next.counts, artifacts: next.artifacts },
    () => "2026-07-12T09:00:00.000Z",
  );
  assert.equal(ts, "2026-07-12T09:00:00.000Z");
});

check("parseManifest: roundtrip works, garbage and null degrade to null", () => {
  const m = manifestFixture();
  assert.deepEqual(parseManifest(serializeArtifact(m)), m);
  assert.equal(parseManifest("not json {"), null);
  assert.equal(parseManifest(`{"generatedAt": 42}`), null);
  assert.equal(parseManifest(null), null);
});

check("assertPlausibleCounts passes on live-like counts", () => {
  assert.doesNotThrow(() => assertPlausibleCounts(countsFixture));
});

check("assertPlausibleCounts throws on an empty/implausible core projection", () => {
  assert.throws(
    () => assertPlausibleCounts({ ...countsFixture, books: 0 }),
    /books = 0 < required minimum/,
  );
  assert.throws(
    () => assertPlausibleCounts({ ...countsFixture, podcastSearchEpisodes: 3 }),
    /podcastSearchEpisodes/,
  );
});

check("assertPlausibleCounts throws when a hot-ID payload is missing", () => {
  assert.throws(
    () => assertPlausibleCounts({ ...countsFixture, entityViews: 95 }),
    /missing hot-ID payloads/,
  );
  assert.throws(
    () =>
      assertPlausibleCounts({
        ...countsFixture,
        hotIds: { ...countsFixture.hotIds, location: 0 },
        entityViews: 83,
      }),
    /hotIds\.location is empty/,
  );
});

check("assertEraParity passes on the identical id set, order-independent", () => {
  assert.doesNotThrow(() => assertEraParity(["a", "b"], ["b", "a"]));
});

check("assertEraParity throws on drift in either direction", () => {
  assert.throws(() => assertEraParity(["a"], ["a", "b"]), /missing in DB: \[b\]/);
  assert.throws(() => assertEraParity(["a", "c"], ["a"]), /not in eras\.json: \[c\]/);
});

check("entityArtifactPath shapes entities/<type>/<id>.json", () => {
  assert.equal(entityArtifactPath("faction", "thousand_sons"), "entities/faction/thousand_sons.json");
});

check("MIN_COUNTS floors stay below the 2026-07-11 live counts (sanity)", () => {
  for (const [key, min] of Object.entries(MIN_COUNTS)) {
    const live = countsFixture[key as keyof typeof MIN_COUNTS];
    assert.ok(min <= live, `${key}: floor ${min} must not exceed live ${live}`);
  }
});

check("package.json wires exactly the one snapshot:regen entry (S1a exception)", () => {
  const pkg = JSON.parse(
    readFileSync(resolve(process.cwd(), "package.json"), "utf8"),
  ) as { scripts: Record<string, string> };
  const snapshotScripts = Object.keys(pkg.scripts).filter((k) => k.startsWith("snapshot:"));
  assert.deepEqual(snapshotScripts, ["snapshot:regen"]);
  assert.ok(
    pkg.scripts["snapshot:regen"].includes("scripts/build-snapshot.ts"),
    "snapshot:regen must invoke scripts/build-snapshot.ts",
  );
  assert.ok(
    pkg.scripts["snapshot:regen"].includes("--env-file=.env.local"),
    "snapshot:regen must load .env.local like the other DB scripts",
  );
});

check("artifact registry + manifest filename are stable strings", () => {
  assert.equal(SNAPSHOT_DIR, "scripts/snapshot-data");
  assert.equal(MANIFEST_FILENAME, "manifest.json");
  assert.equal(Object.keys(DATA_ARTIFACTS).length, 8);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail > 0 ? 1 : 0;
