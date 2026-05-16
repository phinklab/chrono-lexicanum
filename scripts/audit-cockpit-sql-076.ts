/**
 * Audit-Cockpit SQL replica for Brief 076 Phase 4.
 *
 * Mirrors the four /buecher?audit=… pills (drift / gap / ssot / collections)
 * directly against Postgres and prints counts for the two book ranges
 * W40K-0001..0150 (pre-this-wave) and W40K-0151..0200 (this wave). Used to
 * sanity-check the Re-Apply sweep before declaring Phase 4 done.
 */
import { sql } from "drizzle-orm";
import { db } from "@/db/client";

type Range = { label: string; minId: string; maxId: string };

const RANGES: Range[] = [
  { label: "W40K-0001..0150", minId: "W40K-0001", maxId: "W40K-0150" },
  { label: "W40K-0151..0200", minId: "W40K-0151", maxId: "W40K-0200" },
];

type CountRow = Record<string, unknown> & {
  count: number;
};

async function probe(range: Range): Promise<void> {
  const where = sql`works.external_book_id between ${range.minId} and ${range.maxId}`;

  const total = await db.execute<CountRow>(sql`
    select count(*)::int as count from works where ${where}
  `);
  const ssotTotal = await db.execute<CountRow>(sql`
    select count(*)::int as count from works where ${where}
      and works.source_kind = 'ssot'
  `);

  // drift: rows where raw_name (override-surface-form) does not equal the
  // canonical name on the resolved reference row. Junction-row level.
  const driftFactions = await db.execute<CountRow>(sql`
    select count(distinct works.id)::int as count
    from works
    join work_factions wf on wf.work_id = works.id
    join factions f on f.id = wf.faction_id
    where ${where}
      and wf.raw_name is not null
      and wf.raw_name <> f.name
  `);
  const driftLocations = await db.execute<CountRow>(sql`
    select count(distinct works.id)::int as count
    from works
    join work_locations wl on wl.work_id = works.id
    join locations l on l.id = wl.location_id
    where ${where}
      and wl.raw_name is not null
      and wl.raw_name <> l.name
  `);
  const driftCharacters = await db.execute<CountRow>(sql`
    select count(distinct works.id)::int as count
    from works
    join work_characters wc on wc.work_id = works.id
    join characters c on c.id = wc.character_id
    where ${where}
      and wc.raw_name is not null
      and wc.raw_name <> c.name
  `);
  const driftAny = await db.execute<CountRow>(sql`
    select count(distinct works.id)::int as count
    from works
    where ${where}
      and (
        exists (
          select 1 from work_factions wf
          join factions f on f.id = wf.faction_id
          where wf.work_id = works.id
            and wf.raw_name is not null
            and wf.raw_name <> f.name
        )
        or exists (
          select 1 from work_locations wl
          join locations l on l.id = wl.location_id
          where wl.work_id = works.id
            and wl.raw_name is not null
            and wl.raw_name <> l.name
        )
        or exists (
          select 1 from work_characters wc
          join characters c on c.id = wc.character_id
          where wc.work_id = works.id
            and wc.raw_name is not null
            and wc.raw_name <> c.name
        )
      )
  `);

  // gap: works missing any of {faction, location, character} junctions.
  const gapAny = await db.execute<CountRow>(sql`
    select count(*)::int as count
    from works
    where ${where}
      and (
        not exists (select 1 from work_factions wf where wf.work_id = works.id)
        or not exists (select 1 from work_locations wl where wl.work_id = works.id)
        or not exists (select 1 from work_characters wc where wc.work_id = works.id)
      )
  `);
  const gapFactionMissing = await db.execute<CountRow>(sql`
    select count(*)::int as count
    from works
    where ${where}
      and not exists (select 1 from work_factions wf where wf.work_id = works.id)
  `);
  const gapLocationMissing = await db.execute<CountRow>(sql`
    select count(*)::int as count
    from works
    where ${where}
      and not exists (select 1 from work_locations wl where wl.work_id = works.id)
  `);
  const gapCharacterMissing = await db.execute<CountRow>(sql`
    select count(*)::int as count
    from works
    where ${where}
      and not exists (select 1 from work_characters wc where wc.work_id = works.id)
  `);

  // collections: works appearing in 2+ collections.
  const multipleCollections = await db.execute<CountRow>(sql`
    select count(*)::int as count
    from (
      select wc.content_work_id, count(*) as collections
      from work_collections wc
      join works w on w.id = wc.content_work_id
      where ${sql`w.external_book_id between ${range.minId} and ${range.maxId}`}
      group by wc.content_work_id
      having count(*) >= 2
    ) sub
  `);

  const totalRows = total as unknown as CountRow[];
  const ssotRows = ssotTotal as unknown as CountRow[];
  const driftAnyRows = driftAny as unknown as CountRow[];
  const driftFactionsRows = driftFactions as unknown as CountRow[];
  const driftLocationsRows = driftLocations as unknown as CountRow[];
  const driftCharactersRows = driftCharacters as unknown as CountRow[];
  const gapAnyRows = gapAny as unknown as CountRow[];
  const gapFactionRows = gapFactionMissing as unknown as CountRow[];
  const gapLocationRows = gapLocationMissing as unknown as CountRow[];
  const gapCharacterRows = gapCharacterMissing as unknown as CountRow[];
  const multipleCollectionsRows = multipleCollections as unknown as CountRow[];

  const n = totalRows[0]?.count ?? 0;
  console.log(`\n=== ${range.label} ===`);
  console.log(`works total:               ${n}`);
  console.log(`audit=ssot (sourceKind):    ${ssotRows[0]?.count ?? 0}`);
  console.log(`audit=drift (any axis):     ${driftAnyRows[0]?.count ?? 0}`);
  console.log(`  drift via factions:       ${driftFactionsRows[0]?.count ?? 0}`);
  console.log(`  drift via locations:      ${driftLocationsRows[0]?.count ?? 0}`);
  console.log(`  drift via characters:     ${driftCharactersRows[0]?.count ?? 0}`);
  console.log(`audit=gap (any axis 0):     ${gapAnyRows[0]?.count ?? 0}`);
  console.log(`  faction-missing:          ${gapFactionRows[0]?.count ?? 0}`);
  console.log(`  location-missing:         ${gapLocationRows[0]?.count ?? 0}`);
  console.log(`  character-missing:        ${gapCharacterRows[0]?.count ?? 0}`);
  console.log(`audit=collections (>=2):    ${multipleCollectionsRows[0]?.count ?? 0}`);
}

async function main(): Promise<void> {
  console.log("[audit-cockpit-076] SQL replica of /buecher?audit=…");
  for (const range of RANGES) {
    await probe(range);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("[audit-cockpit-076] failed:", err);
  process.exit(1);
});
