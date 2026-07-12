import Link from "next/link";

/**
 * HomeExplore — Home's Act 3 "More to
 * explore": the archive doorways as a grouped registry. Three plain-language
 * bands — The Library, Browse by Topic, Discover More — of compact single-line
 * rows (roman numeral · title · short description · hover gloss · chevron).
 * The frameless row idiom in gold: Terminus separators between rows, accent
 * only on hover/focus, and the archivist's marginalia gloss fading in on hover.
 *
 * "Browse by Topic" mirrors the five Compendium categories — every
 * row is a live link. Server component
 * (static links). The SOON idiom (RowInner else-branch + .hub-explore__soon)
 * stays dormant for future curated pages.
 */

type Row = {
  /** Roman registry numeral. */
  n: string;
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
        n: "I",
        title: "Works",
        desc: "Every novel, novella and audio drama in the archive.",
        gloss: "CATALOGVS · LIBRORVM",
        href: "/archive",
      },
      {
        n: "II",
        title: "Podcasts",
        desc: "The second pillar — lore-casts, newest first.",
        gloss: "VOX · ARCHIVVM",
        href: "/archive/podcasts",
      },
    ],
  },
  {
    name: "Browse by Topic",
    rows: [
      {
        n: "III",
        title: "Factions",
        desc: "Pick an allegiance and see what sits behind it.",
        gloss: "COMPENDIVM · FRACTIO",
        href: "/compendium/factions",
      },
      {
        n: "IV",
        title: "Primarchs",
        desc: "The twenty sons of the Emperor who led the Legions.",
        gloss: "COMPENDIVM · PRIMARCHA",
        href: "/compendium/primarchs",
      },
      {
        n: "V",
        title: "Characters",
        desc: "The named who recur across the archive.",
        gloss: "COMPENDIVM · PERSONA",
        href: "/compendium/characters",
      },
      {
        n: "VI",
        title: "Worlds",
        desc: "The worlds the stories keep returning to.",
        gloss: "COMPENDIVM · MVNDVS",
        href: "/compendium/worlds",
      },
      {
        n: "VII",
        title: "Authors",
        desc: "The writers behind the canon, traced by hand.",
        gloss: "COMPENDIVM · AVCTOR",
        href: "/compendium/authors",
      },
    ],
  },
  {
    name: "Discover More",
    rows: [
      {
        n: "VIII",
        title: "Ask the Archive",
        desc: "Five questions to your one entry book.",
        gloss: "INTERROGATORIVM",
        href: "/ask",
      },
      {
        n: "IX",
        title: "Chronicle",
        desc: "The in-universe timeline, M30 to M42.",
        gloss: "LINEA TEMPORVM",
        href: "/timeline",
      },
      {
        n: "X",
        title: "Cartographer",
        desc: "Every novel pinned to the world it haunts.",
        gloss: "CARTOGRAPHIA",
        href: "/map",
      },
    ],
  },
];

function RowInner({ row }: { row: Row }) {
  return (
    <>
      <span className="hub-explore__index">{row.n}</span>
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
    <nav className="hub-explore" aria-label="Explore the archive — grouped index">
      {BANDS.map((band) => (
        <section className="hub-explore__band reveal" key={band.name}>
          <p className="hub-explore__divider" aria-hidden>
            <span className="hub-explore__divider-label">{band.name}</span>
          </p>
          <ol className="hub-explore__list">
            {band.rows.map((row) => (
              <li key={row.n}>
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
