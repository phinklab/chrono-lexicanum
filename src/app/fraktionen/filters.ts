/**
 * Faction-guide content gate. PURE — no `@/db`, no JSX. The old /fraktionen
 * route is a next.config 308 to /compendium/factions since Launch S4; this
 * module survives because the Compendium faction category filters on it (and
 * the snapshot exporter's contract tests import from this path — see the
 * sibling loader's header).
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
