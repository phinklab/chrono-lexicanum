// segment-view.jsx — the zoomed-in view of one era segment.
// Hosts the header, the approximate-placement note, and the active layout.
// Shared by all three zoom shells; `compact` drops the big header for the
// accordion (whose spine already labels the band).

function renderLayout(layout, era, books) {
  if (!books.length) {
    return <div className="tlp-empty-seg">No dated publications recorded in this segment yet.</div>;
  }
  if (layout === "sequence") return <LayoutSequence era={era} books={books} />;
  return <LayoutLanes era={era} books={books} />;
}

function ApproxNote(props) {
  if (!props.count) return null;
  return (
    <div className="tlp-approx-note">
      <span className="glyph">≈</span>
      {props.count} of {props.total} placements are approximate — dashed markers; exact Lexicanum
      dating shown on each book.
    </div>
  );
}

function SegmentView(props) {
  const era = props.era;
  const books = props.books;
  const layout = props.layout;
  const approxCount = useMemo(function () {
    return books.filter(function (b) { return b.settingYKind === "approx"; }).length;
  }, [books]);

  if (props.compact) {
    return (
      <div className="tlp-segview" style={{ padding: "10px 18px 14px" }}>
        <ApproxNote count={approxCount} total={books.length} />
        <div className="tlp-layout-area">{renderLayout(layout, era, books)}</div>
      </div>
    );
  }

  return (
    <div className="tlp-segview">
      <div className="tlp-segview-head">
        {props.onBack ? (
          <button className="tlp-back" onClick={props.onBack} aria-label="Back to overview">
            ← <span>Overview</span>
          </button>
        ) : null}
        <div className="tlp-segview-titles">
          <div className="tlp-segview-kicker">Segment · {window.TLP.formatRange(era.canonStart, era.canonEnd)}</div>
          <h2 className="tlp-segview-title">{era.name}</h2>
          {era.tone ? <div className="tlp-segview-tone">{era.tone}</div> : null}
          <ApproxNote count={approxCount} total={books.length} />
        </div>
        <div className="tlp-segview-meta">
          <span className="n">{books.length}</span>
          {books.length === 1 ? "publication" : "publications"}
        </div>
      </div>
      <div className="tlp-layout-area">{renderLayout(layout, era, books)}</div>
    </div>
  );
}
