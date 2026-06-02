"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

/**
 * Home search (Brief 120). Honest by construction: it does nothing magical —
 * it hands the term to the real `/werke` browse (`?q=`), the same surface the
 * Archive nav points at. An empty submit opens the unfiltered archive. No fake
 * "results" appear on the Home itself.
 */
export default function HomeSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/werke?q=${encodeURIComponent(term)}` : "/werke");
  }

  return (
    <form className="hub-search" role="search" onSubmit={onSubmit}>
      <span className="hub-search__kicker" aria-hidden>
        {"// SCAN · LIBRORVM"}
      </span>
      <div className="hub-search__bar c-glass c-corners">
        <input
          type="search"
          className="hub-search__input"
          placeholder="Search the archive — title or author…"
          aria-label="Search the book archive"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit" className="hub-search__go">
          Search →
        </button>
      </div>
    </form>
  );
}
