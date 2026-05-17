// Galaxy editor overlay — drag warp anomalies + Cicatrix spine control points
// directly on the map. Also exposes a live polar coord readout so the user can
// tell us "put X at r=0.42, a=-25" without guessing.
//
// Coordinate system (matches window.polar):
//   r ∈ [0, 1]  — fraction of disc radius from galactic center (Terra at r≈0).
//   a ∈ degrees — 0° points UP (galactic north). Clockwise positive:
//                 0° N · 90° E · ±180° S · -90° W.

const { useState: _eus, useEffect: _eue, useRef: _eur } = React;

// Convert SVG viewBox coords (0..100) back to polar (r, aDeg).
function svgToPolar(x, y) {
  const dx = x - 50;
  const dy = y - 50;
  const r = Math.min(1.6, Math.sqrt(dx * dx + dy * dy) / 50);
  // window.polar: (x, y) = 50 + r*50*cos(aDeg-90), 50 + r*50*sin(aDeg-90)
  // → aDeg = atan2(dx, -dy)
  let a = Math.atan2(dx, -dy) * 180 / Math.PI;
  // keep angle in (-180, 180]
  if (a > 180) a -= 360;
  if (a <= -180) a += 360;
  return [r, a];
}

// Map screen client position to SVG viewBox coords given the SVG element.
function screenToSvg(svg, clientX, clientY) {
  const rect = svg.getBoundingClientRect();
  const x = (clientX - rect.left) / rect.width * 100;
  const y = (clientY - rect.top) / rect.height * 100;
  return [x, y];
}

// Compass label for an angle in our convention (0=N, 90=E, 180=S, -90=W)
function compass(aDeg) {
  let a = ((aDeg % 360) + 360) % 360;  // 0..360
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(a / 45) % 8];
}

// ─────────────────────────────────────────────────────────────
// Bottom-right HUD: live polar coords of the cursor.
// ─────────────────────────────────────────────────────────────
function CoordReadout({ theme, coords, visible = true, offset = 100 }) {
  const t = theme;
  const has = coords && Number.isFinite(coords.r);
  return (
    <div style={{
      position: 'absolute',
      right: offset, bottom: 86,
      pointerEvents: 'none',
      fontFamily: t.fontMono,
      fontSize: 11,
      letterSpacing: '0.22em',
      color: t.primary,
      textTransform: 'uppercase',
      textAlign: 'right',
      opacity: visible ? 0.95 : 0,
      transition: 'opacity 0.3s',
      lineHeight: 1.6,
      textShadow: `0 0 8px ${t.primary}`,
      zIndex: 5,
    }}>
      <div style={{ fontSize: 9, opacity: 0.55 }}>· CURSOR · POLAR ·</div>
      <div style={{ color: t.accent, fontSize: 14, letterSpacing: '0.18em' }}>
        r {has ? coords.r.toFixed(3) : '—.———'}
        <span style={{ opacity: 0.4, margin: '0 6px' }}>·</span>
        a {has ? (coords.a >= 0 ? '+' : '') + coords.a.toFixed(1) + '°' : '——.—°'}
      </div>
      <div style={{ fontSize: 9, opacity: 0.6 }}>
        {has ? compass(coords.a) : '—'}  ·  TERRA = ORIGIN  ·  0°↑  90°→
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Draggable handle inside an SVG. Receives current (r, a) and an
// onChange callback that gets new (r, a).
// ─────────────────────────────────────────────────────────────
function Handle({ r, a, color, ring, label, onChange, svgRef, locked, highlighted, onSelect }) {
  const [x, y] = window.polar(r, a);
  const [hover, setHover] = _eus(false);
  const [dragging, setDragging] = _eus(false);

  const onDown = (e) => {
    if (locked) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect && onSelect();
    setDragging(true);
    const svg = svgRef.current;
    if (!svg) return;
    const move = (ev) => {
      const [sx, sy] = screenToSvg(svg, ev.clientX, ev.clientY);
      const [nr, na] = svgToPolar(sx, sy);
      onChange(nr, na);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  const active = hover || dragging || highlighted;
  return (
    <g transform={`translate(${x} ${y})`}
       onPointerDown={onDown}
       onPointerEnter={() => setHover(true)}
       onPointerLeave={() => setHover(false)}
       style={{ cursor: locked ? 'not-allowed' : 'grab' }}>
      {/* Selection halo */}
      {highlighted && (
        <circle r={ring + 1.2} fill="none" stroke={color}
          strokeWidth="0.3" strokeOpacity="0.85"
          vectorEffect="non-scaling-stroke"
          strokeDasharray="0.6 0.4" />
      )}
      {/* Crosshair */}
      <circle r={ring} fill="none" stroke={color} strokeWidth="0.2"
        vectorEffect="non-scaling-stroke"
        opacity={active ? 1 : 0.7} />
      <line x1={-ring - 1} y1="0" x2={-ring + 0.5} y2="0" stroke={color}
        strokeWidth="0.15" vectorEffect="non-scaling-stroke" />
      <line x1={ring - 0.5} y1="0" x2={ring + 1} y2="0" stroke={color}
        strokeWidth="0.15" vectorEffect="non-scaling-stroke" />
      <line x1="0" y1={-ring - 1} x2="0" y2={-ring + 0.5} stroke={color}
        strokeWidth="0.15" vectorEffect="non-scaling-stroke" />
      <line x1="0" y1={ring - 0.5} x2="0" y2={ring + 1} stroke={color}
        strokeWidth="0.15" vectorEffect="non-scaling-stroke" />
      {/* fat invisible hit area */}
      <circle r={ring + 1.5} fill={color} opacity={active ? 0.25 : 0.001} />
      {/* center dot */}
      <circle r="0.5" fill={color} />
      {/* label */}
      {label && (
        <text x="0" y={-ring - 1.4} textAnchor="middle"
          fontFamily="JetBrains Mono, monospace" fontSize="1.6"
          fill={color} letterSpacing="0.06"
          style={{ pointerEvents: 'none', textShadow: '0 0 4px black' }}>
          {label}
        </text>
      )}
      {/* coord pill */}
      {active && (
        <g style={{ pointerEvents: 'none' }}>
          <rect x="2" y="-1.0" width="12" height="2.1" rx="0.3"
            fill="#000" opacity="0.85" stroke={color} strokeWidth="0.1" />
          <text x="2.4" y="0.55" fontFamily="JetBrains Mono, monospace"
            fontSize="1.3" fill={color} letterSpacing="0.04">
            r{r.toFixed(2)} a{a.toFixed(0)}°
          </text>
        </g>
      )}
    </g>
  );
}

// ─────────────────────────────────────────────────────────────
// EditOverlay — drag handles for every nebula, every Cicatrix
// control point, every Necron dynasty control point, AND every
// galaxy landmark. Renders as a SECOND SVG layered exactly over
// the GalacticDisc (same viewBox, same wrapper).
// ─────────────────────────────────────────────────────────────
function EditOverlay({ enabled, onTick, onHover, onSelect, selected, theme }) {
  const t = theme;
  const svgRef = _eur(null);

  if (!enabled) return null;

  const updateNeb = (i, r, a) => {
    window.NEBULAE[i].r = r;
    window.NEBULAE[i].a = a;
    onTick();
  };
  const updatePt = (i, r, a) => {
    window.CICATRIX_PTS[i] = [r, a];
    onTick();
  };
  const updateLandmark = (i, r, a) => {
    window.GALAXY_LANDMARKS[i].r = r;
    window.GALAXY_LANDMARKS[i].a = a;
    onTick();
  };
  const updateNecronPt = (di, pi, r, a) => {
    window.NECRON_DYNASTIES[di].pts[pi] = [r, a];
    onTick();
  };
  const updateTyranidPt = (di, pi, r, a) => {
    window.TYRANID_SWARMS[di].pts[pi] = [r, a];
    onTick();
  };

  const sel = (kind, idx, idx2) => {
    onSelect && onSelect({ kind, idx, idx2 });
  };
  const isSel = (kind, idx, idx2) => selected && selected.kind === kind
    && selected.idx === idx && selected.idx2 === idx2;

  const onPointerMove = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const [sx, sy] = screenToSvg(svg, e.clientX, e.clientY);
    const [r, a] = svgToPolar(sx, sy);
    onHover && onHover({ r, a });
  };
  const onPointerLeave = () => onHover && onHover(null);

  return (
    <svg ref={svgRef}
      viewBox="0 0 100 100"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        overflow: 'visible',
        zIndex: 3,
      }}>
      {/* Cicatrix control points — magenta, numbered */}
      {(window.CICATRIX_PTS || []).map(([r, a], i) => (
        <Handle key={`pt-${i}`}
          r={r} a={a}
          color="#ff3388"
          ring={1.6}
          label={`PT${i + 1}`}
          highlighted={isSel('cicatrix', i)}
          svgRef={svgRef}
          onChange={(nr, na) => updatePt(i, nr, na)}
          onSelect={() => sel('cicatrix', i)} />
      ))}
      {/* Necron dynasty control points — green */}
      {(window.NECRON_DYNASTIES || []).map((dyn, di) => (
        dyn.pts.map(([r, a], pi) => (
          <Handle key={`nec-${di}-${pi}`}
            r={r} a={a}
            color={dyn.color || '#5cd09a'}
            ring={1.4}
            label={`${dyn.id.slice(0, 4).toUpperCase()}·${pi + 1}`}
            highlighted={isSel('necron', di, pi)}
            svgRef={svgRef}
            onChange={(nr, na) => updateNecronPt(di, pi, nr, na)}
            onSelect={() => sel('necron', di, pi)} />
        ))
      ))}
      {/* Tyranid swarm control points — purple */}
      {(window.TYRANID_SWARMS || []).map((sw, di) => (
        sw.pts.map(([r, a], pi) => (
          <Handle key={`tyr-${di}-${pi}`}
            r={r} a={a}
            color={sw.color || '#c97ad8'}
            ring={1.4}
            label={`${(sw.id || 'TYR').slice(0, 4).toUpperCase()}·${pi + 1}`}
            highlighted={isSel('tyranid', di, pi)}
            svgRef={svgRef}
            onChange={(nr, na) => updateTyranidPt(di, pi, nr, na)}
            onSelect={() => sel('tyranid', di, pi)} />
        ))
      ))}
      {/* Landmark handles — yellow (Terra, Cadia, Macragge, Eye of Terror...) */}
      {(window.GALAXY_LANDMARKS || []).map((l, i) => (
        <Handle key={`lm-${i}`}
          r={l.r} a={l.a}
          color={l.faction === 'chaos' ? '#ff5544' : '#ffdd66'}
          ring={1.2}
          label={l.name}
          highlighted={isSel('landmark', i)}
          svgRef={svgRef}
          onChange={(nr, na) => updateLandmark(i, nr, na)}
          onSelect={() => sel('landmark', i)} />
      ))}
      {/* Nebula handles — orange, named */}
      {(window.NEBULAE || []).map((n, i) => {
        if (n.isRift) return null;
        return (
          <Handle key={`neb-${i}`}
            r={n.r} a={n.a}
            color="#ffaa44"
            ring={1.3}
            label={n.name}
            highlighted={isSel('nebula', i)}
            svgRef={svgRef}
            onChange={(nr, na) => updateNeb(i, nr, na)}
            onSelect={() => sel('nebula', i)} />
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// EditPanel — floating list of all editable coords + copy buttons +
// contextual controls for the currently-selected handle.
// ─────────────────────────────────────────────────────────────
function EditPanel({ enabled, theme, tick, selected, onTick, onClose }) {
  const t = theme;
  if (!enabled) return null;

  const NEB = window.NEBULAE || [];
  const LM = window.GALAXY_LANDMARKS || [];
  const NEC = window.NECRON_DYNASTIES || [];
  const TYR = window.TYRANID_SWARMS || [];
  const PTS = window.CICATRIX_PTS || [];

  const nebFormatted = NEB.map((n) => (
    n.isRift
      ? `  { name: '${n.name}', isRift: true, color: '${n.color}' },`
      : `  { name: ${JSON.stringify(n.name)}, r: ${n.r.toFixed(2)}, a: ${Math.round(n.a)}, size: ${(n.size || 2).toFixed(1)}, type: '${n.type}', color: '${n.color}' },`
  )).join('\n');

  const ptsFormatted = PTS.map(([r, a], i) => (
    `  [${r.toFixed(2)}, ${Math.round(a)}],  // PT${i + 1}`
  )).join('\n');

  const lmFormatted = LM.map((l) => (
    `  { id: '${l.id}', name: '${l.name}', r: ${l.r.toFixed(2)}, a: ${Math.round(l.a)}, kind: '${l.kind}', faction: '${l.faction}', segment: '${l.segment}' },`
  )).join('\n');

  const necFormatted = NEC.map((dyn) => {
    const ptsStr = dyn.pts.map(([r, a]) => `[${r.toFixed(2)}, ${Math.round(a)}]`).join(', ');
    return `  { id: '${dyn.id}', name: ${JSON.stringify(dyn.name)}, color: '${dyn.color}', density: '${dyn.density}', pts: [${ptsStr}] },`;
  }).join('\n');

  const tyrFormatted = TYR.map((sw) => {
    const ptsStr = sw.pts.map(([r, a]) => `[${r.toFixed(2)}, ${Math.round(a)}]`).join(', ');
    return `  { id: '${sw.id}', name: ${JSON.stringify(sw.name)}, color: '${sw.color}', density: '${sw.density}', pts: [${ptsStr}] },`;
  }).join('\n');

  const fullBlob = [
    `window.NEBULAE = [\n${nebFormatted}\n];`,
    `window.GALAXY_LANDMARKS = [\n${lmFormatted}\n];`,
    `window.CICATRIX_PTS = [\n${ptsFormatted}\n];`,
    `window.NECRON_DYNASTIES = [\n${necFormatted}\n];`,
    `window.TYRANID_SWARMS = [\n${tyrFormatted}\n];`,
  ].join('\n\n');

  const copy = (text) => {
    try { navigator.clipboard.writeText(text); }
    catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (_) {}
      document.body.removeChild(ta);
    }
  };

  // ─── Contextual controls for the selected handle ───
  let selBlock = null;
  if (selected) {
    const { kind, idx, idx2 } = selected;
    if (kind === 'nebula' && NEB[idx] && !NEB[idx].isRift) {
      const n = NEB[idx];
      selBlock = (
        <SelectedCard t={t} title={n.name} sub={`Warp anomaly · ${n.type}`} swatch="#ffaa44">
          <RowSlider t={t} label="Size"
            value={n.size || 2} min={0.4} max={6} step={0.1}
            onChange={(v) => { n.size = v; onTick && onTick(); }} />
          <RowSelect t={t} label="Type"
            value={n.type} options={['warp', 'forbidden']}
            onChange={(v) => { n.type = v;
              n.color = v === 'warp' ? '#ff6644' : '#88bbff';
              onTick && onTick(); }} />
          <RowColor t={t} label="Color" value={n.color}
            options={['#ff6644', '#ff8866', '#a8ff66', '#88bbff', '#5cd09a', '#ff3366']}
            onChange={(v) => { n.color = v; onTick && onTick(); }} />
          <Removable t={t} onRemove={() => { NEB.splice(idx, 1); onTick && onTick(); }} />
        </SelectedCard>
      );
    } else if (kind === 'landmark' && LM[idx]) {
      const l = LM[idx];
      selBlock = (
        <SelectedCard t={t} title={l.name} sub={`Landmark · ${l.kind}`}
          swatch={l.faction === 'chaos' ? '#ff5544' : '#ffdd66'}>
          <RowSelect t={t} label="Faction"
            value={l.faction}
            options={['imperium', 'chaos', 'xenos', 'necron', 'tyranid']}
            onChange={(v) => { l.faction = v; onTick && onTick(); }} />
          <RowSelect t={t} label="Kind"
            value={l.kind}
            options={['throne', 'fortress', 'astartes', 'forge', 'hive', 'death', 'war', 'warp', 'shrine', 'civilised', 'xenos', 'chaos', 'necron', 'tyranid', 'dead']}
            onChange={(v) => { l.kind = v; onTick && onTick(); }} />
          <RowText t={t} label="Name" value={l.name}
            onChange={(v) => { l.name = v; onTick && onTick(); }} />
          <Removable t={t} onRemove={() => { LM.splice(idx, 1); onTick && onTick(); }} />
        </SelectedCard>
      );
    } else if (kind === 'necron' && NEC[idx]) {
      const dyn = NEC[idx];
      selBlock = (
        <SelectedCard t={t} title={dyn.name}
          sub={`Necron · ${dyn.pts.length}-pt ${dyn.pts.length === 2 ? 'corridor' : 'polygon'}`}
          swatch={dyn.color}>
          <RowSelect t={t} label="Density"
            value={dyn.density} options={['mid', 'high']}
            onChange={(v) => { dyn.density = v; onTick && onTick(); }} />
          <RowColor t={t} label="Color" value={dyn.color}
            options={['#5cd09a', '#7ad8a4', '#3fb088', '#a8ffcc']}
            onChange={(v) => { dyn.color = v; onTick && onTick(); }} />
          <button onClick={() => {
            // duplicate last point near the selected one
            const last = dyn.pts[dyn.pts.length - 1];
            dyn.pts.push([Math.min(0.95, last[0] + 0.05), last[1] + 5]);
            onTick && onTick();
          }} style={btnStyle(t)}>+ Add control point</button>
          {dyn.pts.length > 2 && (
            <button onClick={() => {
              dyn.pts.pop();
              onTick && onTick();
            }} style={btnStyle(t)}>− Remove last point</button>
          )}
          <Removable t={t} onRemove={() => { NEC.splice(idx, 1); onTick && onTick(); }} />
        </SelectedCard>
      );
    } else if (kind === 'tyranid' && TYR[idx]) {
      const sw = TYR[idx];
      selBlock = (
        <SelectedCard t={t} title={sw.name}
          sub={`Tyranid swarm · ${sw.pts.length}-pt ${sw.pts.length === 2 ? 'corridor' : 'polygon'}`}
          swatch={sw.color}>
          <RowSelect t={t} label="Density"
            value={sw.density} options={['mid', 'high']}
            onChange={(v) => { sw.density = v; onTick && onTick(); }} />
          <RowColor t={t} label="Color" value={sw.color}
            options={['#c97ad8', '#a050c4', '#d895e8', '#8a3aa8']}
            onChange={(v) => { sw.color = v; onTick && onTick(); }} />
          <button onClick={() => {
            const last = sw.pts[sw.pts.length - 1];
            sw.pts.push([Math.min(0.95, last[0] + 0.05), last[1] + 5]);
            onTick && onTick();
          }} style={btnStyle(t)}>+ Add control point</button>
          {sw.pts.length > 2 && (
            <button onClick={() => {
              sw.pts.pop();
              onTick && onTick();
            }} style={btnStyle(t)}>− Remove last point</button>
          )}
          <Removable t={t} onRemove={() => { TYR.splice(idx, 1); onTick && onTick(); }} />
        </SelectedCard>
      );
    } else if (kind === 'cicatrix') {
      selBlock = (
        <SelectedCard t={t} title={`Cicatrix PT${idx + 1}`}
          sub={`Spine control point ${idx + 1} of ${PTS.length}`} swatch="#ff3388">
          <div style={{ fontSize: 10, opacity: 0.65, padding: '4px 0' }}>
            Drag to reshape the rift. Points must stay in order from Eye of Terror → Scourge Stars.
          </div>
        </SelectedCard>
      );
    }
  }

  return (
    <div data-no-drag style={{
      position: 'absolute',
      top: 140, left: 100,
      width: 400, maxHeight: 'calc(100vh - 220px)',
      background: `linear-gradient(180deg, ${t.bg1}f0, ${t.bg0}f5)`,
      border: `1px solid ${t.stroke}`,
      boxShadow: `0 0 30px ${t.primarySoft}, inset 0 1px 0 ${t.strokeFaint}`,
      padding: 16,
      fontFamily: t.fontMono,
      fontSize: 10,
      color: t.primary,
      zIndex: 6,
      overflow: 'auto',
      pointerEvents: 'auto',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <div style={{
          fontFamily: t.fontDisplay, fontSize: 13, letterSpacing: '0.32em',
          color: t.accent, textTransform: 'uppercase',
          textShadow: `0 0 8px ${t.primary}`,
        }}>
          ◈ Warp Editor
        </div>
      </div>
      <div style={{ opacity: 0.7, lineHeight: 1.55, marginBottom: 12, fontSize: 9.5 }}>
        <span style={{ color: '#ff3388' }}>●</span> Cicatrix
        <span style={{ marginLeft: 10, color: '#5cd09a' }}>●</span> Necron
        <span style={{ marginLeft: 10, color: '#ffdd66' }}>●</span> Landmarks
        <span style={{ marginLeft: 10, color: '#c97ad8' }}>●</span> Tyranid
        <span style={{ marginLeft: 10, color: '#ffaa44' }}>●</span> Warp anomalies
        <br />
        Click a handle to select; drag to move; adjust below.
      </div>

      {selBlock}

      <Section t={t} label={`Nebulae (${NEB.length})`} body={nebFormatted}
        onCopy={() => copy('window.NEBULAE = [\n' + nebFormatted + '\n];')} />
      <Section t={t} label={`Landmarks (${LM.length})`} body={lmFormatted}
        onCopy={() => copy('window.GALAXY_LANDMARKS = [\n' + lmFormatted + '\n];')} />
      <Section t={t} label={`Cicatrix Points (${PTS.length})`} body={ptsFormatted}
        onCopy={() => copy('window.CICATRIX_PTS = [\n' + ptsFormatted + '\n];')} />
      <Section t={t} label={`Necron Dynasties (${NEC.length})`} body={necFormatted}
        onCopy={() => copy('window.NECRON_DYNASTIES = [\n' + necFormatted + '\n];')} />
      <Section t={t} label={`Tyranid Swarms (${TYR.length})`} body={tyrFormatted}
        onCopy={() => copy('window.TYRANID_SWARMS = [\n' + tyrFormatted + '\n];')} />

      <button onClick={() => copy(fullBlob)} style={{
        ...btnStyle(t),
        width: '100%', marginTop: 8,
        background: t.accent, color: t.bg0,
        fontWeight: 700, padding: '10px',
      }}>⧉ Copy ALL (paste back to Claude)</button>
    </div>
  );
}

// helper card for the selected-item controls
function SelectedCard({ t, title, sub, swatch, children }) {
  return (
    <div style={{
      border: `1px solid ${swatch}`,
      boxShadow: `0 0 16px ${swatch}44`,
      padding: 10,
      marginBottom: 12,
      background: '#0006',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 8, background: swatch, boxShadow: `0 0 8px ${swatch}` }} />
        <div style={{ fontFamily: t.fontDisplay, fontSize: 12, letterSpacing: '0.2em', color: swatch, textTransform: 'uppercase' }}>
          {title}
        </div>
      </div>
      <div style={{ fontSize: 9, opacity: 0.6, marginBottom: 8, letterSpacing: '0.12em' }}>{sub}</div>
      {children}
    </div>
  );
}

function RowSlider({ t, label, value, min, max, step, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
      <div style={{ width: 60, fontSize: 10, color: t.primary, opacity: 0.7 }}>{label}</div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: t.accent }} />
      <div style={{ width: 40, fontFamily: t.fontMono, fontSize: 10, color: t.accent, textAlign: 'right' }}>
        {Number(value).toFixed(2)}
      </div>
    </div>
  );
}
function RowSelect({ t, label, value, options, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
      <div style={{ width: 60, fontSize: 10, color: t.primary, opacity: 0.7 }}>{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{
        flex: 1, padding: '4px 6px',
        background: t.bg0, color: t.accent,
        border: `1px solid ${t.stroke}`,
        fontFamily: t.fontMono, fontSize: 10,
        letterSpacing: '0.1em',
      }}>
        {options.map((o) => <option key={o} value={o}>{o.toUpperCase()}</option>)}
      </select>
    </div>
  );
}
function RowText({ t, label, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
      <div style={{ width: 60, fontSize: 10, color: t.primary, opacity: 0.7 }}>{label}</div>
      <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} style={{
        flex: 1, padding: '4px 6px',
        background: t.bg0, color: t.accent,
        border: `1px solid ${t.stroke}`,
        fontFamily: t.fontMono, fontSize: 10,
        letterSpacing: '0.08em',
        outline: 'none',
      }} />
    </div>
  );
}
function RowColor({ t, label, value, options, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
      <div style={{ width: 60, fontSize: 10, color: t.primary, opacity: 0.7 }}>{label}</div>
      <div style={{ display: 'flex', gap: 4 }}>
        {options.map((c) => (
          <button key={c} onClick={() => onChange(c)} style={{
            width: 22, height: 22, border: value === c ? `2px solid white` : `1px solid ${t.stroke}`,
            background: c, cursor: 'pointer', padding: 0,
            boxShadow: value === c ? `0 0 8px ${c}` : 'none',
          }} />
        ))}
      </div>
    </div>
  );
}
function Removable({ t, onRemove }) {
  return (
    <button onClick={onRemove} style={{
      ...btnStyle(t),
      marginTop: 4,
      borderColor: '#ff5544', color: '#ff7766',
    }}>✕ Remove</button>
  );
}
function Section({ t, label, body, onCopy }) {
  return (
    <details style={{ marginBottom: 8 }}>
      <summary style={{ cursor: 'pointer', color: t.accent, fontSize: 10, letterSpacing: '0.18em', padding: '4px 0' }}>
        {label}
      </summary>
      <pre style={{
        margin: '6px 0 0 0', padding: 8,
        background: '#0008', border: `1px solid ${t.strokeFaint}`,
        fontSize: 9.5, lineHeight: 1.45,
        maxHeight: 180, overflow: 'auto', whiteSpace: 'pre',
      }}>{body}</pre>
      <button onClick={onCopy} style={btnStyle(t)}>⧉ Copy</button>
    </details>
  );
}

function btnStyle(t) {
  return {
    marginTop: 6, padding: '5px 10px',
    background: t.bg0, border: `1px solid ${t.stroke}`,
    color: t.accent, fontFamily: t.fontMono, fontSize: 10,
    letterSpacing: '0.18em', textTransform: 'uppercase',
    cursor: 'pointer',
  };
}

window.EditOverlay = EditOverlay;
window.CoordReadout = CoordReadout;
window.EditPanel = EditPanel;
window.svgToPolar = svgToPolar;
window.screenToSvg = screenToSvg;
