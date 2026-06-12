/**
 * WordField — Latin/binary phrases scattered across the area; each phrase is
 * always readable but its characters flicker independently. Ambient bg on
 * Ask the Archive.
 *
 * Seeded LCG so the layout is deterministic — server-renderable.
 */

const CANT_PHRASES = [
  "AVGVSTO IMPERATOR",
  "DEVS · EX · MACHINA",
  "OMNISSIAH PROTEGE",
  "EX TENEBRIS · COGNITIO",
  "COGITATOR · ACTIVVS",
  "LIBERA NOS A MALO",
  "IMPERIVM AETERNVM",
  "MECHANICVM SACRA",
  "AVSPEX · MAXIMVS",
  "LECTIO PROFVNDA",
  "NEPHILIM NOCTIS",
  "PVRGATIO XENOS",
  "CHRONO LEXICANVM",
  "STAMP M42.347",
  "COGNITIO SANCTA",
  "EMPEROR PROTECTS",
  "0101 1110 0011",
  "1001 1100 0110",
  "1011 0001 0111",
];

type WordFieldProps = {
  count?: number;
  seed?: number;
  /** RGB triplet "r, g, b" for the phrase color (e.g. "201, 166, 90"). */
  color?: string;
  baseOpacity?: number;
};

export default function WordField({
  count = 22,
  seed = 11,
  color = "201,166,90",
  baseOpacity = 0.45,
}: WordFieldProps) {
  let s = seed >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };

  const motes = Array.from({ length: count }).map(() => ({
    phrase: CANT_PHRASES[Math.floor(rand() * CANT_PHRASES.length)],
    xPct: 2 + rand() * 78,
    yPct: 4 + rand() * 86,
    size: 14 + rand() * 22,
    baseDelay: rand() * 8,
    charStagger: 0.08 + rand() * 0.22,
    duration: 5 + rand() * 4,
    op: baseOpacity * (0.55 + rand() * 0.75),
    mono: rand() < 0.25,
  }));

  return (
    <div
      className="chrono-ambient"
      style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 2 }}
      aria-hidden
    >
      {motes.map((m, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${m.xPct}%`,
            top: `${m.yPct}%`,
            fontFamily: m.mono ? "var(--font-plex-mono)" : "var(--font-cinzel)",
            fontSize: m.size,
            color: `rgba(${color}, ${m.op})`,
            letterSpacing: "0.18em",
            whiteSpace: "nowrap",
            textShadow: "0 1px 6px rgba(0,0,0,0.9)",
          }}
        >
          {m.phrase.split("").map((ch, j) => (
            <span
              key={j}
              style={{
                display: "inline-block",
                opacity: 0,
                animation: `chronoLetter ${m.duration}s ${
                  m.baseDelay + j * m.charStagger
                }s ease-in-out infinite`,
              }}
            >
              {ch === " " ? " " : ch}
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}
