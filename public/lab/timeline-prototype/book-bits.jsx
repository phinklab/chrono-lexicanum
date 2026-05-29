// book-bits.jsx — shared book marker, tooltip + detail panel.
// Loaded FIRST among the .jsx files: it owns the single top-level hook
// destructure that every later babel script reuses (shared global scope —
// re-declaring `useState` in another file would throw). It also creates the
// context the layouts use to raise hover/open events up to <App>.

const { useState, useEffect, useRef, useMemo, useLayoutEffect, useCallback } = React;

const TLPCtx = React.createContext({ onHover: function () {}, onLeave: function () {}, onOpen: function () {} });

const FMT_LABEL = {
  novel: "Novel",
  novella: "Novella",
  short_story: "Short Story",
  anthology: "Anthology",
  collection: "Collection",
  omnibus: "Omnibus",
  audio_drama: "Audio Drama",
  artbook: "Art Book",
  scriptbook: "Script Book",
};

// ── BookNode ────────────────────────────────────────────────────────────────
// The atomic marker. Shape encodes format; dashed = approximate dating.
function BookNode(props) {
  const book = props.book;
  const ctx = React.useContext(TLPCtx);
  const ref = useRef(null);

  const report = function () {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    ctx.onHover(book, r.left + r.width / 2, r.top);
  };

  return (
    <button
      ref={ref}
      className={"tlp-node" + (book.settingYKind === "approx" ? " is-approx" : "")}
      aria-label={book.title + " — " + window.TLP.formatMScale(book.startY) + (book.settingYKind === "approx" ? " (approximate)" : "")}
      onMouseEnter={report}
      onFocus={report}
      onMouseLeave={ctx.onLeave}
      onBlur={ctx.onLeave}
      onClick={function (e) { e.stopPropagation(); ctx.onOpen(book); }}
    >
      <span className={"tlp-mark fmt-" + book.fmt} />
    </button>
  );
}

// ── BookTooltip ───────────────────────────────────────────────────────────
// Rendered once by <App> at a fixed viewport position.
function BookTooltip(props) {
  const t = props.data;
  if (!t) return null;
  const b = t.book;
  return (
    <div className="tlp-tooltip" style={{ left: t.x + "px", top: t.y + "px" }} role="tooltip">
      <div className="tlp-tt-title">{b.title}</div>
      <div className="tlp-tt-row">
        <span className="yr">{window.TLP.formatMScale(b.startY)}</span>
        {b.isRange ? <span className="yr">→ {window.TLP.formatMScale(b.endY)}</span> : null}
        <span>{FMT_LABEL[b.fmt] || b.fmt}</span>
        {b.settingYKind === "approx" ? <span className="ap">≈ approx</span> : null}
      </div>
      <div className="tlp-tt-row">
        <span>{b.authors.join(", ")}</span>
      </div>
    </div>
  );
}

// ── BookPanel ───────────────────────────────────────────────────────────────
// Detail drawer. ESC / backdrop close, focus trapped, focus restored on close.
function BookPanel(props) {
  const b = props.book;
  const onClose = props.onClose;
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const prevFocus = useRef(null);

  useEffect(function () {
    prevFocus.current = document.activeElement;
    if (closeRef.current) closeRef.current.focus();
    const onKey = function (e) {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key === "Tab") {
        const focusables = panelRef.current.querySelectorAll(
          'button, [href], input, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return function () {
      document.removeEventListener("keydown", onKey);
      if (prevFocus.current && prevFocus.current.focus) prevFocus.current.focus();
    };
  }, [b.id]);

  const era = window.HH.eraById[b.segment];
  const yearLabel = b.isRange
    ? window.TLP.formatMScale(b.startY) + " – " + window.TLP.formatMScale(b.endY)
    : window.TLP.formatMScale(b.startY);

  return (
    <React.Fragment>
      <div className="tlp-panel-backdrop" onClick={onClose} />
      <div className="tlp-panel" ref={panelRef} role="dialog" aria-modal="true" aria-label={b.title}>
        <button className="tlp-panel-close" ref={closeRef} onClick={onClose} aria-label="Close">✕</button>
        <div className="tlp-panel-cover">
          <span className="tlp-panel-aquila">⚜</span>
          <span className="tlp-panel-fmt">{FMT_LABEL[b.fmt] || b.fmt}</span>
        </div>
        <div className="tlp-panel-body">
          <div className="tlp-panel-kicker">{era ? era.name : ""}</div>
          <h2 className="tlp-panel-title">{b.title}</h2>
          <div className="tlp-panel-authors">{b.authors.join(" · ")}</div>

          <div className="tlp-panel-rows">
            <div className="tlp-panel-row">
              <span className="k">Setting</span>
              <span className="v">
                <span className="mono">{yearLabel}</span>
                {b.settingYKind === "approx" ? <span className="approx-flag">≈ approximate</span> : null}
              </span>
            </div>
            <div className="tlp-panel-row">
              <span className="k">Lexicanum</span>
              <span className="v"><span className="mono">{b.raw}</span></span>
            </div>
            <div className="tlp-panel-row">
              <span className="k">Series</span>
              <span className="v">{b.series}{b.book ? " · " + b.book : ""}</span>
            </div>
            <div className="tlp-panel-row">
              <span className="k">Reading №</span>
              <span className="v"><span className="mono">{String(b.seq).padStart(2, "0")}</span></span>
            </div>
          </div>

          <p className="tlp-panel-synopsis">
            <span className="stub">
              Synopsis not yet ingested. {b.title} is set in {yearLabel}
              {era ? " during the " + era.name : ""}
              {b.series ? ", part of the " + b.series + " sequence." : "."}
            </span>
          </p>
        </div>
      </div>
    </React.Fragment>
  );
}
