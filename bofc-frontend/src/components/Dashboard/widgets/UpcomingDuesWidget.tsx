import React, { useMemo } from "react";
import { UserOutlined, WarningOutlined } from "@ant-design/icons";
import { useGetPlayerCollectionMetricsQuery } from "../../../state/features/account/playerCollectionMetricsSlice";
import { PlayerMetric } from "../../../interfaces/IPlayerCollectionMetrics";
import { Spinner } from "../../ui/loader";

// Reuses the same "current month, no contribution yet, active player" rule
// PlayerCollectionMetricsTable uses to flag a cell "Due" — surfaced here as a
// standalone list so it doesn't require opening the full table to see who's
// behind this month.
const UpcomingDuesWidget: React.FC = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const { data, isLoading } = useGetPlayerCollectionMetricsQuery({ year: currentYear });
  const metrics = data?.content?.metrics || [];

  const duePlayers = useMemo(
    () =>
      metrics.filter((p: PlayerMetric) => {
        if (!p.active) return false;
        const amount = p.yearMonthAmount?.[currentYear.toString()]?.[currentMonth] || 0;
        return amount <= 0;
      }),
    [metrics, currentYear, currentMonth]
  );

  return (
    <div className="h-full rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-theme-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Payments Due This Month
        </div>
        {duePlayers.length > 0 && (
          <span className="text-theme-xs font-extrabold text-error-500">{duePlayers.length}</span>
        )}
      </div>

      {isLoading ? (
        <Spinner className="my-3 text-gray-400" />
      ) : duePlayers.length === 0 ? (
        <p className="my-3 text-theme-xs text-gray-400 dark:text-gray-500">Everyone's paid up</p>
      ) : (
        <div className="flex max-h-[220px] flex-col gap-1.5 overflow-y-auto">
          {duePlayers.map((p) => (
            <div
              key={p.playerId}
              className="flex items-center gap-2.5 rounded-lg border border-gray-100 bg-gray-50 px-2 py-1.5 dark:border-gray-800 dark:bg-white/[0.02]"
            >
              <span className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-500">
                <UserOutlined />
              </span>
              <span className="min-w-0 flex-1 truncate text-theme-xs text-gray-700 dark:text-gray-300">{p.playerName}</span>
              <WarningOutlined className="text-theme-xs text-error-500" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpcomingDuesWidget;
