/* ======================================================================
   RUNDE 9 — PRAXIS · Geteiltes Skript aller 07-Blätter.
   Enthält: Scroll-Scrim, Scroll-Reveal, Studio-Panel (Titelschrift-
   Dropdown inkl. Cormorant-Familien, Button-System, Grund-Farb-Picker
   mit Color-Wheel — Keys cl09), Button-HUD-Injektion (window.
   praxisDecorate für nachgeladene Inhalte wie die Kapelle), den
   Auspex-Zwillings-Bau (Port von MainAuspex.tsx — ohne Sweep-Zeiger,
   Ringe enger) und den Vox-Schreiber (Zeilen aus data-lines).
   Läuft als klassisches Skript am Body-Ende, vor dem Seiten-Skript.
   ====================================================================== */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Scroll-Scrim — Mechanik der Live-Site (ScrollScrim) ── */
  var scrim = document.getElementById("scrim");
  if (scrim) {
    var scrimUpdate = function () {
      var h = window.innerHeight * 0.9;
      scrim.style.opacity = Math.min(0.94, window.scrollY / h).toFixed(3);
    };
    window.addEventListener("scroll", scrimUpdate, { passive: true });
    scrimUpdate();
  }

  /* ── Studio-Panel — Runde 9: Keys auf cl09 gebumpt (Cinzel +
        Sternwarte + Live-Void greifen als Vorauswahl, alte Werte
        früherer Runden werden ignoriert). Markup wird hier gebaut,
        die Seiten tragen kein Panel-HTML mehr. ── */
  var FKEY = "cl09-titlefont";
  var BKEY = "cl09-btnstyle";
  var VKEY = "cl09-void";
  var VOID_DEFAULT = "#02030a";
  var FONTS = [
    { v: "cinzel", l: "Cinzel" },
    { v: "bodoni", l: "Bodoni Moda" },
    { v: "cormorant", l: "Cormorant" },
    { v: "cormorant-garamond", l: "Cormorant Garamond" },
    { v: "cormorant-infant", l: "Cormorant Infant" },
    { v: "cormorant-sc", l: "Cormorant SC" },
    { v: "cormorant-unicase", l: "Cormorant Unicase" }
  ];
  var BTNS = ["orrery", "chart", "sign", "still"];

  var panel = document.createElement("div");
  panel.className = "fontpick";
  panel.setAttribute("role", "group");
  panel.setAttribute("aria-label", "Studio");
  panel.innerHTML =
    '<div class="fp-row">' +
    '<span class="fp-lbl">Titelschrift</span>' +
    '<select id="fpFont" aria-label="Titelschrift"></select>' +
    "</div>" +
    '<div class="fp-row" role="group" aria-label="Schaltfläche">' +
    '<span class="fp-lbl">Schaltfläche</span>' +
    '<button type="button" data-b="orrery">Sternwarte</button>' +
    '<button type="button" data-b="chart">Sternkarte</button>' +
    '<button type="button" data-b="sign">Sternbild</button>' +
    '<button type="button" data-b="still">Still</button>' +
    "</div>" +
    '<div class="fp-row">' +
    '<span class="fp-lbl">Grund</span>' +
    '<input type="color" id="fpVoid" aria-label="Hintergrundfarbe">' +
    '<span class="fp-hex" id="fpHex"></span>' +
    '<button type="button" id="fpVoidReset">Reset</button>' +
    "</div>";
  document.body.appendChild(panel);

  /* Titelschrift-Dropdown */
  var fontSel = panel.querySelector("#fpFont");
  FONTS.forEach(function (f) {
    var o = document.createElement("option");
    o.value = f.v;
    o.textContent = f.l;
    fontSel.appendChild(o);
  });
  var applyFont = function (v) {
    if (v === "cinzel") {
      document.documentElement.removeAttribute("data-font");
    } else {
      document.documentElement.setAttribute("data-font", v);
    }
    fontSel.value = v;
  };
  var fstored = null;
  try { fstored = window.localStorage.getItem(FKEY); } catch (e) {}
  applyFont(fstored && FONTS.some(function (f) { return f.v === fstored; }) ? fstored : "cinzel");
  fontSel.addEventListener("change", function () {
    applyFont(fontSel.value);
    try { window.localStorage.setItem(FKEY, fontSel.value); } catch (e) {}
  });

  /* Button-System */
  var bstored = null;
  try { bstored = window.localStorage.getItem(BKEY); } catch (e) {}
  document.documentElement.setAttribute(
    "data-btn",
    bstored && BTNS.indexOf(bstored) > -1 ? bstored : "orrery"
  );
  var bbtns = panel.querySelectorAll("[data-b]");
  var bmark = function () {
    var cur = document.documentElement.getAttribute("data-btn");
    bbtns.forEach(function (b) {
      var on = b.getAttribute("data-b") === cur;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  };
  bbtns.forEach(function (b) {
    b.addEventListener("click", function () {
      document.documentElement.setAttribute("data-btn", b.getAttribute("data-b"));
      try { window.localStorage.setItem(BKEY, b.getAttribute("data-b")); } catch (e) {}
      bmark();
    });
  });
  bmark();

  /* Grund-Farb-Picker: setzt --void und leitet --void-2 ab (dieselbe
     Aufhellung wie #02030a → #06080f); alle Fades komponieren per
     color-mix aus --void und folgen automatisch. */
  var voidInput = panel.querySelector("#fpVoid");
  var voidHex = panel.querySelector("#fpHex");
  var voidReset = panel.querySelector("#fpVoidReset");
  var lift = function (hex) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.min(255, (n >> 16 & 255) + 4);
    var g = Math.min(255, (n >> 8 & 255) + 5);
    var b = Math.min(255, (n & 255) + 5);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };
  var applyVoid = function (hex, store) {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) hex = VOID_DEFAULT;
    hex = hex.toLowerCase();
    if (hex === VOID_DEFAULT) {
      document.documentElement.style.removeProperty("--void");
      document.documentElement.style.removeProperty("--void-2");
    } else {
      document.documentElement.style.setProperty("--void", hex);
      document.documentElement.style.setProperty("--void-2", lift(hex));
    }
    voidInput.value = hex;
    voidHex.textContent = hex;
    if (store) {
      try { window.localStorage.setItem(VKEY, hex); } catch (e) {}
    }
  };
  var vstored = null;
  try { vstored = window.localStorage.getItem(VKEY); } catch (e) {}
  applyVoid(vstored || VOID_DEFAULT, false);
  voidInput.addEventListener("input", function () { applyVoid(voidInput.value, true); });
  voidReset.addEventListener("click", function () { applyVoid(VOID_DEFAULT, true); });

  /* ── Button-HUD (.fx): Ringe (mit zwei Planeten — Runde 9, dezente
        Dauerbewegung), drei Vermessungspunkte, Sternbild. Global als
        window.praxisDecorate, damit Popups nachdekorieren können. ── */
  var decorate = function (root) {
    root.querySelectorAll(".btn").forEach(function (b) {
      if (b.querySelector(".fx")) return;
      var fx = document.createElement("span");
      fx.className = "fx";
      fx.setAttribute("aria-hidden", "true");
      fx.innerHTML =
        '<svg class="fx-rings" viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="0.8">' +
        '<g class="fr1"><circle cx="60" cy="60" r="56" pathLength="360" stroke-dasharray="0.5 5.5" stroke-opacity="0.8"/>' +
        '<circle cx="60" cy="4" r="1.5" fill="currentColor" stroke="none" opacity="0.9"/></g>' +
        '<g class="fr2"><circle cx="60" cy="60" r="41" stroke-dasharray="2 7" stroke-opacity="0.5"/>' +
        '<circle cx="101" cy="60" r="1.1" fill="currentColor" stroke="none" opacity="0.8"/></g>' +
        '<circle cx="60" cy="60" r="27" stroke-opacity="0.35"/>' +
        "</svg>" +
        '<i class="fx-star f1"></i><i class="fx-star f2"></i><i class="fx-star f3"></i>' +
        '<svg class="fx-const" viewBox="0 0 150 40" fill="none" stroke-width="0.7">' +
        '<polyline pathLength="1" points="8,30 38,12 66,22 102,8 138,26" stroke="currentColor" stroke-opacity="0.6"/>' +
        '<circle class="c1" cx="8" cy="30" r="1.6" fill="currentColor"/>' +
        '<circle class="c2" cx="38" cy="12" r="1.2" fill="currentColor"/>' +
        '<circle class="c3" cx="66" cy="22" r="1.5" fill="currentColor"/>' +
        '<circle class="c4" cx="102" cy="8" r="1.2" fill="currentColor"/>' +
        '<circle class="c5" cx="138" cy="26" r="1.8" fill="currentColor"/>' +
        "</svg>";
      b.appendChild(fx);
    });
  };
  window.praxisDecorate = decorate;
  decorate(document);

  /* ── Auspex-Zwillinge — Port von MainAuspex.tsx (Live-Hero-HUD).
        Ohne Sweep-Zeiger (Dauerurteil); die konzentrischen Ringe
        rücken in ein engeres Band (0.58–0.96 r statt 0.30–0.96 r) —
        Philipps Runde-9-Wunsch. Baut in jedes [data-auspex]. ── */
  var SVG = "http://www.w3.org/2000/svg";
  var el = function (name, attrs, parent) {
    var node = document.createElementNS(SVG, name);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  };
  var buildAuspex = function (host) {
    var size = parseInt(host.getAttribute("data-auspex"), 10) || 520;
    var r = size / 2;
    var svg = el("svg", {
      viewBox: -r + " " + -r + " " + size + " " + size,
      "aria-hidden": "true"
    });
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");

    /* Tick-Ring (dreht vorwärts) */
    var gA = el("g", { "class": "sp-a" }, svg);
    el("circle", { r: r * 0.96, "stroke-opacity": "0.55", "stroke-width": "0.5" }, gA);
    for (var i = 0; i < 72; i++) {
      var a = ((i * 5 - 90) * Math.PI) / 180;
      var long = i % 6 === 0;
      var r1 = r * 0.92;
      var r2 = r * (long ? 0.985 : 0.945);
      el("line", {
        x1: Math.cos(a) * r1, y1: Math.sin(a) * r1,
        x2: Math.cos(a) * r2, y2: Math.sin(a) * r2,
        "stroke-opacity": long ? "0.95" : "0.55",
        "stroke-width": long ? "1" : "0.5"
      }, gA);
    }

    /* Statische Ringe — enger gelegt als live (0.58/0.70/0.81/0.90) */
    [0.58, 0.70, 0.81, 0.90].forEach(function (f, idx) {
      el("circle", {
        r: r * f,
        "stroke-opacity": "0.32",
        "stroke-width": "0.5",
        "stroke-dasharray": idx === 2 ? "2 6" : "none"
      }, svg);
    });

    /* Punkte-Ring (dreht rückwärts) */
    var gB = el("g", { "class": "sp-b" }, svg);
    el("circle", { r: r * 0.74, "stroke-opacity": "0.32", "stroke-width": "0.4" }, gB);
    for (var d = 0; d < 16; d++) {
      var ad = (d / 16) * Math.PI * 2;
      el("circle", {
        cx: Math.cos(ad) * r * 0.74, cy: Math.sin(ad) * r * 0.74,
        r: "1.8", fill: "currentColor", stroke: "none", opacity: "0.75"
      }, gB);
    }

    /* Kardinal-Achsen + Peil-Labels */
    [0, 90, 180, 270].forEach(function (deg, idx) {
      var rad = ((deg - 90) * Math.PI) / 180;
      el("line", {
        x1: Math.cos(rad) * r * 0.45, y1: Math.sin(rad) * r * 0.45,
        x2: Math.cos(rad) * r * 0.90, y2: Math.sin(rad) * r * 0.90,
        "stroke-opacity": "0.32", "stroke-width": "0.6"
      }, svg);
      var t = el("text", {
        x: Math.cos(rad) * r * 1.02, y: Math.sin(rad) * r * 1.02,
        fill: "currentColor", stroke: "none",
        "font-size": "10.5", "text-anchor": "middle",
        "dominant-baseline": "middle", opacity: "0.8"
      }, svg);
      t.style.fontFamily = "var(--mono)";
      t.textContent = "·" + ["000", "090", "180", "270"][idx];
    });

    /* Zwei Peil-Bögen auf dem 0.90-Ring */
    var arc = function (radius, a0, a1) {
      var xy = function (ang) {
        var rad = ((ang - 90) * Math.PI) / 180;
        return [radius * Math.cos(rad), radius * Math.sin(rad)];
      };
      var p0 = xy(a0), p1 = xy(a1);
      var large = a1 - a0 > 180 ? 1 : 0;
      return "M " + p0[0] + " " + p0[1] + " A " + radius + " " + radius + " 0 " + large + " 1 " + p1[0] + " " + p1[1];
    };
    el("path", { d: arc(r * 0.90, -55, -25), "stroke-width": "1.5" }, svg);
    el("path", { d: arc(r * 0.90, 155, 195), "stroke-width": "1.2", opacity: "0.5" }, svg);

    /* Cogitator-Kern (dreht rückwärts, schneller) */
    var gC = el("g", { "class": "sp-c" }, svg);
    el("circle", { r: r * 0.175, "stroke-width": "0.5", opacity: "0.4" }, gC);
    el("circle", { r: r * 0.115, "stroke-opacity": "0.3", "stroke-width": "0.5", "stroke-dasharray": "2 5" }, gC);
    [45, 135, 225, 315].forEach(function (deg) {
      var rad = (deg * Math.PI) / 180;
      el("line", {
        x1: Math.cos(rad) * r * 0.085, y1: Math.sin(rad) * r * 0.085,
        x2: Math.cos(rad) * r * 0.175, y2: Math.sin(rad) * r * 0.175,
        "stroke-opacity": "0.6", "stroke-width": "0.8"
      }, gC);
    });
    el("circle", { r: "3", fill: "currentColor", stroke: "none", opacity: "0.7" }, gC);

    /* Kontakte im offenen Mittelfeld */
    [[0.34, -0.13, 0], [0.21, 0.24, 2.4], [-0.4, 0.16, 4.2], [0.46, -0.23, 6.1], [-0.27, -0.35, 7.7]].forEach(function (bl) {
      var bx = bl[0] * r, by = bl[1] * r;
      var g = el("g", { "class": "tw" }, svg);
      g.style.setProperty("--tw", bl[2] + "s");
      el("circle", { cx: bx, cy: by, r: "2.6", fill: "currentColor", stroke: "none" }, g);
      el("circle", { cx: bx, cy: by, r: "8", "stroke-opacity": "0.45", "stroke-width": "0.6" }, g);
    });

    host.appendChild(svg);
  };
  document.querySelectorAll("[data-auspex]").forEach(buildAuspex);

  /* ── Vox-Schreiber — Zeilen aus data-lines (JSON-Array) ── */
  var vox = document.getElementById("vox");
  if (vox && !reduce && vox.getAttribute("data-lines")) {
    var LINES = [];
    try { LINES = JSON.parse(vox.getAttribute("data-lines")); } catch (e) {}
    if (LINES.length) {
      var RAMP = [0.16, 0.3, 0.55];
      var li = 0;
      var rampUpdate = function () {
        var stable = Array.prototype.filter.call(vox.children, function (n) {
          return !n.classList.contains("out");
        });
        stable.forEach(function (n, i) {
          n.style.opacity = RAMP[RAMP.length - stable.length + i];
        });
      };
      var addLine = function () {
        var text = LINES[li % LINES.length];
        li++;
        Array.prototype.forEach.call(vox.querySelectorAll(".vox-caret"), function (c) {
          if (c.parentNode) c.parentNode.removeChild(c);
        });
        var line = document.createElement("div");
        line.className = "vox-line";
        var caret = document.createElement("span");
        caret.className = "vox-caret";
        line.appendChild(caret);
        vox.appendChild(line);
        var stable = Array.prototype.filter.call(vox.children, function (n) {
          return !n.classList.contains("out");
        });
        if (stable.length > 3) {
          var oldest = stable[0];
          oldest.classList.add("out");
          setTimeout(function () {
            if (oldest.parentNode) oldest.parentNode.removeChild(oldest);
          }, 1200);
        }
        rampUpdate();
        var ci = 0;
        var typeNext = function () {
          if (ci >= text.length) { setTimeout(addLine, 3600); return; }
          var ch = document.createElement("span");
          ch.className = "ch";
          ch.textContent = text.charAt(ci);
          line.insertBefore(ch, caret);
          ci++;
          setTimeout(typeNext, 34 + (ci % 3) * 14);
        };
        setTimeout(typeNext, 400);
      };
      setTimeout(addLine, 1600);
    }
  }

  /* ── Scroll-Reveal — einmalig, ruhig ── */
  var targets = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    targets.forEach(function (t) { t.classList.add("is-seen"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-seen");
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    targets.forEach(function (t) { io.observe(t); });
  }
})();
