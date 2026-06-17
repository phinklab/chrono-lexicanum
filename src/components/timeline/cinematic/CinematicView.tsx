"use client";

/**
 * Cinematic mode — the prototype's 3D rail + dossier view as a React island
 * (Brief 138). Interaction model ports from chronicle-app.js:
 *
 *   - a hidden scroll proxy (one snap section per event + terminus +
 *     overshoot) drives a target position `t`; a displayed position `vt`
 *     eases toward it so bg/rail motion stays smooth under scroll-snap jumps
 *   - per-frame styles (rail transforms, segment geometry, terminus
 *     crossfade) are written imperatively through refs — React state only
 *     carries the discrete bits (active entry, intro, wake, hint)
 *   - the era intro dolly (`enterTimeline`) sweeps the rail in from the
 *     horizon while CSS `.wake` draws the chrome
 *
 * The component is REMOUNTED per era (keyed by the stage), so `era`/`N` are
 * mount constants — the prototype's `loadEra` rebuild becomes a React mount.
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ChronicleEraData } from "@/lib/chronicle/loadTimeline";
import { ERA_ART_CREDITS } from "@/lib/chronicle/eraArtCredits";
import { EVENT_ART } from "@/lib/chronicle/eventArt";
import type { ArtCredit } from "@/lib/art-credits";
import ArtCreditTag from "@/components/chrome/ArtCreditTag";
import EraBand from "./EraBand";
import MediaRows from "./MediaRows";
import {
  clamp,
  DOT_R,
  pad3,
  roman,
  siteMenuOpen,
  TIER_MARK,
  TypedParagraph,
  useMediaQuery,
} from "./shared";

const SPACING = 140; // px between rail nodes (screen y)
const DEPTH = 420; // px z-recession per node
const PULL_MAX = 300; // wheel/touch distance to re-enter the previous era

interface CinematicViewProps {
  era: ChronicleEraData;
  eras: ChronicleEraData[];
  eraIdx: number;
  entry: number;
  active: boolean;
  wipeActive: boolean;
  reduced: boolean;
  onEntryChange: (i: number) => void;
  onGotoEra: (era: number, idx: number) => void;
}

export default function CinematicView({
  era,
  eras,
  eraIdx,
  entry,
  active,
  wipeActive,
  reduced,
  onEntryChange,
  onGotoEra,
}: CinematicViewProps) {
  const N = era.events.length;
  const prev = eraIdx > 0 ? eras[eraIdx - 1] : null;
  const next = eraIdx < eras.length - 1 ? eras[eraIdx + 1] : null;
  const nextIdx = next ? eraIdx + 1 : 0;

  const sectionRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const segRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lowerRef = useRef<HTMLDivElement>(null);
  const terminusRef = useRef<HTMLDivElement>(null);
  const terminusBtnRef = useRef<HTMLButtonElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const backPullRef = useRef<HTMLDivElement>(null);
  // per-event artwork overlay (EVENT_ART) — driven imperatively from an effect
  // so React re-renders never reset its crossfade; the last background stays on
  // the element while it fades out, then the era cover shows through again
  const bgEvRef = useRef<HTMLDivElement>(null);

  // target/displayed position — refs, written per scroll event / rAF frame
  const tRef = useRef({ t: entry, vt: entry });
  const rafRef = useRef<number | null>(null);
  const enterRafRef = useRef<number | null>(null);
  const lastTsRef = useRef(0);

  const [introOn, setIntroOn] = useState(() => entry === 0);
  const [introLeave, setIntroLeave] = useState(false);
  const [hintGone, setHintGone] = useState(() => entry > 0);
  const [wake, setWake] = useState(false);
  const [printNonce, setPrintNonce] = useState(0);

  const mobile = useMediaQuery("(max-width: 760px)");

  // prop/state mirrors for stable event handlers
  const entryRef = useRef(entry);
  const introOnRef = useRef(introOn);
  const wipeRef = useRef(wipeActive);
  const reducedRef = useRef(reduced);
  const mobileRef = useRef(mobile);
  const hintGoneRef = useRef(hintGone);
  useLayoutEffect(() => {
    entryRef.current = entry;
  }, [entry]);
  useLayoutEffect(() => {
    introOnRef.current = introOn;
  }, [introOn]);
  useLayoutEffect(() => {
    wipeRef.current = wipeActive;
  }, [wipeActive]);
  useLayoutEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);
  useLayoutEffect(() => {
    mobileRef.current = mobile;
  }, [mobile]);

  // ---------- per-frame rendering ----------

  const renderCine = useCallback(() => {
    const t = tRef.current.vt;
    const sp = SPACING * (mobileRef.current ? 0.6 : 1);
    const dz = DEPTH * (mobileRef.current ? 0.66 : 1);
    for (let i = 0; i < N; i++) {
      const n = nodeRefs.current[i];
      if (!n) continue;
      const d = i - t;
      const y = -d * sp;
      const z = -d * dz;
      let op: number;
      if (d < 0) op = clamp(1 + d * 0.7, 0, 1); // previous point lingers, gone before the camera plane
      else op = clamp(1 - Math.max(0, d - 3) * 0.3, 0.15, 1); // far future stays faintly visible
      n.style.transform = `translate3d(0, ${y}px, ${z}px)`;
      // fade/blur go on the children: opacity<1 or filter on the node itself
      // would flatten preserve-3d and break the connecting segments
      n.style.setProperty("--nop", op.toFixed(3));
      n.style.visibility = op <= 0.01 || z > 540 ? "hidden" : "visible";
      const blur = d < 0 ? Math.min(-d * 2, 6) : Math.max(0, d - 2) * 0.7;
      n.style.setProperty(
        "--nblur",
        (blur > 0.15 ? blur.toFixed(2) : 0) + "px",
      );
      // connecting segment — true 3D line from this point to the next
      if (i < N - 1) {
        const seg = segRefs.current[i];
        if (seg) {
          const d2 = i + 1 - t;
          const y2 = -d2 * sp;
          const z2 = -d2 * dz;
          const vy = y2 - y;
          const vz = z2 - z;
          const len = Math.sqrt(vy * vy + vz * vz);
          const ang = (Math.atan2(vz, vy) * 180) / Math.PI;
          const r1 = (DOT_R[era.events[i].tier] || 6) + 4;
          const r2 = (DOT_R[era.events[i + 1].tier] || 6) + 4;
          seg.style.height = Math.max(len - r1 - r2, 0).toFixed(1) + "px";
          seg.style.transform = `rotateX(${ang.toFixed(2)}deg) translateY(${r1.toFixed(1)}px)`;
          seg.style.opacity = String(
            d < 0
              ? clamp(1 + d * 0.75, 0, 1)
              : clamp(1 - Math.max(0, d - 1) * 0.22, 0.12, 1),
          );
        }
      }
    }
    // terminus crossfade — dossier hands off to the next-era panel
    const tt = clamp(t - (N - 1), 0, 1);
    if (terminusRef.current) {
      terminusRef.current.style.opacity = String(tt);
      terminusRef.current.style.visibility = tt <= 0.01 ? "hidden" : "visible";
    }
    if (terminusBtnRef.current) {
      terminusBtnRef.current.style.pointerEvents = tt > 0.5 ? "auto" : "none";
    }
    if (lowerRef.current) {
      lowerRef.current.style.opacity = String(1 - tt);
      lowerRef.current.style.visibility = tt >= 0.99 ? "hidden" : "visible";
    }
    if (fillRef.current) {
      fillRef.current.style.width =
        (N > 1 ? clamp(t / (N - 1), 0, 1) * 100 : 0) + "%";
    }
  }, [N, era.events]);

  // ease the displayed position toward the scroll target; scroll-snap can move
  // scrollTop a full viewport in one frame, which would make bg/rail motion jump
  const animateCine = useCallback(() => {
    if (reducedRef.current) {
      tRef.current.vt = tRef.current.t;
      renderCine();
      return;
    }
    if (rafRef.current) return;
    lastTsRef.current = performance.now();
    const step = (ts: number) => {
      const dt = Math.min((ts - lastTsRef.current) / 1000, 0.05);
      lastTsRef.current = ts;
      const d = tRef.current.t - tRef.current.vt;
      if (Math.abs(d) < 0.0015) {
        tRef.current.vt = tRef.current.t;
        renderCine();
        rafRef.current = null;
        return;
      }
      tRef.current.vt += d * (1 - Math.exp(-dt * 7));
      renderCine();
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, [renderCine]);

  const jumpCine = useCallback(
    (t: number) => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      tRef.current.t = t;
      tRef.current.vt = t;
      renderCine();
    },
    [renderCine],
  );

  // entrance dolly — dismissing the era intro pulls the camera in along the
  // rail while the chrome draws itself in via CSS (.wake)
  const wakeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const enterTimeline = useCallback(() => {
    if (reducedRef.current) return;
    if (enterRafRef.current) cancelAnimationFrame(enterRafRef.current);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setWake(true);
    clearTimeout(wakeTimer.current);
    wakeTimer.current = setTimeout(() => setWake(false), 2400);
    const target = tRef.current.t;
    const from = target - 3.2; // pulled back beyond the horizon
    const T = 1800;
    const t0 = performance.now();
    const ease = (x: number) => 1 - Math.pow(1 - x, 5); // easeOutQuint
    tRef.current.vt = from;
    renderCine();
    const step = (ts: number) => {
      // user scrolled mid-entrance — hand back to the normal easing pipeline
      if (tRef.current.t !== target) {
        enterRafRef.current = null;
        animateCine();
        return;
      }
      const p = clamp((ts - t0) / T, 0, 1);
      tRef.current.vt = from + (target - from) * ease(p);
      renderCine();
      enterRafRef.current = p < 1 ? requestAnimationFrame(step) : null;
    };
    enterRafRef.current = requestAnimationFrame(step);
  }, [animateCine, renderCine]);

  // cancel animation frames + timers on unmount (era change remounts)
  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (enterRafRef.current) cancelAnimationFrame(enterRafRef.current);
      clearTimeout(wakeTimer.current);
    },
    [],
  );

  // ---------- navigation ----------

  const goTo = useCallback((i: number) => {
    const sc = scrollRef.current;
    if (!sc) return;
    sc.scrollTo({
      top: i * sc.clientHeight,
      behavior: reducedRef.current ? "auto" : "smooth",
    });
  }, []);

  const onScroll = () => {
    const sc = scrollRef.current;
    if (!sc) return;
    const h = sc.clientHeight || 1;
    tRef.current.t = sc.scrollTop / h;
    animateCine();
    const idx = Math.round(tRef.current.t);
    if (idx !== entryRef.current && idx < N) onEntryChange(clamp(idx, 0, N - 1));
    if (!hintGoneRef.current && tRef.current.t > 0.15) {
      hintGoneRef.current = true;
      setHintGone(true);
    }
    // scrolling past the terminus = pressing the next-era banner
    if (tRef.current.t > N + 0.45 && !wipeRef.current) {
      onGotoEra(nextIdx, 0);
    }
  };

  // position the proxy on mount and whenever the view becomes active again
  // (mode switch lands directly on the entry without traveling through all)
  const prevActiveRef = useRef<boolean | null>(null);
  useLayoutEffect(() => {
    if (prevActiveRef.current === null || (active && !prevActiveRef.current)) {
      const sc = scrollRef.current;
      if (sc) sc.scrollTop = entryRef.current * sc.clientHeight;
      jumpCine(entryRef.current);
    }
    prevActiveRef.current = active;
  }, [active, jumpCine]);

  // keep position locked to the active event on resize / breakpoint flips
  useEffect(() => {
    const onResize = () => {
      const sc = scrollRef.current;
      if (!sc) return;
      sc.scrollTop = entryRef.current * sc.clientHeight;
      jumpCine(entryRef.current);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [jumpCine]);
  useEffect(() => {
    renderCine();
  }, [mobile, renderCine]);

  // per-event artwork overlay: crossfade the active event's own background
  // (EVENT_ART) in over the era cover, and back out when its slide is left.
  // Runs after paint so the opacity change animates (CSS transition on .bg-ev);
  // the background image is kept during fade-out so the artwork dissolves.
  useEffect(() => {
    const el = bgEvRef.current;
    if (!el) return;
    const active = N > 0 ? era.events[clamp(entry, 0, N - 1)] : null;
    const bg = active ? EVENT_ART[active.id]?.background ?? null : null;
    if (bg) {
      el.style.backgroundImage = `url("${bg}")`;
      el.style.opacity = "1";
    } else {
      el.style.opacity = "0";
    }
  }, [entry, era, N]);

  // ---------- era intro ----------

  const dismissIntro = useCallback(() => {
    if (!introOnRef.current) return;
    introOnRef.current = false;
    setIntroOn(false);
    setIntroLeave(true);
    setTimeout(() => setIntroLeave(false), reducedRef.current ? 0 : 880);
    // replay the dossier entrance underneath the lifting intro
    setPrintNonce((x) => x + 1);
    // and dolly the timeline in from the horizon
    enterTimeline();
  }, [enterTimeline]);

  const introTouchY = useRef<number | null>(null);

  // ---------- keyboard ----------

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (siteMenuOpen()) return;
      if (introOnRef.current) {
        if (["ArrowDown", "PageDown", "Enter", " ", "Escape"].includes(e.key)) {
          e.preventDefault();
          dismissIntro();
        }
        return;
      }
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        const cur = Math.round(tRef.current.t);
        if (cur >= N) onGotoEra(nextIdx, 0);
        else goTo(cur + 1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        const cur = Math.round(tRef.current.t);
        if (cur <= 0 && eraIdx > 0) {
          onGotoEra(eraIdx - 1, eras[eraIdx - 1].events.length - 1);
        } else goTo(Math.max(cur - 1, 0));
      } else if (e.key === "Home") {
        e.preventDefault();
        goTo(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goTo(N - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, N, eraIdx, eras, nextIdx, dismissIntro, goTo, onGotoEra]);

  // ---------- backscroll into the previous era ----------
  // pulling up (wheel / touch) at an era's first entry re-enters the previous
  // era at its final event — the mirror of scrolling past the terminus

  useEffect(() => {
    if (!active || eraIdx === 0) return;
    const section = sectionRef.current;
    let pull = 0;
    let pullTimer: ReturnType<typeof setTimeout> | undefined;
    const canPullBack = () =>
      !wipeRef.current &&
      !introOnRef.current &&
      (scrollRef.current?.scrollTop ?? 0) <= 1 &&
      !siteMenuOpen();
    const setPull = (v: number) => {
      pull = clamp(v, 0, PULL_MAX);
      backPullRef.current?.style.setProperty(
        "--p",
        (pull / PULL_MAX).toFixed(3),
      );
      if (pull >= PULL_MAX) {
        pull = 0;
        backPullRef.current?.style.setProperty("--p", "0");
        onGotoEra(eraIdx - 1, eras[eraIdx - 1].events.length - 1);
      }
    };
    const onWheel = (e: WheelEvent) => {
      if (!canPullBack() || e.deltaY >= 0) {
        if (pull) setPull(0);
        return;
      }
      setPull(pull - e.deltaY);
      clearTimeout(pullTimer);
      pullTimer = setTimeout(() => setPull(0), 700);
    };
    let touchY0: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      touchY0 = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchY0 == null || !canPullBack()) return;
      const dy = e.touches[0].clientY - touchY0;
      if (dy > 0) setPull(dy * 1.3);
    };
    const onTouchEnd = () => {
      touchY0 = null;
      setPull(0);
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    section?.addEventListener("touchstart", onTouchStart, { passive: true });
    section?.addEventListener("touchmove", onTouchMove, { passive: true });
    section?.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("wheel", onWheel);
      section?.removeEventListener("touchstart", onTouchStart);
      section?.removeEventListener("touchmove", onTouchMove);
      section?.removeEventListener("touchend", onTouchEnd);
      clearTimeout(pullTimer);
    };
  }, [active, eraIdx, eras, onGotoEra]);

  // ---------- render ----------

  const eraCredit = ERA_ART_CREDITS[era.id];

  if (N === 0) {
    return (
      <section ref={sectionRef} className="chron-cine">
        <div className="bg-stack">
          <div
            className="bg"
            style={{
              backgroundImage: `url("${era.cover}")`,
              opacity: 1,
              visibility: "visible",
            }}
          />
        </div>
        <div className="veil" />
        {eraCredit && <ArtCreditTag credit={eraCredit} />}
      </section>
    );
  }

  const ev = era.events[clamp(entry, 0, N - 1)];

  // Per-event artwork override (EVENT_ART): a listed event swaps both the
  // background (handled by the overlay effect above) and the credit for its
  // slide; everything else keeps the era cover and its credit.
  const eventArt = EVENT_ART[ev.id];
  const slideCredit: ArtCredit | null =
    eventArt?.credit ??
    (!ev.artCreditName && !ev.artCreditUrl ? eraCredit ?? null : null);

  return (
    <section
      ref={sectionRef}
      className={`chron-cine${wake ? " wake" : ""}${introOn ? " intro-hold" : ""}`}
      aria-label="Cinematic timeline"
    >
      {/* background — era cover underneath, with a per-event artwork override
          (EVENT_ART) crossfading over it for the length of that event's slide */}
      <div className="bg-stack">
        <div
          className={`bg${reduced ? "" : " kb"}`}
          style={{
            backgroundImage: `url("${era.cover}")`,
            opacity: 1,
            visibility: "visible",
          }}
        />
        <div ref={bgEvRef} className={`bg bg-ev${reduced ? "" : " kb"}`} />
      </div>
      <div className="veil" />

      <div
        className="cine-scroll"
        ref={scrollRef}
        onScroll={onScroll}
        aria-label="Timeline scroll"
      >
        {Array.from({ length: N + 2 }, (_, i) => (
          <div key={i} className="snap" />
        ))}
      </div>

      <header className="era-bar">
        <div className="row1">
          <span className="era-pos">
            ERA {roman(eraIdx + 1)}/{roman(eras.length)}
          </span>
          <span className="entry-count">
            ENTRY {roman(entry + 1)} / {roman(N)}
          </span>
        </div>
        <div className="era-rail">
          <div className="fill" ref={fillRef} />
        </div>
      </header>

      <EraBand
        className="cine-band"
        eras={eras}
        activeIdx={eraIdx}
        onSelect={(i) => onGotoEra(i, 0)}
        ariaLabel="All eras"
      />

      <div className="rail3d" aria-hidden="true">
        {era.events.map((evt, i) => (
          <div
            key={evt.id}
            className={`node ${evt.tier}${i === entry ? " on" : i < entry ? " past" : ""}`}
            ref={(el) => {
              nodeRefs.current[i] = el;
            }}
          >
            {i < N - 1 && (
              <div
                className="seg"
                ref={(el) => {
                  segRefs.current[i] = el;
                }}
              />
            )}
            <div className="ring" />
            <div
              className="dot"
              role="button"
              tabIndex={-1}
              onClick={() => goTo(i)}
            />
            <div className="nlab">{evt.dateLabel}</div>
          </div>
        ))}
      </div>

      {/* keyed remount per entry re-triggers the dossier entrance + typing */}
      <div
        className="cine-lower print"
        ref={lowerRef}
        key={`${entry}:${printNonce}`}
      >
        <aside className="dossier" aria-live="polite">
          <div className="d-kicker">
            <span className="d-stamp">ENTRY {pad3(entry + 1)}</span>
            <span className="d-date">{ev.dateLabel}</span>
            <span className="d-tier">
              {TIER_MARK[ev.tier]} {ev.tier.toUpperCase()}
              {ev.approx ? <span className="approx"> · APPROX.</span> : null}
            </span>
          </div>
          <h1 className="d-title">{ev.title}</h1>
          <TypedParagraph
            className="d-note"
            text={ev.blurb}
            delayMs={320}
            reduced={reduced}
          />
        </aside>
        <aside className="media-seg">
          <div className="m-label">LIBRARIVM — BOOKS &amp; PODCASTS</div>
          <div className="d-media-rows">
            <MediaRows media={ev.media} />
          </div>
        </aside>
      </div>

      <div className="terminus" ref={terminusRef}>
        <div className="t-kicker">ERA COMPLETE</div>
        <div className="t-era-done">
          {era.m} · {era.name}
        </div>
        <div className="t-rule" />
        <p className="t-tagline">
          {next ? next.tagline : "The chronicle ends here — for now."}
        </p>
        <button
          ref={terminusBtnRef}
          type="button"
          className="terminus-btn"
          onClick={() => onGotoEra(nextIdx, 0)}
        >
          <span className="tb-lab">{next ? "NEXT ERA" : "RETURN TO"}</span>
          <span className="tb-name">
            {next ? `${next.m} — ${next.name}` : "THE BEGINNING — DEEP HISTORY"}
          </span>
          <span className="tb-arrow">→</span>
        </button>
        <div className="t-scroll">SCROLL ON TO ENTER</div>
      </div>

      <div className={`scroll-hint${hintGone ? " gone" : ""}`}>
        SCROLL TO ADVANCE
      </div>

      <div className="back-pull" aria-hidden="true" ref={backPullRef}>
        <span className="bp-arrow">↑</span>
        <span className="bp-lab">PREVIOUS ERA</span>
        <span className="bp-name">{prev ? `${prev.m} — ${prev.name}` : ""}</span>
      </div>

      {/* artist attribution — reserved bottom-right slot. Precedence: an
          EVENT_ART override (its own artwork), then a per-event DB credit,
          then the era cover's credit (matching whichever bg is showing). */}
      {slideCredit ? (
        <ArtCreditTag credit={slideCredit} />
      ) : (
        <a
          className="art-credit"
          target="_blank"
          rel="noopener"
          {...(ev.artCreditUrl ? { href: ev.artCreditUrl } : {})}
        >
          <span className="ac-lab">ARTWORK</span>
          <span className="ac-name">
            {ev.artCreditName || "ADD ARTIST CREDIT"}
          </span>
        </a>
      )}

      <div className="grain" />

      {/* era intro — full-bleed opening whenever an era loads at its first entry */}
      <div
        className={`era-intro${introOn || introLeave ? " on" : ""}${introLeave ? " leave" : ""}`}
        onClick={dismissIntro}
        onWheel={(e) => {
          if (e.deltaY > 2) dismissIntro();
        }}
        onTouchStart={(e) => {
          introTouchY.current = e.touches[0].clientY;
        }}
        onTouchMove={(e) => {
          if (
            introTouchY.current != null &&
            introTouchY.current - e.touches[0].clientY > 36
          ) {
            introTouchY.current = null;
            dismissIntro();
          }
        }}
      >
        <div
          className="ei-bg"
          style={{ backgroundImage: `url("${era.cover}")` }}
        />
        <div className="ei-veil" />
        <div className="ei-content">
          <div className="ei-kicker">
            ERA {roman(eraIdx + 1)} · {era.m}
          </div>
          <h2 className="ei-name">{era.name}</h2>
          <div className="ei-rule" />
          {introOn || introLeave ? (
            <TypedParagraph
              className="ei-text"
              text={era.intro}
              delayMs={1150}
              reduced={reduced}
            />
          ) : (
            <p className="ei-text" />
          )}
        </div>
        <div className="ei-enter">CLICK OR SCROLL TO ENTER</div>
        {eraCredit && (
          // stopPropagation: a click on the credit links must not double as
          // the intro's dismiss tap
          <ArtCreditTag
            credit={eraCredit}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        <div className="ei-grain" />
      </div>
    </section>
  );
}
