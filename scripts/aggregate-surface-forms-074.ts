/**
 * Brief 074 helper — aggregate surface forms across overrides 011..015.
 *
 * Read-only. Prints frequency-sorted lists for factions / locations /
 * characters across the third resolver wave. Used to pick which surface forms
 * graduate to canonical reference rows vs which stay in `book_details.notes`.
 *
 * Not committed in pipeline scope — discardable analysis script (mirrors the
 * Brief-072 style: surface-form aggregation lives in the implementer head,
 * the script is the audit trail).
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

interface OverrideEntity {
  name: string;
  role: string;
}

interface OverrideBook {
  externalBookId: string;
  slug: string;
  overrides: {
    facetIds: string[];
    factions: OverrideEntity[];
    locations: OverrideEntity[];
    characters: OverrideEntity[];
    flags: Array<{ kind: string; field?: string; reasoning?: string }>;
  };
}

interface OverrideFile {
  batch: string;
  books: OverrideBook[];
}

const SEED_DIR = resolve(process.cwd(), "scripts", "seed-data");
const BATCHES = ["011", "012", "013", "014", "015"];

interface Stat {
  count: number;
  books: string[];
  roles: Set<string>;
}

function bump(map: Map<string, Stat>, name: string, slug: string, role: string) {
  const key = name.trim();
  if (!key) return;
  const stat = map.get(key) ?? { count: 0, books: [], roles: new Set<string>() };
  stat.count += 1;
  if (!stat.books.includes(slug)) stat.books.push(slug);
  stat.roles.add(role);
  map.set(key, stat);
}

function dumpSorted(label: string, map: Map<string, Stat>, minFreq = 1) {
  const rows = [...map.entries()]
    .filter(([, s]) => s.count >= minFreq)
    .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]));
  console.log(`\n=== ${label} (n=${rows.length}, freq≥${minFreq}) ===`);
  for (const [name, stat] of rows) {
    const roles = [...stat.roles].sort().join("/");
    console.log(
      `  ${String(stat.count).padStart(3, " ")}  ${name.padEnd(48, " ")}  [${roles}]  ${stat.books.join(",")}`,
    );
  }
}

async function main() {
  const factions = new Map<string, Stat>();
  const locations = new Map<string, Stat>();
  const characters = new Map<string, Stat>();
  let totalBooks = 0;

  for (const n of BATCHES) {
    const path = resolve(SEED_DIR, `manual-overrides-ssot-w40k-${n}.json`);
    const raw = await readFile(path, "utf8");
    const file = JSON.parse(raw) as OverrideFile;
    totalBooks += file.books.length;
    for (const book of file.books) {
      for (const f of book.overrides.factions) bump(factions, f.name, book.slug, f.role);
      for (const l of book.overrides.locations) bump(locations, l.name, book.slug, l.role);
      for (const c of book.overrides.characters) bump(characters, c.name, book.slug, c.role);
    }
  }

  console.log(`Total books across 011..015: ${totalBooks}`);
  dumpSorted("FACTIONS freq≥2", factions, 2);
  dumpSorted("FACTIONS freq=1 (long-tail, brief-curated subset graduates)", factions, 1);
  dumpSorted("LOCATIONS freq≥2", locations, 2);
  dumpSorted("LOCATIONS freq=1 (long-tail)", locations, 1);
  dumpSorted("CHARACTERS freq≥2", characters, 2);
  dumpSorted("CHARACTERS freq=1 (long-tail, brief-curated subset graduates)", characters, 1);

  // Flags summary
  for (const n of BATCHES) {
    const path = resolve(SEED_DIR, `manual-overrides-ssot-w40k-${n}.json`);
    const file = JSON.parse(await readFile(path, "utf8")) as OverrideFile;
    for (const book of file.books) {
      if (book.overrides.flags.length === 0) continue;
      console.log(`\n  flags ${book.externalBookId} ${book.slug}:`);
      for (const f of book.overrides.flags) {
        console.log(`    - ${f.kind}/${f.field ?? "-"}: ${f.reasoning ?? ""}`);
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
