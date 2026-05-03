/**
 * Chrono Lexicanum — Database schema (Postgres via Drizzle).
 *
 * Stufe 2a (sessions/2026-05-01-019) replaced the books-centric topology with
 * a works-centric Class-Table-Inheritance model:
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
 *   • work_factions / work_characters / work_locations / work_persons /
 *     work_facets — the canonical many-to-many junctions, all keyed on
 *     work_id (no books-side leftovers).
 *   • facet_categories + facet_values — the 12-category faceted classifier
 *     (NEON-14 trigger warnings + 11 editorial categories). Single-column
 *     PK on facet_values.id; ID `pc_xenos` disambiguates from pov_side.xenos.
 *   • services + external_links — references to `services` are FKs (new
 *     storefronts arrive as inserts, not migrations); link `kind` is enum.
 *   • persons + work_persons — author/translator/narrator/director cast.
 *
 * Reference tables (eras, factions, series, sectors, locations, characters,
 * submissions) are unchanged from Phase 1 — only their relations are rewired
 * onto the new junctions.
 *
 * Conventions held from Phase 1
 * -----------------------------
 *  • The custom in-universe time scale stays as `numeric(10,3)`:
 *    `(M-1)*1000 + year_within_M`. M30.997 → 30997.000.
 *  • Provenance per work via `source_kind` + `confidence` for the Phase-4
 *    ingestion pipeline.
 *  • Community submissions still land in `submissions` with status='pending'.
 *
 * Discriminator integrity (constraint 4) is enforced two ways:
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
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// =============================================================================
// ENUMS
// =============================================================================

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
  // Stufe 2a additions — forward-looking for 2c / 3 / Phase 4 once non-book
  // works arrive. Adding now avoids a one-line ALTER TYPE per Phase.
  "tmdb",
  "imdb",
  "youtube",
  "wikidata",
]);

export const workKind = pgEnum("work_kind", [
  "book",
  "film",
  "tv_series", // renamed from `series` to avoid colliding with the series table
  "channel",
  "video",
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

// Phase 3b: format = was-für-ein-Werk, availability = kann-ich-es-noch-bekommen.
// Orthogonale Felder — eine 1996er-Mass-Market-Novel ist `novel`/`oop_legacy`,
// eine moderne BL-Audio-Reihe ist `audio_drama`/`in_print`. Beide werden in 3b
// nullable (Crawler-Ergebnisse partiell befüllt; 3c LLM klassifiziert belastbar).
export const bookFormat = pgEnum("book_format", [
  "novel",
  "novella",
  "short_story",
  "anthology",
  "audio_drama",
  "omnibus",
]);

export const bookAvailability = pgEnum("book_availability", [
  "in_print",
  "oop_recent",
  "oop_legacy",
  "unavailable",
]);

// =============================================================================
// REFERENCE: Eras, Factions, Series
// (Slowly-changing, small N, edited via Drizzle Studio + PR)
// =============================================================================

export const eras = pgTable("eras", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  startY: numeric("start_y", { precision: 10, scale: 3 }).notNull(),
  endY: numeric("end_y", { precision: 10, scale: 3 }).notNull(),
  tone: text("tone"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const factions = pgTable("factions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  parentId: varchar("parent_id", { length: 64 }),
  alignment: factionAlignment("alignment").notNull().default("neutral"),
  tone: text("tone"),
  glyph: text("glyph"),
});

export const series = pgTable("series", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  totalPlanned: integer("total_planned"),
  note: text("note"),
});

// =============================================================================
// CORE: Works (CTI parent) + kind-specific detail children
// =============================================================================

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

    // Real-world year. Universal sort/filter axis. Nullable: channels and
    // works without a clear publication year stay NULL.
    releaseYear: integer("release_year"),

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
    slugIdx: index("works_slug_idx").on(t.slug),
  }),
);

export const bookDetails = pgTable(
  "book_details",
  {
    workId: uuid("work_id")
      .primaryKey()
      .references(() => works.id, { onDelete: "cascade" }),
    isbn13: varchar("isbn13", { length: 13 }),
    // Phase 3b: ISBN-10 für Pre-2007-Editionen (Open Library liefert beides).
    isbn10: varchar("isbn10", { length: 10 }),
    seriesId: varchar("series_id", { length: 64 }).references(() => series.id),
    // 1-based position inside the parent series. Per brief, `pub_year` lives
    // on works.releaseYear instead of being duplicated here.
    seriesIndex: integer("series_index"),
    // Phase 3b: Page-Count + Format/Availability-Klassifikation.
    // pageCount kommt aus Open Library; format/availability primär aus 3c LLM,
    // Open Library als Heuristik-Fallback bei eindeutigem `physical_format`.
    pageCount: integer("page_count"),
    format: bookFormat("format"),
    availability: bookAvailability("availability"),
    // Phase 3c (sessions/2026-05-03-038): Reader-Rating-Capture. Eine Quelle
    // pro Buch nach Source-Priority [amazon, goodreads, hardcover, audible],
    // normalisiert auf 0–5-Skala. rating_source ist varchar (nicht enum) damit
    // zukünftige Quellen Zeilen-Edit statt ALTER TYPE sind. rating_count ist
    // optional (Audible zeigt nicht immer eine eindeutige Review-Zahl).
    rating: numeric("rating", { precision: 3, scale: 2 }),
    ratingSource: varchar("rating_source", { length: 32 }),
    ratingCount: integer("rating_count"),
    // Stufe 2c.0 (sessions/2026-05-02-023): editorial era-anchor. The single
    // canonical era a book belongs to. Replaces the algorithmic midpoint
    // bucketing in Overview/EraDetail. Nullable in the DB; seed-side
    // validation makes it effectively required for the manual catalog.
    primaryEraId: varchar("primary_era_id", { length: 64 }).references(
      () => eras.id,
    ),
  },
  (t) => ({
    seriesIdx: index("book_details_series_idx").on(t.seriesId, t.seriesIndex),
    // Phase 3b carry-over (aus brief 030 / report 035 § "For next session"):
    // Index für `loadTimeline`-Era-Aggregation, heute kein Effekt (26 Bücher),
    // bei Phase-3-Skala (200+/Era) auflaufend. Mitgenommen weil single-line.
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

// =============================================================================
// JUNCTIONS: works ↔ factions / characters / locations / persons
// =============================================================================

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

// =============================================================================
// FACETED CLASSIFICATION
// 12 categories (NEON-14 trigger warnings + 11 editorial). IDs in the catalog
// are bare except where global uniqueness across categories required a
// disambiguation prefix (`pc_xenos` distinct from `pov_side.xenos`).
// =============================================================================

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

// =============================================================================
// SERVICES + EXTERNAL LINKS
// services is a reference table (insert-to-add). external_links is the
// per-work junction. URL-fields that lived on the old `books` row are gone.
// =============================================================================

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
  },
  (t) => ({
    workIdx: index("external_links_work_idx").on(t.workId),
    serviceIdx: index("external_links_service_idx").on(t.serviceId),
  }),
);

// =============================================================================
// PERSONS
// Unified people across all roles — authors, translators, narrators,
// directors, cover artists. Snake-case string IDs as elsewhere.
// =============================================================================

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
  // directors). Constraint 14 explicitly keeps this bag because the use case
  // is concrete; works and book_details intentionally do NOT have one.
  extras: jsonb("extras").$type<Record<string, unknown>>(),
});

// =============================================================================
// MAP: Sectors, Locations
// =============================================================================

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
    gx: integer("gx").notNull(),
    gy: integer("gy").notNull(),
    capital: boolean("capital").default(false),
    warp: boolean("warp").default(false),
    lexicanumUrl: text("lexicanum_url"),
    tags: text("tags").array(),
  },
  (t) => ({
    sectorIdx: index("locations_sector_idx").on(t.sectorId),
  }),
);

// =============================================================================
// CHARACTERS
// =============================================================================

export const characters = pgTable("characters", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  primaryFactionId: varchar("primary_faction_id", { length: 64 }),
  lexicanumUrl: text("lexicanum_url"),
  notes: text("notes"),
});

// =============================================================================
// COMMUNITY: Submissions
// =============================================================================

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

// =============================================================================
// RELATIONS
// Drizzle relational-query API (v1) — same pattern as Phase 1's books schema.
// =============================================================================

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
  factions: many(workFactions),
  characters: many(workCharacters),
  locations: many(workLocations),
  persons: many(workPersons),
  facets: many(workFacets),
  externalLinks: many(externalLinks),
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
  // No `channelWork` relation here — querying channel→video is a Phase 5
  // path and adding both directions now would force a `relationName` on the
  // works→videoDetails one() above for no current use.
}));

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
