/**
 * Pipeline V2 — pilot orchestrator (Brief 054).
 *
 * Hardcoded 5-slug pilot ("v2-tryout-1"): eisenhorn-xenos, false-gods, garro,
 * tales-of-heresy, chem-dog. Discovery sources are Wikipedia (V1 parser
 * adapted) + TLBranson (new V2 parser). For each pilot book:
 *
 *   - Stage 1 — fetch source claims (lexicanum-v2, OL-v2, hardcover-v2).
 *   - Stage 2 — run all five validators against the claims + DiscoveredBook.
 *   - Stage 3 — call the slim LLM (max_uses=3 web_search, no rating/avail).
 *   - Stage 4 — fold raw claims + validations + LLM output into a
 *     `BookV2Record`. Per-field policy is explicit in `foldFields` below;
 *     validator suggestions take precedence over raw claims.
 *
 * Aggregates an `errors[]` for true crawler failures (HTTP, GraphQL, missing
 * token) — author-mismatches are NOT errors in V2.
 *
 * The diff file is written via `writeV2Diff` and committed to
 * `ingest/.last-run/v2-pilot-YYYYMMDD-HHMM.diff.json`.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { db } from "@/db/client";
import { works } from "@/db/schema";
import { slugify } from "@/lib/slug";

import { wikipediaEntryToDiscovered } from "../discovery/types";
import { mergeDiscoveredBooks } from "../discovery/merge";
import { SOURCE_CONFIDENCE } from "../source-confidence";
import { fetchTlbransonPage, type TLBransonPageSlug } from "../tlbranson/fetch";
import { parseTlbransonPage } from "../tlbranson/parse";
import type {
  BookFormat,
  MergedBook,
  SourceName,
  SourcePayload,
  WikipediaBookEntry,
} from "../types";
import { fetchWikipediaPage } from "../wikipedia/fetch";
import { parseWikipediaList } from "../wikipedia/parse";

import { discoverHardcoverClaimV2 } from "./sources/hardcover";
import { discoverLexicanumClaimV2 } from "./sources/lexicanum";
import { discoverOpenLibraryClaimV2 } from "./sources/open-library";
import {
  emptyValidationSummary,
  mergeValidationSummaries,
  runAllValidators,
  summarizeValidations,
} from "./validators";
import { enrichBookWithLlmV2 } from "./llm/enrich";
import { PROMPT_VERSION_HASH_V2 } from "./llm/prompt";
import { isLlmEnabled, getLlmModel } from "../llm/enrich";
import { isHardcoverEnabled } from "../hardcover/fetch";
import type {
  BookLlmCostSummary,
  BookV2Fields,
  BookV2Record,
  ClaimSource,
  DiscoveredBook,
  FieldRecord,
  FieldRecordSource,
  RoleAnnotated,
  SlimLlmPayload,
  SourceClaim,
  V2DiffFile,
  V2RunLlmCostSummary,
  Validation,
} from "./types";

export const PILOT_V2_TRYOUT_1 = [
  "eisenhorn-xenos",
  "false-gods",
  "garro",
  "tales-of-heresy",
  "chem-dog",
] as const;

/**
 * Fuzzy-match hints for the pilot slugs. Used when direct slug match against
 * the discovery roster misses — typical case: Wikipedia lists a book under a
 * shorter or differently-prefixed title (e.g. master list shows "Xenos" by
 * Dan Abnett under the Eisenhorn section, slug "xenos"; the pilot wants
 * "eisenhorn-xenos"). We resolve via title-fragment + author/series hint.
 *
 * `desiredTitle` is what we rewrite the matched book's title to (so the
 * downstream Lexicanum/OL queries fire on the more-specific name).
 */
const PILOT_HINTS: Record<
  string,
  { titleFragment: string; authorFragment?: string; seriesFragment?: string; desiredTitle?: string }
> = {
  "eisenhorn-xenos": {
    titleFragment: "xenos",
    authorFragment: "abnett",
    seriesFragment: "eisenhorn",
    desiredTitle: "Eisenhorn: Xenos",
  },
  "false-gods": { titleFragment: "false gods" },
  "garro": { titleFragment: "garro" },
  "tales-of-heresy": { titleFragment: "tales of heresy" },
  "chem-dog": { titleFragment: "chem dog", authorFragment: "callum" },
};

const WIKIPEDIA_DISCOVERY_PAGES = [
  "List_of_Warhammer_40,000_novels",
  "Horus_Heresy_(novels)",
  "Siege_of_Terra",
  "Eisenhorn",
];

const TLBRANSON_PAGES: TLBransonPageSlug[] = [
  "warhammer-40k-books-in-order",
  "horus-heresy-reading-order",
];

interface PilotErrorEntry {
  source: string;
  slug?: string;
  message: string;
}

export async function runV2Pilot(pilotName: string): Promise<string> {
  const startedAt = new Date().toISOString();
  const errors: PilotErrorEntry[] = [];

  // ── Stage 0 — Discovery ─────────────────────────────────────────────
  console.log(`[v2-pilot ${pilotName}] discovery: wikipedia + tlbranson`);
  const wikipediaDiscovered: DiscoveredBook[] = [];
  const wikipediaPagesUsed: string[] = [];
  for (const pageName of WIKIPEDIA_DISCOVERY_PAGES) {
    try {
      const page = await fetchWikipediaPage(pageName);
      const entries: WikipediaBookEntry[] = parseWikipediaList(page);
      console.log(`  wikipedia/${pageName}: ${entries.length} entries`);
      wikipediaPagesUsed.push(page.url);
      for (const e of entries) wikipediaDiscovered.push(wikipediaEntryToDiscovered(e));
    } catch (e) {
      errors.push({
        source: "wikipedia",
        message: `discovery ${pageName}: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  }

  const tlbransonDiscovered: DiscoveredBook[] = [];
  const tlbransonPagesUsed: string[] = [];
  for (const slug of TLBRANSON_PAGES) {
    try {
      const page = await fetchTlbransonPage(slug);
      const entries = parseTlbransonPage(page);
      console.log(
        `  tlbranson/${slug}: ${entries.length} entries${page.cached ? " (cached)" : ""}`,
      );
      tlbransonPagesUsed.push(page.url);
      if (entries.length === 0) {
        errors.push({
          source: "tlbranson",
          message: `discovery ${slug}: parser produced 0 entries — site structure may have changed`,
        });
      }
      tlbransonDiscovered.push(...entries);
    } catch (e) {
      errors.push({
        source: "tlbranson",
        message: `discovery ${slug}: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  }

  const merged = mergeDiscoveredBooks(wikipediaDiscovered, tlbransonDiscovered);
  console.log(
    `  total roster: ${merged.length} (${wikipediaDiscovered.length} wiki + ${tlbransonDiscovered.length} tlbranson, deduped)`,
  );

  // Filter to the 5 pilot slugs. First try direct slug-match. For any pilot
  // slug that misses, fall back to fuzzy match using PILOT_HINTS.
  const pilotSet = new Set<string>(PILOT_V2_TRYOUT_1);
  const found: DiscoveredBook[] = [];
  for (const pilotSlug of PILOT_V2_TRYOUT_1) {
    const direct = merged.find((b) => b.slug === pilotSlug);
    if (direct) {
      found.push(direct);
      continue;
    }
    const hints = PILOT_HINTS[pilotSlug];
    if (!hints) continue;
    const fuzzy = fuzzyMatch(merged, hints);
    if (fuzzy) {
      // Rewrite slug + (optional) title to the canonical pilot form.
      const rewritten: DiscoveredBook = {
        ...fuzzy,
        slug: pilotSlug,
        title: hints.desiredTitle ?? fuzzy.title,
      };
      found.push(rewritten);
      console.log(
        `  fuzzy-matched ${pilotSlug} ← roster slug "${fuzzy.slug}" (title: "${fuzzy.title}")`,
      );
      continue;
    }
    // Synthesize minimal record so Stage 1 can still attempt source-claim
    // fetches against the canonical title.
    const synth = synthesizeMissingBook(pilotSlug, hints.desiredTitle);
    if (synth) {
      found.push(synth);
      errors.push({
        source: "discovery",
        slug: pilotSlug,
        message: `not found in any discovery source — synthesized minimal record from slug`,
      });
    }
  }
  void pilotSet;

  // ── Stage 1–4 per book ──────────────────────────────────────────────
  const records: BookV2Record[] = [];
  let runCost: V2RunLlmCostSummary = {
    totalTokensIn: 0,
    totalTokensOut: 0,
    totalWebSearches: 0,
    estUsdCost: 0,
  };
  let validationSummary = emptyValidationSummary();
  const llmModel = getLlmModel();

  // Sort to preserve a stable processing order matching PILOT_V2_TRYOUT_1.
  found.sort(
    (a, b) =>
      PILOT_V2_TRYOUT_1.indexOf(a.slug as (typeof PILOT_V2_TRYOUT_1)[number]) -
      PILOT_V2_TRYOUT_1.indexOf(b.slug as (typeof PILOT_V2_TRYOUT_1)[number]),
  );

  for (let i = 0; i < found.length; i++) {
    const book = found[i];
    console.log(`[${i + 1}/${found.length}] ${book.title} (${book.slug})`);

    // Stage 1 — claims.
    const { claims, claimErrors } = await fetchSourceClaims(book);
    for (const e of claimErrors) errors.push(e);

    // Stage 2 — validators.
    const validations = runAllValidators(claims, book);
    validationSummary = mergeValidationSummaries(
      validationSummary,
      summarizeValidations(validations),
    );
    for (const v of validations) {
      console.log(`  validation: ${v.kind} (severity=${v.severity}) on ${v.field}`);
    }

    // Stage 3 — slim LLM.
    let llmPayload: SlimLlmPayload | null = null;
    let llmCost: BookLlmCostSummary | null = null;
    if (isLlmEnabled()) {
      try {
        const firstPass = buildFirstPassMerged(book, claims, validations);
        const enrich = await enrichBookWithLlmV2(
          firstPass.merged,
          firstPass.payloads,
          validations,
        );
        if (enrich) {
          llmPayload = enrich.payload;
          const usage = enrich.payload.audit.tokenUsage;
          llmCost = {
            tokensIn: usage.input,
            tokensOut: usage.output,
            webSearches: usage.webSearchCount,
            estUsdCost: enrich.estUsdCost,
          };
          runCost = {
            totalTokensIn: runCost.totalTokensIn + usage.input,
            totalTokensOut: runCost.totalTokensOut + usage.output,
            totalWebSearches: runCost.totalWebSearches + usage.webSearchCount,
            estUsdCost: runCost.estUsdCost + enrich.estUsdCost,
          };
          console.log(
            `  llm: ${usage.input}+${usage.output} tokens, ${usage.webSearchCount} web_search ${enrich.cached ? "(cached)" : `($${enrich.estUsdCost.toFixed(3)})`}`,
          );
        }
      } catch (e) {
        errors.push({
          source: "llm",
          slug: book.slug,
          message: e instanceof Error ? e.message : String(e),
        });
      }
    } else {
      errors.push({
        source: "llm",
        message: "ANTHROPIC_API_KEY missing — LLM enrichment skipped",
      });
    }

    // Stage 4 — fold into BookV2Record.
    const record = foldIntoBookV2Record(
      book,
      claims,
      validations,
      llmPayload,
      llmCost,
    );
    records.push(record);
  }

  const ranAt = new Date().toISOString();
  const activeSources: SourceName[] = ["lexicanum", "open_library"];
  if (isHardcoverEnabled()) activeSources.push("hardcover");
  if (isLlmEnabled()) activeSources.push("llm");

  const diff: V2DiffFile = {
    ranAt,
    pipeline: "v2",
    pilot: pilotName,
    discoverySource: ["wikipedia", "tlbranson"],
    discoveryPages: [...wikipediaPagesUsed, ...tlbransonPagesUsed],
    activeSources,
    discovered: merged.length,
    added: records,
    updated: [],
    skipped_manual: [],
    skipped_unchanged: [],
    field_conflicts: [],
    errors: errors.map((e) => ({ source: e.source, slug: e.slug, message: e.message })),
    validationSummary,
    llmModel,
    llmPromptVersion: PROMPT_VERSION_HASH_V2,
    llmCostSummary: runCost,
  };

  const path = await writeV2Diff(diff, startedAt);

  console.log(`\nwrote diff: ${path}`);
  console.log(
    `summary: ${records.length} records, ${errors.length} errors, validations:`,
    validationSummary,
  );
  console.log(
    `cost: $${runCost.estUsdCost.toFixed(3)} ` +
      `(${runCost.totalTokensIn}+${runCost.totalTokensOut} tokens, ${runCost.totalWebSearches} web_search)`,
  );
  return path;
}

// =============================================================================
// Stage 1 — claims fetch
// =============================================================================

async function fetchSourceClaims(
  book: DiscoveredBook,
): Promise<{ claims: SourceClaim[]; claimErrors: PilotErrorEntry[] }> {
  const claims: SourceClaim[] = [];
  const claimErrors: PilotErrorEntry[] = [];
  const expectedAuthor = book.authorHint;

  // Lexicanum
  try {
    const lex = await discoverLexicanumClaimV2(book.title, expectedAuthor);
    if (lex.result) claims.push(lex.result.claim);
    if (lex.reason) {
      claimErrors.push({
        source: "lexicanum",
        slug: book.slug,
        message: lex.reason,
      });
    }
  } catch (e) {
    claimErrors.push({
      source: "lexicanum",
      slug: book.slug,
      message: e instanceof Error ? e.message : String(e),
    });
  }

  // Open Library
  try {
    const ol = await discoverOpenLibraryClaimV2(
      book.title,
      expectedAuthor,
      book.releaseYear,
    );
    if (ol.result) claims.push(ol.result.claim);
    if (ol.reason) {
      claimErrors.push({
        source: "open_library",
        slug: book.slug,
        message: ol.reason,
      });
    }
    // authorMismatch is silent in V2.
  } catch (e) {
    claimErrors.push({
      source: "open_library",
      slug: book.slug,
      message: e instanceof Error ? e.message : String(e),
    });
  }

  // Hardcover (silent-skip on author-mismatch)
  if (isHardcoverEnabled()) {
    try {
      const hc = await discoverHardcoverClaimV2(book.title, expectedAuthor);
      if (hc.result) claims.push(hc.result.claim);
      if (hc.reason) {
        claimErrors.push({
          source: "hardcover",
          slug: book.slug,
          message: hc.reason,
        });
      }
      // authorMismatch is silent in V2.
    } catch (e) {
      claimErrors.push({
        source: "hardcover",
        slug: book.slug,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return { claims, claimErrors };
}

// =============================================================================
// Stage 3 — first-pass merge for LLM input
// =============================================================================

/**
 * Build a V1-style `MergedBook` + `SourcePayload[]` for the slim LLM prompt.
 * Validator-decided drops (e.g. startY=39000) are zeroed out so the LLM
 * doesn't see stale bad values. The MergedBook structure is what
 * `fetchPlotContext` consumes.
 */
function buildFirstPassMerged(
  book: DiscoveredBook,
  claims: SourceClaim[],
  validations: Validation[],
): { merged: MergedBook; payloads: SourcePayload[] } {
  // Drop list: which (claim source, field) pairs were dropped by validator?
  const dropped = new Set<string>();
  for (const v of validations) {
    if (v.suggested?.action !== "drop") continue;
    for (const ev of v.evidence) {
      dropped.add(`${ev.source}::${v.field}`);
    }
  }

  const payloads: SourcePayload[] = [];

  // Wikipedia surrogate from discovery — gives the LLM the title + author hint.
  const wikiUrl = book.sourcePages.find((p) => p.includes("wikipedia.org"));
  payloads.push({
    source: "wikipedia",
    sourceUrl: wikiUrl,
    fields: {
      title: book.title,
      ...(book.authorHint ? { authorNames: [book.authorHint] } : {}),
      ...(book.releaseYear !== undefined ? { releaseYear: book.releaseYear } : {}),
      ...(book.seriesIndex !== undefined ? { seriesIndex: book.seriesIndex } : {}),
    },
  });

  for (const claim of claims) {
    const f: SourcePayload["fields"] = {};
    if (claim.fields.title !== undefined) f.title = claim.fields.title;
    if (claim.fields.authorNames !== undefined) f.authorNames = claim.fields.authorNames;
    if (claim.fields.releaseYear !== undefined) f.releaseYear = claim.fields.releaseYear;
    if (claim.fields.isbn13 !== undefined) f.isbn13 = claim.fields.isbn13;
    if (claim.fields.isbn10 !== undefined) f.isbn10 = claim.fields.isbn10;
    if (claim.fields.pageCount !== undefined) f.pageCount = claim.fields.pageCount;
    if (claim.fields.coverUrl !== undefined) f.coverUrl = claim.fields.coverUrl;
    if (
      claim.fields.startY !== undefined &&
      !dropped.has(`${claim.source}::startY`)
    ) {
      f.startY = claim.fields.startY;
    }
    if (
      claim.fields.endY !== undefined &&
      !dropped.has(`${claim.source}::endY`)
    ) {
      f.endY = claim.fields.endY;
    }
    if (claim.fields.format !== undefined) f.format = claim.fields.format;
    const audit = (claim.raw as { audit?: unknown } | undefined)?.audit;
    payloads.push({
      source: claim.source,
      sourceUrl: claim.sourceUrl,
      fields: f,
      ...(audit ? { audit } : {}),
    } as SourcePayload);
  }

  // Synthesize a MergedBook for fetchPlotContext / prompt construction.
  const merged: MergedBook = {
    slug: book.slug,
    primarySource: claims.find((c) => c.source === "lexicanum") ? "lexicanum" : "wikipedia",
    confidence: claims.find((c) => c.source === "lexicanum")
      ? SOURCE_CONFIDENCE.lexicanum
      : SOURCE_CONFIDENCE.wikipedia,
    fields: collapseToFields(payloads),
    fieldOrigins: collapseToOrigins(payloads),
    externalUrls: payloads
      .filter((p) => p.sourceUrl)
      .map((p) => ({ source: p.source, url: p.sourceUrl as string })),
  };

  return { merged, payloads };
}

function collapseToFields(payloads: SourcePayload[]): MergedBook["fields"] {
  const out: MergedBook["fields"] = {};
  for (const p of payloads) {
    for (const k of Object.keys(p.fields) as Array<keyof MergedBook["fields"]>) {
      const v = (p.fields as Record<string, unknown>)[k];
      if (v === undefined) continue;
      if ((out as Record<string, unknown>)[k] === undefined) {
        (out as Record<string, unknown>)[k] = v;
      }
    }
  }
  return out;
}

function collapseToOrigins(payloads: SourcePayload[]): MergedBook["fieldOrigins"] {
  const out: MergedBook["fieldOrigins"] = {};
  for (const p of payloads) {
    for (const k of Object.keys(p.fields) as Array<keyof MergedBook["fields"]>) {
      const v = (p.fields as Record<string, unknown>)[k];
      if (v === undefined) continue;
      if (out[k] === undefined) out[k] = p.source;
    }
  }
  return out;
}

// =============================================================================
// Stage 4 — fold into BookV2Record
// =============================================================================

function fr<T>(
  value: T,
  source: FieldRecordSource,
  evidence?: { source: string; value: unknown }[],
): FieldRecord<T> {
  return {
    value,
    source,
    fetchedAt: new Date().toISOString(),
    override: null,
    ...(evidence ? { evidence } : {}),
  };
}

function pickClaim(
  claims: SourceClaim[],
  order: ClaimSource[],
  field: keyof SourceClaim["fields"],
): { value: NonNullable<unknown>; source: ClaimSource } | null {
  for (const src of order) {
    const claim = claims.find((c) => c.source === src);
    if (!claim) continue;
    const v = claim.fields[field];
    if (v === undefined || v === null) continue;
    return { value: v, source: src };
  }
  return null;
}

interface DropMap {
  dropped: Map<string, { source: string; value: unknown }[]>;
  used: Map<string, { value: unknown; sourceLabel: string; evidence: { source: string; value: unknown }[] }>;
  flagged: Map<string, { value: unknown; sourceLabel: string }>;
}

function buildDropMap(validations: Validation[]): DropMap {
  const dropped = new Map<string, { source: string; value: unknown }[]>();
  const used = new Map<string, { value: unknown; sourceLabel: string; evidence: { source: string; value: unknown }[] }>();
  const flagged = new Map<string, { value: unknown; sourceLabel: string }>();
  for (const v of validations) {
    if (!v.suggested) continue;
    if (v.suggested.action === "drop") {
      dropped.set(v.field, v.evidence);
    } else if (v.suggested.action === "use" && v.suggested.value !== undefined) {
      used.set(v.field, {
        value: v.suggested.value,
        sourceLabel: "validator",
        evidence: v.evidence,
      });
    } else if (v.suggested.action === "flag" && v.suggested.value !== undefined) {
      flagged.set(v.field, { value: v.suggested.value, sourceLabel: "validator" });
    }
  }
  return { dropped, used, flagged };
}

function foldIntoBookV2Record(
  book: DiscoveredBook,
  claims: SourceClaim[],
  validations: Validation[],
  llm: SlimLlmPayload | null,
  llmCost: BookLlmCostSummary | null,
): BookV2Record {
  const drops = buildDropMap(validations);

  // Title — Lexicanum > OL > Discovery
  const titleClaim = pickClaim(claims, ["lexicanum", "open_library"], "title");
  const titleField: FieldRecord<string> = titleClaim
    ? fr(titleClaim.value as string, titleClaim.source)
    : fr(book.title, "discovery");

  // authorNames — Discovery > Lexicanum > OL
  let authorField: FieldRecord<string[]>;
  if (book.authorHint) {
    authorField = fr([book.authorHint], "discovery");
  } else {
    const claim = pickClaim(claims, ["lexicanum", "open_library"], "authorNames");
    authorField = claim
      ? fr(claim.value as string[], claim.source)
      : fr<string[]>([], "discovery");
  }

  // releaseYear — Discovery > Lexicanum > OL
  let releaseYearField: FieldRecord<number | null>;
  if (book.releaseYear !== undefined) {
    releaseYearField = fr<number | null>(book.releaseYear, "discovery");
  } else {
    const claim = pickClaim(claims, ["lexicanum", "open_library"], "releaseYear");
    releaseYearField = claim
      ? fr<number | null>(claim.value as number, claim.source)
      : fr<number | null>(null, "discovery");
  }

  // seriesHint / seriesIndex / isEntryPoint — Discovery only
  const seriesHintField: FieldRecord<string | null> = fr(
    book.seriesHint ?? null,
    "discovery",
  );
  const seriesIndexField: FieldRecord<number | null> = fr(
    book.seriesIndex ?? null,
    "discovery",
  );
  const isEntryPointField: FieldRecord<boolean | null> = fr(
    book.isEntryPoint ?? null,
    "discovery",
  );

  // ISBN13 — validator (use) > OL > Lexicanum
  let isbn13Field: FieldRecord<string | null>;
  const isbn13Used = drops.used.get("isbn13");
  if (isbn13Used) {
    isbn13Field = fr<string | null>(
      isbn13Used.value as string,
      "validator",
      isbn13Used.evidence,
    );
  } else if (drops.dropped.has("isbn13")) {
    isbn13Field = fr<string | null>(null, "validator-corrected", drops.dropped.get("isbn13")!);
  } else {
    const claim = pickClaim(claims, ["open_library", "lexicanum"], "isbn13");
    isbn13Field = claim
      ? fr<string | null>(claim.value as string, claim.source)
      : fr<string | null>(null, "discovery");
  }

  // ISBN10 — OL only
  let isbn10Field: FieldRecord<string | null>;
  if (drops.dropped.has("isbn10")) {
    isbn10Field = fr<string | null>(null, "validator-corrected", drops.dropped.get("isbn10")!);
  } else {
    const claim = pickClaim(claims, ["open_library"], "isbn10");
    isbn10Field = claim
      ? fr<string | null>(claim.value as string, claim.source)
      : fr<string | null>(null, "discovery");
  }

  // pageCount — validator (drop / flag) > OL
  let pageCountField: FieldRecord<number | null>;
  if (drops.dropped.has("pageCount")) {
    pageCountField = fr<number | null>(null, "validator-corrected", drops.dropped.get("pageCount")!);
  } else {
    const claim = pickClaim(claims, ["open_library"], "pageCount");
    pageCountField = claim
      ? fr<number | null>(claim.value as number, claim.source)
      : fr<number | null>(null, "discovery");
  }

  // coverUrl — OL only
  const coverUrlClaim = pickClaim(claims, ["open_library"], "coverUrl");
  const coverUrlField: FieldRecord<string | null> = coverUrlClaim
    ? fr<string | null>(coverUrlClaim.value as string, coverUrlClaim.source)
    : fr<string | null>(null, "discovery");

  // format — validator (use) > LLM > OL > validator (flag)
  const formatUsed = drops.used.get("format");
  const formatFlagged = drops.flagged.get("format");
  let formatField: FieldRecord<BookFormat | null>;
  if (formatUsed) {
    formatField = fr<BookFormat | null>(
      formatUsed.value as BookFormat,
      "validator",
      formatUsed.evidence,
    );
  } else if (formatFlagged) {
    formatField = fr<BookFormat | null>(formatFlagged.value as BookFormat, "validator");
  } else if (llm?.format) {
    formatField = fr<BookFormat | null>(llm.format, "llm");
  } else {
    formatField = fr<BookFormat | null>(null, "discovery");
  }

  // startY — validator (drop) > Lexicanum (infobox) > LLM
  const startYDropped = drops.dropped.get("startY");
  let startYField: FieldRecord<number | null>;
  const lexStartY = claims.find((c) => c.source === "lexicanum")?.fields.startY;
  if (startYDropped) {
    if (typeof lexStartY === "number") {
      startYField = fr<number | null>(null, "validator-corrected", startYDropped);
    } else if (typeof llm?.startY === "number") {
      startYField = fr<number | null>(llm.startY, "llm", startYDropped);
    } else {
      startYField = fr<number | null>(null, "validator-corrected", startYDropped);
    }
  } else if (typeof lexStartY === "number") {
    startYField = fr<number | null>(lexStartY, "lexicanum");
  } else if (typeof llm?.startY === "number") {
    startYField = fr<number | null>(llm.startY, "llm");
  } else {
    startYField = fr<number | null>(null, "discovery");
  }

  const endYDropped = drops.dropped.get("endY");
  const lexEndY = claims.find((c) => c.source === "lexicanum")?.fields.endY;
  let endYField: FieldRecord<number | null>;
  if (endYDropped) {
    endYField = fr<number | null>(null, "validator-corrected", endYDropped);
  } else if (typeof lexEndY === "number") {
    endYField = fr<number | null>(lexEndY, "lexicanum");
  } else if (typeof llm?.endY === "number") {
    endYField = fr<number | null>(llm.endY, "llm");
  } else {
    endYField = fr<number | null>(null, "discovery");
  }

  // synopsis — LLM only
  const synopsisField: FieldRecord<string | null> = llm?.synopsis
    ? fr<string | null>(llm.synopsis, "llm")
    : fr<string | null>(null, "discovery");

  // facetIds / factions / locations / characters — LLM only
  const facetIdsField: FieldRecord<string[]> = fr(
    llm?.facetIds ?? [],
    llm ? "llm" : "discovery",
  );
  const factionsField: FieldRecord<RoleAnnotated[]> = fr(
    llm?.factions ?? [],
    llm ? "llm" : "discovery",
  );
  const locationsField: FieldRecord<RoleAnnotated[]> = fr(
    llm?.locations ?? [],
    llm ? "llm" : "discovery",
  );
  const charactersField: FieldRecord<RoleAnnotated[]> = fr(
    llm?.characters ?? [],
    llm ? "llm" : "discovery",
  );

  const fields: BookV2Fields = {
    title: titleField,
    authorNames: authorField,
    releaseYear: releaseYearField,
    seriesHint: seriesHintField,
    seriesIndex: seriesIndexField,
    isEntryPoint: isEntryPointField,
    isbn13: isbn13Field,
    isbn10: isbn10Field,
    pageCount: pageCountField,
    coverUrl: coverUrlField,
    format: formatField,
    startY: startYField,
    endY: endYField,
    synopsis: synopsisField,
    facetIds: facetIdsField,
    factions: factionsField,
    locations: locationsField,
    characters: charactersField,
  };

  // Synthesize the V1-shape `payload: MergedBook` shim so the existing
  // `/ingest/[runId]` drill-down renders without code changes.
  const v1Payload: MergedBook = {
    slug: book.slug,
    primarySource: pickPrimarySource(fields),
    confidence: SOURCE_CONFIDENCE[pickPrimarySource(fields)] ?? 0.5,
    fields: {
      ...(titleField.value ? { title: titleField.value } : {}),
      ...(authorField.value.length > 0 ? { authorNames: authorField.value } : {}),
      ...(releaseYearField.value !== null ? { releaseYear: releaseYearField.value } : {}),
      ...(startYField.value !== null ? { startY: startYField.value } : {}),
      ...(endYField.value !== null ? { endY: endYField.value } : {}),
      ...(synopsisField.value !== null ? { synopsis: synopsisField.value } : {}),
      ...(coverUrlField.value !== null ? { coverUrl: coverUrlField.value } : {}),
      ...(seriesIndexField.value !== null ? { seriesIndex: seriesIndexField.value } : {}),
      ...(isbn13Field.value !== null ? { isbn13: isbn13Field.value } : {}),
      ...(isbn10Field.value !== null ? { isbn10: isbn10Field.value } : {}),
      ...(pageCountField.value !== null ? { pageCount: pageCountField.value } : {}),
      ...(formatField.value !== null ? { format: formatField.value } : {}),
      ...(facetIdsField.value.length > 0 ? { facetIds: facetIdsField.value } : {}),
      ...(factionsField.value.length > 0
        ? { factionNames: factionsField.value.map((x) => x.name) }
        : {}),
      ...(locationsField.value.length > 0
        ? { locationNames: locationsField.value.map((x) => x.name) }
        : {}),
      ...(charactersField.value.length > 0
        ? { characterNames: charactersField.value.map((x) => x.name) }
        : {}),
    },
    fieldOrigins: synthFieldOrigins(fields),
    externalUrls: claims
      .filter((c) => c.sourceUrl)
      .map((c) => ({ source: c.source as SourceName, url: c.sourceUrl as string })),
  };

  return {
    slug: book.slug,
    fields,
    validations,
    rawClaims: claims,
    rawLlmPayload: llm,
    llmCostSummary: llmCost,
    sourcePages: book.sourcePages,
    wikipediaTitle: book.title,
    payload: v1Payload,
  };
}

function pickPrimarySource(fields: BookV2Fields): SourceName {
  // Lore-first preference — same spirit as V1's pickPrimarySource.
  if (fields.startY.source === "lexicanum" || fields.endY.source === "lexicanum") {
    return "lexicanum";
  }
  if (fields.factions.source === "llm" && fields.factions.value.length > 0) {
    return "llm";
  }
  if (fields.synopsis.source === "llm") return "llm";
  // Title-source as last fallback.
  const ts = fields.title.source;
  if (ts === "lexicanum" || ts === "open_library" || ts === "hardcover") return ts;
  return "wikipedia";
}

function synthFieldOrigins(fields: BookV2Fields): MergedBook["fieldOrigins"] {
  const out: MergedBook["fieldOrigins"] = {};
  // Map FieldRecordSource → SourceName for the legacy MergedBook shape.
  const map = (s: FieldRecordSource): SourceName => {
    switch (s) {
      case "lexicanum":
      case "open_library":
      case "hardcover":
      case "llm":
        return s;
      case "discovery":
        return "wikipedia";
      case "validator":
      case "validator-corrected":
        return "manual"; // surface validator-touched fields as manual-ish
    }
  };
  if (fields.title.value) out.title = map(fields.title.source);
  if (fields.authorNames.value.length > 0) out.authorNames = map(fields.authorNames.source);
  if (fields.releaseYear.value !== null) out.releaseYear = map(fields.releaseYear.source);
  if (fields.startY.value !== null) out.startY = map(fields.startY.source);
  if (fields.endY.value !== null) out.endY = map(fields.endY.source);
  if (fields.synopsis.value !== null) out.synopsis = map(fields.synopsis.source);
  if (fields.coverUrl.value !== null) out.coverUrl = map(fields.coverUrl.source);
  if (fields.isbn13.value !== null) out.isbn13 = map(fields.isbn13.source);
  if (fields.isbn10.value !== null) out.isbn10 = map(fields.isbn10.source);
  if (fields.pageCount.value !== null) out.pageCount = map(fields.pageCount.source);
  if (fields.format.value !== null) out.format = map(fields.format.source);
  if (fields.facetIds.value.length > 0) out.facetIds = map(fields.facetIds.source);
  if (fields.factions.value.length > 0) out.factionNames = map(fields.factions.source);
  if (fields.locations.value.length > 0) out.locationNames = map(fields.locations.source);
  if (fields.characters.value.length > 0) out.characterNames = map(fields.characters.source);
  return out;
}

// =============================================================================
// Diff writer
// =============================================================================

const LAST_RUN_DIR = join(process.cwd(), "ingest", ".last-run");

async function writeV2Diff(diff: V2DiffFile, startedAt: string): Promise<string> {
  await mkdir(LAST_RUN_DIR, { recursive: true });
  const stamp = formatTimestamp(new Date(startedAt));
  const file = join(LAST_RUN_DIR, `v2-pilot-${stamp}.diff.json`);
  await writeFile(file, JSON.stringify(diff, null, 2), "utf8");
  return file;
}

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

// =============================================================================
// Misc
// =============================================================================

/**
 * For pilot slugs missing from both discovery sources, build a minimal
 * DiscoveredBook from the slug. `desiredTitle` overrides the slug-based
 * title-cap when supplied (e.g. "Eisenhorn: Xenos" instead of
 * "Eisenhorn Xenos").
 */
function synthesizeMissingBook(
  slug: string,
  desiredTitle?: string,
): DiscoveredBook | null {
  const title = desiredTitle ?? slugToTitle(slug);
  if (!title) return null;
  return {
    slug,
    title,
    sourcePages: [],
    discoverySources: [],
  };
}

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

/**
 * Fuzzy-match a roster of `DiscoveredBook` against a pilot hint. Returns the
 * single best match or null. Strict policy: title fragment must appear in
 * the candidate's lowercased title; if `authorFragment` is given, candidate's
 * authorHint must contain it; if `seriesFragment` is given, candidate's
 * seriesHint must contain it. Multiple matches → returns the FIRST one (by
 * roster order — Wikipedia sub-pages come after the master list).
 */
function fuzzyMatch(
  roster: DiscoveredBook[],
  hints: {
    titleFragment: string;
    authorFragment?: string;
    seriesFragment?: string;
  },
): DiscoveredBook | null {
  const t = hints.titleFragment.toLowerCase();
  const a = hints.authorFragment?.toLowerCase();
  const s = hints.seriesFragment?.toLowerCase();
  for (const book of roster) {
    if (!book.title.toLowerCase().includes(t)) continue;
    if (a && !book.authorHint?.toLowerCase().includes(a)) continue;
    if (s && !book.seriesHint?.toLowerCase().includes(s)) continue;
    return book;
  }
  return null;
}

// Unused imports kept for future reuse — db/works/slugify may be needed by
// later folds. Touch them so the linter doesn't strip the imports.
void db;
void works;
void slugify;
