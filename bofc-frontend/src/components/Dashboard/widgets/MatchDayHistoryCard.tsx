import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { HistoryOutlined } from "@ant-design/icons";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import { useGetPlayerMatchHistoryQuery } from "../../../state/features/statistics/statisticsSlice";
import { showBdLocalTime } from "../../../utils/utils";
import Loader from "../../ui/loader";

const VISIBLE_COUNT = 4;

const resultBadgeClasses: Record<string, string> = {
  WIN: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
  DRAW: "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400",
  LOSS: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
};

// Same data/shape as UserProfile.tsx's Match History tab, condensed to the
// most recent few for the Dashboard - "View all" links to the full timeline
// on the profile page.
const MatchDayHistoryCard: React.FC = () => {
  const loginInfo = useSelector(selectLoginInfo);
  const playerId = Number(loginInfo.userId);
  const { data, isLoading } = useGetPlayerMatchHistoryQuery({ playerId }, { skip: !playerId });
  const history = data?.content || [];

  return (
    <div className="h-full rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-theme-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          <HistoryOutlined />
          Match Day History
        </div>
        {history.length > 0 && (
          <span className="text-theme-xs font-semibold text-gray-800 dark:text-white/90">{history.length}</span>
        )}
      </div>

      {isLoading ? (
        <Loader className="py-4" />
      ) : history.length === 0 ? (
        <p className="my-3 text-theme-xs text-gray-400 dark:text-gray-500">No match history yet.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {history.slice(0, VISIBLE_COUNT).map((record) => (
            <div key={record.matchId} className="flex items-center gap-2.5 rounded-lg border border-gray-100 px-3 py-2 dark:border-[var(--color-rule)]">
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${resultBadgeClasses[record.result] || resultBadgeClasses.DRAW}`}>
                {record.result}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-theme-sm font-semibold text-gray-700 dark:text-gray-300">
                  {record.matchDayName || `vs ${record.opponentTeamName}`}
                </div>
                <div className="truncate text-theme-xs text-gray-400 dark:text-gray-500">
                  {record.teamScore}-{record.opponentScore} vs {record.opponentTeamName} &middot; {showBdLocalTime(record.matchDate)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <Link to="/profile" className="mt-3 block text-theme-xs font-medium text-brand-500 hover:underline">
          View all &rarr;
        </Link>
      )}
    </div>
  );
};

export default MatchDayHistoryCard;
