import type { Metadata } from "next";
import "./design.css";

export const metadata: Metadata = { title: "Design Language — Lab" };

/**
 * /lab/design — CD-Overview der Ziel-Designsprache (Session 141, additiv).
 *
 * Benchmark ist die Chronicle-Cinematic-Timeline (Brief 138): Void / Parchment /
 * Antik-Gold / Steel, Cormorant-Serif liest, IBM-Plex-Mono beschriftet,
 * Hairlines statt Schatten, Glow nur als Fokusmarker. Die Seite dokumentiert
 * Tokens, Typoskala, Flächenregeln und die Kern-Bausteine im Zielstil und
 * stellt sie in einer Do/Don't-Sektion gegen die Slop-Patterns aus dem
 * Frontend-Deep-Review (Report Session 141). Statisch, kein DB-Zugriff,
 * keine Client-Komponenten; Demo-Inhalte sind in-universe, Annotationen
 * deutsch (Arbeitssprache der Briefs).
 */

function Section({
  id,
  label,
  title,
  note,
  children,
}: {
  id: string;
  label: string;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="lds-section" id={id}>
      <div className="lds-sec-label">{label}</div>
      <h2 className="lds-sec-title">{title}</h2>
      {note ? <p className="lds-sec-note">{note}</p> : null}
      {children}
    </section>
  );
}

function Swatch({
  hex,
  name,
  role,
  border,
}: {
  hex: string;
  name: string;
  role: string;
  border?: boolean;
}) {
  return (
    <div className="lds-swatch">
      <div
        className="chip"
        style={{
          background: hex,
          ...(border ? { boxShadow: "inset 0 0 0 1px rgba(125,135,153,0.25)" } : {}),
        }}
      />
      <div className="meta">
        <span className="name">{name}</span>
        <span className="hex">{hex}</span>
        <span className="role">{role}</span>
      </div>
    </div>
  );
}

function TypeRow({ spec, children }: { spec: string[]; children: React.ReactNode }) {
  return (
    <div className="lds-type-row">
      <div className="spec">
        {spec.map((s) => (
          <div key={s}>{s}</div>
        ))}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Pair({
  cap,
  doWhy,
  dontWhy,
  doDemo,
  dontDemo,
}: {
  cap: string;
  doWhy: string;
  dontWhy: string;
  doDemo: React.ReactNode;
  dontDemo: React.ReactNode;
}) {
  return (
    <div className="lds-dd-pair">
      <div className="pair-cap">{cap}</div>
      <div className="lds-dd-body">
        <div className="lds-do">
          <span className="h">SO — HAUSSTIL</span>
          {doDemo}
          <p className="why">{doWhy}</p>
        </div>
        <div className="lds-dont">
          <span className="h">NICHT — SLOP</span>
          {dontDemo}
          <p className="why">{dontWhy}</p>
        </div>
      </div>
    </div>
  );
}

export default function DesignLanguagePage() {
  return (
    <main className="lds">
      <div className="lds-grain" aria-hidden="true" />
      <div className="lds-wrap">
        <div className="lds-folio" aria-hidden="true">
          <span>FOLIO LXI·DESIGN</span>
          <span>REF · BRIEF 138 / SESSION 141</span>
        </div>

        <header>
          <div className="lds-kicker">
            CHRONO·LEXICANUM — <b>HAUSSTIL</b>
          </div>
          <h1 className="lds-display-title">Design Language</h1>
          <p className="lds-sub">
            Benchmark ist die Chronicle-Timeline: Void-Fläche, Parchment-Text,
            Antik-Gold als Akzent, Serife liest, Mono beschriftet. Diese Seite
            ist das Referenzblatt für jede Surface, die nachgezogen wird — und
            die Grenzlinie gegen generisches AI-Design.
          </p>
        </header>

        {/* ── 01 · Palette ─────────────────────────────────────────────── */}
        <Section
          id="palette"
          label="01 · Farbwelt"
          title="Palette"
          note="Vier Werte tragen die Site: Void (Fläche), Parchment (Stimme), Gold (Bedeutung), Steel (Apparat). Blood ist Marginalfarbe für Warnung/Häresie. Cyan ist abgeschafft. Heute leben diese Werte lokal im .chron-Scope (67-chronicle-cinematic.css) — die Promotion zu globalen Tokens ist Empfehlung des Review-Reports."
        >
          <div className="lds-swatches">
            <Swatch hex="#04060b" name="Void" role="Grundfläche" border />
            <Swatch hex="#070b13" name="Void II" role="Plates · erhobene Fläche" border />
            <Swatch hex="#e9dfc8" name="Parchment" role="Lesetext · Titel" />
            <Swatch hex="#c7c2b2" name="Parchment dim" role="Sekundärtext · Noten" />
            <Swatch hex="#c9b896" name="Gold" role="Akzent · aktive Marker" />
            <Swatch hex="rgba(201,184,150,0.22)" name="Gold line" role="Hairlines · Regeln" border />
            <Swatch hex="#7d8799" name="Steel" role="Mono-Labels · Apparat" />
            <Swatch hex="#566070" name="Steel dim" role="Fußnoten · inaktiv" />
            <Swatch hex="#d8d2c2" name="Invert" role="Selected-State (dunkle Schrift)" />
            <Swatch hex="#a51c1c" name="Blood" role="Warnung · sparsamst" />
          </div>
        </Section>

        {/* ── 02 · Typografie ──────────────────────────────────────────── */}
        <Section
          id="typografie"
          label="02 · Typografie"
          title="Zwei Stimmen"
          note="Cormorant Garamond spricht (alles, was gelesen wird), IBM Plex Mono beschriftet (alles, was Apparat ist: Daten, Tags, Eyebrows, Buttons). Cinzel bleibt lapidare Sonderrolle für wenige Bestands-Überschriften; Space Grotesk nur in Chronicle-Control-Toggles. Nie mehr als eine Eyebrow-Ebene pro View — das Mono-Label ist eine Hierarchie-Entscheidung, kein Reflex."
        >
          <div>
            <TypeRow spec={["Display", "Cormorant 500", "38–68px · lh 1.04 · ls 0.05em"]}>
              <div className="lds-t-display">The Horus Heresy</div>
            </TypeRow>
            <TypeRow spec={["Era-Titel", "Cormorant 500", "30–46px · ls 0.14em · uppercase"]}>
              <div className="lds-t-h2" style={{ textTransform: "uppercase" }}>
                The Great Crusade
              </div>
            </TypeRow>
            <TypeRow spec={["Row-Titel", "Cormorant 500", "22px · ls 0.03em"]}>
              <div className="lds-t-row">The Drop Site Massacre</div>
            </TypeRow>
            <TypeRow
              spec={["Body Lead", "Cormorant 500", "21–25px fluid · eine Stufe über der Norm"]}
            >
              <p className="lds-t-body-lg" style={{ margin: 0 }}>
                A lead paragraph — the opening voice of a page, one step above
                the reading norm.
              </p>
            </TypeRow>
            <TypeRow spec={["Body (Norm)", "Cormorant 500", "19–22px fluid · lh 1.62"]}>
              <p className="lds-t-body" style={{ margin: 0 }}>
                The Warmaster turns. Seven Legions descend on Isstvan V under
                the banner of betrayal, and the galaxy learns what treachery
                weighs.
              </p>
            </TypeRow>
            <TypeRow
              spec={["Body Kompakt", "Cormorant 500", "18px · dichte Chrome (Player, Konsole)"]}
            >
              <p className="lds-t-body-sm" style={{ margin: 0 }}>
                Compact body for dense chrome — the media player bar, console
                cards, anywhere the norm would blow the surface open.
              </p>
            </TypeRow>
            <TypeRow
              spec={["Caption", "Cormorant 500", "16px · Tabellenzellen · Sekundärprosa"]}
            >
              <p className="lds-t-body-xs" style={{ margin: 0 }}>
                Captions, table cells and secondary prose — the floor of the
                serif ladder.
              </p>
            </TypeRow>
            <TypeRow spec={["Note", "Cormorant Italic", "19–22px · parchment-dim"]}>
              <p className="lds-t-note" style={{ margin: 0 }}>
                An annotation in the margin of the record — quieter, set in
                italic, never competing with the body.
              </p>
            </TypeRow>
            <TypeRow spec={["Lapidar (Bestand)", "Cinzel 400", "ls 0.32em · sparsam"]}>
              <div className="lds-t-lapidar">Chrono Lexicanum</div>
            </TypeRow>
            <TypeRow spec={["Mono XL", "Plex Mono", "15px · ls 0.30em · Stepper-/Rail-Header"]}>
              <div className="lds-t-mono-xl">Protocollvm · 2 / 5</div>
            </TypeRow>
            <TypeRow spec={["Mono LG", "Plex Mono", "13px · ls 0.26em"]}>
              <div className="lds-t-mono-lg">M31.005 — The Heresy Begins</div>
            </TypeRow>
            <TypeRow spec={["Mono MD", "Plex Mono", "12px · ls 0.24em"]}>
              <div className="lds-t-mono-md">Section Label · Buttons</div>
            </TypeRow>
            <TypeRow spec={["Mono SM", "Plex Mono", "11px · ls 0.22em"]}>
              <div className="lds-t-mono-sm">Tags · Media-Meta · Fine Print</div>
            </TypeRow>
            <TypeRow spec={["Mono XS", "Plex Mono", "10px · ls 0.30em"]}>
              <div className="lds-t-mono-xs">Scroll to Descend</div>
            </TypeRow>
          </div>
        </Section>

        {/* ── 03 · Fläche & Raum ───────────────────────────────────────── */}
        <Section
          id="flaeche"
          label="03 · Fläche &amp; Raum"
          title="Void, Veil, Hairline"
          note="Flächen sind dunkel und ruhig: Void als Grund, Void II für erhobene Plates, Artwork immer hinter einem Veil-Gradient zur Lesbarkeit. Linien sind Hairlines (1px, gold-line oder steel), die ins Nichts auslaufen dürfen. Radius 0–3px — fast eckig. Schatten existieren nur als Text-Scrim über Artwork, nie als Card-Dekor. Glow ist ein Fokusmarker (aktiver Node, aktuelle Era) — niemals Dekoration."
        >
          <div className="lds-surface-grid">
            <div className="lds-surface lds-surface-void">
              <span className="cap">
                <b>VOID</b> · Grundfläche #04060b + Grain
              </span>
            </div>
            <div className="lds-surface lds-surface-void-2">
              <span className="cap">
                <b>PLATE</b> · Void II #070b13 · Hairline-Rahmen
              </span>
            </div>
            <div className="lds-surface lds-surface-veil">
              <div className="art" aria-hidden="true" />
              <div className="veil" aria-hidden="true" />
              <span className="cap">
                <b>VEIL</b> · Artwork hinter dunklem Verlauf
              </span>
            </div>
          </div>
          <div className="lds-rules" style={{ marginTop: 36 }}>
            <div>
              <div className="lds-t-mono-xs" style={{ marginBottom: 10 }}>
                Hairline · gold-line, läuft aus
              </div>
              <div className="lds-rule-h" />
            </div>
            <div>
              <div className="lds-t-mono-xs" style={{ marginBottom: 10 }}>
                Trennlinie · steel 10%
              </div>
              <div className="lds-rule-h2" />
            </div>
            <div>
              <div className="lds-t-mono-xs" style={{ marginBottom: 10 }}>
                Terminus-Linie · läuft beidseitig aus (Bestand:
                Cogitator-Loading — Maintainer-Referenz)
              </div>
              <div className="lds-rule-fade" />
            </div>
            <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
              <div className="lds-rule-v" />
              <span className="lds-t-mono-xs">
                Vertikale Regel · transparent → gold → transparent (Terminus)
              </span>
            </div>
          </div>
        </Section>

        {/* ── 04 · Bausteine ───────────────────────────────────────────── */}
        <Section
          id="bausteine"
          label="04 · Bausteine"
          title="Kern-Bausteine"
          note="Jeder Baustein folgt denselben Regeln: Mono beschriftet, Serife benennt, der Selected-State invertiert auf Parchment. Buttons tragen Hairline-Rahmen; Karten und andere Flächen sind rahmenlos (Wash statt Kasten) und enden in einer beidseitig auslaufenden Bodenlinie. Hover ist eine Farbantwort (steel → gold), keine Bewegung."
        >
          <div className="lds-blocks">
            <div className="lds-block">
              <span className="lds-block-cap">Button</span>
              <div className="lds-demo-row">
                <button className="lds-btn" type="button">
                  Open Chronicle
                </button>
                <button className="lds-btn lds-btn--quiet" type="button">
                  Dismiss
                </button>
                <button className="lds-btn lds-btn--sel" type="button">
                  Selected
                </button>
              </div>
              <p className="lds-block-note">
                Primär: gold-dim Hairline, Hover invertiert auf Gold. Quiet:
                rahmenlos, steel → gold. Selected: Parchment-Invert. Kein
                Radius, kein Schatten, kein Icon-Zwang.
              </p>
            </div>

            <div className="lds-block">
              <span className="lds-block-cap">Pill-Toggle</span>
              <div className="lds-demo-row">
                <div className="lds-pill" role="group" aria-label="Beispiel-Moduswahl">
                  <button type="button" className="sel">
                    Cinematic
                  </button>
                  <button type="button">Index</button>
                </div>
                <div className="lds-pill" role="group" aria-label="Beispiel-Medienwahl">
                  <button type="button" className="sel">
                    Books
                  </button>
                  <button type="button">Podcasts</button>
                </div>
              </div>
              <p className="lds-block-note">
                Der einzige 3px-Radius der Sprache. Aktiv = Parchment-Invert
                mit dunkler Schrift — nie ein gefüllter Akzent-Hintergrund.
              </p>
            </div>

            <div className="lds-block">
              <span className="lds-block-cap">Chip &amp; Tag</span>
              <div className="lds-demo-row" style={{ gap: 32 }}>
                <a className="lds-chip" href="#bausteine">
                  <span className="t">Horus Rising</span>
                  <span className="m">Novel · M31 · D. Abnett</span>
                </a>
                <a className="lds-chip" href="#bausteine">
                  <span className="t">The First Heretic</span>
                  <span className="m">Novel · M31 · A. D-B</span>
                </a>
              </div>
              <div className="lds-demo-row">
                <span className="lds-tag">Astartes</span>
                <span className="lds-tag">Heresy Era</span>
                <span className="lds-tag lds-tag--on">Selected</span>
              </div>
              <p className="lds-block-note">
                Media-Chip: Serif-Titel über Mono-Meta, Hover färbt den Titel
                gold. Tag: Mono in Hairline — aktiv wird gold, nicht gefüllt.
              </p>
            </div>

            <div className="lds-block">
              <span className="lds-block-cap">Karte (Katalogkarte)</span>
              <div className="lds-card">
                <span className="folio">№ 0317</span>
                <div className="eyebrow">Novel · M41</div>
                <h3 className="title">Eisenhorn: Xenos</h3>
                <div className="meta">D. Abnett · 2001 · Inquisition</div>
                <p className="snip">
                  An inquisitor follows a heretic across the Helican subsector
                  — and begins his own long descent.
                </p>
              </div>
              <p className="lds-block-note">
                Rahmenlos (Maintainer-Entscheid 2026-06-11): eine leise
                Wash-Fläche statt Border-Kasten, abgeschlossen nur von einer
                Bodenlinie, die beidseitig ausläuft (Terminus-Linie aus dem
                Cogitator-Loading). Folio-Nummer statt Icon, Hover hebt die
                Fläche minimal (gold 5%). Kein Radius, kein Schatten, kein
                Cover-Zoom.
              </p>
            </div>

            <div className="lds-block">
              <span className="lds-block-cap">Modal-Kopf (Dossier)</span>
              <div className="lds-modalhead">
                <button className="close" type="button" aria-label="Schließen">
                  ✕
                </button>
                <div className="kicker">
                  <span>M31.014</span>
                  <span className="tier">◆ Epoch</span>
                </div>
                <h3 className="title">The Siege of Terra</h3>
                <p className="note">
                  The Warmaster brings the war to the walls of the Palace; the
                  record ends where the myth begins.
                </p>
              </div>
              <p className="lds-block-note">
                Kicker (Datum + Gold-Tiermark) über Serif-Titel über
                Italic-Note, abgeschlossen mit Hairline. Close ist ein stilles
                Mono-Glyph, kein Button-Kasten.
              </p>
            </div>

            <div className="lds-block">
              <span className="lds-block-cap">Formularfeld</span>
              <div className="lds-field">
                <label htmlFor="lds-demo-q">Query the Archive</label>
                <input id="lds-demo-q" type="text" placeholder="e.g. Eisenhorn, Tanith, Macragge…" />
              </div>
              <div className="lds-field">
                <label htmlFor="lds-demo-era">Era</label>
                <select id="lds-demo-era" defaultValue="m31">
                  <option value="m30">M30 — The Great Crusade</option>
                  <option value="m31">M31 — The Horus Heresy</option>
                  <option value="m41">M41 — The Time of Ending</option>
                </select>
              </div>
              <p className="lds-block-note">
                Unterstrich statt Kasten: transparente Fläche, steel Hairline
                unten, Fokus färbt die Linie gold — kein Glow-Ring, kein
                Innen-Schatten.
              </p>
            </div>

            <div className="lds-block">
              <span className="lds-block-cap">Nav-Element</span>
              <nav className="lds-nav" aria-label="Beispiel-Navigation">
                <a href="#bausteine">
                  <span className="idx">I</span>
                  <span className="lab">Chronicle</span>
                </a>
                <a href="#bausteine" className="on">
                  <span className="idx">II</span>
                  <span className="lab">Archive</span>
                </a>
                <a href="#bausteine">
                  <span className="idx">III</span>
                  <span className="lab">Cartographer</span>
                </a>
              </nav>
              <p className="lds-block-note">
                Römische Ordnungszahl (Mono) + Serif-Label, Hairline-Trenner.
                Aktiv: Parchment + goldene Ziffer. Hover: Farbantwort, kein
                Slide, kein Underline-Sweep.
              </p>
            </div>

            <div className="lds-block">
              <span className="lds-block-cap">Tabelle / Index-Liste</span>
              <div className="lds-index">
                <div className="lds-irow">
                  <div className="line">
                    <span className="t">
                      <span className="tiermark">◆</span>The Council of Nikaea
                    </span>
                    <span className="d">M31.001</span>
                    <span className="s">The Emperor rules on the Librarius…</span>
                    <span className="c">›</span>
                  </div>
                </div>
                <div className="lds-irow open">
                  <div className="line">
                    <span className="t">
                      <span className="tiermark">◆</span>The Burning of Prospero
                    </span>
                    <span className="d">M31.004</span>
                    <span className="s">The Wolves are loosed on the City of Light…</span>
                    <span className="c">›</span>
                  </div>
                  <div className="detail">
                    Censure becomes annihilation: the Sixth Legion descends on
                    Tizca, and the Thousand Sons pay the price of foresight.
                  </div>
                </div>
                <div className="lds-irow">
                  <div className="line">
                    <span className="t">Battle of the Alaxxes Nebula</span>
                    <span className="d">M31.005</span>
                    <span className="s">The Wolves, mauled, are cornered…</span>
                    <span className="c">›</span>
                  </div>
                </div>
              </div>
              <p className="lds-block-note">
                Grid auf Baseline: Serif-Titel / Mono-Datum / Italic-Snippet /
                Chevron. Offene Zeile: gold 5% Fläche, Detail in Italic. Keine
                Zebra-Streifen, keine Card-Verpackung pro Zeile.
              </p>
            </div>

            <div className="lds-block">
              <span className="lds-block-cap">
                Ladezustand (Cogitator) — Bestand · Referenz
              </span>
              <div className="lds-cogitator" aria-hidden="true">
                <div className="core">
                  <span className="ring" />
                  <span className="seed" />
                </div>
                <p className="eyebrow">{"COGNITIO LINK · ESTABLISHING"}</p>
                <p className="phrase">
                  Cogitator loading<span className="dots">…</span>
                </p>
                <span className="scan" />
              </div>
              <p className="lds-block-note">
                Bestands-Element (CogitatorLoading.tsx), vom Maintainer als
                Positiv-Beispiel bestätigt: Ring aus Hairlines statt
                Spinner-Bibliothek, Mono-Eyebrow, Cinzel-Phrase — und darunter
                die beidseitig auslaufende Terminus-Linie, die jetzt auch die
                Katalogkarte abschließt.
              </p>
            </div>

            <div className="lds-block">
              <span className="lds-block-cap">
                Initiale (Drop Cap) — angenommen 2026-06-11
              </span>
              <p className="lds-initial">
                Many records begin mid-sentence, salvaged from burned
                libraries. A single illuminated initial — gold, restrained —
                marks where a longer reading text opens, and nowhere else.
              </p>
              <p className="lds-block-note">
                Nur für Lese-Längen (Buch-Synopsis, Era-Einführung), maximal
                eine pro View.
              </p>
            </div>

            <div className="lds-block" style={{ gridColumn: "1 / -1" }}>
              <span className="lds-block-cap">
                Marginalie — angenommen 2026-06-11
              </span>
              <div className="lds-marginalia">
                <p className="body">
                  The Index lists every engagement of the Heresy in order of
                  record, not of occurrence — the archivists of Terra wrote
                  down what reached them, when it reached them, and the gaps
                  are part of the text.
                </p>
                <div className="note">
                  <div>
                    <b>REF</b> M31.014
                  </div>
                  <div>SOURCE · LEXICANUM</div>
                  <div>CONFIDENCE · HIGH</div>
                </div>
              </div>
              <p className="lds-block-note">
                Quellen-/Konfidenz-Apparat als Randspalte statt Footnote-Pill —
                macht die source_kind/confidence-Daten der DB sichtbar, im
                Duktus eines annotierten Folianten.
              </p>
            </div>
          </div>
        </Section>

        {/* ── 05 · Motion ──────────────────────────────────────────────── */}
        <Section
          id="motion"
          label="05 · Motion"
          title="Filmisch, nicht nervös"
          note="Bewegung erzählt Ankunft und Übergang — sie wirbt nicht um Aufmerksamkeit. Alles Dauerhafte ist langsam (Atmen, kein Blinken); alles Eintretende kommt einmal und ruht dann. prefers-reduced-motion wird global respektiert (10-base.css)."
        >
          <div className="lds-motion-list">
            <div className="mrow">
              <span className="k">Eintritt · Dossier-Reprint</span>
              <span className="v">rise 16px + fade · 0.45–0.6s · cubic-bezier(0.2, 0.7, 0.2, 1) · gestaffelt</span>
            </div>
            <div className="mrow">
              <span className="k">Übergang · Mode/Era</span>
              <span className="v">Crossfade 0.6s ease — niemals Slide-Karussells</span>
            </div>
            <div className="mrow">
              <span className="k">Ambient · Artwork</span>
              <span className="v">Ken Burns 38s, alternierend — unterhalb der Wahrnehmungsschwelle</span>
            </div>
            <div className="mrow">
              <span className="k">Expand · Zeile</span>
              <span className="v">grid-template-rows 0fr → 1fr · 0.45s — kein height-Hack, kein Bounce</span>
            </div>
            <div className="mrow">
              <span className="k">Hover</span>
              <span className="v">Farbantwort 0.2s (steel → gold) — kein Scale, kein translateY, kein Schattenwurf</span>
            </div>
            <div className="mrow">
              <span className="k">Verboten</span>
              <span className="v">Bounce/Elastic-Easing, Dauer-Pulse als Dekor, wandernde Scanlines, Hover-Zoom auf Covern</span>
            </div>
          </div>
        </Section>

        {/* ── 06 · Do / Don't ──────────────────────────────────────────── */}
        <Section
          id="dodont"
          label="06 · Do / Don't"
          title="Hausstil gegen Slop"
          note="Rechts stehen die Muster aus der Slop-Checkliste des Reviews — einige davon leben noch als Primitives im Bestand (.c-glass, .c-corners, .c-link-cyan in 40-primitives.css) und werden per Report-Empfehlung abgelöst. Die DON'T-Exponate hier sind bewusst nachgebaute Negativ-Beispiele."
        >
          <div className="lds-dd-grid">
            <Pair
              cap="Akzentfarbe & Links"
              doWhy="Parchment-Serif, Hover färbt gold. Bedeutung entsteht durch Farbe, nicht durch Licht."
              dontWhy="Cyan-Mono mit Glow-Text-Shadow — das Universal-Tell generischer Tech-UIs (Checkliste S1/S2)."
              doDemo={<span className="lds-o-goldlink">Horus Rising — open record</span>}
              dontDemo={<span className="lds-x-cyanlink">HORUS RISING ▸ ACCESS</span>}
            />
            <Pair
              cap="Rahmen & Ecken"
              doWhy="Eine Hairline in gold-line genügt. Die Ecke ist eine Ecke."
              dontWhy="Corner-Brackets auf solid Border (S7) — HUD-Klischee, im Bestand als .c-corners."
              doDemo={<div className="lds-o-hairline">Record Frame</div>}
              dontDemo={<div className="lds-x-corners">RECORD FRAME</div>}
            />
            <Pair
              cap="Panel-Fläche"
              doWhy="Void II als Plate, Hairline-Rahmen, volle Deckung — ruhig und lesbar."
              dontWhy="Glassmorphism: blur + Cyan-Border + 40px-Schatten + 14px-Radius (S8/S11), im Bestand als .c-glass."
              doDemo={<div className="lds-o-plate">A raised plate holds the dossier text.</div>}
              dontDemo={<div className="lds-x-glass">A glass card floats above everything.</div>}
            />
            <Pair
              cap="Headline"
              doWhy="Parchment-Serif mit Spationierung — die Stimme des Archivs."
              dontWhy="Gradient-Text von Violett nach Cyan (S4/S5) — das Hero-Tell schlechthin."
              doDemo={<div className="lds-o-serifhead">The Age of Darkness</div>}
              dontDemo={<div className="lds-x-gradienthead">The Age of Darkness</div>}
            />
            <Pair
              cap="Ikonografie"
              doWhy="Mono-Glyphen und Tiermarks (◆ ▸ №) aus dem Zeichensatz — typografisch, nicht illustrativ."
              dontWhy="Emoji als UI-Icons (S16) — sofortiger Stilbruch, plattformabhängige Optik."
              doDemo={<span className="lds-o-tiermarks">◆ ▸ № ✕ ›</span>}
              dontDemo={<span className="lds-x-emoji">📚 🚀 ✨ 🗺️ 🔥</span>}
            />
            <Pair
              cap="Card-Anatomie"
              doWhy="Katalogkarte: rahmenlose Wash-Fläche, Folio-Nummer, Serif-Titel, Mono-Meta — abgeschlossen von einer beidseitig auslaufenden Bodenlinie. Fläche statt Schwebe."
              dontWhy="Default-Card: 16px-Radius + Soft-Shadow + Gradient-Icon-Kachel (S9) — austauschbar mit jedem SaaS."
              doDemo={
                <div className="lds-card" style={{ maxWidth: "100%" }}>
                  <span className="folio">№ 0042</span>
                  <div className="eyebrow">Novel · M32</div>
                  <div className="title">The Beast Arises</div>
                  <div className="meta">12 Volumes · Orks</div>
                </div>
              }
              dontDemo={
                <div className="lds-x-card">
                  <div className="ic">📖</div>
                  <strong>The Beast Arises</strong>
                  <span>Discover an epic 12-book saga.</span>
                </div>
              }
            />
            <Pair
              cap="Hero-Fläche"
              doWhy="Artwork hinter Veil — das Bild trägt die Stimmung, der Text bleibt lesbar."
              dontWhy="Warmer Amber-Halo hinter zentriertem Titel (S3) — vom Maintainer explizit abgelehnt."
              doDemo={<div className="lds-o-veil">The Great Crusade</div>}
              dontDemo={<div className="lds-x-halo">The Great Crusade</div>}
            />
            <Pair
              cap="Status & Telemetrie"
              doWhy="Eine Mono-Zeile mit echter Information. Wenn nichts passiert, bewegt sich nichts."
              dontWhy="Blinkender Cyan-Dot + Pseudo-Telemetrie (S17/S18) — Bewegung ohne Nachricht."
              doDemo={
                <div className="lds-o-caption">
                  <b>312 RECORDS</b>
                  <span>LAST INGEST M41.992</span>
                </div>
              }
              dontDemo={
                <div className="lds-x-blink">
                  <span className="dot" />
                  <span>SYSTEM ONLINE · UPLINK STABLE</span>
                </div>
              }
            />
          </div>
        </Section>

        {/* ── 07 · Vorschlags-Bausteine ────────────────────────────────── */}
        <Section
          id="vorschlaege"
          label="07 · Vorschläge"
          title="Mögliche neue Bausteine"
          note="Ideen aus Dimension C des Reviews, hier als gebaute Skizzen — VORSCHLÄGE, nicht implementierter Bestand. Übernahme entscheidet ein eigener Brief. Initiale (Drop Cap) und Marginalie wurden am 2026-06-11 vom Maintainer angenommen und sind zu den Kern-Bausteinen (Sektion 04) gewandert."
        >
          <div className="lds-blocks">
            <div className="lds-proposal">
              <span className="lds-proposal-badge">Vorschlag</span>
              <span className="lds-block-cap">Siegel / Imprimatur</span>
              <div>
                <span className="lds-seal">
                  <span className="aq" aria-hidden="true">
                    ⚜
                  </span>
                  <span className="l1">Imprimatur</span>
                  <span className="l2">Archivum Chronologicum · M41</span>
                </span>
              </div>
              <p className="lds-block-note">
                Abschluss-Vignette für Seitenfüße und Modal-Enden: ein stilles
                Echtheitssiegel statt eines klassischen Footers.
              </p>
            </div>
          </div>
        </Section>

        <footer className="lds-imprimatur">
          <div className="lds-rule-v" aria-hidden="true" />
          <div className="line">
            Sanctioned by the Design Language · Session 141 · No Cyan Beyond
            This Point
          </div>
        </footer>
      </div>
    </main>
  );
}
