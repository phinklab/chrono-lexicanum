/**
 * Compendium inventory rows — SERVER-ONLY (imports `@/db`).
 *
 * Single-roundtrip raw-SQL aggregates (LEFT JOIN … GROUP BY sub-counts) that
 * feed the /compendium category builders. Raw SQL is deliberate: the postgres
 * client runs with `fetch_types: false` (src/db/client.ts — the transaction
 * pooler misbehaves with type introspection), so results come back as plain
 * row objects that are shape-checked and field-coerced here. Index contract
 * (S2, see `src/lib/db-cache.ts`): DB/shape errors THROW into the caller's
 * error boundary — the build never reaches these queries (it reads the
 * committed snapshot), and at request time an outage must not render as an
 * empty category.
 */
import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";

const toNumber = (v: unknown): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  return 0;
};

/**
 * Decode a Postgres array value coming back over postgres.js. With
 * `fetch_types: false` array decoding is disabled: an `array_agg(...)` column
 * arrives as the raw Postgres array literal *string* — `"{author,narrator}"`
 * — never a JS array. This parses the literal into a `string[]`, honouring
 * quoted/escaped elements and dropping unquoted SQL NULLs. An already-decoded
 * array passes straight through, so the call site stays correct if
 * `fetch_types` is ever re-enabled. Route any future `array_agg` through here.
 */
const parsePgTextArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((x) => String(x));
  if (typeof value !== "string") return [];
  const body = value.trim();
  if (!body.startsWith("{") || !body.endsWith("}")) return [];
  const inner = body.slice(1, -1);
  if (inner === "") return [];

  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  let elemQuoted = false;
  const flush = () => {
    // An unquoted NULL token is SQL NULL → drop it; quoted "NULL" is the string.
    if (!(cur === "NULL" && !elemQuoted)) out.push(cur);
    cur = "";
    elemQuoted = false;
  };
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (inQuotes) {
      if (ch === "\\") cur += inner[++i] ?? "";
      else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') {
      inQuotes = true;
      elemQuoted = true;
    } else if (ch === ",") {
      flush();
    } else {
      cur += ch;
    }
  }
  flush();
  return out;
};

/**
 * Shape-check a raw `db.execute()` result before treating it as a row set.
 * Validates the one structural assumption (array of plain row objects) at
 * runtime and throws loudly (S2 shape-error contract); field-level coercion
 * stays with `toNumber`/`parsePgTextArray`.
 */
function validateSqlResult(result: unknown): ReadonlyArray<Record<string, unknown>> {
  if (!Array.isArray(result)) {
    throw new Error("[compendium/queries] SQL result is not a row array");
  }
  const rows: Array<Record<string, unknown>> = [];
  for (const row of result) {
    if (typeof row !== "object" || row === null || Array.isArray(row)) {
      throw new Error("[compendium/queries] SQL result row is not a plain object");
    }
    rows.push(row);
  }
  return rows;
}

export interface WeltenRow {
  id: string;
  name: string;
  sectorId: string | null;
  sectorName: string | null;
  gx: number | null;
  gy: number | null;
  capital: boolean;
  warp: boolean;
  workCount: number;
}

export async function getWeltenRows(): Promise<WeltenRow[]> {
  const rows = validateSqlResult(await db.execute(sql`
    SELECT
      l.id,
      l.name,
      l.sector_id,
      s.name AS sector_name,
      l.gx,
      l.gy,
      l.capital,
      l.warp,
      COALESCE(wl.cnt, 0)::int AS work_count
    FROM locations l
    LEFT JOIN sectors s ON s.id = l.sector_id
    LEFT JOIN (
      SELECT location_id, count(*)::int AS cnt
      FROM work_locations
      GROUP BY location_id
    ) wl ON wl.location_id = l.id
  `));

  return rows
    .map((r): WeltenRow => ({
      id: String(r["id"]),
      name: String(r["name"]),
      sectorId: r["sector_id"] == null ? null : String(r["sector_id"]),
      sectorName: r["sector_name"] == null ? null : String(r["sector_name"]),
      gx: r["gx"] == null ? null : toNumber(r["gx"]),
      gy: r["gy"] == null ? null : toNumber(r["gy"]),
      capital: r["capital"] === true,
      warp: r["warp"] === true,
      workCount: toNumber(r["work_count"]),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "de"));
}

export interface CharaktereRow {
  id: string;
  name: string;
  primaryFactionId: string | null;
  primaryFactionName: string | null;
  primaryFactionAlignment: string | null;
  workCount: number;
}

export async function getCharaktereRows(): Promise<CharaktereRow[]> {
  const rows = validateSqlResult(await db.execute(sql`
    SELECT
      c.id,
      c.name,
      c.primary_faction_id,
      f.name      AS faction_name,
      f.alignment AS faction_alignment,
      COALESCE(wc.cnt, 0)::int AS work_count
    FROM characters c
    LEFT JOIN factions f ON f.id = c.primary_faction_id
    LEFT JOIN (
      SELECT character_id, count(*)::int AS cnt
      FROM work_characters
      GROUP BY character_id
    ) wc ON wc.character_id = c.id
  `));

  return rows
    .map((r): CharaktereRow => ({
      id: String(r["id"]),
      name: String(r["name"]),
      primaryFactionId:
        r["primary_faction_id"] == null ? null : String(r["primary_faction_id"]),
      primaryFactionName:
        r["faction_name"] == null ? null : String(r["faction_name"]),
      primaryFactionAlignment:
        r["faction_alignment"] == null ? null : String(r["faction_alignment"]),
      workCount: toNumber(r["work_count"]),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "de"));
}

export interface PersonenRow {
  id: string;
  name: string;
  nameSort: string;
  workCount: number;
  isAuthor: boolean;
  roles: string[];
}

export async function getPersonenRows(): Promise<PersonenRow[]> {
  const rows = validateSqlResult(await db.execute(sql`
    SELECT
      p.id,
      p.name,
      p.name_sort,
      COALESCE(wp.cnt, 0)::int       AS work_count,
      COALESCE(wp.is_author, false)  AS is_author,
      wp.roles                       AS roles
    FROM persons p
    LEFT JOIN (
      SELECT
        person_id,
        count(DISTINCT work_id)::int                       AS cnt,
        bool_or(role = 'author')                           AS is_author,
        array_agg(DISTINCT role::text ORDER BY role::text) AS roles
      FROM work_persons
      GROUP BY person_id
    ) wp ON wp.person_id = p.id
  `));

  return rows
    .map((r): PersonenRow => {
      const roles = parsePgTextArray(r["roles"]);
      return {
        id: String(r["id"]),
        name: String(r["name"]),
        nameSort: String(r["name_sort"]),
        workCount: toNumber(r["work_count"]),
        isAuthor: r["is_author"] === true,
        roles,
      };
    })
    .sort((a, b) => a.nameSort.localeCompare(b.nameSort, "de"));
}
