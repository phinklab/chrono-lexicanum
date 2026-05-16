/**
 * Smoke probe for Brief 077 acceptance § 7.
 *
 * For each smoke slug from the brief: list its work_factions junction set
 * (faction_id with alignment), then assert the grand-alignment-junction-skip
 * rule per Brief 077: the imperium / chaos junction must be GONE if (and
 * only if) the book carries at least one alignment-peer sub-faction in the
 * same junction set. Surface-form audit bucket existence is reported.
 *
 * Acceptance: all six smoke slugs have IMPERIUM gone — they all carry
 * imperium-aligned sub-factions (Astartes Chapters, Astra Militarum, etc).
 * CHAOS presence is data-dependent: kept iff the book has no chaos-aligned
 * sub in the override block (worldbuilding antagonist mention only).
 */
import { sql } from "drizzle-orm";
import { db } from "@/db/client";

const SMOKE_SLUGS = [
  "space-wolf",
  "the-anarch",
  "inquisitor-draco",
  "the-green-tide",
  "armageddon-saint",
  "13th-legion",
] as const;

type FactionRow = { faction_id: string; role: string; alignment: string };
type NotesRow = { notes: string | null };

async function main(): Promise<void> {
  let failures = 0;
  let booksWithSkipBucket = 0;

  for (const slug of SMOKE_SLUGS) {
    const result = await db.execute<FactionRow>(
      sql.raw(`
        select wf.faction_id, wf.role, f.alignment
        from works w
        join work_factions wf on wf.work_id = w.id
        join factions f on f.id = wf.faction_id
        where w.slug = '${slug}'
        order by f.alignment, wf.faction_id
      `),
    );
    const rows = result as unknown as FactionRow[];
    const byAlignment = new Map<string, string[]>();
    for (const r of rows) {
      if (!byAlignment.has(r.alignment)) byAlignment.set(r.alignment, []);
      byAlignment.get(r.alignment)!.push(r.faction_id);
    }
    const hasImperium = rows.some((r) => r.faction_id === "imperium");
    const hasChaos = rows.some((r) => r.faction_id === "chaos");
    const hasImperiumSub = rows.some(
      (r) => r.faction_id !== "imperium" && r.alignment === "imperium",
    );
    const hasChaosSub = rows.some(
      (r) => r.faction_id !== "chaos" && r.alignment === "chaos",
    );

    console.log(`/buch/${slug}:`);
    for (const [align, ids] of [...byAlignment.entries()].sort()) {
      console.log(`  ${align}: [${ids.join(", ")}]`);
    }

    // Imperium: gone iff imperium-aligned sub present.
    if (hasImperium && hasImperiumSub) {
      console.log(`  FAIL — imperium junction remains alongside imperium-aligned sub`);
      failures += 1;
    } else if (!hasImperium && hasImperiumSub) {
      console.log(`  ok — imperium skipped (has imperium-aligned sub)`);
    } else if (!hasImperium && !hasImperiumSub) {
      console.log(`  n/a — imperium not present and no imperium-aligned sub`);
    } else {
      console.log(`  preserved — imperium kept (no imperium-aligned sub in block)`);
    }

    // Chaos: gone iff chaos-aligned sub present.
    if (hasChaos && hasChaosSub) {
      console.log(`  FAIL — chaos junction remains alongside chaos-aligned sub`);
      failures += 1;
    } else if (!hasChaos && hasChaosSub) {
      console.log(`  ok — chaos skipped (has chaos-aligned sub)`);
    } else if (!hasChaos && !hasChaosSub) {
      console.log(`  n/a — chaos not present and no chaos-aligned sub`);
    } else {
      console.log(`  preserved — chaos kept (no chaos-aligned sub in block, antagonist-only mention)`);
    }

    const notesResult = await db.execute<NotesRow>(
      sql.raw(`
        select bd.notes
        from works w
        join book_details bd on bd.work_id = w.id
        where w.slug = '${slug}'
      `),
    );
    const notes = (notesResult as unknown as NotesRow[])[0]?.notes ?? "";
    if (notes.includes("factionsSkippedRedundant")) {
      booksWithSkipBucket += 1;
      const match = notes.match(/"factionsSkippedRedundant":\s*(\[[^\]]*\])/);
      console.log(
        `  factionsSkippedRedundant bucket: ${(match?.[1] ?? "(unparseable)").replace(/\s+/g, " ").trim()}`,
      );
    } else {
      console.log(`  factionsSkippedRedundant bucket: (not present)`);
    }
    console.log("");
  }

  console.log(`Summary: ${failures} skip-rule violations across ${SMOKE_SLUGS.length} smoke slugs`);
  console.log(`Books with factionsSkippedRedundant bucket: ${booksWithSkipBucket} / ${SMOKE_SLUGS.length}`);

  if (failures > 0) process.exit(1);
  process.exit(0);
}

main().catch((err) => {
  console.error("[smoke-slugs-077] failed:", err);
  process.exit(1);
});
