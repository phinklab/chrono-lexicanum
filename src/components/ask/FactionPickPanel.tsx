"use client";

import { useState } from "react";
import Link from "next/link";
import BtnFx from "@/components/shared/BtnFx";
import type { FactionStarterKind, FactionStarterPick } from "@/lib/ask/faction-starters-schema";

const KIND_LABEL: Record<FactionStarterKind, string> = {
  "audio-drama": "Audio drama",
  audiobook: "Audiobook",
  "short-story": "Short story",
  series: "Series",
  trilogy: "Trilogy",
  omnibus: "Omnibus",
};

type FactionPickPanelProps = {
  /** Display name of the selected (sub)faction — used only for the sr-only count. */
  contextLabel: string;
  /** Ordered picks; picks[0] is primary. Reshuffle cycles, wrap-around. */
  picks: readonly FactionStarterPick[];
};

/**
 * The verdict block of a carousel slide: one curated entry-point at
 * a time. The rail/chips above already name the faction + chapter, so the
 * kicker is just the role; `contextLabel` survives only for the screen-reader
 * count. When the node carries ≥2 picks the others are listed BY TITLE as
 * dimmed Sternwarte buttons below the verdict (ephemeral client state, NOT in
 * the URL) — clicking one swaps it into the verdict block. A resolved pick links
 * to `/book/{slug}`, which the existing intercepting route opens as the book
 * popup; an unresolved pick renders its title without a link.
 */
export default function FactionPickPanel({ contextLabel, picks }: FactionPickPanelProps) {
  const [index, setIndex] = useState(0);
  const safeIndex = index % picks.length;
  const pick = picks[safeIndex]!;

  return (
    <div className="ask-pick" aria-live="polite">
      {/* Keyed on the pick so a reshuffle re-triggers the reveal (motion is
          gated on prefers-reduced-motion in CSS). */}
      <div className="ask-pick__body" key={safeIndex}>
        <h2 className="ask-pick__title">{pick.title}</h2>
        <div className="ask-pick__meta">
          {pick.author && <span className="ask-pick__author">{pick.author}</span>}
          {pick.kind && <span className="ask-pick__badge">{KIND_LABEL[pick.kind]}</span>}
        </div>
        {pick.note && <p className="ask-pick__note">{pick.note}</p>}

        <div className="ask-pick__actions">
          {pick.book ? (
            <Link href={`/book/${pick.book}`} className="lx-btn lx-btn--primary ask-pick__open">
              Open the book
              <span className="lx-btn__mark" aria-hidden>
                →
              </span>
              <BtnFx />
            </Link>
          ) : (
            <span className="ask-pick__pending">Not in the archive yet</span>
          )}
        </div>
      </div>

      {picks.length > 1 && (
        <div className="ask-pick__alts">
          <p className="ask-pick__alts-label">
            {picks.length === 2 ? "Alternative" : "Alternatives"}
          </p>
          <div className="ask-pick__alts-row">
            {picks.map((p, i) =>
              i === safeIndex ? null : (
                <button
                  key={p.title}
                  type="button"
                  className="lx-btn ask-pick__alt"
                  onClick={() => setIndex(i)}
                >
                  {p.title}
                  <BtnFx />
                </button>
              ),
            )}
          </div>
          <span className="ask-sr-only">
            Pick {safeIndex + 1} of {picks.length} for {contextLabel}.
          </span>
        </div>
      )}
    </div>
  );
}
