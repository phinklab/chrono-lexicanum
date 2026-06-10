import Link from "next/link";
import LiveTelemetry from "./LiveTelemetry";

/**
 * BottomConsole — fixed-bottom telemetry strip + optional 3 doorway cards.
 * Server component; embeds LiveTelemetry (client) for the drifting readouts.
 *
 * On the Hub, novelCountText is "{n} NOVELS · 7 ERAS · 5 SEGMENTA".
 */

type Doorway = {
  l: string;
  t: string;
  d: string;
  href: string;
};

type BottomConsoleProps = {
  withCards?: boolean;
  doorways?: Doorway[];
  novelCountText?: string;
  /**
   * If true, renders the doorway cards in a smaller/denser variant — used
   * on the Hub where a hero statement block above takes the visual weight
   * and the cards demote to secondary footer-navigation.
   */
  compactCards?: boolean;
};

const DEFAULT_DOORWAYS: Doorway[] = [
  {
    l: "ORACVLVM",
    t: "Ask the Archive",
    d: "Five questions. The cogitator tunes novels to your signal.",
    href: "/ask",
  },
  {
    l: "BIBLIOTHECA",
    t: "Books",
    d: "Browse the full novel catalogue — search, filter and sort by era, faction and format.",
    href: "/archive",
  },
  {
    l: "CARTOGRAPHIA",
    t: "Cartographer",
    d: "Every novel pinned to the world it haunts. Sweep five Segmenta.",
    href: "/map",
  },
];

export default function BottomConsole({
  withCards = true,
  doorways = DEFAULT_DOORWAYS,
  novelCountText = "NOVELS · 7 ERAS · 5 SEGMENTA",
  compactCards = false,
}: BottomConsoleProps) {
  const sect = ["I", "II", "III"];
  const rootCls = `bottom-console${compactCards ? " bottom-console--compact-cards" : ""}`;
  return (
    <div className={rootCls} aria-label="Archive console">
      <div className="bottom-console__strip">
        <span className="bottom-console__cog">
          <span className="c-pulse bottom-console__cog-dot" aria-hidden />
          <span className="bottom-console__cog-label">COGITATOR-1011</span>
        </span>
        <span className="bottom-console__dot">·</span>
        <LiveTelemetry
          label="VOLT"
          initial={4.72}
          min={4.2}
          max={5.2}
          unit=" kV"
          interval={1400}
          drift={0.06}
        />
        <span className="bottom-console__dot">·</span>
        <LiveTelemetry
          label="DRIFT"
          initial={0.012}
          min={-0.05}
          max={0.1}
          unit=""
          interval={1700}
          drift={0.18}
          decimals={3}
          color="var(--cl-gold)"
        />
        <span className="bottom-console__dot">·</span>
        <span className="bottom-console__index">{novelCountText}</span>
        <span className="bottom-console__stamp">· STAMP M42.347 ·</span>
      </div>

      {withCards && (
        <div className="bottom-console__cards">
          {doorways.map((c, i) => (
            <Link
              key={i}
              href={c.href}
              className="c-glass c-corners c-fade-in bottom-console__card"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="bottom-console__card-head">
                <span className="bottom-console__card-kicker">{c.l}</span>
                <span className="c-hairline bottom-console__card-rule" />
                <span className="bottom-console__card-sect">SECT-{sect[i] ?? `${i + 1}`}</span>
              </div>
              <div className="bottom-console__card-title">{c.t}</div>
              <div className="bottom-console__card-desc">{c.d}</div>
              <div className="bottom-console__card-foot">
                <span className="bottom-console__card-enter">ENTER →</span>
                <span className="bottom-console__card-kbd">⌘{i + 1}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
