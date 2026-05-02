/**
 * check-eras — Drift-Guardrail für `primaryEraId` in scripts/seed-data/books.json.
 *
 * Pure JSON-Linting; kein DB-Zugriff. Läuft ohne `.env.local`. Stufe 2c.0
 * (sessions/2026-05-02-023): die kanonische Era-Zuweisung pro Buch lebt im
 * `book_details.primary_era_id`-Feld, befüllt aus diesem JSON. Der seed
 * validiert dasselbe; dieses Script erlaubt einen schnellen Vorab-Check ohne
 * `npm run db:seed` durchziehen zu müssen.
 *
 * Ausgabe:
 *   - Verteilungs-Tabelle (Era → Buch-Count) für die Cowork-Übersicht.
 *   - Sanity-Warnungen, falls ein Buch-`endY` weit außerhalb der zugewiesenen
 *     Era liegt (Heuristik: > 5000 Jahre Abweichung). Kein Gatekeeper —
 *     editorial spans wie The Infinite and the Divine sind absichtlich groß.
 *
 * Exit:
 *   - 0 wenn jedes Buch eine valide `primaryEraId` trägt.
 *   - 1 bei fehlenden oder unbekannten Werten.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

interface RawEra {
  id: string;
  name: string;
  start: number;
  end: number;
}

interface RawBook {
  id: string;
  title: string;
  primaryEraId?: string;
  startY: number;
  endY: number;
}

const SEED_DIR = join(process.cwd(), "scripts", "seed-data");
const eras = JSON.parse(
  readFileSync(join(SEED_DIR, "eras.json"), "utf8"),
) as RawEra[];
const books = JSON.parse(
  readFileSync(join(SEED_DIR, "books.json"), "utf8"),
) as RawBook[];

const eraById = new Map(eras.map((e) => [e.id, e]));
const counts = new Map<string, number>(eras.map((e) => [e.id, 0]));
const errors: string[] = [];
const warnings: string[] = [];

const FAR_THRESHOLD = 5000;

for (const b of books) {
  if (!b.primaryEraId) {
    errors.push(`${b.id} '${b.title}': missing primaryEraId`);
    continue;
  }
  const era = eraById.get(b.primaryEraId);
  if (!era) {
    errors.push(
      `${b.id} '${b.title}': primaryEraId '${b.primaryEraId}' not in eras.json`,
    );
    continue;
  }
  counts.set(era.id, (counts.get(era.id) ?? 0) + 1);
  if (b.endY < era.start - FAR_THRESHOLD || b.endY > era.end + FAR_THRESHOLD) {
    warnings.push(
      `${b.id} '${b.title}': endY ${b.endY} far outside era '${era.id}' (${era.start}–${era.end}) — intentional?`,
    );
  }
}

const widestId = eras.reduce((m, e) => Math.max(m, e.id.length), 0);
const widestName = eras.reduce((m, e) => Math.max(m, e.name.length), 0);

console.log("\nEra distribution:");
console.log("─".repeat(widestId + widestName + 12));
for (const era of eras) {
  const c = counts.get(era.id) ?? 0;
  console.log(
    `  ${era.id.padEnd(widestId)}  ${String(c).padStart(3)}  ${era.name}`,
  );
}
console.log("─".repeat(widestId + widestName + 12));
console.log(
  `  ${"TOTAL".padEnd(widestId)}  ${String(books.length).padStart(3)}\n`,
);

if (warnings.length > 0) {
  console.log("Warnings (non-fatal):");
  for (const w of warnings) console.log(`  ! ${w}`);
  console.log();
}

if (errors.length > 0) {
  console.error("Errors:");
  for (const e of errors) console.error(`  x ${e}`);
  process.exit(1);
}

console.log(`OK — all ${books.length} books carry a valid primaryEraId.`);
process.exit(0);
