"use client";

/**
 * ArtCreditTag — the shared artist-attribution slot (Brief 150). One markup
 * for every surface that credits background artwork: label, artist name,
 * profile links. The cinematic timeline mounts it inside `.chron` (its CSS
 * positions/animates it there, unchanged); pages with a `<SiteBackground>`
 * get it with the `art-credit--site` modifier — fixed bottom-right, styled in
 * `41-site-bg.css`. Links are real anchors: keyboard-reachable, with a
 * focus-visible ring from the site base styles.
 *
 * Client component only for the optional `onClick` (the timeline intro stops
 * propagation so a credit click doesn't double as its dismiss tap).
 */
import type { MouseEvent } from "react";
import type { ArtCredit } from "@/lib/art-credits";

export default function ArtCreditTag({
  credit,
  className,
  onClick,
}: {
  credit: ArtCredit;
  className?: string;
  onClick?: (e: MouseEvent) => void;
}) {
  return (
    <div
      className={`art-credit${className ? ` ${className}` : ""}`}
      onClick={onClick}
    >
      <span className="ac-lab">ARTWORK</span>
      <span className="ac-name">{credit.name}</span>
      {credit.links.length > 0 && (
        <span className="ac-links">
          {credit.links.map((l) => (
            <a key={l.url} href={l.url} target="_blank" rel="noopener">
              {l.label}
            </a>
          ))}
        </span>
      )}
    </div>
  );
}
