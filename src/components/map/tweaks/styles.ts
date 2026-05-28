// Tweaks-panel CSS — redesigned 2026-05-27 to match the map's amber-glass
// holographic aesthetic (EraSwitcher / HUD / Cartographer surfaces). The
// styles are mounted as a single <style> tag inside the panel so the same
// `.twk-*` classes work without polluting the global stylesheet. The gear
// is permanently mounted bottom-right and toggles `.twk-panel`; the panel
// sits directly above it (no drag, no overlap).
export const TWEAKS_PANEL_CSS = `
  /* ─── Panel surface ─────────────────────────────────────────────────── */
  .twk-panel{
    position:fixed;right:16px;bottom:72px;z-index:2147483646;
    width:300px;max-height:calc(100vh - 104px);
    display:flex;flex-direction:column;
    background:linear-gradient(180deg,rgba(10,7,3,.92) 0%,rgba(6,4,2,.94) 100%);
    color:#f3dcaa;
    -webkit-backdrop-filter:blur(10px) saturate(140%);backdrop-filter:blur(10px) saturate(140%);
    border:1px solid rgba(240,178,72,.32);
    box-shadow:
      0 12px 36px rgba(0,0,0,.65),
      0 0 0 1px rgba(0,0,0,.4) inset,
      inset 0 1px 0 rgba(240,178,72,.08);
    font:12px/1.45 'Rajdhani','Space Grotesk',ui-sans-serif,system-ui,sans-serif;
    overflow:hidden;
    animation:twkPanelIn .18s ease-out both;
  }
  @keyframes twkPanelIn{
    from{opacity:0;transform:translateY(6px)}
    to{opacity:1;transform:translateY(0)}
  }
  /* Cyan-style corner brackets — matches the rest of the map's chrome. */
  .twk-panel::before,.twk-panel::after{
    content:'';position:absolute;width:14px;height:14px;
    border-color:rgba(240,178,72,.7);border-style:solid;pointer-events:none;z-index:1;
  }
  .twk-panel::before{top:-1px;left:-1px;border-width:1px 0 0 1px}
  .twk-panel::after{bottom:-1px;right:-1px;border-width:0 1px 1px 0}

  /* ─── Header ────────────────────────────────────────────────────────── */
  .twk-hd{
    display:flex;align-items:baseline;gap:10px;
    padding:12px 12px 10px 16px;
    border-bottom:1px solid rgba(240,178,72,.18);
    background:linear-gradient(180deg,rgba(20,14,6,.55) 0%,rgba(10,7,3,0) 100%);
    user-select:none;
  }
  .twk-hd-eyebrow{
    font-family:ui-monospace,'JetBrains Mono','IBM Plex Mono',monospace;
    font-size:9px;letter-spacing:.32em;text-transform:uppercase;
    color:rgba(240,178,72,.55);
  }
  .twk-hd-title{
    flex:1;font-size:13px;font-weight:600;letter-spacing:.22em;
    text-transform:uppercase;color:#f0b248;
  }
  .twk-x{
    appearance:none;border:1px solid rgba(240,178,72,.28);background:rgba(0,0,0,.25);
    color:rgba(240,178,72,.85);width:24px;height:24px;cursor:pointer;
    display:inline-flex;align-items:center;justify-content:center;
    font-size:11px;line-height:1;padding:0;
    transition:background .15s,border-color .15s,color .15s;
  }
  .twk-x:hover{background:rgba(240,178,72,.14);border-color:rgba(240,178,72,.6);color:#fff2d4}
  .twk-x:focus-visible{outline:1px solid #f0b248;outline-offset:2px}

  /* ─── Scrollable body ───────────────────────────────────────────────── */
  .twk-body{
    padding:10px 14px 14px;display:flex;flex-direction:column;gap:8px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(240,178,72,.28) transparent;
  }
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{
    background:rgba(240,178,72,.22);border:2px solid transparent;background-clip:content-box;
  }
  .twk-body::-webkit-scrollbar-thumb:hover{
    background:rgba(240,178,72,.42);border:2px solid transparent;background-clip:content-box;
  }

  /* ─── Rows + labels ─────────────────────────────────────────────────── */
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{
    display:flex;justify-content:space-between;align-items:baseline;
    color:#e8d6b0;font-size:11.5px;letter-spacing:.04em;
  }
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{
    color:rgba(240,178,72,.7);font-variant-numeric:tabular-nums;
    font-family:ui-monospace,'JetBrains Mono','IBM Plex Mono',monospace;
    font-size:10.5px;letter-spacing:.04em;
  }

  /* ─── Section heading ───────────────────────────────────────────────── */
  .twk-sect{
    font-family:ui-monospace,'JetBrains Mono','IBM Plex Mono',monospace;
    font-size:9.5px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;
    color:rgba(240,178,72,.68);padding:10px 0 4px;
    border-top:1px solid rgba(240,178,72,.12);
    margin-top:4px;
  }
  .twk-sect:first-child{padding-top:0;border-top:0;margin-top:0}

  /* ─── Hint text ─────────────────────────────────────────────────────── */
  .twk-hint{
    font-size:10.5px;color:rgba(232,214,176,.62);
    line-height:1.5;padding:2px 0 2px;
  }
  .twk-hint strong{color:#f0b248;font-weight:600;letter-spacing:.08em}

  /* ─── Input fields (select) ─────────────────────────────────────────── */
  .twk-field{
    appearance:none;box-sizing:border-box;width:100%;min-width:0;height:28px;
    padding:0 10px;
    border:1px solid rgba(240,178,72,.28);
    background:rgba(0,0,0,.35);color:#f3dcaa;
    font:inherit;font-size:11.5px;outline:none;
    transition:border-color .15s,background .15s;
  }
  .twk-field:focus{
    border-color:rgba(240,178,72,.7);background:rgba(20,14,6,.65);
  }
  select.twk-field{
    padding-right:24px;cursor:pointer;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='%23f0b248' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 10px center;
  }
  select.twk-field option{background:#0a0703;color:#f3dcaa}

  /* ─── Sliders ───────────────────────────────────────────────────────── */
  .twk-slider{
    appearance:none;-webkit-appearance:none;width:100%;height:3px;margin:7px 0;
    background:rgba(240,178,72,.18);outline:none;cursor:pointer;
  }
  .twk-slider::-webkit-slider-thumb{
    -webkit-appearance:none;appearance:none;
    width:13px;height:13px;
    background:#f0b248;border:1px solid rgba(0,0,0,.5);
    box-shadow:0 0 0 1px rgba(240,178,72,.4),0 0 8px rgba(240,178,72,.35);
    cursor:pointer;
  }
  .twk-slider::-moz-range-thumb{
    width:13px;height:13px;
    background:#f0b248;border:1px solid rgba(0,0,0,.5);
    box-shadow:0 0 0 1px rgba(240,178,72,.4),0 0 8px rgba(240,178,72,.35);
    cursor:pointer;
  }

  /* ─── Segmented control / radio strip ───────────────────────────────── */
  .twk-seg{
    position:relative;display:flex;padding:2px;
    background:rgba(0,0,0,.4);border:1px solid rgba(240,178,72,.22);
    user-select:none;
  }
  .twk-seg-thumb{
    position:absolute;top:2px;bottom:2px;
    background:rgba(240,178,72,.18);
    box-shadow:0 0 0 1px rgba(240,178,72,.55),inset 0 0 8px rgba(240,178,72,.18);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s;
  }
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{
    appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:rgba(232,214,176,.7);font:inherit;
    font-size:11px;font-weight:500;letter-spacing:.08em;
    min-height:24px;cursor:pointer;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere;transition:color .15s;
  }
  .twk-seg button:hover{color:#f3dcaa}
  .twk-seg button[aria-checked="true"]{color:#fff2d4;font-weight:600}

  /* ─── Toggle pill (iOS-style but in amber) ──────────────────────────── */
  .twk-toggle{
    position:relative;width:34px;height:18px;
    border:1px solid rgba(240,178,72,.28);
    background:rgba(0,0,0,.4);transition:background .15s,border-color .15s;
    cursor:pointer;padding:0;
  }
  .twk-toggle[data-on="1"]{
    background:rgba(240,178,72,.28);border-color:rgba(240,178,72,.7);
  }
  .twk-toggle i{
    position:absolute;top:1px;left:1px;width:14px;height:14px;
    background:#e8d6b0;
    box-shadow:0 1px 3px rgba(0,0,0,.5);
    transition:transform .15s,background .15s;
  }
  .twk-toggle[data-on="1"] i{
    transform:translateX(15px);
    background:#f0b248;
    box-shadow:0 1px 3px rgba(0,0,0,.5),0 0 8px rgba(240,178,72,.5);
  }

  /* ─── Buttons ───────────────────────────────────────────────────────── */
  .twk-btn{
    appearance:none;width:100%;height:30px;padding:0 12px;
    border:1px solid rgba(240,178,72,.5);
    background:rgba(240,178,72,.12);color:#fff2d4;
    font:inherit;font-size:11px;font-weight:600;
    letter-spacing:.18em;text-transform:uppercase;
    cursor:pointer;
    display:inline-flex;align-items:center;justify-content:center;gap:6px;
    transition:background .15s,border-color .15s,color .15s;
  }
  .twk-btn:hover{
    background:rgba(240,178,72,.22);border-color:rgba(240,178,72,.85);
    color:#fff;
  }
  .twk-btn:focus-visible{outline:1px solid #f0b248;outline-offset:2px}
  .twk-btn.secondary{
    background:rgba(0,0,0,.3);border-color:rgba(240,178,72,.22);
    color:rgba(232,214,176,.78);font-weight:500;letter-spacing:.14em;
  }
  .twk-btn.secondary:hover{
    background:rgba(0,0,0,.45);border-color:rgba(240,178,72,.45);color:#f3dcaa;
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
    border:1px solid rgba(240,178,72,.5);
    background:rgba(10,7,3,.88);color:#f0b248;cursor:pointer;
    display:flex;align-items:center;justify-content:center;
    font-size:18px;line-height:1;padding:0;
    -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
    box-shadow:
      0 6px 22px rgba(0,0,0,.55),
      0 0 0 1px rgba(0,0,0,.4) inset,
      0 0 12px rgba(240,178,72,.15);
    transition:transform .15s ease,box-shadow .15s ease,border-color .15s,background .15s;
  }
  .twk-gear:hover{
    transform:translateY(-1px);
    border-color:rgba(240,178,72,.85);
    background:rgba(20,14,6,.92);
    box-shadow:
      0 8px 28px rgba(0,0,0,.65),
      0 0 0 1px rgba(0,0,0,.4) inset,
      0 0 18px rgba(240,178,72,.3);
  }
  .twk-gear:focus-visible{outline:1px solid #f0b248;outline-offset:3px}
  .twk-gear--open{
    background:rgba(20,14,6,.94);
    border-color:rgba(240,178,72,.85);
    box-shadow:
      0 8px 28px rgba(0,0,0,.65),
      0 0 0 1px rgba(0,0,0,.4) inset,
      0 0 18px rgba(240,178,72,.3);
  }
`;
