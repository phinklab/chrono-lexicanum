/**
 * Faction-guide content gate. PURE — no `@/db`, no JSX. The /fraktionen route
 * itself is a permanent redirect to /compendium/fraktionen; this survives
 * because the Compendium faction category filters on it.
 */
import type { FactionGuide } from "./loader";

/** A faction earns a place in the guide only if something sits behind it. */
export function hasContent(f: FactionGuide): boolean {
  return (
    f.bookCount > 0 ||
    f.episodeCount > 0 ||
    f.characterCount > 0 ||
    f.subfactionCount > 0
  );
}
