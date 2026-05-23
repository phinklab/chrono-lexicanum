/** Per-character detail. /charakter/horus */
import SiteBackground from "@/components/chrome/SiteBackground";
import CornerAuspex from "@/components/chrono/CornerAuspex";

type Params = { slug: string };

export default async function CharacterPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  return (
    <main className="stub-shell">
      <SiteBackground variant="vista" position="50% 24%" />
      <div className="stub-shell__decor" aria-hidden>
        <CornerAuspex size={140} label="PERSONA // 1011" />
      </div>
      <div className="stub-shell__inner">
        <p className="stub-shell__eyebrow">{"// PHASE-3 · IN VORBEREITUNG"}</p>
        <h1 className="stub-shell__title">{slug}</h1>
        <span className="c-hairline stub-shell__rule" aria-hidden />
        <p className="stub-shell__body">
          Charakter-Eintrag — Zugehörigkeit, Schicksalslinie, Auftritte, Querverweise.
          Erscheint, sobald die Charakter-Detailseite portiert ist.
        </p>
      </div>
    </main>
  );
}
