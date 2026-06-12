/**
 * Shared proposal locator for the maintainer CLIs (`refresh:ignore-book`,
 * `refresh:mark-reviewed -- --books`): resolve and load the
 * `ingest/refresh/<YYYY-Www>/proposal.json` a command should act on.
 *
 * "Newest" is name-sorted, not mtime: `isoWeekOf` zero-pads the week, so the
 * dirs sort lexicographically even across year boundaries ("2025-W52" <
 * "2026-W01"). `--week` / `--proposal` overrides win.
 *
 * Sequencing note: week dirs land on `main` only when the rolling PR is
 * MERGED. Resolving "newest" against a checkout that predates an open PR finds
 * an older proposal — fetch/merge first, or pass `--proposal <path>`.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { RefreshProposal } from "./types";

const REFRESH_DIR = join(process.cwd(), "ingest", "refresh");

/** Locate the proposal to act on (newest week dir, unless overridden). */
export function findProposalPath(opts: { week?: string; proposal?: string }): string {
  if (opts.proposal) return opts.proposal;
  if (opts.week) return join(REFRESH_DIR, opts.week, "proposal.json");
  let weeks: string[] = [];
  try {
    weeks = readdirSync(REFRESH_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory() && /^\d{4}-W\d{2}$/.test(d.name))
      .map((d) => d.name)
      .sort()
      .reverse();
  } catch {
    weeks = [];
  }
  for (const w of weeks) {
    const p = join(REFRESH_DIR, w, "proposal.json");
    if (existsSync(p)) return p;
  }
  throw new Error(
    "no proposal.json found under ingest/refresh/<week>/ — run `npm run refresh:check` " +
      "first, or pass --proposal <path>",
  );
}

export function loadProposal(path: string): RefreshProposal {
  if (!existsSync(path)) throw new Error(`proposal not found: ${path}`);
  return JSON.parse(readFileSync(path, "utf8")) as RefreshProposal;
}
