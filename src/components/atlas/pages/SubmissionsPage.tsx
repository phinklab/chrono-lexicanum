/**
 * SubmissionsPage — `/atlas/submissions`. Slice-4 operational inventory of
 * the community moderation queue (`submissions` table). Pulls all rows
 * via `getSubmissionsRows` and hands them to the SubmissionsStatusPills
 * client shell, which renders the status filter + AtlasInventoryTable.
 *
 * No row click (no public submission detail surface; approve/reject is a
 * Phase-2 workflow, explicitly out of scope per Task 4 brief). Payloads
 * arrive pre-truncated from the query so raw submission JSON never ships
 * to the client.
 *
 * Headline stat mirrors `getBridgeStats().submissions` (PENDING count) so
 * the Brücke pill and the per-entity pill agree.
 */
import InventoryPageShell from "@/components/atlas/InventoryPageShell";
import SubmissionsStatusPills from "@/components/atlas/SubmissionsStatusPills";
import { formatCount } from "@/lib/atlas/format";
import { getSubmissionsRows } from "@/lib/atlas/queries";
import type { DeckMeta } from "@/lib/atlas/types";

export default async function SubmissionsPage({ deck }: { deck: DeckMeta }) {
  const rows = await getSubmissionsRows();
  const pending = rows.reduce(
    (acc, r) => acc + (r.status === "pending" ? 1 : 0),
    0,
  );

  return (
    <InventoryPageShell
      deck={deck}
      rowCount={rows.length}
      primaryStat={{ label: "PENDING", value: formatCount(pending) }}
    >
      <SubmissionsStatusPills rows={rows} />
    </InventoryPageShell>
  );
}
