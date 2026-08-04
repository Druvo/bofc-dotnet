import React from "react";
import { useNavigate } from "react-router-dom";
import { FireOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { useGetLatestTournamentWithUserStatusQuery } from "../../../state/features/tournaments/tournamentsSlice";
import { useGetAuctionSessionQuery } from "../../../state/features/auction/auctionSlice";

// Only renders anything when the latest tournament's auction is actually
// RUNNING or PAUSED — stays invisible otherwise rather than showing an empty
// "no auction" card, since that's the common case and not worth a whole tile.
const LiveAuctionStatusCard: React.FC = () => {
  const navigate = useNavigate();
  const { data: latest } = useGetLatestTournamentWithUserStatusQuery();
  const tournamentId = latest?.content?.tournament?.id;

  const { data: session } = useGetAuctionSessionQuery(tournamentId as number, {
    skip: !tournamentId,
    pollingInterval: 30000,
  });

  const isLive = session?.status === "RUNNING" || session?.status === "PAUSED";
  if (!tournamentId || !isLive) return null;

  const paused = session?.status === "PAUSED";

  return (
    <div
      onClick={() => navigate(`/auction/live/${tournamentId}`)}
      className={`relative mb-6 cursor-pointer overflow-hidden rounded-2xl border bg-white p-4 dark:bg-white/[0.03] ${
        paused ? "border-gray-200 dark:border-gray-800" : "border-error-500/40"
      }`}
    >
      {!paused && (
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-error-500 to-transparent" />
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className={`flex h-8.5 w-8.5 items-center justify-center rounded-lg text-base ${
              paused ? "bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-500" : "bg-error-50 text-error-500 dark:bg-error-500/15"
            }`}
          >
            <FireOutlined />
          </span>
          <div>
            <div className={`text-[10px] font-semibold uppercase tracking-wide ${paused ? "text-gray-400 dark:text-gray-500" : "text-error-500"}`}>
              {paused ? "Auction Paused" : "Live Auction"}
            </div>
            <div className="text-theme-sm font-bold text-gray-800 dark:text-white/90">
              {latest?.content?.tournament?.name}
            </div>
          </div>
        </div>
        <ThunderboltOutlined className="text-base text-brand-500 dark:text-brand-400" />
      </div>
    </div>
  );
};

export default LiveAuctionStatusCard;
