// ── Search palette ──────────────────────────────────────────────────────
//
// Cmd/Ctrl+K (or '/') opens a floating modal. Tokenized fuzzy match across
// every named landmark, every segmentum world, every segmentum, and every
// nebula. Hit Enter or click a row — we dispatch a 'goto' that the host
// listens to.
//
// The actual navigation (era switch + dive + select-world) is owned by App
// and GalaxyHologram. This component knows nothing about how to dive — it
// just calls window.__galaxyGoto({ segment, worldId }).

(function () {
const { useState: _us, useEffect: _ue, useRef: _ur, useMemo: _um } = React;

// Build a flat, deduped index of every searchable entity in the data files.
// Worlds are listed once even though some appear in both GALAXY_LANDMARKS
// and a SEGMENTUM_WORLDS list (Terra, Cadia, Macragge…) — segment-list copy
// wins because it has richer metadata (blurb, books).
function buildIndex() {
  const seen = new Set();
  const entries = [];

  // 1) Segmentum worlds (rich metadata)
  Object.entries(window.SEGMENTUM_WORLDS || {}).forEach(([segId, worlds]) => {
    (worlds || []).forEach((w) => {
      if (seen.has(w.id)) return;
      seen.add(w.id);
      entries.push({
        kind: 'world',
        id: w.id,
        name: w.name,
        segment: segId,
        faction: w.faction,
        type: w.type || '',
        blurb: w.blurb || '',
        worldKind: w.kind,
      });
    });
  });

  // 2) Galaxy-level landmarks that don't have a detail entry (rare — Baal etc.)
  (window.GALAXY_LANDMARKS || []).forEach((l) => {
    if (seen.has(l.id)) return;
    seen.add(l.id);
    entries.push({
      kind: 'world',
      id: l.id,
      name: l.name,
      segment: l.segment,
      faction: l.faction,
      type: 'Galactic Landmark',
      worldKind: l.kind,
    });
  });

  // 3) Segmentums themselves — dive directly
  (window.SEGMENTUMS || []).forEach((s) => {
    entries.push({
      kind: 'segmentum',
      id: s.id,
      name: s.name,
      segment: s.id,
      blurb: s.lore || '',
      faction: null,
    });
  });

  // 4) Nebulae & warp anomalies — dive into their host segmentum
  (window.NEBULAE || []).forEach((n) => {
    entries.push({
      kind: 'nebula',
      id: 'nebula:' + n.name,
      name: n.name,
      segment: null, // computed lazily; we just dive to the angle's segmentum
      polar: { r: n.r, a: n.a },
      faction: n.type === 'warp' ? 'chaos' : null,
    });
  });

  return entries;
}

// Token-based scoring. We split the query on whitespace and require every
// token to hit somewhere — name (highest weight), segment, type, blurb.
function score(entry, tokens) {
  if (!tokens.length) return 0;
  const name = (entry.name || '').toLowerCase();
  const seg = (entry.segment || '').toLowerCase();
  const type = (entry.type || '').toLowerCase();
  const blurb = (entry.blurb || '').toLowerCase();
  const fac = (entry.faction || '').toLowerCase();
  let s = 0;
  for (const tok of tokens) {
    const t = tok.toLowerCase();
    let hit = 0;
    if (name === t) hit = 100;
    else if (name.startsWith(t)) hit = 50;
    else if (name.includes(t)) hit = 30;
    else if (seg.includes(t)) hit = 10;
    else if (fac.includes(t)) hit = 8;
    else if (type.includes(t)) hit = 6;
    else if (blurb.includes(t)) hit = 3;
    if (hit === 0) return -1;
    s += hit;
  }
  // Kind bias — worlds > segmentums > nebulae for ties.
  if (entry.kind === 'world') s += 0.5;
  return s;
}

const FACTION_COLOR = {
  imperium: '#f0b248',
  chaos:    '#d04428',
  xenos:    '#3aa17a',
  necron:   '#7df0c8',
  tyranid:  '#b04ec8',
};

// Tiny glyph per result kind. Reuses the existing kind→glyph map for worlds.
function glyphFor(entry) {
  if (entry.kind === 'world') {
    return (window.WORLD_KIND_GLYPHS && window.WORLD_KIND_GLYPHS[entry.worldKind]) || '◆';
  }
  if (entry.kind === 'segmentum') return '◬';
  if (entry.kind === 'nebula') return '◌';
  return '·';
}

function SearchPalette({ theme }) {
  const t = theme || {};
  const [open, setOpen] = _us(false);
  const [q, setQ] = _us('');
  const [idx, setIdx] = _us(0);
  const inputRef = _ur(null);
  const listRef = _ur(null);

  // Build index lazily — only when the palette is first opened. Cheap, but
  // no need to do it on every keystroke.
  const index = _um(() => buildIndex(), [open]);

  const results = _um(() => {
    const tokens = q.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) {
      // Empty query — show a curated set of marquee worlds.
      const featured = ['terra', 'cadia', 'macragge', 'baal', 'fenris', 'commorragh', 'armageddon', 'catachan'];
      return featured
        .map((id) => index.find((e) => e.id === id))
        .filter(Boolean);
    }
    return index
      .map((e) => ({ e, s: score(e, tokens) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 30)
      .map((x) => x.e);
  }, [q, index]);

  // Global hotkey — Cmd/Ctrl+K, '/', or Esc to close.
  _ue(() => {
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && k === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      // '/' only opens when not typing in another input
      if (k === '/' && !open) {
        const tgt = e.target;
        if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.isContentEditable)) return;
        e.preventDefault();
        setOpen(true);
      }
      if (k === 'escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Reset the cursor whenever the query changes.
  _ue(() => { setIdx(0); }, [q]);

  // Auto-focus the input the moment the palette opens.
  _ue(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [open]);

  // Keep the selected row in view as the user arrows through results.
  _ue(() => {
    if (!open || !listRef.current) return;
    const row = listRef.current.querySelector(`[data-row="${idx}"]`);
    if (row && row.scrollIntoView) {
      // block:'nearest' avoids the page-jumping that scrollIntoView normally causes.
      try { row.scrollIntoView({ block: 'nearest' }); } catch (e) {}
    }
  }, [idx, open]);

  const choose = (entry) => {
    if (!entry) return;
    setOpen(false);
    setQ('');
    if (window.__galaxyGoto) {
      window.__galaxyGoto({
        segment: entry.segment,
        worldId: entry.kind === 'world' ? entry.id : null,
        polar: entry.polar || null,
        kind: entry.kind,
      });
    }
  };

  const onInputKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIdx((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(results[idx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  // Floating trigger — bottom-left next to the era switcher + zoom.
  // Reduced to a flat hairline-underline glyph so it reads as a HUD
  // affordance, not a button competing with the era switcher.
  const trigger = !open && (
    <button
      type="button"
      onClick={() => setOpen(true)}
      data-no-drag
      title="Search worlds & segmentums  (⌘K)"
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '1';
        e.currentTarget.style.borderBottomColor = t.accent || '#f0b248';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '0.72';
        e.currentTarget.style.borderBottomColor = t.stroke || 'rgba(240,178,72,.22)';
      }}
      style={{
        position: 'fixed', left: 100, bottom: 90, zIndex: 2147483640,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '7px 4px 8px 4px',
        background: 'transparent',
        border: 'none',
        borderBottom: `1px solid ${t.stroke || 'rgba(240,178,72,.22)'}`,
        color: t.primary || '#f0b248',
        fontFamily: t.fontMono || '"JetBrains Mono", monospace',
        fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase',
        cursor: 'pointer',
        opacity: 0.72,
        transition: 'opacity .25s ease, border-color .25s ease',
      }}>
      <span style={{ fontSize: 13, lineHeight: 1, opacity: 0.85 }}>⌕</span>
      <span>Search</span>
      <span style={{ marginLeft: 4, opacity: 0.45, fontSize: 9, letterSpacing: '0.12em' }}>⌘K</span>
    </button>
  );

  if (!open) return trigger;

  // Palette modal.
  return (
    <div data-no-drag onPointerDown={(e) => e.stopPropagation()} style={{
      position: 'fixed', inset: 0, zIndex: 2147483644,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: '14vh',
      background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
    }} onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div style={{
        width: 'min(620px, 92vw)',
        background: 'linear-gradient(180deg, rgba(15,12,6,0.96), rgba(8,6,3,0.98))',
        border: `1px solid ${t.stroke || 'rgba(240,178,72,.38)'}`,
        boxShadow: `0 24px 60px rgba(0,0,0,0.65), 0 0 0 1px rgba(0,0,0,0.4) inset, 0 0 60px ${t.primarySoft || 'rgba(240,178,72,.15)'}`,
        color: t.accent || '#f0b248',
        fontFamily: t.fontBody || 'inherit',
        maxHeight: '70vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Input row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 18px',
          borderBottom: `1px solid ${t.strokeFaint || 'rgba(240,178,72,.14)'}`,
        }}>
          <span style={{ fontSize: 16, opacity: 0.55 }}>⌕</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Search worlds, segmentums, nebulae…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'inherit', fontFamily: 'inherit', fontSize: 16,
              letterSpacing: '0.04em',
            }}
          />
          <span style={{
            fontFamily: t.fontMono || 'monospace', fontSize: 9, opacity: 0.45,
            letterSpacing: '0.18em', textTransform: 'uppercase',
          }}>
            {results.length} result{results.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Result list */}
        <div ref={listRef} style={{
          overflowY: 'auto', flex: 1, padding: '6px 0',
        }} className="holo-no-scrollbar">
          {results.length === 0 ? (
            <div style={{ padding: '32px 18px', opacity: 0.55, fontStyle: 'italic', fontFamily: t.fontBody || 'serif' }}>
              No archive records match "{q}". Cogitator returned null.
            </div>
          ) : results.map((r, i) => {
            const active = i === idx;
            const segName = r.segment ? (window.SEGMENTUMS.find((s) => s.id === r.segment) || {}).short || r.segment : '—';
            const facColor = FACTION_COLOR[r.faction] || (t.primary || '#f0b248');
            return (
              <div
                key={r.id}
                data-row={i}
                onMouseEnter={() => setIdx(i)}
                onClick={() => choose(r)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '10px 18px',
                  background: active ? `${t.primarySoft || 'rgba(240,178,72,.10)'}` : 'transparent',
                  borderLeft: `3px solid ${active ? facColor : 'transparent'}`,
                  cursor: 'pointer',
                }}>
                <span style={{
                  width: 22, textAlign: 'center', fontSize: 16, color: facColor,
                  textShadow: active ? `0 0 8px ${facColor}` : 'none',
                }}>{glyphFor(r)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 500,
                    letterSpacing: r.kind === 'segmentum' ? '0.24em' : '0.06em',
                    textTransform: r.kind === 'segmentum' ? 'uppercase' : 'none',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{r.name}</div>
                  {(r.type || r.blurb) && (
                    <div style={{
                      fontSize: 11, opacity: 0.55, marginTop: 2,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{r.type || r.blurb}</div>
                  )}
                </div>
                <span style={{
                  fontFamily: t.fontMono || 'monospace',
                  fontSize: 9, opacity: 0.45,
                  letterSpacing: '0.20em', textTransform: 'uppercase',
                  textAlign: 'right', minWidth: 70,
                }}>{segName}</span>
              </div>
            );
          })}
        </div>

        {/* Footer hint row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 18,
          padding: '8px 18px',
          borderTop: `1px solid ${t.strokeFaint || 'rgba(240,178,72,.14)'}`,
          fontFamily: t.fontMono || 'monospace',
          fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
          opacity: 0.55,
        }}>
          <span><kbd style={kbdSt}>↑↓</kbd> navigate</span>
          <span><kbd style={kbdSt}>↵</kbd> jump</span>
          <span><kbd style={kbdSt}>esc</kbd> close</span>
          <span style={{ marginLeft: 'auto' }}>archivum imperialis</span>
        </div>
      </div>
    </div>
  );
}

const kbdSt = {
  padding: '1px 5px', border: '1px solid currentColor', opacity: 0.6,
  marginRight: 4, fontSize: 9,
};

window.SearchPalette = SearchPalette;
})();
