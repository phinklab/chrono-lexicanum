// Tweaks-panel CSS — redesigned 2026-05-27 as amber-glass, re-tuned
// 2026-06-12 to the site palette (gold #c9a65a / bone #e8dcc0 / void
// #02030a, fonts via the next/font CSS vars). The styles are mounted as a
// single <style> tag inside the panel so the same `.twk-*` classes work
// without polluting the global stylesheet. The gear is permanently mounted
// bottom-right and toggles `.twk-panel`; the panel sits directly above it
// (no drag, no overlap).
export const TWEAKS_PANEL_CSS = `
  /* ─── Panel surface ─────────────────────────────────────────────────── */
  .twk-panel{
    position:fixed;right:16px;bottom:72px;z-index:2147483646;
    width:300px;max-height:calc(100vh - 104px);
    display:flex;flex-direction:column;
    background:linear-gradient(180deg,rgba(2,3,10,.92) 0%,rgba(4,8,14,.94) 100%);
    color:#e8dcc0;
    -webkit-backdrop-filter:blur(10px) saturate(140%);backdrop-filter:blur(10px) saturate(140%);
    border:1px solid rgba(201,166,90,.32);
    box-shadow:
      0 12px 36px rgba(0,0,0,.65),
      0 0 0 1px rgba(0,0,0,.4) inset,
      inset 0 1px 0 rgba(201,166,90,.08);
    font:12px/1.45 var(--font-space-grotesk),'Space Grotesk',ui-sans-serif,system-ui,sans-serif;
    overflow:hidden;
    animation:twkPanelIn .18s ease-out both;
  }
  @keyframes twkPanelIn{
    from{opacity:0;transform:translateY(6px)}
    to{opacity:1;transform:translateY(0)}
  }
  /* Gold corner brackets — matches the rest of the map's chrome. */
  .twk-panel::before,.twk-panel::after{
    content:'';position:absolute;width:14px;height:14px;
    border-color:rgba(201,166,90,.7);border-style:solid;pointer-events:none;z-index:1;
  }
  .twk-panel::before{top:-1px;left:-1px;border-width:1px 0 0 1px}
  .twk-panel::after{bottom:-1px;right:-1px;border-width:0 1px 1px 0}

  /* ─── Header ────────────────────────────────────────────────────────── */
  .twk-hd{
    display:flex;align-items:baseline;gap:10px;
    padding:12px 12px 10px 16px;
    border-bottom:1px solid rgba(201,166,90,.18);
    background:linear-gradient(180deg,rgba(10,14,22,.55) 0%,rgba(2,3,10,0) 100%);
    user-select:none;
  }
  .twk-hd-eyebrow{
    font-family:var(--font-plex-mono),ui-monospace,monospace;
    font-size:9px;letter-spacing:.32em;text-transform:uppercase;
    color:rgba(201,166,90,.55);
  }
  .twk-hd-title{
    flex:1;font-size:13px;font-weight:600;letter-spacing:.22em;
    text-transform:uppercase;color:#c9a65a;
  }
  .twk-x{
    appearance:none;border:1px solid rgba(201,166,90,.28);background:rgba(0,0,0,.25);
    color:rgba(201,166,90,.85);width:24px;height:24px;cursor:pointer;
    display:inline-flex;align-items:center;justify-content:center;
    font-size:11px;line-height:1;padding:0;
    transition:background .15s,border-color .15s,color .15s;
  }
  .twk-x:hover{background:rgba(201,166,90,.14);border-color:rgba(201,166,90,.6);color:#f5efe0}
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
    color:#e8dcc0;font-size:11.5px;letter-spacing:.04em;
  }
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{
    color:rgba(201,166,90,.7);font-variant-numeric:tabular-nums;
    font-family:var(--font-plex-mono),ui-monospace,monospace;
    font-size:10.5px;letter-spacing:.04em;
  }

  /* ─── Section heading ───────────────────────────────────────────────── */
  .twk-sect{
    font-family:var(--font-plex-mono),ui-monospace,monospace;
    font-size:9.5px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;
    color:rgba(201,166,90,.68);padding:10px 0 4px;
    border-top:1px solid rgba(201,166,90,.12);
    margin-top:4px;
  }
  .twk-sect:first-child{padding-top:0;border-top:0;margin-top:0}

  /* ─── Hint text ─────────────────────────────────────────────────────── */
  .twk-hint{
    font-size:10.5px;color:rgba(232,220,192,.62);
    line-height:1.5;padding:2px 0 2px;
  }
  .twk-hint strong{color:#c9a65a;font-weight:600;letter-spacing:.08em}

  /* ─── Input fields (select) ─────────────────────────────────────────── */
  .twk-field{
    appearance:none;box-sizing:border-box;width:100%;min-width:0;height:28px;
    padding:0 10px;
    border:1px solid rgba(201,166,90,.28);
    background:rgba(0,0,0,.35);color:#e8dcc0;
    font:inherit;font-size:11.5px;outline:none;
    transition:border-color .15s,background .15s;
  }
  .twk-field:focus{
    border-color:rgba(201,166,90,.7);background:rgba(10,14,22,.65);
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
    background:#c9a65a;border:1px solid rgba(0,0,0,.5);
    box-shadow:0 0 0 1px rgba(201,166,90,.4),0 0 8px rgba(201,166,90,.35);
    cursor:pointer;
  }
  .twk-slider::-moz-range-thumb{
    width:13px;height:13px;
    background:#c9a65a;border:1px solid rgba(0,0,0,.5);
    box-shadow:0 0 0 1px rgba(201,166,90,.4),0 0 8px rgba(201,166,90,.35);
    cursor:pointer;
  }

  /* ─── Segmented control / radio strip ───────────────────────────────── */
  .twk-seg{
    position:relative;display:flex;padding:2px;
    background:rgba(0,0,0,.4);border:1px solid rgba(201,166,90,.22);
    user-select:none;
  }
  .twk-seg-thumb{
    position:absolute;top:2px;bottom:2px;
    background:rgba(201,166,90,.18);
    box-shadow:0 0 0 1px rgba(201,166,90,.55),inset 0 0 8px rgba(201,166,90,.18);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s;
  }
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{
    appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:rgba(232,220,192,.7);font:inherit;
    font-size:11px;font-weight:500;letter-spacing:.08em;
    min-height:24px;cursor:pointer;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere;transition:color .15s;
  }
  .twk-seg button:hover{color:#e8dcc0}
  .twk-seg button[aria-checked="true"]{color:#f5efe0;font-weight:600}

  /* ─── Toggle pill (iOS-style but in amber) ──────────────────────────── */
  .twk-toggle{
    position:relative;width:34px;height:18px;
    border:1px solid rgba(201,166,90,.28);
    background:rgba(0,0,0,.4);transition:background .15s,border-color .15s;
    cursor:pointer;padding:0;
  }
  .twk-toggle[data-on="1"]{
    background:rgba(201,166,90,.28);border-color:rgba(201,166,90,.7);
  }
  .twk-toggle i{
    position:absolute;top:1px;left:1px;width:14px;height:14px;
    background:#e8dcc0;
    box-shadow:0 1px 3px rgba(0,0,0,.5);
    transition:transform .15s,background .15s;
  }
  .twk-toggle[data-on="1"] i{
    transform:translateX(15px);
    background:#c9a65a;
    box-shadow:0 1px 3px rgba(0,0,0,.5),0 0 8px rgba(201,166,90,.5);
  }

  /* ─── Buttons ───────────────────────────────────────────────────────── */
  .twk-btn{
    appearance:none;width:100%;height:30px;padding:0 12px;
    border:1px solid rgba(201,166,90,.5);
    background:rgba(201,166,90,.12);color:#f5efe0;
    font:inherit;font-size:11px;font-weight:600;
    letter-spacing:.18em;text-transform:uppercase;
    cursor:pointer;
    display:inline-flex;align-items:center;justify-content:center;gap:6px;
    transition:background .15s,border-color .15s,color .15s;
  }
  .twk-btn:hover{
    background:rgba(201,166,90,.22);border-color:rgba(201,166,90,.85);
    color:#fff;
  }
  .twk-btn:focus-visible{outline:1px solid #c9a65a;outline-offset:2px}
  .twk-btn.secondary{
    background:rgba(0,0,0,.3);border-color:rgba(201,166,90,.22);
    color:rgba(232,220,192,.78);font-weight:500;letter-spacing:.14em;
  }
  .twk-btn.secondary:hover{
    background:rgba(0,0,0,.45);border-color:rgba(201,166,90,.45);color:#e8dcc0;
  }
  .twk-btn.danger{
    background:rgba(40,8,8,.55);color:#ff8866;border-color:#884444;
    letter-spacing:.2em;text-transform:uppercase;font-size:10.5px;
  }
  .twk-btn.danger:hover{background:rgba(60,14,14,.65);border-color:#a85555}

  /* ─── Gear (toggle button, permanently mounted) ─────────────────────── */
  .twk-gear{
    position:fixed;right:16px;bottom:16px;z-index:2147483647;
    width:42px;height:42px;
    border:1px solid rgba(201,166,90,.5);
    background:rgba(2,3,10,.88);color:#c9a65a;cursor:pointer;
    display:flex;align-items:center;justify-content:center;
    font-size:18px;line-height:1;padding:0;
    -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
    box-shadow:
      0 6px 22px rgba(0,0,0,.55),
      0 0 0 1px rgba(0,0,0,.4) inset,
      0 0 12px rgba(201,166,90,.15);
    transition:transform .15s ease,box-shadow .15s ease,border-color .15s,background .15s;
  }
  .twk-gear:hover{
    transform:translateY(-1px);
    border-color:rgba(201,166,90,.85);
    background:rgba(10,14,22,.92);
    box-shadow:
      0 8px 28px rgba(0,0,0,.65),
      0 0 0 1px rgba(0,0,0,.4) inset,
      0 0 18px rgba(201,166,90,.3);
  }
  .twk-gear:focus-visible{outline:1px solid #c9a65a;outline-offset:3px}
  .twk-gear--open{
    background:rgba(10,14,22,.94);
    border-color:rgba(201,166,90,.85);
    box-shadow:
      0 8px 28px rgba(0,0,0,.65),
      0 0 0 1px rgba(0,0,0,.4) inset,
      0 0 18px rgba(201,166,90,.3);
  }
`;
