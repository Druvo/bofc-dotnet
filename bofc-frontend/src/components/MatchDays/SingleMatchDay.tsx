import React, { useEffect, useState } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "react-beautiful-dnd";
import { useParams, useNavigate } from "react-router-dom";
import useMatchDayTeams from "../../hooks/useMatchDayTeams";
import "./matchDay.css";
import CreateTeamComponent from "./Atoms/CreateTeamComponent";
import GenerateTeamsButton from "./Atoms/GenerateTeamsButton";
import PlayerCard from "./Atoms/PlayerCard";
import TeamCard from "./Atoms/TeamCard";
import GoalKeeperDrawer from "./Atoms/GoalKeeperDrawer";
import Badge from "../ui/badge";
import { useSelector, useDispatch } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { RootState } from "../../state/store";
import { setActiveMainTab } from "../../state/features/matchDays/matchDayUISlice";
import PickerWheelModal from "./Atoms/pickerWheel/PickerWheelModal";
import AutoAssignGoalkeeperButton from "./Atoms/AutoAssignGoalkeeperButton";
import { ArrowLeftOutlined, BarChartOutlined, FileExcelOutlined, RightSquareOutlined, TrophyOutlined, SearchOutlined } from "@ant-design/icons";
import { exportToExcel, showBdLocalTimeRange } from "../../utils/utils";
import FixturesPanel from "./Fixtures/FixturesPanel";
import SimpleMatchesPanel from "./Fixtures/SimpleMatchesPanel";
import PrizesPanel from "./Prizes/PrizesPanel";
import StatsLeaderboardPanel from "./Statistics/StatsLeaderboardPanel";
import SquadLineupTab from "./SquadLineup/SquadLineupTab";
import TeamsScreenshotButton from "./Atoms/TeamsScreenshotButton";
import SendTeamsEmailButton from "./Atoms/SendTeamsEmailButton";
import SendMatchDayReminderButton from "./Atoms/SendMatchDayReminderButton";
import Button from "../ui/button";
import Tabs from "../ui/tabs";

const buildMainTabs = (hasTeams: boolean, isWeeklyMatchDay: boolean) => [
  { key: "team-building", label: "Team Building" },
  {
    key: "squad-lineup",
    label: "Squad & Lineup",
    disabled: !hasTeams,
    disabledTitle: "Add teams in Team Building first",
  },
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
  const navigate = useNavigate();
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
  // Cross-links Goalkeeper Records <-> Assign Goalkeepers - each panel can hand off to the other
  // without both being open at once.
  const [goalkeeperPanel, setGoalkeeperPanel] = useState<"records" | "assign" | null>(null);

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

  // activeMainTab lives in a global slice (shared across every MatchDay's page, not
  // just this one), so without this it carries over from whatever tab was last open
  // on a DIFFERENT MatchDay - always land back on Team Building for a fresh MatchDay.
  useEffect(() => {
    dispatch(setActiveMainTab("team-building"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchDayId]);

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
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" size="sm" startIcon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              Back
            </Button>
            <h5 className="flex items-center gap-1.5 text-base font-semibold text-gray-800 dark:text-white/90">
              <TrophyOutlined /> {matchDaySummary?.content[0]?.name}
            </h5>
          </div>
          <span className="flex items-center gap-1.5 text-theme-sm text-gray-500 dark:text-gray-400">
            <RightSquareOutlined />
            {matchDaySummary?.content[0]?.matchDayDate &&
              showBdLocalTimeRange(matchDaySummary?.content[0]?.matchDayDate, matchDaySummary?.content[0]?.durationMinutes)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && !hasTeams && (
            <GenerateTeamsButton matchDayId={matchDayId} refetchSummary={refetchMatchDay} />
          )}
          {isAdmin && (
            <CreateTeamComponent
              matchDayId={matchDayId}
              refetchSummary={refetchMatchDay}
            />
          )}
          {isAdmin && <PickerWheelModal teams={teams} />}
          {isAdmin && hasTeams && (
            <AutoAssignGoalkeeperButton
              matchDayId={matchDayId}
              isOpen={goalkeeperPanel === "assign"}
              onOpenChange={(o) => setGoalkeeperPanel(o ? "assign" : null)}
              onOpenRecords={() => setGoalkeeperPanel("records")}
            />
          )}
          <GoalKeeperDrawer
            matchDayId={matchDayId}
            isOpen={goalkeeperPanel === "records"}
            onOpenChange={(o) => setGoalkeeperPanel(o ? "records" : null)}
            onOpenAssignGoalkeepers={isAdmin && hasTeams ? () => setGoalkeeperPanel("assign") : undefined}
          />
          <Button type="button" variant="outline" size="sm" startIcon={<FileExcelOutlined />} onClick={handleExportTeams}>
            Export
          </Button>
          {hasTeams && (
            <TeamsScreenshotButton
              matchDayId={matchDayId}
              matchDayName={matchDaySummary?.content[0]?.name}
              matchDayDate={matchDaySummary?.content[0]?.matchDayDate}
              durationMinutes={matchDaySummary?.content[0]?.durationMinutes}
              venueName={matchDaySummary?.content[0]?.venueName}
              teams={teams}
            />
          )}
          {isAdmin && hasTeams && <SendTeamsEmailButton matchDayId={matchDayId} />}
          {isAdmin && <SendMatchDayReminderButton matchDayId={matchDayId} />}
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

            <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
                <span className="flex items-center gap-2 text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                  Unassigned Pool <Badge variant="light">{filteredPlayers.length}</Badge>
                </span>
                <div className="relative w-full sm:w-[250px]">
                  <SearchOutlined className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    placeholder="Search players..."
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    className="h-9 w-full rounded-lg border border-gray-300 bg-transparent pl-9 pr-3 text-theme-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-[var(--color-rule)] dark:text-white/90"
                  />
                </div>
              </div>

              <Droppable droppableId="players">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`grid max-h-[220px] gap-2 overflow-y-auto rounded-xl border-2 border-dashed p-2.5 ${
                      snapshot.isDraggingOver
                        ? "border-brand-300 bg-brand-50/50 dark:border-brand-500/40 dark:bg-brand-500/5"
                        : "border-gray-200 dark:border-[var(--color-rule)]"
                    }`}
                    style={{ gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" }}
                  >
                    {filteredPlayers.length > 0 ? (
                      filteredPlayers.map((player, index) => (
                        <Draggable key={player.playerId.toString()} draggableId={player.playerId.toString()} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`cursor-grab rounded-lg border p-1.5 active:cursor-grabbing ${
                                snapshot.isDragging
                                  ? "border-brand-300 bg-brand-50 shadow-lg dark:border-brand-500/40 dark:bg-brand-500/10"
                                  : "border-gray-200 bg-white dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)]"
                              }`}
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

      {activeTab === "squad-lineup" && <SquadLineupTab teams={teams} />}

      {activeTab === "fixtures" && (
        hasTeams ? (
          isWeeklyMatchDay ? (
            <SimpleMatchesPanel
              matchDayId={matchDayId}
              teams={teams}
              matchDayStartDate={matchDaySummary?.content[0]?.matchDayDate}
              matchDayDurationMinutes={matchDaySummary?.content[0]?.durationMinutes}
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
