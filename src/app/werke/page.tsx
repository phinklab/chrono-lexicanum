import type { Metadata } from "next";
import Link from "next/link";
import { FORMAT_LABELS } from "@/lib/book-labels";
import { factionDot } from "@/lib/faction-colors";
import AuspexSweep from "@/components/chrono/AuspexSweep";
import FloatingCoord from "@/components/chrono/FloatingCoord";
import GhostReadout from "@/components/chrono/GhostReadout";
import CatalogueTelemetry from "@/components/chrono/CatalogueTelemetry";
import ScrollScrim from "@/app/buecher/ScrollScrim";
import WerkeFilters from "./WerkeFilters";
import { loadBrowseBooks, type BrowseBook } from "./loader";
import {
  loadPodcastSearchIndex,
  buildPodcastSuggestions,
} from "@/app/podcasts/loader";
import {
  applyWorksFilters,
  buildSearchIndex,
  FORMAT_ORDER,
  isFiltered,
  parseWorksParams,
  type WorksParams,
} from "./filters";

export const metadata: Metadata = {
  title: "Works — Chrono Lexicanum",
  description:
    "Browse the full Warhammer 40,000 novel archive — by era, faction, format and mood.",
};

interface WerkePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const READOUT_LINES = [
  "· CATALOGVS · LIBRORVM",
  "· INDEX MOUNTED · 7 ERAS",
  "· FILTER · FACTIO / FORMA",
  "· LECTIO PROFVNDA · READY",
  "· SORT · TITVLVS / ANNVS / CHRONO",
  "· COGNITIO LINK STABLE",
];

function formatMBand(startY: number | null, endY: number | null): string | null {
  if (startY == null && endY == null) return null;
  const fmt = (v: number) => `M${v.toFixed(3)}`;
  if (startY != null && endY != null && Math.abs(startY - endY) < 0.001) {
    return fmt(startY);
  }
  if (startY != null && endY != null) return `${fmt(startY)} – ${fmt(endY)}`;
  return fmt((startY ?? endY) as number);
}

function formatLabel(format: string | null): string | null {
  return format ? FORMAT_LABELS[format] ?? format : null;
}

/** Build a `/werke` href that keeps the current filters and overrides one key. */
function hrefWith(base: WorksParams, key: string, value: string): string {
  const sp = new URLSearchParams();
  if (base.q) sp.set("q", base.q);
  if (base.faction) sp.set("faction", base.faction);
  if (base.format) sp.set("format", base.format);
  if (base.facet) sp.set("facet", base.facet);
  if (base.sort !== "title") sp.set("sort", base.sort);
  sp.set(key, value);
  return `/werke?${sp.toString()}`;
}

export default async function WerkePage({ searchParams }: WerkePageProps) {
  const sp = await searchParams;
  const params = parseWorksParams(sp);
  const [{ books }, podcastData] = await Promise.all([
    loadBrowseBooks(),
    loadPodcastSearchIndex(),
  ]);

  const filtered = applyWorksFilters(books, params);
  const filtering = isFiltered(params);

  // Filter options reflect what the data actually carries (Brief: "soweit
  // vorhandene Daten es tragen"). Era was dropped in the polish pass — it lives
  // on as detail inside each expanded row, not as a top-level filter/column.
  const factionMap = new Map<string, string>();
  for (const b of books) for (const f of b.factions) factionMap.set(f.id, f.name);
  const factionOptions = [...factionMap.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "en"));

  const presentFormats = new Set(books.map((b) => b.format).filter(Boolean));
  const formatOptions = FORMAT_ORDER.filter((f) => presentFormats.has(f)).map(
    (f) => ({ value: f, label: FORMAT_LABELS[f] ?? f }),
  );

  // The typeahead index — books (+ authors/factions/facets/formats) merged with
  // podcasts (episodes + shows), built server-side from the same data the lists
  // render so it never goes stale. Shared with Home/podcasts; the client console
  // ranks it per keystroke (rankSuggestions), books first then podcasts.
  const searchIndex = [
    ...buildSearchIndex(books),
    ...buildPodcastSuggestions(podcastData),
  ];

  // Resolve the active facet (if any) to a display chip.
  let activeFacet: { id: string; name: string; category: string | null } | null =
    null;
  if (params.facet) {
    for (const b of books) {
      const hit = b.facets.find((f) => f.id === params.facet);
      if (hit) {
        activeFacet = { id: hit.id, name: hit.name, category: hit.categoryName };
        break;
      }
    }
    if (!activeFacet) activeFacet = { id: params.facet, name: params.facet, category: null };
  }

  return (
    <main className="catalogue catalogue--werke">
      <section className="catalogue-hero" aria-label="Works — the novel archive">
        <div className="catalogue-hero__photo" aria-hidden />
        <div className="catalogue-hero__fade" aria-hidden />
        <ScrollScrim />
        <div className="catalogue-hero__sweep" aria-hidden>
          <AuspexSweep r={180} sweepDuration={18} accent="var(--cl-gold)" />
        </div>
        <div className="werke-hero__readout" aria-hidden>
          <GhostReadout
            color="var(--cl-gold)"
            opacity={0.34}
            lineMs={5200}
            typeSpeed={80}
            max={4}
            lines={READOUT_LINES}
          />
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
          <div className="catalogue-hero__eyebrow">{"// CATALOGVS · LIBRORVM"}</div>
          <h1 className="catalogue-hero__heading">WORKS</h1>
          <p className="catalogue-hero__sub">
            {books.length === 0
              ? "No books in the database yet."
              : `${books.length} Warhammer 40,000 novels — by era, faction, format and mood.`}
          </p>
        </div>
      </section>

      <div className="catalogue-body">
        <div className="catalogue-toolbar">
          <div className="catalogue-toolbar__left">
            <span className="catalogue-toolbar__count">{filtered.length} · SHOWN</span>
            <span className="catalogue-toolbar__total">/ {books.length} works</span>
            {params.q && (
              <span className="catalogue-toolbar__query">
                for <span className="catalogue-toolbar__query-term">“{params.q}”</span>
              </span>
            )}
            <span className="catalogue-toolbar__dot" aria-hidden>·</span>
            <CatalogueTelemetry accent="gold" />
          </div>
        </div>

        {books.length > 0 && (
          <WerkeFilters
            factions={factionOptions}
            formats={formatOptions}
            activeFacet={activeFacet}
            index={searchIndex}
          />
        )}

        {books.length === 0 ? (
          <div className="catalogue-empty c-glass c-corners">
            The database is empty. Once books are ingested they will appear here.
          </div>
        ) : filtered.length === 0 ? (
          <div className="catalogue-empty c-glass c-corners">
            No works match {filtering ? "these filters" : "this view"}. Try widening
            the search.
          </div>
        ) : (
          <ol className="catalogue-list">
            {filtered.map((b, i) => (
              <li key={b.id}>
                <WorkRow book={b} index={i} params={params} />
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

function WorkRow({
  book,
  index,
  params,
}: {
  book: BrowseBook;
  index: number;
  params: WorksParams;
}) {
  const mBand = formatMBand(book.startY, book.endY);
  const fmt = formatLabel(book.format);
  const isAudio = book.format === "audio_drama";
  const isEnriched =
    typeof book.synopsis === "string" && book.synopsis.trim().length > 0;
  const metaParts = [
    fmt,
    book.pageCount != null ? `${book.pageCount} pp.` : null,
    book.eraName,
    mBand,
    book.releaseYear != null ? String(book.releaseYear) : null,
  ].filter((v): v is string => Boolean(v));

  const primaryFaction = book.factions[0]?.name ?? null;
  const dotColor = factionDot(primaryFaction);

  return (
    <details className={`catalogue-row${isEnriched ? " is-enriched" : " is-stub"}`}>
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
          {book.authors.length > 0 && (
            <span className="catalogue-row__byline">by {book.authors.join(", ")}</span>
          )}
        </div>
        <span className="catalogue-row__faction" title={primaryFaction ?? undefined}>{primaryFaction ?? "—"}</span>
        <span className="catalogue-row__year">
          {book.releaseYear != null ? book.releaseYear : "—"}
        </span>
        <div className="catalogue-row__chips">
          {fmt && (
            <span className="catalogue-chip catalogue-chip--enriched">
              {isAudio ? "AUDIO" : fmt}
            </span>
          )}
        </div>
        <span className="catalogue-row__chevron" aria-hidden>›</span>
      </summary>

      <div className="catalogue-row__detail">
        <div className="catalogue-row__cover">
          {book.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={book.coverUrl} alt="" loading="lazy" width={140} height={210} />
          ) : (
            <div className="catalogue-row__cover-placeholder" aria-hidden>
              ?
            </div>
          )}
        </div>

        <div className="catalogue-row__body">
          {metaParts.length > 0 && (
            <p className="catalogue-row__meta">{metaParts.join(" · ")}</p>
          )}

          {book.synopsis && <p className="catalogue-row__synopsis">{book.synopsis}</p>}

          {book.factions.length > 0 && (
            <div className="catalogue-row__tagrow">
              <span className="catalogue-row__tagrow-label">Factions</span>
              <ul className="catalogue-row__tags">
                {book.factions.map((f) => (
                  <li key={f.id} className="catalogue-tag catalogue-tag--faction">
                    <Link href={hrefWith(params, "faction", f.id)}>{f.name}</Link>
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
                    <Link href={hrefWith(params, "facet", f.id)}>
                      {f.categoryName ? (
                        <>
                          <span className="catalogue-tag__key">{f.categoryName}:</span>{" "}
                          {f.name}
                        </>
                      ) : (
                        f.name
                      )}
                    </Link>
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
            <Link href={`/buch/${book.slug}`} className="catalogue-row__link">
              Open book →
            </Link>
          </footer>
        </div>
      </div>
    </details>
  );
}
