import type { Metadata } from "next";
import AuspexSweep from "@/components/chrono/AuspexSweep";
import GhostReadout from "@/components/chrono/GhostReadout";
import FloatingCoord from "@/components/chrono/FloatingCoord";
import ExampleShell, { LexFooter, LexMast } from "../_example/ExampleShell";

export const metadata: Metadata = {
  title: "Archive (Lab-Beispiel) — Chrono Lexicanum",
};

/**
 * /lab/archive_example — das echte /archive-Skelett (fixes books.webp +
 * Fade, Auspex-Sweep, WORKS-Masthead bei 320px, Body -80px hochgezogen),
 * der Katalog darunter als Cinematic Row-Table (Report-Idee C3-2): Era-
 * Gruppen mit auslaufender Hairline, Terminus-Zeilentrenner, eine offene
 * Zeile als Dossier mit Initiale + Marginalien-Apparat (angenommene
 * Bausteine). Dummy-Inhalte, statisch.
 */

const READOUT_LINES = [
  "· CATALOGVS · LIBRORVM",
  "· 889 WORKS · 7 ERAS",
  "· 312 SYNOPSES ENRICHED",
  "· FILTER · FACTIO / FORMA",
  "· LAST INGEST · M42.347",
  "· LECTIO PROFVNDA · READY",
];

type Row = {
  index: string;
  dot: string;
  title: string;
  byline: string;
  faction: string;
  year: string;
  format: string;
};

const M31_ROWS: Row[] = [
  {
    index: "001",
    dot: "#8aa07a",
    title: "Horus Rising",
    byline: "by Dan Abnett",
    faction: "Luna Wolves",
    year: "2006",
    format: "NOVEL",
  },
  {
    index: "002",
    dot: "#8aa07a",
    title: "False Gods",
    byline: "by Graham McNeill",
    faction: "Sons of Horus",
    year: "2006",
    format: "NOVEL",
  },
];

const M31_AFTER: Row[] = [
  {
    index: "004",
    dot: "#8f5a5a",
    title: "The First Heretic",
    byline: "by Aaron Dembski-Bowden",
    faction: "Word Bearers",
    year: "2010",
    format: "NOVEL",
  },
];

const M41_ROWS: Row[] = [
  {
    index: "005",
    dot: "#b08d57",
    title: "Eisenhorn: Xenos",
    byline: "by Dan Abnett",
    faction: "Inquisition",
    year: "2001",
    format: "NOVEL",
  },
  {
    index: "006",
    dot: "#6e7d5a",
    title: "First and Only",
    byline: "by Dan Abnett",
    faction: "Astra Militarum",
    year: "1999",
    format: "NOVEL",
  },
  {
    index: "007",
    dot: "#a51c1c",
    title: "Devastation of Baal",
    byline: "by Guy Haley",
    faction: "Blood Angels",
    year: "2017",
    format: "AUDIO",
  },
];

function IndexRow({ row }: { row: Row }) {
  return (
    <li>
      <a href="#" className="lexa-row">
        <span className="lexa-row__index">{row.index}</span>
        <span
          className="lexa-row__dot"
          aria-hidden
          style={{ background: row.dot }}
        />
        <span className="lexa-row__main">
          <span className="lexa-row__title">{row.title}</span>
          <span className="lexa-row__byline">{row.byline}</span>
        </span>
        <span className="lexa-row__faction">{row.faction}</span>
        <span className="lexa-row__year">{row.year}</span>
        <span className="lex-tag lex-tag--sm lexa-row__chip">{row.format}</span>
        <span className="lexa-row__chev" aria-hidden>
          ›
        </span>
      </a>
    </li>
  );
}

export default function ArchiveExamplePage() {
  return (
    <ExampleShell
      active="archive_example"
      mainClass="lexa"
      variant="books"
      heroSelector=".lex-mast"
    >
      <div className="lex-readout" aria-hidden>
        <GhostReadout
          lines={READOUT_LINES}
        />
      </div>
      <div className="lexa-sweep" aria-hidden>
        <AuspexSweep r={180} sweepDuration={18} accent="var(--cl-gold)" />
      </div>
      <FloatingCoord
        x="42%"
        y="120px"
        label="ROUTE · SEGMENTVM ULTIMA"
        delay={1.2}
      />
      <FloatingCoord
        x="58%"
        y="220px"
        label="HIT · BAAL · M41"
        delay={3.0}
      />

      <LexMast
        eyebrow={"// CATALOGVS · LIBRORVM"}
        title="WORKS"
        sub="889 Warhammer 40,000 novels — by era, faction, format and mood, in the order of record."
      />

      <div className="lex-body">
        {/* ── Toolbar: ehrliche Zahlen · Unterstrich-Suche · Format-Tags ── */}
        <div className="lexa-toolbar">
          <p className="lex-stat">
            <b>889 WORKS</b>
            <span>312 ENRICHED</span>
            <span>LAST INGEST M42.347</span>
          </p>
          <div className="lexa-toolbar__right">
            <div className="lex-field lex-field--line">
              <label className="lex-field__kicker" htmlFor="lexa-q">
                Search the catalogue
              </label>
              <input
                id="lexa-q"
                type="text"
                placeholder="Title, author, faction…"
                readOnly
              />
            </div>
            <div
              className="lexa-toolbar__tags"
              role="group"
              aria-label="Formatfilter (Beispiel)"
            >
              <a className="lex-tag lex-tag--on" href="#">
                All Works
              </a>
              <a className="lex-tag" href="#">
                Novel
              </a>
              <a className="lex-tag" href="#">
                Audio Drama
              </a>
              <a className="lex-tag" href="#">
                Anthology
              </a>
            </div>
          </div>
        </div>

        {/* ── Era-Gruppe M31 ──────────────────────────────────────────── */}
        <section className="lexa-group" aria-label="M31 — The Horus Heresy">
          <div className="lexa-group__head">
            <span className="lexa-group__era">M31</span>
            <span className="lexa-group__title">The Horus Heresy</span>
            <span className="lexa-group__count">64 works</span>
          </div>
          <ul className="lexa-rows">
            {M31_ROWS.map((r) => (
              <IndexRow key={r.index} row={r} />
            ))}

            {/* Offene Zeile — Lectio Profvnda: Dossier mit Initiale +
                Marginalien-Apparat. */}
            <li className="is-open">
              <a href="#" className="lexa-row">
                <span className="lexa-row__index">003</span>
                <span
                  className="lexa-row__dot"
                  aria-hidden
                  style={{ background: "#8aa07a" }}
                />
                <span className="lexa-row__main">
                  <span className="lexa-row__title">Galaxy in Flames</span>
                  <span className="lexa-row__byline">by Ben Counter</span>
                </span>
                <span className="lexa-row__faction">Sons of Horus</span>
                <span className="lexa-row__year">2006</span>
                <span className="lex-tag lex-tag--sm lexa-row__chip">NOVEL</span>
                <span className="lexa-row__chev" aria-hidden>
                  ›
                </span>
              </a>
              <div className="lexa-detail">
                <div className="lexa-detail__plate" aria-hidden>
                  <span className="aq">⚜</span>
                  <span className="cap">
                    PLATE
                    <br />
                    PENDING
                  </span>
                </div>
                <div>
                  <p className="lexa-detail__meta">
                    Novel · 416 pp. · Heresy Era · M31.006 · 2006
                  </p>
                  <p className="lex-prose lex-initial">
                    The Choral City burns. Isstvan III is the Warmaster&rsquo;s
                    first open act of treachery — four Legions purge their own
                    loyal sons, and the Heresy stops being a whisper. The
                    record closes on the survivors in the ruins, waiting for a
                    rescue that history says never came.
                  </p>
                  <div className="lexa-detail__row">
                    <a className="lex-tag lex-tag--sm" href="#">
                      Sons of Horus
                    </a>
                    <a className="lex-tag lex-tag--sm" href="#">
                      Death Guard
                    </a>
                    <a className="lex-tag lex-tag--sm" href="#">
                      Heresy Era
                    </a>
                    <a className="lexa-detail__open" href="#">
                      Open book →
                    </a>
                  </div>
                </div>
                <div className="lex-margin">
                  <div>
                    <b>REF</b> M31.006
                  </div>
                  <div>SOURCE · LEXICANVM</div>
                  <div>CONFIDENCE · HIGH</div>
                  <div>SERIES · HH №3</div>
                </div>
              </div>
            </li>

            {M31_AFTER.map((r) => (
              <IndexRow key={r.index} row={r} />
            ))}
          </ul>
        </section>

        {/* ── Era-Gruppe M41 ──────────────────────────────────────────── */}
        <section className="lexa-group" aria-label="M41 — The Time of Ending">
          <div className="lexa-group__head">
            <span className="lexa-group__era">M41</span>
            <span className="lexa-group__title">The Time of Ending</span>
            <span className="lexa-group__count">503 works</span>
          </div>
          <ul className="lexa-rows">
            {M41_ROWS.map((r) => (
              <IndexRow key={r.index} row={r} />
            ))}
          </ul>
        </section>

        <LexFooter mid="CLICK ANY TITLE · LECTIO PROFVNDA" />
      </div>
    </ExampleShell>
  );
}
