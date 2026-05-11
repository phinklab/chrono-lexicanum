"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

type SortKey = "updated" | "title";

const OPTIONS: ReadonlyArray<{ id: SortKey; label: string }> = [
  { id: "updated", label: "Zuletzt aktualisiert" },
  { id: "title", label: "Titel A–Z" },
];

export default function SortPills({ active }: { active: SortKey }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function setSort(id: SortKey) {
    const next = new URLSearchParams(params.toString());
    if (id === "updated") next.delete("sort");
    else next.set("sort", id);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="sort-pills" role="group" aria-label="Sortierung">
      <span className="sort-pills-label" aria-hidden>
        Sortieren
      </span>
      {OPTIONS.map((o) => {
        const isActive = active === o.id;
        return (
          <button
            key={o.id}
            type="button"
            className={`sort-pill${isActive ? " active" : ""}`}
            aria-pressed={isActive}
            onClick={() => setSort(o.id)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
