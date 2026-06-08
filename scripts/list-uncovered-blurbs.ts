/**
 * Lists entities that do NOT yet have a blurb, grouped by type, as ready-to-feed
 * batches for the subscription-Sonnet subagent blurb run.
 *
 * This is the resume oracle for the full entity-blurb sweep (Board 122-B3 →
 * full-coverage follow-up): the three committed blurb JSONs are the source of
 * truth for "what is done", the three entity seed JSONs are "what exists", and
 * the difference is "what is left". Re-running after each committed batch shows
 * the shrinking remainder — there is no separate progress ledger to keep in sync.
 *
 * See scripts/runbooks/entity-blurbs-full-run.md for the full procedure.
 *
 * Usage:
 *   npx tsx scripts/list-uncovered-blurbs.ts                          # summary counts only
 *   npx tsx scripts/list-uncovered-blurbs.ts --type character         # all uncovered, one batch
 *   npx tsx scripts/list-uncovered-blurbs.ts --type location --batch 15
 *   npx tsx scripts/list-uncovered-blurbs.ts --type faction --batch 15 --only 2
 *
 * Flags:
 *   --type   faction | character | location   (omit for summary only)
 *   --batch  N            batch size (default 15); 0 = one big batch
 *   --only   K            print only batch number K (1-based) instead of all
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const SEED_DIR = join(process.cwd(), "scripts", "seed-data");

type EntityType = "faction" | "character" | "location";

interface FactionRow {
  id: string;
  name: string;
  parent: string | null;
  alignment: string | null;
  tone: string | null;
}
interface CharacterRow {
  id: string;
  name: string;
  primaryFactionId: string | null;
  lexicanumUrl: string | null;
  notes: string | null;
}
interface LocationRow {
  id: string;
  name: string;
  sector: string | null;
  gx: number | null;
  gy: number | null;
  tags: string[] | null;
  capital: boolean | null;
}
interface BlurbFile {
  blurbs: { id: string }[];
}
interface BatchEntity {
  id: string;
  name: string;
  ctx: string;
  cite?: string;
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(join(SEED_DIR, file), "utf8")) as T;
}

function coveredIds(file: string): Set<string> {
  return new Set(readJson<BlurbFile>(file).blurbs.map((b) => b.id));
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function uncoveredFactions(): BatchEntity[] {
  const covered = coveredIds("faction-blurbs.json");
  return readJson<FactionRow[]>("factions.json")
    .filter((f) => !covered.has(f.id))
    .map((f) => {
      const bits = [f.alignment && `align=${f.alignment}`, f.tone && `tone=${f.tone}`, f.parent && `parent=${f.parent}`]
        .filter(Boolean)
        .join(", ");
      return { id: f.id, name: f.name, ctx: bits };
    });
}

function uncoveredCharacters(): BatchEntity[] {
  const covered = coveredIds("character-blurbs.json");
  return readJson<CharacterRow[]>("characters.json")
    .filter((c) => !covered.has(c.id))
    .map((c) => {
      const bits = [c.primaryFactionId && `faction=${c.primaryFactionId}`, c.notes && `notes=${c.notes}`]
        .filter(Boolean)
        .join(", ");
      const e: BatchEntity = { id: c.id, name: c.name, ctx: bits };
      if (c.lexicanumUrl) e.cite = c.lexicanumUrl;
      return e;
    });
}

function uncoveredLocations(): BatchEntity[] {
  const covered = coveredIds("location-blurbs.json");
  return readJson<LocationRow[]>("locations.json")
    .filter((l) => !covered.has(l.id))
    .map((l) => {
      const mapped = l.gx !== null && l.gy !== null;
      const bits = [
        l.sector && `sector=${l.sector}`,
        l.tags && l.tags.length ? `tags=${l.tags.join("/")}` : "",
        l.capital ? "capital" : "",
        mapped ? "map-world" : "lore-only",
      ]
        .filter(Boolean)
        .join(", ");
      return { id: l.id, name: l.name, ctx: bits };
    });
}

function getUncovered(type: EntityType): BatchEntity[] {
  if (type === "faction") return uncoveredFactions();
  if (type === "character") return uncoveredCharacters();
  return uncoveredLocations();
}

function summary(): void {
  const f = uncoveredFactions().length;
  const c = uncoveredCharacters().length;
  const l = uncoveredLocations().length;
  const fTot = readJson<FactionRow[]>("factions.json").length;
  const cTot = readJson<CharacterRow[]>("characters.json").length;
  const lTot = readJson<LocationRow[]>("locations.json").length;
  console.log("uncovered entity blurbs (what's left to generate):");
  console.log(`  factions  : ${f} / ${fTot}  (${fTot - f} done)`);
  console.log(`  characters: ${c} / ${cTot}  (${cTot - c} done)`);
  console.log(`  locations : ${l} / ${lTot}  (${lTot - l} done)`);
  console.log(`  TOTAL     : ${f + c + l} / ${fTot + cTot + lTot}  (${fTot + cTot + lTot - (f + c + l)} done)`);
  console.log("\nNext: npx tsx scripts/list-uncovered-blurbs.ts --type <faction|character|location> --batch 15");
}

function main(): void {
  const typeArg = arg("type") as EntityType | undefined;
  if (!typeArg) {
    summary();
    return;
  }
  if (typeArg !== "faction" && typeArg !== "character" && typeArg !== "location") {
    console.error(`bad --type '${typeArg}' (faction|character|location)`);
    process.exit(1);
  }

  const items = getUncovered(typeArg);
  const batchSize = Number(arg("batch") ?? 15) || items.length;
  const only = arg("only") ? Number(arg("only")) : undefined;
  const totalBatches = Math.max(1, Math.ceil(items.length / batchSize));

  console.log(`# ${typeArg}: ${items.length} uncovered, ${totalBatches} batch(es) of ${batchSize}\n`);
  for (let b = 0; b < totalBatches; b++) {
    const n = b + 1;
    if (only && only !== n) continue;
    const slice = items.slice(b * batchSize, (b + 1) * batchSize);
    console.log(`### ${typeArg} batch ${n}/${totalBatches} (${slice.length} entities)`);
    console.log(JSON.stringify(slice));
    console.log("");
  }
}

main();
