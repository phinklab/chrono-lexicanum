import Link from "next/link";

/**
 * HomeExplore (Brief 121) — Home's Act 3 "More to explore": the archive doorways
 * as a grouped registry. Three plain-language bands — The Library, Browse by
 * Topic, Discover More — of compact single-line rows (index · title · short
 * description · chevron). The frameless row idiom in cyan: no per-row box, accent
 * only on hover/focus.
 *
 * Two rows have no destination yet (04 Characters, 05 Hot Topics — both future
 * curated pages); they render inert with a SOON marker rather than linking to a
 * 404. Server component (static links).
 */

type Row = {
  /** Zero-padded registry index. */
  n: string;
  title: string;
  desc: string;
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
        n: "01",
        title: "Works",
        desc: "Every novel, novella and audio drama in the archive.",
        href: "/archive",
      },
      {
        n: "02",
        title: "Podcasts",
        desc: "The second pillar — lore-casts, newest first.",
        href: "/archive/podcasts",
      },
    ],
  },
  {
    name: "Browse by Topic",
    rows: [
      {
        n: "03",
        title: "Factions",
        desc: "Pick an allegiance and see what sits behind it.",
        href: "/fraktionen",
      },
      {
        n: "04",
        title: "Characters",
        desc: "The primarchs and the cast the novels follow.",
      },
      {
        n: "05",
        title: "Hot Topics",
        desc: "Curated reading threads through the lore.",
      },
    ],
  },
  {
    name: "Discover More",
    rows: [
      {
        n: "06",
        title: "Ask the Archive",
        desc: "Five questions to your one entry book.",
        href: "/ask",
      },
      {
        n: "07",
        title: "Chronicle",
        desc: "The in-universe timeline, M30 to M42.",
        href: "/timeline",
      },
      {
        n: "08",
        title: "Cartographer",
        desc: "Every novel pinned to the world it haunts.",
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
        <span className="hub-explore__chevron" aria-hidden>
          ›
        </span>
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
        <section className="hub-explore__band" key={band.name}>
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
