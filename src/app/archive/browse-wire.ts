/**
 * Pure normalized wire shape for the persistent browse cache. Dictionaries
 * keep the growing payload safely below Next's 2 MB entry limit (~0.5 MB vs
 * 2.05 MB measured flat), while `inflateBrowse` restores the exact consumer
 * shape. Unknown dictionary ids throw instead of rendering corrupt data.
 */
import type {
  BrowseBook,
  BrowseData,
  BrowseFacet,
  BrowseFaction,
  EraOption,
} from "./loader";

/** `BrowseFaction` minus the per-book `role` — one entry per distinct faction. */
interface WireFaction {
  id: string;
  name: string;
  alignment: string | null;
  parentId: string | null;
}

interface WireBook {
  id: string;
  slug: string;
  title: string;
  releaseYear: number | null;
  format: string | null;
  eraName: string | null;
  seriesName: string | null;
  authors: string[];
  /** `[factionId, role]` pairs — role is the only per-book faction datum. */
  factions: Array<[string, string | null]>;
  /** Facet-value ids, resolved through `facetCatalog` on inflate. */
  facets: string[];
}

export interface BrowseWire {
  books: WireBook[];
  eras: EraOption[];
  factionCatalog: WireFaction[];
  facetCatalog: BrowseFacet[];
}

export function compactBrowse(data: BrowseData): BrowseWire {
  const factionCatalog = new Map<string, WireFaction>();
  const facetCatalog = new Map<string, BrowseFacet>();

  const books: WireBook[] = data.books.map((b) => {
    for (const f of b.factions) {
      if (!factionCatalog.has(f.id)) {
        factionCatalog.set(f.id, {
          id: f.id,
          name: f.name,
          alignment: f.alignment,
          parentId: f.parentId,
        });
      }
    }
    for (const f of b.facets) {
      if (!facetCatalog.has(f.id)) facetCatalog.set(f.id, f);
    }
    return {
      id: b.id,
      slug: b.slug,
      title: b.title,
      releaseYear: b.releaseYear,
      format: b.format,
      eraName: b.eraName,
      seriesName: b.seriesName,
      authors: b.authors,
      factions: b.factions.map((f) => [f.id, f.role]),
      facets: b.facets.map((f) => f.id),
    };
  });

  return {
    books,
    eras: data.eras,
    factionCatalog: [...factionCatalog.values()],
    facetCatalog: [...facetCatalog.values()],
  };
}

export function inflateBrowse(wire: BrowseWire): BrowseData {
  const factionsById = new Map(wire.factionCatalog.map((f) => [f.id, f]));
  const facetsById = new Map(wire.facetCatalog.map((f) => [f.id, f]));

  const books: BrowseBook[] = wire.books.map((b) => ({
    id: b.id,
    slug: b.slug,
    title: b.title,
    releaseYear: b.releaseYear,
    format: b.format,
    eraName: b.eraName,
    seriesName: b.seriesName,
    authors: b.authors,
    factions: b.factions.map(([id, role]): BrowseFaction => {
      const f = factionsById.get(id);
      if (!f) throw new Error(`[browse-wire] unknown faction id in cache entry: ${id}`);
      return { id: f.id, name: f.name, role, alignment: f.alignment, parentId: f.parentId };
    }),
    facets: b.facets.map((id): BrowseFacet => {
      const f = facetsById.get(id);
      if (!f) throw new Error(`[browse-wire] unknown facet id in cache entry: ${id}`);
      return f;
    }),
  }));

  return { books, eras: wire.eras };
}
