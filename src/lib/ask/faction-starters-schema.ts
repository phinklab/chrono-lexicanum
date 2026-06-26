/**
 * Schema + structural validation for the "One faction, one book" curation data
 * (Brief 166). PURE — no JSON import, no DB, no `fs`. Shared by:
 *
 *   - the app loader `faction-starters.ts` (imports the committed JSON, runs
 *     {@link validateFactionStarters} on it at module init), and
 *   - the convert step `scripts/import-faction-starters.ts` (validates the
 *     object it builds from the Excel before writing it).
 *
 * Keeping the validator JSON-free means the convert step can reuse it without
 * pulling in `faction-starters.json` (which it is in the middle of generating).
 *
 * The data is a two-level drilldown generated verbatim from Philipp's
 * `Warhammer_OFOC_SSOT.xlsx`. A node is a top-level faction; optional `children`
 * are subfactions (exactly ONE level deep). A node carries `picks`, `children`,
 * or both — a group node (e.g. Space Marines) carries only `children`. Labels
 * are NOT validated against `factions.json`: Philipp's input is verbatim, and
 * many subfactions have no DB faction at all.
 */

/**
 * Best-effort format hint pulled from the source title's inline markers
 * (`(Audiodrama)`, `Series`, `trilogy`, `Omnibus`, `(short story?)`). Advisory
 * only — the display title and the click target stand on their own.
 */
export type FactionStarterKind =
  | "audio-drama"
  | "audiobook"
  | "short-story"
  | "series"
  | "trilogy"
  | "omnibus";

const KIND_VALUES: ReadonlySet<string> = new Set<FactionStarterKind>([
  "audio-drama",
  "audiobook",
  "short-story",
  "series",
  "trilogy",
  "omnibus",
]);

/** A single curated entry-point. `title` is the only required field. */
export interface FactionStarterPick {
  /** Display title with format markers stripped, e.g. "Our Martyred Lady". */
  title: string;
  /**
   * Resolved book slug → click target `/buch/{slug}` (opens the book popup via
   * the existing intercepting route). Absent when the convert step could not
   * resolve the title with confidence — the pick still renders, without a link.
   */
  book?: string;
  /** Optional author credit (not derived from this Excel; reserved for overrides). */
  author?: string;
  /** Best-effort format hint from the source title. */
  kind?: FactionStarterKind;
  /** Free-text note (residual descriptor or a flagged-uncertain format). */
  note?: string;
}

/** A faction or subfaction node. */
export interface FactionStarterNode {
  /** URL key, unique among siblings (slugified label, or an explicit override). */
  slug: string;
  /** Verbatim display label from the Excel (trimmed only). */
  label: string;
  /** Ordered picks; `picks[0]` is primary, reshuffle cycles in order. */
  picks?: FactionStarterPick[];
  /** Ordered subfaction children — exactly one level deep (no grandchildren). */
  children?: FactionStarterNode[];
}

/** Top-level shape of `scripts/seed-data/faction-starters.json`. */
export interface FactionStartersFile {
  version: number;
  _doc: string;
  /** Source Excel filename, for provenance. */
  source: string;
  /** Ordered top-level faction nodes (Excel order = display order). */
  starters: FactionStarterNode[];
}

class SchemaError extends Error {}

function fail(path: string, message: string): never {
  throw new SchemaError(`Invalid faction-starters.json at ${path}: ${message}`);
}

function asObject(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(path, "expected an object.");
  }
  return value as Record<string, unknown>;
}

function asNonEmptyString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    fail(path, "expected a non-empty string.");
  }
  return value;
}

function validatePick(value: unknown, path: string): FactionStarterPick {
  const obj = asObject(value, path);
  const pick: FactionStarterPick = {
    title: asNonEmptyString(obj.title, `${path}.title`),
  };
  if (obj.book !== undefined) {
    pick.book = asNonEmptyString(obj.book, `${path}.book`);
  }
  if (obj.author !== undefined) {
    pick.author = asNonEmptyString(obj.author, `${path}.author`);
  }
  if (obj.kind !== undefined) {
    if (typeof obj.kind !== "string" || !KIND_VALUES.has(obj.kind)) {
      fail(`${path}.kind`, `must be one of ${[...KIND_VALUES].join(", ")}.`);
    }
    pick.kind = obj.kind as FactionStarterKind;
  }
  if (obj.note !== undefined) {
    pick.note = asNonEmptyString(obj.note, `${path}.note`);
  }
  return pick;
}

function validateNode(
  value: unknown,
  path: string,
  depth: number,
  siblingSlugs: Set<string>,
): FactionStarterNode {
  const obj = asObject(value, path);
  const label = asNonEmptyString(obj.label, `${path}.label`);
  const slug = asNonEmptyString(obj.slug, `${path}.slug`);
  if (siblingSlugs.has(slug)) {
    fail(`${path}.slug`, `duplicate sibling slug "${slug}".`);
  }
  siblingSlugs.add(slug);

  const node: FactionStarterNode = { slug, label };

  let pickCount = 0;
  if (obj.picks !== undefined) {
    if (!Array.isArray(obj.picks)) fail(`${path}.picks`, "must be an array.");
    node.picks = obj.picks.map((p, i) => validatePick(p, `${path}.picks[${i}]`));
    pickCount = node.picks.length;
  }

  let childCount = 0;
  if (obj.children !== undefined) {
    if (!Array.isArray(obj.children)) fail(`${path}.children`, "must be an array.");
    if (depth >= 1) {
      fail(`${path}.children`, "drilldown is exactly one level deep (no grandchildren).");
    }
    const childSlugs = new Set<string>();
    node.children = obj.children.map((c, i) =>
      validateNode(c, `${path}.children[${i}]`, depth + 1, childSlugs),
    );
    childCount = node.children.length;
  }

  // Structural rule: each node carries label + (>=1 pick with title OR >=1 child).
  if (pickCount === 0 && childCount === 0) {
    fail(path, `node "${label}" must have at least one pick or one child.`);
  }

  return node;
}

/** Validate an arbitrary value as a {@link FactionStartersFile}; throws on any defect. */
export function validateFactionStarters(value: unknown): FactionStartersFile {
  const root = asObject(value, "<root>");
  if (typeof root.version !== "number") {
    fail("version", "must be a number.");
  }
  if (typeof root._doc !== "string") {
    fail("_doc", "must be a string.");
  }
  const source = asNonEmptyString(root.source, "source");
  if (!Array.isArray(root.starters)) {
    fail("starters", "must be an array.");
  }
  if (root.starters.length === 0) {
    fail("starters", "must have at least one faction node.");
  }
  const topSlugs = new Set<string>();
  const starters = root.starters.map((node, i) =>
    validateNode(node, `starters[${i}]`, 0, topSlugs),
  );
  return { version: root.version, _doc: root._doc, source, starters };
}

// ---- Pure lookups (shared by the route + tests) ------------------------------

/** True when the node leads with at least one pick (a leaf or a both-node). */
export function nodeHasPicks(node: FactionStarterNode): boolean {
  return (node.picks?.length ?? 0) > 0;
}

/** True when the node is a pure group (only children, no own picks). */
export function isGroupNode(node: FactionStarterNode): boolean {
  return !nodeHasPicks(node) && (node.children?.length ?? 0) > 0;
}

/** Find a top-level faction node by slug. */
export function findFaction(
  file: FactionStartersFile,
  factionSlug: string,
): FactionStarterNode | null {
  return file.starters.find((n) => n.slug === factionSlug) ?? null;
}

/** Find a subfaction child by slug within a parent node. */
export function findSubfaction(
  parent: FactionStarterNode,
  subSlug: string,
): FactionStarterNode | null {
  return parent.children?.find((n) => n.slug === subSlug) ?? null;
}
