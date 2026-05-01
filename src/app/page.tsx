import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { Aquila } from "@/components/Aquila";
import { db } from "@/db/client";
import { works } from "@/db/schema";

/**
 * Hub — the entry route.
 *
 * Server component. Fetches a live count of novels in the archive on render
 * and folds it into the footer. Gracefully degrades to 0 if the DB is
 * unreachable, which is also the current ground truth (Phase 4 ingestion
 * hasn't run yet).
 */
async function getBookCount(): Promise<number> {
  try {
    const [row] = await db
      .select({ value: count() })
      .from(works)
      .where(eq(works.kind, "book"));
    return Number(row?.value ?? 0);
  } catch {
    return 0;
  }
}

const DOORWAYS = [
  {
    href: "/ask",
    kicker: "Oracle",
    title: "Ask the Archive",
    body: "Answer five questions. The cogitator returns novels tuned to your signal.",
    icon: <AskIcon />,
    delay: "160ms",
  },
  {
    href: "/timeline",
    kicker: "Chronology",
    title: "Chronicle",
    body: "Walk the Imperium's history from the Great Crusade to Indomitus.",
    icon: <TimelineIcon />,
    delay: "280ms",
  },
  {
    href: "/map",
    kicker: "Cartography",
    title: "Cartographer",
    body: "Every novel pinned to the world it haunts. Sweep across five Segmenta.",
    icon: <GalaxyIcon />,
    delay: "400ms",
  },
] as const;

export default async function HubPage() {
  const novelCount = await getBookCount();

  return (
    <main className="hub-main">
      <header className="hub-header">
        <p className="hub-eyebrow">
          <span aria-hidden>{"// Archive-Console"}</span>
          <span className="hub-eyebrow-dot" aria-hidden />
          <span aria-hidden>Cogitator online</span>
        </p>

        <div className="hub-aquila-wrap">
          <Aquila className="hub-aquila" size={140} />
        </div>

        <h1 className="hub-title">
          <span>Chrono</span>
          <span className="hub-title-sep" aria-hidden>◆</span>
          <span>Lexicanum</span>
        </h1>

        <p className="hub-sub">
          The 41st Millennium novel archive — by era, faction, world, and mood.
        </p>
      </header>

      <section className="hub-grid" aria-label="Archive tools">
        {DOORWAYS.map((d) => (
          <Link
            key={d.href}
            href={d.href}
            className="mode-tile"
            style={{ "--delay": d.delay } as React.CSSProperties}
          >
            <span className="mt-corner tl" aria-hidden />
            <span className="mt-corner tr" aria-hidden />
            <span className="mt-corner bl" aria-hidden />
            <span className="mt-corner br" aria-hidden />

            <div className="mt-icon" aria-hidden>{d.icon}</div>
            <div className="mt-body">
              <div className="mt-kicker">{d.kicker}</div>
              <h2 className="mt-title">{d.title}</h2>
              <p className="mt-desc">{d.body}</p>
            </div>
            <div className="mt-enter">
              Enter <span className="mt-arrow" aria-hidden>→</span>
            </div>
          </Link>
        ))}
      </section>

      <footer className="hub-footer">
        <div className="hub-footer-line">
          <span>Fan Archive</span>
          <span className="hub-dot" aria-hidden />
          <span>Non-Commercial</span>
          <span className="hub-dot" aria-hidden />
          <span>
            <strong>{novelCount}</strong> {novelCount === 1 ? "Novel" : "Novels"} Indexed
          </span>
          <span className="hub-dot" aria-hidden />
          <span>7 Eras</span>
          <span className="hub-dot" aria-hidden />
          <span>5 Segmenta</span>
        </div>
        <p className="hub-footer-fineprint">
          Unofficial fan project. Warhammer 40,000 © Games Workshop. No affiliation.
        </p>
      </footer>
    </main>
  );
}

/* ─── Inline SVG icons, ported from prototype Hub.jsx ──────────────────── */

function AskIcon() {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="40" cy="40" r="30" opacity="0.3" />
      <circle cx="40" cy="40" r="22" />
      <path d="M40 28 v12 M40 46 v2" strokeWidth="2" strokeLinecap="round" />
      <circle cx="28" cy="40" r="2" fill="currentColor" stroke="none" />
      <circle cx="52" cy="40" r="2" fill="currentColor" stroke="none" />
      <path
        d="M14 40 l-8 -4 M66 40 l8 -4 M40 14 l4 -8 M40 66 l-4 8"
        strokeWidth="1.2"
        opacity="0.5"
      />
    </svg>
  );
}

function TimelineIcon() {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1.2">
      <line x1="8" y1="40" x2="72" y2="40" strokeWidth="1.5" />
      <circle cx="18" cy="40" r="3" fill="currentColor" stroke="none" />
      <circle cx="32" cy="40" r="5" fill="currentColor" opacity="0.4" stroke="none" />
      <circle cx="32" cy="40" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="46" cy="40" r="3" fill="currentColor" stroke="none" />
      <circle cx="60" cy="40" r="4" fill="currentColor" opacity="0.4" stroke="none" />
      <circle cx="60" cy="40" r="2.5" fill="currentColor" stroke="none" />
      <line x1="18" y1="32" x2="18" y2="26" opacity="0.5" />
      <line x1="46" y1="48" x2="46" y2="54" opacity="0.5" />
      <text
        x="18"
        y="22"
        fontSize="6"
        fill="currentColor"
        opacity="0.6"
        textAnchor="middle"
        fontFamily="ui-monospace, monospace"
      >
        M31
      </text>
      <text
        x="46"
        y="62"
        fontSize="6"
        fill="currentColor"
        opacity="0.6"
        textAnchor="middle"
        fontFamily="ui-monospace, monospace"
      >
        M42
      </text>
    </svg>
  );
}

function GalaxyIcon() {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1.2">
      <ellipse cx="40" cy="40" rx="34" ry="14" opacity="0.25" />
      <ellipse cx="40" cy="40" rx="28" ry="12" opacity="0.3" transform="rotate(30 40 40)" />
      <ellipse cx="40" cy="40" rx="28" ry="12" opacity="0.3" transform="rotate(-30 40 40)" />
      <circle cx="40" cy="40" r="3" fill="currentColor" stroke="none" />
      <circle cx="22" cy="38" r="1.5" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="58" cy="42" r="1.5" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="40" cy="26" r="1.5" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="40" cy="54" r="1.5" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="28" cy="50" r="1" fill="currentColor" stroke="none" opacity="0.5" />
      <circle cx="52" cy="30" r="1" fill="currentColor" stroke="none" opacity="0.5" />
    </svg>
  );
}
