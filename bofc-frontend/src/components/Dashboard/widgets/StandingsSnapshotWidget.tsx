import React from "react";
import { useNavigate } from "react-router-dom";
import { TableOutlined } from "@ant-design/icons";
import { useGetLatestMatchDayWithUserStatusQuery, useGetMatchDaySummaryQuery } from "../../../state/features/matchDays/matchDaysSlice";
import { useGetMatchDayStandingsQuery } from "../../../state/features/statistics/statisticsSlice";
import { TeamIdentityCell } from "../../CommonAtoms/StandingsRow";
import { Spinner } from "../../ui/loader";

const StandingsSnapshotWidget: React.FC = () => {
  const navigate = useNavigate();
  const { data: latest } = useGetLatestMatchDayWithUserStatusQuery();
  const matchDayId = latest?.content?.matchDay?.id;

  const { data, isLoading } = useGetMatchDayStandingsQuery(
    { matchDayId: matchDayId as number },
    { skip: !matchDayId }
  );
  const { data: matchDaySummary } = useGetMatchDaySummaryQuery(
    { matchDayId: matchDayId as number },
    { skip: !matchDayId }
  );
  const standings = [...(data?.content || [])]
    .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference)
    .slice(0, 5);

  return (
    <div
      onClick={() => matchDayId && navigate(`/match-day-viewer/${matchDayId}/table`)}
      className={`h-full rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] ${matchDayId ? "cursor-pointer" : ""}`}
    >
      <div className="mb-3 flex items-center gap-1.5 text-theme-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        <TableOutlined /> Standings
      </div>

      {!matchDayId ? (
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
              <tr key={s.teamId} className="border-t border-gray-100 dark:border-[var(--color-rule)]">
                <td className="max-w-[140px] py-1.5 pr-2 text-gray-700 dark:text-gray-300">
                  <TeamIdentityCell
                    rank={i + 1}
                    teamId={s.teamId}
                    teamName={s.teamName}
                    matchDaySummary={matchDaySummary}
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
