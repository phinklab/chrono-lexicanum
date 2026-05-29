// layouts.jsx — the two per-segment book layouts.
//   LayoutLanes    — one lane per series (standalones share a single lane);
//                    books that collide on the time axis collapse into an
//                    expandable "+N" cluster so a 50-book segment stays legible
//   LayoutSequence — numbered serpentine of reading order
// Hooks come from book-bits.jsx (shared scope). All consume <BookNode>.

// map sub-projection (0..1) into a padded track so edge columns don't clip
const padX = function (t) { return (4 + t * 92).toFixed(3) + "%"; };

// ── LayoutLanes ─────────────────────────────────────────────────────────────
// Greedy time-axis clustering. Within a lane, books are swept left→right; any
// run whose neighbours sit within MERGE_T of each other (and whose total span
// stays under SPAN_CAP) collapses into one cluster. A 1-book cluster renders as
// a plain marker; an N-book cluster renders as an expandable "+N" chip. This is
// what keeps a 50-book segment readable — Standalones share one lane, and dense
// runs (e.g. the twelve Beast-Arises novellas all at 544–546.M32) fold to a
// single chip instead of an unreadable pile.
const LANE_MERGE_T = 0.022; // ~2.2% of the track: roughly one marker + gap
const LANE_SPAN_CAP = 0.06; // a cluster never spans more than ~6% of the era

function clusterizeLane(items, sub) {
  const sorted = items.slice().sort(function (a, b) { return a.startY - b.startY || a.seq - b.seq; });
  const out = [];
  let cur = null;
  sorted.forEach(function (b) {
    const t = sub(b.startY);
    if (cur && (t - cur.lastT) <= LANE_MERGE_T && (t - cur.firstT) <= LANE_SPAN_CAP) {
      cur.items.push(b); cur.lastT = t;
    } else {
      cur = { firstT: t, lastT: t, items: [b] };
      out.push(cur);
    }
  });
  return out.map(function (c, i) {
    return { key: "c" + i + "-" + c.items[0].id, t: (c.firstT + c.lastT) / 2, items: c.items };
  });
}

// The "+N" chip. Reports its viewport rect upward so the popover can anchor
// outside the scroll-clipped lane track.
function LaneClusterChip(props) {
  const items = props.items;
  const ref = useRef(null);
  const first = items[0], last = items[items.length - 1];
  const range = first.startY === last.startY
    ? window.TLP.formatMScale(first.startY)
    : window.TLP.formatMScale(first.startY) + "–" + window.TLP.formatMScale(last.startY);
  const open = function (e) {
    e.stopPropagation();
    const r = ref.current.getBoundingClientRect();
    props.onOpenCluster(items, r.left + r.width / 2, r.top, r.bottom);
  };
  return (
    <button ref={ref}
            className={"tlp-cluster" + (props.active ? " is-active" : "")}
            aria-expanded={!!props.active}
            aria-label={items.length + " books, " + range + " — expand"}
            onClick={open}>
      <span className="tlp-cluster-dots" aria-hidden="true" />
      <span className="tlp-cluster-n">{items.length}</span>
    </button>
  );
}

function LayoutLanes(props) {
  const era = props.era;
  const books = props.books;
  const ctx = React.useContext(TLPCtx);
  const sub = useMemo(function () { return window.TLP.makeSubProject(era); }, [era.id]);

  const lanes = useMemo(function () {
    const m = new Map();
    books.forEach(function (b) {
      const key = b.series || "Standalones";
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(b);
    });
    const arr = Array.from(m.entries()).map(function (e) {
      const items = e[1].slice().sort(function (a, b) { return a.startY - b.startY || a.seq - b.seq; });
      return { series: e[0], items: items, min: items[0].startY, clusters: clusterizeLane(items, sub) };
    });
    // Standalones always sink to the bottom; real series sort by first appearance.
    arr.sort(function (a, b) {
      if (a.series === "Standalones") return 1;
      if (b.series === "Standalones") return -1;
      return a.min - b.min || a.series.localeCompare(b.series);
    });
    return arr;
  }, [books, sub]);

  // { items, x, top, bottom } captured from the chip's viewport rect, or null.
  const [pop, setPop] = useState(null);
  const openCluster = function (items, x, top, bottom) { setPop({ items: items, x: x, top: top, bottom: bottom }); };
  const closePop = function () { setPop(null); };

  useEffect(function () {
    if (!pop) return;
    const onKey = function (e) { if (e.key === "Escape") closePop(); };
    document.addEventListener("keydown", onKey);
    return function () { document.removeEventListener("keydown", onKey); };
  }, [pop]);

  return (
    <div className="tlp-lanes">
      <div className="tlp-lanes-axis">
        <div className="tlp-lanes-axis-pad" />
        <div className="tlp-lanes-axis-track">
          {sub.ticks.map(function (y, i) {
            return (
              <div className="tlp-tick" key={"lt" + i} style={{ left: padX(sub(y)) }}>
                <div className="tlp-tick-mark" />
                <div className="tlp-tick-label">{window.TLP.formatMScale(y)}</div>
              </div>
            );
          })}
        </div>
      </div>
      {lanes.map(function (lane) {
        return (
          <div className={"tlp-lane" + (lane.series === "Standalones" ? " is-standalones" : "")} key={lane.series}>
            <div className="tlp-lane-label" title={lane.series}>
              <span className="tlp-lane-name">{lane.series}</span>
              <span className="tlp-lane-count">{lane.items.length}</span>
            </div>
            <div className="tlp-lane-track">
              {lane.clusters.map(function (c) {
                return (
                  <span className="tlp-lane-node" key={c.key} style={{ left: padX(c.t) }}>
                    {c.items.length === 1
                      ? <BookNode book={c.items[0]} />
                      : <LaneClusterChip items={c.items}
                                         active={pop && pop.items === c.items}
                                         onOpenCluster={openCluster} />}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
      {pop ? <ClusterPopover data={pop} ctx={ctx} onClose={closePop} /> : null}
    </div>
  );
}

// Fixed-position list of the books inside an expanded cluster. Anchored to the
// chip's viewport rect (so it escapes the lane track's overflow), opens upward
// unless the chip sits high on the screen.
function ClusterPopover(props) {
  const d = props.data;
  const ctx = props.ctx;
  const openDown = d.top < 320;
  const style = openDown
    ? { left: d.x + "px", top: (d.bottom + 10) + "px", transform: "translateX(-50%)" }
    : { left: d.x + "px", top: (d.top - 10) + "px", transform: "translate(-50%,-100%)" };
  return (
    <React.Fragment>
      <div className="tlp-cluster-backdrop" onClick={props.onClose} />
      <div className={"tlp-cluster-pop" + (openDown ? " open-down" : "")} style={style} role="menu">
        <div className="tlp-cluster-pop-head">{d.items.length} publications</div>
        <div className="tlp-cluster-pop-list">
          {d.items.map(function (b) {
            return (
              <button className="tlp-cluster-pop-row" key={b.id} role="menuitem"
                      onClick={function (e) { e.stopPropagation(); props.onClose(); ctx.onOpen(b); }}>
                <span className={"tlp-mark fmt-" + b.fmt + (b.settingYKind === "approx" ? " is-approx-mark" : "")} />
                <span className="tlp-cluster-pop-title">{b.title}</span>
                <span className="tlp-cluster-pop-yr">{window.TLP.formatMScale(b.startY)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </React.Fragment>
  );
}

// ── LayoutSequence ──────────────────────────────────────────────────────────
function SeqCard(props) {
  const b = props.book;
  const ctx = React.useContext(TLPCtx);
  return (
    <button className="tlp-seq-node" style={{ animationDelay: (props.i * 22) + "ms" }}
            onClick={function () { ctx.onOpen(b); }}
            aria-label={b.title + " — reading order " + props.i}>
      <span className="tlp-seq-num">{String(b.seq).padStart(2, "0")}</span>
      <span className="tlp-seq-body">
        <span className="tlp-seq-title">{b.title}</span>
        <span className="tlp-seq-meta">
          {window.TLP.formatMScale(b.startY)}{b.settingYKind === "approx" ? " ≈" : ""} · {b.series}
        </span>
      </span>
    </button>
  );
}

function LayoutSequence(props) {
  const ordered = useMemo(function () {
    return props.books.slice().sort(function (a, b) { return a.seq - b.seq; });
  }, [props.books]);
  return (
    <div className="tlp-seq">
      <div className="tlp-seq-grid">
        {ordered.map(function (b, i) { return <SeqCard book={b} i={i + 1} key={b.id} />; })}
      </div>
    </div>
  );
}
