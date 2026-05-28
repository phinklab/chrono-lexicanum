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
import CatalogueTelemetry from "@/components/chrono/CatalogueTelemetry";
import EntityDeck from "@/components/atlas/EntityDeck";
import { DECKS } from "@/lib/atlas/decks";
import { getIsAdmin } from "@/lib/atlas/auth";
import { getBridgeStats } from "@/lib/atlas/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Bridge" };

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

      <header className="atlas-hero" aria-label="Atlas — Command Bridge">
        <div className="atlas-hero__line">
          <span className="atlas-hero__dot" aria-hidden />
          <span>{"// ATLAS · COMMAND BRIDGE · LECTIO"}</span>
          <span className="atlas-hero__dot" aria-hidden />
        </div>
        <h1 className="atlas-hero__title">BRIDGE</h1>
        <p className="atlas-hero__sub">
          Twelve decks · every entity as a read-only strand over the live schema.
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
              {new Intl.NumberFormat("en-US").format(totalRows)}
            </span>
            <span className="atlas-hero__readout-tag">ENTRIES</span>
          </span>
          <span className="atlas-hero__sep" aria-hidden>
            ·
          </span>
          <CatalogueTelemetry />
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
          Σ JUNCTIONS {new Intl.NumberFormat("en-US").format(junctionTotal)} · DECKS {DECKS.length}
        </span>
        <span>STAMP M42.347</span>
      </footer>
    </main>
  );
}
