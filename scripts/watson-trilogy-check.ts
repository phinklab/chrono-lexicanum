import { sql } from "drizzle-orm";
import { db } from "../src/db/client";

async function main() {
  const result = (await db.execute(sql`
    SELECT 'F' as kind, f.id::text AS id, f.name, wf.raw_name, w.slug FROM works w
      JOIN work_factions wf ON wf.work_id = w.id
      JOIN factions f ON f.id = wf.faction_id
     WHERE w.slug IN ('harlequin','chaos-child','inquisitor-draco')
    UNION ALL
    SELECT 'L', l.id, l.name, wl.raw_name, w.slug FROM works w
      JOIN work_locations wl ON wl.work_id = w.id
      JOIN locations l ON l.id = wl.location_id
     WHERE w.slug IN ('harlequin','chaos-child','inquisitor-draco')
    UNION ALL
    SELECT 'C', c.id, c.name, wc.raw_name, w.slug FROM works w
      JOIN work_characters wc ON wc.work_id = w.id
      JOIN characters c ON c.id = wc.character_id
     WHERE w.slug IN ('harlequin','chaos-child','inquisitor-draco')
     ORDER BY 1, 5, 2
  `)) as unknown as Array<{ kind: string; id: string; name: string; raw_name: string | null; slug: string }>;

  console.log(`${result.length} rows`);
  for (const r of result) {
    console.log(`${r.kind}  ${r.slug.padEnd(18)}  ${r.id.padEnd(28)}  ${r.name.padEnd(28)}  raw=${r.raw_name ?? "-"}`);
  }
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
