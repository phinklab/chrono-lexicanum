/**
 * StubPage — phase-2 placeholder for `/atlas/junctions`. After Task 4D
 * this is the ONLY deck that still falls through to the stub; every
 * Phase-1 deck (werke + the ten admin-inventory decks) has its own
 * page component. The dispatcher's `default:` arm preserves a safe
 * landing if a future deck registers without its own page.
 */
import Link from "next/link";
import SiteBackground from "@/components/chrome/SiteBackground";
import EntityHeader from "@/components/atlas/EntityHeader";
import type { DeckMeta } from "@/lib/atlas/types";

export default function StubPage({ deck }: { deck: DeckMeta }) {
  return (
    <main className="atlas atlas--entity atlas--stub">
      <SiteBackground variant="vista" position="50% 22%" />
      <EntityHeader deck={deck} rowCount={null} totalCount={null} />

      <section className="atlas-entity__body">
        <div className="atlas-stub c-glass c-corners">
          <span className="atlas-stub__eyebrow">
            {"PHASE 2 — JUNCTIONS-DRILLDOWN"}
          </span>
          <h2 className="atlas-stub__title">Drilldown to follow.</h2>
          <p className="atlas-stub__body">
            The data node is live; the row count on the Bridge matches the
            database. The audit surface itself is Phase 2 work.
          </p>
          <p className="atlas-stub__body">
            <strong>Junctions drilldown (Slice 5):</strong> six panels over
            work_factions, work_characters, work_locations, work_persons,
            work_facets, work_collections — each with row count, drift count
            (rawName ≠ canonical.name) and gap count (works without junction).
            A two-sided picker leads from the canonical entry on the left to
            all linked works on the right.
          </p>
          <div className="atlas-stub__cta">
            <Link href="/atlas" className="atlas-stub__back">
              ← Back to the Bridge
            </Link>
            {deck.publicDetailPattern && (
              <span className="atlas-stub__detail">
                Detail route (public): <code>{deck.publicDetailPattern}</code>
              </span>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
