/**
 * Alignment normalization for faction seed rows.
 *
 * Single source of truth for two callers that both read the same JSON
 * (`scripts/seed-data/factions.json`) but at different times:
 *
 *   - `scripts/seed-resolver-extensions.ts` — seed-time write into the
 *     `factions.alignment` column (idempotent upsert).
 *   - `scripts/apply-override.ts` — apply-time lookup so the grand-alignment
 *     junction-skip in `decideFactionSkips()` (Brief 077) can compare the
 *     alignments of resolved peers without re-implementing the inference.
 *
 * Both paths normalize the same way: explicit `alignment` field wins;
 * legacy `"imperial"` is rewritten to `"imperium"`; missing fields fall
 * back to tree-inference (parent-chain / tone).
 */

export type Alignment = "imperium" | "chaos" | "xenos" | "neutral";

export const ALIGNMENT_VALUES: readonly Alignment[] = [
  "imperium",
  "chaos",
  "xenos",
  "neutral",
];

export interface FactionAlignmentInput {
  id: string;
  parent?: string | null;
  alignment?: string | null;
  tone?: string | null;
}

export function inferAlignmentFromTree(f: FactionAlignmentInput): Alignment {
  if (f.parent === "chaos" || f.id === "chaos") return "chaos";
  if (f.parent === "imperium" || f.id === "imperium") return "imperium";
  if (f.tone === "alien") return "xenos";
  return "neutral";
}

export function normalizeAlignment(f: FactionAlignmentInput): Alignment {
  if (!f.alignment) return inferAlignmentFromTree(f);
  if (f.alignment === "imperial") return "imperium";
  if ((ALIGNMENT_VALUES as readonly string[]).includes(f.alignment)) {
    return f.alignment as Alignment;
  }
  throw new Error(
    `Faction ${f.id}: invalid alignment '${f.alignment}'. Expected imperium, chaos, xenos, neutral, or legacy imperial.`,
  );
}
