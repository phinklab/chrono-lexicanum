// Top-level Galaxy Hologram — full-bleed prototype
// Props: { theme, factionFilter, width, height }

const { useState: _us, useEffect: _ue, useRef: _ur, useMemo: _um } = React;

function GalaxyHologram({ theme, factionFilter = 'all', riftPattern = 'strict-square', astronomican = false, editWarps = false, addMode = false, onPersist, initialView = 'galaxy', initialWorldId = null, width = 1600, height = 1000 }) {
  const t = theme;
  // view = 'galaxy' OR a segmentum id ('solar' | 'obscurus' | 'ultima' | 'tempestus' | 'pacificus')
  // Seed from URL-derived initialView / initialWorldId so a deep link drops
  // the visitor directly at the right segmentum + codex entry.
  const [view, setView] = _us(initialView || 'galaxy');
  const [transitioning, setTransitioning] = _us(false);
  const [selectedWorld, setSelectedWorld] = _us(() => {
    if (!initialWorldId) return null;
    const all = [].concat(...Object.values(window.SEGMENTUM_WORLDS || {}));
    return all.find((w) => w.id === initialWorldId) || null;
  });
  const [hoveredSeg, setHoveredSeg] = _us(null);
  const [hoveredLandmark, setHoveredLandmark] = _us(null);
  const [hoveredWorld, setHoveredWorld] = _us(null);
  const [userZoom, setUserZoom] = _us(1);       // scroll-wheel zoom multiplier

  // Edit-mode bookkeeping
  const [editTick, setEditTick] = _us(0);       // bumps when handles drag → re-render
  const [cursorPolar, setCursorPolar] = _us(null); // {r, a} of the cursor
  const [editSelected, setEditSelected] = _us(null); // selected handle
  const [addPlacedPts, setAddPlacedPts] = _us([]); // local mirror of placement pts for preview
  const discWrapRef = _ur(null);                // ref to the scaled disc wrapper

  // Mirror AddMode placement points so PlacementCursor can render them.
  // We poll on every editTick / re-render — cheap, and the panel triggers
  // ticks each time it captures a click via onPersist/onTick callbacks.
  _ue(() => {
    if (!addMode) { setAddPlacedPts([]); return; }
    const id = setInterval(() => {
      const pts = (window.AddMode && window.AddMode._previewPts) || [];
      setAddPlacedPts((cur) => {
        if (cur.length !== pts.length) return pts.slice();
        for (let i = 0; i < pts.length; i++) {
          if (cur[i][0] !== pts[i][0] || cur[i][1] !== pts[i][1]) return pts.slice();
        }
        return cur;
      });
    }, 120);
    return () => clearInterval(id);
  }, [addMode]);

  // pan offsets (in px) — hold-and-drag the map. Works on mouse + touch via pointer events.
  const [pan, setPan] = _us({ x: 0, y: 0 });
  const dragRef = _ur({ active: false, sx: 0, sy: 0, ox: 0, oy: 0, moved: 0 });

  const dive = (segId) => {
    if (!segId || segId === 'galaxy' || view !== 'galaxy') return;
    if (!window.SEGMENTUM_WORLDS || !window.SEGMENTUM_WORLDS[segId]) return;
    setTransitioning(true);
    setView(segId);
    setUserZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedWorld(null);
    setTimeout(() => setTransitioning(false), 1100);
    window.dispatchEvent(new CustomEvent('40k:dive', { detail: { segId } }));
  };
  const reset = () => {
    setSelectedWorld(null);
    setTransitioning(true);
    setView('galaxy');
    setUserZoom(1);
    setPan({ x: 0, y: 0 });
    setTimeout(() => setTransitioning(false), 1100);
    window.dispatchEvent(new CustomEvent('40k:back'));
  };

  // Wrap setSelectedWorld so audio + URL stay in sync when a world's chosen
  // via click OR via search palette OR via deep-link.
  const chooseWorld = (w) => {
    setSelectedWorld(w);
    if (w) window.dispatchEvent(new CustomEvent('40k:select', { detail: { worldId: w.id } }));
  };

  // Mirror view + selected world into the URL hash. App owns the era slice.
  _ue(() => {
    if (!window.__share) return;
    window.__share.write({
      view: view === 'galaxy' ? null : view,
      world: selectedWorld ? selectedWorld.id : null,
    });
  }, [view, selectedWorld]);

  // Expose an imperative goto so the search palette (or any other host UI)
  // can jump to a specific world without knowing about React state.
  // We re-bind on every render so the closure always sees current `view`.
  _ue(() => {
    window.__galaxyGoto = ({ segment, worldId, polar, kind }) => {
      const goSeg = (sid) => {
        if (!sid || sid === view) return;
        if (sid === 'galaxy') { reset(); return; }
        // From galaxy view → dive. From a different segmentum → reset then dive.
        if (view !== 'galaxy') {
          setSelectedWorld(null);
          setTransitioning(true);
          setView('galaxy');
          setUserZoom(1);
          setPan({ x: 0, y: 0 });
          setTimeout(() => {
            setView(sid);
            setUserZoom(1);
            setPan({ x: 0, y: 0 });
            setTimeout(() => setTransitioning(false), 1100);
          }, 1100);
        } else {
          dive(sid);
        }
      };
      if (kind === 'segmentum' || (segment && !worldId)) {
        goSeg(segment);
        return;
      }
      if (worldId) {
        const all = [].concat(...Object.values(window.SEGMENTUM_WORLDS || {}));
        const w = all.find((x) => x.id === worldId);
        if (!w) return;
        const sid = w.segment || segment;
        if (sid === view) {
          chooseWorld(w);
        } else {
          goSeg(sid);
          // Open the codex after the dive animation settles.
          setTimeout(() => chooseWorld(w), sid && view === 'galaxy' ? 1200 : 2300);
        }
      }
    };
    return () => { if (window.__galaxyGoto) window.__galaxyGoto = null; };
  }, [view]);

  // Live cursor → polar coord readout. We hit-test against the scaled disc
  // wrapper (its rect maps to the SVG viewBox 0..100). Works under any pan
  // or zoom because we use getBoundingClientRect after transforms.
  const updateCursorPolar = (clientX, clientY) => {
    const el = discWrapRef.current;
    if (!el || !window.svgToPolar) return;
    const rect = el.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width * 100;
    const y = (clientY - rect.top) / rect.height * 100;
    // Only display when the cursor is over the disc viewBox bounds
    if (x < -2 || x > 102 || y < -2 || y > 102) { setCursorPolar(null); return; }
    const [r, a] = window.svgToPolar(x, y);
    setCursorPolar({ r, a });
  };

  // Pointer-based hold-and-drag pan — works on desktop AND mobile.
  // NOTE: no setPointerCapture — capture would steal click events from clickable children (the ULTIMA wedge).
  const onPointerDown = (e) => {
    // Don't start a drag from interactive children (buttons, panel).
    if (e.target.closest('button, a, [data-no-drag]')) return;
    dragRef.current = {
      active: true,
      sx: e.clientX, sy: e.clientY,
      ox: pan.x, oy: pan.y,
      moved: 0,
    };
  };
  const onPointerMove = (e) => {
    updateCursorPolar(e.clientX, e.clientY);
    const d = dragRef.current;
    if (!d.active) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    d.moved = Math.max(d.moved, Math.abs(dx) + Math.abs(dy));
    // Only commit pan once finger/mouse has moved past 4px — below that, treat as a tap (click passes through).
    if (d.moved > 4) setPan({ x: d.ox + dx, y: d.oy + dy });
  };
  const onPointerUp = (e) => {
    const wasDrag = dragRef.current.moved > 6;
    dragRef.current.active = false;
    // If in Add-mode placement, capture this click as a placement point.
    if (!wasDrag && window.AddMode && window.AddMode.active && window.AddMode.onMapClick) {
      // Don't capture clicks on the panel itself / draggable handles
      const tgt = e && e.target;
      if (tgt && tgt.closest && tgt.closest('[data-no-drag], button, a')) return;
      // Use the most recent cursor polar (already set by onPointerMove)
      if (cursorPolar && Number.isFinite(cursorPolar.r)) {
        window.AddMode.onMapClick(cursorPolar.r, cursorPolar.a);
      }
    }
  };
  // Suppress click-through to wedge/world if user actually dragged.
  const onClickCapture = (e) => {
    if (dragRef.current.moved > 6) {
      e.stopPropagation();
      e.preventDefault();
      dragRef.current.moved = 0;
    }
  };

  // Scroll-wheel zoom — pinch in/out the disc
  const onWheel = (e) => {
    e.preventDefault();
    const dir = e.deltaY < 0 ? 1 : -1;
    setUserZoom((z) => {
      const next = z * (1 + dir * 0.10);
      return Math.max(0.5, Math.min(4, next));
    });
  };
  // Button zoom (mobile-friendly)
  const zoomBy = (factor) => {
    setUserZoom((z) => Math.max(0.5, Math.min(4, z * factor)));
  };
  const recenter = () => { setPan({ x: 0, y: 0 }); setUserZoom(1); };

  // Center the dived segmentum on the screen and scale it up. Each
  // segmentum has its own visual center on the disc (where its worlds are
  // densest) — we translate that point to (50,50) when dived. Solar zooms
  // in tighter because its worlds all live inside the tiny central disc.
  const SEG_DIVE = {
    solar:     { r: 0,    a: 0,     scale: 5.0 },
    obscurus:  { r: 0.55, a: -22.5, scale: 3.0 },
    ultima:    { r: 0.55, a: 90,    scale: 3.0 },
    tempestus: { r: 0.55, a: 185,   scale: 3.0 },
    pacificus: { r: 0.55, a: 252.5, scale: 3.0 },
  };
  const isDived = view !== 'galaxy';
  const divedSeg = isDived ? view : null;
  const segDive = isDived ? (SEG_DIVE[view] || SEG_DIVE.ultima) : null;
  const segCenter = isDived ? window.polar(segDive.r, segDive.a) : [50, 50];
  const dx = 50 - segCenter[0];
  const dy = 50 - segCenter[1];
  const dive_scale = isDived ? segDive.scale : 1.0;
  const baseScale = dive_scale * userZoom;
  const tx = isDived ? dx : 0;
  const ty = isDived ? dy : 0;

  // Disc render box — fills the available area.
  // Flat top-down (no 3D tilt) — click targets stay true to the visible geometry and
  // SVG strokes stay perfectly crisp. We resize the wrapper rather than CSS-scaling.
  const baseDiscSize = Math.min(width, height) * 1.15;
  const discSize = baseDiscSize * baseScale;

  return (
    <div
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={onClickCapture}
      style={{
        position: 'relative', width, height,
        background: t.bg0,
        overflow: 'hidden',
        fontFamily: t.fontBody,
        color: t.primary,
        userSelect: 'none',
        touchAction: 'none',
        cursor: dragRef.current.active ? 'grabbing' : 'grab',
      }}>
      {/* deep starfields — 3 layers, each with progressively heavier parallax for a real 3D depth feel. */}
      <StarField theme={t} count={320} layer={0} parallax={{ x: pan.x * 0.04, y: pan.y * 0.04 }} />
      {/* 3 background gas-giant silhouettes drifting between the starfields */}
      <ParallaxBackgroundPlanets pan={pan} theme={t} />
      <StarField theme={t} count={220} layer={1} parallax={{ x: pan.x * 0.14, y: pan.y * 0.14 }} />
      <StarField theme={t} count={120} layer={2} parallax={{ x: pan.x * 0.40, y: pan.y * 0.40 }} />

      {/* vignette */}
      <div style={{ position: 'absolute', inset: 0, background: t.vignette, pointerEvents: 'none' }} />

      {/* Pan wrapper — translate here so we don't disturb the perspective on the 3D stage */}
      <div style={{
        position: 'absolute', inset: 0,
        transform: `translate(${pan.x}px, ${pan.y}px)`,
        willChange: 'transform',
      }}>
      {/* Flat top-down stage — no 3D tilt, no perspective. Click geometry matches what you see. */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <div ref={discWrapRef} style={{
          position: 'absolute',
          left: '50%', top: '50%',
          width: discSize, height: discSize,
          marginLeft: -discSize / 2,
          marginTop: -discSize / 2,
          // No `scale()` here — we resize the wrapper instead, so the SVG re-rasterizes crisp.
          transform: `translate(${tx}%, ${ty}%)`,
          transition: transitioning
            ? 'width 1.1s cubic-bezier(.5,.05,.25,1), height 1.1s cubic-bezier(.5,.05,.25,1), margin 1.1s cubic-bezier(.5,.05,.25,1), transform 1.1s cubic-bezier(.5,.05,.25,1)'
            : 'width 0.2s ease-out, height 0.2s ease-out, margin 0.2s ease-out, transform 0.25s ease-out',
          transformOrigin: 'center center',
          willChange: 'width, height, transform',
        }}>
          {/* Flat parallax motes — gentle drift, no Z depth */}
          <FlatMotes theme={t} count={50} />

          <div style={{ position: 'absolute', inset: 0 }}>
            <GalacticDisc
              theme={t}
              factionFilter={factionFilter}
              riftPattern={riftPattern}
              astronomican={astronomican}
              onDive={dive}
              dived={isDived}
              divedSeg={divedSeg}
              hoveredSeg={hoveredSeg}
              setHoveredSeg={setHoveredSeg}
              hoveredLandmark={hoveredLandmark}
              setHoveredLandmark={setHoveredLandmark}
              userZoom={userZoom}
              pan={pan}
              discSize={discSize}
            />

            <SegmentumLabels
              theme={t}
              dived={isDived}
              divedSeg={divedSeg}
              factionFilter={factionFilter}
              hoveredSeg={hoveredSeg}
              setHoveredSeg={setHoveredSeg}
              onDive={dive}
            />
            <LandmarkLabels theme={t} factionFilter={factionFilter} dived={isDived} divedSeg={divedSeg}
              hoveredLandmark={hoveredLandmark} setHoveredLandmark={setHoveredLandmark} />

            {/* Editor overlay — sits ON TOP of the disc inside the same scaled wrapper.
                Hidden unless `editWarps` is true. */}
            {window.EditOverlay && (
              <window.EditOverlay
                enabled={editWarps && !isDived}
                onTick={() => { setEditTick((v) => v + 1); onPersist && onPersist(); }}
                onHover={(p) => setCursorPolar(p)}
                onSelect={(s) => setEditSelected(s)}
                selected={editSelected}
                theme={t} />
            )}

            {/* Placement cursor — shown during 'place' phase of Add Element. */}
            {window.PlacementCursor && (
              <window.PlacementCursor
                enabled={addMode && window.AddMode && window.AddMode.active && !isDived}
                cursorPolar={cursorPolar}
                pts={addPlacedPts}
                color={'#f0b248'} />
            )}

            <SegmentumDetail
              theme={t}
              visible={isDived && !transitioning}
              segId={divedSeg}
              factionFilter={factionFilter}
              onWorldClick={chooseWorld}
              selectedId={selectedWorld && selectedWorld.id}
              hoveredId={hoveredWorld}
              setHoveredId={setHoveredWorld}
            />
            <SegmentumWorldLabels
              theme={t}
              visible={isDived && !transitioning}
              segId={divedSeg}
              factionFilter={factionFilter}
              onWorldClick={chooseWorld}
              selectedId={selectedWorld && selectedWorld.id}
              hoveredId={hoveredWorld}
              setHoveredId={setHoveredWorld}
            />
          </div>
        </div>
      </div>
      </div>{/* /pan wrapper */}

      {/* scanlines (subtle) */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `repeating-linear-gradient(0deg, transparent 0, transparent 2px, ${t.primary}${Math.floor(t.scanlineOpacity * 255).toString(16).padStart(2, '0')} 3px, transparent 3.5px)`,
        mixBlendMode: 'screen',
        opacity: 0.45,
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse at 50% 50%, transparent 55%, ${t.bg0}90 100%)`,
      }} />
      <div className="holo-flicker" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: t.primary, mixBlendMode: 'overlay',
      }} />

      {/* Corner ornaments */}
      <div style={{ position: 'absolute', top: 20, left: 20 }}><CornerOrnament theme={t} pos="tl" /></div>
      <div style={{ position: 'absolute', top: 20, right: 20 }}><CornerOrnament theme={t} pos="tr" /></div>
      <div style={{ position: 'absolute', bottom: 20, left: 20 }}><CornerOrnament theme={t} pos="bl" /></div>
      <div style={{ position: 'absolute', bottom: 20, right: 20 }}><CornerOrnament theme={t} pos="br" /></div>

      {/* Top header */}
      <div style={{
        position: 'absolute', top: 34, left: 100, right: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        pointerEvents: 'none',
      }}>
        <div>
          <div style={{
            fontFamily: t.fontDisplay, fontSize: 20, letterSpacing: t.letterTitle,
            color: t.accent, textTransform: 'uppercase', textShadow: `0 0 12px ${t.primary}`,
            lineHeight: 1, marginBottom: 8,
          }}>
            {t.label}
          </div>
          <div style={{
            fontFamily: t.fontMono, fontSize: 10, letterSpacing: '0.22em',
            color: t.primary, opacity: 0.65, textTransform: 'uppercase',
          }}>{t.sub}</div>
        </div>
        <div style={{
          fontFamily: t.fontDisplay, fontSize: 18, letterSpacing: '0.36em',
          color: t.accent, textShadow: `0 0 14px ${t.primary}`, opacity: 0.92,
          textAlign: 'right',
        }}>
          {isDived ? ((window.SEGMENTUMS.find((s) => s.id === divedSeg) || {}).name || 'SEGMENTUM').toUpperCase() : 'MILKY WAY · M42'}
        </div>
      </div>

      {/* Back button — top-left, BELOW the timeline switcher (which sits
          under the title). Only rendered when dived. */}
      {isDived && (
        <button onClick={reset} data-no-drag style={{
          position: 'absolute', top: 144, left: 100,
          background: `linear-gradient(180deg, ${t.bg1}cc, ${t.bg0}ee)`,
          color: t.accent,
          border: `1px solid ${t.stroke}`,
          fontFamily: t.fontDisplay, fontSize: 11, letterSpacing: '0.32em',
          padding: '12px 22px 12px 18px',
          textTransform: 'uppercase', cursor: 'pointer',
          textShadow: `0 0 8px ${t.primary}`,
          boxShadow: `0 0 24px ${t.primarySoft}, inset 0 1px 0 ${t.strokeFaint}`,
          display: 'flex', alignItems: 'center', gap: 10,
          pointerEvents: 'auto', zIndex: 4,
          animation: 'fadeInUp 0.5s cubic-bezier(.2,.7,.2,1) both',
          animationDelay: '0.5s',
        }}>
          <span style={{ fontSize: 14, lineHeight: 1, marginBottom: 1 }}>◂</span>
          Back to Galactic View
        </button>
      )}

      {/* Zoom controls — share the 280px column with Search (above) and
          Era switcher (below). Anchored to the RIGHT edge of that column
          via justifyContent: flex-end so the buttons line up with the
          right edge of the timeline button below. Same hairline-underline
          aesthetic as Search; no boxes, no borders. */}
      <div data-no-drag style={{
        position: 'fixed',
        left: 100, bottom: 90,
        width: 280,
        display: 'flex', justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 4, zIndex: 4,
        pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', gap: 4, pointerEvents: 'auto' }}>
          {[
            { lbl: '+', fn: () => zoomBy(1.25), title: 'Zoom in' },
            { lbl: '−', fn: () => zoomBy(0.8),  title: 'Zoom out' },
            { lbl: '◉', fn: recenter,           title: 'Recenter' },
          ].map((b, i) => (
            <button key={i}
              onClick={b.fn}
              title={b.title}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.borderBottomColor = t.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.72';
                e.currentTarget.style.borderBottomColor = t.stroke;
              }}
              style={{
                minWidth: 26, height: 26,
                padding: '0 8px 1px 8px',
                background: 'transparent',
                border: 'none',
                borderBottom: `1px solid ${t.stroke}`,
                color: t.primary,
                fontFamily: t.fontMono, fontSize: 14, lineHeight: 1,
                cursor: 'pointer',
                opacity: 0.72,
                transition: 'opacity .25s ease, border-color .25s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{b.lbl}</button>
          ))}
        </div>
      </div>

      {/* Zoom indicator (top-right under header) */}
      <div style={{
        position: 'absolute', top: 96, right: 100,
        fontFamily: t.fontMono, fontSize: 10, letterSpacing: '0.24em',
        color: t.primary, opacity: 0.65, textTransform: 'uppercase',
        textAlign: 'right',
      }}>
        ZOOM · {Math.round(baseScale * 100)}%
        <div style={{
          marginTop: 4, width: 120, height: 2, background: t.strokeFaint, marginLeft: 'auto',
        }}>
          <div style={{
            width: `${Math.min(100, (baseScale - 0.5) / 11.5 * 100)}%`,
            height: '100%', background: t.primary, boxShadow: `0 0 6px ${t.primary}`,
            transition: 'width 0.2s',
          }} />
        </div>
      </div>

      {/* Bottom HUD strip — sits below the corner-stack of Search / Zoom /
          Timeline; left margin keeps it clear of the bottom-left corner
          ornament. */}
      <div style={{
        position: 'absolute', bottom: 38, left: 100, right: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <HUD theme={t} view={view} dive={isDived} divedSeg={divedSeg} />
        <div style={{
          fontFamily: t.fontMono, fontSize: 10, letterSpacing: '0.22em',
          color: t.primary, opacity: 0.7, textTransform: 'uppercase',
        }}>
          {isDived ? '◉ Click any world for codex · drag to pan' : '▸ Click any SEGMENTUM · drag to pan · scroll ⇕ zoom'}
        </div>
      </div>

      {/* Side panel */}
      <WorldPanel theme={t} world={selectedWorld} onClose={() => setSelectedWorld(null)} />

      {/* Live polar coord readout (bottom-right). Shifted left when codex panel is open. */}
      {window.CoordReadout && (
        <window.CoordReadout theme={t} coords={cursorPolar} visible={!isDived}
          offset={selectedWorld ? 396 : 100} />
      )}

      {/* Warp editor side panel + JSON dump. Only when editWarps is on. */}
      {window.EditPanel && (
        <window.EditPanel theme={t} enabled={editWarps && !isDived} tick={editTick}
          selected={editSelected}
          onTick={() => { setEditTick((v) => v + 1); onPersist && onPersist(); }}
          onClose={() => { /* parent toggle owns this */ }} />
      )}

      {/* Add Element panel — click-to-place new planets / zones. */}
      {window.AddElementPanel && (
        <window.AddElementPanel
          enabled={addMode && !isDived}
          theme={t}
          onTick={() => setEditTick((v) => v + 1)}
          onPersist={onPersist} />
      )}
    </div>
  );
}

window.GalaxyHologram = GalaxyHologram;
