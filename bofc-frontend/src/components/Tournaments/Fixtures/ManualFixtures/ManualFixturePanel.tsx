import React, { useEffect } from "react";
import {
  NodeIndexOutlined,
  UnorderedListOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../../../state/store";
import { useGetTournamentStructureQuery } from "../../../../state/features/manualFixtures/manualFixturesSlice";
import { setActiveTab } from "../../../../state/features/manualFixtures/manualFixturesUISlice";
import OverviewTab from "./Tabs/OverviewTab";
import InteractiveTournamentTab from "./Tabs/InteractiveTournamentTab";
import MatchesTab from "./Tabs/MatchesTab";
import Tabs from "../../../ui/tabs";
import Loader from "../../../ui/loader";

interface ManualFixturePanelProps {
  tournamentId: number;
  teams: Array<{ teamId: number; teamName: string }>;
}

export default function ManualFixturePanel({
  tournamentId,
  teams,
}: ManualFixturePanelProps) {
  const dispatch = useDispatch();

  const activeTab = useSelector((state: RootState) => state.manualFixturesUI.activeTab);

  const {
    data: structureData,
    isLoading,
    refetch,
  } = useGetTournamentStructureQuery({ tournamentId });

  const tournamentStructure = structureData?.content;

  // Automatically refetch tournament structure when tab changes
  useEffect(() => {
    if (activeTab) {
      refetch();
    }
  }, [activeTab, refetch]);

  // if (!isAdmin) {
  //   return (
  //     <Card>
  //       <Alert
  //         message="Access Restricted"
  //         description="Manual fixture management is only available to administrators."
  //         type="warning"
  //         showIcon
  //       />
  //     </Card>
  //   );
  // }

  // Check if teams are added - disable fixtures tab if no teams
  const hasTeams = teams && teams.length > 0;

  const tabItems = [
    {
      key: "overview",
      label: (
        <span className="inline-flex items-center gap-1.5">
          <BarChartOutlined />
          Overview
        </span>
      ),
    },
    {
      key: "tournament",
      label: (
        <span className="inline-flex items-center gap-1.5">
          <NodeIndexOutlined />
          MatchDay
        </span>
      ),
    },
    {
      key: "matches",
      label: (
        <span className={`inline-flex items-center gap-1.5 ${!hasTeams ? "opacity-40" : ""}`}>
          <UnorderedListOutlined />
          Matches
        </span>
      ),
    },
  ];

  // Prevent switching to disabled matches tab
  const handleTabChange = (key: string) => {
    if (key === "matches" && !hasTeams) {
      return; // Don't allow switching to matches tab if no teams
    }
    dispatch(setActiveTab(key));
  };

  return (
    <div style={{ minHeight: "calc(100vh - 250px)" }}>
      {isLoading && <Loader className="py-6" />}
      <Tabs active={activeTab} onChange={handleTabChange} items={tabItems} />
      {/* All three tabs stay mounted (each skips its own query fetch while
          inactive via isActive) so live state — e.g. websocket connections in
          the Tournament tab — survives switching tabs, matching antd Tabs'
          default cached-pane behavior this replaced. */}
      <div style={{ display: activeTab === "overview" ? "block" : "none" }}>
        <OverviewTab
          tournamentId={tournamentId}
          tournamentStructure={tournamentStructure}
          isLoading={isLoading}
          onRefresh={refetch}
          isActive={activeTab === "overview"}
        />
      </div>
      <div style={{ display: activeTab === "tournament" ? "block" : "none" }}>
        <InteractiveTournamentTab
          tournamentId={tournamentId}
          teams={teams}
          tournamentStructure={tournamentStructure}
          isLoading={isLoading}
          onRefresh={refetch}
          isActive={activeTab === "tournament"}
        />
      </div>
      <div style={{ display: activeTab === "matches" ? "block" : "none" }}>
        <MatchesTab
          tournamentId={tournamentId}
          tournamentStructure={tournamentStructure}
          isLoading={isLoading}
          onRefresh={refetch}
          isActive={activeTab === "matches"}
        />
      </div>
    </div>
  );
}
