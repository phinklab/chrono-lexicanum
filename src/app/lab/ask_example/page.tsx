import type { Metadata } from "next";
import GhostReadout from "@/components/chrono/GhostReadout";
import FloatingCoord from "@/components/chrono/FloatingCoord";
import ExampleShell, { LexFooter, LexMast } from "../_example/ExampleShell";

export const metadata: Metadata = {
  title: "Ask the Archive (Lab-Beispiel) — Chrono Lexicanum",
};

/**
 * /lab/ask_example — das echte /ask-Skelett (oracle.webp, Masthead bei 320px,
 * Konsole + Status-Rail um -80px hochgezogen), die Befragung als Protokoll
 * (Report-Idee C2-4): römische Großziffer als Zierde, Ballot-Matrix ◇ → ◆,
 * Rail mit römischen Marken I–V. Danach der Cogitator (Bestands-Referenz,
 * Maintainer 2026-06-11) als Verarbeitungs-Moment und das Verdikt als
 * Rank-Dossier (C3-3). Dummy-Inhalte, statisch — die Zustände sind gestellt.
 */

const READOUT_LINES = [
  "· INTERROGATORIVM · ONLINE",
  "· V QVAESTIONES · FLAT PROFILE",
  "· SIGNALS · EXPERIENCE / FACTION",
  "· SIGNALS · TONE / LENGTH / ERA",
  "· RECOMMENDATION ENGINE READY",
];

const OPTIONS = [
  {
    a: "I know the Heresy by heart",
    why: "Veteran — skip the primers",
    sel: true,
  },
  { a: "I've read a handful", why: "Returning reader" },
  { a: "The lore videos brought me here", why: "Podcast & primer friendly" },
  { a: "Complete newcomer", why: "Start me at the gate" },
] as const;

const MARKS = [
  { rn: "I", ql: "How much grimdark have you read?", st: "SEALED", cls: "done" },
  { rn: "II", ql: "How deep into the lore are you?", st: "OPEN", cls: "cur" },
  { rn: "III", ql: "Which banner calls to you?", st: "—", cls: "" },
  { rn: "IV", ql: "One night or a long campaign?", st: "—", cls: "" },
  { rn: "V", ql: "Which millennium?", st: "—", cls: "" },
] as const;

const RUNNERS = [
  {
    folio: "RANK II",
    eyebrow: "Novel · M41 · 416 pp.",
    title: "First and Only",
    meta: "D. ABNETT · 1999 · ASTRA MILITARVM",
    snip: "The Tanith First-and-Only — mud, loyalty, and a war that eats regiments.",
  },
  {
    folio: "RANK III",
    eyebrow: "Novel · M31 · 432 pp.",
    title: "Horus Rising",
    meta: "D. ABNETT · 2006 · HERESY ERA",
    snip: "Where it all begins: the Great Crusade at its highest, brightest hour.",
  },
] as const;

export default function AskExamplePage() {
  return (
    <ExampleShell
      active="ask_example"
      mainClass="lexq"
      variant="oracle"
      position="50% 30%"
      heroSelector=".lex-mast"
    >
      <div className="lex-readout" aria-hidden>
        <GhostReadout
          color="var(--cl-gold)"
          opacity={0.28}
          lineMs={5200}
          typeSpeed={78}
          max={4}
          lines={READOUT_LINES}
        />
      </div>
      <FloatingCoord
        x="42%"
        y="120px"
        label="QUERY · PVBLIC"
        delay={1.2}
        lifetime={5}
        color="var(--cl-gold)"
        opacity={0.5}
      />
      <FloatingCoord
        x="58%"
        y="220px"
        label="PROFILE · I OF V"
        delay={3}
        lifetime={5}
        color="var(--cl-gold)"
        opacity={0.5}
      />

      <LexMast
        eyebrow={"// INTERROGATORIVM · QVINQVE QVAESTIONES"}
        title="ASK THE ARCHIVE"
        sub="Five questions; the cogitator weighs the catalogue and returns five doorways — real recommendations from the archive, not a horoscope."
      />

      <div className="lex-body">
        <div className="lexq-grid">
          {/* ── Stage: Protokoll-Zeile + Frage + Ballot ─────────────────── */}
          <div>
            <div className="lexq-protocol">
              <p className="lex-stat">
                <b>QVAESTIO II OF V</b>
                <span>PROFILE BUILDING</span>
              </p>
            </div>

            <section className="lexq-question" aria-label="Frage 2">
              <div className="lexq-num" aria-hidden>
                II
                <small>QVAESTIO</small>
              </div>
              <div>
                <h2 className="lexq-q">
                  How deep into the lore are you already?
                </h2>
                <p className="lexq-hint">
                  The answer steers how much the archive explains — and how
                  much it assumes.
                </p>
                <div
                  className="lexq-ballot"
                  role="group"
                  aria-label="Antworten (Beispiel)"
                >
                  {OPTIONS.map((o) => (
                    <button
                      key={o.a}
                      type="button"
                      className={
                        "sel" in o && o.sel ? "lexq-opt sel" : "lexq-opt"
                      }
                    >
                      <span className="glyph" aria-hidden>
                        {"sel" in o && o.sel ? "◆" : "◇"}
                      </span>
                      <span>
                        <span className="a">{o.a}</span>
                        <span className="why">{o.why}</span>
                      </span>
                    </button>
                  ))}
                </div>
                <div className="lexq-nav">
                  <a href="#">← Qvaestio I</a>
                  <span className="mid">SIGNVM · EXPERIENCE</span>
                  <a href="#">Qvaestio III →</a>
                </div>
              </div>
            </section>
          </div>

          {/* ── Status-Rail: Protokollkarte mit römischen Marken ────────── */}
          <aside className="lexq-rail" aria-label="Protokoll-Stand">
            <p className="lexq-rail__label">Protocollvm</p>
            <ul className="lexq-marks">
              {MARKS.map((m) => (
                <li key={m.rn} className={m.cls || undefined}>
                  <span className="rn">{m.rn}</span>
                  <span className="ql">{m.ql}</span>
                  <span className="st">{m.st}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>

        {/* ── Verarbeitung: der Cogitator (Bestands-Referenz) ───────────── */}
        <section className="lex-sect" aria-label="Der Cogitator wägt ab">
          <div className="lex-rule" aria-hidden />
          <div className="lex-cog" aria-hidden>
            <div className="lex-cog__core">
              <span className="lex-cog__ring" />
              <span className="lex-cog__seed" />
            </div>
            <p className="lex-cog__eyebrow">
              {"// BALLOT SEALED · COGITATOR WEIGHING"}
            </p>
            <p className="lex-cog__phrase">
              Weighing the catalogue<span className="lex-cog__dots">…</span>
            </p>
            <span className="lex-cog__scan" />
          </div>
          <div className="lex-rule" aria-hidden />
        </section>

        {/* ── Verdikt: Rank-Dossier (Vorschau des Antwort-Zustands) ─────── */}
        <section className="lex-sect" aria-label="Die Empfehlung">
          <div className="lex-sect__label">
            Verdictvm · Preview of the Answer State
          </div>
          <div className="lexq-verdict">
            <div className="lexq-rank" aria-hidden>
              <span className="n">I</span>
              <span className="cap">RANK</span>
            </div>
            <div>
              <p className="lexq-dossier__kicker">
                <span>Novel · M41 · 416 pp.</span>
                <span className="lexq-dossier__tier">◆ Entry Point</span>
              </p>
              <h2 className="lexq-dossier__title">Eisenhorn: Xenos</h2>
              <p className="lex-prose lexq-dossier__note">
                An inquisitor follows a heretic across the Helican subsector —
                and begins his own long descent. Noir, self-contained, and the
                archive&rsquo;s surest first step into the 41st millennium.
              </p>
              <div className="lexq-dossier__chips" aria-label="Begründung">
                <span className="lex-tag lex-tag--on">Tone · Noir</span>
                <span className="lex-tag">Faction · Inquisition</span>
                <span className="lex-tag">Standalone Start</span>
              </div>
              <a className="lex-btn" href="#">
                Open Record
              </a>
            </div>
          </div>

          <div className="lexq-runners">
            {RUNNERS.map((r) => (
              <a key={r.folio} href="#" className="lex-card">
                <span className="lex-card__folio">{r.folio}</span>
                <span className="lex-card__eyebrow">{r.eyebrow}</span>
                <h3 className="lex-card__title">{r.title}</h3>
                <span className="lex-card__meta">{r.meta}</span>
                <p className="lex-card__snip">{r.snip}</p>
              </a>
            ))}
          </div>
        </section>

        <LexFooter mid="QVINQVE QVAESTIONES" />
      </div>
    </ExampleShell>
  );
}
