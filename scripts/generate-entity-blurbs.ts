/**
 * Full-coverage entity-blurb generator (Board 122-B3 follow-up).
 *
 * Generates 2–3 sentence, neutral, license-safe factual blurbs for EVERY
 * faction / character / location in the seed data, written to the same
 * `*-blurbs.json` curation files the hand-curated B3 pass uses (no schema).
 *
 * Mechanism (matches the "run 15, clear context, go again" request):
 *   - One Anthropic `messages.create` call per BATCH of N entities. Each call
 *     is an independent context window — no accumulation, no context rot.
 *   - Sonnet by default (`BLURB_LLM_MODEL`, falls back to claude-sonnet-4-6).
 *   - HYBRID web verification: the server-side `web_search` tool is offered but
 *     the model is told to use it ONLY for entities it is unsure about; iconic
 *     entities are answered from knowledge. `--no-web` disables it entirely.
 *   - Resumable: by default skips ids already present in the output files, so a
 *     crash just resumes. `--fresh` regenerates everything from scratch.
 *   - Confidence-gated: rows below --min-confidence are listed at the end for
 *     human review (still written, but flagged).
 *
 * Usage:
 *   npm run generate:blurbs                       # resume, all types, hybrid web
 *   npm run generate:blurbs -- --fresh            # regenerate everything
 *   npm run generate:blurbs -- --type=faction     # one entity type
 *   npm run generate:blurbs -- --limit=30         # pilot: first 30 pending
 *   npm run generate:blurbs -- --dry              # plan only, no API calls
 *   npm run generate:blurbs -- --no-web           # knowledge only (cheapest)
 *
 * Needs ANTHROPIC_API_KEY (run via `tsx --env-file=.env.local`, see package.json).
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

type EntityType = "faction" | "character" | "location";

const SEED_DIR = join(process.cwd(), "scripts", "seed-data");
const OUTPUT_FILE: Record<EntityType, string> = {
  faction: "faction-blurbs.json",
  character: "character-blurbs.json",
  location: "location-blurbs.json",
};

const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_BATCH = 15;
const MAX_OUTPUT_TOKENS = 4096;
const MAX_HTTP_RETRIES = 3;
const MAX_BLURB_CHARS = 360;
const MAX_SENTENCES = 3;

// Rough pricing (USD) for the cost report; mirrors src/lib/ingestion/llm/enrich.ts.
const PRICING: Record<string, { in: number; out: number; search: number }> = {
  "claude-sonnet-4-6": { in: 3 / 1_000_000, out: 15 / 1_000_000, search: 0.01 },
  "claude-haiku-4-5": { in: 1 / 1_000_000, out: 5 / 1_000_000, search: 0.01 },
};

interface Entity {
  t: EntityType;
  id: string;
  name: string;
  ctx: string;
}
interface BlurbRow {
  id: string;
  blurb: string;
  source_kind: "manual";
  confidence: number;
  sourceUrl: string;
  checkedAt: string;
}
interface BlurbFile {
  $schema: "entity-blurbs-v1";
  entityType: EntityType;
  blurbs: BlurbRow[];
}

// --- raw seed rows (only the fields we read) ---------------------------------
interface FactionRow { id: string; name: string; alignment?: string; parent?: string | null }
interface CharacterRow { id: string; name: string; primaryFactionId?: string | null; notes?: string | null }
interface LocationRow { id: string; name: string; sector?: string | null; warp?: boolean; capital?: boolean; tags?: string[] | null }

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(join(SEED_DIR, file), "utf8")) as T;
}

function buildEntities(): Entity[] {
  const factions = readJson<FactionRow[]>("factions.json").map<Entity>((f) => ({
    t: "faction",
    id: f.id,
    name: f.name,
    ctx: [f.alignment ? `alignment=${f.alignment}` : "", f.parent ? `parent=${f.parent}` : ""]
      .filter(Boolean)
      .join(", "),
  }));
  const characters = readJson<CharacterRow[]>("characters.json").map<Entity>((c) => ({
    t: "character",
    id: c.id,
    name: c.name,
    ctx: [
      c.primaryFactionId ? `faction=${c.primaryFactionId}` : "",
      c.notes ? `note: ${c.notes.slice(0, 160)}` : "",
    ]
      .filter(Boolean)
      .join("; "),
  }));
  const locations = readJson<LocationRow[]>("locations.json").map<Entity>((l) => ({
    t: "location",
    id: l.id,
    name: l.name,
    ctx: [
      l.sector ? `sector=${l.sector}` : "",
      l.warp ? "warp" : "",
      l.capital ? "capital" : "",
      l.tags && l.tags.length ? `tags=${l.tags.slice(0, 6).join("/")}` : "",
    ]
      .filter(Boolean)
      .join(", "),
  }));
  return [...factions, ...characters, ...locations];
}

// --- LLM tools ---------------------------------------------------------------

const WEB_SEARCH_TOOL = {
  type: "web_search_20260209" as const,
  name: "web_search" as const,
  max_uses: 12,
  allowed_callers: ["direct"] as const,
};

const PUBLISH_BLURBS_TOOL = {
  name: "publish_blurbs",
  description:
    "Return one factual blurb per requested entity. Call this exactly once, after any web searches.",
  input_schema: {
    type: "object" as const,
    properties: {
      blurbs: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string", description: "the entity id, copied verbatim from the request" },
            blurb: { type: "string", description: "2–3 neutral factual sentences, your own words" },
            sourceUrl: { type: "string", description: "a reference URL (Lexicanum / Fandom / official)" },
            confidence: { type: "number", description: "0.0–1.0 self-rated factual confidence" },
          },
          required: ["id", "blurb", "sourceUrl", "confidence"],
        },
      },
    },
    required: ["blurbs"],
  },
};

const SYSTEM_PROMPT = `You write short, neutral, factual reference blurbs for Warhammer 40,000 entities (factions, characters, worlds/locations) for a fan archive.

For every entity you are given, write a blurb that is:
- 2 to 3 SHORT sentences, and at most ${MAX_BLURB_CHARS} characters total. This is a concise catalogue blurb, NOT an article — prefer 2 tight sentences and add a third only if essential.
- Do NOT pad: no lists of sub-units, officer names, orbital mechanics, subsector rosters, or campaign minutiae. State the essence, not an inventory.
- Factual and neutral: who/what it is and its defining trait and significance. No hype words ("legendary", "greatest", "mighty"), no second person, no spoiler-teasing.
- LICENSE-SAFE PARAPHRASE: write entirely in your own words. Do NOT copy or near-copy phrasing from Lexicanum, the Warhammer 40k Fandom wiki, Black Library, or any other source. State facts; do not reproduce sentences.
- Factions: what kind of force/organisation it is + allegiance/role.
- Characters: role/title + affiliation + what they are known for.
- Locations: what kind of place it is + its defining significance.

Verification (HYBRID): rely on your own knowledge for well-known entities. ONLY use the web_search tool for entities you are not confident about (obscure characters, minor worlds, sub-factions). When you search, base the blurb on what you find and set sourceUrl to the page you used; otherwise use the canonical Lexicanum URL (https://wh40k.lexicanum.com/wiki/<Name>) or a Fandom wiki URL.

confidence: 0.9–0.95 when you are sure, 0.8–0.9 when reasonably sure, below 0.8 when uncertain (e.g. you could not verify and have little knowledge).

Copy each id VERBATIM from the request. Return exactly one blurb per requested entity by calling publish_blurbs once.`;

function buildUserPrompt(batch: Entity[]): string {
  const lines = batch.map(
    (e) => `- id=${e.id} | type=${e.t} | name=${e.name}${e.ctx ? ` | ${e.ctx}` : ""}`,
  );
  return `Write blurbs for these ${batch.length} Warhammer 40,000 entities, then call publish_blurbs once:\n\n${lines.join("\n")}`;
}

// --- API call (retry on 429/5xx/network; mirrors llm/enrich.ts) --------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface CallResult {
  message: Anthropic.Message;
}

async function callApi(
  client: Anthropic,
  model: string,
  batch: Entity[],
  useWeb: boolean,
): Promise<CallResult> {
  const tools = (useWeb ? [WEB_SEARCH_TOOL, PUBLISH_BLURBS_TOOL] : [PUBLISH_BLURBS_TOOL]) as unknown as Anthropic.Tool[];
  let lastErr = "";
  for (let attempt = 0; attempt <= MAX_HTTP_RETRIES; attempt++) {
    try {
      const message = await client.messages.create({
        model,
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: 0.3,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildUserPrompt(batch) }],
        tools,
      });
      return { message };
    } catch (e) {
      const err = e as { status?: number; message?: string };
      const status = err.status;
      if (status === 401 || status === 403) {
        throw new Error(`Anthropic ${status}: API key rejected. Check ANTHROPIC_API_KEY in .env.local.`);
      }
      lastErr = `Anthropic ${status ?? "?"}: ${err.message ?? String(e)}`;
      const retryable = status === undefined || status === 429 || (status >= 500 && status < 600);
      if (!retryable || attempt === MAX_HTTP_RETRIES) break;
      await sleep(1000 * 2 ** attempt);
    }
  }
  throw new Error(`${lastErr} (after ${MAX_HTTP_RETRIES + 1} attempts)`);
}

function isToolUse(b: Anthropic.ContentBlock): b is Anthropic.ToolUseBlock {
  return b.type === "tool_use";
}

interface RawBlurb { id: string; blurb: string; sourceUrl: string; confidence: number }

function parseBlurbs(message: Anthropic.Message): RawBlurb[] {
  const publish = message.content.filter(isToolUse).find((t) => t.name === "publish_blurbs");
  if (!publish || !publish.input || typeof publish.input !== "object") {
    throw new Error("no valid publish_blurbs tool call in response");
  }
  const raw = (publish.input as { blurbs?: unknown }).blurbs;
  if (!Array.isArray(raw)) throw new Error("publish_blurbs.blurbs is not an array");
  const out: RawBlurb[] = [];
  for (const r of raw) {
    if (r === null || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    if (typeof o.id !== "string" || typeof o.blurb !== "string") continue;
    out.push({
      id: o.id,
      blurb: o.blurb.trim(),
      sourceUrl: typeof o.sourceUrl === "string" ? o.sourceUrl : "",
      confidence: typeof o.confidence === "number" ? o.confidence : 0.7,
    });
  }
  return out;
}

function countSentences(text: string): number {
  const m = text.match(/[.!?]+(?:\s+|$)/g);
  return m ? m.length : text.length > 0 ? 1 : 0;
}

// --- args + output -----------------------------------------------------------

interface Args {
  types: EntityType[];
  fresh: boolean;
  dry: boolean;
  useWeb: boolean;
  limit: number | null;
  batch: number;
  minConfidence: number;
}

function parseArgs(argv: string[]): Args {
  const get = (k: string): string | null => {
    const hit = argv.find((a) => a === `--${k}` || a.startsWith(`--${k}=`));
    if (!hit) return null;
    const eq = hit.indexOf("=");
    return eq === -1 ? "" : hit.slice(eq + 1);
  };
  const typeArg = get("type");
  const types: EntityType[] = typeArg
    ? (typeArg.split(",").filter((t): t is EntityType => t === "faction" || t === "character" || t === "location"))
    : ["faction", "character", "location"];
  const limitArg = get("limit");
  const batchArg = get("batch");
  const minConfArg = get("min-confidence");
  return {
    types,
    fresh: get("fresh") !== null,
    dry: get("dry") !== null,
    useWeb: get("no-web") === null,
    limit: limitArg ? Number(limitArg) : null,
    batch: batchArg ? Math.max(1, Number(batchArg)) : DEFAULT_BATCH,
    minConfidence: minConfArg ? Number(minConfArg) : 0.8,
  };
}

function loadExisting(type: EntityType): Map<string, BlurbRow> {
  try {
    const file = readJson<BlurbFile>(OUTPUT_FILE[type]);
    return new Map(file.blurbs.map((b) => [b.id, b]));
  } catch {
    return new Map();
  }
}

function writeFile(type: EntityType, rows: Map<string, BlurbRow>): void {
  const file: BlurbFile = {
    $schema: "entity-blurbs-v1",
    entityType: type,
    blurbs: [...rows.values()],
  };
  writeFileSync(join(SEED_DIR, OUTPUT_FILE[type]), JSON.stringify(file, null, 2) + "\n");
}

function getModel(): string {
  const v = process.env.BLURB_LLM_MODEL;
  return v && v.trim() !== "" ? v.trim() : DEFAULT_MODEL;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const model = getModel();
  const today = new Date().toISOString().slice(0, 10);
  const all = buildEntities().filter((e) => args.types.includes(e.t));

  const existing: Record<EntityType, Map<string, BlurbRow>> = {
    faction: args.fresh ? new Map() : loadExisting("faction"),
    character: args.fresh ? new Map() : loadExisting("character"),
    location: args.fresh ? new Map() : loadExisting("location"),
  };

  let pending = args.fresh ? all : all.filter((e) => !existing[e.t].has(e.id));
  if (args.limit !== null) pending = pending.slice(0, args.limit);

  console.log(
    `model=${model} web=${args.useWeb} fresh=${args.fresh} batch=${args.batch} ` +
      `types=[${args.types.join(",")}]`,
  );
  console.log(`entities in scope: ${all.length}; pending this run: ${pending.length}`);

  if (args.dry || pending.length === 0) {
    if (pending.length === 0) console.log("nothing to do.");
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing — run via `tsx --env-file=.env.local`.");
  const client = new Anthropic({ apiKey });

  const batches: Entity[][] = [];
  for (let i = 0; i < pending.length; i += args.batch) batches.push(pending.slice(i, i + args.batch));

  let inTok = 0;
  let outTok = 0;
  let searches = 0;
  const lowConfidence: string[] = [];
  const dropped: string[] = [];
  const overLong: string[] = [];

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    const wantIds = new Set(batch.map((e) => e.id));
    const { message } = await callApi(client, model, batch, args.useWeb);
    inTok += message.usage.input_tokens;
    outTok += message.usage.output_tokens;
    const serverUse = message.usage.server_tool_use as { web_search_requests?: number } | null | undefined;
    searches += serverUse?.web_search_requests ?? 0;

    const blurbs = parseBlurbs(message);
    const got = new Set<string>();
    for (const b of blurbs) {
      if (!wantIds.has(b.id) || got.has(b.id)) continue;
      got.add(b.id);
      const e = batch.find((x) => x.id === b.id);
      if (!e) continue;
      if (b.blurb.length > MAX_BLURB_CHARS || countSentences(b.blurb) > MAX_SENTENCES) {
        overLong.push(`${e.t}:${b.id}`);
      }
      const row: BlurbRow = {
        id: b.id,
        blurb: b.blurb,
        source_kind: "manual",
        confidence: Math.max(0, Math.min(1, b.confidence)),
        sourceUrl: b.sourceUrl || `https://wh40k.lexicanum.com/wiki/${encodeURIComponent(e.name.replace(/ /g, "_"))}`,
        checkedAt: today,
      };
      if (row.confidence < args.minConfidence) lowConfidence.push(`${e.t}:${b.id} (${row.confidence})`);
      existing[e.t].set(b.id, row);
    }
    for (const e of batch) if (!got.has(e.id)) dropped.push(`${e.t}:${e.id}`);

    // persist after every batch so a crash resumes
    for (const t of args.types) writeFile(t, existing[t]);
    console.log(`batch ${bi + 1}/${batches.length} — ${got.size}/${batch.length} ok (searches so far: ${searches})`);
  }

  const price = PRICING[model] ?? PRICING[DEFAULT_MODEL];
  const cost = inTok * price.in + outTok * price.out + searches * price.search;
  console.log(`\ndone. tokens in=${inTok} out=${outTok} searches=${searches} ~$${cost.toFixed(2)}`);
  if (overLong.length) console.log(`over length/sentence cap (${overLong.length}): ${overLong.join(", ")}`);
  if (lowConfidence.length) console.log(`below confidence ${args.minConfidence} (${lowConfidence.length}) — review:\n  ${lowConfidence.join("\n  ")}`);
  if (dropped.length) console.log(`NOT returned by the model (${dropped.length}) — re-run to retry:\n  ${dropped.join(", ")}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
