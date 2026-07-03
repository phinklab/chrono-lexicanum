/**
 * FloatingCoord — a survey point: dot, blooming hairline ring, dotted leader
 * line and a mono label, cycling on a 21s loop (CSS in 47-hud.css). Server
 * component; `delay` staggers multiple points on one hero.
 */

type FloatingCoordProps = {
  x: number | string;
  y: number | string;
  label: string;
  delay?: number;
};

export default function FloatingCoord({ x, y, label, delay = 0 }: FloatingCoordProps) {
  return (
    <span
      className="survey chrono-ambient"
      style={{ left: x, top: y, "--d": `${delay}s` } as React.CSSProperties}
      aria-hidden
    >
      <span className="survey__pt" />
      <span className="survey__lead" />
      <span className="survey__lbl">{label}</span>
    </span>
  );
}
