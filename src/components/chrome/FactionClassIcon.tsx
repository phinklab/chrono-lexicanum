/**
 * FactionClassIcon — the book-row marker (Brief 150). Replaces the generic
 * colour dot with a small sigil for the four faction classes:
 *
 *   imperium      → aquila (stepped-wing eagle)
 *   space_marines → Astartes helm, side profile (Mk VI "beakie" silhouette,
 *                   facing right into the row; angled eye-lens cutout)
 *   xenos         → triple claw-mark
 *   chaos         → eight-pointed star
 *
 * `cls === null` (neutral / unclassified) keeps the old plain dot. Solid
 * single-colour silhouettes — at 14px, hairline strokes turn to mud; class
 * tint comes from CSS (`.fci--*`), the SVGs ride on `currentColor`. Decorative
 * (aria-hidden) like the dot before it: the faction name is real text in its
 * own row column, the `title` keeps the hover tooltip.
 */
import type { FactionIconClass } from "@/lib/faction-icon";

const PATHS: Record<FactionIconClass, string> = {
  imperium:
    "M12 4.2 L13.6 6.4 L22.5 5.2 L17.8 8.4 L19.6 9 L15.6 10.8 L16.8 11.8 " +
    "L13.4 12.4 L13.4 14.2 L15.2 18 L12 16.4 L8.8 18 L10.6 14.2 L10.6 12.4 " +
    "L7.2 11.8 L8.4 10.8 L4.4 9 L6.2 8.4 L1.5 5.2 L10.4 6.4 Z",
  space_marines:
    "M6.2 10.4 C6.2 5.6 9 3 12.4 3 C15.4 3 17.4 4.8 17.9 7 L21.8 11.6 " +
    "L16.9 13.9 L16.5 16.8 L14.2 19.2 L9.6 19.2 C7.4 17.6 6.2 14.8 6.2 10.4 Z " +
    "M14.4 8.4 L18.4 10.3 L17.5 11.5 L13.9 9.8 Z",
  xenos:
    "M4.6 20.5 C4.2 14 6 7.8 9.6 3.4 C7.4 8.8 6.8 14.6 7.6 20.5 Z " +
    "M10.6 20.5 C10.4 13.4 12.6 6.8 16.4 3 C13.8 8.4 13.2 14.4 13.7 20.5 Z " +
    "M16.6 20.5 C16.8 14.4 18.8 9.2 21.8 5.6 C20 10.2 19.5 15.2 19.8 20.5 Z",
  chaos:
    "M12 2 L13.53 8.3 L19.07 4.93 L15.7 10.47 L22 12 L15.7 13.53 " +
    "L19.07 19.07 L13.53 15.7 L12 22 L10.47 15.7 L4.93 19.07 L8.3 13.53 " +
    "L2 12 L8.3 10.47 L4.93 4.93 L10.47 8.3 Z",
};

export default function FactionClassIcon({
  cls,
  label,
}: {
  cls: FactionIconClass | null;
  label?: string | null;
}) {
  const title = label ?? "Unclassified";
  if (!cls) {
    return <span className="fci fci--none" aria-hidden title={title} />;
  }
  return (
    <span
      className={`fci fci--${cls.replace("_", "-")}`}
      aria-hidden
      title={title}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd">
        <path d={PATHS[cls]} />
      </svg>
    </span>
  );
}
