import React, { useMemo } from "react";
import { CalendarOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import { useGetPlayerCollectionMetricsQuery } from "../../../state/features/account/playerCollectionMetricsSlice";
import { PlayerMetric } from "../../../interfaces/IPlayerCollectionMetrics";
import Loader from "../../ui/loader";

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const monthCellClasses = {
  due: "border-error-500/40 bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-500",
  current: "border-brand-500/40 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400",
  paid: "border-success-500/40 bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500",
  empty: "border-gray-100 bg-gray-50 text-gray-400 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)] dark:text-gray-600",
};

// The dashboard's "your own" slice of the full Monthly Contributions table -
// one card, this year, no year picker. The full multi-player table/card view
// still lives at the bottom of the dashboard for admins who need everyone's.
const MyContributionsCard: React.FC = () => {
  const loginInfo = useSelector(selectLoginInfo);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const { data, isLoading } = useGetPlayerCollectionMetricsQuery({ year: currentYear });

  const myMetric = useMemo(() => {
    const metrics = data?.content?.metrics || [];
    return metrics.find((p: PlayerMetric) => String(p.playerId) === String(loginInfo.userId));
  }, [data, loginInfo.userId]);

  if (isLoading) {
    return (
      <div className="h-full rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
        <Loader className="py-4" />
      </div>
    );
  }

  return (
    <div className="h-full rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-theme-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          <CalendarOutlined />
          My Monthly Contributions
        </div>
        <span className="text-theme-xs text-gray-400 dark:text-gray-500">{currentYear}</span>
      </div>

      {!myMetric ? (
        <p className="my-3 text-theme-xs text-gray-400 dark:text-gray-500">No contribution record found for you yet.</p>
      ) : (
        <div className="grid grid-cols-4 gap-1.5">
          {monthNames.map((month, idx) => {
            const monthNumber = idx + 1;
            const amount = myMetric.yearMonthAmount[currentYear.toString()]?.[monthNumber] || 0;
            const isCurrentCell = monthNumber === currentMonth;
            const showDue = isCurrentCell && amount <= 0 && myMetric.active;

            let variant: keyof typeof monthCellClasses = "empty";
            if (showDue) variant = "due";
            else if (isCurrentCell && amount > 0) variant = "current";
            else if (amount > 0) variant = "paid";

            return (
              <div key={monthNumber} className={`rounded-lg border px-1.5 py-1.5 text-center ${monthCellClasses[variant]}`}>
                <div className="text-[10px] font-medium uppercase">{month}</div>
                <div className="text-theme-xs font-semibold">
                  {showDue ? "Due" : amount > 0 ? amount.toFixed(0) : "-"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyContributionsCard;
