/**
 * Unified archive search suggestions — SERVER-ONLY.
 *
 * One fan-out feeding the shared typeahead on Home, /archive and
 * /archive/podcasts: books (+ authors/facets/formats) merged with podcasts
 * (episodes + shows) and the compendium entity suggestions, built server-side
 * from the same loaders the lists render from so it never goes stale.
 *
 * Since Launch S6 the index is NOT part of any page's initial flight (it
 * measured ~3,400 entries ≈ 470 KB serialized into the HTML/RSC of all three
 * routes). Its only consumer is `GET /api/search-index`; the client console
 * (`BrowseSearch`) fetches it lazily on first focus/input and ranks it per
 * keystroke — books first, then podcasts.
 *
 * All four source loaders are DB-free façades (Launch S1b): at build time
 * (the route handler is prerendered) they read the committed snapshot, at
 * request time (ISR refresh) they lazy-import their live Postgres modules —
 * so this composition runs unchanged in both worlds.
 */
import "server-only";
import { buildSearchIndex, type Suggestion } from "@/app/archive/filters";
import { loadBrowseBooks } from "@/app/archive/loader";
import {
  buildPodcastSuggestions,
  loadPodcastSearchIndex,
} from "@/app/archive/podcasts/loader";
import {
  loadCompendiumSearchSuggestions,
  loadPrimarchSuggestions,
} from "@/lib/compendium/loader";

export async function loadSearchSuggestions(): Promise<Suggestion[]> {
  const [{ books }, podcastData, compendiumSuggestions, primarchSuggestions] =
    await Promise.all([
      loadBrowseBooks(),
      loadPodcastSearchIndex(),
      loadCompendiumSearchSuggestions(),
      loadPrimarchSuggestions(),
    ]);

  return [
    ...buildSearchIndex(books),
    ...buildPodcastSuggestions(podcastData),
    ...compendiumSuggestions,
    ...primarchSuggestions,
  ];
}
