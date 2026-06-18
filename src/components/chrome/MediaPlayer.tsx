"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TRACKS, type AudioTrack } from "@/lib/audio-tracks";

/**
 * MediaPlayer — sitewide ambient strip, anchored bottom-left, ohne Kasten.
 *
 * Aufbau (DOM top-to-bottom = visuell oben-nach-unten im fixierten Block):
 *   • Wave — immer sichtbar, hairline-dünne 1-px-Bar-Sinuswelle (~24 px
 *     CSS-Höhe). Idle-Breathing wenn pausiert; FFT-Mid-Band-reaktiv beim
 *     Playback. Schwebt über dem Header.
 *   • Header (immer sichtbar) — zwei Zeilen.
 *       Row 1: "▴ PLAYLIST" Disclose (rechtsbündig).
 *       Row 2: Play-Glyph (borderless) + "VOL" Toggle + Track-Titel.
 *   • Vol-Popover (absolute über dem VOL-Button) — schmaler Hairline-Slider
 *     mit Mute-Glyph. Mutually exclusive zum Playlist-Panel.
 *   • Panel-Wrap (absolute, bottom: 100% des Players) — floatet über der
 *     Wave nach oben auf wenn `--open`. Grid-template-rows 0fr → 1fr für
 *     smoothe Height-Auto-Animation. Wave + Header bleiben dabei fix
 *     verankert; nichts rutscht hoch.
 *
 * Wave-Rendering: 96 vertikale 1-px-Striche (non-scaling-stroke), Höhe aus
 * zweifachem Sinus-Träger × geglätteter Amplitude (FFT-Mid-Band-RMS während
 * Playback, atmender Breathing-Sinus im Idle). Pro-Bar-Textur aus FFT-Bins
 * legt eine feine Modulation drüber, geglättet um Per-Sample-Jitter zu
 * vermeiden.
 *
 * Interaktion:
 *   • Play-Glyph (links in Row 2) = togglePlay.
 *   • VOL (in Row 2) = toggleVol (Popover mit Slider).
 *   • Disclose "▴ PLAYLIST" (rechts in Row 1) = togglePanel.
 *   • Vol-Popover und Playlist-Panel sind mutually exclusive.
 *   • Klick außerhalb schließt beides.
 *   • Kein Hover-Trigger.
 */

const FFT_SIZE = 256;
const WAVE_VIEW_W = 1024;
const WAVE_VIEW_H = 80;
const N_BARS = 96;
const BAR_PITCH = WAVE_VIEW_W / N_BARS;
const FREQ_LO_BIN = 3;
const FREQ_HI_BIN = 48;
const IDLE_BREATHE_BASE = 0.14;
const IDLE_BREATHE_AMP = 0.05;
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
  const [volume, setVolume] = useState(0.5);
  const [reducedMotion, setReducedMotion] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const barsPathRef = useRef<SVGPathElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const amplitudeRef = useRef(IDLE_BREATHE_BASE);
  const barAmpsRef = useRef<Float32Array>(new Float32Array(N_BARS));
  const isPlayingRef = useRef(false);

  const hasTracks = TRACKS.length > 0;
  const currentTrack: AudioTrack | undefined = TRACKS[trackIndex];
  const trackName = hasTracks
    ? currentTrack?.title ?? "—"
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

    let raf = 0;
    let t = 0;
    let freqArray: Uint8Array<ArrayBuffer> | null = null;

    const tick = () => {
      t += 0.024;

      let target: number;
      const analyser = analyserRef.current;
      if (isPlayingRef.current && analyser) {
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
      } else {
        target =
          IDLE_BREATHE_BASE +
          Math.sin(t * 0.6) * IDLE_BREATHE_AMP * 0.7 +
          Math.sin(t * 0.23) * IDLE_BREATHE_AMP * 0.3;
      }
      amplitudeRef.current =
        amplitudeRef.current * (1 - AMP_SMOOTH_ALPHA) + target * AMP_SMOOTH_ALPHA;
      const amp = amplitudeRef.current;

      const barAmps = barAmpsRef.current;
      let d = "";
      for (let i = 0; i < N_BARS; i++) {
        const x = BAR_PITCH / 2 + i * BAR_PITCH;
        const u = i / (N_BARS - 1);

        let texTarget = 0;
        if (isPlayingRef.current && freqArray) {
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

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion]);

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

  // Track-Wechsel: sobald React die neue audio.src committed hat und der
  // Play-Status aktiv ist, explizit play() aufrufen. Ohne diesen Effekt
  // würde mit `preload="none"` die neue Quelle nie geladen werden und
  // `canplay` nie feuern — der Track würde stumm bleiben.
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
    if (!isOpen && !isVolOpen) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsVolOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, isVolOpen]);

  const cls = [
    "media-player",
    isOpen ? "media-player--open" : "",
    isPlaying ? "media-player--playing" : "",
    !hasTracks ? "media-player--silent" : "",
  ].filter(Boolean).join(" ");

  return (
    <div
      ref={rootRef}
      className={cls}
      role="region"
      aria-label="Atmosphere"
    >
      <audio
        ref={audioRef}
        src={currentTrack?.src}
        onEnded={next}
        onCanPlay={handleCanPlay}
        crossOrigin="anonymous"
        preload="none"
      />

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
        <div className="media-player__top">
          <button
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
            <div
              className={`media-player__vol-popover${isVolOpen ? " is-open" : ""}`}
              role="dialog"
              aria-label="Volume"
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
          <div className="media-player__title">{trackName}</div>
        </div>
      </div>

      <div className="media-player__panel-wrap" aria-hidden={!isOpen}>
        <div className="media-player__panel-wrap-inner">
          <div
            className="media-player__panel"
            role="dialog"
            aria-label="Playlist"
          >
            <div className="media-player__panel-head">
              <span className="media-player__panel-kicker">PLAYLIST</span>
              <span className="c-hairline media-player__panel-rule" />
              <span className="media-player__panel-sect">
                {TRACKS.length.toString().padStart(2, "0")} TRACKS
              </span>
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
                      aria-label={`${t.title} — ${active && isPlaying ? "pause" : "play"}`}
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
    </div>
  );
}
