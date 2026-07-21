/**
 * Precomputed Ask result matrix + `any`-aggregation. SERVER-ONLY:
 * built from `recommend()`, which imports the DB client.
 *
 * After the contract reduction the visible space is small: 3 experience × 5
 * faction × 5 tone × 3 length = 225 visible combinations, of which 3×4×4×3 =
 * 144 are *concrete* (no `any_faction`/`any_tone`). Each concrete profile gets a
 * Top-`MATRIX_CELL_LIMIT` cell, built once and cached. The `any` options are not
 * their own cells and do not score "points on everything": they are a
 * deterministic, deduped *merge* of the concrete cells they span:
 *   - `any_faction` → merge the 4 concrete faction cells (same experience/tone/length)
 *   - `any_tone`    → merge the 4 concrete tone cells
 *   - both `any`    → merge the 4×4 concrete faction×tone cells
 * Lane-scoped anchors come along for free — they live in their concrete cell,
 * which the merge includes.
 *
 * The hot path (the Four Questions page) reads cells from the cache: no per-request DB. Only
 * "Browse deeper" goes live. The cache is cleared via the same revalidate path
 * as `cachedAskBooks`.
 */
import { memoryCachedRead } from "@/lib/memory-cache";
import { compareByMerit } from "./compare";
import { recommend } from "./recommend";
import type { AskAnswers, AskRecommendation } from "./types";

export const MATRIX_CELL_LIMIT = 6;

export const CONCRETE_FACTIONS = [
  "imperium_of_man",
  "loyalist_sm",
  "heretic",
  "xenos",
] as const;

export const CONCRETE_TONES = [
  "grimdark",
  "heroic",
  "investigative",
  "military",
] as const;

const EXPERIENCES = ["new", "some", "deep"] as const;
const LENGTHS = ["standalone", "trilogy", "any_length"] as const;

function concreteAnswers(
  experience: string,
  faction: string,
  tone: string,
  length: string,
): AskAnswers {
  return {
    experience: experience as AskAnswers["experience"],
    faction_love: faction as AskAnswers["faction_love"],
    tone: tone as AskAnswers["tone"],
    length: length as AskAnswers["length"],
  };
}

function cellKey(experience: string, faction: string, tone: string, length: string): string {
  return `${experience}|${faction}|${tone}|${length}`;
}

/**
 * Merge concrete cells into one ranked list: dedupe by slug (keeping the
 * strongest-scoring instance of a book across the spanned cells), re-sort with
 * the shared comparator, take Top-`limit`. Pure and deterministic.
 */
export function mergeAskCells(
  cells: readonly (readonly AskRecommendation[])[],
  limit: number,
): AskRecommendation[] {
  const bySlug = new Map<string, AskRecommendation>();
  for (const cell of cells) {
    for (const rec of cell) {
      const existing = bySlug.get(rec.slug);
      if (!existing || compareByMerit(rec, existing) < 0) bySlug.set(rec.slug, rec);
    }
  }
  return [...bySlug.values()].sort(compareByMerit).slice(0, limit);
}

type ConcreteCellProvider = (
  concrete: AskAnswers,
) => Promise<readonly AskRecommendation[]> | readonly AskRecommendation[];

/**
 * Resolve one visible combination (concrete or `any_*`) from a concrete-cell
 * provider. Shared by the production matrix (provider = cache lookup) and the
 * combination audit (provider = live `recommend()`).
 */
async function resolveFromCells(
  answers: AskAnswers,
  limit: number,
  getConcrete: ConcreteCellProvider,
): Promise<AskRecommendation[]> {
  const { experience, length } = answers;
  const faction = answers.faction_love;
  const tone = answers.tone;
  if (!experience || !length || !faction || !tone) return [];

  const factions: string[] = faction === "any_faction" ? [...CONCRETE_FACTIONS] : [faction];
  const tones: string[] = tone === "any_tone" ? [...CONCRETE_TONES] : [tone];

  if (factions.length === 1 && tones.length === 1) {
    const cell = await getConcrete(concreteAnswers(experience, factions[0], tones[0], length));
    return cell.slice(0, limit);
  }

  const cells: AskRecommendation[][] = [];
  for (const f of factions) {
    for (const t of tones) {
      cells.push([...(await getConcrete(concreteAnswers(experience, f, t, length)))]);
    }
  }
  return mergeAskCells(cells, limit);
}

/**
 * Resolve a visible combination by computing each concrete cell live via
 * `recommend()` (book-cached, so no per-request DB). Used by the combination
 * audit and as the standalone resolver; the production hot path uses
 * {@link getAskMatrixCell} which serves from the precomputed cache instead.
 */
export function resolveAskCell(
  answers: AskAnswers,
  opts: { limit: number; cacheBooks?: boolean },
): Promise<AskRecommendation[]> {
  const cacheBooks = opts.cacheBooks ?? true;
  return resolveFromCells(answers, opts.limit, async (concrete) => {
    const result = await recommend(concrete, {
      limit: opts.limit,
      cacheBooks,
      onError: "throw",
    });
    return result.recommendations;
  });
}

async function buildMatrix(): Promise<Map<string, AskRecommendation[]>> {
  const cells = new Map<string, AskRecommendation[]>();
  for (const experience of EXPERIENCES) {
    for (const faction of CONCRETE_FACTIONS) {
      for (const tone of CONCRETE_TONES) {
        for (const length of LENGTHS) {
          const result = await recommend(concreteAnswers(experience, faction, tone, length), {
            limit: MATRIX_CELL_LIMIT,
            cacheBooks: true,
            onError: "throw",
          });
          cells.set(cellKey(experience, faction, tone, length), result.recommendations);
        }
      }
    }
  }
  return cells;
}

/**
 * The 144-cell matrix behind the /ask hot path. `memoryCachedRead` keeps the
 * rejection eviction the ad-hoc promise slot already had (a transient DB
 * failure must not wedge /ask) and adds the TTL + fill coalescing it lacked.
 * Cleared by `POST /api/revalidate` via `resetMemoryCaches()`.
 */
const cachedMatrix = memoryCachedRead(buildMatrix);

/**
 * The production accessor: returns the Top-`MATRIX_CELL_LIMIT` cell for a
 * complete profile from the precomputed, cached 144-cell matrix (`any_*`
 * resolved by merging cached concrete cells). Builds the matrix on first use.
 */
export async function getAskMatrixCell(answers: AskAnswers): Promise<AskRecommendation[]> {
  const matrix = await cachedMatrix();
  return resolveFromCells(answers, MATRIX_CELL_LIMIT, (concrete) =>
    matrix.get(
      cellKey(
        concrete.experience ?? "",
        concrete.faction_love ?? "",
        concrete.tone ?? "",
        concrete.length ?? "",
      ),
    ) ?? [],
  );
}
