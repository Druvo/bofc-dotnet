import React, { useMemo } from "react";
import { CalendarOutlined } from "@ant-design/icons";
import { useGetPlayerCollectionMetricsQuery } from "../../../state/features/account/playerCollectionMetricsSlice";
import FinanceStatTile from "./FinanceStatTile";

// Sourced from the same monthOfPayment-keyed aggregation as the trend/sparkline
// on AccountBalanceCard (not the raw AcCollection.date field) so "this month"
// means the same thing everywhere on the dashboard - a collection recorded
// late but credited to an earlier month counts toward that earlier month here too.
const ThisMonthCollectionsTile: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { data: metricsData } = useGetPlayerCollectionMetricsQuery({ year: currentYear });

  const total = useMemo(() => {
    const metrics = metricsData?.content?.metrics || [];
    const currentMonth = new Date().getMonth() + 1;
    return metrics.reduce((sum, p) => sum + (p.yearMonthAmount?.[currentYear.toString()]?.[currentMonth] || 0), 0);
  }, [metricsData, currentYear]);

  return (
    <FinanceStatTile
      title="This Month's Collections"
      icon={<CalendarOutlined />}
      variant="success"
      value={total}
      subtitle={new Date().toLocaleString("default", { month: "long", year: "numeric" })}
    />
  );
};

export default ThisMonthCollectionsTile;
