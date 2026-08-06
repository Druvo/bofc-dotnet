import React, { useEffect, useState } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "react-beautiful-dnd";
import { useParams } from "react-router-dom";
import useMatchDayTeams from "../../hooks/useMatchDayTeams";
import "./matchDay.css";
import CreateTeamComponent from "./Atoms/CreateTeamComponent";
import PlayerCard from "./Atoms/PlayerCard";
import TeamCard from "./Atoms/TeamCard";
import GoalKeeperDrawer from "./Atoms/GoalKeeperDrawer";
import { useSelector, useDispatch } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { RootState } from "../../state/store";
import { setActiveMainTab } from "../../state/features/matchDays/matchDayUISlice";
import PickerWheelModal from "./Atoms/pickerWheel/PickerWheelModal";
import { BarChartOutlined, FileExcelOutlined, RightSquareOutlined, TrophyOutlined, SearchOutlined } from "@ant-design/icons";
import { exportToExcel, showBdLocalTime } from "../../utils/utils";
import FixturesPanel from "./Fixtures/FixturesPanel";
import SimpleMatchesPanel from "./Fixtures/SimpleMatchesPanel";
import PrizesPanel from "./Prizes/PrizesPanel";
import StatsLeaderboardPanel from "./Statistics/StatsLeaderboardPanel";
import Button from "../ui/button";
import Tabs from "../ui/tabs";

const buildMainTabs = (hasTeams: boolean, isWeeklyMatchDay: boolean) => [
  { key: "team-building", label: "Team Building" },
  {
    key: "fixtures",
    label: isWeeklyMatchDay ? "Matches" : "Fixtures",
    disabled: !hasTeams,
    disabledTitle: "Add teams in Team Building first",
  },
  { key: "prizes", label: <span className="flex items-center gap-1.5"><TrophyOutlined /> Prizes & Awards</span> },
  { key: "stats-leaderboard", label: <span className="flex items-center gap-1.5"><BarChartOutlined /> Stats & Leaderboard</span> },
];

function SingleMatchDay() {
  const { id = "" } = useParams();
  const matchDayId = Number(id);
  const dispatch = useDispatch();
  const loginInfo = useSelector(selectLoginInfo);
  const activeTab = useSelector((state: RootState) => state.matchDayUI.activeMainTab);
  const {
    teams,
    players,
    matchDaySummary,
    handleAddPlayerToTeam,
    handleRemovePlayer,
    handleRenameTeam,
    handleUploadTeamLogo,
    handleRemoveTeam,
    refetchMatchDay,
    refetchPlayer,
  } = useMatchDayTeams(matchDayId);

  const [playerSearch, setPlayerSearch] = useState("");

  const isWeeklyMatchDay = Boolean(matchDaySummary?.content[0]?.isWeeklyMatchDay);
  const hasTeams = Array.isArray(teams) && teams.length > 0;
  const isAdmin = loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN") || loginInfo.roles.includes("COORDINATOR");

  const filteredPlayers = players.filter((player) =>
    player.playerName.toLowerCase().includes(playerSearch.toLowerCase())
  );

  const handleTabChange = (key: string) => {
    if (key === "fixtures" && !hasTeams) return;
    dispatch(setActiveMainTab(key));
  };

  useEffect(() => {
    refetchMatchDay();
    refetchPlayer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const destinationTeamId = destination.droppableId;
    if (destinationTeamId === source.droppableId) return;

    if (source.droppableId === "players") {
      const draggedPlayerId = Number(draggableId);
      const playerExists = players.some((p) => p.playerId === draggedPlayerId);
      if (!playerExists) {
        console.warn(`Player ${draggedPlayerId} no longer exists in unassigned pool`);
        return;
      }
      if (destinationTeamId !== "players") {
        handleAddPlayerToTeam("UNASSIGNED", Number(destinationTeamId), draggedPlayerId);
      }
    } else {
      const dragId = draggableId.split("-");
      if (dragId.length !== 2) {
        console.warn(`Invalid draggableId format: ${draggableId}`);
        return;
      }

      const sourceTeamId = Number(dragId[0]);
      const draggedPlayerId = Number(dragId[1]);

      const sourceTeam = teams.find((t) => t.teamId === sourceTeamId);
      const player = sourceTeam?.players.find((p) => p.playerId === draggedPlayerId);

      if (!player) {
        console.warn(`Player ${draggedPlayerId} no longer exists in team ${sourceTeamId}`);
        return;
      }

      if (destinationTeamId === "players") {
        handleRemovePlayer(sourceTeamId, draggedPlayerId);
      } else if (player.id) {
        handleAddPlayerToTeam(
          player.playingPosition || "UNASSIGNED",
          Number(destinationTeamId),
          draggedPlayerId,
          player.id,
          player.isCaptain,
          player.teamPlayerRole,
          player.jerseyNumber,
          sourceTeamId
        );
      } else {
        handleAddPlayerToTeam("UNASSIGNED", Number(destinationTeamId), draggedPlayerId);
      }
    }
  };

  const handleExportTeams = () => {
    const maxPlayersCount = Math.max(...teams.map((team) => team.players.length));
    const dataToExport = Array.from({ length: maxPlayersCount }, (_, index) => {
      const row: { [key: string]: string } = {};
      teams.forEach((team) => {
        row[team.teamName] = team.players[index]?.playerName || "";
      });
      return row;
    });
    exportToExcel(dataToExport, `MatchDay_Teams_${matchDayId}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-6">
          <h5 className="flex items-center gap-1.5 text-base font-semibold text-gray-800 dark:text-white/90">
            <TrophyOutlined /> {matchDaySummary?.content[0]?.name}
          </h5>
          <span className="flex items-center gap-1.5 text-theme-sm text-gray-500 dark:text-gray-400">
            <RightSquareOutlined />
            {matchDaySummary?.content[0]?.matchDayDate && showBdLocalTime(matchDaySummary?.content[0]?.matchDayDate)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <CreateTeamComponent
              matchDayId={matchDayId}
              existingTeams={teams.map((team) => team.teamName)}
              refetchSummary={refetchMatchDay}
            />
          )}
          {isAdmin && <PickerWheelModal teams={teams} />}
          <GoalKeeperDrawer matchDayId={matchDayId} />
          <Button type="button" variant="outline" size="sm" startIcon={<FileExcelOutlined />} onClick={handleExportTeams}>
            Export
          </Button>
        </div>
      </div>

      <Tabs items={buildMainTabs(hasTeams, isWeeklyMatchDay)} active={activeTab} onChange={handleTabChange} />

      {activeTab === "team-building" && (
        <div>
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex flex-wrap gap-4">
              {teams.length > 0 ? (
                teams.map((team) => (
                  <TeamCard
                    isLoading={false}
                    key={team.teamId}
                    team={team}
                    handleRemovePlayer={handleRemovePlayer}
                    handleRenameTeam={handleRenameTeam}
                    handleUploadTeamLogo={handleUploadTeamLogo}
                    handleRemoveTeam={handleRemoveTeam}
                    handleAddPlayerToTeam={handleAddPlayerToTeam}
                  />
                ))
              ) : (
                <p className="w-full text-center text-theme-sm text-gray-400 dark:text-gray-500">Create team to add player</p>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
                <span className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">Players ({filteredPlayers.length})</span>
                <div className="relative w-full sm:w-[250px]">
                  <SearchOutlined className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    placeholder="Search players..."
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    className="h-9 w-full rounded-lg border border-gray-300 bg-transparent pl-9 pr-3 text-theme-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90"
                  />
                </div>
              </div>

              <Droppable droppableId="players">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="grid max-h-[180px] gap-2 overflow-y-auto pr-2"
                    style={{ gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" }}
                  >
                    {filteredPlayers.length > 0 ? (
                      filteredPlayers.map((player, index) => (
                        <Draggable key={player.playerId.toString()} draggableId={player.playerId.toString()} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="cursor-grab rounded bg-gray-50 p-2 dark:bg-white/[0.02]"
                              style={provided.draggableProps.style}
                            >
                              <PlayerCard player={player} />
                            </div>
                          )}
                        </Draggable>
                      ))
                    ) : (
                      <p className="text-theme-sm text-gray-400 dark:text-gray-500">
                        {playerSearch ? "No players match your search" : "No Player Found"}
                      </p>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </DragDropContext>
        </div>
      )}

      {activeTab === "fixtures" && (
        hasTeams ? (
          isWeeklyMatchDay ? (
            <SimpleMatchesPanel
              matchDayId={matchDayId}
              teams={teams}
              matchDayStartDate={matchDaySummary?.content[0]?.matchDayDate}
            />
          ) : (
            <FixturesPanel matchDayId={matchDayId} teams={teams} />
          )
        ) : (
          <p className="text-theme-sm text-gray-400 dark:text-gray-500">Please add teams in Team Building tab first</p>
        )
      )}

      {activeTab === "prizes" && <PrizesPanel matchDayId={matchDayId} />}

      {activeTab === "stats-leaderboard" && (
        <StatsLeaderboardPanel
          matchDayId={matchDayId}
          isActive={activeTab === "stats-leaderboard"}
          weeklyMatchDaysOnly={isWeeklyMatchDay}
        />
      )}
    </div>
  );
}

export default SingleMatchDay;
