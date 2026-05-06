/**
 * Brief 045 — Variant C Aggregator.
 *
 * Konsolidiert die 6 Subagent-Outputs (Sonnet 4.6 mit freier WebSearch +
 * WebFetch) in `045-sonnet-web.json`. Pro Slug: divergence vs Pipeline-Haiku-A
 * UND vs Sonnet-Pipeline-B, costEstimate (heuristisch), searchedSources.
 *
 * Subagent-Outputs sind hier inline kompiliert (statt aus File geparst), weil
 * die Agent-Tool-Responses in der CC-Konversation aufgenommen wurden — siehe
 * Implementer-Report § 044/045-impl-trace.
 *
 * Lauf:  npx tsx --env-file=.env.local ingest/.compare/_runners/variant-c-results.ts
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  describeDivergence,
  extractVariantAFromDiff,
  type ComparableEnrichment,
} from "./divergence";
import { TARGET_SLUGS } from "./load-slug-data";

const OUTPUT_PATH = "ingest/.compare/045-sonnet-web.json";
const VARIANT_B_PATH = "ingest/.compare/045-sonnet-pipeline.json";
const TOKENS_PER_LIMIT_PERCENT = 50_000;

interface SearchedSource {
  kind: "web_search" | "web_fetch";
  query?: string;
  url?: string;
}

interface VariantCRawResult {
  slug: string;
  synopsis: string;
  facetIds: string[];
  format: string;
  availability: string;
  rating: number | null;
  ratingSource: string | null;
  ratingCount: number | null;
  plausibilityFlags: Array<{ kind: string; reasoning: string }>;
  discoveredLinks: Array<{ serviceHint: string; kind: string; url: string }>;
  searchedSources: SearchedSource[];
  /** Reported by Agent-Tool wrapper. NOT the true Sonnet inference usage —
   *  this counts the subagent's orchestration tokens, real inference is
   *  larger (each web_search adds result content). Documented in report. */
  totalTokens: number;
  toolUses: number;
  durationMs: number;
}

// =============================================================================
// Subagent-Outputs — captured from the CC conversation 2026-05-06.
// Each subagent ran on Sonnet 4.6 with WebSearch + WebFetch + Read tools.
// =============================================================================

const VARIANT_C_RESULTS: VariantCRawResult[] = [
  {
    slug: "shattered-legions",
    synopsis:
      "Following the catastrophic Dropsite Massacre at Isstvan V, the survivors of three devastated Space Marine Legions — Iron Hands, Raven Guard, and Salamanders — band together as the Shattered Legions. Led by the Iron Hands warleader Shadrak Meduson, these warriors wage a brutal guerrilla campaign of vengeance against the traitor forces spreading across the galaxy. This eleven-story anthology collects tales of desperate survival, fractured loyalty, and unconventional warfare, ranging from Meduson's coordination of scattered strike forces to the crew of the Sisypheum conducting espionage against the inscrutable Alpha Legion in Graham McNeill's novella The Seventh Serpent. Eight authors — Abnett, Annandale, French, Haley, Kyme, McNeill, Thorpe, and Wraight — each contribute distinct voices to a portrait of legions broken but not destroyed.",
    facetIds: [
      "book", "ensemble", "male", "space_marine", "imperium", "dual",
      "sector", "galactic", "requires_context", "standard", "war_story",
      "journey", "character_study", "grimdark", "somber", "action_heavy",
      "betrayal", "loyalty", "sacrifice", "brotherhood", "war",
      "cw_violence", "cw_death", "cw_disturbing", "en",
    ],
    format: "anthology",
    availability: "oop_recent",
    rating: 3.7,
    ratingSource: "goodreads",
    ratingCount: 1289,
    plausibilityFlags: [
      {
        kind: "author_mismatch",
        reasoning:
          "Pipeline lists 'Laurie Goulding' as author, but Goulding is the editor only; the eight actual contributing authors are Dan Abnett, David Annandale, John French, Guy Haley, Nick Kyme, Graham McNeill, Gav Thorpe, and Chris Wraight.",
      },
    ],
    discoveredLinks: [
      {
        serviceHint: "black_library",
        kind: "shop",
        url: "https://www.blacklibrary.com/series/the-horus-heresy/hh-shattered-legions-ebook.html",
      },
      {
        serviceHint: "amazon",
        kind: "shop",
        url: "https://www.amazon.com/Shattered-Legions-Horus-Heresy-Abnett-ebook/dp/B06XD2Z39W",
      },
      {
        serviceHint: "other",
        kind: "reference",
        url: "https://www.goodreads.com/book/show/33791624-shattered-legions",
      },
    ],
    searchedSources: [
      { kind: "web_search", query: "Shattered Legions Horus Heresy anthology Black Library Laurie Goulding" },
      { kind: "web_search", query: "Shattered Legions Black Library book authors contributing stories" },
      { kind: "web_fetch", url: "https://www.goodreads.com/book/show/33791624-shattered-legions" },
      { kind: "web_fetch", url: "https://wh40k.lexicanum.com/wiki/Shattered_Legions_(Anthology)" },
      { kind: "web_fetch", url: "https://www.trackofwords.com/2017/05/24/shattered-legions-black-library-anthology/" },
      { kind: "web_fetch", url: "https://www.blacklibrary.com/series/the-horus-heresy/hh-shattered-legions-ebook.html" },
      { kind: "web_fetch", url: "https://www.amazon.com/Shattered-Legions-Anthology-Hardcover-Warhammer/dp/178496574X" },
      { kind: "web_search", query: "Shattered Legions Horus Heresy 43 in print availability 2025 2026" },
    ],
    totalTokens: 23389,
    toolUses: 10,
    durationMs: 80127,
  },
  {
    slug: "sons-of-the-emperor",
    synopsis:
      "Sons of the Emperor collects eight short stories by leading Horus Heresy authors, each centred on one of the Emperor's genetically-engineered demigod sons — the Primarchs. Set across the Great Crusade and the Horus Heresy, the tales explore pivotal moments in the lives of Sanguinius, Konrad Curze, Vulkan, Lorgar, Perturabo, Angron, Magnus the Red, and Horus Lupercal. From Perturabo's tortured awakening and Angron's demonic transformation to Horus navigating a horror of Old Night and a trio of Thousand Sons following prophetic visions into cursed catacombs, the anthology examines both the nobility and the corruption of these superhuman figures. It stands as the first dedicated Primarchs anthology from Black Library.",
    facetIds: [
      "book", "male", "ensemble", "space_marine", "multi", "imperium",
      "chaos", "dual", "planetary", "galactic", "requires_context", "standard",
      "war_story", "character_study", "journey", "grimdark", "somber",
      "philosophical", "action_heavy", "war", "loyalty", "brotherhood",
      "hubris", "betrayal", "sacrifice", "cw_violence", "cw_disturbing",
      "cw_death", "en",
    ],
    format: "anthology",
    availability: "in_print",
    rating: 4.1,
    ratingSource: "goodreads",
    ratingCount: 597,
    plausibilityFlags: [
      {
        kind: "author_mismatch",
        reasoning:
          "Pipeline lists author as 'various'. Actual contributing authors are John French, Aaron Dembski-Bowden, Nick Kyme, Gav Thorpe, Guy Haley, L.J. Goulding, Graham McNeill, and Dan Abnett.",
      },
      {
        kind: "data_conflict",
        reasoning:
          "Conflicting attribution for the story 'The Ancient Awaits' by Graham McNeill (Civilian Reader review says Fulgrim; Wiki/Lexicanum say Magnus the Red with Thousand Sons). Treated Magnus as correct based on the Thousand Sons plot context.",
      },
    ],
    discoveredLinks: [
      { serviceHint: "goodreads", kind: "reference", url: "https://www.goodreads.com/book/show/38450891-sons-of-the-emperor" },
      { serviceHint: "blacklibrary", kind: "shop", url: "https://www.blacklibrary.com/all-products/sons-of-the-emperor-eng-2019.html" },
      { serviceHint: "blacklibrary_mp3", kind: "audio", url: "https://www.blacklibrary.com/all-products/primarchs-sons-of-the-emperor-mp3-eng-2024.html" },
      { serviceHint: "amazon_print", kind: "shop", url: "https://www.amazon.com/Sons-Emperor-Anthology-Heresy-Primarchs/dp/1784967238" },
      { serviceHint: "amazon_ebook", kind: "shop", url: "https://www.amazon.com/Sons-Emperor-Anthology-John-French-ebook/dp/B07NY9GPYY" },
      { serviceHint: "amazon_audible", kind: "audio", url: "https://www.amazon.com/Sons-Emperor-Anthology-Heresy-Primarchs/dp/B0CPYPG7RR" },
      { serviceHint: "lexicanum", kind: "reference", url: "https://wh40k.lexicanum.com/wiki/Sons_of_the_Emperor_(Anthology)" },
    ],
    searchedSources: [
      { kind: "web_search", query: "Sons of the Emperor anthology Warhammer 40000 Black Library contributing authors" },
      { kind: "web_search", query: "Sons of the Emperor Black Library anthology stories contents Primarchs" },
      { kind: "web_search", query: "Sons of the Emperor anthology Goodreads rating reviews 2019" },
      { kind: "web_search", query: "\"Sons of the Emperor\" anthology Horus Heresy Primarchs stories Sanguinius Angron Vulkan Magnus Perturabo Horus synopsis" },
      { kind: "web_search", query: "\"Sons of the Emperor\" anthology Black Library paperback hardcover in print available 2024 2025" },
      { kind: "web_fetch", url: "https://wh40k.lexicanum.com/wiki/Sons_of_the_Emperor_(Anthology)" },
      { kind: "web_fetch", url: "https://www.amazon.com/Sons-Emperor-Anthology-Heresy-Primarchs/dp/1784967238" },
      { kind: "web_fetch", url: "https://warhammer40k.fandom.com/wiki/Sons_of_the_Emperor_(Anthology)" },
      { kind: "web_fetch", url: "https://www.goodreads.com/book/show/38450891-sons-of-the-emperor" },
      { kind: "web_fetch", url: "https://www.blacklibrary.com/all-products/sons-of-the-emperor-eng-2019.html" },
      { kind: "web_fetch", url: "https://civilianreader.com/2019/03/11/quick-review-sons-of-the-emperor-black-library/" },
      { kind: "web_fetch", url: "https://www.blacklibrary.com/the-horus-heresy/novels/sons-of-the-emperor-eng-2019.html" },
    ],
    totalTokens: 25914,
    toolUses: 14,
    durationMs: 101819,
  },
  {
    slug: "the-master-of-mankind",
    synopsis:
      "While Horus's rebellion tears the galaxy apart, a hidden war rages beneath the Imperial Palace on Terra. The Custodian Guard's Ten Thousand, led by Ra Endymion and Diocletian Coros, fight alongside the Sisters of Silence and Mechanicum forces under Fabricator General Kane to hold the ancient Eldar webway against a daemon tide — a catastrophe ignited when Magnus the Red shattered the Emperor's secret project. With traitor legions and corrupted Titans closing on the Throneworld, reinforcements are scraped from the condemned: a crippled Blood Angel named Zephon, doomed Knights of House Vyridion, and the eccentric archaeologist Arkhan Land. The Emperor Himself remains an inscrutable, distant figure, glimpsed only through psychic communion and the testimony of those who serve Him — a god who loves humanity entire yet regards individuals as expendable instruments of a species-wide destiny.",
    facetIds: [
      "book", "audiobook", "male", "mixed", "custodes", "multi", "imperium",
      "planetary", "requires_context", "standard", "siege", "war_story",
      "character_study", "grimdark", "somber", "philosophical", "sacrifice",
      "loyalty", "faith", "hubris", "cw_violence", "cw_disturbing", "cw_death",
      "en", "de", "fr", "es",
    ],
    format: "novel",
    availability: "in_print",
    rating: 4.22,
    ratingSource: "goodreads",
    ratingCount: 4002,
    plausibilityFlags: [
      {
        kind: "proposed_new_facet",
        reasoning:
          "Theme of 'duty' (selfless impersonal obligation, Stoic) is central — the Custodes serve from sworn obligation, not personal loyalty. Closest existing IDs are 'loyalty' and 'sacrifice', both partially applicable but neither captures the impersonal sense. Confirms Haiku's earlier proposal.",
      },
      {
        kind: "data_conflict",
        reasoning:
          "Sisters of Silence have no dedicated facet ID — closest is 'sister' (Sister of Battle), which is a distinct organisation. Vocabulary gap; tagged 'custodes' as primary class.",
      },
    ],
    discoveredLinks: [
      { serviceHint: "goodreads", kind: "reference", url: "https://www.goodreads.com/book/show/33303512-the-master-of-mankind" },
      { serviceHint: "blacklibrary", kind: "shop", url: "https://www.blacklibrary.com/all-products/the-master-of-mankind-ebook.html" },
      { serviceHint: "blacklibrary_audio", kind: "audio", url: "https://www.blacklibrary.com/authors/aaron-dembski-bowden/the-master-of-mankind-mp3.html" },
      { serviceHint: "amazon_us", kind: "shop", url: "https://www.amazon.com/Master-Mankind-Horus-Heresy/dp/1784967114" },
      { serviceHint: "amazon_us_hardcover", kind: "shop", url: "https://www.amazon.com/Master-Mankind-Webway-Hardcover-Warhammer/dp/178496297X" },
    ],
    searchedSources: [
      { kind: "web_search", query: "The Master of Mankind Aaron Dembski-Bowden Horus Heresy novel synopsis" },
      { kind: "web_search", query: "The Master of Mankind Aaron Dembski-Bowden Goodreads rating review" },
      { kind: "web_fetch", url: "https://www.goodreads.com/book/show/33303512-the-master-of-mankind" },
      { kind: "web_fetch", url: "https://wh40k.lexicanum.com/wiki/The_Master_of_Mankind_(Novel)" },
      { kind: "web_fetch", url: "https://www.blacklibrary.com/all-products/the-master-of-mankind-ebook.html" },
      { kind: "web_fetch", url: "https://warhammer40k.fandom.com/wiki/The_Master_of_Mankind_(Novel)" },
      { kind: "web_search", query: "The Master of Mankind Horus Heresy 41 Custodes Sisters of Silence Emperor Webway plot characters" },
      { kind: "web_search", query: "\"The Master of Mankind\" Black Library in print paperback hardcover 2024 2025 availability" },
      { kind: "web_fetch", url: "https://www.amazon.com/Master-Mankind-Horus-Heresy/dp/1784967114" },
      { kind: "web_fetch", url: "https://civilianreader.com/2016/12/29/review-the-master-of-mankind-by-aaron-dembski-bowden-black-library/" },
      { kind: "web_fetch", url: "https://www.trackofwords.com/2016/11/26/the-master-of-mankind-aaron-dembski-bowden/" },
      { kind: "web_search", query: "\"Master of Mankind\" Dembski-Bowden \"Ra Endymion\" Diocletian Zephon Webway War themes" },
      { kind: "web_fetch", url: "https://www.goodreads.com/work/editions/53465255-the-master-of-mankind" },
      { kind: "web_search", query: "site:blacklibrary.com \"master of mankind\" paperback 2025" },
      { kind: "web_fetch", url: "https://www.blacklibrary.com/series/the-horus-heresy" },
      { kind: "web_fetch", url: "https://wh40kbookclub.com/horus-hearsay-41-the-master-of-mankind-not-mankindness/" },
    ],
    totalTokens: 28020,
    toolUses: 18,
    durationMs: 132108,
  },
  {
    slug: "garro",
    synopsis:
      "Battle-Captain Nathaniel Garro of the Death Guard, having survived the treachery at Isstvan and the desperate flight aboard the Eisenstein, is recruited by Malcador the Sigillite to serve as his Agentia Primus. Tasked with recruiting loyal Astartes from across the fractured Legions, Garro becomes the founding architect of the Knights Errant — a secretive cadre that will one day seed the Grey Knights. As he navigates missions across a galaxy torn by civil war, Garro wrestles with his growing faith in the Emperor as a divine being and his duty to protect Euphrati Keeler, the nascent saint of the Lectitio Divinitatus. His arc culminates in a shattering confrontation with his former Primarch, Mortarion. This volume novelises and expands six audio dramas alongside the novella Vow of Faith, with new and extended scenes throughout.",
    facetIds: [
      "book", "audiobook", "male", "space_marine", "imperium", "planetary",
      "galactic", "requires_context", "standard", "war_story", "journey",
      "character_study", "grimdark", "somber", "philosophical", "betrayal",
      "redemption", "loyalty", "faith", "doubt", "sacrifice", "brotherhood",
      "cw_violence", "cw_death", "cw_disturbing", "en",
    ],
    format: "anthology",
    availability: "in_print",
    rating: 4.02,
    ratingSource: "goodreads",
    ratingCount: 1971,
    plausibilityFlags: [
      {
        kind: "data_conflict",
        reasoning:
          "Pipeline reports pageCount of 2 pages, which is clearly erroneous. The paperback edition (ISBN 9781784967581, August 2018) has 464 pages. Value '2' likely originates from a metadata stub in a source.",
      },
      {
        kind: "data_conflict",
        reasoning:
          "Format ambiguity: Black Library markets this as a 'novel' (HH #42), but it is structurally an omnibus/anthology — adapts six previously released audio dramas (Oath of Moment, Legion of One, Sword of Truth, Shield of Lies, Burden of Duty, Ashes of Fealty) plus the novella Vow of Faith. Set format=anthology as more accurate descriptor.",
      },
    ],
    discoveredLinks: [
      { serviceHint: "blacklibrary", kind: "shop", url: "https://www.blacklibrary.com/the-horus-heresy/novels/hh-garro-weapon-of-fate-ebook.html" },
      { serviceHint: "amazon", kind: "shop", url: "https://www.amazon.com/Garro-Horus-Heresy-James-Swallow/dp/1784967580" },
      { serviceHint: "goodreads", kind: "reference", url: "https://www.goodreads.com/book/show/32860806-garro" },
      { serviceHint: "audible", kind: "audio", url: "https://www.audible.com/pd/Garro-Audiobook/B076KLVLL1" },
      { serviceHint: "jswallow_author", kind: "reference", url: "https://jswallow.com/book/hhwof/" },
      { serviceHint: "lexicanum", kind: "reference", url: "https://wh40k.lexicanum.com/wiki/Garro_(Novel)" },
    ],
    searchedSources: [
      { kind: "web_search", query: "Garro James Swallow Black Library anthology book Horus Heresy" },
      { kind: "web_search", query: "Garro audio drama collection James Swallow Nathaniel Garro Knight Errant" },
      { kind: "web_search", query: "Garro James Swallow 2017 anthology page count 416 paperback ISBN 9781784967581" },
      { kind: "web_search", query: "Garro Swallow Horus Heresy 42 hardcover 2017 paperback 2018 pages synopsis stories included" },
      { kind: "web_search", query: "Garro anthology Horus Heresy 42 Goodreads rating 4.02 1971 ratings" },
      { kind: "web_search", query: "\"Garro\" Swallow Horus Heresy \"Knight Errant\" \"Malcador\" synopsis plot description" },
      { kind: "web_fetch", url: "https://warhammer40k.fandom.com/wiki/Garro_(Anthology)" },
      { kind: "web_fetch", url: "https://www.goodreads.com/book/show/32860806-garro" },
      { kind: "web_fetch", url: "https://www.blacklibrary.com/the-horus-heresy/novels/hh-garro-weapon-of-fate-ebook.html" },
      { kind: "web_fetch", url: "https://wh40k.lexicanum.com/wiki/Garro_(Novel)" },
      { kind: "web_fetch", url: "https://www.amazon.com/Garro-Horus-Heresy-James-Swallow/dp/1784967580" },
      { kind: "web_fetch", url: "https://www.abebooks.com/9781784967581/Garro-42-Horus-Heresy-Swallow-1784967580/plp" },
      { kind: "web_fetch", url: "https://blackwells.co.uk/bookshop/product/Garro-by-James-Swallow-author/9781784967581" },
      { kind: "web_fetch", url: "https://shadowhawksshade.wordpress.com/2017/07/08/garro-by-james-swallow-book-review/" },
      { kind: "web_fetch", url: "https://jswallow.com/book/hhwof/" },
      { kind: "web_fetch", url: "https://wh40kbookclub.com/horus-hearsay-42-straight-arrow-garro-by-james-swallow/" },
    ],
    totalTokens: 28147,
    toolUses: 19,
    durationMs: 131016,
  },
  {
    slug: "the-solar-war",
    synopsis:
      "After seven years of devastating war across the galaxy, Warmaster Horus leads his traitor armada toward Terra, the seat of the Emperor's power. Before any blow can be struck at the Throneworld itself, the Sol System must be taken. Primarch Rogal Dorn organises layered defensive spheres, entrusting Sigismund and Jubal Khan with holding the outer approaches while void fleets clash in the darkness between worlds. Multiple perspectives — loyal and traitor alike — trace the opening phase of the Siege: massive fleet engagements, daemonic infiltration, political calculation, and individual acts of desperate courage. Remembrancer Mersadie Oliton moves through the chaos, hunted by both sides, while Abaddon's fractured loyalties add complexity to the traitor cause. The Solar War establishes that Terra's fall is not inevitable — only agonising.",
    facetIds: [
      "book", "male", "multi", "dual", "galactic", "requires_context",
      "standard", "war_story", "siege", "grimdark", "somber", "action_heavy",
      "war", "loyalty", "sacrifice", "betrayal", "cw_violence", "cw_death",
      "cw_disturbing", "en",
    ],
    format: "novel",
    availability: "in_print",
    rating: 4.02,
    ratingSource: "goodreads",
    ratingCount: 4219,
    plausibilityFlags: [
      {
        kind: "data_conflict",
        reasoning:
          "Listed as 'series_start' of Siege of Terra, but it is book 55+ in the broader Horus Heresy continuity. 'requires_context' is the more accurate entry_point facet for newcomers.",
      },
      {
        kind: "data_conflict",
        reasoning:
          "Cast spans Space Marine Primarchs (Dorn, Khan), Space Marine champions (Sigismund, Abaddon), and a civilian remembrancer (Oliton). 'multi' protagonist_class reflects this; could also use ensemble.",
      },
    ],
    discoveredLinks: [
      { serviceHint: "black_library", kind: "shop", url: "https://www.blacklibrary.com/all-products/the-solar-war-ebook-2019.html" },
      { serviceHint: "amazon", kind: "shop", url: "https://www.amazon.com/Siege-Terra-Solar-Horus-Heresy/dp/1784969265" },
      { serviceHint: "goodreads", kind: "reference", url: "https://www.goodreads.com/book/show/42944438-the-solar-war" },
    ],
    searchedSources: [
      { kind: "web_search", query: "The Solar War John French Siege of Terra novel synopsis" },
      { kind: "web_search", query: "The Solar War John French Goodreads rating" },
      { kind: "web_fetch", url: "https://www.goodreads.com/book/show/42944438-the-solar-war" },
      { kind: "web_fetch", url: "https://www.blacklibrary.com/all-products/the-solar-war-ebook-2019.html" },
      { kind: "web_fetch", url: "https://wh40k.lexicanum.com/wiki/The_Solar_War_(Novel)" },
      { kind: "web_search", query: "\"The Solar War\" John French novel page count hardcover paperback Black Library 2019" },
      { kind: "web_fetch", url: "https://www.amazon.com/Siege-Terra-Solar-Horus-Heresy/dp/1784969265" },
      { kind: "web_fetch", url: "https://www.grimdarkmagazine.com/review-the-solar-war-by-john-french/" },
    ],
    totalTokens: 22180,
    toolUses: 10,
    durationMs: 75862,
  },
  {
    slug: "mark-of-calth",
    synopsis:
      "Mark of Calth is a Horus Heresy anthology edited by L.J. Goulding, collecting eight short stories set in the aftermath of the Word Bearers' catastrophic betrayal of the Ultramarines at Calth. With the planet's surface rendered uninhabitable by solar flares from the wounded Veridian star, survivors from both sides wage a grinding Underworld War in cavern networks deep beneath the scorched earth. Stories span multiple perspectives: Ultramarine Captain Ventanus rallies loyalist forces; Word Bearers sorcerers and Dark Apostles pursue daemonic agendas; a civilian shelter worker confronts mysterious warp influence; and the athame ritual dagger passes through centuries of hands toward a fateful purpose. Dan Abnett's 'Unmarked' closes the collection with the Perpetual Oll Persson escaping Calth through the Warp. The anthology directly expands on events from Abnett's Know No Fear.",
    facetIds: [
      "book", "male", "space_marine", "dual", "planetary", "requires_context",
      "standard", "war_story", "character_study", "grimdark", "somber",
      "cosmic_horror", "betrayal", "war", "loyalty", "sacrifice",
      "cw_violence", "cw_death", "cw_disturbing", "en",
    ],
    format: "anthology",
    availability: "oop_recent",
    rating: 3.68,
    ratingSource: "goodreads",
    ratingCount: 2962,
    plausibilityFlags: [
      {
        kind: "author_mismatch",
        reasoning:
          "Pipeline credits 'Laurie Goulding' as sole author, but Goulding is the editor of this anthology. Eight contributing authors: Guy Haley, Graham McNeill, Anthony Reynolds, David Annandale, Rob Sanders, Aaron Dembski-Bowden, John French, Dan Abnett.",
      },
      {
        kind: "data_conflict",
        reasoning:
          "Earlier pipeline missed Word Bearers / Chaos POV and daemonic elements. Multiple stories are told from Word Bearers / warp-entity perspectives, justifying pov_side:dual. The anthology is equally a Word Bearers story as it is an Ultramarines one.",
      },
      {
        kind: "proposed_new_facet",
        reasoning:
          "Vocabulary has no specific Legion tags. For HH anthologies centrally defined by faction conflict, suggested additions: protagonist_class 'heretic_astartes' and 'loyalist_astartes', or a dedicated 'legion' multi-value facet.",
      },
    ],
    discoveredLinks: [
      { serviceHint: "goodreads", kind: "reference", url: "https://www.goodreads.com/book/show/16130716-mark-of-calth" },
      { serviceHint: "blacklibrary", kind: "shop", url: "https://www.blacklibrary.com/the-horus-heresy/novels/mark-of-calth-ebook.html" },
      { serviceHint: "blacklibrary_audio", kind: "audio", url: "https://www.blacklibrary.com/audio/the-horus-heresy-audiobooks/mark-of-calth-audiobook.html" },
      { serviceHint: "amazon", kind: "shop", url: "https://www.amazon.com/Mark-Calth-Horus-Heresy/dp/1849705747" },
      { serviceHint: "lexicanum", kind: "reference", url: "https://wh40k.lexicanum.com/wiki/Mark_of_Calth_(Anthology)" },
      { serviceHint: "fandom_wiki", kind: "reference", url: "https://warhammer40k.fandom.com/wiki/Mark_of_Calth_(Anthology)" },
    ],
    searchedSources: [
      { kind: "web_search", query: "Mark of Calth anthology Horus Heresy contributing authors Laurie Goulding editor" },
      { kind: "web_search", query: "Mark of Calth Black Library anthology contents stories" },
      { kind: "web_search", query: "Mark of Calth Goodreads rating reviews Horus Heresy 25" },
      { kind: "web_search", query: "\"Mark of Calth\" Black Library paperback in print 2024 2025 available buy" },
      { kind: "web_search", query: "\"Mark of Calth\" John French \"Athame\" Word Bearers Ultramarines daemonic synopsis" },
      { kind: "web_fetch", url: "https://wh40k.lexicanum.com/wiki/Mark_of_Calth_(Anthology)" },
      { kind: "web_fetch", url: "https://warhammer40k.fandom.com/wiki/Mark_of_Calth_(Anthology)" },
      { kind: "web_fetch", url: "https://www.blacklibrary.com/the-horus-heresy/novels/mark-of-calth-ebook.html" },
      { kind: "web_fetch", url: "https://www.blacklibrary.com/audio/the-horus-heresy-audiobooks/mark-of-calth-audiobook.html" },
      { kind: "web_fetch", url: "https://www.goodreads.com/book/show/16130716-mark-of-calth" },
      { kind: "web_fetch", url: "https://civilianreader.com/2013/06/17/mark-of-calth-ed-laurie-goulding-black-library/" },
      { kind: "web_fetch", url: "https://shadowhawksshade.wordpress.com/2014/08/19/horus-heresy-mark-of-calth-by-laurie-goulding-book-review/" },
      { kind: "web_fetch", url: "http://conclaveofhar.blogspot.com/2014/02/horus-heresy-book-review-mark-of-calth.html" },
      { kind: "web_fetch", url: "https://scentofagamer.wordpress.com/2022/09/29/book-review-mark-of-calth-horus-heresy-xxv/" },
    ],
    totalTokens: 27052,
    toolUses: 17,
    durationMs: 111647,
  },
];

// =============================================================================
// Aggregate
// =============================================================================

interface SlugResult {
  slug: string;
  synopsis: string;
  facetIds: string[];
  format: string | null;
  availability: string | null;
  rating: number | null;
  ratingSource: string | null;
  ratingCount: number | null;
  plausibilityFlags: Array<{ kind: string; reasoning: string }>;
  discoveredLinks: Array<{ serviceHint: string; kind: string; url: string }>;
  searchedSources: SearchedSource[];
  costEstimate: {
    subscriptionTier: "sonnet";
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number;
    webSearchCalls: number;
    webFetchCalls: number;
    estimatedLimitPercent: number;
    cumulativeLimitPercent: number;
    durationMs: number;
    toolUses: number;
  };
  divergence: string;
  divergenceVsB: string;
}

interface OutputFile {
  ranAt: string;
  variant: "C";
  variantLabel: string;
  model: string;
  subscriptionTier: "sonnet";
  limitFramework: "approximate-token-to-percent-heuristic";
  limitNote: string;
  costNote: string;
  slugs: SlugResult[];
  summary: {
    cumulativeLimitPercent: number;
    totalTokens: number;
    totalWebSearchCalls: number;
    totalWebFetchCalls: number;
    totalToolUses: number;
    totalDurationMs: number;
    hardStopTriggered: boolean;
    completedSlugs: number;
    targetSlugs: number;
  };
}

function rawToComparable(raw: VariantCRawResult): ComparableEnrichment {
  return {
    synopsis: raw.synopsis,
    facetIds: raw.facetIds,
    format: raw.format,
    availability: raw.availability,
    rating: raw.rating,
    ratingSource: raw.ratingSource,
    ratingCount: raw.ratingCount,
    plausibilityFlags: raw.plausibilityFlags,
    discoveredLinks: raw.discoveredLinks,
  };
}

function variantBSlugToComparable(s: {
  synopsis: string;
  facetIds: string[];
  format: string | null;
  availability: string | null;
  rating: number | null;
  ratingSource: string | null;
  ratingCount: number | null;
  plausibilityFlags: Array<{ kind: string; reasoning?: string }>;
  discoveredLinks: Array<{ serviceHint: string; kind: string; url: string }>;
}): ComparableEnrichment {
  return {
    synopsis: s.synopsis,
    facetIds: s.facetIds,
    format: s.format,
    availability: s.availability,
    rating: s.rating,
    ratingSource: s.ratingSource,
    ratingCount: s.ratingCount,
    plausibilityFlags: s.plausibilityFlags.map((f) => ({
      kind: f.kind,
      reasoning: f.reasoning,
    })),
    discoveredLinks: s.discoveredLinks,
  };
}

function round(n: number, decimals: number): number {
  const m = 10 ** decimals;
  return Math.round(n * m) / m;
}

async function main() {
  const variantBRaw = await readFile(
    resolve(process.cwd(), VARIANT_B_PATH),
    "utf8",
  );
  const variantB = JSON.parse(variantBRaw);
  const variantBBySlug = new Map<string, ComparableEnrichment>();
  for (const s of variantB.slugs as Array<Parameters<typeof variantBSlugToComparable>[0] & { slug: string }>) {
    variantBBySlug.set(s.slug, variantBSlugToComparable(s));
  }

  // Load both source diffs once for Variant-A lookups.
  const diffCache = new Map<string, unknown>();
  for (const spec of TARGET_SLUGS) {
    if (!diffCache.has(spec.diffPath)) {
      const raw = await readFile(resolve(process.cwd(), spec.diffPath), "utf8");
      diffCache.set(spec.diffPath, JSON.parse(raw));
    }
  }

  const out: OutputFile = {
    ranAt: new Date().toISOString(),
    variant: "C",
    variantLabel:
      "Sonnet 4.6 + minimal-Inputs (slug + wikipediaTitle + authorNames) + free WebSearch + WebFetch via Agent-Subagent (claude-code harness)",
    model: "claude-sonnet-4-6",
    subscriptionTier: "sonnet",
    limitFramework: "approximate-token-to-percent-heuristic",
    limitNote: `Heuristik: 1% ≈ ${TOKENS_PER_LIMIT_PERCENT.toLocaleString()} Sonnet-Tokens.`,
    costNote:
      "totalTokens reflects the Agent-Tool wrapper's reported usage per subagent. NOT a direct measurement of Sonnet inference tokens — the real inference cost is higher (each web_search adds result content into Sonnet's turns). The limit-percent estimates here are conservative under-estimates; treat them as a lower bound. inputTokens/outputTokens are not exposed by the Agent-Tool, so they are recorded as null.",
    slugs: [],
    summary: {
      cumulativeLimitPercent: 0,
      totalTokens: 0,
      totalWebSearchCalls: 0,
      totalWebFetchCalls: 0,
      totalToolUses: 0,
      totalDurationMs: 0,
      hardStopTriggered: false,
      completedSlugs: 0,
      targetSlugs: TARGET_SLUGS.length,
    },
  };

  let cumulative = 0;

  // Iterate in the brief's prescribed slug order.
  for (const spec of TARGET_SLUGS) {
    const raw = VARIANT_C_RESULTS.find((r) => r.slug === spec.slug);
    if (!raw) {
      console.error(`No Variant-C raw data for slug ${spec.slug}`);
      continue;
    }

    const cmp = rawToComparable(raw);
    const variantA = extractVariantAFromDiff(
      diffCache.get(spec.diffPath) as Parameters<typeof extractVariantAFromDiff>[0],
      spec.slug,
    );
    const variantBCmp = variantBBySlug.get(spec.slug);

    const divergenceVsA = describeDivergence("Pipeline-Haiku-A", variantA, cmp);
    const divergenceVsB = variantBCmp
      ? describeDivergence("Sonnet-Pipeline-B", variantBCmp, cmp)
      : "Sonnet-Pipeline-B not available for this slug.";

    const webSearchCalls = raw.searchedSources.filter((s) => s.kind === "web_search").length;
    const webFetchCalls = raw.searchedSources.filter((s) => s.kind === "web_fetch").length;
    const estLimitPercent = (raw.totalTokens / TOKENS_PER_LIMIT_PERCENT) * 100;
    cumulative += estLimitPercent;

    const result: SlugResult = {
      slug: raw.slug,
      synopsis: raw.synopsis,
      facetIds: raw.facetIds,
      format: raw.format,
      availability: raw.availability,
      rating: raw.rating,
      ratingSource: raw.ratingSource,
      ratingCount: raw.ratingCount,
      plausibilityFlags: raw.plausibilityFlags,
      discoveredLinks: raw.discoveredLinks,
      searchedSources: raw.searchedSources,
      costEstimate: {
        subscriptionTier: "sonnet",
        inputTokens: null,
        outputTokens: null,
        totalTokens: raw.totalTokens,
        webSearchCalls,
        webFetchCalls,
        estimatedLimitPercent: round(estLimitPercent, 2),
        cumulativeLimitPercent: round(cumulative, 2),
        durationMs: raw.durationMs,
        toolUses: raw.toolUses,
      },
      divergence: divergenceVsA,
      divergenceVsB,
    };

    out.slugs.push(result);
    out.summary.completedSlugs += 1;
    out.summary.totalTokens += raw.totalTokens;
    out.summary.totalWebSearchCalls += webSearchCalls;
    out.summary.totalWebFetchCalls += webFetchCalls;
    out.summary.totalToolUses += raw.toolUses;
    out.summary.totalDurationMs += raw.durationMs;
  }
  out.summary.cumulativeLimitPercent = round(cumulative, 2);

  const abs = resolve(process.cwd(), OUTPUT_PATH);
  await writeFile(abs, JSON.stringify(out, null, 2) + "\n", "utf8");

  console.log(
    `[variant-c] aggregated ${out.summary.completedSlugs}/${TARGET_SLUGS.length} slugs.`,
  );
  console.log(
    `[variant-c] tokens=${out.summary.totalTokens} (orchestration), web_search=${out.summary.totalWebSearchCalls}, web_fetch=${out.summary.totalWebFetchCalls}, cumulative=${out.summary.cumulativeLimitPercent}% (heuristik, lower bound).`,
  );
  console.log(`[variant-c] output: ${OUTPUT_PATH}`);
}

main().catch((e) => {
  console.error("[variant-c] fatal:", e);
  process.exit(1);
});
