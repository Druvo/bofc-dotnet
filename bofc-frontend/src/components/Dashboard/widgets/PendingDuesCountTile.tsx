import React, { useMemo } from "react";
import { WarningOutlined } from "@ant-design/icons";
import { useGetPlayerCollectionMetricsQuery } from "../../../state/features/account/playerCollectionMetricsSlice";
import { useGetPlayersQuery } from "../../../state/features/player/playerSlice";
import { PlayerMetric } from "../../../interfaces/IPlayerCollectionMetrics";
import { toAbsolutePlayerPhotoUrl } from "../../../utils/playerPhotoUtils";
import Avatar from "../../CommonAtoms/Avatar";
import FinanceStatTile from "./FinanceStatTile";

const MAX_AVATARS = 8;

// Same "current month, no contribution yet, active player" rule as
// UpcomingDuesWidget - there's no stored fee amount to total up (see
// UpcomingDuesWidget's own comment), so this stays a headcount, not a ৳ figure.
const PendingDuesCountTile: React.FC = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const { data } = useGetPlayerCollectionMetricsQuery({ year: currentYear });
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
      (data?.content?.metrics || []).filter((p: PlayerMetric) => {
        if (!p.active) return false;
        const amount = p.yearMonthAmount?.[currentYear.toString()]?.[currentMonth] || 0;
        return amount <= 0;
      }),
    [data, currentYear, currentMonth]
  );

  const visiblePlayers = duePlayers.slice(0, MAX_AVATARS);
  const hiddenCount = duePlayers.length - visiblePlayers.length;

  return (
    <FinanceStatTile
      title="Payment Due"
      icon={<WarningOutlined />}
      variant="warning"
      display={<span>{duePlayers.length}</span>}
      subtitle="players this month"
      actionable
      footer={
        duePlayers.length > 0 ? (
          <div className="flex items-center">
            {visiblePlayers.map((p, idx) => (
              <div key={p.playerId} className={idx > 0 ? "-ml-2" : ""} title={p.playerName}>
                <Avatar src={photoById[p.playerId]} name={p.playerName} seed={p.playerId} size={24} className="border-2 border-white dark:border-[var(--color-paper-3)]" />
              </div>
            ))}
            {hiddenCount > 0 && (
              <div className="-ml-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-[9px] font-semibold text-gray-500 dark:border-[var(--color-paper-3)] dark:bg-white/10 dark:text-gray-400">
                +{hiddenCount}
              </div>
            )}
          </div>
        ) : undefined
      }
    />
  );
};

export default PendingDuesCountTile;
