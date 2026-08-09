import { MinusCircleOutlined } from "@ant-design/icons";
import React, { useState } from "react";
import { useGetAccountSummaryQuery } from "../../state/features/account/accountSummarySlice";

// Import components
import PlayerCollectionMetrics from "./PlayerCollectionMetricsTable";
import LatestMatchDayCard from "./LatestMatchDayCard";
import LiveAuctionStatusCard from "./widgets/LiveAuctionStatusCard";
import UpcomingDuesWidget from "./widgets/UpcomingDuesWidget";
import MatchCalendarWidget from "./widgets/MatchCalendarWidget";
import MyContributionsCard from "./widgets/MyContributionsCard";
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

  const { data: accountSummaryData } = useGetAccountSummaryQuery();

  return (
    <div>
      {/* Finance Overview — balance card leads, KPI tiles alongside */}
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

      {/* Live Auction (only shows when an auction is running) — the widget
          owns its own bottom margin so no empty gap is reserved when it
          renders null. */}
      <LiveAuctionStatusCard />

      {/* Latest MatchDay Section */}
      <div className="mb-10">
        <LatestMatchDayCard />
      </div>

      {/* Payments due + your own contributions + Match calendar */}
      <div className="mb-10">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          <UpcomingDuesWidget />
          <MyContributionsCard />
          <MatchCalendarWidget />
        </div>
      </div>

      {/* Player Contributions Section */}
      <div className="mb-3">
        <PlayerCollectionMetrics
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
};

export default Dashboard;
