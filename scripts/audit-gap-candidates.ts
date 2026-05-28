/**
 * audit-gap-candidates.ts — read-only Triage-Helper for Brief 103.
 *
 * Lists books that the /buecher?audit=gap cockpit flags as `hasJunctionGap`
 * (factions OR locations OR characters has zero junction rows) but that are
 * NOT structurally sparse Audio-Dramen (`bookDetails.format != 'audio_drama'`).
 * The Audio-Drama-Dämpfung in the UI-Pass handles the structurally-sparse
 * single-axis pieces (HH-0260 *Hunter's Moon*, HH-0270 *Iron Corpses*, etc.);
 * this script surfaces the ~10–20 actually-fixable Backfill-Kandidaten that
 * the laufende Maintainer-Excel-Sweep wants to see.
 *
 * Output is deterministic (sorted by external_book_id ASC) — two runs against
 * the same DB-Stand produce byte-identical Konsolen-Output and Markdown.
 * Console-Listing immer; Markdown unter `ingest/.last-run/audit-gap-candidates.md`
 * für späteren Diff. Kein DB-Write, kein Override-Touch, kein Resolver-Trigger.
 *
 * CLI: npm run audit:gap-candidates
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";

import { sql } from "drizzle-orm";

import { db } from "@/db/client";

interface GapCandidateRow {
  external_book_id: string | null;
  slug: string;
  title: string;
  format: string | null;
  confidence: string | null;
  f: number;
  l: number;
  c: number;
}

interface AxisBreakdown {
  missing_factions: number;
  missing_locations: number;
  missing_characters: number;
}

const OUTPUT_PATH = resolve(
  process.cwd(),
  "ingest",
  ".last-run",
  "audit-gap-candidates.md",
);

async function fetchCandidates(): Promise<GapCandidateRow[]> {
  const rows = (await db.execute(sql`
    SELECT
      w.external_book_id,
      w.slug,
      w.title,
      bd.format,
      w.confidence::text AS confidence,
      (SELECT count(*)::int FROM work_factions x WHERE x.work_id = w.id) AS f,
      (SELECT count(*)::int FROM work_locations x WHERE x.work_id = w.id) AS l,
      (SELECT count(*)::int FROM work_characters x WHERE x.work_id = w.id) AS c
    FROM works w
    JOIN book_details bd ON bd.work_id = w.id
    WHERE w.kind = 'book'
      AND (bd.format IS NULL OR bd.format <> 'audio_drama')
      AND (
        (SELECT count(*) FROM work_factions x WHERE x.work_id = w.id) = 0
        OR (SELECT count(*) FROM work_locations x WHERE x.work_id = w.id) = 0
        OR (SELECT count(*) FROM work_characters x WHERE x.work_id = w.id) = 0
      )
    ORDER BY w.external_book_id ASC, w.slug ASC
  `)) as unknown as GapCandidateRow[];
  return rows;
}

function summarizeAxes(rows: ReadonlyArray<GapCandidateRow>): AxisBreakdown {
  let mf = 0;
  let ml = 0;
  let mc = 0;
  for (const r of rows) {
    if (r.f === 0) mf++;
    if (r.l === 0) ml++;
    if (r.c === 0) mc++;
  }
  return { missing_factions: mf, missing_locations: ml, missing_characters: mc };
}

function summarizeDomain(rows: ReadonlyArray<GapCandidateRow>): {
  hh: number;
  w40k: number;
  other: number;
} {
  let hh = 0;
  let w40k = 0;
  let other = 0;
  for (const r of rows) {
    const id = r.external_book_id ?? "";
    if (id.startsWith("HH-")) hh++;
    else if (id.startsWith("W40K-")) w40k++;
    else other++;
  }
  return { hh, w40k, other };
}

function formatConfidence(value: string | null): string {
  if (value === null) return "—";
  return Number(value).toFixed(2);
}

function padRight(value: string, width: number): string {
  return value.length >= width ? value : value + " ".repeat(width - value.length);
}

function formatTitleForConsole(title: string, max: number): string {
  const collapsed = title.replace(/\s+/g, " ").trim();
  if (collapsed.length <= max) return collapsed;
  return collapsed.slice(0, max - 1) + "…";
}

function renderConsole(rows: ReadonlyArray<GapCandidateRow>): void {
  const axes = summarizeAxes(rows);
  const domain = summarizeDomain(rows);

  console.log("# audit-gap-candidates — non-audio_drama Bücher mit hasJunctionGap=true");
  console.log("");
  console.log(`== summary ==`);
  console.log(`  total: ${rows.length}`);
  console.log(`  by domain: HH=${domain.hh} W40K=${domain.w40k} other=${domain.other}`);
  console.log(
    `  by axis: factions=0 → ${axes.missing_factions}, locations=0 → ${axes.missing_locations}, characters=0 → ${axes.missing_characters}`,
  );
  console.log("");
  if (rows.length === 0) {
    console.log("  (no fixable gap candidates — every non-audio_drama book has ≥1 junction per axis)");
    return;
  }
  console.log("== candidates (sorted by external_book_id) ==");
  const idW = 9;
  const slugW = 36;
  const formatW = 11;
  const flcW = 10;
  const confW = 5;
  const titleW = 56;
  console.log(
    "  " +
      padRight("ext_id", idW) +
      "  " +
      padRight("slug", slugW) +
      "  " +
      padRight("format", formatW) +
      "  " +
      padRight("f/l/c", flcW) +
      "  " +
      padRight("conf", confW) +
      "  " +
      padRight("title", titleW),
  );
  console.log(
    "  " +
      "-".repeat(idW) +
      "  " +
      "-".repeat(slugW) +
      "  " +
      "-".repeat(formatW) +
      "  " +
      "-".repeat(flcW) +
      "  " +
      "-".repeat(confW) +
      "  " +
      "-".repeat(titleW),
  );
  for (const r of rows) {
    console.log(
      "  " +
        padRight(r.external_book_id ?? "—", idW) +
        "  " +
        padRight(r.slug, slugW) +
        "  " +
        padRight(r.format ?? "—", formatW) +
        "  " +
        padRight(`${r.f}/${r.l}/${r.c}`, flcW) +
        "  " +
        padRight(formatConfidence(r.confidence), confW) +
        "  " +
        formatTitleForConsole(r.title, titleW),
    );
  }
}

function renderMarkdown(rows: ReadonlyArray<GapCandidateRow>): string {
  const axes = summarizeAxes(rows);
  const domain = summarizeDomain(rows);
  const lines: string[] = [];
  lines.push("# Audit Gap Candidates — non-audio_drama");
  lines.push("");
  lines.push(
    "Bücher, die `/buecher?audit=gap` als `hasJunctionGap=true` flagt **und** kein `audio_drama`-Format tragen. " +
      "Reproduzierbar via `npm run audit:gap-candidates`; Output deterministisch sortiert nach `external_book_id`.",
  );
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- **Total:** ${rows.length}`);
  lines.push(`- **By domain:** HH=${domain.hh}, W40K=${domain.w40k}, other=${domain.other}`);
  lines.push(
    `- **By missing axis:** factions=${axes.missing_factions}, locations=${axes.missing_locations}, characters=${axes.missing_characters} (Bücher können in mehreren Spalten zählen)`,
  );
  lines.push("");
  if (rows.length === 0) {
    lines.push("_(no fixable gap candidates — every non-audio_drama book has ≥1 junction per axis)_");
    lines.push("");
    return lines.join("\n");
  }
  lines.push("## Candidates");
  lines.push("");
  lines.push("| ext_id | slug | format | f | l | c | conf | title |");
  lines.push("|---|---|---|---:|---:|---:|---:|---|");
  for (const r of rows) {
    const title = r.title.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
    lines.push(
      `| ${r.external_book_id ?? "—"} | \`${r.slug}\` | ${r.format ?? "—"} | ${r.f} | ${r.l} | ${r.c} | ${formatConfidence(r.confidence)} | ${title} |`,
    );
  }
  lines.push("");
  return lines.join("\n");
}

async function main(): Promise<void> {
  const rows = await fetchCandidates();

  renderConsole(rows);

  const markdown = renderMarkdown(rows);
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, markdown, "utf8");
  console.log("");
  console.log(`[audit-gap-candidates] markdown written: ${OUTPUT_PATH}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("[audit-gap-candidates] failed:", err);
  process.exit(1);
});
