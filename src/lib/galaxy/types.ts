// Galaxy types — shared across the Cartographer port.
// Coordinate system: polar with r ∈ [0, 1.6], aDeg ∈ (-180, 180], 0° = galactic-north, CW positive.
// SVG viewBox is always 0 0 100 100; polar(r, a) maps into that space.

export type SegmentumId =
  | "solar"
  | "obscurus"
  | "ultima"
  | "tempestus"
  | "pacificus";

export type EraId = "m31-horus-heresy" | "m41-imperium" | "m42-indomitus";

export type Faction =
  | "imperium"
  | "chaos"
  | "xenos"
  | "necron"
  | "tyranid"
  | "neutral";

export type WorldKind =
  | "throne"
  | "astartes"
  | "fortress"
  | "forge"
  | "hive"
  | "death"
  | "war"
  | "dead"
  | "warp"
  | "shrine"
  | "civilised"
  | "xenos"
  | "chaos"
  | "necron"
  | "tyranid";

export type Polar = readonly [number, number];

export interface Segmentum {
  id: SegmentumId;
  name: string;
  short: string;
  inner: number;
  outer: number;
  a0: number;
  a1: number;
  color: string;
  lore: string;
}

export interface Book {
  title: string;
  author: string;
  tag: string;
  setting?: string;
}

export interface WorldEvent {
  era: string;
  text: string;
}

export interface World {
  id: string;
  name: string;
  r: number;
  a: number;
  kind: WorldKind;
  faction: Faction;
  segment?: SegmentumId;
  type: string;
  blurb: string;
  books: Book[];
  events: WorldEvent[];
}

export interface Landmark {
  id: string;
  name: string;
  r: number;
  a: number;
  kind: WorldKind;
  faction: Faction;
  segment: SegmentumId;
}

export interface Nebula {
  name: string;
  r?: number;
  a?: number;
  size?: number;
  type?: "warp" | "forbidden";
  color: string;
  isRift?: boolean;
}

export interface SubSector {
  name: string;
  seg: SegmentumId;
  r0: number;
  r1: number;
  a0: number;
  a1: number;
}

export interface NecronDynasty {
  id: string;
  name: string;
  color: string;
  density: "high" | "mid" | "low";
  pts: Polar[];
}

export interface TyranidSwarm {
  id: string;
  name: string;
  color: string;
  density: "high" | "mid" | "low";
  pts: Polar[];
}

// Per-era snapshot of the (editable) data layers. Slice 1+2 reads them
// straight; Slice 5 will mutate via the reducer.
export interface GalaxyData {
  landmarks: Landmark[];
  nebulae: Nebula[];
  cicatrix: Polar[];
  necron: NecronDynasty[];
  tyranid: TyranidSwarm[];
}

export type RiftPattern =
  | "strict-square"
  | "strict-square-dense"
  | "strict-brick"
  | "triangular"
  | "mega-dense";

export type FactionFilter = "all" | "imperium" | "chaos" | "xenos";

export type ThemeId = "mechanicus" | "astropath";

export interface Tweaks {
  theme: ThemeId;
  factionFilter: FactionFilter;
  riftPattern: RiftPattern;
  astronomican: boolean;
  editWarps: boolean;
  addMode: boolean;
  outerObscurus: number;
  outerUltima: number;
  outerTempestus: number;
  outerPacificus: number;
  boundaryNE: number;
  boundarySE: number;
  boundarySW: number;
  boundaryNW: number;
}

export interface Theme {
  id: ThemeId;
  label: string;
  sub: string;
  bg0: string;
  bg1: string;
  vignette: string;
  primary: string;
  primaryDim: string;
  primarySoft: string;
  accent: string;
  danger: string;
  stroke: string;
  strokeFaint: string;
  grid: string;
  fontDisplay: string;
  fontBody: string;
  fontMono: string;
  letterTitle: string;
  scanlineOpacity: number;
  cornerStyle: "tech" | "rune" | "gothic";
  starColor: string;
  starHot: string;
  discFill: string;
}

export interface Era {
  id: EraId;
  code: string;
  name: string;
  sub: string;
  accent: string;
  blurb: string;
  comingSoon?: boolean;
}

export interface BgStar {
  r: number;
  a: number;
  faction: Faction;
  size: number;
  segId: SegmentumId | "halo";
  bright: boolean;
  armBias: number;
  twinkle: number;
  delay: number;
}

export interface BackgroundStarSet {
  stars: BgStar[];
  halo: BgStar[];
}

// A view is either the full galaxy or a single segmentum (after dive).
export type GalaxyView = "galaxy" | SegmentumId;

// URL-hash slice that owners can read/write through `share.ts`.
export interface HashPatch {
  era?: EraId | null;
  view?: GalaxyView | null;
  world?: string | null;
}

// ─── Editor (Slice 5) types ─────────────────────────────────────────────────

// Which element collection a handle is editing. Maps to GalaxyData keys.
export type EditKind = "cicatrix" | "necron" | "tyranid" | "landmark" | "nebula";

// Discriminated selection. `idx` is the array index in the matching GalaxyData
// list; `idx2` is the inner point index for `necron`/`tyranid` polyline points.
export interface EditSelection {
  kind: EditKind;
  idx: number;
  idx2?: number;
}

// AddElement panel — what kind of new entity the user is placing.
export type AddElementTypeId =
  | "planet-imperium"
  | "planet-chaos"
  | "planet-xenos"
  | "planet-necron"
  | "planet-tyranid"
  | "zone-warp"
  | "zone-necron"
  | "zone-tyranid";

export type AddModePhase = "idle" | "pick" | "place" | "review";

export interface AddModeForm {
  name: string;
  kind: WorldKind;
  size: number; // for zone-warp
}

export interface AddModeState {
  phase: AddModePhase;
  typeId: AddElementTypeId;
  form: AddModeForm;
  pts: Polar[];
}
