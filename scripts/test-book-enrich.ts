/**
 * test-book-enrich.ts — Brief 155 (B11 Stage 3). DB-free unit tests for the
 * web-enrichment pipeline, covering each guardrail the brief pins:
 *   - Enrichment + verifier CONTRACT (accept valid, reject malformed/.strict).
 *   - Merge field-verification: alignment/parent refuted → blanked; parent/sector
 *     not an existing id → blanked; tone not in catalog vocab → blanked.
 *   - Coordinates only when placeable AND both finite — never guessed.
 *   - DEDUP backstop: a `new` whose canonical name resolves to an existing id is
 *     forced to an `alias`; an alias to a non-existent id stays unresolved.
 *   - Existence refuted → stays a sentinel (unresolved).
 *   - Worklist = the distinct structural sentinels (faction + location only).
 *   - PROPOSAL FILE has no apply path (no apply/rebuild/seed script reads it).
 */
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  EnricherBatchSchema,
  EnrichmentProposalSchema,
  EnrichVerifierBatchSchema,
  parseSentinelId,
  type EnrichmentProposal,
  type EnrichVerdict,
} from "./book-review/contract";
import {
  buildProposals,
  buildWorklist,
  findExistingId,
  loadVocab,
  PROPOSALS_PATH,
  type MergeItem,
  type SentinelWork,
} from "./book-review/enrichment";
import { loadRefSets } from "./book-review/sidecar";

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

const SEED_DIR = resolve(process.cwd(), "scripts", "seed-data");

function mkWork(axis: "faction" | "location", sentinelKey: string, rawName: string): SentinelWork {
  return {
    sentinelKey,
    axis,
    rawName,
    sources: [{ externalBookId: "W40K-0001", title: "Test Book", synopsis: "s", role: "primary", note: "n" }],
  };
}
function parseProp(obj: unknown): EnrichmentProposal {
  return EnrichmentProposalSchema.parse(obj);
}

async function main(): Promise<void> {
  const refs = await loadRefSets();
  const vocab = await loadVocab();
  const factions = JSON.parse(await readFile(resolve(SEED_DIR, "factions.json"), "utf8")) as Array<{
    id: string;
    name: string;
  }>;
  const realFactionId = factions[0]!.id;
  const realFactionName = factions[0]!.name;
  const realTone = vocab.tones[0]!;
  const realSector = vocab.sectors[0]!.id;
  const lexSrc = [{ url: "https://www.lexicanum.com/wiki/Test", trust: "lexicanum" as const }];

  // -------------------------------------------------------------------------
  // 1. parseSentinelId + contract accept/reject.
  // -------------------------------------------------------------------------
  check("parseSentinelId: faction", parseSentinelId("__unresolved__:faction:excoriators")?.axis === "faction");
  check("parseSentinelId: location slug", parseSentinelId("__unresolved__:location:nurth")?.slug === "nurth");
  check("parseSentinelId: non-sentinel → null", parseSentinelId("ultramarines") === null);

  check(
    "contract: valid new-faction accepted",
    EnrichmentProposalSchema.safeParse({
      sentinelKey: "__unresolved__:faction:x",
      axis: "faction",
      rawName: "X",
      decision: "new",
      faction: { canonicalName: "X", proposedId: "x", parent: null, alignment: "imperium", tone: null, glyph: null },
      sources: lexSrc,
      confidence: 0.8,
      notes: "n",
    }).success,
  );
  check(
    "contract: new without sources rejected",
    !EnrichmentProposalSchema.safeParse({
      sentinelKey: "__unresolved__:faction:x",
      axis: "faction",
      rawName: "X",
      decision: "new",
      faction: { canonicalName: "X", proposedId: "x", parent: null, alignment: "imperium", tone: null, glyph: null },
      sources: [],
      confidence: 0.8,
      notes: "n",
    }).success,
  );
  check(
    "contract: alias without aliasTo rejected",
    !EnrichmentProposalSchema.safeParse({
      sentinelKey: "__unresolved__:faction:x",
      axis: "faction",
      rawName: "X",
      decision: "alias",
      sources: lexSrc,
      confidence: 0.8,
      notes: "n",
    }).success,
  );
  check(
    "contract: faction payload on location axis rejected",
    !EnrichmentProposalSchema.safeParse({
      sentinelKey: "__unresolved__:location:x",
      axis: "location",
      rawName: "X",
      decision: "new",
      faction: { canonicalName: "X", proposedId: "x", parent: null, alignment: "imperium", tone: null, glyph: null },
      sources: lexSrc,
      confidence: 0.8,
      notes: "n",
    }).success,
  );
  check(
    "contract: stray key rejected (.strict)",
    !EnrichmentProposalSchema.safeParse({
      sentinelKey: "__unresolved__:faction:x",
      axis: "faction",
      rawName: "X",
      decision: "unresolved",
      sources: [],
      confidence: 0.5,
      notes: "n",
      bogus: 1,
    }).success,
  );
  check(
    "contract: bad alignment enum rejected",
    !EnrichmentProposalSchema.safeParse({
      sentinelKey: "__unresolved__:faction:x",
      axis: "faction",
      rawName: "X",
      decision: "new",
      faction: { canonicalName: "X", proposedId: "x", parent: null, alignment: "neutral", tone: null, glyph: null },
      sources: lexSrc,
      confidence: 0.8,
      notes: "n",
    }).success,
  );
  check(
    "contract: bad proposedId (uppercase) rejected",
    !EnrichmentProposalSchema.safeParse({
      sentinelKey: "__unresolved__:faction:x",
      axis: "faction",
      rawName: "X",
      decision: "new",
      faction: { canonicalName: "X", proposedId: "BadId", parent: null, alignment: "imperium", tone: null, glyph: null },
      sources: lexSrc,
      confidence: 0.8,
      notes: "n",
    }).success,
  );
  check(
    "contract: enricher batch (record) accepted",
    EnricherBatchSchema.safeParse({
      "__unresolved__:faction:x": {
        sentinelKey: "__unresolved__:faction:x",
        axis: "faction",
        rawName: "X",
        decision: "unresolved",
        sources: [],
        confidence: 0.4,
        notes: "no hit",
      },
    }).success,
  );
  check("contract: verifier valid accepted", EnrichVerifierBatchSchema.safeParse({ k: { existence: "confirm", reason: "r" } }).success);

  // trust label normalization — the model drifts on cosmetics; must not drop a proposal.
  const trustCase = (raw: string): string | undefined => {
    const p = EnrichmentProposalSchema.safeParse({
      sentinelKey: "__unresolved__:faction:x",
      axis: "faction",
      rawName: "X",
      decision: "new",
      faction: { canonicalName: "X", proposedId: "x", parent: null, alignment: "imperium", tone: null, glyph: null },
      sources: [{ url: "https://x.test/a", trust: raw }],
      confidence: 0.8,
      notes: "n",
    });
    return p.success ? p.data.sources[0]!.trust : undefined;
  };
  check("contract: trust 'black_library' → black-library", trustCase("black_library") === "black-library");
  check("contract: trust 'blacklibrary' → black-library", trustCase("blacklibrary") === "black-library");
  check("contract: trust 'Wikia' → fandom", trustCase("Wikia") === "fandom");
  check("contract: trust 'Lexicanum (wh40k)' → lexicanum", trustCase("Lexicanum (wh40k)") === "lexicanum");
  check("contract: trust gibberish → other", trustCase("???") === "other");
  check("contract: verifier bad verdict rejected", !EnrichVerifierBatchSchema.safeParse({ k: { existence: "maybe", reason: "r" } }).success);

  // -------------------------------------------------------------------------
  // 2. findExistingId — dedup helper.
  // -------------------------------------------------------------------------
  check("dedup: real faction name resolves to its id", findExistingId("faction", realFactionName) === realFactionId);
  check("dedup: nonsense name → null", findExistingId("faction", "Definitely Not A Faction Zzz") === null);

  // -------------------------------------------------------------------------
  // 3. Merge — field verification + guards + dedup, over a batch of items.
  // -------------------------------------------------------------------------
  const items: MergeItem[] = [];
  const add = (
    axis: "faction" | "location",
    key: string,
    raw: string,
    proposal: unknown,
    verdict: EnrichVerdict,
  ): void => {
    items.push({ work: mkWork(axis, key, raw), proposal: parseProp(proposal), verdict });
  };

  // A. clean new faction — alignment + parent + tone all kept.
  add(
    "faction",
    "__unresolved__:faction:clean-chapter-zzz",
    "Clean Chapter Zzz",
    {
      sentinelKey: "__unresolved__:faction:clean-chapter-zzz",
      axis: "faction",
      rawName: "Clean Chapter Zzz",
      decision: "new",
      faction: { canonicalName: "Clean Chapter Zzz", proposedId: "clean_chapter_zzz", parent: realFactionId, alignment: "imperium", tone: realTone, glyph: null },
      sources: lexSrc,
      confidence: 0.9,
      notes: "n",
    },
    { existence: "confirm", alignment: "confirm", parent: "confirm", reason: "r" },
  );
  // B. alignment refuted → blanked.
  add(
    "faction",
    "__unresolved__:faction:align-refuted-zzz",
    "Align Refuted Zzz",
    {
      sentinelKey: "__unresolved__:faction:align-refuted-zzz",
      axis: "faction",
      rawName: "Align Refuted Zzz",
      decision: "new",
      faction: { canonicalName: "Align Refuted Zzz", proposedId: "align_refuted_zzz", parent: realFactionId, alignment: "chaos", tone: null, glyph: null },
      sources: lexSrc,
      confidence: 0.7,
      notes: "n",
    },
    { existence: "confirm", alignment: "refute", parent: "confirm", reason: "no source for chaos" },
  );
  // C. parent not an existing id → blanked even though verifier confirmed.
  add(
    "faction",
    "__unresolved__:faction:bad-parent-zzz",
    "Bad Parent Zzz",
    {
      sentinelKey: "__unresolved__:faction:bad-parent-zzz",
      axis: "faction",
      rawName: "Bad Parent Zzz",
      decision: "new",
      faction: { canonicalName: "Bad Parent Zzz", proposedId: "bad_parent_zzz", parent: "no_such_faction_xyz", alignment: "imperium", tone: null, glyph: null },
      sources: lexSrc,
      confidence: 0.7,
      notes: "n",
    },
    { existence: "confirm", alignment: "confirm", parent: "confirm", reason: "r" },
  );
  // D. tone not in vocab → blanked (alignment + parent still fine → not fields-unproven).
  add(
    "faction",
    "__unresolved__:faction:bad-tone-zzz",
    "Bad Tone Zzz",
    {
      sentinelKey: "__unresolved__:faction:bad-tone-zzz",
      axis: "faction",
      rawName: "Bad Tone Zzz",
      decision: "new",
      faction: { canonicalName: "Bad Tone Zzz", proposedId: "bad_tone_zzz", parent: realFactionId, alignment: "imperium", tone: "totally_made_up_tone", glyph: null },
      sources: lexSrc,
      confidence: 0.7,
      notes: "n",
    },
    { existence: "confirm", alignment: "confirm", parent: "confirm", reason: "r" },
  );
  // E. placed location — real gx/gy kept.
  add(
    "location",
    "__unresolved__:location:placed-zzz",
    "Placed Zzz",
    {
      sentinelKey: "__unresolved__:location:placed-zzz",
      axis: "location",
      rawName: "Placed Zzz",
      decision: "new",
      location: { canonicalName: "Placed Zzz", proposedId: "placed_zzz", sector: realSector, placeable: true, gx: 123, gy: 45, tags: ["imperium"], capital: null, destroyed: null, warp: null },
      sources: lexSrc,
      confidence: 0.8,
      notes: "n",
    },
    { existence: "confirm", sector: "confirm", reason: "r" },
  );
  // F. placeable=false → coords null, sector-only.
  add(
    "location",
    "__unresolved__:location:sectoronly-zzz",
    "Sector Only Zzz",
    {
      sentinelKey: "__unresolved__:location:sectoronly-zzz",
      axis: "location",
      rawName: "Sector Only Zzz",
      decision: "new",
      location: { canonicalName: "Sector Only Zzz", proposedId: "sectoronly_zzz", sector: realSector, placeable: false, gx: null, gy: null, tags: [], capital: null, destroyed: null, warp: null },
      sources: lexSrc,
      confidence: 0.6,
      notes: "n",
    },
    { existence: "confirm", sector: "confirm", reason: "r" },
  );
  // G. placeable=true but gx missing → coords dropped (never guessed).
  add(
    "location",
    "__unresolved__:location:nocoords-zzz",
    "No Coords Zzz",
    {
      sentinelKey: "__unresolved__:location:nocoords-zzz",
      axis: "location",
      rawName: "No Coords Zzz",
      decision: "new",
      location: { canonicalName: "No Coords Zzz", proposedId: "nocoords_zzz", sector: realSector, placeable: true, gx: null, gy: 5, tags: [], capital: null, destroyed: null, warp: null },
      sources: lexSrc,
      confidence: 0.6,
      notes: "n",
    },
    { existence: "confirm", sector: "confirm", reason: "r" },
  );
  // H. sector refuted + no coords → unplaceable.
  add(
    "location",
    "__unresolved__:location:unplaceable-zzz",
    "Unplaceable Zzz",
    {
      sentinelKey: "__unresolved__:location:unplaceable-zzz",
      axis: "location",
      rawName: "Unplaceable Zzz",
      decision: "new",
      location: { canonicalName: "Unplaceable Zzz", proposedId: "unplaceable_zzz", sector: realSector, placeable: false, gx: null, gy: null, tags: [], capital: null, destroyed: null, warp: null },
      sources: lexSrc,
      confidence: 0.5,
      notes: "n",
    },
    { existence: "confirm", sector: "refute", reason: "sector wrong" },
  );
  // I. explicit alias → kept (aliasTo an existing id).
  add(
    "faction",
    "__unresolved__:faction:alias-zzz",
    "Alias Zzz Unresolvable",
    {
      sentinelKey: "__unresolved__:faction:alias-zzz",
      axis: "faction",
      rawName: "Alias Zzz Unresolvable",
      decision: "alias",
      aliasTo: realFactionId,
      sources: lexSrc,
      confidence: 0.8,
      notes: "already exists",
    },
    { existence: "confirm", reason: "r" },
  );
  // J. alias to non-existent id → withheld, stays unresolved.
  add(
    "faction",
    "__unresolved__:faction:badalias-zzz",
    "Bad Alias Zzz",
    {
      sentinelKey: "__unresolved__:faction:badalias-zzz",
      axis: "faction",
      rawName: "Bad Alias Zzz",
      decision: "alias",
      aliasTo: "no_such_id_xyz",
      sources: lexSrc,
      confidence: 0.8,
      notes: "n",
    },
    { existence: "confirm", reason: "r" },
  );
  // K. existence refuted → unresolved regardless of decision.
  add(
    "faction",
    "__unresolved__:faction:ghost-zzz",
    "Ghost Zzz",
    {
      sentinelKey: "__unresolved__:faction:ghost-zzz",
      axis: "faction",
      rawName: "Ghost Zzz",
      decision: "new",
      faction: { canonicalName: "Ghost Zzz", proposedId: "ghost_zzz", parent: null, alignment: "imperium", tone: null, glyph: null },
      sources: lexSrc,
      confidence: 0.4,
      notes: "n",
    },
    { existence: "refute", reason: "no credible hit" },
  );
  // L. dedup backstop — `new` whose canonical name resolves to an existing id → alias.
  add(
    "faction",
    "__unresolved__:faction:dupe-zzz",
    "Dupe Zzz Unresolvable",
    {
      sentinelKey: "__unresolved__:faction:dupe-zzz",
      axis: "faction",
      rawName: "Dupe Zzz Unresolvable",
      decision: "new",
      faction: { canonicalName: realFactionName, proposedId: "dupe_zzz", parent: null, alignment: "imperium", tone: null, glyph: null },
      sources: lexSrc,
      confidence: 0.8,
      notes: "n",
    },
    { existence: "confirm", alignment: "confirm", parent: "confirm", reason: "r" },
  );
  // M. unresolved decision passthrough.
  add(
    "location",
    "__unresolved__:location:nohit-zzz",
    "No Hit Zzz",
    {
      sentinelKey: "__unresolved__:location:nohit-zzz",
      axis: "location",
      rawName: "No Hit Zzz",
      decision: "unresolved",
      sources: [],
      confidence: 0.2,
      notes: "no credible source",
    },
    { existence: "confirm", reason: "kept as sentinel" },
  );

  const { file, stats } = buildProposals(items, vocab, refs, "opus", "2026-06-18");
  const fById = new Map(file.factions.map((f) => [f.sentinelKey, f]));
  const lById = new Map(file.locations.map((l) => [l.sentinelKey, l]));

  const A = fById.get("__unresolved__:faction:clean-chapter-zzz")!;
  check("merge A: clean new faction kept", A.decision === "new" && A.alignment === "imperium" && A.parent === realFactionId && A.tone === realTone);
  const B = fById.get("__unresolved__:faction:align-refuted-zzz")!;
  check("merge B: refuted alignment blanked + flagged unproven", B.alignment === null && B.verified.alignment === false);
  const C = fById.get("__unresolved__:faction:bad-parent-zzz")!;
  check("merge C: non-existent parent blanked", C.parent === null && C.verified.parent === false);
  const D = fById.get("__unresolved__:faction:bad-tone-zzz")!;
  check("merge D: tone not in vocab blanked (alignment/parent intact)", D.tone === null && D.alignment === "imperium" && D.parent === realFactionId);

  const E = lById.get("__unresolved__:location:placed-zzz")!;
  check("merge E: placed location keeps gx/gy", E.decision === "new" && E.gx === 123 && E.gy === 45 && E.sector === realSector);
  const F = lById.get("__unresolved__:location:sectoronly-zzz")!;
  check("merge F: sector-only has no coords", F.gx === null && F.gy === null && F.sector === realSector);
  const G = lById.get("__unresolved__:location:nocoords-zzz")!;
  check("merge G: placeable but partial coords → coords dropped", G.gx === null && G.gy === null);
  const H = lById.get("__unresolved__:location:unplaceable-zzz")!;
  check("merge H: sector refuted + no coords → unplaceable (sector null)", H.sector === null && H.gx === null);

  const I = fById.get("__unresolved__:faction:alias-zzz")!;
  check("merge I: explicit alias kept", I.decision === "alias" && I.aliasTo === realFactionId);
  const J = fById.get("__unresolved__:faction:badalias-zzz")!;
  check("merge J: alias to non-existent id → unresolved", J.decision === "unresolved");
  const K = fById.get("__unresolved__:faction:ghost-zzz")!;
  check("merge K: existence refuted → unresolved", K.decision === "unresolved" && K.verified.existence === false);
  const L = fById.get("__unresolved__:faction:dupe-zzz")!;
  check("merge L: dedup backstop new→alias", L.decision === "alias" && L.aliasTo === realFactionId);
  const M = lById.get("__unresolved__:location:nohit-zzz")!;
  check("merge M: unresolved passthrough", M.decision === "unresolved");

  // Stats sanity.
  check("stats: faction raw counts all faction items", stats.faction.raw === 8);
  check("stats: location raw counts all location items", stats.location.raw === 5);
  check("stats: faction alias count = explicit + dedup (2)", stats.faction.alias === 2);
  check("stats: faction unresolved count = badalias + ghost (2)", stats.faction.unresolved === 2);
  check("stats: location placed = 1", stats.location.placed === 1);
  check("stats: location sectorOnly = 2 (F + G)", stats.location.sectorOnly === 2);
  check("stats: location unplaceable = 1 (H)", stats.location.unplaceable === 1);
  check("stats: fields-unproven counts B + C (alignment/parent blanked)", stats.faction.fieldsUnproven === 2);

  check("file: $note declares no apply path", /NO APPLY PATH/.test(file.$note));
  check("file: brief 155", file.brief === "155");
  check("file: vocab pinned from catalogs", file.vocab.alignments.includes("imperium") && file.vocab.sectors.length > 0);

  // -------------------------------------------------------------------------
  // 4. Worklist — the distinct structural sentinels (faction + location only).
  // -------------------------------------------------------------------------
  const work = await buildWorklist();
  const fW = work.filter((w) => w.axis === "faction").length;
  const lW = work.filter((w) => w.axis === "location").length;
  check("worklist: only faction + location axes", work.every((w) => w.axis === "faction" || w.axis === "location"));
  check("worklist: every key is an unresolved sentinel", work.every((w) => w.sentinelKey.startsWith("__unresolved__:")));
  check("worklist: every sentinel carries ≥1 source book", work.every((w) => w.sources.length >= 1));
  check("worklist: distinct keys (no dupes)", new Set(work.map((w) => w.sentinelKey)).size === work.length);
  check(`worklist: faction count (${fW}) + location count (${lW}) = ${work.length}`, fW + lW === work.length && work.length > 0);

  // -------------------------------------------------------------------------
  // 5. NO APPLY PATH — no apply/rebuild/seed script reads the proposal file.
  // -------------------------------------------------------------------------
  const proposalBasename = PROPOSALS_PATH.split(/[\\/]/).pop()!;
  const applyEntrypoints = [
    "scripts/apply-curation-overlay.ts",
    "scripts/apply-override.ts",
    "scripts/curation-overlay.ts",
    "scripts/db-rebuild.sh",
    "scripts/db-sync.sh",
    "scripts/seed.ts",
    "scripts/seed-resolver-extensions.ts",
  ];
  let leak = "";
  for (const p of applyEntrypoints) {
    const abs = resolve(process.cwd(), p);
    if (!existsSync(abs)) continue;
    const txt = await readFile(abs, "utf8");
    if (txt.includes(proposalBasename) || txt.includes("new-entity-proposals")) leak = p;
  }
  check(`no-apply-path: ${proposalBasename} unreferenced by apply/rebuild/seed entrypoints`, leak === "", `referenced by ${leak}`);

  // -------------------------------------------------------------------------
  console.log(`\n# pass ${passed}`);
  console.log(`# fail ${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
