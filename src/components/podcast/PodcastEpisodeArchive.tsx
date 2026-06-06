"use client";

/**
 * PodcastEpisodeArchive — the interactive episode list for /podcasts/[slug].
 *
 * Receives a fully-serialized episode set from the server loader (no `@/db`
 * import here — the loader type comes in via `import type`, which is erased, so
 * the client bundle stays pure). Owns three things the static page can't:
 *   1. a bespoke filter bar (title search + kind toggle + year quick-jump),
 *   2. one-at-a-time inline playback (native <audio>, dark controls),
 *   3. download links + faction chips that route into /werke.
 *
 * The visual vocabulary is borrowed from /werke + /ask (hairline rows, cyan
 * pills); the filter *logic* is its own — no portage of the works filters.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import type { PodcastEpisode } from "@/app/podcasts/loader";

type Props = {
  episodes: PodcastEpisode[];
  showTitle: string;
};

// Editorial vocabulary for episodeKind. 'lore' is the house norm for a lore
// podcast, so it stays unchipped on the row (a wall of identical "LORE" chips
// would be noise) — only off-format episodes carry a tag.
const KIND_LABELS: Record<string, string> = {
  lore: "Lore",
  interview: "Interview",
  news_recap: "News",
  other: "Other",
};
const KIND_ORDER = ["lore", "interview", "news_recap", "other"];

const DAY_MONTH = new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" });

function shortDate(ms: number | null): string {
  return ms == null ? "—" : DAY_MONTH.format(new Date(ms));
}

function formatDuration(sec: number | null): string | null {
  if (sec == null || sec <= 0) return null;
  // Round to whole minutes first, then split — so 3599s → "1h 00m", never "60m".
  const totalMin = Math.round(sec / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m`;
}

function yearOf(ms: number | null): number | null {
  return ms == null ? null : new Date(ms).getUTCFullYear();
}

interface YearGroup {
  year: number | null;
  episodes: PodcastEpisode[];
}

/** Group an already-newest-first list into year buckets, preserving order. */
function groupByYear(episodes: PodcastEpisode[]): YearGroup[] {
  const groups: YearGroup[] = [];
  let current: YearGroup | null = null;
  for (const ep of episodes) {
    const y = yearOf(ep.pubDateMs);
    if (!current || current.year !== y) {
      current = { year: y, episodes: [] };
      groups.push(current);
    }
    current.episodes.push(ep);
  }
  return groups;
}

function yearAnchor(year: number | null): string {
  return `pod-year-${year ?? "undated"}`;
}

/** Does an episode pass the filter? `q` is expected already trimmed+lowercased. */
function epMatches(ep: PodcastEpisode, q: string, kind: string): boolean {
  if (kind !== "all" && ep.episodeKind !== kind) return false;
  if (q && !ep.title.toLowerCase().includes(q)) return false;
  return true;
}

export default function PodcastEpisodeArchive({ episodes, showTitle }: Props) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<string>("all");
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Kind toggles reflect only the kinds this show actually carries; a show that
  // is pure 'lore' gets no kind row at all.
  const presentKinds = useMemo(
    () => KIND_ORDER.filter((k) => episodes.some((e) => e.episodeKind === k)),
    [episodes],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return episodes.filter((ep) => epMatches(ep, q, kind));
  }, [episodes, query, kind]);

  const groups = useMemo(() => groupByYear(filtered), [filtered]);
  const jumpYears = useMemo(
    () => groups.map((g) => g.year).filter((y): y is number => y != null),
    [groups],
  );

  const filtering = query.trim().length > 0 || kind !== "all";

  // When a filter change would hide the playing episode, stop it here in the
  // handler (not an effect) — otherwise clearing the filter later would remount
  // its row and autoPlay would restart it from 0.
  function reconcilePlaying(nextQuery: string, nextKind: string) {
    if (!playingId) return;
    const ep = episodes.find((e) => e.id === playingId);
    if (!ep || !epMatches(ep, nextQuery.trim().toLowerCase(), nextKind)) {
      setPlayingId(null);
    }
  }

  function changeQuery(next: string) {
    setQuery(next);
    reconcilePlaying(next, kind);
  }
  function changeKind(next: string) {
    setKind(next);
    reconcilePlaying(query, next);
  }

  function jumpTo(year: number) {
    const el = document.getElementById(yearAnchor(year));
    if (!el) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  function resetFilters() {
    setQuery("");
    setKind("all");
  }

  return (
    <section className="pod-archive" aria-label={`${showTitle} — episodes`}>
      <div className="pod-filter" role="search">
        <div className="pod-filter__search">
          <span className="pod-filter__sigil" aria-hidden>
            ⌕
          </span>
          <input
            type="search"
            className="pod-filter__input"
            placeholder="Search episodes by title…"
            aria-label="Search episodes by title"
            value={query}
            onChange={(e) => changeQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              className="pod-filter__clear"
              aria-label="Clear search"
              onClick={() => changeQuery("")}
            >
              ✕
            </button>
          )}
        </div>

        {presentKinds.length > 1 && (
          <div className="pod-filter__kinds" role="group" aria-label="Filter by kind">
            <button
              type="button"
              className={`pod-pill${kind === "all" ? " is-active" : ""}`}
              aria-pressed={kind === "all"}
              onClick={() => changeKind("all")}
            >
              All
            </button>
            {presentKinds.map((k) => (
              <button
                key={k}
                type="button"
                className={`pod-pill${kind === k ? " is-active" : ""}`}
                aria-pressed={kind === k}
                onClick={() => changeKind(k)}
              >
                {KIND_LABELS[k] ?? k}
              </button>
            ))}
          </div>
        )}

        <span className="pod-filter__status" role="status" aria-live="polite">
          {filtered.length} of {episodes.length} shown
          {filtered.length === 0 ? " — no matches" : ""}
        </span>
      </div>

      {jumpYears.length > 1 && (
        <nav className="pod-jump" aria-label="Jump to year">
          {jumpYears.map((y) => (
            <button
              key={y}
              type="button"
              className="pod-jump__pill"
              onClick={() => jumpTo(y)}
            >
              {y}
            </button>
          ))}
        </nav>
      )}

      {filtered.length === 0 ? (
        <div className="pod-archive__empty c-glass c-corners">
          <p>No episodes match {filtering ? "these filters" : "this view"}.</p>
          {filtering && (
            <button type="button" className="pod-pill" onClick={resetFilters}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="pod-archive__list">
          {groups.map((g) => (
            <section
              className="pod-year"
              id={yearAnchor(g.year)}
              key={g.year ?? "undated"}
            >
              <h3 className="pod-year__label">
                <span>{g.year ?? "Undated"}</span>
                <span className="pod-year__count">{g.episodes.length}</span>
              </h3>
              <ol className="pod-episodes">
                {g.episodes.map((ep) => (
                  <li className="pod-ep-item" key={ep.id}>
                    <EpisodeRow
                      ep={ep}
                      playing={playingId === ep.id}
                      onToggle={() =>
                        setPlayingId((cur) => (cur === ep.id ? null : ep.id))
                      }
                    />
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function EpisodeRow({
  ep,
  playing,
  onToggle,
}: {
  ep: PodcastEpisode;
  playing: boolean;
  onToggle: () => void;
}) {
  const dur = formatDuration(ep.durationSec);
  const showKind = ep.episodeKind != null && ep.episodeKind !== "lore";
  const kindLabel = ep.episodeKind
    ? KIND_LABELS[ep.episodeKind] ?? ep.episodeKind
    : null;
  const canPlay = Boolean(ep.audioUrl);

  return (
    <>
      <div className={`pod-ep${playing ? " is-playing" : ""}`}>
        {canPlay ? (
          <button
            type="button"
            className="pod-ep__play"
            aria-label={`${playing ? "Stop" : "Play"} ${ep.title}`}
            onClick={onToggle}
          >
            <span aria-hidden>{playing ? "❙❙" : "▸"}</span>
          </button>
        ) : (
          <span className="pod-ep__play pod-ep__play--off" aria-hidden>
            —
          </span>
        )}

        <span className="pod-ep__date">{shortDate(ep.pubDateMs)}</span>

        <div className="pod-ep__main">
          <span className="pod-ep__title">{ep.title}</span>
          {ep.factions.length > 0 && (
            <span className="pod-ep__tags">
              {ep.factions.map((f) => (
                <Link
                  key={f.id}
                  href={`/werke?faction=${f.id}`}
                  className="pod-tag"
                >
                  {f.name}
                </Link>
              ))}
            </span>
          )}
        </div>

        <span className="pod-ep__meta">
          {showKind && kindLabel && (
            <span className="pod-ep__kind">{kindLabel}</span>
          )}
          {dur && <span className="pod-ep__dur">{dur}</span>}
          {ep.audioUrl && (
            <a
              className="pod-ep__dl"
              href={ep.audioUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Download ${ep.title}`}
            >
              Download ↓
            </a>
          )}
        </span>
      </div>

      {playing && ep.audioUrl && (
        <div className="pod-ep__player">
          {/* Native element keeps playback accessible & robust; colorScheme:dark
              paints dark transport controls. autoPlay is user-initiated (the ▸
              click), so it is allowed and starts immediately. */}
          <audio
            controls
            autoPlay
            preload="none"
            src={ep.audioUrl}
            aria-label={`${ep.title} — audio player`}
            style={{ colorScheme: "dark", width: "100%" }}
          />
        </div>
      )}
    </>
  );
}
