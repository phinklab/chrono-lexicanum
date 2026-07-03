/**
 * test-book-review.ts — Brief 154 (B11). DB-free unit tests for the reviewer
 * pipeline, covering each guardrail the brief pins:
 *   - Role-Fix (background-faction → supporting, supporting-character → appears).
 *   - Unresolved sentinel format + namespacing.
 *   - Finding contract (accept/reject) + deterministic flatten.
 *   - Sidecar cross-validation against the REAL curation-overlay.json (no
 *     collision with final W40K-0010 or queue W40K-0001; merged overlay passes
 *     the real validateOverlay).
 *   - LOUD ledger conflict (confirmed add + remove on same axis+id+book aborts).
 *   - Projection `curation-overlay.final` tail (W40K-0010 add/remove applied).
 *   - Corpus rebind (Brief 176): per-book projection == frozen-batch projection
 *     for the WHOLE migrated corpus; a post-migration book file is visible.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  AXIS_ROLES,
  validateOverlay,
  type EntityAxis,
} from "./curation-overlay";
import {
  FinderBatchSchema,
  VerifierBatchSchema,
  flattenFindings,
  isSentinelId,
  sentinelId,
  toOverlayRole,
  type FinderBatch,
  type FlatFinding,
} from "./book-review/contract";
import {
  buildSidecar,
  countSentinels,
  loadRefSets,
  mergeIntoOverlay,
} from "./book-review/sidecar";
import {
  discoverAllBatches,
  loadBatchBooks,
  loadCorpusBooks,
  loadProjectionContext,
  projectBook,
} from "./book-review/projection";
import { PILOT_BATCHES } from "./book-review/selection";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail = ""): void {
  if (cond) {
    passed += 1;
    console.log(`ok - ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL - ${name}${detail ? `: ${detail}` : ""}`);
  }
}
function mk(
  externalBookId: string,
  dimension: FlatFinding["dimension"],
  op: FlatFinding["op"],
  extra: Partial<FlatFinding>,
): FlatFinding {
  return {
    key: `${externalBookId}#${dimension}#${op}#${extra.id ?? extra.name ?? ""}`,
    externalBookId,
    dimension,
    op,
    rationale: "test rationale",
    ...extra,
  };
}

async function main(): Promise<void> {
  // -------------------------------------------------------------------------
  // 1. Role-Fix — the two cases the brief names + AXIS_ROLES closure.
  // -------------------------------------------------------------------------
  check("role-fix: background faction → supporting", toOverlayRole("factions", "background").role === "supporting");
  check("role-fix: supporting character → appears", toOverlayRole("characters", "supporting").role === "appears");
  check("role-fix: location mentioned → mentioned (identity)", toOverlayRole("locations", "mentioned").role === "mentioned");
  for (const axis of ["factions", "locations", "characters"] as EntityAxis[]) {
    for (const raw of ["primary", "supporting", "antagonist", "secondary", "mentioned", "pov", "appears", "background"]) {
      let role: string | null = null;
      try {
        role = toOverlayRole(axis, raw).role;
      } catch {
        role = null; // some raw roles are invalid for some axes — fine
      }
      if (role !== null) {
        check(`role-fix: ${axis}/${raw} → ${role} ∈ AXIS_ROLES`, AXIS_ROLES[axis].has(role));
      }
    }
  }

  // -------------------------------------------------------------------------
  // 2. Sentinel — format, namespacing, detection.
  // -------------------------------------------------------------------------
  check("sentinel: format", sentinelId("faction", "Titus Endor") === "__unresolved__:faction:titus-endor");
  check("sentinel: axis-namespaced", sentinelId("character", "Titus Endor") === "__unresolved__:character:titus-endor");
  check("sentinel: detected", isSentinelId(sentinelId("location", "Some Place")));
  check("sentinel: canonical id not flagged", !isSentinelId("ordo_malleus"));

  // -------------------------------------------------------------------------
  // 3. Contract — accept valid, reject malformed; deterministic flatten.
  // -------------------------------------------------------------------------
  const validBatch: FinderBatch = {
    "W40K-0001": {
      factions: { add: [{ name: "Ordo Malleus", role: "supporting", confidence: 0.8, rationale: "x" }] },
    },
    "W40K-0002": {},
  };
  check("contract: valid finder batch accepted", FinderBatchSchema.safeParse(validBatch).success);
  check(
    "contract: missing rationale rejected",
    !FinderBatchSchema.safeParse({ "W40K-0001": { factions: { add: [{ name: "X", role: "supporting", confidence: 0.8 }] } } }).success,
  );
  check(
    "contract: stray key rejected (.strict)",
    !FinderBatchSchema.safeParse({ "W40K-0001": { factions: { add: [{ name: "X", role: "s", confidence: 0.8, rationale: "y", extra: 1 }] } } }).success,
  );
  check(
    "contract: bad verdict rejected",
    !VerifierBatchSchema.safeParse({ "0": { verdict: "maybe", reason: "x" } }).success,
  );
  check("contract: valid verifier accepted", VerifierBatchSchema.safeParse({ "0": { verdict: "confirm", reason: "x" } }).success);

  const flat = flattenFindings(validBatch, ["W40K-0001", "W40K-0002"]);
  check("flatten: count", flat.length === 1);
  check("flatten: confidence carried", flat[0]?.confidence === 0.8);
  check("flatten: stable key", flat[0]?.key === "W40K-0001#factions#add#Ordo Malleus");

  // -------------------------------------------------------------------------
  // Shared fixtures (real seed data, DB-free).
  // -------------------------------------------------------------------------
  const refs = await loadRefSets();
  const ctx = await loadProjectionContext();
  const realOverlay = validateOverlay(
    JSON.parse(await readFile(resolve(process.cwd(), "scripts", "seed-data", "curation-overlay.json"), "utf8")),
    refs,
  );
  const facetInfo = { facetCategoryById: ctx.facetCategoryById, facetLabelById: ctx.facetLabelById };
  const realFinalIds = new Set(realOverlay.final.books.map((b) => b.externalBookId));
  const realQueueIds = new Set((realOverlay.reviewQueue?.books ?? []).map((b) => b.externalBookId));
  check("fixture: W40K-0010 in real final", realFinalIds.has("W40K-0010"));
  check("fixture: W40K-0001 in real reviewQueue", realQueueIds.has("W40K-0001"));

  // -------------------------------------------------------------------------
  // 4. Sidecar cross-validation against the REAL overlay.
  // -------------------------------------------------------------------------
  const confirmedClean: FlatFinding[] = [
    mk("W40K-0001", "factions", "add", { name: "Ordo Malleus", role: "supporting", confidence: 0.8 }),
    mk("W40K-0005", "factions", "add", { name: "Inquisition", role: "primary", confidence: 0.9 }),
    mk("W40K-0010", "factions", "add", { name: "Grey Knights", role: "supporting", confidence: 0.7 }),
    mk("W40K-0005", "facets", "add", { id: "inquisitor", confidence: 0.8 }),
  ];
  const result = buildSidecar(confirmedClean, realOverlay, facetInfo, "2026-06-17");

  const sidecarQueueIds = new Set((result.sidecar.reviewQueue?.books ?? []).map((b) => b.externalBookId));
  check("sidecar: final is empty (applies nothing)", result.sidecar.final.books.length === 0);
  check("sidecar: W40K-0010 routed to conflictsWithFinal, not queue", !sidecarQueueIds.has("W40K-0010") && result.conflictsWithFinal.some((c) => c.externalBookId === "W40K-0010"));
  check("sidecar: facet finding → facet queue (no apply path)", result.facetQueue.books.some((b) => b.externalBookId === "W40K-0005" && (b.facets.add ?? []).some((f) => f.id === "inquisitor")));

  let sidecarValidates = true;
  try {
    validateOverlay(result.sidecar, refs);
  } catch {
    sidecarValidates = false;
  }
  check("sidecar: passes validateOverlay (149-conform)", sidecarValidates);

  let mergeValidates = true;
  try {
    validateOverlay(mergeIntoOverlay(realOverlay, result.sidecar), refs);
  } catch (e) {
    mergeValidates = false;
    console.error(`  merge cross-validation error: ${e instanceof Error ? e.message : e}`);
  }
  check("cross-val: sidecar merges into REAL overlay + passes validateOverlay", mergeValidates);

  // W40K-0001 must merge with the existing queue entry, not duplicate it.
  const merged = mergeIntoOverlay(realOverlay, result.sidecar);
  const w1Count = (merged.reviewQueue?.books ?? []).filter((b) => b.externalBookId === "W40K-0001").length;
  check("cross-val: W40K-0001 unioned (no duplicate)", w1Count === 1);

  // -------------------------------------------------------------------------
  // 5. LOUD ledger conflict — confirmed add + remove on same axis+id+book.
  // -------------------------------------------------------------------------
  const clashName = "Definitely Not A Real Faction Xyz";
  const clashId = sentinelId("faction", clashName);
  const confirmedConflict: FlatFinding[] = [
    mk("W40K-0003", "factions", "add", { name: clashName, role: "supporting", confidence: 0.5 }),
    mk("W40K-0003", "factions", "remove", { id: clashId }),
  ];
  const conflictResult = buildSidecar(confirmedConflict, realOverlay, facetInfo, "2026-06-17");
  check(
    "ledger: add + remove same axis+id+book → routed to ledgerConflicts (non-blocking, not thrown)",
    conflictResult.ledgerConflicts.length === 1 && conflictResult.ledgerConflicts[0]?.id === clashId,
  );
  const w3 = conflictResult.sidecar.reviewQueue?.books.find((b) => b.externalBookId === "W40K-0003");
  check(
    "ledger: BOTH sides withheld from the queue (never half-applied)",
    !w3 || !((w3.factions?.add?.length ?? 0) || (w3.factions?.remove?.length ?? 0)),
  );

  // Unresolvable add → sentinel id carried into the sidecar.
  const confirmedUnresolved = [mk("W40K-0004", "factions", "add", { name: clashName, role: "supporting", confidence: 0.5 })];
  const unresolvedResult = buildSidecar(confirmedUnresolved, realOverlay, facetInfo, "2026-06-17");
  check("sentinel: unresolvable add carried into sidecar", countSentinels(unresolvedResult.sidecar) === 1 && unresolvedResult.unresolvedCount === 1);

  // -------------------------------------------------------------------------
  // 6. Projection — curation-overlay.final tail (W40K-0010), DB-free.
  // -------------------------------------------------------------------------
  const batchBooks = await loadBatchBooks(PILOT_BATCHES);
  const w10 = batchBooks.get("W40K-0010");
  check("projection: W40K-0010 present in pilot batches", !!w10);
  if (w10) {
    const proj = projectBook(w10, ctx);
    const facById = new Map(proj.factions.map((f) => [f.id, f.role]));
    check("projection: final-tail ADD applied (ordo_malleus=supporting)", facById.get("ordo_malleus") === "supporting");
    check("projection: final-tail REMOVE applied (chaos absent)", !facById.has("chaos"));
    check("projection: facets carry visibility flag", proj.facets.every((f) => typeof f.visible === "boolean"));
  }

  // -------------------------------------------------------------------------
  // 7. Corpus rebind (Brief 176) — per-book projection == batch projection for
  //    the WHOLE frozen corpus, and a post-migration book file is visible.
  // -------------------------------------------------------------------------
  const allBatchBooks = await loadBatchBooks(await discoverAllBatches());
  const corpusBooks = loadCorpusBooks();
  const missingInCorpus = [...allBatchBooks.keys()].filter((id) => !corpusBooks.has(id));
  check(
    `rebind: per-book corpus covers all ${allBatchBooks.size} frozen-batch books`,
    missingInCorpus.length === 0,
    missingInCorpus.slice(0, 5).join(", "),
  );
  let projectionDeltas = 0;
  let firstDelta = "";
  for (const [id, batchBook] of allBatchBooks) {
    const corpusBook = corpusBooks.get(id);
    if (!corpusBook) continue; // already counted above
    const a = JSON.stringify(projectBook(batchBook, ctx));
    const b = JSON.stringify(projectBook(corpusBook, ctx));
    if (a !== b) {
      projectionDeltas += 1;
      if (!firstDelta) firstDelta = id;
    }
  }
  check(
    "rebind: projection identical for the whole migrated corpus (0 deltas)",
    projectionDeltas === 0,
    `${projectionDeltas} delta(s), first: ${firstDelta}`,
  );

  // Post-migration visibility: a synthetic book-v1 file in an injected dir is
  // enumerated by loadCorpusBooks AND title-resolved by loadProjectionContext.
  const demoDir = mkdtempSync(join(tmpdir(), "review-corpus-176-"));
  try {
    const demo = {
      $schema: "book-v1",
      externalBookId: "W40K-9999",
      slug: "brief-176-demo",
      title: "Brief 176 Demo Book",
      authors: ["Demo Author"],
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
        synopsis: "Demo synopsis.",
        facetIds: [],
        factions: [{ name: "Ordo Malleus", role: "supporting" }],
        locations: [],
        characters: [],
        flags: [],
      },
      collections: { collects: [] },
    };
    writeFileSync(join(demoDir, "brief-176-demo.json"), JSON.stringify(demo, null, 2), "utf8");
    const demoBooks = loadCorpusBooks(demoDir);
    check("rebind: post-migration book enumerated by loadCorpusBooks", demoBooks.has("W40K-9999"));
    const demoCtx = await loadProjectionContext(demoDir);
    const demoProj = demoBooks.has("W40K-9999") ? projectBook(demoBooks.get("W40K-9999")!, demoCtx) : null;
    check("rebind: post-migration book projects with corpus title", demoProj?.title === "Brief 176 Demo Book");
    check(
      "rebind: post-migration book curation resolves like a batch override",
      demoProj?.factions.some((f) => f.id === "ordo_malleus" && f.role === "supporting") === true,
    );
  } finally {
    rmSync(demoDir, { recursive: true, force: true });
  }

  // -------------------------------------------------------------------------
  console.log(`\n# pass ${passed}`);
  console.log(`# fail ${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
