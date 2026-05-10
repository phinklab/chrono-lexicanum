/**
 * Pipeline V2 — shared run-engine (Brief 055 refactor).
 *
 * Consolidates Stage 0 (Discovery: Wikipedia + TLBranson + merge), Stage 1–4
 * per-book processing (claims → validators → slim LLM → fold into
 * BookV2Record), and the V2 diff-file writer behind narrow exports.
 * `run-pilot.ts` (hardcoded slug-set) and `run-batch.ts` (first-N by
 * slug-sort) each layer their own book-selection + filename-prefix policy on
 * top.
 *
 * Behavior preserved verbatim from the 054 pilot orchestrator with one
 * deliberate improvement: the "ANTHROPIC_API_KEY missing" audit entry is now
 * pushed once per run by the caller, not once per book — relevant for the
 * 100-book batch where 100 identical entries would flood the diff.
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
  runAllValidators,
} from "./validators";
import { enrichBookWithLlmV2 } from "./llm/enrich";
import { isLlmEnabled } from "../llm/enrich";
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
  Validation,
} from "./types";

// ============================================================================
// Discovery configuration (kept here so pilot + batch share the exact roster)
// ============================================================================

export const WIKIPEDIA_DISCOVERY_PAGES = [
  "List_of_Warhammer_40,000_novels",
  "Horus_Heresy_(novels)",
  "Siege_of_Terra",
  "Eisenhorn",
];

export const TLBRANSON_PAGES: TLBransonPageSlug[] = [
  "warhammer-40k-books-in-order",
  "horus-heresy-reading-order",
];

// ============================================================================
// Public types
// ============================================================================

export interface RunErrorEntry {
  source: string;
  slug?: string;
  message: string;
}

export interface DiscoveryResult {
  merged: DiscoveredBook[];
  wikipediaPagesUsed: string[];
  tlbransonPagesUsed: string[];
  errors: RunErrorEntry[];
  rawWikipediaCount: number;
  rawTlbransonCount: number;
}

export interface ProcessBookResult {
  record: BookV2Record;
  errors: RunErrorEntry[];
  llmCost: BookLlmCostSummary | null;
  validations: Validation[];
}

// ============================================================================
// Stage 0 — Discovery
// ============================================================================

export async function discoverV2Roster(): Promise<DiscoveryResult> {
  const errors: RunErrorEntry[] = [];

  console.log("[v2-engine] discovery: wikipedia + tlbranson");
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

  return {
    merged,
    wikipediaPagesUsed,
    tlbransonPagesUsed,
    errors,
    rawWikipediaCount: wikipediaDiscovered.length,
    rawTlbransonCount: tlbransonDiscovered.length,
  };
}

// ============================================================================
// Stage 1-4 per book
// ============================================================================

export async function processBookV2(book: DiscoveredBook): Promise<ProcessBookResult> {
  const errors: RunErrorEntry[] = [];

  // Stage 1 — claims.
  const { claims, claimErrors } = await fetchSourceClaims(book);
  errors.push(...claimErrors);

  // Stage 2 — validators.
  const validations = runAllValidators(claims, book);
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
  }

  // Stage 4 — fold into BookV2Record.
  const record = foldIntoBookV2Record(book, claims, validations, llmPayload, llmCost);
  return { record, errors, llmCost, validations };
}

// ============================================================================
// Stage 1 — claims fetch (internal)
// ============================================================================

async function fetchSourceClaims(
  book: DiscoveredBook,
): Promise<{ claims: SourceClaim[]; claimErrors: RunErrorEntry[] }> {
  const claims: SourceClaim[] = [];
  const claimErrors: RunErrorEntry[] = [];
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

// ============================================================================
// Stage 3 — first-pass merge for LLM input (internal)
// ============================================================================

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

// ============================================================================
// Stage 4 — fold into BookV2Record (internal)
// ============================================================================

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

// ============================================================================
// Diff writer
// ============================================================================

const LAST_RUN_DIR = join(process.cwd(), "ingest", ".last-run");

/**
 * Write a V2 diff to `ingest/.last-run/<prefix>-YYYYMMDD-HHMM.diff.json`.
 * `prefix` is "v2-pilot" or "v2-batch" — discriminator the dashboard +
 * resolver tooling read via `startsWith`.
 */
export async function writeV2DiffFile(
  diff: V2DiffFile,
  prefix: string,
  startedAt: string,
): Promise<string> {
  await mkdir(LAST_RUN_DIR, { recursive: true });
  const stamp = formatTimestamp(new Date(startedAt));
  const file = join(LAST_RUN_DIR, `${prefix}-${stamp}.diff.json`);
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

// Touch unused imports kept for future reuse — db/works/slugify may be needed
// by later folds.
void db;
void works;
void slugify;
