import React, { useMemo } from "react";
import { WarningOutlined } from "@ant-design/icons";
import { useGetPlayerCollectionMetricsQuery } from "../../../state/features/account/playerCollectionMetricsSlice";
import { useGetPlayersQuery } from "../../../state/features/player/playerSlice";
import { PlayerMetric } from "../../../interfaces/IPlayerCollectionMetrics";
import { isDueForMonth } from "../../../utils/paymentDues";
import { toAbsolutePlayerPhotoUrl } from "../../../utils/playerPhotoUtils";
import Avatar from "../../CommonAtoms/Avatar";
import { Spinner } from "../../ui/loader";

// Reuses the same rule PlayerCollectionMetricsTable uses to flag a cell "Due"
// (see utils/paymentDues) - surfaced here as a standalone list so it doesn't
// require opening the full table to see who's behind this month.
const UpcomingDuesWidget: React.FC = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const { data, isLoading } = useGetPlayerCollectionMetricsQuery({ year: currentYear });
  const metrics = data?.content?.metrics || [];

  const { data: playersData } = useGetPlayersQuery();
  const photoById = useMemo(() => {
    const map: Record<number, string | undefined> = {};
    playersData?.content?.forEach((p) => {
      map[p.id] = toAbsolutePlayerPhotoUrl(p.photoUrl) || undefined;
    });
    return map;
  }, [playersData]);

  const duePlayers = useMemo(
    () =>
      metrics.filter((p: PlayerMetric) => isDueForMonth(p, currentYear, currentMonth)),
    [metrics, currentYear, currentMonth]
  );

  return (
    <div className="h-full rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
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
              className="flex items-center gap-2.5 rounded-lg border border-gray-100 bg-gray-50 px-2 py-1.5 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)]"
            >
              <Avatar src={photoById[p.playerId]} name={p.playerName} seed={p.playerId} size={26} />
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
