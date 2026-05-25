/**
 * /atlas — die Brücke. Server component.
 *
 * Grid of 12 EntityDeck cards over the live `getBridgeStats()` snapshot.
 * Auth is enforced edge-side in `src/proxy.ts` (Task 1); the page calls
 * `getIsAdmin()` as defence-in-depth and 404s if it ever runs without
 * the `x-atlas-admin` signal.
 *
 * Cold-start budget: < 1.5 s against the Supabase pooler. All deck stats
 * fan out through a single flat `Promise.all` inside `getBridgeStats()`.
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SiteBackground from "@/components/chrome/SiteBackground";
import LiveTelemetry from "@/components/chrono/LiveTelemetry";
import EntityDeck from "@/components/atlas/EntityDeck";
import { DECKS } from "@/lib/atlas/decks";
import { getIsAdmin } from "@/lib/atlas/auth";
import { getBridgeStats } from "@/lib/atlas/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Brücke" };

export default async function AtlasBridgePage() {
  if (!(await getIsAdmin())) notFound();

  const stats = await getBridgeStats();
  const now = new Date();

  const junctionTotal = stats.junctions.rowCount;
  const totalRows = DECKS.reduce(
    (sum, d) => (d.id === "junctions" ? sum : sum + stats[d.id].rowCount),
    0,
  );

  return (
    <main className="atlas">
      <SiteBackground variant="vista" position="50% 22%" />

      <header className="atlas-hero" aria-label="Atlas — Kommando-Brücke">
        <div className="atlas-hero__line">
          <span className="atlas-hero__dot" aria-hidden />
          <span>{"// ATLAS · KOMMANDO-BRÜCKE · LECTIO"}</span>
          <span className="atlas-hero__dot" aria-hidden />
        </div>
        <h1 className="atlas-hero__title">BRÜCKE</h1>
        <p className="atlas-hero__sub">
          Zwölf Decks · jede Entität als Read-only-Strang über dem Live-Schema.
        </p>
        <div className="atlas-hero__telemetry">
          <span className="atlas-hero__readout">
            <span className="atlas-hero__readout-num">{DECKS.length}</span>
            <span className="atlas-hero__readout-tag">DECKS</span>
          </span>
          <span className="atlas-hero__sep" aria-hidden>
            ·
          </span>
          <span className="atlas-hero__readout">
            <span className="atlas-hero__readout-num">
              {new Intl.NumberFormat("de-DE").format(totalRows)}
            </span>
            <span className="atlas-hero__readout-tag">EINTRÄGE</span>
          </span>
          <span className="atlas-hero__sep" aria-hidden>
            ·
          </span>
          <LiveTelemetry
            label="LOAD"
            initial={87.3}
            min={84}
            max={92}
            unit="%"
            interval={1600}
            drift={0.04}
          />
          <LiveTelemetry
            label="COGITATIO"
            initial={1.024}
            min={0.9}
            max={1.2}
            unit=""
            interval={1900}
            drift={0.08}
            decimals={3}
          />
        </div>
      </header>

      <section className="atlas-grid" aria-label="Decks">
        {DECKS.map((deck) => (
          <EntityDeck
            key={deck.id}
            deck={deck}
            stats={stats[deck.id]}
            now={now}
          />
        ))}
      </section>

      <footer className="atlas-footer">
        <span>EX · COMPENDIVM · OMNIVM</span>
        <span className="atlas-footer__mid">
          Σ JUNKTIONEN {new Intl.NumberFormat("de-DE").format(junctionTotal)} · DECKS {DECKS.length}
        </span>
        <span>STAMP M42.347</span>
      </footer>
    </main>
  );
}
