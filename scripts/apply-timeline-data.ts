/**
 * apply-timeline-data.ts — Brief 137. Lädt den hand-kuratierten Chronicle-
 * Timeline-Datensatz (Workshop-Output, committed als vier Seed-JSONs) nach
 * Postgres:
 *
 *   • scripts/seed-data/eras.json        → `eras` (8-Era-Map, Upsert + Retire)
 *   • scripts/seed-data/events.json      → `events` (144 kuratierte Events)
 *   • scripts/seed-data/event-works.json → `event_works` (Buch-/Serien-/Podcast-Hooks)
 *   • scripts/seed-data/book-dates.json  → `works.startY/endY` + setting*-Provenance
 *
 * Disziplin (etabliertes Batches-Apply-Muster):
 *   • Validierung VOR jedem Write: Datei-Shapes, Cross-File-Referenzen
 *     (eraId, settingAnchorEventId) und DB-Auflösung jedes Hooks
 *     (workSlug → works, showSlug+episodeGuid → podcast_episode_details,
 *     seriesId → series). Jede unaufgelöste Referenz bricht den Apply mit
 *     gelistetem Report ab — keine stillen Skips.
 *   • `--dry-run` druckt den vollständigen Plan (Era-Diff, Remap-Liste,
 *     Counts) ohne einen einzigen Write.
 *   • Idempotent: Eras + Events werden per id geupsertet, danach Stale-Rows
 *     gelöscht; `event_works` wird wholesale aus dem JSON neu aufgebaut;
 *     Buch-Daten fassen nur die in book-dates.json benannten Rows an.
 *     Zwei Applies hintereinander erreichen denselben Endzustand.
 *   • Ein einziger Transaktions-Scope für alle Writes — ein Fehler lässt
 *     keinen halb-applied Zustand zurück.
 *
 * Era-Retirement (Brief 137 § Apply path):
 *   `age_rebirth` und `long_war` verschwinden. Vor dem Delete wird
 *   `book_details.primary_era_id` remappt: age_rebirth → horus_heresy;
 *   long_war → Bucket nach dem (frisch applied) works.startY in
 *   the_forging / age_apostasy / the_waning. Ein long_war-Buch ohne
 *   Setting-Date wird NICHT geraten: primary_era_id → NULL + Zeile im
 *   Manual-Pass-Report.
 *
 * CLI:
 *   npm run apply:timeline -- --dry-run   # Plan bauen + drucken, keine Writes
 *   npm run apply:timeline                # Apply gegen die DB aus .env.local
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

import { and, count, eq, inArray, isNotNull, sql } from "drizzle-orm";

import { db } from "@/db/client";
import {
  bookDetails,
  eras,
  events,
  eventWorks,
  podcastEpisodeDetails,
  series,
  works,
} from "@/db/schema";

const SEED_DIR = join(process.cwd(), "scripts", "seed-data");

// ─── 1. JSON-Shapes + Type-Guards ────────────────────────────────────────────

interface RawEra {
  id: string;
  name: string;
  short: string;
  mLabel: string;
  sub: string;
  tagline: string;
  intro: string;
  coverRef: string;
  start: number;
  end: number;
  tone: string;
  sortOrder: number;
}

type EventTier = "epoch" | "major" | "minor";
type Confidence = "H" | "M" | "L";

interface RawEvent {
  id: string;
  title: string;
  dateLabel: string;
  startY: number | null;
  endY: number | null;
  offscale: boolean;
  eraId: string;
  sortIndex: number;
  tier: EventTier;
  approx: boolean;
  confidence: Confidence;
  sourceKind: string;
  blurb: string;
  curatorNote: string | null;
  artworkRef: string | null;
  artCredit: { name: string | null; url: string | null };
}

/** Genau eine der drei Target-Varianten pro Hook-Eintrag. */
interface RawEventWork {
  eventId: string;
  workSlug?: string;
  episodeGuid?: string;
  showSlug?: string;
  seriesId?: string;
  role: "book" | "podcast";
  displayLabel: string | null;
  position: number;
}

interface RawBookDate {
  slug: string;
  title: string;
  startY: number;
  endY: number;
  settingDateLabel: string;
  settingMethod: string;
  settingConfidence: Confidence;
  settingAnchorEventId: string | null;
  // Kurations-Notiz — bleibt JSON-only, hat bewusst keine works-Spalte.
  note: string | null;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const TIERS = new Set<string>(["epoch", "major", "minor"]);
const CONFIDENCES = new Set<string>(["H", "M", "L"]);
const HOOK_ROLES = new Set<string>(["book", "podcast"]);

function readJsonArray(file: string): unknown[] {
  const parsed: unknown = JSON.parse(readFileSync(join(SEED_DIR, file), "utf8"));
  if (!Array.isArray(parsed)) {
    throw new Error(`${file}: expected a top-level array`);
  }
  return parsed;
}

/** Sammelt Shape-Fehler statt am ersten zu sterben — der Report listet alle. */
class Problems {
  readonly items: string[] = [];
  add(msg: string): void {
    this.items.push(msg);
  }
  failIfAny(stage: string): void {
    if (this.items.length === 0) return;
    console.error(`\n[apply-timeline] ${stage} FAILED — ${this.items.length} problem(s):`);
    for (const p of this.items) console.error(`  ✗ ${p}`);
    process.exit(1);
  }
}

function isNullableString(v: unknown): v is string | null {
  return v === null || typeof v === "string";
}

function parseEras(p: Problems): RawEra[] {
  const out: RawEra[] = [];
  for (const [i, raw] of readJsonArray("eras.json").entries()) {
    const where = `eras.json[${i}]`;
    if (!isRecord(raw)) {
      p.add(`${where}: not an object`);
      continue;
    }
    const stringFields = [
      "id",
      "name",
      "short",
      "mLabel",
      "sub",
      "tagline",
      "intro",
      "coverRef",
      "tone",
    ] as const;
    let ok = true;
    for (const f of stringFields) {
      if (typeof raw[f] !== "string" || raw[f] === "") {
        p.add(`${where}: field '${f}' missing or not a non-empty string`);
        ok = false;
      }
    }
    for (const f of ["start", "end", "sortOrder"] as const) {
      if (typeof raw[f] !== "number" || !Number.isFinite(raw[f])) {
        p.add(`${where}: field '${f}' missing or not a number`);
        ok = false;
      }
    }
    if (ok) out.push(raw as unknown as RawEra);
  }
  return out;
}

function parseEvents(p: Problems, eraIds: Set<string>): RawEvent[] {
  const out: RawEvent[] = [];
  const seen = new Set<string>();
  for (const [i, raw] of readJsonArray("events.json").entries()) {
    const where = `events.json[${i}]`;
    if (!isRecord(raw)) {
      p.add(`${where}: not an object`);
      continue;
    }
    const id = raw.id;
    if (typeof id !== "string" || id === "") {
      p.add(`${where}: missing id`);
      continue;
    }
    if (seen.has(id)) p.add(`${where}: duplicate event id '${id}'`);
    seen.add(id);

    for (const f of ["title", "dateLabel", "blurb", "sourceKind"] as const) {
      if (typeof raw[f] !== "string" || raw[f] === "") {
        p.add(`${where} (${id}): field '${f}' missing or empty`);
      }
    }
    if (typeof raw.eraId !== "string" || !eraIds.has(raw.eraId)) {
      p.add(`${where} (${id}): eraId '${String(raw.eraId)}' not in eras.json`);
    }
    if (typeof raw.tier !== "string" || !TIERS.has(raw.tier)) {
      p.add(`${where} (${id}): tier '${String(raw.tier)}' not in {epoch,major,minor}`);
    }
    if (typeof raw.confidence !== "string" || !CONFIDENCES.has(raw.confidence)) {
      p.add(`${where} (${id}): confidence '${String(raw.confidence)}' not in {H,M,L}`);
    }
    if (typeof raw.offscale !== "boolean" || typeof raw.approx !== "boolean") {
      p.add(`${where} (${id}): offscale/approx must be boolean`);
    }
    if (!Number.isInteger(raw.sortIndex)) {
      p.add(`${where} (${id}): sortIndex must be an integer`);
    }
    const startOk = raw.startY === null || typeof raw.startY === "number";
    const endOk = raw.endY === null || typeof raw.endY === "number";
    if (!startOk || !endOk) {
      p.add(`${where} (${id}): startY/endY must be number or null`);
    } else if (raw.offscale === true && (raw.startY !== null || raw.endY !== null)) {
      p.add(`${where} (${id}): offscale event must carry null startY/endY`);
    } else if (raw.offscale === false && (raw.startY === null || raw.endY === null)) {
      p.add(`${where} (${id}): on-scale event must carry numeric startY/endY`);
    }
    if (!isNullableString(raw.curatorNote) || !isNullableString(raw.artworkRef)) {
      p.add(`${where} (${id}): curatorNote/artworkRef must be string or null`);
    }
    if (
      !isRecord(raw.artCredit) ||
      !isNullableString(raw.artCredit.name) ||
      !isNullableString(raw.artCredit.url)
    ) {
      p.add(`${where} (${id}): artCredit must be { name, url } with string|null`);
    }
    out.push(raw as unknown as RawEvent);
  }
  return out;
}

function parseEventWorks(p: Problems, eventIds: Set<string>): RawEventWork[] {
  const out: RawEventWork[] = [];
  const seenTargets = new Set<string>();
  for (const [i, raw] of readJsonArray("event-works.json").entries()) {
    const where = `event-works.json[${i}]`;
    if (!isRecord(raw)) {
      p.add(`${where}: not an object`);
      continue;
    }
    const eventId = raw.eventId;
    if (typeof eventId !== "string" || !eventIds.has(eventId)) {
      p.add(`${where}: eventId '${String(eventId)}' not in events.json`);
      continue;
    }
    const hasWork = raw.workSlug !== undefined;
    const hasEpisode = raw.episodeGuid !== undefined || raw.showSlug !== undefined;
    const hasSeries = raw.seriesId !== undefined;
    const variants = [hasWork, hasEpisode, hasSeries].filter(Boolean).length;
    if (variants !== 1) {
      p.add(`${where} (${eventId}): expected exactly one of workSlug / episodeGuid+showSlug / seriesId`);
      continue;
    }
    if (hasWork && (typeof raw.workSlug !== "string" || raw.workSlug === "")) {
      p.add(`${where} (${eventId}): workSlug must be a non-empty string`);
      continue;
    }
    if (
      hasEpisode &&
      (typeof raw.episodeGuid !== "string" ||
        raw.episodeGuid === "" ||
        typeof raw.showSlug !== "string" ||
        raw.showSlug === "")
    ) {
      p.add(`${where} (${eventId}): episode hook needs both episodeGuid and showSlug`);
      continue;
    }
    if (hasSeries && (typeof raw.seriesId !== "string" || raw.seriesId === "")) {
      p.add(`${where} (${eventId}): seriesId must be a non-empty string`);
      continue;
    }
    if (typeof raw.role !== "string" || !HOOK_ROLES.has(raw.role)) {
      p.add(`${where} (${eventId}): role '${String(raw.role)}' not in {book,podcast}`);
    }
    if (!isNullableString(raw.displayLabel)) {
      p.add(`${where} (${eventId}): displayLabel must be string or null`);
    }
    if (!Number.isInteger(raw.position)) {
      p.add(`${where} (${eventId}): position must be an integer`);
    }
    const targetKey = `${eventId} :: ${String(raw.workSlug ?? "")}|${String(raw.episodeGuid ?? "")}|${String(raw.seriesId ?? "")}`;
    if (seenTargets.has(targetKey)) {
      p.add(`${where} (${eventId}): duplicate hook target in JSON`);
    }
    seenTargets.add(targetKey);
    out.push(raw as unknown as RawEventWork);
  }
  return out;
}

function parseBookDates(p: Problems, eventIds: Set<string>): RawBookDate[] {
  const out: RawBookDate[] = [];
  const seen = new Set<string>();
  for (const [i, raw] of readJsonArray("book-dates.json").entries()) {
    const where = `book-dates.json[${i}]`;
    if (!isRecord(raw)) {
      p.add(`${where}: not an object`);
      continue;
    }
    const slug = raw.slug;
    if (typeof slug !== "string" || slug === "") {
      p.add(`${where}: missing slug`);
      continue;
    }
    if (seen.has(slug)) p.add(`${where}: duplicate slug '${slug}'`);
    seen.add(slug);

    for (const f of ["title", "settingDateLabel", "settingMethod"] as const) {
      if (typeof raw[f] !== "string" || raw[f] === "") {
        p.add(`${where} (${slug}): field '${f}' missing or empty`);
      }
    }
    if (typeof raw.startY !== "number" || typeof raw.endY !== "number") {
      p.add(`${where} (${slug}): startY/endY must be numbers`);
    } else if (raw.startY > raw.endY) {
      p.add(`${where} (${slug}): startY ${raw.startY} > endY ${raw.endY}`);
    }
    if (typeof raw.settingConfidence !== "string" || !CONFIDENCES.has(raw.settingConfidence)) {
      p.add(`${where} (${slug}): settingConfidence '${String(raw.settingConfidence)}' not in {H,M,L}`);
    }
    if (raw.settingAnchorEventId !== null) {
      if (typeof raw.settingAnchorEventId !== "string" || !eventIds.has(raw.settingAnchorEventId)) {
        p.add(`${where} (${slug}): settingAnchorEventId '${String(raw.settingAnchorEventId)}' not in events.json`);
      }
    }
    if (!isNullableString(raw.note)) {
      p.add(`${where} (${slug}): note must be string or null`);
    }
    out.push(raw as unknown as RawBookDate);
  }
  return out;
}

// ─── 2. DB-Auflösung (read-only) ─────────────────────────────────────────────

interface ResolvedHook {
  eventId: string;
  workId: string | null;
  seriesId: string | null;
  role: string;
  displayLabel: string | null;
  position: number;
}

interface Resolution {
  hooks: ResolvedHook[];
  bookDateWorkIds: Map<string, string>; // slug → works.id
}

async function chunkedSlugLookup(slugs: string[]): Promise<Map<string, { id: string; kind: string }>> {
  const found = new Map<string, { id: string; kind: string }>();
  for (let i = 0; i < slugs.length; i += 200) {
    const chunk = slugs.slice(i, i + 200);
    if (chunk.length === 0) continue;
    const rows = await db
      .select({ id: works.id, slug: works.slug, kind: works.kind })
      .from(works)
      .where(inArray(works.slug, chunk));
    for (const r of rows) found.set(r.slug, { id: r.id, kind: r.kind });
  }
  return found;
}

/**
 * Löst jede Hook-Referenz und jeden book-dates-Slug gegen die Live-DB auf.
 * Jede unauflösbare Referenz landet im Problems-Report; der Apply bricht ab,
 * bevor irgendetwas geschrieben wird.
 */
async function resolveAgainstDb(
  p: Problems,
  hooks: RawEventWork[],
  bookDates: RawBookDate[],
): Promise<Resolution> {
  // a) workSlug-Hooks — Slug muss existieren und ein Buch-Work sein.
  const workSlugs = [...new Set(hooks.flatMap((h) => (h.workSlug !== undefined ? [h.workSlug] : [])))];
  const workBySlug = await chunkedSlugLookup(workSlugs);
  for (const s of workSlugs) {
    const hit = workBySlug.get(s);
    if (hit === undefined) p.add(`event-works: workSlug '${s}' not found in works`);
    else if (hit.kind !== "book") p.add(`event-works: workSlug '${s}' resolves to kind '${hit.kind}', expected 'book'`);
  }

  // b) Episode-Hooks — Show-Slug → podcast-Work, dann (show, guid) → Episode.
  const showSlugs = [...new Set(hooks.flatMap((h) => (h.showSlug !== undefined ? [h.showSlug] : [])))];
  const showRows = showSlugs.length
    ? await db
        .select({ id: works.id, slug: works.slug })
        .from(works)
        .where(and(inArray(works.slug, showSlugs), eq(works.kind, "podcast")))
    : [];
  const showBySlug = new Map(showRows.map((r) => [r.slug, r.id]));
  for (const s of showSlugs) {
    if (!showBySlug.has(s)) p.add(`event-works: showSlug '${s}' not found as a podcast work`);
  }

  const episodeByKey = new Map<string, string>(); // `${showSlug} ${guid}` → workId
  for (const showSlug of showSlugs) {
    const showId = showBySlug.get(showSlug);
    if (showId === undefined) continue;
    const guids = [
      ...new Set(
        hooks.flatMap((h) =>
          h.showSlug === showSlug && h.episodeGuid !== undefined ? [h.episodeGuid] : [],
        ),
      ),
    ];
    for (let i = 0; i < guids.length; i += 200) {
      const chunk = guids.slice(i, i + 200);
      const rows = await db
        .select({ workId: podcastEpisodeDetails.workId, guid: podcastEpisodeDetails.episodeGuid })
        .from(podcastEpisodeDetails)
        .where(
          and(
            eq(podcastEpisodeDetails.podcastWorkId, showId),
            inArray(podcastEpisodeDetails.episodeGuid, chunk),
          ),
        );
      for (const r of rows) episodeByKey.set(`${showSlug} ${r.guid}`, r.workId);
    }
    for (const g of guids) {
      if (!episodeByKey.has(`${showSlug} ${g}`)) {
        p.add(`event-works: episodeGuid '${g}' not found for show '${showSlug}'`);
      }
    }
  }

  // c) Serien-Hooks.
  const seriesIds = [...new Set(hooks.flatMap((h) => (h.seriesId !== undefined ? [h.seriesId] : [])))];
  const seriesRows = seriesIds.length
    ? await db.select({ id: series.id }).from(series).where(inArray(series.id, seriesIds))
    : [];
  const seriesFound = new Set(seriesRows.map((r) => r.id));
  for (const s of seriesIds) {
    if (!seriesFound.has(s)) p.add(`event-works: seriesId '${s}' not found in series`);
  }

  // d) book-dates-Slugs.
  const dateSlugs = bookDates.map((b) => b.slug);
  const dateWorkBySlug = await chunkedSlugLookup(dateSlugs);
  const bookDateWorkIds = new Map<string, string>();
  for (const b of bookDates) {
    const hit = dateWorkBySlug.get(b.slug);
    if (hit === undefined) p.add(`book-dates: slug '${b.slug}' not found in works`);
    else if (hit.kind !== "book") p.add(`book-dates: slug '${b.slug}' resolves to kind '${hit.kind}', expected 'book'`);
    else bookDateWorkIds.set(b.slug, hit.id);
  }

  // Hook-Rows in Insert-Form projizieren (nur wenn alles auflösbar war —
  // failIfAny() des Callers entscheidet).
  const resolved: ResolvedHook[] = hooks.map((h) => ({
    eventId: h.eventId,
    workId:
      h.workSlug !== undefined
        ? (workBySlug.get(h.workSlug)?.id ?? null)
        : h.episodeGuid !== undefined && h.showSlug !== undefined
          ? (episodeByKey.get(`${h.showSlug} ${h.episodeGuid}`) ?? null)
          : null,
    seriesId: h.seriesId ?? null,
    role: h.role,
    displayLabel: h.displayLabel,
    position: h.position,
  }));

  return { hooks: resolved, bookDateWorkIds };
}

// ─── 3. Era-Retirement + primaryEraId-Remap ──────────────────────────────────

const RETIRED_ERAS = ["age_rebirth", "long_war"] as const;

/** long_war-Bucketing nach effektivem startY (Brief 137 § Apply path Schritt 2). */
function bucketLongWar(startY: number): string | null {
  if (startY >= 32000 && startY < 35000) return "the_forging";
  if (startY >= 35000 && startY < 38000) return "age_apostasy";
  if (startY >= 38000 && startY < 41000) return "the_waning";
  return null;
}

interface RemapPlan {
  ageRebirthCount: number;
  longWarMoves: Array<{ workId: string; slug: string; title: string; startY: number; target: string }>;
  manualPass: Array<{ workId: string; slug: string; title: string; startY: number | null; reason: string }>;
}

/**
 * Plant den primary_era_id-Remap. Das Bucketing nutzt den EFFEKTIVEN startY:
 * den Wert aus book-dates.json, falls das Buch dort benannt ist (der Apply
 * schreibt ihn in derselben Transaktion vorher), sonst den aktuellen
 * works.startY. Nicht bucketbar → NULL + Manual-Pass-Report, kein Raten.
 */
async function planRemap(bookDates: RawBookDate[]): Promise<RemapPlan> {
  const dateBySlug = new Map(bookDates.map((b) => [b.slug, b]));

  const ageRebirthRows = await db
    .select({ n: count() })
    .from(bookDetails)
    .where(eq(bookDetails.primaryEraId, "age_rebirth"));

  const longWarRows = await db
    .select({
      workId: bookDetails.workId,
      slug: works.slug,
      title: works.title,
      dbStartY: works.startY,
    })
    .from(bookDetails)
    .innerJoin(works, eq(works.id, bookDetails.workId))
    .where(eq(bookDetails.primaryEraId, "long_war"));

  const plan: RemapPlan = {
    ageRebirthCount: ageRebirthRows[0]?.n ?? 0,
    longWarMoves: [],
    manualPass: [],
  };

  for (const row of longWarRows) {
    const fromDates = dateBySlug.get(row.slug);
    const effective =
      fromDates !== undefined
        ? fromDates.startY
        : row.dbStartY !== null
          ? Number(row.dbStartY)
          : null;
    if (effective === null) {
      plan.manualPass.push({
        workId: row.workId,
        slug: row.slug,
        title: row.title,
        startY: null,
        reason: "no setting date (neither book-dates.json nor works.start_y)",
      });
      continue;
    }
    const target = bucketLongWar(effective);
    if (target === null) {
      plan.manualPass.push({
        workId: row.workId,
        slug: row.slug,
        title: row.title,
        startY: effective,
        reason: `startY ${effective} outside the_forging/age_apostasy/the_waning bounds`,
      });
      continue;
    }
    plan.longWarMoves.push({
      workId: row.workId,
      slug: row.slug,
      title: row.title,
      startY: effective,
      target,
    });
  }

  return plan;
}

// ─── 4. Plan-Report ──────────────────────────────────────────────────────────

interface EraDiff {
  inserts: string[];
  updates: string[];
  deletes: string[];
}

async function diffEras(rawEras: RawEra[]): Promise<EraDiff> {
  const existing = await db.select({ id: eras.id }).from(eras);
  const existingIds = new Set(existing.map((r) => r.id));
  const jsonIds = new Set(rawEras.map((e) => e.id));
  return {
    inserts: rawEras.filter((e) => !existingIds.has(e.id)).map((e) => e.id),
    updates: rawEras.filter((e) => existingIds.has(e.id)).map((e) => e.id),
    deletes: [...existingIds].filter((id) => !jsonIds.has(id)),
  };
}

function printPlan(opts: {
  dryRun: boolean;
  rawEras: RawEra[];
  rawEvents: RawEvent[];
  hooks: ResolvedHook[];
  bookDates: RawBookDate[];
  eraDiff: EraDiff;
  remap: RemapPlan;
  existingEventIds: Set<string>;
  currentHookCount: number;
}): void {
  const {
    dryRun,
    rawEras,
    rawEvents,
    hooks,
    bookDates,
    eraDiff,
    remap,
    existingEventIds,
    currentHookCount,
  } = opts;
  const tag = dryRun ? " [DRY RUN — no writes]" : "";
  const jsonEventIds = new Set(rawEvents.map((e) => e.id));
  const staleEvents = [...existingEventIds].filter((id) => !jsonEventIds.has(id));
  const eventInserts = rawEvents.filter((e) => !existingEventIds.has(e.id)).length;

  console.log(`\n=== timeline apply plan${tag} ===`);
  console.log(`Eras (${rawEras.length} in JSON):`);
  console.log(`  insert: ${eraDiff.inserts.join(", ") || "—"}`);
  console.log(`  update: ${eraDiff.updates.join(", ") || "—"}`);
  console.log(`  retire: ${eraDiff.deletes.join(", ") || "—"}`);

  console.log(`primary_era_id remap:`);
  console.log(`  age_rebirth → horus_heresy: ${remap.ageRebirthCount} book(s)`);
  console.log(`  long_war buckets: ${remap.longWarMoves.length} book(s)`);
  for (const m of remap.longWarMoves) {
    console.log(`    ${m.slug}  (startY ${m.startY}) → ${m.target}`);
  }
  if (remap.manualPass.length > 0) {
    console.log(`  MANUAL PASS — primary_era_id set to NULL, no guess (${remap.manualPass.length}):`);
    for (const m of remap.manualPass) {
      console.log(`    ${m.slug}  "${m.title}"  — ${m.reason}`);
    }
  } else {
    console.log(`  manual-pass list: empty`);
  }

  const byEra = new Map<string, number>();
  for (const e of rawEvents) byEra.set(e.eraId, (byEra.get(e.eraId) ?? 0) + 1);
  console.log(`Events (${rawEvents.length} in JSON): ${eventInserts} insert, ${rawEvents.length - eventInserts} update, ${staleEvents.length} stale delete`);
  for (const era of rawEras) {
    console.log(`    ${era.id.padEnd(14)} ${String(byEra.get(era.id) ?? 0).padStart(3)}`);
  }
  if (staleEvents.length > 0) console.log(`  stale: ${staleEvents.join(", ")}`);

  const roleCounts = new Map<string, number>();
  for (const h of hooks) {
    const kind = h.seriesId !== null ? `${h.role} (series)` : h.role;
    roleCounts.set(kind, (roleCounts.get(kind) ?? 0) + 1);
  }
  console.log(
    `event_works: wholesale rebuild — delete ${currentHookCount} existing, insert ${hooks.length} ` +
      `(${[...roleCounts.entries()].map(([k, n]) => `${n} ${k}`).join(", ")})`,
  );
  console.log(`Book dates: ${bookDates.length} works get startY/endY + setting* columns`);
}

// ─── 5. Apply ────────────────────────────────────────────────────────────────

function numToStr(n: number | null): string | null {
  return n === null ? null : String(n);
}

async function applyAll(opts: {
  rawEras: RawEra[];
  rawEvents: RawEvent[];
  hooks: ResolvedHook[];
  bookDates: RawBookDate[];
  bookDateWorkIds: Map<string, string>;
  remap: RemapPlan;
  eraDiff: EraDiff;
}): Promise<void> {
  const { rawEras, rawEvents, hooks, bookDates, bookDateWorkIds, remap, eraDiff } = opts;

  await db.transaction(async (tx) => {
    // 1. Eras upserten — Events brauchen die neuen ids als FK.
    for (const e of rawEras) {
      const values = {
        id: e.id,
        name: e.name,
        startY: String(e.start),
        endY: String(e.end),
        tone: e.tone,
        sortOrder: e.sortOrder,
        short: e.short,
        mLabel: e.mLabel,
        sub: e.sub,
        tagline: e.tagline,
        intro: e.intro,
        coverRef: e.coverRef,
      };
      await tx
        .insert(eras)
        .values(values)
        .onConflictDoUpdate({ target: eras.id, set: values });
    }

    // 2. Events upserten (by id — works.setting_anchor_event_id darf auf
    //    bestehende Rows zeigen, deshalb kein delete-then-insert).
    for (const ev of rawEvents) {
      const values = {
        id: ev.id,
        title: ev.title,
        dateLabel: ev.dateLabel,
        startY: numToStr(ev.startY),
        endY: numToStr(ev.endY),
        offscale: ev.offscale,
        eraId: ev.eraId,
        sortIndex: ev.sortIndex,
        tier: ev.tier,
        approx: ev.approx,
        confidence: ev.confidence,
        sourceKind: ev.sourceKind,
        blurb: ev.blurb,
        curatorNote: ev.curatorNote,
        artworkRef: ev.artworkRef,
        artCreditName: ev.artCredit.name,
        artCreditUrl: ev.artCredit.url,
      };
      await tx
        .insert(events)
        .values(values)
        .onConflictDoUpdate({ target: events.id, set: values });
    }

    // 3. event_works wholesale aus dem JSON neu aufbauen.
    await tx.delete(eventWorks);
    for (let i = 0; i < hooks.length; i += 200) {
      await tx.insert(eventWorks).values(hooks.slice(i, i + 200));
    }

    // 4. Buch-Daten — nur die in book-dates.json benannten Rows.
    for (const b of bookDates) {
      const workId = bookDateWorkIds.get(b.slug);
      if (workId === undefined) {
        // Auflösung hat das vorab garantiert; defensiv trotzdem hart scheitern.
        throw new Error(`book-dates: slug '${b.slug}' lost its resolved work id`);
      }
      await tx
        .update(works)
        .set({
          startY: String(b.startY),
          endY: String(b.endY),
          settingDateLabel: b.settingDateLabel,
          settingMethod: b.settingMethod,
          settingConfidence: b.settingConfidence,
          settingAnchorEventId: b.settingAnchorEventId,
          updatedAt: new Date(),
        })
        .where(eq(works.id, workId));
    }

    // 5. Stale Events löschen (ids, die nicht mehr im JSON stehen). Nach den
    //    Anchor-Updates: zeigt ein works.setting_anchor_event_id noch auf eine
    //    stale Row, schlägt das hier laut fehl — gewollt, Kuration muss ran.
    const jsonEventIds = new Set(rawEvents.map((e) => e.id));
    const dbEventIds = await tx.select({ id: events.id }).from(events);
    const stale = dbEventIds.map((r) => r.id).filter((id) => !jsonEventIds.has(id));
    if (stale.length > 0) {
      await tx.delete(events).where(inArray(events.id, stale));
    }

    // 6. primary_era_id remappen, DANN die zwei retirten Eras löschen.
    await tx
      .update(bookDetails)
      .set({ primaryEraId: "horus_heresy" })
      .where(eq(bookDetails.primaryEraId, "age_rebirth"));
    for (const m of remap.longWarMoves) {
      await tx
        .update(bookDetails)
        .set({ primaryEraId: m.target })
        .where(eq(bookDetails.workId, m.workId));
    }
    for (const m of remap.manualPass) {
      await tx
        .update(bookDetails)
        .set({ primaryEraId: null })
        .where(eq(bookDetails.workId, m.workId));
    }
    if (eraDiff.deletes.length > 0) {
      await tx.delete(eras).where(inArray(eras.id, eraDiff.deletes));
    }
  });
}

/** DB-seitige Zählung nach dem Apply — der Summary-Report ist autoritativ. */
async function printDbSummary(): Promise<void> {
  const [eraCount] = await db.select({ n: count() }).from(eras);
  const [eventCount] = await db.select({ n: count() }).from(events);
  const [hookCount] = await db.select({ n: count() }).from(eventWorks);
  const [datedWorks] = await db
    .select({ n: count() })
    .from(works)
    .where(isNotNull(works.settingDateLabel));
  const [anchored] = await db
    .select({ n: count() })
    .from(works)
    .where(isNotNull(works.settingAnchorEventId));
  const eventsByEra = await db
    .select({ eraId: events.eraId, n: count() })
    .from(events)
    .groupBy(events.eraId)
    .orderBy(sql`min(${events.sortIndex})`);

  console.log(`\n=== timeline apply summary (DB-side counts) ===`);
  console.log(`eras:        ${eraCount.n}`);
  console.log(`events:      ${eventCount.n}`);
  for (const r of eventsByEra) console.log(`    ${r.eraId.padEnd(14)} ${String(r.n).padStart(3)}`);
  console.log(`event_works: ${hookCount.n}`);
  console.log(`works with setting date: ${datedWorks.n} (${anchored.n} event-anchored)`);
}

// ─── 6. Main ─────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      "dry-run": { type: "boolean", default: false },
    },
  });
  const dryRun = values["dry-run"] === true;

  // Stage 1: Datei-Shapes + Cross-File-Referenzen.
  const p = new Problems();
  const rawEras = parseEras(p);
  const eraIds = new Set(rawEras.map((e) => e.id));
  const rawEvents = parseEvents(p, eraIds);
  const eventIds = new Set(rawEvents.map((e) => e.id));
  const rawHooks = parseEventWorks(p, eventIds);
  const bookDates = parseBookDates(p, eventIds);
  p.failIfAny("file validation");
  console.log(
    `[apply-timeline] files OK: ${rawEras.length} eras, ${rawEvents.length} events, ` +
      `${rawHooks.length} hooks, ${bookDates.length} book dates`,
  );

  // Stage 2: DB-Auflösung — jede Referenz muss treffen, sonst Abbruch.
  const p2 = new Problems();
  const resolution = await resolveAgainstDb(p2, rawHooks, bookDates);
  p2.failIfAny("DB resolution");
  console.log(`[apply-timeline] DB resolution OK — every hook + book-date slug resolves.`);

  // Stage 3: Plan bauen + drucken.
  const eraDiff = await diffEras(rawEras);
  const remap = await planRemap(bookDates);
  const existingEvents = await db.select({ id: events.id }).from(events);
  const [hookCount] = await db.select({ n: count() }).from(eventWorks);
  printPlan({
    dryRun,
    rawEras,
    rawEvents,
    hooks: resolution.hooks,
    bookDates,
    eraDiff,
    remap,
    existingEventIds: new Set(existingEvents.map((r) => r.id)),
    currentHookCount: hookCount.n,
  });

  if (dryRun) {
    console.log(`\n[apply-timeline] dry run — no rows written.`);
    return;
  }

  // Stage 4: Apply in einer Transaktion, dann autoritative DB-Zählung.
  await applyAll({
    rawEras,
    rawEvents,
    hooks: resolution.hooks,
    bookDates,
    bookDateWorkIds: resolution.bookDateWorkIds,
    remap,
    eraDiff,
  });
  await printDbSummary();
}

main()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    console.error("[apply-timeline] failed:", err);
    process.exit(1);
  });
