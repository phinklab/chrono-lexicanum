import type { Metadata } from "next";
import Link from "next/link";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import {
  eras as erasTable,
  workCollections as workCollectionsTable,
  works as worksTable,
} from "@/db/schema";
import {
  AVAILABILITY_LABELS,
  FORMAT_LABELS,
  PERSON_ROLE_LABELS,
} from "@/lib/book-labels";
import { factionDot } from "@/lib/faction-colors";
import AuspexSweep from "@/components/chrono/AuspexSweep";
import FloatingCoord from "@/components/chrono/FloatingCoord";
import CatalogueTelemetry from "@/components/chrono/CatalogueTelemetry";
import AuditPills, { type AuditFilter } from "./AuditPills";
import SortPills from "./SortPills";
import GapAudioToggle from "./GapAudioToggle";
import ScrollScrim from "./ScrollScrim";
import { tallyAxisDrift, type KnownAliasHit } from "@/lib/aliases";

export const metadata: Metadata = { title: "Archive — Chrono Lexicanum" };

type SortKey = "updated" | "title";

interface CataloguePageProps {
  searchParams: Promise<{
    sort?: string;
    audit?: string | string[];
    hideAudio?: string | string[];
  }>;
}

interface CataloguePerson {
  name: string;
  role: string;
  displayOrder: number;
}

interface CatalogueFacet {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string | null;
}

interface CatalogueCollection {
  slug: string;
  title: string;
}

interface CatalogueAudit {
  externalBookId: string | null;
  sourceKind: string;
  confidence: string | null;
  factionCount: number;
  locationCount: number;
  characterCount: number;
  containedInCount: number;
  containsCount: number;
  hasDrift: boolean;
  driftCount: number;
  factionDriftCount: number;
  locationDriftCount: number;
  characterDriftCount: number;
  driftRawNames: string[];
  knownAliasCount: number;
  knownAliases: KnownAliasHit[];
  hasJunctionGap: boolean;
  isSsot: boolean;
  isInMultipleCollections: boolean;
}

interface CatalogueBook {
  id: string;
  slug: string;
  title: string;
  synopsis: string | null;
  coverUrl: string | null;
  releaseYear: number | null;
  startY: number | null;
  endY: number | null;
  format: string | null;
  availability: string | null;
  pageCount: number | null;
  eraName: string | null;
  seriesName: string | null;
  seriesIndex: number | null;
  authors: string[];
  otherPersons: CataloguePerson[];
  factions: Array<{ id: string; name: string }>;
  facets: CatalogueFacet[];
  containedIn: CatalogueCollection[];
  isEnriched: boolean;
  updatedAt: Date;
  audit: CatalogueAudit;
}

const AUDIT_FILTERS: ReadonlySet<AuditFilter> = new Set([
  "drift",
  "alias",
  "gap",
  "ssot",
  "collections",
]);

function parseSort(raw: string | undefined): SortKey {
  return raw === "title" ? "title" : "updated";
}

function isAuditFilter(value: string): value is AuditFilter {
  return AUDIT_FILTERS.has(value as AuditFilter);
}

function parseAudit(raw: string | string[] | undefined): AuditFilter[] {
  const parts = Array.isArray(raw) ? raw.flatMap((v) => v.split(",")) : (raw ?? "").split(",");
  const seen = new Set<AuditFilter>();
  for (const part of parts) {
    const trimmed = part.trim();
    if (isAuditFilter(trimmed)) seen.add(trimmed);
  }
  return [...seen];
}

function parseHideAudio(raw: string | string[] | undefined): boolean {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === "1" || value === "true";
}

function formatMBand(startY: number | null, endY: number | null): string | null {
  if (startY == null && endY == null) return null;
  const fmt = (v: number) => `M${v.toFixed(3)}`;
  if (startY != null && endY != null && Math.abs(startY - endY) < 0.001) {
    return fmt(startY);
  }
  if (startY != null && endY != null) return `${fmt(startY)} – ${fmt(endY)}`;
  return fmt((startY ?? endY) as number);
}

async function loadBooks(): Promise<CatalogueBook[]> {
  try {
    const [rows, erasRows] = await Promise.all([
      db.query.works.findMany({
        where: (w, { eq: eqOp }) => eqOp(w.kind, "book"),
        with: {
          bookDetails: {
            with: { series: { columns: { id: true, name: true } } },
          },
          factions: {
            with: { faction: { columns: { id: true, name: true } } },
          },
          locations: {
            with: { location: { columns: { id: true, name: true } } },
          },
          characters: {
            with: { character: { columns: { id: true, name: true } } },
          },
          facets: {
            with: {
              facetValue: {
                columns: { id: true, name: true, categoryId: true },
                with: { category: { columns: { id: true, name: true } } },
              },
            },
          },
          persons: {
            with: { person: { columns: { name: true } } },
          },
        },
      }),
      db.select({ id: erasTable.id, name: erasTable.name }).from(erasTable),
    ]);

    const erasById = new Map(erasRows.map((e) => [e.id, e.name]));
    const bookIds = rows.map((r) => r.id);
    const [containedInRows, containsRows] =
      bookIds.length === 0
        ? [[], []]
        : await Promise.all([
            db
              .select({
                contentWorkId: workCollectionsTable.contentWorkId,
                collectionSlug: worksTable.slug,
                collectionTitle: worksTable.title,
                displayOrder: workCollectionsTable.displayOrder,
              })
              .from(workCollectionsTable)
              .innerJoin(
                worksTable,
                eq(worksTable.id, workCollectionsTable.collectionWorkId),
              )
              .where(inArray(workCollectionsTable.contentWorkId, bookIds)),
            db
              .select({
                collectionWorkId: workCollectionsTable.collectionWorkId,
                contentSlug: worksTable.slug,
                contentTitle: worksTable.title,
                displayOrder: workCollectionsTable.displayOrder,
              })
              .from(workCollectionsTable)
              .innerJoin(
                worksTable,
                eq(worksTable.id, workCollectionsTable.contentWorkId),
              )
              .where(inArray(workCollectionsTable.collectionWorkId, bookIds)),
          ]);

    const containedInByBook = new Map<string, CatalogueCollection[]>();
    for (const r of containedInRows) {
      const arr = containedInByBook.get(r.contentWorkId) ?? [];
      arr.push({ slug: r.collectionSlug, title: r.collectionTitle });
      containedInByBook.set(r.contentWorkId, arr);
    }

    const containsCountByBook = new Map<string, number>();
    for (const r of containsRows) {
      containsCountByBook.set(
        r.collectionWorkId,
        (containsCountByBook.get(r.collectionWorkId) ?? 0) + 1,
      );
    }

    return rows.map((w): CatalogueBook => {
      const authors: string[] = [];
      const otherPersons: CataloguePerson[] = [];
      for (const wp of w.persons) {
        if (wp.role === "author") {
          authors.push(wp.person.name);
        } else {
          otherPersons.push({
            name: wp.person.name,
            role: wp.role,
            displayOrder: wp.displayOrder,
          });
        }
      }
      otherPersons.sort((a, b) => a.displayOrder - b.displayOrder);

      const factionDrift = tallyAxisDrift(
        "faction",
        w.factions.map((wf) => ({
          rawName: wf.rawName,
          canonicalId: wf.faction.id,
          canonicalName: wf.faction.name,
        })),
      );
      const locationDrift = tallyAxisDrift(
        "location",
        w.locations.map((wl) => ({
          rawName: wl.rawName,
          canonicalId: wl.location.id,
          canonicalName: wl.location.name,
        })),
      );
      const characterDrift = tallyAxisDrift(
        "character",
        w.characters.map((wc) => ({
          rawName: wc.rawName,
          canonicalId: wc.character.id,
          canonicalName: wc.character.name,
        })),
      );

      const factions = w.factions
        .map((wf) => ({ id: wf.faction.id, name: wf.faction.name }))
        .sort((a, b) => a.name.localeCompare(b.name, "de"));

      const facets: CatalogueFacet[] = w.facets
        .map((wf) => ({
          id: wf.facetValue.id,
          name: wf.facetValue.name,
          categoryId: wf.facetValue.categoryId,
          categoryName: wf.facetValue.category?.name ?? null,
        }))
        .sort((a, b) => {
          const cat = (a.categoryName ?? "").localeCompare(
            b.categoryName ?? "",
            "de",
          );
          return cat !== 0 ? cat : a.name.localeCompare(b.name, "de");
        });

      const primaryEraId = w.bookDetails?.primaryEraId ?? null;
      const containedIn = containedInByBook.get(w.id) ?? [];
      const containsCount = containsCountByBook.get(w.id) ?? 0;
      const factionCount = w.factions.length;
      const locationCount = w.locations.length;
      const characterCount = w.characters.length;
      // Suspicious drift (state 3) only — known edition renames (state 2) are
      // tallied separately and excluded from the count / frequency / sort.
      const factionDriftCount = factionDrift.suspectCount;
      const locationDriftCount = locationDrift.suspectCount;
      const characterDriftCount = characterDrift.suspectCount;
      const driftCount =
        factionDriftCount + locationDriftCount + characterDriftCount;
      const driftRawNames: string[] = [
        ...factionDrift.suspectRawNames,
        ...locationDrift.suspectRawNames,
        ...characterDrift.suspectRawNames,
      ];
      const knownAliases: KnownAliasHit[] = [
        ...factionDrift.knownAliases,
        ...locationDrift.knownAliases,
        ...characterDrift.knownAliases,
      ];
      const knownAliasCount = knownAliases.length;
      const hasDrift = driftCount > 0;
      const hasJunctionGap = factionCount === 0 || locationCount === 0 || characterCount === 0;

      return {
        id: w.id,
        slug: w.slug,
        title: w.title,
        synopsis: w.synopsis ?? null,
        coverUrl: w.coverUrl,
        releaseYear: w.releaseYear,
        startY: w.startY == null ? null : Number(w.startY),
        endY: w.endY == null ? null : Number(w.endY),
        format: w.bookDetails?.format ?? null,
        availability: w.bookDetails?.availability ?? null,
        pageCount: w.bookDetails?.pageCount ?? null,
        eraName: primaryEraId ? erasById.get(primaryEraId) ?? null : null,
        seriesName: w.bookDetails?.series?.name ?? null,
        seriesIndex: w.bookDetails?.seriesIndex ?? null,
        authors,
        otherPersons,
        factions,
        facets,
        containedIn,
        isEnriched:
          typeof w.synopsis === "string" && w.synopsis.trim().length > 0,
        updatedAt:
          w.updatedAt instanceof Date
            ? w.updatedAt
            : new Date(w.updatedAt as unknown as string),
        audit: {
          externalBookId: w.externalBookId,
          sourceKind: w.sourceKind,
          confidence: w.confidence,
          factionCount,
          locationCount,
          characterCount,
          containedInCount: containedIn.length,
          containsCount,
          hasDrift,
          driftCount,
          factionDriftCount,
          locationDriftCount,
          characterDriftCount,
          driftRawNames,
          knownAliasCount,
          knownAliases,
          hasJunctionGap,
          isSsot: w.sourceKind === "ssot",
          isInMultipleCollections: containedIn.length >= 2,
        },
      };
    });
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[/buecher] DB fetch failed (${msg}); rendering empty catalogue.`);
    return [];
  }
}

function buildGlobalDriftFreq(
  books: readonly CatalogueBook[],
): Map<string, number> {
  const freq = new Map<string, number>();
  for (const book of books) {
    for (const rawName of book.audit.driftRawNames) {
      freq.set(rawName, (freq.get(rawName) ?? 0) + 1);
    }
  }
  return freq;
}

function driftScore(
  book: CatalogueBook,
  freq: ReadonlyMap<string, number>,
): number {
  let score = 0;
  for (const rawName of book.audit.driftRawNames) {
    score += freq.get(rawName) ?? 0;
  }
  return score;
}

function topDriftSignal(
  book: CatalogueBook,
  freq: ReadonlyMap<string, number> | null,
): { rawName: string; freq: number } | null {
  if (freq === null) return null;
  let best: string | null = null;
  let bestFreq = -1;
  for (const rawName of book.audit.driftRawNames) {
    const f = freq.get(rawName) ?? 0;
    if (f > bestFreq) {
      bestFreq = f;
      best = rawName;
    }
  }
  return best === null ? null : { rawName: best, freq: bestFreq };
}

function sortBooks(
  books: CatalogueBook[],
  key: SortKey,
  auditFilters: readonly AuditFilter[],
  driftScoreById: ReadonlyMap<string, number>,
): CatalogueBook[] {
  const copy = [...books];
  if (auditFilters.includes("drift")) {
    copy.sort((a, b) => {
      const dDrift = b.audit.driftCount - a.audit.driftCount;
      if (dDrift !== 0) return dDrift;
      const dConf =
        Number(b.audit.confidence ?? "0") - Number(a.audit.confidence ?? "0");
      if (dConf !== 0) return dConf;
      const dScore =
        (driftScoreById.get(b.id) ?? 0) - (driftScoreById.get(a.id) ?? 0);
      if (dScore !== 0) return dScore;
      const dFaction = b.audit.factionDriftCount - a.audit.factionDriftCount;
      if (dFaction !== 0) return dFaction;
      const dLocation =
        b.audit.locationDriftCount - a.audit.locationDriftCount;
      if (dLocation !== 0) return dLocation;
      const dCharacter =
        b.audit.characterDriftCount - a.audit.characterDriftCount;
      if (dCharacter !== 0) return dCharacter;
      const dUpdated = b.updatedAt.getTime() - a.updatedAt.getTime();
      if (dUpdated !== 0) return dUpdated;
      return (a.audit.externalBookId ?? "").localeCompare(
        b.audit.externalBookId ?? "",
      );
    });
    return copy;
  }
  if (key === "title") {
    copy.sort((a, b) => a.title.localeCompare(b.title, "de"));
  } else {
    copy.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  return copy;
}

function matchesAudit(book: CatalogueBook, filters: readonly AuditFilter[]): boolean {
  return filters.every((filter) => {
    if (filter === "drift") return book.audit.hasDrift;
    if (filter === "alias") return book.audit.knownAliasCount > 0;
    if (filter === "gap") return book.audit.hasJunctionGap;
    if (filter === "ssot") return book.audit.isSsot;
    return book.audit.isInMultipleCollections;
  });
}

function formatConfidence(value: string | null): string {
  if (value === null) return "—";
  return Number(value).toFixed(2);
}

function formatRelative(date: Date, now: Date): string {
  const diffMs = now.getTime() - date.getTime();
  const sec = Math.max(0, Math.round(diffMs / 1000));
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);

  if (sec < 30) return "just now";
  if (min < 1) return `${sec}s ago`;
  if (hr < 1) return `${min} min ago`;
  if (day < 1) return `${hr} hr ago`;
  if (day < 7) return `${day} day${day === 1 ? "" : "s"} ago`;
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function auditEmptyCopy(filters: readonly AuditFilter[]): string {
  if (filters.length === 1 && filters[0] === "drift") {
    return "No drift hits in this filter.";
  }
  return "No books match this audit combination.";
}

export default async function CataloguePage({ searchParams }: CataloguePageProps) {
  const sp = await searchParams;
  const sort = parseSort(sp.sort);
  const auditFilters = parseAudit(sp.audit);
  const isAuditMode = auditFilters.length > 0;
  const singleGapMode =
    auditFilters.length === 1 && auditFilters[0] === "gap";
  const hideAudio = singleGapMode && parseHideAudio(sp.hideAudio);

  const books = await loadBooks();
  const auditedBooks = isAuditMode
    ? books.filter((book) => matchesAudit(book, auditFilters))
    : books;
  const visibleBooks = hideAudio
    ? auditedBooks.filter((book) => book.format !== "audio_drama")
    : auditedBooks;

  const driftSortActive = auditFilters.includes("drift");
  const driftFreq = driftSortActive ? buildGlobalDriftFreq(books) : null;
  const driftScoreById: ReadonlyMap<string, number> = driftFreq
    ? new Map(books.map((b) => [b.id, driftScore(b, driftFreq)] as const))
    : new Map<string, number>();
  const sorted = sortBooks(visibleBooks, sort, auditFilters, driftScoreById);

  const audioDramaCount = singleGapMode
    ? auditedBooks.filter((b) => b.format === "audio_drama").length
    : 0;
  const enrichedCount = books.filter((b) => b.isEnriched).length;
  const now = new Date();

  return (
    <main className="catalogue">
      <section className="catalogue-hero" aria-label="Books — Catalogue">
        <div className="catalogue-hero__photo" aria-hidden />
        <div className="catalogue-hero__fade" aria-hidden />
        <ScrollScrim />
        <div className="catalogue-hero__sweep" aria-hidden>
          <AuspexSweep r={180} sweepDuration={18} accent="var(--cl-gold)" />
        </div>
        <FloatingCoord
          x="42%"
          y="120px"
          label="ROUTE · SEGMENTVM ULTIMA"
          delay={1.2}
          lifetime={5}
          color="var(--cl-gold)"
          opacity={0.55}
        />
        <FloatingCoord
          x="58%"
          y="220px"
          label="HIT · BAAL · M41"
          delay={3.0}
          lifetime={5}
          color="var(--cl-gold)"
          opacity={0.55}
        />
        <div className="catalogue-hero__title">
          <div className="catalogue-hero__eyebrow">{"CATALOGVS · LIBRORVM"}</div>
          <h1 className="catalogue-hero__heading">ARCHIVE</h1>
          <p className="catalogue-hero__sub">
            {books.length === 0
              ? "No books in the database yet."
              : isAuditMode
                ? `${sorted.length} audit hits of ${books.length} books · stamp M42.347`
                : `${enrichedCount} of ${books.length} with detailed content · stamp M42.347`}
          </p>
        </div>
      </section>

      <div className="catalogue-body">
        <div className="catalogue-toolbar">
          <div className="catalogue-toolbar__left">
            <span className="catalogue-toolbar__count">{sorted.length} · INDEXED</span>
            <span className="catalogue-toolbar__total">/ {books.length} available</span>
            <span className="catalogue-toolbar__dot" aria-hidden>·</span>
            <CatalogueTelemetry accent="gold" />
          </div>
          {books.length > 0 && (
            <div className="catalogue-toolbar__right">
              <SortPills active={sort} overriddenByDrift={driftSortActive} />
              <AuditPills active={auditFilters} />
              {singleGapMode && (
                <GapAudioToggle active={hideAudio} count={audioDramaCount} />
              )}
            </div>
          )}
        </div>

        {driftSortActive && sorted.length > 0 && (
          <p className="catalogue-caption">
            Sorted by drift count · confidence · surface-form cluster · last updated.
          </p>
        )}

        {books.length === 0 ? (
          <div className="catalogue-empty c-glass c-corners">
            The database is empty. Once books are ingested they will appear here.
          </div>
        ) : sorted.length === 0 ? (
          <div className="catalogue-empty c-glass c-corners">
            {auditEmptyCopy(auditFilters)}
          </div>
        ) : (
          <ol className="catalogue-list">
            {sorted.map((b, i) => (
              <li key={b.id}>
                <BookRow
                  book={b}
                  index={i}
                  now={now}
                  auditMode={isAuditMode}
                  dimmed={
                    singleGapMode && !hideAudio && b.format === "audio_drama"
                  }
                  driftSignal={
                    driftSortActive ? topDriftSignal(b, driftFreq) : null
                  }
                />
              </li>
            ))}
          </ol>
        )}

        <footer className="catalogue-footer">
          <span>EX TENEBRIS · COGNITIO</span>
          <span className="catalogue-footer__mid">CLICK ANY TITLE · LECTIO PROFVNDA</span>
          <span>STAMP M42.347</span>
        </footer>
      </div>
    </main>
  );
}

function BookRow({
  book,
  index,
  now,
  auditMode,
  dimmed,
  driftSignal,
}: {
  book: CatalogueBook;
  index: number;
  now: Date;
  auditMode: boolean;
  dimmed: boolean;
  driftSignal: { rawName: string; freq: number } | null;
}) {
  const mBand = formatMBand(book.startY, book.endY);
  const formatLabel = book.format
    ? FORMAT_LABELS[book.format] ?? book.format
    : null;
  const availabilityLabel = book.availability
    ? AVAILABILITY_LABELS[book.availability] ?? book.availability
    : null;
  const metaParts = [
    formatLabel,
    book.pageCount != null ? `${book.pageCount} pp.` : null,
    availabilityLabel,
    book.eraName,
    mBand,
    book.releaseYear != null ? String(book.releaseYear) : null,
  ].filter((v): v is string => Boolean(v));

  const updatedRel = formatRelative(book.updatedAt, now);
  const updatedAbs = book.updatedAt.toLocaleString("en-US");
  const detailHref = auditMode ? `/buch/${book.slug}/audit` : `/buch/${book.slug}`;
  const primaryFaction = book.factions[0]?.name ?? null;
  const dotColor = factionDot(primaryFaction);

  return (
    <details
      className={`catalogue-row${book.isEnriched ? " is-enriched" : " is-stub"}${
        auditMode ? " is-audit" : ""
      }${dimmed ? " is-audio-dim" : ""}`}
    >
      <summary className="catalogue-row__summary">
        <span className="catalogue-row__index">{String(index + 1).padStart(3, "0")}</span>
        <span
          className="catalogue-row__dot"
          aria-hidden
          style={{ background: dotColor }}
          title={primaryFaction ?? "Unclassified"}
        />
        <div className="catalogue-row__main">
          <span className="catalogue-row__title">{book.title}</span>
          {dimmed && (
            <span
              className="catalogue-row__audio-tag"
              title="Audio drama — structurally sparse, expected"
            >
              Audio
            </span>
          )}
          {book.authors.length > 0 && (
            <span className="catalogue-row__byline">
              by {book.authors.join(", ")}
            </span>
          )}
          {auditMode && (
            <span className="catalogue-row__audit-summary">
              {book.audit.externalBookId ?? "—"} · {book.audit.sourceKind} · conf{" "}
              {formatConfidence(book.audit.confidence)} · f:{book.audit.factionCount} l:
              {book.audit.locationCount} c:{book.audit.characterCount}
              {driftSignal && (
                <span className="catalogue-row__drift-signal">
                  {" "}
                  · drift «{driftSignal.rawName}» ×{driftSignal.freq}
                </span>
              )}
              {book.audit.knownAliasCount > 0 && (
                <span
                  className="catalogue-row__alias-signal"
                  title="Known edition rename — expected, not drift"
                >
                  {" "}
                  · alias «{book.audit.knownAliases[0].rawName} → {book.audit.knownAliases[0].canonicalName}»
                  {book.audit.knownAliasCount > 1
                    ? ` +${book.audit.knownAliasCount - 1}`
                    : ""}
                </span>
              )}
            </span>
          )}
        </div>
        <span className="catalogue-row__faction">{primaryFaction ?? "—"}</span>
        <span className="catalogue-row__era">{book.eraName ?? "—"}</span>
        <span className="catalogue-row__year">
          {book.releaseYear != null ? book.releaseYear : "—"}
        </span>
        <div className="catalogue-row__chips">
          {auditMode ? (
            <AuditChips audit={book.audit} />
          ) : (
            <span
              className={
                book.isEnriched
                  ? "catalogue-chip catalogue-chip--enriched"
                  : "catalogue-chip catalogue-chip--stub"
              }
            >
              {book.isEnriched ? "DETAILED" : "STUB"}
            </span>
          )}
        </div>
        <time
          className="catalogue-row__updated"
          dateTime={book.updatedAt.toISOString()}
          title={updatedAbs}
        >
          {updatedRel}
        </time>
        <span className="catalogue-row__chevron" aria-hidden>›</span>
      </summary>

      <div className="catalogue-row__detail">
        <div className="catalogue-row__cover">
          {book.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.coverUrl}
              alt=""
              loading="lazy"
              width={140}
              height={210}
            />
          ) : (
            <div className="catalogue-row__cover-placeholder" aria-hidden>
              ?
            </div>
          )}
        </div>

        <div className="catalogue-row__body">
          {auditMode && (
            <div className="catalogue-row__audit-strip">
              <span>ID {book.audit.externalBookId ?? "—"}</span>
              <span>{book.audit.sourceKind}</span>
              <span>conf {formatConfidence(book.audit.confidence)}</span>
              <span>
                junctions f:{book.audit.factionCount} l:{book.audit.locationCount} c:
                {book.audit.characterCount}
              </span>
              <span>
                contained in: {book.audit.containedInCount} · contains:{" "}
                {book.audit.containsCount}
              </span>
            </div>
          )}

          {book.otherPersons.length > 0 && (
            <p className="catalogue-row__roles">
              {book.otherPersons
                .map((p) => `${PERSON_ROLE_LABELS[p.role] ?? p.role}: ${p.name}`)
                .join(" · ")}
            </p>
          )}

          {metaParts.length > 0 && (
            <p className="catalogue-row__meta">{metaParts.join(" · ")}</p>
          )}

          {book.synopsis && (
            <p className="catalogue-row__synopsis">{book.synopsis}</p>
          )}

          {book.factions.length > 0 && (
            <div className="catalogue-row__tagrow">
              <span className="catalogue-row__tagrow-label">Factions</span>
              <ul className="catalogue-row__tags">
                {book.factions.map((f) => (
                  <li key={f.id} className="catalogue-tag catalogue-tag--faction">
                    {f.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {book.facets.length > 0 && (
            <div className="catalogue-row__tagrow">
              <span className="catalogue-row__tagrow-label">Facets</span>
              <ul className="catalogue-row__tags">
                {book.facets.map((f) => (
                  <li
                    key={f.id}
                    className="catalogue-tag catalogue-tag--facet"
                    title={f.categoryName ?? f.categoryId}
                  >
                    {f.categoryName ? (
                      <>
                        <span className="catalogue-tag__key">{f.categoryName}:</span>{" "}
                        {f.name}
                      </>
                    ) : (
                      f.name
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {book.containedIn.length > 0 && (
            <div className="catalogue-row__tagrow">
              <span className="catalogue-row__tagrow-label">Contained in</span>
              <ul className="catalogue-row__tags">
                {book.containedIn.map((c) => (
                  <li
                    key={c.slug}
                    className="catalogue-tag catalogue-tag--collection"
                  >
                    <Link href={`/buch/${c.slug}`}>{c.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <footer className="catalogue-row__footer">
            {book.seriesName && (
              <span className="catalogue-row__series">
                {book.seriesName}
                {book.seriesIndex ? ` #${book.seriesIndex}` : ""}
              </span>
            )}
            <Link href={detailHref} className="catalogue-row__link">
              {auditMode ? "Open audit →" : "Open detail page →"}
            </Link>
          </footer>
        </div>
      </div>
    </details>
  );
}

function AuditChips({ audit }: { audit: CatalogueAudit }) {
  const chips: string[] = [];
  if (audit.hasDrift) chips.push(`DRIFT ${audit.driftCount}`);
  if (audit.hasJunctionGap) chips.push("GAP");
  if (audit.isSsot) chips.push("SSOT");
  if (audit.isInMultipleCollections) chips.push(`×${audit.containedInCount}`);
  const hasAlias = audit.knownAliasCount > 0;
  if (chips.length === 0 && !hasAlias) {
    return <span className="catalogue-chip catalogue-chip--mute">—</span>;
  }
  return (
    <>
      {chips.map((c) => (
        <span key={c} className="catalogue-chip catalogue-chip--audit">
          {c}
        </span>
      ))}
      {hasAlias && (
        <span
          className="catalogue-chip catalogue-chip--alias"
          title="Known edition-rename aliases — expected, not drift"
        >
          ALIAS {audit.knownAliasCount}
        </span>
      )}
    </>
  );
}
