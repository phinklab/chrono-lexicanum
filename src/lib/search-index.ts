/**
 * Unified archive search index — SERVER-ONLY (the loaders import `@/db`).
 *
 * One fan-out feeding the shared typeahead on Home, /archive and
 * /archive/podcasts: books (+ authors/factions/facets/formats) merged with
 * podcasts (episodes + shows) and the compendium entity suggestions, built
 * server-side from the same data the lists render so it never goes stale.
 * The client console ranks it per keystroke — books first, then podcasts.
 */
import "server-only";
import { buildSearchIndex, type Suggestion } from "@/app/archive/filters";
import { loadBrowseBooks, type BrowseBook } from "@/app/archive/loader";
import {
  buildPodcastSuggestions,
  loadPodcastSearchIndex,
  type PodcastSearchData,
} from "@/app/archive/podcasts/loader";
import {
  loadCompendiumSearchSuggestions,
  loadPrimarchSuggestions,
} from "@/lib/compendium/loader";

export interface UnifiedSearchIndex {
  books: BrowseBook[];
  podcastData: PodcastSearchData;
  searchIndex: Suggestion[];
}

export async function loadUnifiedSearchIndex(): Promise<UnifiedSearchIndex> {
  const [{ books }, podcastData, compendiumSuggestions, primarchSuggestions] =
    await Promise.all([
      loadBrowseBooks(),
      loadPodcastSearchIndex(),
      loadCompendiumSearchSuggestions(),
      loadPrimarchSuggestions(),
    ]);

  return {
    books,
    podcastData,
    searchIndex: [
      ...buildSearchIndex(books),
      ...buildPodcastSuggestions(podcastData),
      ...compendiumSuggestions,
      ...primarchSuggestions,
    ],
  };
}
