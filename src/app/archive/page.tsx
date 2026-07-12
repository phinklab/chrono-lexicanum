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
import ArchiveArrival from "@/components/archive/ArchiveArrival";
import ArchiveModeToggle from "@/components/archive/ArchiveModeToggle";
import ArchiveFooter from "@/components/chrome/ArchiveFooter";
import WerkeFilters from "./WerkeFilters";
import { routeOg } from "@/lib/seo";
import { bookSlugById, loadBrowseBooks, type BrowseBook } from "./loader";
import { loadPodcastSearchIndex } from "./podcasts/loader";
import {
  applyWorksFilters,
  FORMAT_ORDER,
  isFiltered,
  pagerItems,
  paginateWorks,
  parseWorksParams,
  type WorksParams,
} from "./filters";

const ARCHIVE_DESCRIPTION =
  "Search the Chrono Lexicanum archive — books, podcasts, factions, characters and worlds.";

// Canonical is the bare /archive for EVERY filter arrival (q, faction,
// format, facet, sort, focus, page): the filters are views of one document,
// not documents of their own (URL matrix A.3).
export const metadata: Metadata = {
  title: "Archive",
  description: ARCHIVE_DESCRIPTION,
  alternates: { canonical: "/archive" },
  openGraph: routeOg({ title: "Archive", description: ARCHIVE_DESCRIPTION }),
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
  const [{ books }, podcastData] = await Promise.all([
    loadBrowseBooks(),
    loadPodcastSearchIndex(),
  ]);

  // Filters, counts and facet options always derive from the FULL catalogue;
  // only the rendered rows are cut to one register page (S6 payload budget —
  // the unpaginated register measured 1.94 MB HTML).
  const filtered = applyWorksFilters(books, params);
  const filtering = isFiltered(params);
  const { items, page, totalPages, offset } = paginateWorks(filtered, params.page);

  // Deep-link: `?focus=<workId>` opens that book's popup over the catalogue
  // (compendium `?focus=` pattern; the timeline chips link here). The
  // id resolves via its own lookup — NOT via the browse list — so neither the
  // filters nor the pagination can turn the link into a no-op.
  const focusRaw = sp.focus;
  const focusId = Array.isArray(focusRaw) ? focusRaw[0] : focusRaw;
  const focusSlug = focusId ? await bookSlugById(focusId) : null;

  // E3: a visitor who arrives already searching (filter/query link, focus
  // deep-link, deep page bookmark) lands at the results; organic visits keep
  // the ceremonial hero.
  const arrival = filtering || Boolean(focusId) || page > 1;

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
    <main id="main" tabIndex={-1} className="catalogue catalogue--werke">
      <SiteBackground variant="main" position="right bottom" />
      {focusSlug ? <CompendiumFocusOpener href={`/book/${focusSlug}`} /> : null}
      <ArchiveArrival arrival={arrival} />
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

        {/* The E3 arrival anchor + pager target: console, census, register. */}
        <div id="archive-results">
          {books.length > 0 && (
            <WerkeFilters
              factions={factionOptions}
              formats={formatOptions}
              activeFacet={activeFacet}
            />
          )}

          <p className="catalogue-census">
            <b>{filtered.length} · found</b> / {books.length} works
            {params.q && <> — for “{params.q}”</>}
            {totalPages > 1 && (
              <>
                {" "}
                · page {page} of {totalPages}
              </>
            )}
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
              {items.map((b, i) => (
                <li key={b.id}>
                  <WorkRow book={b} index={offset + i} />
                </li>
              ))}
            </ol>
          )}

          {totalPages > 1 && (
            <CataloguePager params={params} page={page} totalPages={totalPages} />
          )}
        </div>

        <ArchiveFooter mid="Click any title to open its record" />
      </div>
    </main>
  );
}

/** One register row — the whole row is a link; a soft-nav to /book/[slug] is
 *  intercepted by the root @modal slot, so the record opens as a popup over
 *  the still-mounted register. `prefetch={false}`: the register renders up to
 *  100 of these per page, and viewport-prefetching every scrolled-past row
 *  fanned out into that many /book payload fetches for targets the visitor
 *  never opens (S6 prefetch budget) — the modal opens on demand, behind the
 *  route-progress beam. */
function WorkRow({ book, index }: { book: BrowseBook; index: number }) {
  const fmt = formatLabel(book.format);
  const rowFaction = primaryRowFaction(book.factions);

  return (
    <Link href={`/book/${book.slug}`} prefetch={false} className="catalogue-row">
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

/** Register pager. Server-rendered links (URL-first: every page is a
 *  shareable, back/forward-stable address); the `#archive-results` hash lands
 *  each step at the top of the new page's rows via the native anchor scroll,
 *  instead of resetting to the ceremonial hero. */
function CataloguePager({
  params,
  page,
  totalPages,
}: {
  params: WorksParams;
  page: number;
  totalPages: number;
}) {
  function pageHref(n: number): string {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.faction) qs.set("faction", params.faction);
    if (params.format) qs.set("format", params.format);
    if (params.facet) qs.set("facet", params.facet);
    if (params.sort !== "title") qs.set("sort", params.sort);
    if (n > 1) qs.set("page", String(n));
    const s = qs.toString();
    return `/archive${s ? `?${s}` : ""}#archive-results`;
  }

  return (
    <nav className="catalogue-pager" aria-label="Register pages">
      {page > 1 ? (
        <Link className="catalogue-pager__step" href={pageHref(page - 1)}>
          ← Prev
        </Link>
      ) : (
        <span className="catalogue-pager__step is-void" aria-hidden>
          ← Prev
        </span>
      )}

      <span className="catalogue-pager__leaves">
        {pagerItems(page, totalPages).map((n, i) =>
          n === null ? (
            <span key={`gap-${i}`} className="catalogue-pager__gap" aria-hidden>
              …
            </span>
          ) : n === page ? (
            <span
              key={n}
              className="catalogue-pager__leaf is-current"
              aria-current="page"
            >
              {n}
            </span>
          ) : (
            <Link key={n} className="catalogue-pager__leaf" href={pageHref(n)}>
              {n}
            </Link>
          ),
        )}
      </span>

      {page < totalPages ? (
        <Link className="catalogue-pager__step" href={pageHref(page + 1)}>
          Next →
        </Link>
      ) : (
        <span className="catalogue-pager__step is-void" aria-hidden>
          Next →
        </span>
      )}
    </nav>
  );
}
