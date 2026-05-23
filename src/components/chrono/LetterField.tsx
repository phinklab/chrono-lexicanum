/**
 * LetterField — single Latin/binary glyphs scattered across a region, each
 * fading in/out on its own rhythm. Used as ambient bg on Ask the Archive.
 *
 * Seeded LCG so the layout is deterministic — server-renderable.
 */

const CANT_GLYPHS = (
  "AVGVSTO IMPERATOR DEVS EX MACHINA OMNISSIAH MECHANICVM EX TENEBRIS COGNITIO " +
  "EXTERMINATVS PVRGO LIBERA NOS COGITATOR AVSPEX SACRA SANCTVS NEPHILIM " +
  "NOCTIS XENOS PVRGATVS LECTIO PROFVNDA · 0101 1110 0011 1001"
).split("");

type LetterFieldProps = {
  count?: number;
  area?: { w: number; h: number };
  seed?: number;
  color?: string;
  baseOpacity?: number;
};

export default function LetterField({
  count = 60,
  area = { w: 1440, h: 900 },
  seed = 7,
  color = "var(--cl-gold)",
  baseOpacity = 0.3,
}: LetterFieldProps) {
  let s = seed >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };

  const motes = Array.from({ length: count }).map(() => ({
    x: rand() * area.w,
    y: rand() * area.h,
    ch: CANT_GLYPHS[Math.floor(rand() * CANT_GLYPHS.length)],
    size: 10 + rand() * 22,
    delay: rand() * 8,
    duration: 4 + rand() * 6,
    op: baseOpacity * (0.4 + rand() * 0.9),
  }));

  return (
    <div
      style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}
      aria-hidden
    >
      {motes.map((m, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: m.x,
            top: m.y,
            fontFamily:
              m.ch === "0" || m.ch === "1"
                ? "var(--font-plex-mono)"
                : "var(--font-cinzel)",
            fontSize: m.size,
            color,
            letterSpacing: "0.1em",
            opacity: 0,
            textShadow: "0 1px 4px rgba(0,0,0,0.9)",
            animation: `chronoLetter ${m.duration}s ${m.delay}s ease-in-out infinite`,
          }}
        >
          <span style={{ opacity: m.op }}>{m.ch}</span>
        </span>
      ))}
    </div>
  );
}
