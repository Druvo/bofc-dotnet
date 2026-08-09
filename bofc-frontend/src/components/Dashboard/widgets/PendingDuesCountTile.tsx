import React, { useMemo } from "react";
import { WarningOutlined } from "@ant-design/icons";
import { useGetPlayerCollectionMetricsQuery } from "../../../state/features/account/playerCollectionMetricsSlice";
import { PlayerMetric } from "../../../interfaces/IPlayerCollectionMetrics";
import FinanceStatTile from "./FinanceStatTile";

// Same "current month, no contribution yet, active player" rule as
// UpcomingDuesWidget — there's no stored fee amount to total up (see
// UpcomingDuesWidget's own comment), so this stays a headcount, not a ৳ figure.
const PendingDuesCountTile: React.FC = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const { data } = useGetPlayerCollectionMetricsQuery({ year: currentYear });

  const dueCount = useMemo(
    () =>
      (data?.content?.metrics || []).filter((p: PlayerMetric) => {
        if (!p.active) return false;
        const amount = p.yearMonthAmount?.[currentYear.toString()]?.[currentMonth] || 0;
        return amount <= 0;
      }).length,
    [data, currentYear, currentMonth]
  );

  return (
    <FinanceStatTile
      title="Payment Due"
      icon={<WarningOutlined />}
      variant="warning"
      display={<span>{dueCount}</span>}
      subtitle="players this month"
      actionable
    />
  );
};

export default PendingDuesCountTile;
