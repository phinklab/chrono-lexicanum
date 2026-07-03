import type { Metadata } from "next";
import MainAuspex from "@/components/chrono/MainAuspex";
import GhostReadout from "@/components/chrono/GhostReadout";
import FloatingCoord from "@/components/chrono/FloatingCoord";
import RouteScrollCue from "@/components/chrome/RouteScrollCue";
import ExampleShell, { LexFooter } from "../_example/ExampleShell";

export const metadata: Metadata = {
  title: "Home (Lab-Beispiel) — Chrono Lexicanum",
};

/**
 * /lab/home_example — der echte Hub (drei 100dvh-Acts über dem fixen hub.webp,
 * Auspex-Discs, Scroll-Cues), übersetzt in die neue Sprache: Gold statt Cyan,
 * Terminus-Linie unter dem Titel, Act 2 als Praefatio/Titelblatt (C2-1) mit
 * Initiale + Marginalie (angenommene Bausteine), Readout mit ECHTER
 * Information statt Pseudo-Telemetrie, Imprimatur-Fuß (C1-1).
 * Dummy-Inhalte, statisch, kein DB-Zugriff.
 */

const READOUT_LINES = [
  "· 889 RECORDS INDEXED",
  "· 7 ERAS · 5 SEGMENTA",
  "· 312 SYNOPSES ENRICHED",
  "· SOURCES · LEXICANVM / OL / HC",
  "· LAST INGEST · M42.347",
  "· COGNITIO LINK STABLE",
];

const BANDS = [
  {
    label: "The Instruments",
    rows: [
      {
        num: "I",
        title: "Chronicle",
        desc: "Every novel placed on the long line of the Imperium.",
        gloss: "FOLIO I · LINEA TEMPORVM",
      },
      {
        num: "II",
        title: "Cartographer",
        desc: "The galaxy as a chart — segmenta, sectors and the worlds that burn.",
        gloss: "FOLIO II · CARTOGRAPHIA",
      },
      {
        num: "III",
        title: "Ask the Archive",
        desc: "Five questions; the cogitator returns the doorway that fits you.",
        gloss: "FOLIO III · INTERROGATORIVM",
      },
    ],
  },
  {
    label: "The Library",
    rows: [
      {
        num: "IV",
        title: "Works",
        desc: "The full catalogue — 889 novels by era, faction, format and mood.",
        gloss: "CATALOGVS · LIBRORVM",
      },
      {
        num: "V",
        title: "Podcasts",
        desc: "The lore shows beside the books, episode by episode.",
        gloss: "VOX · ARCHIVVM",
      },
    ],
  },
  {
    label: "The Registers",
    rows: [
      {
        num: "VI",
        title: "Compendium",
        desc: "Factions, primarchs, characters, worlds and authors — every doorway.",
        gloss: "INDEX RERVM OMNIVM",
      },
      {
        num: "VII",
        title: "Series",
        desc: "Reading orders for the long arcs, from Heresy to Dawn of Fire.",
        gloss: "ORDO LEGENDI",
      },
    ],
  },
] as const;

export default function HomeExamplePage() {
  return (
    <ExampleShell
      active="home_example"
      mainClass="lexh"
      variant="hub"
      heroSelector=".lexh-act--splash"
    >
      <div className="lex-readout" aria-hidden>
        <GhostReadout
          lines={READOUT_LINES}
        />
      </div>

      {/* ── Act 1 · Splash — Titel tief im dunklen Band, Auspex dahinter ── */}
      <section
        className="lexh-act lexh-act--splash"
        aria-label="Chrono Lexicanum — the archive"
      >
        <FloatingCoord
          x="42%"
          y="120px"
          label="ROUTE · SEGMENTVM ULTIMA"
          delay={1.2}
        />
        <FloatingCoord
          x="58%"
          y="220px"
          label="HIT · NOVA TERRA · M42.347"
          delay={3}
        />

        <div className="hub-hero__auspex hub-hero__auspex--main" aria-hidden>
          <MainAuspex
            size={520}
            accent="var(--cl-gold)"
            spinDur={240}
            spinRevDur={320}
          />
        </div>
        <div className="hub-hero__auspex hub-hero__auspex--secondary" aria-hidden>
          <MainAuspex
            size={320}
            accent="var(--cl-gold)"
            spinDur={360}
            spinRevDur={440}
          />
        </div>

        <div className="lexh-title">
          <p className="lex-mast__eyebrow">
            {"// ARCHIVVM · COGITATOR ACTIVVS"}
          </p>
          <h1 className="lexh-heading">CHRONO LEXICANUM</h1>
          <div className="lex-mast__rule" aria-hidden />
          <p className="lex-mast__sub">
            A fan-made archive of Warhammer 40,000 novels — and the lore
            podcasts beside them — charted by era, faction and world.
          </p>
        </div>

        <RouteScrollCue label="What can I do here?" target=".lexh-act--intro" />
      </section>

      {/* ── Act 2 · Praefatio — Lesetext mit Initiale + die Suche ───────── */}
      <section className="lexh-act lexh-act--intro" aria-label="What can I do here?">
        <div className="lexh-intro">
          <div className="lexh-intro__head">
            <p className="lex-mast__eyebrow">{"// PRAEFATIO"}</p>
            <h2 className="lexh-intro__heading">What can I do here?</h2>
          </div>

          <div className="lex-apparatus">
            <p className="lex-prose lex-initial">
              A hobby — a fan-built archive of the 41st millennium, made with
              love for the Black Library and the slow, dark march of the
              grimdark. Search the catalogue below, or take one of the doorways
              further down; the hope is simple, that the cogitator gives you
              exactly the book you didn&rsquo;t know you wanted next.
            </p>
            <div className="lex-margin">
              <div>
                <b>REF</b> M42.347
              </div>
              <div>SOURCE · MANUAL</div>
              <div>CONFIDENCE · HIGH</div>
              <div>SCRIBE · PH. LEXICANVS</div>
            </div>
          </div>

          <div className="lexh-search">
            <div className="lex-field">
              <label className="lex-field__kicker" htmlFor="lexh-q">
                Query the Archive
              </label>
              <input
                id="lexh-q"
                type="text"
                placeholder="e.g. Eisenhorn, Tanith, Macragge…"
                readOnly
              />
            </div>
            <p className="lex-stat">
              <b>889 NOVELS</b>
              <span>7 ERAS · 5 SEGMENTA</span>
            </p>
          </div>
        </div>

        <RouteScrollCue
          label="More to explore"
          target=".lexh-act--explore"
          className="hub-cue--floor"
        />
      </section>

      {/* ── Act 3 · Registry — die Türen als gruppierter Index ──────────── */}
      <section className="lexh-act lexh-act--explore" aria-label="More to explore">
        <div className="lexh-tools-head">
          <p className="lex-mast__eyebrow">{"// EXPLORA"}</p>
          <h2 className="lexh-intro__heading">More to explore</h2>
        </div>

        <div className="lexh-explore">
          {BANDS.map((band) => (
            <div key={band.label} className="lexh-band">
              <div className="lexh-band__head">
                <span>{band.label}</span>
              </div>
              <ul className="lexh-rows">
                {band.rows.map((row) => (
                  <li key={row.num}>
                    <a href="#" className="lexh-row">
                      <span className="lexh-row__num">{row.num}</span>
                      <span className="lexh-row__main">
                        <span className="lexh-row__title">{row.title}</span>
                        <span className="lexh-row__desc">{row.desc}</span>
                      </span>
                      <span className="lexh-row__gloss" aria-hidden>
                        {row.gloss}
                      </span>
                      <span className="lexh-row__chev" aria-hidden>
                        ›
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <LexFooter mid="BEST EXPERIENCED WITH SOUND" />
      </section>
    </ExampleShell>
  );
}
