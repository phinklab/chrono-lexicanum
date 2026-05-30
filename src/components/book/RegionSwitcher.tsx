"use client";

/**
 * Brief 105 — optional store-region switcher. Writes `?store=<ISO>` to the URL
 * (the server reads it as the highest-precedence region signal in
 * store-region.ts), mirroring the EraToggle pattern. The default link already
 * localizes server-side from geo headers; this is a nicety that also doubles as
 * the two-region verification path. The currently-resolved region is shown in
 * the label so a visitor outside the quick-switch set still sees their store.
 */
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { StoreRegion } from "@/lib/store-links";

const QUICK_REGIONS: { code: StoreRegion; label: string }[] = [
  { code: "US", label: "US" },
  { code: "GB", label: "UK" },
  { code: "DE", label: "DE" },
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
      <span className="book-detail__region-label">{`// STORE · ${active}`}</span>
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
