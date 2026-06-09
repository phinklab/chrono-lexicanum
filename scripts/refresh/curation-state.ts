/**
 * Brief 133 — per-show curation cursor (the "since the last curation run" floor).
 *
 * `ingest/refresh/curation-state.json` records, per show slug, the ISO date the
 * maintainer last REVIEWED that show up to. The weekly podcast diff uses this as
 * the show's floor (falling back to the baseline `episodeSinceDate` when a show
 * was never reviewed), so a refresh only ever surfaces episodes published after
 * the last curation — not the whole post-baseline back-catalog every week.
 *
 * The cursor advances ONLY on an explicit `refresh:mark-reviewed` (never on a
 * plain `refresh:check`), so "I looked at this show and skipped the rest" sticks:
 * skipped episodes are not re-proposed next week. Committed JSON (deterministic,
 * slugs sorted) so the cron and the maintainer share one high-water mark.
 *
 * Pure except `loadCurationState` (one fs read); the rest unit-tests offline.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface CurationState {
  /** slug → ISO date (`YYYY-MM-DD`) the maintainer last reviewed that show up to. */
  shows: Record<string, string>;
}

export const CURATION_STATE_PATH = join(
  process.cwd(),
  "ingest",
  "refresh",
  "curation-state.json",
);

export function emptyCurationState(): CurationState {
  return { shows: {} };
}

/** Validate + narrow raw JSON. Throws on a non-object or a non-date cursor value. */
export function parseCurationState(raw: unknown): CurationState {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("curation-state: top-level must be an object");
  }
  const showsRaw = (raw as { shows?: unknown }).shows;
  if (showsRaw === undefined || showsRaw === null) return { shows: {} };
  if (typeof showsRaw !== "object" || Array.isArray(showsRaw)) {
    throw new Error("curation-state.shows: must be an object of slug → ISO date");
  }
  const shows: Record<string, string> = {};
  for (const [slug, v] of Object.entries(showsRaw as Record<string, unknown>)) {
    if (typeof v !== "string" || Number.isNaN(Date.parse(v))) {
      throw new Error(`curation-state.shows.${slug}: must be a parseable ISO date string`);
    }
    shows[slug] = v;
  }
  return { shows };
}

/** Read the committed cursor file; a MISSING file is the first-run empty state (never an error). */
export function loadCurationState(path: string = CURATION_STATE_PATH): CurationState {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return emptyCurationState();
  }
  return parseCurationState(JSON.parse(text));
}

/** The floor ISO date for a show: its cursor, or the baseline when never reviewed. */
export function floorIsoForShow(state: CurationState, slug: string, baselineIso: string): string {
  return state.shows[slug] ?? baselineIso;
}

/** Return a new state with `slugs` stamped to `dateIso` (pure — caller serializes/writes). */
export function markReviewed(
  state: CurationState,
  slugs: readonly string[],
  dateIso: string,
): CurationState {
  const shows = { ...state.shows };
  for (const slug of slugs) shows[slug] = dateIso;
  return { shows };
}

/** Deterministic JSON (slugs sorted) + trailing newline — a stable committed file. */
export function serializeCurationState(state: CurationState): string {
  const sorted: Record<string, string> = {};
  for (const slug of Object.keys(state.shows).sort()) sorted[slug] = state.shows[slug];
  return `${JSON.stringify({ shows: sorted }, null, 2)}\n`;
}
