// app.jsx — root. Control bar drives { zoomModel, layout, scope }; the stage
// renders the active shell. Hover/open events flow through TLPCtx (book-bits).
// Entrypoint: loaded last.

function Seg(props) {
  return (
    <div className="tlp-group">
      <div className="tlp-group-label">{props.label}</div>
      <div className="tlp-seg" role="group" aria-label={props.label}>
        {props.options.map(function (o) {
          return (
            <button key={o.v}
              className={"tlp-seg-btn" + (props.value === o.v ? " is-active" : "")}
              aria-pressed={props.value === o.v}
              onClick={function () { props.onChange(o.v); }}>
              {o.t}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function App() {
  const [zoomModel, setZoom] = useState("zoom");
  const [layout, setLayout] = useState("lanes");
  const [scope, setScope] = useState("all");
  const [openBook, setOpenBook] = useState(null);
  const [tip, setTip] = useState(null);

  const eras = useMemo(function () {
    return scope === "focus"
      ? window.HH.ERAS.filter(function (e) { return window.HH.FOCUS_ERAS.indexOf(e.id) >= 0; })
      : window.HH.ERAS;
  }, [scope]);

  const segments = useMemo(function () { return window.TLP.makeProjectY(eras).segments; }, [eras]);

  const visibleBooks = useMemo(function () {
    return scope === "focus"
      ? window.HH.books.filter(function (b) { return window.HH.FOCUS_ERAS.indexOf(b.segment) >= 0; })
      : window.HH.books;
  }, [scope]);

  const ctx = useMemo(function () {
    return {
      onHover: function (book, x, y) { setTip({ book: book, x: x, y: y }); },
      onLeave: function () { setTip(null); },
      onOpen: function (book) { setTip(null); setOpenBook(book); },
    };
  }, []);

  const shellKey = zoomModel + ":" + scope;
  let shell;
  if (zoomModel === "accordion") {
    shell = <AccordionShell key={shellKey} segments={segments} bySegment={window.HH.bySegment} eraById={window.HH.eraById} layout={layout} />;
  } else {
    shell = <ZoomInShell key={shellKey} segments={segments} bySegment={window.HH.bySegment} eraById={window.HH.eraById} layout={layout} />;
  }

  return (
    <TLPCtx.Provider value={ctx}>
      <div className="tlp-bg" aria-hidden="true">
        <div className="tlp-stars" /><div className="tlp-stars2" /><div className="tlp-grain" /><div className="tlp-vignette" />
      </div>
      <div className="tlp-root">
        <div className="tlp-bar">
          <div className="tlp-brand">
            <div className="tlp-brand-title">Chronicle</div>
            <div className="tlp-brand-sub">Timeline Prototype Lab</div>
          </div>
          <Seg label="Zoom model" value={zoomModel} onChange={setZoom}
               options={[{ v: "zoom", t: "Animated zoom-in" }, { v: "accordion", t: "Inline accordion" }]} />
          <Seg label="Book layout" value={layout} onChange={setLayout}
               options={[{ v: "lanes", t: "Series lanes" }, { v: "sequence", t: "Reading sequence" }]} />
          <Seg label="Scope" value={scope} onChange={setScope}
               options={[{ v: "all", t: "All eras" }, { v: "focus", t: "30th–31st focus" }]} />
          <div className="tlp-spacer" />
          <div className="tlp-count-badge">{visibleBooks.length} / {window.HH.total} books</div>
        </div>
        <div className="tlp-stage">{shell}</div>
      </div>
      <BookTooltip data={tip} />
      {openBook ? <BookPanel book={openBook} onClose={function () { setOpenBook(null); }} /> : null}
    </TLPCtx.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
