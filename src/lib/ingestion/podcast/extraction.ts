/**
 * Brief 131 — `EpisodeExtraction` coercion/validation + the committed
 * `<slug>.extractions.json` file contract. Anthropic-free (imports only the
 * local types), so the CC-Direct tagging path (Variant B) can build, validate,
 * and (de)serialize extractions WITHOUT loading `@anthropic-ai/sdk`.
 *
 * Two levels of acceptance:
 *  - `coerceEpisodeExtraction` — lenient, never throws. Mirrors `extract.ts`'s
 *    hand-rolled tool-output parsing EXACTLY (trim strings, drop non-strings and
 *    empties, unknown `episodeKind` → "other"). This is what guarantees the
 *    api and cc-direct paths produce a FORM-identical extraction from the same
 *    decision, so the downstream resolve + artifact are identical.
 *  - `validateExtractionStrict` — STRUCTURE-strict gate for the merge step: a
 *    cc-direct subsession that returned truncated/garbage JSON (a missing axis, a
 *    non-array bucket, no `episodeKind`) is rejected so the driver re-runs that
 *    batch. Once the structure is sound, values are coerced identically to the
 *    api path (so the strict gate never diverges the artifact).
 *
 * Serialization is deterministic — guids sorted, fixed key order per extraction,
 * 2-space indent + trailing newline — so a committed extractions file is
 * byte-stable and a re-merge of the same batch outputs reproduces it.
 */
import { EPISODE_KINDS } from "./types";
import type { AxisExtraction, EpisodeExtraction, EpisodeKind } from "./types";

// --- lenient coercion (mirrors extract.ts parse* verbatim) -------------------

function coerceStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const item of v) {
    if (typeof item !== "string") continue;
    const t = item.trim();
    if (t.length > 0) out.push(t);
  }
  return out;
}

function coerceAxis(v: unknown): AxisExtraction {
  const rec =
    v !== null && typeof v === "object" && !Array.isArray(v)
      ? (v as Record<string, unknown>)
      : {};
  return { primary: coerceStringArray(rec.primary), mentioned: coerceStringArray(rec.mentioned) };
}

function coerceEpisodeKind(v: unknown): EpisodeKind {
  if (typeof v === "string" && (EPISODE_KINDS as readonly string[]).includes(v)) {
    return v as EpisodeKind;
  }
  return "other";
}

/** Lenient, never-throwing coercion — the same shape `extract.ts` produces from
 *  a tool call. Use for any already-trusted input (assemble, migration). */
export function coerceEpisodeExtraction(v: unknown): EpisodeExtraction {
  const rec =
    v !== null && typeof v === "object" && !Array.isArray(v)
      ? (v as Record<string, unknown>)
      : {};
  return {
    episodeKind: coerceEpisodeKind(rec.episodeKind),
    characters: coerceAxis(rec.characters),
    factions: coerceAxis(rec.factions),
    locations: coerceAxis(rec.locations),
  };
}

// --- structure-strict gate (for the cc-direct merge) -------------------------

/** Raised by `validateExtractionStrict` for a structurally-broken extraction —
 *  the signal the driver uses to re-run a batch. */
export class ExtractionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractionValidationError";
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function requireAxisStructure(v: unknown, where: string): void {
  if (!isPlainObject(v)) {
    throw new ExtractionValidationError(`${where}: must be an object with "primary" and "mentioned"`);
  }
  // STRUCTURE-strict only: each bucket must be present as an array. Item VALUES
  // (non-strings, blanks, whitespace) are coerced by `coerceEpisodeExtraction`
  // exactly as the api path does, so the strict gate never diverges the artifact.
  for (const bucket of ["primary", "mentioned"] as const) {
    if (!Array.isArray(v[bucket])) {
      throw new ExtractionValidationError(`${where}.${bucket}: must be an array`);
    }
  }
}

/**
 * Validate the STRUCTURE of one extraction strictly, then coerce VALUES exactly
 * like the api path. Throws `ExtractionValidationError` if `v` is not an object,
 * lacks a string `episodeKind`, or any of the three axes is missing / not an
 * object whose `primary` and `mentioned` are arrays. On success returns the
 * coerced extraction (trimmed strings, non-strings + empties dropped, unknown
 * kind → "other"), so a structurally-valid cc-direct output never diverges from
 * the api shape.
 */
export function validateExtractionStrict(v: unknown, where: string): EpisodeExtraction {
  if (!isPlainObject(v)) {
    throw new ExtractionValidationError(`${where}: must be an object`);
  }
  if (typeof v.episodeKind !== "string") {
    throw new ExtractionValidationError(`${where}.episodeKind: required string`);
  }
  for (const field of ["characters", "factions", "locations"] as const) {
    if (!(field in v)) {
      throw new ExtractionValidationError(`${where}.${field}: required`);
    }
    requireAxisStructure(v[field], `${where}.${field}`);
  }
  return coerceEpisodeExtraction(v);
}

// --- canonical shape + deterministic serialization ---------------------------

/** A new extraction with keys in the fixed order the committed file uses. */
export function canonicalizeExtraction(e: EpisodeExtraction): EpisodeExtraction {
  return {
    episodeKind: e.episodeKind,
    characters: { primary: [...e.characters.primary], mentioned: [...e.characters.mentioned] },
    factions: { primary: [...e.factions.primary], mentioned: [...e.factions.mentioned] },
    locations: { primary: [...e.locations.primary], mentioned: [...e.locations.mentioned] },
  };
}

/** The committed per-show tagging output — keyed on `episodeGuid` (Brief 131). */
export interface ExtractionsFile {
  /** Show slug — matches the artifact / manifest. */
  show: string;
  /** Provenance: always "cc-direct" for a Variant-B run (the api path does not
   *  emit this file — its cache lives under `ingest/.llm-cache/`). */
  tagging: "cc-direct";
  /** Model label written into the artifact's `extraction.model`. */
  model: string;
  /** `EPISODE_PROMPT_VERSION_HASH` of the conventions the tagger followed. */
  promptVersion: string;
  /** episodeGuid → extraction. */
  extractions: Record<string, EpisodeExtraction>;
}

/** Deterministic JSON: header in fixed order, guids sorted, each extraction
 *  canonicalized, 2-space indent + trailing newline. */
export function serializeExtractions(file: ExtractionsFile): string {
  const guids = Object.keys(file.extractions).sort();
  const extractions: Record<string, EpisodeExtraction> = {};
  for (const guid of guids) {
    extractions[guid] = canonicalizeExtraction(file.extractions[guid]);
  }
  const ordered: ExtractionsFile = {
    show: file.show,
    tagging: file.tagging,
    model: file.model,
    promptVersion: file.promptVersion,
    extractions,
  };
  return JSON.stringify(ordered, null, 2) + "\n";
}

function reqHeaderString(o: Record<string, unknown>, key: string): string {
  const v = o[key];
  if (typeof v !== "string" || v.trim() === "") {
    throw new ExtractionValidationError(`extractions file: "${key}" must be a non-empty string`);
  }
  return v;
}

/** Parse + validate a committed extractions file (header + every extraction). */
export function parseExtractionsFile(text: string): ExtractionsFile {
  const raw: unknown = JSON.parse(text);
  if (!isPlainObject(raw)) {
    throw new ExtractionValidationError("extractions file: top-level must be an object");
  }
  const show = reqHeaderString(raw, "show");
  const model = reqHeaderString(raw, "model");
  const promptVersion = reqHeaderString(raw, "promptVersion");
  if (raw.tagging !== "cc-direct") {
    throw new ExtractionValidationError('extractions file: "tagging" must be "cc-direct"');
  }
  if (!isPlainObject(raw.extractions)) {
    throw new ExtractionValidationError('extractions file: "extractions" must be an object');
  }
  const extractions: Record<string, EpisodeExtraction> = {};
  for (const [guid, ext] of Object.entries(raw.extractions)) {
    extractions[guid] = validateExtractionStrict(ext, `extractions[${guid}]`);
  }
  return { show, tagging: "cc-direct", model, promptVersion, extractions };
}
