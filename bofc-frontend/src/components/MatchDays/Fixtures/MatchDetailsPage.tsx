import React, { useState } from "react";
import { LockOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetMatchQuery } from "../../../state/features/fixtures/fixturesSlice";
import { useGetMatchDaySummaryQuery } from "../../../state/features/matchDays/matchDaysSlice";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import { canConductMatches } from "../../../utils/roleUtils";
import MatchEventTimeline from "./MatchEventTimeline";
import QuickEventRecorder from "./QuickEventRecorder";
import MatchStatistics from "./MatchStatistics";
import ElectricTeamBanner from "./ElectricTeamBanner";
import Loader from "../../ui/loader";
import Badge from "../../ui/badge";

export default function MatchDetailsPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const [activeTab, setActiveTab] = useState<"information" | "live" | "statistics">("information");
  const loginInfo = useSelector(selectLoginInfo);
  const canConduct = canConductMatches(loginInfo.roles);

  const { data: matchResponse, isLoading, refetch } = useGetMatchQuery(
    { matchId: Number(matchId) },
    { skip: !matchId }
  );

  const match = matchResponse?.content;

  const { data: matchDaySummary } = useGetMatchDaySummaryQuery(
    { matchDayId: match?.matchDayId || 0 },
    { skip: !match?.matchDayId }
  );

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading || !match) {
    return <Loader className="py-16" />;
  }

  const teamPlayersMap: Record<number, Array<{ id: number; name: string }>> = {};
  const matchDay = matchDaySummary?.content?.[0];
  if (matchDay?.teams) {
    matchDay.teams.forEach((team) => {
      teamPlayersMap[team.teamId] = (team.players || []).map((player) => ({
        id: player.playerId,
        name: player.playerName,
      }));
    });
  }

  return (
    <div className="mx-auto max-w-[1400px] p-4">
      <ElectricTeamBanner
        match={match}
        colorBgContainer="#fff"
        isAdmin={canConduct}
        onRefresh={handleRefresh}
      />

      <div className="mt-4">
        <div className="mb-4 flex overflow-x-auto rounded-lg border border-gray-300 dark:border-[var(--color-rule)]" style={{ width: "fit-content" }}>
          <button
            type="button"
            onClick={() => { setActiveTab("information"); handleRefresh(); }}
            className={`px-4 py-2.5 text-theme-sm font-medium transition ${activeTab === "information" ? "bg-brand-500 text-white" : "bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"}`}
          >
            Recent Events
          </button>
          {canConduct ? (
            <button
              type="button"
              onClick={() => { setActiveTab("live"); handleRefresh(); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-theme-sm font-medium transition ${activeTab === "live" ? "bg-brand-500 text-white" : "bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"}`}
            >
              {match.matchStatus === "ONGOING" && <span className="h-2 w-2 rounded-full bg-error-500" />}
              Live Control & Record Events
            </button>
          ) : (
            <span className="flex cursor-not-allowed items-center gap-1.5 px-4 py-2.5 text-theme-sm text-gray-400 opacity-60">
              <LockOutlined className="text-[10px]" /> Live Control & Events
            </span>
          )}
          <button
            type="button"
            onClick={() => { setActiveTab("statistics"); handleRefresh(); }}
            className={`px-4 py-2.5 text-theme-sm font-medium transition ${activeTab === "statistics" ? "bg-brand-500 text-white" : "bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"}`}
          >
            Statistics
          </button>
        </div>

        {activeTab === "statistics" && <MatchStatistics matchId={match.id} />}

        {activeTab === "information" && (
          <MatchEventTimeline
            matchId={match.id}
            homeTeamId={match.homeTeamId}
            awayTeamId={match.awayTeamId}
            matchDurationMinutes={match.matchDurationMinutes}
            elapsedTimeSeconds={match.elapsedTimeSeconds}
            startedAt={match.startedAt}
            completedAt={match.completedAt}
          />
        )}

        {activeTab === "live" && (
          canConduct ? (
            <QuickEventRecorder
              matchId={match.id}
              fixture={match}
              homeTeamPlayers={teamPlayersMap[match.homeTeamId] || []}
              awayTeamPlayers={teamPlayersMap[match.awayTeamId] || []}
              onSuccess={handleRefresh}
            />
          ) : (
            <Badge variant="warning">Only administrators and coordinators can access live match controls and event recording.</Badge>
          )
        )}
      </div>
    </div>
  );
}
