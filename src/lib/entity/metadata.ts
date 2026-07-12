/**
 * Shared `generateMetadata` body for the four entity detail routes
 * (/character, /faction, /world, /person — Launch S5). One place owns the
 * title/canonical/OG contract so the routes cannot drift: title is the bare
 * entity name (the root template appends the site suffix), the canonical is
 * the route the URL matrix declared, and the description prefers the curated
 * blurb over a per-type generic line.
 *
 * `loadEntity` is React-`cache()`d, so this shares its read with the page
 * render in the same request.
 */
import "server-only";
import type { Metadata } from "next";
import { routeOg } from "@/lib/seo";
import { loadEntity } from "./loader";
import { TYPE_TO_ROUTE, type EntityType } from "./types";

/** "…featuring this <noun>" for the generic description line. */
const TYPE_NOUN: Record<EntityType, string> = {
  character: "character",
  faction: "faction",
  location: "world",
  person: "author or narrator",
};

/** Social-card cap — same discipline as the book page's synopsis lead. */
function capDescription(text: string): string {
  const t = text.trim();
  return t.length > 240 ? `${t.slice(0, 240).trimEnd()}…` : t;
}

export async function entityPageMetadata(
  type: EntityType,
  slug: string,
  unknownTitle: string,
): Promise<Metadata> {
  const view = await loadEntity(type, slug);
  if (!view) return { title: unknownTitle };
  const description = view.blurb
    ? capDescription(view.blurb.text)
    : `${view.name} — every Warhammer 40,000 novel and lore podcast in the Chrono Lexicanum archive featuring this ${TYPE_NOUN[type]}.`;
  return {
    title: view.name,
    description,
    alternates: { canonical: `${TYPE_TO_ROUTE[type]}/${view.id}` },
    openGraph: routeOg({ title: view.name, description }),
  };
}
