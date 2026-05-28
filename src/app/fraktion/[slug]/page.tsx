/** Per-faction detail. /fraktion/thousand-sons */
import SiteBackground from "@/components/chrome/SiteBackground";
import CornerAuspex from "@/components/chrono/CornerAuspex";

type Params = { slug: string };

export default async function FactionPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  return (
    <main className="stub-shell">
      <SiteBackground variant="vista" position="50% 28%" />
      <div className="stub-shell__decor" aria-hidden>
        <CornerAuspex size={140} label="FRACTIO // 1011" />
      </div>
      <div className="stub-shell__inner">
        <p className="stub-shell__eyebrow">{"// PHASE 3 · IN PREPARATION"}</p>
        <h1 className="stub-shell__title">{slug}</h1>
        <span className="c-hairline stub-shell__rule" aria-hidden />
        <p className="stub-shell__body">
          Faction profile — codex, allies, key characters, associated books.
          Available once the faction detail page is ported from the old prototype.
        </p>
      </div>
    </main>
  );
}
