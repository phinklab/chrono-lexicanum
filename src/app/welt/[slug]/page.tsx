/** Per-world detail. /welt/cadia */
import SiteBackground from "@/components/chrome/SiteBackground";
import CornerAuspex from "@/components/chrono/CornerAuspex";

type Params = { slug: string };

export default async function WorldPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  return (
    <main className="stub-shell">
      <SiteBackground variant="vista" position="50% 32%" />
      <div className="stub-shell__decor" aria-hidden>
        <CornerAuspex size={140} label="MVNDVS // 1011" />
      </div>
      <div className="stub-shell__inner">
        <p className="stub-shell__eyebrow">{"// PHASE-3 · IN VORBEREITUNG"}</p>
        <h1 className="stub-shell__title">{slug}</h1>
        <span className="c-hairline stub-shell__rule" aria-hidden />
        <p className="stub-shell__body">
          Welt-Eintrag — Sektor-Lage, klimatische Bedingungen, prägende Ereignisse,
          Schauplatz-Bücher. Erscheint, sobald die Welt-Detailseite portiert ist.
        </p>
      </div>
    </main>
  );
}
