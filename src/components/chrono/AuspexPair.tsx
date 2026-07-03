import MainAuspex from "@/components/chrono/MainAuspex";

/**
 * AuspexPair — the two auspex discs behind a hero masthead, at the house
 * positions (34%/58% large + slow reverse, 62%/46% small + forward). Pages
 * render it once inside their hero; `quiet` lowers the opacities for content-
 * dense titling blocks (book / entity). Positioning lives in 47-hud.css.
 */
export default function AuspexPair({ quiet = false }: { quiet?: boolean }) {
  return (
    <div className={`auspex-pair${quiet ? " auspex-pair--quiet" : ""}`} aria-hidden>
      <div className="auspex-pair__disc auspex-pair__disc--main">
        <MainAuspex size={520} spinDur={240} spinRevDur={320} coreDur={176} />
      </div>
      <div className="auspex-pair__disc auspex-pair__disc--sec">
        <MainAuspex size={300} spinDur={360} spinRevDur={440} coreDur={242} />
      </div>
    </div>
  );
}
