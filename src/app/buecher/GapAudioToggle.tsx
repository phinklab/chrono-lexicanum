"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function GapAudioToggle({
  active,
  count,
}: {
  active: boolean;
  count: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function toggle() {
    const next = new URLSearchParams(params.toString());
    if (active) next.delete("hideAudio");
    else next.set("hideAudio", "1");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div
      className="audit-pills gap-audio-toggle"
      role="group"
      aria-label="Audio dramas"
    >
      <span className="audit-pills-label" aria-hidden>
        Audio
      </span>
      <button
        type="button"
        className={`audit-pill${active ? " active" : ""}`}
        aria-pressed={active}
        onClick={toggle}
      >
        {active ? "Hidden" : count > 0 ? `Hide · ${count}` : "Hide"}
      </button>
    </div>
  );
}
