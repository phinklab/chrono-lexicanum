// Galaxy Hologram — interactive 40k map component
// Renders galaxy overview → cinematic dive into Ultima → side panel with lore/books/events.
// Props: { theme, factionFilter, onClose? }

const { useState, useEffect, useRef, useMemo } = React;

// Point-in-segment test — a (r, a) coord falls inside segment `s` if its
// radius is between [s.inner, s.outer] and its angle (mod 360) lies in
// [s.a0, s.a1]. Solar is special-cased: it covers the central disc with
// no angular bounds.
function inSegment(r, a, s) {
  if (!s) return false;
  if (s.id === 'solar') return r <= s.outer + 1e-6;
  if (r < s.inner - 1e-6 || r > s.outer + 1e-6) return false;
  // normalize a, s.a0, s.a1 to [0, 360)
  const norm = (x) => ((x % 360) + 360) % 360;
  const an = norm(a), a0 = norm(s.a0), a1 = norm(s.a1);
  if (a0 <= a1) return an >= a0 && an <= a1;
  // wraps past 360
  return an >= a0 || an <= a1;
}
window.inSegment = inSegment;

// ───────── tiny helpers ─────────
const polar = (r, aDeg, cx = 50, cy = 50, scale = 50) => {
  const a = ((aDeg - 90) * Math.PI) / 180;
  return [cx + r * scale * Math.cos(a), cy + r * scale * Math.sin(a)];
};

// SVG arc path for a segmentum wedge (donut sector)
function wedgePath(inner, outer, a0, a1) {
  const SCALE = 50, cx = 50, cy = 50;
  const rad = (d) => ((d - 90) * Math.PI) / 180;
  const p1 = [cx + inner * SCALE * Math.cos(rad(a0)), cy + inner * SCALE * Math.sin(rad(a0))];
  const p2 = [cx + outer * SCALE * Math.cos(rad(a0)), cy + outer * SCALE * Math.sin(rad(a0))];
  const p3 = [cx + outer * SCALE * Math.cos(rad(a1)), cy + outer * SCALE * Math.sin(rad(a1))];
  const p4 = [cx + inner * SCALE * Math.cos(rad(a1)), cy + inner * SCALE * Math.sin(rad(a1))];
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M ${p1[0]} ${p1[1]}
          L ${p2[0]} ${p2[1]}
          A ${outer * SCALE} ${outer * SCALE} 0 ${large} 1 ${p3[0]} ${p3[1]}
          L ${p4[0]} ${p4[1]}
          A ${inner * SCALE} ${inner * SCALE} 0 ${large} 0 ${p1[0]} ${p1[1]} Z`;
}

// Generate persistent star field
function makeStars(n, seed = 7) {
  let s = seed;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    x: rnd() * 100,
    y: rnd() * 100,
    z: rnd(),                  // depth 0..1
    size: 0.4 + rnd() * 1.6,
    twinkle: 2 + rnd() * 6,
    delay: rnd() * 4,
  }));
}

// ───────── Mechanicum target reticle ─────────
// Used for both galaxy landmarks and Ultima worlds on hover. Intentionally
// minimal: ONE thin 1px ring that expands from baseR outward, fading as it
// goes. Nothing else. Matches the auspex-ping vocabulary used elsewhere on
// the disc.
function MechReticle({ x, y, color, accent, baseR = 1.0 }) {
  return (
    <g pointerEvents="none">
      <circle cx={x} cy={y} r={baseR} fill="none" stroke={accent || color}
        strokeWidth="0.8" vectorEffect="non-scaling-stroke" opacity="0">
        <animate attributeName="r"
          values={`${baseR};${baseR + 3.4}`}
          dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="opacity"
          values="0;0.95;0"
          keyTimes="0;0.12;1"
          dur="2.4s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}

// ───────── Faction icon ─────────
// Line-only grimdark glyphs sized for a unit design space (±0.5).
// All strokes use vector-effect:non-scaling-stroke so the linework stays a
// crisp 1px regardless of zoom — gives the icons that holographic-engraving
// feel rather than a chunky filled shape.
function FactionIcon({ faction, kind, color }) {
  const k = kind || '';
  const sw = "0.085";
  const ve = "non-scaling-stroke";
  // Chaos / warp → 8-ray jagged star, lines only
  if (faction === 'chaos' || k === 'warp' || k === 'chaos') {
    return (
      <g fill="none" stroke={color} strokeWidth={sw} vectorEffect={ve} strokeLinecap="round">
        <line x1="0" y1="-0.48" x2="0" y2="0.48" />
        <line x1="-0.48" y1="0" x2="0.48" y2="0" />
        <line x1="-0.34" y1="-0.34" x2="0.34" y2="0.34" />
        <line x1="-0.34" y1="0.34" x2="0.34" y2="-0.34" />
        {/* short tipped barbs to give the star its grimdark teeth */}
        <line x1="0" y1="-0.48" x2="-0.07" y2="-0.36" />
        <line x1="0" y1="-0.48" x2="0.07" y2="-0.36" />
        <line x1="0" y1="0.48"  x2="-0.07" y2="0.36" />
        <line x1="0" y1="0.48"  x2="0.07" y2="0.36" />
        <circle cx="0" cy="0" r="0.075" fill={color} stroke="none" />
      </g>
    );
  }
  // Necron → angular tomb-glyph: diamond + central cross
  if (faction === 'necron' || k === 'necron') {
    return (
      <g fill="none" stroke={color} strokeWidth={sw} vectorEffect={ve} strokeLinejoin="miter">
        <polygon points="0,-0.48 0.40,0 0,0.48 -0.40,0" />
        <line x1="-0.40" y1="0" x2="0.40" y2="0" />
        <line x1="0" y1="-0.48" x2="0" y2="0.48" />
        <circle cx="0" cy="0" r="0.06" fill={color} stroke="none" />
      </g>
    );
  }
  // Tyranid → curved talon
  if (faction === 'tyranid' || k === 'tyranid') {
    return (
      <g fill="none" stroke={color} strokeWidth="0.105" vectorEffect={ve} strokeLinecap="round">
        <path d="M -0.40 0.42 C -0.45 -0.28, 0.36 -0.50, 0.46 0.42" />
        <line x1="0.46" y1="0.42" x2="0.28" y2="0.22" />
        <circle cx="-0.40" cy="0.42" r="0.07" fill={color} stroke="none" />
      </g>
    );
  }
  // Xenos (T'au, Aeldari, Ork etc.) → triangle frame with vertical eye-slit
  if (faction === 'xenos' || k === 'xenos') {
    return (
      <g fill="none" stroke={color} strokeWidth={sw} vectorEffect={ve} strokeLinejoin="miter" strokeLinecap="round">
        <polygon points="0,-0.50 0.45,0.32 -0.45,0.32" />
        <line x1="0" y1="-0.06" x2="0" y2="0.20" />
        <circle cx="0" cy="0.05" r="0.05" fill={color} stroke="none" />
      </g>
    );
  }
  // Imperium (default) → vertical sword, blade down (templar/crusade vocabulary)
  return (
    <g fill="none" stroke={color} strokeWidth={sw} vectorEffect={ve} strokeLinecap="square">
      {/* blade */}
      <line x1="0" y1="-0.34" x2="0" y2="0.50" />
      {/* crossguard */}
      <line x1="-0.24" y1="-0.20" x2="0.24" y2="-0.20" />
      {/* pommel */}
      <line x1="-0.06" y1="-0.42" x2="0.06" y2="-0.42" />
      <line x1="0" y1="-0.50" x2="0" y2="-0.34" />
      {/* faint flanking ticks under the crossguard — grimdark engraving feel */}
      <line x1="-0.12" y1="-0.10" x2="0.12" y2="-0.10" />
    </g>
  );
}

// ───────── Planet marker ─────────
// A grimdark faction glyph + a thin 1px ring with N orbiting pips that
// rotate slowly around the marker. `dotCount` controls how many pips orbit
// — for an Ultima world we pass `books.length`, so worlds with more lore
// get more pips. Hover / selected states add an outer auspex pulse.
function PlanetMarker({ x, y, faction, kind, color, accentColor,
                       iconScale = 0.55, ringR = 1.0,
                       dotCount = 1, hovered, selected, spinDur = 14 }) {
  const ringColor = selected ? accentColor : color;
  const N = Math.max(1, dotCount | 0);
  // Pips equally distributed around the ring; the whole frame rotates so
  // they orbit in formation.
  const pips = [];
  for (let i = 0; i < N; i++) {
    const ang = (i / N) * 360;
    const rad = (ang - 90) * Math.PI / 180;
    pips.push({ x: Math.cos(rad) * ringR, y: Math.sin(rad) * ringR });
  }
  return (
    <g pointerEvents="none">
      {/* rotating ring + orbiting pips — one shared animateTransform */}
      <g transform={`translate(${x} ${y})`}>
        <g>
          <animateTransform attributeName="transform" type="rotate"
            from="0 0 0" to="360 0 0"
            dur={`${spinDur}s`} repeatCount="indefinite" />
          <circle r={ringR} fill="none" stroke={ringColor}
            strokeWidth="1" vectorEffect="non-scaling-stroke"
            opacity={hovered || selected ? 0.85 : 0.55} />
          {pips.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="0.095" fill={ringColor} />
          ))}
        </g>

        {/* the icon itself */}
        <g transform={`scale(${iconScale})`}>
          <FactionIcon faction={faction} kind={kind} color={ringColor} />
        </g>
      </g>

      {/* HOVER: a SINGLE outer auspex ring continuously expanding */}
      {hovered && !selected && (
        <circle cx={x} cy={y} r="0" fill="none" stroke={color} strokeWidth="1"
          vectorEffect="non-scaling-stroke">
          <animate attributeName="r"
            values={`${ringR};${ringR + 2.2}`}
            dur="1.6s" repeatCount="indefinite" />
          <animate attributeName="opacity"
            values="0.9;0.9;0"
            keyTimes="0;0.15;1"
            dur="1.6s" repeatCount="indefinite" />
        </circle>
      )}
      {/* SELECTED: steady bright outer ring */}
      {selected && (
        <circle cx={x} cy={y} r={ringR + 0.55} fill="none" stroke={accentColor}
          strokeWidth="1.3" vectorEffect="non-scaling-stroke" opacity="0.85">
          <animate attributeName="r"
            values={`${ringR + 0.35};${ringR + 0.85};${ringR + 0.35}`}
            dur="1.8s" repeatCount="indefinite" />
        </circle>
      )}
    </g>
  );
}

// ───────── corner ornaments ─────────
function CornerOrnament({ theme, pos }) {
  const t = theme;
  const flip = {
    tl: '',
    tr: 'scaleX(-1)',
    bl: 'scaleY(-1)',
    br: 'scale(-1,-1)',
  }[pos];
  if (t.cornerStyle === 'tech') {
    return (
      <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: flip, opacity: 0.85 }}>
        <path d="M2 22 L2 2 L22 2" fill="none" stroke={t.primary} strokeWidth="1.2" />
        <path d="M8 14 L8 8 L14 8" fill="none" stroke={t.primary} strokeWidth="1" opacity="0.6" />
        <circle cx="4" cy="4" r="1.5" fill={t.primary} />
        <path d="M18 2 L26 2 M30 2 L34 2" stroke={t.primary} strokeWidth="0.7" opacity="0.5" />
      </svg>
    );
  }
  if (t.cornerStyle === 'rune') {
    return (
      <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: flip, opacity: 0.9 }}>
        <path d="M4 28 L4 4 L28 4" fill="none" stroke={t.primary} strokeWidth="1" />
        <path d="M4 4 L14 14" stroke={t.primary} strokeWidth="0.8" opacity="0.7" />
        <circle cx="14" cy="14" r="2.5" fill="none" stroke={t.primary} strokeWidth="0.7" />
        <circle cx="14" cy="14" r="0.8" fill={t.primary} />
        <path d="M22 4 L22 8 M18 4 L18 8" stroke={t.primary} strokeWidth="0.6" opacity="0.5" />
      </svg>
    );
  }
  // gothic (imperial)
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" style={{ transform: flip, opacity: 0.95 }}>
      <path d="M2 2 L34 2 L34 6 L6 6 L6 34 L2 34 Z" fill={t.primary} opacity="0.85" />
      <path d="M10 10 L24 10 M10 10 L10 24" stroke={t.primary} strokeWidth="0.8" opacity="0.6" />
      <path d="M14 6 L14 12 M20 6 L20 10 M26 6 L26 10" stroke={t.primary} strokeWidth="0.7" opacity="0.7" />
      <circle cx="6" cy="6" r="2" fill={t.accent} />
      <path d="M30 2 L34 6 L30 6 Z" fill={t.primary} />
    </svg>
  );
}

// ───────── HUD strip ─────────
function HUD({ theme, view, dive }) {
  const t = theme;
  const [time, setTime] = useState(Date.now());
  useEffect(() => {
    const i = setInterval(() => setTime(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  const stamp = String(Math.floor(time / 1000) % 1000).padStart(3, '0');
  return (
    <div style={{
      display: 'flex', gap: 22, alignItems: 'center', fontFamily: t.fontMono,
      color: t.primary, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
      opacity: 0.85,
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%', background: t.primary,
          boxShadow: `0 0 10px ${t.primary}`, animation: 'pulse 1.6s infinite',
        }} />
        Link · Active
      </span>
      <span>Auspex // {t.id.toUpperCase()}</span>
      <span style={{ opacity: 0.7 }}>SCALE {view === 'galaxy' ? '1:10⁹ LY' : '1:10⁷ LY'}</span>
      <span style={{ opacity: 0.7 }}>STAMP M42.{stamp.slice(-3)}</span>
      <span style={{ opacity: dive ? 1 : 0.4, color: dive ? t.accent : t.primary }}>
        {view === 'galaxy' ? '◇ GALACTIC VIEW' : '◆ SEGMENTUM ULTIMA'}
      </span>
    </div>
  );
}

// ───────── Rift corruption field ─────────
// The X grid IS the cartographic notation for the rift. At random intervals
// a run of consecutive X's is "corrupted" — replaced by a grimdark word that
// glyph-cycles through occult symbols before resolving to its letters, holds
// briefly, then dissolves back through glitch glyphs as the X's fade in
// underneath. Slot positions are picked dynamically from valid runs of
// consecutive cells, so the words never appear in the same place twice.
const RIFT_GLITCH = '█▓▒░╳╋╬@#$&*?¥¤ΨΩΞ◊◆☩✠⛧§×!¿';
const DEMONIC_WORDS = [
  'DESPAIR', 'HERESY', 'CORRUPTED', 'OBLIVION', 'BETRAYAL',
  'NOMERCY', 'ALLISLOST', 'BLOODAWAITS', 'THEEND',
  'DECEIVER', 'BLASPHEMY', 'DAMNATION',
  'ABANDONHOPE', 'NIGHTFALLS', 'BURN', 'THELONGWAR',
  'WITNESSUS', 'CHAINSBREAK', 'FATEUNBOUND',
  'RUIN', 'COLDFIRE', 'CHOIRBROKEN', 'GODSDEAD',
];

// Stable X grid — markers ref + corruptedKeys Set drive the only diff. Memoed
// so the letter-animation tick (every 90ms) doesn't churn the whole grid; the
// grid only re-renders when the corrupted set actually changes membership.
const _RiftXGridImpl = ({ markers, corruptedKeys, color }) => (
  <g pointerEvents="none">
    {markers.map((m) => {
      const corrupted = corruptedKeys.has(m.key);
      return (
        <g key={m.key}
           transform={`translate(${m.x} ${m.y}) scale(${m.scale})`}
           style={{ opacity: corrupted ? 0 : m.op, transition: 'opacity 0.45s ease-out' }}>
          <g stroke={color} strokeWidth="0.20" vectorEffect="non-scaling-stroke">
            <line x1="-0.45" y1="-0.45" x2="0.45" y2="0.45" />
            <line x1="-0.45" y1="0.45" x2="0.45" y2="-0.45" />
            <animate attributeName="opacity"
              values="1;1;0.1;1;1;0.45;1;1;0.75;1;1"
              keyTimes="0;0.16;0.17;0.18;0.42;0.43;0.44;0.71;0.72;0.73;1"
              dur={`${m.glitchDur}s`}
              begin={`${m.glitchBegin}s`}
              repeatCount="indefinite" />
          </g>
        </g>
      );
    })}
  </g>
);
const RiftXGrid = React.memo(_RiftXGridImpl, (a, b) => {
  if (a.markers !== b.markers || a.color !== b.color) return false;
  if (a.corruptedKeys.size !== b.corruptedKeys.size) return false;
  for (const k of b.corruptedKeys) if (!a.corruptedKeys.has(k)) return false;
  return true;
});

// Animated layer: cycles each letter through occult glyphs during fade-in /
// fade-out, holds the real letter in between (with rare glitch flashes).
function RiftCorruptionLetters({ slots, now, color, fontFamily, fontSize }) {
  const els = [];
  slots.forEach((s, si) => {
    if (!s) return;
    const elapsed = now - s.begin;
    if (elapsed < 0 || elapsed > s.total) return;
    s.positions.forEach((p, li) => {
      const stagger = 0.045 * li;
      const tt = elapsed - stagger;
      if (tt < 0) return;
      const actual = s.word[li];
      let opacity, char;
      if (tt < s.fadeIn) {
        const k = tt / s.fadeIn;
        opacity = k * 0.9;
        const idx = Math.floor(tt * 30 + li * 13 + si * 7);
        char = RIFT_GLITCH[idx % RIFT_GLITCH.length];
        if (idx % 5 === 4) char = actual; // brief truth flashes
      } else if (tt < s.fadeIn + s.hold) {
        opacity = 0.9;
        const tt2 = tt - s.fadeIn;
        const idx = Math.floor(tt2 * 6 + li * 5 + si * 3);
        const glitchy = (idx + li * 7) % 13 === 0;
        char = glitchy ? RIFT_GLITCH[idx % RIFT_GLITCH.length] : actual;
      } else {
        const k = (tt - s.fadeIn - s.hold) / s.fadeOut;
        opacity = (1 - k) * 0.9;
        const idx = Math.floor(tt * 28 + li * 11 + si * 5);
        char = RIFT_GLITCH[idx % RIFT_GLITCH.length];
        if (idx % 6 === 5) char = actual;
      }
      if (opacity < 0.02) return;
      els.push(
        <text key={`${si}-${li}`}
          x={p.x} y={p.y + fontSize * 0.36}
          fill={color} opacity={opacity}
          fontFamily={fontFamily}
          fontSize={fontSize}
          textAnchor="middle"
          style={{ fontWeight: 700, letterSpacing: '0' }}>
          {char}
        </text>
      );
    });
  });
  return <g pointerEvents="none">{els}</g>;
}

// Owns the corruption slots. Each slot picks a new random consecutive run
// each cycle, so words drift across the whole rift instead of cycling
// through a handful of fixed positions.
function RiftField({ markers, runs, color, fontFamily, markScale }) {
  const NUM_SLOTS = 3;
  const seedRef = useRef(91234);
  const slotsRef = useRef(null);
  const startRef = useRef(performance.now());
  const [, force] = useState(0);

  const wrnd = () => {
    seedRef.current = (seedRef.current * 9301 + 49297) % 233280;
    return seedRef.current / 233280;
  };

  const pickSlot = (now) => {
    if (!runs || runs.length === 0) return null;
    for (let tries = 0; tries < 30; tries++) {
      const word = DEMONIC_WORDS[Math.floor(wrnd() * DEMONIC_WORDS.length)];
      let r = null;
      for (let rt = 0; rt < 16; rt++) {
        const cand = runs[Math.floor(wrnd() * runs.length)];
        if (cand && cand.length >= word.length) { r = cand; break; }
      }
      if (!r) continue;
      const maxStart = r.length - word.length;
      const s = Math.floor(wrnd() * (maxStart + 1));
      const positions = r.slice(s, s + word.length).map((c) => ({ key: c.key, x: c.x, y: c.y }));
      // Don't collide with another slot currently visible
      const occupied = new Set();
      (slotsRef.current || []).forEach((sl) => {
        if (sl) sl.positions.forEach((p) => occupied.add(p.key));
      });
      if (positions.some((p) => occupied.has(p.key))) continue;
      const fadeIn = 0.55;
      const hold = 1.5 + wrnd() * 0.9;
      const fadeOut = 0.6;
      const total = fadeIn + hold + fadeOut;
      const gap = 3.5 + wrnd() * 6.5;
      return { word, positions, begin: now, fadeIn, hold, fadeOut, total, restartAt: now + total + gap };
    }
    return null;
  };

  if (!slotsRef.current) {
    slotsRef.current = [];
    for (let i = 0; i < NUM_SLOTS; i++) {
      slotsRef.current.push(pickSlot(0.4 + i * 1.8));
    }
  }

  useEffect(() => {
    const id = setInterval(() => {
      const now = (performance.now() - startRef.current) / 1000;
      slotsRef.current.forEach((s, i) => {
        if (!s || now >= s.restartAt) {
          slotsRef.current[i] = pickSlot(now);
        }
      });
      force((v) => (v + 1) % 1e6);
    }, 90);
    return () => clearInterval(id);
  }, []);

  const now = (performance.now() - startRef.current) / 1000;
  const corruptedKeys = new Set();
  slotsRef.current.forEach((s) => {
    if (!s) return;
    const elapsed = now - s.begin;
    if (elapsed >= -0.05 && elapsed <= s.total + 0.05) {
      s.positions.forEach((p) => corruptedKeys.add(p.key));
    }
  });

  return (
    <g>
      <RiftXGrid markers={markers} corruptedKeys={corruptedKeys} color={color} />
      <RiftCorruptionLetters
        slots={slotsRef.current}
        now={now}
        color={color}
        fontFamily={fontFamily}
        fontSize={(markScale || 0.30) * 1.0} />
    </g>
  );
}

// ───────── Galaxy disc (the big SVG) ─────────
function GalacticDisc({ theme, factionFilter, riftPattern = 'strict-square', astronomican = false, onDive, dived, divedSeg = null, hoveredSeg, setHoveredSeg, hoveredLandmark, setHoveredLandmark, userZoom = 1, pan = { x: 0, y: 0 }, discSize = 1000 }) {
  const t = theme;
  const segs = window.SEGMENTUMS;
  const landmarks = window.GALAXY_LANDMARKS;
  const subs = window.SUB_SECTORS;
  const nebs = window.NEBULAE;
  const bgStars = window.BACKGROUND_STARS || [];

  // ── Variable-silhouette helpers ─────────────────────────────────────────
  // Since each segmentum now has its own `outer`, the disc edge is no longer
  // a circle — it's a piecewise polygon of arcs (one per segment) joined by
  // radial steps at the boundaries. These helpers let every overlay (rings,
  // ticks, radar sweep, clip-path, spirals) follow the new silhouette.
  const nonSolarSegs = segs.filter((s) => s.id !== 'solar');
  const maxOuter = Math.max(...nonSolarSegs.map((s) => s.outer), 1.0);
  // Outer radius (unit) at any angle.
  const segOuterAt = (aDeg) => {
    const aN = ((aDeg % 360) + 360) % 360;
    for (const seg of nonSolarSegs) {
      const aa0 = ((seg.a0 % 360) + 360) % 360;
      const aa1 = ((seg.a1 % 360) + 360) % 360;
      const inWedge = aa0 <= aa1 ? (aN >= aa0 && aN <= aa1) : (aN >= aa0 || aN <= aa1);
      if (inWedge) return seg.outer;
    }
    return 1.0;
  };
  // SVG path d-string for the silhouette scaled by `fraction` of each
  // segment's outer. fraction=1.0 → the disc edge; smaller fractions are
  // concentric "rings" that follow the same step shape (so a slim segmentum
  // gets a slim ring at the same fraction).
  const silhouettePathD = (fraction) => {
    const SCALE = 50, cx = 50, cy = 50;
    const radF = (d) => ((d - 90) * Math.PI) / 180;
    let dStr = '';
    nonSolarSegs.forEach((seg, idx) => {
      const r = seg.outer * fraction * SCALE;
      const sx = cx + r * Math.cos(radF(seg.a0));
      const sy = cy + r * Math.sin(radF(seg.a0));
      const ex = cx + r * Math.cos(radF(seg.a1));
      const ey = cy + r * Math.sin(radF(seg.a1));
      const large = Math.abs(seg.a1 - seg.a0) > 180 ? 1 : 0;
      dStr += idx === 0 ? `M ${sx} ${sy} ` : `L ${sx} ${sy} `;
      dStr += `A ${r} ${r} 0 ${large} 1 ${ex} ${ey} `;
    });
    dStr += 'Z';
    return dStr;
  };

  // Parallax lag for in-disc background stars: subtle drift behind the foreground.
  const lagFactor = 0.10;
  const parX = -lagFactor * pan.x * 100 / discSize;
  const parY = -lagFactor * pan.y * 100 / discSize;

  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      <defs>
        <radialGradient id="discGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={t.primary} stopOpacity="0.22" />
          <stop offset="55%" stopColor={t.primary} stopOpacity="0.08" />
          <stop offset="100%" stopColor={t.primary} stopOpacity="0" />
        </radialGradient>
        {/* Astronomican — the Emperor's psychic lighthouse. Warm gold halo
            anchored at Terra (50,50) that fades to nothing around the edge
            of the disc. Worlds outside this reach are, in the lore, dark
            to the Imperium. Toggled on via the Tweaks panel. */}
        <radialGradient id="astronomicanGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"  stopColor="#fff2c0" stopOpacity="0.72" />
          <stop offset="14%" stopColor="#ffd560" stopOpacity="0.46" />
          <stop offset="40%" stopColor="#f0a830" stopOpacity="0.18" />
          <stop offset="75%" stopColor="#a06010" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#5a3000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={t.accent} stopOpacity="0.95" />
          <stop offset="40%" stopColor={t.primary} stopOpacity="0.4" />
          <stop offset="100%" stopColor={t.primary} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="nebWarp" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={t.danger} stopOpacity="0.55" />
          <stop offset="45%" stopColor={t.danger} stopOpacity="0.22" />
          <stop offset="100%" stopColor={t.danger} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="nebForb" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#cce4ff" stopOpacity="0.55" />
          <stop offset="40%" stopColor="#7ab0e8" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3366aa" stopOpacity="0" />
        </radialGradient>
        {/* Radar sweep — a fan-shaped gradient that fades from primary into nothing.
            Rotated continuously by a wrapping <g> with CSS animation. */}
        <radialGradient id="sweepFan" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" stopColor={t.primary} stopOpacity="0.35" />
          <stop offset="60%" stopColor={t.primary} stopOpacity="0.1" />
          <stop offset="100%" stopColor={t.primary} stopOpacity="0" />
        </radialGradient>
        <clipPath id="discClip">
          <path d={silhouettePathD(1.0)} />
        </clipPath>
        {/* NO feGaussianBlur filters — they rasterize at SVG buffer resolution and pixelate when CSS-scaled.
            All "glow" below is faked with layered semi-transparent strokes / radial gradients, which stay crisp at any zoom. */}
      </defs>

      {/* Radar sweep — a thin amber wedge that rotates slowly. Clipped to the
          (now variable) silhouette so it never spills past the disc edge. */}
      <g clipPath="url(#discClip)" opacity={dived ? 0.5 : 0.85} style={{ transition: 'opacity .8s' }}>
        <g style={{
          transformOrigin: '50px 50px',
          animation: 'radarSpin 14s linear infinite',
        }}>
          {(() => {
            // Wedge must reach the farthest part of the silhouette so the
            // clip-path can trim it back to the per-segment edge.
            const wedgeR = maxOuter * 50;
            const [lx, ly] = polar(maxOuter, 0);    // leading edge tip (north)
            const [tx, ty] = polar(maxOuter, 68);   // trailing tip 68° clockwise
            return (
              <>
                <path d={`M 50 50 L ${lx} ${ly} A ${wedgeR} ${wedgeR} 0 0 1 ${tx} ${ty} Z`}
                  fill="url(#sweepFan)" opacity="0.65" />
                {/* Leading edge — bright crisp line */}
                <line x1="50" y1="50" x2={lx} y2={ly}
                  stroke={t.accent} strokeWidth="1" vectorEffect="non-scaling-stroke" opacity="0.55" />
              </>
            );
          })()}
        </g>
      </g>

      {/* outer reach glow — fades when dived OR when user zooms in close, so no yellow haze fills the screen.
          Follows the silhouette so the glow tracks the new disc shape. */}
      <path d={silhouettePathD(0.96)} fill="url(#discGrad)"
        opacity={dived ? 0 : Math.max(0, 1 - (userZoom - 1) * 1.4)}
        style={{ transition: 'opacity .4s' }} />

      {/* Astronomican — Emperor's lighthouse. Two layers:
            1. Big soft halo (clipped to the disc silhouette so it doesn't
               bleed out into deep space).
            2. A few faint concentric reach-rings at 0.25 / 0.45 / 0.65 of
               max radius so the gradient reads as "broadcast tower" rather
               than just a vignette.
          Whole group fades in on toggle. Visible at all zoom levels —
          this is meant to be a lore overlay, not chrome. */}
      <g opacity={astronomican ? 1 : 0}
         style={{ transition: 'opacity 0.6s ease-out' }}
         pointerEvents="none">
        <clipPath id="discClipAstro">
          <path d={silhouettePathD(1.0)} />
        </clipPath>
        <g clipPath="url(#discClipAstro)">
          {/* Outer warm halo — covers the whole disc, fades to the edge */}
          <circle cx="50" cy="50" r={maxOuter * 50} fill="url(#astronomicanGrad)" />
          {/* Reach rings */}
          {[0.25, 0.45, 0.65].map((rr, i) => (
            <circle key={rr} cx="50" cy="50" r={rr * 50}
              fill="none" stroke="#ffd070"
              strokeOpacity={0.18 - i * 0.04}
              strokeWidth="1" strokeDasharray="2 6"
              vectorEffect="non-scaling-stroke" />
          ))}
          {/* Bright pinprick at Terra itself */}
          <circle cx="50" cy="50" r="0.9" fill="#fff2c0" opacity="0.95">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="3.6s" repeatCount="indefinite" />
          </circle>
          <circle cx="50" cy="50" r="3.5" fill="none" stroke="#ffd560" strokeOpacity="0.5" strokeWidth="0.15" />
        </g>
      </g>      {/* concentric rings — crisp 1px regardless of zoom via vector-effect: non-scaling-stroke.
          Inner rings stay circular (they're inside every segmentum); the outer
          ring follows the silhouette so the edge of the disc reads as the
          actual segmentum boundary. */}
      <g opacity={dived ? 0 : 1} style={{ transition: 'opacity .8s' }}>
        {[0.18, 0.32, 0.5, 0.7].map((r) => (
          <circle key={r} cx="50" cy="50" r={r * 50}
            fill="none" stroke={t.grid} strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            strokeDasharray="3 5" />
        ))}
        {/* Outer dashed ring = the silhouette itself */}
        <path d={silhouettePathD(1.0)}
          fill="none" stroke={t.grid} strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          strokeDasharray="3 5" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
          // Radial spokes — extend to the silhouette at each angle so they
          // touch the edge of whichever segment they cross.
          const [x, y] = polar(segOuterAt(a) * 0.98, a);
          return <line key={a} x1="50" y1="50" x2={x} y2={y}
            stroke={t.grid} strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            strokeDasharray="2 6" />;
        })}
      </g>

      {/* Compass tick marks — every 5° on the silhouette edge, longer every 30°. Crisp 1px. */}
      <g opacity={dived ? 0 : 0.85} style={{ transition: 'opacity .8s' }}>
        {Array.from({ length: 72 }, (_, i) => i * 5).map((a) => {
          const major = a % 30 === 0;
          const edge = segOuterAt(a);
          // tick lives just inside the silhouette, between r0 (inner) and r1 (edge).
          const r0 = edge - (major ? 0.05 : 0.028);
          const r1 = edge - 0.006;
          const [x0, y0] = polar(r0, a);
          const [x1, y1] = polar(r1, a);
          return (
            <line key={a} x1={x0} y1={y0} x2={x1} y2={y1}
              stroke={t.primary} strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              opacity={major ? 0.85 : 0.4} />
          );
        })}
        {/* Degree labels at the four cardinals — sit just inside the silhouette */}
        {[
          { a: 0, txt: '000' }, { a: 90, txt: '090' },
          { a: 180, txt: '180' }, { a: 270, txt: '270' },
        ].map((m) => {
          const [x, y] = polar(segOuterAt(m.a) - 0.06, m.a);
          return (
            <text key={m.a} x={x} y={y} fill={t.primary} opacity="0.75"
              fontFamily={t.fontMono} fontSize="1.8" letterSpacing="0.15"
              textAnchor="middle" dominantBaseline="middle">{m.txt}</text>
          );
        })}
      </g>

      {/* segmentum wedges — the non-solar four. Solar's tiny central core is drawn separately below. */}
      {segs.filter((s) => s.id !== 'solar').map((s) => {
        const hovered = hoveredSeg === s.id;
        const isActive = s.id === divedSeg;
        // When dived, only the active wedge stays visible
        const visible = !dived || isActive;
        const clickable = !dived;
        // Fade the amber wedge fill as user zooms in — only the crisp stroke remains at high zoom.
        // Also zero the fill once dived so the screen isn't tinted yellow inside the segment.
        const zoomFade = Math.max(0, 1 - (userZoom - 1) * 1.4);
        const baseFill = dived ? 0 : (hovered ? 0.14 : 0.06) * zoomFade;
        return (
          <g key={s.id}
            opacity={visible ? 1 : 0}
            style={{ transition: 'opacity .8s' }}
            onMouseEnter={() => setHoveredSeg(s.id)}
            onMouseLeave={() => setHoveredSeg(null)}
            onClick={() => clickable && onDive(s.id)}>
            <path d={wedgePath(s.inner, s.outer, s.a0, s.a1)}
              fill={t.primary}
              fillOpacity={baseFill}
              stroke={t.stroke}
              strokeWidth={hovered ? 2 : 1}
              vectorEffect="non-scaling-stroke"
              style={{ cursor: clickable ? 'pointer' : 'default', transition: 'all 0.3s' }} />
            <path d={wedgePath(s.inner, s.inner + 0.005, s.a0, s.a1)}
              fill="none" stroke={t.primary} strokeOpacity="0.4" strokeWidth="1"
              vectorEffect="non-scaling-stroke" />
          </g>
        );
      })}

      {/* Sub-sector arcs — denser detail inside each segmentum */}
      <g opacity={dived ? 0.85 : 0.6} style={{ transition: 'opacity .8s' }}>
        {subs.map((ss, i) => {
          const visible = !dived || ss.seg === divedSeg;
          return (
            <g key={i} opacity={visible ? 1 : 0} style={{ transition: 'opacity .8s' }}>
              <path d={wedgePath(ss.r0, ss.r1, ss.a0, ss.a1)}
                fill="none" stroke={t.strokeFaint} strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                strokeDasharray="4 4" />
            </g>
          );
        })}
      </g>

      {/* Spiral arm centerlines — faint structural skeleton. Each arm
          point is clamped to the current segment's outer so arms don't
          spill past the new silhouette. */}
      <g opacity={dived ? 0 : 0.4} style={{ transition: 'opacity .8s' }}>
        {(window.SPIRAL_ARMS || []).map((arm, i) => {
          const d = arm.map((pt, j) => {
            const edgeR = segOuterAt(pt[1]);
            const r = Math.min(pt[0], edgeR);
            const [x, y] = polar(r, pt[1]);
            return `${j === 0 ? 'M' : 'L'} ${x} ${y}`;
          }).join(' ');
          return (
            <path key={i} d={d}
              fill="none" stroke={t.primary} strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              opacity="0.45" />
          );
        })}
      </g>

      {/* Background star density — parallax-lagged behind the disc for depth.
          Dimmed so foreground landmarks read clearly. */}
      <g transform={`translate(${parX} ${parY})`}>
        {bgStars.map((s, i) => {
          const visible = !dived || s.segId === divedSeg;
          if (!visible) return null;
          const [x, y] = polar(s.r, s.a);
          const c = s.faction === 'imperium' ? t.starColor
                  : s.faction === 'chaos'    ? '#ff8866'
                  : s.faction === 'xenos'    ? '#9be8b8'
                  : s.faction === 'necron'   ? '#b8e8d0'
                  : t.starColor;
          const dim = factionFilter !== 'all' && factionFilter !== s.faction && s.faction !== 'neutral';
          const op = dim ? 0.03 : (s.bright ? 0.6 : 0.16 + s.armBias * 0.35);
          const r = s.bright ? s.size * 0.28 : s.size * 0.22;
          return <circle key={i} cx={x} cy={y} r={r} fill={c} opacity={op} />;
        })}
        {/* Halo stars — sparse field BEYOND r=1.0 so the radar disc has no hard visible edge */}
        {!dived && (window.HALO_STARS || []).map((s, i) => {
          const [x, y] = polar(s.r, s.a);
          // Stable opacity (don't re-randomize on every render → no flicker)
          const op = s.bright ? 0.45 : 0.08 + (i % 7) * 0.012;
          const r = s.bright ? s.size * 0.26 : s.size * 0.20;
          return <circle key={`h-${i}`} cx={x} cy={y} r={r} fill={t.starColor} opacity={op} />;
        })}
      </g>

      {/* Nebulae — organic blooms built from stacked offset radial gradients. */}
      <g>
        {nebs.filter((n) => !n.isRift).map((n, i) => {
          const [cx, cy] = polar(n.r, n.a);
          const isWarp = n.type === 'warp';
          // Show only nebulae inside the dived segment (plus Eye of Terror as a fixed Obscurus feature).
          const inDivedSeg = divedSeg
            ? inSegment(n.r, n.a, window.SEGMENTUMS.find((s) => s.id === divedSeg))
            : true;
          const visible = !dived || inDivedSeg;
          // Seeded asymmetry so each nebula has its own shape
          let seed = (n.name.charCodeAt(0) + n.name.charCodeAt(1)) % 17;
          const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
          const sz = n.size;
          // Build a cluster of 5–7 offset puffs around the center.
          const puffCount = 5 + Math.floor(rnd() * 3);
          const puffs = Array.from({ length: puffCount }, () => {
            const ang = rnd() * Math.PI * 2;
            const dist = rnd() * sz * 0.55;
            return {
              dx: Math.cos(ang) * dist,
              dy: Math.sin(ang) * dist,
              r: sz * (0.55 + rnd() * 0.6),
              rx: 0.8 + rnd() * 0.5,
              ry: 0.8 + rnd() * 0.5,
              rot: rnd() * 360,
              op: 0.18 + rnd() * 0.22,
            };
          });
          const grad = isWarp ? 'url(#nebWarp)' : 'url(#nebForb)';
          // Warp anomalies render as a CARTOGRAPHIC NO-GO ZONE \u2014 a small
          // cluster of X interdiction marks (matching the main Cicatrix
          // grid), bounded by a dashed exclusion perimeter. Each X glitch-
          // flickers on its own clock, so the cluster pulses with unrest.
          const interdictionR = Math.min(sz * 0.7, 1.7);
          let xCluster = null;
          if (isWarp) {
            const xCount = 4 + Math.floor(rnd() * 3) + Math.floor(sz / 2.2);
            xCluster = [];
            // Place X marks pseudo-randomly inside the perimeter; bias
            // slightly outward so the cluster doesn't pile up at center.
            for (let k = 0; k < xCount; k++) {
              const ang = rnd() * Math.PI * 2;
              const distR = Math.sqrt(0.05 + rnd() * 0.85) * (interdictionR - 0.18);
              xCluster.push({
                dx: Math.cos(ang) * distR,
                dy: Math.sin(ang) * distR,
                scale: 0.26 + rnd() * 0.08,
                flickerBegin: rnd() * 7,
                flickerDur: 5 + rnd() * 4,
                op: 0.72 + rnd() * 0.18,
              });
            }
          }
          return (
            <g key={i} opacity={visible ? 1 : 0} style={{ transition: 'opacity .8s' }}>
              {/* Outer halo — huge, very faint, gives the bloom feel */}
              <ellipse cx={cx} cy={cy} rx={sz * 2.4} ry={sz * 2.0}
                fill={grad} opacity="0.18"
                transform={`rotate(${(seed * 17) % 60} ${cx} ${cy})`} />
              {/* Mid-cloud offset puffs — organic asymmetry */}
              {puffs.map((p, j) => (
                <ellipse key={j}
                  cx={cx + p.dx} cy={cy + p.dy}
                  rx={p.r * p.rx} ry={p.r * p.ry}
                  fill={grad}
                  opacity={p.op}
                  transform={`rotate(${p.rot} ${cx + p.dx} ${cy + p.dy})`} />
              ))}
              {/* Tighter inner cloud */}
              <circle cx={cx} cy={cy} r={sz * 0.75} fill={grad} opacity="0.55" />
              {/* Cartographic no-go zone: dashed exclusion perimeter +
                  cluster of X interdiction marks that share the rift's
                  visual language. The glow above sells the warp activity;
                  the X cluster names it as a chart-marked danger zone. */}
              {isWarp && (
                <g>
                  <circle cx={cx} cy={cy} r={interdictionR} fill="none"
                    stroke={t.danger} strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                    strokeDasharray="2 2.4" opacity="0.55" />
                  {xCluster.map((x, j) => (
                    <g key={j}
                       transform={`translate(${cx + x.dx} ${cy + x.dy}) scale(${x.scale})`}
                       opacity={x.op}>
                      <g stroke={t.danger} strokeWidth="0.14"
                         vectorEffect="non-scaling-stroke">
                        <line x1="-0.45" y1="-0.45" x2="0.45" y2="0.45" />
                        <line x1="-0.45" y1="0.45" x2="0.45" y2="-0.45" />
                        <animate attributeName="opacity"
                          values="1;1;0.1;1;1;0.45;1;1"
                          keyTimes="0;0.2;0.21;0.22;0.5;0.51;0.52;1"
                          dur={`${x.flickerDur}s`}
                          begin={`${x.flickerBegin}s`}
                          repeatCount="indefinite" />
                      </g>
                    </g>
                  ))}
                </g>
              )}
            </g>
          );
        })}
      </g>

      {/* Necron dynasty territories — translucent green zones with pyramid
          + hieroglyph glyphs. Render BEFORE the Cicatrix so the rift sits
          on top where they intersect. Each dynasty is a polygon (3+ pts)
          or corridor (2 pts) read from window.NECRON_DYNASTIES. */}
      <g opacity={dived ? 0.2 : 0.92} style={{ transition: 'opacity .8s' }}>
        {(window.NECRON_DYNASTIES || []).map((dyn, di) => {
          const pts = dyn.pts.map(([r, a]) => polar(r, a));
          if (pts.length < 2) return null;
          // Deterministic seeded RNG per dynasty so glyph placement is stable
          let seed = 7919 + di * 137;
          const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

          // Build the dynasty region shape + an `inside(px,py)` test for the
          // rune-grid sampler below. We support both corridor (2 pts) and
          // polygon (3+ pts) shapes.
          let pathD = '';
          let labelXY = pts[0];
          let bbMinX, bbMinY, bbMaxX, bbMaxY;
          let inside;

          if (pts.length === 2) {
            // Corridor: thick rounded capsule between p0 and p1
            const [p0, p1] = pts;
            const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
            const lenSq = Math.max(1e-6, dx * dx + dy * dy);
            const len = Math.sqrt(lenSq);
            const nx = -dy / len, ny = dx / len;   // unit normal
            const halfW = 3.8;
            const c0a = [p0[0] + nx * halfW, p0[1] + ny * halfW];
            const c0b = [p0[0] - nx * halfW, p0[1] - ny * halfW];
            const c1a = [p1[0] + nx * halfW, p1[1] + ny * halfW];
            const c1b = [p1[0] - nx * halfW, p1[1] - ny * halfW];
            pathD = `M ${c0a[0]} ${c0a[1]} L ${c1a[0]} ${c1a[1]} ` +
                    `A ${halfW} ${halfW} 0 0 1 ${c1b[0]} ${c1b[1]} ` +
                    `L ${c0b[0]} ${c0b[1]} ` +
                    `A ${halfW} ${halfW} 0 0 1 ${c0a[0]} ${c0a[1]} Z`;
            labelXY = [p0[0] + dx * 0.5 - ny * (halfW + 0.5),
                       p0[1] + dy * 0.5 + nx * (halfW + 0.5)];
            bbMinX = Math.min(p0[0], p1[0]) - halfW;
            bbMaxX = Math.max(p0[0], p1[0]) + halfW;
            bbMinY = Math.min(p0[1], p1[1]) - halfW;
            bbMaxY = Math.max(p0[1], p1[1]) + halfW;
            inside = (px, py) => {
              const tt = Math.max(0, Math.min(1,
                ((px - p0[0]) * dx + (py - p0[1]) * dy) / lenSq));
              const cx = p0[0] + tt * dx, cy = p0[1] + tt * dy;
              const ex = px - cx, ey = py - cy;
              return (ex * ex + ey * ey) <= halfW * halfW;
            };
          } else {
            // Polygon: smooth closed shape through control points using
            // quadratic beziers passing through edge midpoints.
            const n = pts.length;
            const mid = (i) => [(pts[i][0] + pts[(i + 1) % n][0]) / 2,
                                (pts[i][1] + pts[(i + 1) % n][1]) / 2];
            const start = mid(n - 1);
            pathD = `M ${start[0]} ${start[1]} `;
            for (let i = 0; i < n; i++) {
              const c = pts[i];
              const m = mid(i);
              pathD += `Q ${c[0]} ${c[1]} ${m[0]} ${m[1]} `;
            }
            pathD += 'Z';
            bbMinX = Infinity; bbMinY = Infinity; bbMaxX = -Infinity; bbMaxY = -Infinity;
            pts.forEach(([x, y]) => {
              if (x < bbMinX) bbMinX = x;
              if (y < bbMinY) bbMinY = y;
              if (x > bbMaxX) bbMaxX = x;
              if (y > bbMaxY) bbMaxY = y;
            });
            // Straight-polygon point-in-polygon (close enough to the
            // smoothed bezier shape for grid sampling).
            inside = (px, py) => {
              let ins = false;
              for (let i = 0, j = n - 1; i < n; j = i++) {
                const xi = pts[i][0], yi = pts[i][1];
                const xj = pts[j][0], yj = pts[j][1];
                const intersect = ((yi > py) !== (yj > py)) &&
                  (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
                if (intersect) ins = !ins;
              }
              return ins;
            };
            // Label: centroid
            let cx = 0, cy = 0;
            pts.forEach(([x, y]) => { cx += x; cy += y; });
            labelXY = [cx / n, cy / n];
          }

          // Rune pool — geometric Unicode glyphs that read at small sizes.
          const RUNES = ['☥', '⊕', '◈', '⌖', '⛤', '☉', '◬', '✦', '⚙', '✠', '☩'];

          // Build the rune grid — same step + scale as the Cicatrix X grid
          // so the density and flicker cadence match. Each cell is a single
          // rune that flickers on its own clock, exactly like the X marks.
          const stepX = 1.20, stepY = 1.20;
          const runeScale = 0.46;
          const gx0 = Math.floor(bbMinX / stepX) * stepX;
          const gy0 = Math.floor(bbMinY / stepY) * stepY;

          // Skip cells that fall under the dynasty name label so the text
          // isn't covered. Tuned to the label's typographic block.
          const lblHalfW = 5.5, lblHalfHTop = 0.9, lblHalfHBot = 2.3;
          const inLabel = (px, py) =>
            Math.abs(px - labelXY[0]) < lblHalfW
            && py > labelXY[1] - lblHalfHTop
            && py < labelXY[1] + lblHalfHBot;

          const runeCells = [];
          for (let gy = gy0; gy <= bbMaxY + 0.001; gy += stepY) {
            for (let gx = gx0; gx <= bbMaxX + 0.001; gx += stepX) {
              if (!inside(gx, gy)) continue;
              if (inLabel(gx, gy)) continue;
              runeCells.push({
                x: gx, y: gy,
                rune: RUNES[Math.floor(rnd() * RUNES.length)],
                op: 0.78 + rnd() * 0.18,
                glitchBegin: rnd() * 9,
                glitchDur: 6 + rnd() * 5,
              });
            }
          }

          const fc = dyn.color || '#5cd09a';
          return (
            <g key={dyn.id}>
              {/* Soft glow fill — kept as the green background */}
              <path d={pathD} fill={fc} opacity="0.07" />
              {/* Inner ring — solid thin */}
              <path d={pathD} fill="none" stroke={fc}
                strokeWidth="0.18" strokeOpacity="0.65"
                vectorEffect="non-scaling-stroke" />
              {/* Outer ring — dashed (geometric necron border) */}
              <path d={pathD} fill="none" stroke={fc}
                strokeWidth="0.14" strokeOpacity="0.85"
                strokeDasharray="1.2 0.6"
                vectorEffect="non-scaling-stroke">
                <animate attributeName="stroke-dashoffset"
                  from="0" to="-12" dur={`${22 + di * 4}s`} repeatCount="indefinite" />
              </path>

              {/* Regular rune grid — same size + flicker as the Cicatrix
                  X marks, but every cell carries a tomb-glyph. */}
              <g pointerEvents="none">
                {runeCells.map((c, i) => (
                  <text key={i}
                    x={c.x} y={c.y + runeScale * 0.36}
                    textAnchor="middle"
                    fill={fc}
                    fontSize={runeScale}
                    fontFamily="serif"
                    style={{ opacity: c.op }}>
                    {c.rune}
                    <animate attributeName="opacity"
                      values="1;1;0.1;1;1;0.45;1;1;0.75;1;1"
                      keyTimes="0;0.16;0.17;0.18;0.42;0.43;0.44;0.71;0.72;0.73;1"
                      dur={`${c.glitchDur}s`}
                      begin={`${c.glitchBegin}s`}
                      repeatCount="indefinite" />
                  </text>
                ))}
              </g>

              {/* Dynasty name */}
              <g transform={`translate(${labelXY[0]} ${labelXY[1]})`}>
                <text x="0" y="0" textAnchor="middle"
                  fill={fc} opacity="0.85"
                  fontFamily={t.fontMono} fontSize="1.05"
                  letterSpacing="0.22"
                  style={{ textTransform: 'uppercase' }}>
                  ⌖ {dyn.name.toUpperCase()} ⌖
                </text>
                <text x="0" y="1.4" textAnchor="middle"
                  fill={fc} opacity="0.45"
                  fontFamily={t.fontMono} fontSize="0.62"
                  letterSpacing="0.30">
                  NECRON · TOMB COMPLEX
                </text>
              </g>
            </g>
          );
        })}
      </g>

      {/* Tyranid Swarm zones — translucent PURPLE corridors/polygons marking
          Hive Fleet incursion volumes. Same geometry pipeline as Necron
          dynasties (corridor for 2 pts, smooth polygon for 3+), but with
          organic Tyranid glyphs (claws, spores, talons, eye-slits) tiled
          inside the region and a "HEAVY XENOS ACTIVITY" label. */}
      <g opacity={dived ? 0.2 : 0.92} style={{ transition: 'opacity .8s' }}>
        {(window.TYRANID_SWARMS || []).map((sw, si) => {
          const pts = sw.pts.map(([r, a]) => polar(r, a));
          if (pts.length < 2) return null;
          let seed = 3001 + si * 211;
          const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

          let pathD = '';
          let labelXY = pts[0];
          let bbMinX, bbMinY, bbMaxX, bbMaxY;
          let inside;

          if (pts.length === 2) {
            const [p0, p1] = pts;
            const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
            const lenSq = Math.max(1e-6, dx * dx + dy * dy);
            const len = Math.sqrt(lenSq);
            const nx = -dy / len, ny = dx / len;
            const halfW = 3.8;
            const c0a = [p0[0] + nx * halfW, p0[1] + ny * halfW];
            const c0b = [p0[0] - nx * halfW, p0[1] - ny * halfW];
            const c1a = [p1[0] + nx * halfW, p1[1] + ny * halfW];
            const c1b = [p1[0] - nx * halfW, p1[1] - ny * halfW];
            pathD = `M ${c0a[0]} ${c0a[1]} L ${c1a[0]} ${c1a[1]} ` +
                    `A ${halfW} ${halfW} 0 0 1 ${c1b[0]} ${c1b[1]} ` +
                    `L ${c0b[0]} ${c0b[1]} ` +
                    `A ${halfW} ${halfW} 0 0 1 ${c0a[0]} ${c0a[1]} Z`;
            labelXY = [p0[0] + dx * 0.5 - ny * (halfW + 0.5),
                       p0[1] + dy * 0.5 + nx * (halfW + 0.5)];
            bbMinX = Math.min(p0[0], p1[0]) - halfW;
            bbMaxX = Math.max(p0[0], p1[0]) + halfW;
            bbMinY = Math.min(p0[1], p1[1]) - halfW;
            bbMaxY = Math.max(p0[1], p1[1]) + halfW;
            inside = (px, py) => {
              const tt = Math.max(0, Math.min(1,
                ((px - p0[0]) * dx + (py - p0[1]) * dy) / lenSq));
              const cx = p0[0] + tt * dx, cy = p0[1] + tt * dy;
              const ex = px - cx, ey = py - cy;
              return (ex * ex + ey * ey) <= halfW * halfW;
            };
          } else {
            const n = pts.length;
            const mid = (i) => [(pts[i][0] + pts[(i + 1) % n][0]) / 2,
                                (pts[i][1] + pts[(i + 1) % n][1]) / 2];
            const start = mid(n - 1);
            pathD = `M ${start[0]} ${start[1]} `;
            for (let i = 0; i < n; i++) {
              const c = pts[i];
              const m = mid(i);
              pathD += `Q ${c[0]} ${c[1]} ${m[0]} ${m[1]} `;
            }
            pathD += 'Z';
            bbMinX = Infinity; bbMinY = Infinity; bbMaxX = -Infinity; bbMaxY = -Infinity;
            pts.forEach(([x, y]) => {
              if (x < bbMinX) bbMinX = x;
              if (y < bbMinY) bbMinY = y;
              if (x > bbMaxX) bbMaxX = x;
              if (y > bbMaxY) bbMaxY = y;
            });
            inside = (px, py) => {
              let ins = false;
              for (let i = 0, j = n - 1; i < n; j = i++) {
                const xi = pts[i][0], yi = pts[i][1];
                const xj = pts[j][0], yj = pts[j][1];
                const intersect = ((yi > py) !== (yj > py)) &&
                  (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
                if (intersect) ins = !ins;
              }
              return ins;
            };
            let cx = 0, cy = 0;
            pts.forEach(([x, y]) => { cx += x; cy += y; });
            labelXY = [cx / n, cy / n];
          }

          // Organic Tyranid glyph variants — drawn as small SVG paths so
          // they read as claws/spores/teeth, not as text glyphs.
          const stepX = 1.20, stepY = 1.20;
          const glyphScale = 0.50;
          const gx0 = Math.floor(bbMinX / stepX) * stepX;
          const gy0 = Math.floor(bbMinY / stepY) * stepY;
          const lblHalfW = 6.5, lblHalfHTop = 0.9, lblHalfHBot = 2.3;
          const inLabel = (px, py) =>
            Math.abs(px - labelXY[0]) < lblHalfW
            && py > labelXY[1] - lblHalfHTop
            && py < labelXY[1] + lblHalfHBot;

          const cells = [];
          for (let gy = gy0; gy <= bbMaxY + 0.001; gy += stepY) {
            for (let gx = gx0; gx <= bbMaxX + 0.001; gx += stepX) {
              if (!inside(gx, gy)) continue;
              if (inLabel(gx, gy)) continue;
              cells.push({
                x: gx, y: gy,
                variant: Math.floor(rnd() * 4),
                rot: Math.floor(rnd() * 4) * 90,
                op: 0.78 + rnd() * 0.18,
                glitchBegin: rnd() * 9,
                glitchDur: 6 + rnd() * 5,
              });
            }
          }

          const fc = sw.color || '#c97ad8';

          // Inline organic glyph renderer — 4 motifs at unit scale (~0.5).
          //   0: curved talon hook
          //   1: spore triad (3 dots in a triangle)
          //   2: tooth/fang
          //   3: eye-slit with pupil
          const Glyph = ({ v, color }) => {
            const sw2 = "0.085";
            if (v === 1) {
              // spore triad — small filled dots
              return (
                <g fill={color} stroke="none">
                  <circle cx="0" cy="-0.32" r="0.10" />
                  <circle cx="-0.28" cy="0.18" r="0.10" />
                  <circle cx="0.28"  cy="0.18" r="0.10" />
                  <circle cx="0"     cy="0"    r="0.05" opacity="0.7" />
                </g>
              );
            }
            if (v === 2) {
              // tooth / fang — curved triangle
              return (
                <g fill={color} stroke="none">
                  <path d="M -0.20 -0.36 Q 0 -0.40, 0.20 -0.36 Q 0.10 0.10, 0.00 0.42 Q -0.10 0.10, -0.20 -0.36 Z" />
                  <path d="M -0.04 -0.30 L 0.04 -0.30 L 0.02 -0.10 L -0.02 -0.10 Z" fill={color} opacity="0.55" />
                </g>
              );
            }
            if (v === 3) {
              // eye-slit — almond with central pupil
              return (
                <g fill="none" stroke={color} strokeWidth={sw2} vectorEffect="non-scaling-stroke">
                  <path d="M -0.40 0 Q 0 -0.30, 0.40 0 Q 0 0.30, -0.40 0 Z" />
                  <ellipse cx="0" cy="0" rx="0.08" ry="0.18" fill={color} stroke="none" />
                </g>
              );
            }
            // default v===0 — curved talon hook
            return (
              <g fill="none" stroke={color} strokeWidth="0.115" vectorEffect="non-scaling-stroke" strokeLinecap="round">
                <path d="M -0.36 0.40 C -0.42 -0.26, 0.32 -0.46, 0.42 0.38" />
                <line x1="0.42" y1="0.38" x2="0.26" y2="0.20" />
                <circle cx="-0.36" cy="0.40" r="0.06" fill={color} stroke="none" />
              </g>
            );
          };

          return (
            <g key={sw.id || `sw-${si}`}>
              {/* Soft purple bio-haze background */}
              <path d={pathD} fill={fc} opacity="0.09" />
              {/* Inner ring — solid thin */}
              <path d={pathD} fill="none" stroke={fc}
                strokeWidth="0.18" strokeOpacity="0.65"
                vectorEffect="non-scaling-stroke" />
              {/* Outer ring — irregular dash (organic feel, unlike Necron's geometry) */}
              <path d={pathD} fill="none" stroke={fc}
                strokeWidth="0.14" strokeOpacity="0.85"
                strokeDasharray="0.6 0.45 1.4 0.5"
                vectorEffect="non-scaling-stroke">
                <animate attributeName="stroke-dashoffset"
                  from="0" to="-14" dur={`${18 + si * 3}s`} repeatCount="indefinite" />
              </path>

              {/* Organic glyph grid — pulse / flicker like a living mass */}
              <g pointerEvents="none">
                {cells.map((c, i) => (
                  <g key={i}
                     transform={`translate(${c.x} ${c.y}) scale(${glyphScale}) rotate(${c.rot})`}
                     style={{ opacity: c.op }}>
                    <Glyph v={c.variant} color={fc} />
                    <animate attributeName="opacity"
                      values="1;1;0.15;1;1;0.5;1;1;0.8;1;1"
                      keyTimes="0;0.16;0.17;0.18;0.42;0.43;0.44;0.71;0.72;0.73;1"
                      dur={`${c.glitchDur}s`}
                      begin={`${c.glitchBegin}s`}
                      repeatCount="indefinite" />
                  </g>
                ))}
              </g>

              {/* Swarm name + "HEAVY XENOS ACTIVITY" subtitle */}
              <g transform={`translate(${labelXY[0]} ${labelXY[1]})`}>
                <text x="0" y="0" textAnchor="middle"
                  fill={fc} opacity="0.88"
                  fontFamily={t.fontMono} fontSize="1.05"
                  letterSpacing="0.22"
                  style={{ textTransform: 'uppercase' }}>
                  ◬ {(sw.name || 'TYRANID SWARM').toUpperCase()} ◬
                </text>
                <text x="0" y="1.4" textAnchor="middle"
                  fill={fc} opacity="0.55"
                  fontFamily={t.fontMono} fontSize="0.62"
                  letterSpacing="0.30">
                  HEAVY XENOS ACTIVITY · HIVE FLEET
                </text>
              </g>
            </g>
          );
        })}
      </g>

      {/* Cicatrix Maledictum — the Great Rift, drawn as an IMPERIAL CARTOGRAPHER'S
          NO-GO ZONE rather than a physical cloud. No boundary line — just a
          regular SORTED GRID of small "X" interdiction marks filling the
          corridor, with a few skull glyphs flickering in and out at sparse
          intervals between them. Individual X marks glitch-flicker at
          staggered times to suggest the chart's hololith is unstable here.
          INTERDICTED · CICATRIX MALEDICTUM labels run along the spine. */}
      {(() => {
        // 7 control points defining a 2-segment cubic bezier sweep.
        // Read from window.CICATRIX_PTS so the on-screen editor (Tweaks ▸
        // Edit Warps) can drag and persist them.
        const pts = (window.CICATRIX_PTS || []).map(([r, a]) => polar(r, a));
        const bezier = (p0, p1, p2, p3, tt) => {
          const u = 1 - tt;
          return [
            u * u * u * p0[0] + 3 * u * u * tt * p1[0] + 3 * u * tt * tt * p2[0] + tt * tt * tt * p3[0],
            u * u * u * p0[1] + 3 * u * u * tt * p1[1] + 3 * u * tt * tt * p2[1] + tt * tt * tt * p3[1],
          ];
        };
        const N = 60;
        const samplePts = [];
        for (let i = 0; i < N; i++) {
          const tt = i / (N - 1);
          if (tt < 0.5) samplePts.push(bezier(pts[0], pts[1], pts[2], pts[3], tt * 2));
          else samplePts.push(bezier(pts[3], pts[4], pts[5], pts[6], (tt - 0.5) * 2));
        }
        const frames = samplePts.map((p, i) => {
          const j = Math.min(samplePts.length - 1, i + 1);
          const q = samplePts[j === i ? Math.max(0, i - 1) : j];
          const sgn = j === i ? -1 : 1;
          const dx = (q[0] - p[0]) * sgn, dy = (q[1] - p[1]) * sgn;
          return { x: p[0], y: p[1], tanDeg: Math.atan2(dy, dx) * 180 / Math.PI };
        });

        let seed = 4242;
        const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

        // Corridor half-width envelope along t. Narrow at the ends, fat in
        // the middle. Tuned to read as a proper rift — the central mass
        // (around Macragge / east-of-Terra) needs body to be legible.
        const halfW = (tt) => 1.2 + Math.sin(Math.PI * tt) * 2.8 + Math.sin(Math.PI * tt * 2) * 0.6;

        // Build the two corridor boundary polylines — kept only as construction
        // geometry for the closing polygon at the end (not rendered).
        const corridor = (sign) => {
          let d = '';
          frames.forEach((f, i) => {
            const tt = i / (frames.length - 1);
            const w = halfW(tt) + (rnd() - 0.5) * 0.35;
            const rad = (f.tanDeg + 90) * Math.PI / 180;
            const px = f.x + Math.cos(rad) * w * sign;
            const py = f.y + Math.sin(rad) * w * sign;
            d += (i === 0 ? 'M ' : 'L ') + px.toFixed(3) + ' ' + py.toFixed(3) + ' ';
          });
          return d;
        };
        const northEdge = corridor(1);
        const southEdge = corridor(-1);

        // Build a closed polygon describing the corridor (north edge forward,
        // south edge back). Used as a MASK for the rigid grid below: a marker
        // is only drawn if it falls inside this polygon. That keeps the X grid
        // perfectly axis-aligned (columns and rows are global, not following
        // the spine curve).
        const polygon = [];
        frames.forEach((f, i) => {
          const tt = i / (frames.length - 1);
          const w = halfW(tt);
          const rad = (f.tanDeg + 90) * Math.PI / 180;
          polygon.push([f.x + Math.cos(rad) * w, f.y + Math.sin(rad) * w]);
        });
        for (let i = frames.length - 1; i >= 0; i--) {
          const tt = i / (frames.length - 1);
          const w = halfW(tt);
          const rad = (frames[i].tanDeg + 90) * Math.PI / 180;
          polygon.push([frames[i].x - Math.cos(rad) * w, frames[i].y - Math.sin(rad) * w]);
        }
        const pointInPoly = (px, py) => {
          let inside = false;
          for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i][0], yi = polygon[i][1];
            const xj = polygon[j][0], yj = polygon[j][1];
            const intersect = ((yi > py) !== (yj > py)) &&
              (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
          }
          return inside;
        };
        let bbMinX = Infinity, bbMinY = Infinity, bbMaxX = -Infinity, bbMaxY = -Infinity;
        polygon.forEach(([px, py]) => {
          if (px < bbMinX) bbMinX = px;
          if (py < bbMinY) bbMinY = py;
          if (px > bbMaxX) bbMaxX = px;
          if (py > bbMaxY) bbMaxY = py;
        });

        // 3 "INTERDICTED ZONE" labels along the spine. Each label can carry
        // its own vertical nudge (dy) so they don't sit ON the curve — the
        // middle one in particular is lifted a few units up. All labels are
        // axis-aligned (no rotation with the spine tangent) so the three
        // form a consistent typographic block.
        const labelDefs = [
          { tt: 0.18, dy: 0 },
          { tt: 0.50, dy: -4.0 },   // middle — bumped UP
          { tt: 0.82, dy: 0 },
        ];
        const labelStops = labelDefs.map((d) => d.tt);

        const labelZones = labelDefs.map((d) => {
          const idx = Math.floor(d.tt * (frames.length - 1));
          const f = frames[idx];
          return {
            x: f.x, y: f.y + d.dy,
            halfW: 7.4,
            halfHTop: 0.7,
            halfHBot: 1.8,
          };
        });
        const inAnyLabelZone = (px, py) => {
          for (const z of labelZones) {
            if (Math.abs(px - z.x) < z.halfW
                && py > z.y - z.halfHTop
                && py < z.y + z.halfHBot) return true;
          }
          return false;
        };

        // Per-variant grid parameters. All variants produce strictly aligned,
        // un-rotated X marks; variants differ only in spacing and lattice type.
        // markScale tunes the visual size of each X. Tuned up so the rift
        // reads as a strong feature, not a whisper.
        const variants = {
          'strict-square':       { stepX: 1.20, stepY: 1.20, brick: false, markScale: 0.46 },
          'strict-square-dense': { stepX: 0.90, stepY: 0.90, brick: false, markScale: 0.36 },
          'strict-brick':        { stepX: 1.10, stepY: 1.10, brick: true,  markScale: 0.42 },
          'triangular':          { stepX: 1.05, stepY: 0.91, brick: true,  markScale: 0.38 },
          'mega-dense':          { stepX: 0.62, stepY: 0.62, brick: false, markScale: 0.26 },
        };
        const V = variants[riftPattern] || variants['strict-square'];

        // Strict grid sweep over the bounding box.
        // Origin is locked to integer multiples of step so the lattice is
        // identical regardless of corridor shape — rows and columns line up
        // perfectly across the whole map.
        const markers = [];
        const gx0 = Math.floor(bbMinX / V.stepX) * V.stepX;
        const gy0 = Math.floor(bbMinY / V.stepY) * V.stepY;

        // Distance from any grid cell to the closest spine sample. Returns
        // both the raw distance and the halfW at that nearest spine point
        // so we can normalize: ratio = dist / halfW (0 at spine, 1 at edge).
        const nearestSpine = (px, py) => {
          let bestD2 = Infinity, bestI = 0;
          for (let i = 0; i < frames.length; i++) {
            const dx = px - frames[i].x, dy = py - frames[i].y;
            const d2 = dx * dx + dy * dy;
            if (d2 < bestD2) { bestD2 = d2; bestI = i; }
          }
          const tt = bestI / (frames.length - 1);
          return { dist: Math.sqrt(bestD2), halfW: halfW(tt) };
        };

        // Build the X grid \u2014 ALL valid cells (no slot pre-reservation).
        // RiftField below picks random consecutive runs at runtime to corrupt.
        const cellKey = (gx, gy) => `${gx.toFixed(4)}|${gy.toFixed(4)}`;
        // Row-keyed buckets so we can later carve consecutive "runs" of cells
        // for word placement \u2014 a run is a maximal sequence of grid cells in
        // the same row with no gap (label punch-out, polygon edge) between them.
        const rowsMap = new Map();
        let rowIdx = 0;
        for (let gy = gy0; gy <= bbMaxY + 0.001; gy += V.stepY) {
          const xOff = V.brick && (rowIdx % 2 === 1) ? V.stepX / 2 : 0;
          for (let gx = gx0 + xOff; gx <= bbMaxX + 0.001; gx += V.stepX) {
            if (!pointInPoly(gx, gy)) continue;
            if (inAnyLabelZone(gx, gy)) continue;
            // Distance-from-spine fade. Inner cells read at full strength;
            // the outer ring softly tapers but stays clearly visible.
            const ns = nearestSpine(gx, gy);
            const ratio = Math.min(1, ns.dist / Math.max(0.5, ns.halfW));
            const fade = Math.pow(1 - ratio, 1.2);
            const op = (0.90 + rnd() * 0.10) * (0.38 + 0.62 * fade);
            const cell = {
              x: gx, y: gy,
              key: cellKey(gx, gy),
              kind: 'x',
              scale: V.markScale * (0.85 + 0.15 * fade),
              op,
              glitchBegin: rnd() * 9,
              glitchDur: 6 + rnd() * 5,
            };
            markers.push(cell);
            const rk = gy.toFixed(4);
            if (!rowsMap.has(rk)) rowsMap.set(rk, []);
            rowsMap.get(rk).push(cell);
          }
          rowIdx++;
        }

        // Carve each row into runs of CONSECUTIVE cells. A break is anything
        // larger than ~1.6 grid steps \u2014 i.e. a label punch-out or a kink in
        // the polygon. Only runs of \u22655 cells qualify; shorter ones can't fit
        // a word and just clutter the random-pick pool.
        const runs = [];
        rowsMap.forEach((arr) => {
          arr.sort((a, b) => a.x - b.x);
          let start = 0;
          for (let i = 1; i <= arr.length; i++) {
            const broken = i === arr.length
              || (arr[i].x - arr[i - 1].x) > V.stepX * 1.6;
            if (broken) {
              if (i - start >= 5) runs.push(arr.slice(start, i));
              start = i;
            }
          }
        });

        // A FEW sparse skulls — placed deterministically along the spine at
        // wide intervals so they punctuate the grid rather than scatter through
        // it. Each fades in and out on its own slow clock.
        const skulls = [];
        const skullStops = [0.18, 0.40, 0.62, 0.86];
        skullStops.forEach((tt, i) => {
          const idx = Math.floor(tt * (frames.length - 1));
          const f = frames[idx];
          // tiny normal offset alternates either side of the spine
          const sign = i % 2 === 0 ? 1 : -1;
          const rad = (f.tanDeg + 90) * Math.PI / 180;
          const off = sign * 0.6;
          skulls.push({
            x: f.x + Math.cos(rad) * off,
            y: f.y + Math.sin(rad) * off,
            scale: 0.6,
            fadeBegin: rnd() * 6,
            fadeDur: 6 + rnd() * 4,
          });
        });

        // SVG skull glyph — a more iconic Imperial death's-head.
        // Wider cranium, distinct narrow jaw with stepped cheekbones,
        // hollow round eye sockets and a small triangular nasal cavity.
        // Built from a single filled path so it reads as a silhouette at
        // tiny sizes, with bg-coloured cutouts for the features.
        const Skull = ({ color }) => (
          <g>
            {/* skull silhouette: rounded cranium + stepped jaw */}
            <path d="
              M -0.42 -0.20
              C -0.42 -0.58, -0.22 -0.62,  0.00 -0.62
              C  0.22 -0.62,  0.42 -0.58,  0.42 -0.20
              L  0.42  0.08
              L  0.30  0.14
              L  0.28  0.30
              L  0.18  0.36
              L  0.08  0.30
              L  0.00  0.36
              L -0.08  0.30
              L -0.18  0.36
              L -0.28  0.30
              L -0.30  0.14
              L -0.42  0.08
              Z"
              fill={color} />
            {/* eye sockets — large, round, deep */}
            <circle cx="-0.18" cy="-0.16" r="0.13" fill={t.bg0} />
            <circle cx=" 0.18" cy="-0.16" r="0.13" fill={t.bg0} />
            {/* nasal cavity — narrow inverted triangle */}
            <path d="M -0.05 0.02 L 0.05 0.02 L 0 0.14 Z" fill={t.bg0} />
            {/* tiny tooth gap between jaw teeth */}
            <rect x="-0.02" y="0.18" width="0.04" height="0.14" fill={t.bg0} />
          </g>
        );

        return (
          <g opacity={dived ? 0.3 : 1} style={{ transition: 'opacity .8s' }}>
            {/* No boundary line, no wash — the X grid IS the zone. */}

            {/* X grid + dynamic corruption (replaces individual X marks with\n                grim words that glyph-cycle through occult symbols). */}
            <RiftField
              markers={markers}
              runs={runs}
              color={t.danger}
              fontFamily={t.fontMono}
              markScale={V.markScale} />

            {/* Sparse skulls placed deterministically along the spine, fading in/out */}
            {skulls.map((s, j) => (
              <g key={`sk-${j}`} transform={`translate(${s.x} ${s.y}) scale(${s.scale})`}>
                <Skull color={t.danger} />
                <animate attributeName="opacity"
                  values="0;0;0.85;0.85;0.2;0.9;0;0"
                  keyTimes="0;0.30;0.34;0.55;0.58;0.62;0.66;1"
                  dur={`${s.fadeDur}s`}
                  begin={`${s.fadeBegin}s`}
                  repeatCount="indefinite" />
              </g>
            ))}

            {/* INTERDICTED labels — all axis-aligned, smaller, consistent */}
            {labelDefs.map((d, i) => {
              const idx = Math.floor(d.tt * (frames.length - 1));
              const f = frames[idx];
              return (
                <g key={`lbl-${i}`} transform={`translate(${f.x} ${f.y + d.dy})`}>
                  <text x="0" y="0.15" fill={t.danger} opacity="0.72"
                    fontFamily={t.fontMono} fontSize="1.05"
                    letterSpacing="0.20"
                    textAnchor="middle"
                    style={{ textTransform: 'uppercase' }}>
                    ✠ INTERDICTED ZONE ✠
                  </text>
                  <text x="0" y="1.35" fill={t.danger} opacity="0.45"
                    fontFamily={t.fontMono} fontSize="0.65"
                    letterSpacing="0.28"
                    textAnchor="middle">
                    CICATRIX MALEDICTUM · M42.{(idx * 7 + 13) % 1000}
                  </text>
                  {/* Subtle text flicker */}
                  <animate attributeName="opacity"
                    values="1;1;0.2;1;1"
                    keyTimes="0;0.32;0.33;0.34;1"
                    dur={`${7 + i * 2}s`}
                    begin={`${i * 1.7}s`}
                    repeatCount="indefinite" />
                </g>
              );
            })}
          </g>
        );
      })()}

      {/* segmentum-solar core — fades when dived OR zoomed-in (no blur filter — scales crisp). */}
      <g opacity={dived ? 0 : Math.max(0, 1 - (userZoom - 1) * 1.2)} style={{ transition: 'opacity .4s' }}>
        <circle cx="50" cy="50" r={0.18 * 50} fill="none" stroke={t.stroke} strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <circle cx="50" cy="50" r="2.4" fill="url(#coreGlow)" />
        <circle cx="50" cy="50" r="1.1" fill={t.accent} opacity="0.4" />
        <circle cx="50" cy="50" r="0.55" fill={t.accent} />
      </g>

      {/* iconic landmark dots (Terra, Cadia, Macragge etc.) — hover-highlightable */}
      {landmarks.map((l) => {
        const [x, y] = polar(l.r, l.a);
        const c = window.FACTION_COLORS[l.faction] || t.primary;
        const showOK = factionFilter === 'all' || factionFilter === l.faction;
        // When dived, UltimaDetail draws every world in the Ultima segment
        // itself — including Macragge, Baal, Armageddon, T'au. Keeping the
        // landmark layer on too would double-stack rings at the same coord
        // (and double the orbiting pip count). Hide landmarks entirely in
        // dive mode.
        const visible = !dived;
        const hov = hoveredLandmark === l.id;
        // Pip count = number of recorded codex entries for this world.
        // Look up the matching Ultima world (if any) for its book count;
        // otherwise default to 1 pip.
        const match = (window.ULTIMA_WORLDS || []).find((w) => w.id === l.id);
        const dotCount = match && match.books ? match.books.length : 1;
        return (
          <g key={l.id}
            opacity={visible && showOK ? 1 : (!visible ? 0 : 0.18)}
            style={{ transition: 'opacity .6s', cursor: 'pointer' }}
            onMouseEnter={() => setHoveredLandmark && setHoveredLandmark(l.id)}
            onMouseLeave={() => setHoveredLandmark && setHoveredLandmark(null)}>
            {/* fat invisible hit area */}
            <circle cx={x} cy={y} r="1.6" fill="transparent" />
            <PlanetMarker x={x} y={y}
              faction={l.faction} kind={l.kind}
              color={c} accentColor={t.accent}
              iconScale={hov ? 0.60 : 0.50}
              ringR={0.95}
              dotCount={dotCount}
              hovered={hov}
              spinDur={18} />
          </g>
        );
      })}

      {/* Auspex ping — a slow expanding ring pulsing from the galactic core. */}
      {!dived && (
        <g opacity="0.6" pointerEvents="none">
          <circle cx="50" cy="50" r="0" fill="none"
            stroke={t.primary} strokeWidth="1" vectorEffect="non-scaling-stroke">
            <animate attributeName="r" from="0" to="48" dur="5.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0.3;0" dur="5.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="50" cy="50" r="0" fill="none"
            stroke={t.primary} strokeWidth="1" vectorEffect="non-scaling-stroke">
            <animate attributeName="r" from="0" to="48" dur="5.5s" begin="2.75s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0.3;0" dur="5.5s" begin="2.75s" repeatCount="indefinite" />
          </circle>
        </g>
      )}
    </svg>
  );
}

// ───────── Floating segmentum labels (outside the SVG, in screen space) ─────────
function SegmentumLabels({ theme, dived, divedSeg = null, factionFilter, hoveredSeg, setHoveredSeg, onDive }) {
  const t = theme;
  const segs = window.SEGMENTUMS;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {segs.map((s) => {
        const midA = s.id === 'solar' ? 0 : (s.a0 + s.a1) / 2;
        const midR = s.id === 'solar' ? 0 : (s.inner + s.outer) / 2 * 0.85;
        const [x, y] = polar(midR, midA);
        const isActive = s.id === divedSeg;
        const hovered = hoveredSeg === s.id;
        // When dived, only the active label remains — and we skip drawing it
        // here because the title bar / back button cover it in the corner.
        const visible = !dived || isActive;
        if (dived && isActive) {
          return null;
        }
        return (
          <div key={s.id}
            onMouseEnter={() => setHoveredSeg(s.id)}
            onMouseLeave={() => setHoveredSeg(null)}
            onClick={() => !dived && onDive(s.id)}
            style={{
              position: 'absolute', left: `${x}%`, top: `${y}%`,
              transform: 'translate(-50%,-50%)', pointerEvents: visible ? 'auto' : 'none',
              cursor: !dived ? 'pointer' : 'default',
              fontFamily: t.fontDisplay,
              color: t.primary,
              fontSize: s.id === 'solar' ? 11 : 14,
              letterSpacing: t.letterTitle,
              textTransform: 'uppercase',
              textAlign: 'center',
              textShadow: `0 0 12px ${t.primary}, 0 0 4px ${t.primary}`,
              opacity: visible ? (hovered ? 1 : 0.82) : 0,
              transition: 'opacity 0.6s, transform 0.6s',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}>
            <div style={{ fontSize: '0.6em', opacity: 0.65, marginBottom: 2 }}>SEGMENTUM</div>
            <div>{s.short}</div>
            {!dived && (
              <div style={{
                fontFamily: t.fontMono, fontSize: 9, letterSpacing: '0.2em',
                marginTop: 6, opacity: hovered ? 1 : 0.55,
                color: t.accent,
              }}>
                ▸ DIVE
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ───────── Landmark text labels (Terra, Cadia, Macragge, Eye of Terror) ─────────
function LandmarkLabels({ theme, factionFilter, dived, divedSeg = null, hoveredLandmark, setHoveredLandmark }) {
  const t = theme;
  const DecodedText = window.DecodedText;
  const PlanetTooltip = window.PlanetTooltip;
  // Friendly subtitle per landmark kind
  const kindSub = {
    throne: 'Throneworld of the Imperium',
    fortress: 'Fortress World',
    warp: 'Warp Anomaly',
    astartes: 'Astartes Homeworld',
    hive: 'Hive World',
    death: 'Death World',
    xenos: 'Xenos Domain',
  };
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {window.GALAXY_LANDMARKS.map((l) => {
        const [x, y] = polar(l.r, l.a);
        const c = l.faction === 'chaos' ? t.danger : (window.FACTION_COLORS[l.faction] || t.accent);
        const showOK = factionFilter === 'all' || factionFilter === l.faction;
        // Match GalacticDisc: when dived, UltimaDetail draws & labels every
        // Ultima world directly — so the landmark label layer hides entirely.
        const visible = !dived;
        const isHov = hoveredLandmark === l.id;
        return (
          <React.Fragment key={l.id}>
            <div
              onPointerEnter={() => setHoveredLandmark && setHoveredLandmark(l.id)}
              onPointerLeave={() => setHoveredLandmark && setHoveredLandmark(null)}
              style={{
                position: 'absolute', left: `${x}%`, top: `${y}%`,
                transform: 'translate(12px,-50%)',
                fontFamily: t.fontMono, color: c,
                fontSize: 9, letterSpacing: '0.18em',
                textShadow: `0 0 8px ${c}`,
                // Hide inline label on hover — tooltip takes over for legibility
                opacity: visible && showOK ? (isHov ? 0 : 0.92) : 0,
                transition: 'opacity 0.25s',
                whiteSpace: 'nowrap',
                pointerEvents: 'auto', cursor: 'pointer',
                padding: '2px 4px',
              }}>
              <span style={{ display: 'inline-block', width: 12, height: 1, background: c, verticalAlign: 'middle', marginRight: 4, opacity: 0.7 }} />
              {DecodedText ? <DecodedText text={l.name} active={false} /> : l.name}
            </div>
            {PlanetTooltip && (
              <PlanetTooltip theme={t}
                name={<DecodedText text={l.name} active={isHov} />}
                sub={kindSub[l.kind] || l.kind?.toUpperCase()}
                factionColor={c}
                x={x} y={y}
                visible={isHov && visible && showOK} />
            )}
          </React.Fragment>
        );
      })}
      {/* Nebula text labels (skip Eye of Terror — already labeled as a landmark) */}
      {window.NEBULAE.filter((n) => !n.isRift && n.name !== 'Eye of Terror').map((n, i) => {
        const [x, y] = polar(n.r, n.a);
        const inDivedSeg = divedSeg
          ? window.inSegment(n.r, n.a, window.SEGMENTUMS.find((s) => s.id === divedSeg))
          : true;
        const visible = !dived || inDivedSeg || n.name === 'Eye of Terror';
        return (
          <div key={i} style={{
            position: 'absolute', left: `${x}%`, top: `${y}%`,
            transform: 'translate(-50%, -50%)',
            fontFamily: t.fontDisplay, fontSize: 9,
            letterSpacing: '0.24em',
            color: n.type === 'warp' ? '#ffaa88' : '#aaccff',
            textShadow: `0 0 8px ${n.color}`,
            opacity: visible ? 0.75 : 0,
            transition: 'opacity 0.6s',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap', fontStyle: 'italic',
            textAlign: 'center',
            marginTop: n.size * 1.5,
          }}>{n.name}</div>
        );
      })}
      {/* Sub-sector text labels */}
      {window.SUB_SECTORS.map((ss, i) => {
        const midA = (ss.a0 + ss.a1) / 2;
        const midR = (ss.r0 + ss.r1) / 2;
        const [x, y] = polar(midR, midA);
        const visible = !dived || ss.seg === 'ultima';
        return (
          <div key={i} style={{
            position: 'absolute', left: `${x}%`, top: `${y}%`,
            transform: 'translate(-50%, -50%)',
            fontFamily: t.fontMono, fontSize: 7.5,
            letterSpacing: '0.28em',
            color: t.primary,
            opacity: visible ? 0.4 : 0,
            transition: 'opacity 0.6s',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap', fontStyle: 'italic',
          }}>{ss.name}</div>
        );
      })}
    </div>
  );
}

window.MechReticle = MechReticle;
window.FactionIcon = FactionIcon;
window.PlanetMarker = PlanetMarker;
window.GalacticDisc = GalacticDisc;
window.SegmentumLabels = SegmentumLabels;
window.LandmarkLabels = LandmarkLabels;
window.HUD = HUD;
window.CornerOrnament = CornerOrnament;
window.makeStars = makeStars;
window.polar = polar;
window.wedgePath = wedgePath;
