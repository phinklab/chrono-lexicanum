import type { Metadata } from "next";
import AuspexSweep from "@/components/chrono/AuspexSweep";
import GhostReadout from "@/components/chrono/GhostReadout";
import FloatingCoord from "@/components/chrono/FloatingCoord";
import ExampleShell, { LexFooter, LexMast } from "../_example/ExampleShell";

export const metadata: Metadata = {
  title: "Compendium (Lab-Beispiel) — Chrono Lexicanum",
};

/**
 * /lab/compendium_example — das echte /compendium-Skelett (scriptorium.webp,
 * Masthead, Kategorien-Nav, Hero-Tür + 2×2), vereinheitlicht in die neue
 * Gold-Sprache (das produktive Teal weicht der einen Akzentfarbe) und als
 * Registerwerk gelesen (Report-Idee C2-3): REGISTRVM-Eyebrows mit
 * Seitenzahlen, Türen im angenommenen Karten-Treatment (rahmenlose Wash-
 * Fläche + Terminus-Bodenlinie), eine Gold-Zahl pro Tür. Dummy-Inhalte.
 */

const READOUT_LINES = [
  "· COMPENDIVM · INDEX RERVM",
  "· V REGISTRA · MOUNTED",
  "· 98 FACTIONS · 412 CHARACTERS",
  "· 230 WORLDS · 136 AUTHORS",
  "· COGNITIO LINK STABLE",
];

const NAV = [
  { label: "Index", count: null, active: true },
  { label: "Factions", count: "98" },
  { label: "Primarchs", count: "18" },
  { label: "Characters", count: "412" },
  { label: "Worlds", count: "230" },
  { label: "Authors", count: "136" },
] as const;

const DOORS = [
  {
    eyebrow: "Registrvm I · pp. 001–206",
    label: "Factions",
    count: "98 factions",
    blurb:
      "Legions, chapters, dynasties and broods — every power of the galaxy, with the books and podcasts that carry it.",
    statN: "5,118",
    statRest: "appearances across books & podcasts",
    hero: true,
  },
  {
    eyebrow: "Registrvm II · pp. 207–224",
    label: "Primarchs",
    count: "18 primarchs",
    blurb: "The eighteen sons — demigods, traitors, and the myths between.",
    statN: "742",
    statRest: "appearances",
  },
  {
    eyebrow: "Registrvm III · pp. 225–490",
    label: "Characters",
    count: "412 characters",
    blurb: "Inquisitors, commissars, saints and heretics, in order of record.",
    statN: "3,409",
    statRest: "appearances",
  },
  {
    eyebrow: "Registrvm IV · pp. 491–620",
    label: "Worlds",
    count: "230 worlds",
    blurb: "Hives, shrines, forges and tombs — the stages of the long war.",
    statN: "1,856",
    statRest: "appearances",
  },
  {
    eyebrow: "Registrvm V · pp. 621–700",
    label: "Authors",
    count: "136 authors",
    blurb: "The scribes of the Black Library, by credited works.",
    statN: "1,204",
    statRest: "works credited",
  },
] as const;

export default function CompendiumExamplePage() {
  return (
    <ExampleShell
      active="compendium_example"
      mainClass="lexc"
      variant="scriptorium"
      position="50% 30%"
      heroSelector=".lex-mast"
    >
      <div className="lex-readout" aria-hidden>
        <GhostReadout
          color="var(--cl-gold)"
          opacity={0.3}
          lineMs={5200}
          typeSpeed={80}
          max={4}
          lines={READOUT_LINES}
        />
      </div>
      <div className="lex-hud" aria-hidden>
        <div className="lex-hud__sweep">
          <AuspexSweep r={170} sweepDuration={16} accent="var(--cl-gold)" />
        </div>
      </div>
      <FloatingCoord
        x="58%"
        y="150px"
        label="ARCHIVVM · RERVM OMNIVM"
        delay={1.4}
        lifetime={5}
        color="var(--cl-gold)"
        opacity={0.5}
      />

      <LexMast
        eyebrow={"// COMPENDIVM · INDEX RERVM"}
        title="COMPENDIUM"
        sub="Every faction, world, character and author in the archive — each a doorway into the books and podcasts behind it."
      />

      <div className="lex-body">
        {/* ── Kategorien-Nav über auslaufender Hairline ────────────────── */}
        <nav className="lexc-nav" aria-label="Compendium-Kategorien (Beispiel)">
          {NAV.map((n) => (
            <a
              key={n.label}
              href="#"
              className={
                "active" in n && n.active
                  ? "lexc-nav__tab is-active"
                  : "lexc-nav__tab"
              }
              aria-current={"active" in n && n.active ? "page" : undefined}
            >
              {n.label}
              {n.count ? <span className="lexc-nav__count">{n.count}</span> : null}
            </a>
          ))}
        </nav>

        {/* ── Das Registerwerk — Hero-Tür + 2×2 ────────────────────────── */}
        <div className="lexc-doors">
          {DOORS.map((d) => (
            <a
              key={d.label}
              href="#"
              className={
                "hero" in d && d.hero ? "lexc-door lexc-door--hero" : "lexc-door"
              }
            >
              <span className="lexc-door__eyebrow">{d.eyebrow}</span>
              <span className="lexc-door__headrow">
                <span className="lexc-door__label">{d.label}</span>
                <span className="lexc-door__count">{d.count}</span>
              </span>
              <p className="lexc-door__blurb">{d.blurb}</p>
              <p className="lexc-door__stat">
                <b>{d.statN}</b> {d.statRest}
              </p>
              <span className="lexc-door__all">View all {d.label} →</span>
            </a>
          ))}
        </div>

        {/* ── Kuratierungs-Hinweis mit Marginalie ──────────────────────── */}
        <section className="lex-sect" aria-label="Hinweis zur Kuratierung">
          <div className="lex-apparatus">
            <p className="lex-prose" style={{ fontStyle: "italic" }}>
              Every entry in the register is drawn from the archive&rsquo;s own
              tables and carries its source and confidence in the margin — the
              compendium shows what the records support, and marks where the
              curation is still under way.
            </p>
            <div className="lex-margin">
              <div>
                <b>STATUS</b> CURATION
              </div>
              <div>SOURCE · POSTGRES</div>
              <div>REGEN · WEEKLY</div>
            </div>
          </div>
        </section>

        <LexFooter mid="INDEX RERVM OMNIVM" />
      </div>
    </ExampleShell>
  );
}
