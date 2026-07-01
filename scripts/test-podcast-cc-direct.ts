/**
 * Brief 131 — tests for the cc-direct podcast tagging path (Variant B).
 *
 * DB-free, network-free, LLM-free, and Anthropic-SDK-free: exercises only the
 * pure pieces — extraction coercion/validation, deterministic extractions IO,
 * the artifact→extractions migration's byte-identity, the committed extractions
 * files' assembly, the conventions-doc drift guard, and a static proof that the
 * cc-direct modules never reference `@anthropic-ai/sdk`. Mirrors the repo's
 * `tsx scripts/test-*.ts` convention (node:assert + pass/fail counter, non-zero
 * exit on failure).
 *
 *   npm run test:podcast-cc-direct
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildShowArtifact,
  serializeArtifact,
  type EpisodeResult,
} from "../src/lib/ingestion/podcast/artifact";
import {
  DeltaGuardError,
  mergeExtractionsDelta,
  partitionProposalGuids,
  selectDeltaGuids,
} from "../src/lib/ingestion/podcast/delta";
import {
  canonicalizeExtraction,
  coerceEpisodeExtraction,
  ExtractionValidationError,
  parseExtractionsFile,
  serializeExtractions,
  validateExtractionStrict,
  type ExtractionsFile,
} from "../src/lib/ingestion/podcast/extraction";
import {
  manifestFromArtifact,
  podcastOutDir,
  reconstructExtractionFromArtifactEpisode,
  type ShowManifest,
} from "../src/lib/ingestion/podcast/manifest";
import { EPISODE_PROMPT_VERSION_HASH } from "../src/lib/ingestion/podcast/prompt";
import { resolveEpisodeTags } from "../src/lib/ingestion/podcast/resolve";
import type {
  EpisodeArtifact,
  EpisodeExtraction,
  EpisodeTag,
  ShowArtifact,
  UnresolvedForm,
} from "../src/lib/ingestion/podcast/types";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
  } catch (err) {
    failed += 1;
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`✗ ${name}\n  ${msg}`);
  }
}

const OUT_DIR = podcastOutDir();
const REPO_ROOT = process.cwd();

const ARTIFACT_SLUGS = readdirSync(OUT_DIR)
  .filter(
    (f) =>
      f.endsWith(".json") && !f.endsWith(".manifest.json") && !f.endsWith(".extractions.json"),
  )
  .map((f) => f.slice(0, -".json".length))
  .sort();

function loadArtifact(slug: string): { raw: string; artifact: ShowArtifact } {
  const raw = readFileSync(join(OUT_DIR, `${slug}.json`), "utf8");
  return { raw, artifact: JSON.parse(raw) as ShowArtifact };
}

/** The cc-direct assemble: resolve each episode's extraction and build the
 *  artifact — the exact path `--stage=assemble` and the migration both use. */
function assembleArtifact(
  manifest: ShowManifest,
  extractions: Record<string, EpisodeExtraction>,
  model: string,
  promptVersion: string,
): string {
  const results: EpisodeResult[] = manifest.episodes.map((episode) => {
    const extraction = extractions[episode.guid];
    assert.ok(extraction, `no extraction for guid ${episode.guid}`);
    const { tags, unresolved } = resolveEpisodeTags(extraction);
    return { episode, extraction, tags, unresolved };
  });
  return serializeArtifact(
    buildShowArtifact({ show: manifest.show, source: manifest.source, model, promptVersion, results }),
  );
}

function emptyAxis() {
  return { primary: [], mentioned: [] };
}

function makeEpisodeArtifact(over: Partial<EpisodeArtifact>): EpisodeArtifact {
  return {
    guid: "g",
    title: "t",
    pubDate: null,
    durationSec: null,
    audioUrl: null,
    link: null,
    episodeKind: "lore",
    tags: [],
    unresolved: [],
    links: [],
    ...over,
  };
}

// --- 1. conventions-doc drift guard ------------------------------------------

test("tagging-conventions.md carries the current prompt version hash", () => {
  const doc = readFileSync(join(OUT_DIR, "tagging-conventions.md"), "utf8");
  const marker = doc.match(/EPISODE_PROMPT_VERSION_HASH:\s*([0-9a-f]{12})/);
  assert.ok(marker, "no EPISODE_PROMPT_VERSION_HASH marker in tagging-conventions.md");
  assert.equal(
    marker[1],
    EPISODE_PROMPT_VERSION_HASH,
    "conventions-doc hash != prompt.ts hash — the prompt changed; regenerate the doc + marker",
  );
  assert.ok(doc.includes(EPISODE_PROMPT_VERSION_HASH), "hash not present in the doc body");
});

// --- 2. migration byte-identity (in-memory decompile → reassemble) -----------

for (const slug of ARTIFACT_SLUGS) {
  test(`migration: ${slug} re-assembles byte-identically (in-memory)`, () => {
    const { raw, artifact } = loadArtifact(slug);
    const { manifest, extractions } = manifestFromArtifact(artifact);
    const rebuilt = assembleArtifact(
      manifest,
      extractions,
      artifact.extraction.model,
      artifact.extraction.promptVersion,
    );
    assert.equal(rebuilt, raw, "rebuilt artifact differs from committed bytes");
  });
}

// --- 3. committed extractions files assemble to their artifacts ---------------

for (const slug of ARTIFACT_SLUGS) {
  const extractionsPath = join(OUT_DIR, `${slug}.extractions.json`);
  if (!existsSync(extractionsPath)) continue; // present after the migration ran
  test(`committed ${slug}.extractions.json assembles to ${slug}.json byte-identically`, () => {
    const { raw, artifact } = loadArtifact(slug);
    const { manifest } = manifestFromArtifact(artifact);
    const file = parseExtractionsFile(readFileSync(extractionsPath, "utf8"));
    assert.equal(file.show, artifact.show.slug, "extractions show != artifact slug");
    assert.equal(file.promptVersion, artifact.extraction.promptVersion);
    assert.equal(file.model, artifact.extraction.model);
    const rebuilt = assembleArtifact(manifest, file.extractions, file.model, file.promptVersion);
    assert.equal(rebuilt, raw, "committed extractions assemble to different bytes");
  });
}

// --- 4. deterministic serialization ------------------------------------------

test("serializeExtractions is deterministic + insertion-order independent", () => {
  const a: EpisodeExtraction = {
    episodeKind: "lore",
    characters: { primary: ["A"], mentioned: [] },
    factions: { primary: [], mentioned: ["B"] },
    locations: emptyAxis(),
  };
  const b: EpisodeExtraction = {
    episodeKind: "news_recap",
    characters: emptyAxis(),
    factions: emptyAxis(),
    locations: emptyAxis(),
  };
  const f1: ExtractionsFile = {
    show: "x",
    tagging: "cc-direct",
    model: "m",
    promptVersion: "v",
    extractions: { g2: b, g1: a },
  };
  const f2: ExtractionsFile = {
    show: "x",
    tagging: "cc-direct",
    model: "m",
    promptVersion: "v",
    extractions: { g1: a, g2: b },
  };
  const s1 = serializeExtractions(f1);
  assert.equal(serializeExtractions(f2), s1, "insertion order changed the output");
  assert.equal(serializeExtractions(f1), s1, "not idempotent");
  assert.ok(s1.endsWith("\n"), "missing trailing newline");
  assert.ok(s1.indexOf('"g1"') < s1.indexOf('"g2"'), "guids not sorted");
  // canonical key order within an extraction
  const k = s1.indexOf('"episodeKind"');
  assert.ok(k < s1.indexOf('"characters"'), "episodeKind not first");
  assert.ok(s1.indexOf('"characters"') < s1.indexOf('"factions"'), "axis order wrong");
});

// --- 5. parse round-trip + header validation ---------------------------------

test("parseExtractionsFile round-trips serializeExtractions", () => {
  const file: ExtractionsFile = {
    show: "x",
    tagging: "cc-direct",
    model: "claude-sonnet-4-6",
    promptVersion: EPISODE_PROMPT_VERSION_HASH,
    extractions: {
      g1: {
        episodeKind: "lore",
        characters: { primary: ["Konrad Curze"], mentioned: [] },
        factions: { primary: ["Night Lords"], mentioned: [] },
        locations: emptyAxis(),
      },
    },
  };
  const s = serializeExtractions(file);
  const parsed = parseExtractionsFile(s);
  assert.equal(serializeExtractions(parsed), s, "round-trip not stable");
  assert.deepEqual(parsed.extractions.g1, canonicalizeExtraction(file.extractions.g1));
});

test("parseExtractionsFile rejects a non-cc-direct tagging field", () => {
  const bad = JSON.stringify({
    show: "x",
    tagging: "api",
    model: "m",
    promptVersion: "v",
    extractions: {},
  });
  assert.throws(() => parseExtractionsFile(bad), ExtractionValidationError);
});

// --- 6. strict validation (the cc-direct merge gate) -------------------------

test("validateExtractionStrict accepts valid structure + coerces values", () => {
  const out = validateExtractionStrict(
    {
      episodeKind: "documentary", // unknown → coerced to "other"
      characters: { primary: ["  Curze  ", 3, ""], mentioned: [] },
      factions: emptyAxis(),
      locations: emptyAxis(),
    },
    "t",
  );
  assert.equal(out.episodeKind, "other");
  assert.deepEqual(out.characters.primary, ["Curze"]); // trimmed; non-string + empty dropped
});

test("validateExtractionStrict rejects structural problems", () => {
  assert.throws(() => validateExtractionStrict(null, "t"), ExtractionValidationError);
  assert.throws(() => validateExtractionStrict({}, "t"), ExtractionValidationError);
  assert.throws(
    () => validateExtractionStrict({ episodeKind: 5, characters: emptyAxis() }, "t"),
    ExtractionValidationError,
  );
  assert.throws(
    () =>
      validateExtractionStrict(
        { episodeKind: "lore", characters: emptyAxis(), factions: emptyAxis() }, // no locations
        "t",
      ),
    ExtractionValidationError,
  );
  assert.throws(
    () =>
      validateExtractionStrict(
        {
          episodeKind: "lore",
          characters: { primary: "x", mentioned: [] }, // primary not an array
          factions: emptyAxis(),
          locations: emptyAxis(),
        },
        "t",
      ),
    ExtractionValidationError,
  );
});

// --- 7. lenient coercion (matches the api path's parse semantics) ------------

test("coerceEpisodeExtraction trims, drops non-strings/empties, falls back kind", () => {
  const out = coerceEpisodeExtraction({
    episodeKind: "weird",
    characters: { primary: [" X ", "", 2, "Y"], mentioned: null },
    factions: "nope",
    locations: undefined,
  });
  assert.equal(out.episodeKind, "other");
  assert.deepEqual(out.characters.primary, ["X", "Y"]);
  assert.deepEqual(out.characters.mentioned, []);
  assert.deepEqual(out.factions, emptyAxis());
  assert.deepEqual(out.locations, emptyAxis());
});

// --- 8. reconstruction units (the migration inverse) -------------------------

test("reconstruct places tags under resolved-type field + role bucket", () => {
  const ea = makeEpisodeArtifact({
    tags: [
      {
        type: "character",
        canonicalId: "konrad_curze",
        rawName: "Konrad Curze",
        role: "subject",
        confidence: 1,
        matchedVia: "canonical-name",
      },
      {
        type: "faction",
        canonicalId: "night_lords",
        rawName: "Night Lords",
        role: "mentioned",
        confidence: 0.9,
        matchedVia: "alias",
      },
    ] satisfies EpisodeTag[],
    unresolved: [
      { rawName: "Mystery Place", axisGuess: "location", role: "subject" },
    ] satisfies UnresolvedForm[],
  });
  const ext = reconstructExtractionFromArtifactEpisode(ea);
  assert.equal(ext.episodeKind, "lore");
  assert.deepEqual(ext.characters.primary, ["Konrad Curze"]);
  assert.deepEqual(ext.factions.mentioned, ["Night Lords"]);
  assert.deepEqual(ext.locations.primary, ["Mystery Place"]); // unresolved under axisGuess+role
  assert.deepEqual(ext.characters.mentioned, []);
  assert.deepEqual(ext.factions.primary, []);
});

test("reconstruct dedups a rawName repeated within a field/bucket", () => {
  const ea = makeEpisodeArtifact({
    tags: [
      {
        type: "faction",
        canonicalId: "a",
        rawName: "X",
        role: "subject",
        confidence: 1,
        matchedVia: "canonical-name",
      },
      {
        type: "faction",
        canonicalId: "b",
        rawName: "X",
        role: "subject",
        confidence: 1,
        matchedVia: "canonical-name",
      },
    ] satisfies EpisodeTag[],
  });
  const ext = reconstructExtractionFromArtifactEpisode(ea);
  assert.deepEqual(ext.factions.primary, ["X"]); // multi-resolution same form → one entry
});

// --- 9. static no-SDK guarantee ----------------------------------------------

test("cc-direct lib + scripts never import @anthropic-ai/sdk", () => {
  // Match only a QUOTED specifier (real imports use ' or "); doc comments refer
  // to the SDK with backticks, which must not trip this guard.
  const quotedSdk = /["']@anthropic-ai\/sdk["']/;
  const files = [
    "src/lib/ingestion/podcast/prompt.ts",
    "src/lib/ingestion/podcast/extraction.ts",
    "src/lib/ingestion/podcast/manifest.ts",
    "src/lib/ingestion/podcast/delta.ts",
    "scripts/podcast-cc-tag.ts",
    "scripts/podcast-migrate-extractions.ts",
  ];
  for (const f of files) {
    const src = readFileSync(join(REPO_ROOT, f), "utf8");
    assert.ok(!quotedSdk.test(src), `${f} imports @anthropic-ai/sdk`);
  }
});

test("ingest-podcast.ts imports the SDK only as a type + lazily", () => {
  const src = readFileSync(join(REPO_ROOT, "scripts/ingest-podcast.ts"), "utf8");
  // No static VALUE import of the SDK (an `import type` line is fine).
  const staticValueImport = /^import\s+(?!type\b)[^\n]*from\s+["']@anthropic-ai\/sdk["']/m;
  assert.ok(!staticValueImport.test(src), "ingest-podcast.ts has a static value import of the SDK");
  assert.ok(
    src.includes('await import("@anthropic-ai/sdk")'),
    "expected the SDK to be loaded via a lazy await import in the api path",
  );
});

// --- 10. delta primitives (Brief 172) ----------------------------------------

/** A minimal extraction with an optional character surface-form list. */
function mkExt(kind: EpisodeExtraction["episodeKind"], chars: string[] = []): EpisodeExtraction {
  return {
    episodeKind: kind,
    characters: { primary: chars, mentioned: [] },
    factions: emptyAxis(),
    locations: emptyAxis(),
  };
}

/** A committed extractions file fixture (default header, override extractions). */
function mkFile(extractions: Record<string, EpisodeExtraction>, over?: Partial<ExtractionsFile>): ExtractionsFile {
  return {
    show: "s",
    tagging: "cc-direct",
    model: "claude-sonnet-4-6",
    promptVersion: "v1",
    extractions,
    ...over,
  };
}

test("selectDeltaGuids: new = manifest ∖ existing, manifest order preserved", () => {
  const sel = selectDeltaGuids(["a", "b", "c", "d"], ["b", "d"]);
  assert.deepEqual(sel.newGuids, ["a", "c"]);
  assert.deepEqual(sel.alreadyTagged, ["b", "d"]);
});

test("selectDeltaGuids: up-to-date show → zero new guids (nothing to tag)", () => {
  const sel = selectDeltaGuids(["a", "b"], ["a", "b", "x"]);
  assert.deepEqual(sel.newGuids, []);
  assert.deepEqual(sel.alreadyTagged, ["a", "b"]);
});

test("mergeExtractionsDelta: fresh show (null existing) → the delta IS the file", () => {
  const r = mergeExtractionsDelta(null, {
    show: "s",
    model: "claude-sonnet-4-6",
    promptVersion: "v1",
    extractions: { a: mkExt("lore") },
  });
  assert.deepEqual(Object.keys(r.file.extractions), ["a"]);
  assert.deepEqual(r.added, ["a"]);
  assert.deepEqual(r.unchanged, []);
});

test("mergeExtractionsDelta: additive — existing preserved verbatim, new added (no shrink)", () => {
  const existing = mkFile({ a: mkExt("lore", ["Konrad Curze"]) });
  const r = mergeExtractionsDelta(existing, {
    show: "s",
    model: "claude-sonnet-4-6",
    promptVersion: "v1",
    extractions: { b: mkExt("news_recap") },
  });
  assert.deepEqual(Object.keys(r.file.extractions).sort(), ["a", "b"]);
  assert.deepEqual(r.added, ["b"]);
  // the reviewed 'a' entry is untouched.
  assert.deepEqual(r.file.extractions.a, canonicalizeExtraction(mkExt("lore", ["Konrad Curze"])));
});

test("mergeExtractionsDelta: re-merging the same delta is idempotent + byte-stable", () => {
  const existing = mkFile({ a: mkExt("lore") });
  const delta = {
    show: "s",
    model: "claude-sonnet-4-6",
    promptVersion: "v1",
    extractions: { b: mkExt("interview") },
  };
  const r1 = mergeExtractionsDelta(existing, delta);
  const s1 = serializeExtractions(r1.file);
  const r2 = mergeExtractionsDelta(r1.file, delta); // weekly re-run on the same accepted item
  assert.deepEqual(r2.added, []);
  assert.deepEqual(r2.unchanged, ["b"]);
  assert.equal(serializeExtractions(r2.file), s1, "re-merge changed the bytes");
});

test("mergeExtractionsDelta: a guid already tagged with a DIFFERENT extraction → DeltaGuardError", () => {
  const existing = mkFile({ a: mkExt("lore", ["X"]) });
  assert.throws(
    () =>
      mergeExtractionsDelta(existing, {
        show: "s",
        model: "claude-sonnet-4-6",
        promptVersion: "v1",
        extractions: { a: mkExt("lore", ["Y"]) }, // same guid, different tags → no silent retag
      }),
    DeltaGuardError,
  );
});

test("mergeExtractionsDelta: prompt / model / show drift each → DeltaGuardError (needs-decision)", () => {
  const existing = mkFile({ a: mkExt("lore") });
  const withHeader = (over: { model?: string; promptVersion?: string; show?: string }) => ({
    show: over.show ?? "s",
    model: over.model ?? "claude-sonnet-4-6",
    promptVersion: over.promptVersion ?? "v1",
    extractions: { b: mkExt("lore") },
  });
  assert.throws(() => mergeExtractionsDelta(existing, withHeader({ promptVersion: "v2" })), DeltaGuardError);
  assert.throws(() => mergeExtractionsDelta(existing, withHeader({ model: "claude-haiku-4-5" })), DeltaGuardError);
  assert.throws(() => mergeExtractionsDelta(existing, withHeader({ show: "other" })), DeltaGuardError);
});

test("partitionProposalGuids: toTag / alreadyTagged / missingFromFeed (source drift)", () => {
  // a: in feed, untagged → toTag; b: in feed + committed → stale skip; c: gone from feed → source drift.
  const part = partitionProposalGuids(["a", "b", "c"], ["a", "b"], ["b"]);
  assert.deepEqual(part.toTag, ["a"]);
  assert.deepEqual(part.alreadyTagged, ["b"]);
  assert.deepEqual(part.missingFromFeed, ["c"]);
});

// --- summary -----------------------------------------------------------------

console.log(`\npodcast cc-direct tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
