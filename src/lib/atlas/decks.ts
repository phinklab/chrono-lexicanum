/**
 * Atlas deck registry (Task 2 — Atlas-Brücke).
 *
 * The 12 admin decks. Order = display order on the Bridge. The slug after
 * `/atlas/` matches the `id`. `accent` colour-codes the deck on the card
 * (cyan = lore-canonical / catalogues; gold = editorial scaffolding; blood
 * = audit-only / phase 2). `phase` marks decks that are stubbed in Task 2
 * and filled by later slices; `junctions` is the lone phase-2 deck.
 */
import type { DeckId, DeckMeta } from "./types";

export const DECKS: ReadonlyArray<DeckMeta> = [
  {
    id: "werke",
    label: "WORKS",
    route: "/atlas/werke",
    accent: "cyan",
    phase: 1,
    blurb: "Books, films, channels — the central work node.",
    publicDetailPattern: "/buch/[slug]",
  },
  {
    id: "fraktionen",
    label: "FACTIONS",
    route: "/atlas/fraktionen",
    accent: "gold",
    phase: 1,
    blurb: "Imperium · Chaos · Xenos · Neutral — canonical allegiances.",
    publicDetailPattern: "/fraktion/[id]",
  },
  {
    id: "charaktere",
    label: "CHARACTERS",
    route: "/atlas/charaktere",
    accent: "cyan",
    phase: 1,
    blurb: "Personae across the work corpus.",
    publicDetailPattern: "/charakter/[id]",
  },
  {
    id: "welten",
    label: "WORLDS",
    route: "/atlas/welten",
    accent: "cyan",
    phase: 1,
    blurb: "Settings · stations · worlds of the galaxy.",
    publicDetailPattern: "/welt/[id]",
  },
  {
    id: "sektoren",
    label: "SECTORS",
    route: "/atlas/sektoren",
    accent: "gold",
    phase: 1,
    blurb: "Cartographer scaffolding: segmenta and sectors.",
  },
  {
    id: "aeren",
    label: "ERAS",
    route: "/atlas/aeren",
    accent: "gold",
    phase: 1,
    blurb: "Editorial anchors M30 – M42.",
  },
  {
    id: "serien",
    label: "SERIES",
    route: "/atlas/serien",
    accent: "cyan",
    phase: 1,
    blurb: "Book series · Heresy · anthologies · omnibus runs.",
  },
  {
    id: "personen",
    label: "PEOPLE",
    route: "/atlas/personen",
    accent: "cyan",
    phase: 1,
    blurb: "Authors · narrators · editors · artists.",
  },
  {
    id: "submissions",
    label: "SUBMISSIONS",
    route: "/atlas/submissions",
    accent: "gold",
    phase: 1,
    blurb: "Community submissions, moderation queue.",
  },
  {
    id: "facets",
    label: "FACETS",
    route: "/atlas/facets",
    accent: "cyan",
    phase: 1,
    blurb: "12 categories · NEON-14 + editorial facets.",
  },
  {
    id: "services",
    label: "SERVICES",
    route: "/atlas/services",
    accent: "cyan",
    phase: 1,
    blurb: "External storefronts and reference links.",
  },
  {
    id: "junctions",
    label: "JUNCTIONS",
    route: "/atlas/junctions",
    accent: "blood",
    phase: 2,
    blurb: "Audit-trail browser · drift · junction gaps.",
  },
] as const;

const DECK_BY_ID: Record<DeckId, DeckMeta> = Object.fromEntries(
  DECKS.map((d) => [d.id, d]),
) as Record<DeckId, DeckMeta>;

export function findDeck(id: string): DeckMeta | null {
  if (id in DECK_BY_ID) return DECK_BY_ID[id as DeckId];
  return null;
}

export const DECK_IDS: ReadonlyArray<DeckId> = DECKS.map((d) => d.id);
