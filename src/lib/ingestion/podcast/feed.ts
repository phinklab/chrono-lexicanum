/**
 * RSS 2.0 + iTunes feed fetch & parse.
 *
 * `fetchFeed` is the repo's standard HTTP-GET-with-User-Agent (mirrors
 * `wikipedia/fetch.ts`: shared UA, 30s AbortSignal). `parseFeed`/`htmlToText`/
 * `parseDurationToSeconds` are pure (no network) so they unit-test cleanly.
 *
 * fast-xml-parser is configured to keep namespaced tag names verbatim
 * (`itunes:duration`, `content:encoded`, `podcast:guid`) and to leave tag/attr
 * values as raw strings — we coerce every field explicitly, which keeps parsing
 * deterministic regardless of whether a value looks numeric.
 */
import * as cheerio from "cheerio";
import { XMLParser } from "fast-xml-parser";

import type { ParsedShowMeta, PodcastEpisode } from "./types";

const UA =
  "ChronoLexicanum/0.1 (https://github.com/phinklab/chrono-lexicanum; p.kuenzler@web.de)";

export interface ParsedFeed {
  show: ParsedShowMeta;
  episodes: PodcastEpisode[];
}

/**
 * Fetch a podcast RSS feed as raw XML text. Throws on non-2xx so the caller can
 * surface the failure (a run has a single feed — no soft-fail roster to keep).
 */
export async function fetchFeed(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    throw new Error(`fetchFeed: ${res.status} ${res.statusText} for ${url}`);
  }
  return res.text();
}

// Value coercion (fast-xml-parser yields string | number | object)

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v !== null && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return null;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/**
 * Decode XML/HTML character references. fast-xml-parser decodes the named XML
 * entities (`&amp;` …) but leaves NUMERIC references intact — and RedCircle
 * encodes the `pubDate` timezone as `&#43;0000` and apostrophes as `&#39;`. A
 * single pass over the values we don't route through cheerio fixes both, plus
 * `&amp;` inside enclosure URLs. Unknown named entities pass through unchanged.
 */
export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (m, body: string) => {
    if (body[0] === "#") {
      const hex = body[1] === "x" || body[1] === "X";
      const code = Number.parseInt(body.slice(hex ? 2 : 1), hex ? 16 : 10);
      if (Number.isFinite(code) && code > 0) {
        try {
          return String.fromCodePoint(code);
        } catch {
          return m;
        }
      }
      return m;
    }
    return NAMED_ENTITIES[body] ?? m;
  });
}

/** Text of a tag node, whether plain (`"x"`), numeric, or `{ "#text": "x", ... }`. */
function asText(v: unknown): string | null {
  if (typeof v === "string") return decodeEntities(v);
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  const rec = asRecord(v);
  if (rec && "#text" in rec) {
    const t = rec["#text"];
    if (typeof t === "string") return decodeEntities(t);
    if (typeof t === "number" || typeof t === "boolean") return String(t);
  }
  return null;
}

/** Attribute value off a tag node (attributeNamePrefix `@_`). */
function attr(v: unknown, name: string): string | null {
  const rec = asRecord(v);
  if (!rec) return null;
  const a = rec[name];
  if (typeof a === "string") return decodeEntities(a);
  if (typeof a === "number") return String(a);
  return null;
}

// Pure helpers (unit-tested)

/**
 * Strip HTML to plain text. Closing block tags and `<br>` become spaces so
 * adjacent elements don't fuse their words; runs of whitespace collapse.
 */
export function htmlToText(html: string): string {
  if (!html) return "";
  const withBreaks = html
    .replace(/<\/(p|div|li|h[1-6]|tr|blockquote|section|article)>/gi, "$& ")
    .replace(/<br\s*\/?>/gi, " ");
  const $ = cheerio.load(withBreaks);
  return $.root().text().replace(/\s+/g, " ").trim();
}

/** `HH:MM:SS` / `MM:SS` / raw-seconds → seconds; null when not a duration. */
export function parseDurationToSeconds(raw: string | null): number | null {
  if (raw === null) return null;
  const s = raw.trim();
  if (s === "") return null;
  if (/^\d+$/.test(s)) return Number.parseInt(s, 10);
  const parts = s.split(":");
  if (parts.length < 2 || parts.length > 3) return null;
  if (!parts.every((p) => /^\d+$/.test(p.trim()))) return null;
  let sec = 0;
  for (const p of parts) sec = sec * 60 + Number.parseInt(p.trim(), 10);
  return sec;
}

function parseIntOrNull(raw: string | null): number | null {
  if (raw === null) return null;
  const s = raw.trim();
  if (!/^\d+$/.test(s)) return null;
  return Number.parseInt(s, 10);
}

/** RFC-822 `pubDate` → ISO 8601 (sortable); null if missing/unparseable. */
function normalizePubDate(raw: string | null): string | null {
  if (raw === null || raw.trim() === "") return null;
  const t = Date.parse(raw);
  if (Number.isNaN(t)) return null;
  return new Date(t).toISOString();
}

const PARSER = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
});

function extractImage(channel: Record<string, unknown>): string | null {
  const itunesImg = attr(channel["itunes:image"], "@_href");
  if (itunesImg) return itunesImg;
  return asText(asRecord(channel.image)?.url);
}

function parseItem(raw: unknown): PodcastEpisode | null {
  const item = asRecord(raw);
  if (!item) return null;
  const title = asText(item["itunes:title"]) ?? asText(item.title) ?? "";
  const descParts = [asText(item.description), asText(item["content:encoded"])].filter(
    (s): s is string => typeof s === "string" && s.trim() !== "",
  );
  const descriptionText = htmlToText(descParts.join("\n\n"));
  const audioUrl = attr(item.enclosure, "@_url");
  const link = asText(item.link);
  const guid = asText(item.guid)?.trim() || link || audioUrl || title;
  return {
    guid,
    title,
    descriptionText,
    pubDate: normalizePubDate(asText(item.pubDate)),
    durationSec: parseDurationToSeconds(asText(item["itunes:duration"])),
    audioUrl,
    link,
    season: parseIntOrNull(asText(item["itunes:season"])),
    episode: parseIntOrNull(asText(item["itunes:episode"])),
  };
}

/** Parse RSS XML → show metadata + episodes. Throws if the document is not RSS. */
export function parseFeed(xml: string): ParsedFeed {
  const doc: unknown = PARSER.parse(xml);
  const channel = asRecord(asRecord(asRecord(doc)?.rss)?.channel);
  if (!channel) {
    throw new Error("parseFeed: <rss><channel> not found — not an RSS 2.0 feed?");
  }
  const show: ParsedShowMeta = {
    title: asText(channel.title) ?? "",
    podcastGuid: asText(channel["podcast:guid"]),
    imageUrl: extractImage(channel),
  };
  const rawItems = channel.item;
  const items: unknown[] = Array.isArray(rawItems)
    ? rawItems
    : rawItems != null
      ? [rawItems]
      : [];
  const episodes: PodcastEpisode[] = [];
  for (const raw of items) {
    const ep = parseItem(raw);
    if (ep) episodes.push(ep);
  }
  return { show, episodes };
}
