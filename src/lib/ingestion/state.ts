/**
 * Resumable run-state persistence. Saves to `ingest/.state/in-progress.json`
 * atomically (write to temp file then rename). Cleared on successful run
 * completion. The state allows the CLI to resume a Ctrl-C'd or crashed run
 * from where it left off — critical for the 8–12h overnight backfill in 3e
 * but already wired in here so the engine never needs retro-fitting.
 */
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { RunState } from "./types";

const STATE_DIR = join(process.cwd(), "ingest", ".state");
const STATE_FILE = join(STATE_DIR, "in-progress.json");

export async function loadState(): Promise<RunState | null> {
  try {
    const raw = await readFile(STATE_FILE, "utf8");
    return JSON.parse(raw) as RunState;
  } catch (e) {
    if (isNotFoundError(e)) return null;
    throw e;
  }
}

export async function saveState(state: RunState): Promise<void> {
  await mkdir(STATE_DIR, { recursive: true });
  const tmp = STATE_FILE + ".tmp";
  await writeFile(tmp, JSON.stringify(state, null, 2), "utf8");
  await rename(tmp, STATE_FILE);
}

export async function clearState(): Promise<void> {
  try {
    await rm(STATE_FILE, { force: true });
  } catch (e) {
    if (!isNotFoundError(e)) throw e;
  }
}

export const STATE_FILE_PATH = STATE_FILE;

function isNotFoundError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: string }).code === "ENOENT"
  );
}

/** Sanity-check: writing requires the parent dir; this helper exists so the
 *  CLI can pre-create on startup. */
export async function ensureStateDir(): Promise<void> {
  await mkdir(dirname(STATE_FILE), { recursive: true });
}
