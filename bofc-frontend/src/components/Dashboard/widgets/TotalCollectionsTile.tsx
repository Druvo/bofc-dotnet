import React from "react";
import { DollarOutlined } from "@ant-design/icons";
import { useGetAccountSummaryQuery } from "../../../state/features/account/accountSummarySlice";
import FinanceStatTile from "./FinanceStatTile";

// The "% vs last month" collections trend already lives on AccountBalanceCard
// (same row) - this tile stays a plain total so the number isn't shown twice.
const TotalCollectionsTile: React.FC = () => {
  const { data: summary } = useGetAccountSummaryQuery();

  return (
    <FinanceStatTile
      title="Total Collections"
      icon={<DollarOutlined />}
      variant="success"
      value={summary?.content?.totalCollection || 0}
    />
  );
};

export default TotalCollectionsTile;
