/**
 * Brief 045 — Per-Slug Loader für Variant B + Variant C.
 *
 * Liest aus den Source-Diffs die `payload` (= MergedBook), die optionale
 * `rawHardcoverPayload` und den `wikipediaTitle`. Fetcht den `PlotContext`
 * frisch (Wikipedia + Lexicanum), damit Variant B's Input äquivalent zu
 * Variant A's Input ist.
 *
 * Pure Read-Only — kein Pipeline-Edit. Importe gehen ausschließlich gegen
 * existierende Pipeline-Module.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { fetchPlotContext, type PlotContext } from "@/lib/ingestion/llm/context";
import type {
  AddedEntry,
  DiffFile,
  MergedBook,
  SkippedManualEntry,
  UpdatedEntry,
} from "@/lib/ingestion/types";

export interface SlugSpec {
  slug: string;
  diffPath: string;
}

export interface LoadedSlug {
  slug: string;
  wikipediaTitle: string;
  merged: MergedBook;
  rawHardcoverPayload?: { tags?: string[]; averageRating?: number };
  plotContext: PlotContext;
}

const REPO_ROOT = process.cwd();

/**
 * 6 Slugs aus Brief 045 § Notes mit ihren Source-Diff-Zuordnungen.
 *
 * Reihenfolge ist die Ablauf-Reihenfolge der Runner. Brief § Reihenfolge-
 * Empfehlung: Anthologien zuerst (Author-Mismatch-Test), dann Vokabular-
 * Drift, dann Plausibility/Synopsen-Drift, am Ende der Tagging-Failure.
 */
export const TARGET_SLUGS: SlugSpec[] = [
  {
    slug: "shattered-legions",
    diffPath: "ingest/.last-run/backfill-20260505-2247.diff.json",
  },
  {
    slug: "sons-of-the-emperor",
    diffPath: "ingest/.last-run/backfill-20260505-2247.diff.json",
  },
  {
    slug: "the-master-of-mankind",
    diffPath: "ingest/.last-run/backfill-20260505-2247.diff.json",
  },
  {
    slug: "garro",
    diffPath: "ingest/.last-run/backfill-20260505-2247.diff.json",
  },
  {
    slug: "the-solar-war",
    diffPath: "ingest/.last-run/backfill-20260505-2247.diff.json",
  },
  {
    slug: "mark-of-calth",
    diffPath: "ingest/.last-run/backfill-20260503-2308.diff.json",
  },
];

const diffCache = new Map<string, DiffFile>();

async function loadDiff(diffPath: string): Promise<DiffFile> {
  const abs = resolve(REPO_ROOT, diffPath);
  const cached = diffCache.get(abs);
  if (cached) return cached;
  const raw = await readFile(abs, "utf8");
  const parsed = JSON.parse(raw) as DiffFile;
  diffCache.set(abs, parsed);
  return parsed;
}

interface DiffEntryLookup {
  wikipediaTitle: string;
  payload: MergedBook;
  rawHardcoverPayload?: { tags?: string[]; averageRating?: number };
}

function findInDiff(diff: DiffFile, slug: string): DiffEntryLookup | null {
  const added: AddedEntry | undefined = diff.added.find((x) => x.slug === slug);
  if (added) {
    return {
      wikipediaTitle: added.wikipediaTitle,
      payload: added.payload,
      rawHardcoverPayload: added.rawHardcoverPayload,
    };
  }
  // Updated/skipped entries don't carry the merged payload — for the 6 target
  // slugs all are in `added`, so fall through to a clear error.
  const updated: UpdatedEntry | undefined = diff.updated.find(
    (x) => x.slug === slug,
  );
  if (updated) {
    throw new Error(
      `slug ${slug} found in diff.updated, not added — UpdatedEntry has no merged payload to feed buildUserPrompt(). Use a diff where this slug is in added.`,
    );
  }
  const skipped: SkippedManualEntry | undefined = diff.skipped_manual.find(
    (x) => x.slug === slug,
  );
  if (skipped) {
    throw new Error(
      `slug ${skipped.slug} is skipped_manual — manual override path. Cannot reconstruct prompt input.`,
    );
  }
  return null;
}

export async function loadSlug(spec: SlugSpec): Promise<LoadedSlug> {
  const diff = await loadDiff(spec.diffPath);
  const found = findInDiff(diff, spec.slug);
  if (!found) {
    throw new Error(
      `slug ${spec.slug} not found in ${spec.diffPath} (looked in added/updated/skipped_manual)`,
    );
  }
  const plotContext = await fetchPlotContext(found.payload);
  return {
    slug: spec.slug,
    wikipediaTitle: found.wikipediaTitle,
    merged: found.payload,
    rawHardcoverPayload: found.rawHardcoverPayload,
    plotContext,
  };
}
