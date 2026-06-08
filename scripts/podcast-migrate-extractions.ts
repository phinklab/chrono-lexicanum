/**
 * Brief 131 — migrate committed podcast artifacts to the cc-direct extractions
 * contract. Anthropic-free.
 *
 * For each committed `ingest/podcasts/<slug>.json` (produced by the api path):
 *   1. Decompile it into a manifest + minimal per-guid extractions
 *      (`manifestFromArtifact`).
 *   2. PROVE the inverse is faithful: re-assemble the artifact from those
 *      reconstructed inputs (resolve → buildShowArtifact → serializeArtifact) and
 *      require the result to be BYTE-IDENTICAL to the committed file.
 *   3. Only if the proof passes, write `<slug>.extractions.json`.
 *
 * The byte-identity proof is the whole point: it certifies that an api-produced
 * artifact can be adopted into the cc-direct workflow without changing a single
 * byte, and it is the empirical guard against alias drift — if a surface form
 * committed in the artifact no longer resolves the same way, re-assembly diverges
 * and the migration FAILS LOUDLY (the extractions file is not written) instead of
 * silently producing a file that would re-assemble differently.
 *
 * Usage:
 *   npm run ingest:podcast:migrate-extractions                 # all committed artifacts
 *   npm run ingest:podcast:migrate-extractions -- the-40k-lorecast adeptus-ridiculous
 *   npm run ingest:podcast:migrate-extractions -- --check      # verify only, write nothing
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";

import {
  buildShowArtifact,
  serializeArtifact,
  type EpisodeResult,
} from "@/lib/ingestion/podcast/artifact";
import { serializeExtractions, type ExtractionsFile } from "@/lib/ingestion/podcast/extraction";
import {
  manifestFromArtifact,
  podcastOutDir,
} from "@/lib/ingestion/podcast/manifest";
import { resolveEpisodeTags } from "@/lib/ingestion/podcast/resolve";
import type { EpisodeExtraction, ShowArtifact } from "@/lib/ingestion/podcast/types";

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Light structural guard — the committed file is ours, but fail clearly if a
 *  path is pointed at a non-artifact JSON. */
function asArtifact(v: unknown, where: string): ShowArtifact {
  if (
    !isObject(v) ||
    !isObject(v.show) ||
    !isObject(v.extraction) ||
    !Array.isArray(v.episodes)
  ) {
    throw new Error(`${where}: not a podcast ShowArtifact (need show, extraction, episodes)`);
  }
  return v as unknown as ShowArtifact;
}

/** Re-assemble an artifact from its own decompiled inputs. Returns the rebuilt
 *  serialized JSON plus the reconstructed extractions (so we decompile once). */
function reassemble(artifact: ShowArtifact): {
  rebuilt: string;
  extractions: Record<string, EpisodeExtraction>;
} {
  const { manifest, extractions } = manifestFromArtifact(artifact);
  const results: EpisodeResult[] = manifest.episodes.map((episode) => {
    const extraction = extractions[episode.guid];
    const { tags, unresolved } = resolveEpisodeTags(extraction);
    return { episode, extraction, tags, unresolved };
  });
  const rebuilt = buildShowArtifact({
    show: manifest.show,
    source: manifest.source,
    model: artifact.extraction.model,
    promptVersion: artifact.extraction.promptVersion,
    results,
  });
  return { rebuilt: serializeArtifact(rebuilt), extractions };
}

/** First line where two strings differ — pinpoints alias drift on a failure. */
function firstDiff(a: string, b: string): string {
  const la = a.split("\n");
  const lb = b.split("\n");
  const n = Math.max(la.length, lb.length);
  for (let i = 0; i < n; i++) {
    if (la[i] !== lb[i]) {
      return (
        `first divergence at line ${i + 1}:\n` +
        `  committed: ${JSON.stringify(la[i] ?? "(eof)")}\n` +
        `  rebuilt  : ${JSON.stringify(lb[i] ?? "(eof)")}`
      );
    }
  }
  return `no line-level diff (lengths ${a.length} vs ${b.length})`;
}

/** Discover committed artifacts: `<slug>.json`, excluding manifests, extractions
 *  files, and anything under subdirs (readdir is non-recursive). */
async function discoverArtifacts(dir: string): Promise<string[]> {
  const entries = await readdir(dir);
  return entries
    .filter(
      (f) =>
        f.endsWith(".json") &&
        !f.endsWith(".manifest.json") &&
        !f.endsWith(".extractions.json"),
    )
    .map((f) => f.slice(0, -".json".length))
    .sort();
}

async function migrateOne(
  slug: string,
  dir: string,
  checkOnly: boolean,
): Promise<{ slug: string; episodes: number; identical: boolean; wrote: boolean; detail?: string }> {
  const artifactPath = join(dir, `${slug}.json`);
  const original = await readFile(artifactPath, "utf8");
  const artifact = asArtifact(JSON.parse(original), artifactPath);

  const { rebuilt, extractions } = reassemble(artifact);
  const identical = rebuilt === original;
  if (!identical) {
    return {
      slug,
      episodes: artifact.episodes.length,
      identical: false,
      wrote: false,
      detail: firstDiff(original, rebuilt),
    };
  }

  if (checkOnly) {
    return { slug, episodes: artifact.episodes.length, identical: true, wrote: false };
  }

  const file: ExtractionsFile = {
    show: artifact.show.slug,
    tagging: "cc-direct",
    model: artifact.extraction.model,
    promptVersion: artifact.extraction.promptVersion,
    extractions,
  };
  await writeFile(join(dir, `${slug}.extractions.json`), serializeExtractions(file), "utf8");
  return { slug, episodes: artifact.episodes.length, identical: true, wrote: true };
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { check: { type: "boolean", default: false } },
    strict: true,
  });
  const checkOnly = values.check === true;

  const dir = podcastOutDir();
  const targets = positionals.length > 0 ? positionals : await discoverArtifacts(dir);
  if (targets.length === 0) {
    console.error(`no artifacts found under ${dir}`);
    process.exit(1);
  }

  console.log(
    `migrate-extractions: ${targets.length} artifact(s)${checkOnly ? " (check only — no writes)" : ""}`,
  );

  let failures = 0;
  for (const slug of targets) {
    try {
      const r = await migrateOne(slug, dir, checkOnly);
      if (!r.identical) {
        failures += 1;
        console.error(`✗ ${slug}: re-assembly NOT byte-identical (${r.episodes} eps)`);
        if (r.detail) console.error(`  ${r.detail.replace(/\n/g, "\n  ")}`);
        console.error("  → alias drift or a logic change; extractions file NOT written.");
      } else {
        console.log(
          `✓ ${slug}: ${r.episodes} eps · re-assembly byte-identical` +
            (r.wrote ? ` → wrote ${slug}.extractions.json` : " (check only)"),
        );
      }
    } catch (e) {
      failures += 1;
      console.error(`✗ ${slug}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  console.log(
    `\n${targets.length - failures}/${targets.length} artifact(s) ${checkOnly ? "verified" : "migrated"}` +
      (failures > 0 ? `, ${failures} FAILED` : ""),
  );
  if (failures > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
