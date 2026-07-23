/**
 * Chrono Lexicanum — Database schema (Postgres via Drizzle).
 *
 * Works-centric Class-Table-Inheritance model:
 *
 *     works (parent)
 *       ├── book_details          (kind = 'book')
 *       ├── film_details          (kind = 'film')
 *       ├── channel_details       (kind = 'channel')
 *       └── video_details         (kind = 'video')   tv_series has no detail
 *                                                    table yet — kept as enum
 *                                                    placeholder.
 *
 * Around `works`:
 *   - work_factions / work_characters / work_locations / work_persons /
 *     work_facets — the canonical many-to-many junctions, all keyed on
 *     work_id.
 *   - facet_categories + facet_values — the 12-category faceted classifier
 *     (NEON-14 trigger warnings + 11 editorial categories). Single-column
 *     PK on facet_values.id; ID `pc_xenos` disambiguates from pov_side.xenos.
 *   - services + external_links — references to `services` are FKs (new
 *     storefronts arrive as inserts, not migrations); link `kind` is enum.
 *   - persons + work_persons — author/translator/narrator/director cast.
 *
 * Reference tables: eras, factions, series, sectors, locations, characters,
 * submissions.
 *
 * Conventions:
 *  - The custom in-universe time scale is `numeric(10,3)`:
 *    `M*1000 + year_within_M`. M30.997 → 30997.000.
 *  - Provenance per work via `source_kind` + `confidence`.
 *  - Community submissions land in `submissions` with status='pending';
 *    they never write directly to canonical tables.
 *
 * Discriminator integrity is enforced two ways:
 *   1. The seed script uses transactional helpers that always pair the
 *      correct detail row with works.kind.
 *   2. CHECK triggers on each detail table reject INSERT / UPDATE rows that
 *      attach to a works row of the wrong kind. The trigger SQL lives at the
 *      tail of the 0002 migration — Drizzle's pgTable model can't express it.
 */
import {
  pgTable,
  pgEnum,
  text,
  varchar,
  integer,
  numeric,
  boolean,
  timestamp,
  date,
  uuid,
  primaryKey,
  unique,
  index,
  check,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// Enums

export const submissionStatus = pgEnum("submission_status", [
  "pending",
  "approved",
  "rejected",
  "merged",
]);

export const factionAlignment = pgEnum("faction_alignment", [
  "imperium",
  "chaos",
  "xenos",
  "neutral",
]);

export const sourceKind = pgEnum("source_kind", [
  "manual", // hand-entered by a maintainer
  "lexicanum", // scraped from Warhammer 40k Lexicanum wiki
  "goodreads",
  "black_library",
  "fandom_wiki",
  "community", // user-submitted, then merged
  // Forward-looking sources for non-book works.
  "tmdb",
  "imdb",
  "youtube",
  "wikidata",
  // Drift guard: keep this enum aligned with the TS `SourceName` union
  // (see `src/lib/ingestion/types.ts`).
  "wikipedia",
  "open_library",
  "hardcover",
  "llm",
  // The maintainer curates an external master Excel; the SSOT loader
  // (`scripts/import-ssot-roster.ts`) produces `book-roster.json`, which the
  // ingestion pipeline reads.
  "ssot",
  // Podcast shows + episodes come from an RSS feed (`src/lib/ingestion/podcast`),
  // persisted via `scripts/apply-podcast.ts`.
  "podcast_rss",
]);

export const workKind = pgEnum("work_kind", [
  "book",
  "film",
  "tv_series", // named `tv_series` (not `series`) to avoid colliding with the series table
  "channel",
  "video",
  // A `podcast` is the show container (≈ `channel`); a `podcast_episode` is one
  // feed item (≈ `video`, but audio). Deliberately NOT overloading `video`: an
  // episode has an enclosure-MP3 + durationSec, no video URL — overloading
  // would poison every "all videos" query.
  "podcast",
  "podcast_episode",
]);

export const canonicity = pgEnum("canonicity", [
  "official",
  "fan_classic",
  "fan",
  "apocrypha",
  "unknown",
]);

export const externalLinkKind = pgEnum("external_link_kind", [
  "read",
  "listen",
  "watch",
  "buy_print",
  "reference",
  "trailer",
  "official_page",
]);

export const personRole = pgEnum("person_role", [
  "author",
  "co_author",
  "translator",
  "editor",
  "narrator",
  "co_narrator",
  "full_cast",
  "director",
  "co_director",
  "cover_artist",
  "sound_designer",
]);

// format = what kind of work it is, availability = can it still be obtained.
// Orthogonal fields — a 1996 mass-market novel is `novel`/`oop_legacy`, a
// modern BL audio series is `audio_drama`/`in_print`. Both are nullable
// (ingested data fills them only partially).
export const bookFormat = pgEnum("book_format", [
  "novel",
  "novella",
  "short_story",
  "anthology",
  "audio_drama",
  "omnibus",
  // Maintainer-vocabulary values from the Excel SSOT: `collection` = a
  // collected volume narrower than an anthology; `artbook` + `scriptbook`
  // are edge cases.
  "collection",
  "artbook",
  "scriptbook",
]);

export const bookAvailability = pgEnum("book_availability", [
  "in_print",
  "oop_recent",
  "oop_legacy",
  "unavailable",
]);

// Display weight of a curated timeline event — 'epoch' = chapter anchor,
// 'major' = full entry, 'minor' = compact row.
export const eventTier = pgEnum("event_tier", ["epoch", "major", "minor"]);

// Reference tables: eras, factions, series
// (slowly-changing, small N, edited via Drizzle Studio + PR)

export const eras = pgTable("eras", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  startY: numeric("start_y", { precision: 10, scale: 3 }).notNull(),
  endY: numeric("end_y", { precision: 10, scale: 3 }).notNull(),
  tone: text("tone"),
  sortOrder: integer("sort_order").notNull().default(0),
  // Editorial copy for the 8-era timeline; all nullable. Grouping mode /
  // minimap tuning deliberately stay product-side view config, not DB.
  short: text("short"),
  mLabel: text("m_label"),
  sub: text("sub"),
  tagline: text("tagline"),
  intro: text("intro"),
  // Public asset path (/timeline/bg/*.webp). String, no FK — the path may
  // dangle before the file exists.
  coverRef: text("cover_ref"),
});

export const factions = pgTable(
  "factions",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    name: text("name").notNull(),
    parentId: varchar("parent_id", { length: 64 }),
    alignment: factionAlignment("alignment").notNull().default("neutral"),
    tone: text("tone"),
    glyph: text("glyph"),
  },
  (t) => ({
    // Self-referential hierarchy lookup (factionsRelations.parent). Index
    // only, no FK on the self-reference — keeps seed ordering free.
    parentIdx: index("factions_parent_idx").on(t.parentId),
  }),
);

export const series = pgTable("series", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  totalPlanned: integer("total_planned"),
  note: text("note"),
});

// Core: works (CTI parent) + kind-specific detail children

export const works = pgTable(
  "works",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    kind: workKind("kind").notNull(),
    canonicity: canonicity("canonicity").notNull().default("official"),

    slug: varchar("slug", { length: 200 }).notNull().unique(),
    title: text("title").notNull(),

    // Universal across kinds — every work has artwork and a synopsis/logline.
    coverUrl: text("cover_url"),
    synopsis: text("synopsis"),

    // In-universe time (M-scale). Channels typically NULL.
    startY: numeric("start_y", { precision: 10, scale: 3 }),
    endY: numeric("end_y", { precision: 10, scale: 3 }),

    // Dating provenance for the curated setting dates (book-dates.json) that
    // fill startY/endY. settingMethod is text (not enum) so the curation
    // vocabulary ('explicit', 'event-anchored', 'roster', 'bracket',
    // 'series-inherited', …) can grow without a migration.
    // settingAnchorEventId points to the event the dating was derived from
    // (nullable — not every dating is event-anchored).
    settingDateLabel: text("setting_date_label"),
    settingMethod: text("setting_method"),
    settingConfidence: varchar("setting_confidence", { length: 1 }),
    settingAnchorEventId: varchar("setting_anchor_event_id", {
      length: 64,
    }).references(() => events.id),

    // Real-world year. Universal sort/filter axis. Nullable: channels and
    // works without a clear publication year stay NULL.
    releaseYear: integer("release_year"),

    // Stable maintainer-Excel IDs (e.g. "W40K-0001", "HH-0042"). Nullable
    // because non-SSOT works (films, channels, future hand-inserts) won't
    // have one. UNIQUE so a re-import after the maintainer edits the
    // spreadsheet can match Excel row → existing `works.id` (UUID) safely —
    // slug alone may shift if a title gets corrected.
    externalBookId: varchar("external_book_id", { length: 16 }).unique(),

    sourceKind: sourceKind("source_kind").notNull().default("manual"),
    confidence: numeric("confidence", { precision: 3, scale: 2 }).default("1.00"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    startYIdx: index("works_start_y_idx").on(t.startY),
    kindIdx: index("works_kind_idx").on(t.kind),
    canonicityIdx: index("works_canonicity_idx").on(t.canonicity),
    releaseYearIdx: index("works_release_year_idx").on(t.releaseYear),
    // No explicit slug index: `slug` is `.unique()` above, whose UNIQUE index
    // (works_slug_unique) already serves slug lookups.
    // Reverse lookup "which works anchor on event X" (timeline chips) would
    // otherwise seq-scan.
    settingAnchorEventIdx: index("works_setting_anchor_event_idx").on(
      t.settingAnchorEventId,
    ),
  }),
);

export const bookDetails = pgTable(
  "book_details",
  {
    workId: uuid("work_id")
      .primaryKey()
      .references(() => works.id, { onDelete: "cascade" }),
    isbn13: varchar("isbn13", { length: 13 }),
    // ISBN-10 for pre-2007 editions (Open Library supplies both).
    isbn10: varchar("isbn10", { length: 10 }),
    seriesId: varchar("series_id", { length: 64 }).references(() => series.id),
    // 1-based position inside the parent series. `pub_year` lives on
    // works.releaseYear instead of being duplicated here.
    seriesIndex: integer("series_index"),
    // pageCount comes from Open Library; format/availability primarily from
    // LLM classification, with Open Library as a heuristic fallback when
    // `physical_format` is unambiguous.
    pageCount: integer("page_count"),
    format: bookFormat("format"),
    availability: bookAvailability("availability"),
    // Reader-rating capture. One source per book by source priority
    // [amazon, goodreads, hardcover, audible], normalized to a 0–5 scale.
    // rating_source is varchar (not enum) so future sources are a row edit,
    // not an ALTER TYPE. rating_count is optional (Audible does not always
    // show an unambiguous review count).
    rating: numeric("rating", { precision: 3, scale: 2 }),
    ratingSource: varchar("rating_source", { length: 32 }),
    ratingCount: integer("rating_count"),
    // Editorial era anchor: the single canonical era a book belongs to.
    // Nullable in the DB; seed-side validation makes it effectively required
    // for the manual catalog.
    primaryEraId: varchar("primary_era_id", { length: 64 }).references(
      () => eras.id,
    ),
    // Free-text note from the Excel-SSOT column "Relation Notes" — the
    // maintainer records e.g. "Eisenhorn Omnibus collects Xenos/Malleus/
    // Hereticus + Backcloth for a Crown Additional" there. No frontend
    // consumer today.
    notes: text("notes"),
  },
  (t) => ({
    seriesIdx: index("book_details_series_idx").on(t.seriesId, t.seriesIndex),
    // Index for the `loadTimeline` era aggregation; pays off as the catalog
    // grows past a few hundred books per era.
    primaryEraIdx: index("book_details_primary_era_idx").on(t.primaryEraId),
  }),
);

export const filmDetails = pgTable("film_details", {
  workId: uuid("work_id")
    .primaryKey()
    .references(() => works.id, { onDelete: "cascade" }),
  releaseDate: date("release_date"),
});

export const channelDetails = pgTable("channel_details", {
  workId: uuid("work_id")
    .primaryKey()
    .references(() => works.id, { onDelete: "cascade" }),
  // 'youtube' | 'twitch' | etc. — varchar so new platforms don't need a
  // migration. Stays minimal until Phase 5 surfaces actual editorial needs.
  platform: varchar("platform", { length: 32 }),
});

export const videoDetails = pgTable("video_details", {
  workId: uuid("work_id")
    .primaryKey()
    .references(() => works.id, { onDelete: "cascade" }),
  // Self-link: a video belongs to a channel work. Set null if the channel
  // disappears (the video still exists as a standalone entry).
  channelWorkId: uuid("channel_work_id").references(() => works.id, {
    onDelete: "set null",
  }),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }),
});

// Podcast show container (≈ channel_details).
// One row per `podcast`-kind work. Identity lives in the feed: `podcastGuid`
// (RSS namespace `<podcast:guid>`, the stable cross-host show id), with
// `feedUrl` / works.slug as upsert fallbacks. `appleId` is varchar (numeric
// store id) so a new directory id is a row-edit, not a migration.
export const podcastDetails = pgTable("podcast_details", {
  workId: uuid("work_id")
    .primaryKey()
    .references(() => works.id, { onDelete: "cascade" }),
  feedUrl: text("feed_url"),
  podcastGuid: text("podcast_guid"),
  appleId: varchar("apple_id", { length: 32 }),
  imageUrl: text("image_url"),
});

// One podcast feed item (≈ video_details).
// Self-link `podcastWorkId` → the show work, analogous to
// video_details.channelWorkId but NOT NULL: an episode always belongs to a
// show (the apply always sets it), which also keeps the
// UNIQUE(podcastWorkId, episodeGuid) key null-free. No onDelete=cascade — a
// deleted show should surface as an FK error, not silently orphan/erase its
// episodes (cleanup is the apply's job, not a cascade's). `episodeGuid` is
// the feed `<guid>` verbatim (arbitrary length per RSS spec → `text`, not
// works.externalBookId's varchar(16)); it is feed-local, so the uniqueness
// scope is per-show, not global — multiple feeds could otherwise collide on
// a shared guid.
export const podcastEpisodeDetails = pgTable(
  "podcast_episode_details",
  {
    workId: uuid("work_id")
      .primaryKey()
      .references(() => works.id, { onDelete: "cascade" }),
    podcastWorkId: uuid("podcast_work_id")
      .notNull()
      .references(() => works.id),
    episodeGuid: text("episode_guid").notNull(),
    audioUrl: text("audio_url"),
    durationSec: integer("duration_sec"),
    pubDate: timestamp("pub_date", { withTimezone: true }),
    season: integer("season"),
    episode: integer("episode"),
    // 'lore' | 'news_recap' | 'interview' | 'other' (EpisodeKind). varchar (not
    // enum) so the editorial vocabulary can grow without a migration.
    episodeKind: varchar("episode_kind", { length: 16 }),
  },
  (t) => ({
    showIdx: index("podcast_episode_details_podcast_idx").on(t.podcastWorkId),
    // Per-show episode identity — the idempotent apply keys on (show, guid).
    episodeGuidUnique: unique("podcast_episode_details_show_guid_unique").on(
      t.podcastWorkId,
      t.episodeGuid,
    ),
  }),
);

// Junctions: works ↔ factions / characters / locations / persons

export const workFactions = pgTable(
  "work_factions",
  {
    workId: uuid("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    factionId: varchar("faction_id", { length: 64 })
      .notNull()
      .references(() => factions.id),
    // 'primary' | 'supporting' | 'antagonist'. varchar (not enum) so the
    // editorial vocabulary can grow without a migration; default keeps
    // bulk-tagging cheap.
    role: varchar("role", { length: 32 }).default("supporting"),
    // Audit-trail column: the original LLM/override surface-form string that
    // produced this junction row. NULL = direct match without drift
    // (raw == canonical.name); non-NULL = the surface form deviated from the
    // canonical name (e.g. "Imperial Guard" → astra_militarum).
    rawName: text("raw_name"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.workId, t.factionId] }),
    factionIdx: index("work_factions_faction_idx").on(t.factionId),
  }),
);

export const workCharacters = pgTable(
  "work_characters",
  {
    workId: uuid("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    characterId: varchar("character_id", { length: 64 })
      .notNull()
      .references(() => characters.id),
    // 'pov' | 'appears' | 'mentioned'.
    role: varchar("role", { length: 32 }).default("appears"),
    // Audit-trail column (see workFactions.rawName).
    rawName: text("raw_name"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.workId, t.characterId] }),
    characterIdx: index("work_characters_character_idx").on(t.characterId),
  }),
);

export const workLocations = pgTable(
  "work_locations",
  {
    workId: uuid("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    locationId: varchar("location_id", { length: 64 })
      .notNull()
      .references(() => locations.id),
    // 'primary' | 'secondary' | 'mentioned'. Default 'secondary' is the safe
    // bulk-tagging fallback (the spotlight location should be 'primary'
    // explicitly).
    role: varchar("role", { length: 32 }).default("secondary"),
    atY: numeric("at_y", { precision: 10, scale: 3 }),
    // Audit-trail column (see workFactions.rawName).
    rawName: text("raw_name"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.workId, t.locationId] }),
    locationIdx: index("work_locations_location_idx").on(t.locationId),
  }),
);

export const workPersons = pgTable(
  "work_persons",
  {
    workId: uuid("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    personId: varchar("person_id", { length: 64 })
      .notNull()
      .references(() => persons.id),
    role: personRole("role").notNull(),
    displayOrder: integer("display_order").notNull().default(0),
    note: text("note"),
  },
  (t) => ({
    // Same person may hold multiple roles on the same work (rare — anthology
    // editor + cover artist — but the model permits it).
    pk: primaryKey({ columns: [t.workId, t.personId, t.role] }),
    personIdx: index("work_persons_person_idx").on(t.personId),
  }),
);

// Faceted classification: 12 categories (NEON-14 trigger warnings + 11
// editorial). IDs in the catalog are bare except where global uniqueness
// across categories required a disambiguation prefix (`pc_xenos` distinct
// from `pov_side.xenos`).

export const facetCategories = pgTable("facet_categories", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  displayOrder: integer("display_order").notNull().default(0),
  multiValue: boolean("multi_value").notNull().default(true),
  visibleToUsers: boolean("visible_to_users").notNull().default(true),
});

export const facetValues = pgTable(
  "facet_values",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    categoryId: varchar("category_id", { length: 64 })
      .notNull()
      .references(() => facetCategories.id),
    name: text("name").notNull(),
    description: text("description"),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (t) => ({
    categoryIdx: index("facet_values_category_idx").on(t.categoryId),
  }),
);

export const workFacets = pgTable(
  "work_facets",
  {
    workId: uuid("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    facetValueId: varchar("facet_value_id", { length: 64 })
      .notNull()
      .references(() => facetValues.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.workId, t.facetValueId] }),
    facetValueIdx: index("work_facets_facet_value_idx").on(t.facetValueId),
  }),
);

// Book collections (anthology / omnibus M2M): junction for "collection
// contains work", sourced from the Excel-SSOT column "Collection Links"
// (e.g. *Xenos* contained in *Eisenhorn Omnibus*). Both FKs point to
// `works.id` (self-M2M); cascade in both directions, so a deleted collection
// takes its junction rows with it AND a deleted contained work drops out of
// all collections.

export const workCollections = pgTable(
  "work_collections",
  {
    collectionWorkId: uuid("collection_work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    contentWorkId: uuid("content_work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    // 0-based order of the children within the collection (from the Excel
    // Books sheet "Collects Titles" semicolon order). Default 0 when no
    // sequence can be derived — the frontend then falls back to releaseYear
    // sort.
    displayOrder: integer("display_order").notNull().default(0),
    // 0.00–1.00 from the Excel "Collection Links" sheet "Confidence" — how
    // certain the relationship is (set by the maintainer's LLM workflow).
    confidence: numeric("confidence", { precision: 3, scale: 2 }),
    // Rationale from the Excel "Collection Links" sheet "Basis", e.g.
    // "Explicit Eisenhorn omnibus follows the trilogy in TLBranson".
    basis: text("basis"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.collectionWorkId, t.contentWorkId] }),
    // Secondary index for the DetailPanel query "all collections containing
    // *Xenos*" (`WHERE content_work_id = ?`). The other direction ("all
    // children of an omnibus") is covered by the PK b-tree's leading column —
    // no second index needed.
    contentIdx: index("work_collections_content_idx").on(t.contentWorkId),
  }),
);

// Services + external links: services is a reference table (insert-to-add);
// external_links is the per-work junction.

export const services = pgTable("services", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  domain: text("domain"),
  affiliateSupported: boolean("affiliate_supported").notNull().default(false),
  displayOrder: integer("display_order").notNull().default(0),
});

export const externalLinks = pgTable(
  "external_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workId: uuid("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    kind: externalLinkKind("kind").notNull(),
    serviceId: varchar("service_id", { length: 64 })
      .notNull()
      .references(() => services.id),
    url: text("url").notNull(),
    label: text("label"),
    region: varchar("region", { length: 8 }),
    affiliate: boolean("affiliate").notNull().default(false),
    displayOrder: integer("display_order").notNull().default(0),
    // Provenance per link, analogous to works.source_kind + works.confidence.
    // Episodes are `works`, so their watch/listen links land here (not just
    // in podcast_episode_details); the generic cross-media link store
    // therefore needs the same audit columns as the works it hangs off.
    // Defaulted, so inserts that omit them backfill as `manual` / `1.00`.
    sourceKind: sourceKind("source_kind").notNull().default("manual"),
    confidence: numeric("confidence", { precision: 3, scale: 2 }).default("1.00"),
  },
  (t) => ({
    workIdx: index("external_links_work_idx").on(t.workId),
    serviceIdx: index("external_links_service_idx").on(t.serviceId),
  }),
);

// Persons: unified people across all roles — authors, translators, narrators,
// directors, cover artists. Snake-case string IDs as elsewhere.

export const persons = pgTable("persons", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  // Sort key — usually "Last, First". Surface-level UI uses `name`.
  nameSort: text("name_sort").notNull(),
  bio: text("bio"),
  birthYear: integer("birth_year"),
  lexicanumUrl: text("lexicanum_url"),
  wikipediaUrl: text("wikipedia_url"),
  // Role-specific bookkeeping (audible profile for narrators, imdb id for
  // directors). works and book_details intentionally do NOT have such a bag.
  extras: jsonb("extras").$type<Record<string, unknown>>(),
});

// Map: sectors, locations

export const sectors = pgTable("sectors", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  color: text("color"),
  tone: text("tone"),
  labelX: integer("label_x"),
  labelY: integer("label_y"),
});

export const locations = pgTable(
  "locations",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    name: text("name").notNull(),
    sectorId: varchar("sector_id", { length: 64 }).references(() => sectors.id),
    // Nullable for lore worlds without Cartographer coordinates (e.g. the
    // Sabbat and Scarus sectors). The Cartographer filters
    // `WHERE gx IS NOT NULL`.
    gx: integer("gx"),
    gy: integer("gy"),
    capital: boolean("capital").default(false),
    warp: boolean("warp").default(false),
    lexicanumUrl: text("lexicanum_url"),
    tags: text("tags").array(),
  },
  (t) => ({
    sectorIdx: index("locations_sector_idx").on(t.sectorId),
  }),
);

// Characters

export const characters = pgTable(
  "characters",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    name: text("name").notNull(),
    primaryFactionId: varchar("primary_faction_id", { length: 64 }),
    lexicanumUrl: text("lexicanum_url"),
    notes: text("notes"),
  },
  (t) => ({
    // Faction detail pages equality-filter characters by primaryFactionId
    // (src/lib/entity/loader.ts) — without this index that is a seq-scan per
    // request. Index only, no FK: character ingest can carry a faction id not
    // yet present in `factions`, and a FK would turn that into a seed/apply
    // error.
    primaryFactionIdx: index("characters_primary_faction_idx").on(t.primaryFactionId),
  }),
);

// Timeline: events + event↔work hooks.
// The hand-curated Chronicle spine: dated events across eight eras, plus a
// junction carrying book/series/podcast hooks per event. Seed source:
// scripts/seed-data/{events,event-works}.json, loaded via
// scripts/apply-timeline-data.ts (idempotent, dry-run capable).

export const events = pgTable(
  "events",
  {
    // snake_case reference-table convention, e.g. 'razing_of_monarchia'.
    id: varchar("id", { length: 64 }).primaryKey(),
    title: text("title").notNull(),
    // Verbatim imperial notation / legend label ("964.M30", "~60,000,000
    // YEARS AGO") — NEVER re-derived from startY.
    dateLabel: text("date_label").notNull(),
    // Nullable: deep-history events (War in Heaven, …) are off-scale.
    startY: numeric("start_y", { precision: 10, scale: 3 }),
    endY: numeric("end_y", { precision: 10, scale: 3 }),
    offscale: boolean("offscale").notNull().default(false),
    // Editorially assigned, NEVER derived from startY — Fall of Cadia
    // (999.M41) sits in 'indomitus', M36 apostasy beats in 'age_apostasy'.
    // Rows whose startY lies outside the era bounds are not an error.
    eraId: varchar("era_id", { length: 64 })
      .notNull()
      .references(() => eras.id),
    // Display order within the era (stamped at export).
    sortIndex: integer("sort_index").notNull(),
    tier: eventTier("tier").notNull(),
    approx: boolean("approx").notNull().default(false),
    // 'H' / 'M' / 'L' — curation provenance, same spirit as works.confidence,
    // but keeping the curated letter vocabulary verbatim.
    confidence: varchar("confidence", { length: 1 }),
    // Curation provenance string ('lex', 'fandom', 'tl', 'roster', 'chron',
    // 'lore', combos like 'fandom/lex') — text (not enum) so the curation
    // vocabulary can grow without a migration.
    sourceKind: text("source_kind"),
    // English display copy rendered by the timeline.
    blurb: text("blurb").notNull(),
    // Internal provenance note, not rendered.
    curatorNote: text("curator_note"),
    // Public asset path; the string may dangle before the file exists.
    artworkRef: text("artwork_ref"),
    artCreditName: text("art_credit_name"),
    artCreditUrl: text("art_credit_url"),
  },
  (t) => ({
    eraIdx: index("events_era_idx").on(t.eraId),
    startYIdx: index("events_start_y_idx").on(t.startY),
  }),
);

// One junction for book hooks AND podcast picks — episodes are already
// works rows. seriesId covers series-level hooks (Gaunt's Ghosts, The Beast
// Arises) where no single book carries the event.
export const eventWorks = pgTable(
  "event_works",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: varchar("event_id", { length: 64 })
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    workId: uuid("work_id").references(() => works.id),
    seriesId: varchar("series_id", { length: 64 }).references(() => series.id),
    // 'book' | 'podcast' — text field (not enum), same rationale as
    // work_factions.role (the vocabulary grows without a migration).
    role: text("role").notNull(),
    // Curated attribution-line override ("G. McNeill · PROLOGUE 739.M30",
    // "EP. 112", "SERIES · 23 BOOKS"); NULL = the frontend builds the default.
    displayLabel: text("display_label"),
    // Chip order within the event.
    position: integer("position").notNull().default(0),
  },
  (t) => ({
    // Postgres default NULLS DISTINCT: multiple series hooks per event do not
    // collide on (eventId, NULL workId), and vice versa.
    eventWorkUnique: unique("event_works_event_work_unique").on(
      t.eventId,
      t.workId,
    ),
    eventSeriesUnique: unique("event_works_event_series_unique").on(
      t.eventId,
      t.seriesId,
    ),
    // Exactly one of workId / seriesId is set.
    exactlyOneTarget: check(
      "event_works_exactly_one_target",
      sql`(work_id IS NULL) <> (series_id IS NULL)`,
    ),
    // Reverse lookup "which event_works for work_id=X": the unique index
    // leads with event_id and does not serve this direction.
    workIdx: index("event_works_work_idx").on(t.workId),
  }),
);

// Community: submissions

export const submissions = pgTable("submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: varchar("entity_type", { length: 32 }).notNull(),
  payload: jsonb("payload").notNull(),
  targetEntityId: text("target_entity_id"),
  submittedBy: text("submitted_by"),
  submitterEmail: text("submitter_email"),
  submitterNote: text("submitter_note"),
  status: submissionStatus("status").notNull().default("pending"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewNote: text("review_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Relations (Drizzle relational-query API)

export const factionsRelations = relations(factions, ({ one, many }) => ({
  parent: one(factions, {
    fields: [factions.parentId],
    references: [factions.id],
    relationName: "faction_parent",
  }),
  children: many(factions, { relationName: "faction_parent" }),
  works: many(workFactions),
}));

export const seriesRelations = relations(series, ({ many }) => ({
  bookDetails: many(bookDetails),
  eventWorks: many(eventWorks),
}));

export const erasRelations = relations(eras, ({ many }) => ({
  events: many(events),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  era: one(eras, { fields: [events.eraId], references: [eras.id] }),
  works: many(eventWorks),
}));

export const eventWorksRelations = relations(eventWorks, ({ one }) => ({
  event: one(events, {
    fields: [eventWorks.eventId],
    references: [events.id],
  }),
  work: one(works, { fields: [eventWorks.workId], references: [works.id] }),
  series: one(series, {
    fields: [eventWorks.seriesId],
    references: [series.id],
  }),
}));

export const worksRelations = relations(works, ({ one, many }) => ({
  bookDetails: one(bookDetails, {
    fields: [works.id],
    references: [bookDetails.workId],
  }),
  filmDetails: one(filmDetails, {
    fields: [works.id],
    references: [filmDetails.workId],
  }),
  channelDetails: one(channelDetails, {
    fields: [works.id],
    references: [channelDetails.workId],
  }),
  videoDetails: one(videoDetails, {
    fields: [works.id],
    references: [videoDetails.workId],
  }),
  podcastDetails: one(podcastDetails, {
    fields: [works.id],
    references: [podcastDetails.workId],
  }),
  podcastEpisodeDetails: one(podcastEpisodeDetails, {
    fields: [works.id],
    references: [podcastEpisodeDetails.workId],
  }),
  factions: many(workFactions),
  characters: many(workCharacters),
  locations: many(workLocations),
  persons: many(workPersons),
  facets: many(workFacets),
  // Two `many()` on the same junction (self-M2M "collection ↔ content").
  // Drizzle needs explicit `relationName` strings, otherwise the
  // relational-query API throws disambiguation errors.
  // `containedIn` = collections this work is contained in
  //   (for the DetailPanel of *Xenos*: shows *Eisenhorn Omnibus* etc.).
  // `contains` = works this collection contains
  //   (for the DetailPanel of *Eisenhorn Omnibus*: shows *Xenos*, *Malleus*, …).
  containedIn: many(workCollections, { relationName: "work_collection_content" }),
  contains: many(workCollections, { relationName: "work_collection_collection" }),
  externalLinks: many(externalLinks),
  eventWorks: many(eventWorks),
}));

export const bookDetailsRelations = relations(bookDetails, ({ one }) => ({
  work: one(works, {
    fields: [bookDetails.workId],
    references: [works.id],
  }),
  series: one(series, {
    fields: [bookDetails.seriesId],
    references: [series.id],
  }),
}));

export const filmDetailsRelations = relations(filmDetails, ({ one }) => ({
  work: one(works, {
    fields: [filmDetails.workId],
    references: [works.id],
  }),
}));

export const channelDetailsRelations = relations(channelDetails, ({ one }) => ({
  work: one(works, {
    fields: [channelDetails.workId],
    references: [works.id],
  }),
}));

export const videoDetailsRelations = relations(videoDetails, ({ one }) => ({
  work: one(works, {
    fields: [videoDetails.workId],
    references: [works.id],
  }),
  // No `channelWork` relation here — channel→video queries have no current
  // consumer, and adding both directions would force a `relationName` on the
  // works→videoDetails one() above for no current use.
}));

export const podcastDetailsRelations = relations(podcastDetails, ({ one }) => ({
  work: one(works, {
    fields: [podcastDetails.workId],
    references: [works.id],
  }),
}));

export const podcastEpisodeDetailsRelations = relations(
  podcastEpisodeDetails,
  ({ one }) => ({
    work: one(works, {
      fields: [podcastEpisodeDetails.workId],
      references: [works.id],
    }),
    // No `show` relation here on the podcastWorkId self-link — same rationale
    // as video_details.channelWorkId: show→episodes queries have no current
    // consumer, and adding the relation would force a `relationName` on the
    // works→podcastEpisodeDetails one() above for no current use.
  }),
);

export const workFactionsRelations = relations(workFactions, ({ one }) => ({
  work: one(works, { fields: [workFactions.workId], references: [works.id] }),
  faction: one(factions, {
    fields: [workFactions.factionId],
    references: [factions.id],
  }),
}));

export const workCharactersRelations = relations(workCharacters, ({ one }) => ({
  work: one(works, { fields: [workCharacters.workId], references: [works.id] }),
  character: one(characters, {
    fields: [workCharacters.characterId],
    references: [characters.id],
  }),
}));

export const workLocationsRelations = relations(workLocations, ({ one }) => ({
  work: one(works, { fields: [workLocations.workId], references: [works.id] }),
  location: one(locations, {
    fields: [workLocations.locationId],
    references: [locations.id],
  }),
}));

export const workPersonsRelations = relations(workPersons, ({ one }) => ({
  work: one(works, { fields: [workPersons.workId], references: [works.id] }),
  person: one(persons, {
    fields: [workPersons.personId],
    references: [persons.id],
  }),
}));

export const facetCategoriesRelations = relations(facetCategories, ({ many }) => ({
  values: many(facetValues),
}));

export const facetValuesRelations = relations(facetValues, ({ one, many }) => ({
  category: one(facetCategories, {
    fields: [facetValues.categoryId],
    references: [facetCategories.id],
  }),
  works: many(workFacets),
}));

export const workFacetsRelations = relations(workFacets, ({ one }) => ({
  work: one(works, { fields: [workFacets.workId], references: [works.id] }),
  facetValue: one(facetValues, {
    fields: [workFacets.facetValueId],
    references: [facetValues.id],
  }),
}));

// Both `one(works)` need a `relationName` that pairs with the
// `containedIn`/`contains` in `worksRelations` — otherwise Drizzle's
// relational-query API throws "ambiguous relation" errors.
export const workCollectionsRelations = relations(workCollections, ({ one }) => ({
  collection: one(works, {
    fields: [workCollections.collectionWorkId],
    references: [works.id],
    relationName: "work_collection_collection",
  }),
  content: one(works, {
    fields: [workCollections.contentWorkId],
    references: [works.id],
    relationName: "work_collection_content",
  }),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  links: many(externalLinks),
}));

export const externalLinksRelations = relations(externalLinks, ({ one }) => ({
  work: one(works, { fields: [externalLinks.workId], references: [works.id] }),
  service: one(services, {
    fields: [externalLinks.serviceId],
    references: [services.id],
  }),
}));

export const personsRelations = relations(persons, ({ many }) => ({
  works: many(workPersons),
}));

export const sectorsRelations = relations(sectors, ({ many }) => ({
  locations: many(locations),
}));

export const locationsRelations = relations(locations, ({ one, many }) => ({
  sector: one(sectors, {
    fields: [locations.sectorId],
    references: [sectors.id],
  }),
  works: many(workLocations),
}));

export const charactersRelations = relations(characters, ({ many }) => ({
  works: many(workCharacters),
}));
