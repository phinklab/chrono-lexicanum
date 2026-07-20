/**
 * The Growing Stacks — books per release year, stacked by format group.
 * Thin wrapper binding the format series (fixed FORMAT_GROUPS order, never
 * cycled) onto the shared StackedYearChart geometry.
 */
import type { PublicationYear, FormatGroup } from "@/lib/statistics/loadStatistics";
import { FORMAT_GROUPS } from "@/lib/statistics/loadStatistics";
import StackedYearChart, { type StackSeries } from "./StackedYearChart";

const FORMAT_SERIES: Record<
  FormatGroup,
  Omit<StackSeries, "key" | "varName">
> = {
  novels: { label: "Novels", singular: "novel", plural: "novels" },
  novellas: { label: "Novellas", singular: "novella", plural: "novellas" },
  shorts: {
    label: "Short stories",
    singular: "short story",
    plural: "short stories",
  },
  audio: {
    label: "Audio dramas",
    singular: "audio drama",
    plural: "audio dramas",
  },
  collected: {
    label: "Collected & other",
    singular: "collected volume",
    plural: "collected & other",
  },
};

const FORMAT_VAR: Record<FormatGroup, string> = {
  novels: "--libr-c-novel",
  novellas: "--libr-c-novella",
  shorts: "--libr-c-short",
  audio: "--libr-c-audio",
  collected: "--libr-c-collected",
};

export default function PublicationChart({
  publications,
}: {
  publications: PublicationYear[];
}) {
  if (publications.length === 0) return null;
  return (
    <StackedYearChart
      data={publications}
      series={FORMAT_GROUPS.map((g) => ({
        key: g,
        varName: FORMAT_VAR[g],
        ...FORMAT_SERIES[g],
      }))}
      ariaLabel={`Books published per year, ${publications[0].year} to ${publications[publications.length - 1].year}, stacked by format`}
    />
  );
}
