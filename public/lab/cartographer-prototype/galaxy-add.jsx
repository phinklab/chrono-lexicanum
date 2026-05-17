// Add Element panel — lets the user place new landmarks (planets) or
// zones (warp anomalies, Necron dynasties, Tyranid swarms) directly on
// the map.
//
// Flow:
//   1. Pick a TYPE.
//   2. Enter NAME (and a couple of type-specific fields).
//   3. Click "Place on map" → the next map click captures (r, a) coords.
//      For zone types you click N times to drop N control points, then hit Save.
//   4. Save → element committed to the appropriate window.* array
//      and persisted to localStorage so reloads survive.
//
// The hologram reads window.AddMode to know when to capture clicks.
//
//   window.AddMode = {
//     active: false,      // when true, map clicks call onMapClick(r,a)
//     wantsMore: false,   // true while gathering more points for a zone
//     onMapClick: null,   // (r, a) => void — installed by the panel
//   };

window.AddMode = window.AddMode || { active: false, wantsMore: false, onMapClick: null };

const _adus = React.useState, _adue = React.useEffect, _adur = React.useRef;

// Reuse the same RowSlider/RowSelect/RowColor/RowText helpers from the editor
// — they live as module-locals in galaxy-editor.jsx so we re-declare matching
// thin wrappers here. (Keeping them local to this file avoids leaking yet
// another set of globals.)
function AddRowText({ t, label, value, onChange, placeholder }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
      <div style={{ width: 64, fontSize: 10, color: t.primary, opacity: 0.7 }}>{label}</div>
      <input type="text" value={value || ''} placeholder={placeholder || ''}
        onChange={(e) => onChange(e.target.value)} style={{
        flex: 1, padding: '5px 7px',
        background: t.bg0, color: t.accent,
        border: `1px solid ${t.stroke}`,
        fontFamily: t.fontMono, fontSize: 10.5,
        letterSpacing: '0.08em',
        outline: 'none',
      }} />
    </div>
  );
}
function AddRowSelect({ t, label, value, options, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
      <div style={{ width: 64, fontSize: 10, color: t.primary, opacity: 0.7 }}>{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{
        flex: 1, padding: '5px 7px',
        background: t.bg0, color: t.accent,
        border: `1px solid ${t.stroke}`,
        fontFamily: t.fontMono, fontSize: 10.5,
        letterSpacing: '0.08em',
      }}>
        {options.map((o) => (
          <option key={typeof o === 'object' ? o.value : o}
            value={typeof o === 'object' ? o.value : o}>
            {typeof o === 'object' ? o.label : o.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}
function AddBtn({ t, onClick, primary, danger, children, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '8px 12px',
      background: primary ? t.accent : (danger ? '#3a1010' : t.bg0),
      color: primary ? t.bg0 : (danger ? '#ff7766' : t.accent),
      border: `1px solid ${primary ? t.accent : (danger ? '#ff5544' : t.stroke)}`,
      fontFamily: t.fontMono, fontSize: 10,
      fontWeight: primary ? 700 : 400,
      letterSpacing: '0.18em', textTransform: 'uppercase',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      transition: 'all 0.15s',
    }}>{children}</button>
  );
}

// Lightweight unique id generator for draft elements
const _newId = () => 'usr-' + Math.random().toString(36).slice(2, 8);

// What kinds of element the user can add. Each entry knows:
//   - which window array it lives in
//   - how many points it needs (1 for landmark/nebula, 2+ for zones)
//   - a factory to build the draft from form state + captured coords
const ELEMENT_TYPES = {
  'planet-imperium': {
    label: 'Planet · Imperium',
    swatch: '#f0b248', points: 1,
    target: 'GALAXY_LANDMARKS',
    kinds: ['hive', 'fortress', 'astartes', 'forge', 'death', 'war', 'shrine', 'civilised', 'throne', 'dead'],
    defaultKind: 'hive',
    build: (form, pts, segId) => ({
      id: _newId(), name: form.name.toUpperCase(),
      r: pts[0][0], a: pts[0][1],
      kind: form.kind, faction: 'imperium', segment: segId,
    }),
  },
  'planet-chaos': {
    label: 'Planet · Chaos',
    swatch: '#d04428', points: 1,
    target: 'GALAXY_LANDMARKS',
    kinds: ['chaos', 'warp', 'dead', 'death', 'war'],
    defaultKind: 'chaos',
    build: (form, pts, segId) => ({
      id: _newId(), name: form.name.toUpperCase(),
      r: pts[0][0], a: pts[0][1],
      kind: form.kind, faction: 'chaos', segment: segId,
    }),
  },
  'planet-xenos': {
    label: 'Planet · Xenos',
    swatch: '#5cd09a', points: 1,
    target: 'GALAXY_LANDMARKS',
    kinds: ['xenos', 'hive', 'death', 'war', 'dead', 'civilised'],
    defaultKind: 'xenos',
    build: (form, pts, segId) => ({
      id: _newId(), name: form.name.toUpperCase(),
      r: pts[0][0], a: pts[0][1],
      kind: form.kind, faction: 'xenos', segment: segId,
    }),
  },
  'planet-necron': {
    label: 'Planet · Necron',
    swatch: '#7ad8a4', points: 1,
    target: 'GALAXY_LANDMARKS',
    kinds: ['necron', 'dead', 'fortress'],
    defaultKind: 'necron',
    build: (form, pts, segId) => ({
      id: _newId(), name: form.name.toUpperCase(),
      r: pts[0][0], a: pts[0][1],
      kind: form.kind, faction: 'necron', segment: segId,
    }),
  },
  'planet-tyranid': {
    label: 'Planet · Tyranid',
    swatch: '#c97ad8', points: 1,
    target: 'GALAXY_LANDMARKS',
    kinds: ['tyranid', 'dead', 'death'],
    defaultKind: 'tyranid',
    build: (form, pts, segId) => ({
      id: _newId(), name: form.name.toUpperCase(),
      r: pts[0][0], a: pts[0][1],
      kind: form.kind, faction: 'tyranid', segment: segId,
    }),
  },
  'zone-warp': {
    label: 'Zone · Warp anomaly',
    swatch: '#ff6644', points: 1,
    target: 'NEBULAE',
    build: (form, pts) => ({
      name: form.name, r: pts[0][0], a: pts[0][1],
      size: parseFloat(form.size) || 2.0,
      type: 'warp', color: '#ff6644',
    }),
  },
  'zone-necron': {
    label: 'Zone · Necron Dynasty',
    swatch: '#5cd09a', points: -1,  // -1 = "2 or more"
    target: 'NECRON_DYNASTIES',
    build: (form, pts) => ({
      id: form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || _newId(),
      name: form.name,
      color: '#5cd09a', density: 'high',
      pts: pts.map(([r, a]) => [r, a]),
    }),
  },
  'zone-tyranid': {
    label: 'Zone · Tyranid Swarm',
    swatch: '#c97ad8', points: -1,
    target: 'TYRANID_SWARMS',
    build: (form, pts) => ({
      id: form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || _newId(),
      name: form.name,
      color: '#c97ad8', density: 'high',
      pts: pts.map(([r, a]) => [r, a]),
    }),
  },
};

// Decide which segmentum a (r, a) belongs to (for landmark `segment` field).
function _segmentOf(r, a) {
  const segs = window.SEGMENTUMS || [];
  for (const s of segs) {
    if (window.inSegment && window.inSegment(r, a, s)) return s.id;
  }
  return 'solar';
}

// ─────────────────────────────────────────────────────────────
// AddElementPanel — the full Add UI.
// ─────────────────────────────────────────────────────────────
function AddElementPanel({ enabled, theme, onTick, onPersist }) {
  const t = theme;
  // phase: 'idle' | 'pick' | 'place' | 'review'
  const [phase, setPhase] = _adus('idle');
  const [typeId, setTypeId] = _adus('planet-imperium');
  const [form, setForm] = _adus({ name: '', kind: 'hive', size: 2.0 });
  const [pts, setPts] = _adus([]);   // captured polar coords [[r,a], ...]
  const [, _force] = _adus(0);
  const bump = () => _force((v) => v + 1);

  const type = ELEMENT_TYPES[typeId];

  // Wire the AddMode bridge while in placement phase
  _adue(() => {
    // Always mirror current pts into the bridge so PlacementCursor can read them.
    window.AddMode._previewPts = phase === 'place' ? pts : [];
  }, [pts, phase]);

  _adue(() => {
    if (!enabled) {
      window.AddMode.active = false;
      window.AddMode.onMapClick = null;
      window.AddMode._previewPts = [];
      return;
    }
    if (phase !== 'place') {
      window.AddMode.active = false;
      window.AddMode.onMapClick = null;
      return;
    }
    window.AddMode.active = true;
    window.AddMode.wantsMore = type.points === -1;
    window.AddMode.onMapClick = (r, a) => {
      setPts((cur) => {
        const next = type.points === 1 ? [[r, a]] : [...cur, [r, a]];
        // single-point types auto-advance to review
        if (type.points === 1) {
          setTimeout(() => setPhase('review'), 50);
        }
        return next;
      });
    };
    return () => {
      window.AddMode.active = false;
      window.AddMode.onMapClick = null;
    };
  }, [enabled, phase, typeId]);

  // Reset when type changes
  _adue(() => {
    setPts([]);
    setForm((f) => ({
      name: f.name,
      kind: type.kinds ? type.defaultKind : 'hive',
      size: 2.0,
    }));
  }, [typeId]);

  if (!enabled) return null;

  const startPlacing = () => {
    if (!form.name || form.name.trim().length === 0) {
      alert('Please enter a name first.');
      return;
    }
    setPts([]);
    setPhase('place');
  };

  const cancelPlacing = () => {
    setPts([]);
    setPhase('pick');
  };

  const finishZonePlacement = () => {
    if (pts.length < 2) {
      alert('A zone needs at least 2 control points. Click the map again.');
      return;
    }
    setPhase('review');
  };

  const save = () => {
    if (!pts.length) return;
    const arr = window[type.target];
    if (!Array.isArray(arr)) {
      alert(`Cannot find window.${type.target}`);
      return;
    }
    let entry;
    if (type.target === 'GALAXY_LANDMARKS') {
      entry = type.build(form, pts, _segmentOf(pts[0][0], pts[0][1]));
    } else {
      entry = type.build(form, pts);
    }
    arr.push(entry);
    onPersist && onPersist();
    onTick && onTick();
    // Reset form for next add
    setPhase('idle');
    setPts([]);
    setForm({ name: '', kind: type.kinds ? type.defaultKind : 'hive', size: 2.0 });
  };

  const cancelAll = () => {
    setPhase('idle');
    setPts([]);
    setForm({ name: '', kind: 'hive', size: 2.0 });
  };

  // ─── Visual ─────────────────────────────────────────────────────
  const swatch = type.swatch;
  const isZone = type.points === -1;

  return (
    <div data-no-drag style={{
      position: 'absolute',
      top: 140, right: 100,
      width: 340,
      background: `linear-gradient(180deg, ${t.bg1}f0, ${t.bg0}f5)`,
      border: `1px solid ${t.stroke}`,
      boxShadow: `0 0 30px ${t.primarySoft}, inset 0 1px 0 ${t.strokeFaint}`,
      padding: 16,
      fontFamily: t.fontMono,
      fontSize: 10,
      color: t.primary,
      zIndex: 6,
      pointerEvents: 'auto',
    }}>
      <div style={{
        fontFamily: t.fontDisplay, fontSize: 13, letterSpacing: '0.32em',
        color: t.accent, textTransform: 'uppercase',
        textShadow: `0 0 8px ${t.primary}`,
        marginBottom: 10,
      }}>
        ✚ Add Element
      </div>

      {/* Phase: idle — show "+ Add new element" CTA */}
      {phase === 'idle' && (
        <>
          <div style={{ opacity: 0.7, fontSize: 10, lineHeight: 1.55, marginBottom: 10 }}>
            Add a planet or a zone. You'll click a point on the map, then Save.
          </div>
          <AddBtn t={t} primary onClick={() => setPhase('pick')}>
            ✚ New element
          </AddBtn>
        </>
      )}

      {/* Phase: pick — choose type, name, kind */}
      {phase === 'pick' && (
        <>
          <AddRowSelect t={t} label="Type" value={typeId}
            onChange={(v) => setTypeId(v)}
            options={Object.entries(ELEMENT_TYPES).map(([id, def]) => ({
              value: id, label: def.label,
            }))} />
          <AddRowText t={t} label="Name" value={form.name}
            placeholder={isZone ? 'Hive Fleet Hydra' : 'New World'}
            onChange={(v) => setForm({ ...form, name: v })} />
          {type.kinds && (
            <AddRowSelect t={t} label="Kind" value={form.kind}
              onChange={(v) => setForm({ ...form, kind: v })}
              options={type.kinds} />
          )}
          {typeId === 'zone-warp' && (
            <AddRowSelect t={t} label="Size" value={String(form.size)}
              onChange={(v) => setForm({ ...form, size: parseFloat(v) })}
              options={[
                { value: '1.4', label: 'SMALL' },
                { value: '2.0', label: 'MEDIUM' },
                { value: '2.8', label: 'LARGE' },
                { value: '3.6', label: 'HUGE' },
              ]} />
          )}

          <div style={{
            marginTop: 10, padding: 8,
            background: '#0006',
            border: `1px solid ${swatch}66`,
            fontSize: 9.5, color: swatch,
            letterSpacing: '0.18em', textTransform: 'uppercase',
          }}>
            <span style={{
              display: 'inline-block', width: 8, height: 8, borderRadius: 8,
              background: swatch, boxShadow: `0 0 6px ${swatch}`, marginRight: 6,
              verticalAlign: 'middle',
            }} />
            {isZone ? '◬ ZONE · multi-point' : '◉ POINT · single click'}
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            <AddBtn t={t} onClick={cancelAll}>← Back</AddBtn>
            <AddBtn t={t} primary onClick={startPlacing}>
              ◎ Place on map →
            </AddBtn>
          </div>
        </>
      )}

      {/* Phase: place — capture map clicks */}
      {phase === 'place' && (
        <>
          <div style={{
            padding: 10, background: `${swatch}22`,
            border: `1px solid ${swatch}`,
            color: swatch, marginBottom: 10,
            fontSize: 10, lineHeight: 1.55,
          }}>
            <strong style={{ letterSpacing: '0.2em' }}>{form.name || '(unnamed)'}</strong>
            <br />
            {isZone
              ? `Click the map ${Math.max(0, 2 - pts.length)} more time(s) or more, then "Done placing".`
              : 'Click the map once to drop the marker.'}
          </div>
          <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 8 }}>
            Captured points: <strong style={{ color: t.accent }}>{pts.length}</strong>
            {pts.length > 0 && (
              <div style={{ marginTop: 4, fontFamily: t.fontMono, fontSize: 9, opacity: 0.6 }}>
                {pts.map(([r, a], i) => (
                  <div key={i}>· PT{i + 1}: r {r.toFixed(3)} · a {a.toFixed(1)}°</div>
                ))}
              </div>
            )}
          </div>
          {isZone && pts.length > 0 && (
            <AddBtn t={t} onClick={() => setPts(pts.slice(0, -1))}>
              ⌫ Remove last
            </AddBtn>
          )}
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            <AddBtn t={t} onClick={cancelPlacing}>← Cancel</AddBtn>
            {isZone && (
              <AddBtn t={t} primary disabled={pts.length < 2}
                onClick={finishZonePlacement}>
                ◉ Done placing
              </AddBtn>
            )}
          </div>
        </>
      )}

      {/* Phase: review — show captured coords + save/cancel */}
      {phase === 'review' && (
        <>
          <div style={{
            padding: 10, background: `${swatch}22`,
            border: `1px solid ${swatch}`,
            marginBottom: 10,
          }}>
            <div style={{
              fontFamily: t.fontDisplay, fontSize: 12, color: swatch,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              textShadow: `0 0 6px ${swatch}`,
              marginBottom: 4,
            }}>
              ◬ {form.name}
            </div>
            <div style={{ fontSize: 9, opacity: 0.8, color: swatch }}>
              {type.label.toUpperCase()}
              {type.kinds && ` · ${form.kind.toUpperCase()}`}
            </div>
          </div>
          <div style={{ fontSize: 10, opacity: 0.75, marginBottom: 6 }}>
            Position{pts.length > 1 ? ' (control points)' : ''}:
          </div>
          <div style={{
            fontFamily: t.fontMono, fontSize: 9.5,
            background: '#0008', border: `1px solid ${t.strokeFaint}`,
            padding: 8, marginBottom: 12, color: t.accent,
            maxHeight: 120, overflow: 'auto',
          }}>
            {pts.map(([r, a], i) => (
              <div key={i}>· PT{i + 1}: r {r.toFixed(3)} · a {a.toFixed(1)}°</div>
            ))}
          </div>
          <div style={{ fontSize: 9.5, opacity: 0.6, marginBottom: 10, lineHeight: 1.5 }}>
            After saving, you can drag the handles to fine-tune in the Warp Editor.
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <AddBtn t={t} onClick={cancelAll}>✕ Cancel</AddBtn>
            <AddBtn t={t} onClick={() => setPhase('place')}>↺ Re-place</AddBtn>
            <AddBtn t={t} primary onClick={save}>
              ✓ Save
            </AddBtn>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PlacementCursor — small overlay shown during 'place' phase.
// A crosshair that follows the cursor + the already-captured points.
// ─────────────────────────────────────────────────────────────
function PlacementCursor({ enabled, cursorPolar, pts, color }) {
  if (!enabled) return null;
  return (
    <svg viewBox="0 0 100 100" style={{
      position: 'absolute', inset: 0,
      width: '100%', height: '100%',
      pointerEvents: 'none',
      zIndex: 4,
    }}>
      {/* drawn captured points as a polyline */}
      {pts.length >= 2 && (
        <polyline
          points={pts.map(([r, a]) => window.polar(r, a).join(',')).join(' ')}
          fill="none" stroke={color}
          strokeWidth="0.3" strokeDasharray="1 0.5"
          vectorEffect="non-scaling-stroke" opacity="0.7" />
      )}
      {pts.map(([r, a], i) => {
        const [x, y] = window.polar(r, a);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="1.0" fill="none" stroke={color}
              strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
            <circle cx={x} cy={y} r="0.3" fill={color} />
            <text x={x + 1.4} y={y + 0.3} fill={color} opacity="0.85"
              fontFamily="JetBrains Mono, monospace" fontSize="1.2"
              style={{ textShadow: '0 0 4px black' }}>
              PT{i + 1}
            </text>
          </g>
        );
      })}
      {/* live crosshair at cursor */}
      {cursorPolar && (() => {
        const [cx, cy] = window.polar(cursorPolar.r, cursorPolar.a);
        return (
          <g pointerEvents="none">
            <circle cx={cx} cy={cy} r="1.6" fill="none" stroke={color}
              strokeWidth="0.25" vectorEffect="non-scaling-stroke"
              strokeDasharray="0.5 0.4" opacity="0.85">
              <animate attributeName="r" values="1.6;2.2;1.6" dur="1.4s"
                repeatCount="indefinite" />
            </circle>
            <line x1={cx - 2.4} y1={cy} x2={cx + 2.4} y2={cy}
              stroke={color} strokeWidth="0.18"
              vectorEffect="non-scaling-stroke" opacity="0.7" />
            <line x1={cx} y1={cy - 2.4} x2={cx} y2={cy + 2.4}
              stroke={color} strokeWidth="0.18"
              vectorEffect="non-scaling-stroke" opacity="0.7" />
            <circle cx={cx} cy={cy} r="0.18" fill={color} />
          </g>
        );
      })()}
    </svg>
  );
}

window.AddElementPanel = AddElementPanel;
window.PlacementCursor = PlacementCursor;
window.ELEMENT_TYPES = ELEMENT_TYPES;
