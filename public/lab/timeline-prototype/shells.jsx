// shells.jsx — the overview ribbon + two zoom models.
//   OverviewRibbon — the 3/7-era segmented ribbon (shared entry surface)
//   ZoomInShell    — primary: cross-dissolve "dive" from band → full segment
//   AccordionShell — bands share a row; one flex-grows open inline
// Hooks from book-bits.jsx (shared scope).

// ── OverviewRibbon ──────────────────────────────────────────────────────────
function OverviewRibbon(props) {
  const segments = props.segments;
  const bySegment = props.bySegment;
  const onPick = props.onPick;
  return (
    <div className="tlp-overview">
      <div className="tlp-overview-head">
        <div className="tlp-overview-kicker">Chronicle of the Imperium</div>
        <h1 className="tlp-overview-title">The Black Library, by Setting</h1>
      </div>
      <div className="tlp-ribbon">
        <div className="tlp-ribbon-axis" />
        {segments.map(function (seg, idx) {
          const items = bySegment[seg.id] || [];
          const empty = items.length === 0;
          const sub = window.TLP.makeSubProject(seg);
          const handlePick = empty ? undefined : function (e) { onPick(seg, e); };
          return (
            <div
              className={"tlp-era" + (empty ? " is-empty" : "")}
              key={seg.id}
              style={{ flexGrow: (seg.x1 - seg.x0) * 1000, animationDelay: (idx * 80) + "ms" }}
              onClick={handlePick}
              role={empty ? undefined : "button"}
              tabIndex={empty ? undefined : 0}
              onKeyDown={empty ? undefined : function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(seg, e); } }}
              aria-label={empty ? undefined : ("Descend into " + seg.name + ", " + items.length + " publications")}
            >
              <span className="tlp-era-bracket tl" />
              <span className="tlp-era-bracket tr" />
              <span className="tlp-era-bracket bl" />
              <span className="tlp-era-bracket br" />
              <div className="tlp-era-top">
                <div className="tlp-era-name">{seg.name}</div>
                <div className="tlp-era-range">{window.TLP.formatRange(seg.canonStart, seg.canonEnd)}</div>
              </div>
              <div className="tlp-era-pins">
                {items.map(function (b) {
                  return <span key={b.id} className={"tlp-pin" + (b.settingYKind === "approx" ? " is-approx" : "")}
                               style={{ left: (sub(b.startY) * 100) + "%" }} />;
                })}
              </div>
              <div className="tlp-era-count"><span className="n">{items.length}</span> {empty ? "—" : "books"}</div>
            </div>
          );
        })}
      </div>
      <div className="tlp-overview-hint">Select an era to descend into its chronology</div>
    </div>
  );
}

// ── ZoomInShell (primary) ─────────────────────────────────────────────────
function ZoomInShell(props) {
  const segments = props.segments;
  const bySegment = props.bySegment;
  const eraById = props.eraById;
  const layout = props.layout;

  const [sel, setSel] = useState(null);
  const [shown, setShown] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const stageRef = useRef(null);

  const pick = function (seg, e) {
    const stage = stageRef.current.getBoundingClientRect();
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin({
      x: ((r.left + r.width / 2 - stage.left) / stage.width) * 100,
      y: ((r.top + r.height / 2 - stage.top) / stage.height) * 100,
    });
    setSel(seg.id);
    setShown(false);
    requestAnimationFrame(function () { requestAnimationFrame(function () { setShown(true); }); });
  };
  const back = function () {
    setShown(false);
    setTimeout(function () { setSel(null); }, 480);
  };

  const era = sel ? eraById[sel] : null;
  const originStr = origin.x + "% " + origin.y + "%";
  const trans = "opacity .5s var(--ease), transform .55s var(--ease)";

  return (
    <div ref={stageRef} style={{ position: "absolute", inset: 0 }}>
      <div style={{
        position: "absolute", inset: 0, transition: trans, transformOrigin: originStr,
        opacity: sel ? 0 : 1, transform: sel ? "scale(1.07)" : "scale(1)",
        pointerEvents: sel ? "none" : "auto",
      }}>
        <OverviewRibbon segments={segments} bySegment={bySegment} onPick={pick} />
      </div>
      {era ? (
        <div style={{
          position: "absolute", inset: 0, transition: trans, transformOrigin: originStr,
          opacity: shown ? 1 : 0, transform: shown ? "scale(1)" : "scale(1.06)",
          pointerEvents: shown ? "auto" : "none",
        }}>
          <SegmentView era={era} books={bySegment[sel]} layout={layout} onBack={back} />
        </div>
      ) : null}
    </div>
  );
}

// ── AccordionShell ──────────────────────────────────────────────────────────
function AccordionShell(props) {
  const segments = props.segments;
  const bySegment = props.bySegment;
  const eraById = props.eraById;
  const layout = props.layout;

  const firstNonEmpty = useMemo(function () {
    const f = segments.filter(function (s) { return (bySegment[s.id] || []).length; })[0];
    return f ? f.id : segments[0].id;
  }, [segments]);
  const [open, setOpen] = useState(firstNonEmpty);

  return (
    <div className="tlp-accordion">
      {segments.map(function (seg) {
        const items = bySegment[seg.id] || [];
        const empty = items.length === 0;
        const isOpen = open === seg.id && !empty;
        return (
          <div key={seg.id}
               className={"tlp-acc-band" + (isOpen ? " is-open" : "") + (empty ? " is-empty" : "")}
               onClick={empty || isOpen ? undefined : function () { setOpen(seg.id); }}
               role={empty ? undefined : "button"}
               tabIndex={empty || isOpen ? undefined : 0}
               onKeyDown={empty || isOpen ? undefined : function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(seg.id); } }}
               aria-expanded={isOpen}
               aria-label={empty ? undefined : ("Expand " + seg.name + ", " + items.length + " publications")}>
            <div className="tlp-acc-spine">
              <span className="tlp-acc-name">{seg.name}</span>
              <span className="tlp-acc-count">{items.length}</span>
            </div>
            <div className="tlp-acc-inner">
              {isOpen ? <SegmentView era={eraById[seg.id]} books={items} layout={layout} compact={true} /> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
