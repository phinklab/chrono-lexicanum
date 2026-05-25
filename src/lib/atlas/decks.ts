/**
 * Atlas deck registry (Task 2 — Atlas-Brücke).
 *
 * The 12 admin decks. Order = display order on the Brücke. The slug after
 * `/atlas/` matches the `id`. `accent` colour-codes the deck on the card
 * (cyan = lore-canonical / catalogues; gold = editorial scaffolding; blood
 * = audit-only / phase 2). `phase` marks decks that are stubbed in Task 2
 * and filled by later slices; `junctions` is the lone phase-2 deck.
 */
import type { DeckId, DeckMeta } from "./types";

export const DECKS: ReadonlyArray<DeckMeta> = [
  {
    id: "werke",
    label: "WERKE",
    route: "/atlas/werke",
    accent: "cyan",
    phase: 1,
    blurb: "Bücher, Filme, Channels — der zentrale Werk-Knoten.",
    publicDetailPattern: "/buch/[slug]",
  },
  {
    id: "fraktionen",
    label: "FRAKTIONEN",
    route: "/atlas/fraktionen",
    accent: "gold",
    phase: 1,
    blurb: "Imperium · Chaos · Xenos · Neutral — kanonische Allegianzen.",
    publicDetailPattern: "/fraktion/[id]",
  },
  {
    id: "charaktere",
    label: "CHARAKTERE",
    route: "/atlas/charaktere",
    accent: "cyan",
    phase: 1,
    blurb: "Personae quer durch das Werkkorpus.",
    publicDetailPattern: "/charakter/[id]",
  },
  {
    id: "welten",
    label: "WELTEN",
    route: "/atlas/welten",
    accent: "cyan",
    phase: 1,
    blurb: "Schauplätze · Stationen · Welten der Galaxis.",
    publicDetailPattern: "/welt/[id]",
  },
  {
    id: "sektoren",
    label: "SEKTOREN",
    route: "/atlas/sektoren",
    accent: "gold",
    phase: 1,
    blurb: "Cartographer-Gerüst: Segmenta und Sektoren.",
  },
  {
    id: "aeren",
    label: "ÄREN",
    route: "/atlas/aeren",
    accent: "gold",
    phase: 1,
    blurb: "Editoriale Anker M30 – M42.",
  },
  {
    id: "serien",
    label: "SERIEN",
    route: "/atlas/serien",
    accent: "cyan",
    phase: 1,
    blurb: "Buchreihen · Heresy · Anthologien · Omnibus-Folgen.",
  },
  {
    id: "personen",
    label: "PERSONEN",
    route: "/atlas/personen",
    accent: "cyan",
    phase: 1,
    blurb: "Autoren · Sprecher · Editoren · Künstler.",
  },
  {
    id: "submissions",
    label: "SUBMISSIONS",
    route: "/atlas/submissions",
    accent: "gold",
    phase: 1,
    blurb: "Community-Einsendungen, Moderations-Queue.",
  },
  {
    id: "facets",
    label: "FACETTEN",
    route: "/atlas/facets",
    accent: "cyan",
    phase: 1,
    blurb: "12 Kategorien · NEON-14 + editorische Facetten.",
  },
  {
    id: "services",
    label: "SERVICES",
    route: "/atlas/services",
    accent: "cyan",
    phase: 1,
    blurb: "Externe Storefronts und Verweis-Links.",
  },
  {
    id: "junctions",
    label: "JUNKTIONEN",
    route: "/atlas/junctions",
    accent: "blood",
    phase: 2,
    blurb: "Audit-Trail-Browser · Drift · Junction-Lücken.",
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
