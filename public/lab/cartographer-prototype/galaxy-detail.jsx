// Main Hologram component — assembles galaxy view, dive animation, ultima detail, side panel
// Props: { theme, factionFilter, height }

const { useState: _useState, useEffect: _useEffect, useRef: _useRef, useMemo: _useMemo } = React;

function StarField({ theme, count = 180, layer = 1, parallax = { x: 0, y: 0 } }) {
  const t = theme;
  const stars = _useMemo(() => window.makeStars(count, layer * 13), [count, layer]);
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden',
      transform: `translate(${parallax.x}px, ${parallax.y}px)`,
      willChange: 'transform',
    }}>
      {stars.map((s) => {
        const c = s.z > 0.95 ? t.starHot : t.starColor;
        const isBright = s.z > 0.95;
        // Tiny crisp pinpoints — never larger than 1.2px even for the brightest layer star.
        const size = isBright ? 1.1 : 0.45 + s.z * 0.25;
        // Dim the background field so foreground landmarks pop forward.
        const baseOp = isBright ? 0.55 : 0.16 + s.z * 0.32;
        return (
          <div key={s.id} style={{
            position: 'absolute',
            left: `${s.x}%`, top: `${s.y}%`,
            width: size, height: size, borderRadius: '50%',
            background: c,
            opacity: baseOp,
            animation: `twinkle ${s.twinkle}s ease-in-out ${s.delay}s infinite`,
          }} />
        );
      })}
    </div>
  );
}

// Distant rogue planets drifting in the deep background — 3 silhouettes,
// each with a different parallax factor so panning the map produces a
// strong 3D depth-of-field effect. Pure CSS gradients (no SVG) so they
// rasterize at full device resolution and the soft terminator lines stay
// buttery without blur filter cost.
function ParallaxBackgroundPlanets({ pan, theme }) {
  const t = theme;
  // x/y are vw/vh percentages; size in CSS pixels; parallax = fraction of pan.
  const planets = _useMemo(() => ([
    // Furthest — biggest, barely moves, almost monochrome carbon
    { x: 14, y: 84, size: 620, base: '#0e0a08', lit: '#2a1c12',
      ringColor: null, parallax: 0.022, blur: 4.5, opacity: 0.55, glow: 0 },
    // Distant gas-giant with a faint ring system
    { x: 90, y: 12, size: 360, base: '#100a14', lit: '#4a2a44',
      ringColor: '#5a3850', parallax: 0.07,  blur: 2.5, opacity: 0.6, glow: 38 },
    // Closer rocky body — smaller, fastest, picks up the theme primary
    { x: 78, y: 76, size: 170, base: '#0a1410', lit: t.primary,
      ringColor: null, parallax: 0.18, blur: 1.5, opacity: 0.55, glow: 22 },
  ]), [t.primary]);
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      overflow: 'hidden',
      // Mix slightly under the starfields — adds depth without drowning them
      mixBlendMode: 'screen',
    }}>
      {planets.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${p.x}%`, top: `${p.y}%`,
          transform: `translate(${pan.x * p.parallax}px, ${pan.y * p.parallax}px)`,
          willChange: 'transform',
        }}>
          {/* Faint atmospheric glow */}
          {p.glow > 0 && (
            <div style={{
              position: 'absolute',
              left: -p.size / 2 - p.glow,
              top: -p.size / 2 - p.glow,
              width: p.size + p.glow * 2,
              height: p.size + p.glow * 2,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${p.lit}38 0%, transparent 60%)`,
              opacity: p.opacity * 0.7,
              filter: `blur(${p.blur * 2}px)`,
            }} />
          )}
          {/* Ring system */}
          {p.ringColor && (
            <div style={{
              position: 'absolute',
              left: -p.size * 0.85, top: -p.size * 0.08,
              width: p.size * 1.7, height: p.size * 0.16,
              borderRadius: '50%',
              border: `1px solid ${p.ringColor}`,
              opacity: p.opacity * 0.5,
              transform: 'rotate(-22deg)',
              filter: `blur(${p.blur * 0.6}px)`,
            }} />
          )}
          {/* The planet disc — gradient with a sharp terminator */}
          <div style={{
            position: 'absolute',
            left: -p.size / 2, top: -p.size / 2,
            width: p.size, height: p.size,
            borderRadius: '50%',
            background: `radial-gradient(circle at 36% 30%, ${p.lit} 0%, ${p.base} 48%, #050402 78%)`,
            opacity: p.opacity,
            filter: `blur(${p.blur}px)`,
            boxShadow: `inset -${p.size * 0.04}px 0 ${p.size * 0.18}px ${t.bg0}cc`,
          }} />
        </div>
      ))}
    </div>
  );
}

// Flat parallax motes — subtle floaters within the disc plane (no 3D depth).
function FlatMotes({ theme, count = 50 }) {
  const t = theme;
  const motes = _useMemo(() => window.makeStars(count, 99), [count]);
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      overflow: 'visible',
    }}>
      {motes.map((m) => (
        <div key={m.id} style={{
          position: 'absolute',
          left: `${20 + m.x * 0.6}%`,
          top: `${20 + m.y * 0.6}%`,
          width: 1.2, height: 1.2, borderRadius: '50%',
          background: t.primary,
          opacity: 0.12 + m.z * 0.28,
          animation: `motedrift ${6 + m.twinkle}s ease-in-out ${m.delay}s infinite alternate`,
        }} />
      ))}
    </div>
  );
}

// Machine-translation-style text scramble — letters cycle through random
// glyphs and then settle into the real word. Used for planet labels on
// hover. When `active` flips true it plays a single scramble→reveal pass;
// when false the text snaps back to the original instantly.
function DecodedText({ text, active, glyphSet }) {
  const [display, setDisplay] = _useState(text);
  const rafRef = _useRef(null);
  const startRef = _useRef(0);
  _useEffect(() => {
    if (!active) { setDisplay(text); return; }
    const chars = glyphSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*<>{}[]/\\!?█▓▒░ΩΔΣΞ╪╠╗║';
    const total = Math.max(text.length * 70 + 250, 600); // ms — scales with name length
    startRef.current = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - startRef.current) / total);
      // Easing — settle faster at the end
      const settledChars = Math.floor(t * t * (text.length + 1));
      let out = '';
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === ' ' || ch === '\'') { out += ch; continue; }
        if (i < settledChars) { out += ch; continue; }
        // Pick a fresh glyph each frame for unsettled positions
        out += chars[(Math.random() * chars.length) | 0];
      }
      setDisplay(out);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
      else setDisplay(text);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [text, active]);
  return display;
}

// Floating tooltip card — appears above a planet on hover. Pure-HTML overlay
// positioned by the world's polar coords. Auspex-frame styling.
function PlanetTooltip({ theme, name, sub, factionColor, x, y, visible }) {
  const t = theme;
  return (
    <div style={{
      position: 'absolute', left: `${x}%`, top: `${y}%`,
      transform: `translate(-50%, calc(-100% - 18px)) translateY(${visible ? 0 : 4}px)`,
      pointerEvents: 'none', zIndex: 3,
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.18s ease-out, transform 0.18s cubic-bezier(.2,.7,.2,1)',
    }}>
      <div style={{
        position: 'relative',
        background: `linear-gradient(180deg, ${t.bg1}ee, ${t.bg0}f4)`,
        border: `1px solid ${factionColor || t.stroke}`,
        boxShadow: `0 0 18px ${factionColor || t.primary}40, 0 0 2px ${factionColor || t.primary}80`,
        padding: '7px 12px 8px',
        whiteSpace: 'nowrap',
      }}>
        {/* corner brackets — auspex frame */}
        <span style={cornerBracket(t, 'tl', factionColor)} />
        <span style={cornerBracket(t, 'tr', factionColor)} />
        <span style={cornerBracket(t, 'bl', factionColor)} />
        <span style={cornerBracket(t, 'br', factionColor)} />
        <div style={{
          fontFamily: t.fontDisplay, fontSize: 12, letterSpacing: '0.22em',
          color: factionColor || t.accent,
          textTransform: 'uppercase', textShadow: `0 0 10px ${factionColor || t.primary}`,
          lineHeight: 1.1,
        }}>{name}</div>
        {sub && (
          <div style={{
            fontFamily: t.fontMono, fontSize: 9, letterSpacing: '0.18em',
            color: t.primary, opacity: 0.75, marginTop: 3,
            textTransform: 'uppercase',
          }}>{sub}</div>
        )}
      </div>
      {/* pointer triangle pointing down at the planet */}
      <div style={{
        position: 'absolute', left: '50%', bottom: -7,
        width: 8, height: 8, transform: 'translate(-50%, 0) rotate(45deg)',
        background: t.bg0,
        borderRight: `1px solid ${factionColor || t.stroke}`,
        borderBottom: `1px solid ${factionColor || t.stroke}`,
      }} />
    </div>
  );
}
function cornerBracket(t, pos, c) {
  const base = {
    position: 'absolute', width: 6, height: 6,
    borderColor: c || t.primary, borderStyle: 'solid', borderWidth: 0,
  };
  if (pos === 'tl') return { ...base, top: -1, left: -1, borderTopWidth: 1, borderLeftWidth: 1 };
  if (pos === 'tr') return { ...base, top: -1, right: -1, borderTopWidth: 1, borderRightWidth: 1 };
  if (pos === 'bl') return { ...base, bottom: -1, left: -1, borderBottomWidth: 1, borderLeftWidth: 1 };
  return { ...base, bottom: -1, right: -1, borderBottomWidth: 1, borderRightWidth: 1 };
}

// Detailed segmentum wedge: shows the worlds for the dived segmentum as clickable dots.
function SegmentumDetail({ theme, visible, segId, factionFilter, onWorldClick, selectedId, hoveredId, setHoveredId }) {
  const t = theme;
  const worlds = (segId && window.SEGMENTUM_WORLDS && window.SEGMENTUM_WORLDS[segId]) || [];
  const MechReticle = window.MechReticle;
  if (!visible) return null;
  return (
    <svg viewBox="0 0 100 100" style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      overflow: 'visible', pointerEvents: 'none',
      opacity: visible ? 1 : 0, transition: 'opacity 0.5s 0.3s',
    }}>
      {/* Ultramar realm boundary highlight — only inside the Ultima dive. */}
      {segId === 'ultima' && (
        <path d={(() => {
          const pts = [
            window.polar(0.48, 80), window.polar(0.5, 85), window.polar(0.58, 88),
            window.polar(0.68, 92), window.polar(0.72, 100), window.polar(0.62, 105),
            window.polar(0.5, 100), window.polar(0.46, 90),
          ];
          return 'M ' + pts.map((p) => p.join(' ')).join(' L ') + ' Z';
        })()}
          fill="none"
          stroke={t.primary} strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          strokeDasharray="3 4"
          opacity="0.35" />
      )}
      {/* Sol system orbit rings — only inside the Solar dive. */}
      {segId === 'solar' && (
        <g opacity="0.4" pointerEvents="none">
          {[0.05, 0.08, 0.10, 0.13, 0.16].map((rr) => (
            <circle key={rr} cx="50" cy="50" r={rr * 50}
              fill="none" stroke={t.primary} strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              strokeDasharray="1 3" />
          ))}
          {/* Sol itself */}
          <circle cx="50" cy="50" r="0.55" fill={t.accent} />
          <circle cx="50" cy="50" r="1.2" fill={t.accent} opacity="0.35" />
        </g>
      )}
      {worlds.map((w) => {
        const [x, y] = window.polar(w.r, w.a);
        const fc = window.FACTION_COLORS[w.faction] || t.primary;
        const isSel = selectedId === w.id;
        const isHov = hoveredId === w.id;
        const dim = factionFilter !== 'all' && factionFilter !== w.faction;
        return (
          <g key={w.id}
            style={{
              cursor: 'pointer', pointerEvents: 'auto',
              opacity: dim ? 0.15 : 1, transition: 'opacity 0.3s',
            }}
            onPointerEnter={() => setHoveredId && setHoveredId(w.id)}
            onPointerLeave={() => setHoveredId && setHoveredId(null)}
            onClick={() => onWorldClick(w)}>
            {/* hit area */}
            <circle cx={x} cy={y} r="1.8" fill="transparent" />
            <window.PlanetMarker x={x} y={y}
              faction={w.faction} kind={w.kind}
              color={fc} accentColor={t.accent}
              iconScale={isHov || isSel ? 0.62 : 0.52}
              ringR={0.95}
              dotCount={(w.books && w.books.length) || 1}
              hovered={isHov} selected={isSel}
              spinDur={13} />
          </g>
        );
      })}
    </svg>
  );
}

function SegmentumWorldLabels({ theme, visible, segId, factionFilter, onWorldClick, selectedId, hoveredId, setHoveredId }) {
  const t = theme;
  if (!visible) return null;
  const worlds = (segId && window.SEGMENTUM_WORLDS && window.SEGMENTUM_WORLDS[segId]) || [];
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      opacity: visible ? 1 : 0, transition: 'opacity 0.4s 0.5s',
    }}>
      {worlds.map((w) => {
        const [x, y] = window.polar(w.r, w.a);
        const fc = window.FACTION_COLORS[w.faction] || t.primary;
        const dim = factionFilter !== 'all' && factionFilter !== w.faction;
        const isSel = selectedId === w.id;
        const isHov = hoveredId === w.id;
        const label = w.name.toUpperCase();
        return (
          <React.Fragment key={w.id}>
            <div
              onClick={() => onWorldClick(w)}
              onPointerEnter={() => setHoveredId && setHoveredId(w.id)}
              onPointerLeave={() => setHoveredId && setHoveredId(null)}
              style={{
                position: 'absolute', left: `${x}%`, top: `${y}%`,
                transform: `translate(12px, -50%) ${isHov ? 'translateX(2px)' : ''}`,
                fontFamily: t.fontMono, fontSize: 8.5, letterSpacing: '0.18em',
                color: isSel ? t.accent : (isHov ? t.starHot : fc),
                textShadow: `0 0 ${isHov ? 12 : 6}px ${fc}`,
                // Hide the inline label when hovered/selected — the tooltip
                // takes over so the name reads cleanly above the marker.
                opacity: dim ? 0.15 : (isHov || isSel ? 0 : 0.85),
                cursor: 'pointer', pointerEvents: 'auto',
                whiteSpace: 'nowrap',
                padding: '2px 4px',
                transition: 'color 0.2s, opacity 0.2s, text-shadow 0.2s, transform 0.2s',
                fontWeight: 500,
              }}>
              <DecodedText text={label} active={false} />
            </div>
            <PlanetTooltip theme={t}
              name={<DecodedText text={label} active={isHov || isSel} />}
              sub={w.type}
              factionColor={fc}
              x={x} y={y}
              visible={(isHov || isSel) && !dim} />
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Side panel with world details
function WorldPanel({ theme, world, onClose }) {
  const t = theme;
  const open = !!world;
  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, width: 380,
      transform: open ? 'translateX(0)' : 'translateX(110%)',
      transition: 'transform 0.45s cubic-bezier(.2,.7,.2,1)',
      background: `linear-gradient(180deg, ${t.bg0}f8 0%, ${t.bg1}f0 100%)`,
      borderLeft: `1px solid ${t.stroke}`,
      backdropFilter: 'blur(10px)',
      boxShadow: `-10px 0 40px ${t.bg0}aa, inset 1px 0 0 ${t.strokeFaint}`,
      pointerEvents: open ? 'auto' : 'none',
      zIndex: 5,
      color: t.primary,
      fontFamily: t.fontBody,
      display: 'flex', flexDirection: 'column',
    }}>
      {world && (
        <>
          {/* header */}
          <div style={{ padding: '20px 22px 14px', borderBottom: `1px solid ${t.strokeFaint}` }}>
            <div style={{
              fontFamily: t.fontMono, fontSize: 10, letterSpacing: '0.28em',
              color: t.primary, opacity: 0.6, marginBottom: 6,
            }}>
              ◆ STELLAR RECORD // {world.id.toUpperCase()}
            </div>
            <div style={{
              fontFamily: t.fontDisplay, fontSize: 32, letterSpacing: t.letterTitle,
              color: t.accent, textShadow: `0 0 18px ${t.primary}`, lineHeight: 1, marginBottom: 6,
              textTransform: 'uppercase',
            }}>
              {world.name}
            </div>
            <div style={{
              fontFamily: t.fontMono, fontSize: 10, letterSpacing: '0.16em',
              color: window.FACTION_COLORS[world.faction] || t.primary,
              textTransform: 'uppercase', opacity: 0.95,
            }}>
              {world.type}
            </div>
            <button onClick={onClose} aria-label="Close" style={{
              position: 'absolute', top: 14, right: 14,
              background: 'transparent', border: `1px solid ${t.stroke}`,
              color: t.primary, width: 26, height: 26, borderRadius: 0,
              cursor: 'pointer', fontFamily: t.fontMono, fontSize: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>×</button>
          </div>

          {/* body — scrollable */}
          <div style={{ overflowY: 'auto', padding: '18px 22px', flex: 1 }}>
            <p style={{
              fontFamily: t.fontBody, fontSize: 14, lineHeight: 1.55,
              color: t.primary, opacity: 0.9, margin: 0, marginBottom: 22,
              fontStyle: t.id === 'astropath' ? 'italic' : 'normal',
            }}>
              {world.blurb}
            </p>

            <SectionHeader theme={t} label="Codex Bibliotheca" sub={`${world.books.length} record${world.books.length !== 1 ? 's' : ''}`} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
              {world.books.map((b, i) => (
                <div key={i} style={{
                  border: `1px solid ${t.strokeFaint}`,
                  background: t.primarySoft,
                  padding: '10px 12px',
                  cursor: 'pointer',
                  position: 'relative',
                }}>
                  <div style={{
                    fontFamily: t.fontDisplay, fontSize: 13, letterSpacing: '0.08em',
                    color: t.accent, marginBottom: 3,
                  }}>{b.title}</div>
                  <div style={{
                    fontFamily: t.fontMono, fontSize: 10, letterSpacing: '0.12em',
                    color: t.primary, opacity: 0.7, textTransform: 'uppercase',
                    display: 'flex', justifyContent: 'space-between', marginBottom: 4,
                  }}>
                    <span>{b.author}</span>
                    <span style={{ opacity: 0.7 }}>· {b.tag}</span>
                  </div>
                  <div style={{
                    fontFamily: t.fontMono, fontSize: 9, letterSpacing: '0.18em',
                    color: window.FACTION_COLORS[world.faction] || t.primary, opacity: 0.9,
                    textTransform: 'uppercase',
                    display: 'flex', alignItems: 'center', gap: 6,
                    paddingTop: 4, borderTop: `1px dashed ${t.strokeFaint}`,
                  }}>
                    <span style={{ opacity: 0.5 }}>◉ Setting</span>
                    <span>{b.setting || world.name}</span>
                  </div>
                </div>
              ))}
            </div>

            <SectionHeader theme={t} label="Recorded Events" sub="Imperial dating" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
              {world.events.map((e, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '64px 1fr', gap: 12,
                  paddingBottom: 10,
                  borderBottom: i < world.events.length - 1 ? `1px dashed ${t.strokeFaint}` : 'none',
                }}>
                  <div style={{
                    fontFamily: t.fontMono, fontSize: 10, color: t.accent,
                    letterSpacing: '0.1em', paddingTop: 1,
                  }}>{e.era}</div>
                  <div style={{
                    fontFamily: t.fontBody, fontSize: 12.5, lineHeight: 1.45,
                    color: t.primary, opacity: 0.85,
                    fontStyle: t.id === 'astropath' ? 'italic' : 'normal',
                  }}>{e.text}</div>
                </div>
              ))}
            </div>

            <SectionHeader theme={t} label="Auspex" />
            <div style={{
              fontFamily: t.fontMono, fontSize: 10, color: t.primary,
              opacity: 0.7, letterSpacing: '0.1em', lineHeight: 1.8,
            }}>
              <div>FACTION ··· <span style={{ color: window.FACTION_COLORS[world.faction] || t.accent }}>{world.faction.toUpperCase()}</span></div>
              <div>SEGMENT ··· {(world.segment || 'ultima').toUpperCase()}</div>
              <div>STATUS ···· COGITATOR-VERIFIED</div>
              <div>VOX ······· {Math.floor(60 + Math.random() * 40)}.{Math.floor(Math.random() * 100)} MHz</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SectionHeader({ theme, label, sub }) {
  const t = theme;
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10,
      paddingBottom: 6, borderBottom: `1px solid ${t.strokeFaint}`,
    }}>
      <span style={{
        fontFamily: t.fontDisplay, fontSize: 11, letterSpacing: t.letterTitle,
        color: t.accent, textTransform: 'uppercase',
      }}>{label}</span>
      {sub && <span style={{
        fontFamily: t.fontMono, fontSize: 9, letterSpacing: '0.16em',
        color: t.primary, opacity: 0.5, textTransform: 'uppercase', marginLeft: 'auto',
      }}>{sub}</span>}
    </div>
  );
}

window.StarField = StarField;
window.FlatMotes = FlatMotes;
window.ParallaxBackgroundPlanets = ParallaxBackgroundPlanets;
window.DecodedText = DecodedText;
window.PlanetTooltip = PlanetTooltip;
window.SegmentumDetail = SegmentumDetail;
window.SegmentumWorldLabels = SegmentumWorldLabels;
// Back-compat aliases (some host code still references these names)
window.UltimaDetail = SegmentumDetail;
window.UltimaWorldLabels = SegmentumWorldLabels;
window.WorldPanel = WorldPanel;
window.SectionHeader = SectionHeader;
