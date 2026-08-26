import React, { useState, useMemo } from "react";
import { TeamOutlined } from "@ant-design/icons";
import { useGetMatchDaySummaryQuery } from "../../state/features/matchDays/matchDaysSlice";
import { usePlayerListToAddToTeamQuery } from "../../state/features/matchDays/matchDayTeamSlice";
import { getTeamInitials, toAbsoluteLogoUrl } from "./teamLogoUtils";
import { toAbsolutePlayerPhotoUrl } from "../../utils/playerPhotoUtils";
import PlayerCardV2 from "../CommonAtoms/PlayerCardV2";
import styles from "./ViewerPlayersTab.module.css";
import Loader from "../ui/loader";
import FormSelect from "../ui/form-select";
import useIsMobile from "../../hooks/useIsMobile";

interface ViewerPlayersTabProps {
  matchDayId: number;
}

interface Team {
  teamId: number;
  teamName: string;
  logoUrl?: string;
  players?: Player[];
}

interface Player {
  playerId: number;
  playerName: string;
  photoUrl?: string;
  playingPosition?: string;
  position?: string;
  playerPosition?: string;
  footballPosition?: string;
  teamPlayerRole?: string;
  isCaptain?: boolean;
}

const resolveDisplayPosition = (player: Player): string | null => {
  const assignmentPosition = player?.playingPosition;
  const basePosition =
    player?.position || player?.playerPosition || player?.footballPosition;

  if (assignmentPosition && assignmentPosition !== "UNASSIGNED") {
    return assignmentPosition;
  }

  if (basePosition && basePosition !== "UNASSIGNED") {
    return basePosition;
  }

  return null;
};

const normalizeTeamName = (name: string) => name.toUpperCase();

export default function ViewerPlayersTab({
  matchDayId,
}: ViewerPlayersTabProps) {
  const isMobile = useIsMobile();
  const { data, isLoading, isFetching } = useGetMatchDaySummaryQuery({
    matchDayId,
  });
  const [activeFilter, setActiveFilter] = useState("ALL");

  const teams = useMemo(() => data?.content?.[0]?.teams || [], [data]);

  // Confirmed (voted Yes) players not yet drafted onto a team - shown as an "Unassigned"
  // pseudo-team ahead of the real teams so every "Yes" RSVP stays visible here, not just
  // the ones already picked. "to-be-selected" is exactly this confirmed-but-unassigned list.
  const { data: confirmedData, isLoading: isLoadingConfirmed } = usePlayerListToAddToTeamQuery({ matchDayId });
  const confirmedPlayers = useMemo(() => confirmedData?.content || [], [confirmedData]);

  const allTeams = useMemo(() => {
    if (confirmedPlayers.length === 0) return teams;
    const unassignedTeam: Team = {
      teamId: -1,
      teamName: "Unassigned",
      players: confirmedPlayers.map((p) => ({
        playerId: p.playerId,
        playerName: p.playerName,
        photoUrl: p.photoUrl,
      })),
    };
    return [unassignedTeam, ...teams];
  }, [teams, confirmedPlayers]);

  const filters = useMemo(() => {
    const teamLabels = Array.from(new Set(teams.map((team: Team) => team.teamName))).sort();
    const labels = confirmedPlayers.length > 0 ? ["Unassigned", ...teamLabels] : teamLabels;
    return ["ALL", ...labels];
  }, [teams, confirmedPlayers]);

  const visibleTeams = useMemo(() => {
    if (activeFilter === "ALL") return allTeams;
    return allTeams.filter((team: Team) => team.teamName === activeFilter);
  }, [activeFilter, allTeams]);

  if (isLoading || isFetching || isLoadingConfirmed) {
    return (
      <div className={styles.loadingWrap}>
        <Loader />
      </div>
    );
  }

  if (allTeams.length === 0) {
    return (
      <div className={styles.emptyWrap}>
        <div className="text-center text-theme-sm text-gray-400 dark:text-gray-500">
          <TeamOutlined className="mb-2 block text-3xl text-gray-300 dark:text-gray-600" />
          No teams or players found
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrap}>
      <div className={styles.contentWrap}>
        {isMobile ? (
          <div className={styles.filterDropdown}>
            <FormSelect
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              options={filters.map((filter) => ({
                label: normalizeTeamName(filter),
                value: filter,
              }))}
              className={styles.filterSelect}
            />
          </div>
        ) : (
          <div className={styles.filterBar}>
            {filters.map((filter) => {
              const isActive = filter === activeFilter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`${styles.filterButton} ${
                    isActive ? styles.filterButtonActive : ""
                  }`}
                >
                  {normalizeTeamName(filter)}
                </button>
              );
            })}
          </div>
        )}

        <div className={styles.teamsGrid}>
          {visibleTeams.map((team: Team) => {
            const logoUrl = toAbsoluteLogoUrl(team.logoUrl);
            return (
              <div
                key={team.teamId}
                className={styles.teamCard}
                style={{ padding: "18px" }}
              >
                <div className={styles.cardHeader}>
                  <div
                    className={`${styles.teamLogo} flex shrink-0 items-center justify-center overflow-hidden rounded-full`}
                    style={{ width: 48, height: 48 }}
                  >
                    {logoUrl ? <img src={logoUrl} alt="" className="h-full w-full object-cover" /> : getTeamInitials(team.teamName)}
                  </div>
                  <div className={styles.teamInfo}>
                    <div className={styles.teamName}>{team.teamName}</div>
                    <div className={styles.teamMeta}>
                      {team.players?.length || 0} PLAYERS
                    </div>
                  </div>
                </div>

                {team.players && team.players.length > 0 ? (
                  <div className={styles.playersGrid}>
                    {team.players.map((player: Player) => {
                      const normalizedPosition = resolveDisplayPosition(player)?.toUpperCase();
                      const isCaptain =
                        player.teamPlayerRole === "CAPTAIN" ||
                        player.isCaptain === true ||
                        /\((c)\)|\[(c)\]/i.test(player.playerName);
                      return (
                        <PlayerCardV2
                          key={player.playerId}
                          size="compact"
                          player={{
                            playerId: player.playerId,
                            playerName: player.playerName.toUpperCase(),
                            photoUrl: player.photoUrl
                              ? toAbsolutePlayerPhotoUrl(player.photoUrl)
                              : undefined,
                            position:
                              normalizedPosition && normalizedPosition !== "GOALKEEPER"
                                ? normalizedPosition
                                : null,
                            isCaptain,
                            isViceCaptain: player.teamPlayerRole === "VICE_CAPTAIN",
                            isGoalkeeper: normalizedPosition === "GOALKEEPER",
                          }}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <span
                    style={{ fontSize: 12, color: "var(--color-muted)" }}
                  >
                    No players available
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
