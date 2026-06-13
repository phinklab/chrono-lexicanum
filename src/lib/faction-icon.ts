/**
 * Faction → marker-icon class for book-list rows (Brief 150). PURE — no `@/db`.
 *
 * Four display classes: Imperium, Space Marines, Xenos, Chaos. The classifier
 * reads the columns the DB already carries (`factions.alignment`,
 * `factions.parent_id`, both seeded via `src/lib/seed/alignment.ts` +
 * `factions.json`): every loyalist chapter hangs directly under
 * `adeptus_astartes` in the faction tree, every traitor legion under
 * `heretic_astartes` (alignment `chaos` → Chaos class, by design — a Word
 * Bearers book reads as Chaos, not as Space Marines). `neutral` and unknown
 * alignments return null and the row keeps the plain dot fallback.
 */

export type FactionIconClass = "imperium" | "space_marines" | "xenos" | "chaos";

const ASTARTES_ROOT = "adeptus_astartes";

export interface FactionIconInput {
  id: string;
  parentId?: string | null;
  alignment?: string | null;
}

export function factionIconClass(f: FactionIconInput | null | undefined): FactionIconClass | null {
  if (!f) return null;
  if (f.alignment === "imperium") {
    if (f.id === ASTARTES_ROOT || f.parentId === ASTARTES_ROOT) return "space_marines";
    return "imperium";
  }
  if (f.alignment === "chaos") return "chaos";
  if (f.alignment === "xenos") return "xenos";
  return null;
}

/**
 * Pick the faction that decides a book row's marker: the `work_factions`
 * row with role 'primary' when present, else the first listed faction.
 */
export function primaryRowFaction<T extends { role?: string | null }>(
  factions: readonly T[],
): T | null {
  return factions.find((f) => f.role === "primary") ?? factions[0] ?? null;
}
