import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGetPlayerStatisticsQuery } from "../../../state/features/statistics/statisticsSlice";
import { useGetPlayersQuery } from "../../../state/features/player/playerSlice";
import { API_URL } from "../../../settings";
import PlayerStatsSidebar from "../../Player/PlayerStatsSidebar";

// Reuses the same Top-3/Spotlight/Quick-Insights block from the Player
// Statistics page (PlayerStatsSidebar) instead of rebuilding it - here it
// links out to the full page rather than scrolling a local table.
const PlayerSpotlightWidget: React.FC = () => {
  const navigate = useNavigate();
  const { data } = useGetPlayerStatisticsQuery({ limit: 100 });
  const { data: playersData } = useGetPlayersQuery();

  const photoById = useMemo(() => {
    const map: Record<number, string> = {};
    playersData?.content?.forEach((p) => {
      if (p.photoUrl) {
        map[p.id] = p.photoUrl.startsWith("http") ? p.photoUrl : `${API_URL}${p.photoUrl}`;
      }
    });
    return map;
  }, [playersData]);

  const rows = data?.content || [];
  if (rows.length === 0) return null;

  return (
    <div className="mb-10">
      <PlayerStatsSidebar
        layout="top"
        rows={rows}
        photoById={photoById}
        onViewFullRanking={() => navigate("/player-statistics")}
      />
    </div>
  );
};

export default PlayerSpotlightWidget;
