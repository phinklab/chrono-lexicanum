import Link from "next/link";

/**
 * HomeExplore — Home's Act 3 "More to
 * explore": the archive doorways as a grouped registry. Three plain-language
 * bands — The Library, Browse by Topic, Discover More — of compact single-line
 * rows (title · short description · hover gloss · chevron).
 * The frameless row idiom in gold: Terminus separators between rows, accent
 * only on hover/focus, and the archivist's marginalia gloss fading in on hover.
 *
 * "Browse by Topic" mirrors the Compendium: the five categories plus the two
 * guided-pick tools (Session 256) — every row is a live link. Server component
 * (static links). The SOON idiom (RowInner else-branch + .hub-explore__soon)
 * stays dormant for future curated pages.
 */

type Row = {
  title: string;
  desc: string;
  /** Hover marginalia (mono caps); omitted on SOON rows. */
  gloss?: string;
  /** Omitted = no page yet → renders inert with a SOON marker. */
  href?: string;
};

type Band = {
  name: string;
  rows: Row[];
};

const BANDS: Band[] = [
  {
    name: "The Library",
    rows: [
      {
        title: "Works",
        desc: "Every novel, novella and audio drama in the archive.",
        gloss: "CATALOGVS · LIBRORVM",
        href: "/archive",
      },
      {
        title: "Podcasts",
        desc: "The second pillar: lore-casts, newest first.",
        gloss: "VOX · ARCHIVVM",
        href: "/archive/podcasts",
      },
    ],
  },
  {
    name: "Browse by Topic",
    rows: [
      {
        title: "Factions",
        desc: "Pick an allegiance and see what sits behind it.",
        gloss: "COMPENDIVM · FRACTIO",
        href: "/compendium/factions",
      },
      {
        title: "Primarchs",
        desc: "The twenty sons of the Emperor who led the Legions.",
        gloss: "COMPENDIVM · PRIMARCHA",
        href: "/compendium/primarchs",
      },
      {
        title: "Characters",
        desc: "The named who recur across the archive.",
        gloss: "COMPENDIVM · PERSONA",
        href: "/compendium/characters",
      },
      {
        title: "Worlds",
        desc: "The worlds the stories keep returning to.",
        gloss: "COMPENDIVM · MVNDVS",
        href: "/compendium/worlds",
      },
      {
        title: "Authors",
        desc: "The writers behind the canon, traced by hand.",
        gloss: "COMPENDIVM · AVCTOR",
        href: "/compendium/authors",
      },
      {
        title: "Four Questions",
        desc: "A short reading profile, a ranked path through the shelves.",
        gloss: "COMPENDIVM · QVAESTIO",
        href: "/compendium/four-questions",
      },
      {
        title: "One Faction, One Book",
        desc: "Pick an army; the archive answers with one book.",
        gloss: "COMPENDIVM · VNA FACTIO",
        href: "/compendium/one-faction-one-book",
      },
    ],
  },
  {
    // Mirrors the primary-nav order (Sessions 255/256): the explore tools
    // after the Library bands; Librarium closes the registry.
    name: "Discover More",
    rows: [
      {
        title: "Cartographer",
        desc: "Every novel pinned to the world it haunts.",
        gloss: "CARTOGRAPHIA",
        href: "/map",
      },
      {
        title: "Chronicle",
        desc: "The in-universe timeline, M30 to M42.",
        gloss: "LINEA TEMPORVM",
        href: "/timeline",
      },
      {
        title: "Status Imperialis",
        desc: "When is now? Where the story stands in M42.",
        gloss: "STATVS · IMPERIALIS",
        href: "/now",
      },
      {
        title: "Librarium",
        desc: "The archive counts itself: books, authors, ratings.",
        gloss: "CENSVS · ARCHIVI",
        href: "/statistics",
      },
    ],
  },
];

function RowInner({ row }: { row: Row }) {
  return (
    <>
      <span className="hub-explore__main">
        <span className="hub-explore__title">{row.title}</span>
        <span className="hub-explore__desc">{row.desc}</span>
      </span>
      {row.href ? (
        <>
          <span className="hub-explore__gloss" aria-hidden>
            {row.gloss}
          </span>
          <span className="hub-explore__chevron" aria-hidden>
            ›
          </span>
        </>
      ) : (
        <span className="hub-explore__soon" aria-hidden>
          SOON
        </span>
      )}
    </>
  );
}

export default function HomeExplore() {
  return (
    <nav className="hub-explore" aria-label="Explore the archive: grouped index">
      {BANDS.map((band) => (
        <section className="hub-explore__band reveal" key={band.name}>
          <p className="hub-explore__divider" aria-hidden>
            <span className="hub-explore__divider-label">{band.name}</span>
          </p>
          <ol className="hub-explore__list">
            {band.rows.map((row) => (
              <li key={row.title}>
                {row.href ? (
                  <Link
                    href={row.href}
                    className="hub-explore__row hub-explore__row--link"
                  >
                    <RowInner row={row} />
                  </Link>
                ) : (
                  <span
                    className="hub-explore__row hub-explore__row--soon"
                    aria-disabled="true"
                  >
                    <RowInner row={row} />
                  </span>
                )}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </nav>
  );
}
