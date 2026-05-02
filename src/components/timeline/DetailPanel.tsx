"use client";

/**
 * DetailPanel — hero modal that opens when `?book=<slug>` is present on
 * `/timeline`. Server-side `loadBookDetail` in page.tsx fetches the heavy
 * BookDetail shape and passes it as a prop; this component owns the
 * interaction lifecycle (ESC, backdrop, focus-trap, focus-on-open,
 * focus-return on close, series-volume nav).
 *
 * URL contract: opening the panel via BookDot click pushes
 * /timeline?era=<era_id>&book=<slug> (constraint 6 from session 025 brief).
 * Series prev/next nav also pushes (each volume gets its own history entry,
 * so Browser-Back walks through them naturally). Cross-era nav is the norm:
 * Legion (great_crusade Vol 7) → Mechanicum (horus_heresy Vol 9), so the
 * URL push uses the sibling's own primaryEraId, not the current era param.
 *
 * Close handler always router.push('/timeline?era=' + eraId): predictable,
 * keeps EraDetail mounted (constraint 11), Browser-Back walks naturally
 * because BookDot click also pushes. The router.back() heuristic was
 * considered (window.history.length is tab-global → can jump off-site;
 * document.referrer adds runtime branching for marginal UX) and rejected.
 *
 * Focus return: BookDot is upgraded to <button> with stable
 * id="book-marker-{slug}" (next commit). On panel unmount this component
 * focuses that element with preventScroll: true so a panned-away dot
 * doesn't jerk the viewport.
 *
 * `prefers-reduced-motion`: the global cascade in src/app/globals.css
 * collapses both animation- and transition-duration to 0.001ms !important,
 * so dmFade/dmRise and all hover transitions are covered automatically —
 * no @media block needed in the panel CSS.
 */

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatRange, type BookDetail, type ExternalLinkKind } from "@/lib/timeline";
import { buildBookUrl, buildCloseUrl } from "@/lib/timelineUrl";

interface Props {
  selectedBook: BookDetail | null;
  eraId: string | null;
}

/** Reading-Notes block: 5 curated facet categories in this order. Brief
 *  constraint 12. The other 7 categories live in BookDetail.facets but are
 *  rendered by the FilterRail (2a.2), not here. */
const READING_NOTES_ORDER = [
  "entry_point",
  "length_tier",
  "tone",
  "theme",
  "content_warning",
] as const;

/** Sources block grouping order. Action-types (read/listen/watch) first,
 *  buy_print as a neutral action (no CTA framing per constraint 20),
 *  meta-links (trailer/official_page) after, reference last as the
 *  lookup-when-curious backstop. Brief constraint 17 — references must
 *  not float above lese/hör/seh options. */
const SOURCES_KIND_ORDER: Array<{ kind: ExternalLinkKind; label: string }> = [
  { kind: "read", label: "Read" },
  { kind: "listen", label: "Listen" },
  { kind: "watch", label: "Watch" },
  { kind: "buy_print", label: "Buy" },
  { kind: "trailer", label: "Trailer" },
  { kind: "official_page", label: "Official site" },
  { kind: "reference", label: "Reference" },
];

/** Faction render order: primary → supporting → antagonist. */
const FACTION_ROLE_ORDER: Record<string, number> = {
  primary: 0,
  supporting: 1,
  antagonist: 2,
};

export function DetailPanel({ selectedBook, eraId }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const panelRef = useRef<HTMLDivElement>(null);
  /** Tracks the slug of the currently-open book so the unmount cleanup can
   *  focus the originating BookDot even after `selectedBook` is already null
   *  on the closing render. */
  const lastSlugRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedBook) lastSlugRef.current = selectedBook.slug;
  }, [selectedBook]);

  useEffect(() => {
    if (!selectedBook) return;
    const root = panelRef.current;
    if (!root) return;

    const closeBtn = root.querySelector<HTMLButtonElement>("[data-dm-close]");
    closeBtn?.focus();

    function getFocusable(): HTMLElement[] {
      if (!root) return [];
      return Array.from(
        root.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      );
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = getFocusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBook]);

  // Focus-return when the panel unmounts (cleanup runs on every render where
  // selectedBook flips to null, plus the final unmount).
  useEffect(() => {
    return () => {
      const slug = lastSlugRef.current;
      if (!slug) return;
      const target = document.getElementById(`book-marker-${slug}`);
      target?.focus({ preventScroll: true });
    };
  }, []);

  function handleClose() {
    // Preserve FilterRail state on close (brief 029 constraint 10 — modal
    // and filter URL state are orthogonal; closing must not strip filters
    // and re-render the unfiltered track behind the user's back).
    router.push(buildCloseUrl(eraId, new URLSearchParams(sp.toString())));
  }

  if (!selectedBook) return null;

  const titleId = `dm-title-${selectedBook.slug}`;
  const series = selectedBook.series;

  const factionsSorted = [...selectedBook.factions].sort(
    (a, b) => (FACTION_ROLE_ORDER[a.role] ?? 1) - (FACTION_ROLE_ORDER[b.role] ?? 1),
  );

  const readingNotes = READING_NOTES_ORDER.map((catId) => selectedBook.facets[catId]).filter(
    (c): c is BookDetail["facets"][string] => Boolean(c) && c.values.length > 0,
  );

  const sourceGroups = SOURCES_KIND_ORDER.map(({ kind, label }) => ({
    kind,
    label,
    links: selectedBook.externalLinks.filter((l) => l.kind === kind),
  })).filter((g) => g.links.length > 0);

  const eraEyebrow = selectedBook.primaryEraId.replace(/_/g, " ").toUpperCase();
  const coverCrest = factionsSorted[0]?.glyph ?? null;

  return (
    <>
      <div className="dm-backdrop" onClick={handleClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className="detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button
          data-dm-close
          type="button"
          className="dm-close"
          onClick={handleClose}
          aria-label="Close"
        >
          ×
        </button>

        <div className="dm-left">
          <div className="dm-cover-wrap">
            <div className="dm-cover">
              <div className="dm-cover-bg" data-era={selectedBook.primaryEraId} />
              <div className="dm-cover-inner">
                <div className="dm-cover-eyebrow">{eraEyebrow}</div>
                <div className="dm-cover-title">{selectedBook.title}</div>
                {selectedBook.authors.length > 0 && (
                  <div className="dm-cover-author">{selectedBook.authors.join(" · ")}</div>
                )}
                {coverCrest && <div className="dm-cover-crest">{coverCrest}</div>}
              </div>
            </div>
            <div className="dm-cover-caption">Cover art coming soon</div>
          </div>
        </div>

        <div className="dm-right">
          {series && (
            <div className="dm-series">
              <span className="dm-series-mark" aria-hidden="true">◆</span>
              <span className="dm-series-name">{series.name}</span>
              <div className="dm-vol-nav">
                <button
                  type="button"
                  className="dm-vol-btn"
                  disabled={!series.prev}
                  aria-label="Previous volume"
                  onClick={() => {
                    if (!series.prev) return;
                    router.push(
                      buildBookUrl(
                        series.prev.primaryEraId,
                        series.prev.slug,
                        new URLSearchParams(sp.toString()),
                      ),
                    );
                  }}
                >
                  ◂
                </button>
                <span className="dm-vol-count">
                  {series.order ? `Vol ${series.order}` : ""}
                  {series.totalPlanned ? ` / ${series.totalPlanned}` : ""}
                </span>
                <button
                  type="button"
                  className="dm-vol-btn"
                  disabled={!series.next}
                  aria-label="Next volume"
                  onClick={() => {
                    if (!series.next) return;
                    router.push(
                      buildBookUrl(
                        series.next.primaryEraId,
                        series.next.slug,
                        new URLSearchParams(sp.toString()),
                      ),
                    );
                  }}
                >
                  ▸
                </button>
              </div>
            </div>
          )}

          <div className="dm-titleblock">
            <h2 id={titleId} className="dm-title">
              {selectedBook.title}
            </h2>
            <div className="dm-byline">
              {selectedBook.authors.length > 0 && (
                <span className="dm-author">{selectedBook.authors.join(", ")}</span>
              )}
              {selectedBook.releaseYear && (
                <>
                  <span className="dm-dot" aria-hidden="true">·</span>
                  <span className="dm-pub">First published {selectedBook.releaseYear}</span>
                </>
              )}
            </div>
          </div>

          <div className="dm-meta-grid">
            <div className="dm-meta">
              <div className="dm-meta-lbl">In-universe</div>
              <div className="dm-meta-val lum">
                {formatRange(selectedBook.startY, selectedBook.endY)}
              </div>
            </div>
            {selectedBook.releaseYear && (
              <div className="dm-meta">
                <div className="dm-meta-lbl">Published</div>
                <div className="dm-meta-val">{selectedBook.releaseYear}</div>
              </div>
            )}
          </div>

          {selectedBook.synopsis && (
            <div className="dm-section">
              <div className="dm-section-lbl">Synopsis</div>
              <p className="dm-synopsis">{selectedBook.synopsis}</p>
            </div>
          )}

          {factionsSorted.length > 0 && (
            <div className="dm-section">
              <div className="dm-section-lbl">Factions</div>
              <div className="dm-tags">
                {factionsSorted.map((f) => (
                  <span key={f.id} className={`dm-tag dm-tag-align-${f.alignment}`}>
                    {f.glyph && (
                      <span className="dm-tag-ico" aria-hidden="true">
                        {f.glyph}
                      </span>
                    )}
                    {f.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {readingNotes.length > 0 && (
            <div className="dm-section dm-reading-notes">
              <div className="dm-section-lbl">Reading notes</div>
              {readingNotes.map((cat) => (
                <div
                  key={cat.categoryId}
                  className={`dm-rn-section${cat.categoryId === "content_warning" ? " warning" : ""}`}
                >
                  <div className="dm-rn-label">{cat.categoryName}</div>
                  <div className="dm-rn-chips">
                    {cat.values.map((v) => (
                      <span key={v.id} className="dm-rn-chip">
                        {v.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedBook.characters.length > 0 && (
            <div className="dm-section">
              <div className="dm-section-lbl">Characters</div>
              <div className="dm-tags">
                {selectedBook.characters.map((c) => (
                  <span key={c.id} className="dm-tag">
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {sourceGroups.length > 0 && (
            <div className="dm-section dm-sources">
              <div className="dm-section-lbl">Sources</div>
              {sourceGroups.map((g) => (
                <div key={g.kind} className="dm-src-group">
                  <div className="dm-src-group-label">{g.label}</div>
                  <ul className="dm-src-list">
                    {g.links.map((l) => (
                      <li key={`${l.serviceId}-${l.url}`}>
                        <a
                          className="dm-src-link"
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {l.label || l.serviceName}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
