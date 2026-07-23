"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ARTIST_YOUTUBE_URL, TRACKS, type AudioTrack } from "@/lib/audio-tracks";

/**
 * Sitewide ambient strip with a fixed header and FFT-reactive wave. Volume
 * and playlist overlays are mutually exclusive and close on outside clicks;
 * playback remains available without hover-only interaction.
 */

const FFT_SIZE = 256;
const WAVE_VIEW_W = 1024;
const WAVE_VIEW_H = 80;
const N_BARS = 96;
const BAR_PITCH = WAVE_VIEW_W / N_BARS;
const FREQ_LO_BIN = 3;
const FREQ_HI_BIN = 48;
const IDLE_BREATHE_BASE = 0.14;
const AMP_SMOOTH_ALPHA = 0.14;
const BAR_TEXTURE_ALPHA = 0.28;
const TRACE_AMP_SCALE = 0.95;
const TRACE_AMP_CAP = 0.44;
const PLAY_AMP_BASE = 0.4;
const PLAY_AMP_GAIN = 1.4;

export default function MediaPlayer() {
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isVolOpen, setIsVolOpen] = useState(false);
  // Mobile only: the collapsed stud ⇄ expanded card state. Desktop CSS hides
  // the stud and shows the strip permanently, so this stays false there.
  const [miniOpen, setMiniOpen] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [reducedMotion, setReducedMotion] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const barsPathRef = useRef<SVGPathElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  // Popover triggers — Escape inside the player closes the open popover and
  // hands focus back here (disclosure pattern, see onKeyDown on the root).
  const volBtnRef = useRef<HTMLButtonElement | null>(null);
  const discloseBtnRef = useRef<HTMLButtonElement | null>(null);
  const amplitudeRef = useRef(IDLE_BREATHE_BASE);
  const barAmpsRef = useRef<Float32Array>(new Float32Array(N_BARS));
  const isPlayingRef = useRef(false);

  const hasTracks = TRACKS.length > 0;
  const currentTrack: AudioTrack | undefined = TRACKS[trackIndex];
  const trackName = hasTracks
    ? currentTrack?.title ?? "–"
    : "no atmosphere loaded";

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const setupAudioGraph = useCallback(() => {
    if (!audioRef.current || audioCtxRef.current) return;
    const AnyWin = window as unknown as { webkitAudioContext?: typeof AudioContext };
    const Ctx = window.AudioContext ?? AnyWin.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const source = ctx.createMediaElementSource(audioRef.current);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.82;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    audioCtxRef.current = ctx;
    analyserRef.current = analyser;
    sourceRef.current = source;
  }, []);

  // Wave rendering. The rAF loop runs ONLY during playback (and only while
  // the tab is visible) — paused/idle draws one static frame and lets a CSS
  // opacity animation do the breathing on the compositor.
  useEffect(() => {
    const path = barsPathRef.current;
    if (!path) return;

    const center = WAVE_VIEW_H / 2;
    const ampScale = WAVE_VIEW_H * TRACE_AMP_SCALE;

    if (reducedMotion) {
      let s = "";
      for (let i = 0; i < N_BARS; i++) {
        const x = (BAR_PITCH / 2 + i * BAR_PITCH).toFixed(1);
        s += `M${x},${(center - 1.5).toFixed(1)} L${x},${(center + 1.5).toFixed(1)} `;
      }
      path.setAttribute("d", s);
      return;
    }

    const drawFrame = (t: number, freqArray: Uint8Array | null) => {
      const amp = amplitudeRef.current;
      const barAmps = barAmpsRef.current;
      let d = "";
      for (let i = 0; i < N_BARS; i++) {
        const x = BAR_PITCH / 2 + i * BAR_PITCH;
        const u = i / (N_BARS - 1);

        let texTarget = 0;
        if (freqArray) {
          const span = FREQ_HI_BIN - FREQ_LO_BIN;
          const binIdx = Math.min(
            freqArray.length - 1,
            FREQ_LO_BIN + Math.floor(u * span),
          );
          texTarget = freqArray[binIdx] / 255;
        }
        barAmps[i] = barAmps[i] * (1 - BAR_TEXTURE_ALPHA) + texTarget * BAR_TEXTURE_ALPHA;

        const carrierA = Math.sin(u * Math.PI * 6 + t * 0.55);
        const carrierB = Math.sin(u * Math.PI * 14 - t * 0.31);
        const carrier = Math.abs(carrierA * 0.72 + carrierB * 0.28);
        const env = carrier * 0.72 + barAmps[i] * 0.55;
        const dev = Math.min(env * amp * ampScale, WAVE_VIEW_H * TRACE_AMP_CAP);

        const xs = x.toFixed(1);
        d += `M${xs},${(center - dev).toFixed(1)} L${xs},${(center + dev).toFixed(1)} `;
      }
      path.setAttribute("d", d);
    };

    if (!isPlaying) {
      amplitudeRef.current = IDLE_BREATHE_BASE;
      drawFrame(0, null);
      return;
    }

    let raf = 0;
    let t = 0;
    let freqArray: Uint8Array<ArrayBuffer> | null = null;

    const tick = () => {
      t += 0.024;

      let target = IDLE_BREATHE_BASE;
      const analyser = analyserRef.current;
      if (analyser) {
        if (!freqArray || freqArray.length !== analyser.frequencyBinCount) {
          freqArray = new Uint8Array(analyser.frequencyBinCount);
        }
        analyser.getByteFrequencyData(freqArray);
        const hi = Math.min(FREQ_HI_BIN, freqArray.length);
        const lo = Math.min(FREQ_LO_BIN, hi);
        let sum = 0;
        let cnt = 0;
        for (let i = lo; i < hi; i++) {
          sum += freqArray[i];
          cnt++;
        }
        const rms = cnt > 0 ? sum / cnt / 255 : 0;
        target = Math.min(1, PLAY_AMP_BASE + rms * PLAY_AMP_GAIN);
      }
      amplitudeRef.current =
        amplitudeRef.current * (1 - AMP_SMOOTH_ALPHA) + target * AMP_SMOOTH_ALPHA;
      drawFrame(t, freqArray);
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (!raf && !document.hidden) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    start();
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reducedMotion, isPlaying]);

  const togglePlay = useCallback(async () => {
    if (!audioRef.current || !hasTracks) return;
    setupAudioGraph();
    const ctx = audioCtxRef.current;
    if (ctx?.state === "suspended") {
      try { await ctx.resume(); } catch { /* ignore */ }
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    }
  }, [isPlaying, hasTracks, setupAudioGraph]);

  const playTrack = useCallback(
    async (i: number) => {
      if (!audioRef.current || !hasTracks) return;
      setupAudioGraph();
      const ctx = audioCtxRef.current;
      if (ctx?.state === "suspended") {
        try { await ctx.resume(); } catch { /* ignore */ }
      }
      if (i !== trackIndex) {
        setTrackIndex(i);
        setIsPlaying(true);
        return;
      }
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch {
          setIsPlaying(false);
        }
      }
    },
    [hasTracks, isPlaying, setupAudioGraph, trackIndex],
  );

  const next = useCallback(() => {
    if (!hasTracks) return;
    setTrackIndex((i) => (i + 1) % TRACKS.length);
  }, [hasTracks]);

  const handleCanPlay = useCallback(() => {
    if (!audioRef.current || !isPlaying) return;
    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [isPlaying]);

  // Track change: once React has committed the new audio.src and the play
  // state is active, call play() explicitly. Without this effect, with
  // `preload="none"` the new source would never load and `canplay` would
  // never fire — the track would stay silent.
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (!audioRef.current || !isPlayingRef.current) return;
    audioRef.current.play().catch(() => setIsPlaying(false));
  }, [trackIndex]);

  useEffect(() => {
    return () => {
      audioCtxRef.current?.close().catch(() => { /* ignore */ });
    };
  }, []);

  useEffect(() => {
    if (!isOpen && !isVolOpen && !miniOpen) return;
    const handler = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsVolOpen(false);
        setMiniOpen(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [isOpen, isVolOpen, miniOpen]);

  const cls = [
    "media-player",
    isOpen ? "media-player--open" : "",
    miniOpen ? "media-player--mini-open" : "",
    isPlaying ? "media-player--playing" : "",
    !hasTracks ? "media-player--silent" : "",
  ].filter(Boolean).join(" ");

  return (
    <div
      ref={rootRef}
      className={cls}
      role="region"
      aria-label="Atmosphere"
      onKeyDown={(e) => {
        // Disclosure semantics (S8): the volume/playlist popovers are not
        // modal dialogs — Escape while focus is inside closes the open one
        // and returns focus to its trigger.
        if (e.key !== "Escape") return;
        if (isVolOpen) {
          setIsVolOpen(false);
          volBtnRef.current?.focus();
          e.stopPropagation();
        } else if (isOpen) {
          setIsOpen(false);
          discloseBtnRef.current?.focus();
          e.stopPropagation();
        }
      }}
    >
      <audio
        ref={audioRef}
        src={currentTrack?.src}
        onEnded={next}
        onCanPlay={handleCanPlay}
        crossOrigin="anonymous"
        preload="none"
      />

      {/* The dock wraps wave + header. Desktop renders it as display:contents
          (no visual change); the mobile card styles it as one glass surface. */}
      <div className="media-player__dock">
      <svg
        className="media-player__wave"
        viewBox={`0 0 ${WAVE_VIEW_W} ${WAVE_VIEW_H}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          ref={barsPathRef}
          className="media-player__bars"
          fill="none"
          stroke="currentColor"
          strokeWidth={1}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="media-player__header">
        <div className="media-player__main">
          <button
            type="button"
            className="media-player__play"
            onClick={togglePlay}
            disabled={!hasTracks}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg
                className="media-player__play-glyph"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                aria-hidden
              >
                <rect x="4" y="3" width="2.5" height="10" fill="currentColor" />
                <rect x="9.5" y="3" width="2.5" height="10" fill="currentColor" />
              </svg>
            ) : (
              <svg
                className="media-player__play-glyph"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                aria-hidden
              >
                <path d="M4 3 L13 8 L4 13 Z" fill="currentColor" />
              </svg>
            )}
          </button>
          <div className="media-player__vol-wrap">
            <button
              ref={volBtnRef}
              type="button"
              className={`media-player__vol${isVolOpen ? " is-open" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                setIsVolOpen((v) => !v);
              }}
              aria-label="Volume"
              aria-expanded={isVolOpen}
            >
              <svg
                className="media-player__vol-icon"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                aria-hidden
              >
                <path
                  d="M2 6 L4 6 L7.5 3 L7.5 13 L4 10 L2 10 Z"
                  fill="currentColor"
                />
                <path
                  d="M9.6 5.6 Q11.1 8 9.6 10.4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  opacity={volume > 0.05 ? 1 : 0}
                />
                <path
                  d="M11.6 3.7 Q14.2 8 11.6 12.3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  opacity={volume > 0.5 ? 1 : 0}
                />
              </svg>
            </button>
            {/* Disclosure popover, not a dialog: a single labelled slider
                behind an aria-expanded trigger. role="dialog" would promise
                modal focus handling this popover deliberately doesn't have. */}
            <div
              className={`media-player__vol-popover${isVolOpen ? " is-open" : ""}`}
              aria-hidden={!isVolOpen}
            >
              <input
                type="range"
                className="media-player__volume"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                tabIndex={isVolOpen ? 0 : -1}
                aria-label="Volume"
              />
            </div>
          </div>
          <div className="media-player__title">
            <span className="media-player__title-name">{trackName}</span>
            {hasTracks && currentTrack?.artist && (
              <span className="media-player__title-artist"> · {currentTrack.artist}</span>
            )}
          </div>
          <button
            ref={discloseBtnRef}
            type="button"
            className="media-player__disclose"
            onClick={(e) => {
              e.stopPropagation();
              setIsVolOpen(false);
              setIsOpen((o) => !o);
            }}
            aria-label={isOpen ? "Close playlist" : "Open playlist"}
            aria-expanded={isOpen}
          >
            <span className="media-player__disclose-glyph" aria-hidden>
              {isOpen ? "▾" : "▴"}
            </span>
            <span className="media-player__disclose-label">PLAYLIST</span>
          </button>
        </div>
      </div>
      </div>

      <div className="media-player__panel-wrap" aria-hidden={!isOpen}>
        <div className="media-player__panel-wrap-inner">
          {/* Disclosure panel, not a dialog (same rationale as the volume
              popover): trigger carries aria-expanded, Escape closes. */}
          <div
            className="media-player__panel"
            role="group"
            aria-label="Playlist"
          >
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
                <span className="media-player__panel-link-arrow" aria-hidden>↗</span>
              </a>
            </div>
            <ul className="media-player__panel-list">
              {TRACKS.map((t, i) => {
                const active = i === trackIndex;
                const rowCls = `media-player__panel-track${active ? " is-active" : ""}${active && isPlaying ? " is-playing" : ""}`;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      className={rowCls}
                      onClick={() => playTrack(i)}
                      tabIndex={isOpen ? 0 : -1}
                      aria-current={active}
                      aria-label={`${t.title}, ${active && isPlaying ? "pause" : "play"}`}
                    >
                      <span className="media-player__panel-track-mark" aria-hidden>
                        {active ? (isPlaying ? "❚❚" : "▶") : String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="media-player__panel-track-title">{t.title}</span>
                      <span className="media-player__panel-track-tail" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* Mobile stud — collapsed entry point for the card above. Hidden on
          desktop; hidden entirely when no tracks are loaded. */}
      <button
        type="button"
        className="media-player__stud"
        onClick={() => {
          setMiniOpen((o) => !o);
          setIsOpen(false);
          setIsVolOpen(false);
        }}
        aria-label={miniOpen ? "Close atmosphere player" : "Open atmosphere player"}
        aria-expanded={miniOpen}
      >
        <svg
          className="media-player__stud-glyph"
          width="18"
          height="14"
          viewBox="0 0 18 14"
          aria-hidden
        >
          <path
            d="M1 5 L1 9 M5 2.5 L5 11.5 M9 4 L9 10 M13 1 L13 13 M17 5.5 L17 8.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </button>
    </div>
  );
}
