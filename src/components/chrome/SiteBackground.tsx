/**
 * SiteBackground — full-bleed photo + vignette + grain for a route.
 * Server component; pages opt-in by rendering it once near the top of
 * their <main>. Routes that don't render one get the plain void body bg.
 *
 * Variants:
 *   - "hub"        ← Hub (gothic cathedral-city, cosmic rings overhead)
 *   - "vista"      ← Books hero, book detail, entity pages (cathedral light)
 *   - "librarium"  ← Podcasts
 *   - "oracle"     ← Ask the Archive (gothic scriptorium, void window)
 *   - "chronicle"  ← Timeline / Chronicle (cathedral timeline diagram)
 *   - "cartog"     ← cartog-hall (handoff photo, currently unused)
 *   - "cartog-holo" ← /map (Mechanicus holo-table plot room)
 *   - "none"       ← just vignette + grain over the void
 */

export type SiteBgVariant =
  | "hub"
  | "vista"
  | "librarium"
  | "oracle"
  | "chronicle"
  | "cartog"
  | "cartog-holo"
  | "none";

const PHOTOS: Record<SiteBgVariant, string | null> = {
  hub: "/img/hub.webp",
  vista: "/img/vista.webp",
  librarium: "/img/librarium.webp",
  oracle: "/img/oracle.webp",
  chronicle: "/img/chronicle-hall.webp",
  cartog: "/img/cartog-hall.webp",
  "cartog-holo": "/img/cartog-holo.webp",
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
  return (
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
  );
}
