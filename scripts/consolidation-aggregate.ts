/**
 * consolidation-aggregate.ts — Dubletten-Kandidaten-Aggregator für den
 * Konsolidierungs-Pass (Brief 098, Teil 2 Schritt 1; Brief 102 § HH-aware
 * Aggregator-Signale).
 *
 * Liest die Reference-JSONs (`factions.json` / `locations.json` /
 * `characters.json`) + die `*-aliases.json` und emittiert pro Achse eine
 * deterministische, **gefilterte** Liste von Kandidaten-Clustern — Gruppen
 * von Rows, die plausibel dieselbe Entität sein könnten. Der Aggregator
 * entscheidet NICHT — er filtert nur das Reference-Set auf die Handvoll
 * Cluster herunter, die menschliche/LLM-Adjudikation brauchen.
 *
 * Basis-Heuristiken (Pass 1, Brief 098):
 *  - Normalisierter Name-Match (lowercase + diacritics + honorific-Strip)
 *  - Token-Set-Jaccard ≥ 0.5
 *  - Substring-Relation auf normalisiertem Namen
 *  - Alias-Coincidence: Row-A-Name = bekannter Alias auf Row-B
 *  - Faction-Achs-Bonus: gleicher `parent`
 *  - Character-Achs-Bonus: gleiche `primaryFactionId`
 *
 * Pass-2-Ergänzungen (Brief 102 § HH-aware Aggregator-Signale):
 *  - (a) Slug-Edit-Distance ≤ 2 mit Ratio ≤ 0.25 auf Locations
 *  - (b) Cross-Era-Anchor-Breach-Marker (Pin-Liste von Cross-Era-Aliase, die
 *        Pass 2 als High-Priority-Suspect kennzeichnen soll wenn ein
 *        Era-Surface-Form als separate Canonical-Row auftaucht)
 *  - (c) Primarchen-Stamm-Edge für Pre-/Post-Heresy-Personae auf characters
 *
 * Keine Pairwise-Matrix im Output (980 × 980 wäre token-fatal); statt dessen
 * nur Cluster mit ≥ 2 Rows, die mindestens eine Heuristik erfüllen.
 *
 * KEIN DB-Zugriff. KEIN LLM. KEIN Netzwerk. Read-only.
 * Idempotent: byte-identisch re-runnable über dieselben Inputs.
 *
 * Usage:
 *   npx tsx scripts/consolidation-aggregate.ts [--pass N] > <output>
 *   --pass N steuert nur den Titel im Output (Default: "" → kein Pass-Suffix).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SEED = join(ROOT, "scripts", "seed-data");

interface Faction {
  id: string;
  name: string;
  parent?: string | null;
  alignment?: string;
  tone?: string | null;
  glyph?: string | null;
}

interface Location {
  id: string;
  name: string;
  sector?: string | null;
  gx?: number | null;
  gy?: number | null;
  tags?: string[];
  capital?: boolean;
  warp?: boolean;
  lexicanumUrl?: string | null;
}

interface Character {
  id: string;
  name: string;
  primaryFactionId?: string | null;
  lexicanumUrl?: string | null;
  notes?: string | null;
}

const factions = JSON.parse(
  readFileSync(join(SEED, "factions.json"), "utf8"),
) as Faction[];
const locations = JSON.parse(
  readFileSync(join(SEED, "locations.json"), "utf8"),
) as Location[];
const characters = JSON.parse(
  readFileSync(join(SEED, "characters.json"), "utf8"),
) as Character[];
const factionAliases = JSON.parse(
  readFileSync(join(SEED, "faction-aliases.json"), "utf8"),
) as Record<string, string>;
const locationAliases = JSON.parse(
  readFileSync(join(SEED, "location-aliases.json"), "utf8"),
) as Record<string, string>;
const characterAliases = JSON.parse(
  readFileSync(join(SEED, "character-aliases.json"), "utf8"),
) as Record<string, string>;

// Honorific / title prefixes per axis (lowercase, single-token).
// Stripped from the FRONT of names during normalization so that e.g.
// "Inquisitor Czevak" and "Bronislaw Czevak" can collide, but
// "Chaplain Tangata Manu" vs "Tangata Manu" can too.
const HONORIFIC_FACTION = new Set(["the", "house", "clan", "of"]);
const HONORIFIC_LOCATION = new Set(["the", "sector", "system"]);
const HONORIFIC_CHARACTER = new Set([
  "the",
  "inquisitor",
  "lord",
  "lady",
  "sister",
  "brother",
  "chaplain",
  "commander",
  "captain",
  "high",
  "magos",
  "saint",
  "sergeant",
  "lieutenant",
  "warmaster",
  "primarch",
  "archmagos",
  "colonel",
  "general",
  "major",
  "shas",
  "shas'o",
  "shas'el",
  "commissar",
  "watch",
  "watch-captain",
  "veteran",
  "first",
  "second",
  "third",
  "fourth",
  "knight-",
  "ser",
  "judge",
  "marshal",
  "abbot",
  "father",
  "mother",
  "doctor",
  "magister",
  "probator",
  "verispex",
  "fabricator",
  "scribe",
]);

// --- Pass-2 Pin-Listen (Brief 102 § HH-aware Aggregator-Signale) -----------
//
// (b) Cross-Era-Anchor-Surface-Forms: bekannte Era-Surface-Forms, die laut
// Cross-Era-ADR (brain/wiki/decisions/cross-era-identities.md) Aliase auf eine
// kanonische Identität sein sollen — NICHT separate Canonical-Rows. Wenn der
// Aggregator eine alias-name-coincidence auf einer dieser Surface-Forms sieht
// (Row-Name == Alias-Key auf eine andere Canonical-ID), markiert er die Edge
// als `cross-era-anchor-breach(<surface>)` — Cluster mit dieser Reason werden
// im Dossier als High-Priority-Suspect ausgewiesen ("Disziplin-Drift", Brief
// 100 § Cross-Era-Identitäten). Eintrag ist die ROW-NAME-LOWERCASE-Form (also
// genau die Form, die `aliasNameToTarget.get(r.name.toLowerCase())` matcht).
const CROSS_ERA_ANCHOR_SURFACE_FORMS_LOWERCASE = new Set<string>([
  // Factions (HH→W40K Renames)
  "luna wolves",
  "imperial army",
  "mechanicum",
  "adeptus mechanicum",
  // Characters (Pre-Heresy / HH-Name → W40K-Honorific)
  "ezekyle abaddon",
  "abaddon",
  "kharn",
  "khârn",
  "magister sek",
  "lucius",
  "ahriman",
  "horus lupercal",
  "calas typhon",
  "typhon",
  "corvus corax",
  "lorgar aurelian",
  "little horus aximand",
  "nassir amit",
  "alexis pollux",
  "dantioch",
  "maloghurst",
  "arvida",
  "aenoid thiel",
]);

// (c) Primarch-Stems: die endliche Liste der 18 Primarchen + ihre häufigsten
// Lore-Stems. Eine Character-Row matcht einen Stem, wenn nach Honorific-Strip
// alle Tokens des Stems in den Row-Tokens enthalten sind. Rows mit gleichem
// Stem bekommen eine Edge mit reason `primarch-stem(<stem>)` — auch wenn
// Jaccard/Substring sie bereits gefangen hätten. Der Marker steht im Dossier
// als eigenes Evidence-Tier (Cross-Era-ADR ist die Modellierungs-Grundlage).
const PRIMARCH_STEMS: string[] = [
  "horus",
  "sanguinius",
  "rogal dorn",
  "lion eljonson",
  "leman russ",
  "lorgar",
  "fulgrim",
  "perturabo",
  "corax",
  "alpharius",
  "omegon",
  "konrad curze",
  "night haunter",
  "magnus",
  "ferrus manus",
  "mortarion",
  "vulkan",
  "roboute guilliman",
  "guilliman",
  "angron",
  "jaghatai khan",
  "jaghatai",
];

// (a) Slug-Distance: Levenshtein auf normalisierten Locations-Slugs/Namen.
// Threshold-Logik: distance ≤ 2 UND distance/maxLen ≤ 0.25 UND minLen ≥ 4.
// Beispiele (Brief 102 § HH-aware Aggregator-Signale):
//   - isstvan_v ↔ istvaan_v: dist 2 / max 9 = 0.222 → ACCEPT
//   - prospero ↔ prosperan : dist 1 / max 9 = 0.111 → ACCEPT
//   - calth    ↔ caltha    : dist 1 / max 6 = 0.167 → ACCEPT
//   - vigilus  ↔ vigil     : dist 2 / max 7 = 0.286 → REJECT (Brief-Beispiel)
const SLUG_DISTANCE_MAX = 2;
const SLUG_DISTANCE_RATIO_MAX = 0.25;
const SLUG_DISTANCE_MIN_LEN = 4;

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  // Single rolling row — Wagner-Fischer, O(min(m,n)) memory.
  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j += 1) prev[j] = j;
  for (let i = 1; i <= m; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= n; j += 1) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost,
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

function stripDiacritics(s: string): string {
  return s.normalize("NFKD").replace(/[̀-ͯ]/g, "");
}

function normalizeBase(s: string): string {
  return stripDiacritics(s)
    .toLowerCase()
    .replace(/[''`’]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHonorifics(tokens: string[], honorifics: Set<string>): string[] {
  // Strip from the FRONT until we hit a non-honorific token. Conservative:
  // never strip everything (a name made entirely of honorifics is preserved).
  let i = 0;
  while (i < tokens.length - 1 && honorifics.has(tokens[i])) i += 1;
  return tokens.slice(i);
}

function tokensFor(name: string, honorifics: Set<string>): string[] {
  const base = normalizeBase(name);
  if (!base) return [];
  const tokens = base.split(" ").filter((t) => t.length > 0);
  return stripHonorifics(tokens, honorifics);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function joined(tokens: string[]): string {
  return tokens.join(" ");
}

interface RowNorm {
  id: string;
  name: string;
  tokens: string[];
  joined: string;
  // Axis-specific extra: aliasesPointingHere collected post-hoc.
  aliasesPointingHere: string[];
  // For faction: parent. For character: primaryFactionId. For location: sector.
  groupKey?: string | null;
}

function buildAliasReverse(aliases: Record<string, string>): Map<string, string[]> {
  const rev = new Map<string, string[]>();
  for (const [alias, target] of Object.entries(aliases)) {
    if (!rev.has(target)) rev.set(target, []);
    rev.get(target)!.push(alias);
  }
  for (const list of rev.values()) list.sort();
  return rev;
}

function buildRowsForAxis<T extends { id: string; name: string }>(
  rows: T[],
  honorifics: Set<string>,
  aliases: Record<string, string>,
  groupKey: (r: T) => string | null | undefined,
): RowNorm[] {
  const rev = buildAliasReverse(aliases);
  return rows.map((r) => {
    const tokens = tokensFor(r.name, honorifics);
    return {
      id: r.id,
      name: r.name,
      tokens,
      joined: joined(tokens),
      aliasesPointingHere: rev.get(r.id) ?? [],
      groupKey: groupKey(r) ?? null,
    };
  });
}

interface Edge {
  a: string;
  b: string;
  reasons: string[];
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}\t${b}` : `${b}\t${a}`;
}

function collectEdges(
  rowsNorm: RowNorm[],
  aliases: Record<string, string>,
  axisName: "faction" | "location" | "character",
): Edge[] {
  const byId = new Map(rowsNorm.map((r) => [r.id, r]));
  const aliasNameToTarget = new Map<string, string>();
  for (const [alias, target] of Object.entries(aliases)) {
    aliasNameToTarget.set(alias.toLowerCase(), target);
  }
  const edges = new Map<string, Edge>();
  const addReason = (a: string, b: string, reason: string): void => {
    if (a === b) return;
    const key = pairKey(a, b);
    if (!edges.has(key)) edges.set(key, { a: a < b ? a : b, b: a < b ? b : a, reasons: [] });
    const e = edges.get(key)!;
    if (!e.reasons.includes(reason)) e.reasons.push(reason);
  };

  // Index rows by `joined` to find exact-normalized-name collisions cheaply.
  const byJoined = new Map<string, string[]>();
  for (const r of rowsNorm) {
    if (!r.joined) continue;
    if (!byJoined.has(r.joined)) byJoined.set(r.joined, []);
    byJoined.get(r.joined)!.push(r.id);
  }
  for (const ids of byJoined.values()) {
    if (ids.length < 2) continue;
    for (let i = 0; i < ids.length; i += 1) {
      for (let j = i + 1; j < ids.length; j += 1) {
        addReason(ids[i], ids[j], "exact-normalized-name");
      }
    }
  }

  // Heuristic: Jaccard ≥ 0.5 over honorific-stripped token sets. We still pay
  // O(n²) within an axis, but n ≤ 345 (characters), so ≤ 120k pairs — fast.
  for (let i = 0; i < rowsNorm.length; i += 1) {
    const a = rowsNorm[i];
    if (a.tokens.length === 0) continue;
    const sa = new Set(a.tokens);
    for (let j = i + 1; j < rowsNorm.length; j += 1) {
      const b = rowsNorm[j];
      if (b.tokens.length === 0) continue;
      const sb = new Set(b.tokens);
      const jac = jaccard(sa, sb);
      if (jac >= 0.5) {
        addReason(a.id, b.id, `jaccard-tokens-${jac.toFixed(2)}`);
      }
      // Substring relation on joined.
      if (a.joined && b.joined && a.joined !== b.joined) {
        if (
          (a.joined.includes(b.joined) || b.joined.includes(a.joined)) &&
          Math.min(a.joined.length, b.joined.length) >= 3
        ) {
          addReason(a.id, b.id, "substring-relation");
        }
      }
    }
  }

  // Alias coincidence: row A's surface name is a known alias key — that alias
  // resolves to some target ID; pair (A, target). Filter same-axis only.
  // Brief 102 § HH-aware Aggregator-Signale (b): wenn die kollidierende Surface-
  // Form in der Cross-Era-Anchor-Pin-Liste steht, ergänzen wir den Cross-Era-
  // Anchor-Breach-Marker — das ist genau die Disziplin-Drift-Mode, gegen die
  // Brief 100's `factionsSkippedRedundant`-Selbstreport gedacht ist; der
  // Konsolidierungs-Aggregator ist die unabhängige Verifikation.
  for (const r of rowsNorm) {
    const surfaceLc = r.name.toLowerCase();
    const aliasTarget = aliasNameToTarget.get(surfaceLc);
    if (aliasTarget && aliasTarget !== r.id && byId.has(aliasTarget)) {
      addReason(r.id, aliasTarget, `alias-name-coincidence(${r.name})`);
      if (CROSS_ERA_ANCHOR_SURFACE_FORMS_LOWERCASE.has(surfaceLc)) {
        addReason(r.id, aliasTarget, `cross-era-anchor-breach(${r.name})`);
      }
    }
  }

  // Brief 102 § HH-aware Aggregator-Signale (a): Slug-Edit-Distance auf
  // normalisierten Locations-Namen (joined-Form: NFKD + lower + punct-strip +
  // honorific-strip). Threshold: distance ≤ SLUG_DISTANCE_MAX UND
  // ratio ≤ SLUG_DISTANCE_RATIO_MAX UND minLen ≥ SLUG_DISTANCE_MIN_LEN —
  // konservativ genug, dass `vigilus` ↔ `vigil` (Brief-Beispiel) explizit
  // ausgeschlossen ist, weit genug für die HH-Lore-Schreibvarianten
  // (isstvan/istvaan, calth/caltha, prospero/prosperan).
  if (axisName === "location") {
    for (let i = 0; i < rowsNorm.length; i += 1) {
      const a = rowsNorm[i];
      if (!a.joined) continue;
      for (let j = i + 1; j < rowsNorm.length; j += 1) {
        const b = rowsNorm[j];
        if (!b.joined) continue;
        if (a.joined === b.joined) continue;
        const minLen = Math.min(a.joined.length, b.joined.length);
        const maxLen = Math.max(a.joined.length, b.joined.length);
        if (minLen < SLUG_DISTANCE_MIN_LEN) continue;
        const lenDiff = maxLen - minLen;
        if (lenDiff > SLUG_DISTANCE_MAX) continue;
        const dist = levenshtein(a.joined, b.joined);
        if (dist > SLUG_DISTANCE_MAX) continue;
        if (maxLen === 0 || dist / maxLen > SLUG_DISTANCE_RATIO_MAX) continue;
        addReason(a.id, b.id, `slug-edit-distance-${dist}`);
      }
    }
  }

  // Brief 102 § HH-aware Aggregator-Signale (c): Primarchen-Pre-/Post-Heresy
  // Edge-Klasse. Eine Character-Row matcht einen Primarchen-Stem, wenn ALLE
  // Stem-Tokens (nach Normalisierung) in den Row-Tokens enthalten sind.
  // Rows mit demselben Stem bekommen eine Edge mit reason
  // `primarch-stem(<stem>)` — auch wenn Jaccard/Substring sie schon gefangen
  // hätte, der Marker steht im Dossier als eigenes Evidence-Tier
  // (Cross-Era-Identity-ADR ist die Modellierungs-Grundlage).
  if (axisName === "character") {
    const stemMatches = new Map<string, string[]>();
    for (const stem of PRIMARCH_STEMS) {
      const stemTokens = stem.split(" ");
      const matchedIds: string[] = [];
      for (const r of rowsNorm) {
        if (r.tokens.length === 0) continue;
        const rowSet = new Set(r.tokens);
        if (stemTokens.every((t) => rowSet.has(t))) matchedIds.push(r.id);
      }
      if (matchedIds.length >= 2) stemMatches.set(stem, matchedIds.sort());
    }
    for (const [stem, ids] of stemMatches) {
      for (let i = 0; i < ids.length; i += 1) {
        for (let j = i + 1; j < ids.length; j += 1) {
          addReason(ids[i], ids[j], `primarch-stem(${stem})`);
        }
      }
    }
  }

  // Per-axis bonus: same group key (parent / primaryFactionId / sector).
  // Promote the JACCARD threshold by adding this as an extra reason if both
  // share a non-null groupKey AND they already had any other reason.
  // We don't add NEW pairs from this — it's just extra evidence to surface in
  // the cluster narrative.
  for (const edge of edges.values()) {
    const a = byId.get(edge.a)!;
    const b = byId.get(edge.b)!;
    if (a.groupKey && b.groupKey && a.groupKey === b.groupKey) {
      const label =
        axisName === "faction"
          ? `shared-parent(${a.groupKey})`
          : axisName === "character"
            ? `shared-primaryFactionId(${a.groupKey})`
            : `shared-sector(${a.groupKey})`;
      if (!edge.reasons.includes(label)) edge.reasons.push(label);
    }
  }

  return Array.from(edges.values()).sort((x, y) => {
    if (x.a !== y.a) return x.a.localeCompare(y.a);
    return x.b.localeCompare(y.b);
  });
}

// Union-find on edges → clusters.
function clusterFromEdges(allIds: string[], edges: Edge[]): string[][] {
  const parent = new Map<string, string>(allIds.map((id) => [id, id]));
  const find = (x: string): string => {
    let cur = x;
    while (parent.get(cur)! !== cur) cur = parent.get(cur)!;
    let walk = x;
    while (parent.get(walk)! !== walk) {
      const next = parent.get(walk)!;
      parent.set(walk, cur);
      walk = next;
    }
    return cur;
  };
  const union = (a: string, b: string): void => {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return;
    // Deterministic: lex-smaller becomes parent.
    if (ra < rb) parent.set(rb, ra);
    else parent.set(ra, rb);
  };
  for (const e of edges) union(e.a, e.b);
  const groups = new Map<string, string[]>();
  for (const id of allIds) {
    const root = find(id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(id);
  }
  return Array.from(groups.values())
    .filter((g) => g.length >= 2)
    .map((g) => g.slice().sort())
    .sort((x, y) => x[0].localeCompare(y[0]));
}

interface AxisResult {
  axis: "faction" | "location" | "character";
  rowsNorm: RowNorm[];
  edges: Edge[];
  clusters: string[][];
}

function buildAxis<T extends { id: string; name: string }>(
  axisName: "faction" | "location" | "character",
  rows: T[],
  honorifics: Set<string>,
  aliases: Record<string, string>,
  groupKey: (r: T) => string | null | undefined,
): AxisResult {
  const rowsNorm = buildRowsForAxis(rows, honorifics, aliases, groupKey);
  const edges = collectEdges(rowsNorm, aliases, axisName);
  const ids = rowsNorm.map((r) => r.id);
  const clusters = clusterFromEdges(ids, edges);
  return { axis: axisName, rowsNorm, edges, clusters };
}

function renderAxis(result: AxisResult): string {
  const { axis, rowsNorm, edges, clusters } = result;
  const byId = new Map(rowsNorm.map((r) => [r.id, r]));
  const edgeReasons = new Map<string, string[]>();
  for (const e of edges) {
    edgeReasons.set(pairKey(e.a, e.b), e.reasons);
  }
  const lines: string[] = [];
  const totalRows = rowsNorm.length;
  const clustered = clusters.reduce((s, c) => s + c.length, 0);
  lines.push(
    `### ${axis} candidates — ${clusters.length} cluster(s), ${clustered}/${totalRows} rows touched`,
  );
  lines.push("");
  if (clusters.length === 0) {
    lines.push("_(no candidate clusters surfaced under the current heuristics)_");
    return lines.join("\n");
  }
  for (let i = 0; i < clusters.length; i += 1) {
    const cluster = clusters[i];
    const inCluster = new Set(cluster);
    const localEdges = edges.filter((e) => inCluster.has(e.a) && inCluster.has(e.b));
    // Cluster-level marker if any intra-cluster edge carries a Pass-2 HH-aware
    // signal — gives the maintainer a quick visual filter on the aggregator
    // output before the dossier-level adjudication.
    const markers: string[] = [];
    if (localEdges.some((e) => e.reasons.some((r) => r.startsWith("cross-era-anchor-breach(")))) {
      markers.push("⚠ cross-era-anchor-breach-suspect");
    }
    if (localEdges.some((e) => e.reasons.some((r) => r.startsWith("primarch-stem(")))) {
      markers.push("primarch-stem");
    }
    if (localEdges.some((e) => e.reasons.some((r) => r.startsWith("slug-edit-distance-")))) {
      markers.push("slug-edit-distance");
    }
    const markerSuffix = markers.length ? ` — ${markers.join(", ")}` : "";
    lines.push(`#### ${axis} cluster ${i + 1} — ${cluster.length} rows${markerSuffix}`);
    lines.push("");
    lines.push("| id | name | group-key | aliases pointing here |");
    lines.push("| --- | --- | --- | --- |");
    for (const id of cluster) {
      const r = byId.get(id)!;
      const aliasList = r.aliasesPointingHere.length
        ? r.aliasesPointingHere.map((a) => `\`${a}\``).join(", ")
        : "—";
      lines.push(
        `| \`${r.id}\` | ${r.name} | ${r.groupKey ?? "—"} | ${aliasList} |`,
      );
    }
    lines.push("");
    lines.push("Evidence edges:");
    for (const e of localEdges) {
      lines.push(`- \`${e.a}\` ↔ \`${e.b}\` — ${e.reasons.join("; ")}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Run all three axes
// ---------------------------------------------------------------------------

const factionResult = buildAxis(
  "faction",
  factions,
  HONORIFIC_FACTION,
  factionAliases,
  (f) => f.parent ?? null,
);
const locationResult = buildAxis(
  "location",
  locations,
  HONORIFIC_LOCATION,
  locationAliases,
  (l) => l.sector ?? null,
);
const characterResult = buildAxis(
  "character",
  characters,
  HONORIFIC_CHARACTER,
  characterAliases,
  (c) => c.primaryFactionId ?? null,
);

// CLI: --pass N steuert nur den Titel.
function parsePassArg(argv: string[]): string | null {
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === "--pass" && i + 1 < argv.length) return argv[i + 1];
    if (argv[i].startsWith("--pass=")) return argv[i].slice("--pass=".length);
  }
  return null;
}
const passArg = parsePassArg(process.argv);
const titleSuffix = passArg ? ` ${passArg}` : "";

const out: string[] = [];
out.push(`# Consolidation-Pass${titleSuffix} — Candidate Aggregator output`);
out.push("");
out.push(
  `Generated by \`scripts/consolidation-aggregate.ts\` from the current ` +
    `\`factions.json\` (${factions.length} rows, ${Object.keys(factionAliases).length} aliases), ` +
    `\`locations.json\` (${locations.length} rows, ${Object.keys(locationAliases).length} aliases), ` +
    `\`characters.json\` (${characters.length} rows, ${Object.keys(characterAliases).length} aliases). ` +
    `Heuristics: exact-normalized-name + Jaccard ≥ 0.5 on honorific-stripped tokens + substring + alias-name-coincidence + same-group-key bonus, plus HH-aware signals (slug-edit-distance ≤ 2 + ratio ≤ 0.25 for locations; cross-era-anchor-breach marker on alias-coincidence; primarch-stem edges on characters).`,
);
out.push("");
out.push(
  "Output is a **candidate list**, not a decision — every cluster needs human/LLM adjudication (merge | no-merge | flagged).",
);
out.push("");
out.push("## Factions");
out.push("");
out.push(renderAxis(factionResult));
out.push("");
out.push("## Locations");
out.push("");
out.push(renderAxis(locationResult));
out.push("");
out.push("## Characters");
out.push("");
out.push(renderAxis(characterResult));
out.push("");

process.stdout.write(out.join("\n") + "\n");
