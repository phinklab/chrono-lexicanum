/**
 * Curated "hot subset" of entity ids that are prerendered at build time.
 * The four entity routes (/character, /world, /faction,
 * /person) deliberately do NOT prerender every id (~1300 pages): that fans
 * ~1300 full `loadEntity` reads from the US build into the eu-central DB on
 * every deploy — 20-minute builds and a build-egress bill that alone reached
 * the Supabase free-tier 5 GB cap. Each route prerenders only this marquee
 * subset and serves the long tail on demand via ISR (`dynamicParams = true`);
 * a page carries itself into the Data Cache on its first real visit.
 *
 * PURE — no `@/db` import, no JSX. It is a hand-maintained list of ids (the
 * leanest possible build path: param generation costs *zero* DB reads). The
 * server-only `listHotEntityIds` (`./loader`) cross-checks these against the live
 * table with one ID-only `where id in (...)` query, so an id that was later
 * renamed/merged away silently drops to on-demand rendering instead of
 * build-prerendering a 404 — the constant supplies editorial intent (what is
 * *eligible* to be hot), the query supplies truth (what currently *exists*).
 *
 * Selection rationale: the pages a Reddit-launch visitor clicks first — the
 * primarchs, the famous Legions/Chapters and their Chaos counterparts, the major
 * Imperial/xenos institutions, the bedrock worlds (Terra/Mars/Luna + Legion
 * homeworlds + marquee battle-sites), and the best-known Black Library authors.
 * Every id below is a real reference id verified against `scripts/seed-data/*`.
 * To add a hot page, drop its id in the right list — no DB change, no migration.
 */
import { CURATED_PRIMARCH_IDS } from "@/lib/compendium/primarchs";
import type { EntityType } from "./types";

/**
 * Marquee characters beyond the primarchs. The primarch roster is reused from
 * `CURATED_PRIMARCH_IDS` (single source of truth — see `./loader`'s twin-merge),
 * so every primarch is hot automatically and `alpharius` (not the absorbed
 * `omegon`) owns the route. These are the protagonists of the best-selling
 * series — Eisenhorn, Gaunt's Ghosts, Ciaphas Cain — plus a few iconic leads.
 */
const MARQUEE_CHARACTER_IDS = [
  "the_emperor",
  "gregor_eisenhorn", // Eisenhorn
  "ibram_gaunt", // Gaunt's Ghosts
  "ciaphas_cain", // Ciaphas Cain
  "ahzek_ahriman", // Thousand Sons
  "garviel_loken", // Horus Rising
  "ragnar_blackmane", // Space Wolf
  "uriel_ventris", // Ultramarines
  "sigismund", // Imperial Fists
  "belisarius_cawl",
  "typhus", // Death Guard
  "cypher", // Fallen
] as const;

const HOT_CHARACTER_IDS = [
  ...CURATED_PRIMARCH_IDS,
  ...MARQUEE_CHARACTER_IDS,
] as const;

/**
 * The famous Legions/Chapters and their traitor counterparts, the major Imperial
 * institutions, the four Chaos gods, the headline xenos, and the Tanith First
 * (Gaunt's Ghosts). Not an exhaustive faction tree — the long tail renders on
 * demand.
 */
const HOT_FACTION_IDS = [
  // Imperial Astartes
  "imperium",
  "ultramarines",
  "space_wolves",
  "dark_angels",
  "blood_angels",
  "imperial_fists",
  "salamanders",
  "raven_guard",
  "iron_hands",
  "white_scars",
  "grey_knights",
  "black_templars",
  "deathwatch",
  // Traitor Legions
  "sons_of_horus",
  "black_legion",
  "thousand_sons",
  "death_guard",
  "world_eaters",
  "emperors_children",
  "word_bearers",
  "night_lords",
  "iron_warriors",
  "alpha_legion",
  // Major institutions
  "inquisition",
  "mechanicus",
  "astra_militarum",
  "custodes",
  "sisters_of_battle",
  "tanith_first",
  // Chaos + xenos
  "chaos",
  "khorne",
  "tzeentch",
  "nurgle",
  "slaanesh",
  "eldar",
  "necrons",
  "orks",
  "tau",
  "tyranids",
] as const;

/**
 * Bedrock worlds: Terra/Mars/Luna, the homeworlds of the most-read Legions, and
 * the Horus Heresy battle-sites a launch visitor searches for first.
 */
const HOT_LOCATION_IDS = [
  "terra",
  "mars",
  "luna",
  "macragge",
  "fenris",
  "caliban",
  "prospero",
  "baal",
  "nocturne",
  "cadia",
  "armageddon",
  "calth",
  "istvaan_v",
] as const;

/**
 * The best-known Black Library authors — the names a reader recognises and
 * clicks through to browse a bibliography.
 */
const HOT_PERSON_IDS = [
  "dan_abnett",
  "aaron_dembski_bowden",
  "graham_mcneill",
  "guy_haley",
  "chris_wraight",
  "gav_thorpe",
  "james_swallow",
  "john_french",
  "nick_kyme",
  "ben_counter",
  "sandy_mitchell",
  "william_king",
  "david_annandale",
  "mike_brooks",
] as const;

/**
 * Entity type → curated hot ids. Consumed only by `listHotEntityIds` in the
 * server-only loader, which intersects each list with the live table before
 * `generateStaticParams` prerenders it.
 */
export const HOT_ENTITY_IDS: Record<EntityType, readonly string[]> = {
  character: HOT_CHARACTER_IDS,
  faction: HOT_FACTION_IDS,
  location: HOT_LOCATION_IDS,
  person: HOT_PERSON_IDS,
};
