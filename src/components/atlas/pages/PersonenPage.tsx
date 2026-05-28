/**
 * PersonenPage — `/atlas/personen`. Slice-4 reference inventory of every
 * catalogued person across all `personRole` enum slots (author, narrator,
 * editor, cover artist, …). Per row: distinct work count, the set of
 * roles the person has ever held (aggregated from `work_persons`), and a
 * boolean author flag. No row click — persons have no public detail
 * surface yet.
 *
 * Headline stat mirrors `getBridgeStats().personen` ("AUTOREN"): distinct
 * persons with at least one `role = 'author'` tag, identical math to
 * `count(DISTINCT person_id) WHERE role = 'author'` in `getBridgeStats`.
 */
import AtlasInventoryTable, {
  type AtlasInventoryHeader,
  type AtlasInventoryRow,
} from "@/components/atlas/AtlasInventoryTable";
import FeatureSignalPill from "@/components/atlas/FeatureSignalPill";
import InventoryPageShell from "@/components/atlas/InventoryPageShell";
import { formatCount, truncate } from "@/lib/atlas/format";
import { getPersonenRows, type PersonenRow } from "@/lib/atlas/queries";
import type { DeckMeta } from "@/lib/atlas/types";

const ROLE_LABEL: Record<string, string> = {
  author: "AUTHOR",
  co_author: "CO-AUTHOR",
  translator: "TRANSLATOR",
  editor: "EDITOR",
  narrator: "NARRATOR",
  co_narrator: "CO-NARRATOR",
  full_cast: "FULL CAST",
  director: "DIRECTOR",
  co_director: "CO-DIRECTOR",
  cover_artist: "ARTIST",
  sound_designer: "SOUND",
};

function labelRole(token: string): string {
  return ROLE_LABEL[token] ?? token.replace(/_/g, " ").toUpperCase();
}

function joinedRoles(row: PersonenRow): string {
  if (row.roles.length === 0) return "—";
  return row.roles.map(labelRole).join(", ");
}

const HEADERS: ReadonlyArray<AtlasInventoryHeader> = [
  { id: "author", label: "AUTHOR", className: "atlas-inv__c--label" },
  { id: "name", label: "PERSON", className: "atlas-inv__c--title" },
  { id: "roles", label: "ROLES", className: "atlas-inv__c--meta" },
  { id: "works", label: "WORKS", className: "atlas-inv__c--num" },
  { id: "signal", label: "FEATURE", className: "atlas-inv__c--signal" },
];

function buildRow(row: PersonenRow): AtlasInventoryRow {
  const roles = joinedRoles(row);
  return {
    key: row.id,
    haystack: `${row.name} ${row.id} ${row.nameSort} ${roles}`,
    cells: [
      {
        id: "author",
        className: "atlas-inv__c--label",
        node: row.isAuthor ? "AUTHOR" : "—",
        sortValue: row.isAuthor ? 1 : 0,
      },
      {
        id: "name",
        className: "atlas-inv__c--title",
        node: (
          <>
            <span className="atlas-inv__name">{row.name}</span>
            <span className="atlas-inv__hint">{row.id}</span>
          </>
        ),
        sortValue: row.nameSort,
      },
      {
        id: "roles",
        className: "atlas-inv__c--meta",
        node: truncate(roles, 48),
        sortValue: row.roles.length,
      },
      {
        id: "works",
        className: "atlas-inv__c--num",
        node: formatCount(row.workCount),
        sortValue: row.workCount,
      },
      {
        id: "signal",
        className: "atlas-inv__c--signal",
        node: (
          <FeatureSignalPill
            label="PERSON PAGE?"
            tone={row.isAuthor ? "future" : "muted"}
          />
        ),
      },
    ],
  };
}

export default async function PersonenPage({ deck }: { deck: DeckMeta }) {
  const rows = await getPersonenRows();
  const authorCount = rows.reduce((acc, r) => acc + (r.isAuthor ? 1 : 0), 0);
  const tableRows = rows.map(buildRow);

  return (
    <InventoryPageShell
      deck={deck}
      rowCount={rows.length}
      primaryStat={{ label: "AUTHORS", value: formatCount(authorCount) }}
    >
      <AtlasInventoryTable
        headers={HEADERS}
        rows={tableRows}
        searchPlaceholder="Filter person / role…"
      />
    </InventoryPageShell>
  );
}
