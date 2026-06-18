/**
 * SiteBackground — full-bleed photo + vignette + grain for a route.
 * Server component; pages opt-in by rendering it once near the top of
 * their <main>. Routes that don't render one get the plain void body bg.
 * When the photo has a registered artist credit (`src/lib/art-credits.ts`),
 * the shared <ArtCreditTag> renders bottom-right — outside the aria-hidden
 * backdrop, so the credit links stay reachable.
 *
 * Variants:
 *   - "main"       ← shared library-nave backdrop (Hub, Archive, Compendium, Ask)
 *   - "hub"        ← Hub (gothic cathedral-city, cosmic rings overhead)
 *   - "vista"      ← Books hero, book detail, entity pages (cathedral light)
 *   - "scriptorium" ← Compendium (grand cathedral-library, scribe at a lectern)
 *   - "librarium"  ← (legacy) library/scriptorium interior
 *   - "vox"        ← Podcasts (cathedral nave, two scribes at vox-podiums)
 *   - "oracle"     ← Ask the Archive (gothic scriptorium, void window)
 *   - "chronicle"  ← Timeline / Chronicle (cathedral timeline diagram)
 *   - "cartog"     ← cartog-hall (handoff photo, currently unused)
 *   - "cartog-holo" ← /map (holo-dais observatory chamber; 55-map.css dims it)
 *   - "login"      ← /login (lightless cathedral librarium — phil kuenzler)
 *   - "none"       ← just vignette + grain over the void
 */
import ArtCreditTag from "@/components/chrome/ArtCreditTag";
import { backgroundArtCredit } from "@/lib/art-credits";

export type SiteBgVariant =
  | "main"
  | "hub"
  | "vista"
  | "scriptorium"
  | "librarium"
  | "vox"
  | "oracle"
  | "chronicle"
  | "cartog"
  | "cartog-holo"
  | "login"
  | "none";

const PHOTOS: Record<SiteBgVariant, string | null> = {
  main: "/img/main-bg.webp",
  hub: "/img/hub.webp",
  vista: "/img/vista.webp",
  scriptorium: "/img/scriptorium.webp",
  librarium: "/img/librarium.webp",
  vox: "/img/vox.webp",
  oracle: "/img/oracle.webp",
  chronicle: "/img/chronicle-hall.webp",
  cartog: "/img/cartog-hall.webp",
  "cartog-holo": "/img/cartog-holo.webp",
  login: "/img/login.webp",
  none: null,
};

type SiteBackgroundProps = {
  variant?: SiteBgVariant;
  position?: string;
};

export default function SiteBackground({
  variant = "vista",
  position = "center",
}: SiteBackgroundProps) {
  const photo = PHOTOS[variant];
  const credit = backgroundArtCredit(photo);
  return (
    <>
      <div className="site-bg" aria-hidden>
        {photo && (
          <div
            className="site-bg__photo"
            style={{ backgroundImage: `url(${photo})`, backgroundPosition: position }}
          />
        )}
        <div className="site-bg__vignette" />
        <div className="site-bg__grain" />
      </div>
      {credit && <ArtCreditTag credit={credit} className="art-credit--site" />}
    </>
  );
}
