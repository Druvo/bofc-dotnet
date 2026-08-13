import React from "react";
import { Link } from "react-router-dom";
import { TrophyOutlined } from "@ant-design/icons";
import { useGetMyGoalkeepingHistoryQuery } from "../../../state/features/player/playerSlice";
import { showBdLocalTime } from "../../../utils/utils";
import Loader from "../../ui/loader";

const VISIBLE_COUNT = 4;

// Same data/shape as UserProfile.tsx's Goalkeeping History tab (self-scoped
// endpoint, no playerId needed), condensed to the most recent few for the
// Dashboard - "View all" links to the full timeline on the profile page.
const GoalkeeperHistoryCard: React.FC = () => {
  const { data, isLoading } = useGetMyGoalkeepingHistoryQuery();
  const history = data?.content || [];

  return (
    <div className="h-full rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-theme-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          <TrophyOutlined />
          My Goalkeeper History
        </div>
        {history.length > 0 && (
          <span className="text-theme-xs font-semibold text-gray-800 dark:text-white/90">{history.length}</span>
        )}
      </div>

      {isLoading ? (
        <Loader className="py-4" />
      ) : history.length === 0 ? (
        <p className="my-3 text-theme-xs text-gray-400 dark:text-gray-500">No goalkeeping history yet.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {history.slice(0, VISIBLE_COUNT).map((record, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2 dark:border-[var(--color-rule)]">
              <div className="flex items-center gap-2 text-theme-sm font-semibold text-gray-700 dark:text-gray-300">
                <TrophyOutlined className="text-warning-500" />
                Round {record.roundNumber}
              </div>
              <span className="text-theme-xs text-gray-400 dark:text-gray-500">{showBdLocalTime(record.playedDate)}</span>
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

export default GoalkeeperHistoryCard;
