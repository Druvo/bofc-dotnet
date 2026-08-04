import React from "react";
import { TrophyOutlined } from "@ant-design/icons";
import { useGetLatestTournamentWithUserStatusQuery } from "../../../state/features/tournaments/tournamentsSlice";
import { useGetTopScorersQuery } from "../../../state/features/statistics/statisticsSlice";
import Loader, { Spinner } from "../../ui/loader";
import Avatar from "../../CommonAtoms/Avatar";

const MEDAL_COLOR = ["text-[#D4AF37]", "text-[#B8B8B8]", "text-[#B87333]"]; // gold/silver/bronze — universal medal convention, not a status color

const TopScorersWidget: React.FC = () => {
  const { data: latest } = useGetLatestTournamentWithUserStatusQuery();
  const tournamentId = latest?.content?.tournament?.id;

  const { data, isLoading } = useGetTopScorersQuery(
    { tournamentId: tournamentId as number, limit: 5 },
    { skip: !tournamentId }
  );
  const scorers = data?.content || [];

  return (
    <div className="h-full rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-3 flex items-center gap-1.5 text-theme-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        <TrophyOutlined /> Top Scorers
      </div>

      {!tournamentId ? (
        <p className="my-3 text-theme-xs text-gray-400 dark:text-gray-500">No active tournament</p>
      ) : isLoading ? (
        <Spinner className="my-3 text-gray-400" />
      ) : scorers.length === 0 ? (
        <p className="my-3 text-theme-xs text-gray-400 dark:text-gray-500">No goals recorded yet</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {scorers.map((s, i) => (
            <div
              key={s.playerId}
              className={`flex items-center gap-2.5 rounded-lg border border-gray-100 px-2 py-1.5 dark:border-gray-800 ${
                i === 0 ? "bg-brand-50 dark:bg-brand-500/10" : "bg-gray-50 dark:bg-white/[0.02]"
              }`}
            >
              <span className={`w-4.5 text-theme-xs font-extrabold ${MEDAL_COLOR[i] || "text-gray-400"}`}>{i + 1}</span>
              <Avatar name={s.playerName} seed={s.playerId} size={26} fontSize={10} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-theme-xs text-gray-700 dark:text-gray-300">{s.playerName}</div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500">{s.teamName}</div>
              </div>
              <span className="text-base font-extrabold text-brand-500 dark:text-brand-400">{s.goalsScored}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopScorersWidget;
