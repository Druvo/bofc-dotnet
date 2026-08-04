import React from "react";
import { getTeamInitials, getTeamLogoUrlFromSummary } from "../TournamentViewer/teamLogoUtils";

/**
 * Rank→medal color, previously private to ViewerTableTab.tsx. Canonical home
 * for it now so any standings display (full table, dashboard snapshot) reads
 * the same gold/silver/bronze convention.
 */
export const rankColor = (rank: number): string => {
  if (rank === 1) return "#d4af37";
  if (rank === 2) return "#9ca3af";
  if (rank === 3) return "#b87333";
  return "#1677ff";
};

interface TeamIdentityCellProps {
  rank: number;
  teamId?: number;
  teamName?: string | null;
  tournamentSummary?: any;
  size?: "small" | "default";
}

/**
 * Rank badge + team crest + team name, matching ViewerTableTab's exact
 * avatar/logo/initials rendering (same teamLogoUtils helpers) so any
 * consumer gets a real team crest instead of text-only. Layout only —
 * callers own everything else in their row (stat columns, click handlers).
 */
export function TeamIdentityCell({
  rank,
  teamId,
  teamName,
  tournamentSummary,
  size = "default",
}: TeamIdentityCellProps) {
  const rankSize = size === "small" ? 18 : 32;
  const teamSize = size === "small" ? 22 : 36;
  const logoUrl = getTeamLogoUrlFromSummary(tournamentSummary, teamId);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: size === "small" ? 8 : 12, minWidth: 0 }}>
      <div
        className="flex shrink-0 items-center justify-center rounded-full text-white"
        style={{
          width: rankSize,
          height: rankSize,
          backgroundColor: rankColor(rank),
          fontSize: size === "small" ? 9 : 14,
        }}
      >
        {rank}
      </div>
      <div
        className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-gray-300"
        style={{ width: teamSize, height: teamSize, fontSize: size === "small" ? 10 : 13 }}
      >
        {logoUrl ? <img src={logoUrl} alt="" className="h-full w-full object-cover" /> : getTeamInitials(teamName, "T")}
      </div>
      <span
        style={{
          fontWeight: rank === 1 ? 700 : 500,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {teamName}
      </span>
    </div>
  );
}
