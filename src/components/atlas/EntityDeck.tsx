/**
 * EntityDeck — one card on the Atlas-Brücke. Server component.
 *
 * Renders the deck's mono label, the live row count, the headline
 * ProvenancePill, a one-sentence blurb, an optional relative-time
 * stamp (only `werke` + `submissions` carry an updatedAt today), and
 * a small CTA chevron. The whole card is a single `<Link>` to the
 * deck's route — `/atlas/[entity]` resolves to either the real list
 * (`werke`) or a stub placeholder.
 */
import Link from "next/link";
import type { DeckMeta, DeckStats } from "@/lib/atlas/types";
import ProvenancePill from "./ProvenancePill";

interface EntityDeckProps {
  deck: DeckMeta;
  stats: DeckStats;
  now: Date;
}

function formatRelative(date: Date, now: Date): string {
  const diffMs = now.getTime() - date.getTime();
  const sec = Math.max(0, Math.round(diffMs / 1000));
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  if (sec < 30) return "just now";
  if (min < 1) return `${sec}s ago`;
  if (hr < 1) return `${min} min ago`;
  if (day < 1) return `${hr} hr ago`;
  if (day < 7) return `${day} day${day === 1 ? "" : "s"} ago`;
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(date);
}

export default function EntityDeck({ deck, stats, now }: EntityDeckProps) {
  const isPhase2 = deck.phase === 2;
  const rowDisplay = new Intl.NumberFormat("en-US").format(stats.rowCount);

  return (
    <Link
      href={deck.route}
      className={`atlas-deck c-glass c-corners atlas-deck--${deck.accent}${
        isPhase2 ? " atlas-deck--phase2" : ""
      }`}
      aria-label={`${deck.label}: ${rowDisplay} entries, ${deck.blurb}`}
    >
      <header className="atlas-deck__head">
        <span className="atlas-deck__label">{deck.label}</span>
        {isPhase2 && (
          <span className="atlas-deck__phase" aria-label="Phase 2 — Stub">
            PHASE 2
          </span>
        )}
      </header>

      <div className="atlas-deck__count">
        <span className="atlas-deck__count-num">{rowDisplay}</span>
        <span className="atlas-deck__count-tag">ENTRIES</span>
      </div>

      <ProvenancePill
        label={stats.primaryStat.label}
        value={stats.primaryStat.value}
        accent={deck.accent}
      />

      <p className="atlas-deck__blurb">{deck.blurb}</p>

      <footer className="atlas-deck__foot">
        {stats.lastUpdated ? (
          <time
            className="atlas-deck__time"
            dateTime={stats.lastUpdated.toISOString()}
            title={stats.lastUpdated.toLocaleString("en-US")}
          >
            last {formatRelative(stats.lastUpdated, now)}
          </time>
        ) : (
          <span className="atlas-deck__time atlas-deck__time--mute">
            No timestamp
          </span>
        )}
        <span className="atlas-deck__cta" aria-hidden>
          OPEN →
        </span>
      </footer>
    </Link>
  );
}
