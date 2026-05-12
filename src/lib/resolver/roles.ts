export type ResolverAxis = "faction" | "location" | "character";
export type FactionJunctionRole =
  | "primary"
  | "supporting"
  | "antagonist"
  | "background";
export type LocationJunctionRole = "primary" | "secondary" | "mentioned";
export type CharacterJunctionRole = "pov" | "appears" | "mentioned";

export interface RoleNormalization<T extends string = string> {
  axis: ResolverAxis;
  raw: string;
  role: T;
  changed: boolean;
}

export const FACTION_ROLE_PRIORITY: Record<FactionJunctionRole, number> = {
  primary: 4,
  supporting: 3,
  antagonist: 2,
  background: 1,
};

export const LOCATION_ROLE_PRIORITY: Record<LocationJunctionRole, number> = {
  primary: 3,
  secondary: 2,
  mentioned: 1,
};

export const CHARACTER_ROLE_PRIORITY: Record<CharacterJunctionRole, number> = {
  pov: 3,
  appears: 2,
  mentioned: 1,
};

const FACTION_ROLE_MAP: Record<string, FactionJunctionRole> = {
  primary: "primary",
  supporting: "supporting",
  antagonist: "antagonist",
  background: "background",
  secondary: "supporting",
  mentioned: "background",
};

const LOCATION_ROLE_MAP: Record<string, LocationJunctionRole> = {
  primary: "primary",
  secondary: "secondary",
  mentioned: "mentioned",
  supporting: "secondary",
  background: "mentioned",
};

const CHARACTER_ROLE_MAP: Record<string, CharacterJunctionRole> = {
  pov: "pov",
  appears: "appears",
  supporting: "appears",
  antagonist: "appears",
  primary: "appears",
  secondary: "appears",
  mentioned: "mentioned",
  background: "mentioned",
};

function normalizeFromMap<T extends string>(
  axis: ResolverAxis,
  raw: string,
  map: Record<string, T>,
): RoleNormalization<T> {
  const trimmed = raw.trim();
  const role = map[trimmed] ?? null;
  if (role === null) {
    throw new Error(`Unsupported ${axis} role '${raw}'.`);
  }
  return {
    axis,
    raw,
    role,
    changed: role !== null && role !== raw,
  };
}

export function normalizeFactionRole(
  raw: string,
): RoleNormalization<FactionJunctionRole> {
  return normalizeFromMap("faction", raw, FACTION_ROLE_MAP);
}

export function normalizeLocationRole(
  raw: string,
): RoleNormalization<LocationJunctionRole> {
  return normalizeFromMap("location", raw, LOCATION_ROLE_MAP);
}

export function normalizeCharacterRole(
  raw: string,
): RoleNormalization<CharacterJunctionRole> {
  return normalizeFromMap("character", raw, CHARACTER_ROLE_MAP);
}

export function normalizeEntityRole(
  axis: ResolverAxis,
  raw: string,
): RoleNormalization {
  if (axis === "faction") return normalizeFactionRole(raw);
  if (axis === "location") return normalizeLocationRole(raw);
  return normalizeCharacterRole(raw);
}
