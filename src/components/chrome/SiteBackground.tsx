/**
 * SiteBackground — full-bleed photo + vignette + grain for a route.
 * Server component; pages opt-in by rendering it once near the top of
 * their <main>. Routes that don't render one get the plain void body bg.
 *
 * Variants:
 *   - "vista"     ← Hub, Books hero, book detail (cathedral light)
 *   - "librarium" ← Ask the Archive
 *   - "cartog"    ← future /map (handoff photo stored but not used yet)
 *   - "none"      ← just vignette + grain over the void
 */

export type SiteBgVariant = "vista" | "librarium" | "cartog" | "none";

const PHOTOS: Record<SiteBgVariant, string | null> = {
  vista: "/img/vista.webp",
  librarium: "/img/librarium.webp",
  cartog: "/img/cartog-hall.webp",
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
