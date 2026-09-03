import { MinusCircleOutlined } from "@ant-design/icons";
import React from "react";
import { useGetAccountSummaryQuery } from "../../state/features/account/accountSummarySlice";

// Import components
import LatestMatchDayCard from "./LatestMatchDayCard";
import UpcomingDuesWidget from "./widgets/UpcomingDuesWidget";
import MatchCalendarWidget from "./widgets/MatchCalendarWidget";
import MyContributionsCard from "./widgets/MyContributionsCard";
import YourNextMatchCard from "./widgets/YourNextMatchCard";
import GoalkeeperHistoryCard from "./widgets/GoalkeeperHistoryCard";
import MatchDayHistoryCard from "./widgets/MatchDayHistoryCard";
import PlayerSpotlightWidget from "./widgets/PlayerSpotlightWidget";
import AccountBalanceCard from "./widgets/AccountBalanceCard";
import FinanceStatTile from "./widgets/FinanceStatTile";
import TotalCollectionsTile from "./widgets/TotalCollectionsTile";
import ThisMonthCollectionsTile from "./widgets/ThisMonthCollectionsTile";
import PendingDuesCountTile from "./widgets/PendingDuesCountTile";

const Dashboard: React.FC = () => {
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

      {/* Latest MatchDay Section */}
      <div className="mb-10">
        <LatestMatchDayCard />
      </div>

      {/* Player leaderboard/spotlight - reuses the Player Statistics page's
          Top-3/Spotlight/Quick-Insights block, links out to the full page. */}
      <PlayerSpotlightWidget />

      {/* Your next match + match day history + goalkeeper history */}
      <div className="mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
          <YourNextMatchCard />
          <MatchDayHistoryCard />
          <GoalkeeperHistoryCard />
        </div>
      </div>

      {/* Payments due + your own contributions + Match calendar */}
      <div className="mb-10">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          <UpcomingDuesWidget />
          <MyContributionsCard />
          <MatchCalendarWidget />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
