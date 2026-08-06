import React, { useState } from "react";
import ViewerFixturesTab from "./ViewerFixturesTab";
import ViewerResultsTab from "./ViewerResultsTab";
import TabsNav from "../ui/tabs";

interface ViewerFixturesResultsTabProps {
  matchDayId: number;
}

export default function ViewerFixturesResultsTab({ matchDayId }: ViewerFixturesResultsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState("fixtures");

  return (
    <div>
      <TabsNav
        active={activeSubTab}
        onChange={setActiveSubTab}
        items={[
          { key: "fixtures", label: "Fixtures" },
          { key: "results", label: "Results" },
        ]}
        className="mb-4"
      />
      {activeSubTab === "fixtures" ? (
        <ViewerFixturesTab matchDayId={matchDayId} />
      ) : (
        <ViewerResultsTab matchDayId={matchDayId} />
      )}
    </div>
  );
}
