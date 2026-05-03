/**
 * Writes the finalized DiffFile to `ingest/.last-run/backfill-<TS>.diff.json`.
 * Returns the absolute path written. The directory is committed to git
 * (with a `.gitkeep`) so test-run diffs become artefacts in the repo.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { DiffFile } from "./types";

const LAST_RUN_DIR = join(process.cwd(), "ingest", ".last-run");

export async function writeFinalDiff(diff: DiffFile): Promise<string> {
  await mkdir(LAST_RUN_DIR, { recursive: true });
  const stamp = formatTimestamp(new Date(diff.ranAt));
  const file = join(LAST_RUN_DIR, `backfill-${stamp}.diff.json`);
  await writeFile(file, JSON.stringify(diff, null, 2), "utf8");
  return file;
}

export const LAST_RUN_DIR_PATH = LAST_RUN_DIR;

function formatTimestamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "-" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes())
  );
}
