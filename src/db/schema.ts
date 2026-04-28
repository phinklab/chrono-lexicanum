/**
 * Chrono Lexicanum — Database schema (Postgres via Drizzle).
 *
 * Design principles
 * -----------------
 *  • The schema is built to scale from zero (v1 ships with no books — they
 *    arrive via the Phase 4 ingestion pipeline) to thousands. Every "where it
 *    gets messy" decision is commented.
 *  • The custom in-universe time scale stays as `numeric(10,3)`:
 *    `(M-1)*1000 + year_within_M`. M30.997 → 30997.000, etc.
 *  • Each row that came from a scraping pipeline (wiki, goodreads, ...)
 *    carries `source_id` and `confidence` so we can audit & override.
 *  • Community submissions never write directly into canonical tables —
 *    they land in `submissions` with status='pending' and only get merged
 *    after moderation.
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
]);

// =============================================================================
// CORE: Eras, Factions, Series
// (Slowly-changing reference data, small N, edited via Drizzle Studio + PR)
// =============================================================================

export const eras = pgTable("eras", {
  id: varchar("id", { length: 64 }).primaryKey(), // 'horus_heresy'
  name: text("name").notNull(),
  startY: numeric("start_y", { precision: 10, scale: 3 }).notNull(),
  endY: numeric("end_y", { precision: 10, scale: 3 }).notNull(),
  tone: text("tone"), // one-line vibe used in UI cards
  sortOrder: integer("sort_order").notNull().default(0),
});

export const factions = pgTable("factions", {
  id: varchar("id", { length: 64 }).primaryKey(), // 'thousand_sons'
  name: text("name").notNull(),
  parentId: varchar("parent_id", { length: 64 }), // self-FK, see relations below
  alignment: factionAlignment("alignment").notNull().default("neutral"),
  // 'tone' from the prototype: imperial / chaos / arcane / butcher / shadow ...
  // Keep as free string so designers can add new tones without a migration.
  tone: text("tone"),
  glyph: text("glyph"), // SVG component identifier or icon slug
});

export const series = pgTable("series", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  totalPlanned: integer("total_planned"), // canon length, may differ from #books we have
  note: text("note"),
});

// =============================================================================
// CORE: Books
// =============================================================================

export const books = pgTable(
  "books",
  {
    // UUID rather than a slug so renames don't break links from other tables.
    id: uuid("id").primaryKey().defaultRandom(),

    // Public-facing slug for /buch/[slug] URLs. Generated from title.
    slug: varchar("slug", { length: 200 }).notNull().unique(),

    // Display data
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    author: text("author").notNull(),
    pubYear: integer("pub_year"), // real-world publication year
    coverUrl: text("cover_url"),

    // In-universe timing (custom M-scale)
    startY: numeric("start_y", { precision: 10, scale: 3 }),
    endY: numeric("end_y", { precision: 10, scale: 3 }),

    // Editorial copy
    synopsis: text("synopsis"),

    // Series membership: a book belongs to AT MOST one series at a time.
    // For multi-series anchors (e.g. omnibuses), use the future `series_membership`
    // join table — left out for now to keep the schema flat.
    seriesId: varchar("series_id", { length: 64 }),
    seriesIndex: integer("series_index"), // 1-based position inside the series

    // External links / canonical IDs
    goodreadsUrl: text("goodreads_url"),
    lexicanumUrl: text("lexicanum_url"),
    blackLibraryUrl: text("black_library_url"),
    isbn13: varchar("isbn13", { length: 13 }),

    // Provenance — who/what told us about this row
    sourceKind: sourceKind("source_kind").notNull().default("manual"),
    confidence: numeric("confidence", { precision: 3, scale: 2 }).default("1.00"), // 0.00–1.00

    // Free-form extras the scrapers may discover (length, narrator, awards, ...)
    extras: jsonb("extras").$type<Record<string, unknown>>(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    // We sort and filter by in-universe start year a LOT (timeline view).
    startYIdx: index("books_start_y_idx").on(t.startY),
    seriesIdx: index("books_series_idx").on(t.seriesId, t.seriesIndex),
  }),
);

// =============================================================================
// MAP: Sectors, Locations
// =============================================================================

export const sectors = pgTable("sectors", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  color: text("color"), // semantic color token: 'gold' | 'amber' | 'lum' | ...
  tone: text("tone"),
  labelX: integer("label_x"), // SVG label position in 1000x640 viewBox
  labelY: integer("label_y"),
});

export const locations = pgTable(
  "locations",
  {
    id: varchar("id", { length: 64 }).primaryKey(), // 'cadia', 'eye_of_terror'
    name: text("name").notNull(),
    sectorId: varchar("sector_id", { length: 64 }).references(() => sectors.id),
    // Coordinates in the canon SVG viewBox (1000x640). Galactic center at (500,320).
    gx: integer("gx").notNull(),
    gy: integer("gy").notNull(),
    capital: boolean("capital").default(false),
    // True for warp-anomalies (Eye of Terror, Maelstrom, Cicatrix Maledictum)
    warp: boolean("warp").default(false),
    lexicanumUrl: text("lexicanum_url"),
    // Tags used by the prototype for visual grouping ('chaos', 'cadia', ...)
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
  id: varchar("id", { length: 64 }).primaryKey(), // 'horus', 'kelbor_hal'
  name: text("name").notNull(),
  // Primary faction allegiance — soft FK, characters can appear with rivals.
  primaryFactionId: varchar("primary_faction_id", { length: 64 }),
  lexicanumUrl: text("lexicanum_url"),
  notes: text("notes"),
});

// =============================================================================
// JOIN TABLES
// (book ↔ faction, book ↔ character, book ↔ location)
// =============================================================================

export const bookFactions = pgTable(
  "book_factions",
  {
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    factionId: varchar("faction_id", { length: 64 })
      .notNull()
      .references(() => factions.id),
    // 'primary' = main POV faction in this book; rest are 'supporting' / 'antagonist'.
    role: varchar("role", { length: 32 }).default("supporting"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.bookId, t.factionId] }),
  }),
);

export const bookCharacters = pgTable(
  "book_characters",
  {
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    characterId: varchar("character_id", { length: 64 })
      .notNull()
      .references(() => characters.id),
    role: varchar("role", { length: 32 }).default("appears"), // 'pov' | 'appears' | 'mentioned'
  },
  (t) => ({
    pk: primaryKey({ columns: [t.bookId, t.characterId] }),
  }),
);

export const bookLocations = pgTable(
  "book_locations",
  {
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    locationId: varchar("location_id", { length: 64 })
      .notNull()
      .references(() => locations.id),
    // Optional: when in the book does it happen? Lets the map filter by time.
    atY: numeric("at_y", { precision: 10, scale: 3 }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.bookId, t.locationId] }),
  }),
);

// =============================================================================
// COMMUNITY: Submissions
// (User-suggested books, chapters, locations — never auto-merged)
// =============================================================================

export const submissions = pgTable("submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  // What kind of thing is being suggested
  entityType: varchar("entity_type", { length: 32 }).notNull(), // 'book' | 'chapter' | 'location' | 'correction'
  // Free-form payload — mirror the corresponding table's columns where possible.
  payload: jsonb("payload").notNull(),
  // Optional: link to existing entity if this is a correction
  targetEntityId: text("target_entity_id"),
  // Submitter (anonymous OK; if logged in, supabase auth user id)
  submittedBy: text("submitted_by"), // 'anon-XXX' or auth user uuid
  submitterEmail: text("submitter_email"),
  submitterNote: text("submitter_note"),
  status: submissionStatus("status").notNull().default("pending"),
  // Audit trail
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewNote: text("review_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// =============================================================================
// RELATIONS (used by Drizzle's relational queries)
// =============================================================================

export const factionsRelations = relations(factions, ({ one, many }) => ({
  parent: one(factions, {
    fields: [factions.parentId],
    references: [factions.id],
    relationName: "faction_parent",
  }),
  children: many(factions, { relationName: "faction_parent" }),
  books: many(bookFactions),
}));

export const seriesRelations = relations(series, ({ many }) => ({
  books: many(books),
}));

export const booksRelations = relations(books, ({ one, many }) => ({
  series: one(series, {
    fields: [books.seriesId],
    references: [series.id],
  }),
  factions: many(bookFactions),
  characters: many(bookCharacters),
  locations: many(bookLocations),
}));

export const sectorsRelations = relations(sectors, ({ many }) => ({
  locations: many(locations),
}));

export const locationsRelations = relations(locations, ({ one, many }) => ({
  sector: one(sectors, {
    fields: [locations.sectorId],
    references: [sectors.id],
  }),
  books: many(bookLocations),
}));

export const charactersRelations = relations(characters, ({ many }) => ({
  books: many(bookCharacters),
}));

export const bookFactionsRelations = relations(bookFactions, ({ one }) => ({
  book: one(books, { fields: [bookFactions.bookId], references: [books.id] }),
  faction: one(factions, { fields: [bookFactions.factionId], references: [factions.id] }),
}));

export const bookCharactersRelations = relations(bookCharacters, ({ one }) => ({
  book: one(books, { fields: [bookCharacters.bookId], references: [books.id] }),
  character: one(characters, { fields: [bookCharacters.characterId], references: [characters.id] }),
}));

export const bookLocationsRelations = relations(bookLocations, ({ one }) => ({
  book: one(books, { fields: [bookLocations.bookId], references: [books.id] }),
  location: one(locations, { fields: [bookLocations.locationId], references: [locations.id] }),
}));
