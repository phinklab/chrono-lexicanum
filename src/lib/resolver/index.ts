/**
 * Resolver — Surface-Form → Canonical-ID mapping for factions / locations /
 * characters.
 *
 * Brief 063 (2026-05-12): two-stage resolution.
 *   Stage 1 — Direct-Match: exact case-sensitive lookup against the canonical
 *             `name` field of the entity's seed-data JSON.
 *   Stage 2 — Alias-Lookup: exact lookup against the surface-form keys of the
 *             entity's `<entity>-aliases.json` mapping table.
 *   Stage 3 (slug-match) deliberately omitted. Empirie from the first 50 W40K
 *   override files shows Stage 1+2 with the Cowork-curated alias tables
 *   resolves the meaningful surface forms cleanly, and slug-match would
 *   false-positively catch "Imperial Guard" → `imperial_guard` instead of
 *   routing it to `astra_militarum` via alias. If a future 50er-resolver-round
 *   surfaces a gap that only slug-match closes, add Stage 3 then.
 *
 * Data files are imported at module-init via TypeScript's `resolveJsonModule`,
 * so they are bundled into the build output (Node.js scripts + Next.js server
 * components alike) — no runtime `readFileSync`, no `process.cwd()` games.
 * After `seed-resolver-extensions` has applied the same JSONs to Postgres,
 * the JSON content is equivalent to the DB; the resolver therefore needs no
 * DB connection.
 */
import factionsCanon from "../../../scripts/seed-data/factions.json";
import locationsCanon from "../../../scripts/seed-data/locations.json";
import charactersCanon from "../../../scripts/seed-data/characters.json";
import factionAliases from "../../../scripts/seed-data/faction-aliases.json";
import locationAliases from "../../../scripts/seed-data/location-aliases.json";
import characterAliases from "../../../scripts/seed-data/character-aliases.json";

export interface Resolution {
  id: string | null;
  raw: string;
}

export type { CharacterJunctionRole } from "./roles";
export { normalizeCharacterRole } from "./roles";

// Build name→id lookup maps once at module-init.
const factionByName = new Map<string, string>(
  factionsCanon.map((f) => [f.name, f.id]),
);
const locationByName = new Map<string, string>(
  locationsCanon.map((l) => [l.name, l.id]),
);
const characterByName = new Map<string, string>(
  charactersCanon.map((c) => [c.name, c.id]),
);

function lookup(
  name: string,
  byName: Map<string, string>,
  aliases: Record<string, string>,
): Resolution {
  const direct = byName.get(name);
  if (direct !== undefined) return { id: direct, raw: name };
  const aliasId = aliases[name];
  if (aliasId !== undefined) return { id: aliasId, raw: name };
  return { id: null, raw: name };
}

export function resolveFaction(name: string): Resolution {
  return lookup(name, factionByName, factionAliases as Record<string, string>);
}

export function resolveLocation(name: string): Resolution {
  return lookup(name, locationByName, locationAliases as Record<string, string>);
}

export function resolveCharacter(name: string): Resolution {
  return lookup(name, characterByName, characterAliases as Record<string, string>);
}
