"use client";

/**
 * Index mode — the prototype's archive view as a React island (Brief 138):
 * era header + band, the horizontal era map (minimap) docked sticky above the
 * rows, events grouped per the era's view config (century / millennium /
 * flat), expandable rows with media chips, next-era footer.
 *
 * The gold view-cursor on the era map tracks which rows are on screen — that
 * stays imperative (scroll-driven, refs only); everything else is plain React
 * state. Like CinematicView, the component is remounted per era.
 */
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type {
  ChronicleEraData,
  ChronicleEvent,
} from "@/lib/chronicle/loadTimeline";
import EraBand from "./EraBand";
import MediaRows from "./MediaRows";
import { clamp, TIER_MARK } from "./shared";

interface EvGroup {
  label: string;
  suffix: string;
  idxs: number[];
}

/** Prototype `buildGroups`: grouping per era 'century' | 'millennium' | 'flat'. */
function groupEvents(era: ChronicleEraData): EvGroup[] {
  if (era.grouping === "millennium") {
    // merged eras (e.g. M32–34): y is years since 000.M<baseM>
    const map = new Map<number, number[]>();
    era.events.forEach((ev, i) => {
      const k = clamp(Math.floor(ev.y0 / 1000), 0, 9);
      const list = map.get(k);
      if (list) list.push(i);
      else map.set(k, [i]);
    });
    return [...map.keys()]
      .sort((a, b) => a - b)
      .map((k) => ({
        label: `M${(era.baseM ?? 0) + k}`,
        suffix: "",
        idxs: map.get(k)!,
      }));
  }
  if (era.grouping === "century") {
    const map = new Map<number, number[]>();
    era.events.forEach((ev, i) => {
      const c = Math.floor(ev.y0 / 100) * 100;
      const list = map.get(c);
      if (list) list.push(i);
      else map.set(c, [i]);
    });
    return [...map.keys()]
      .sort((a, b) => a - b)
      .map((c) => ({
        label: `${c}–${c + 99}`,
        suffix: `.${era.m}`,
        idxs: map.get(c)!,
      }));
  }
  return [
    {
      label: era.groupLabel || era.name,
      suffix: "",
      idxs: era.events.map((_, i) => i),
    },
  ];
}

interface IndexViewProps {
  era: ChronicleEraData;
  eras: ChronicleEraData[];
  eraIdx: number;
  entry: number;
  active: boolean;
  reduced: boolean;
  onEntryChange: (i: number) => void;
  onGotoEra: (era: number, idx: number) => void;
  onOpenCinematic: (i: number) => void;
}

export default function IndexView({
  era,
  eras,
  eraIdx,
  entry,
  active,
  reduced,
  onEntryChange,
  onGotoEra,
  onOpenCinematic,
}: IndexViewProps) {
  const N = era.events.length;
  const next = eraIdx < eras.length - 1 ? eras[eraIdx + 1] : null;
  const nextIdx = next ? eraIdx + 1 : 0;
  const groups = groupEvents(era);

  const scrollRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLElement | null)[]>([]);
  const [openIdx, setOpenIdx] = useState<number | null>(() => entry);

  const entryRef = useRef(entry);
  const reducedRef = useRef(reduced);
  useLayoutEffect(() => {
    entryRef.current = entry;
  }, [entry]);
  useLayoutEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);

  const mmY = useCallback(
    (year: number) => {
      const [a, b] = era.domain;
      return 1.5 + clamp((year - a) / (b - a), 0, 1) * 97; // % along the axis
    },
    [era.domain],
  );

  // an event's span on the map, in % — used by marks and the view cursor;
  // offscale rows pin at the axis top (prototype behavior)
  const mmSpan = useCallback(
    (ev: ChronicleEvent): [number, number] => {
      if (ev.offscale) return [0.5, 2];
      return [mmY(ev.y0), Math.max(mmY(ev.y1), mmY(ev.y0) + 0.6)];
    },
    [mmY],
  );

  // gold cursor on the era map — spans the events whose rows are on screen
  const updateMmView = useCallback(() => {
    const v = viewRef.current;
    const sc = scrollRef.current;
    if (!v || !sc) return;
    const mm = minimapRef.current;
    if (mm) {
      // backdrop only once the sticky map has docked and rows slide beneath
      const docked =
        mm.getBoundingClientRect().top <= sc.getBoundingClientRect().top + 1;
      mm.classList.toggle("scrolled", docked);
    }
    const mapH = minimapRef.current?.offsetHeight ?? 0;
    const topEdge = mapH + 8;
    const botEdge = sc.clientHeight - 8;
    let lo = Infinity;
    let hi = -Infinity;
    rowRefs.current.forEach((r, i) => {
      const evt = era.events[i];
      if (!r || !evt) return;
      const t = r.offsetTop - sc.scrollTop;
      const b = t + r.offsetHeight;
      if (b > topEdge && t < botEdge) {
        const [a, z] = mmSpan(evt);
        lo = Math.min(lo, a);
        hi = Math.max(hi, z);
      }
    });
    if (lo > hi) {
      v.style.opacity = "0";
      return;
    }
    v.style.opacity = "1";
    v.style.left = lo + "%";
    v.style.width = Math.max(hi - lo, 1.2) + "%";
  }, [era.events, mmSpan]);

  const openRow = useCallback(
    (i: number, scroll: boolean) => {
      setOpenIdx(i);
      onEntryChange(i);
      if (scroll) {
        const sc = scrollRef.current;
        const r = rowRefs.current[i];
        if (sc && r) {
          // centre the row in the viewport (its expanded detail unfolds into
          // the lower half) instead of parking it under the sticky era map
          sc.scrollTo({
            top: Math.max(
              0,
              r.offsetTop - Math.max(0, (sc.clientHeight - r.offsetHeight) / 2),
            ),
            behavior: reducedRef.current ? "auto" : "smooth",
          });
        }
      }
    },
    [onEntryChange],
  );

  // entering index mode opens the shared entry and scrolls it into view
  const prevActive = useRef(false);
  useEffect(() => {
    if (active && !prevActive.current) openRow(entryRef.current, true);
    prevActive.current = active;
  }, [active, openRow]);

  useLayoutEffect(() => {
    updateMmView();
  }, [updateMmView]);
  useEffect(() => {
    const onResize = () => updateMmView();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [updateMmView]);

  return (
    <section className="chron-archive" aria-label="Archive index">
      <div
        className="archive-bg"
        style={{ backgroundImage: `url("${era.cover}")` }}
      />
      <div className="archive-scroll" ref={scrollRef} onScroll={updateMmView}>
        <div className="arch-inner">
          <div className="arch-head">
            CHRONICA · INDEX TEMPORIS · <span>{N} ENTRIES</span>
          </div>

          <EraBand
            className="arch-band"
            eras={eras}
            activeIdx={eraIdx}
            onSelect={(i) => onGotoEra(i, 0)}
            ariaLabel="All eras"
          />

          <h1 className="arch-title">
            <span className="at-m">{era.m}</span>
            <span className="at-name">{era.name}</span>
          </h1>
          <p className="arch-sub">{era.sub}</p>

          <aside className="minimap" aria-label="Era map" ref={minimapRef}>
            <div className="mm-lab">
              {era.events.some((e) => e.offscale)
                ? "ERA MAP · DASHED = PRE-SCALE"
                : "ERA MAP"}
            </div>
            <div className="mm-frame">
              <div className="mm-axis" />
              <div className="mm-view" ref={viewRef} />
              {era.ticks.map((tk) => (
                <Fragment key={tk.label}>
                  <div className="mm-tick" style={{ left: mmY(tk.y) + "%" }} />
                  <div
                    className="mm-tick-lab"
                    style={{ left: mmY(tk.y) + "%" }}
                  >
                    {tk.label}
                  </div>
                </Fragment>
              ))}
              {era.events.map((evt, i) => {
                const frac =
                  (evt.y1 - evt.y0) / (era.domain[1] - era.domain[0]);
                const on = openIdx === i;
                const title = `${evt.title} · ${evt.dateLabel}`;
                if (!evt.offscale && frac >= 0.012) {
                  return (
                    <div
                      key={evt.id}
                      className={`mm-bar${evt.tier === "epoch" ? " epoch" : ""}${on ? " on" : ""}`}
                      style={{
                        left: mmY(evt.y0) + "%",
                        width: Math.max(mmY(evt.y1) - mmY(evt.y0), 1.4) + "%",
                      }}
                      title={title}
                      onClick={() => openRow(i, true)}
                    />
                  );
                }
                return (
                  <div
                    key={evt.id}
                    className={`mm-dot ${evt.tier}${evt.offscale ? " off" : ""}${on ? " on" : ""}`}
                    style={{
                      left: evt.offscale
                        ? "0.5%"
                        : mmY((evt.y0 + evt.y1) / 2) + "%",
                    }}
                    title={title}
                    onClick={() => openRow(i, true)}
                  />
                );
              })}
            </div>
          </aside>

          <div className="arch-body">
            <div className="arch-main">
              <div className="centuries">
                {groups.map((g) => (
                  <section className="century" key={g.label}>
                    <div className="century-head">
                      <span className="num">{g.label}</span>
                      {g.suffix ? (
                        <span className="suffix">{g.suffix}</span>
                      ) : null}
                      <span className="rule" />
                    </div>
                    {g.idxs.map((i) => {
                      const evt = era.events[i];
                      const open = openIdx === i;
                      return (
                        <article
                          key={evt.id}
                          className={`row${open ? " open" : ""}`}
                          ref={(el) => {
                            rowRefs.current[i] = el;
                          }}
                        >
                          <div
                            className="row-line"
                            onClick={() => {
                              if (open) setOpenIdx(null);
                              else openRow(i, false);
                            }}
                          >
                            <div className="row-title">
                              <span className={`tiermark ${evt.tier}`}>
                                {TIER_MARK[evt.tier]}
                              </span>
                              {evt.title}
                            </div>
                            <div className="row-date">{evt.dateLabel}</div>
                            <div className="row-snip">{evt.blurb}</div>
                            <div className="row-chev">›</div>
                          </div>
                          <div className="row-detail">
                            <div className="row-detail-inner">
                              <div className="row-detail-pad">
                                <p className="row-note">{evt.blurb}</p>
                                <div className="row-media">
                                  <MediaRows media={evt.media} />
                                </div>
                                <button
                                  type="button"
                                  className="open-cine"
                                  onClick={() => onOpenCinematic(i)}
                                >
                                  OPEN IN CINEMATIC →
                                </button>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </section>
                ))}
              </div>
              <button
                type="button"
                className="arch-next"
                onClick={() => onGotoEra(nextIdx, 0)}
              >
                <span className="an-lab">
                  {next ? "NEXT ERA" : "END OF THE CHRONICLE"}
                </span>
                <span className="an-name">
                  {next ? `${next.m} — ${next.name}` : "RETURN TO DEEP HISTORY"}
                </span>
                <span className="an-arrow">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
