/**
 * Append helper for the entity-blurb full-coverage sweep (Board 122-B3 → full run).
 *
 * The sweep is driven by subscription-Sonnet subagents (see
 * scripts/runbooks/entity-blurbs-full-run.md). Each subagent returns a JSON array
 * of {id, blurb, sourceUrl, confidence}. This script is the deterministic
 * "parse + stamp + append" step the runbook assigns to the driving session: it
 * reads a subagent's raw output, validates every row against the SAME guardrails
 * test-entity-blurbs.ts enforces, stamps `source_kind:"manual"` + `checkedAt`,
 * and appends the surviving rows to the matching committed blurb JSON.
 *
 * It is safe to re-run (idempotent): ids already present are skipped, not doubled.
 * Rows that would fail the integrity test (dangling id, >460 chars, >3 sentences,
 * bad confidence, non-https sourceUrl) are REJECTED and reported, never written —
 * so test:blurbs stays green and the rejects can be regenerated.
 *
 * Usage:
 *   npx tsx scripts/append-blurbs.ts --type character --date 2026-06-09 --in scripts/.cache/blurbs/char-b1.json
 *
 * Flags:
 *   --type   faction | character | location   (which blurb file to append to)
 *   --date   YYYY-MM-DD                        (stamped as checkedAt)
 *   --in     path                              (file holding the subagent's raw output)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const SEED_DIR = join(process.cwd(), "scripts", "seed-data");

const MAX_BLURB_CHARS = 460;
const WARN_BLURB_CHARS = 360; // runbook target is ~320; warn (not reject) above this
const MAX_SENTENCES = 3;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HTTPS_RE = /^https:\/\/\S+$/;

type EntityType = "faction" | "character" | "location";

const FILE_FOR: Record<EntityType, { entities: string; blurbs: string }> = {
  faction: { entities: "factions.json", blurbs: "faction-blurbs.json" },
  character: { entities: "characters.json", blurbs: "character-blurbs.json" },
  location: { entities: "locations.json", blurbs: "location-blurbs.json" },
};

interface EntityRow {
  id: string;
}
interface BlurbRow {
  id: string;
  blurb: string;
  source_kind: string;
  confidence: number;
  sourceUrl: string;
  checkedAt: string;
}
interface BlurbFile {
  $schema: string;
  entityType: EntityType;
  blurbs: BlurbRow[];
}
interface IncomingRow {
  id?: unknown;
  blurb?: unknown;
  sourceUrl?: unknown;
  confidence?: unknown;
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(join(SEED_DIR, file), "utf8")) as T;
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

// Same sentence counter test-entity-blurbs.ts uses, so this gate matches the test.
function countSentences(text: string): number {
  const matches = text.match(/[.!?]+(?:\s+|$)/g);
  return matches ? matches.length : text.length > 0 ? 1 : 0;
}

/** Pull a JSON array out of raw subagent text (tolerates ``` fences / stray prose). */
function extractArray(raw: string): IncomingRow[] {
  const trimmed = raw.trim();
  const candidates: string[] = [trimmed];
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) candidates.unshift(fence[1].trim());
  const first = trimmed.indexOf("[");
  const last = trimmed.lastIndexOf("]");
  if (first >= 0 && last > first) candidates.push(trimmed.slice(first, last + 1));
  for (const c of candidates) {
    try {
      const parsed = JSON.parse(c);
      if (Array.isArray(parsed)) return parsed as IncomingRow[];
    } catch {
      /* try next candidate */
    }
  }
  throw new Error("could not parse a JSON array from --in file");
}

function main(): void {
  const type = arg("type") as EntityType | undefined;
  const date = arg("date");
  const inPath = arg("in");

  if (!type || !FILE_FOR[type]) {
    console.error(`bad/missing --type (faction|character|location)`);
    process.exit(1);
  }
  if (!date || !DATE_RE.test(date)) {
    console.error(`bad/missing --date (YYYY-MM-DD)`);
    process.exit(1);
  }
  if (!inPath) {
    console.error(`missing --in <file>`);
    process.exit(1);
  }

  const { entities, blurbs: blurbFile } = FILE_FOR[type];
  const entityIds = new Set(readJson<EntityRow[]>(entities).map((e) => e.id));
  const data = readJson<BlurbFile>(blurbFile);
  const existing = new Set(data.blurbs.map((b) => b.id));

  const raw = readFileSync(inPath, "utf8");
  const incoming = extractArray(raw);

  const added: string[] = [];
  const skippedExisting: string[] = [];
  const rejected: { id: string; why: string }[] = [];
  const warned: { id: string; why: string }[] = [];
  const seenThisRun = new Set<string>();

  for (const row of incoming) {
    const id = typeof row.id === "string" ? row.id : "(no-id)";
    const blurb = typeof row.blurb === "string" ? row.blurb.trim() : "";
    const sourceUrl = typeof row.sourceUrl === "string" ? row.sourceUrl.trim() : "";
    const confidence = typeof row.confidence === "number" ? row.confidence : NaN;

    if (typeof row.id !== "string" || !id) {
      rejected.push({ id, why: "missing id" });
      continue;
    }
    if (!entityIds.has(id)) {
      rejected.push({ id, why: "dangling id (not in entity table)" });
      continue;
    }
    if (existing.has(id) || seenThisRun.has(id)) {
      skippedExisting.push(id);
      continue;
    }
    if (!blurb) {
      rejected.push({ id, why: "empty blurb" });
      continue;
    }
    if (blurb.length > MAX_BLURB_CHARS) {
      rejected.push({ id, why: `blurb too long (${blurb.length} > ${MAX_BLURB_CHARS})` });
      continue;
    }
    if (countSentences(blurb) > MAX_SENTENCES) {
      rejected.push({ id, why: `>${MAX_SENTENCES} sentences` });
      continue;
    }
    if (!(confidence > 0 && confidence <= 1)) {
      rejected.push({ id, why: `confidence out of range (${row.confidence})` });
      continue;
    }
    if (!HTTPS_RE.test(sourceUrl)) {
      rejected.push({ id, why: `sourceUrl not https (${sourceUrl || "missing"})` });
      continue;
    }

    if (blurb.length > WARN_BLURB_CHARS) warned.push({ id, why: `long (${blurb.length} chars)` });
    if (confidence < 0.85) warned.push({ id, why: `low confidence (${confidence}) — spot-check` });

    data.blurbs.push({
      id,
      blurb,
      source_kind: "manual",
      confidence,
      sourceUrl,
      checkedAt: date,
    });
    seenThisRun.add(id);
    added.push(id);
  }

  writeFileSync(join(SEED_DIR, blurbFile), JSON.stringify(data, null, 2) + "\n", "utf8");

  console.log(`append-blurbs ${type} <- ${inPath}`);
  console.log(`  added            : ${added.length}`);
  console.log(`  skipped(existing): ${skippedExisting.length}${skippedExisting.length ? "  [" + skippedExisting.join(", ") + "]" : ""}`);
  console.log(`  rejected         : ${rejected.length}`);
  for (const r of rejected) console.log(`    REJECT ${r.id}: ${r.why}`);
  if (warned.length) {
    console.log(`  warnings (kept)  : ${warned.length}`);
    for (const w of warned) console.log(`    warn   ${w.id}: ${w.why}`);
  }
  console.log(`  ${blurbFile}: now ${data.blurbs.length}/${entityIds.size} covered`);
}

main();
