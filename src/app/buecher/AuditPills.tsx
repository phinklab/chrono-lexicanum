"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type AuditFilter = "drift" | "gap" | "ssot" | "collections";

const OPTIONS: ReadonlyArray<{ id: AuditFilter; label: string }> = [
  { id: "drift", label: "Drift" },
  { id: "gap", label: "Junction gap" },
  { id: "ssot", label: "SSOT" },
  { id: "collections", label: "Multi-collected" },
];

export default function AuditPills({ active }: { active: readonly AuditFilter[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const activeSet = new Set(active);

  function toggleFilter(id: AuditFilter) {
    const nextFilters = activeSet.has(id)
      ? active.filter((filter) => filter !== id)
      : [...active, id];
    const next = new URLSearchParams(params.toString());
    if (nextFilters.length === 0) next.delete("audit");
    else next.set("audit", nextFilters.join(","));
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="audit-pills" role="group" aria-label="Audit filter">
      <span className="audit-pills-label" aria-hidden>
        Audit
      </span>
      {OPTIONS.map((option) => {
        const isActive = activeSet.has(option.id);
        return (
          <button
            key={option.id}
            type="button"
            className={`audit-pill${isActive ? " active" : ""}`}
            aria-pressed={isActive}
            onClick={() => toggleFilter(option.id)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
