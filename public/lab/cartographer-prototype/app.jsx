// App — full-bleed galaxy hologram with Tweaks panel
// Theme switch + faction filter are both Tweaks
const { useState: __us, useEffect: __ue } = React;

// Persistence wrapper: when running outside the Claude design environment
// (a downloaded standalone HTML, opened via file:// or a static host), there
// is no parent that can rewrite the EDITMODE block on disk. Mirror the live
// tweaks to localStorage and rehydrate on init so the user's slider settings
// survive a reload. Inside the Claude iframe we fall through to the EDITMODE
// defaults so the on-disk JSON stays the source of truth.
const __LS_KEY = '40k.galaxy.tweaks.v1';
const __LS_ELEMENTS_BASE = '40k.galaxy.elements.v1';   // per-era → suffixed by .eraId
const __LS_ERA_KEY = '40k.galaxy.era.v1';
const __forcedStandalone = (() => {
  try { return new URLSearchParams(window.location.search).get('standalone') === '1'; }
  catch (e) { return false; }
})();
const __isStandalone = (typeof window !== 'undefined') && (window === window.top || __forcedStandalone);

// Snapshot the original (data-file) defaults BEFORE any localStorage load
// touches the arrays. Each era falls back to these when it has no snapshot
// of its own yet, so first-visit to a new era starts from a known baseline.
const __clone = (v) => JSON.parse(JSON.stringify(v));
const __DEFAULT_DATA = {
  landmarks: __clone(window.GALAXY_LANDMARKS),
  nebulae:   __clone(window.NEBULAE),
  cicatrix:  __clone(window.CICATRIX_PTS),
  necron:    __clone(window.NECRON_DYNASTIES),
  tyranid:   __clone(window.TYRANID_SWARMS),
};

const __eraKey = (eraId) => `${__LS_ELEMENTS_BASE}.${eraId}`;

// Persist & restore the on-map element arrays so user-added planets/zones
// survive a reload — keyed by the active era so each timeline keeps its
// own map state independently.
function _saveElementsFor(eraId) {
  try {
    const payload = {
      landmarks: window.GALAXY_LANDMARKS,
      nebulae: window.NEBULAE,
      cicatrix: window.CICATRIX_PTS,
      necron: window.NECRON_DYNASTIES,
      tyranid: window.TYRANID_SWARMS,
    };
    localStorage.setItem(__eraKey(eraId), JSON.stringify(payload));
  } catch (e) { /* ignore */ }
}

function _applyData(data) {
  const safe = (arr, fallback) => Array.isArray(arr) ? arr : __clone(fallback);
  window.GALAXY_LANDMARKS.length = 0;  window.GALAXY_LANDMARKS.push(...safe(data.landmarks, __DEFAULT_DATA.landmarks));
  window.NEBULAE.length = 0;           window.NEBULAE.push(...safe(data.nebulae,   __DEFAULT_DATA.nebulae));
  window.CICATRIX_PTS.length = 0;      window.CICATRIX_PTS.push(...safe(data.cicatrix,  __DEFAULT_DATA.cicatrix));
  window.NECRON_DYNASTIES.length = 0;  window.NECRON_DYNASTIES.push(...safe(data.necron,    __DEFAULT_DATA.necron));
  window.TYRANID_SWARMS.length = 0;    window.TYRANID_SWARMS.push(...safe(data.tyranid,   __DEFAULT_DATA.tyranid));
}

function _loadElementsFor(eraId) {
  try {
    const raw = localStorage.getItem(__eraKey(eraId));
    if (raw) { _applyData(JSON.parse(raw)); return; }
  } catch (e) { /* ignore */ }
  // No snapshot yet for this era — start from the data-file defaults.
  _applyData(__DEFAULT_DATA);
}

// Migrate legacy single-key save into the default era's slot.
(function _migrate() {
  try {
    const legacy = localStorage.getItem('40k.galaxy.elements.v1');
    if (legacy && legacy[0] === '{' && !localStorage.getItem(__eraKey(window.DEFAULT_ERA))) {
      localStorage.setItem(__eraKey(window.DEFAULT_ERA), legacy);
      localStorage.removeItem('40k.galaxy.elements.v1');
    }
  } catch (e) { /* ignore */ }
})();

// Pick the era we're booting into and load its elements before App mounts.
// Coming-soon eras are never bootable — they're listed in the switcher
// for "you'll be able to see this soon" affordance only.
const __isPlayableEra = (id) => {
  const e = (window.ERAS || []).find((x) => x.id === id);
  return e && !e.comingSoon;
};
const __initialEra = (() => {
  // 1) URL hash beats everything (shareable deep link).
  try {
    const fromHash = window.__share && window.__share.parse();
    if (fromHash && fromHash.era && __isPlayableEra(fromHash.era)) {
      return fromHash.era;
    }
  } catch (e) {}
  // 2) Last-used era from a previous session.
  try {
    const stored = localStorage.getItem(__LS_ERA_KEY);
    if (stored && __isPlayableEra(stored)) return stored;
  } catch (e) {}
  return window.DEFAULT_ERA;
})();
_loadElementsFor(__initialEra);

// Parse view + world out of the URL hash exactly once — these flow into
// the hologram as initialView / initialWorldId, which seed its useState.
const __initialFromUrl = (() => {
  try {
    const parsed = (window.__share && window.__share.parse()) || {};
    return {
      view: parsed.view || 'galaxy',
      world: parsed.world || null,
    };
  } catch (e) { return { view: 'galaxy', world: null }; }
})();
function usePersistedTweaks(defaults) {
  const initial = React.useMemo(() => {
    if (!__isStandalone) return defaults;
    try {
      const raw = localStorage.getItem(__LS_KEY);
      if (raw) return { ...defaults, ...JSON.parse(raw) };
    } catch (e) { /* ignore */ }
    return defaults;
  }, []);
  const [tweaks, setTweak] = useTweaks(initial);
  __ue(() => {
    try { localStorage.setItem(__LS_KEY, JSON.stringify(tweaks)); } catch (e) { /* ignore */ }
  }, [tweaks]);
  return [tweaks, setTweak];
}

// Self-contained gear button that opens the Tweaks panel when there is no
// host toolbar to do it for us. Posts the same message the host would post,
// which the existing TweaksPanel already listens for.
function StandaloneTweaksToggle() {
  return (
    <button
      type="button"
      title="Open tweaks panel"
      onClick={() => window.postMessage({ type: '__activate_edit_mode' }, '*')}
      style={{
        position: 'fixed', right: 16, bottom: 16, zIndex: 2147483645,
        width: 40, height: 40, borderRadius: 999, border: '1px solid rgba(240,178,72,.45)',
        background: 'rgba(15,12,6,.78)', color: '#f0b248',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, lineHeight: 1, padding: 0,
        boxShadow: '0 4px 16px rgba(0,0,0,.4), 0 0 0 1px rgba(0,0,0,.4) inset',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        fontFamily: 'inherit',
      }}>
      ⚙
    </button>
  );
}

// Top-right era switcher — pills of era short-codes; click to switch timeline.
function EraSwitcher({ active, onChange }) {
  const [open, setOpen] = __us(false);
  const eras = window.ERAS || [];
  const cur = eras.find((e) => e.id === active) || eras[0];
  if (!cur) return null;
  return (
    <div style={{
      position: 'fixed', left: 100, top: 84, zIndex: 2147483640,
      width: 280,
      fontFamily: '"Rajdhani", system-ui, sans-serif',
      color: '#f0b248', userSelect: 'none',
    }}>
      {/* Compact header bar — clickable to expand */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%',
          padding: '8px 12px 8px 14px',
          background: 'rgba(10,7,3,0.78)',
          border: '1px solid rgba(240,178,72,.35)',
          borderLeft: `3px solid ${cur.accent}`,
          color: 'inherit', cursor: 'pointer',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          fontFamily: 'inherit', letterSpacing: '0.18em', textTransform: 'uppercase',
          boxShadow: '0 4px 18px rgba(0,0,0,0.45)',
        }}>
        <span style={{ fontSize: 9, opacity: 0.55, letterSpacing: '0.32em' }}>TIMELINE</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: cur.accent }}>{cur.code}</span>
        <span style={{ fontSize: 11, fontWeight: 500 }}>{cur.name}</span>
        <span style={{ fontSize: 9, opacity: 0.5, marginLeft: 4, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>▼</span>
      </button>
      {/* Expanded panel — opens DOWNWARD (we live at the top of the
          screen now, under the title). */}
      {open && (
        <div style={{
          position: 'absolute', left: 0, top: 'calc(100% + 6px)',
          background: 'rgba(10,7,3,0.92)',
          border: '1px solid rgba(240,178,72,.35)',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          boxShadow: '0 8px 28px rgba(0,0,0,0.55)',
          width: 280,
        }}>
          <div style={{ padding: '8px 12px 6px', fontSize: 9, letterSpacing: '0.32em', opacity: 0.5, textTransform: 'uppercase', borderBottom: '1px solid rgba(240,178,72,.15)' }}>
            Select Timeline
          </div>
          {eras.map((e) => {
            const isActive = e.id === active;
            const locked = !!e.comingSoon;
            return (
              <button
                key={e.id}
                type="button"
                disabled={locked}
                onClick={() => { if (locked) return; onChange(e.id); setOpen(false); }}
                title={locked ? 'Coming soon' : ''}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'stretch',
                  width: '100%', padding: '10px 12px 10px 14px',
                  background: isActive ? 'rgba(240,178,72,.10)' : 'transparent',
                  border: 'none',
                  borderLeft: `3px solid ${isActive ? e.accent : 'transparent'}`,
                  color: 'inherit', cursor: locked ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', textAlign: 'left',
                  borderTop: '1px solid rgba(240,178,72,.06)',
                  opacity: locked ? 0.42 : 1,
                  position: 'relative',
                }}
                onMouseEnter={(ev) => { if (!isActive && !locked) ev.currentTarget.style.background = 'rgba(240,178,72,.05)'; }}
                onMouseLeave={(ev) => { if (!isActive && !locked) ev.currentTarget.style.background = 'transparent'; }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.20em', color: e.accent, minWidth: 32 }}>{e.code}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase' }}>{e.name}</span>
                  {locked && (
                    <span style={{
                      marginLeft: 'auto',
                      fontSize: 8, letterSpacing: '0.28em', textTransform: 'uppercase',
                      padding: '2px 6px',
                      border: '1px solid rgba(240,178,72,.30)',
                      color: 'rgba(240,178,72,.65)',
                      fontFamily: '"JetBrains Mono", monospace',
                    }}>Coming soon</span>
                  )}
                </div>
                <div style={{ fontSize: 9, opacity: 0.55, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 2, marginLeft: 40 }}>{e.sub}</div>
                <div style={{ fontSize: 11, opacity: 0.65, lineHeight: 1.4, marginTop: 6, marginLeft: 40, fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic' }}>{e.blurb}</div>
              </button>
            );
          })}
          <div style={{ padding: '8px 12px', fontSize: 10, opacity: 0.5, lineHeight: 1.4, borderTop: '1px solid rgba(240,178,72,.15)' }}>
            Each timeline saves its own map state. Edits, added worlds and warp zones are kept per-era.
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [era, setEraState] = __us(__initialEra);
  const switchEra = (newEra) => {
    if (newEra === era) return;
    if (!__isPlayableEra(newEra)) return; // comingSoon entries are read-only
    // Save the CURRENT era's state under its own key before swapping,
    // then load the target era's saved state (or defaults if untouched).
    _saveElementsFor(era);
    _loadElementsFor(newEra);
    try { localStorage.setItem(__LS_ERA_KEY, newEra); } catch (e) {}
    // Mirror era into the URL hash so a deep link captures it.
    if (window.__share) window.__share.write({ era: newEra });
    setEraState(newEra);
    window.dispatchEvent(new CustomEvent('40k:era', { detail: { era: newEra } }));
    // Star field is procedural and not era-dependent, but bump it so the
    // hologram re-mounts cleanly with the new arrays.
    if (window.regenerateBackgroundStars) window.regenerateBackgroundStars();
  };

  // Ensure the URL captures the booted era even if it came from localStorage
  // (so copying the URL out always works), once on mount.
  __ue(() => {
    if (window.__share) window.__share.write({ era });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [tweaks, setTweak] = usePersistedTweaks(/*EDITMODE-BEGIN*/{
    "theme": "mechanicus",
    "factionFilter": "all",
    "riftPattern": "triangular",
    "astronomican": false,
    "editWarps": false,
    "addMode": false,
    "outerObscurus": 0.98,
    "outerUltima": 1.30,
    "outerTempestus": 0.80,
    "outerPacificus": 0.64,
    "boundaryNE": 35,
    "boundarySE": 135,
    "boundarySW": 233,
    "boundaryNW": 319
  }/*EDITMODE-END*/);

  const [size, setSize] = __us({ w: window.innerWidth, h: window.innerHeight });
  __ue(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Push live segment dimensions into window.SEGMENTUMS so every renderer
  // sees the per-segment outer radius and the four shared boundary angles.
  // Obscurus wraps over 0°, so its a0 is the NW boundary minus 360.
  const segs = window.SEGMENTUMS;
  const segGet = (id) => segs.find((s) => s.id === id);
  segGet('obscurus').a0 = tweaks.boundaryNW - 360;
  segGet('obscurus').a1 = tweaks.boundaryNE;
  segGet('obscurus').outer = tweaks.outerObscurus;
  segGet('ultima').a0 = tweaks.boundaryNE;
  segGet('ultima').a1 = tweaks.boundarySE;
  segGet('ultima').outer = tweaks.outerUltima;
  segGet('tempestus').a0 = tweaks.boundarySE;
  segGet('tempestus').a1 = tweaks.boundarySW;
  segGet('tempestus').outer = tweaks.outerTempestus;
  segGet('pacificus').a0 = tweaks.boundarySW;
  segGet('pacificus').a1 = tweaks.boundaryNW;
  segGet('pacificus').outer = tweaks.outerPacificus;

  // Whenever any segment dimension changes, re-sample the background star
  // field so stars sit inside the new wedges (and halo follows the new
  // outer silhouette). Cheap — runs once per slider drag-end.
  const segKey = [
    tweaks.outerObscurus, tweaks.outerUltima, tweaks.outerTempestus, tweaks.outerPacificus,
    tweaks.boundaryNE, tweaks.boundarySE, tweaks.boundarySW, tweaks.boundaryNW,
  ].join('|');
  const [, bumpStars] = __us(0);
  __ue(() => {
    if (window.regenerateBackgroundStars) window.regenerateBackgroundStars();
    bumpStars((v) => v + 1);
  }, [segKey]);

  const theme = window.THEMES[tweaks.theme] || window.THEMES.mechanicus;
  const filter = tweaks.factionFilter;

  return (
    <>
      <GalaxyHologram
        key={era}
        theme={theme}
        factionFilter={filter}
        riftPattern={tweaks.riftPattern}
        astronomican={tweaks.astronomican}
        editWarps={tweaks.editWarps}
        addMode={tweaks.addMode}
        onPersist={() => _saveElementsFor(era)}
        initialView={__initialFromUrl.view}
        initialWorldId={__initialFromUrl.world}
        width={size.w}
        height={size.h}
      />

      <EraSwitcher active={era} onChange={switchEra} />

      {window.SearchPalette && <window.SearchPalette theme={theme} />}

      <TweaksPanel>
        <TweakSection label="Hologram">
          <TweakRadio
            label="Aesthetic"
            value={tweaks.theme}
            onChange={(v) => setTweak('theme', v)}
            options={[
              { value: 'mechanicus', label: 'Mechanicus' },
              { value: 'astropath',  label: 'Astropath' },
            ]}
          />
        </TweakSection>
        <TweakSection label="Faction Overlay">
          <TweakRadio
            label="Filter"
            value={tweaks.factionFilter}
            onChange={(v) => setTweak('factionFilter', v)}
            options={[
              { value: 'all',      label: 'All' },
              { value: 'imperium', label: 'Imperium' },
              { value: 'chaos',    label: 'Chaos' },
              { value: 'xenos',    label: 'Xenos' },
            ]}
          />
        </TweakSection>
        <TweakSection label="Cicatrix Pattern">
          <TweakSelect
            label="Grid"
            value={tweaks.riftPattern}
            onChange={(v) => setTweak('riftPattern', v)}
            options={[
              { value: 'strict-square',       label: 'A · Strict square grid' },
              { value: 'strict-square-dense', label: 'B · Strict square, denser' },
              { value: 'strict-brick',        label: 'C · Strict brick offset' },
              { value: 'triangular',          label: 'D · Triangular lattice' },
              { value: 'mega-dense',          label: 'E · Tiny + ultra-dense' },
            ]}
          />
        </TweakSection>
        <TweakSection label="Astronomican">
          <TweakToggle
            label="Show Emperor's reach"
            value={tweaks.astronomican}
            onChange={(v) => setTweak('astronomican', v)}
          />
          <div style={{ fontSize: 10, color: '#888', lineHeight: 1.45, padding: '4px 0' }}>
            Warm halo emanating from Terra. Worlds outside the glow are, in lore, beyond the Emperor's psychic lighthouse — the Dark Imperium.
          </div>
        </TweakSection>
        <TweakSection label="Share & Export">
          <TweakButton
            label="⎘ Copy share link"
            onClick={async () => {
              const ok = window.__share && await window.__share.copyLink();
              if (ok) {
                // Subtle inline confirmation — re-uses the existing button text.
                const el = document.activeElement;
                if (el && el.textContent && el.textContent.includes('Copy')) {
                  const prev = el.textContent;
                  el.textContent = '✓ Copied — paste anywhere';
                  setTimeout(() => { el.textContent = prev; }, 1800);
                }
              } else {
                alert('Could not copy automatically. URL: ' + window.location.href);
              }
            }}
          />
          <TweakButton
            label="⎙ Print / Save as PDF"
            secondary
            onClick={() => {
              // The print stylesheet (in index.html) hides every overlay
              // and lets the map fill the page. We just trigger the dialog.
              window.print();
            }}
          />
          <div style={{ fontSize: 10, color: '#888', lineHeight: 1.45, padding: '4px 0' }}>
            Share captures era + segmentum + selected world. Print works best in landscape, A4 / Letter, background graphics ON.
          </div>
        </TweakSection>
        <TweakSection label="Add Element">
          <TweakToggle
            label="Show Add panel"
            value={tweaks.addMode}
            onChange={(v) => setTweak('addMode', v)}
          />
          <div style={{ fontSize: 10, color: '#888', lineHeight: 1.45, padding: '4px 0' }}>
            Add planets (Imperial / Chaos / Xenos / Necron / Tyranid) or zones (Warp / Necron / Tyranid Swarm). Click the map to place, then Save. Survives reload.
          </div>
          <button onClick={() => {
            const cur = (window.ERAS || []).find((e) => e.id === era);
            const eraLabel = cur ? `${cur.code} · ${cur.name}` : 'this timeline';
            if (confirm(`Reset the ${eraLabel} timeline back to defaults? Other timelines are unaffected. This cannot be undone.`)) {
              try { localStorage.removeItem(__eraKey(era)); } catch (e) {}
              location.reload();
            }
          }} style={{
            marginTop: 6, padding: '6px 10px',
            background: '#2a0a0a', border: '1px solid #884444', color: '#ff8866',
            fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>✕ Reset this timeline</button>
        </TweakSection>
        <TweakSection label="Warp Placement">
          <TweakToggle
            label="Edit warp positions"
            value={tweaks.editWarps}
            onChange={(v) => setTweak('editWarps', v)}
          />
          <div style={{ fontSize: 10, color: '#888', lineHeight: 1.45, padding: '4px 0' }}>
            Drag warp clusters & Cicatrix spine points on the map. Cursor coords show bottom-right. Copy the JSON dump and paste back to apply.
          </div>
        </TweakSection>
        <TweakSection label="Segmentum Sizes">
          <div style={{ fontSize: 10, color: '#888', lineHeight: 1.45, padding: '2px 0 6px' }}>
            Outer reach (how far from Terra each segmentum extends).
          </div>
          <TweakSlider label="Obscurus reach (N)"
            value={tweaks.outerObscurus} min={0.4} max={1.6} step={0.02}
            onChange={(v) => setTweak('outerObscurus', v)} />
          <TweakSlider label="Ultima reach (E)"
            value={tweaks.outerUltima} min={0.4} max={1.6} step={0.02}
            onChange={(v) => setTweak('outerUltima', v)} />
          <TweakSlider label="Tempestus reach (S)"
            value={tweaks.outerTempestus} min={0.4} max={1.6} step={0.02}
            onChange={(v) => setTweak('outerTempestus', v)} />
          <TweakSlider label="Pacificus reach (W)"
            value={tweaks.outerPacificus} min={0.4} max={1.6} step={0.02}
            onChange={(v) => setTweak('outerPacificus', v)} />
          <div style={{ fontSize: 10, color: '#888', lineHeight: 1.45, padding: '8px 0 4px' }}>
            Boundaries between neighbouring segmentums (in degrees, 0° = north, clockwise).
          </div>
          <TweakSlider label="Obscurus ↔ Ultima (NE)"
            value={tweaks.boundaryNE} min={-10} max={60} step={1} unit="°"
            onChange={(v) => setTweak('boundaryNE', v)} />
          <TweakSlider label="Ultima ↔ Tempestus (SE)"
            value={tweaks.boundarySE} min={120} max={190} step={1} unit="°"
            onChange={(v) => setTweak('boundarySE', v)} />
          <TweakSlider label="Tempestus ↔ Pacificus (SW)"
            value={tweaks.boundarySW} min={195} max={250} step={1} unit="°"
            onChange={(v) => setTweak('boundarySW', v)} />
          <TweakSlider label="Pacificus ↔ Obscurus (NW)"
            value={tweaks.boundaryNW} min={260} max={325} step={1} unit="°"
            onChange={(v) => setTweak('boundaryNW', v)} />
        </TweakSection>
        <TweakSection label="Tip">
          <div style={{ fontSize: 11, color: '#666', lineHeight: 1.5, padding: '4px 0' }}>
            Click <strong>ULTIMA</strong> to dive · scroll to zoom · click any world for codex
          </div>
        </TweakSection>
      </TweaksPanel>
      {__isStandalone && <StandaloneTweaksToggle />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
