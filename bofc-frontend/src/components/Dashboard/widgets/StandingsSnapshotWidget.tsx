import React from "react";
import { useNavigate } from "react-router-dom";
import { TableOutlined } from "@ant-design/icons";
import { useGetLatestTournamentWithUserStatusQuery, useGetTournamentSummaryQuery } from "../../../state/features/tournaments/tournamentsSlice";
import { useGetTournamentStandingsQuery } from "../../../state/features/statistics/statisticsSlice";
import { TeamIdentityCell } from "../../CommonAtoms/StandingsRow";
import { Spinner } from "../../ui/loader";

const StandingsSnapshotWidget: React.FC = () => {
  const navigate = useNavigate();
  const { data: latest } = useGetLatestTournamentWithUserStatusQuery();
  const tournamentId = latest?.content?.tournament?.id;

  const { data, isLoading } = useGetTournamentStandingsQuery(
    { tournamentId: tournamentId as number },
    { skip: !tournamentId }
  );
  const { data: tournamentSummary } = useGetTournamentSummaryQuery(
    { tournamentId: tournamentId as number },
    { skip: !tournamentId }
  );
  const standings = [...(data?.content || [])]
    .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference)
    .slice(0, 5);

  return (
    <div
      onClick={() => tournamentId && navigate(`/tournament-viewer/${tournamentId}/table`)}
      className={`h-full rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] ${tournamentId ? "cursor-pointer" : ""}`}
    >
      <div className="mb-3 flex items-center gap-1.5 text-theme-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        <TableOutlined /> Standings
      </div>

      {!tournamentId ? (
        <p className="my-3 text-theme-xs text-gray-400 dark:text-gray-500">No active MatchDay</p>
      ) : isLoading ? (
        <Spinner className="my-3 text-gray-400" />
      ) : standings.length === 0 ? (
        <p className="my-3 text-theme-xs text-gray-400 dark:text-gray-500">No standings yet</p>
      ) : (
        <table className="w-full border-collapse text-theme-xs">
          <thead>
            <tr className="text-left text-gray-400 dark:text-gray-500">
              <th className="pb-1.5 font-semibold">Team</th>
              <th className="pb-1.5 text-center font-semibold">P</th>
              <th className="pb-1.5 text-center font-semibold">GD</th>
              <th className="pb-1.5 text-right font-semibold">Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => (
              <tr key={s.teamId} className="border-t border-gray-100 dark:border-gray-800">
                <td className="max-w-[140px] py-1.5 pr-2 text-gray-700 dark:text-gray-300">
                  <TeamIdentityCell
                    rank={i + 1}
                    teamId={s.teamId}
                    teamName={s.teamName}
                    tournamentSummary={tournamentSummary}
                    size="small"
                  />
                </td>
                <td className="py-1.5 text-center text-gray-400 dark:text-gray-500">{s.matches}</td>
                <td className="py-1.5 text-center text-gray-400 dark:text-gray-500">
                  {s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}
                </td>
                <td className="py-1.5 text-right font-extrabold text-brand-500 dark:text-brand-400">{s.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StandingsSnapshotWidget;
