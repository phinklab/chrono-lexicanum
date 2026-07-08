import type { Metadata } from "next";
import Link from "next/link";
import { FORMAT_LABELS } from "@/lib/book-labels";
import { primaryRowFaction } from "@/lib/faction-icon";
import SiteBackground from "@/components/chrome/SiteBackground";
import AuspexPair from "@/components/chrono/AuspexPair";
import FloatingCoord from "@/components/chrono/FloatingCoord";
import GhostReadout from "@/components/chrono/GhostReadout";
import ScrollScrim from "@/components/chrome/ScrollScrim";
import RouteScrollCue from "@/components/chrome/RouteScrollCue";
import CompendiumFocusOpener from "@/components/compendium/CompendiumFocusOpener";
import ArchiveModeToggle from "@/components/archive/ArchiveModeToggle";
import ArchiveFooter from "@/components/chrome/ArchiveFooter";
import WerkeFilters from "./WerkeFilters";
import { bookSlugById, type BrowseBook } from "./loader";
import { loadUnifiedSearchIndex } from "@/lib/search-index";
import {
  applyWorksFilters,
  FORMAT_ORDER,
  isFiltered,
  parseWorksParams,
} from "./filters";

export const metadata: Metadata = {
  title: "Archive — Chrono Lexicanum",
  description:
    "Search the Chrono Lexicanum archive — books, podcasts, factions, characters and worlds.",
};

interface WerkePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const VOX_LINES = [
  "Signatvr 0447 · verified",
  "Cross-ref · Magnus the Red",
  "Rvbrica · The Horus Heresy",
  "Access granted · Lectorivm III",
  "Imprimatvr · Ordo Chronos",
];

function formatLabel(format: string | null): string | null {
  return format ? FORMAT_LABELS[format] ?? format : null;
}

export default async function WerkePage({ searchParams }: WerkePageProps) {
  const sp = await searchParams;
  const params = parseWorksParams(sp);
  const { books, podcastData, searchIndex } = await loadUnifiedSearchIndex();

  const filtered = applyWorksFilters(books, params);
  const filtering = isFiltered(params);

  // Deep-link: `?focus=<workId>` opens that book's popup over the catalogue
  // (compendium `?focus=` pattern; the timeline chips link here). The
  // id resolves via its own lookup — NOT via the browse list — so a future
  // filter/limit on the catalogue query can't turn the link into a no-op.
  const focusRaw = sp.focus;
  const focusId = Array.isArray(focusRaw) ? focusRaw[0] : focusRaw;
  const focusSlug = focusId ? await bookSlugById(focusId) : null;

  // Filter options reflect what the data actually carries. Era lives inside
  // the record popup, not as a top-level filter/column.
  const factionMap = new Map<string, string>();
  for (const b of books) for (const f of b.factions) factionMap.set(f.id, f.name);
  const factionOptions = [...factionMap.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "en"));

  const presentFormats = new Set(books.map((b) => b.format).filter(Boolean));
  const formatOptions = FORMAT_ORDER.filter((f) => presentFormats.has(f)).map(
    (f) => ({ value: f, label: FORMAT_LABELS[f] ?? f }),
  );

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
      <SiteBackground variant="main" position="right bottom" />
      {focusSlug ? <CompendiumFocusOpener href={`/buch/${focusSlug}`} /> : null}
      <GhostReadout lines={VOX_LINES} />

      <section className="catalogue-hero route-act" aria-label="Archive — the media archive">
        <ScrollScrim
          className="site-scrim"
          varName="--scrim-o"
          heroSelector=".catalogue-hero"
          maxOpacity={0.94}
        />
        <AuspexPair />
        <FloatingCoord x="10%" y="32%" label="Index mounted · VII eras" delay={9} />

        <p className="catalogue-hero__over">The Index</p>
        <h1 className="catalogue-hero__heading">The Archive</h1>
        <p className="catalogue-hero__edition">
          Every book and every voice of the archive, in one register.
        </p>
        <RouteScrollCue
          className="route-cue--flow"
          label="Choose your archive"
          target=".catalogue-body"
        />
      </section>

      <div className="catalogue-body route-body-snap">
        {/* The archive choice — the first and largest element of the nave. */}
        <ArchiveModeToggle
          active="books"
          booksLine={`${books.length} novels, novellas & audio dramas`}
          podcastsLine={`${podcastData.episodes.length} episodes · ${podcastData.shows.length} shows`}
        />

        {books.length > 0 && (
          <WerkeFilters
            factions={factionOptions}
            formats={formatOptions}
            activeFacet={activeFacet}
            index={searchIndex}
          />
        )}

        <p className="catalogue-census">
          <b>{filtered.length} · shown</b> / {books.length} works
          {params.q && <> — for “{params.q}”</>}
        </p>

        {books.length === 0 ? (
          <div className="catalogue-empty">
            The stacks stand empty — no records have reached the archive yet.
          </div>
        ) : filtered.length === 0 ? (
          <div className="catalogue-empty">
            No records answer {filtering ? "these filters" : "this view"}. Widen
            the seek, or clear the filters.
          </div>
        ) : (
          <ol className="catalogue-list reveal">
            {filtered.map((b, i) => (
              <li key={b.id}>
                <WorkRow book={b} index={i} />
              </li>
            ))}
          </ol>
        )}

        <ArchiveFooter mid="Click any title to open its record" />
      </div>
    </main>
  );
}

/** One register row — the whole row is a link; a soft-nav to /buch/[slug] is
 *  intercepted by the root @modal slot, so the record opens as a popup over
 *  the still-mounted register. */
function WorkRow({ book, index }: { book: BrowseBook; index: number }) {
  const fmt = formatLabel(book.format);
  const rowFaction = primaryRowFaction(book.factions);

  return (
    <Link href={`/buch/${book.slug}`} className="catalogue-row">
      <span className="catalogue-row__index">{String(index + 1).padStart(3, "0")}</span>
      <span className="catalogue-row__main">
        <span className="catalogue-row__title">{book.title}</span>
        {book.authors.length > 0 && (
          <span className="catalogue-row__byline">by {book.authors.join(", ")}</span>
        )}
      </span>
      <span className="catalogue-row__faction">{rowFaction?.name ?? "—"}</span>
      <span className="catalogue-row__year">
        {book.releaseYear != null ? book.releaseYear : "—"}
      </span>
      <span className="catalogue-row__format">{fmt ?? "—"}</span>
      <span className="catalogue-row__chevron" aria-hidden>
        ▾
      </span>
    </Link>
  );
}
