import React, { useMemo } from "react";
import { HistoryOutlined, DollarOutlined } from "@ant-design/icons";
import { useGetAcCollectionsQuery } from "../../../state/features/account/accountSlice";
import { showBdLocalTime } from "../../../utils/utils";
import { Spinner } from "../../ui/loader";
import { formatCurrency } from "../../../utils/formatCurrency";

const fmt = (n: number) => formatCurrency(n, { decimals: 0 });

// Scoped to payment collections — the only cross-player event stream with a
// reliable timestamp available today. A true cross-domain activity log (bids,
// approvals, fixture changes) needs a backend audit table that doesn't exist
// yet; this is the honest version of that feature with what's real now.
const RecentActivityWidget: React.FC = () => {
  const { data, isLoading } = useGetAcCollectionsQuery();
  const recent = useMemo(
    () =>
      [...(data?.content || [])]
        .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
        .slice(0, 6),
    [data]
  );

  return (
    <div className="h-full rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
      <div className="mb-3 flex items-center gap-1.5 text-theme-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        <HistoryOutlined /> Recent Payments
      </div>

      {isLoading ? (
        <Spinner className="my-3 text-gray-400" />
      ) : recent.length === 0 ? (
        <p className="my-3 text-theme-xs text-gray-400 dark:text-gray-500">No activity yet</p>
      ) : (
        <div className="flex max-h-[240px] flex-col gap-1.5 overflow-y-auto">
          {recent.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-2.5 rounded-lg border border-gray-100 bg-gray-50 px-2 py-1.5 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)]"
            >
              <span className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-lg bg-success-500/15 text-theme-xs text-success-600 dark:text-success-500">
                <DollarOutlined />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-theme-xs text-gray-700 dark:text-gray-300">
                  {c.allPayersName || c.playerName}
                </div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500">{showBdLocalTime(c.createdDate as unknown as string)}</div>
              </div>
              <span className="text-theme-xs font-bold text-success-600 dark:text-success-500">
                {fmt(c.totalAmount ?? c.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentActivityWidget;
