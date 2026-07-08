/**
 * App loader for the "One faction, one book" curation data.
 *
 * Mechanical mirror of the anchor/heresy-book pattern: committed JSON →
 * `resolveJsonModule` static import → validated in-memory tree, no DB, no `fs`.
 * The runtime tool is DB-FREE — book titles were resolved to slugs ahead of
 * build by `scripts/import-faction-starters.ts`; here we only read.
 *
 * The schema, validator, and pure lookups live in `faction-starters-schema.ts`
 * (JSON-free, so the convert step can share them). This file binds them to the
 * committed JSON and re-exports the convenient surface for routes/components.
 */
import startersJson from "../../../scripts/seed-data/faction-starters.json";
import {
  validateFactionStarters,
  type FactionStarterNode,
  type FactionStartersFile,
} from "./faction-starters-schema";

export type {
  FactionStarterKind,
  FactionStarterPick,
  FactionStarterNode,
  FactionStartersFile,
} from "./faction-starters-schema";
export {
  nodeHasPicks,
  isGroupNode,
  findFaction,
  findSubfaction,
} from "./faction-starters-schema";

/** Validated curation tree (throws at module init on a malformed JSON). */
export const FACTION_STARTERS: FactionStartersFile = validateFactionStarters(
  startersJson as unknown,
);

/** Top-level faction nodes, in display (Excel) order. */
export const FACTION_STARTER_NODES: readonly FactionStarterNode[] = FACTION_STARTERS.starters;

/**
 * A resolved drilldown location: the chosen faction, the chosen subfaction (if
 * any), and the leaf node whose picks should render (faction for a leaf/both
 * node, subfaction for a drilled-in group). `null` leaf ⇒ a group node with the
 * subfaction level open and nothing selected under it yet.
 */
export interface FactionStarterSelection {
  faction: FactionStarterNode;
  subfaction: FactionStarterNode | null;
  /** The node whose picks are shown (faction or subfaction); null for a group landing. */
  leaf: FactionStarterNode | null;
}
