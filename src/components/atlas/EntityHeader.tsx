/**
 * EntityHeader — the eyebrow + title + sub-line + optional headline pill
 * that anchors every `/atlas/[entity]` surface (werke, all ten inventory
 * decks, and the junctions stub). Extracted from the dispatcher in
 * Task 4A so inventory pages don't re-implement the chrome.
 *
 * Werke passes `isAuditMode` + `driftSortActive` for the audit-trail
 * marker; inventory pages omit both. `primaryStat`'s presence drives the
 * ProvenancePill row.
 */
import Link from "next/link";
import ProvenancePill from "./ProvenancePill";
import type { DeckMeta } from "@/lib/atlas/types";

interface EntityHeaderProps {
  deck: DeckMeta;
  rowCount: number | null;
  totalCount: number | null;
  primaryStat?: { label: string; value: string };
  isAuditMode?: boolean;
  driftSortActive?: boolean;
}

export default function EntityHeader({
  deck,
  rowCount,
  totalCount,
  primaryStat,
  isAuditMode = false,
  driftSortActive = false,
}: EntityHeaderProps) {
  return (
    <header className="atlas-entity__hero" aria-label={`Atlas — ${deck.label}`}>
      <div className="atlas-entity__eyebrow">
        <Link href="/atlas" className="atlas-entity__back">
          ← BRIDGE
        </Link>
        <span className="atlas-entity__divider" aria-hidden>
          /
        </span>
        <span>{deck.label}</span>
      </div>
      <h1 className="atlas-entity__title">{deck.label}</h1>
      <p className="atlas-entity__sub">
        {rowCount === null
          ? deck.blurb
          : isAuditMode
            ? `${rowCount} audit hits of ${totalCount} entries · ${deck.blurb}`
            : `${rowCount} of ${totalCount} entries · ${deck.blurb}`}
      </p>
      {primaryStat && (
        <div className="atlas-entity__stat-row">
          <ProvenancePill
            label={primaryStat.label}
            value={primaryStat.value}
            accent={deck.accent}
          />
          {driftSortActive && (
            <span className="atlas-entity__audit-mark">DRIFT SORTING ACTIVE</span>
          )}
        </div>
      )}
    </header>
  );
}
