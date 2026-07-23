"use client";

import { ARTIST_YOUTUBE_URL, TRACKS } from "@/lib/audio-tracks";

type VolumePopoverProps = {
  isOpen: boolean;
  volume: number;
  onVolumeChange: (volume: number) => void;
};

export function VolumePopover({
  isOpen,
  volume,
  onVolumeChange,
}: VolumePopoverProps) {
  return (
    <div
      className={`media-player__vol-popover${isOpen ? " is-open" : ""}`}
      aria-hidden={!isOpen}
    >
      <input
        type="range"
        className="media-player__volume"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={(event) => onVolumeChange(parseFloat(event.target.value))}
        tabIndex={isOpen ? 0 : -1}
        aria-label="Volume"
      />
    </div>
  );
}

type PlaylistPanelProps = {
  isOpen: boolean;
  isPlaying: boolean;
  trackIndex: number;
  onPlayTrack: (trackIndex: number) => void;
};

export function PlaylistPanel({
  isOpen,
  isPlaying,
  trackIndex,
  onPlayTrack,
}: PlaylistPanelProps) {
  return (
    <div className="media-player__panel-wrap" aria-hidden={!isOpen}>
      <div className="media-player__panel-wrap-inner">
        {/* Disclosure panel, not a dialog: the trigger carries aria-expanded,
            and the transport shell owns Escape/focus restoration. */}
        <div className="media-player__panel" role="group" aria-label="Playlist">
          <div className="media-player__panel-head">
            <span className="media-player__panel-kicker">PLAYLIST</span>
            <span className="c-hairline media-player__panel-rule" />
            <a
              className="media-player__panel-link"
              href={ARTIST_YOUTUBE_URL}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={isOpen ? 0 : -1}
            >
              Artist YouTube
              <span className="media-player__panel-link-arrow" aria-hidden>
                ↗
              </span>
            </a>
          </div>
          <ul className="media-player__panel-list">
            {TRACKS.map((track, index) => {
              const active = index === trackIndex;
              const rowClass = [
                "media-player__panel-track",
                active ? "is-active" : "",
                active && isPlaying ? "is-playing" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <li key={track.id}>
                  <button
                    type="button"
                    className={rowClass}
                    onClick={() => onPlayTrack(index)}
                    tabIndex={isOpen ? 0 : -1}
                    aria-current={active}
                    aria-label={`${track.title}, ${active && isPlaying ? "pause" : "play"}`}
                  >
                    <span
                      className="media-player__panel-track-mark"
                      aria-hidden
                    >
                      {active
                        ? isPlaying
                          ? "❚❚"
                          : "▶"
                        : String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="media-player__panel-track-title">
                      {track.title}
                    </span>
                    <span
                      className="media-player__panel-track-tail"
                      aria-hidden
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
