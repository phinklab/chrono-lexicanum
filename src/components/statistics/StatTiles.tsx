/**
 * The Holdings — the Librarium's headline counts as linked tiles (F3 build
 * decision: every tile is a doorway to the surface that holds the records).
 * Numbers arrive live from the loader; nothing here is hardcoded.
 */
import Link from "next/link";
import type { LibrariumTiles } from "@/lib/statistics/loadStatistics";
import { fmt } from "./chart-utils";

export default function StatTiles({ tiles }: { tiles: LibrariumTiles }) {
  const entries = [
    {
      href: "/archive",
      value: fmt(tiles.books),
      label: "Volumes shelved",
      sub: "novels to audio dramas",
    },
    {
      href: "/compendium/authors",
      value: fmt(tiles.authors),
      label: "Scribes on record",
      sub: "authors & co-authors",
    },
    {
      href: "/archive/podcasts",
      value: fmt(tiles.episodes),
      label: "Vox recordings",
      sub: `≈ ${fmt(tiles.episodeHours)} hours of podcast`,
    },
    {
      href: "/compendium/worlds",
      value: fmt(tiles.places),
      label: "Places charted",
      sub: "worlds the stories return to",
    },
    {
      href: "/timeline",
      value: fmt(tiles.events),
      label: "Events chronicled",
      sub: "across eight eras",
    },
  ];

  return (
    <ul className="libr-tiles">
      {entries.map((t) => (
        <li key={t.href}>
          <Link className="libr-tile" href={t.href}>
            <span className="libr-tile__value">{t.value}</span>
            <span className="libr-tile__label">{t.label}</span>
            <span className="libr-tile__sub">{t.sub}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
