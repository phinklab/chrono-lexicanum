/**
 * Phase 3c — Plot-Context-Fetcher.
 *
 * Zieht für ein Buch die Plot/Story-Sektion aus Wikipedia-Article + Lexicanum-
 * Article (zwei verschiedene Quellen — Wikipedia ist plot-trocken, Lexicanum
 * ist lore-fokussiert; zusammen geben sie dem LLM einen anständigen Anker für
 * die paraphrasierte Synopse).
 *
 * Wikipedia-URL-Discovery ist best-effort: nicht jedes 40k-Buch hat einen
 * eigenen Wikipedia-Article (manche stehen nur als Listeneintrag auf
 * `List_of_Warhammer_40,000_novels`). Drei Suffix-Varianten werden probiert:
 * `_(novel)`, `_(Warhammer_40,000)`, `_(Horus_Heresy)`. 404 ist silent.
 *
 * Lexicanum-Article-URL kommt aus `merged.externalUrls` (vom 3a/3b-Crawler
 * gespeichert). Wenn nicht vorhanden: skip.
 *
 * Wenn beide leer / unter Mindest-Wortzahl: kein Web-Search-Pre-Fetch hier —
 * der LLM-Tool-Call ruft `web_search` selbst, wenn ihm Kontext fehlt.
 */
import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";

import { fetchLexicanumArticle } from "@/lib/ingestion/lexicanum/fetch";
import { fetchWikipediaPage } from "@/lib/ingestion/wikipedia/fetch";
import type { MergedBook } from "@/lib/ingestion/types";

const WIKIPEDIA_SUFFIXES = [
  "_(novel)",
  "_(Warhammer_40,000)",
  "_(Horus_Heresy)",
];

/** Wikipedia-Section-Headlines, die typischerweise den Plot tragen. */
const WIKIPEDIA_PLOT_IDS = [
  "Plot",
  "Plot_summary",
  "Synopsis",
  "Story",
];

/** Lexicanum-Section-Headlines, die typischerweise den Plot tragen. */
const LEXICANUM_PLOT_IDS = [
  "Cover_Description",
  "Description",
  "Synopsis",
  "Story",
  "Plot",
  "Summary",
];

const MIN_PLOT_WORDS = 30;
const MAX_PLOT_CHARS = 6_000;

export interface PlotContext {
  wikipediaPlot?: string;
  lexicanumStory?: string;
}

/** Convert a book title into a Wikipedia page-name candidate. */
function titleToWikipediaPageName(title: string): string {
  // Wikipedia uses spaces → underscores; the rest stays as-is in page names.
  return title.replace(/\s+/g, "_");
}

/**
 * Extract the text of the section identified by one of the listed headline
 * IDs. Returns undefined when no matching section exists OR when the
 * extracted text is too short to be useful.
 */
function extractSection($: CheerioAPI, headlineIds: string[]): string | undefined {
  for (const id of headlineIds) {
    const headline = $(`span.mw-headline#${id}, h2 #${id}, h3 #${id}`).first();
    if (headline.length === 0) continue;

    // The headline span sits inside an h2/h3. Walk siblings of that header
    // until the next h2 (a new section).
    const header = headline.closest("h2, h3");
    if (header.length === 0) continue;

    const parts: string[] = [];
    let charBudget = MAX_PLOT_CHARS;

    let node = header.next();
    while (node.length > 0 && !node.is("h2") && charBudget > 0) {
      if (node.is("p, ul, ol, dl")) {
        const text = node.text().trim();
        if (text) {
          const slice = text.slice(0, charBudget);
          parts.push(slice);
          charBudget -= slice.length;
        }
      }
      node = node.next();
    }

    const joined = parts.join("\n\n").trim();
    if (joined.split(/\s+/).filter(Boolean).length >= MIN_PLOT_WORDS) {
      return joined;
    }
  }
  return undefined;
}

async function tryFetchWikipediaPlot(title: string): Promise<string | undefined> {
  const baseName = titleToWikipediaPageName(title);
  const candidates = [baseName, ...WIKIPEDIA_SUFFIXES.map((s) => baseName + s)];

  for (const pageName of candidates) {
    let html: string;
    try {
      const page = await fetchWikipediaPage(pageName);
      html = page.html;
    } catch {
      // 404 / network glitch — try next candidate silently.
      continue;
    }
    const $ = cheerio.load(html);
    const plot = extractSection($, WIKIPEDIA_PLOT_IDS);
    if (plot) return plot;
  }
  return undefined;
}

async function tryFetchLexicanumStory(
  lexicanumUrl: string,
): Promise<string | undefined> {
  // Convert /wiki/<page-name> URL back to the page-name form expected by
  // the existing fetcher.
  const m = /\/wiki\/(.+?)(?:#.*)?$/.exec(lexicanumUrl);
  if (!m) return undefined;
  const pageName = decodeURIComponent(m[1]);

  let article;
  try {
    article = await fetchLexicanumArticle(pageName);
  } catch {
    return undefined;
  }
  if (!article.html) return undefined;

  const $ = cheerio.load(article.html);
  return extractSection($, LEXICANUM_PLOT_IDS);
}

/**
 * Best-effort Plot-Context-Fetcher. Returns whatever can be extracted; an
 * empty result is legitimate (the LLM-Tool-Call wird in dem Fall Web-Search
 * für Kontext nutzen).
 */
export async function fetchPlotContext(
  merged: MergedBook,
): Promise<PlotContext> {
  const out: PlotContext = {};

  const title = merged.fields.title;
  if (title) {
    out.wikipediaPlot = await tryFetchWikipediaPlot(title);
  }

  const lexicanumUrl = merged.externalUrls.find(
    (u) => u.source === "lexicanum",
  )?.url;
  if (lexicanumUrl) {
    out.lexicanumStory = await tryFetchLexicanumStory(lexicanumUrl);
  }

  return out;
}
