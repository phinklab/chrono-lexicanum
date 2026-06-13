// Tweaks-panel CSS — redesigned 2026-06-13 (Session 150 eyeballing) into the
// site's gold language (64-detail-modal.css, Brief 131): NO drawn frame —
// depth is carried by the drop shadow + a faint bone top light-catch; the one
// drawn line is the Terminus gradient hairline; gold is reserved for text
// accents, hovers, focus and live values. Fonts are the site voices (Cinzel
// title, Plex Mono labels/values, Cormorant hints) via the next/font CSS
// vars. The styles are mounted as a single <style> tag inside the panel so
// the same `.twk-*` classes work without polluting the global stylesheet.
// The gear is permanently mounted bottom-right and toggles `.twk-panel`.
export const TWEAKS_PANEL_CSS = `
  /* ─── Panel surface ─────────────────────────────────────────────────── */
  .twk-panel{
    position:fixed;right:16px;bottom:72px;z-index:2147483646;
    width:300px;max-height:calc(100vh - 104px);
    display:flex;flex-direction:column;
    background:linear-gradient(180deg,rgba(6,9,16,.97) 0%,rgba(2,4,10,.98) 100%);
    color:#e8dcc0;
    -webkit-backdrop-filter:blur(10px) saturate(140%);backdrop-filter:blur(10px) saturate(140%);
    box-shadow:
      0 30px 80px -20px rgba(0,0,0,.85),
      inset 0 1px 0 rgba(232,220,192,.06);
    font:11.5px/1.45 var(--font-plex-mono),ui-monospace,monospace;
    overflow:hidden;
    animation:twkPanelIn .18s ease-out both;
  }
  @keyframes twkPanelIn{
    from{opacity:0;transform:translateY(6px)}
    to{opacity:1;transform:translateY(0)}
  }

  /* ─── Header — Terminus hairline below, no solid border ─────────────── */
  .twk-hd{
    position:relative;
    display:flex;align-items:baseline;gap:10px;
    padding:12px 12px 10px 16px;
    background:rgba(3,6,12,.5);
    user-select:none;
  }
  .twk-hd::after{
    content:'';position:absolute;left:0;right:0;bottom:0;height:1px;
    background:linear-gradient(90deg,
      transparent,
      rgba(201,166,90,.16) 14%,
      rgba(201,166,90,.16) 86%,
      transparent);
  }
  .twk-hd-eyebrow{
    font-family:var(--font-plex-mono),ui-monospace,monospace;
    font-size:9px;letter-spacing:.32em;text-transform:uppercase;
    color:rgba(201,166,90,.55);
  }
  .twk-hd-title{
    flex:1;
    font-family:var(--font-cinzel),serif;
    font-size:13px;font-weight:400;letter-spacing:.22em;
    text-transform:uppercase;color:#c9a65a;
  }
  .twk-x{
    appearance:none;border:none;background:transparent;
    color:rgba(232,220,192,.55);width:24px;height:24px;cursor:pointer;
    display:inline-flex;align-items:center;justify-content:center;
    font-size:12px;line-height:1;padding:0;
    transition:background .18s,color .18s;
  }
  .twk-x:hover{background:rgba(201,166,90,.08);color:#e8dcc0}
  .twk-x:focus-visible{outline:1px solid #c9a65a;outline-offset:2px}

  /* ─── Scrollable body ───────────────────────────────────────────────── */
  .twk-body{
    padding:10px 14px 14px;display:flex;flex-direction:column;gap:8px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
  }

  /* ─── Rows + labels ─────────────────────────────────────────────────── */
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{
    display:flex;justify-content:space-between;align-items:baseline;
    color:#e8dcc0;font-size:10.5px;letter-spacing:.08em;
  }
  .twk-val{
    color:rgba(201,166,90,.7);font-variant-numeric:tabular-nums;
    font-family:var(--font-plex-mono),ui-monospace,monospace;
    font-size:10.5px;letter-spacing:.04em;
  }

  /* ─── Section heading — gradient hairline above, not a solid rule ───── */
  .twk-sect{
    position:relative;
    font-family:var(--font-plex-mono),ui-monospace,monospace;
    font-size:9.5px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;
    color:rgba(201,166,90,.68);padding:12px 0 4px;
    margin-top:4px;
  }
  .twk-sect::before{
    content:'';position:absolute;left:0;right:0;top:0;height:1px;
    background:linear-gradient(90deg,
      rgba(201,166,90,.14),
      rgba(201,166,90,.05) 70%,
      transparent);
  }
  .twk-sect:first-child{padding-top:0;margin-top:0}
  .twk-sect:first-child::before{display:none}

  /* ─── Hint text — the site's reading voice (Cormorant italic) ───────── */
  .twk-hint{
    font-family:var(--font-cormorant),Georgia,serif;
    font-style:italic;
    font-size:12.5px;color:rgba(232,220,192,.62);
    letter-spacing:0;
    line-height:1.5;padding:2px 0 2px;
  }
  .twk-hint strong{color:#c9a65a;font-weight:600;letter-spacing:.04em;font-style:normal}

  /* ─── Input fields (select) — bottom hairline only, no box ──────────── */
  .twk-field{
    appearance:none;box-sizing:border-box;width:100%;min-width:0;height:28px;
    padding:0 10px;
    border:none;
    border-bottom:1px solid rgba(201,166,90,.22);
    background:rgba(0,0,0,.35);color:#e8dcc0;
    font:inherit;font-size:11px;outline:none;
    transition:border-color .15s,background .15s;
  }
  .twk-field:focus{
    border-bottom-color:rgba(201,166,90,.75);background:rgba(10,14,22,.65);
  }
  select.twk-field{
    padding-right:24px;cursor:pointer;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='%23c9a65a' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 10px center;
  }
  select.twk-field option{background:#06080f;color:#e8dcc0}

  /* ─── Sliders ───────────────────────────────────────────────────────── */
  .twk-slider{
    appearance:none;-webkit-appearance:none;width:100%;height:3px;margin:7px 0;
    background:rgba(201,166,90,.18);outline:none;cursor:pointer;
  }
  .twk-slider::-webkit-slider-thumb{
    -webkit-appearance:none;appearance:none;
    width:13px;height:13px;
    background:#c9a65a;border:none;
    box-shadow:0 0 8px rgba(201,166,90,.35);
    cursor:pointer;
  }
  .twk-slider::-moz-range-thumb{
    width:13px;height:13px;
    background:#c9a65a;border:none;
    box-shadow:0 0 8px rgba(201,166,90,.35);
    cursor:pointer;
  }

  /* ─── Segmented control / radio strip — frameless ───────────────────── */
  .twk-seg{
    position:relative;display:flex;padding:2px;
    background:rgba(0,0,0,.4);
    user-select:none;
  }
  .twk-seg-thumb{
    position:absolute;top:2px;bottom:2px;
    background:rgba(201,166,90,.16);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s;
  }
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{
    appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:rgba(232,220,192,.7);font:inherit;
    font-size:10.5px;font-weight:500;letter-spacing:.08em;
    min-height:24px;cursor:pointer;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere;transition:color .15s;
  }
  .twk-seg button:hover{color:#e8dcc0}
  .twk-seg button[aria-checked="true"]{color:#c9a65a;font-weight:600}

  /* ─── Toggle pill — frameless track ─────────────────────────────────── */
  .twk-toggle{
    position:relative;width:34px;height:18px;
    border:none;
    background:rgba(201,166,90,.12);transition:background .15s;
    cursor:pointer;padding:0;
  }
  .twk-toggle[data-on="1"]{
    background:rgba(201,166,90,.34);
  }
  .twk-toggle i{
    position:absolute;top:2px;left:2px;width:14px;height:14px;
    background:#e8dcc0;
    box-shadow:0 1px 3px rgba(0,0,0,.5);
    transition:transform .15s,background .15s;
  }
  .twk-toggle[data-on="1"] i{
    transform:translateX(16px);
    background:#c9a65a;
    box-shadow:0 1px 3px rgba(0,0,0,.5),0 0 8px rgba(201,166,90,.5);
  }

  /* ─── Buttons — quiet fills, no drawn frame ─────────────────────────── */
  .twk-btn{
    appearance:none;width:100%;height:30px;padding:0 12px;
    border:none;
    background:rgba(201,166,90,.10);color:#e8dcc0;
    font:inherit;font-size:10.5px;font-weight:600;
    letter-spacing:.18em;text-transform:uppercase;
    cursor:pointer;
    display:inline-flex;align-items:center;justify-content:center;gap:6px;
    transition:background .18s,color .18s;
  }
  .twk-btn:hover{
    background:rgba(201,166,90,.20);color:#f5efe0;
  }
  .twk-btn:focus-visible{outline:1px solid #c9a65a;outline-offset:2px}
  .twk-btn.secondary{
    background:rgba(255,255,255,.04);
    color:rgba(232,220,192,.78);font-weight:500;letter-spacing:.14em;
  }
  .twk-btn.secondary:hover{
    background:rgba(201,166,90,.10);color:#e8dcc0;
  }
  .twk-btn.danger{
    background:rgba(40,8,8,.55);color:#ff8866;
    letter-spacing:.2em;text-transform:uppercase;font-size:10px;
  }
  .twk-btn.danger:hover{background:rgba(60,14,14,.65)}

  /* ─── Gear (toggle button, permanently mounted) — frameless ─────────── */
  .twk-gear{
    position:fixed;right:16px;bottom:16px;z-index:2147483647;
    width:42px;height:42px;
    border:none;
    background:rgba(2,3,10,.78);color:#c9a65a;cursor:pointer;
    display:flex;align-items:center;justify-content:center;
    font-size:18px;line-height:1;padding:0;
    -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
    box-shadow:
      0 6px 22px rgba(0,0,0,.55),
      inset 0 1px 0 rgba(232,220,192,.06);
    transition:transform .15s ease,box-shadow .15s ease,background .15s,color .15s;
  }
  .twk-gear:hover{
    transform:translateY(-1px);
    background:rgba(10,14,22,.9);
    color:#e8dcc0;
    box-shadow:
      0 8px 28px rgba(0,0,0,.65),
      inset 0 1px 0 rgba(232,220,192,.08),
      0 0 18px rgba(201,166,90,.18);
  }
  .twk-gear:focus-visible{outline:1px solid #c9a65a;outline-offset:3px}
  .twk-gear--open{
    background:rgba(10,14,22,.92);
    color:#e8dcc0;
    box-shadow:
      0 8px 28px rgba(0,0,0,.65),
      inset 0 1px 0 rgba(232,220,192,.08),
      0 0 18px rgba(201,166,90,.18);
  }
`;
