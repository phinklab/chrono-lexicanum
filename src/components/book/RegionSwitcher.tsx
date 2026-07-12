"use client";

/**
 * Optional store-region switcher. Writes `?store=<ISO>` to the URL — the
 * <StoreActions> island reads it back as the highest-precedence region signal
 * (Launch S4: region resolution is client-side so /book stays static) —
 * mirroring the EraToggle pattern. The default already localizes from the
 * browser language; this is a nicety that also doubles as the two-region
 * verification path. The currently-resolved region is shown in the label so a
 * visitor outside the quick-switch set still sees their store.
 */
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { StoreRegion } from "@/lib/store-links";

const QUICK_REGIONS: { code: StoreRegion; label: string }[] = [
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "DE", label: "Germany" },
];

export default function RegionSwitcher({ active }: { active: StoreRegion }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function pick(code: StoreRegion) {
    if (code === active) return;
    const merged = new URLSearchParams(params.toString());
    merged.set("store", code);
    router.replace(`${pathname}?${merged.toString()}`, { scroll: false });
  }

  return (
    <div className="book-detail__region" role="group" aria-label="Store region">
      <span className="book-detail__region-label">Store region</span>
      <div className="book-detail__region-buttons">
        {QUICK_REGIONS.map((r) => (
          <button
            key={r.code}
            type="button"
            onClick={() => pick(r.code)}
            className={r.code === active ? "active" : undefined}
            aria-pressed={r.code === active}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}
