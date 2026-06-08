/**
 * Entity-graph data layer — Brief 109, Step 1. SERVER-ONLY (imports `@/db`).
 *
 * Two entry points, both reused unchanged by later arc steps:
 *   - `listEntityIds(type)` feeds `generateStaticParams` (one lean id select).
 *   - `loadEntity(type, id)` returns the frame-agnostic `EntityView` (or null
 *     for a missing / unloadable id → the page calls `notFound()`). Wrapped in
 *     React `cache()` so a route's `generateMetadata` + default export dedupe to
 *     a single DB fan-out per request; Step 2's panel imports the same function.
 *
 * The whole `loadEntity` body is wrapped in try/catch → `null` so one flaky row
 * degrades to a 404 instead of failing `next build` (the atlas pattern,
 * `src/lib/atlas/queries.ts`). Reverse-junction works carry everything off
 * `works` itself (slug/kind/coverUrl/releaseYear) — no `book_details` join
 * needed. Per-page fan-out is ≤4 queries in one `Promise.all`, well under the
 * `max:5` pooler cap (`src/db/client.ts`).
 *
 * Brief 129 (Compendium) widens the contract: `person` becomes a fourth entity
 * type (authors), and `works.kind` now spans podcasts. A podcast episode has no
 * detail route, so `buildWorkGroups` resolves each episode → its parent show
 * (slug for the link target, title for card context) in one batched query and
 * stuffs the resolved `href`/`showTitle` onto the `WorkRef` — the view stays
 * dumb (it just renders `href` or an inert card).
 */
import { cache } from "react";
import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db/client";
import {
  characters as charactersTable,
  factions as factionsTable,
  locations as locationsTable,
  persons as personsTable,
  podcastEpisodeDetails as podcastEpisodeDetailsTable,
  sectors as sectorsTable,
  workCharacters as workCharactersTable,
  workFactions as workFactionsTable,
  workLocations as workLocationsTable,
  workPersons as workPersonsTable,
  works as worksTable,
} from "@/db/schema";
import {
  type CrossLinkGroup,
  type EntityRef,
  type EntityType,
  type EntityView,
  type FactRow,
  type WorkGroup,
  type WorkRef,
  kindLabel,
} from "./types";

/** Stable display order for work-kind groups (mirrors the `work_kind` enum). */
const KIND_ORDER = [
  "book",
  "podcast_episode",
  "podcast",
  "film",
  "tv_series",
  "channel",
  "video",
];

/** Per-type default junction role — suppressed in the UI (see `WorkRef.role`). */
const DEFAULT_WORK_ROLE: Record<EntityType, string> = {
  character: "appears",
  faction: "supporting",
  location: "secondary",
  // The page already IS the author's; "author" is the expected role and reads
  // as noise. Other roles (editor, translator, …) survive `mergePersonWorks`.
  person: "author",
};

const ALIGNMENT_LABELS: Record<string, string> = {
  imperium: "Imperium",
  chaos: "Chaos",
  xenos: "Xenos",
  neutral: "Neutral",
};

/** `person_role` enum → human label for the work-card role annotation. */
const PERSON_ROLE_LABELS: Record<string, string> = {
  author: "Author",
  co_author: "Co-author",
  translator: "Translator",
  editor: "Editor",
  narrator: "Narrator",
  co_narrator: "Co-narrator",
  full_cast: "Full cast",
  director: "Director",
  co_director: "Co-director",
  cover_artist: "Cover artist",
  sound_designer: "Sound designer",
};

/** Author-first order for a person's multiple roles on one work. */
const PERSON_ROLE_ORDER = [
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
];

/** Cap on multi-item cross-link groups (key characters / sibling worlds). */
const CROSSLINK_CAP = 40;

type RelatedWorkRow = {
  id: string;
  slug: string;
  title: string;
  kind: string;
  releaseYear: number | null;
  coverUrl: string | null;
  role: string | null;
};

/** Per-kind public route, or null when the kind has no detail surface yet. */
function workHref(
  kind: string,
  slug: string,
  showSlug: string | null,
  workId: string,
): string | null {
  switch (kind) {
    case "book":
      return `/buch/${slug}`;
    case "podcast":
      return `/podcasts/${slug}`;
    case "podcast_episode":
      // Episodes have no own page — deep-link into the parent show's archive,
      // targeting this episode by work id (`#ep-<id>`). The archive island
      // expands that episode's year, scrolls it into view and highlights it.
      return showSlug ? `/podcasts/${showSlug}#ep-${workId}` : null;
    default:
      return null;
  }
}

/**
 * Batch episode-work-id → parent show {slug,title}. One query for the whole
 * page; empty input short-circuits (no pointless `WHERE id IN ()`).
 */
async function resolveEpisodeShows(
  episodeIds: string[],
): Promise<Map<string, { slug: string; title: string }>> {
  const map = new Map<string, { slug: string; title: string }>();
  if (episodeIds.length === 0) return map;
  const showWorks = alias(worksTable, "show_works");
  const rows = await db
    .select({
      episodeId: podcastEpisodeDetailsTable.workId,
      slug: showWorks.slug,
      title: showWorks.title,
    })
    .from(podcastEpisodeDetailsTable)
    .innerJoin(
      showWorks,
      eq(showWorks.id, podcastEpisodeDetailsTable.podcastWorkId),
    )
    .where(inArray(podcastEpisodeDetailsTable.workId, episodeIds));
  for (const r of rows) map.set(r.episodeId, { slug: r.slug, title: r.title });
  return map;
}

function sortWorks(works: WorkRef[]): WorkRef[] {
  return [...works].sort((a, b) => {
    if (a.releaseYear == null && b.releaseYear != null) return 1;
    if (a.releaseYear != null && b.releaseYear == null) return -1;
    if (
      a.releaseYear != null &&
      b.releaseYear != null &&
      a.releaseYear !== b.releaseYear
    ) {
      return a.releaseYear - b.releaseYear;
    }
    return a.title.localeCompare(b.title);
  });
}

/**
 * Group reverse-junction rows by `work.kind`, nulling the default role and
 * resolving each work's link target. Async because podcast episodes need a
 * batched show lookup (see `resolveEpisodeShows`).
 */
async function buildWorkGroups(
  rows: RelatedWorkRow[],
  type: EntityType,
): Promise<WorkGroup[]> {
  const defaultRole = DEFAULT_WORK_ROLE[type];
  const shows = await resolveEpisodeShows(
    rows.filter((r) => r.kind === "podcast_episode").map((r) => r.id),
  );

  const byKind = new Map<string, WorkRef[]>();
  for (const r of rows) {
    const show = shows.get(r.id);
    const ref: WorkRef = {
      slug: r.slug,
      title: r.title,
      kind: r.kind,
      releaseYear: r.releaseYear,
      coverUrl: r.coverUrl,
      role: r.role && r.role !== defaultRole ? r.role : null,
      href: workHref(r.kind, r.slug, show?.slug ?? null, r.id),
      showTitle: show?.title ?? null,
    };
    const list = byKind.get(r.kind);
    if (list) list.push(ref);
    else byKind.set(r.kind, [ref]);
  }
  const groups: WorkGroup[] = [];
  for (const kind of KIND_ORDER) {
    const works = byKind.get(kind);
    if (works) {
      groups.push({ kind, label: kindLabel(kind), works: sortWorks(works) });
      byKind.delete(kind);
    }
  }
  // Any kind not in KIND_ORDER (future enum value) is appended, never dropped.
  for (const [kind, works] of byKind) {
    groups.push({ kind, label: kindLabel(kind), works: sortWorks(works) });
  }
  return groups;
}

/**
 * Collapse a person's `(work, role)` reverse-junction rows into one row per
 * work, joining the surviving roles author-first. The default "author" role is
 * dropped (the page IS the author's) — what remains (editor, translator, …) is
 * the contribution worth naming; a sole-author work ends up `role: null`.
 */
function mergePersonWorks(rows: RelatedWorkRow[]): RelatedWorkRow[] {
  const byWork = new Map<string, { base: RelatedWorkRow; roles: Set<string> }>();
  for (const r of rows) {
    const entry = byWork.get(r.id);
    if (entry) {
      if (r.role) entry.roles.add(r.role);
    } else {
      byWork.set(r.id, { base: r, roles: new Set(r.role ? [r.role] : []) });
    }
  }
  const out: RelatedWorkRow[] = [];
  for (const { base, roles } of byWork.values()) {
    const display = PERSON_ROLE_ORDER.filter(
      (role) => role !== "author" && roles.has(role),
    ).map((role) => PERSON_ROLE_LABELS[role] ?? role);
    out.push({ ...base, role: display.length > 0 ? display.join(" · ") : null });
  }
  return out;
}

// ── Per-type loaders ────────────────────────────────────────────────────────

async function loadCharacter(id: string): Promise<EntityView | null> {
  const [headRows, workRows] = await Promise.all([
    db
      .select({
        id: charactersTable.id,
        name: charactersTable.name,
        primaryFactionId: charactersTable.primaryFactionId,
        // LEFT join: primaryFactionId is NOT a real FK (schema.ts) — it can
        // dangle. A null name means "faction gone" → no dead /fraktion link.
        factionName: factionsTable.name,
      })
      .from(charactersTable)
      .leftJoin(
        factionsTable,
        eq(factionsTable.id, charactersTable.primaryFactionId),
      )
      .where(eq(charactersTable.id, id))
      .limit(1),
    db
      .select({
        id: worksTable.id,
        slug: worksTable.slug,
        title: worksTable.title,
        kind: worksTable.kind,
        releaseYear: worksTable.releaseYear,
        coverUrl: worksTable.coverUrl,
        role: workCharactersTable.role,
      })
      .from(workCharactersTable)
      .innerJoin(worksTable, eq(worksTable.id, workCharactersTable.workId))
      .where(eq(workCharactersTable.characterId, id)),
  ]);

  const row = headRows[0];
  if (!row) return null;

  const facts: FactRow[] = [];
  if (row.primaryFactionId && row.factionName) {
    facts.push({
      label: "Allegiance",
      value: { type: "faction", id: row.primaryFactionId, name: row.factionName },
    });
  }

  return {
    type: "character",
    id: row.id,
    name: row.name,
    facts,
    worksByKind: await buildWorkGroups(workRows, "character"),
    crossLinks: [],
  };
}

async function loadFaction(id: string): Promise<EntityView | null> {
  const parentFactions = alias(factionsTable, "parent_factions");
  const [headRows, workRows, children, keyCharacters] = await Promise.all([
    db
      .select({
        id: factionsTable.id,
        name: factionsTable.name,
        alignment: factionsTable.alignment,
        glyph: factionsTable.glyph,
        tone: factionsTable.tone,
        parentId: factionsTable.parentId,
        parentName: parentFactions.name,
      })
      .from(factionsTable)
      .leftJoin(parentFactions, eq(parentFactions.id, factionsTable.parentId))
      .where(eq(factionsTable.id, id))
      .limit(1),
    db
      .select({
        id: worksTable.id,
        slug: worksTable.slug,
        title: worksTable.title,
        kind: worksTable.kind,
        releaseYear: worksTable.releaseYear,
        coverUrl: worksTable.coverUrl,
        role: workFactionsTable.role,
      })
      .from(workFactionsTable)
      .innerJoin(worksTable, eq(worksTable.id, workFactionsTable.workId))
      .where(eq(workFactionsTable.factionId, id)),
    db
      .select({ id: factionsTable.id, name: factionsTable.name })
      .from(factionsTable)
      .where(eq(factionsTable.parentId, id))
      .orderBy(asc(factionsTable.name)),
    db
      .select({ id: charactersTable.id, name: charactersTable.name })
      .from(charactersTable)
      .where(eq(charactersTable.primaryFactionId, id))
      .orderBy(asc(charactersTable.name))
      .limit(CROSSLINK_CAP),
  ]);

  const row = headRows[0];
  if (!row) return null;

  const facts: FactRow[] = [
    { label: "Alignment", value: ALIGNMENT_LABELS[row.alignment] ?? row.alignment },
  ];
  if (row.glyph) facts.push({ label: "Glyph", value: row.glyph });
  // A single linked relation reads cleanly as a fact; the multi-item sets
  // (children, key characters) become cross-link groups — so no edge renders
  // twice (Brief 109's IA listed parent in both; consolidated here).
  if (row.parentId && row.parentName) {
    facts.push({
      label: "Parent faction",
      value: { type: "faction", id: row.parentId, name: row.parentName },
    });
  }

  const crossLinks: CrossLinkGroup[] = [];
  if (children.length > 0) {
    crossLinks.push({
      label: "Sub-factions",
      items: children.map(
        (c): EntityRef => ({ type: "faction", id: c.id, name: c.name }),
      ),
    });
  }
  if (keyCharacters.length > 0) {
    crossLinks.push({
      label: "Key characters",
      items: keyCharacters.map(
        (c): EntityRef => ({ type: "character", id: c.id, name: c.name }),
      ),
    });
  }

  return {
    type: "faction",
    id: row.id,
    name: row.name,
    oneLine: row.tone ?? undefined,
    facts,
    worksByKind: await buildWorkGroups(workRows, "faction"),
    crossLinks,
  };
}

async function loadLocation(id: string): Promise<EntityView | null> {
  const [headRows, workRows] = await Promise.all([
    db
      .select({
        id: locationsTable.id,
        name: locationsTable.name,
        sectorId: locationsTable.sectorId,
        sectorName: sectorsTable.name,
        gx: locationsTable.gx,
        gy: locationsTable.gy,
        capital: locationsTable.capital,
        warp: locationsTable.warp,
        tags: locationsTable.tags,
      })
      .from(locationsTable)
      .leftJoin(sectorsTable, eq(sectorsTable.id, locationsTable.sectorId))
      .where(eq(locationsTable.id, id))
      .limit(1),
    db
      .select({
        id: worksTable.id,
        slug: worksTable.slug,
        title: worksTable.title,
        kind: worksTable.kind,
        releaseYear: worksTable.releaseYear,
        coverUrl: worksTable.coverUrl,
        role: workLocationsTable.role,
      })
      .from(workLocationsTable)
      .innerJoin(worksTable, eq(worksTable.id, workLocationsTable.workId))
      .where(eq(workLocationsTable.locationId, id)),
  ]);

  const row = headRows[0];
  if (!row) return null;

  // Siblings need the resolved sectorId, so they run after the head query.
  // Sectors are not a routable entity (no /sektor route) → sector is a plain
  // string fact, never a cross-link.
  const siblings = row.sectorId
    ? await db
        .select({ id: locationsTable.id, name: locationsTable.name })
        .from(locationsTable)
        .where(
          and(
            eq(locationsTable.sectorId, row.sectorId),
            ne(locationsTable.id, id),
          ),
        )
        .orderBy(asc(locationsTable.name))
        .limit(CROSSLINK_CAP)
    : [];

  const facts: FactRow[] = [];
  if (row.sectorName) facts.push({ label: "Sector", value: row.sectorName });
  if (row.gx != null && row.gy != null) {
    facts.push({ label: "Cartographer grid", value: `gx ${row.gx} · gy ${row.gy}` });
  }
  if (row.capital) facts.push({ label: "Designation", value: "Sector capital" });
  if (row.warp) facts.push({ label: "Warp", value: "Warp anomaly" });

  const crossLinks: CrossLinkGroup[] = [];
  if (siblings.length > 0) {
    crossLinks.push({
      label: "Other worlds in sector",
      items: siblings.map(
        (s): EntityRef => ({ type: "location", id: s.id, name: s.name }),
      ),
    });
  }

  return {
    type: "location",
    id: row.id,
    name: row.name,
    facts,
    tags: row.tags && row.tags.length > 0 ? row.tags : undefined,
    worksByKind: await buildWorkGroups(workRows, "location"),
    crossLinks,
  };
}

async function loadPerson(id: string): Promise<EntityView | null> {
  const [headRows, workRows] = await Promise.all([
    db
      .select({
        id: personsTable.id,
        name: personsTable.name,
        bio: personsTable.bio,
        birthYear: personsTable.birthYear,
      })
      .from(personsTable)
      .where(eq(personsTable.id, id))
      .limit(1),
    db
      .select({
        id: worksTable.id,
        slug: worksTable.slug,
        title: worksTable.title,
        kind: worksTable.kind,
        releaseYear: worksTable.releaseYear,
        coverUrl: worksTable.coverUrl,
        // A person can hold several roles on one work (author + editor); the
        // select returns one row per (work, role) — `mergePersonWorks` folds
        // them into one row per work.
        role: workPersonsTable.role,
      })
      .from(workPersonsTable)
      .innerJoin(worksTable, eq(worksTable.id, workPersonsTable.workId))
      .where(eq(workPersonsTable.personId, id)),
  ]);

  const row = headRows[0];
  if (!row) return null;

  const facts: FactRow[] = [];
  if (row.birthYear != null) {
    facts.push({ label: "Born", value: String(row.birthYear) });
  }

  return {
    type: "person",
    id: row.id,
    name: row.name,
    // The bio is the tagline; persons carry no extra label-less meta line.
    oneLine: row.bio ?? undefined,
    facts,
    worksByKind: await buildWorkGroups(mergePersonWorks(workRows), "person"),
    crossLinks: [],
  };
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * All ids for one reference table, for `generateStaticParams`. The `[slug]`
 * segment IS the id. try/catch → [] so an unreachable DB at build time falls
 * back to on-demand rendering (`dynamicParams = true`) instead of a hard fail.
 */
export async function listEntityIds(type: EntityType): Promise<string[]> {
  try {
    if (type === "character") {
      const rows = await db
        .select({ id: charactersTable.id })
        .from(charactersTable);
      return rows.map((r) => r.id);
    }
    if (type === "faction") {
      const rows = await db.select({ id: factionsTable.id }).from(factionsTable);
      return rows.map((r) => r.id);
    }
    if (type === "person") {
      const rows = await db.select({ id: personsTable.id }).from(personsTable);
      return rows.map((r) => r.id);
    }
    const rows = await db.select({ id: locationsTable.id }).from(locationsTable);
    return rows.map((r) => r.id);
  } catch {
    return [];
  }
}

/**
 * Load one entity's full view payload, or null if the id is missing/unloadable.
 * `cache()`-memoised per request so metadata + page share one DB fan-out.
 */
export const loadEntity = cache(
  async (type: EntityType, id: string): Promise<EntityView | null> => {
    try {
      switch (type) {
        case "character":
          return await loadCharacter(id);
        case "faction":
          return await loadFaction(id);
        case "location":
          return await loadLocation(id);
        case "person":
          return await loadPerson(id);
      }
    } catch {
      return null;
    }
  },
);
