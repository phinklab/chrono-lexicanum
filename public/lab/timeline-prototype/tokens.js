/* ───────────────────────────────────────────────────────────────────────────
 * tokens.js — injects the Chrono·Lexicanum design language as a stylesheet.
 *
 * Palette + type mirrored from src/app/globals.css so the lab reads as the same
 * product. Restraint over bloom: cool cyan-on-void, hairline strokes, painterly
 * L-corner brackets, a faint starfield + grain — NO warm-amber gradients and NO
 * radial glow halos (Philipp's stated taste). All motion is CSS-only and folds
 * to instant under prefers-reduced-motion.
 * ─────────────────────────────────────────────────────────────────────────── */
(function () {
  "use strict";

  var GRAIN =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.86' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E";

  var css = `
:root {
  --cl-void: #02030a;
  --cl-void-2: #06080f;
  --cl-plate: rgba(8,12,20,0.78);
  --cl-plate-2: rgba(4,8,14,0.86);
  --cl-bone: #e8dcc0;
  --cl-dim: rgba(232,220,192,0.62);
  --cl-faint: rgba(232,220,192,0.28);
  --cl-ghost: rgba(232,220,192,0.14);
  --cl-cyan: #9ce6ff;
  --cl-cyan-dim: rgba(156,230,255,0.45);
  --cl-cyan-fnt: rgba(156,230,255,0.18);
  --cl-gold: #c9a65a;
  --cl-gold-dim: #8a6f2c;
  --cl-blood: #a51c1c;
  --line-0: rgba(232,228,216,0.08);
  --line-1: rgba(232,228,216,0.16);
  --line-2: rgba(232,228,216,0.32);
  --font-cinzel: Cinzel, serif;
  --font-cormorant: 'Cormorant Garamond', serif;
  --font-grotesk: 'Space Grotesk', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
  --ease: cubic-bezier(.2,.8,.2,1);
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; height: 100%; background: var(--cl-void); }
body {
  font-family: var(--font-cormorant);
  color: var(--cl-bone);
  overflow: hidden;
  overscroll-behavior: none;
  -webkit-font-smoothing: antialiased;
}
#root { width: 100vw; height: 100vh; }
button { font-family: inherit; color: inherit; background: none; border: none; cursor: pointer; }
::selection { background: var(--cl-cyan-fnt); color: #fff; }

/* ── atmosphere ─────────────────────────────────────────────────────────── */
.tlp-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden;
  background:
    radial-gradient(120% 80% at 50% -10%, rgba(20,40,64,0.30) 0%, rgba(2,3,10,0) 55%),
    radial-gradient(100% 70% at 50% 120%, rgba(10,18,32,0.40) 0%, rgba(2,3,10,0) 60%),
    linear-gradient(180deg, var(--cl-void) 0%, var(--cl-void-2) 60%, var(--cl-void) 100%);
}
.tlp-stars, .tlp-stars2 { position: absolute; inset: -50%; background-repeat: repeat; }
.tlp-stars {
  background-image:
    radial-gradient(1px 1px at 20px 30px, rgba(232,220,192,0.55), transparent),
    radial-gradient(1px 1px at 130px 90px, rgba(156,230,255,0.45), transparent),
    radial-gradient(1px 1px at 80px 160px, rgba(232,220,192,0.35), transparent),
    radial-gradient(1.4px 1.4px at 200px 50px, rgba(232,220,192,0.5), transparent);
  background-size: 240px 240px;
  animation: tlpDrift 220s linear infinite;
}
.tlp-stars2 {
  background-image:
    radial-gradient(1px 1px at 50px 120px, rgba(156,230,255,0.3), transparent),
    radial-gradient(1px 1px at 170px 200px, rgba(232,220,192,0.25), transparent),
    radial-gradient(1px 1px at 300px 80px, rgba(156,230,255,0.22), transparent);
  background-size: 360px 360px;
  opacity: 0.7;
  animation: tlpDrift2 340s linear infinite;
}
.tlp-grain { position: absolute; inset: 0; background-image: url("${GRAIN}");
  opacity: 0.05; mix-blend-mode: overlay; }
.tlp-vignette { position: absolute; inset: 0;
  background: radial-gradient(130% 120% at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%); }

@keyframes tlpDrift { from { transform: translate(0,0); } to { transform: translate(-240px,-240px); } }
@keyframes tlpDrift2 { from { transform: translate(0,0); } to { transform: translate(360px,-360px); } }

/* ── app shell ──────────────────────────────────────────────────────────── */
.tlp-root { position: relative; z-index: 1; display: flex; flex-direction: column;
  width: 100vw; height: 100vh; }
.tlp-stage { position: relative; flex: 1; min-height: 0; overflow: hidden; }

/* ── control bar ────────────────────────────────────────────────────────── */
.tlp-bar { position: relative; z-index: 5; display: flex; align-items: center; gap: 28px;
  flex-wrap: wrap; padding: 14px 26px;
  background: linear-gradient(180deg, rgba(6,9,16,0.92), rgba(4,7,13,0.78));
  border-bottom: 1px solid var(--line-1);
  backdrop-filter: blur(6px); }
.tlp-brand { display: flex; flex-direction: column; gap: 2px; margin-right: 8px; }
.tlp-brand-title { font-family: var(--font-cinzel); font-weight: 600; font-size: 15px;
  letter-spacing: 0.30em; text-transform: uppercase; color: var(--cl-bone); }
.tlp-brand-sub { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.16em;
  color: var(--cl-cyan-dim); text-transform: uppercase; }
.tlp-group { display: flex; flex-direction: column; gap: 6px; }
.tlp-group-label { font-family: var(--font-mono); font-size: 9.5px; letter-spacing: 0.22em;
  text-transform: uppercase; color: var(--cl-faint); padding-left: 2px; }
.tlp-seg { display: flex; border: 1px solid var(--line-1); border-radius: 2px;
  background: rgba(2,4,10,0.5); overflow: hidden; }
.tlp-seg-btn { position: relative; padding: 7px 14px; font-family: var(--font-grotesk);
  font-size: 12px; letter-spacing: 0.04em; color: var(--cl-dim);
  border-right: 1px solid var(--line-0); transition: color .25s var(--ease), background .25s var(--ease); }
.tlp-seg-btn:last-child { border-right: none; }
.tlp-seg-btn:hover { color: var(--cl-bone); background: rgba(156,230,255,0.05); }
.tlp-seg-btn.is-active { color: var(--cl-void); background: var(--cl-cyan);
  text-shadow: none; font-weight: 500; }
.tlp-seg-btn.is-active::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0;
  height: 2px; background: var(--cl-bone); opacity: 0.0; }
.tlp-spacer { flex: 1; }
.tlp-count-badge { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.12em;
  color: var(--cl-faint); text-transform: uppercase; align-self: center; }

/* ── overview ribbon ────────────────────────────────────────────────────── */
.tlp-overview { position: absolute; inset: 0; display: flex; flex-direction: column;
  justify-content: center; padding: 0 4vw; }
.tlp-overview-head { text-align: center; margin-bottom: 4vh; }
.tlp-overview-kicker { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.34em;
  text-transform: uppercase; color: var(--cl-cyan-dim); margin-bottom: 10px; }
.tlp-overview-title { font-family: var(--font-cinzel); font-weight: 500; font-size: clamp(22px, 3.2vw, 40px);
  letter-spacing: 0.12em; color: var(--cl-bone); margin: 0; }
.tlp-ribbon { position: relative; display: flex; align-items: stretch; height: 38vh; min-height: 260px;
  gap: 0; }
.tlp-ribbon-axis { position: absolute; left: 0; right: 0; top: 50%; height: 1px;
  background: linear-gradient(90deg, transparent, var(--line-2) 8%, var(--line-2) 92%, transparent); }
.tlp-era { position: relative; flex-grow: 0; flex-shrink: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; padding: 0 6px;
  border-left: 1px solid var(--line-0); cursor: pointer;
  transition: background .35s var(--ease); animation: tlpFadeSlide .7s var(--ease) backwards; }
.tlp-era:first-child { border-left: none; }
.tlp-era:hover { background: linear-gradient(180deg, rgba(156,230,255,0.05), transparent 70%); }
.tlp-era.is-empty { cursor: default; opacity: 0.55; }
.tlp-era-top { display: flex; flex-direction: column; align-items: center; gap: 4px;
  margin-bottom: auto; padding-top: 8%; text-align: center; }
.tlp-era-name { font-family: var(--font-cinzel); font-weight: 500; font-size: clamp(11px, 1.1vw, 16px);
  letter-spacing: 0.14em; text-transform: uppercase; color: var(--cl-bone);
  transition: color .3s var(--ease); }
.tlp-era:hover .tlp-era-name { color: var(--cl-cyan); }
.tlp-era-range { font-family: var(--font-mono); font-size: 9.5px; letter-spacing: 0.1em;
  color: var(--cl-faint); }
.tlp-era-count { position: absolute; bottom: 8%; font-family: var(--font-mono); font-size: 10px;
  letter-spacing: 0.12em; color: var(--cl-cyan-dim); }
.tlp-era-count .n { color: var(--cl-bone); font-size: 14px; }
.tlp-era-bracket { position: absolute; width: 12px; height: 12px; border: 1px solid var(--cl-cyan-dim);
  opacity: 0; transition: opacity .3s var(--ease); }
.tlp-era:hover .tlp-era-bracket { opacity: 0.9; }
.tlp-era-bracket.tl { top: 10px; left: 10px; border-right: none; border-bottom: none; }
.tlp-era-bracket.tr { top: 10px; right: 10px; border-left: none; border-bottom: none; }
.tlp-era-bracket.bl { bottom: 10px; left: 10px; border-right: none; border-top: none; }
.tlp-era-bracket.br { bottom: 10px; right: 10px; border-left: none; border-top: none; }
/* mini pins on the ribbon axis */
.tlp-era-pins { position: absolute; left: 0; right: 0; top: 50%; height: 0; }
.tlp-pin { position: absolute; top: 50%; width: 4px; height: 4px; border-radius: 50%;
  background: var(--cl-bone); transform: translate(-50%,-50%); opacity: 0.5;
  transition: opacity .3s var(--ease), background .3s var(--ease); }
.tlp-era:hover .tlp-pin { opacity: 0.85; background: var(--cl-cyan); }
.tlp-pin.is-approx { background: var(--cl-faint); box-shadow: none; }
.tlp-overview-hint { text-align: center; margin-top: 3.5vh; font-family: var(--font-mono);
  font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--cl-faint); }

/* ── segment view (zoomed) ──────────────────────────────────────────────── */
.tlp-segview { position: absolute; inset: 0; display: flex; flex-direction: column;
  padding: 22px clamp(20px, 4vw, 64px) 28px; }
.tlp-segview-head { display: flex; align-items: flex-start; gap: 20px; margin-bottom: 8px; }
.tlp-back { display: flex; align-items: center; gap: 8px; padding: 8px 14px; margin-top: 4px;
  border: 1px solid var(--line-1); border-radius: 2px; font-family: var(--font-mono);
  font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--cl-dim);
  transition: all .25s var(--ease); }
.tlp-back:hover { color: var(--cl-cyan); border-color: var(--cl-cyan-dim);
  background: rgba(156,230,255,0.05); }
.tlp-segview-titles { flex: 1; }
.tlp-segview-kicker { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.30em;
  text-transform: uppercase; color: var(--cl-cyan-dim); margin-bottom: 6px; }
.tlp-segview-title { font-family: var(--font-cinzel); font-weight: 500; font-size: clamp(22px, 3vw, 38px);
  letter-spacing: 0.10em; color: var(--cl-bone); margin: 0; }
.tlp-segview-tone { font-family: var(--font-cormorant); font-style: italic; font-size: 16px;
  color: var(--cl-dim); margin-top: 4px; }
.tlp-segview-meta { text-align: right; font-family: var(--font-mono); font-size: 11px;
  letter-spacing: 0.1em; color: var(--cl-faint); white-space: nowrap; }
.tlp-segview-meta .n { display: block; font-size: 30px; color: var(--cl-bone); line-height: 1; }
.tlp-approx-note { display: inline-flex; align-items: center; gap: 7px; margin: 6px 0 0;
  font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.08em; color: var(--cl-faint); }
.tlp-approx-note .glyph { color: var(--cl-gold); font-size: 13px; }

.tlp-layout-area { position: relative; flex: 1; min-height: 0; margin-top: 14px; }
.tlp-empty-seg { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-family: var(--font-cormorant); font-style: italic; font-size: 18px; color: var(--cl-faint); }

/* ── shared axis ticks (used by the series-lanes axis) ──────────────────── */
.tlp-tick { position: absolute; transform: translateX(-50%); }
.tlp-tick-mark { width: 1px; height: 7px; background: var(--line-2); margin: 0 auto; }
.tlp-tick-label { margin-top: 7px; font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.06em;
  color: var(--cl-faint); text-align: center; white-space: nowrap; }

/* ── layout: series lanes ───────────────────────────────────────────────── */
.tlp-lanes { position: absolute; inset: 0; overflow-y: auto; overflow-x: hidden; padding-right: 4px; }
.tlp-lanes::-webkit-scrollbar { width: 8px; }
.tlp-lanes::-webkit-scrollbar-thumb { background: var(--line-1); border-radius: 4px; }
.tlp-lane { position: relative; display: flex; align-items: center; height: 46px;
  border-bottom: 1px solid var(--line-0); }
.tlp-lane:hover { background: rgba(156,230,255,0.03); }
.tlp-lane.is-standalones { border-top: 1px solid var(--line-1); }
.tlp-lane-label { flex: 0 0 178px; padding-right: 16px; display: flex; align-items: baseline;
  justify-content: flex-end; gap: 9px; overflow: hidden; }
.tlp-lane-name { font-family: var(--font-grotesk); font-size: 12px; letter-spacing: 0.03em;
  color: var(--cl-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tlp-lane.is-standalones .tlp-lane-name { font-style: italic; color: var(--cl-faint); }
.tlp-lane-count { flex: 0 0 auto; font-family: var(--font-mono); font-size: 9.5px;
  color: var(--cl-cyan-dim); letter-spacing: 0.04em; }
.tlp-lane-track { position: relative; flex: 1; height: 100%; border-left: 1px solid var(--line-1); }
.tlp-lane-node { position: absolute; top: 50%; transform: translate(-50%,-50%); }

/* cluster chip: a dense run of books folded behind a "+N" pill */
.tlp-cluster { position: relative; display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 8px 3px 6px; border: 1px solid var(--line-2); border-radius: 11px;
  background: var(--cl-plate); transition: border-color .2s var(--ease), background .2s var(--ease), transform .2s var(--ease); }
.tlp-cluster:hover, .tlp-cluster.is-active { border-color: var(--cl-cyan-dim);
  background: rgba(10,16,26,0.92); transform: scale(1.06); z-index: 30; }
.tlp-cluster-dots { width: 9px; height: 9px; border-radius: 50%; flex: 0 0 auto;
  background:
    radial-gradient(circle at 2.5px 2.5px, var(--cl-bone) 1px, transparent 1.4px),
    radial-gradient(circle at 6.5px 3px, var(--cl-bone) 1px, transparent 1.4px),
    radial-gradient(circle at 4px 6.5px, var(--cl-bone) 1px, transparent 1.4px);
  opacity: 0.8; }
.tlp-cluster:hover .tlp-cluster-dots, .tlp-cluster.is-active .tlp-cluster-dots {
  background:
    radial-gradient(circle at 2.5px 2.5px, var(--cl-cyan) 1px, transparent 1.4px),
    radial-gradient(circle at 6.5px 3px, var(--cl-cyan) 1px, transparent 1.4px),
    radial-gradient(circle at 4px 6.5px, var(--cl-cyan) 1px, transparent 1.4px); }
.tlp-cluster-n { font-family: var(--font-mono); font-size: 10.5px; line-height: 1; color: var(--cl-bone); }

/* cluster popover: fixed list of the books behind a chip */
.tlp-cluster-backdrop { position: fixed; inset: 0; z-index: 70; }
.tlp-cluster-pop { position: fixed; z-index: 71; width: min(320px, 80vw); max-height: 46vh;
  display: flex; flex-direction: column; overflow: hidden;
  background: var(--cl-plate-2); border: 1px solid var(--line-2); border-radius: 3px;
  box-shadow: 0 18px 50px rgba(0,0,0,0.62); animation: tlpFadeSlide .16s var(--ease); }
.tlp-cluster-pop-head { flex: 0 0 auto; padding: 9px 13px; border-bottom: 1px solid var(--line-1);
  font-family: var(--font-mono); font-size: 9.5px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--cl-cyan-dim); }
.tlp-cluster-pop-list { overflow-y: auto; padding: 4px; }
.tlp-cluster-pop-list::-webkit-scrollbar { width: 7px; }
.tlp-cluster-pop-list::-webkit-scrollbar-thumb { background: var(--line-1); border-radius: 4px; }
.tlp-cluster-pop-row { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 9px;
  border-radius: 2px; text-align: left; transition: background .18s var(--ease); }
.tlp-cluster-pop-row:hover { background: rgba(156,230,255,0.06); }
.tlp-cluster-pop-row .tlp-mark { flex: 0 0 auto; }
.tlp-cluster-pop-title { flex: 1; font-family: var(--font-cinzel); font-size: 12.5px; letter-spacing: 0.02em;
  color: var(--cl-bone); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tlp-cluster-pop-row:hover .tlp-cluster-pop-title { color: var(--cl-cyan); }
.tlp-cluster-pop-yr { flex: 0 0 auto; font-family: var(--font-mono); font-size: 10px; color: var(--cl-cyan-dim); }
.tlp-mark.is-approx-mark { background: transparent; border: 1px dashed var(--cl-faint); }

.tlp-lanes-axis { position: sticky; top: 0; z-index: 2; display: flex; height: 26px;
  background: linear-gradient(180deg, rgba(4,7,13,0.95), rgba(4,7,13,0.6)); }
.tlp-lanes-axis-pad { flex: 0 0 168px; }
.tlp-lanes-axis-track { position: relative; flex: 1; border-left: 1px solid var(--line-1); }
.tlp-lanes-axis .tlp-tick { bottom: auto; top: 4px; }
.tlp-lanes-axis .tlp-tick-mark { height: 5px; }
.tlp-lanes-axis .tlp-tick-label { margin-top: 2px; font-size: 9px; }

/* ── layout: reading-sequence path ──────────────────────────────────────── */
.tlp-seq { position: absolute; inset: 0; overflow-y: auto; padding: 8px 0 20px; }
.tlp-seq-grid { display: flex; flex-wrap: wrap; gap: 14px 16px; align-content: flex-start; }
.tlp-seq-node { position: relative; display: flex; align-items: center; gap: 10px;
  padding: 9px 14px 9px 10px; border: 1px solid var(--line-1); border-radius: 2px;
  background: var(--cl-plate); min-width: 0; max-width: 270px;
  transition: border-color .25s var(--ease), background .25s var(--ease);
  animation: tlpTileRise .55s var(--ease) backwards; }
.tlp-seq-node:hover { border-color: var(--cl-cyan-dim); background: rgba(10,16,26,0.9); }
.tlp-seq-num { font-family: var(--font-mono); font-size: 11px; color: var(--cl-cyan-dim);
  min-width: 26px; text-align: right; }
.tlp-seq-body { min-width: 0; }
.tlp-seq-title { font-family: var(--font-cinzel); font-size: 12.5px; letter-spacing: 0.04em;
  color: var(--cl-bone); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tlp-seq-meta { font-family: var(--font-mono); font-size: 9.5px; letter-spacing: 0.05em;
  color: var(--cl-faint); margin-top: 2px; }
.tlp-seq-connect { position: absolute; right: -16px; top: 50%; width: 16px; height: 1px;
  background: var(--line-1); }

/* ── book node (shared marker) ──────────────────────────────────────────── */
.tlp-node { position: relative; display: inline-flex; align-items: center; justify-content: center;
  padding: 0; line-height: 0; transition: transform .2s var(--ease); }
.tlp-node:focus-visible { outline: none; }
.tlp-node:focus-visible .tlp-mark { box-shadow: 0 0 0 2px var(--cl-cyan); }
.tlp-node:hover { transform: scale(1.35); z-index: 30; }
.tlp-mark { display: block; background: var(--cl-bone); transition: background .2s var(--ease); }
.tlp-node:hover .tlp-mark { background: var(--cl-cyan); }
/* format → shape */
.tlp-mark.fmt-novel       { width: 11px; height: 11px; border-radius: 50%; }
.tlp-mark.fmt-novella     { width: 9px;  height: 9px;  border-radius: 50%; }
.tlp-mark.fmt-short_story { width: 6px;  height: 6px;  border-radius: 50%; background: var(--cl-dim); }
.tlp-mark.fmt-anthology   { width: 9px;  height: 9px;  border-radius: 1px; transform: rotate(45deg); }
.tlp-mark.fmt-collection  { width: 9px;  height: 9px;  border-radius: 1px; transform: rotate(45deg); }
.tlp-mark.fmt-omnibus     { width: 11px; height: 11px; border-radius: 1px; transform: rotate(45deg); }
.tlp-mark.fmt-audio_drama { width: 10px; height: 10px; border-radius: 50%; background: transparent;
  border: 1.5px solid var(--cl-cyan); }
.tlp-node.is-approx .tlp-mark { background: transparent; border: 1px dashed var(--cl-faint); }
.tlp-node.is-approx:hover .tlp-mark { border-color: var(--cl-cyan); }
.tlp-node.is-approx .tlp-mark.fmt-short_story { width: 6px; height: 6px; }

/* tooltip */
.tlp-tooltip { position: fixed; z-index: 80; pointer-events: none; transform: translate(-50%, -100%);
  margin-top: -12px; padding: 9px 13px; min-width: 150px; max-width: 280px;
  background: var(--cl-plate-2); border: 1px solid var(--line-2); border-radius: 2px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.6); animation: tlpFadeSlide .18s var(--ease); }
.tlp-tooltip::after { content: ""; position: absolute; left: 50%; bottom: -5px; width: 8px; height: 8px;
  transform: translateX(-50%) rotate(45deg); background: var(--cl-plate-2);
  border-right: 1px solid var(--line-2); border-bottom: 1px solid var(--line-2); }
.tlp-tt-title { font-family: var(--font-cinzel); font-size: 13px; letter-spacing: 0.03em;
  color: var(--cl-bone); line-height: 1.25; }
.tlp-tt-row { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.05em;
  color: var(--cl-dim); margin-top: 5px; display: flex; gap: 8px; flex-wrap: wrap; }
.tlp-tt-row .yr { color: var(--cl-cyan); }
.tlp-tt-row .ap { color: var(--cl-gold); }

/* ── book panel (detail drawer) ─────────────────────────────────────────── */
.tlp-panel-backdrop { position: fixed; inset: 0; z-index: 90; background: rgba(1,2,6,0.62);
  backdrop-filter: blur(3px); animation: tlpFade .25s var(--ease); }
.tlp-panel { position: fixed; top: 0; right: 0; bottom: 0; z-index: 91; width: min(440px, 92vw);
  display: flex; flex-direction: column;
  background: linear-gradient(180deg, var(--cl-plate-2), rgba(2,4,10,0.96));
  border-left: 1px solid var(--line-2); box-shadow: -24px 0 64px rgba(0,0,0,0.6);
  animation: tlpSlideIn .42s var(--ease); overflow-y: auto; }
.tlp-panel-close { position: absolute; top: 16px; right: 16px; width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center; border: 1px solid var(--line-1);
  border-radius: 2px; color: var(--cl-dim); font-size: 16px; transition: all .25s var(--ease); }
.tlp-panel-close:hover { color: var(--cl-cyan); border-color: var(--cl-cyan-dim); }
.tlp-panel-cover { position: relative; height: 200px; flex-shrink: 0;
  background:
    radial-gradient(80% 100% at 50% 0%, rgba(20,40,64,0.4), transparent 70%),
    linear-gradient(180deg, rgba(10,16,26,0.9), rgba(2,4,10,0.95));
  border-bottom: 1px solid var(--line-1); display: flex; align-items: center; justify-content: center; }
.tlp-panel-aquila { font-family: var(--font-cinzel); font-size: 46px; color: var(--cl-ghost); }
.tlp-panel-fmt { position: absolute; bottom: 12px; left: 22px; font-family: var(--font-mono);
  font-size: 9.5px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--cl-cyan-dim); }
.tlp-panel-body { padding: 24px 26px 40px; }
.tlp-panel-kicker { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.22em;
  text-transform: uppercase; color: var(--cl-cyan-dim); margin-bottom: 8px; }
.tlp-panel-title { font-family: var(--font-cinzel); font-weight: 600; font-size: 25px;
  letter-spacing: 0.04em; color: var(--cl-bone); line-height: 1.18; margin: 0; }
.tlp-panel-authors { font-family: var(--font-cormorant); font-style: italic; font-size: 17px;
  color: var(--cl-dim); margin-top: 8px; }
.tlp-panel-rows { margin-top: 22px; border-top: 1px solid var(--line-0); }
.tlp-panel-row { display: flex; gap: 14px; padding: 11px 0; border-bottom: 1px solid var(--line-0);
  font-size: 14px; }
.tlp-panel-row .k { flex: 0 0 116px; font-family: var(--font-mono); font-size: 10px;
  letter-spacing: 0.14em; text-transform: uppercase; color: var(--cl-faint); padding-top: 3px; }
.tlp-panel-row .v { flex: 1; font-family: var(--font-cormorant); font-size: 16px; color: var(--cl-bone); }
.tlp-panel-row .v .mono { font-family: var(--font-mono); font-size: 13px; color: var(--cl-cyan); }
.tlp-panel-row .v .approx-flag { font-family: var(--font-mono); font-size: 10px; color: var(--cl-gold);
  letter-spacing: 0.06em; margin-left: 8px; }
.tlp-panel-synopsis { margin-top: 22px; font-family: var(--font-cormorant); font-size: 16px;
  line-height: 1.6; color: var(--cl-dim); }
.tlp-panel-synopsis .stub { color: var(--cl-faint); font-style: italic; }

/* ── accordion shell ────────────────────────────────────────────────────── */
.tlp-accordion { position: absolute; inset: 0; display: flex; padding: 18px; gap: 8px; }
.tlp-acc-band { position: relative; flex: 1 1 0; min-width: 56px; display: flex; flex-direction: column;
  border: 1px solid var(--line-1); border-radius: 3px; overflow: hidden; cursor: pointer;
  background: linear-gradient(180deg, rgba(8,12,20,0.6), rgba(2,4,10,0.85));
  transition: flex-grow .55s var(--ease), border-color .35s var(--ease); }
.tlp-acc-band:hover { border-color: var(--cl-cyan-fnt); }
.tlp-acc-band.is-open { flex: 1000 1 0; cursor: default; border-color: var(--cl-cyan-dim); }
.tlp-acc-band.is-empty { opacity: 0.5; cursor: default; }
.tlp-acc-spine { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px;
  border-bottom: 1px solid var(--line-0); }
.tlp-acc-name { font-family: var(--font-cinzel); font-size: 14px; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--cl-bone); white-space: nowrap; }
.tlp-acc-band:not(.is-open) .tlp-acc-name { writing-mode: vertical-rl; transform: rotate(180deg);
  margin: 14px auto; letter-spacing: 0.2em; }
.tlp-acc-band:not(.is-open) .tlp-acc-spine { flex-direction: column; height: 100%; border: none; }
.tlp-acc-count { font-family: var(--font-mono); font-size: 11px; color: var(--cl-cyan-dim); }
.tlp-acc-inner { position: relative; flex: 1; min-height: 0; opacity: 0; pointer-events: none;
  transition: opacity .4s var(--ease) .15s; }
.tlp-acc-band.is-open .tlp-acc-inner { opacity: 1; pointer-events: auto; }

/* ── keyframes ──────────────────────────────────────────────────────────── */
@keyframes tlpFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes tlpFadeSlide { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes tlpTileRise { from { opacity: 0; transform: translateY(20px) scale(.99); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes tlpSlideIn { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

/* ── reduced motion ─────────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-delay: 0ms !important;
    transition-duration: 0.001ms !important;
  }
  .tlp-stars, .tlp-stars2 { animation: none !important; }
}
`;

  var el = document.createElement("style");
  el.id = "tlp-tokens";
  el.textContent = css;
  document.head.appendChild(el);
})();
