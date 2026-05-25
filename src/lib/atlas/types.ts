/**
 * Atlas type contracts (Task 2 — Atlas-Brücke).
 *
 * `DeckId` is the closed union of the 12 admin decks; the route slug under
 * `/atlas/[entity]` is identical to the id. `DeckMeta` is the registry shape
 * in `decks.ts`; `DeckStats` is what `queries.ts` returns to the Brücke page;
 * `AtlasRow` is the generic per-row shape that the listing pages render.
 */

export type DeckId =
  | "werke"
  | "fraktionen"
  | "charaktere"
  | "welten"
  | "sektoren"
  | "aeren"
  | "serien"
  | "personen"
  | "submissions"
  | "facets"
  | "services"
  | "junctions";

export type DeckAccent = "cyan" | "gold" | "blood";

export type DeckPhase = 1 | 2;

export interface DeckMeta {
  id: DeckId;
  label: string;
  route: `/atlas/${DeckId}`;
  accent: DeckAccent;
  phase: DeckPhase;
  blurb: string;
  publicDetailPattern?: string;
}

export interface DeckPrimaryStat {
  label: string;
  value: string;
}

export interface DeckStats {
  rowCount: number;
  lastUpdated: Date | null;
  primaryStat: DeckPrimaryStat;
}

export type BridgeStats = Record<DeckId, DeckStats>;

export interface AtlasRowProvenance {
  sourceKind: string;
  confidence: number | null;
}

export interface AtlasRow {
  id: string;
  name: string;
  slug?: string;
  href?: string;
  updatedAt?: Date | null;
  provenance?: AtlasRowProvenance;
  counts: Record<string, number>;
  extras?: Record<string, string | number | null>;
}
