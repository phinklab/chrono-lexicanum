/* ───────────────────────────────────────────────────────────────────────────
 * projection.js — pure timeline math for the Chronicle prototype lab.
 *
 * Everything attaches to window.TLP (Time-Line-Prototype). No React, no DOM.
 *
 * ENCODING CONVENTION (important).
 * `scripts/seed-data/eras.json` stores the Great Crusade start as 30798. Under
 * the Warhammer "798.M30" notation that only reconciles as
 *
 *        numeric = M * 1000 + year_within_M          ← eras.json convention
 *
 * (so 798.M30 → 30*1000+798 = 30798, 014.M31 → 31014, 012.M42 → 42012). This
 * is NOT the `(M-1)*1000+year` convention used by src/lib/m-scale.ts, and the
 * mismatch is exactly the "formatM 1000-year hazard" flagged in
 * src/lib/timeline.ts. The lab is *internally consistent* with eras.json:
 * every settingY here is `M*1000+year`, and `formatMScale` is the inverse that
 * yields the correct W40k label (`floor(n/1000)` for the millennium — no +1).
 * ─────────────────────────────────────────────────────────────────────────── */
(function () {
  "use strict";

  // Full span the ribbon brackets — a touch before the Great Crusade and a
  // touch after the Indomitus Era. Matches src/lib/timeline.ts.
  var TIMELINE_MIN = 30700; // 700.M30
  var TIMELINE_MAX = 42200; // 200.M42

  var clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  // Stable string hash → small int. Identical to src/lib/timeline.ts `hash`
  // so any per-book jitter is reproducible across reloads.
  function hash(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffffff;
    return h;
  }

  // ── M-scale ────────────────────────────────────────────────────────────
  // Inverse of the eras.json convention. 30798 → "798.M30", 31014 → "014.M31".
  function formatMScale(n) {
    var mil = Math.floor(n / 1000);
    var yr = Math.round(n - mil * 1000);
    return String(yr).padStart(3, "0") + ".M" + mil;
  }
  function formatRange(a, b) {
    var fa = formatMScale(a), fb = formatMScale(b);
    return fa === fb ? fa : fa + " – " + fb;
  }
  // Short label for axis ticks: when many ticks share a millennium we only
  // need the year; the millennium rides on the era header.
  function formatTickYear(n) {
    var yr = Math.round(n - Math.floor(n / 1000) * 1000);
    return String(yr).padStart(3, "0");
  }

  // ── parseChrono ──────────────────────────────────────────────────────────
  // Author-cleaned Lexicanum chronology → { startY, endY } in eras convention.
  // Accepts "004.M31", a range "004-014.M31" / "812-830.M41", or a bare "M32".
  function parseChrono(raw) {
    var s = String(raw || "").trim();
    var m;
    // range: "004-014.M31"  (also en-dash)
    m = s.match(/^(\d{1,3})\s*[-–]\s*(\d{1,3})\.M(\d{1,2})$/i);
    if (m) {
      var mil = parseInt(m[3], 10);
      return { startY: mil * 1000 + parseInt(m[1], 10), endY: mil * 1000 + parseInt(m[2], 10) };
    }
    // single: "004.M31"  ("s" decade suffix tolerated: "540s.M32")
    m = s.match(/^(\d{1,3})s?\.M(\d{1,2})$/i);
    if (m) {
      var mil2 = parseInt(m[2], 10);
      var y = mil2 * 1000 + parseInt(m[1], 10);
      return { startY: y, endY: y };
    }
    // bare millennium: "M32" → mid-millennium
    m = s.match(/^M(\d{1,2})$/i);
    if (m) {
      var y2 = parseInt(m[1], 10) * 1000 + 500;
      return { startY: y2, endY: y2 };
    }
    return { startY: null, endY: null };
  }

  // ── Era segmentation ──────────────────────────────────────────────────────
  // Take the raw eras.json rows and produce a CONTIGUOUS tiling that covers
  // TIMELINE_MIN..MAX with no holes, so every dated book maps to exactly one
  // segment. eras.json has gaps (M38–M40 has no era; the Great Crusade starts
  // at 30798, not at MIN). We swallow each gap into the adjacent earlier era:
  // an era's *display* span runs to (next era's start − 1); the first era
  // reaches down to MIN, the last up to MAX. Canonical bounds are kept on
  // `canonStart`/`canonEnd` for reference. This is a lab-only display choice —
  // eras.json itself is untouched.
  function buildLabEras(rawEras) {
    var sorted = rawEras.slice().sort(function (a, b) { return a.start - b.start; });
    var last = sorted.length - 1;
    return sorted.map(function (e, i) {
      var start = i === 0 ? TIMELINE_MIN : e.start;
      var end = i === last ? TIMELINE_MAX : sorted[i + 1].start - 1;
      return {
        id: e.id, name: e.name, tone: e.tone,
        start: start, end: end,
        canonStart: e.start, canonEnd: e.end,
      };
    });
  }

  // Allocate ribbon width per era ∝ (span)^0.22 — the dampened power curve
  // from src/lib/timeline.ts. Without it the 16-year Horus Heresy is crushed
  // to a sliver next to the 5000-year Long War; with it they read side by side.
  // Returns the eras with x0/x1 (0..1) attached, in chronological order.
  function buildEraSegments(eras) {
    var sorted = eras.slice().sort(function (a, b) { return a.start - b.start; });
    var DAMPEN = 0.22;
    var weights = sorted.map(function (e) { return Math.pow(Math.max(1, e.end - e.start), DAMPEN); });
    var total = weights.reduce(function (s, w) { return s + w; }, 0);
    var acc = 0;
    return sorted.map(function (e, i) {
      var w = weights[i] / total;
      var seg = Object.assign({}, e, { x0: acc, x1: acc + w });
      acc += w;
      return seg;
    });
  }

  // projector: settingY → x in 0..1 across the whole ribbon.
  function makeProjectY(eras) {
    var segs = buildEraSegments(eras);
    var fn = function (y) {
      if (y <= segs[0].start) return 0;
      if (y >= segs[segs.length - 1].end) return 1;
      for (var i = 0; i < segs.length; i++) {
        var s = segs[i];
        if (y >= s.start && y <= s.end) {
          var span = s.end - s.start;
          var t = span === 0 ? 0.5 : (y - s.start) / span;
          return s.x0 + t * (s.x1 - s.x0);
        }
      }
      return clamp((y - TIMELINE_MIN) / (TIMELINE_MAX - TIMELINE_MIN), 0, 1);
    };
    fn.segments = segs;
    return fn;
  }

  // Sub-axis projector for a single segment (zoomed-in view): linear within
  // [start,end] → 0..1. Nice round tick marks chosen by the era's span.
  function makeSubProject(era) {
    var span = era.end - era.start || 1;
    var fn = function (y) { return clamp((y - era.start) / span, 0, 1); };
    fn.ticks = niceTicks(era.start, era.end);
    return fn;
  }

  // Pick ~4–8 readable tick years across [a,b].
  function niceTicks(a, b) {
    var span = b - a;
    var steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000];
    var step = steps[steps.length - 1];
    for (var i = 0; i < steps.length; i++) {
      if (span / steps[i] <= 8) { step = steps[i]; break; }
    }
    var first = Math.ceil(a / step) * step;
    var out = [];
    for (var y = first; y <= b; y += step) out.push(y);
    // Guarantee the endpoints are represented.
    if (out.length === 0 || out[0] - a > step * 0.5) out.unshift(a);
    if (b - out[out.length - 1] > step * 0.5) out.push(b);
    return out;
  }

  window.TLP = {
    TIMELINE_MIN: TIMELINE_MIN,
    TIMELINE_MAX: TIMELINE_MAX,
    clamp: clamp,
    lerp: lerp,
    hash: hash,
    formatMScale: formatMScale,
    formatRange: formatRange,
    formatTickYear: formatTickYear,
    parseChrono: parseChrono,
    buildLabEras: buildLabEras,
    buildEraSegments: buildEraSegments,
    makeProjectY: makeProjectY,
    makeSubProject: makeSubProject,
    niceTicks: niceTicks,
  };
})();
