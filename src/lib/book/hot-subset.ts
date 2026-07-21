/**
 * Curated "hot subset" of book slugs that are prerendered at build time
 * (Launch S4b — the book twin of `src/lib/entity/hot-subset.ts`).
 *
 * /book/[slug] (~900 books) deliberately does NOT prerender every slug: that
 * would fan ~900 full `loadBook` reads into the export run and bloat the
 * committed snapshot with ~900 payload files nobody visits. The route
 * prerenders only this marquee subset from the snapshot and serves the long
 * tail on demand via ISR (`dynamicParams = true`); a page carries itself into
 * the Data Cache on its first real visit.
 *
 * PURE — no `@/db` import, no JSX, no `fs`. The server-only
 * `listHotBookSlugs` (`./loadBook`) cross-checks these against the live works
 * table (kind = 'book') with one slug-only query, so a slug that was later
 * renamed away silently drops to on-demand rendering instead of
 * build-prerendering a 404 — the list supplies editorial intent (what is
 * *eligible* to be hot), the query supplies truth (what currently *exists*).
 *
 * Selection rationale: the book pages a launch visitor opens first.
 *  - Every resolved pick of the "One faction, one book" curation
 *    (`FACTION_STARTER_NODES` — the committed, validated SSOT behind
 *    /compendium/one-faction-one-book). These are literally the books the site itself recommends
 *    as entry points; deriving instead of copying keeps ONE editorial source.
 *  - A small marquee extension for the famous entry novels the 40k-focused
 *    starter curation does not carry: the Horus Heresy opening trilogy and the
 *    best-selling series openers (Eisenhorn, Gaunt's Ghosts, Ciaphas Cain,
 *    Space Wolf, Ultramarines).
 * Every slug below is verified against the works catalog (2026-07-12). To add
 * a hot page, drop its slug in the marquee list — no DB change, no migration.
 */
import {
  FACTION_STARTER_NODES,
  type FactionStarterNode,
} from "@/lib/ask/faction-starters";

/** Famous entry points missing from the 40k starter curation (see header). */
const MARQUEE_BOOK_SLUGS = [
  "horus-rising", // Horus Heresy 1 — THE canonical entry novel
  "false-gods", // Horus Heresy 2
  "galaxy-in-flames", // Horus Heresy 3
  "xenos", // Eisenhorn 1 (starters carry the omnibus; the single novel is the common landing)
  "first-and-only", // Gaunt's Ghosts 1
  "for-the-emperor", // Ciaphas Cain 1
  "space-wolf", // Space Wolf 1
  "nightbringer", // Ultramarines 1
] as const;

function collectStarterBookSlugs(nodes: readonly FactionStarterNode[]): string[] {
  const out: string[] = [];
  for (const node of nodes) {
    for (const pick of node.picks ?? []) {
      if (pick.book) out.push(pick.book);
    }
    if (node.children) out.push(...collectStarterBookSlugs(node.children));
  }
  return out;
}

/**
 * Deduplicated, ascending-sorted union of starter picks + marquee slugs.
 * Consumed by `listHotBookSlugs` (`./loadBook`) and the snapshot exporter
 * (`scripts/build-snapshot.ts`), both of which intersect it with the live
 * works table before anything is prerendered or exported.
 */
export const HOT_BOOK_SLUGS: readonly string[] = [
  ...new Set([...collectStarterBookSlugs(FACTION_STARTER_NODES), ...MARQUEE_BOOK_SLUGS]),
].sort();
