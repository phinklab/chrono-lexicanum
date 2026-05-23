import type { Metadata } from "next";
import SiteBackground from "@/components/chrome/SiteBackground";
import CornerAuspex from "@/components/chrono/CornerAuspex";

export const metadata: Metadata = { title: "Ask the Archive — Chrono Lexicanum" };

/**
 * Ask flow. Will host the ported AskMode component (multi-question funnel
 * across 6 reading-mood paths).
 *
 * Current state: visual preview only. The 6 cards below are *disabled* and
 * carry placeholder Latin labels — they show the planned layout without
 * committing the funnel state machine. The real funnel + canonical path
 * copy land in a follow-up brief (the design handoff's path definitions
 * live outside this worktree).
 */

type PathPreview = {
  letter: string;
  label: string;
  copy: string;
};

const PATHS: PathPreview[] = [
  {
    letter: "I",
    label: "VESTIGIVM",
    copy: "Inquisitorische Spurensuche — Geheimnisse, Ketzerei, dunkle Winkel des Imperiums.",
  },
  {
    letter: "II",
    label: "BELLVM",
    copy: "Krieg an der Front — Astra Militarum, Belagerung, Soldatenperspektive.",
  },
  {
    letter: "III",
    label: "PRIMARCH",
    copy: "Heroisch und überlebensgross — Horus Heresy, Space-Marine-Legionen, Primarchen.",
  },
  {
    letter: "IV",
    label: "HEREXIS",
    copy: "Auf der Seite der Verdammten — Chaos-Marines, Forderungen der Götter, der Fall.",
  },
  {
    letter: "V",
    label: "EXPLORATIO",
    copy: "Xenos und Maschinengott — Mechanicus, Aeldari, das Unbekannte am Rand der Karte.",
  },
  {
    letter: "VI",
    label: "INITIVM",
    copy: "Einstieg — eigenständige Romane, leicht zugängliche Plotbögen, keine Vorkenntnis nötig.",
  },
];

export default function AskPage() {
  return (
    <main className="ask">
      <SiteBackground variant="librarium" position="50% 30%" />
      <div className="ask__decor" aria-hidden>
        <CornerAuspex size={160} label="ORACVLVM // 1011" />
      </div>

      <header className="ask__header">
        <p className="ask__eyebrow">{"// ORACVLVM · DELIBERATIO"}</p>
        <h1 className="ask__title">ASK THE ARCHIVE</h1>
        <span className="c-hairline ask__rule" aria-hidden />
        <p className="ask__lede">
          Sechs Pfade, ein Einstiegspunkt. Das Archiv stellt drei Fragen pro Pfad
          und liefert ein Buch zurück, das zu deiner gewählten Stimmung passt.
        </p>
        <p className="ask__status">{"// PHASE-H · IN VORBEREITUNG · VISUELLE VORSCHAU"}</p>
      </header>

      <ol className="ask__paths" aria-label="Pfade — visuelle Vorschau">
        {PATHS.map((p) => (
          <li key={p.label}>
            <div className="ask__path c-glass c-corners" role="group" aria-label={`${p.label} — inaktiv`}>
              <span className="ask__path-number">{p.letter}</span>
              <span className="ask__path-label">{p.label}</span>
              <span className="c-hairline ask__path-rule" aria-hidden />
              <p className="ask__path-copy">{p.copy}</p>
              <span className="ask__path-foot">{"// inaktiv"}</span>
            </div>
          </li>
        ))}
      </ol>

      <footer className="ask__footer">
        <span>EX DELIBERATIONE · LECTIO</span>
        <span>STAMP M42.347</span>
      </footer>
    </main>
  );
}
