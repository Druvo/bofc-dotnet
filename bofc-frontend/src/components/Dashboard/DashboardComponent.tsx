import { MinusCircleOutlined } from "@ant-design/icons";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { useGetAccountSummaryQuery } from "../../state/features/account/accountSummarySlice";

// Import components
import PlayerCollectionMetrics from "./PlayerCollectionMetricsTable";
import LatestMatchDayCard from "./LatestMatchDayCard";
import LiveAuctionStatusCard from "./widgets/LiveAuctionStatusCard";
import UpcomingDuesWidget from "./widgets/UpcomingDuesWidget";
import MatchCalendarWidget from "./widgets/MatchCalendarWidget";
import MyContributionsCard from "./widgets/MyContributionsCard";
import YourNextMatchCard from "./widgets/YourNextMatchCard";
import GoalkeeperHistoryCard from "./widgets/GoalkeeperHistoryCard";
import PlayerSpotlightWidget from "./widgets/PlayerSpotlightWidget";
import AccountBalanceCard from "./widgets/AccountBalanceCard";
import FinanceStatTile from "./widgets/FinanceStatTile";
import TotalCollectionsTile from "./widgets/TotalCollectionsTile";
import ThisMonthCollectionsTile from "./widgets/ThisMonthCollectionsTile";
import PendingDuesCountTile from "./widgets/PendingDuesCountTile";

interface DashboardProps {
  isDarkMode?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ isDarkMode = false }) => {
  const [selectedYear, setSelectedYear] = useState<number>();
  const loginInfo = useSelector(selectLoginInfo);
  const isAdmin = loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN");

  const { data: accountSummaryData } = useGetAccountSummaryQuery();

  return (
    <div>
      {/* Finance Overview - balance card leads, KPI tiles alongside */}
      <div className="mb-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-6">
          <div className="min-w-0 md:col-span-6">
            <AccountBalanceCard />
          </div>
          <div className="min-w-0 md:col-span-6">
            <div className="grid h-full grid-cols-1 gap-4 sm:grid-cols-2">
              <TotalCollectionsTile />
              <FinanceStatTile
                title="Total Expenses"
                icon={<MinusCircleOutlined />}
                variant="error"
                value={accountSummaryData?.content?.totalExpense || 0}
              />
              <ThisMonthCollectionsTile />
              <PendingDuesCountTile />
            </div>
          </div>
        </div>
      </div>

      {/* Live Auction (only shows when an auction is running) - the widget
          owns its own bottom margin so no empty gap is reserved when it
          renders null. */}
      <LiveAuctionStatusCard />

      {/* Latest MatchDay Section */}
      <div className="mb-10">
        <LatestMatchDayCard />
      </div>

      {/* Payments due + your next match + goalkeeper history + your own contributions + Match calendar */}
      <div className="mb-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:gap-6">
          <YourNextMatchCard />
          <GoalkeeperHistoryCard />
          <UpcomingDuesWidget />
          <MyContributionsCard />
          <MatchCalendarWidget />
        </div>
      </div>

      {/* Player leaderboard/spotlight - reuses the Player Statistics page's
          Top-3/Spotlight/Quick-Insights block, links out to the full page. */}
      <PlayerSpotlightWidget />

      {/* Every player's collection status, side by side - admin/finance view
          only. Regular players already get their own status via
          MyContributionsCard above; the full roster table is noise for them
          and exposes every other player's payment standing. */}
      {isAdmin && (
        <div className="mb-3">
          <PlayerCollectionMetrics
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            isDarkMode={isDarkMode}
          />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
